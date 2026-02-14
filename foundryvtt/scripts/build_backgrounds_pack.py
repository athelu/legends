#!/usr/bin/env python3
"""
Build backgrounds compendium pack from parsed backgrounds.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file, ensure_key, md_to_html, apply_enrichers


def parse_backgrounds_md(md_file):
    """
    Parse backgrounds.md and extract background items.
    
    Expected format:
    ### Background Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # If a PACK marker is present, only import content after it.
    m = re.search(r"<!--\s*PACK:backgrounds\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Split by background sections (#### Heading used for individual backgrounds)
    sections = re.split(r'^#### ', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        # Skip metadata sections
        if item_name in ['Background Patterns', 'Backgrounds (Alphabetical)']:
            continue
        
        if not item_name:
            continue
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': 'background',
            'img': 'icons/svg/book.svg',
            'system': {
                'description': {'value': ''},
                'startingXP': 0,
                'skillBonuses': '',
                'startingEquipment': '',
                'suggestedFeats': '',
                'features': '',
                'sampleNames': '',
                'traits': '',
                'notes': ''
            },
            'effects': []
        }

        # Extract description and all content
        description = '\n'.join(lines[1:]).strip()
        item['system']['description'] = {'value': apply_enrichers(md_to_html(description))}
        
        # Extract image path if specified
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "backgrounds.md"
    if md_file.exists():
        print("Parsing backgrounds.md...")
        items = parse_backgrounds_md(md_file)
        print(f"  Extracted {len(items)} background items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "backgrounds" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding backgrounds pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "backgrounds"
    success = build_pack_from_source(pack_dir, "backgrounds")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
