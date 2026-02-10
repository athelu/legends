#!/usr/bin/env python3
"""
Build feats compendium pack from parsed feats.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key


def parse_feats_md(md_file):
    """
    Parse feats.md and extract feat items.
    
    Expected format:
    ### Feat Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"<!--\s*PACK:feats\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Prefer level-4 headings (####) for individual feats; fall back to level-3 if none found
    sections = re.split(r'^####\s+', content, flags=re.MULTILINE)[1:]
    if not sections:
        sections = re.split(r'^###\s+', content, flags=re.MULTILINE)[1:]
    
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
                # Use description object matching other builders
                'description': {'value': ''}
            },
            'effects': []
        }
        
        # Extract description
        description = '\n'.join(lines[1:]).strip()
        item['system']['description']['value'] = description
        
        # Extract image path if specified
        img_match = re.search(r'Image[:\s]+([^\n|]+)', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        items.append(item)
    # Filter out non-feat sections: require at least one of 'Tier', 'Benefit', 'Usage', or 'Keyword' in the description
    filtered = []
    for it in items:
        desc = (it.get('system', {}).get('description', {}).get('value') if isinstance(it.get('system', {}).get('description'), dict) else it.get('system', {}).get('description', ''))
        if not desc:
            desc = ''
        if re.search(r'\b(tier|benefit|usage|keyword|prerequisites)\b', desc, flags=re.IGNORECASE):
            filtered.append(it)

    # Alphabetize by name
    filtered.sort(key=lambda x: x.get('name', '').lower())

    return filtered


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
                ensure_key(item)
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
