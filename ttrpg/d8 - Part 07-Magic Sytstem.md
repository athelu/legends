# D8 TTRPG - Part 7: Magic System - Weaving

### Three Paths to Magic

#### Arcane Weaving (Magical Aptitude advantage)
- Studied magic, intellectual manipulation of elements
- Uses Intelligence as Casting Stat
- Bonus to one elemental energy (Earth, Air, Fire, Water)
- Bonus to one additional energy (Secondary Focus)
- **Ritual Casting:** Can cast any weave as a 10-minute ritual for half
  Energy cost (minimum 1). Cannot be used in combat.

#### Divine Weaving (Divine Gift advantage)
- Channeled magic, spiritual connection to life/death forces or nature
- Uses Wisdom as Casting Stat
- Bonus to chosen divine/elemental energies (see Divine Paths)
- Includes Channel Divinity ability

#### Bardic Weaving (Bardic Magic advantage)
- Performance magic, charisma-based casting
- Uses Charisma as Casting Stat
- Limited to 4 energies (always includes Air)
- Includes Inspiring Performance ability

### The Eight Magical Energies
1.  Earth - Stone, metal, earth magic
2.  Air - Wind, lightning, sound
3.  Fire - Flame, heat, light
4.  Water - Ice, liquid, steam
5.  Positive - Healing, growth, life
6.  Negative - Decay, necrotic, shadow, death
7.  Time - Haste, slow, temporal manipulation
8.  Space - Teleportation, portals, distance, barriers

#### Magical Potentials & Mastery

##### Potentials (1-8, like attributes)
- Raw magical affinity for each energy
- Rolled at character creation (8d8, assign results)
- Can be raised with XP (costs same as attributes: 16 × current rank)
- Determines maximum Energy you can spend in that type

##### Mastery (1-8, like skills)
- Trained control of each energy
- All start at rank 0 (untrained)
- Can be raised with XP (costs same as skills)
- Cannot exceed corresponding Potential
- Determines reliability when weaving

#### Energy Pool Formula
Energy Pool = (Sum of 8 Potentials) + (Casting Stat × 2) + Constitution + (Total Mastery Ranks ÷ 2, rounded down)
Energy regenerates fully after long rest.

#### Determining Magical Potentials

##### Magical Aptitude (Arcane)
- Roll 8d8, assign one result to each energy
- Choose Elemental Affinity (Earth, Air, Fire, or Water)
- That Potential = highest roll + 2 (maximum 8)

##### Divine Gift (Divine)
- Roll 8d8, assign one result to each energy
- Choose Divine Path:
  - Cleric Path: Choose Divine Affinity (Positive or Negative). Chosen
    affinity = highest roll + 2 (max 8), other divine energy = any other
    roll + 1
  - Druid Path: Choose Elemental Affinity (Earth, Air, Fire, or Water) =
    highest roll + 2 (max 8), and choose one divine energy (Positive or
    Negative) = any other roll + 1

##### Enhanced Options (Additional Advantages)
- Gifted Mage (-2 points, requires magical advantage): Roll 9d8, drop lowest, assign remaining 8. Advantage bonuses still apply.
- Balanced Channeler (-1 point, requires magical advantage): Use fixed array: 5,4,3,3,2,2,1,1. Advantage bonuses still apply.

### Weaving (Casting) Mechanics

#### Step 1: Declare Intent
- What effect do you want?
- Which energies will you use?

#### Step 2: Allocate Energy Points
- Choose Primary Energy (determines effect type)
- Optional: Supporting Energy (modifies range/area/duration)
- Spend points from your Energy Pool

#### Step 3: Make Weaving Roll
- Roll Primary Potential + Primary Mastery (2d8)
- If using supporting energy: Also roll Secondary Potential + Secondary Mastery (2d8)
- Total possible: Up to 4 successes

#### Step 4: Apply Overspending Penalties
- If Energy Points spent exceed your Mastery in that energy:
  - Penalty = Add 1 to both die results per point over Mastery
  - Applies to BOTH Potential and Mastery dice for that energy
- Cannot spend more than your Potential (absolute ceiling)

#### Weaving Success Results
##### 0 successes:
- Weave fails
- Lose half Energy Points spent (rounded up)

##### 1 success:
- Weave works at reduced effectiveness
- Damage weaves: Reduce by 1 die or half damage
- Utility weaves: Reduced duration/range

##### 2 successes:
- Weave works as designed at full power

##### 3 successes:
- Enhanced effect
- Damage: +1d8 bonus damage
- Utility: Extended duration or bonus effect

##### 4 successes:
- Maximum power/critical success
- Damage: Maximum on one die or spectacular effect
- Utility: Double duration or overwhelming power
- May achieve permanency (see below)

#### Weave Effect Scaling Tables

##### PRIMARY ENERGY TABLES
Primary Energy determines the core effect and power level of your weave.
Choose the appropriate table based on what you\'re trying to accomplish.

1. **Primary Energy:** Damage
   **Energy Types:** Fire, Air, Water, Earth, Negative

|             |               |                |                        |
|-------------|---------------|----------------|------------------------|
| Energy Cost | Damage Output | Power Level    | D&D Comparison         |
|             |               |                |                        |
| 1-2         | 8 damage      | Cantrip        | Fire Bolt avg 5.5      |
| 3-4         | 16 damage     | 1st-2nd level  | Burning Hands avg 10.5 |
| 5-6         | 28 damage     | 3rd-4th level  | Fireball avg 28        |
| 7-8         | 40 damage     | 5th-6th+ level | Chain Lightning avg 45 |
|             |               |                |                        |

##### Modified by weaving successes:
- 0 successes: Half damage (rounded down)
- 1 success: 3/4 damage (rounded down)
- 2 successes: Full damage
- 3 successes: +8 damage
- 4 successes: +16 damage

**Design Note:** Damage values calibrated to D&D spell averages. Our system provides more reliable damage (no dice variance) balanced by opposed roll mechanics and success-based scaling.

2. **Primary Energy:** Healing
   **Energy Type:** Positive

|             |                     |                     |
|-------------|---------------------|---------------------|
| Energy Cost | Healing Output      | Power Level         |
|             |                     |                     |
| 2           | 4 HP                | Cantrip (stabilize) |
| 3           | 8 HP                | 1st level           |
| 4           | 16 HP               | 2nd level           |
| 5           | 24 HP               | 3rd level           |
| 6           | 32 HP               | 4th level           |
| 7           | 40 HP               | 5th level           |
| 8           | 48 HP or Raise Dead | 6th+ level          |
|             |                     |                     |

**Notes:** Healing at range or multiple targets requires Supporting Energy (Space).

3. **Primary Energy:** Buffs & Debuffs
   **Energy Types:** Varies (Earth for physical, Space for magical, Positive/Negative for life/death)

|             |                                                 |               |
|-------------|-------------------------------------------------|---------------|
| Energy Cost | Effect Power                                    | Power Level   |
|             |                                                 |               |
| 2           | Minor (+1 to one thing)                         | Cantrip       |
| 3           | Basic (+2 to one thing or +1 to multiple)       | 1st level     |
| 4           | Moderate (+2 to multiple or significant bonus)  | 2nd level     |
| 5           | Strong (major stat change or multiple benefits) | 3rd level     |
| 6           | Major (transformation-level or party-wide)      | 4th level     |
| 7           | Exceptional (multiple major benefits)           | 5th-6th level |
| 8           | Reality-altering (permanent or overwhelming)    | 8th-9th level |
|             |                                                 |               |

**Notes:** Duration from Supporting Energy (Time). Multiple targets require Supporting Energy (Space).

4. **Primary Energy:** Control & Crowd Control
  **Energy Types:** Space (mind effects), Earth (physical restraint), Time (temporal effects)

|             |                                                   |             |
|-------------|---------------------------------------------------|-------------|
| Energy Cost | Control Power                                     | Power Level |
|             |                                                   |             |
| 2           | Cantrip control (minor hindrance)                 | Cantrip     |
| 3           | Basic single-target (1 creature hindered)         | 1st level   |
| 4           | Moderate single-target (1 creature incapacitated) | 2nd level   |
| 5           | Strong area or domination                         | 3rd level   |
| 6           | Major control (paralysis/dominate)                | 4th level   |
| 7           | Mass control or long-term                         | 5th level   |
| 8           | Overwhelming control                              | 6th+ level  |
|             |                                                   |             |

**Notes:** Targets make saves. Area effects require Supporting Energy (Space).

5. **Primary Energy:** Summons & Conjurations
   **Energy Types:** Matching element (Earth/Air/Fire/Water), Space (extraplanar), Negative (undead)

|             |                                          |               |
|-------------|------------------------------------------|---------------|
| Energy Cost | Summon Power                             | Power Level   |
|             |                                          |               |
| 3           | Weak creature or simple object           | 1st level     |
| 4           | Minor combatant or useful object         | 2nd level     |
| 5           | Moderate creature or complex creation    | 3rd level     |
| 6           | Strong creature or powerful object       | 4th-5th level |
| 7           | Major creature or reality creation       | 5th-6th level |
| 8           | Legendary creature or permanent creation | 8th-9th level |
|             |                                          |               |

**Notes:** Summoned creature has HP = (Your Potential × 6), uses your Mastery for attacks. Duration from Supporting Energy (Time).

6. **Primary Energy:** Transformations
   **Energy Type:** Space (physical changes)

|             |                                       |               |
|-------------|---------------------------------------|---------------|
| Energy Cost | Transformation Scope                  | Power Level   |
|             |                                       |               |
| 3           | Cosmetic or minor feature             | 1st level     |
| 4           | Significant physical changes (self)   | 2nd level     |
| 5           | Major self-transformation             | 3rd level     |
| 6           | Transform others or major change      | 4th level     |
| 7           | Extreme transformation or mass effect | 5th-6th level |
| 8           | Reality-level transformation          | 8th-9th level |
|             |                                       |               |

**Notes:** Unwilling targets get saves. Duration from Supporting Energy (Time).

7. **Primary Energy:** Utility & Manipulation
   **Energy Types:** Varies by effect (Earth for stone, Water for water, Space for objects)

|             |                                       |               |
|-------------|---------------------------------------|---------------|
| Energy Cost | Utility Power                         | Power Level   |
|             |                                       |               |
| 2           | Cantrip utility (minor effect)        | Cantrip       |
| 3           | Basic utility (useful effect)         | 1st-2nd level |
| 4           | Moderate utility (significant effect) | 2nd-3rd level |
| 5           | Strong utility (major convenience)    | 3rd-4th level |
| 6           | Major utility (powerful effect)       | 4th-5th level |
| 7           | Exceptional utility (near-impossible) | 5th-7th level |
| 8           | Reality-level utility                 | 8th-9th level |
|             |                                       |               |

** Notes:** Some utilities are permanent (stone shaping). Others need Supporting Energy (Time) for duration.

8. **Primary Energy:** Protection & Warding
   **Energy Type:** Space (barriers, wards)

|             |                                                  |               |
|-------------|--------------------------------------------------|---------------|
| Energy Cost | Protection Level                                 | Power Level   |
|             |                                                  |               |
| 2           | Minor ward (brief +2 DR or single resistance)    | Cantrip-1st   |
| 3           | Basic protection (+2 DR or single resist, 1 min) | 1st-2nd level |
| 4           | Moderate ward (improved protection)              | 2nd-3rd level |
| 5           | Strong protection (multiple benefits)            | 3rd level     |
| 6           | Major ward (DR 4 or powerful defense)            | 4th-5th level |
| 7           | Mass protection or impenetrable                  | 6th-7th level |
| 8           | Reality-level protection                         | 8th-9th level |
|             |                                                  |               |

**Notes:** Duration from Supporting Energy (Time). Multiple targets need Supporting Energy (Space).

9. **Primary Energy:** Divination
   **Energy Type:** Space (seeing distant/hidden things)

|             |                                     |               |
|-------------|-------------------------------------|---------------|
| Energy Cost | Information Level                   | Power Level   |
|             |                                     |               |
| 2           | Detect nearby (30ft)                | Cantrip-1st   |
| 3           | Identify or basic info              | 1st-2nd level |
| 4           | Extended sense (distant viewing)    | 2nd-3rd level |
| 5           | Major divination (specific answers) | 3rd-5th level |
| 6           | Powerful knowledge (see all)        | 5th-6th level |
| 7           | Reality-piercing sight              | 6th-7th level |
| 8           | Omniscient-level                    | 8th-9th level |
|             |                                     |               |

**Notes:** Duration from Supporting Energy (Time) for ongoing effects.

#### SUPPORTING ENERGY TABLES

Supporting Energy modifies the delivery and scope of your Primary effect.

##### Supporting Energy: Range (typically Air or Space)
- 0 points: Touch
- 1 point: Close (30 feet)
- 2 points: Medium (60 feet)
- 3+ points: Long (120 feet)

##### Supporting Energy: Area Effect (typically Air or Space)
- 0 points: Single target
- 1 point: 2 targets or 10ft radius
- 2 points: 4 targets or 20ft radius
- 3+ points: 6 targets or 30ft radius

##### Supporting Energy: Duration (typically Time or element)
- 0 points: Instantaneous
- 1 point: 1 round (8 seconds)
- 2 points: 1 minute
- 3 points: 10 minutes
- 4 points: 1 hour
- 5 points: 4 hours
- 6 points: 12 hours
- 7 points: 1 day
- 8 points: 1 week

**Note:** Concentration-required effects typically use durations of 1 minute to 1 hour and cost 1-2 less Energy than non-concentration effects of the same duration.

### Building Spells with the Tables

#### Step-by-Step Process:
1.  Choose your Primary effect type (damage, healing, buff, control, etc.)
2.  Find the appropriate Primary Energy cost from the table
3.  Add Supporting Energy for:
    - Range (if not touch): Space 1-3
    - Area (if multiple targets): Space 1-3+
    - Duration (if not instant): Time 1-8
4.  Total Cost = Primary Energy + Supporting Energy (max 16 total)
5.  Each energy type capped at 8 individually

##### Example - Fireball:
- Primary: Fire 5 (24 damage, 3rd level power)
- Supporting: Space 3 (medium range + 20ft radius)
- Total: 8 Energy

##### Example - Cure Wounds:
- Primary: Positive 3 (8 HP healing, 1st level power)
- Supporting: Touch (0) or +1 for Close range
- Total: 3 Energy at touch, 4 at range

#### Permanency Rules

Permanency is not achieved through duration alone, but through exceptional weaving success. It represents the caster achieving such mastery that the effect becomes self-sustaining.

##### Achieving Permanency
- Cast the spell normally with appropriate duration energy investment
- Achieve 4 successes on your weaving roll
- The specific spell must list permanency as an option in its success
  scaling

##### What Can Be Made Permanent

Eligible for Permanency (with 4 successes):
- Structural changes: Walls, shaped stone/water/earth, passages
- Enchantments on objects: Arcane locks, magical traps, glyphs
- Created objects: Conjured items, fabricated materials
- Bindings and wards: Planar bindings, protective circles, sealed portals
- Environmental changes: Darkness, light, temperature alterations in fixed locations

NOT Eligible for Permanency:
- Buffs/debuffs on living creatures: Transformations, stat changes, conditions
- Summoned creatures: Elementals, conjured beings
- Ongoing energy effects: Sustained fire, continuous lightning, persistent storms
- Mind-affecting magic: Charms, compulsions, sleep effects
- Healing or damage: Cannot permanently heal or harm

#### GM Guidance
Permanency should feel earned and special. A 4-success weaving is rare (requiring high Potential/Mastery or fortunate rolls). Not every spell should offer permanency as an option---reserve it for effects that make narrative sense to become self-sustaining.

### Magic in Combat

#### Attack Weaves (like Fire Bolt, Lightning)
- Weaving successes determine hit quality automatically
- No separate attack roll needed
- Apply damage based on successes

#### Save Weaves (like Fireball, Charm)
- Weaver generates X successes from weaving roll
- Target makes appropriate save (Fortitude/Reflex/Will)
- Net Successes = Weaver Successes - Target Successes
- Apply effect based on net successes:
  - 0 or less: Target resists completely
  - 1: Reduced effect (half damage, weakened)
  - 2: Full effect
  - 3: Enhanced effect
  - 4: Overwhelming/maximum effect

##### Saving Throws
- Fortitude (Constitution + Luck): Resists fire, cold, poison, physical effects
- Reflex (Agility + Luck): Resists area effects, explosions
- Will (Wisdom + Luck): Resists mind control, fear, charm, illusions

### Channel Divinity (Divine Gift Only)

#### Core Ability
Automatic for all Divine Gift characters.
- Action: Channel Divinity [Combat] (2 actions)
- Uses: Once per short rest, or spend 1 Luck point for additional use
- Cost: Minimum 4 Energy Points, can spend more (up to Positive or Negative Potential)
- Range: 30-foot radius centered on you
- No Roll Required: Channeling automatically succeeds for Heal/Harm intents

#### The Six Channel Types

##### 1. Channel Positive - HEAL Intent
- ALL living creatures within range heal 1d8 HP per 4 Energy spent
- Affects: Living creatures (anything that can be healed)
- Does NOT affect: Undead
- Indiscriminate: Heals friends AND enemies

##### 2. Channel Positive - HARM Intent
- ALL undead within range take 1d8 positive damage per 4 Energy spent
- Affects: Undead only
- Does NOT affect: Living creatures
- No save (raw divine power)
- Indiscriminate: Damages ALL undead

##### 3. Channel Positive - TURN Intent
- All undead within range must resist
- Channeler rolls: Wisdom + Positive Mastery (2d8, count successes)
- Each undead rolls: Will save (Wisdom + Luck, count successes)
- Compare successes:
  - Undead gets fewer: Flees for 1 minute, cannot approach within 30 feet
  - Undead equals or exceeds: Resists, no effect
- Indiscriminate: Turns ALL undead

##### 4. Channel Negative - HEAL Intent
- ALL undead within range heal 1d8 HP per 4 Energy spent
- Affects: Undead only
- Does NOT affect: Living creatures
- Indiscriminate: Heals ALL undead

##### 5. Channel Negative - HARM Intent
- ALL living creatures within range take 1d8 necrotic damage per 4 Energy spent
- Affects: Living creatures only (including the channeler!)
- Does NOT affect: Undead
- Reflex save (Agility + Luck): Count successes, reduce damage by 1d8 per success (minimum 0)
- Indiscriminate: Damages caster, allies, AND enemies

##### 6. Channel Negative - COMMAND Intent
- Target one undead within range (not area effect)
- Channeler rolls: Wisdom + Negative Mastery (2d8, count successes)
- Target rolls: Will save (Wisdom + Luck, count successes)
- Compare successes:
  - You get more: Undead obeys commands for 1 minute
  - Tie or target wins: Resists, no effect

#### Key Principle
##### Intent Overrides Energy Type:
- Heal intent: Only heals (never harms)
- Harm intent: Only harms (never heals)
- Special intents: Turn/Command require opposed rolls