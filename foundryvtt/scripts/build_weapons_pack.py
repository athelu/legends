#!/usr/bin/env python3
"""
Build weapons compendium pack from parsed weapons.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[\\/]+", "-", s)
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s]+", "-", s)
    return s.strip("-")


def parse_weapons_md(md_file):
    """
    Parse weapons.md and extract weapon items.
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # If a PACK marker is present, only import content after it.
    # Marker format: <!-- PACK:weapons -->
    m = re.search(r"<!--\s*PACK:weapons\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Split by weapon sections (### Heading)
    weapon_sections = re.split(r'^###\s+', content, flags=re.MULTILINE)[1:]
    
    # Skip obvious non-weapon headings
    skip_names = {"weapon properties", "weapon table", "weapon damage keywords", "range format"}

    for weapon_section in weapon_sections:
        lines = weapon_section.split('\n')
        weapon_name = lines[0].strip()
        if not weapon_name:
            continue
        if weapon_name.strip().lower() in skip_names:
            continue
        
        item = {
            '_id': generate_id(),
            'name': weapon_name,
            'type': 'weapon',
            'img': 'icons/weapons/swords/sword-long-crossguard-brown.webp',
            'system': {
                'description': '',
                # structured damage object
                'damage': {
                    'base': None,
                    'alternate': None,
                    'raw': ''
                },
                # human-readable range and parsed attackModes
                'range': '',
                'attackModes': [],
                'weight': {
                    'raw': '',
                    'lbs': None
                },
                'cost': {
                    'raw': '',
                    'gp': None
                },
                'properties': []
            },
            'effects': []
        }
        
        section_text = '\n'.join(lines[1:]).strip()

        # Extract common metadata which uses bold markup like '**Cost:** 40 gp | **Weight:** 6 lbs'
        def extract(pattern):
            m = re.search(pattern, section_text)
            return m.group(1).strip() if m else None

        # Patterns handle bold markup and optional pipe separators
        cost = extract(r"\*\*Cost:\*\*\s*([^|\n]+)")
        weight = extract(r"\*\*Weight:\*\*\s*([^|\n]+)")
        damage = extract(r"\*\*Damage:\*\*\s*([^|\n]+)")
        properties_raw = extract(r"\*\*Properties:\*\*\s*([^|\n]+)")
        damage_type = extract(r"\*\*Damage Type:\*\*\s*([^|\n]+)")
        range_raw = extract(r"\*\*Range:\*\*\s*([^|\n]+)")
        reload_raw = extract(r"\*\*Reload:\*\*\s*([^|\n]+)")
        requirements = extract(r"\*\*Requirements:\*\*\s*([^|\n]+)")

        # Parse properties into a list of bracketed tokens
        properties = []
        if properties_raw:
            properties = [p.strip() for p in re.findall(r"\[([^\]]+)\]", properties_raw)]

        # Remove metadata lines from the description
        description = re.sub(r"\*\*(?:Cost|Weight|Damage|Properties|Damage Type|Range|Reload|Requirements):\*\*[^\n]*", "", section_text).strip()
        # Also remove standalone metadata lines like '**Damage Type:** ...' leftover
        description = description.strip('\n').strip()

        item['system']['description'] = description
        item['system']['properties'] = properties
        item['system']['range'] = range_raw or ''

        # parse cost (convert to gp)
        def parse_cost_to_gp(text):
            if not text: return None
            t = text.strip()
            m = re.search(r"([0-9]+(\.[0-9]+)?)\s*(gp|sp|cp)", t)
            if not m:
                return None
            val = float(m.group(1))
            unit = m.group(3)
            if unit == 'gp':
                return val
            if unit == 'sp':
                return val / 10.0
            if unit == 'cp':
                return val / 100.0
            return None

        item['system']['cost']['raw'] = cost or ''
        item['system']['cost']['gp'] = parse_cost_to_gp(cost or '')

        # parse weight (lbs)
        def parse_weight_lbs(text):
            if not text: return None
            t = text.strip()
            if t == '—' or t == '':
                return None
            m = re.search(r"([0-9]+(\.[0-9]+)?)\s*(lbs|lb|pounds?)", t)
            if not m:
                # sometimes weight is given as integer without unit
                m2 = re.search(r"([0-9]+(\.[0-9]+)?)", t)
                if m2:
                    return float(m2.group(1))
                return None
            return float(m.group(1))

        item['system']['weight']['raw'] = weight or ''
        item['system']['weight']['lbs'] = parse_weight_lbs(weight or '')

        # parse damage string into base/alternate
        def parse_damage(text):
            if not text: return (None, None)
            t = text.strip()
            # handle formats like '8/9' or '6' or '4/5'
            parts = re.split(r"\s*/\s*", t)
            try:
                base = int(parts[0])
            except Exception:
                base = None
            alt = None
            if len(parts) > 1:
                try:
                    alt = int(parts[1])
                except Exception:
                    alt = None
            return (base, alt)

        base, alt = parse_damage(damage)
        item['system']['damage']['base'] = base
        item['system']['damage']['alternate'] = alt
        item['system']['damage']['raw'] = damage or ''

        # damage type tokens
        dmg_types = []
        if damage_type:
            dmg_types = [d.strip().lower() for d in re.findall(r"\[([^\]]+)\]", damage_type)]
        item['system']['damage']['type'] = dmg_types

        # additional metadata
        if reload_raw:
            item['system']['reload'] = reload_raw
        if requirements:
            item['system']['requirements'] = requirements

        # Build attackModes: melee by default
        attack_modes = []
        # decide if finesse (use agility) else strength for melee
        melee_attr = 'agility' if any(p.lower() == 'finesse' for p in properties) else 'strength'
        # default melee mode
        melee_mode = {
            'name': 'Melee',
            'type': 'melee',
            'skill': 'meleeCombat',
            'damageAttr': melee_attr,
            'defenseType': 'melee',
            'damage': { 'base': base, 'alternate': alt },
            'range': { 'normal': 0, 'medium': 0, 'long': 0 }
        }
        attack_modes.append(melee_mode)

        # If ranged or thrown, add a ranged mode
        ranged_present = any(p.lower() in ('ranged','thrown') for p in properties) or bool(range_raw)
        if ranged_present:
            # parse range_raw like '80/160/320' or '30/60 when thrown' -> numbers
            def parse_range_vals(text):
                if not text: return {'normal': 0, 'medium': 0, 'long': 0}
                nums = [int(n) for n in re.findall(r"([0-9]+)", text)]
                if len(nums) == 1:
                    return {'normal': nums[0], 'medium': nums[0]*2, 'long': nums[0]*4}
                if len(nums) == 2:
                    return {'normal': nums[0], 'medium': nums[1], 'long': nums[1]*2}
                if len(nums) >= 3:
                    return {'normal': nums[0], 'medium': nums[1], 'long': nums[2]}
                return {'normal': 0, 'medium': 0, 'long': 0}

            rng = parse_range_vals(range_raw)
            ranged_mode = {
                'name': 'Ranged',
                'type': 'ranged',
                'skill': 'rangedCombat',
                'damageAttr': 'agility',
                'defenseType': 'ranged',
                'damage': { 'base': base, 'alternate': alt },
                'range': rng
            }
            attack_modes.append(ranged_mode)

        item['system']['attackModes'] = attack_modes
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Try to parse from markdown
    md_file = script_dir / "ttrpg" / "weapons.md"
    if md_file.exists():
        print("Parsing weapons.md...")
        items = parse_weapons_md(md_file)
        print(f"  Extracted {len(items)} weapon items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "weapons" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        # write sanitized filenames
        source_dir.mkdir(parents=True, exist_ok=True)
        for item in items:
            safe = slugify(item['name'])
            json_file = source_dir / f"{safe}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding weapons pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "weapons"
    success = build_pack_from_source(pack_dir, "weapons")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
