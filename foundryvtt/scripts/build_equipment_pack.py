#!/usr/bin/env python3
"""
Build equipment compendium pack from ttrpg/equipment.md or _source JSON files.

The markdown parser classifies entries into the equipment schema used by the
equipment item sheet and emits deterministic IDs so rebuilds are stable.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_stable_id, ensure_key, md_to_html, apply_enrichers


TOOL_SKILL_MAP = {
    "artisan's tools": 'Craft',
    "artist's tools": 'Perform',
    "carpenter's tools": 'Craft: Carpenter',
    'disguise kit': 'Deception',
    'herbalism kit': 'Medicine',
    'musical instrument, basic': 'Perform',
    'musical instrument, standard': 'Perform',
    'musical instrument, fine': 'Perform',
    'sewing kit': 'Craft: Tailor',
    "smith's tools": 'Craft: Smith',
}

CONTAINER_KEYWORDS = {
    'backpack', 'map case', 'pouch', 'purse', 'quiver', 'rucksack',
    'saddlebags', 'satchel', 'scrollcase', 'wineskin'
}

CLOTHING_KEYWORDS = {
    'apron', 'belt', 'blanket', 'boots', 'cape', 'cloak', 'clothes', 'gloves',
    'hat', 'hood', 'hose', 'pants', 'robe', 'shirt', 'shoes', 'tunic', 'uniform'
}

CONSUMABLE_KEYWORDS = {
    'fruit, dried', 'grain, dried', 'hardtack', 'incense, stick',
    'meat, salted/cured', 'soap'
}

LIGHT_SOURCE_KEYWORDS = {'candle', 'lamp', 'lantern', 'torch'}


def generate_equipment_id(name: str) -> str:
    return generate_stable_id(f'equipment:{name}')


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


def parse_gp(text: str | None) -> float:
    if not text:
        return 0
    match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(gp|sp|cp)', text, flags=re.IGNORECASE)
    if not match:
        return 0
    value = float(match.group(1))
    unit = match.group(2).lower()
    if unit == 'sp':
        value /= 10.0
    elif unit == 'cp':
        value /= 100.0
    return value


def parse_lbs(text: str | None) -> float:
    if not text:
        return 0
    match = re.search(r'([0-9]+(?:\.[0-9]+)?)', text)
    return float(match.group(1)) if match else 0


def extract_cost_weight(section_body: str) -> tuple[str | None, str | None]:
    match = re.search(r"\*\*Cost:\*\*\s*([^|\n]+)(?:\|\s*\*\*Weight:\*\*\s*([^\n]+))?", section_body)
    if not match:
        return None, None
    cost = match.group(1).strip()
    weight = match.group(2).strip() if match.group(2) else None
    return cost, weight


def strip_header_fields(section_body: str) -> str:
    description = re.sub(r'\*\*Cost:\*\*[^\n]*', '', section_body).strip()
    description = re.sub(r'\*\*Weight:\*\*[^\n]*', '', description).strip()
    return description


def classify_equipment(name: str, description: str) -> str:
    lower_name = name.lower()
    lower_description = description.lower()

    if any(keyword in lower_name for keyword in LIGHT_SOURCE_KEYWORDS):
        return 'light-source'

    if lower_name in CONSUMABLE_KEYWORDS or 'provides one day' in lower_description or 'used for washing' in lower_description:
        return 'consumable'

    if any(keyword in lower_name for keyword in CONTAINER_KEYWORDS):
        return 'container'

    if 'tools' in lower_name or 'kit' in lower_name or 'instrument' in lower_name:
        return 'tools'

    if any(keyword in lower_name for keyword in CLOTHING_KEYWORDS):
        return 'clothing'

    return 'adventuring-gear'


def extract_light_fields(description: str) -> tuple[int, int, str, str]:
    lower_description = description.lower()
    bright_light = 0
    dim_light = 0
    duration = ''
    properties = ''

    light_match = re.search(
        r'bright light in (?:a|an) (\d+)-foot (radius|cone) and dim light for an additional (\d+) feet',
        lower_description,
    )
    if light_match:
        bright_light = int(light_match.group(1))
        dim_light = int(light_match.group(3))
        if light_match.group(2) == 'cone':
            properties = 'Projects light in a cone rather than a radius.'

    duration_match = re.search(r'burns?(?:\s+[a-z-]+)*\s+for\s+([^,.;]+)', description, flags=re.IGNORECASE)
    if duration_match:
        duration = duration_match.group(1).strip()

    return bright_light, dim_light, duration, properties


def extract_capacity(description: str) -> str:
    patterns = [
        r'capable of carrying up to ([^.]+?)(?:\.|$)',
        r'holds up to ([^.]+?)(?:\.|$)',
        r'holds approximately ([^.]+?)(?:\.|$)',
        r'can accommodate ([^.]+?)(?:\.|$)',
    ]
    for pattern in patterns:
        match = re.search(pattern, description, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ''


def infer_tool_fields(name: str) -> tuple[str, int]:
    return TOOL_SKILL_MAP.get(name.lower(), ''), 0


def infer_consumable_fields(name: str, category: str, description: str) -> tuple[dict, bool]:
    lower_name = name.lower()
    lower_description = description.lower()

    if category == 'consumable':
        return {'value': 1, 'max': 1}, True

    if category == 'light-source' and ('candle' in lower_name or 'torch' in lower_name or 'incense' in lower_name):
        return {'value': 1, 'max': 1}, True

    if 'one day' in lower_description:
        return {'value': 1, 'max': 1}, True

    return {'value': 0, 'max': 0}, False


def build_equipment_item(name: str, body: str) -> dict:
    cost_text, weight_text = extract_cost_weight(body)
    description = strip_header_fields(body)
    equipment_type = classify_equipment(name, description)

    bright_light = 0
    dim_light = 0
    duration = ''
    properties = ''
    if equipment_type == 'light-source':
        bright_light, dim_light, duration, properties = extract_light_fields(description)

    capacity = extract_capacity(description) if equipment_type == 'container' else ''
    associated_skill, tool_bonus = infer_tool_fields(name) if equipment_type == 'tools' else ('', 0)
    uses, consumable = infer_consumable_fields(name, equipment_type, description)

    return {
        '_id': generate_equipment_id(name),
        'name': name,
        'type': 'equipment',
        'img': 'icons/svg/item-bag.svg',
        'system': {
            'description': {'value': apply_enrichers(md_to_html(description))},
            'equipmentType': equipment_type,
            'weight': parse_lbs(weight_text),
            'cost': parse_gp(cost_text),
            'quantity': 1,
            'equipped': False,
            'capacity': capacity,
            'brightLight': bright_light,
            'dimLight': dim_light,
            'duration': duration,
            'uses': uses,
            'consumable': consumable,
            'associatedSkill': associated_skill,
            'toolBonus': tool_bonus,
            'rarity': '',
            'requiresAttunement': False,
            'magicalProperties': '',
            'properties': properties,
            'notes': ''
        },
        'effects': []
    }


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

            body = '\n'.join(lines[1:]).strip()
            items.append(build_equipment_item(name, body))

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
                "_id": generate_equipment_id("Example Equipment"),
                "name": "Example Equipment",
                "type": "equipment",
                "img": "icons/svg/item-bag.svg",
                "system": {
                    "description": {
                        "value": "<p>This is an example equipment item. Edit or delete this file and add your own equipment.</p>"
                    },
                    "equipmentType": "adventuring-gear",
                    "weight": 1,
                    "cost": 1,
                    "quantity": 1,
                    "equipped": False,
                    "capacity": "",
                    "brightLight": 0,
                    "dimLight": 0,
                    "duration": "",
                    "uses": {
                        "value": 0,
                        "max": 0
                    },
                    "consumable": False,
                    "associatedSkill": "",
                    "toolBonus": 0,
                    "rarity": "",
                    "requiresAttunement": False,
                    "magicalProperties": "",
                    "properties": "",
                    "notes": ""
                },
                "effects": []
            }

            template_file = source_dir / "example-equipment.json"
            with open(template_file, 'w', encoding='utf-8') as f:
                ensure_key(template)
                json.dump(template, f, indent=2, ensure_ascii=False)
            print(f"  Created template: {template_file.name}")

    success = build_pack_from_source(pack_dir, "equipment")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
