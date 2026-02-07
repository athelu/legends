#!/usr/bin/env python3
"""
Build traits compendium pack from parsed traits.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id


def parse_traits_md(md_file):
    """
    Parse traits.md and extract trait items.
    
    Expected format:
    ### Trait Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    items = []
    
    # Split by trait sections (### or ## Heading)
    sections = re.split(r'^#+\s+', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        # Skip some non-trait headers
        if item_name in ['Divine Gift', 'The Nine Patron Choices', 'ALKIRA', 'ASHKA', 'BHALOTH', 
                         'ELARA', 'HYVAN', 'MORDIN', 'ZEPHYR', 'THORGRIM', 'Starting Age', 
                         'Channel Divinity Options', 'Channel Divinity - Divine Power']:
            continue
        
        if not item_name:
            continue
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': 'trait',
            'img': 'icons/skills/social/diplomacy-handshake.webp',
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
    md_file = script_dir / "ttrpg" / "traits.md"
    if md_file.exists():
        print("Parsing traits.md...")
        items = parse_traits_md(md_file)
        print(f"  Extracted {len(items)} trait items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "legends" / "traits" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding traits pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "legends" / "traits"
    success = build_pack_from_source(pack_dir, "traits")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
