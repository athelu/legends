#!/usr/bin/env python3
"""
Build backgrounds compendium pack from parsed backgrounds.md documentation.

The builder extracts structured skill ranks, XP, feature text, and starter item
grants from the canonical backgrounds rules and emits deterministic IDs so the
pack can be rebuilt without churn.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_stable_id, validate_items, ensure_key, md_to_html, apply_enrichers


SKILL_MAP = {
    'athletics': 'athletics',
    'might': 'might',
    'devices': 'devices',
    'thievery': 'thievery',
    'writing': 'writing',
    'ranged combat': 'rangedCombat',
    'craft': 'craft',
    'acrobatics': 'acrobatics',
    'melee combat': 'meleeCombat',
    'stealth': 'stealth',
    'investigate': 'investigate',
    'investigation': 'investigate',
    'language': 'language',
    'history': 'history',
    'arcane': 'arcane',
    'arcana': 'arcane',
    'society': 'society',
    'perception': 'perception',
    'empathy': 'empathy',
    'medicine': 'medicine',
    'wilderness': 'wilderness',
    'religion': 'religion',
    'persuasion': 'persuasion',
    'intimidate': 'intimidate',
    'intimidation': 'intimidate',
    'perform': 'perform',
    'deception': 'deception',
}


DIRECT_ITEM_GRANTS = {
    'iron holy symbol': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Holy Symbol, Iron'},
    'prayer book': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Book, Prayer'},
    'robe': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Robe'},
    'incense stick': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Incense, Stick'},
    'common clothes': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Clothes, Common'},
    'shoes': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Shoes'},
    'journal': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Journal'},
    'map case': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Map Case'},
    'travelers clothes': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': "Clothes, Traveler's"},
    'artisans tools choose type': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': "Artisan's Tools"},
    'artisans tools': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': "Artisan's Tools"},
    'belt pouch': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Pouch, Belt'},
    'artists tools': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': "Artist's Tools"},
    'fine clothes': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Clothes, Fine'},
    'hemp rope': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Rope, Jute/Hemp'},
    'lime bast rope': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Rope, Lime Bast'},
    'low boots': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Boots, Low'},
    'razor': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Razor'},
    'scissors': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Scissors'},
    'comb': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Comb'},
    'soap': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Soap'},
    'apron': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Apron'},
    'quill': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Quill'},
    'ink': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Ink, 1 oz'},
    'vellum parchment': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Parchment, Vellum'},
    'papyrus parchment': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Parchment, Papyrus'},
    'abacus': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Abacus'},
    'cleaver': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Cleaver'},
    'meat hook': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Meat Hook'},
    'work clothes': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Clothes, Work'},
    'carpenters tools': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': "Carpenter's Tools"},
    'work gloves': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Gloves, Work'},
    'disguise kit': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Disguise Kit'},
    'perfume': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Perfume'},
    'signet ring': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Signet Ring'},
    'riding boots': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Boots, Riding'},
    'crowbar': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Crowbar'},
    'wool hood': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Hood, Wool'},
    'whip': {'mode': 'reference', 'itemType': 'weapon', 'pack': 'legends.weapons', 'sourceName': 'Whip'},
    'bedroll': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Bedroll'},
    'basic musical instrument': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Musical Instrument, Basic'},
    'net': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Net'},
    'dice set': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Dice Set'},
    'uniform': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Uniform/Livery'},
    'livery': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Uniform/Livery'},
    'uniform or livery': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Uniform/Livery'},
    'manacles': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Manacles'},
    'herbalism kit': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Herbalism Kit'},
    'mortar and pestle': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Mortar and Pestle'},
    'magnifying glass': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Magnifying Glass'},
    'lantern': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Lantern'},
    'tent': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Tent'},
    'waterskin': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Waterskin'},
    'general topic book': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Book, General Topic'},
    'belt knife': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Knife, Belt'},
    'sling': {'mode': 'reference', 'itemType': 'weapon', 'pack': 'legends.weapons', 'sourceName': 'Sling'},
    'smiths tools': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': "Smith's Tools"},
    'hammer': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Hammer'},
    'sewing kit': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Sewing Kit'},
    'high boots': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Boots, High'},
    'work boots': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Boots, Work'},
    'arrows bolts': {'mode': 'reference', 'itemType': 'equipment', 'pack': 'legends.equipment', 'sourceName': 'Arrows/Bolts'},
}


CHOICE_ITEM_GRANTS = {
    'spear or club': {
        'mode': 'choice',
        'itemType': 'weapon',
        'options': [
            {'mode': 'reference', 'itemType': 'weapon', 'pack': 'legends.weapons', 'sourceName': 'Spear'},
            {'mode': 'reference', 'itemType': 'weapon', 'pack': 'legends.weapons', 'sourceName': 'Club'},
        ],
    },
    'bow or crossbow': {
        'mode': 'choice',
        'itemType': 'weapon',
        'options': [
            {'mode': 'reference', 'itemType': 'weapon', 'pack': 'legends.weapons', 'sourceName': 'Shortbow'},
            {'mode': 'reference', 'itemType': 'weapon', 'pack': 'legends.weapons', 'sourceName': 'Longbow'},
            {'mode': 'reference', 'itemType': 'weapon', 'pack': 'legends.weapons', 'sourceName': 'Light Crossbow'},
            {'mode': 'reference', 'itemType': 'weapon', 'pack': 'legends.weapons', 'sourceName': 'Heavy Crossbow'},
        ],
    },
    'weapon of choice': {
        'mode': 'weapon-choice',
        'itemType': 'weapon',
        'pack': 'legends.weapons',
    },
}


def generate_background_item_id(name: str) -> str:
    return generate_stable_id(f'background:{name}')


def slugify(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[\\/]+", '-', slug)
    slug = re.sub(r"[^\w\s-]", '', slug)
    slug = re.sub(r"\s+", '-', slug)
    slug = re.sub(r"-+", '-', slug)
    return slug.strip('-')


def normalize_equipment_entry(text: str) -> str:
    return re.sub(r'\s+', ' ', re.sub(r'[,:]', ' ', re.sub(r'\([^)]*\)', ' ', text.lower().replace('’', '').replace("'", '').replace('/', ' ')))).strip()


def load_source_catalog(script_dir: Path):
    catalog = {}

    for pack_name, item_type in [('equipment', 'equipment'), ('weapons', 'weapon')]:
        source_dir = script_dir / 'foundryvtt' / 'packs' / pack_name / '_source'
        if not source_dir.exists():
            continue

        for json_file in source_dir.glob('*.json'):
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            catalog[(pack_name, data['name'])] = {
                'itemType': item_type,
                'pack': f'legends.{pack_name}',
                'sourceId': data.get('_id'),
                'sourceName': data['name'],
            }

    return catalog


def parse_skill_bonuses(text: str):
    skills = {}
    starting_xp = 0

    for raw_part in text.split(','):
        part = raw_part.strip()
        if not part:
            continue

        xp_match = re.match(r'^\+?(\d+)\s*xp$', part, flags=re.IGNORECASE)
        if xp_match:
            starting_xp = int(xp_match.group(1))
            continue

        skill_match = re.match(r'^(.+?)\s+(\d+)$', part)
        if not skill_match:
            continue

        skill_name = skill_match.group(1).strip().lower()
        skill_key = SKILL_MAP.get(skill_name)
        if not skill_key:
            continue

        skills[skill_key] = int(skill_match.group(2))

    return skills, starting_xp


def resolve_item_grant(raw_entry: str, catalog: dict):
    text = raw_entry.strip()
    if not text:
        return None

    quantity_match = re.search(r'\bx\s*(\d+)\s*$', text, flags=re.IGNORECASE)
    quantity = int(quantity_match.group(1)) if quantity_match else 1
    without_quantity = text[:quantity_match.start()].strip() if quantity_match else text
    normalized = normalize_equipment_entry(without_quantity)

    if normalized in CHOICE_ITEM_GRANTS:
        grant = json.loads(json.dumps(CHOICE_ITEM_GRANTS[normalized]))
        grant['quantity'] = quantity
        grant['originalText'] = text
        if 'options' in grant:
            for option in grant['options']:
                option['quantity'] = quantity
                option.update(catalog.get((option['pack'].split('.')[-1], option['sourceName']), {}))
        return grant

    if normalized in DIRECT_ITEM_GRANTS:
        grant = dict(DIRECT_ITEM_GRANTS[normalized])
        grant['quantity'] = quantity
        grant['originalText'] = text
        if 'pack' in grant:
            resolved = catalog.get((grant['pack'].split('.')[-1], grant['sourceName']))
            if resolved:
                grant.update(resolved)
        return grant

    return {
        'mode': 'placeholder',
        'itemType': 'equipment',
        'sourceName': without_quantity,
        'quantity': quantity,
        'originalText': text,
    }


def parse_backgrounds_md(md_file):
    """
    Parse backgrounds.md and extract background items.
    
    Expected format:
    ### Background Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # If a PACK marker is present, only import content after it.
    m = re.search(r"<!--\s*PACK:backgrounds\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    script_dir = Path(md_file).parent.parent
    catalog = load_source_catalog(script_dir)
    items = []
    
    # Split by background sections (#### Heading used for individual backgrounds)
    sections = re.split(r'^#### ', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        # Skip metadata sections
        if item_name in ['Background Patterns', 'Backgrounds (Alphabetical)']:
            continue
        
        if not item_name:
            continue
        
        body_lines = [line.rstrip() for line in lines[1:]]
        description_lines = []
        skills_text = ''
        equipment_text = ''
        feature_text = ''

        for line in body_lines:
            stripped = line.strip()
            if stripped.startswith('**Skills:**'):
                skills_text = stripped.replace('**Skills:**', '', 1).strip()
            elif stripped.startswith('**Equipment:**'):
                equipment_text = stripped.replace('**Equipment:**', '', 1).strip()
            elif stripped.startswith('**Feature**'):
                feature_text = re.sub(r'^\*\*Feature\*\*\s*-\s*', '', stripped).strip()
            elif stripped:
                description_lines.append(stripped)

        granted_skills, starting_xp = parse_skill_bonuses(skills_text)
        item_grants = [grant for grant in (resolve_item_grant(entry, catalog) for entry in re.split(r'\r?\n|,', equipment_text)) if grant]

        item = {
            '_id': generate_background_item_id(item_name),
            'name': item_name,
            'type': 'background',
            'img': 'icons/svg/book.svg',
            'system': {
                'description': {'value': ''},
                'startingXP': starting_xp,
                'skillBonuses': skills_text,
                'startingEquipment': '\n'.join(entry.strip() for entry in equipment_text.split(',') if entry.strip()),
                'suggestedFeats': '',
                'features': feature_text,
                'sampleNames': '',
                'traits': '',
                'notes': '',
                'grantedSkills': granted_skills,
                'itemGrants': item_grants,
            },
            'effects': []
        }

        # Extract narrative description only; structured metadata is stored separately.
        description = '\n'.join(description_lines).strip()
        item['system']['description'] = {'value': apply_enrichers(md_to_html(description))}
        
        # Extract image path if specified
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "backgrounds.md"
    if md_file.exists():
        print("Parsing backgrounds.md...")
        items = parse_backgrounds_md(md_file)
        print(f"  Extracted {len(items)} background items from documentation")
        
        items = validate_items(items)

        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "backgrounds" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)

        for stale_file in source_dir.glob('*.json'):
            stale_file.unlink()
        
        for item in items:
            json_file = source_dir / f"{slugify(item['name'])}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding backgrounds pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "backgrounds"
    success = build_pack_from_source(pack_dir, "backgrounds")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
