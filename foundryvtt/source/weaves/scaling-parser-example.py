"""
Example parser functions for converting markdown scaling text to structured JSON schema

This shows how to update build_weaves_pack.py to parse Success Scaling text
into the structured format defined in scaling-schema.json
"""

import re
from typing import Dict, Any, Optional, Union, List


def parse_structured_scaling(scaling_text: str, weave_type: str = 'unknown') -> Dict[str, Any]:
    """
    Parse Success Scaling text into structured format.
    
    Args:
        scaling_text: The raw scaling text from markdown
        weave_type: Type hint ('damage', 'effect', 'utility', etc.)
        
    Returns:
        Dictionary with success levels as keys and structured data as values
    """
    if not scaling_text:
        return {}
    
    scaling_table = {}
    
    # Split by comma to get individual entries
    entries = scaling_text.split(',')
    
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        
        # Match: "0 = description" or "0-1 = description"
        match = re.match(r'^(\d+)(?:-(\d+))?\s*[=:]\s*(.+)', entry)
        if not match:
            continue
        
        start_level = int(match.group(1))
        end_level = int(match.group(2)) if match.group(2) else start_level
        description = match.group(3).strip()
        
        # Parse the description to extract structured data
        for level in range(start_level, end_level + 1):
            scaling_entry = parse_scaling_description(description, level)
            scaling_table[str(level)] = scaling_entry
    
    return scaling_table


def parse_scaling_description(description: str, level: int) -> Dict[str, Any]:
    """
    Parse a single scaling description into structured data.
    
    Args:
        description: The description text for this success level
        level: The success level number
        
    Returns:
        Structured scaling entry
    """
    entry = {
        'description': description
    }
    
    # Determine if effects should apply
    entry['appliesEffects'] = parse_applies_effects(description, level)
    
    # Parse damage
    damage = parse_damage(description)
    if damage is not None:
        entry['damage'] = damage
    
    # Parse healing
    healing = parse_healing(description)
    if healing is not None:
        entry['healing'] = healing
    
    # Parse duration
    duration = parse_duration(description)
    if duration is not None:
        entry['duration'] = duration
    
    # Parse range
    range_obj = parse_range(description)
    if range_obj is not None:
        entry['range'] = range_obj
    
    # Parse area
    area = parse_area(description)
    if area is not None:
        entry['area'] = area
    
    # Parse quantity
    quantity = parse_quantity(description)
    if quantity is not None:
        entry['quantity'] = quantity
    
    # Parse capacity
    capacity = parse_capacity(description)
    if capacity is not None:
        entry['capacity'] = capacity
    
    # Parse push distance
    push = parse_push_distance(description)
    if push is not None:
        entry['pushDistance'] = push
    
    # Parse target count
    target_count = parse_target_count(description)
    if target_count is not None:
        entry['targetCount'] = target_count
    
    # Parse special mechanics
    special = parse_special_mechanics(description)
    if special:
        entry['specialMechanics'] = special
    
    # Parse effect type
    effect_type = parse_effect_type(description)
    if effect_type:
        entry['effectType'] = effect_type
    
    # Parse DR modifier
    dr = parse_dr_modifier(description)
    if dr is not None:
        entry['drModifier'] = dr
    
    # Parse HP (for constructs)
    hp = parse_hp(description)
    if hp is not None:
        entry['hp'] = hp
    
    return entry


def parse_applies_effects(description: str, level: int) -> bool:
    """Determine if effects should be applied at this level."""
    desc_lower = description.lower()
    
    # Explicit mentions
    if 'applies effect' in desc_lower or '+ applies effect' in desc_lower:
        return True
    
    # Level 0 special cases
    if level == 0:
        if any(phrase in desc_lower for phrase in ['no effect', 'fails', 'miss', 'resists']):
            return False
    
    # If not level 0 and not an explicit failure, probably applies
    return level > 0 and 'no effect' not in desc_lower and 'fails' not in desc_lower


def parse_damage(description: str) -> Optional[int]:
    """Parse damage amount from description."""
    # Match patterns like "(4)", "(24 total)", "8 damage", "3d8 damage"
    
    # Look for total damage in parentheses
    match = re.search(r'\((\d+)(?:\s+total)?\)', description)
    if match:
        return int(match.group(1))
    
    # Look for explicit damage numbers
    match = re.search(r'(\d+)\s+damage', description, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    # Handle dice notation (approximate average)
    match = re.search(r'(\d+)d(\d+)', description)
    if match:
        num_dice = int(match.group(1))
        die_size = int(match.group(2))
        # Use average: (max + min) / 2 * num_dice
        return int((die_size + 1) / 2 * num_dice)
    
    # Miss/no damage cases
    if re.search(r'\bmiss\b|\bno damage\b', description, re.IGNORECASE):
        return 0
    
    return None


def parse_healing(description: str) -> Optional[int]:
    """Parse healing amount from description."""
    # Match patterns like "heal 4", "heal 12 HP"
    match = re.search(r'heal(?:s|ing)?\s+(\d+)', description, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    return None


def parse_duration(description: str) -> Optional[Union[str, Dict[str, Any]]]:
    """Parse duration from description."""
    # Check for special keywords
    if re.search(r'\bpermanent\b|\buntil dispelled\b', description, re.IGNORECASE):
        return 'permanent'
    
    if 'instantaneous' in description.lower():
        return 'instantaneous'
    
    if 'full effect' in description.lower():
        return 'full effect'
    
    # Match patterns like "1 round", "10 minutes", "4 hours", "1 day"
    match = re.search(r'(\d+)\s+(round|minute|hour|day|week|month|year)s?', description, re.IGNORECASE)
    if match:
        return {
            'value': int(match.group(1)),
            'unit': match.group(2).lower()
        }
    
    return None


def parse_range(description: str) -> Optional[Dict[str, Any]]:
    """Parse range from description."""
    # Match patterns like "100 feet", "5 miles", "1 mile"
    match = re.search(r'(\d+)\s+(feet|ft|mile)s?(?:\s+range)?', description, re.IGNORECASE)
    if match:
        value = int(match.group(1))
        unit = match.group(2).lower()
        if unit == 'ft':
            unit = 'feet'
        return {'value': value, 'unit': unit}
    
    return None


def parse_area(description: str) -> Optional[Dict[str, Any]]:
    """Parse area from description."""
    # Match patterns like "25ft radius", "10-foot cube", "20ft square"
    match = re.search(r'(\d+)(?:-|\s)?(?:foot|ft)\s+(radius|cube|square|line|cone|sphere)', description, re.IGNORECASE)
    if match:
        return {
            'shape': match.group(2).lower(),
            'size': int(match.group(1)),
            'unit': 'feet'
        }
    
    return None


def parse_quantity(description: str) -> Optional[Dict[str, Any]]:
    """Parse quantity from description."""
    # Match patterns like "1 dart", "3 darts", "5 duplicates", "10 gallons"
    match = re.search(r'(\d+)\s+(dart|duplicate|gallon|question|creature|target|reflection)s?', description, re.IGNORECASE)
    if match:
        return {
            'amount': int(match.group(1)),
            'unit': match.group(2).lower() + 's'
        }
    
    return None


def parse_capacity(description: str) -> Optional[Dict[str, Any]]:
    """Parse weight capacity from description."""
    # Match patterns like "100 lbs", "500 pounds"
    match = re.search(r'(\d+)\s+(lbs?|pounds?)', description, re.IGNORECASE)
    if match:
        return {
            'weight': int(match.group(1)),
            'unit': 'lbs'
        }
    
    return None


def parse_push_distance(description: str) -> Optional[Dict[str, Any]]:
    """Parse push/pull distance from description."""
    # Match patterns like "pushed 10 feet", "push 15 feet"
    match = re.search(r'push(?:ed)?\s+(\d+)\s+(?:feet|ft)', description, re.IGNORECASE)
    if match:
        return {
            'distance': int(match.group(1)),
            'unit': 'feet'
        }
    
    return None


def parse_target_count(description: str) -> Optional[int]:
    """Parse number of targets affected."""
    # Match patterns like "affects 2 targets", "2 targets at once"
    match = re.search(r'(?:affects?\s+)?(\d+)\s+(?:target|creature)s?(?:\s+at\s+once)?', description, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    return None


def parse_special_mechanics(description: str) -> List[str]:
    """Parse special mechanics/rules from description."""
    mechanics = []
    
    desc_lower = description.lower()
    
    if 'denies save' in desc_lower or 'no save' in desc_lower:
        mechanics.append('denies save')
    
    if 'major structural damage' in desc_lower:
        mechanics.append('major structural damage')
    
    if 'fissures open' in desc_lower:
        mechanics.append('fissures open')
    
    if 'permanent' in desc_lower and 'permanent' not in description.lower().replace('permanent', '', 1):
        mechanics.append('changes are permanent')
    
    if re.search(r'requires?\s+(\d+)\s+success(?:es)?\s+to', desc_lower):
        match = re.search(r'requires?\s+(\d+)\s+success(?:es)?\s+to\s+(\w+)', desc_lower)
        if match:
            mechanics.append(f"requires {match.group(1)} successes to {match.group(2)}")
    
    if 'cannot be bypassed' in desc_lower:
        mechanics.append('cannot be bypassed')
    
    if 'ignores barriers' in desc_lower or 'ignore barriers' in desc_lower:
        mechanics.append('ignores barriers')
    
    if 'on contact' in desc_lower:
        mechanics.append('applies effects on contact')
    
    return mechanics


def parse_effect_type(description: str) -> Optional[str]:
    """Parse specific effect/condition type from description."""
    desc_lower = description.lower()
    
    # Known effect types
    effects = ['frightened', 'fleeing', 'cowering', 'paralyzed', 'prone', 'restrained', 
               'sickened', 'poisoned', 'stunned', 'unconscious', 'blinded', 'deafened']
    
    for effect in effects:
        if effect in desc_lower:
            return effect
    
    return None


def parse_dr_modifier(description: str) -> Optional[int]:
    """Parse DR (Damage Reduction) value."""
    # Match patterns like "DR 8", "+8 DR"
    match = re.search(r'(?:DR\s+(\d+)|\+(\d+)\s+DR)', description, re.IGNORECASE)
    if match:
        return int(match.group(1) or match.group(2))
    
    return None


def parse_hp(description: str) -> Optional[int]:
    """Parse HP value (for constructs like walls)."""
    # Match patterns like "(6 HP)", "12 HP"
    match = re.search(r'(?:\()?(\d+)\s+HP(?:\))?', description, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    return None


# Example usage in build_weaves_pack.py:
"""
# In parse_weaves_md function, after extracting scaling_match:

if scaling_match:
    scaling_text = scaling_match.group(1).strip()
    
    # Determine weave type
    weave_type = 'damage' if item['system']['damage']['base'] > 0 else 'effect'
    
    # Parse into structured format
    item['system']['damage']['scaling'] = parse_structured_scaling(
        scaling_text,
        weave_type
    )
"""
