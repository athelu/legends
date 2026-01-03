# Combat Test Script v3.0 - Documentation

## Overview

Updated combat simulator for D8 TTRPG with **Simple Weave mechanics** and support for **both Wizard and Fighter** character classes.

## What's New in v3.0

### Major Updates

1. **Simple Weave Support**
   - Fire Burst: 2 Energy, touch range, doesn't provoke opportunity attacks
   - Fire Bolt: 3 Energy, 30ft range, PROVOKES opportunity attacks
   - Correct DR application (half DR for energy damage)

2. **Character Class System**
   - Command-line parameter to choose Wizard or Fighter
   - Different combat strategies for each class
   - Class-specific statistics tracking

3. **Updated Mechanics**
   - Chain Mail armor (DR 5, corrected from DR 4)
   - Correct roll-under mechanics (must roll UNDER, not equal to)
   - Weave Focus feat implementation (-1 to Fire dice results)
   - Multiple action penalties (+0, +1, +2)

4. **Improved Stats**
   - Wizard: Fire Potential 8, Fire Mastery 3 (matches Elara build)
   - Fighter: Str 5, Con 4, Melee Combat 3
   - Energy pool: 52 for wizard (accurate calculation)

## Usage

### Basic Usage

```bash
# Run wizard simulation (default)
python3 combat_test_v3.py

# Run wizard simulation explicitly
python3 combat_test_v3.py --class wizard

# Run fighter simulation
python3 combat_test_v3.py --class fighter

# Show detailed combat log
python3 combat_test_v3.py --class wizard --verbose

# Show help
python3 combat_test_v3.py --help
```

### Command-Line Arguments

- `--class {wizard,fighter}`: Choose character class (default: wizard)
- `--verbose`: Show detailed round-by-round combat log
- `--help`: Display help message

## Character Builds

### Wizard (Elara)
```
HP: 24 (Con 3 × 8)
DR: 5 (Chain Mail)
Energy Pool: 52
Fire Potential: 8, Fire Mastery: 3
Air Potential: 6, Air Mastery: 1

Feats: Weave Focus (Fire) - subtract 1 from Fire dice

Spells:
- Fire Burst: 2 Energy, 4 damage, touch range, doesn't provoke
- Fire Bolt: 3 Energy, 8 damage, 30ft range, PROVOKES

Strategy: Casts Fire Burst 3 times per round (doesn't provoke)
```

### Fighter (Borin)
```
HP: 32 (Con 4 × 8)
DR: 5 (Chain Mail)
Str: 5, Melee Combat: 3

Weapon: Longsword (8 base damage, heavy one-handed)

Strategy: Makes 3 melee attacks per round with penalties
```

## Test Encounters

The script runs 4 standard encounters:

1. **4 Giant Rats** (TR 1/8 each)
   - HP: 12 each, DR: 0
   - Pack Tactics: Yes
   - Expected: Easy victory for both classes

2. **2 Goblins** (TR 1/4 each)
   - HP: 14 each, DR: 2
   - Pack Tactics: Yes
   - Expected: Moderate challenge

3. **2 Wolves** (TR 1/4 each)
   - HP: 20 each, DR: 0
   - Pack Tactics: Yes
   - Expected: Significant challenge

4. **1 Orc Warrior** (TR 1/2)
   - HP: 36, DR: 3
   - Melee Combat: 4, Aggressive ability
   - Expected: Deadly solo encounter

## Output Format

### Summary Table
```
Encounter            Result     Rounds   PC HP           Dmg Dealt   
--------------------------------------------------------------------------------
4 Giant Rats         VICTORY    9        24/24           48          
2 Goblins            VICTORY    20       22/24           26          
2 Wolves             VICTORY    7        16/24           40          
1 Orc Warrior        DEFEAT     10       -1/24           33          
```

### Detailed Analysis
```
4 Giant Rats:
  Outcome: Victory
  Combat Duration: 9 rounds
  Wizard Elara Final HP: 24/24
  Total Damage Dealt: 48
  Total Damage Taken: 0
  Spells Cast: ~27
  Damage/Round: 5.3 dealt, 0.0 taken
  Enemy Hit Rate: 0.0%
```

## Mechanics Implemented

### Weaving (Wizard Only)

**Fire Burst (Simple Weave)**
```python
- Energy Cost: 2
- Action Cost: 1 action
- Range: Touch (5-10ft)
- Damage: 4 base (scales with successes: 2/4/8/12)
- Rolls: Fire Potential + Fire Mastery (2d8)
- DR: Half DR applies to fire damage
- Provokes: NO (Simple Weave)
```

**Fire Bolt (Complex Weave)**
```python
- Energy Cost: 3
- Action Cost: 2 actions
- Range: 30 feet
- Damage: 8 base (scales with successes: 4/8/16/24)
- Rolls: Fire Pot + Fire Mast + Air Pot + Air Mast (4d8)
- DR: Half DR applies to fire damage
- Provokes: YES (Complex Weave)
```

**Weave Focus Feat**
- Applies -1 to Fire Potential and Fire Mastery die results
- Applied AFTER rolling but BEFORE checking success
- Only affects Fire dice, not Air dice (in Fire Bolt)

### Melee Combat

**Attack Resolution**
```python
- Attacker: Agility + Melee Combat (2d8) + multiple action penalty
- Defender: Agility + Melee Combat (2d8)
- Margin = Attacker successes - Defender successes

Damage:
- Margin 0: Tie, defender wins, no damage
- Margin 1: Base weapon damage
- Margin 2+: Base weapon damage + Strength modifier

DR: Full DR applies to physical damage
```

**Multiple Action Penalty**
- 1st action: +0 to dice
- 2nd action: +1 to dice
- 3rd action: +2 to dice

### Special Abilities

**Pack Tactics (Rats, Goblins, Wolves)**
- Modifier: -1 to both dice when ally is alive
- Makes enemies more dangerous in groups

**Aggressive (Orc)**
- Currently implemented: None (placeholder for free movement)
- Could add bonus attack or charge mechanic

## Key Findings

### Wizard Performance (Simple Weaves)
- **Strengths:**
  - DR 5 blocks all rat damage (Str 2 creatures)
  - Can cast 3 Fire Bursts per round (doesn't provoke)
  - Energy efficient (2 Energy vs 3 for Fire Bolt)
  
- **Weaknesses:**
  - Touch range requires staying in melee (dangerous)
  - Lower damage per spell (4 vs 8 for Fire Bolt)
  - High-strength enemies (Orc Str 4) still threatening

- **Typical Results:**
  - Rats: Perfect victory (DR blocks everything)
  - Goblins: Victory with minor damage
  - Wolves: Victory with moderate damage (6-10 HP lost)
  - Orc: Often defeat (50/50 survival rate)

### Fighter Performance
- **Strengths:**
  - Higher HP pool (32 vs 24)
  - Better melee combat (Agi 3 + Melee 3 vs Agi 3 + Melee 0)
  - Strength bonus on Margin 2+ hits
  
- **Weaknesses:**
  - Subject to full DR (vs half DR for wizard spells)
  - No ranged options (must stay in melee)
  - Multiple action penalties hurt later attacks

- **Typical Results:**
  - Similar to wizard in most encounters
  - Slightly better HP sustainability
  - Orc still very dangerous (similar win rate)

## Combat Strategy

### Wizard Strategy
```python
def wizard_turn():
    # 1. Select target (lowest HP enemy)
    # 2. Cast Fire Burst (1 action, no provoke)
    # 3. Cast Fire Burst (1 action, +1 penalty)
    # 4. Cast Fire Burst (1 action, +2 penalty)
    # 5. Switch targets if current dies
```

### Fighter Strategy
```python
def fighter_turn():
    # 1. Select target (lowest HP enemy)
    # 2. Melee attack (1 action, no penalty)
    # 3. Melee attack (1 action, +1 penalty)
    # 4. Melee attack (1 action, +2 penalty)
    # 5. Switch targets if current dies
```

## Technical Details

### Roll-Under Mechanic
```python
def roll_under_check(attribute, skill):
    # Natural 1: Always succeeds
    # Natural 8: Always fails
    # Otherwise: Must roll UNDER (not equal to) attribute/skill
    
    if roll == 1:
        success
    elif roll < attribute and roll != 8:
        success
```

### Damage Resistance
```python
# Energy damage (fire, cold, lightning, etc.)
actual_damage = damage - (DR // 2)  # Half DR

# Physical damage (bludgeoning, piercing, slashing)
actual_damage = damage - DR  # Full DR
```

### Energy Pool Calculation
```python
Energy Pool = (Sum of 8 Potentials) + (Int × 2) + Con + (Total Mastery ÷ 2)

Wizard Elara:
= (8+6+5+4+3+3+2+1) + (5×2) + 3 + (5÷2)
= 32 + 10 + 3 + 2
= 52
```

## Future Enhancements

### Potential Additions
1. **More Character Classes**
   - Cleric (healing + buffs)
   - Rogue (stealth + sneak attack)
   - Ranger (ranged attacks)

2. **Advanced Tactics**
   - Reactive Ward (reaction)
   - Disengage action
   - Positioning/movement
   - Cover mechanics

3. **More Weaves**
   - Lightning Touch (Simple Weave, lightning)
   - Frost Touch (Simple Weave, cold)
   - Flame Burst (AOE fire)
   - Unerring Bolt (auto-hit)

4. **Boss Abilities**
   - Relentless (Orc ability to survive at 1 HP)
   - Legendary actions
   - Multiattack

5. **Statistical Analysis**
   - Run 100+ simulations per encounter
   - Calculate win percentages
   - Average damage/rounds
   - Identify balance issues

## Troubleshooting

### Common Issues

**"Import Error"**
- Ensure Python 3.6+ is installed
- Script uses only standard library (no external dependencies)

**"No results shown"**
- Add `--verbose` flag to see detailed logs
- Check that creatures are being created correctly

**"Damage seems wrong"**
- Verify DR calculations (half for energy, full for physical)
- Check roll-under logic (must be UNDER, not equal)
- Confirm multiple action penalties are applied

## Code Structure

```
combat_test_v3.py
├── Imports & Enums
├── Creature dataclass
├── Roll functions
│   ├── roll_d8()
│   ├── roll_under_check()
│   └── roll_with_modifier()
├── Combat functions
│   ├── melee_attack()
│   ├── cast_fire_burst()
│   └── cast_fire_bolt()
├── Turn functions
│   ├── wizard_turn()
│   └── fighter_turn()
├── Combat runner
│   └── run_combat()
├── Creature creators
│   ├── create_wizard()
│   ├── create_fighter()
│   ├── create_giant_rat()
│   ├── create_goblin()
│   ├── create_wolf()
│   └── create_orc_warrior()
└── main()
```

## Testing

### Validation Tests
```bash
# Test both classes
python3 combat_test_v3.py --class wizard
python3 combat_test_v3.py --class fighter

# Verify verbose output
python3 combat_test_v3.py --class wizard --verbose | head -200

# Check help text
python3 combat_test_v3.py --help
```

### Expected Behaviors
- Wizard should survive rats with 0 damage taken
- Both classes should struggle vs Orc (50/50 win rate)
- Verbose mode should show detailed roll breakdowns
- Energy should deplete correctly for wizard

## Credits

Based on D8 TTRPG combat mechanics by Sean
Updated to v3.0 with Simple Weave support and character class system