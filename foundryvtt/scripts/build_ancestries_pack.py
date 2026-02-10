#!/usr/bin/env python3
"""
Build ancestries compendium pack from parsed ancestry.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file, ensure_key


def parse_ancestries_md(md_file):
    """
    Parse ancestry.md and extract ancestry/ethnicity items.
    
    Expected format:
    ### Ancestry/Ethnicity Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"<!--\s*PACK:ancestries\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Split by ancestry sections (### Heading for ancestries, #### for ethnicities)
    sections = re.split(r'^### ', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        # Skip metadata sections
        if item_name in ['Human Characteristics', 'Starting Age', 'Ethnicities']:
            continue
        
        if not item_name:
            continue
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': 'ancestry',
            'img': 'icons/svg/person.svg',
            'system': {
                'description': ''
            },
            'effects': []
        }
        
        # Extract description
        description = '\n'.join(lines[1:]).strip()
        item['system']['description'] = description
        
        # Extract image path if specified
        img_match = re.search(r'Image[:\s]+([^\n|]+)', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "ancestry.md"
    if md_file.exists():
        print("Parsing ancestry.md...")
        items = parse_ancestries_md(md_file)
        print(f"  Extracted {len(items)} ancestry items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "ancestries" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding ancestries pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "ancestries"
    success = build_pack_from_source(pack_dir, "ancestries")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
