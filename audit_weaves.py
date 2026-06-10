import re
from pathlib import Path

weave_files = [
    'ttrpg/weaves(a-g).md',
    'ttrpg/weaves(h-m).md', 
    'ttrpg/weaves(n-r).md',
    'ttrpg/weaves(s-z).md',
]

# Condition names we know are in the compendium
known_conditions = [
    'frightened', 'fleeing', 'cowering', 'paralyzed', 'stunned', 'restrained',
    'grappled', 'prone', 'blinded', 'deafened', 'poisoned', 'sickened',
    'slowed', 'charmed', 'incapacitated', 'hidden', 'revealed', 'invisible',
    'exhausted', 'fatigued', 'weakened', 'dazed', 'disoriented', 'asleep',
    'ignited', 'frosted', 'burning', 'bleeding', 'diseased', 'dying',
    'petrified', 'silenced', 'confused', 'dominated', 'frightened',
]

for filepath in weave_files:
    if not Path(filepath).exists():
        continue
    content = Path(filepath).read_text(encoding='utf-8')
    # Split into weave sections
    sections = re.split(r'\n(?=### )', content)
    for section in sections:
        name_match = re.match(r'### (.+)', section)
        if not name_match:
            continue
        name = name_match.group(1).strip()
        
        has_applies = bool(re.search(r'\*\*Applies Effects:\*\*', section))
        if has_applies:
            continue
        
        # Check if description or scaling mentions conditions
        desc_match = re.search(r'\*\*Description:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]*)*)', section)
        scaling_match = re.search(r'\*\*Targeting Success Scaling:\*\*\s*([^\n]+)', section)
        
        text_to_check = ''
        if desc_match:
            text_to_check += desc_match.group(1).lower()
        if scaling_match:
            text_to_check += scaling_match.group(1).lower()
        
        found_conditions = [c for c in known_conditions if c in text_to_check]
        
        # Also check for buff keywords
        buff_keywords = ['gains +', 'gain +', 'bonus to', 'immunity to', 'immune to', 'temp hp', 'temporary hp', 'temporary hit points', 'haste', 'invisib', 'bless', 'enlarge', 'reduce']
        found_buffs = [b for b in buff_keywords if b in text_to_check]
        
        if found_conditions or found_buffs:
            print(f"FILE: {filepath}")
            print(f"WEAVE: {name}")
            if found_conditions:
                print(f"  Conditions found: {found_conditions}")
            if found_buffs:
                print(f"  Buff keywords: {found_buffs}")
            if scaling_match:
                print(f"  Scaling: {scaling_match.group(1)[:100]}")
            print()
