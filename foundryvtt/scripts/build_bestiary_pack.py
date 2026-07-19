#!/usr/bin/env python3
"""
Build bestiary compendium pack from ttrpg/bestiary.md.

Parses NPC entries from the bestiary markdown and generates Foundry VTT
Actor documents (type: npc) in the packs/bestiary/_source directory.

Each NPC entry is identified by a heading followed by **Threat Rating:** in
its body. The parser handles both older flat-style entries and newer
section-heading-style entries.

Structured data parsed:
  - Core stats: TR, size, HP, DR, speed, attributes, skills, senses,
    initiative, creature type, languages
  - Weaves block: casting stat, potentials, mastery, energy pool,
    targeting roll, and free-form weave notes
  - Lair actions: name, description, and individual effects
  - Tactics and biography as HTML
  - Attacks, special abilities, reactions as HTML text blocks
  - Equipment: magic implements (rod/staff/wand) parsed as embedded items

Usage:
    python build_bestiary_pack.py
"""

import copy
import json
import re
import sys
from pathlib import Path

from pack_utils import generate_stable_id, ensure_key, md_to_html

# Magic items lookup — populated by _load_magic_items() in main()
_MAGIC_ITEMS: dict[str, dict] = {}


# ── Constants ─────────────────────────────────────────────────────────────────

BESTIARY_MD = Path(__file__).parent.parent.parent / "ttrpg" / "bestiary.md"
OUTPUT_DIR  = Path(__file__).parent.parent / "packs" / "bestiary" / "_source"

DEFAULT_NPC_IMG = "icons/svg/mystery-man.svg"

ATTR_ABBREV = {
    'str': 'strength',
    'con': 'constitution',
    'agi': 'agility',
    'dex': 'dexterity',
    'int': 'intelligence',
    'wis': 'wisdom',
    'cha': 'charisma',
    'luck': 'luck',
}

SKILL_NAME_MAP = {
    'athletics':      'athletics',
    'might':          'might',
    'devices':        'devices',
    'thievery':       'thievery',
    'writing':        'writing',
    'ranged combat':  'rangedCombat',
    'rangedcombat':   'rangedCombat',
    'ranged':         'rangedCombat',
    'acrobatics':     'acrobatics',
    'melee combat':   'meleeCombat',
    'meleecombat':    'meleeCombat',
    'melee':          'meleeCombat',
    'stealth':        'stealth',
    'investigate':    'investigate',
    'investigation':  'investigate',
    'language':       'language',
    'languages':      'language',
    'history':        'history',
    'arcane':         'arcane',
    'society':        'society',
    'perception':     'perception',
    'empathy':        'empathy',
    'persuasion':     'persuasion',
    'deception':      'deception',
    'intimidate':     'intimidate',
    'intimidation':   'intimidate',
    'perform':        'perform',
    'performance':    'perform',
    'medicine':       'medicine',
    'wilderness':     'wilderness',
    'religion':       'religion',
    'craft':          'craft',
}

ENERGY_TYPES = {
    'fire', 'water', 'earth', 'air', 'positive', 'negative', 'time', 'space'
}

# Section header patterns — headings that are chapter/category separators,
# not NPC entries. Matched case-insensitively against the stripped heading text.
SECTION_HEADER_PATTERNS = [
    r'^humanoids?$',
    r'^daemons?$',
    r'^undead$',
    r'^beasts?$',
    r'^monstrosit',
    r'^constructs?$',
    r'^elementals?$',
    r'^fae$',
    r'^fey$',
    r'^celestials?$',
    r'^fiends?$',
    r'^aberrations?$',
    r'^threat rating',
    r'^giants?$',
    r'^dragons?$',
    r'^nephilim',
    r'^swarms?$',
    r'^plants?$',
]


# ── ID generation ──────────────────────────────────────────────────────────────

def _npc_id(name: str) -> str:
    return generate_stable_id(f'npc:{name.strip().lower()}')


def _item_id(npc_name: str, item_name: str) -> str:
    return generate_stable_id(f'npc-item:{npc_name.strip().lower()}:{item_name.strip().lower()}')


# ── Bestiary parsing ───────────────────────────────────────────────────────────

def _is_section_header(heading_text: str) -> bool:
    """Return True if this heading is a chapter/category separator, not an NPC."""
    h = heading_text.strip().lower()
    for pat in SECTION_HEADER_PATTERNS:
        if re.search(pat, h, re.IGNORECASE):
            return True
    return False


def split_npc_entries(content: str) -> list[tuple[str, str]]:
    """
    Split bestiary.md into (heading_text, body) pairs for entries that
    contain **Threat Rating:** (i.e. actual NPC entries).

    The body for each NPC heading spans from its heading to the next heading
    at the *same or higher* level (i.e. level number ≤ current level).  This
    means sub-section headings (### Attacks, ### Weaves, etc.) are included
    in the NPC's body rather than being split out as separate entries.
    """
    heading_re = re.compile(r'^(#{1,6})\s+(.+)$', re.MULTILINE)
    matches = list(heading_re.finditer(content))

    entries = []
    for i, m in enumerate(matches):
        level = len(m.group(1))
        heading_text = m.group(2).strip()

        # Body extends until the next heading at an equal or higher level
        next_peer_start = len(content)
        for j in range(i + 1, len(matches)):
            if len(matches[j].group(1)) <= level:
                next_peer_start = matches[j].start()
                break

        body = content[m.end():next_peer_start].strip()

        if _is_section_header(heading_text):
            continue

        # Only keep entries that define Threat Rating anywhere in their body
        if not re.search(r'\*\*Threat Rating:\*\*', body):
            continue

        entries.append((heading_text, body))

    return entries


# ── Field extraction helpers ───────────────────────────────────────────────────

def _field(body: str, name: str) -> str | None:
    """Extract the value of a **Name:** field from flat-style markdown."""
    pat = rf'\*\*{re.escape(name)}:\*\*\s*(.+?)(?:\n|$)'
    m = re.search(pat, body, re.IGNORECASE)
    return m.group(1).strip() if m else None


def _parse_tr(val: str) -> float:
    """Parse '1/4', '1/2', '3', etc. into a float."""
    val = val.strip().split()[0]  # drop trailing words like "(Easy)"
    if '/' in val:
        num, den = val.split('/')
        return float(num) / float(den)
    try:
        return float(val)
    except ValueError:
        return 0.0


def _parse_hp(hp_str: str) -> tuple[int, int, int]:
    """Return (value, max, multiplier) from strings like '40 (Con 5 × 8)'."""
    hp_str = hp_str.strip()
    # Try "N (formula)"
    m = re.match(r'(\d+)', hp_str)
    hp_val = int(m.group(1)) if m else 16

    # Try to extract multiplier
    mult_m = re.search(r'[×x]\s*(\d+)', hp_str)
    multiplier = int(mult_m.group(1)) if mult_m else 8

    return hp_val, hp_val, multiplier


def _parse_dr(dr_str: str) -> int:
    """Extract the highest numeric DR value from strings like 'S: 6, P: 5, B: 2' or '5'."""
    nums = re.findall(r'\b(\d+)\b', dr_str)
    return max(int(n) for n in nums) if nums else 0


def _parse_speed(speed_str: str) -> dict:
    """Parse '35 ft., Swim 20 ft., Climb 10 ft.' into speed dict."""
    speed = {'walk': 0, 'fly': 0, 'climb': 0, 'swim': 0, 'burrow': 0}

    # Walk speed: first number before optional 'ft'
    walk_m = re.match(r'(\d+)', speed_str)
    if walk_m:
        speed['walk'] = int(walk_m.group(1))

    modifiers = {
        'fly': re.search(r'[Ff]ly\s+(\d+)', speed_str),
        'climb': re.search(r'[Cc]limb\s+(\d+)', speed_str),
        'swim': re.search(r'[Ss]wim\s+(\d+)', speed_str),
        'burrow': re.search(r'[Bb]urrow\s+(\d+)', speed_str),
    }
    for key, m in modifiers.items():
        if m:
            speed[key] = int(m.group(1))

    return speed


def _parse_attributes(attr_str: str) -> dict:
    """Parse 'Str 4 / Con 5 / Agi 3 / ...' into the attributes dict."""
    attrs = {v: 2 for v in ATTR_ABBREV.values()}
    for abbr, key in ATTR_ABBREV.items():
        m = re.search(rf'\b{abbr}\s+(\d+)', attr_str, re.IGNORECASE)
        if m:
            attrs[key] = int(m.group(1))
    return attrs


def _parse_skills(skill_str: str) -> dict:
    """Parse 'Melee Combat 3, Perception 5, ...' into the skills dict."""
    skills = {v: 0 for v in set(SKILL_NAME_MAP.values())}
    # Match "SkillName N" pairs; skill names may contain spaces
    for m in re.finditer(r'([A-Za-z][A-Za-z ]+?)\s+(\d+)(?:,|$)', skill_str + ','):
        raw = m.group(1).strip().lower()
        val = int(m.group(2))
        key = SKILL_NAME_MAP.get(raw)
        if key:
            skills[key] = val
    return skills


def _parse_senses(senses_str: str) -> dict:
    """Extract darkvision/blindsight/tremorsense ranges from senses text."""
    vision = {'darkvision': 0, 'blindsight': 0, 'tremorsense': 0, 'lowLight': False}
    for sense, field in [('Darkvision', 'darkvision'), ('Blindsight', 'blindsight'), ('Tremorsense', 'tremorsense')]:
        m = re.search(rf'{sense}\s+(\d+)', senses_str, re.IGNORECASE)
        if m:
            vision[field] = int(m.group(1))
    if re.search(r'low.?light', senses_str, re.IGNORECASE):
        vision['lowLight'] = True
    return vision


def _parse_languages(lang_str: str) -> list[str]:
    """Split 'Common, Draconic, Elven' into a list of lowercase keys."""
    lang_map = {
        'common': 'common',
        'draconic': 'draconic',
        'elven': 'elven',
        'elvish': 'elven',
        'dwarvish': 'dwarvish',
        'dwarven': 'dwarvish',
        'orcish': 'orcish',
        'infernal': 'infernal',
        'abyssal': 'abyssal',
        'celestial': 'celestial',
        'terran': 'terran',
        'sylvan': 'sylvan',
        'undercommon': 'undercommon',
        'deep speech': 'deep-speech',
        'thieves cant': 'thieves-cant',
        "thieves' cant": 'thieves-cant',
        'hadriaeth': 'hadriaeth',
        'none': None,
    }
    if not lang_str or lang_str.strip().lower() in ('none', '—', '-'):
        return []
    result = []
    for part in re.split(r',\s*', lang_str.strip()):
        key = lang_map.get(part.strip().lower(), part.strip().lower())
        if key:
            result.append(key)
    return result


def _parse_creature_type(ct_str: str) -> tuple[str, str]:
    """Return (creatureType, creatureSubtype) from 'Humanoid (no special...)' etc."""
    type_map = {
        'humanoid': 'humanoid',
        'beast': 'beast',
        'undead': 'undead',
        'construct': 'construct',
        'elemental': 'elemental',
        'monstrosity': 'monstrosity',
        'nephilim': 'nephilim',
        'fae': 'fae',
        'fey': 'fae',
        'fiend': 'fiend',
        'celestial': 'celestial',
        'aberration': 'aberration',
        'plant': 'plant',
        'swarm': 'swarm',
        'giant': 'nephilim',
    }
    m = re.match(r'([A-Za-z]+)', ct_str.strip())
    if not m:
        return 'humanoid', ''
    primary = type_map.get(m.group(1).lower(), m.group(1).lower())

    # Subtype from parentheses
    sub_m = re.search(r'\(([^)]+)\)', ct_str)
    subtype = sub_m.group(1).strip() if sub_m else ''
    # Strip "no special immunities" style boilerplate
    if re.search(r'no special|immunit', subtype, re.IGNORECASE):
        subtype = ''

    return primary, subtype


def _parse_size(size_str: str) -> str:
    size_map = {
        'tiny': 'tiny', 'small': 'small', 'medium': 'medium',
        'large': 'large', 'huge': 'huge', 'gargantuan': 'gargantuan',
    }
    return size_map.get(size_str.strip().lower(), 'medium')


# ── Weaves section parser ──────────────────────────────────────────────────────

def _parse_weaves_section(weaves_text: str) -> dict:
    """
    Parse the ### Weaves block into a structured weaves dict plus HTML notes.

    Expected fields (some optional):
        **Casting Stat:** Wisdom 6
        **Potentials:** Earth 6, Water 5, ...
        **Energy Pool:** 42
        **Mastery Skills:** Earth 5, Water 4, ...
        **Targeting Roll:** Wisdom + Primary Energy Mastery

    Everything else (table, extra descriptions) goes into notes as HTML.
    """
    potentials = {e: 0 for e in ENERGY_TYPES}
    mastery    = {e: 0 for e in ENERGY_TYPES}
    casting_stat = ''
    energy_max   = 0
    targeting_roll = ''

    # Casting stat: "Wisdom 6" or just "Wisdom"
    cs_m = re.search(r'\*\*Casting Stat:\*\*\s*(\w+)(?:\s+\d+)?', weaves_text, re.IGNORECASE)
    if cs_m:
        casting_stat = cs_m.group(1).capitalize()

    # Energy pool
    ep_m = re.search(r'\*\*Energy Pool:\*\*\s*(\d+)', weaves_text, re.IGNORECASE)
    if ep_m:
        energy_max = int(ep_m.group(1))

    # Targeting roll
    tr_m = re.search(r'\*\*Targeting Roll:\*\*\s*(.+?)(?:\n|$)', weaves_text, re.IGNORECASE)
    if tr_m:
        targeting_roll = tr_m.group(1).strip()

    # Potentials: "Earth 6, Water 5, Positive 4, ..."
    pot_m = re.search(r'\*\*Potentials?:\*\*\s*(.+?)(?:\n|$)', weaves_text, re.IGNORECASE)
    if pot_m:
        for em in re.finditer(r'(\w+)\s+(\d+)', pot_m.group(1)):
            key = em.group(1).lower()
            if key in ENERGY_TYPES:
                potentials[key] = int(em.group(2))

    # Mastery Skills: "Earth 5, Water 4, ..."
    mas_m = re.search(r'\*\*Mastery (?:Skills?|Ranks?):\*\*\s*(.+?)(?:\n|$)', weaves_text, re.IGNORECASE)
    if mas_m:
        for em in re.finditer(r'(\w+)\s+(\d+)', mas_m.group(1)):
            key = em.group(1).lower()
            if key in ENERGY_TYPES:
                mastery[key] = int(em.group(2))

    # Strip structured fields from notes, keep everything else as HTML
    notes_text = weaves_text
    for field in ['Casting Stat', 'Potentials', 'Energy Pool', 'Mastery Skills',
                  'Mastery Ranks', 'Targeting Roll']:
        notes_text = re.sub(
            rf'\*\*{re.escape(field)}[s]?:\*\*[^\n]*\n?', '', notes_text, flags=re.IGNORECASE
        )
    notes_html = md_to_html(notes_text.strip())

    return {
        'castingStat': casting_stat,
        'potentials': potentials,
        'mastery': mastery,
        'energyPool': {'value': energy_max, 'max': energy_max},
        'targetingRoll': targeting_roll,
        'notes': notes_html,
    }


# ── Lair actions parser ────────────────────────────────────────────────────────

def _parse_lair_section(lair_text: str, heading: str = '') -> dict:
    """
    Parse the ### Lair Feature — ... block into a lairActions dict.

    Structure:
        name        : heading after "—" or the full heading
        description : introductory paragraph(s) before the bullet list
        effects     : list of {name, description} from bullet entries
    """
    # Extract lair name from heading like "Lair Feature — Living Swamp"
    dash_m = re.search(r'[—–-]\s*(.+)$', heading)
    lair_name = dash_m.group(1).strip() if dash_m else heading.strip()

    lines = lair_text.splitlines()
    desc_lines = []
    effect_lines = []
    in_effects = False

    for line in lines:
        stripped = line.strip()
        if re.match(r'\s*-\s+\*\*', line):
            in_effects = True
        if in_effects:
            effect_lines.append(line)
        else:
            desc_lines.append(line)

    description_html = md_to_html('\n'.join(desc_lines).strip())

    # Parse individual effects from bullet list: "- **Effect Name:** description..."
    effects = []
    current_name = None
    current_desc_lines = []

    for line in effect_lines:
        m = re.match(r'\s*-\s+\*\*([^*]+)\*\*[:\s]*(.*)', line)
        if m:
            if current_name:
                effects.append({
                    'name': current_name,
                    'description': md_to_html(' '.join(current_desc_lines).strip()),
                })
            current_name = m.group(1).strip().rstrip(':')
            current_desc_lines = [m.group(2).strip()] if m.group(2).strip() else []
        elif current_name and line.strip():
            current_desc_lines.append(line.strip())

    if current_name:
        effects.append({
            'name': current_name,
            'description': md_to_html(' '.join(current_desc_lines).strip()),
        })

    return {
        'name': lair_name,
        'description': description_html,
        'effects': effects,
    }


# ── Equipment / magic implement parser ────────────────────────────────────────

def _parse_implement_type(name: str) -> str | None:
    """Return 'staff', 'rod', or 'wand' if the item name suggests a magic implement."""
    lower = name.lower()
    if 'staff' in lower or 'stave' in lower:
        return 'staff'
    if ' rod' in lower or lower.startswith('rod ') or lower == 'rod':
        return 'rod'
    if 'wand' in lower:
        return 'wand'
    return None


def _parse_charges(body: str) -> tuple[int, str]:
    """Extract (max_charges, recharge_formula) from item description text."""
    # "holds 10 charges" / "10 charges"
    charges_m = re.search(r'\b(\d+)\s+charges?\b', body, re.IGNORECASE)
    max_charges = int(charges_m.group(1)) if charges_m else 0

    # "recovers 1d8 charges at dawn" / "regains 1d6 charges"
    recharge_m = re.search(
        r'(?:recovers?|regains?)\s+([\dd+\-]+)\s+charges?',
        body, re.IGNORECASE
    )
    recharge = recharge_m.group(1) if recharge_m else ''

    return max_charges, recharge


def _parse_granted_weaves_table(body: str) -> list[dict]:
    """
    Extract weave grants from a markdown table:
    | Weave Name | Charge Cost |
    |---|---|
    | Grasping Vines | 1 |
    """
    granted = []
    # Match rows after the header separator
    rows = re.findall(r'^\|\s*([^|]+)\s*\|\s*(\d+)\s*\|', body, re.MULTILINE)
    # Skip pure separator rows (all dashes)
    for name_cell, cost_cell in rows:
        name_cell = name_cell.strip()
        if re.match(r'^[-:]+$', name_cell):
            continue
        # Skip header row
        if re.match(r'^weave', name_cell, re.IGNORECASE) and re.match(r'^\D', cost_cell.strip()):
            continue
        granted.append({'name': name_cell, 'chargeCost': int(cost_cell), 'description': ''})
    return granted


def _parse_attack_bonus(body: str) -> int:
    """Extract +N attack bonus from 'subtract 1 from the skill die (magic weapon bonus)' etc."""
    # Common pattern: "subtract N from ... (magic weapon bonus)"
    m = re.search(r'subtract\s+(\d+)\s+from.*?(?:skill|attack).*?die', body, re.IGNORECASE)
    if m:
        return int(m.group(1))
    # "+N attack bonus" pattern
    m2 = re.search(r'\+(\d+)\s+(?:attack|magic)\s+bonus', body, re.IGNORECASE)
    if m2:
        return int(m2.group(1))
    return 0


def _parse_equipment_section(equip_text: str, npc_name: str) -> list[dict]:
    """
    Parse the ### Equipment section into a list of embedded Foundry item docs.

    Supports two syntaxes:
      [[Item Name]]      — reference to a canonical magic item in magic_items.md
      #### Item Name ... — inline item definition (legacy / standalone NPCs)

    Items identified as rod/staff/wand get the appropriate item type;
    everything else becomes an 'equipment' item.
    """
    items = []

    # ── Pass 1: resolve [[Item Name]] references ──────────────────────────
    ref_pattern = re.compile(r'\[\[(.+?)\]\]')
    for m in ref_pattern.finditer(equip_text):
        ref_name = m.group(1).strip()
        if ref_name in _MAGIC_ITEMS:
            item_doc = copy.deepcopy(_MAGIC_ITEMS[ref_name])
            item_doc['_id'] = _item_id(npc_name, ref_name)
            items.append(item_doc)
        else:
            print(f'  [WARN] [[{ref_name}]] not found in magic items lookup — skipping.')

    # Remove reference lines so they don't bleed into the inline parser
    remaining = ref_pattern.sub('', equip_text).strip()
    if not remaining:
        return items

    # ── Pass 2: parse inline #### item definitions ────────────────────────
    # Split on #### sub-headings for individual items
    item_sections = re.split(r'^#{3,6}\s+', remaining, flags=re.MULTILINE)
    # First element is any text before the first sub-heading; skip if empty
    for section in item_sections:
        section = section.strip()
        if not section:
            continue

        # First line is the item name (no heading marker since we split on it)
        lines = section.splitlines()
        item_name = lines[0].strip() if lines else 'Unknown Item'
        item_body = '\n'.join(lines[1:]).strip()

        implement_type = _parse_implement_type(item_name)
        item_id = _item_id(npc_name, item_name)

        if implement_type:
            max_charges, recharge = _parse_charges(item_body)
            granted_weaves = _parse_granted_weaves_table(item_body)
            attack_bonus = _parse_attack_bonus(item_body)

            # Parse properties as HTML from the **Properties:** bullet block
            props_m = re.search(
                r'\*\*Properties:\*\*(.+?)(?=\n\*\*|\Z)',
                item_body, re.DOTALL
            )
            properties_text = props_m.group(1).strip() if props_m else ''

            item_doc = {
                '_id': item_id,
                'name': item_name,
                'type': implement_type,
                'img': _choose_implement_icon(implement_type),
                'system': {
                    'description': {'value': md_to_html(section)},
                    'implementType': implement_type,
                    'attackBonus': attack_bonus,
                    'charges': {
                        'value': max_charges,
                        'max': max_charges,
                        'recharge': recharge,
                        'rechargePeriod': 'dawn',
                    },
                    'properties': [properties_text] if properties_text else [],
                    'grantedWeaves': granted_weaves,
                    'isMagical': True,
                    'identified': True,
                    'weight': 4,
                    'cost': 0,
                    'quantity': 1,
                    'equipped': True,
                    'rarity': 'uncommon',
                    'requiresAttunement': False,
                    'notes': '',
                },
                'effects': [],
                'flags': {},
            }
        else:
            # Generic equipment item for non-implement entries
            item_doc = {
                '_id': item_id,
                'name': item_name,
                'type': 'equipment',
                'img': 'icons/svg/item-bag.svg',
                'system': {
                    'description': {'value': md_to_html(section)},
                    'equipmentType': 'adventuring-gear',
                    'isMagical': False,
                    'identified': True,
                    'weight': 1,
                    'cost': 0,
                    'quantity': 1,
                    'equipped': True,
                    'rarity': '',
                    'requiresAttunement': False,
                    'notes': '',
                },
                'effects': [],
                'flags': {},
            }

        ensure_key(item_doc, 'items')
        items.append(item_doc)

    return items


def _choose_implement_icon(implement_type: str) -> str:
    icons = {
        'staff': 'icons/weapons/staves/staff-simple-wood.webp',
        'rod':   'icons/weapons/wands/wand-gemmed-gold.webp',
        'wand':  'icons/weapons/wands/wand-simple-pine.webp',
    }
    return icons.get(implement_type, 'icons/svg/item-bag.svg')


# ── Section splitter for new-style (### heading) entries ──────────────────────

def _split_sections_by_heading(body: str) -> dict[str, str]:
    """
    Split a body with ## / ### sub-headings into a dict of {section_name: content}.

    Only splits on level-2 and level-3 headings (## and ###) so that deeper
    headings (#### item names inside ### Equipment, etc.) remain as part of
    their parent section's content.

    Handles headings like:
        ### Attacks
        ### Special Abilities
        ### Weaves
        ### Equipment
        ### Lair Feature — Living Swamp
        ### Tactics
        ### Description
        ### Resilient Defense
    """
    heading_re = re.compile(r'^#{2,3}\s+(.+)$', re.MULTILINE)
    matches = list(heading_re.finditer(body))

    if not matches:
        return {'__flat__': body}

    sections = {}
    # Capture text before the first heading as the "header" block
    pre = body[:matches[0].start()].strip()
    if pre:
        sections['__header__'] = pre

    for i, m in enumerate(matches):
        heading = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        sections[heading] = body[start:end].strip()

    return sections


def _normalise_section_key(heading: str) -> str:
    """Map heading text to canonical section keys."""
    h = heading.lower().strip()
    if h.startswith('attack'):
        return 'attacks'
    if h.startswith('special abilit') or h.startswith('special traits'):
        return 'special_abilities'
    if h.startswith('reaction'):
        return 'reactions'
    if h.startswith('weave'):
        return 'weaves'
    if h.startswith('equipment'):
        return 'equipment'
    if h.startswith('lair'):
        return f'lair:{heading}'
    if h.startswith('tactic'):
        return 'tactics'
    if h.startswith('description'):
        return 'description'
    if h.startswith('resilient') or h.startswith('legendary') or h.startswith('mythic'):
        return 'special_abilities'
    if h.startswith('resistances') or h.startswith('immunities'):
        return 'resistances'
    return f'misc:{heading}'


# ── Core flat-style field extraction (old format) ────────────────────────────

def _extract_flat_section(body: str, label: str) -> str:
    """
    Extract a multi-line section that starts with **Label:** and ends at the
    next **Field:** marker or end of string.
    """
    pat = rf'\*\*{re.escape(label)}:\*\*\s*(.*?)(?=\n\*\*[A-Z][^:]+:\*\*|\Z)'
    m = re.search(pat, body, re.DOTALL | re.IGNORECASE)
    return m.group(1).strip() if m else ''


# ── NPC document builder ───────────────────────────────────────────────────────

def build_npc_doc(name: str, body: str) -> dict:
    """Build a Foundry VTT NPC actor document from a parsed entry."""

    sections = _split_sections_by_heading(body)
    is_sectioned = '__flat__' not in sections

    # Header block (flat-style fields present in both formats)
    header_block = sections.get('__header__', body if not is_sectioned else '')

    # ── Core stat extraction ───────────────────────────────────────────────
    def _get(field_name):
        """Try to find field in both header block and flat body."""
        val = _field(header_block, field_name)
        if val is None:
            val = _field(body, field_name)
        return val

    tr_raw  = _get('Threat Rating') or '1'
    tr      = _parse_tr(tr_raw)
    size    = _parse_size(_get('Size') or 'Medium')

    hp_raw  = _get('HP') or '16 (Con 2 × 8)'
    hp_val, hp_max, hp_mult = _parse_hp(hp_raw)

    dr_raw  = _get('DR') or '0'
    dr_val  = _parse_dr(dr_raw)

    spd_raw   = _get('Speed') or '30 ft'
    speed     = _parse_speed(spd_raw)

    attr_raw  = _get('Attributes') or 'Str 2 / Con 2 / Agi 2 / Dex 2 / Int 2 / Wis 2 / Cha 2 / Luck 2'
    attributes_raw = _parse_attributes(attr_raw)
    attributes = {k: {'value': v, 'label': k.capitalize()} for k, v in attributes_raw.items()}

    skill_raw = _get('Skills') or ''
    skills    = _parse_skills(skill_raw)

    senses_raw = _get('Senses') or 'Normal'
    vision     = _parse_senses(senses_raw)
    senses_notes = senses_raw

    ct_raw  = _get('Creature Type') or 'Humanoid'
    creature_type, creature_subtype = _parse_creature_type(ct_raw)

    lang_raw   = _get('Languages') or 'Common'
    languages  = _parse_languages(lang_raw)

    init_raw   = _get('Initiative Bonus') or ''
    init_m     = re.search(r'[+]?\s*(\d+)', init_raw)
    initiative_bonus = int(init_m.group(1)) if init_m else attributes_raw.get('agility', 2)

    # Luck
    luck_val = attributes_raw.get('luck', 2)

    # ── Section-specific parsing ───────────────────────────────────────────

    attacks_html          = ''
    special_abilities_html = ''
    reactions_html        = ''
    tactics_text          = ''
    description_html      = ''
    resistances_html      = ''
    weaves_data           = None
    lair_data             = None
    embedded_items        = []

    if is_sectioned:
        for heading, content in sections.items():
            if heading.startswith('__'):
                continue
            key = _normalise_section_key(heading)

            if key == 'attacks':
                attacks_html = md_to_html(content)
            elif key == 'special_abilities':
                existing = special_abilities_html
                new_html = md_to_html(content)
                special_abilities_html = (existing + '\n' + new_html).strip() if existing else new_html
            elif key == 'reactions':
                reactions_html = md_to_html(content)
            elif key == 'weaves':
                weaves_data = _parse_weaves_section(content)
            elif key == 'equipment':
                embedded_items = _parse_equipment_section(content, name)
            elif key.startswith('lair:'):
                lair_data = _parse_lair_section(content, heading)
            elif key == 'tactics':
                tactics_text = content
            elif key == 'description':
                description_html = md_to_html(content)
            elif key == 'resistances':
                resistances_html = md_to_html(content)
            else:
                # Misc sections appended to special abilities
                misc_html = f'<h4>{heading}</h4>\n' + md_to_html(content)
                special_abilities_html = (special_abilities_html + '\n' + misc_html).strip()
    else:
        # Old flat format
        attacks_html = md_to_html(_extract_flat_section(body, 'Attacks'))
        special_abilities_html = md_to_html(_extract_flat_section(body, 'Special Abilities'))
        reactions_html = md_to_html(_extract_flat_section(body, 'Reactions'))
        tactics_text = _field(body, 'Tactics') or ''
        description_html = md_to_html(_field(body, 'Description') or '')
        equip_raw = _field(body, 'Equipment') or ''
        if equip_raw:
            embedded_items = _parse_equipment_section(equip_raw, name)

        # Check for inline weave block (old flat style rarely has one, but handle it)
        if re.search(r'\*\*Casting Stat:\*\*', body, re.IGNORECASE):
            # Grab everything after "Casting Stat" through the first blank section
            weave_block_m = re.search(
                r'\*\*Casting Stat:\*\*.+?(?=\n\*\*[A-Z][^:]+:\*\*\s*\n|\Z)',
                body, re.DOTALL
            )
            if weave_block_m:
                weaves_data = _parse_weaves_section(weave_block_m.group(0))

    # ── Immunities / resistances ──────────────────────────────────────────
    immunities_damage = []
    immunities_conditions = []
    resistances = []

    imm_m = re.search(
        r'\*\*Immunities?:\*\*\s*(.+?)(?:\n\*\*|\Z)',
        body, re.DOTALL | re.IGNORECASE
    )
    if imm_m:
        imm_text = imm_m.group(1)
        for dtype in ['poison', 'lightning', 'fire', 'cold', 'necrotic', 'radiant', 'psychic', 'force', 'acid', 'thunder']:
            if re.search(rf'\b{dtype}\b', imm_text, re.IGNORECASE):
                immunities_damage.append(dtype)
        for cond in ['blinded', 'deafened', 'exhaustion', 'frightened', 'grappled',
                     'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained',
                     'stunned', 'unconscious', 'charmed']:
            if re.search(rf'\b{cond}\b', imm_text, re.IGNORECASE):
                immunities_conditions.append(cond)

    # ── Build the actor document ──────────────────────────────────────────

    weaves_block = weaves_data if weaves_data else {
        'castingStat': '',
        'potentials': {e: 0 for e in ENERGY_TYPES},
        'mastery': {e: 0 for e in ENERGY_TYPES},
        'energyPool': {'value': 0, 'max': 0},
        'targetingRoll': '',
        'notes': '',
    }

    lair_block = lair_data if lair_data else {
        'name': '',
        'description': '',
        'effects': [],
    }

    doc = {
        '_id': _npc_id(name),
        'name': name,
        'type': 'npc',
        'img': DEFAULT_NPC_IMG,
        'system': {
            'biography': {'value': description_html},
            'visibility': {'concealed': False, 'hidden': False, 'invisible': False},
            'vision': {
                'lowLight': vision.get('lowLight', False),
                'darkvision': vision.get('darkvision', 0),
                'blindsight': vision.get('blindsight', 0),
                'tremorsense': vision.get('tremorsense', 0),
                'perfectSight': 0,
            },
            'attributes': attributes,
            'hp': {'value': hp_val, 'max': hp_max, 'temp': 0},
            'dr': {'value': dr_val, 'bonus': 0},
            'luck': {'current': luck_val, 'max': luck_val},
            'cr': {'value': tr},
            'skills': skills,
            'size': size,
            'speed': speed,
            'creatureType': creature_type,
            'creatureSubtype': creature_subtype,
            'hpMultiplier': hp_mult,
            'immunities': {
                'damageTypes': immunities_damage,
                'conditions': immunities_conditions,
            },
            'resistances': resistances,
            'languages': languages,
            'sensesNotes': senses_notes,
            'tactics': tactics_text,
            'attacksNotes': attacks_html,
            'specialAbilitiesNotes': special_abilities_html,
            'reactionsNotes': reactions_html,
            'weaves': weaves_block,
            'lairActions': lair_block,
            'npcType': 'npc',
            'attitude': 'indifferent',
        },
        'items': embedded_items,
        'effects': [],
        'flags': {},
        'prototypeToken': {
            'name': name,
            'img': DEFAULT_NPC_IMG,
            'width': _token_size(size),
            'height': _token_size(size),
            'disposition': -1,
        },
    }

    ensure_key(doc, 'actors')
    return doc


def _token_size(size: str) -> int:
    return {'tiny': 0.5, 'small': 1, 'medium': 1, 'large': 2, 'huge': 3, 'gargantuan': 4}.get(size, 1)


# ── Main ───────────────────────────────────────────────────────────────────────

def _load_magic_items() -> None:
    """Populate _MAGIC_ITEMS from build_magic_items_pack.load_magic_items_lookup()."""
    global _MAGIC_ITEMS
    try:
        magic_script = Path(__file__).parent / 'build_magic_items_pack.py'
        if not magic_script.exists():
            print('WARNING: build_magic_items_pack.py not found; [[...]] references disabled.')
            return
        # Import the sibling script as a module
        import importlib.util
        spec = importlib.util.spec_from_file_location('build_magic_items_pack', magic_script)
        mod  = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        _MAGIC_ITEMS = mod.load_magic_items_lookup()
        print(f'Loaded {len(_MAGIC_ITEMS)} magic item(s): {list(_MAGIC_ITEMS.keys())}')
    except Exception as exc:
        print(f'WARNING: Could not load magic items lookup: {exc}')


def main():
    _load_magic_items()

    if not BESTIARY_MD.exists():
        print(f"ERROR: Bestiary file not found: {BESTIARY_MD}")
        return False

    content = BESTIARY_MD.read_text(encoding='utf-8')
    entries = split_npc_entries(content)

    if not entries:
        print("ERROR: No NPC entries found in bestiary.md")
        return False

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Remove stale source files
    for old in OUTPUT_DIR.glob('*.json'):
        old.unlink()

    written = 0
    skipped = 0
    names_seen: set[str] = set()

    for name, body in entries:
        # Deduplicate (some entries repeat at different heading levels)
        name_key = name.strip().lower()
        if name_key in names_seen:
            skipped += 1
            continue
        names_seen.add(name_key)

        try:
            doc = build_npc_doc(name, body)
        except Exception as exc:
            print(f"  [WARN] Failed to parse '{name}': {exc}")
            skipped += 1
            continue

        # Sanitise filename
        slug = re.sub(r'[^\w\s-]', '', name).strip()
        slug = re.sub(r'[\s]+', '-', slug).lower()
        slug = re.sub(r'-+', '-', slug)
        out_path = OUTPUT_DIR / f'{slug}.json'

        out_path.write_text(
            json.dumps(doc, ensure_ascii=False, indent=2),
            encoding='utf-8',
        )
        print(f"  [+] {name}")
        written += 1

    print(f"\n✓ Wrote {written} NPC source files to {OUTPUT_DIR}")
    if skipped:
        print(f"  ({skipped} entries skipped — duplicates or parse errors)")
    print(f"\nNext step: Run 'npm run pack:bestiary' to compile to LevelDB format")
    return True


if __name__ == '__main__':
    import sys
    sys.exit(0 if main() else 1)
