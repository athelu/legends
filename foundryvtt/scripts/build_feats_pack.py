#!/usr/bin/env python3
"""
Build feats compendium pack from parsed feats.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id


def parse_feats_md(md_file):
    """
    Parse feats.md and extract feat items.
    
    Expected format:
    ### Feat Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    items = []
    
    # Split by feat sections (### Heading)
    sections = re.split(r'^### ', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        if not item_name:
            continue
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': 'feat',
            'img': 'icons/skills/melee/blade-damage.webp',
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
    md_file = script_dir / "ttrpg" / "feats.md"
    if md_file.exists():
        print("Parsing feats.md...")
        items = parse_feats_md(md_file)
        print(f"  Extracted {len(items)} feat items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "feats" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding feats pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "feats"
    success = build_pack_from_source(pack_dir, "feats")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
