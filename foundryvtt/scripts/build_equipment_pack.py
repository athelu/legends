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
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key


def slugify(name: str) -> str:
    """Create a filesystem-safe slug from an item name.

    - lowercases
    - removes punctuation
    - replaces whitespace and slashes with hyphens
    - collapses multiple hyphens
    """
    s = name.lower()
    # replace slashes with hyphens first so 'a/b' -> 'a-b'
    s = re.sub(r"[\\/]+", "-", s)
    # remove characters that are not word chars, spaces, or hyphens
    s = re.sub(r"[^\w\s-]", "", s)
    # replace runs of whitespace with a single hyphen
    s = re.sub(r"[\s]+", "-", s)
    # collapse multiple hyphens
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def main():
    script_dir = Path(__file__).parent.parent.parent
    # Build the pack from existing _source/ JSON files or from markdown
    print("Building equipment pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "equipment"

    source_dir = pack_dir / "_source"

    # If equipment.md exists, parse it and generate _source JSON files
    md_file = script_dir / "ttrpg" / "equipment.md"
    if md_file.exists():
        print(f"  Parsing markdown: {md_file}")
        content = md_file.read_text(encoding='utf-8')

        # If a PACK marker is present, only import content after it.
        m = re.search(r"<!--\s*PACK:equipment\s*-->", content, flags=re.IGNORECASE)
        if m:
            content = content[m.end():]

        # Split by equipment description headings (### Item)
        sections = re.split(r'^###\s+', content, flags=re.MULTILINE)[1:]

        items = []
        for section in sections:
            lines = section.split('\n')
            name = lines[0].strip()
            if not name:
                continue

            rest = '\n'.join(lines[1:]).strip()

            # Extract cost and weight from the leading line if present
            cost = None
            weight = None

            # Look for a line like '**Cost:** 15 gp | **Weight:** 2 lbs'
            m = re.search(r"\*\*Cost:\*\*\s*([^|\n]+)(?:\|\s*\*\*Weight:\*\*\s*([^\n]+))?", rest)
            if m:
                cost = m.group(1).strip()
                if m.group(2):
                    weight = m.group(2).strip()

            # Remove cost/weight markup from description
            description = re.sub(r"\*\*Cost:\*\*[^\n]*", "", rest).strip()
            description = re.sub(r"\*\*Weight:\*\*[^\n]*", "", description).strip()

            item = {
                '_id': generate_id(),
                'name': name,
                'type': 'equipment',
                'img': 'icons/svg/item-bag.svg',
                'system': {
                    'description': description,
                    'weight': weight or "",
                    'cost': cost or ""
                },
                'effects': []
            }

            items.append(item)

        if items:
            source_dir.mkdir(parents=True, exist_ok=True)
            slugs = []
            for item in items:
                safe_name = slugify(item['name'])
                slugs.append(safe_name)
                json_file = source_dir / f"{safe_name}.json"
                with open(json_file, 'w', encoding='utf-8') as f:
                    ensure_key(item)
                    json.dump(item, f, indent=2, ensure_ascii=False)
                print(f"  Saved {json_file.name}")

            # Remove legacy/unsanitized files that map to the same canonical slug
            expected_slugs = set(slugs)
            # canonicalize by removing non-alphanumeric so earlier variants match
            def canon(s: str) -> str:
                return re.sub(r"[^a-z0-9]", "", s.lower())

            expected_canon = {canon(s) for s in expected_slugs}
            # map canonical -> preferred slug so we can compute the expected filename
            expected_map = {canon(s): s for s in expected_slugs}
            for existing in list(source_dir.glob('*.json')):
                stem = existing.stem
                mapped = slugify(stem)
                existing_canon = canon(mapped)
                if existing_canon in expected_map:
                    expected_slug = expected_map[existing_canon]
                    expected_name = f"{expected_slug}.json"
                    if existing.name != expected_name:
                        try:
                            existing.unlink()
                            print(f"  Removed duplicate file: {existing.name}")
                        except Exception:
                            print(f"  Failed to remove duplicate file: {existing.name}")

    else:
        # If no markdown and no source, create template
        if not source_dir.exists() or not any(source_dir.glob('*.json')):
            print(f"  Source directory missing or empty: {source_dir}")
            print("  Creating equipment pack structure and example file...")
            source_dir.mkdir(parents=True, exist_ok=True)

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
