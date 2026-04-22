#!/usr/bin/env python3
"""
Build diseases compendium pack from diseases.md documentation.

Parses ## Disease Name sections and their stage definitions, emitting one
`disease` Item per incubation entry + per stage, with mechanical fields
populated from the prose where possible.

Usage:
    python build_diseases_pack.py
"""

import json
import re
from pathlib import Path

from pack_utils import apply_enrichers, build_pack_from_source, ensure_key, generate_stable_id, md_to_html

# ---------------------------------------------------------------------------
# Severity → recovery outcome mapping
# ---------------------------------------------------------------------------

SEVERITY_OUTCOMES = {
    'mild': {
        '2successes': 'cured',
        '1success':   'cured',
        '0successes': 'worsen',
        'successesNeeded': 1,
    },
    'serious': {
        '2successes': 'cured',
        '1success':   'noChange',
        '0successes': 'worsen',
        'successesNeeded': 2,
    },
    'deadly': {
        '2successes': 'cured',
        '1success':   'noChange',
        '0successes': 'worsen',
        'successesNeeded': 2,
    },
}

# ---------------------------------------------------------------------------
# Attribute / skill die-mod key extraction
# ---------------------------------------------------------------------------

ATTRIBUTE_KEY_MAP = {
    'strength': 'strength',
    'constitution': 'constitution',
    'agility': 'agility',
    'dexterity': 'dexterity',
    'intelligence': 'intelligence',
    'wisdom': 'wisdom',
    'charisma': 'charisma',
    'luck': 'luck',
}

SAVE_KEY_MAP = {
    'fortitude': 'fortitude',
    'reflex': 'reflex',
    'will': 'will',
}


def slugify(text):
    """Lower-case filesystem-safe slug."""
    slug = re.sub(r'[^a-z0-9]+', '-', text.strip().lower())
    return slug.strip('-')


# ---------------------------------------------------------------------------
# Markdown parsing helpers
# ---------------------------------------------------------------------------

def parse_severity(text):
    """Extract mild / serious / deadly from '[Mild]' style text."""
    m = re.search(r'\[(mild|serious|deadly)\]', text, re.IGNORECASE)
    return m.group(1).lower() if m else 'serious'


def parse_incubation_formula(text):
    """Extract dice formula like '1d8' or '2d8' from incubation text."""
    m = re.search(r'(\d+d\d+)', text, re.IGNORECASE)
    return m.group(1) if m else '1d8'


def parse_disease_icon(name):
    """Pick a sensible icon based on disease name."""
    n = name.lower()
    if 'demon' in n or 'fever' in n:
        return 'icons/svg/daze.svg'
    if 'rot' in n or 'plague' in n:
        return 'icons/svg/skull.svg'
    if 'poison' in n or 'filth' in n:
        return 'icons/svg/poison.svg'
    return 'icons/svg/hazard.svg'


# ---------------------------------------------------------------------------
# Active-effect extraction from stage prose
# ---------------------------------------------------------------------------

def extract_active_effects(stage_text):
    """Parse mechanical active effects from a single stage description."""
    effects = []

    # "Fortitude saves: add 1 to die results"
    for save_type in SAVE_KEY_MAP:
        m = re.search(
            rf'{save_type}\s+saves?[:\s]+add\s+(\d+)\s+to\s+(?:both\s+)?die\s+results',
            stage_text, re.IGNORECASE
        )
        if m:
            effects.append({
                'key': f'diceMod.save.{save_type}',
                'mode': 'add',
                'value': int(m.group(1)),
                'notes': f'{save_type.capitalize()} saves: add {m.group(1)} to die results',
            })

    # "X and Y checks: add 1 to both die results each" — capture pairs first
    multi_attr = re.search(
        r'((?:\w+\s+and\s+\w+)|(?:\w+\s*,\s*\w+))\s+(?:based\s+)?(?:skill\s+)?checks?[:\s]+add\s+(\d+)\s+to\s+(?:both\s+)?die\s+results',
        stage_text, re.IGNORECASE
    )
    if multi_attr:
        raw_attrs = re.split(r'\band\b|,', multi_attr.group(1), flags=re.IGNORECASE)
        penalty = int(multi_attr.group(2))
        for attr_raw in raw_attrs:
            attr = ATTRIBUTE_KEY_MAP.get(attr_raw.strip().lower())
            if attr:
                effects.append({
                    'key': f'diceMod.attribute.{attr}',
                    'mode': 'add',
                    'value': penalty,
                    'notes': f'{attr.capitalize()} checks: add {penalty} to die results',
                })
    else:
        # Single attribute: "Strength-based checks: add 1 to die results"
        # Also: "Intelligence and Wisdom checks: add 1 to both die results" — handled above
        # Catch remaining single mentions
        for attr in ATTRIBUTE_KEY_MAP:
            m = re.search(
                rf'{attr}[- ]?based\s+(?:skill\s+)?checks?[:\s]+add\s+(\d+)\s+to\s+(?:ability|attribute\s+)?die\s+results',
                stage_text, re.IGNORECASE
            )
            if m:
                # avoid double-adding if already captured by multi-attr
                key = f'diceMod.attribute.{attr}'
                if not any(e['key'] == key for e in effects):
                    effects.append({
                        'key': key,
                        'mode': 'add',
                        'value': int(m.group(1)),
                        'notes': f'{attr.capitalize()}-based checks: add {m.group(1)} to die results',
                    })

    # "Intelligence and Wisdom checks: add 1 to both die results"  (side-by-side, no 'based')
    iw = re.search(
        r'(intelligence)\s+and\s+(wisdom)\s+checks?[:\s]+add\s+(\d+)\s+to\s+both\s+die\s+results',
        stage_text, re.IGNORECASE
    )
    if iw:
        penalty = int(iw.group(3))
        for attr in ('intelligence', 'wisdom'):
            key = f'diceMod.attribute.{attr}'
            if not any(e['key'] == key for e in effects):
                effects.append({
                    'key': key,
                    'mode': 'add',
                    'value': penalty,
                    'notes': f'{attr.capitalize()} checks: add {penalty} to both die results',
                })

    return effects


def extract_applies_conditions(stage_text):
    """
    Pull out condition names that this stage explicitly inflicts.
    Only captures 'Foo condition' patterns, or 'Foo condition + Bar condition'.
    """
    found = []
    # "Sickened condition", "Fatigued (Exhaustion Level 1)", etc.
    for m in re.finditer(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+condition\b', stage_text):
        name = m.group(1).strip()
        if name not in found:
            found.append(name)
    # Explicit "Weakened condition + Sickened condition" already caught above.
    # Also handle: "Sickened condition. Fortitude..." (already caught).
    # Also handle standalone Fatigued as first word: "Fatigued (Exhaustion Level 1)."
    for m in re.finditer(r'\b(Fatigued|Exhausted|Sickened|Weakened|Disoriented|Dazed|Paralyzed)\b', stage_text):
        name = m.group(1)
        if name not in found:
            found.append(name)
    return found


def extract_special_rules(stage_text):
    """
    Capture narrative-only rules that cannot be encoded mechanically.
    Returns a string (empty if nothing special).
    """
    special = []

    # "Wounds do not close — cannot benefit from natural HP recovery…"
    if re.search(r'wounds?\s+do\s+not\s+close|cannot\s+benefit\s+from\s+natural\s+(?:HP\s+)?recovery', stage_text, re.IGNORECASE):
        special.append("Wounds do not close — the character cannot benefit from natural HP recovery during short or long rests (magical healing still works).")

    # "Cannot benefit from long rests — pneuma too disrupted"
    if re.search(r'cannot\s+benefit\s+from\s+long\s+rests?|pneuma\s+(?:is\s+)?too\s+disrupted', stage_text, re.IGNORECASE):
        special.append("Character cannot benefit from long rests — their pneuma is too disrupted. Luck does not restore on rest.")

    # "Magical healing alone suppresses symptoms…"
    if re.search(r'magical\s+healing\s+alone\s+suppresses', stage_text, re.IGNORECASE):
        special.append("Magical healing alone suppresses symptoms for 24 hours but does not cure. Major Restoration cures completely.")

    # "Character makes a Will save or acts erratically…"
    if re.search(r'acts?\s+erratically|will\s+save.*erratic', stage_text, re.IGNORECASE):
        special.append("On failed long rest save: character makes a Will save (Hard task) or acts erratically for 1d8 hours (GM determines behavior). Death is possible if untreated.")

    # Dazed episode
    if re.search(r'episode\s+lasting\s+1\s+hour\s+where\s+they\s+are\s+Dazed', stage_text, re.IGNORECASE):
        special.append("Once per long rest: character experiences a 1-hour Dazed episode and cannot be reasoned with.")

    return ' '.join(special)


def extract_damage_per_long_rest(stage_text):
    """Return damage formula if this stage deals damage on failed rest save."""
    m = re.search(r'(?:deals?|inflicts?)\s+(\d+)\s+damage\s+per\s+long\s+rest', stage_text, re.IGNORECASE)
    if m:
        return m.group(1)
    return None


# ---------------------------------------------------------------------------
# Disease header parsing
# ---------------------------------------------------------------------------

def parse_disease_section(disease_name, section_text):
    """
    Parse one ## Disease section into a list of stage dicts ready for item creation.

    Returns list of dicts (one per stage, including incubating).
    """
    lines = section_text.strip().splitlines()

    # --- Header metadata ---
    severity = 'serious'
    vector = ''
    incubation_formula = '1d8'
    recovery_header = ''

    for line in lines:
        stripped = line.strip()
        if re.match(r'\*\*Severity', stripped, re.IGNORECASE):
            severity = parse_severity(stripped)
        elif re.match(r'\*\*Vector', stripped, re.IGNORECASE):
            m = re.search(r':\s*(.+)', stripped)
            if m:
                vector = re.sub(r'\*\*', '', m.group(1)).strip()
        elif re.match(r'\*\*Incubation', stripped, re.IGNORECASE):
            incubation_formula = parse_incubation_formula(stripped)
        elif re.match(r'\*\*Recovery', stripped, re.IGNORECASE):
            m = re.search(r':\s*(.+)', stripped)
            if m:
                recovery_header = re.sub(r'\*\*', '', m.group(1)).strip()

    # --- Stage lines (bullet points) ---
    # Match: "- **Stage N:** ..." or "- **Stage N :** ..."
    stage_pattern = re.compile(
        r'^\s*-\s+\*\*Stage\s+(\d+)\s*(?::?\*\*|:\s*\*\*)\s*:?\s*(.+)$',
        re.IGNORECASE
    )
    stages_raw = []  # list of (stage_num, prose)
    for line in lines:
        m = stage_pattern.match(line)
        if m:
            stages_raw.append((int(m.group(1)), m.group(2).strip()))

    if not stages_raw:
        print(f"  WARNING: No stages found for {disease_name}")
        return []

    icon = parse_disease_icon(disease_name)
    outcomes = SEVERITY_OUTCOMES.get(severity, SEVERITY_OUTCOMES['serious'])
    progression_chain = (
        [f'{disease_name} (Incubating)'] +
        [f'{disease_name} (Stage {n})' for n, _ in stages_raw]
    )
    worst_stage = max(n for n, _ in stages_raw)

    results = []

    # --- Incubating entry ---
    incubating_desc_md = (
        f"**Disease:** {disease_name} — **Severity:** [{severity.capitalize()}]\n\n"
        f"The character has been exposed to {disease_name} but shows no symptoms yet. "
        f"The disease is incubating. At the end of the incubation period, Stage 1 effects begin.\n\n"
        f"**Vector:** {vector}\n\n"
        f"**Incubation:** Roll {incubation_formula} days."
    )
    results.append({
        'name': f'{disease_name} (Incubating)',
        'stageNumber': 0,
        'stage': 'incubating',
        'gmOnly': True,
        'incubationFormula': incubation_formula,
        'description_md': incubating_desc_md,
        'activeEffects': [],
        'appliesConditions': [],
        'specialRules': '',
        'damageTick': None,
        'recovery': None,
        'progressionChain': progression_chain,
        'severity': severity,
        'vector': vector,
        'icon': icon,
        'isWorst': False,
    })

    # --- Active stages ---
    for stage_num, prose in stages_raw:
        is_worst = (stage_num == worst_stage)

        # Cumulative expansion: "As Stage N" means copy forward
        # We resolve that in the description prose only; effects are extracted per-stage
        active_effects = extract_active_effects(prose)
        applies_conditions = extract_applies_conditions(prose)
        special_rules = extract_special_rules(prose)
        damage_formula = extract_damage_per_long_rest(prose)

        # Build damageTick for worst-stage damage
        damage_tick = None
        if damage_formula:
            damage_tick = {
                'frequency': 'longRest',
                'formula': damage_formula,
                'applyOnFailure': True,
                'chatMessage': f'[[/damage {damage_formula}]] damage from {disease_name} (Stage {stage_num}) — failed long rest save.',
            }

        # Build recovery
        save_type = 'fortitude'
        stage_outcomes = dict(outcomes)
        if is_worst:
            # At worst stage, 0 successes = damage (or worsen if damage already encoded in tick)
            stage_outcomes = dict(outcomes)
            if damage_tick:
                stage_outcomes['0successes'] = 'damage'

        recovery = {
            'trigger': 'longRest',
            'method': 'save',
            'save': {
                'type': save_type,
                'successesNeeded': outcomes['successesNeeded'],
            },
            'outcomes': {k: v for k, v in stage_outcomes.items() if k != 'successesNeeded'},
            'promptPlayer': True,
            'chatMessage': f'Make a [[/save type={save_type}]] to recover from {disease_name} (Stage {stage_num}).',
        }

        stage_desc_md = (
            f"**Disease:** {disease_name} — **Severity:** [{severity.capitalize()}] — **Stage {stage_num}**\n\n"
            f"**Effects:** {prose}\n\n"
            f"**Recovery:** {recovery_header}"
        )

        results.append({
            'name': f'{disease_name} (Stage {stage_num})',
            'stageNumber': stage_num,
            'stage': 'active',
            'gmOnly': False,
            'incubationFormula': incubation_formula,
            'description_md': stage_desc_md,
            'activeEffects': active_effects,
            'appliesConditions': applies_conditions,
            'specialRules': special_rules,
            'damageTick': damage_tick,
            'recovery': recovery,
            'progressionChain': progression_chain,
            'severity': severity,
            'vector': vector,
            'icon': icon,
            'isWorst': is_worst,
        })

    return results


# ---------------------------------------------------------------------------
# Item assembly
# ---------------------------------------------------------------------------

def build_disease_item(stage_data):
    """Convert a parsed stage dict into a Foundry Item document dict."""
    name = stage_data['name']
    _id = generate_stable_id(f'disease:{name}')

    system = {
        'description': {
            'value': apply_enrichers(md_to_html(stage_data['description_md']))
        },
        'diseaseName': re.sub(r'\s*\(.*\)$', '', name).strip(),
        'severity': stage_data['severity'],
        'vector': stage_data['vector'],
        'incubationFormula': stage_data['incubationFormula'],
        'stage': stage_data['stage'],
        'stageNumber': stage_data['stageNumber'],
        'gmOnly': stage_data['gmOnly'],
        'incubationDays': 0,
        'incubationRemaining': 0,
        'progressionChain': stage_data['progressionChain'],
        'activeEffects': stage_data['activeEffects'],
        'appliesConditions': stage_data['appliesConditions'],
        'specialRules': stage_data['specialRules'],
        'overlayPriority': 25,
        'damageTick': stage_data['damageTick'],
        'recovery': stage_data['recovery'],
    }

    item = {
        '_id': _id,
        'name': name,
        'type': 'disease',
        'img': stage_data['icon'],
        'system': system,
        'flags': {},
    }

    return ensure_key(item)


# ---------------------------------------------------------------------------
# diseases.md parser
# ---------------------------------------------------------------------------

DISEASE_SECTION_RE = re.compile(r'^##\s+(.+)$', re.MULTILINE)


def parse_diseases_md(source_path):
    """Parse diseases.md and return all stage dicts."""
    text = source_path.read_text(encoding='utf-8')

    matches = list(DISEASE_SECTION_RE.finditer(text))
    if not matches:
        print("No disease sections found in diseases.md")
        return []

    all_stages = []
    for i, match in enumerate(matches):
        disease_name = match.group(1).strip()
        section_start = match.end()
        section_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        section_text = text[section_start:section_end]

        print(f"  Parsing: {disease_name}")
        stages = parse_disease_section(disease_name, section_text)
        print(f"    → {len(stages)} entries ({stages[0]['name']} … {stages[-1]['name']})" if stages else "    → 0 entries")
        all_stages.extend(stages)

    return all_stages


# ---------------------------------------------------------------------------
# Build entry point
# ---------------------------------------------------------------------------

def main():
    scripts_dir = Path(__file__).parent
    repo_root = scripts_dir.parent.parent
    ttrpg_dir = repo_root / 'ttrpg'
    pack_dir = scripts_dir.parent / 'packs' / 'diseases'
    source_dir = pack_dir / '_source'
    source_dir.mkdir(parents=True, exist_ok=True)

    diseases_md = ttrpg_dir / 'diseases.md'
    if not diseases_md.exists():
        print(f"ERROR: {diseases_md} not found")
        return False

    print(f"\nParsing {diseases_md}")
    all_stages = parse_diseases_md(diseases_md)

    if not all_stages:
        print("No stages parsed — aborting.")
        return False

    # Write one JSON per stage
    written = 0
    for stage in all_stages:
        item = build_disease_item(stage)
        slug = slugify(item['name'])
        out_path = source_dir / f'{slug}.json'
        out_path.write_text(json.dumps(item, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f"  Written: {out_path.name}")
        written += 1

    print(f"\n✓ {written} disease stage files written to {source_dir}")
    print(f"  Next step: Run 'npm run pack:diseases' to compile to LevelDB format")

    # Validate via shared utility
    build_pack_from_source(pack_dir, pack_name='diseases', document_type='Item')
    return True


if __name__ == '__main__':
    success = main()
    raise SystemExit(0 if success else 1)
