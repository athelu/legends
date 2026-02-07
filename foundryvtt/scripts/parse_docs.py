#!/usr/bin/env python3
"""
Parse Legends TTRPG markdown documentation and generate Foundry item JSON files.

This script reads from the ttrpg/ documentation directory and generates item JSON
files in the appropriate packs/_source/ directories for use with the pack builder.
"""

import os
import json
import re
import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional


def generate_id():
    """Generate a short ID from UUID."""
    return str(uuid.uuid4())[:8]


class ArmorParser:
    """Parse armor.md and generate armor items."""
    
    @staticmethod
    def parse_armor_type(text: str) -> List[Dict[str, Any]]:
        """Parse armor types from markdown."""
        items = []
        
        # Find the "Armor Types" section
        start_idx = text.find("## Armor Types")
        if start_idx == -1:
            return items
        
        armor_section = text[start_idx:]
        
        # Split by armor type headers (#### Armor Type Name)
        sections = re.split(r'^#### (.+?)$', armor_section, flags=re.MULTILINE)
        
        # Process pairs of (header, content)
        for i in range(1, len(sections), 2):
            if i + 1 < len(sections):
                name = sections[i].strip()
                content = sections[i + 1]
                
                # Stop if we hit the next main section
                if '## ' in content or '### ' in content:
                    content = content[:content.find('##' if '##' in content else '###')]
                
                item = ArmorParser._parse_single_armor(name, content)
                if item:
                    items.append(item)
        
        return items
    
    @staticmethod
    def _parse_single_armor(name: str, content: str) -> Optional[Dict[str, Any]]:
        """Parse a single armor type."""
        
        # Extract DR values - more flexible pattern
        dr_match = re.search(
            r'\*\*DR:\*\*\s+Slashing\s+(\d+),\s*Piercing\s+(\d+),\s*Bludgeoning\s+(\d+)',
            content
        )
        
        if not dr_match:
            return None
        
        slashing, piercing, bludgeoning = map(int, dr_match.groups())
        
        # Extract cost
        cost_match = re.search(r'\*\*Cost:\*\*\s+(\d+)\s+gp', content)
        cost = int(cost_match.group(1)) if cost_match else 0
        
        # Extract stealth
        stealth_penalty = 'none'
        if '[Loud]' in content:
            stealth_penalty = 'loud'
        elif '[Noisy]' in content:
            stealth_penalty = 'noisy'
        
        # Determine armor type from keywords
        if '[LightArmor]' in content or '[Light]' in content:
            armor_type = 'light'
        elif '[HeavyArmor]' in content or '[Heavy]' in content:
            armor_type = 'heavy'
        else:
            armor_type = 'medium'
        
        # Extract description
        description = name
        desc_match = re.search(r'\*\*Description:\*\*\s+(.+?)(?:\n|$)', content)
        if desc_match:
            description += " - " + desc_match.group(1).strip()
        
        return {
            "_id": generate_id(),
            "name": name,
            "type": "armor",
            "system": {
                "description": description,
                "armorType": armor_type,
                "dr": {
                    "slashing": slashing,
                    "piercing": piercing,
                    "bludgeoning": bludgeoning
                },
                "stealthPenalty": stealth_penalty,
                "cost": cost,
                "quantity": 1
            },
            "effects": []
        }
    
    @staticmethod
    def parse_shields(text: str) -> List[Dict[str, Any]]:
        """Parse shield definitions from markdown."""
        items = []
        
        # Define shields with their data
        shields_data = {
            "Buckler": {
                "shieldType": "buckler",
                "handUsage": "off-hand",
                "meleeDefense": "",
                "reactions": [
                    {
                        "name": "Shield Block",
                        "type": "reaction",
                        "trigger": "You are hit by a melee attack",
                        "description": "Choose: Force Reroll OR Gain +2 DR (once per round)"
                    },
                    {
                        "name": "Active Parry",
                        "type": "free",
                        "trigger": "You are targeted by melee attack",
                        "description": "Once per round, attacker must reroll one success die"
                    }
                ],
                "requirements": "",
                "specialAbilities": "Can make off-hand attacks (4 bludgeoning light weapon)",
                "cost": 10,
                "plantedMode": False
            },
            "Targe": {
                "shieldType": "targe",
                "handUsage": "off-hand",
                "meleeDefense": "Fortune on defensive melee combat rolls",
                "reactions": [
                    {
                        "name": "Shield Block",
                        "type": "reaction",
                        "trigger": "You are hit by a melee attack",
                        "description": "Choose: Force Reroll OR Gain +2 DR (once per round)"
                    },
                    {
                        "name": "Ranged Defense",
                        "type": "reaction",
                        "trigger": "You are targeted by ranged attack",
                        "description": "Force Misfortune on one ranged attack (once per round)"
                    }
                ],
                "requirements": "",
                "specialAbilities": "Can be slung on back (1 minor action to ready)",
                "cost": 10,
                "plantedMode": False
            },
            "Heater Shield": {
                "shieldType": "heater",
                "handUsage": "off-hand",
                "meleeDefense": "Fortune on defensive melee combat rolls",
                "reactions": [
                    {
                        "name": "Shield Block",
                        "type": "reaction",
                        "trigger": "You are hit by a melee attack",
                        "description": "Choose: Force Reroll OR Gain +2 DR (once per round)"
                    },
                    {
                        "name": "Ranged Defense",
                        "type": "reaction",
                        "trigger": "You are targeted by ranged attack",
                        "description": "Force Misfortune on one ranged attack (once per round)"
                    }
                ],
                "requirements": "",
                "specialAbilities": "Can be slung on back (1 minor action to ready)",
                "cost": 15,
                "plantedMode": False
            },
            "Kite Shield": {
                "shieldType": "kite",
                "handUsage": "off-hand",
                "meleeDefense": "Fortune on defensive melee combat rolls",
                "reactions": [
                    {
                        "name": "Shield Block",
                        "type": "reaction",
                        "trigger": "You are hit by a melee attack",
                        "description": "Choose: Force Reroll OR Gain +2 DR (once per round)"
                    },
                    {
                        "name": "Ranged Defense",
                        "type": "reaction",
                        "trigger": "You are targeted by ranged attack",
                        "description": "Force Misfortune on one ranged attack (once per round)"
                    }
                ],
                "requirements": "Strength 3 minimum or suffer Misfortune on attacks",
                "specialAbilities": "Provides Partial Cover when crouching",
                "cost": 20,
                "plantedMode": False
            },
            "Tower Shield": {
                "shieldType": "tower",
                "handUsage": "off-hand",
                "meleeDefense": "Fortune on defensive melee combat rolls",
                "reactions": [
                    {
                        "name": "Shield Block",
                        "type": "reaction",
                        "trigger": "You are hit by a melee attack",
                        "description": "Choose: Force Reroll OR Gain +2 DR (once per round)"
                    },
                    {
                        "name": "Ranged Defense",
                        "type": "reaction",
                        "trigger": "You are targeted by ranged attack",
                        "description": "Force Misfortune on one ranged attack (once per round)"
                    }
                ],
                "requirements": "Strength 4 minimum",
                "specialAbilities": "Provides Full Cover when crouching",
                "cost": 25,
                "plantedMode": False
            },
            "Pavise": {
                "shieldType": "pavise",
                "handUsage": "both-hands-mobile",
                "meleeDefense": "Misfortune on own attacks",
                "reactions": [
                    {
                        "name": "Shield Block",
                        "type": "reaction",
                        "trigger": "You are hit by a melee attack",
                        "description": "Choose: Force Reroll OR Gain +2 DR (once per round)"
                    }
                ],
                "requirements": "Strength 4 minimum",
                "specialAbilities": "Can be planted (1 move action) for Full Cover from one direction",
                "cost": 40,
                "plantedMode": True
            }
        }
        
        for shield_name, data in shields_data.items():
            items.append({
                "_id": generate_id(),
                "name": shield_name,
                "type": "shield",
                "system": {
                    "description": f"{shield_name} shield",
                    **data,
                    "quantity": 1
                },
                "effects": []
            })
        
        return items


class WeaponParser:
    """Parse weapons.md and generate weapon items."""
    
    @staticmethod
    def parse_weapons(text: str) -> List[Dict[str, Any]]:
        """Parse weapons from markdown table."""
        items = []
        
        # Find the weapon table
        table_match = re.search(
            r'\| Weapon.*?\|.*?\n\|\s*-+\s*\|.*?\n((?:\|.*?\n)+)',
            text,
            re.MULTILINE
        )
        
        if not table_match:
            print("Warning: Could not find weapon table")
            return items
        
        table_content = table_match.group(1)
        rows = table_content.strip().split('\n')
        
        for row in rows:
            if row.strip() and not row.startswith('|   |'):
                item = WeaponParser._parse_weapon_row(row)
                if item:
                    items.append(item)
        
        return items
    
    @staticmethod
    def _parse_weapon_row(row: str) -> Optional[Dict[str, Any]]:
        """Parse a single weapon table row."""
        # Split by |
        cols = [col.strip() for col in row.split('|')[1:-1]]
        
        if len(cols) < 5:
            return None
        
        name = cols[0].strip()
        if not name or name == 'Weapon':
            return None
        
        cost_str = cols[1].strip()
        damage_str = cols[2].strip()
        properties_str = cols[3].strip()
        damage_type_str = cols[4].strip()
        
        # Parse cost
        cost_match = re.search(r'(\d+)', cost_str)
        cost = int(cost_match.group(1)) if cost_match else 0
        
        # Parse damage
        damage_parts = damage_str.split('/')
        damage_one_hand = int(damage_parts[0]) if damage_parts[0].isdigit() else 0
        damage_two_hand = int(damage_parts[1]) if len(damage_parts) > 1 and damage_parts[1].isdigit() else 0
        
        return {
            "_id": generate_id(),
            "name": name,
            "type": "weapon",
            "system": {
                "description": "",
                "damageOneHand": damage_one_hand,
                "damageTwoHand": damage_two_hand or damage_one_hand,
                "damageType": damage_type_str,
                "properties": properties_str,
                "cost": cost,
                "quantity": 1
            },
            "effects": []
        }


class TraitParser:
    """Parse traits.md and generate trait items."""
    
    @staticmethod
    def parse_traits(text: str) -> List[Dict[str, Any]]:
        """Parse traits from markdown."""
        items = []
        
        # Split by trait headers (### Trait Name or #### Trait Name)
        sections = re.split(r'^###+ (.+?)$', text, flags=re.MULTILINE)
        
        for i in range(1, len(sections), 2):
            if i + 1 < len(sections):
                name = sections[i].strip()
                content = sections[i + 1]
                
                # Skip section headers
                if name.lower() in ['traits', 'origins']:
                    continue
                
                item = {
                    "_id": generate_id(),
                    "name": name,
                    "type": "trait",
                    "system": {
                        "description": content.strip()[:500],  # Limit description
                        "quantity": 1
                    },
                    "effects": []
                }
                items.append(item)
        
        return items


class BackgroundParser:
    """Parse backgrounds.md and generate background items."""
    
    @staticmethod
    def parse_backgrounds(text: str) -> List[Dict[str, Any]]:
        """Parse backgrounds from markdown."""
        items = []
        
        # Split by background headers
        sections = re.split(r'^## (.+?)$', text, flags=re.MULTILINE)
        
        for i in range(1, len(sections), 2):
            if i + 1 < len(sections):
                name = sections[i].strip()
                content = sections[i + 1]
                
                if name.lower() in ['backgrounds']:
                    continue
                
                item = {
                    "_id": generate_id(),
                    "name": name,
                    "type": "background",
                    "system": {
                        "description": content.strip()[:500],
                        "quantity": 1
                    },
                    "effects": []
                }
                items.append(item)
        
        return items


def create_source_files(output_dir: Path, items: List[Dict[str, Any]], pack_type: str):
    """Create individual JSON source files for items."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for item in items:
        # Create filename from item name
        filename = re.sub(r'[^\w\s-]', '', item['name'])
        filename = re.sub(r'[-\s]+', '-', filename).lower()
        filename = f"{filename}.json"
        
        filepath = output_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(item, f, indent=2, ensure_ascii=False)
        
        print(f"  ✓ Created {filename}")


def main():
    """Main entry point."""
    ttrpg_dir = Path("ttrpg")
    packs_dir = Path("foundryvtt/packs")
    
    if not ttrpg_dir.exists():
        print(f"Error: ttrpg directory not found at {ttrpg_dir}")
        return
    
    if not packs_dir.exists():
        print(f"Error: packs directory not found at {packs_dir}")
        return
    
    print("=" * 60)
    print("Parsing Legends TTRPG Documentation")
    print("=" * 60)
    
    # Parse Armor
    print("\nParsing armor.md...")
    armor_file = ttrpg_dir / "armor.md"
    if armor_file.exists():
        with open(armor_file, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Parse armor types
        armor_items = ArmorParser.parse_armor_type(text)
        print(f"Found {len(armor_items)} armor types")
        
        # Parse shields
        shield_items = ArmorParser.parse_shields(text)
        print(f"Found {len(shield_items)} shields")
        
        # Create source files for armor
        armor_source = packs_dir / "armor" / "_source"
        print("Creating armor source files:")
        create_source_files(armor_source, armor_items, "armor")
        
        # Create source files for shields (in armor pack)
        print("Creating shield source files:")
        create_source_files(armor_source, shield_items, "shield")
    
    # Parse Weapons
    print("\nParsing weapons.md...")
    weapons_file = ttrpg_dir / "weapons.md"
    if weapons_file.exists():
        with open(weapons_file, 'r', encoding='utf-8') as f:
            text = f.read()
        
        weapon_items = WeaponParser.parse_weapons(text)
        print(f"Found {len(weapon_items)} weapons")
        
        weapons_source = packs_dir / "weapons" / "_source"
        print("Creating weapon source files:")
        create_source_files(weapons_source, weapon_items, "weapon")
    
    # Parse Traits
    print("\nParsing traits.md...")
    traits_file = ttrpg_dir / "traits.md"
    if traits_file.exists():
        with open(traits_file, 'r', encoding='utf-8') as f:
            text = f.read()
        
        trait_items = TraitParser.parse_traits(text)
        print(f"Found {len(trait_items)} traits")
        
        traits_source = packs_dir / "traits" / "_source"
        print("Creating trait source files:")
        create_source_files(traits_source, trait_items, "trait")
    
    # Parse Backgrounds
    print("\nParsing backgrounds.md...")
    backgrounds_file = ttrpg_dir / "backgrounds.md"
    if backgrounds_file.exists():
        with open(backgrounds_file, 'r', encoding='utf-8') as f:
            text = f.read()
        
        background_items = BackgroundParser.parse_backgrounds(text)
        print(f"Found {len(background_items)} backgrounds")
        
        backgrounds_source = packs_dir / "backgrounds" / "_source"
        print("Creating background source files:")
        create_source_files(backgrounds_source, background_items, "background")
    
    print("\n" + "=" * 60)
    print("✓ Documentation migration complete!")
    print("=" * 60)
    print("\nNext step: Run 'python foundryvtt/scripts/build_packs.py' to build .db files")


if __name__ == "__main__":
    main()
