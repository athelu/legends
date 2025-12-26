#!/usr/bin/env python3
"""
D8 TTRPG Combat Simulator v3.0
Updated with new mechanics:
- Simple Weaves (Fire Burst - doesn't provoke, touch range)
- Complex Weaves (Fire Bolt - provokes opportunity attacks)
- Medium armor (DR 5 for chain mail)
- 3-action economy
- Luck spending (1 per encounter)
- Support for Wizard and Fighter character builds
"""

import random
import argparse
from dataclasses import dataclass, field
from typing import List, Tuple, Optional
from enum import Enum

class CharacterClass(Enum):
    WIZARD = "wizard"
    FIGHTER = "fighter"

@dataclass
class Creature:
    name: str
    # Attributes
    strength: int
    constitution: int
    agility: int
    dexterity: int
    intelligence: int
    wisdom: int
    charisma: int
    luck: int
    
    # Combat stats
    max_hp: int
    current_hp: int
    dr: int = 0
    
    # Skills
    melee_combat: int = 0
    ranged_combat: int = 0
    perception: int = 0
    stealth: int = 0
    
    # Magical stats
    energy_pool: int = 0
    current_energy: int = 0
    fire_potential: int = 0
    fire_mastery: int = 0
    air_potential: int = 0
    air_mastery: int = 0
    space_potential: int = 0
    space_mastery: int = 0
    
    # Character class
    character_class: Optional[CharacterClass] = None
    
    # Other
    initiative_bonus: int = 0
    current_luck: int = 0
    speed: int = 30
    luck_used_this_encounter: bool = False
    
    # Special abilities
    pack_tactics: bool = False
    aggressive: bool = False  # Orc ability
    
    # Combat state
    actions_used_this_turn: int = 0
    
    def __post_init__(self):
        self.current_hp = self.max_hp
        self.current_luck = self.luck
        self.current_energy = self.energy_pool
        self.initiative_bonus = self.agility

    def reset(self):
        """Reset HP, luck, and energy to full"""
        self.current_hp = self.max_hp
        self.current_luck = self.luck
        self.current_energy = self.energy_pool
        self.luck_used_this_encounter = False
        self.actions_used_this_turn = 0

def roll_d8() -> int:
    """Roll a single d8"""
    return random.randint(1, 8)

def roll_under_check(attribute: int, skill: int) -> Tuple[int, List[int]]:
    """
    Roll 2d8, count successes (rolls under attribute/skill)
    Natural 1 always succeeds, natural 8 always fails
    Returns (successes, [attr_roll, skill_roll])
    """
    attr_roll = roll_d8()
    skill_roll = roll_d8()
    
    successes = 0
    
    # Attribute die - need to roll UNDER (not equal)
    if attr_roll == 1:
        successes += 1
    elif attr_roll < attribute and attr_roll != 8:
        successes += 1
    
    # Skill die - need to roll UNDER (not equal)
    if skill_roll == 1:
        successes += 1
    elif skill_roll < skill and skill_roll != 8:
        successes += 1
    
    return successes, [attr_roll, skill_roll]

def roll_with_modifier(attribute: int, skill: int, modifier: int = 0) -> Tuple[int, List[int]]:
    """
    Roll with penalty/bonus (adds to die results)
    Returns (successes, [modified_attr_roll, modified_skill_roll])
    """
    attr_roll = roll_d8()
    skill_roll = roll_d8()
    
    # Store originals for natural 1 check
    orig_attr = attr_roll
    orig_skill = skill_roll
    
    # Apply modifier
    attr_roll += modifier
    skill_roll += modifier
    
    successes = 0
    
    # Check attribute (natural 1 always succeeds before modifier)
    if orig_attr == 1:
        successes += 1
    elif attr_roll < attribute and orig_attr != 8:
        successes += 1
    
    # Check skill (natural 1 always succeeds before modifier)
    if orig_skill == 1:
        successes += 1
    elif skill_roll < skill and orig_skill != 8:
        successes += 1
    
    return successes, [attr_roll, skill_roll]

def melee_attack(attacker: Creature, defender: Creature, modifier: int = 0, log: List[str] = None) -> int:
    """
    Perform a melee attack (opposed roll)
    Returns damage dealt
    """
    if log is None:
        log = []
    
    # Attacker rolls
    attack_successes, attack_rolls = roll_with_modifier(
        attacker.agility, attacker.melee_combat, modifier
    )
    
    # Defender rolls
    defense_successes, defense_rolls = roll_under_check(
        defender.agility, defender.melee_combat
    )
    
    margin = attack_successes - defense_successes
    
    log.append(f"  {attacker.name} attacks {defender.name}")
    log.append(f"    Attack: {attack_rolls[0]}/{attack_rolls[1]} = {attack_successes} successes")
    log.append(f"    Defense: {defense_rolls[0]}/{defense_rolls[1]} = {defense_successes} successes")
    log.append(f"    Margin: {margin}")
    
    # Calculate damage based on margin and attacker type
    damage = 0
    base_damage = 0
    
    # Determine base damage by creature type
    if attacker.name.startswith("Giant Rat"):
        base_damage = 3
    elif attacker.name.startswith("Goblin"):
        base_damage = 5
    elif attacker.name.startswith("Wolf"):
        base_damage = 6
    elif attacker.name.startswith("Orc"):
        base_damage = 10
    elif attacker.character_class == CharacterClass.FIGHTER:
        base_damage = 8  # Longsword
    else:
        base_damage = 6  # Quarterstaff default
    
    if margin == 0:
        log.append(f"    Tie - defender wins, no damage")
    elif margin == 1:
        damage = base_damage
        log.append(f"    Margin 1: {damage} damage")
    elif margin >= 2:
        damage = base_damage + attacker.strength
        log.append(f"    Margin 2+: {damage} damage (base {base_damage} + Str {attacker.strength})")
    
    # Apply DR
    if damage > 0:
        actual_damage = max(0, damage - defender.dr)
        defender.current_hp -= actual_damage
        log.append(f"    {defender.name} takes {actual_damage} damage (after DR {defender.dr})")
        log.append(f"    {defender.name} HP: {defender.current_hp}/{defender.max_hp}")
        return actual_damage
    
    return 0

def cast_fire_burst(caster: Creature, target: Creature, modifier: int = 0, log: List[str] = None) -> int:
    """
    Cast Fire Burst (Simple weave, 2 Energy, touch range, doesn't provoke)
    Fire 2 (4 damage base), half DR applies
    """
    if log is None:
        log = []
    
    if caster.current_energy < 2:
        log.append(f"  {caster.name} doesn't have enough energy for Fire Burst!")
        return 0
    
    caster.current_energy -= 2
    
    # Roll Fire Potential + Fire Mastery (with Weave Focus -1 if wizard)
    weave_modifier = -1 if caster.character_class == CharacterClass.WIZARD else 0
    
    # Roll dice
    fire_pot_roll = roll_d8() + modifier
    fire_mast_roll = roll_d8() + modifier
    
    # Apply weave focus to RESULTS (subtract after rolling)
    fire_pot_final = fire_pot_roll + weave_modifier
    fire_mast_final = fire_mast_roll + weave_modifier
    
    successes = 0
    if fire_pot_roll == 1 or fire_pot_final < caster.fire_potential:
        if fire_pot_roll != 8:
            successes += 1
    if fire_mast_roll == 1 or fire_mast_final < caster.fire_mastery:
        if fire_mast_roll != 8:
            successes += 1
    
    log.append(f"  {caster.name} casts Fire Burst at {target.name} (touch range)")
    log.append(f"    Weaving: {fire_pot_final}/{fire_mast_final} = {successes} successes")
    if weave_modifier != 0:
        log.append(f"    (Weave Focus applied: -1 to results)")
    log.append(f"    Energy spent: 2 (remaining: {caster.current_energy})")
    
    # Damage based on successes (HALF DR applies for fire damage)
    damage = 0
    if successes == 0:
        log.append(f"    Miss!")
    elif successes == 1:
        damage = 2  # Half damage
        log.append(f"    1 success: {damage} fire damage (half)")
    elif successes == 2:
        damage = 4  # Full damage
        log.append(f"    2 successes: {damage} fire damage (full)")
    elif successes == 3:
        damage = 8  # +4 damage
        log.append(f"    3 successes: {damage} fire damage (+4 bonus)")
    elif successes >= 4:
        damage = 12  # +8 damage
        log.append(f"    4 successes: {damage} fire damage (+8 bonus)")
    
    # Apply HALF DR for fire damage
    if damage > 0:
        dr_applied = target.dr // 2
        actual_damage = max(0, damage - dr_applied)
        target.current_hp -= actual_damage
        log.append(f"    {target.name} takes {actual_damage} fire damage (half DR: {dr_applied})")
        log.append(f"    {target.name} HP: {target.current_hp}/{target.max_hp}")
        return actual_damage
    
    return 0

def cast_fire_bolt(caster: Creature, target: Creature, modifier: int = 0, log: List[str] = None) -> int:
    """
    Cast Fire Bolt (Complex weave, 3 Energy, 30ft range, PROVOKES)
    Fire 2 + Air 1 (8 damage base), half DR applies
    """
    if log is None:
        log = []
    
    if caster.current_energy < 3:
        log.append(f"  {caster.name} doesn't have enough energy for Fire Bolt!")
        return 0
    
    caster.current_energy -= 3
    
    # Roll Fire Potential + Fire Mastery + Air Potential + Air Mastery (4d8)
    weave_modifier = -1 if caster.character_class == CharacterClass.WIZARD else 0
    
    # Roll all 4 dice
    fire_pot_roll = roll_d8() + modifier
    fire_mast_roll = roll_d8() + modifier
    air_pot_roll = roll_d8() + modifier
    air_mast_roll = roll_d8() + modifier
    
    # Apply weave focus to fire dice only
    fire_pot_final = fire_pot_roll + weave_modifier
    fire_mast_final = fire_mast_roll + weave_modifier
    
    successes = 0
    
    # Fire potential
    if fire_pot_roll == 1 or fire_pot_final < caster.fire_potential:
        if fire_pot_roll != 8:
            successes += 1
    
    # Fire mastery
    if fire_mast_roll == 1 or fire_mast_final < caster.fire_mastery:
        if fire_mast_roll != 8:
            successes += 1
    
    # Air potential
    if air_pot_roll == 1 or air_pot_roll < caster.air_potential:
        if air_pot_roll != 8:
            successes += 1
    
    # Air mastery
    if air_mast_roll == 1 or air_mast_roll < caster.air_mastery:
        if air_mast_roll != 8:
            successes += 1
    
    log.append(f"  {caster.name} casts Fire Bolt at {target.name} (30ft range)")
    log.append(f"    Weaving: F{fire_pot_final}/{fire_mast_final} A{air_pot_roll}/{air_mast_roll} = {successes} successes")
    log.append(f"    Energy spent: 3 (remaining: {caster.current_energy})")
    
    # Damage based on successes (HALF DR applies)
    damage = 0
    if successes == 0:
        log.append(f"    Miss!")
    elif successes == 1:
        damage = 4  # Half damage
        log.append(f"    1 success: {damage} fire damage (half)")
    elif successes == 2:
        damage = 8  # Full damage
        log.append(f"    2 successes: {damage} fire damage (full)")
    elif successes == 3:
        damage = 16  # +8 damage
        log.append(f"    3 successes: {damage} fire damage (+8 bonus)")
    elif successes >= 4:
        damage = 24  # +16 damage
        log.append(f"    4 successes: {damage} fire damage (+16 bonus)")
    
    # Apply HALF DR
    if damage > 0:
        dr_applied = target.dr // 2
        actual_damage = max(0, damage - dr_applied)
        target.current_hp -= actual_damage
        log.append(f"    {target.name} takes {actual_damage} fire damage (half DR: {dr_applied})")
        log.append(f"    {target.name} HP: {target.current_hp}/{target.max_hp}")
        return actual_damage
    
    return 0

def wizard_turn(wizard: Creature, enemies: List[Creature], log: List[str]) -> int:
    """
    Wizard turn using Simple Weave (Fire Burst) strategy
    - Casts Fire Burst up to 3 times (doesn't provoke)
    - Focus fires on lowest HP enemy
    - Uses luck if needed
    """
    log.append(f"\n{wizard.name}'s Turn:")
    log.append(f"  HP: {wizard.current_hp}/{wizard.max_hp}, Energy: {wizard.current_energy}, Luck: {wizard.current_luck}")
    
    total_damage = 0
    active_enemies = [e for e in enemies if e.current_hp > 0]
    
    if not active_enemies:
        return 0
    
    # Target lowest HP enemy
    target = min(active_enemies, key=lambda e: e.current_hp)
    
    # Cast Fire Burst up to 3 times (1 action each)
    for action_num in range(3):
        if target.current_hp <= 0:
            # Switch to next lowest HP enemy
            active_enemies = [e for e in enemies if e.current_hp > 0]
            if not active_enemies:
                break
            target = min(active_enemies, key=lambda e: e.current_hp)
        
        # Multiple action penalty
        modifier = action_num  # 0, 1, 2
        
        log.append(f"\n  Action {action_num + 1}:")
        damage = cast_fire_burst(wizard, target, modifier, log)
        total_damage += damage
    
    return total_damage

def fighter_turn(fighter: Creature, enemies: List[Creature], log: List[str]) -> int:
    """
    Fighter turn using melee attacks
    - Makes up to 3 attacks per turn
    - Focus fires on lowest HP enemy
    """
    log.append(f"\n{fighter.name}'s Turn:")
    log.append(f"  HP: {fighter.current_hp}/{fighter.max_hp}, Luck: {fighter.current_luck}")
    
    total_damage = 0
    active_enemies = [e for e in enemies if e.current_hp > 0]
    
    if not active_enemies:
        return 0
    
    # Target lowest HP enemy
    target = min(active_enemies, key=lambda e: e.current_hp)
    
    # Make up to 3 attacks
    for action_num in range(3):
        if target.current_hp <= 0:
            # Switch to next lowest HP enemy
            active_enemies = [e for e in enemies if e.current_hp > 0]
            if not active_enemies:
                break
            target = min(active_enemies, key=lambda e: e.current_hp)
        
        # Multiple action penalty
        modifier = action_num  # 0, 1, 2
        
        log.append(f"\n  Action {action_num + 1}:")
        damage = melee_attack(fighter, target, modifier, log)
        total_damage += damage
    
    return total_damage

def run_combat(pc: Creature, enemies: List[Creature], encounter_name: str) -> dict:
    """Run a combat encounter"""
    log = []
    log.append(f"\n{'='*60}")
    log.append(f"ENCOUNTER: {encounter_name}")
    log.append(f"{'='*60}")
    
    # Number enemies
    for i, enemy in enumerate(enemies, 1):
        enemy.name = f"{enemy.name} #{i}"
    
    log.append(f"\n{pc.name} vs {len(enemies)} enemies")
    log.append(f"{pc.name}: {pc.current_hp} HP, DR {pc.dr}")
    for enemy in enemies:
        log.append(f"  {enemy.name}: {enemy.current_hp} HP, DR {enemy.dr}")
    
    # Combat stats
    rounds = 0
    pc_damage_dealt = 0
    pc_damage_taken = 0
    pc_attacks_made = 0
    pc_attacks_hit = 0
    enemy_attacks_made = 0
    enemy_attacks_hit = 0
    spells_cast = 0
    
    # Combat loop
    while pc.current_hp > 0 and any(e.current_hp > 0 for e in enemies):
        rounds += 1
        log.append(f"\n{'='*60}")
        log.append(f"ROUND {rounds}")
        log.append(f"{'='*60}")
        
        # PC turn
        if pc.character_class == CharacterClass.WIZARD:
            dmg = wizard_turn(pc, enemies, log)
            # Count spells
            spells_cast += 3  # Potentially 3 Fire Bursts
        else:  # Fighter
            dmg = fighter_turn(pc, enemies, log)
        
        pc_damage_dealt += dmg
        
        # Check if all enemies dead
        active_enemies = [e for e in enemies if e.current_hp > 0]
        if not active_enemies:
            break
        
        # Enemy turns
        log.append(f"\nEnemy Turns:")
        for enemy in active_enemies:
            # Check pack tactics bonus
            modifier = 0
            if enemy.pack_tactics:
                allies_alive = len([e for e in active_enemies if e is not enemy])
                if allies_alive >= 1:
                    modifier = -1
                    log.append(f"  {enemy.name} has Pack Tactics bonus (-1 to dice)!")
            
            dmg = melee_attack(enemy, pc, modifier, log)
            enemy_attacks_made += 1
            if dmg > 0:
                enemy_attacks_hit += 1
                pc_damage_taken += dmg
        
        # Safety: max 20 rounds
        if rounds >= 20:
            log.append("\n  Combat reached round limit!")
            break
    
    # Determine winner
    pc_survived = pc.current_hp > 0
    
    log.append(f"\n{'='*60}")
    if pc_survived:
        log.append(f"VICTORY! {pc.name} survived with {pc.current_hp}/{pc.max_hp} HP")
    else:
        log.append(f"DEFEAT! {pc.name} was slain")
    log.append(f"Combat lasted {rounds} rounds")
    if pc.character_class == CharacterClass.WIZARD:
        log.append(f"Total spells cast: ~{spells_cast}")
    log.append(f"{'='*60}\n")
    
    return {
        'log': log,
        'rounds': rounds,
        'pc_survived': pc_survived,
        'pc_final_hp': pc.current_hp,
        'pc_damage_dealt': pc_damage_dealt,
        'pc_damage_taken': pc_damage_taken,
        'enemy_attacks_made': enemy_attacks_made,
        'enemy_attacks_hit': enemy_attacks_hit,
        'enemy_hit_rate': enemy_attacks_hit / enemy_attacks_made if enemy_attacks_made > 0 else 0,
        'spells_cast': spells_cast if pc.character_class == CharacterClass.WIZARD else 0,
    }

def create_wizard() -> Creature:
    """
    Create a Tier 1 Wizard with CHAIN MAIL
    Standard array: 5, 4, 3, 3, 3, 2, 2, 2
    Int 5, Luck 4, Con 3, Wis 3, Dex 3, Agi 3, Cha 2, Str 2
    
    Chain Mail: DR 5
    Fire Potential 8, Fire Mastery 3
    Air Potential 6, Air Mastery 1
    Energy Pool: 52
    
    Has Weave Focus (Fire) feat: -1 to Fire dice
    """
    return Creature(
        name="Wizard Elara",
        strength=2,
        constitution=3,
        agility=3,
        dexterity=3,
        intelligence=5,
        wisdom=3,
        charisma=2,
        luck=4,
        max_hp=24,  # Con 3 × 8
        current_hp=24,
        dr=5,  # Chain mail
        melee_combat=0,
        perception=0,
        energy_pool=52,
        current_energy=52,
        fire_potential=8,
        fire_mastery=3,
        air_potential=6,
        air_mastery=1,
        character_class=CharacterClass.WIZARD,
        initiative_bonus=3,
        speed=30
    )

def create_fighter() -> Creature:
    """
    Create a Tier 1 Fighter with CHAIN MAIL
    Standard array: 5, 4, 3, 3, 3, 2, 2, 2
    Str 5, Con 4, Agi 3, Dex 3, Wis 3, Luck 4, Cha 2, Int 2
    
    Chain Mail: DR 5
    Longsword (8 damage heavy one-handed)
    """
    return Creature(
        name="Fighter Borin",
        strength=5,
        constitution=4,
        agility=3,
        dexterity=3,
        intelligence=2,
        wisdom=3,
        charisma=2,
        luck=4,
        max_hp=32,  # Con 4 × 8
        current_hp=32,
        dr=5,  # Chain mail
        melee_combat=3,
        perception=1,
        character_class=CharacterClass.FIGHTER,
        initiative_bonus=3,
        speed=30
    )

def create_giant_rat() -> Creature:
    return Creature(
        name="Giant Rat",
        strength=2, constitution=2, agility=4, dexterity=3,
        intelligence=1, wisdom=3, charisma=1, luck=2,
        max_hp=12, current_hp=12, dr=0,
        melee_combat=2, perception=3, stealth=3,
        initiative_bonus=4, pack_tactics=True
    )

def create_goblin() -> Creature:
    return Creature(
        name="Goblin",
        strength=2, constitution=2, agility=4, dexterity=3,
        intelligence=2, wisdom=2, charisma=2, luck=2,
        max_hp=14, current_hp=14, dr=2,
        melee_combat=3, perception=2, stealth=4,
        initiative_bonus=4, pack_tactics=True
    )

def create_wolf() -> Creature:
    return Creature(
        name="Wolf",
        strength=4, constitution=3, agility=4, dexterity=4,
        intelligence=2, wisdom=4, charisma=3, luck=3,
        max_hp=20, current_hp=20, dr=0,
        melee_combat=4, perception=5, stealth=4,
        initiative_bonus=4, pack_tactics=True
    )

def create_orc_warrior() -> Creature:
    return Creature(
        name="Orc Warrior",
        strength=4, constitution=4, agility=3, dexterity=3,
        intelligence=2, wisdom=3, charisma=3, luck=2,
        max_hp=36, current_hp=36, dr=3,
        melee_combat=4, perception=2,
        initiative_bonus=3, pack_tactics=False,
        aggressive=True
    )

def main():
    parser = argparse.ArgumentParser(description='D8 TTRPG Combat Simulator v3.0')
    parser.add_argument('--class', dest='char_class', choices=['wizard', 'fighter'], 
                       default='wizard', help='Character class to test (default: wizard)')
    parser.add_argument('--verbose', action='store_true', help='Show detailed combat log')
    
    args = parser.parse_args()
    
    print("D8 TTRPG Combat Simulation v3.0 - SIMPLE WEAVES UPDATE")
    print("=" * 60)
    print("\nKey Mechanics:")
    print("  - Simple Weaves (Fire Burst): 2 Energy, touch range, doesn't provoke")
    print("  - Complex Weaves (Fire Bolt): 3 Energy, 30ft range, provokes OA")
    print("  - Chain mail armor (DR 5)")
    print("  - Energy damage: Half DR applies")
    print("  - Physical damage: Full DR applies")
    print("  - 3-action economy per turn")
    print("  - Multiple action penalty: +0, +1, +2 to dice")
    print("\n" + "=" * 60)
    
    # Create character based on argument
    if args.char_class == 'wizard':
        pc = create_wizard()
        print(f"\n{pc.name} (Wizard)")
        print(f"  HP: {pc.max_hp}, DR: {pc.dr} (Chain Mail)")
        print(f"  Energy: {pc.energy_pool}")
        print(f"  Fire: Potential {pc.fire_potential}, Mastery {pc.fire_mastery}")
        print(f"  Air: Potential {pc.air_potential}, Mastery {pc.air_mastery}")
        print(f"  Spells: Fire Burst (2E, 4 dmg, touch, doesn't provoke)")
        print(f"          Fire Bolt (3E, 8 dmg, 30ft, PROVOKES)")
        print(f"  Feat: Weave Focus (Fire) - subtract 1 from Fire dice")
    else:
        pc = create_fighter()
        print(f"\n{pc.name} (Fighter)")
        print(f"  HP: {pc.max_hp}, DR: {pc.dr} (Chain Mail)")
        print(f"  Str: {pc.strength}, Melee Combat: {pc.melee_combat}")
        print(f"  Weapon: Longsword (8 base damage)")
        print(f"  Attacks: 3 per round with penalties +0/+1/+2")
    
    encounters = [
        ("4 Giant Rats", [create_giant_rat() for _ in range(4)]),
        ("2 Goblins", [create_goblin() for _ in range(2)]),
        ("2 Wolves", [create_wolf() for _ in range(2)]),
        ("1 Orc Warrior", [create_orc_warrior()])
    ]
    
    results = []
    
    for name, enemies in encounters:
        pc.reset()
        for enemy in enemies:
            enemy.reset()
        
        result = run_combat(pc, enemies, name)
        results.append((name, result))
        
        # Print log if verbose
        if args.verbose:
            for line in result['log']:
                print(line)
    
    # Summary
    print("\n" + "=" * 80)
    print("ENCOUNTER COMPARISON SUMMARY")
    print("=" * 80)
    print(f"\n{'Encounter':<20} {'Result':<10} {'Rounds':<8} {'PC HP':<15} {'Dmg Dealt':<12}")
    print("-" * 80)
    
    for name, result in results:
        status = "VICTORY" if result['pc_survived'] else "DEFEAT"
        hp_display = f"{result['pc_final_hp']}/{pc.max_hp}"
        
        print(f"{name:<20} {status:<10} {result['rounds']:<8} {hp_display:<15} {result['pc_damage_dealt']:<12}")
    
    print("\n" + "=" * 80)
    print("DETAILED ANALYSIS")
    print("=" * 80)
    
    for name, result in results:
        print(f"\n{name}:")
        print(f"  Outcome: {'Victory' if result['pc_survived'] else 'Defeat'}")
        print(f"  Combat Duration: {result['rounds']} rounds")
        print(f"  {pc.name} Final HP: {result['pc_final_hp']}/{pc.max_hp}")
        print(f"  Total Damage Dealt: {result['pc_damage_dealt']}")
        print(f"  Total Damage Taken: {result['pc_damage_taken']}")
        if pc.character_class == CharacterClass.WIZARD:
            print(f"  Spells Cast: ~{result['spells_cast']}")
        if result['rounds'] > 0:
            print(f"  Damage/Round: {result['pc_damage_dealt']/result['rounds']:.1f} dealt, {result['pc_damage_taken']/result['rounds']:.1f} taken")
        print(f"  Enemy Hit Rate: {result['enemy_hit_rate']*100:.1f}%")

if __name__ == "__main__":
    main()