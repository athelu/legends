"""
Auto-detection logic for weave tags/keywords classification

This function can be added to build_weaves_pack.py to automatically
tag weaves based on their properties and description.
"""

import re
from typing import List, Set


def extract_explicit_tags(name: str, description: str) -> List[str]:
    """
    Extract explicit tags from title and description.
    E.g., **[Necromantic]** or **[FORBIDDEN KNOWLEDGE]**
    """
    tags = []
    
    # Extract from title: **[Necromantic]**
    title_tag_match = re.search(r'\*\*\[([^\]]+)\]\*\*', name)
    if title_tag_match:
        tag = title_tag_match.group(1).lower()
        tags.append(tag)
    
    # Extract from description: **[FORBIDDEN KNOWLEDGE]**
    if 'FORBIDDEN KNOWLEDGE' in description or 'forbidden knowledge' in description.lower():
        tags.append('forbidden')
    
    return tags


def detect_thematic_tags(item: dict) -> List[str]:
    """Detect thematic tags based on weave properties and description."""
    tags = []
    description = item.get('system', {}).get('description', {}).get('value', '').lower()
    name = item.get('name', '').lower()
    
    # Necromantic
    necro_keywords = ['undead', 'zombie', 'skeleton', 'soul', 'death', 'corpse', 'necromancy']
    if any(keyword in description or keyword in name for keyword in necro_keywords):
        if 'necromantic' not in tags:
            tags.append('necromantic')
    
    # Illusion
    if 'illusion' in name or 'phantom' in name or 'illusory' in description:
        tags.append('illusion')
    
    # Summoning
    if 'summon' in description or 'conjure' in description:
        tags.append('summoning')
    
    # Divination
    divination_keywords = ['reveal', 'detect', 'sense', 'scry', 'identify', 'see', 'perceive']
    if any(keyword in description for keyword in divination_keywords):
        tags.append('divination')
    
    # Teleportation
    if 'teleport' in description or ('spatial' in name and 'step' in name):
        tags.append('teleportation')
    
    return tags


def detect_mechanical_tags(item: dict) -> List[str]:
    """Detect mechanical/functional tags."""
    tags = []
    description = item.get('system', {}).get('description', {}).get('value', '').lower()
    damage_base = item.get('system', {}).get('damage', {}).get('base', 0)
    applies_effects = item.get('system', {}).get('appliesEffects', [])
    
    # Healing (check scaling or description)
    scaling = item.get('system', {}).get('damage', {}).get('scaling', {})
    for level_data in scaling.values():
        if isinstance(level_data, dict) and level_data.get('healing', 0) > 0:
            tags.append('healing')
            break
    
    if 'heal' in description and 'healing' not in tags:
        tags.append('healing')
    
    # Offensive
    if damage_base > 0:
        tags.append('offensive')
    
    # Control (based on appliesEffects)
    control_conditions = ['paralyzed', 'unconscious', 'stunned', 'confused', 'charmed', 
                         'frightened', 'restrained', 'prone', 'asleep']
    for effect in applies_effects:
        effect_id = effect.get('effectId', '').lower()
        if any(cond in effect_id for cond in control_conditions):
            tags.append('control')
            break
    
    # Buff
    buff_keywords = ['gain', 'bonus', 'enhance', 'advantage', 'fortune', 'increase']
    if any(keyword in description for keyword in buff_keywords):
        tags.append('buff')
    
    # Debuff
    debuff_keywords = ['penalty', 'disadvantage', 'misfortune', 'reduce', 'weaken']
    if any(keyword in description for keyword in debuff_keywords):
        tags.append('debuff')
    
    # Defensive
    defensive_keywords = ['protection', 'ward', 'armor', 'shield', 'dr', 'damage reduction']
    if any(keyword in description for keyword in defensive_keywords):
        tags.append('defensive')
    
    # Utility
    delivery_method = item.get('system', {}).get('deliveryMethod', '')
    if delivery_method == 'automatic' and damage_base == 0:
        tags.append('utility')
    
    return tags


def detect_targeting_tags(item: dict) -> List[str]:
    """Detect targeting-related tags."""
    tags = []
    range_val = item.get('system', {}).get('range', '').lower()
    description = item.get('system', {}).get('description', {}).get('value', '').lower()
    
    # Self
    if range_val == 'self' or 'self' in description:
        tags.append('self')
    
    # Touch
    if 'touch' in range_val:
        tags.append('touch')
    
    # Ranged
    if any(unit in range_val for unit in ['ft', 'feet', 'mile']):
        tags.append('ranged')
    
    # AOE
    aoe_keywords = ['radius', 'cube', 'cone', 'line', 'area', 'burst', 'sphere']
    if any(keyword in description or keyword in range_val for keyword in aoe_keywords):
        tags.append('aoe')
    
    # Single target vs multi-target
    scaling = item.get('system', {}).get('damage', {}).get('scaling', {})
    has_target_count = False
    for level_data in scaling.values():
        if isinstance(level_data, dict) and level_data.get('targetCount'):
            has_target_count = True
            if level_data.get('targetCount', 1) > 1:
                tags.append('multi-target')
                break
    
    if not has_target_count and 'aoe' not in tags:
        if 'multiple target' in description or 'all creature' in description:
            tags.append('multi-target')
        elif 'one target' in description or 'single target' in description:
            tags.append('single-target')
    
    return tags


def detect_special_tags(item: dict) -> List[str]:
    """Detect special property tags."""
    tags = []
    name = item.get('name', '').lower()
    description = item.get('system', {}).get('description', {}).get('value', '').lower()
    
    # Wall
    if 'wall' in name:
        tags.append('wall')
    
    # Zone
    if 'zone' in name or 'warding sphere' in name or 'warding circle' in name:
        tags.append('zone')
    
    # Construct
    if any(keyword in description for keyword in ['creates', 'construct', 'disk', 'servant']):
        scaling = item.get('system', {}).get('damage', {}).get('scaling', {})
        for level_data in scaling.values():
            if isinstance(level_data, dict) and level_data.get('hp'):
                tags.append('construct')
                break
    
    # Ritual
    energy_cost = item.get('system', {}).get('energyCost', {})
    primary_cost = energy_cost.get('primary', {}).get('cost', 0)
    supporting_cost = energy_cost.get('supporting', {}).get('cost', 0)
    total_cost = primary_cost + supporting_cost
    
    if total_cost >= 10 or 'ritual' in description:
        tags.append('ritual')
    
    # Concentration
    if 'concentration' in description or 'maintain' in description:
        tags.append('concentration')
    
    return tags


def detect_all_tags(item: dict) -> List[str]:
    """
    Detect all tags for a weave.
    
    Returns: List of unique tags
    """
    name = item.get('name', '')
    description = item.get('system', {}).get('description', {}).get('value', '')
    
    all_tags: Set[str] = set()
    
    # Explicit tags (highest priority)
    all_tags.update(extract_explicit_tags(name, description))
    
    # Thematic tags
    all_tags.update(detect_thematic_tags(item))
    
    # Mechanical tags
    all_tags.update(detect_mechanical_tags(item))
    
    # Targeting tags
    all_tags.update(detect_targeting_tags(item))
    
    # Special tags
    all_tags.update(detect_special_tags(item))
    
    # Return sorted list
    return sorted(list(all_tags))


# Example usage in build_weaves_pack.py:
"""
from weave_tag_detector import detect_all_tags

def parse_weaves_md(ttrpg_dir, source_dir=None):
    # ... existing parsing code ...
    
    for item in items:
        # Auto-detect and set tags
        tags = detect_all_tags(item)
        item['system']['tags'] = tags
        
        # Optional: Clean up name by removing **[Tag]**
        name = item['name']
        cleaned_name = re.sub(r'\\s*\\*\\*\\[([^\\]]+)\\]\\*\\*', '', name)
        if cleaned_name != name:
            item['name'] = cleaned_name.strip()
            print(f"  Cleaned name: {name} -> {cleaned_name}")
        
        print(f"  {item['name']:40} tags: {', '.join(tags)}")
        
        # ... rest of processing ...
"""


# Test the tag detection:
def test_tag_detection():
    """Test tag detection with example weaves."""
    
    # Necromantic weave
    bind_fallen = {
        'name': 'Bind the Fallen **[Necromantic]**',
        'system': {
            'description': {'value': '**[FORBIDDEN KNOWLEDGE]** Bind soul fragments to corpse, animating it as undead.'},
            'range': 'touch',
            'damage': {'base': 0, 'scaling': {}},
            'appliesEffects': [],
            'deliveryMethod': 'automatic',
            'energyCost': {'primary': {'cost': 6}, 'supporting': {'cost': 4}}
        }
    }
    
    # Damage AOE weave
    fireball = {
        'name': 'Fireball',
        'system': {
            'description': {'value': 'Fiery explosion in 20-foot radius. Creatures make Reflex saves.'},
            'range': 'Medium, 60 ft. (20-foot radius)',
            'damage': {'base': 16, 'scaling': {}},
            'appliesEffects': [],
            'deliveryMethod': 'save',
            'savingThrow': 'reflex'
        }
    }
    
    # Control effect weave
    sleep = {
        'name': 'Sleep',
        'system': {
            'description': {'value': 'Creatures in area make Will saves. Those you beat fall Unconscious.'},
            'range': 'Medium, 60 ft. (10-foot radius)',
            'damage': {'base': 0, 'scaling': {}},
            'appliesEffects': [{'effectId': 'asleep-unconscious'}],
            'deliveryMethod': 'save',
            'savingThrow': 'will'
        }
    }
    
    # Utility weave
    light = {
        'name': 'Light',
        'system': {
            'description': {'value': 'You create light that illuminates a 20-foot radius.'},
            'range': 'touch',
            'damage': {'base': 0, 'scaling': {}},
            'appliesEffects': [],
            'deliveryMethod': 'automatic'
        }
    }
    
    # Healing weave
    healing_burst = {
        'name': 'Healing Burst',
        'system': {
            'description': {'value': 'Target heals 8 HP. Can target creatures at 0 HP to stabilize.'},
            'range': 'Medium, 60 ft.',
            'damage': {
                'base': 0,
                'scaling': {
                    '0': {'healing': 0},
                    '1': {'healing': 4},
                    '2': {'healing': 8}
                }
            },
            'appliesEffects': [],
            'deliveryMethod': 'automatic'
        }
    }
    
    test_weaves = [bind_fallen, fireball, sleep, light, healing_burst]
    
    print("\nTesting weave tag detection:\n")
    
    for weave in test_weaves:
        tags = detect_all_tags(weave)
        print(f"{weave['name']:40} -> {', '.join(tags)}")


if __name__ == '__main__':
    test_tag_detection()
