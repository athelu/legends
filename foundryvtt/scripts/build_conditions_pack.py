#!/usr/bin/env python3
"""
Build conditions compendium pack from parsed conditions.md documentation.
Also extracts cover conditions from combat.md.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key


def create_condition_item(condition_name, condition_text, current_category):
    """
    Create a condition item from parsed name and text.
    Returns the item dict or None if it should be skipped.
    """
    if not condition_name or not condition_text:
        return None

    # Clean up condition name by removing parenthetical suffixes
    condition_name = re.sub(r'\s*\([^)]*\)', '', condition_name).strip()

    # Filter out non-condition headers (subsections, notes, etc.)
    name_lower = condition_name.lower()
    skip_patterns = [
        r'effect:?\s*$',
        r'duration:?\s*$',
        r'recovery:?\s*$',
        r'common sources:?\s*$',
        r'escaping',
        r'initiating',
        r'gaining',
        r'stopping',
        r'.*progression:?\s*$',
        r'.*interaction.*notes',
        r'poison types',
        r'stun conditions:?\s*$',
        r'movement conditions:?\s*$',
        r'.*:\s*$'  # Skip anything ending with just a colon
    ]

    if any(re.match(pattern, name_lower) for pattern in skip_patterns):
        return None

    # Skip very short condition names (likely headers)
    if len(condition_name) < 4:
        return None

    # Skip if text is too short
    if len(condition_text) < 20:
        return None

    # Create base item
    item = {
        '_id': generate_id(),
        'name': condition_name,
        'type': 'condition',
        'img': 'icons/svg/hazard.svg',
        'system': {
            'label': condition_name,
            'category': current_category,
            'description': condition_text,
            'tokenIcon': '',
            'activeEffects': [],
            'stacking': 'replace',
            'severity': 'moderate',
            'overlayPriority': 20
        },
        'flags': {}
    }

    # Determine icon based on category and name
    if 'frighten' in name_lower or 'flee' in name_lower or 'cower' in name_lower:
        item['img'] = 'icons/svg/terror.svg'
        item['system']['tokenIcon'] = 'icons/svg/terror.svg'
    elif 'blind' in name_lower:
        item['img'] = 'icons/svg/blind.svg'
        item['system']['tokenIcon'] = 'icons/svg/blind.svg'
    elif 'deaf' in name_lower:
        item['img'] = 'icons/svg/deaf.svg'
        item['system']['tokenIcon'] = 'icons/svg/deaf.svg'
    elif 'prone' in name_lower:
        item['img'] = 'icons/svg/falling.svg'
        item['system']['tokenIcon'] = 'icons/svg/falling.svg'
    elif 'stun' in name_lower:
        item['img'] = 'icons/svg/stoned.svg'
        item['system']['tokenIcon'] = 'icons/svg/stoned.svg'
    elif 'paralyz' in name_lower:
        item['img'] = 'icons/svg/paralysis.svg'
        item['system']['tokenIcon'] = 'icons/svg/paralysis.svg'
    elif 'ignite' in name_lower or 'burn' in name_lower or 'fire' in name_lower or 'smolder' in name_lower:
        item['img'] = 'icons/svg/fire.svg'
        item['system']['tokenIcon'] = 'icons/svg/fire.svg'
    elif 'frozen' in name_lower or 'frost' in name_lower or 'chill' in name_lower or 'numb' in name_lower:
        item['img'] = 'icons/svg/frozen.svg'
        item['system']['tokenIcon'] = 'icons/svg/frozen.svg'
    elif 'poison' in name_lower:
        item['img'] = 'icons/svg/poison.svg'
        item['system']['tokenIcon'] = 'icons/svg/poison.svg'
    elif 'bleed' in name_lower:
        item['img'] = 'icons/svg/blood.svg'
        item['system']['tokenIcon'] = 'icons/svg/blood.svg'
    elif 'grappl' in name_lower or 'restrain' in name_lower:
        item['img'] = 'icons/svg/net.svg'
        item['system']['tokenIcon'] = 'icons/svg/net.svg'
    elif 'unconscious' in name_lower or 'asleep' in name_lower or 'dying' in name_lower:
        item['img'] = 'icons/svg/unconscious.svg'
        item['system']['tokenIcon'] = 'icons/svg/unconscious.svg'
    elif 'dead' in name_lower:
        item['img'] = 'icons/svg/skull.svg'
        item['system']['tokenIcon'] = 'icons/svg/skull.svg'
    elif 'exhaust' in name_lower or 'fatigued' in name_lower:
        item['img'] = 'icons/svg/sleep.svg'
        item['system']['tokenIcon'] = 'icons/svg/sleep.svg'
    elif 'hidden' in name_lower:
        item['img'] = 'icons/svg/invisible.svg'
        item['system']['tokenIcon'] = 'icons/svg/invisible.svg'
    elif 'conceal' in name_lower:
        item['img'] = 'icons/svg/fog.svg'
        item['system']['tokenIcon'] = 'icons/svg/fog.svg'
    elif 'reveal' in name_lower:
        item['img'] = 'icons/svg/light.svg'
        item['system']['tokenIcon'] = 'icons/svg/light.svg'
    elif 'charm' in name_lower:
        item['img'] = 'icons/svg/daze.svg'
        item['system']['tokenIcon'] = 'icons/svg/daze.svg'
    elif 'sicken' in name_lower:
        item['img'] = 'icons/svg/acid.svg'
        item['system']['tokenIcon'] = 'icons/svg/acid.svg'
    elif 'weak' in name_lower:
        item['img'] = 'icons/svg/downgrade.svg'
        item['system']['tokenIcon'] = 'icons/svg/downgrade.svg'

    # Extract active effects from text (look for patterns like "add 1 to die results")
    active_effects = []

    # Pattern: "All rolls: Add X to die results"
    if re.search(r'all rolls?[:\s]+add\s+(\d+)\s+to\s+(?:die|both dice)', condition_text, re.IGNORECASE):
        match = re.search(r'all rolls?[:\s]+add\s+(\d+)\s+to\s+(?:die|both dice)', condition_text, re.IGNORECASE)
        penalty = int(match.group(1))
        active_effects.append({
            'key': 'diceMod.allRolls',
            'mode': 'add',
            'value': penalty,
            'notes': f'Add {penalty} to all die results'
        })

    # Pattern: "Attacks: Add X"
    if re.search(r'attacks?[:\s]+add\s+(\d+)', condition_text, re.IGNORECASE):
        match = re.search(r'attacks?[:\s]+add\s+(\d+)', condition_text, re.IGNORECASE)
        penalty = int(match.group(1))
        active_effects.append({
            'key': 'diceMod.attack.all',
            'mode': 'add',
            'value': penalty,
            'notes': f'Add {penalty} to attack dice'
        })

    # Pattern: "Initiative: -X"
    if re.search(r'initiative[:\s]+[−\-](\d+)', condition_text, re.IGNORECASE):
        match = re.search(r'initiative[:\s]+[−\-](\d+)', condition_text, re.IGNORECASE)
        penalty = int(match.group(1))
        active_effects.append({
            'key': 'initiative.flat',
            'mode': 'add',
            'value': -penalty,
            'notes': f'-{penalty} to initiative'
        })

    if active_effects:
        item['system']['activeEffects'] = active_effects

    # Extract damage tick info (for conditions like Ignited, Burning, Bleeding)
    damage_tick = None

    # Pattern: "Take XdY damage at the end of each turn"
    tick_match = re.search(r'take\s+(\d+d\d+|\d+)\s+(\w+\s+)?damage\s+at\s+the\s+(end|start)\s+of\s+(?:each of )?(?:your|their|the)\s+turn', condition_text, re.IGNORECASE)
    if tick_match:
        formula = tick_match.group(1)
        damage_type = (tick_match.group(2) or '').strip()
        timing = tick_match.group(3).lower()

        damage_tick = {
            'frequency': 'endOfTurn' if timing == 'end' else 'startOfTurn',
            'formula': formula
        }

        # Check if there's a save to reduce/end
        if re.search(r'reflex\s+save', condition_text, re.IGNORECASE):
            damage_tick['save'] = {
                'type': 'reflex',
                'effectOnSuccess': 'end'
            }
        elif re.search(r'fortitude\s+save', condition_text, re.IGNORECASE):
            damage_tick['save'] = {
                'type': 'fortitude',
                'effectOnSuccess': 'end'
            }

        # Add chat prompt for damage ticks
        # This tells Foundry to show damage in chat at the appropriate time
        damage_tick['showInChat'] = True
        damage_type_text = f"{damage_type} " if damage_type else ''
        damage_tick['chatMessage'] = f"Take {formula} {damage_type_text}damage from {condition_name}"

    if damage_tick:
        item['system']['damageTick'] = damage_tick

    # Extract recovery info
    recovery = None
    if re.search(r'recovery[:\s]|extinguish', condition_text, re.IGNORECASE):
        recovery = {
            'trigger': 'endOfTurn',
            'removeOnSuccess': True
        }

        # Determine save type
        if re.search(r'will\s+save', condition_text, re.IGNORECASE):
            recovery['save'] = {'type': 'will'}
        elif re.search(r'fortitude\s+save', condition_text, re.IGNORECASE):
            recovery['save'] = {'type': 'fortitude'}
        elif re.search(r'reflex\s+save', condition_text, re.IGNORECASE):
            recovery['save'] = {'type': 'reflex'}

        # Add chat prompt metadata for conditions requiring saves
        # This tells Foundry to generate a chat card for the player
        if recovery.get('save'):
            recovery['promptPlayer'] = True
            save_type = recovery['save']['type'].capitalize()
            recovery['chatMessage'] = f"Make a {save_type} save to recover from {condition_name}"

        # Check for ally assistance
        if re.search(r'ally.*(?:within|range)\s+(\d+)', condition_text, re.IGNORECASE):
            range_match = re.search(r'(?:within|range)\s+(\d+)', condition_text, re.IGNORECASE)
            if range_match:
                recovery['assistance'] = {
                    'range': int(range_match.group(1))
                }

        # Parse condition downgrades/progressions
        # Look for patterns like "2 successes: Downgrade to Frightened" or "1 success: Downgrade to Ignited"
        downgrades = {}

        # Pattern 1: "X success(es): Downgrade to [ConditionName]"
        downgrade_matches = re.findall(
            r'(\d+)\s+success(?:es)?[:\s]+(?:Downgrade|downgrade)\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            condition_text
        )
        for success_count, target_condition in downgrade_matches:
            downgrades[f'{success_count}_success'] = target_condition.strip()

        # Pattern 2: "X successes: Condition ends completely"
        end_matches = re.findall(
            r'(\d+)\s+success(?:es)?[:\s]+(?:Condition\s+ends?\s+completely|[A-Z][a-z]+\s+ends?\s+completely)',
            condition_text
        )
        for success_count in end_matches:
            downgrades[f'{success_count}_success'] = None  # None means remove completely

        # Pattern 3: "X successes: [ConditionName] ends" (e.g., "2 successes: Burning ends")
        specific_end_matches = re.findall(
            r'(\d+)\s+success(?:es)?[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+ends?(?:\s+completely)?',
            condition_text
        )
        for success_count, condition_name in specific_end_matches:
            # Only use if we haven't already captured it with Pattern 2
            key = f'{success_count}_success'
            if key not in downgrades:
                downgrades[key] = None

        # Pattern 4: "0 successes: Remains [ConditionName]"
        remain_matches = re.findall(
            r'0\s+success(?:es)?[:\s]+Remains?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            condition_text
        )
        for target_condition in remain_matches:
            downgrades['0_success'] = target_condition.strip()

        # Pattern 5: "1 success: [ConditionName] ends" for single success removal
        single_end_matches = re.findall(
            r'1\s+success[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+ends?',
            condition_text
        )
        for condition_name in single_end_matches:
            if '1_success' not in downgrades:
                downgrades['1_success'] = None

        # Edge case: Extract ally assistance downgrades separately if they differ
        # Pattern: "Ally Assistance: ... 2 successes: Downgrade to [Condition]"
        ally_section = re.search(r'Ally\s+Assistance[:\s]+.*?((?:\d+\s+success.*?\n?)+)', condition_text, re.IGNORECASE | re.DOTALL)
        if ally_section:
            ally_text = ally_section.group(1)
            ally_downgrades = {}

            ally_downgrade_matches = re.findall(
                r'(\d+)\s+success(?:es)?[:\s]+(?:Downgrade|downgrade)\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
                ally_text
            )
            for success_count, target_condition in ally_downgrade_matches:
                ally_downgrades[f'{success_count}_success'] = target_condition.strip()

            # If ally assistance has different downgrades, store them separately
            if ally_downgrades and ally_downgrades != downgrades:
                if 'assistance' in recovery:
                    recovery['assistance']['downgrades'] = ally_downgrades

        if downgrades:
            recovery['downgrades'] = downgrades

    # Check for automatic recovery
    elif re.search(r'automatically\s+ends?\s+after', condition_text, re.IGNORECASE):
        recovery = {
            'trigger': 'onEvent',
            'removeOnSuccess': False
        }

    if recovery:
        item['system']['recovery'] = recovery

    # Extract conditions that this condition applies automatically
    # Look for patterns like "Clumsy condition active" or "Unconscious condition active"
    applies_conditions = []

    # Words to exclude from condition names (common false positives)
    excluded_words = {
        'consciousness', 'hp', 'damage', 'turn', 'action', 'round', 'save',
        'check', 'roll', 'success', 'failure', 'attack', 'defense', 'movement',
        'speed', 'distance', 'range', 'target', 'effect', 'duration', 'time',
        'bonus', 'penalty', 'modifier', 'stack', 'level', 'at', 'or', 'and', 'the'
    }

    # Pattern: "[ConditionName] condition active"
    active_condition_matches = re.findall(
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+condition\s+active',
        condition_text,
        re.IGNORECASE
    )
    for applied_condition in active_condition_matches:
        clean_name = applied_condition.strip()
        # Filter out self-references and obvious non-conditions
        if clean_name and clean_name not in applies_conditions:
            # Skip if this condition is trying to apply itself
            if clean_name.lower() == name_lower:
                continue
            # Check if any word in the name is in the excluded list
            words = clean_name.lower().split()
            if not any(word in excluded_words for word in words):
                applies_conditions.append(clean_name)

    # Also check for "Also applies [Condition]" or "Grants [Condition]"
    # Use word boundaries to avoid matching partial words like "regain"
    grants_matches = re.findall(
        r'\b(?:also\s+applies?|grants?|gains?)\b[:\s]+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+condition',
        condition_text,
        re.IGNORECASE
    )
    for applied_condition in grants_matches:
        clean_name = applied_condition.strip()
        if clean_name and clean_name not in applies_conditions:
            # Skip if this condition is trying to apply itself
            if clean_name.lower() == name_lower:
                continue
            # Check if any word in the name is in the excluded list
            words = clean_name.lower().split()
            if not any(word in excluded_words for word in words):
                applies_conditions.append(clean_name)

    if applies_conditions:
        item['system']['appliesConditions'] = applies_conditions

    # Extract condition progression relationships (for reference)
    # Look for progression chains like "Frightened < Fleeing < Cowering"
    progression_match = re.search(
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*<\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*<\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        condition_text
    )
    if progression_match:
        progression = [
            progression_match.group(1).strip(),
            progression_match.group(2).strip(),
            progression_match.group(3).strip()
        ]
        # Add as metadata for reference (not in spec but useful)
        item['system']['progressionChain'] = progression

    # Determine severity based on effects
    severity = 'moderate'
    if any(word in name_lower for word in ['severe', 'major', 'extreme', 'dying', 'dead', 'paralyz', 'unconscious']):
        severity = 'severe'
    elif any(word in name_lower for word in ['minor', 'slight', 'dazed', 'singed', 'chilled']):
        severity = 'minor'

    item['system']['severity'] = severity

    # Set overlay priority based on severity
    priority_map = {'minor': 10, 'moderate': 20, 'severe': 30}
    item['system']['overlayPriority'] = priority_map.get(severity, 20)

    # Determine stacking behavior
    if 'bleed' in name_lower or 'exhaust' in name_lower:
        item['system']['stacking'] = 'stack'
    elif 'ignite' in name_lower or 'burn' in name_lower or 'fire' in name_lower:
        item['system']['stacking'] = 'duration-merge'
    else:
        item['system']['stacking'] = 'replace'

    return item


def validate_condition_downgrades(items):
    """
    Validate that all downgrade targets exist in the conditions list.
    Reports warnings for missing targets.
    """
    # Build a set of all condition names
    condition_names = {item['name'] for item in items}

    # Check each condition's downgrades
    warnings = []
    for item in items:
        recovery = item.get('system', {}).get('recovery', {})
        downgrades = recovery.get('downgrades', {})

        for success_key, target_name in downgrades.items():
            if target_name is None:
                # None means "remove completely" - this is valid
                continue

            if target_name not in condition_names:
                warnings.append(
                    f"Warning: Condition '{item['name']}' downgrades to '{target_name}' "
                    f"(on {success_key}), but '{target_name}' condition not found in pack."
                )

    if warnings:
        print("\n=== Downgrade Validation Warnings ===")
        for warning in warnings:
            print(f"  {warning}")
        print("=" * 50)

    return len(warnings) == 0


def parse_conditions_md(md_file):
    """
    Parse conditions.md and extract condition items.

    The format uses:
    - ### for both category headings AND some standalone conditions
    - #### for individual condition names within categories
    - Bullet points for effects, recovery, etc.
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    items = []
    current_category = "general"

    # Map category headings to category codes
    category_map = {
        'fear': 'fear',
        'morale': 'fear',
        'sensory': 'sensory',
        'stealth': 'visibility',
        'visibility': 'visibility',
        'physical': 'physical',
        'mental': 'mental',
        'social': 'mental',
        'incapacitation': 'incapacitation',
        'death': 'incapacitation',
        'combat': 'combat',
        'magic': 'magic',
        'movement': 'movement'
    }

    # List of ### headings that are actual conditions, not categories
    standalone_conditions = [
        'stunned',
        'grappled',
        'restrained',
        'bleeding',
        'poisoned'
    ]

    # Split by level-3 headings (### Category)
    sections = re.split(r'^### ', content, flags=re.MULTILINE)

    for section in sections[1:]:  # Skip anything before first ###
        lines = section.split('\n')
        section_title = lines[0].strip()
        section_title_lower = section_title.lower()

        # Check if this ### heading is a standalone condition
        is_standalone_condition = any(cond in section_title_lower for cond in standalone_conditions)

        if is_standalone_condition:
            # Treat this entire ### section as a single condition
            condition_name = section_title
            condition_text = '\n'.join(lines[1:]).strip()

            # Determine category based on condition type
            if 'stun' in section_title_lower:
                current_category = 'physical'
            elif 'grappl' in section_title_lower or 'restrain' in section_title_lower:
                current_category = 'movement'
            elif 'bleed' in section_title_lower or 'poison' in section_title_lower:
                current_category = 'damage-over-time'

            # Create the condition item
            item = create_condition_item(condition_name, condition_text, current_category)
            if item:
                items.append(item)
            continue

        # Otherwise, this is a category heading
        # Determine category from heading
        current_category = 'general'
        for key, val in category_map.items():
            if key in section_title_lower:
                current_category = val
                break

        # Now split this section by #### (individual conditions)
        condition_sections = re.split(r'^#### ', '\n'.join(lines[1:]), flags=re.MULTILINE)

        for cond_section in condition_sections[1:]:  # Skip text before first ####
            cond_lines = cond_section.split('\n')
            condition_name = cond_lines[0].strip()
            condition_text = '\n'.join(cond_lines[1:]).strip()

            # Create the condition item using helper function
            item = create_condition_item(condition_name, condition_text, current_category)
            if item:
                items.append(item)

    return items


def parse_cover_conditions(combat_md_file):
    """
    Parse combat.md to extract cover condition information.
    Creates cover condition items based on the cover rules.
    """
    with open(combat_md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    items = []

    # Find the Cover section
    cover_section_match = re.search(r'^### Cover\s*\n(.*?)(?=^###|\Z)', content, flags=re.MULTILINE | re.DOTALL)
    if not cover_section_match:
        return items

    cover_text = cover_section_match.group(1)

    # Create general "Covered" condition
    covered_item = {
        '_id': generate_id(),
        'name': 'Covered',
        'type': 'condition',
        'img': 'icons/svg/shield.svg',
        'system': {
            'label': 'Covered',
            'category': 'defense',
            'description': 'The creature benefits from cover: improved defenses against attacks based on degree of cover. See Cover rules in Combat chapter for details.',
            'tokenIcon': 'icons/svg/shield.svg',
            'activeEffects': [],
            'stacking': 'highest',
            'severity': 'minor',
            'overlayPriority': 15
        },
        'flags': {}
    }

    items.append(covered_item)

    # Create specific cover degree conditions
    cover_degrees = [
        {
            'name': 'Partial Cover',
            'description': 'Low wall, furniture, creature, tree trunk (¼ to ½ body covered). Against Melee: +1 DR. Against Ranged: Make Reflex save to duck behind cover (1+ successes = miss).',
            'dr_bonus': 1,
            'reflex_bonus': 0
        },
        {
            'name': 'Half Cover',
            'description': 'Portcullis, arrow slit, thick tree trunk (½ to ¾ body covered). Against Melee: +2 DR. Against Ranged: Make Reflex save (subtract 1 from both dice) to duck behind cover (1+ successes = miss).',
            'dr_bonus': 2,
            'reflex_bonus': -1
        },
        {
            'name': 'Three-Quarters Cover',
            'description': 'Murder hole, small window, only small part visible (¾+ body covered). Against Melee: +3 DR. Against Ranged: Make Reflex save (subtract 1 from both dice) to duck behind cover (1+ successes = miss).',
            'dr_bonus': 3,
            'reflex_bonus': -1
        },
        {
            'name': 'Full Cover',
            'description': 'Completely behind solid obstacle. Cannot be directly targeted by attacks or most weaves.',
            'dr_bonus': 0,
            'reflex_bonus': 0
        }
    ]

    for cover in cover_degrees:
        item = {
            '_id': generate_id(),
            'name': cover['name'],
            'type': 'condition',
            'img': 'icons/svg/shield.svg',
            'system': {
                'label': cover['name'],
                'category': 'defense',
                'description': cover['description'],
                'tokenIcon': 'icons/svg/shield.svg',
                'activeEffects': [],
                'stacking': 'highest',
                'severity': 'minor',
                'overlayPriority': 15
            },
            'flags': {}
        }

        # Add DR bonus if applicable
        if cover['dr_bonus'] > 0:
            item['system']['activeEffects'].append({
                'key': 'defense.cover.dr',
                'mode': 'add',
                'value': cover['dr_bonus'],
                'notes': f'+{cover["dr_bonus"]} DR vs melee attacks'
            })

        # Add Reflex save bonus if applicable
        if cover['reflex_bonus'] != 0:
            item['system']['activeEffects'].append({
                'key': 'defense.cover.reflex',
                'mode': 'add',
                'value': cover['reflex_bonus'],
                'notes': f'{cover["reflex_bonus"]:+d} to Reflex save to dodge ranged attacks'
            })

        items.append(item)

    return items


def main():
    script_dir = Path(__file__).parent.parent.parent

    items = []

    # Parse conditions.md
    md_file = script_dir / "ttrpg" / "conditions.md"
    if md_file.exists():
        print("Parsing conditions.md...")
        condition_items = parse_conditions_md(md_file)
        print(f"  Extracted {len(condition_items)} condition items from conditions.md")
        items.extend(condition_items)
    else:
        print(f"  Warning: {md_file} not found")

    # Parse cover conditions from combat.md
    combat_md_file = script_dir / "ttrpg" / "combat.md"
    if combat_md_file.exists():
        print("Parsing cover conditions from combat.md...")
        cover_items = parse_cover_conditions(combat_md_file)
        print(f"  Extracted {len(cover_items)} cover condition items from combat.md")
        items.extend(cover_items)
    else:
        print(f"  Warning: {combat_md_file} not found")

    if not items:
        print("  No items extracted")
        return 1

    # Validate condition downgrades
    print("\nValidating condition downgrades...")
    validate_condition_downgrades(items)

    # Save to _source/
    source_dir = script_dir / "foundryvtt" / "packs" / "conditions" / "_source"
    source_dir.mkdir(parents=True, exist_ok=True)

    for item in items:
        # Create filesystem-safe filename
        slug = re.sub(r"[^a-z0-9]+", "-", item['name'].lower()).strip('-')
        json_file = source_dir / f"{slug}.json"

        with open(json_file, 'w', encoding='utf-8') as f:
            ensure_key(item)
            json.dump(item, f, indent=2, ensure_ascii=False)
        print(f"  Saved {json_file.name}")

    # Build the pack
    print("\nBuilding conditions pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "conditions"
    success = build_pack_from_source(pack_dir, "conditions")

    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
