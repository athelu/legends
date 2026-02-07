#!/usr/bin/env python3
"""
Build traits, flaws, feats compendium packs from parsed documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file


def parse_md_list(md_file, item_type):
    """
    Parse markdown files with trait/flaw/feat lists.
    
    Expected format:
    ### Item Name
    Description text...
    
    Additional details...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Map item types to default images
    image_map = {
        'trait': 'icons/skills/social/diplomacy-handshake.webp',
        'flaw': 'icons/svg/hazard.svg',
        'feat': 'icons/skills/melee/blade-damage.webp'
    }
    
    items = []
    
    # Split by item sections (### Heading)
    sections = re.split(r'^### ', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        if not item_name:
            continue
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': item_type,
            'img': image_map.get(item_type, 'icons/svg/item-bag.svg'),
            'system': {
                'description': ''
            },
            'effects': []
        }
        
        # Extract description (everything after name until next section)
        description = '\n'.join(lines[1:]).strip()
        item['system']['description'] = description
        
        # Extract image path if specified
        img_match = re.search(r'Image[:\s]+([^\n|]+)', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        items.append(item)
    
    return items


def build_pack(md_file, item_type, pack_name):
    """
    Build a pack from markdown documentation.
    """
    script_dir = Path(__file__).parent.parent.parent
    md_path = script_dir / "ttrpg" / md_file
    
    if not md_path.exists():
        print(f"Markdown file not found: {md_path}")
        return False
    
    print(f"Parsing {md_file}...")
    items = parse_md_list(md_path, item_type)
    print(f"  Extracted {len(items)} {item_type} items from documentation")
    
    if not items:
        return False
    
    # Save to _source/
    source_dir = script_dir / "foundryvtt" / "packs" / pack_name / "_source"
    source_dir.mkdir(parents=True, exist_ok=True)
    
    for item in items:
        json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(item, f, indent=2, ensure_ascii=False)
        print(f"  Saved {json_file.name}")
    
    # Build the pack
    print(f"\nBuilding {pack_name} pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / pack_name
    return build_pack_from_source(pack_dir, pack_name)


def main():
    # Define which files to parse
    packs = [
        ("traits.md", "trait", "traits"),
        ("flaws.md", "flaw", "flaws"),
        ("feats.md", "feat", "feats"),
    ]
    
    results = {}
    for md_file, item_type, pack_name in packs:
        print(f"\n{'='*60}")
        print(f"Building {pack_name} pack")
        print('='*60)
        results[pack_name] = build_pack(md_file, item_type, pack_name)
    
    # Summary
    print(f"\n{'='*60}")
    print("Build Summary:")
    successful = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"  Successful: {successful}/{total}")
    
    if successful < total:
        failed = [k for k, v in results.items() if not v]
        print(f"  Failed: {', '.join(failed)}")
        return 1
    else:
        print("\nAll packs built successfully!")
        return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
