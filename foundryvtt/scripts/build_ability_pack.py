#!/usr/bin/env python3
"""Build the abilities compendium pack from source JSON and ability.md."""

import json
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key, md_to_html, apply_enrichers
import re


ABILITY_FIELD_MAP = {
    'action cost': 'actionCost',
    'requirements': 'requirements',
    'trigger': 'trigger',
    'range': 'range',
    'target': 'target',
    'effect': 'effect',
    'frequency': 'frequency',
    'usage': 'usage',
}


def normalize_field_label(label):
    normalized = re.sub(r'\s*\([^)]*\)\s*', '', str(label or '').strip().lower())
    normalized = re.sub(r'\s+', ' ', normalized)

    if normalized.startswith('trigger'):
        return 'trigger'

    return normalized


def infer_ability_type(fields):
    action_cost = fields.get('actionCost', '').lower()
    trigger = fields.get('trigger', '')

    if '[reaction]' in action_cost and ' or ' not in action_cost and '/' not in action_cost:
        return 'reaction'
    if trigger:
        return 'triggered'
    if action_cost:
        return 'active'
    return 'passive'


def parse_ability_fields(body_lines):
    fields = {}
    description_lines = []
    current_field = None

    for raw_line in body_lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            current_field = None
            description_lines.append('')
            continue

        field_match = re.match(r'^-\s+\*\*(.+?):\*\*\s*(.*)$', stripped)
        if field_match:
            field_label = normalize_field_label(field_match.group(1))
            field_name = ABILITY_FIELD_MAP.get(field_label)
            if field_name:
                fields[field_name] = field_match.group(2).strip()
                current_field = field_name
            else:
                current_field = None
            description_lines.append(line)
            continue

        if current_field and raw_line.startswith(('  ', '\t')):
            fields[current_field] = f"{fields[current_field]}\n{stripped}".strip()
            description_lines.append(line)
            continue

        current_field = None
        description_lines.append(line)

    return fields, '\n'.join(description_lines).strip()


def parse_abilities_from_markdown(content):
    abilities = []
    current_h2 = ''
    current_h3 = ''
    current_ability = None

    def flush_current():
        nonlocal current_ability
        if not current_ability:
            return

        fields, description_md = parse_ability_fields(current_ability['body_lines'])
        abilities.append({
            'name': current_ability['name'],
            'source': current_ability['source'],
            'fields': fields,
            'description_md': description_md,
        })
        current_ability = None

    for raw_line in content.splitlines():
        line = raw_line.rstrip()

        match_h4 = re.match(r'^####\s+(.+?)\s*$', line)
        if match_h4:
            flush_current()
            current_ability = {
                'name': match_h4.group(1).strip(),
                'source': current_h3 or current_h2,
                'body_lines': [],
            }
            continue

        match_h3 = re.match(r'^###\s+(.+?)\s*$', line)
        if match_h3:
            flush_current()
            current_h3 = match_h3.group(1).strip()
            continue

        match_h2 = re.match(r'^##\s+(.+?)\s*$', line)
        if match_h2:
            flush_current()
            current_h2 = match_h2.group(1).strip()
            current_h3 = ''
            continue

        if current_ability is not None:
            current_ability['body_lines'].append(line)

    flush_current()
    return abilities


def build_ability_item(ability, existing_item=None):
    existing_item = existing_item or {}
    existing_system = existing_item.get('system') if isinstance(existing_item.get('system'), dict) else {}
    existing_effects = existing_item.get('effects') if isinstance(existing_item.get('effects'), list) else []
    existing_keywords = existing_system.get('keywords', [])

    if isinstance(existing_keywords, str):
        existing_keywords = [keyword.strip() for keyword in existing_keywords.split(',') if keyword.strip()]
    elif not isinstance(existing_keywords, list):
        existing_keywords = []

    def get_string_field(field_name, fallback_key=None):
        value = str(fields.get(field_name, '') or '').strip()
        if value:
            return value

        existing_value = existing_system.get(fallback_key or field_name, '')
        return existing_value.strip() if isinstance(existing_value, str) else ''

    fields = ability['fields']
    has_structured_timing = any(str(fields.get(name, '') or '').strip() for name in ('actionCost', 'trigger', 'frequency', 'usage'))
    generated_system = {
        'description': {'value': apply_enrichers(md_to_html(ability['description_md']))},
        'abilityType': infer_ability_type(fields) if has_structured_timing else str(existing_system.get('abilityType') or 'passive'),
        'actionCost': get_string_field('actionCost'),
        'requirements': get_string_field('requirements'),
        'trigger': get_string_field('trigger'),
        'range': get_string_field('range'),
        'target': get_string_field('target'),
        'effect': get_string_field('effect'),
        'frequency': get_string_field('frequency'),
        'usage': get_string_field('usage'),
        'source': ability['source'] or get_string_field('source'),
        'keywords': existing_keywords,
        'isActive': bool(existing_system.get('isActive', False)),
        'appliesEffects': existing_system.get('appliesEffects', []),
    }

    merged_system = dict(existing_system)
    merged_system.update(generated_system)

    return {
        '_id': existing_item.get('_id') or generate_id(),
        'name': ability['name'],
        'type': 'ability',
        'img': existing_item.get('img') or 'icons/svg/magic.svg',
        'system': merged_system,
        'effects': existing_effects,
    }


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

        parsed_abilities = parse_abilities_from_markdown(content)
        expected_files = {
            f"{re.sub(r'[^a-z0-9]+', '-', ability['name'].lower()).strip('-') or f'ability-{index + 1}'}.json"
            for index, ability in enumerate(parsed_abilities)
        }

        for existing_file in source_dir.glob('*.json'):
            if existing_file.name not in expected_files:
                existing_file.unlink()
                print(f"  Removed stale ability source: {existing_file.name}")

        updated = 0
        created = 0
        for ability in parsed_abilities:
            slug = re.sub(r"[^a-z0-9]+", "-", ability['name'].lower()).strip('-') or f"ability-{updated + created + 1}"
            out_file = source_dir / f"{slug}.json"

            existing_item = {}
            if out_file.exists():
                with open(out_file, 'r', encoding='utf-8') as fh:
                    existing_item = json.load(fh)

            item = build_ability_item(ability, existing_item)

            with open(out_file, 'w', encoding='utf-8') as fh:
                ensure_key(item)
                json.dump(item, fh, indent=2, ensure_ascii=False)
                fh.write('\n')

            if existing_item:
                updated += 1
                print(f"  Updated ability source: {out_file.name}")
            else:
                created += 1
                print(f"  Created ability source: {out_file.name}")

        if created == 0 and updated == 0:
            print("  No abilities parsed from ability.md.")

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
