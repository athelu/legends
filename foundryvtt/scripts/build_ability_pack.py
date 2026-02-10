#!/usr/bin/env python3
"""
Build abilities compendium pack from JSON source files.

Abilities are custom items that represent special powers, passive benefits,
class features, etc. Since they're not defined in a single markdown file,
they should be created as JSON files in _source/ and this script will build
them into a pack.

To create abilities:
1. Create JSON files in foundryvtt/packs/abilities/_source/
2. Example format:
   {
     "_id": "ability-id-here",
     "name": "Ability Name",
     "type": "ability",
     "img": "icons/svg/item-bag.svg",
     "system": {
       "description": "What this ability does"
     }
   }
3. Run this script to build the pack
"""

import json
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key
import re
import json


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Build the pack from existing _source/ JSON files
    print("Building abilities pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "abilities"
    
    source_dir = pack_dir / "_source"
    source_dir.mkdir(parents=True, exist_ok=True)

    # Parse `ttrpg/ability.md` to create any missing ability sources (idempotent)
    md_file = script_dir / 'ttrpg' / 'ability.md'
    if md_file.exists():
        content = md_file.read_text(encoding='utf-8')
        # Respect optional PACK marker
        m = re.search(r"<!--\s*PACK:abilities?\s*-->", content, flags=re.IGNORECASE)
        if m:
            content = content[m.end():]

        # Load existing slugs to avoid creating duplicates
        existing = {p.stem for p in source_dir.glob('*.json')}

        # Split by level-4 headings (#### Name)
        parts = re.split(r'^####\s+', content, flags=re.MULTILINE)[1:]
        created = 0
        for part in parts:
            lines = part.strip().splitlines()
            if not lines:
                continue
            name = lines[0].strip()
            body = '\n'.join(lines[1:]).strip()
            # Clean bullets and common bolded keys
            body = re.sub(r'^-\s*\*\*Effect:\*\*\s*', '', body, flags=re.IGNORECASE)
            body = re.sub(r'^-\s*', '', body, flags=re.MULTILINE)
            body = body.replace('**', '')

            slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip('-') or f"ability-{created+1}"
            out_file = source_dir / f"{slug}.json"
            if out_file.stem in existing:
                continue

            item = {
                '_id': generate_id(),
                'name': name,
                'type': 'ability',
                'img': 'icons/svg/magic.svg',
                'system': {
                    'description': {'value': body}
                },
                'effects': []
            }

            with open(out_file, 'w', encoding='utf-8') as fh:
                ensure_key(item)
                json.dump(item, fh, indent=2, ensure_ascii=False)
            created += 1
            print(f"  Created ability source: {out_file.name}")
        if created == 0:
            print("  No new abilities parsed from ability.md (existing files kept).")

    # Ensure at least an example exists
    if not any(source_dir.glob('*.json')):
        template = {
            "_id": "ability-template-1",
            "name": "Example Ability",
            "type": "ability",
            "img": "icons/svg/item-bag.svg",
            "system": {
                "description": {"value": "This is an example ability. Edit or delete this file and add your own abilities."}
            }
        }
        template_file = source_dir / "example-ability.json"
        with open(template_file, 'w', encoding='utf-8') as f:
            json.dump(template, f, indent=2, ensure_ascii=False)
        print(f"  Created template: {template_file.name}")
    
    success = build_pack_from_source(pack_dir, "abilities")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
