#!/usr/bin/env python3
"""
Build weapons compendium pack from parsed weapons.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file


def parse_weapons_md(md_file):
    """
    Parse weapons.md and extract weapon items.
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    items = []
    
    # Split by weapon sections (### Heading)
    weapon_sections = re.split(r'^### ', content, flags=re.MULTILINE)[1:]
    
    for weapon_section in weapon_sections:
        lines = weapon_section.split('\n')
        weapon_name = lines[0].strip()
        
        if not weapon_name:
            continue
        
        item = {
            '_id': generate_id(),
            'name': weapon_name,
            'type': 'weapon',
            'img': 'icons/weapons/swords/sword-long-crossguard-brown.webp',
            'system': {
                'description': '',
                'damage': '',
                'range': '',
                'weight': '',
                'cost': '',
                'properties': []
            },
            'effects': []
        }
        
        section_text = '\n'.join(lines[1:])
        
        # Extract image path
        img_match = re.search(r'Image[:\s]+([^\n|]+)', section_text)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        # Extract description
        desc_match = re.match(r'^(.*?)(?=\n\||\n-|\n\n|$)', section_text, re.DOTALL)
        if desc_match:
            item['system']['description'] = desc_match.group(1).strip()
        
        # Extract damage
        damage_match = re.search(r'Damage[:\s]+([^|\n]+)', section_text)
        if damage_match:
            item['system']['damage'] = damage_match.group(1).strip()
        
        # Extract range
        range_match = re.search(r'Range[:\s]+([^|\n]+)', section_text)
        if range_match:
            item['system']['range'] = range_match.group(1).strip()
        
        # Extract cost
        cost_match = re.search(r'Cost[:\s]+([^|\n]+)', section_text)
        if cost_match:
            item['system']['cost'] = cost_match.group(1).strip()
        
        # Extract weight
        weight_match = re.search(r'Weight[:\s]+([^|\n]+)', section_text)
        if weight_match:
            item['system']['weight'] = weight_match.group(1).strip()
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Try to parse from markdown
    md_file = script_dir / "ttrpg" / "weapons.md"
    if md_file.exists():
        print("Parsing weapons.md...")
        items = parse_weapons_md(md_file)
        print(f"  Extracted {len(items)} weapon items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "legends" / "weapons" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding weapons pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "legends" / "weapons"
    success = build_pack_from_source(pack_dir, "weapons")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
