#!/usr/bin/env python3
"""
Build armor compendium pack from parsed armor.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file


def parse_armor_md(md_file):
    """
    Parse armor.md and extract armor and shield items.
    
    This is a custom parser that understands the armor documentation format.
    Automatically detects shields by name and creates them as shield items.
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    items = []
    
    # Split by armor type sections (### Heading)
    armor_types = re.split(r'^### ', content, flags=re.MULTILINE)[1:]
    
    for armor_section in armor_types:
        lines = armor_section.split('\n')
        item_name = lines[0].strip()
        
        # Skip empty sections
        if not item_name:
            continue
        
        # Detect if this is a shield
        is_shield = 'shield' in item_name.lower()
        
        if is_shield:
            # Create shield item
            item = {
                '_id': generate_id(),
                'name': item_name,
                'type': 'shield',
                'img': 'icons/equipment/shield/heater-marked-red.webp',
                'system': {
                    'description': '',
                    'shieldType': '',
                    'handUsage': '',
                    'meleeDefense': '',
                    'requirements': '',
                    'specialAbilities': '',
                    'plantedMode': False,
                    'reactions': [],
                    'weight': '',
                    'cost': ''
                },
                'effects': []
            }
        else:
            # Create armor item
            item = {
                '_id': generate_id(),
                'name': item_name,
                'type': 'armor',
                'img': 'icons/equipment/chest/plate-armor-gray.webp',
                'system': {
                    'description': '',
                    'armorType': '',
                    'dr': {
                        'slashing': 0,
                        'piercing': 0,
                        'bludgeoning': 0
                    },
                    'stealthPenalty': 'none',
                    'swimPenalty': '',
                    'donTime': '',
                    'doffTime': '',
                    'weight': '',
                    'cost': ''
                },
                'effects': []
            }
        
        # Parse the section
        section_text = '\n'.join(lines[1:])
        
        # Extract image path
        img_match = re.search(r'Image[:\s]+([^\n|]+)', section_text)
        if img_match:
            item['img'] = img_match.group(1).strip()
        desc_match = re.match(r'^(.*?)(?=\n\||\n-|\n\n|$)', section_text, re.DOTALL)
        if desc_match:
            item['system']['description'] = desc_match.group(1).strip()
        
        # Extract cost
        cost_match = re.search(r'Cost[:\s]+([^|\n]+)', section_text)
        if cost_match:
            item['system']['cost'] = cost_match.group(1).strip()
        
        # Extract weight
        weight_match = re.search(r'Weight[:\s]+([^|\n]+)', section_text)
        if weight_match:
            item['system']['weight'] = weight_match.group(1).strip()
        
        if is_shield:
            # Extract shield-specific data
            shield_type_match = re.search(r'Type[:\s]+([^|\n]+)', section_text)
            if shield_type_match:
                item['system']['shieldType'] = shield_type_match.group(1).strip()
        else:
            # Extract armor-specific stats
            # Look for patterns like "DR: X/Y/Z"
            dr_match = re.search(r'DR[:\s]+(\d+)/(\d+)/(\d+)', section_text)
            if dr_match:
                item['system']['dr']['slashing'] = int(dr_match.group(1))
                item['system']['dr']['piercing'] = int(dr_match.group(2))
                item['system']['dr']['bludgeoning'] = int(dr_match.group(3))
            
            # Determine armor type from name
            name_lower = item_name.lower()
            if 'light' in name_lower:
                item['system']['armorType'] = 'light'
            elif 'medium' in name_lower:
                item['system']['armorType'] = 'medium'
            elif 'heavy' in name_lower:
                item['system']['armorType'] = 'heavy'
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Try to parse from markdown
    md_file = script_dir / "ttrpg" / "armor.md"
    if md_file.exists():
        print("Parsing armor.md...")
        items = parse_armor_md(md_file)
        print(f"  Extracted {len(items)} armor items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "armor" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding armor pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "armor"
    success = build_pack_from_source(pack_dir, "armor")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
