#!/usr/bin/env python3
"""
Build traits compendium pack from parsed traits.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, ensure_key, md_to_html, apply_enrichers


def parse_traits_md(md_file):
    """
    Parse traits.md and extract trait items.
    
    Expected format:
    ### Trait Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"<!--\s*PACK:traits\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Magical trait identifiers
    magical_traits = {
        'mageborn': 'mageborn',
        'divine gift': 'divine-gift',
        'invoker': 'invoker',
        'infuser': 'infuser',
        'sorcerous origin': 'sorcerous-origin',
        'eldritch pact': 'eldritch-pact',
        'gifted mage': 'gifted-mage',
        'balanced channeler': 'balanced-channeler'
    }
    
    # Split by trait sections (### or ## Heading)
    sections = re.split(r'^#+\s+', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        # Skip some non-trait headers
        if item_name in ['Divine Gift', 'The Nine Patron Choices', 'ALKIRA', 'AMBIS', 'ATHORE', 
                         'ENSCHEDE', 'HIRNALOYTA', 'NEVIL', 'RUDLU', 'SHU-JAHAN',
                         'PANTHEON GENERALIST', 'Evil Divine Casters', 'Dragon Cult Devotee',
                         'Twisted Denomination', 'Starting Age', 'Unchanging Stone (Earth/Fire)',
                         'Thread of Fate (Time/Positive)', 'Death\'s Lesson (Fire/Negative)',
                         'Perfect Self-Perception (Space/Air)', 'The Survivor\'s Bargain',
                         'The Desperate Deal', 'The Answered Cry', 'The Stolen Shard',
                         'Channel Divinity Options', 'Channel Divinity - Divine Power',
                         'MAGICAL TRAITS', 'MAGICAL ENHANCEMENT TRAITS', 'PHYSICAL & MENTAL TRAITS',
                         'SOCIAL & BACKGROUND TRAITS', 'LUCK TRAITS', 'SPECIAL TRAITS (GM Approval Required)']:
            continue
        
        if not item_name:
            continue
        
        # Check if this is a magical trait
        is_magical = False
        magical_type = ''
        trait_type = 'physical'  # default
        
        name_lower = item_name.lower()
        for key, value in magical_traits.items():
            if key in name_lower:
                is_magical = True
                magical_type = value
                trait_type = 'magical'
                break
        
        # Categorize non-magical traits
        if not is_magical:
            if any(x in name_lower for x in ['hearing', 'smell', 'taste', 'sight', 'memory', 
                                              'jointed', 'skilled', 'reflexes', 'alertness', 'intuition']):
                trait_type = 'physical'
            elif any(x in name_lower for x in ['contacts', 'loyalty', 'touch of good']):
                trait_type = 'social'
            elif 'luck' in name_lower:
                trait_type = 'luck'
            elif any(x in name_lower for x in ['immortality', 'longevity', 'mentor', 'mythic']):
                trait_type = 'special'
        
        item = {
            '_id': generate_id(),
            'name': item_name,
            'type': 'trait',
            'img': 'icons/skills/social/diplomacy-handshake.webp',
            'system': {
                'description': {'value': ''},
                'pointCost': 0,
                'traitType': trait_type,
                'isMagical': is_magical,
                'magicalType': magical_type,
                'requirements': '',
                'benefits': '',
                'requiresGMApproval': any(x in name_lower for x in ['immortality', 'mentor', 'mythic']),
                'requiresExistingTrait': ''  # No longer used - modifiers are passive
            },
            'effects': []
        }

        # Extract description
        description = '\n'.join(lines[1:]).strip()
        item['system']['description'] = {'value': apply_enrichers(md_to_html(description))}

        # Try to extract point cost from name like "Trait Name (-3)"
        cost_match = re.search(r'\((-?\d+)\)', item_name)
        if cost_match:
            item['system']['pointCost'] = int(cost_match.group(1))
        
        # Extract image path if specified
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        # Extract requirements if specified
        req_match = re.search(r'\*?\*?Requirements?:?\*?\*?\s*([^\n]+)', description)
        if req_match:
            item['system']['requirements'] = req_match.group(1).strip()
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "traits.md"
    if md_file.exists():
        print("Parsing traits.md...")
        items = parse_traits_md(md_file)
        print(f"  Extracted {len(items)} trait items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "traits" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        # Clean old JSON files to prevent orphaned entries
        print("  Cleaning old JSON files...")
        for old_file in source_dir.glob("*.json"):
            old_file.unlink()
        print(f"  Removed old files")
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-').replace('(', '').replace(')', '')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding traits pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "traits"
    success = build_pack_from_source(pack_dir, "traits")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
