#!/usr/bin/env python3
"""
Build feats compendium pack from parsed feats.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_stable_id, ensure_key, md_to_html, apply_enrichers


# Default feat icon (Foundry built-in webp for proper compendium thumbnails)
DEFAULT_FEAT_ICON = 'icons/sundries/books/book-star-purple.webp'

FIELD_RE = re.compile(r'^\*\*([^*]+?):\*\*\s*(.*)$')

FEAT_CLASSIFICATION_XP = {
    'standard': 40,
    'legendary': 80,
}

# Keyword -> icon mapping for feat categories
KEYWORD_ICONS = {
    'combat':     'icons/skills/melee/hand-grip-sword-orange.webp',
    'defense':    'icons/equipment/shield/shield-cross-bronze.webp',
    'magic':      'icons/magic/symbols/star-rising-purple.webp',
    'elemental':  'icons/magic/fire/flame-burning-hand-orange.webp',
    'wilderness': 'icons/environment/wilderness/tree-oak.webp',
    'skill':      'icons/sundries/books/book-open-purple.webp',
    'social':     'icons/skills/social/diplomacy-handshake.webp',
    'healing':    'icons/magic/life/heart-cross-strong-flame-purple-orange.webp',
    'stealth':    'icons/skills/social/theft-pickpocket-bribery-brown.webp',
    'savage':     'icons/skills/melee/strike-axe-blood-red.webp',
}

RECHARGE_PERIODS = {
    'short': 'shortRest',
    'long': 'longRest',
}


def _choose_icon(keywords):
    """Pick an icon based on the feat's keywords, falling back to default."""
    if not keywords:
        return DEFAULT_FEAT_ICON
    if isinstance(keywords, (list, tuple, set)):
        kw_lower = ' '.join(str(keyword) for keyword in keywords).lower()
    else:
        kw_lower = str(keywords).lower()
    for keyword, icon in KEYWORD_ICONS.items():
        if keyword in kw_lower:
            return icon
    return DEFAULT_FEAT_ICON


def _generate_feat_id(name):
    """Generate a stable ID for a feat from its canonical name."""
    normalized_name = re.sub(r'\s+', ' ', name).strip().lower()
    return generate_stable_id(f'feat:{normalized_name}')


def _split_sections(content):
    """Split markdown content into feat sections while tracking classification headings."""
    matches = list(re.finditer(r'^(#{1,6})\s+(.+)$', content, flags=re.MULTILINE))
    sections = []
    current_classification = 'standard'

    for index, match in enumerate(matches):
        heading_text = match.group(2).strip()
        heading_key = re.sub(r'\s+', ' ', heading_text).strip().lower()

        if heading_key == 'legendary feats':
            current_classification = 'legendary'
            continue

        if heading_key == 'standard feats':
            current_classification = 'standard'
            continue

        if len(match.group(1)) not in (3, 4):
            continue
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
        sections.append((heading_text, content[start:end].strip(), current_classification))

    return sections


def _parse_fields(section_body):
    """Parse standardized **Field:** blocks with multiline continuation support."""
    fields = {}
    current_field = None
    current_lines = []
    body_lines = []

    for line in section_body.splitlines():
        field_match = FIELD_RE.match(line.strip())
        if field_match:
            if current_field is not None:
                fields[current_field] = '\n'.join(current_lines).strip()
            current_field = field_match.group(1).strip().lower()
            current_lines = [field_match.group(2).rstrip()]
            continue

        if current_field is not None:
            current_lines.append(line.rstrip())
        else:
            body_lines.append(line.rstrip())

    if current_field is not None:
        fields[current_field] = '\n'.join(current_lines).strip()

    return fields, '\n'.join(body_lines).strip()


def _parse_usage_type(usage_text):
    """Map rich usage text to the simple feat sheet usage type enum."""
    usage_lower = usage_text.lower().strip()
    if not usage_lower:
        return 'passive'
    if 'reaction' in usage_lower:
        return 'reaction'
    if 'free' in usage_lower:
        return 'free'
    if usage_lower in {'passive', 'passive trigger', 'passive enhancement', 'passive, always on'}:
        return 'passive'
    if usage_lower.startswith('active') or usage_lower.startswith('action'):
        return 'active'
    if any(token in usage_lower for token in ['once per', 'per turn', 'per round', 'costs', 'trigger', 'triggers', 'special', 'requires', 'while', '[combat] action']):
        return 'special'
    return 'active'


def _parse_recharge_text(usage_text):
    """Infer recharge data from a usage string when possible."""
    if not usage_text:
        return {'period': '', 'formula': ''}

    candidates = [usage_text.strip()]
    for segment in re.split(r'[.;]', usage_text):
        candidate = segment.strip()
        if candidate and candidate not in candidates:
            candidates.append(candidate)

    for candidate in candidates:
        once_match = re.match(r'^(?:.+?\s+)?once per (short|long) rest$', candidate, re.IGNORECASE)
        if once_match:
            return {
                'period': RECHARGE_PERIODS.get(once_match.group(1).lower(), ''),
                'formula': '1',
            }

        times_match = re.match(r'^(.+?)\s+times per\s+(short|long)\s+rest$', candidate, re.IGNORECASE)
        if times_match:
            return {
                'period': RECHARGE_PERIODS.get(times_match.group(2).lower(), ''),
                'formula': times_match.group(1).strip(),
            }

    return {'period': '', 'formula': ''}


def _extract_keywords(keyword_text):
    """Normalize bracketed keyword lists while preserving existing storage format."""
    if not keyword_text:
        return []
    bracketed = [f'[{match.strip()}]' for match in re.findall(r'\[([^\]]+)\]', keyword_text)]
    if bracketed:
        return bracketed
    return [part.strip() for part in keyword_text.split(',') if part.strip()]


# Attribute abbreviation -> system key mapping
ATTR_ABBREV = {
    'str': 'strength', 'strength': 'strength',
    'con': 'constitution', 'constitution': 'constitution',
    'agi': 'agility', 'agility': 'agility',
    'dex': 'dexterity', 'dexterity': 'dexterity',
    'int': 'intelligence', 'intelligence': 'intelligence',
    'wis': 'wisdom', 'wisdom': 'wisdom',
    'cha': 'charisma', 'charisma': 'charisma',
    'lck': 'luck', 'luck': 'luck',
}

# Skill name -> system key mapping (display name variants -> internal key)
SKILL_MAP = {
    'athletics': 'athletics', 'might': 'might',
    'acrobatics': 'acrobatics', 'stealth': 'stealth',
    'thievery': 'thievery', 'devices': 'devices',
    'perception': 'perception', 'wilderness': 'wilderness', 'survival': 'wilderness',
    'medicine': 'medicine', 'empathy': 'empathy', 'religion': 'religion',
    'arcana': 'arcane', 'arcane': 'arcane',
    'history': 'history', 'society': 'society',
    'investigation': 'investigate', 'investigate': 'investigate',
    'persuasion': 'persuasion', 'deception': 'deception',
    'intimidate': 'intimidate', 'intimidation': 'intimidate',
    'perform': 'perform', 'language': 'language',
    'craft': 'craft', 'writing': 'writing',
    'melee': 'meleeCombat', 'melee combat': 'meleeCombat', 'meleecombat': 'meleeCombat',
    'ranged': 'rangedCombat', 'ranged combat': 'rangedCombat', 'rangedcombat': 'rangedCombat',
}


def _append_skill(prereqs, skill_key, value):
    """Append a skill:rank entry to the skills string (comma-separated format)."""
    entry = f"{skill_key}:{value}"
    if prereqs['skills']:
        prereqs['skills'] += f", {entry}"
    else:
        prereqs['skills'] = entry


def _parse_prerequisites(prereq_text, prereqs):
    """
    Parse a prerequisite string like 'Agi 4, Acrobatics 4, Primal Fury feat, Tier 3'
    into structured data in the prereqs dict.
    """
    remaining = []

    # Split by comma, but be careful with complex phrases
    parts = [p.strip() for p in prereq_text.split(',')]

    for part in parts:
        part_stripped = part.strip()
        if not part_stripped:
            continue

        # Check for tier requirement: "Tier N"
        tier_m = re.match(r'^[Tt]ier\s+(\d+)$', part_stripped)
        if tier_m:
            prereqs['tier'] = int(tier_m.group(1))
            continue

        # Check for generic skill requirement: "Any skill rank 5"
        any_skill_m = re.match(r'^[Aa]ny\s+skill\s+rank\s+(\d+)$', part_stripped)
        if any_skill_m:
            remaining.append(part_stripped)
            continue

        # Check for chosen/generic combat or mastery skills that cannot be mapped to one field
        generic_skill_m = re.match(r'^(any|chosen)\s+(.+?)\s+(\d+)$', part_stripped, re.IGNORECASE)
        if generic_skill_m:
            remaining.append(part_stripped)
            continue

        # Check for potential/mastery requirements that are not actor skill keys
        energy_req_m = re.match(r'^(\w+)\s+(mastery|potential)\s+(\d+)$', part_stripped, re.IGNORECASE)
        if energy_req_m:
            remaining.append(part_stripped)
            continue

        # Check for casting attribute requirements
        casting_attr_m = re.match(r'^[Cc]asting\s+[Aa]ttribute\s+(\d+)$', part_stripped)
        if casting_attr_m:
            remaining.append(part_stripped)
            continue

        # Check for attribute requirement: "Str 4", "Agi 5", "Str or Agi 4"
        # Pattern: optional "AttrAbbr or " prefix, then AttrAbbr + number
        attr_m = re.match(
            r'^(?:(\w+)\s+or\s+)?(\w+)\s+(\d+)$',
            part_stripped, re.IGNORECASE
        )
        if attr_m:
            name1 = (attr_m.group(1) or '').lower()
            name2 = attr_m.group(2).lower()
            value = int(attr_m.group(3))

            # Check if name2 is an attribute
            if name2 in ATTR_ABBREV:
                prereqs['attributes'][ATTR_ABBREV[name2]] = value
                if name1 and name1 in ATTR_ABBREV:
                    prereqs['attributes'][ATTR_ABBREV[name1]] = value
                continue

            # Check if name2 is a skill
            if name2 in SKILL_MAP:
                skill_key = SKILL_MAP[name2]
                _append_skill(prereqs, skill_key, value)
                if name1 and name1 in SKILL_MAP:
                    _append_skill(prereqs, SKILL_MAP[name1], value)
                continue

        # Check for two-word skill: "Melee Combat 4", "Ranged Combat 4", "Wilderness 3"
        skill2_m = re.match(r'^(\w+\s+\w+)\s+(\d+)$', part_stripped, re.IGNORECASE)
        if skill2_m:
            skill_name = skill2_m.group(1).lower()
            value = int(skill2_m.group(2))
            if skill_name in SKILL_MAP:
                _append_skill(prereqs, SKILL_MAP[skill_name], value)
                continue

        # Check for feat prerequisite: "X feat" or "X Feat"
        feat_m = re.match(r'^(.+?)\s+[Ff]eat$', part_stripped)
        if feat_m:
            prereqs['feats'].append(feat_m.group(1).strip())
            continue

        # Check for trait prerequisite: specific named traits become item prerequisites,
        # but generic phrases like "any magical tradition trait" stay as free text.
        trait_m = re.match(r'^(.+?)\s+[Tt]rait$', part_stripped)
        if trait_m:
            trait_name = trait_m.group(1).strip()
            if trait_name.lower().startswith(('any ', 'chosen ')):
                remaining.append(part_stripped)
            else:
                prereqs['feats'].append(trait_name)
            continue

        # Anything else goes to other
        remaining.append(part_stripped)

    prereqs['other'] = ', '.join(remaining) if remaining else ''


def parse_feats_md(md_file):
    """
    Parse feats.md and extract feat items.
    
    Expected format:
    ### Feat Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"<!--\s*PACK:feats\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    sections = _split_sections(content)

    for item_name, section_body, classification in sections:
        
        if not item_name:
            continue

        fields, free_body = _parse_fields(section_body)

        canonical_fields = {key.rstrip(':').strip().lower(): value for key, value in fields.items()}
        raw_description = section_body.strip()
        tier_text = canonical_fields.get('tier', '')
        prereq_text = canonical_fields.get('prerequisites', '') or canonical_fields.get('requirements', '')
        usage_text = canonical_fields.get('usage', '')
        keyword_text = canonical_fields.get('keyword', '') or canonical_fields.get('keywords', '')
        benefit_text = canonical_fields.get('benefit', '') or canonical_fields.get('benefits', '')
        note_text = canonical_fields.get('note', '') or canonical_fields.get('notes', '')
        image_text = canonical_fields.get('image', '')
        description_text = canonical_fields.get('description', '') or free_body
        
        item = {
            '_id': _generate_feat_id(item_name),
            'name': item_name,
            'type': 'feat',
            'img': DEFAULT_FEAT_ICON,
            'system': {
                'description': {'value': ''},
                'flavorText': '',
                'xpCost': FEAT_CLASSIFICATION_XP.get(classification, 40),
                'classification': classification,
                'prerequisites': {
                    'attributes': {},
                    'skills': '',
                    'feats': [],
                    'tier': 0,
                    'other': ''
                },
                'benefits': '',
                'usageType': 'passive',
                'usage': {
                    'mode': 'passive',
                    'uses': {
                        'value': 0,
                        'max': 0,
                    },
                    'recharge': {
                        'period': '',
                        'formula': '',
                    },
                    'text': ''
                },
                'keywords': [],
                'notes': '',
                'effects': []
            },
            'effects': []
        }

        # Parse tier from description — tier is a prerequisite
        tier_match = re.search(r'(\d+)', tier_text)
        if tier_match:
            item['system']['prerequisites']['tier'] = int(tier_match.group(1))

        # Parse usage details from standardized usage field
        item['system']['usageType'] = _parse_usage_type(usage_text)
        recharge = _parse_recharge_text(usage_text)
        item['system']['usage'] = {
            'mode': item['system']['usageType'],
            'uses': {
                'value': 0,
                'max': 0,
            },
            'recharge': recharge,
            'text': usage_text.strip()
        }

        # Parse keywords from description
        item['system']['keywords'] = _extract_keywords(keyword_text)

        # Parse prerequisites from description
        if prereq_text:
            _parse_prerequisites(prereq_text, item['system']['prerequisites'])

        # Parse benefit from description
        if benefit_text:
            item['system']['benefits'] = apply_enrichers(md_to_html(benefit_text.strip()))

        if note_text:
            item['system']['notes'] = note_text.strip()

        # Choose icon based on keywords (can be overridden by explicit Image: field)
        item['img'] = _choose_icon(item['system']['keywords'])

        # Extract explicit image path if specified (overrides keyword-based icon)
        if image_text:
            img_match = re.search(r'`?([^`\n|]+)`?', image_text)
            if img_match:
                item['img'] = img_match.group(1).strip()

        # Extract the actual description text: use **Description:** value if present,
        # otherwise strip all metadata lines and use what remains
        clean_desc = description_text.strip()

        # Convert to Foundry-compatible HTML
        item['system']['description']['value'] = apply_enrichers(md_to_html(clean_desc))

        # Store raw text for filtering
        item['_raw'] = raw_description
        items.append(item)

    # Filter out non-feat sections: require metadata fields that real feats have
    filtered = []
    for it in items:
        raw = it.pop('_raw', '')
        if re.search(r'\b(tier|benefit|usage|keyword|prerequisites)\b', raw, flags=re.IGNORECASE):
            filtered.append(it)

    # Alphabetize by name
    filtered.sort(key=lambda x: x.get('name', '').lower())

    return filtered


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "feats.md"
    if md_file.exists():
        print("Parsing feats.md...")
        items = parse_feats_md(md_file)
        print(f"  Extracted {len(items)} feat items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "feats" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        expected_files = {
            f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            for item in items
        }

        for existing_file in source_dir.glob('*.json'):
            if existing_file.name not in expected_files:
                existing_file.unlink()
                print(f"  Removed stale file: {existing_file.name}")
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding feats pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "feats"
    success = build_pack_from_source(pack_dir, "feats")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
