#!/usr/bin/env python3
"""
Build actions compendium pack from parsed actions.md documentation.
"""

import json
import re
from pathlib import Path

from pack_utils import apply_enrichers, build_pack_from_source, ensure_key, generate_stable_id, md_to_html


ACTION_TYPE_MAP = {
    'combat': 'combat',
    'move': 'move',
    'movement': 'move',
    'activate': 'activate',
    'interact': 'interact',
    'free': 'free',
    'reaction': 'reaction',
}

ICON_MAP = {
    'combat': 'icons/skills/melee/blade-damage.webp',
    'move': 'icons/skills/movement/feet-winged-boots-brown.webp',
    'activate': 'icons/skills/trades/construction-gloves-yellow.webp',
    'interact': 'icons/skills/social/wave-halt-stop.webp',
    'free': 'icons/skills/movement/arrow-right-blue.webp',
    'reaction': 'icons/skills/melee/shield-block-gray-yellow.webp',
}

ACTION_COST_PATTERN = re.compile(r'^(free|\d+(?:\s*(?:or|/|to)\s*\d+)?)$', re.IGNORECASE)
HEADING_RE = re.compile(r'^-?\s*(#{2,5})\s+(.+)$')
TYPE_TAG_RE = re.compile(r'\[(\w+)\]')
LABEL_LINE_RE = re.compile(r'^(?:[-*]\s+)?(?:\*\*)?([^:*][^:]*?)(?:\*\*)?:\s*(.*)$')


def slugify(value):
    """Convert an item name into a stable file slug."""
    slug = re.sub(r'[^a-z0-9]+', '-', value.strip().lower())
    return slug.strip('-')


def load_existing_actions(source_dir):
    """Load existing action source JSON keyed by slug so rebuilds can preserve manual automation data."""
    existing_actions = {}

    for json_file in source_dir.glob('*.json'):
        try:
            with open(json_file, 'r', encoding='utf-8') as handle:
                item = json.load(handle)
        except (OSError, json.JSONDecodeError):
            continue

        name = str(item.get('name') or json_file.stem).strip()
        if not name:
            continue

        existing_actions[slugify(name)] = item

    return existing_actions


def clean_metadata_value_line(value):
    """Remove markdown emphasis wrappers that leak into parsed metadata values."""
    cleaned = value.strip()
    cleaned = re.sub(r'^\*\*\s*', '', cleaned)
    cleaned = re.sub(r'\s*\*\*$', '', cleaned)
    return cleaned.strip()


def is_supported_metadata_label(label):
    """Return True if a line label should be promoted into structured metadata."""
    normalized = label.strip().lower()
    return normalized in {
        'image', 'cost', 'requirements', 'range', 'target', 'trigger', 'effect', 'frequency', 'notes', 'weaving roll'
    } or normalized.startswith('success') or normalized.startswith('margin')


def normalize_action_cost(raw_cost):
    """Normalize action-count costs while preserving non-action costs as special text."""
    if not raw_cost:
        return '', None

    cleaned = ' '.join(str(raw_cost).split())
    match = ACTION_COST_PATTERN.match(cleaned)
    if match:
        normalized = match.group(1)
        if normalized.lower() == 'free':
            return 'Free', None
        return normalized, None

    return '', f"Cost: {cleaned}"


def parse_action_metadata(section_text):
    """Extract ordered metadata blocks from an action's markdown body."""
    entries = []
    current_label = None
    current_lines = []

    for raw_line in section_text.splitlines():
        stripped = raw_line.strip()
        match = LABEL_LINE_RE.match(stripped)

        if match and is_supported_metadata_label(match.group(1)):
            if current_label is not None:
                entries.append((current_label, '\n'.join(current_lines).strip()))
            current_label = match.group(1).strip()
            initial_value = clean_metadata_value_line(match.group(2))
            current_lines = [initial_value] if initial_value else []
            continue

        if current_label is None:
            continue

        current_lines.append(clean_metadata_value_line(stripped))

    if current_label is not None:
        entries.append((current_label, '\n'.join(current_lines).strip()))

    return entries


def append_special_line(lines, label, value):
    """Append a labeled block to the action's special field preserving order."""
    cleaned_value = value.strip()
    if not cleaned_value:
        return
    lines.append(f"{label}: {cleaned_value}")


def parse_actions_md(md_file):
    """
    Parse actions.md and extract action items.

    Recognises action definitions at heading levels 3-5 (###, ####, #####)
    that carry a [Type] tag such as [Combat], [Move], [Activate], [Interact],
    [Free], or [Reaction]. Also handles:
      - bullet-prefixed headings (-##### Action [Move])
      - reactions without explicit tags that live under a Reactions section
      - the (Reaction) suffix on some headings
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    pack_marker = re.search(r"<!--\s*PACK:action(?::([^>]+))?\s*-->", content, flags=re.IGNORECASE)
    types_filter_raw = None
    if pack_marker:
        types_filter_raw = pack_marker.group(1)
        content = content[pack_marker.end():]

    allowed_types = None
    if types_filter_raw:
        allowed = set()
        for raw_type in [entry.strip() for entry in types_filter_raw.split(',') if entry.strip()]:
            lowered = raw_type.lower()
            allowed.add(lowered)
            mapped = ACTION_TYPE_MAP.get(lowered)
            if mapped:
                allowed.add(mapped)
        allowed_types = allowed

    lines = content.split('\n')
    category_names = {
        'combat actions', 'standard combat actions', 'movement actions',
        'activate actions', 'interact actions', 'free actions', 'reactions',
        'universal reactions', 'movement in combat', 'important clarifications',
        'movement modifiers', 'action types', 'basic reaction mechanics',
        'reaction priority and timing', 'free action limits',
    }

    action_starts = []
    section_starts = []
    current_section_type = None

    for idx, line in enumerate(lines):
        section_match = re.match(r'^##\s+(.+)', line)
        if section_match:
            section_starts.append(idx)
            section_name = section_match.group(1).strip().lower()
            if 'reaction' in section_name:
                current_section_type = 'reaction'
            elif 'free' in section_name:
                current_section_type = 'free'
            elif 'interact' in section_name:
                current_section_type = 'interact'
            elif 'activate' in section_name:
                current_section_type = 'activate'
            elif 'move' in section_name:
                current_section_type = 'move'
            elif 'combat' in section_name:
                current_section_type = 'combat'
            else:
                current_section_type = None
            continue

        heading_match = HEADING_RE.match(line)
        if not heading_match:
            continue

        title = heading_match.group(2).strip()
        if title.rstrip().endswith(':'):
            continue

        tag_match = TYPE_TAG_RE.search(title)
        if tag_match:
            type_key = ACTION_TYPE_MAP.get(tag_match.group(1).lower())
            if type_key is None:
                continue
            name = TYPE_TAG_RE.sub('', title).strip()
            name = re.sub(r'\(Reaction\)', '', name, flags=re.IGNORECASE).strip()
            if re.search(r'\(Reaction\)', title, flags=re.IGNORECASE) or current_section_type == 'reaction':
                type_key = 'reaction'
        elif current_section_type == 'reaction':
            type_key = 'reaction'
            name = title.strip()
        else:
            continue

        if name.lower().rstrip(':') in category_names:
            continue

        action_starts.append((idx, name, type_key))

    items = []
    seen_names = set()

    for index, (start_idx, action_name, type_key) in enumerate(action_starts):
        next_action_idx = action_starts[index + 1][0] if index + 1 < len(action_starts) else len(lines)
        next_section_idx = next(
            (section_idx for section_idx in section_starts if section_idx > start_idx),
            len(lines)
        )
        end_idx = min(next_action_idx, next_section_idx)
        section_text = '\n'.join(lines[start_idx + 1:end_idx])

        if allowed_types is not None and type_key not in allowed_types:
            continue

        name_slug = action_name.lower()
        if name_slug in seen_names:
            continue
        seen_names.add(name_slug)

        item = {
            '_id': generate_stable_id(f'action:{action_name}'),
            'name': action_name,
            'type': 'action',
            'img': ICON_MAP.get(type_key, ICON_MAP['combat']),
            'system': {
                'description': {'value': ''},
                'actionType': type_key,
                'actionCost': '',
                'requirements': '',
                'trigger': '',
                'effect': '',
                'appliesEffects': [],
                'keywords': [],
                'range': '',
                'target': '',
                'frequency': '',
                'special': ''
            },
            'effects': []
        }

        image_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', section_text)
        if image_match:
            item['img'] = image_match.group(1).strip()

        if section_text.strip():
            item['system']['description']['value'] = apply_enrichers(md_to_html(section_text.strip()))

        special_lines = []
        for label, value in parse_action_metadata(section_text):
            normalized_label = label.strip().lower()

            if normalized_label == 'cost':
                action_cost, special_cost = normalize_action_cost(value)
                if action_cost:
                    item['system']['actionCost'] = action_cost
                if special_cost:
                    special_lines.append(special_cost)
            elif normalized_label == 'requirements':
                item['system']['requirements'] = value
            elif normalized_label == 'trigger':
                item['system']['trigger'] = value
            elif normalized_label == 'effect':
                item['system']['effect'] = value
            elif normalized_label == 'range':
                item['system']['range'] = value
            elif normalized_label == 'target':
                item['system']['target'] = value
            elif normalized_label == 'frequency':
                item['system']['frequency'] = value
            else:
                append_special_line(special_lines, label, value)

        if special_lines:
            item['system']['special'] = '\n'.join(special_lines)

        raw_keywords = [keyword.strip() for keyword in re.findall(r'\[([^\]]+)\]', section_text)]
        keywords = []
        for keyword in raw_keywords:
            if keyword.lower() in ACTION_TYPE_MAP:
                continue
            if keyword and keyword not in keywords:
                keywords.append(keyword)
        item['system']['keywords'] = keywords

        items.append(item)

    return items


def main():
    script_dir = Path(__file__).parent.parent.parent

    md_file = script_dir / 'ttrpg' / 'actions.md'
    if md_file.exists():
        print('Parsing actions.md...')
        items = parse_actions_md(md_file)
        print(f'  Extracted {len(items)} action items from documentation')

        source_dir = script_dir / 'foundryvtt' / 'packs' / 'action' / '_source'
        source_dir.mkdir(parents=True, exist_ok=True)
        existing_actions = load_existing_actions(source_dir)

        print('  Cleaning old JSON files...')
        for old_file in source_dir.glob('*.json'):
            old_file.unlink()
        print('  Removed old files')

        for item in items:
            existing_item = existing_actions.get(slugify(item['name']))
            if existing_item:
                existing_applies_effects = existing_item.get('system', {}).get('appliesEffects')
                if isinstance(existing_applies_effects, list):
                    item['system']['appliesEffects'] = existing_applies_effects
            json_file = source_dir / f"{slugify(item['name'])}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")

    print('\nBuilding action pack...')
    pack_dir = script_dir / 'foundryvtt' / 'packs' / 'action'
    success = build_pack_from_source(pack_dir, 'action')

    return 0 if success else 1


if __name__ == '__main__':
    import sys
    sys.exit(main())
