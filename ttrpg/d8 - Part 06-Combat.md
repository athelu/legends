# D8 TTRPG - Part 6: Combat

## Initiative System

### Initiative Bonus (Fixed Value)

Initiative Bonus = Agility + Modifiers

#### Modifiers:
-   Alert feat: +2
-   Lightning Reflexes feat: +2
-   Acute Hearing trait: +1
-   Deafened condition: -2
-   Other permanent/temporary modifiers

### Initiative Roll
Initiative = Initiative Bonus + Current Luck + Desired Skill + 1d8

#### Where:
-   Initiative Bonus: Your fixed Agi + mods
-   Current Luck: Your Luck pool at combat start (dynamic, depletes during session)
-   Desired Skill: The skill you use to react
-   1d8: Random element

### Initiative Skill Options
Default: Perception (most common, general awareness)

Combat Skills: Melee Combat, Ranged Combat
Movement Skills: Athletics, Acrobatics, Stealth
Mental/Social: Investigate, Intimidate
Magical: Arcane, Religion

#### Requirements:
-   Must have at least rank 1 in skill to use it
-   Must make narrative sense for the situation (GM approval)
-   Declare before rolling

### Turn Order
Highest Initiative acts first.

#### Ties (in order):
1.  Higher Initiative Bonus
2.  Higher skill value used
3.  Higher maximum Luck attribute
4.  Simultaneous actions (or GM decides)

### Hit Points & Damage
Weapon Damage (Margin of Success)

#### Melee Combat (Opposed Rolls):
-   Margin 0 (Tie): Defender wins, no damage
-   Margin 1: Base weapon damage
-   Margin 2: Base weapon damage + Strength modifier

#### Ranged Combat (Unopposed):
-   Short range: 1 success needed
    -   1 success: Base damage
    -   2 successes: Base + Dexterity modifier
-   Medium range: 2 successes needed
    -   2 successes: Base + Dexterity modifier
-   Long range: 2 successes needed with penalties
    -   2 successes: Base + Dexterity modifier

### Weapon Base Damage
-   Light weapons: 4 damage (dagger, club, sap)
-   Standard weapons: 6 damage (shortsword, mace, spear)
-   Heavy one-handed: 8 damage (longsword, battleaxe, warhammer)
-   Two-handed: 10 damage (greatsword, greataxe, maul)

### Critical Hits (Double 1s)
-   Deal maximum damage (base + attribute, no roll needed)
-   Restore all Luck (as per existing rule)
-   Optional: Choose one additional effect:
    -   Apply condition (Prone, Disarm, Bleeding)
    -   Bypass half DR
    -   Extra combat maneuver

### Fortune & Misfortune in Combat
Certain conditions and circumstances grant Fortune or Misfortune on
attack rolls:

#### Fortune on attacks (roll 3d8, take best 2):
-   Attacking a Blinded opponent
-   Attacking a Prone opponent (melee only)
-   Attacking a Cowering opponent
-   Flanking (if using flanking rules)
-   Other beneficial tactical positions

#### Misfortune on attacks (roll 3d8, take worst 2):
-   You are Blinded
-   Attacking while Prone
-   Attacking into melee without Precise Shot feat
-   Other detrimental circumstances

### Physical Damage Types
1.  Slashing - Cuts, bleeds (swords, axes)
2.  Piercing - Penetration, precision (spears, arrows, daggers)
3.  Bludgeoning - Impact, crushing (maces, hammers, clubs)

### Resistance Tiers
-   Weakness: DR halved (rounded down)
-   Normal: Full DR applies
-   Resistance: +1 DR against that damage type
-   Greater Resistance: +2 DR against that damage type
-   Legendary Resistance: +4 DR against that damage type
-   Immunity: No damage from that source
-   Vulnerability: +50% damage (rounded up) from that type

### Combat Maneuvers
Combat maneuvers are declared before rolling and modify the attack:

#### Called Shot
-   Add 1 to both attack die results
-   On hit: Bypass half DR OR apply specific condition

#### Power Attack (feat required)
-   Add 1 to both attack die results
-   On hit: +1d8 bonus damage

#### Disarm/Trip Attempt
-   Normal attack roll
-   Margin 1: No damage, but apply condition (Disarmed/Prone)
-   Margin 2: Base damage AND apply condition

#### Two-Weapon Fighting
##### Without Feat
-   When wielding two weapons, you may make two attacks with a single [Attack] action (1 action total)
-   Off-hand weapon must have the Light property
-   Use a Shared Attribute Roll (roll attribute once, applies to both attacks)
-   Roll skill die separately for each weapon
-   First attack: Add 1 to both die results
-   Second attack: Add 2 to both die results
-   Additional [Attack] actions continue penalty progression (3rd attack adds 3, 4th adds 4, etc.)

##### With Two-Weapon Fighting Feat
-   Off-hand weapon must have the Light property
-   First attack in an [Attack] action: Normal (no penalty)
-   Second attack: Add 1 to both die results (instead of 2)
-   Subsequent [Attack] actions follow normal penalty progression from there
-   Still use Shared Attribute Roll

##### Example without feat:
-   Action 1: Attack with both weapons (add 1 to first, add 2 to second)
-   Action 2: Attack with both weapons (add 3 to first, add 4 to second)

##### Example with feat:
-   Action 1: Attack with both weapons (normal on first, add 1 to
    second)
-   Action 2: Attack with both weapons (add 2 to first, add 3 to second)