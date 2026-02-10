#!/usr/bin/env python3
"""
Build actions compendium pack from parsed actions.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file, ensure_key


def parse_actions_md(md_file):
    """
    Parse actions.md and extract action items.
    
    Expected format:
    ##### Action Name [ActionType]
    - **Cost:** X [Action] action(s)
    - **Requirements:** Text
    - **Effect:** Text
    - **Notes:** Text
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Look for PACK marker with optional type filters, e.g.:
    # <!-- PACK:action -->
    # <!-- PACK:action:Combat,Move -->
    pack_marker = re.search(r"<!--\s*PACK:action(?::([^>]+))?\s*-->", content, flags=re.IGNORECASE)
    types_filter_raw = None
    if pack_marker:
        types_filter_raw = pack_marker.group(1)
        # If no explicit types provided, import everything after the marker
        content = content[pack_marker.end():]
    
    items = []
    
    # Map action type abbreviations to canonical full names used by the sheets
    action_type_map = {
        'Combat': 'combat',
        'Move': 'move',
        'Movement': 'move',
        'Activate': 'activate',
        'Interact': 'interact',
        'Free': 'free',
        'Reaction': 'reaction'
    }

    # Build allowed types set from PACK marker if provided
    allowed_types = None
    if types_filter_raw:
        allowed = set()
        for t in [x.strip() for x in types_filter_raw.split(',') if x.strip()]:
            low = t.lower()
            allowed.add(low)
            # also add mapped internal name if present
            mapped = action_type_map.get(t, None)
            if mapped:
                allowed.add(mapped.lower())
        allowed_types = allowed
    
    # Split by action sections (##### Heading for individual actions)
    action_sections = re.split(r'^##### ', content, flags=re.MULTILINE)[1:]
    
    for action_section in action_sections:
        lines = action_section.split('\n')
        action_line = lines[0].strip()

        if not action_line:
            continue

        # Parse action name and type from "Action Name [ActionType]"
        action_type_key = None
        match = re.match(r'^(.+?)\s*\[(\w+)\]', action_line)
        if match:
            action_name = match.group(1).strip()
            action_type_key = match.group(2).strip()
            action_type = action_type_map.get(action_type_key, 'combat')
        else:
            action_name = action_line.strip()
            action_type = 'combat'

        # If an allowed_types filter exists, skip items not in the list
        if allowed_types is not None:
            key_check = (action_type_key.lower() if action_type_key else action_type).lower()
            if key_check not in allowed_types:
                continue
        
        # Initialize action item
        item = {
            '_id': generate_id(),
            'name': action_name,
            'type': 'action',
            'img': 'icons/skills/melee/blade-damage.webp',
            'system': {
                # Foundry templates expect description.value
                'description': {'value': ''},
                'actionType': action_type,
                # Normalized cost (e.g. "1", "2", "Free")
                'actionCost': '',
                'trigger': '',
                'effect': '',
                # Store keywords as a comma-separated string for sheet input
                'keywords': '',
                'range': '',
                'target': '',
                'frequency': '',
                'special': ''
            },
            'effects': []
        }
        
        # Parse the action section
        section_text = '\n'.join(lines[1:])
        
        # Extract image path
        img_match = re.search(r'Image[:\s]+([^\n|]+)', section_text)
        if img_match:
            item['img'] = img_match.group(1).strip()

        # Extract cost and normalize to a simple token (1, 2, Free)
        cost_match = re.search(r'\*\*Cost:\*\*\s+([^\n]+)', section_text)
        if cost_match:
            raw_cost = cost_match.group(1).strip()
            if re.search(r'free', raw_cost, flags=re.IGNORECASE):
                norm_cost = 'Free'
            else:
                m = re.search(r'(\d+)', raw_cost)
                norm_cost = m.group(1) if m else raw_cost
            item['system']['actionCost'] = norm_cost

        # Extract requirements (description)
        requirements_match = re.search(r'\*\*Requirements:\*\*\s+([^\n]+(?:\n(?!\*\*)[^\n]*)*)', section_text)
        if requirements_match:
            item['system']['description']['value'] = requirements_match.group(1).strip()
        else:
            # Fallback: use the first paragraph of the section as the description
            first_para = section_text.strip().split('\n\n', 1)[0].strip()
            if first_para:
                item['system']['description']['value'] = first_para
        
        # Extract effect
        effect_match = re.search(r'\*\*Effect:\*\*\s+([^\n]+(?:\n(?!\*\*)[^\n]*)*)', section_text)
        if effect_match:
            item['system']['effect'] = effect_match.group(1).strip()
        
        # Extract range
        range_match = re.search(r'\*\*Range:\*\*\s+([^\n]+)', section_text)
        if range_match:
            item['system']['range'] = range_match.group(1).strip()
        
        # Extract target
        target_match = re.search(r'\*\*Target:\*\*\s+([^\n]+)', section_text)
        if target_match:
            item['system']['target'] = target_match.group(1).strip()
        
        # Extract trigger (for reactions)
        trigger_match = re.search(r'\*\*Trigger:\*\*\s+([^\n]+)', section_text)
        if trigger_match:
            item['system']['trigger'] = trigger_match.group(1).strip()

        # Extract bracketed keywords anywhere in the section (excluding the action type)
        raw_keywords = [k.strip() for k in re.findall(r'\[([^\]]+)\]', action_section)]
        # Remove the type token if present (e.g., the [Combat] in the header)
        keywords = []
        for k in raw_keywords:
            if action_type_key and k.lower() == action_type_key.lower():
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
