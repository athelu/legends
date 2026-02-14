#!/usr/bin/env python3
"""
Build feats compendium pack from parsed feats.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key, md_to_html, apply_enrichers


# Default feat icon (Foundry built-in webp for proper compendium thumbnails)
DEFAULT_FEAT_ICON = 'icons/sundries/books/book-star-purple.webp'

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


def _choose_icon(keywords):
    """Pick an icon based on the feat's keywords, falling back to default."""
    if not keywords:
        return DEFAULT_FEAT_ICON
    kw_lower = keywords.lower()
    for keyword, icon in KEYWORD_ICONS.items():
        if keyword in kw_lower:
            return icon
    return DEFAULT_FEAT_ICON


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
    'perception': 'perception', 'survival': 'survival',
    'medicine': 'medicine', 'insight': 'insight',
    'arcana': 'arcane', 'arcane': 'arcane',
    'history': 'history', 'society': 'society',
    'investigation': 'investigate', 'investigate': 'investigate',
    'persuasion': 'persuasion', 'deception': 'deception',
    'intimidate': 'intimidate', 'intimidation': 'intimidate',
    'perform': 'perform', 'language': 'language',
    'craft': 'craft', 'writing': 'writing',
    'animal handling': 'animalHandling', 'animalhandling': 'animalHandling',
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

        # Check for two-word skill: "Melee Combat 4", "Ranged Combat 4", "Animal Handling 3"
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
    
    # Prefer level-4 headings (####) for individual feats; fall back to level-3 if none found
    sections = re.split(r'^####\s+', content, flags=re.MULTILINE)[1:]
    if not sections:
        sections = re.split(r'^###\s+', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        if not item_name:
            continue
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': 'feat',
            'img': DEFAULT_FEAT_ICON,
            'system': {
                'description': {'value': ''},
                'flavorText': '',
                'xpCost': 0,
                'prerequisites': {
                    'attributes': {},
                    'skills': '',
                    'feats': [],
                    'tier': 0,
                    'other': ''
                },
                'benefits': '',
                'usageType': 'passive',
                'keywords': '',
                'notes': '',
                'effects': []
            },
            'effects': []
        }

        # Extract raw description text (used for parsing metadata fields)
        raw_description = '\n'.join(lines[1:]).strip()

        # Parse tier from description — tier is a prerequisite
        tier_match = re.search(r'\*\*Tier:\*\*\s*(\d+)', raw_description)
        if tier_match:
            item['system']['prerequisites']['tier'] = int(tier_match.group(1))

        # Parse usage type from description
        usage_match = re.search(r'\*\*Usage:\*\*\s*(\w+)', raw_description, re.IGNORECASE)
        if usage_match:
            item['system']['usageType'] = usage_match.group(1).lower()

        # Parse keywords from description
        kw_match = re.search(r'\*\*Keywords?:\*\*\s*([^\n]+)', raw_description)
        if kw_match:
            item['system']['keywords'] = kw_match.group(1).strip()

        # Parse prerequisites from description
        prereq_match = re.search(r'\*\*Prerequisites?:\*\*\s*([^\n]+)', raw_description)
        if prereq_match:
            prereq_text = prereq_match.group(1).strip()
            _parse_prerequisites(prereq_text, item['system']['prerequisites'])

        # Parse benefit from description
        benefit_match = re.search(r'\*\*Benefits?:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]*)*)', raw_description)
        if benefit_match:
            item['system']['benefits'] = apply_enrichers(md_to_html(benefit_match.group(1).strip()))

        # Choose icon based on keywords (can be overridden by explicit Image: field)
        item['img'] = _choose_icon(item['system']['keywords'])

        # Extract explicit image path if specified (overrides keyword-based icon)
        # Supports: **Image:** `icons/path.webp` or plain Image: icons/path.webp
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', raw_description)
        if img_match:
            item['img'] = img_match.group(1).strip()

        # Extract the actual description text: use **Description:** value if present,
        # otherwise strip all metadata lines and use what remains
        desc_match = re.search(r'\*\*Description:\*\*\s*(.+?)(?=\n\*\*|\Z)', raw_description, re.DOTALL)
        if desc_match:
            clean_desc = desc_match.group(1).strip()
        else:
            # Strip all known metadata lines
            clean_desc = re.sub(
                r'^-?\s*\*\*(?:Tier|Prerequisites?|Benefits?|Usage|Keywords?|Description|Image):?\*\*[^\n]*\n?',
                '', raw_description, flags=re.MULTILINE | re.IGNORECASE
            ).strip()

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
