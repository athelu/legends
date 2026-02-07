#!/usr/bin/env python3
"""
Build actions compendium pack from parsed actions.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file


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
    
    items = []
    
    # Map action type abbreviations to full names
    action_type_map = {
        'Combat': 'combat',
        'Move': 'movement',
        'Movement': 'movement',
        'Activate': 'activate',
        'Interact': 'interact',
        'Free': 'free',
        'Reaction': 'reaction'
    }
    
    # Split by action sections (##### Heading for individual actions)
    action_sections = re.split(r'^##### ', content, flags=re.MULTILINE)[1:]
    
    for action_section in action_sections:
        lines = action_section.split('\n')
        action_line = lines[0].strip()
        
        if not action_line:
            continue
        
        # Parse action name and type from "Action Name [ActionType]"
        match = re.match(r'^(.+?)\s*\[(\w+)\]', action_line)
        if match:
            action_name = match.group(1).strip()
            action_type_key = match.group(2).strip()
            action_type = action_type_map.get(action_type_key, 'combat')
        else:
            action_name = action_line.strip()
            action_type = 'combat'
        
        # Initialize action item
        item = {
            '_id': generate_id(),
            'name': action_name,
            'type': 'action',
            'img': 'icons/skills/melee/blade-damage.webp',
            'system': {
                'description': '',
                'actionType': action_type,
                'actionCost': '',
                'trigger': '',
                'effect': '',
                'keywords': [],
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
        
        # Extract cost
        cost_match = re.search(r'\*\*Cost:\*\*\s+([^\n]+)', section_text)
        if cost_match:
            item['system']['actionCost'] = cost_match.group(1).strip()
        
        # Extract requirements (description)
        requirements_match = re.search(r'\*\*Requirements:\*\*\s+([^\n]+(?:\n(?!\*\*)[^\n]*)*)', section_text)
        if requirements_match:
            item['system']['description'] = requirements_match.group(1).strip()
        
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
        source_dir = script_dir / "foundryvtt" / "packs" / "legends" / "action" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding action pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "legends" / "action"
    success = build_pack_from_source(pack_dir, "action")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
