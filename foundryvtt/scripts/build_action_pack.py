#!/usr/bin/env python3
"""
Build actions compendium pack from parsed actions.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file, ensure_key, md_to_html, apply_enrichers


def parse_actions_md(md_file):
    """
    Parse actions.md and extract action items.

    Recognises action definitions at heading levels 3-5 (###, ####, #####)
    that carry a [Type] tag such as [Combat], [Move], [Activate], [Interact],
    [Free], or [Reaction].  Also handles:
      - bullet-prefixed headings  (-##### Action [Move])
      - reactions without explicit tags that live under a Reactions section
      - the (Reaction) suffix on some headings
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Look for PACK marker with optional type filters
    pack_marker = re.search(r"<!--\s*PACK:action(?::([^>]+))?\s*-->", content, flags=re.IGNORECASE)
    types_filter_raw = None
    if pack_marker:
        types_filter_raw = pack_marker.group(1)
        content = content[pack_marker.end():]

    items = []

    # Map action type abbreviations to canonical names used by the sheets
    action_type_map = {
        'combat': 'combat',
        'move': 'move',
        'movement': 'move',
        'activate': 'activate',
        'interact': 'interact',
        'free': 'free',
        'reaction': 'reaction',
    }

    # Build allowed types set from PACK marker if provided
    allowed_types = None
    if types_filter_raw:
        allowed = set()
        for t in [x.strip() for x in types_filter_raw.split(',') if x.strip()]:
            low = t.lower()
            allowed.add(low)
            mapped = action_type_map.get(low)
            if mapped:
                allowed.add(mapped)
        allowed_types = allowed

    # Default icon per action type
    icon_map = {
        'combat': 'icons/skills/melee/blade-damage.webp',
        'move': 'icons/skills/movement/feet-winged-boots-brown.webp',
        'activate': 'icons/skills/trades/construction-gloves-yellow.webp',
        'interact': 'icons/skills/social/wave-halt-stop.webp',
        'free': 'icons/skills/movement/arrow-right-blue.webp',
        'reaction': 'icons/skills/melee/shield-block-gray-yellow.webp',
    }

    # ----------------------------------------------------------------
    # Phase 1 — scan line-by-line, find action headings and their body
    # ----------------------------------------------------------------
    # A heading is an action definition if it carries a [Type] tag or lives
    # inside a Reactions section.  Category / mechanic headings are skipped.

    lines = content.split('\n')
    # Regex to match any heading (optionally preceded by a dash)
    heading_re = re.compile(r'^-?\s*(#{2,5})\s+(.+)$')
    # Regex to extract a [Type] tag from a heading
    type_tag_re = re.compile(r'\[(\w+)\]')

    # Known category headings (not individual actions) — lowercase
    category_names = {
        'combat actions', 'standard combat actions', 'movement actions',
        'activate actions', 'interact actions', 'free actions', 'reactions',
        'universal reactions', 'movement in combat', 'important clarifications',
        'movement modifiers', 'action types', 'basic reaction mechanics',
        'reaction priority and timing', 'free action limits',
    }

    # First pass: identify heading line numbers that are action definitions
    action_starts = []       # list of (line_idx, action_name, action_type_key)
    current_section_type = None  # inferred type from parent ## heading

    for idx, line in enumerate(lines):
        # Track top-level ## sections to infer types for untagged headings
        m_section = re.match(r'^##\s+(.+)', line)
        if m_section:
            sec = m_section.group(1).strip().lower()
            if 'reaction' in sec:
                current_section_type = 'reaction'
            elif 'free' in sec:
                current_section_type = 'free'
            elif 'interact' in sec:
                current_section_type = 'interact'
            elif 'activate' in sec:
                current_section_type = 'activate'
            elif 'move' in sec:
                current_section_type = 'move'
            elif 'combat' in sec:
                current_section_type = 'combat'
            else:
                current_section_type = None
            continue

        hm = heading_re.match(line)
        if not hm:
            continue

        level = len(hm.group(1))  # number of #
        title = hm.group(2).strip()

        # Skip headings that end with ':' (sub-sections like "#### Modifiers:")
        if title.rstrip().endswith(':'):
            continue

        # Extract [Type] tag if present
        tag_match = type_tag_re.search(title)
        if tag_match:
            raw_type = tag_match.group(1)
            type_key = action_type_map.get(raw_type.lower())
            if type_key is None:
                continue  # unknown tag, skip
            # Clean the action name: remove the [Type] tag and optional (Reaction)
            name = type_tag_re.sub('', title).strip()
            name = re.sub(r'\(Reaction\)', '', name, flags=re.IGNORECASE).strip()
            # Handle (Reaction) suffix or being inside a Reactions section
            if re.search(r'\(Reaction\)', title, flags=re.IGNORECASE):
                type_key = 'reaction'
            elif current_section_type == 'reaction':
                type_key = 'reaction'
        elif current_section_type == 'reaction':
            # Untagged heading inside a Reactions section
            type_key = 'reaction'
            name = title.strip()
        else:
            # No type tag and not in a reaction section — skip (category heading)
            continue

        # Skip known category names
        if name.lower().rstrip(':') in category_names:
            continue

        action_starts.append((idx, name, type_key))

    # Second pass: extract body text for each action (from heading to next action heading)
    seen_names = set()
    for i, (start_idx, action_name, type_key) in enumerate(action_starts):
        # Determine end of this action's body
        if i + 1 < len(action_starts):
            end_idx = action_starts[i + 1][0]
        else:
            end_idx = len(lines)

        # Body is everything after the heading line up to the next action
        body_lines = lines[start_idx + 1 : end_idx]
        section_text = '\n'.join(body_lines)

        # Apply allowed_types filter
        if allowed_types is not None and type_key not in allowed_types:
            continue

        # Skip duplicates (same name already extracted)
        name_slug = action_name.lower()
        if name_slug in seen_names:
            continue
        seen_names.add(name_slug)

        # Initialize action item
        item = {
            '_id': generate_id(),
            'name': action_name,
            'type': 'action',
            'img': icon_map.get(type_key, 'icons/skills/melee/blade-damage.webp'),
            'system': {
                'description': {'value': ''},
                'actionType': type_key,
                'actionCost': '',
                'trigger': '',
                'effect': '',
                'keywords': '',
                'range': '',
                'target': '',
                'frequency': '',
                'special': ''
            },
            'effects': []
        }

        # --- Field extraction (same logic as before) ---

        # Image
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', section_text)
        if img_match:
            item['img'] = img_match.group(1).strip()

        # Cost
        cost_match = re.search(r'\*\*Cost:\*\*\s+([^\n]+)', section_text)
        if cost_match:
            raw_cost = cost_match.group(1).strip()
            if re.search(r'free', raw_cost, flags=re.IGNORECASE):
                norm_cost = 'Free'
            else:
                m = re.search(r'(\d+)', raw_cost)
                norm_cost = m.group(1) if m else raw_cost
            item['system']['actionCost'] = norm_cost

        # Description: prefer full section converted to HTML, fall back to Requirements
        # Strip bold metadata lines for a cleaner description
        desc_text = section_text.strip()
        if desc_text:
            item['system']['description']['value'] = apply_enrichers(md_to_html(desc_text))

        # Effect
        effect_match = re.search(r'\*\*Effect:\*\*\s+([^\n]+(?:\n(?!\*\*)[^\n]*)*)', section_text)
        if effect_match:
            item['system']['effect'] = effect_match.group(1).strip()

        # Range
        range_match = re.search(r'\*\*Range:\*\*\s+([^\n]+)', section_text)
        if range_match:
            item['system']['range'] = range_match.group(1).strip()

        # Target
        target_match = re.search(r'\*\*Target:\*\*\s+([^\n]+)', section_text)
        if target_match:
            item['system']['target'] = target_match.group(1).strip()

        # Trigger (for reactions)
        trigger_match = re.search(r'\*\*Trigger:\*\*\s+([^\n]+)', section_text)
        if trigger_match:
            item['system']['trigger'] = trigger_match.group(1).strip()

        # Keywords: bracketed tokens in the body (excluding the action type tag)
        raw_keywords = [k.strip() for k in re.findall(r'\[([^\]]+)\]', section_text)]
        keywords = []
        for k in raw_keywords:
            if k.lower() in action_type_map:
                continue
            if k and k not in keywords:
                keywords.append(k)
        if keywords:
            item['system']['keywords'] = ', '.join(keywords)

        items.append(item)

    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "actions.md"
    if md_file.exists():
        print("Parsing actions.md...")
        items = parse_actions_md(md_file)
        print(f"  Extracted {len(items)} action items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "action" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        # Clean old JSON files to prevent orphaned entries
        print("  Cleaning old JSON files...")
        for old_file in source_dir.glob("*.json"):
            old_file.unlink()
        print(f"  Removed old files")
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding action pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "action"
    success = build_pack_from_source(pack_dir, "action")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
