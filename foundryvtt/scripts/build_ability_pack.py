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
from pack_utils import build_pack_from_source


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Build the pack from existing _source/ JSON files
    print("Building abilities pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "abilities"
    
    source_dir = pack_dir / "_source"
    if not source_dir.exists() or not any(source_dir.glob('*.json')):
        print(f"  Source directory missing or empty: {source_dir}")
        print("  Creating abilities pack structure and example file...")
        source_dir.mkdir(parents=True, exist_ok=True)

        # Create a template ability so the builder has at least one file
        template = {
            "_id": "ability-template-1",
            "name": "Example Ability",
            "type": "ability",
            "img": "icons/svg/item-bag.svg",
            "system": {
                "description": "This is an example ability. Edit or delete this file and add your own abilities."
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
