"""
Auto-detection logic for weave delivery method classification

This function can be added to build_weaves_pack.py to automatically
classify weaves based on their properties and description.
"""

import re


def detect_delivery_method(item: dict) -> str:
    """
    Automatically detect the delivery method for a weave.
    
    Returns: "attack", "save", or "automatic"
    """
    description = item.get('system', {}).get('description', {}).get('value', '').lower()
    saving_throw = item.get('system', {}).get('savingThrow', '').lower().strip()
    weaving_roll = item.get('system', {}).get('weavingRoll', '').lower()
    
    # Check for attack roll mentions
    attack_keywords = [
        'attack roll',
        'make an attack',
        'ranged attack',
        'melee attack',
        'make a weaving attack',
        'roll to hit'
    ]
    
    if any(keyword in description for keyword in attack_keywords):
        return 'attack'
    
    if 'attack' in weaving_roll and 'vs' in weaving_roll:
        return 'attack'
    
    # Check for saving throw
    if saving_throw and saving_throw not in ['none', '', 'n/a']:
        # Has explicit saving throw field
        return 'save'
    
    # Check description for save mentions
    save_keywords = [
        'make a save',
        'makes a save',
        'make will save',
        'make fortitude save',
        'make reflex save',
        'saving throw',
        'must save'
    ]
    
    if any(keyword in description for keyword in save_keywords):
        return 'save'
    
    # Check if it's a utility/automatic weave
    utility_keywords = [
        'you create',
        'create ',
        'you conjure',
        'conjure ',
        'you gain',
        'target gain',
        'target gains',
        'transform',
        'teleport',
        'automatically',
        'utility',
        'buff'
    ]
    
    # If has no damage and no save, likely automatic
    damage_base = item.get('system', {}).get('damage', {}).get('base', 0)
    
    if damage_base == 0 and saving_throw in ['', 'none', 'n/a']:
        # Check if description suggests automatic effect
        if any(keyword in description for keyword in utility_keywords):
            return 'automatic'
        return 'automatic'
    
    # Default to save (most common for combat weaves)
    return 'save'


def classify_weave_type(item: dict) -> dict:
    """
    Classify a weave and return type information.
    
    Returns dict with:
    - deliveryMethod: "attack", "save", or "automatic"
    - subtype: For "save", returns "damage" or "effect"
    - confidence: "high", "medium", or "low"
    """
    delivery_method = detect_delivery_method(item)
    
    result = {
        'deliveryMethod': delivery_method,
        'subtype': None,
        'confidence': 'medium'
    }
    
    # For save-based weaves, determine subtype
    if delivery_method == 'save':
        damage_base = item.get('system', {}).get('damage', {}).get('base', 0)
        
        if damage_base > 0:
            result['subtype'] = 'damage'
        else:
            result['subtype'] = 'effect'
        
        # High confidence if we have explicit saving throw field
        saving_throw = item.get('system', {}).get('savingThrow', '').strip()
        if saving_throw and saving_throw.lower() not in ['none', '', 'n/a']:
            result['confidence'] = 'high'
    
    # For attack weaves, check confidence
    elif delivery_method == 'attack':
        description = item.get('system', {}).get('description', {}).get('value', '').lower()
        if 'attack roll' in description:
            result['confidence'] = 'high'
    
    return result


# Example usage in build_weaves_pack.py:
"""
def parse_weaves_md(ttrpg_dir, source_dir=None):
    # ... existing parsing code ...
    
    for item in items:
        # Auto-detect and set delivery method
        classification = classify_weave_type(item)
        item['system']['deliveryMethod'] = classification['deliveryMethod']
        
        # Optional: Log classification for review
        if classification['confidence'] == 'low':
            print(f"  ⚠️  Low confidence classification for {item['name']}: {classification['deliveryMethod']}")
        
        # ... rest of processing ...
"""


# Example classifications:

def test_classifications():
    """Test the classification logic with example weaves."""
    
    # Attack roll weave
    fire_bolt = {
        'name': 'Fire Bolt',
        'system': {
            'description': {'value': 'Make a ranged attack roll against target. On hit, deal 8 fire damage.'},
            'savingThrow': '',
            'damage': {'base': 8}
        }
    }
    
    # Save-damage weave  
    acid_blast = {
        'name': 'Acid Blast',
        'system': {
            'description': {'value': 'Target makes Fortitude save. Compare successes to determine damage.'},
            'savingThrow': 'fortitude',
            'damage': {'base': 8}
        }
    }
    
    # Save-effect weave
    sleep = {
        'name': 'Sleep',
        'system': {
            'description': {'value': 'Creatures make Will saves. Those you beat fall Unconscious.'},
            'savingThrow': 'will',
            'damage': {'base': 0},
            'appliesEffects': [{'effectId': 'asleep-unconscious'}]
        }
    }
    
    # Automatic utility weave
    light = {
        'name': 'Light',
        'system': {
            'description': {'value': 'You create light that illuminates a 20-foot radius.'},
            'savingThrow': '',
            'damage': {'base': 0}
        }
    }
    
    test_weaves = [fire_bolt, acid_blast, sleep, light]
    expected = ['attack', 'save', 'save', 'automatic']
    
    print("\nTesting weave classification:\n")
    
    for weave, expected_type in zip(test_weaves, expected):
        result = classify_weave_type(weave)
        status = "✓" if result['deliveryMethod'] == expected_type else "✗"
        
        print(f"{status} {weave['name']:20} -> {result['deliveryMethod']:10}", end='')
        if result['subtype']:
            print(f" ({result['subtype']})", end='')
        print(f"  [{result['confidence']}]")


if __name__ == '__main__':
    test_classifications()
