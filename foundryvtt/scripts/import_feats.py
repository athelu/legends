#!/usr/bin/env python3
"""
Simple importer to parse ttrpg/feats.md and emit JSON Item files
into `packs/feats/_source/` using the `feat` item schema used by this
repository's Foundry module.

Usage:
    python foundryvtt/scripts/import_feats.py \
        --input ttrpg/feats.md \
        --output packs/feats/_source

This parser is intentionally conservative: it treats heading lines as
feat names and parses bullet lines of the form `- **Field:** value`.
It emits one JSON file per feat with the keys `name`, `type`, `img`, and
`system` containing `tier`, `prerequisites`, `benefit.text`, `usage`,
and `keywords` when present.

The output is a best-effort structure that you can refine later.
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "feat"

HEADING_RE = re.compile(r"^\s{0,3}#{2,6}\s+(.*\S)")
FIELD_BULLET_RE = re.compile(r"^(\s*)-\s*\*\*([^*]+)\*\*\s*:??\s*(.*)$")
KEYWORD_BRACKET_RE = re.compile(r"\[([^\]]+)\]")


def parse_markdown_blocks(lines):
    """Yield (heading, block_lines) pairs for headings found in lines."""
    current_name = None
    current_block = []
    for ln in lines:
        m = HEADING_RE.match(ln)
        if m:
            # Yield previous
            if current_name is not None:
                yield current_name, current_block
            current_name = m.group(1).strip()
            current_block = []
        else:
            if current_name is not None:
                current_block.append(ln.rstrip("\n"))
    if current_name is not None:
        yield current_name, current_block


def extract_fields(block_lines):
    """Extract field bullets from a block of lines into a dict."""
    fields = {}
    i = 0
    n = len(block_lines)
    last_key = None
    while i < n:
        ln = block_lines[i]
        m = FIELD_BULLET_RE.match(ln)
        if m:
            indent = len(m.group(1) or "")
            key = m.group(2).strip()
            val = m.group(3).strip()
            # If this bullet is indented (nested) and we have a previous field,
            # treat it as continuation of the previous field's body.
            if indent >= 2 and last_key:
                # append the raw bullet line to the previous field's value
                prev = fields.get(last_key, "")
                appended = ln.strip()
                fields[last_key] = prev + "\n" + appended if prev else appended
                i += 1
                continue

            # Otherwise this is a top-level field; gather subsequent non-field lines
            j = i + 1
            extra_lines = []
            while j < n:
                nxt = block_lines[j]
                nm = FIELD_BULLET_RE.match(nxt)
                # If next is a bullet but indented (nested), include it in extra_lines
                if nm and len(nm.group(1) or "") >= 2:
                    extra_lines.append(nxt)
                    j += 1
                    continue
                if nm or HEADING_RE.match(nxt):
                    break
                extra_lines.append(nxt)
                j += 1
            if extra_lines:
                extra_text = "\n".join(l for l in extra_lines).strip()
                if val:
                    val = val + "\n" + extra_text
                else:
                    val = extra_text
            fields[key] = val
            last_key = key
            i = j
        else:
            i += 1
    return fields


def parse_prereqs(text: str):
    if not text:
        return []
    # split on commas or ' and '
    parts = re.split(r",|\band\b", text)
    parts = [p.strip() for p in parts if p.strip()]
    return parts


def parse_keywords(text: str):
    if not text:
        return []
    kws = KEYWORD_BRACKET_RE.findall(text)
    if kws:
        return [k.strip() for k in kws]
    # fallback: split by commas
    return [k.strip() for k in re.split(r",", text) if k.strip()]


def ensure_output_dir(path: Path):
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)


def build_item_json(name: str, fields: dict, block_lines=None):
    # default values
    tier_raw = fields.get("Tier") or fields.get("Tier:") or fields.get("Tier ")
    tier = None
    if tier_raw:
        m = re.search(r"(\d+)", tier_raw)
        if m:
            tier = int(m.group(1))
    prereq_raw = fields.get("Prerequisites") or fields.get("Requirements") or fields.get("Requires")
    prereqs = parse_prereqs(prereq_raw or "")
    # If there are nested bolded bullets that were parsed as separate
    # fields (e.g., 'Stone Resilience'), merge them into `Benefit` so the
    # nested descriptions are available for effect parsing.
    known = {"Tier", "Prerequisites", "Description", "Benefit", "Benefits", "Usage", "Keyword", "Keywords", "Image"}
    if block_lines and "Benefit" in fields:
        nested_parts = []
        for k in list(fields.keys()):
            if k not in known and k.strip():
                nested_parts.append(f"- **{k}:** {fields[k].strip()}")
                del fields[k]
        if nested_parts:
            # append nested parts to the Benefit field
            fields["Benefit"] = (fields.get("Benefit", "") + "\n" + "\n".join(nested_parts)).strip()

    # If an explicit Benefit field exists use it; otherwise use any
    # free-form paragraph text present in the block (non-field lines).
    benefit = fields.get("Benefit") or fields.get("Benefits") or fields.get("Description") or ""
    if not benefit and block_lines:
        # gather non-field lines as the descriptive body
        non_field = [ln for ln in block_lines if not FIELD_BULLET_RE.match(ln) and not HEADING_RE.match(ln)]
        benefit = "\n".join(l.strip() for l in non_field).strip()
    usage = fields.get("Usage") or ""
    keyword_raw = fields.get("Keyword") or fields.get("Keywords") or fields.get("Keyword:")
    keywords = parse_keywords(keyword_raw or "")

    # default image placeholder
    img = fields.get("Image") or "icons/svg/d20.svg"

    item = {
        "name": name,
        "type": "feat",
        "img": img,
        "system": {
            "tier": tier if tier is not None else 1,
            "prerequisites": prereqs,
            "benefit": {"text": benefit.strip()},
            "usage": usage.strip(),
            "keywords": keywords,
            # reserved for later: structured effects
            "effects": [],
        },
        "flags": {},
    }
    # Attempt to parse structured effects from benefit text
    effects = parse_benefit_to_effects(benefit, block_lines=block_lines)
    if effects:
        item["system"]["effects"] = effects
    return item


def parse_benefit_to_effects(text: str, block_lines=None):
    """Simple heuristics to convert benefit prose into structured effects.

    Returns a list of effect dicts with keys: type, target, value, apply, description
    """
    # Prefer the original block lines if provided (captures nested bullets
    # that may not be present in the compact `benefit` string).
    if block_lines:
        t = "\n".join(block_lines)
    else:
        if not text:
            return []
        t = text
    effects = []

    # Parse nested bolded bullet abilities like "- **Stone Resilience:** You have natural DR 2..."
    for m in re.finditer(r"(?s)-\s*\*\*([^*]+)\*\*\s*:\s*(.*?)(?=(\n-\s*\*\*[^*]+\*\*\s*:)|$)", t):
        label = m.group(1).strip()
        body = m.group(2).strip()
        nl = label.lower()
        # Stone Resilience -> natural DR and HP formula
        if 'stone' in nl and 'resilien' in nl:
            # extract DR
            drm = re.search(r"(?i)DR\s*(?:of\s*)?(?:\+)?(\d+)", body)
            if drm:
                effects.append({"type": "dr.add", "target": "all", "value": int(drm.group(1)), "apply": "dr", "description": f"{label}: {drm.group(0)}"})
            # HP formula like "Con × 9"
            hp = re.search(r"(?i)Con[^\d]*(?:×|x)\s*(\d+)", body)
            if hp:
                effects.append({"type": "hp.formula", "target": "con", "value": f"*{hp.group(1)}", "apply": "formula", "description": f"{label}: use Con × {hp.group(1)} for HP"})
            continue
        # Tremorsense -> sense with range
        if 'tremor' in nl or 'tremorsense' in nl:
            r = re.search(r"(?i)(\d+)\s*feet", body)
            rng = int(r.group(1)) if r else None
            effects.append({"type": "sense.add", "target": "tremorsense", "value": rng or True, "apply": "sense", "description": label})
            continue
        # Storm Resistance or similar -> let existing patterns pick up immune/resist lines inside body
        if 'storm' in nl or 'resist' in nl or 'resistance' in nl:
            # feed body back into main parser to capture immunities/resistances
            effects.extend(parse_benefit_to_effects(body))
            continue
        # Shocking Weaves or conditional effects -> record as conditional text
        if 'shocking' in nl or 'weaves' in nl or 'stun' in nl or 'stunned' in body.lower():
            effects.append({"type": "conditional.apply", "target": "stunned", "value": None, "apply": "conditional", "description": f"{label}: {body}"})
            continue

    # subtract/add X from both ... dice
    for m in re.finditer(r"(?i)(subtract|add)\s+(\d+)\s+from\s+both\s+([a-z ]+?)\s+dice", t):
        op, n, target = m.groups()
        val = int(n) * (1 if op.lower() == 'add' else -1)
        effects.append({
            "type": "dice.modify",
            "target": target.strip(),
            "value": val,
            "apply": "both",
            "description": m.group(0).strip(),
        })

    # subtract/add X from both dice on a save (Reflex/Fortitude/Will)
    for m in re.finditer(r"(?i)(subtract|add)\s+(\d+)\s+from\s+both\s+(reflex|fortitude|will|\w+)\s+saves?", t):
        op, n, save = m.groups()
        val = int(n) * (1 if op.lower() == 'add' else -1)
        effects.append({
            "type": "save.modify",
            "target": save.lower().strip(),
            "value": val,
            "apply": "both",
            "description": m.group(0).strip(),
        })

    # add/subtract to both attack/defense dice
    for m in re.finditer(r"(?i)(add|subtract)\s+(\d+)\s+to\s+both\s+(attack|defense)\s+dice", t):
        op, n, what = m.groups()
        val = int(n) * (1 if op.lower() == 'add' else -1)
        effects.append({"type": "dice.modify", "target": what, "value": val, "apply": "both", "description": m.group(0).strip()})

    # Initiative: +2
    m = re.search(r"(?i)Initiative\s*:\s*([+-]?\d+)", t)
    if m:
        effects.append({
            "type": "initiative.modify",
            "target": "initiative",
            "value": int(m.group(1)),
            "apply": "flat",
            "description": m.group(0).strip(),
        })

    # cannot be surprised
    if re.search(r"(?i)cannot be surprised", t):
        effects.append({"type": "condition.immunity", "target": "surprised", "apply": "immune", "description": "cannot be surprised"})

    # Resistance (+N DR) to <type>
    for m in re.finditer(r"(?i)Resistance\s*\(\+?(\d+)\s*DR\)\s*(?:to\s+([a-zA-Z ,]+))?", t):
        val = int(m.group(1))
        dtype = (m.group(2) or "all").strip()
        effects.append({"type": "resistance", "target": dtype, "value": val, "apply": "dr", "description": m.group(0).strip()})

    # Also support shorter phrasing: "Resistance +2 to fire" or "+2 DR to fire"
    for m in re.finditer(r"(?i)\+?(\d+)\s*DR\s*(?:to\s+([a-zA-Z ,]+))", t):
        val = int(m.group(1))
        dtype = (m.group(2) or "all").strip()
        effects.append({"type": "resistance", "target": dtype, "value": val, "apply": "dr", "description": m.group(0).strip()})

    # Immune to <type> damage
    for m in re.finditer(r"(?i)Immune to ([a-zA-Z ]+?) damage", t):
        dtype = m.group(1).strip()
        effects.append({"type": "resistance", "target": dtype, "value": "immune", "apply": "immune", "description": m.group(0).strip()})

    # Added damage dice like +3d8
    for m in re.finditer(r"(?i)\+?(\d+d\d+)", t):
        dice = m.group(1)
        effects.append({"type": "damage.add", "target": "weapon", "value": dice, "apply": "dice", "description": m.group(0).strip()})

    # Reduce damage by XdY or numeric: "reduce damage by 1d8" or "reduce damage by 2"
    for m in re.finditer(r"(?i)reduce damage by\s+([0-9]+d[0-9]+|\d+)", t):
        val = m.group(1)
        effects.append({"type": "damage.reduce", "target": "incoming", "value": val, "apply": "reaction", "description": m.group(0).strip()})

    # Add attribute to damage: "add your Dexterity score to damage"
    for m in re.finditer(r"(?i)add your (\w+) score to damage", t):
        attr = m.group(1).lower()
        effects.append({"type": "damage.add.attribute", "target": attr, "value": "stat", "apply": "flat", "description": m.group(0).strip()})

    # Grants / Granted Reactions or Abilities
    for m in re.finditer(r"(?i)Granted Reactions?:\s*([A-Za-z0-9, \-]+)", t):
        names = [n.strip() for n in m.group(1).split(",") if n.strip()]
        for n in names:
            effects.append({"type": "grant.reaction", "target": n, "value": True, "apply": "grant", "description": m.group(0).strip()})
    for m in re.finditer(r"(?i)Granted Ability:\s*([A-Za-z0-9 \-]+)", t):
        effects.append({"type": "grant.ability", "target": m.group(1).strip(), "value": True, "apply": "grant", "description": m.group(0).strip()})

    # Natural DR lines like: "natural DR 2" or "Gain +2 DR" or "natural DR 2 that stacks with armor"
    for m in re.finditer(r"(?i)(?:natural\s+)?DR\s*(?:of\s*)?(?:\+)?(\d+)\s*(?:that stacks with armor)?", t):
        val = int(m.group(1))
        effects.append({"type": "dr.add", "target": "all", "value": val, "apply": "dr", "description": m.group(0).strip()})

    # Deduplicate trivial overlaps
    if not effects:
        return []
    # Remove possible duplicates by (type,target,value)
    seen = set()
    out = []
    for e in effects:
        key = (e.get('type'), str(e.get('target')), str(e.get('value')))
        if key in seen:
            continue
        seen.add(key)
        out.append(e)
    return out


def main():
    p = argparse.ArgumentParser(description="Import feats.md into individual JSON Item files")
    p.add_argument("--input", "-i", default="ttrpg/feats.md", help="Markdown file to parse")
    p.add_argument("--output", "-o", default="packs/feats/_source", help="Output directory for JSON files")
    p.add_argument("--dry-run", action="store_true", help="Don't write files, just show what would be created")
    args = p.parse_args()

    input_path = Path(args.input)
    out_dir = Path(args.output)

    if not input_path.exists():
        print(f"Input file not found: {input_path}")
        sys.exit(2)

    ensure_output_dir(out_dir)

    content = input_path.read_text(encoding="utf-8")
    lines = content.splitlines()

    created = []
    for heading, block in parse_markdown_blocks(lines):
        fields = extract_fields(block)
        item = build_item_json(heading, fields, block_lines=block)
        slug = slugify(heading)
        filename = out_dir / f"{slug}.json"
        if args.dry_run:
            print(f"Would write: {filename}")
        else:
            with filename.open("w", encoding="utf-8") as fh:
                json.dump(item, fh, indent=2, ensure_ascii=False)
            created.append(str(filename))
    if args.dry_run:
        print("Dry run complete.")
    else:
        print(f"Wrote {len(created)} files to {out_dir}")
        for f in created:
            print(f" - {f}")

if __name__ == '__main__':
    main()
