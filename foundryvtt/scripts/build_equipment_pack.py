#!/usr/bin/env python3
"""
Build equipment compendium pack from JSON source files.

Equipment items are typically manually created or imported from Foundry
since they don't have a dedicated markdown file.

To create equipment:
1. Create JSON files in foundryvtt/packs/equipment/_source/
2. Example format:
   {
     "_id": "equipment-id",
     "name": "Equipment Name",
     "type": "equipment",
     "img": "icons/svg/item-bag.svg",
     "system": {
       "description": "Equipment description",
       "weight": "X lbs",
       "cost": "X gp"
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
    print("Building equipment pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "equipment"
    
    source_dir = pack_dir / "_source"
    if not source_dir.exists() or not any(source_dir.glob('*.json')):
        print(f"  Source directory missing or empty: {source_dir}")
        print("  Creating equipment pack structure and example file...")
        source_dir.mkdir(parents=True, exist_ok=True)

        # Create a template equipment so the builder has at least one file
        template = {
            "_id": "equipment-template-1",
            "name": "Example Equipment",
            "type": "equipment",
            "img": "icons/svg/item-bag.svg",
            "system": {
                "description": "This is an example equipment item. Edit or delete this file and add your own equipment.",
                "weight": "1 lb",
                "cost": "1 gp"
            }
        }

        template_file = source_dir / "example-equipment.json"
        with open(template_file, 'w', encoding='utf-8') as f:
            json.dump(template, f, indent=2, ensure_ascii=False)
        print(f"  Created template: {template_file.name}")
    
    success = build_pack_from_source(pack_dir, "equipment")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
