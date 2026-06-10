#!/usr/bin/env python3
"""
Build magic-items Item pack from ttrpg/magic_items.md.

Each ## heading in magic_items.md defines one magic item (staff, rod, or wand).
Sub-sections (### Granted Weaves) are parsed for charge costs.

Usage:
    python build_magic_items_pack.py
"""

import json
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))
from pack_utils import generate_stable_id, md_to_html

SOURCE_MD = SCRIPT_DIR.parent.parent / 'ttrpg' / 'magic_items.md'
OUTPUT_DIR = SCRIPT_DIR.parent / 'packs' / 'magic-items' / '_source'

IMPLEMENT_ICONS = {
    'staff': 'icons/weapons/staves/staff-ornate-gold.webp',
    'rod':   'icons/weapons/staves/staff-gold-jewels-brown.webp',
    'wand':  'icons/weapons/wands/wand-gem-yellow.webp',
    'ring':  'icons/equipment/worn/ring-gold-sigil.webp',
}

RECHARGE_PERIOD_MAP = {
    'dawn':       'dawn',
    'dusk':       'dusk',
    'short rest': 'shortRest',
    'long rest':  'longRest',
    'never':      'never',
}


# ---------------------------------------------------------------------------
# Field parsers
# ---------------------------------------------------------------------------

def _item_id(name: str) -> str:
    return generate_stable_id(f'magic-item:{name}')


def _parse_implement_type(body: str, name: str) -> str:
    """Determine implement type from **Type:** field, falling back to name."""
    m = re.search(r'\*\*Type:\*\*\s*(\w+)', body, re.IGNORECASE)
    if m:
        return m.group(1).strip().lower()
    lower = name.lower()
    if 'staff' in lower or 'stave' in lower:
        return 'staff'
    if ' rod' in lower or lower.startswith('rod ') or lower == 'rod':
        return 'rod'
    if 'wand' in lower:
        return 'wand'
    if 'ring' in lower:
        return 'ring'
    return 'equipment'


def _parse_rarity(body: str) -> str:
    m = re.search(r'\*\*Rarity:\*\*\s*(.+?)$', body, re.IGNORECASE | re.MULTILINE)
    return m.group(1).strip().lower().replace(' ', '-') if m else ''


def _parse_attack_bonus(body: str) -> int:
    # "**Attack Bonus:** +1"
    m = re.search(r'\*\*Attack Bonus:\*\*\s*\+?(-?\d+)', body, re.IGNORECASE)
    if m:
        return int(m.group(1))
    # "subtract N from the skill die (magic weapon bonus)"
    m2 = re.search(r'subtract\s+(\d+)\s+from.*?(?:skill|attack).*?die', body, re.IGNORECASE)
    if m2:
        return int(m2.group(1))
    return 0


def _parse_damage(body: str, item_type: str) -> dict | None:
    """Return damage dict for staff/rod; None for wand."""
    if item_type == 'wand':
        return None
    # "**Damage:** 1d6 bludgeoning (Versatile)"
    m = re.search(r'\*\*Damage:\*\*\s*1d(\d+)\s+(\w+)', body, re.IGNORECASE)
    base = int(m.group(1)) if m else (6 if item_type == 'staff' else 4)
    dtype = m.group(2).lower() if m else 'bludgeoning'
    properties = ['versatile'] if re.search(r'\bversatile\b', body, re.IGNORECASE) else []
    return {'base': base, 'type': dtype, 'properties': properties}


def _parse_weight(body: str, default: float = 4.0) -> float:
    m = re.search(r'\*\*Weight:\*\*\s*([\d.]+)', body, re.IGNORECASE)
    return float(m.group(1)) if m else default


def _parse_charges(body: str) -> tuple[int, str, str]:
    """Return (max_charges, recharge_formula, recharge_period)."""
    # "**Charges:** 10/10 (recharge: 1d8 at dawn)"
    m = re.search(
        r'\*\*Charges:\*\*\s*(\d+)(?:/\d+)?\s*\(recharge:\s*([\dd+\-]+)\s+at\s+([\w ]+?)\)',
        body, re.IGNORECASE
    )
    if m:
        period_raw = m.group(3).strip().lower()
        period = RECHARGE_PERIOD_MAP.get(period_raw, 'dawn')
        return int(m.group(1)), m.group(2), period

    # "**Charges:** 1/1 (recharge: Long Rest)" — no formula, period only
    m2 = re.search(
        r'\*\*Charges:\*\*\s*(\d+)/\d+\s*\(recharge:\s*([\w ]+?)\)',
        body, re.IGNORECASE
    )
    if m2:
        period_raw = m2.group(2).strip().lower()
        period = RECHARGE_PERIOD_MAP.get(period_raw, 'longRest')
        return int(m2.group(1)), '', period

    # Fallback: prose description
    charges_m = re.search(r'\b(\d+)\s+charges?\b', body, re.IGNORECASE)
    max_c = int(charges_m.group(1)) if charges_m else 0
    recharge_m = re.search(
        r'(?:recovers?|regains?)\s+([\dd+\-]+)\s+charges?',
        body, re.IGNORECASE
    )
    formula = recharge_m.group(1) if recharge_m else ''
    return max_c, formula, 'dawn'


def _parse_granted_weaves(body: str) -> list[dict]:
    """Extract rows from the Granted Weaves markdown table."""
    granted = []
    rows = re.findall(r'^\|\s*([^|]+)\s*\|\s*(\d+)\s*\|', body, re.MULTILINE)
    for name_cell, cost_cell in rows:
        name_cell = name_cell.strip()
        if re.match(r'^[-:]+$', name_cell):
            continue
        if re.match(r'^weave', name_cell, re.IGNORECASE):
            continue
        granted.append({'name': name_cell, 'chargeCost': int(cost_cell), 'description': ''})
    return granted


def _parse_requires_attunement(body: str) -> bool:
    m = re.search(r'\*\*Requires Attunement:\*\*\s*(yes|true|no|false)', body, re.IGNORECASE)
    return m.group(1).lower() in ('yes', 'true') if m else False


VALID_ENERGIES = {'earth', 'air', 'fire', 'water', 'positive', 'negative', 'space', 'time'}

def _parse_primary_energy(body: str) -> str:
    """Return the primary energy type for targeting rolls, e.g. 'earth'."""
    m = re.search(r'\*\*Primary Energy:\*\*\s*(\w+)', body, re.IGNORECASE)
    if m:
        val = m.group(1).strip().lower()
        if val in VALID_ENERGIES:
            return val
    return ''


# ---------------------------------------------------------------------------
# Document builder
# ---------------------------------------------------------------------------

def build_item_doc(name: str, body: str) -> dict:
    item_type   = _parse_implement_type(body, name)
    rarity      = _parse_rarity(body)
    primary_energy = _parse_primary_energy(body)
    weight      = _parse_weight(body)
    max_charges, recharge_formula, recharge_period = _parse_charges(body)
    granted_weaves = _parse_granted_weaves(body)
    requires_attunement = _parse_requires_attunement(body)
    icon = IMPLEMENT_ICONS.get(item_type, 'icons/svg/item-bag.svg')

    is_ring = (item_type == 'ring')
    weight      = _parse_weight(body, default=0.0 if is_ring else 4.0)

    system = {
        'description':       {'value': md_to_html(body)},
        'primaryEnergy':     primary_energy,
        'charges': {
            'value':          max_charges,
            'max':            max_charges,
            'recharge':       recharge_formula,
            'rechargePeriod': recharge_period,
        },
        'properties':        [],
        'grantedWeaves':     granted_weaves,
        'isMagical':         True,
        'identified':        True,
        'weight':            weight,
        'cost':              0,
        'quantity':          1,
        'equipped':          False,
        'rarity':            rarity,
        'requiresAttunement': requires_attunement,
        'notes':             '',
    }

    if is_ring:
        system['requiresMagicalTrait'] = False
        system['automaticActivation']  = True
        system['activationMargin']     = 2
    else:
        attack_bonus = _parse_attack_bonus(body)
        damage       = _parse_damage(body, item_type)
        system['implementType'] = item_type
        system['attackBonus']   = attack_bonus
        if damage:
            system['damage'] = damage

    return {
        '_id':    _item_id(name),
        'name':   name,
        'type':   item_type,
        'img':    icon,
        'system': system,
        'effects': [],
        'flags':  {},
    }


# ---------------------------------------------------------------------------
# Entry splitting
# ---------------------------------------------------------------------------

def split_item_entries(content: str) -> list[tuple[str, str]]:
    """
    Split magic_items.md into (name, body) pairs at ## headings.
    Sections without a **Type:** field AND without an implement keyword in the
    heading are skipped (they are prose / category headers).
    """
    entries = []
    pattern = re.compile(r'^##\s+(.+)$', re.MULTILINE)
    matches = list(pattern.finditer(content))
    for i, m in enumerate(matches):
        name  = m.group(1).strip()
        start = m.end()
        end   = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        body  = content[start:end].strip()

        has_type_field = bool(re.search(r'\*\*Type:\*\*', body, re.IGNORECASE))
        name_lower = name.lower()
        # Name-based fallback only applies when the body also has Charges (prose sections won't)
        name_is_implement = (
            any(k in name_lower for k in ('staff', 'stave', ' rod', 'wand', 'ring'))
            and bool(re.search(r'\*\*Charges:\*\*', body, re.IGNORECASE))
        )

        if not has_type_field and not name_is_implement:
            continue  # skip prose / category headings

        entries.append((name, body))
    return entries


# ---------------------------------------------------------------------------
# Public helper — used by build_bestiary_pack.py
# ---------------------------------------------------------------------------

def load_magic_items_lookup() -> dict[str, dict]:
    """
    Parse magic_items.md and return {item_name: item_doc}.
    Used by the bestiary builder to resolve [[Item Name]] references.
    """
    if not SOURCE_MD.exists():
        return {}
    content = SOURCE_MD.read_text(encoding='utf-8')
    return {name: build_item_doc(name, body) for name, body in split_item_entries(content)}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    if not SOURCE_MD.exists():
        print(f'ERROR: Source file not found: {SOURCE_MD}')
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    content = SOURCE_MD.read_text(encoding='utf-8')
    items   = split_item_entries(content)

    if not items:
        print('WARNING: No magic items found in magic_items.md')
        return 0

    print(f'Building magic-items pack from {len(items)} item(s)...')

    for name, body in items:
        doc       = build_item_doc(name, body)
        safe_name = re.sub(r'[^\w\-]', '_', name.lower())
        out_path  = OUTPUT_DIR / f'{safe_name}.json'
        out_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding='utf-8')
        weave_count = len(doc['system']['grantedWeaves'])
        print(f'  OK: {name} ({doc["type"]}) — {weave_count} granted weave(s), '
              f'{doc["system"]["charges"]["max"]} charges')

    print(f'\n✓ Generated {len(items)} magic item source file(s) in {OUTPUT_DIR}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
