# D8 TTRPG - Bestiary Framework & Design Guidelines

## Monster Design Philosophy

Monsters use the same core d8 roll-under mechanics as player characters, but with streamlined presentation and special abilities. Each monster has a **Threat Rating** that indicates appropriate challenge level.

---

## Threat Rating System

### Threat Rating Scale
Monsters use the same tier system as characters, including fractional ratings:

| Threat Rating | Equivalent | Challenge For |
|--------------|------------|---------------|
| 1/8 | CR 1/8 | 4 Tier 1 PCs (trivial for 1 PC) |
| 1/4 | CR 1/4 | 2 Tier 1 PCs (easy for 1 PC) |
| 1/2 | CR 1/2 | 1 Tier 1 PC (fair fight) |
| 1 | CR 1 | 1 Tier 1 PC (challenging) |
| 2 | CR 2-4 | 1 Tier 2 PC |
| 3 | CR 5-7 | 1 Tier 3 PC |
| 4 | CR 8-10 | 1 Tier 4 PC |
| 5 | CR 11-15 | 1 Tier 5 PC |
| 6 | CR 16-20 | 1 Tier 6 PC |
| 7 | CR 21-25 | 1 Tier 7 PC |
| 8 | CR 26+ | 1 Tier 8 PC |

---

## Creature Sizes

### Size Categories

| Size | Space | Reach | Weapon Damage Modifier |
|------|-------|-------|------------------------|
| Tiny | 2.5 ft × 2.5 ft | 0 ft | -2 damage (min 2) |
| Small | 5 ft × 5 ft | 5 ft | -1 damage (min 2) |
| Medium | 5 ft × 5 ft | 5 ft | Normal |
| Large | 10 ft × 10 ft | 5-10 ft* | +2 damage |
| Huge | 15 ft × 15 ft | 10-15 ft* | +4 damage |
| Gargantuan | 20 ft × 20 ft | 15-20 ft* | +6 damage |

*Reach with natural weapons. Weapons add their own reach.

### Size-Based Natural Weapons

Natural weapons (bite, claw, slam, etc.) deal damage based on size:

| Size | Light Nat. Weapon | Standard Nat. Weapon | Heavy Nat. Weapon |
|------|-------------------|----------------------|-------------------|
| Tiny | 2 | 3 | 4 |
| Small | 3 | 4 | 6 |
| Medium | 4 | 6 | 8 |
| Large | 6 | 8 | 10 |
| Huge | 8 | 10 | 12 |
| Gargantuan | 10 | 12 | 14 |

**Examples:**
- Light: Tiny claws, rat bite
- Standard: Wolf bite, claw attack
- Heavy: Bear bite, dragon bite

---

## Attribute Guidelines by Threat Rating

### Attribute Benchmarks

| Threat | Primary Attrs | Secondary Attrs | Dump Attrs | Skill Ranks (combat) |
|--------|---------------|-----------------|------------|---------------------|
| 1/8 | 2-3 | 1-2 | 1 | 0-1 |
| 1/4 | 2-3 | 2 | 1 | 1-2 |
| 1/2 | 3-4 | 2-3 | 1-2 | 2-3 |
| 1 | 3-4 | 2-3 | 1-2 | 2-3 |
| 2 | 4-5 | 3-4 | 1-2 | 3-4 |
| 3 | 4-6 | 3-5 | 1-3 | 4-5 |
| 4 | 5-7 | 4-6 | 2-3 | 5-6 |
| 5 | 6-8 | 5-7 | 2-4 | 6-7 |
| 6 | 7-8 | 6-8 | 3-5 | 7-8 |
| 7-8 | 8 | 7-8 | 4-6 | 8 |

**Note:** Monster skills CAN exceed their governing attribute. This represents innate talent, specialized training, or supernatural ability. A creature might have Agi 3 but Melee Combat 5 due to lifelong predatory instincts.

### Primary Attributes
- Physical monsters: Str, Con, Agi
- Ranged monsters: Dex, Agi, Wis (perception)
- Spellcasters: Int, Wis, or Cha (depending on type)
- All threatening creatures: Luck 2+ (represents threat level)

---

## Hit Point Calculation Tables

### HP Formula by Creature Type

**HP = Constitution × HP Multiplier (from table below)**

**HP Multiplier Table:**

| Threat Rating | Fragile (×) | Standard (×) | Tough (×) | Massive (×) |
|--------------|-------------|--------------|-----------|-------------|
| 1/8 | 5 | 7 | 9 | 11 |
| 1/4 | 6 | 8 | 10 | 12 |
| 1/2 | 7 | 9 | 11 | 13 |
| 1 | 8 | 10 | 12 | 14 |
| 2 | 10 | 13 | 16 | 19 |
| 3 | 12 | 16 | 20 | 24 |
| 4 | 15 | 20 | 25 | 30 |
| 5 | 18 | 24 | 30 | 36 |
| 6 | 22 | 30 | 38 | 46 |
| 7 | 26 | 36 | 46 | 56 |
| 8 | 30 | 42 | 54 | 66 |

**How to use:** Find the intersection of Threat Rating and creature type category to get the multiplier. Multiply this by the creature's Constitution score to calculate total HP.

### Creature Type Categories

**Fragile:**
- Small beasts (rats, bats)
- Tiny creatures
- Low-Con spellcasters
- Swarms (use special swarm rules)

**Standard:**
- Most humanoids
- Medium beasts
- Constructs (medium toughness)
- Undead (standard)

**Tough:**
- Warriors, soldiers
- Large beasts
- Armored constructs
- Tough undead (zombies)
- Most monstrosities

**Massive:**
- Giants
- Dragons
- Huge+ creatures
- Siege monsters
- Legendary creatures

**Example:** 
- Goblin (Threat 1/4, Con 2, Fragile): 2 × 6 = 12 HP
- Orc Warrior (Threat 1/2, Con 4, Tough): 4 × 11 = 44 HP
- Young Dragon (Threat 4, Con 6, Massive): 6 × 30 = 180 HP

---

## Creature Type Keywords

### Creature Type Traits

#### **Beast**
- Natural animal (not magical)
- Normal intelligence (Int 1-2)
- No special immunities

#### **Monstrosity**
- Magical or unnatural creature
- May have unusual anatomy
- No standard immunities

#### **Undead**
- **Undead Immunities:** Immune to poison damage, Poisoned condition, disease, exhaustion
- **Mindless (if applicable):** Immune to charm, fear, psychic effects
- **Does not need:** Air, food, drink, sleep
- **Negative Healing (optional):** Healed by negative energy, harmed by positive

#### **Construct**
- **Construct Immunities:** Immune to poison, Poisoned, disease, exhaustion, Paralyzed, Petrified
- **Mindless (if applicable):** Immune to charm, fear, psychic effects
- **Does not need:** Air, food, drink, sleep

#### **Aberration**
- Alien biology
- Often has alien mind (advantage vs mental effects or vulnerability, varies)
- Unusual anatomy

#### **Dragon**
- **Dragon Senses:** Darkvision 120 ft, Blindsight 30-60 ft (varies by age)
- **Frightful Presence:** Can impose fear conditions
- **Energy Affinity:** Resistance or immunity to one energy type

#### **Elemental**
- **Elemental Body:** Immune to poison, Poisoned, disease, exhaustion, Paralyzed, Petrified, Unconscious
- **Elemental Immunity:** Immune to associated element (fire elemental = immune to fire)
- **Does not need:** Air, food, drink, sleep

#### **Fiend (Demon/Devil)**
- **Fiend Resistances:** Often resistant to cold, fire, lightning
- **Magic Resistance:** Subtract 1 from both dice on saves vs magical effects
- **Devil's Sight (Devils):** See through magical darkness
- **Chaotic Nature (Demons):** Unpredictable, may have random effects

#### **Celestial**
- **Celestial Resistances:** Often resistant to radiant, necrotic
- **Magic Resistance:** Subtract 1 from both dice on saves vs magical effects
- **Holy Aura:** May deal radiant damage or have protective effects

#### **Fey**
- **Fey Ancestry:** Fortune on saves vs charm effects
- **Magic Affinity:** Often can innately weave
- **Iron Weakness (optional):** Takes extra damage from cold iron

#### **Giant**
- **Large Size or bigger**
- **Powerful Build:** Count as one size larger for carrying, pushing, dragging
- **Rock Throwing (many):** Can throw boulders as ranged weapons

#### **Humanoid**
- Standard mortal creature
- No special immunities
- Uses equipment normally

#### **Ooze**
- **Ooze Immunities:** Immune to Blinded, Deafened, Exhaustion, Frightened, Prone
- **Mindless:** Immune to charm, fear, psychic effects
- **Amorphous:** Can squeeze through tiny spaces
- **Corrosive (many):** Deals acid damage, dissolves equipment

#### **Plant**
- **Plant Immunities:** Often immune to Blinded, Deafened, Exhaustion
- **Vulnerability to Fire (many):** Takes extra fire damage
- **False Appearance (many):** Appears to be normal vegetation

#### **Swarm**
- **Swarm Body:** Can occupy other creatures' spaces
- **Swarm Resistance:** Resistant to bludgeoning, piercing, slashing (half damage)
- **Swarm Vulnerability:** Vulnerable to area effects (take double damage)
- **Cannot be Grappled or Restrained**
- **Reduced Damage (half HP):** Damage output reduced by half when below half HP

---

## Vision Types

### Standard Vision Types

#### **Normal Vision**
- Sees in normal light
- Cannot see in darkness
- Standard for most humanoids

#### **Low-Light Vision**
- Sees twice as far in dim light
- Treats dim light as bright light
- Cannot see in complete darkness
- Common: Elves, halflings, some beasts

#### **Darkvision (specify range)**
- Sees in darkness as if dim light (black and white only)
- Sees in dim light as if bright light
- Most common ranges: 60 ft, 90 ft, 120 ft
- Common: Dwarves, undead, subterranean creatures

#### **Superior Darkvision (specify range)**
- As darkvision but sees in darkness as if bright light (in color)
- Range typically 120 ft
- Rare: Drow, some aberrations

#### **Blindsight (specify range)**
- Perceives surroundings without relying on sight (echolocation, tremorsense, etc.)
- Not affected by Blinded condition, invisibility, or darkness
- Cannot perceive beyond range
- Common ranges: 10 ft, 30 ft, 60 ft
- Common: Bats, oozes, some dragons

#### **Tremorsense (specify range)**
- Type of Blindsight that detects vibrations
- Only works against creatures touching the ground
- Common: Burrowing creatures, earth elementals

#### **Truesight (specify range)**
- Sees in normal and magical darkness
- Sees invisible creatures and objects
- Detects illusions and sees through them
- Perceives true form of shapechangers
- Sees into Ethereal Plane
- Range typically 60 ft or 120 ft
- Rare: Very powerful creatures, divine beings

#### **Blind**
- Cannot use sight-based perception
- Relies entirely on other senses
- Has Blinded condition penalties (unless has Blindsight)

---

## Equipment & Gear

### Monsters with Equipment

When a monster wields manufactured weapons or wears armor:

#### **Weapons:**
- Use standard weapon damage tables
- Apply Size modifier to damage
- Gain weapon properties (reach, versatile, etc.)
- Can be disarmed

#### **Armor:**
- Provides DR as normal
- May restrict movement (heavy armor)
- Can be damaged or removed

#### **Shields:**
- Grants Shield Block reaction
- Provides +1 DR (standard shield) or +2 DR (tower shield)
- Requires proficiency (assumed for most warriors)

#### **Other Gear:**
- Potions, scrolls, magic items work as normal
- Can be stolen or used against monster
- Include in treasure when monster dies

**Formatting Note:** List equipped items separately in stat block:
- **Equipment:** Chain mail (DR 4), longsword, shield (DR +1)
- Total DR from armor/shield shown in main DR stat

---

## Monster Combat Skills

### Mandatory Combat Skill Listings

**All monsters must list:**
- **Melee Combat rank** (if they make melee attacks)
- **Ranged Combat rank** (if they make ranged attacks)

**Format in stat block:**
```
Skills: Melee Combat 4, Ranged Combat 2, Perception 3, Stealth 4
```

### Skill Rank Guidelines

Monster skills should be set to give reasonable success rates in combat:

| Threat | Skill Rank (combat) | With Attribute 4 | Success Rate (1+) |
|--------|---------------------|------------------|-------------------|
| 1/8-1/4 | 1-2 | 4/2 | 44-53% |
| 1/2-1 | 2-3 | 4/3 | 53-66% |
| 2 | 3-4 | 5/4 | 66-78% |
| 3 | 4-5 | 5/5 | 78-86% |
| 4 | 5-6 | 6/6 | 86-94% |
| 5+ | 6-8 | 7/7-8/8 | 94-100% |

**Remember:** Skills can exceed attributes for monsters to represent specialized combat ability.

---

## Multiattack Ability

### Multiattack Rules for Monsters

**Multiattack [Combat]**
- **Cost:** 1 [Combat] action
- **Effect:** Make multiple specified attacks as part of a single action
- **Shared Attribute Roll:** Roll the governing attribute once, apply to all attacks. Roll skill die separately for each attack.
- **No Multiple Action Penalty:** Multiattack counts as ONE [Combat] action, so no penalty between the attacks within the Multiattack
- **Frequency:** Can only use Multiattack once per turn (cannot be combined with additional [Combat] actions to make more Multiattacks)
- **Movement:** Can move before or after Multiattack, but movement between individual attacks within Multiattack is not allowed

### Multiattack and Additional Actions

If a monster uses Multiattack as its first [Combat] action:
- **Second [Combat] action:** Add 1 to both dice (normal multiple action penalty)
- **Third [Combat] action:** Add 2 to both dice (normal multiple action penalty)

**Example Turn:**
1. **Action 1:** Multiattack (bite + 2 claws) - no penalty
2. **Action 2:** Single bite attack - add 1 to both dice
3. **Action 3:** Move action - no penalty (not a [Combat] action)

### Multiattack Format

**Format in stat block:**
```
Multiattack: The owlbear makes one bite and two claw attacks.
  - Shared Attribute Roll (Agi), roll skill separately for each attack
  - Bite: (Agi + Melee Combat 4 vs defense)
  - Claw 1: (Agi + Melee Combat 4 vs defense)
  - Claw 2: (Agi + Melee Combat 4 vs defense)
```

**Example Combat:**
- Owlbear has Agi 4, Melee Combat 5
- Uses Multiattack: Roll Agi die once (1d8, need ≤4), roll skill die three times (1d8, need ≤5)
- If Agi die rolls 3: All attacks get that 3 for attribute portion
- Skill rolls separately: 4, 2, 6 = two hit (3/4 and 3/2), one miss (3/6)

---

## Special Abilities & Powers

### Recharge Mechanics (Using d8)

Some abilities recharge during combat:

**Recharge 7-8:**
- At start of creature's turn, roll 1d8
- On 7-8, ability recharges and can be used again
- Common for very powerful abilities (ancient dragon breath)

**Recharge 6-8:**
- Recharges on 6, 7, or 8
- Common for powerful abilities (adult dragon breath)

**Recharge 5-8:**
- Recharges on 5, 6, 7, or 8
- Common for moderate abilities (young dragon breath)

**Limited Uses:**
- "3/day" - Can use 3 times, resets after long rest
- "1/day" - Can use once, resets after long rest
- "Recharge after short rest" - Returns after 10-minute rest

### Regeneration

**Format:**
```
Regeneration X: Regains X HP at start of its turn if it has at least 1 HP.
  - Suppressed by: [damage type(s)]
  - If takes [specified damage], regeneration doesn't function next turn
```

**Example:**
```
Regeneration 10: Regains 10 HP at start of turn.
  - Suppressed by: Fire, acid damage
```

### Damage Resistances & Vulnerabilities

Use standardized format:

**Resistance Tiers:**
- **Resistance:** +1 DR vs specified type
- **Greater Resistance:** +2 DR vs specified type
- **Legendary Resistance:** +4 DR vs specified type
- **Immunity:** No damage from source, cannot be affected
- **Vulnerability:** +50% damage from type (rounded up)
- **Weakness:** DR halved (rounded down) vs type

**Format in stat block:**
```
Resistances: Fire (Greater Resistance, +2 DR), Cold (Resistance, +1 DR)
Immunities: Poison damage, Poisoned condition
Vulnerabilities: Lightning (+50% damage)
```

---

## Action Economy & Reactions

### Monster Action Economy

Monsters use the same 3 actions per turn as PCs:
- Can take 3 actions from [Combat], [Move], [Interact], etc.
- Subject to Multiple Action Penalty for multiple [Combat] actions
- One [Minor] action free with [Move]

### Universal Monster Reactions

All monsters can potentially use:
- **Opportunity Attack:** When enemy leaves reach (if has melee capability)
- **Shield Block:** If wielding shield

Some monsters have special reactions listed in their abilities.

---

## Elite/Boss Monster Mechanics

### Action Points (replaces Legendary Actions)

Some powerful monsters (typically Threat 4+) have **Action Points** representing their superior combat prowess:

**Action Points:**
- Creature has 3 Action Points
- Can spend Action Points at end of any other creature's turn
- Regains all Action Points at start of its turn
- Cannot be used during own turn

**Action Point Costs:**
- **Move (1 point):** Move up to half speed
- **Attack (1 point):** Make one weapon attack
- **Detect (1 point):** Make a Perception check
- **Special Ability (2 points):** Use a specified special ability
- **Cast Weave (3 points):** Cast a weave

**Format in stat block:**
```
Action Points (3/round): Can spend at end of other creatures' turns
  - Move (1 pt): Move up to half speed
  - Claw Attack (1 pt): Make one claw attack
  - Wing Attack (2 pts): All within 15 ft make Reflex save or take damage and knocked prone; dragon flies up to half speed
```

### Resilient Defense (replaces Legendary Resistance)

**Resilient Defense (X/day):**
- When the creature fails a saving throw, it can choose to succeed instead
- Common amounts: 1/day (Threat 3-4), 2/day (Threat 5-6), 3/day (Threat 7-8)

---

## Sample Stat Block Template

```
### [Monster Name]
[Size] [Type], [Typical Alignment]

- **Threat Rating:** X (D&D CR equivalent)
- **HP:** X (Con Y × Multiplier Z [creature type])
- **DR:** X (source)
- **Speed:** X ft, [other movement types]
- **Attributes:** Str X / Con X / Agi X / Dex X / Int X / Wis X / Cha X / Luck X
- **Skills:** Melee Combat X, [other skills]
- **Senses:** [Vision types and ranges]
- **Equipment:** [If applicable]
- **Initiative Bonus:** +X (Agi X)

**Attacks:**
- **[Attack Name] [Combat]:** [Melee/Ranged] attack ([Attribute + Skill] vs [target])
  - Range/Reach: X ft
  - Margin 1: X damage [type]
  - Margin 2: X damage + X (attribute mod) [type]
  - [Special effects]

**Multiattack (if applicable):**
- Specify attacks included
- Note Shared Attribute Roll

**Special Abilities:**
- **[Ability Name] ([Recharge/Limited]):** Description
  - Mechanical effect
  - Saving throw if applicable

**Creature Type Traits:**
- [List applicable keyword traits]

**Resistances/Immunities:**
- [List with mechanical effects]

**Action Points (if applicable):**
- [List available actions and costs]

**Resilient Defense (if applicable):**
- X/day

**Tactics:** [Brief description of how creature fights]
```

---

## D&D 5e Conversion Guidelines

### Conversion Process

#### 1. Attributes (5e → d8)
Use this conversion chart:

| 5e Score | D8 Attribute |
|----------|--------------|
| 1-3 | 1 |
| 4-7 | 2 |
| 8-11 | 3 |
| 12-15 | 4 |
| 16-19 | 5 |
| 20-23 | 6 |
| 24-27 | 7 |
| 28-30 | 8 |

**5e Attack Bonus → d8 Attribute + Skill:**

The challenge: D&D 5e combines ability modifier + proficiency into one attack bonus, but d8 separates these into attribute + skill.

**Method 1: Break Down the Math**
1. Convert the 5e ability score to d8 attribute (use table above)
2. Note the 5e attack bonus
3. Subtract what the 5e ability modifier was (this reveals the proficiency bonus)
4. Convert proficiency bonus to skill rank using this table:

| 5e Proficiency | D8 Skill Rank |
|----------------|---------------|
| +2 | 2-3 |
| +3 | 3-4 |
| +4 | 5-6 |
| +5 | 6-7 |
| +6 | 7-8 |

**Examples:**

*Orc with Greataxe:*
- 5e: Str 16 (+3 modifier), +5 to hit
- Attack breakdown: +3 (Str) + 2 (proficiency) = +5
- D8: Str 16 → Str 5, proficiency +2 → Melee Combat 3-4
- **Result: Str 5, Melee Combat 4**

*Young Dragon Bite:*
- 5e: Str 23 (+6 modifier), +10 to hit  
- Attack breakdown: +6 (Str) + 4 (proficiency) = +10
- D8: Str 23 → Str 6, proficiency +4 → Melee Combat 6-7
- **Result: Str 6, Melee Combat 7**

**Method 2: Quick Rule of Thumb**
1. Convert 5e attribute to d8 attribute
2. Take 5e attack bonus, divide by 2 (round as needed)
3. That's approximately the d8 skill rank
4. Adjust based on whether it's a primary skill (keep high) or secondary (reduce by 1)

*Example:* 
- 5e +8 to hit → d8 Skill rank ~4-5
- 5e +5 to hit → d8 Skill rank ~2-3

#### 2. HP (5e → d8)
- Take 5e HP
- Reduce by 30-40%
- Round to match HP table multiplier

**Example:**
- 5e Orc: 15 HP → d8: 10-12 HP
- 5e Ogre: 59 HP → d8: 35-45 HP

#### 3. AC → DR
Use this conversion:

| 5e AC | D8 DR |
|-------|-------|
| 10-11 | 0 |
| 12-13 | 1 |
| 14-15 | 2 |
| 16-17 | 3 |
| 18-19 | 4 |
| 20-21 | 5 |
| 22-23 | 6 |
| 24+ | 7-8 |

**Natural Armor:** If 5e creature has "natural armor," note source in parentheses

#### 4. Damage (5e → d8)
- Use d8 weapon damage tables
- Apply size modifiers
- Convert average damage to closest d8 equivalent
- Add attribute modifiers on margin 2+

**Examples:**
- 5e: 2d6+3 (avg 10) → d8: 8 base + 3 (Str) = 11 on margin 2
- 5e: 1d8+1 (avg 5) → d8: 4 base + 2 (Str) = 6 on margin 2

#### 5. Save DCs (5e → d8)
**5e DC → Success Requirement:**

| 5e DC | D8 Requirement |
|-------|----------------|
| 10-12 | 1 success |
| 13-15 | 1 success (with penalty) OR 2 successes |
| 16-18 | 2 successes |
| 19-21 | 2 successes (with penalty) |
| 22+ | 2 successes (add to both dice) |

**Penalty Options:**
- Add 1 to both dice
- Subtract 1 from both dice (for saves)
- Add/subtract only from skill die

#### 6. Special Abilities
Convert mechanical effects:
- **5e Advantage/Disadvantage → d8 Fortune/Misfortune**
- **5e Proficiency bonus → d8 Skill rank** (roughly half)
- **5e Multiattack → d8 Multiattack** (with Shared Attribute Roll)
- **5e Legendary Actions → d8 Action Points**
- **5e Legendary Resistance → d8 Resilient Defense**

---

## Balancing & Playtesting

### Success Rate Targets

Monsters should have these minimum success rates for their primary attacks:

| Threat | vs Same-Tier PC Defense | Target Success Rate (1+) |
|--------|-------------------------|-------------------------|
| 1/8-1/4 | ~40% | At least 1 hit per 3 attacks |
| 1/2-1 | ~50% | At least 1 hit per 2 attacks |
| 2-3 | ~60% | At least 2 hits per 3 attacks |
| 4-5 | ~70% | At least 7 hits per 10 attacks |
| 6+ | ~80% | At least 4 hits per 5 attacks |

### Two-Success Requirements

For saves and opposed rolls against same-tier PCs:
- Low-tier (1-2): Most saves require 1 success
- Mid-tier (3-4): Some saves require 2 successes
- High-tier (5+): Many saves require 2 successes, possibly with penalties

### Damage Output Benchmarks

Monster damage should threaten but not instantly kill same-tier PCs:

| Threat | Avg Damage per Hit | % of PC HP (Tier-appropriate) |
|--------|-------------------|------------------------------|
| 1/8 | 4-6 | 15-25% |
| 1/4-1/2 | 6-10 | 20-30% |
| 1-2 | 10-16 | 25-40% |
| 3-4 | 16-24 | 30-50% |
| 5+ | 24-40+ | 40-60% |

**Elite/Boss Monsters:** Can exceed these by 50-100% due to lower numbers

---

## Common Monster Templates

### Minion Template
- Use lowest HP multiplier (Fragile)
- Reduce skills by 1-2
- Remove special abilities
- Perfect for swarms of weak enemies

### Elite Template
- Use highest HP multiplier (Massive)
- Increase primary skills by 1-2
- Add 1-2 special abilities
- May have Action Points (1-2)

### Boss Template
- Double HP multiplier
- Increase all relevant skills by 2-3
- Multiple special abilities
- Action Points (3)
- Resilient Defense (2-3/day)
- Area effects, multiple targets

---

*This framework provides the foundation for creating balanced, interesting monsters that challenge players appropriately while respecting the core d8 system mechanics.*