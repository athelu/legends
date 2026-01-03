# Combat

## Initiative System

### Initiative Bonus (Fixed Value)

Initiative Bonus = Agility + Modifiers

#### Modifiers:
-   Alert feat: +2
-   Quickened Reflexes feat: +2
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
-   Must have at least rank 1 in skill to use it for initiative
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
-   Long range: 2 successes needed
    -   Add 1 to both attack die results
    -   2 successes: Base + Dexterity modifier

### Weapon Base Damage
-   Light weapons: 4 damage (dagger, club, sap)
-   Standard weapons: 6 damage (shortsword, mace, spear)
-   Heavy one-handed: 8 damage (longsword, battleaxe, warhammer)
-   Two-handed: 10 damage (greatsword, greataxe, maul)

### Critical Hits (Double 1s)
-   Grants +1 additional success (3 total successes in opposed rolls)
-   Margin 3+: Deal maximum damage (base + attribute, no roll needed)
-   Restore all Luck (as per existing rule)
-   Choose one additional effect:
    -   Apply condition (Prone, Disarm, Bleeding)
    -   Bypass half DR
    -   Extra combat maneuver

## Non-Lethal Damage

### Non-Lethal Attacks
Non-lethal damage represents attacks intended to subdue rather than kill. When a creature is reduced to 0 HP by non-lethal damage, they fall unconscious but are stable (not dying).

**Naturally Non-Lethal Attacks:**
- Unarmed strikes (punches, kicks, grapples)
- Sap
- Any weapon or attack specifically described as non-lethal

**Declaring Non-Lethal Intent:**
Before making any melee weapon attack, you may declare the attack as non-lethal:
- If the attack hits and reduces the target to 0 HP or below, the target falls unconscious but is stable
- You cannot declare ranged attacks, area effects, or ongoing damage (fire, acid, etc.) as non-lethal

**Recovering from Non-Lethal Damage:**
- A creature at 0 HP from non-lethal damage is unconscious but stable
- They regain consciousness after 1d8 minutes
- They can be awakened early with 1 minute of tending and a Medicine check
- Healing restores them normally and wakes them immediately

**Mixing Lethal and Non-Lethal:**
- If reduced to 0 HP by non-lethal while also having lethal damage, creature is unconscious and dying normally

## Temporary Hit Points

Temporary HP is a buffer that absorbs damage before your actual HP.

**Rules:**
- Temporary HP is lost before actual HP when you take damage
- You can only have one source of temporary HP at a time (new temp HP replaces old, they don't stack)
- Temporary HP from the same source doesn't stack with itself
- Temporary HP can't be healed - only regained through the source that granted it
- Temporary HP disappears after a long rest
- Temporary HP doesn't count as healing (doesn't trigger healing-related effects)

**Example:** You have 25 HP and gain 8 temporary HP. An enemy deals 12 damage. You lose all 8 temporary HP and 4 actual HP (now at 21/25 HP, 0 temp HP).


### Fortune & Misfortune in Combat
Certain conditions and circumstances grant Fortune or Misfortune on
attack rolls:

#### Fortune on attacks (roll 3d8, take best 2):
-   Attacking a Blinded opponent
-   Attacking a Cowering opponent
-   Other beneficial tactical positions

#### Misfortune on attacks (roll 3d8, take worst 2):
-   You are Blinded
-   Attacking while Prone
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
-   On hit: Bypass half DR OR apply specific condition (GM Discretion)

#### Power Attack (feat required)
-   Add 1 to both attack die results
-   On hit: +1d8 bonus damage

#### Disarm/Trip Attempt
-   Normal attack roll
-   Margin 1: No damage, but apply condition (Disarmed/Prone)
-   Margin 2: Base damage AND apply condition

#### Two-Weapon Fighting
##### Without Feat
-   When wielding two weapons, you may make two attacks with a single [Combat] action (1 action total)
-   Off-hand weapon must have the Light property
-   Use a Shared Attribute Roll (roll attribute once, applies to both attacks)
-   Roll skill die separately for each weapon
-   First Two-Weapon Action: First attack: Add 1 to both die results, Second attack: Add 2 to both die results
-   Second Two-Weapon Action: First attack: Add 2 to both die results, Second attack: Add 3 to both die results
-   Additional [Combat] actions continue penalty progression (3rd attack adds 3, 4th adds 4, etc.)

##### With Two-Weapon Fighting Feat
-   Off-hand weapon must have the Light property
-   First attack in an [Combat] action: Normal (no penalty)
-   Second attack: Add 1 to both die results (instead of 2)
-   Subsequent [Combat] actions follow normal penalty progression from there
-   Still use Shared Attribute Roll

##### Example without feat:
-   Action 1: Attack with both weapons (add 1 to first, add 2 to second)
-   Action 2: Attack with both weapons (add 2 to first, add 3 to second)

##### Example with feat:
-   Action 1: Attack with both weapons (normal on first, add 1 to second)
-   Action 2: Attack with both weapons (add 1 to first, add 2 to second)
-   Action 2: Attack with both weapons (add 2 to first, add 3 to second)

### Cover

Cover provides physical protection from attacks through defensive positioning.

#### Degrees of Cover

##### No Cover
-   Target is completely exposed
-   No defensive bonuses

##### Partial Cover (¼ to ½ body covered)
-   Low wall, furniture, creature, tree trunk
-   **Against Melee Attacks:** +1 DR (fewer vulnerable areas to strike)
-   **Against Ranged Attacks:** Make Reflex save (Agility + Luck) to duck behind cover
    -   1+ successes: Attack misses
    -   0 successes: Attack hits normally
-   Examples: Standing behind a 3-foot wall, leaning around a corner, ally partially blocking line of sight

##### Half Cover (½ to ¾ body covered)
-   Portcullis, arrow slit, thick tree trunk
-   **Against Melee Attacks:** +2 DR (significantly fewer vulnerable areas)
-   **Against Ranged Attacks:** Make Reflex save (Agility + Luck) to duck behind cover
    -   Subtract 1 from both Reflex save die results
    -   1+ successes: Attack misses
    -   0 successes: Attack hits normally
-   Examples: Firing through arrow slit, crouching behind a barrel, most of body behind wall

##### Three-Quarters Cover (¾ or more body covered)
-   Murder hole, small window, only small part visible
-   **Against Melee Attacks:** +3 DR (minimal exposed areas to strike)
-   **Against Ranged Attacks:** Make Reflex save (Agility + Luck) to duck behind cover
    -   Subtract 1 from both Reflex save die results
    -   1+ successes: Attack misses
    -   0 successes: Attack hits normally
-   Examples: Peeking around a corner, firing through a narrow window

##### Full Cover (completely covered)
-   Completely behind solid obstacle
-   **Benefit:** Cannot be directly targeted by attacks or most weaves
-   Examples: Fully behind a wall, around a corner, inside a closed room
-   **Note:** Some weaves or abilities can affect targets through full cover (GM discretion)

#### Cover Rules

**Direction Matters:**
-   Cover only applies against attacks coming from the direction of the obstacle
-   Flanking or attacking from different angles may negate cover

**Cover and Concealment:**
-   Cover and concealment can stack
-   Example: Behind a low wall in fog = Partial Cover (Reflex save vs ranged) + Concealed (attacker adds +1 to attack)

**Damaging Cover:**
-   Cover objects can be destroyed
-   GM assigns HP and DR to cover objects
-   Destroying cover removes its benefit

**Cover vs. Area Effects:**
-   Area effects (fireballs, lightning, etc.) typically allow Reflex saves
-   Subtract 1 from one Reflex save die on Reflex saves against area effects
-   Full cover may provide total protection from area effects (GM discretion)
-   Example: Fireball explodes - you're behind half cover = Fortune on your Reflex save

**Fighting from Cover:**
-   You can attack while benefiting from cover
-   Leaning out to attack doesn't reduce your cover benefit
-   Attacking doesn't prevent you from using cover's defensive benefits on the same round

**Multiple Cover Sources:**
-   Use the highest degree of cover available
-   Cover bonuses don't stack (being behind two partial cover sources = partial cover, not half)

#### Prone and Cover

-   Being Prone provides equivalent of Partial Cover against ranged attacks
-   Can combine with physical cover for better protection:
    -   Prone + Partial Cover = Half Cover
    -   Prone + Half Cover = Three-Quarters Cover
-   Against Melee Attacks: Being Prone does NOT provide DR
-   Melee attacks against prone targets have subtract 1 from both attack dice

#### Cover Tactics

**Best Practices:**
-   Seek cover before enemy ranged combatants act
-   Half cover or better gives you Fortune or bonuses on Reflex saves
-   Full cover completely protects but you can't attack either
-   Move between cover positions using Disengage to avoid Opportunity Attacks
-   Prone + Cover stacks for excellent ranged defense (but vulnerable to melee)

**Cover Example:**
Archer shoots at you behind a barrel (Half Cover):
1. Archer rolls Dexterity + Ranged Combat, gets 2 successes (hit at medium range)
2. You immediately roll Reflex save (Agility + Luck) with Fortune (half cover bonus)
3. If you get 1+ successes, you duck behind the barrel - arrow misses
4. If you get 0 successes, arrow hits you for damage (minus any DR from armor)

## Line of Sight & Targeting

### What is Line of Sight?

**Line of Sight (LoS) Definition:**
You have line of sight to a target if you can draw an unblocked straight line from any point in your space to any point in the target's space.

**Why LoS Matters:**
- Required to target with most attacks and weaves
- Determines if you can see a creature (vs Hidden)
- Affects cover and concealment
- Required for many abilities and reactions

---

### What Blocks Line of Sight

**Complete LoS Blockage (Cannot Target):**
- **Solid obstacles:** Walls, closed doors, large boulders, thick tree trunks
- **Full cover:** Completely behind solid barrier
- **Total darkness + no darkvision:** Pitch black conditions (creature is Hidden)
- **Magical darkness:** Unless you have darkvision or magical sight
- **Opaque barriers:** Solid doors, thick curtains, stone walls

**Special Cases:**
- **Invisible creatures:** You don't have LoS unless you can detect them (they are Hidden)
- **Around corners:** No LoS to creatures on other side of wall
- **Inside containers:** No LoS to creatures inside closed chests, boxes, etc.

---

### What Does NOT Block Line of Sight

**You DO have LoS through/despite:**
- **Fog, smoke, mist, rain:** Provides Concealment, doesn't block LoS
- **Dim light or shadows:** Provides Concealment, doesn't block LoS
- **Partial or lesser cover:** Can see target, they have cover benefits
- **Other creatures:** Generally provide cover, don't completely block LoS (see below)
- **Transparent barriers:** Glass, ice, magical force walls (though may block attacks)
- **Difficult terrain:** Undergrowth, rubble, etc. (may provide Concealment)
- **Water:** Can see through clear water (may affect attacks differently)

**Important Distinction:**
- **Blocked LoS** = Cannot target at all
- **Concealment** = Can target but with penalties (harder to see clearly)
- **Cover** = Can target but target has defensive benefits (physical protection)

---

### Creatures as Obstacles

When an attack (ranged or melee) would pass through or near a square occupied by another creature before reaching your target:

#### Intervening Creature Provides Cover

**Size-Based Cover Determination:**

**If intervening creature is same size or larger than your target:**
- Provides **Partial Cover** to target
  - **Against Melee Attacks:** +1 DR (fewer vulnerable areas)
  - **Against Ranged Attacks:** Target makes Reflex save (Agi + Luck):
    - 1+ successes: Attack misses
    - 0 successes: Attack hits normally

**If intervening creature is one size category larger than you:**
- Provides **Half Cover** to target
  - **Against Melee Attacks:** +2 DR
  - **Against Ranged Attacks:** Target makes Reflex save with -1 to both dice:
    - 1+ successes: Attack misses
    - 0 successes: Attack hits normally

**If intervening creature is two+ size categories larger than you:**
- Provides **Three-Quarters Cover** to target
  - **Against Melee Attacks:** +3 DR
  - **Against Ranged Attacks:** Target makes Reflex save with -1 to both dice:
    - 1+ successes: Attack misses
    - 0 successes: Attack hits normally

**Important Notes:**
- The intervening creature is **NOT** at risk of being hit (you aim carefully around them)
- This assumes you're deliberately targeting a creature beyond an ally
- You don't want to hit your ally, so you're trying to shoot/strike around them


#### Area Effect Weaves

**Area effects are different:**
- Fireball, Lightning Bolt, and other AOE weaves affect **all creatures in area**
- Intervening creatures do **NOT** provide cover against area effects


---

### Targeting Hidden Creatures

**If a creature is Hidden:**
- You **do not have LoS** to them (you don't know where they are)
- You **cannot** make attack rolls against them
- You **cannot** target them with single-target weaves
- You **can** target their general area with AOE effects (if you know/guess where they might be)

**To gain LoS to Hidden creature:**
1. Succeed on Perception check to detect them → they become Concealed
2. Use abilities that detect hidden creatures (Blindsight, Tremorsense, Perfect Sight) rendering them concealed
3. Wait for them to reveal themselves (attack, make noise, leave tracks)

**Once detected (Hidden → Concealed):**
- You now have LoS (you know which square they're in)
- You can target them, but you still have attack penalties from Concealment

---

### Invisible Creatures

**Invisibility grants Hidden condition:**
- You don't have LoS to invisible creatures by vision alone
- They cannot be directly targeted
- You must detect them by other means (sound, smell, touch, environmental clues)

**If you detect invisible creature:**
- They become Concealed (you know their location but can't see them clearly)
- You have LoS to their square
- You can attack with penalties from Concealment (add +1 to both attack dice)

**Perfect Sight or similar abilities:**
- Grants LoS to invisible creatures
- You can see and target them normally

---

### Special Senses and LoS

#### Darkvision
- Grants normal vision in darkness and dim light
- You have LoS through darkness that would otherwise block vision
- Range specified (typically 60 feet)

#### Blindsight
- You can sense creatures within specified range without sight
- You have LoS to creatures within Blindsight range, even if invisible or in total darkness
- Does not work around corners or through solid barriers
- Typically requires hearing (can be defeated by Silence)

#### Tremorsense
- You can detect creatures in contact with the ground within specified range
- You have LoS to creatures on the ground within Tremorsense range
- Works even if creature is invisible or in darkness
- Does not detect flying or burrowing creatures

#### Truesight / Perfect Sight
- You can see invisible creatures
- You can see through magical darkness
- You can see through illusory effects
- You have LoS to creatures that would otherwise be Hidden by magic
- Range specified (typically 60-120 feet)

---

### Targeting Rules Summary

**To target a creature with an attack or single-target weave:**
1. You must have line of sight to the target
2. Target must be within range of attack/weave
3. Target cannot have Full Cover from you
4. Target cannot be Hidden from you

**If any requirement fails:**
- You cannot target that creature
- You must choose a different target or different action

**Alternative Actions if Cannot Target:**
- Use AOE effects to target their general area
- Use Search action to try to find Hidden creatures
- Move to position where you have LoS
- Ready action to attack when target becomes visible