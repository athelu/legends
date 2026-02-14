#!/usr/bin/env python3
"""
Build flaws compendium pack from parsed flaws.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key, md_to_html, apply_enrichers


def parse_flaws_md(md_file):
    """
    Parse flaws.md and extract flaw items.
    
    Expected format:
    ### Flaw Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"<!--\s*PACK:flaws\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Split by flaw sections (### Heading)
    sections = re.split(r'^### ', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        if not item_name:
            continue
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': 'flaw',
            'img': 'icons/svg/hazard.svg',
            'system': {
                'description': {'value': ''},
                'pointValue': 0,
                'flawType': '',
                'severity': 'moderate',
                'mechanicalEffects': '',
                'roleplayingImpact': '',
                'canBeOvercome': False,
                'requiresGMApproval': False,
                'notes': ''
            },
            'effects': []
        }

        # Extract description
        description = '\n'.join(lines[1:]).strip()
        item['system']['description'] = {'value': apply_enrichers(md_to_html(description))}

        # Try to extract point value from name like "Flaw Name (3)"
        cost_match = re.search(r'\((\d+(?:-\d+)?)\)', item_name)
        if cost_match:
            val = cost_match.group(1)
            # Handle ranges like "2-4" by taking the first value
            first = val.split('-')[0]
            try:
                item['system']['pointValue'] = int(first)
            except ValueError:
                pass
        
        # Extract image path if specified
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "flaws.md"
    if md_file.exists():
        print("Parsing flaws.md...")
        items = parse_flaws_md(md_file)
        print(f"  Extracted {len(items)} flaw items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "flaws" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding flaws pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "flaws"
    success = build_pack_from_source(pack_dir, "flaws")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
