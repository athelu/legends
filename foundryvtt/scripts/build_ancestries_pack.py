#!/usr/bin/env python3
"""
Build ancestries compendium pack from parsed ancestry.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file, ensure_key, md_to_html, apply_enrichers


def parse_ancestries_md(md_file):
    """
    Parse ancestry.md and extract ancestry items.
    
    Expected format:
    # Ancestry Name
    Description text...
    
    Ancestries are denoted by Heading 1 (# ) markers.
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for optional PACK marker
    m = re.search(r"<!--\s*PACK:ancestries\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Split by Heading 1 ancestry sections (# Ancestry Name)
    sections = re.split(r'^# ', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        if not item_name:
            continue
        
        # Get the main description (everything up to the first ## or ### heading)
        description_lines = []
        for line in lines[1:]:
            # Stop at the first subsection heading (## or ###)
            if re.match(r'^#{2,}\s+', line):
                break
            description_lines.append(line)
        
        description = '\n'.join(description_lines).strip()
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': 'ancestry',
            'img': 'icons/svg/person.svg',
            'system': {
                'description': {'value': ''},
                'size': 'medium',
                'speed': 30,
                'bonuses': {'attributes': {}},
                'traits': '',
                'languages': '',
                'specialAbilities': '',
                'senses': '',
                'lifespan': 0,
                'culture': '',
                'physicalDescription': '',
                'requiresGMApproval': False,
                'notes': ''
            },
            'effects': []
        }

        # Convert description to HTML
        item['system']['description'] = {'value': apply_enrichers(md_to_html(description))}
        
        # Extract image path if specified
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        # Try to extract lifespan from the full section
        lifespan_match = re.search(r'Lifespan[:\s|]+(\d+(?:-\d+)?)\s*years?', section, re.IGNORECASE)
        if lifespan_match:
            lifespan_str = lifespan_match.group(1)
            # If it's a range like "200-400", take the average
            if '-' in lifespan_str:
                low, high = map(int, lifespan_str.split('-'))
                item['system']['lifespan'] = (low + high) // 2
            else:
                item['system']['lifespan'] = int(lifespan_str)
        
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
