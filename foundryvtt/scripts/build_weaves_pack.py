#!/usr/bin/env python3
"""
Build weaves compendium pack from parsed weaves.md documentation.

The weaves are split across multiple files:
- weaves(a-g).md
- weaves(h-m).md
- weaves(n-r).md
- weaves(s-z).md

This script will parse all of them.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file, ensure_key, md_to_html, apply_enrichers


def _safe_filename(name: str) -> str:
    """Return a filesystem-safe filename for item names (cross-platform).

    Replace characters that are invalid on Windows (and awkward elsewhere)
    with hyphens and collapse repeated hyphens.
    """
    # Replace any character that is not alphanumeric, period, underscore, space or hyphen
    s = re.sub(r"[^A-Za-z0-9 ._\-]", "-", name)
    s = s.strip().lower()
    s = re.sub(r"[\s]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s


def parse_weaves_md(ttrpg_dir):
    """
    Parse all weaves.md files and extract weave items.
    
    Expected format:
    ### Weave Name
    Description and details...
    """
    items = []
    
    # List of weave files to parse
    weave_files = [
        'weaves(a-g).md',
        'weaves(h-m).md',
        'weaves(n-r).md',
        'weaves(s-z).md'
    ]
    
    for weave_file in weave_files:
        md_path = ttrpg_dir / weave_file
        if not md_path.exists():
            print(f"  Warning: {weave_file} not found")
            continue
        
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by weave sections (### Heading)
        sections = re.split(r'^### ', content, flags=re.MULTILINE)[1:]
        
        for section in sections:
            lines = section.split('\n')
            weave_name = lines[0].strip()
            
            if not weave_name:
                continue
            
            item = {
                '_id': generate_id(),
                'name': weave_name,
                'type': 'weave',
                'img': 'icons/magic/abjuration/abjuration-purple.webp',
                'system': {
                    'description': {'value': ''},
                    'weaveType': '',
                    'actionCost': 1,
                    'energyCost': {
                        'primary': {'type': '', 'cost': 0},
                        'supporting': {'type': '', 'cost': 0}
                    },
                    'school': '',
                    'range': {'value': '', 'distance': 0},
                    'target': '',
                    'areaSize': '',
                    'duration': '',
                    'durationDetail': '',
                    'saveType': 'none',
                    'saveEffect': '',
                    'effectType': '',
                    'damage': {'base': 0, 'type': '', 'drInteraction': '', 'scaling': ''},
                    'healing': {'base': 0, 'scaling': ''},
                    'conditions': '',
                    'successEffects': '',
                    'specialProperties': '',
                    'heightening': ''
                },
                'effects': []
            }

            # Extract description
            description = '\n'.join(lines[1:]).strip()
            item['system']['description'] = {'value': apply_enrichers(md_to_html(description))}

            # Try to parse energy costs from description
            primary_match = re.search(r'\*\*Primary Energy:\*\*\s*(\w+)\s+(\d+)', description)
            if primary_match:
                item['system']['energyCost']['primary']['type'] = primary_match.group(1).lower()
                item['system']['energyCost']['primary']['cost'] = int(primary_match.group(2))
            supporting_match = re.search(r'\*\*Supporting Energy:\*\*\s*(\w+)\s+(\d+)', description)
            if supporting_match:
                item['system']['energyCost']['supporting']['type'] = supporting_match.group(1).lower()
                item['system']['energyCost']['supporting']['cost'] = int(supporting_match.group(2))
                item['system']['weaveType'] = 'complex'
            elif primary_match:
                item['system']['weaveType'] = 'simple'
            
            # Extract image path if specified
            img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', description)
            if img_match:
                item['img'] = img_match.group(1).strip()
            
            items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    ttrpg_dir = script_dir / "ttrpg"
    
    # Parse from markdown
    if ttrpg_dir.exists():
        print("Parsing weaves.md files...")
        items = parse_weaves_md(ttrpg_dir)
        print(f"  Extracted {len(items)} weave items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "weaves" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            filename = _safe_filename(item['name']) + '.json'
            json_file = source_dir / filename
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding weaves pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "weaves"
    success = build_pack_from_source(pack_dir, "weaves")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
