#!/usr/bin/env python3
"""
Build armor compendium pack from parsed armor.md documentation.

The parser preserves shield linkedAbilities for equip-time character sheet hooks
while also filling the explicit shield and armor metadata fields used by the
current item sheets.
"""

import json
import re
import shutil
import subprocess
from pathlib import Path

from pack_utils import build_pack_from_source, generate_stable_id, ensure_key, md_to_html, apply_enrichers


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[\\/]+", "-", s)
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-") or "item"


def generate_armor_item_id(item_type: str, name: str) -> str:
    normalized_name = re.sub(r'\s+', ' ', name).strip().lower()
    return generate_stable_id(f'{item_type}:{normalized_name}')


def extract_top_level_section(content: str, title: str, next_title: str | None = None) -> str:
    heading_match = re.search(rf'^##\s+{re.escape(title)}\s*$', content, flags=re.MULTILINE)
    if not heading_match:
        return ''

    section = content[heading_match.end():]
    section = re.sub(r'^\s*---\s*\n?', '', section, count=1)

    if next_title:
        next_match = re.search(rf'^##\s+{re.escape(next_title)}\s*$', section, flags=re.MULTILINE)
        if next_match:
            section = section[:next_match.start()]

    return section.strip()


def split_heading_sections(block: str, heading_pattern: str):
    matches = list(re.finditer(heading_pattern, block, flags=re.MULTILINE))
    sections = []

    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(block)
        sections.append((match.group(1).strip(), block[start:end].strip()))

    return sections


def parse_bold_metadata(section_text: str) -> dict[str, str]:
    meta: dict[str, str] = {}
    current_key = None
    current_lines: list[str] = []

    def flush_current():
        nonlocal current_key, current_lines
        if current_key:
            value = '\n'.join(line.rstrip() for line in current_lines).strip()
            if current_key in meta and meta[current_key] and value:
                meta[current_key] = f"{meta[current_key]}\n\n{value}"
            else:
                meta[current_key] = value
        current_key = None
        current_lines = []

    for line in section_text.splitlines():
        match = re.match(r'^\s*-\s*\*\*([^*]+?):\*\*\s*(.*)$', line)
        if match:
            flush_current()
            current_key = match.group(1).strip().rstrip(':').lower()
            current_lines = [match.group(2).rstrip()]
            continue

        if current_key and (line.startswith('    ') or line.startswith('\t')):
            current_lines.append(line.rstrip())
            continue

        if current_key and not line.strip():
            current_lines.append('')
            continue

        flush_current()

    flush_current()
    return meta


def strip_metadata_lines(section_text: str) -> str:
    cleaned_lines = []
    skipping_metadata = False

    for line in section_text.splitlines():
        if re.match(r'^\s*-\s*\*\*[^*]+?:\*\*\s*', line):
            skipping_metadata = True
            continue

        if skipping_metadata and (line.startswith('    ') or line.startswith('\t') or not line.strip()):
            continue

        skipping_metadata = False
        cleaned_lines.append(line)

    return '\n'.join(cleaned_lines).strip()


def extract_keywords(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [keyword.strip() for keyword in re.findall(r'\[([^\]]+)\]', raw) if keyword.strip()]


def split_metadata_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [part.strip() for part in re.split(r'[;,]+', raw) if part.strip()]


def link_source_items(source_dir: Path, names: list[str]) -> list[dict[str, str | None]]:
    linked_items = []

    for raw_name in names:
        clean_name = re.sub(r"[*`\-]+", "", raw_name).strip()
        if not clean_name:
            continue

        candidate = source_dir / f"{slugify(clean_name)}.json"
        linked_id = None
        if candidate.exists():
            try:
                with open(candidate, 'r', encoding='utf-8') as file_handle:
                    linked_id = json.load(file_handle).get('_id')
            except Exception:
                linked_id = None

        linked_items.append({'name': clean_name, '_id': linked_id})

    return linked_items


def parse_armor_md(md_file):
    """
    Parse armor.md and extract shield and armor items.
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    marker = re.search(r"<!--\s*PACK:armor\s*-->", content, flags=re.IGNORECASE)
    if marker:
        content = content[marker.end():]

    items = []
    script_root = Path(__file__).parent.parent.parent
    action_source_dir = script_root / 'foundryvtt' / 'packs' / 'action' / '_source'
    ability_source_dir = script_root / 'foundryvtt' / 'packs' / 'abilities' / '_source'

    def parse_money_to_gp(raw: str):
        if not raw:
            return None
        s = raw.lower()
        gp = 0.0
        for pattern, scale in ((r"(\d+(?:\.\d+)?)\s*gp", 1.0), (r"(\d+(?:\.\d+)?)\s*sp", 0.1), (r"(\d+(?:\.\d+)?)\s*cp", 0.01)):
            match = re.search(pattern, s)
            if match:
                try:
                    gp += float(match.group(1)) * scale
                except Exception:
                    pass
        return gp if gp != 0.0 else None

    def parse_weight(raw: str):
        if not raw:
            return None
        match = re.search(r"(\d+(?:\.\d+)?)", raw)
        if not match:
            return None
        try:
            return float(match.group(1))
        except Exception:
            return None

    def parse_dr(raw: str):
        if not raw:
            return None
        s = raw.strip()
        match = re.search(r"(\d+)\s*/\s*(\d+)\s*/\s*(\d+)", s)
        if match:
            return (int(match.group(1)), int(match.group(2)), int(match.group(3)))

        slash = re.search(r"[Ss]lashing[:\s]*(\d+)", s)
        pierce = re.search(r"[Pp]iercing[:\s]*(\d+)", s)
        bludgeoning = re.search(r"[Bb]ludgeon(?:ing)?[:\s]*(\d+)", s)
        if slash or pierce or bludgeoning:
            return (
                int(slash.group(1)) if slash else 0,
                int(pierce.group(1)) if pierce else 0,
                int(bludgeoning.group(1)) if bludgeoning else 0,
            )

        parts = re.findall(r"([A-Za-z]+)\s*(\d+)", s)
        if parts:
            values = {'slashing': 0, 'piercing': 0, 'bludgeoning': 0}
            for key, value in parts:
                lowered = key.lower()
                if 'slash' in lowered:
                    values['slashing'] = int(value)
                elif 'pierc' in lowered:
                    values['piercing'] = int(value)
                elif 'blud' in lowered or 'bludge' in lowered:
                    values['bludgeoning'] = int(value)
            return (values['slashing'], values['piercing'], values['bludgeoning'])

        return None

    shield_content = extract_top_level_section(content, 'Shields', 'Armor Types')
    armor_content = extract_top_level_section(content, 'Armor Types')

    for item_name, section_text in split_heading_sections(shield_content, r'^###\s+(.+)$'):
        meta = parse_bold_metadata(section_text)
        granted_abilities = split_metadata_list(meta.get('granted ability') or meta.get('granted abilities'))
        reactions = split_metadata_list(meta.get('granted reactions') or meta.get('reactions'))

        description_parts = []
        if meta.get('description'):
            description_parts.append(meta['description'])
        narrative = strip_metadata_lines(section_text)
        if narrative:
            description_parts.append(narrative)
        if meta.get('special'):
            description_parts.append(meta['special'])
        if meta.get('planted mode'):
            description_parts.append(f"Planted Mode:\n{meta['planted mode']}")
        if meta.get('carried mode'):
            description_parts.append(f"Carried Mode: {meta['carried mode']}")

        special_parts = []
        if meta.get('special'):
            special_parts.append(meta['special'])
        if meta.get('planted mode'):
            special_parts.append(f"Planted Mode:\n{meta['planted mode']}")
        if meta.get('carried mode'):
            special_parts.append(f"Carried Mode: {meta['carried mode']}")

        item = {
            '_id': generate_armor_item_id('shield', item_name),
            'name': item_name,
            'type': 'shield',
            'img': meta.get('image', 'icons/equipment/shield/heater-marked-red.webp').strip().strip('`') or 'icons/equipment/shield/heater-marked-red.webp',
            'system': {
                'description': {'value': apply_enrichers(md_to_html('\n\n'.join(description_parts)))},
                'shieldType': (meta.get('shield type') or 'light').strip().lower(),
                'handUsage': meta.get('hand usage', ''),
                'meleeDefense': ', '.join(granted_abilities),
                'requirements': meta.get('requirements', ''),
                'specialAbilities': '\n\n'.join(special_parts),
                'plantedMode': 'planted mode' in meta,
                'reactions': link_source_items(action_source_dir, reactions),
                'linkedAbilities': link_source_items(ability_source_dir, granted_abilities),
                'weight': parse_weight(meta.get('weight')) or 0,
                'cost': parse_money_to_gp(meta.get('cost')) or 0,
                'quantity': 1,
                'notes': ''
            },
            'effects': []
        }
        items.append(item)

    for item_name, section_text in split_heading_sections(armor_content, r'^####\s+(.+)$'):
        meta = parse_bold_metadata(section_text)
        properties = extract_keywords(meta.get('keyword') or meta.get('keywords'))
        lowered_properties = {keyword.lower() for keyword in properties}

        armor_type = ''
        if 'lightarmor' in lowered_properties:
            armor_type = 'light'
        elif 'mediumarmor' in lowered_properties:
            armor_type = 'medium'
        elif 'heavyarmor' in lowered_properties:
            armor_type = 'heavy'

        stealth_penalty = 'none'
        stealth_text = (meta.get('stealth') or '').lower()
        if 'noisy' in lowered_properties or 'noisy' in stealth_text:
            stealth_penalty = 'noisy'
        elif 'loud' in lowered_properties or 'loud' in stealth_text:
            stealth_penalty = 'loud'
        elif 'no penalty' in stealth_text:
            stealth_penalty = 'none'

        description_parts = []
        narrative = strip_metadata_lines(section_text)
        if narrative:
            description_parts.append(narrative)
        if meta.get('description'):
            description_parts.append(meta['description'])

        dr = parse_dr(meta.get('dr')) or (0, 0, 0)
        item = {
            '_id': generate_armor_item_id('armor', item_name),
            'name': item_name,
            'type': 'armor',
            'img': meta.get('image', 'icons/equipment/chest/breastplate-scale-grey.webp').strip().strip('`') or 'icons/equipment/chest/breastplate-scale-grey.webp',
            'system': {
                'description': {'value': apply_enrichers(md_to_html('\n\n'.join(description_parts)))},
                'armorType': armor_type,
                'dr': {
                    'slashing': dr[0],
                    'piercing': dr[1],
                    'bludgeoning': dr[2]
                },
                'properties': properties,
                'stealthPenalty': stealth_penalty,
                'swimPenalty': '',
                'donTime': '',
                'doffTime': '',
                'weight': parse_weight(meta.get('weight')) or 0,
                'cost': parse_money_to_gp(meta.get('cost')) or 0,
                'quantity': 1,
                'notes': ''
            },
            'effects': []
        }
        items.append(item)

    return items


def main():
    script_dir = Path(__file__).parent.parent.parent

    md_file = script_dir / "ttrpg" / "armor.md"
    if md_file.exists():
        print("Parsing armor.md...")
        items = parse_armor_md(md_file)
        print(f"  Extracted {len(items)} armor items from documentation")

        source_dir = script_dir / "foundryvtt" / "packs" / "armor" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)

        for old_file in source_dir.glob("*.json"):
            old_file.unlink()

        for item in items:
            json_file = source_dir / f"{slugify(item['name'])}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")

    print("\nValidating armor pack source...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "armor"
    success = build_pack_from_source(pack_dir, "armor")

    if not success:
        return 1

    npm_executable = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm_executable:
        print("  npm was not found on PATH; source JSON was updated but the LevelDB pack was not rebuilt.")
        print("  Run 'npm run pack:armor' from the repository root to compile the pack.")
        return 0

    print("\nCompiling armor pack...")
    try:
        subprocess.run([npm_executable, "run", "pack:armor"], cwd=script_dir, check=True)
    except subprocess.CalledProcessError as exc:
        print(f"  Failed to compile armor pack: {exc}")
        return exc.returncode or 1

    return 0


if __name__ == "__main__":
    import sys

    sys.exit(main())
