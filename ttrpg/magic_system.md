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

### Comparison of Magic Types

| Feature | Magical Aptitude | Divine Gift | Bardic Magic |
|---------|-----------------|-------------|--------------|
| Casting Stat | Intelligence | Wisdom | Charisma |
| # of Energies | 8 | 8 | 5 |
| Primary Energy | Elemental (choice) | Divine or Elemental | Air (fixed) |
| Secondary Energy | Any (choice) | Divine or Elemental | Positive (fixed) |
| Fixed Energies | None | None | Air, Positive, Space, Time |
| Chosen Energy | All 8 | All 8 | 1 (Earth/Fire/Water/Negative) |
| Special Ability | Ritual Casting | Channel Divinity | Inspiring Performance |
| Energy Pool | Full (8 Potentials) | Full (8 Potentials) | Limited (5 Potentials) |
| Focus | Versatile arcane | Divine/nature power | Support, utility, performance |

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
  - Cleric Path: Choose Divine Affinity (Positive or Negative). Chosen affinity = highest roll + 2 (max 8), other divine energy = any other roll + 1
  - Druid Path: Choose Elemental Affinity (Earth, Air, Fire, or Water) = highest roll + 2 (max 8), and choose one divine energy (Positive or Negative) = any other roll + 1

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

**AOE Damage Application:**
When a damage weave affects multiple targets through area effect:
- **Each target in the area takes the full listed damage**
- Damage is NOT divided among targets
- Each target makes their own saving throw (if applicable)
- Total damage dealt = Base Damage × Number of Targets

**Example:** Burning Hands (Fire 3 = 16 damage base, Space 1 = 2 targets)
- First target: 16 fire damage (makes own save)
- Second target: 16 fire damage (makes own save)
- Total damage dealt: 32 damage (if both hit)

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

##### Supporting Energy: Simple Weaves
Simple Weaves use only a single energy type (no supporting energy) and are limited in scope:

**Range Limitations:**
- **No Air or Space for range** = Touch to 5-10 feet maximum
- Simple damage weaves are energy emanations from the caster's body, not shaped projectiles
- Think "channeling fire through your palm" vs "shaping and hurling a fire bolt"

**Other Limitations:**
- **No area effects** (single target only)
- **No duration** (instantaneous effects only)
- **No complex transformations** (supporting energy needed for range/area/duration)

**Simple Weave Benefits:**
- Cost only 1 [Combat] action (vs 2 for Complex Weaves)
- Do NOT provoke opportunity attacks (quick, instinctive magic)
- Lower energy cost (typically 2-3 Energy vs 3-4+ for Complex)
- Can be cast multiple times per round

**Tactical Use:**
- When caught in melee: Use Simple Weaves to avoid opportunity attacks
- When at range: Use Complex Weaves for better damage and range
- Risk/Reward: Simple Weaves require close proximity but don't provoke

**Design Philosophy:**
Simple Weaves represent raw magical energy channeled directly through the caster's body without the time, concentration, and shaping required for Complex Weaves. They are instinctive bursts of power rather than carefully crafted effects.

### Building Spells with the Tables

#### Choosing Simple vs Complex Weaves:

**Simple Weave (1 action):**
- Uses only Primary Energy (no supporting energy)
- Limited to touch or 5-10ft range
- Single target, instantaneous effect
- Does NOT provoke opportunity attacks
- Examples: Fire Burst, Shocking Grasp, Frost Touch

**Complex Weave (2 actions):**
- Uses Primary + Supporting Energy (or multiple energies)
- Can achieve range, area effects, or duration
- DOES provoke opportunity attacks when cast while threatened
- Examples: Fire Bolt, Fireball, Burning Hands

#### Step-by-Step Process:
1.  Choose your Primary effect type (damage, healing, buff, control, etc.)
2.  Decide if you need range/area/duration (if yes → Complex Weave)
3.  Find the appropriate Primary Energy cost from the table
4.  If Complex: Add Supporting Energy for:
    - Range (if not touch): Air/Space 1-3
    - Area (if multiple targets): Space 1-3+
    - Duration (if not instant): Time 1-8
5.  Calculate total Energy cost
6.  Determine action cost: Simple (1 action) or Complex (2 actions)

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

#### Attack Weaves vs Save Weaves

Weaves fall into two categories based on how they interact with targets:

##### Attack Weaves (No Saving Throw)
**Characteristics:**
- Single-target direct effects
- Touch-range direct damage
- Weaving successes alone determine effectiveness
- No opposed roll by target

**Weave Types:**
- Single-target ranged damage (Fire Bolt, Ray of Frost, Shocking Grasp)
- Touch-range damage spells
- Single-target healing (Cure Wounds, Healing Word)
- Single-target buffs that benefit the target

**Success Determination:**
- 0 successes: Miss/fail
- 1 success: Reduced effect (typically half damage or half duration)
- 2 successes: Full effect as listed
- 3 successes: Enhanced effect (+8 damage or extended duration)
- 4 successes: Maximum effect (+16 damage or double duration)

**Example - Fire Bolt:**
Caster rolls Fire Potential + Fire Mastery + Air Potential + Air Mastery (4d8)
- 0 successes: Miss, no damage
- 1 success: 4 damage (half of 8)
- 2 successes: 8 damage (full)
- 3 successes: 16 damage (8 + 8 bonus)
- 4 successes: 24 damage (8 + 16 bonus)

##### Save Weaves (Saving Throw Allowed)
**Characteristics:**
- Area effect damage
- Control/debuff effects
- Transformation effects
- Ongoing effects

**Weave Types:**
- Area damage (Fireball, Lightning Bolt, Burning Hands, Cone of Cold)
- Line effects (Lightning Bolt, Wall of Fire)
- Control spells (Hold Person, Sleep, Slow, Fear)
- Debuffs (Blindness, Curse, Poison)
- Transformation (Polymorph, Petrification)

**Success Determination - Opposed Roll:**
1. **Caster rolls weaving:** Count successes normally from weaving roll
2. **Each target rolls save:** Count successes from appropriate save (Reflex/Fortitude/Will)
3. **Calculate Net Successes:** Net = Caster Successes - Target Successes
4. **Apply effect based on net successes:**
   - Net 0 or less: Target resists/reduces effect significantly
   - Net 1: Reduced effect (typically half damage)
   - Net 2: Full effect as listed
   - Net 3: Enhanced effect
   - Net 4: Maximum effect

**Important:** Even when net successes are 0 or negative, some spells still deal partial damage. Check individual spell descriptions for "minimum effect" rules.

**Example - Fireball:**
Caster rolls 3 successes on weaving (Fire + Space)
- Target A rolls 1 success on Reflex save: Net 2, takes full 28 damage
- Target B rolls 2 successes on Reflex save: Net 1, takes half (14 damage)
- Target C rolls 3 successes on Reflex save: Net 0, takes no damage
- Target D rolls 4 successes on Reflex save: Net -1, takes no damage

#### Which Save Type Applies?

The save type is determined by the effect being resisted:

**Reflex (Agility + Luck) - Dodging/Avoiding:**
- Area damage effects (explosions, fire, lightning, acid)
- Physical hazards (falling objects, crushing walls)
- Sudden environmental changes
- Effects you can physically dodge

**Fortitude (Constitution + Luck) - Enduring/Resisting:**
- Poison and disease
- Physical transformation (petrification, polymorphing)
- Death effects
- Constitution-draining effects
- Cold/heat endurance

**Will (Wisdom + Luck) - Mental Resistance:**
- Mind control and domination
- Fear and morale effects
- Charm and compulsion
- Illusions (to disbelieve)
- Sleep and unconsciousness effects

**When in Doubt:**
- If it's an explosion or area damage → Reflex
- If it changes your body or kills you → Fortitude
- If it affects your mind or emotions → Will

### Damage Resistance (DR) and Magical Damage

Physical armor and natural defenses interact differently with magical damage based on the energy type.

#### Energy Damage - Half DR (Rounded Down)

**Energy-based magical damage types apply half DR:**
- **Fire** (flames, heat, burning)
- **Cold** (frost, ice energy, freezing)
- **Lightning** (electricity, shock)
- **Acid** (corrosive energy)
- **Thunder** (sonic energy, sound waves)
- **Negative** (life-draining, necrotic energy)
- **Positive** (radiant, divine energy)
- **Force** (pure magical energy)
- **Psychic** (mental damage)

**Formula:** Damage - (DR ÷ 2, rounded down)

**Examples:**
- 16 fire damage vs DR 4 → 16 - 2 = **14 damage**
- 8 lightning damage vs DR 3 → 8 - 1 = **7 damage**
- 28 cold damage vs DR 6 → 28 - 3 = **25 damage**
- 8 acid damage vs DR 1 → 8 - 0 = **8 damage** (DR 1 provides no protection)

**Rationale:** Pure energy can partially bypass physical armor but heavy armor still provides some protection through insulation, dispersion, and reduced exposed area.

#### Physical Magic Damage - Full DR

**Physical-based magical effects respect full DR:**
- **Ice Storm** (physical ice chunks and hail)
- **Meteor Swarm** (physical meteors with impact)
- **Conjured Weapons** (summoned blades, magical projectiles)
- **Stone Shape** (crushing stone)
- **Earthquake** (falling debris, collapsing structures)
- **Wall of Stone/Ice** (physical crushing)
- **Thorn Whip** (physical thorns)
- **Any spell creating physical objects that strike/crush**

**Formula:** Damage - DR (normal physical damage reduction)

**Examples:**
- Ice Storm 28 damage vs DR 4 → 28 - 4 = **24 damage**
- Meteor 40 damage vs DR 6 → 40 - 6 = **34 damage**
- Conjured Blade 10 damage vs DR 3 → 10 - 3 = **7 damage**

**Rationale:** These spells create actual physical matter or force that impacts like mundane weapons. Armor protects normally.

#### Quick Reference Table

| Damage Type | DR Application | Example Spell |
|-------------|----------------|---------------|
| Fire | Half DR | Fire Bolt, Fireball, Burning Hands |
| Cold | Half DR | Ray of Frost, Cone of Cold |
| Lightning | Half DR | Lightning Bolt, Shocking Grasp |
| Acid | Half DR | Acid Splash, Acid Arrow |
| Thunder | Half DR | Thunderwave, Shatter |
| Negative | Half DR | Chill Touch, Blight, Vampiric Touch |
| Positive | Half DR | Sacred Flame, Guiding Bolt |
| Force | Half DR | Magic Missile, Eldritch Blast |
| Psychic | Half DR | Mind Blast, Psychic Scream |
| Physical Ice | Full DR | Ice Storm (ice chunks) |
| Physical Stone | Full DR | Meteor Swarm, Conjured weapons |
| Physical Debris | Full DR | Earthquake, Avalanche |

#### Elemental Resistance (Separate from DR)

Some creatures have specific elemental resistances or immunities listed in their stat blocks. These are separate from DR and stack with DR reduction.

**Application Order:**
1. Apply DR reduction (half or full depending on damage type)
2. Apply elemental resistance (subtract listed amount)
3. Apply vulnerability (add listed amount)

**Example:** Red Dragon with DR 5 and Fire Immunity
- Fireball 28 fire damage → Immune, takes 0 damage
- Ice Storm 28 cold damage → 28 - 5 (full DR for physical ice) = 23 damage

**Example:** Frost Giant with DR 4 and Cold Resistance 8
- Cone of Cold 28 damage → 28 - 2 (half DR) - 8 (resistance) = **18 damage**
- Fireball 28 damage → 28 - 2 (half DR) = **26 damage**

#### Special Cases

**Force Damage (Magic Missile, etc.):**
- Applies half DR
- Almost never resisted (very rare to have Force Resistance)
- Considered pure magical energy

**Healing (Positive Energy):**
- DR does not reduce healing
- Negative Energy Resistance does not reduce healing

**Spell Damage Types in Descriptions:**
Each spell description now includes:
- **Damage Type:** [Energy type or Physical]
- **DR Interaction:** [Half DR / Full DR / Ignores DR]

### Condition Application in Weaves

Many weaves can inflict conditions on targets when achieving high success thresholds. The conditions applied depend on the primary energy type used in the weave and the power level of the spell.

#### Success Threshold Framework

**Attack Weaves (No Saving Throw):**
- 0 successes: Miss
- 1 success: Partial effect (typically half damage)
- 2 successes: Full effect
- 3 successes: Enhanced effect + minor condition
- 4 successes: Maximum effect + major condition
- 5+ successes: Overwhelming effect + severe or multiple conditions

**Save Weaves (With Saving Throw):**
- Net 0 or less: Resisted/minimal effect
- Net 1: Reduced effect (typically half damage)
- Net 2: Full effect
- Net 3: Enhanced effect + minor condition
- Net 4: Maximum effect + major condition
- Net 5+: Overwhelming effect + severe or multiple conditions

**Note:** Net successes = Caster's total successes - Target's save successes

#### Condition Selection by Energy Type

Conditions should thematically match the primary energy used in the weave. Reference the conditions document for full condition rules.

##### Fire Energy Conditions
**Minor (3 successes / Net 3):**
- Singed
- Smoldering
- Dazzled

**Major (4 successes / Net 4):**
- Ignited
- Frightened (fire panic)
- Blinded (intense flash)

**Severe (5+ successes / Net 5+):**
- Burning
- Cowering (fire terror)
- Multiple conditions (Ignited + Frightened)

##### Cold/Water Energy Conditions
**Minor (3 successes / Net 3):**
- Chilled
- Numbed
- Difficult terrain (ice)

**Major (4 successes / Net 4):**
- Slowed (major - 2 actions only)
- Frosted
- Prone (slipped on ice)

**Severe (5+ successes / Net 5+):**
- Frozen (Restrained + ongoing damage)
- Paralyzed (extreme cold)
- Multiple conditions (Prone + Frosted)

##### Lightning/Air Energy Conditions
**Minor (3 successes / Net 3):**
- Dazed
- Deafened
- Pushed (forced movement)

**Major (4 successes / Net 4):**
- Stunned
- Prone (knocked down)
- Disoriented

**Severe (5+ successes / Net 5+):**
- Paralyzed (electrical shock)
- Unconscious (extreme shock)
- Multiple conditions (Stunned + Prone)

##### Earth Energy Conditions
**Minor (3 successes / Net 3):**
- Difficult terrain
- Off-balance (penalty to next action)
- Prone (minor)

**Major (4 successes / Net 4):**
- Prone (knocked down)
- Grappled
- Slowed (movement impaired)

**Severe (5+ successes / Net 5+):**
- Restrained (bound by earth/stone)
- Buried (Restrained + Blinded + suffocating)
- Prone + Restrained

##### Positive Energy Conditions
**Minor (3 successes / Net 3):**
- Dazzled (bright light)
- Revealed (invisibility ends)
- Weakened (offensive use)

**Major (4 successes / Net 4):**
- Blinded (intense light)
- Frightened (undead only)
- Turned (undead flee)

**Severe (5+ successes / Net 5+):**
- Destroyed (undead at low HP)
- Banished (extraplanar creatures)
- Multiple conditions

##### Negative Energy Conditions
**Minor (3 successes / Net 3):**
- Weakened
- Sickened
- Chilled (death chill)

**Major (4 successes / Net 4):**
- Poisoned
- Exhausted (Level 1)
- Frightened (fear of death)

**Severe (5+ successes / Net 5+):**
- Dying (if below threshold HP)
- Paralyzed (body wracked with pain)
- Exhausted (Level 2+)

##### Space Energy Conditions
**Minor (3 successes / Net 3):**
- Disoriented
- Pushed (forced movement)
- Off-balance

**Major (4 successes / Net 4):**
- Teleported (moved to different location)
- Prone
- Restrained (force bonds)

**Severe (5+ successes / Net 5+):**
- Banished (sent to another plane)
- Stunned (reality distortion)
- Grappled + Teleported

##### Time Energy Conditions
**Minor (3 successes / Net 3):**
- Slowed (minor - speed/initiative penalty)
- Disoriented (lost sense of timing)

**Major (4 successes / Net 4):**
- Slowed (major - 2 actions only)
- Stunned (frozen in time)
- Aged (Exhaustion gained)

**Severe (5+ successes / Net 5+):**
- Paralyzed (time frozen)
- Slowed (1 action only)
- Temporal displacement

#### Power Level Restrictions

The severity of conditions that can be applied depends on the weave's Energy cost:

**Cantrip Level (1-2 Energy):**
- Maximum at 3 successes: Minor condition only
- Maximum at 4 successes: Major condition (single effect, not most severe)
- No severe conditions available

**Low Level (3-4 Energy):**
- 3 successes: Minor or moderate condition
- 4 successes: Major condition
- 5+ successes: Major + minor, or severe for 1 round only

**Medium Level (5-6 Energy):**
- 3 successes: Major condition
- 4 successes: Severe condition or major + minor
- 5+ successes: Severe + additional effects

**High Level (7-8 Energy):**
- 3 successes: Severe condition possible
- 4 successes: Severe condition + significant effect
- 5+ successes: Multiple conditions or long-duration severe effects

#### Condition Duration Guidelines

Unless specified in the spell description:
- **Minor conditions:** Typically 1 action to 1 round
- **Major conditions:** Typically 1 round to 1 minute, with saves to end
- **Severe conditions:** Typically 1 minute to 10 minutes, with saves to end

**Recovery Saves:**
Most magical conditions allow the target to attempt a save at the end of each of their turns to end the effect. The save type is typically the same as the initial save (Reflex/Fortitude/Will).

#### Examples in Practice

**Fire Bolt (Fire 2, Cantrip):**
- 3 successes: 16 damage + Singed (minor - subtract 1 from next die)
- 4 successes: 24 damage + Ignited (major - 1d8 per turn, action to extinguish)
- 5+ successes: 32 damage + Ignited + Dazzled (multiple conditions)

**Fireball (Fire 5, Medium Level AOE):**
- Net 3: 36 damage + Frightened (major - add 1 to dice while visible)
- Net 4: 44 damage + Ignited (major ongoing damage)
- Net 5+: 52 damage + Burning (severe - 2d8 per turn, hard to extinguish)

**Hold Person (Space 4, Low Level Control):**
- Net 2: Paralyzed for 1 minute (save each turn)
- Net 3: Paralyzed + Misfortune on saves (harder to break)
- Net 4: Paralyzed + affects 2 targets
- Net 5+: Paralyzed for 1 hour + affects 2 targets

**Lightning Bolt (Air 5, Medium Level AOE):**
- Net 3: 36 damage + Dazed (minor - penalties next action)
- Net 4: 44 damage + Stunned (major - no actions for 1 round)
- Net 5+: 52 damage + Stunned + Prone (multiple conditions)

#### GM Guidelines for Condition Application

1. **Check Energy Type:** Conditions must thematically match the primary energy
2. **Check Power Level:** Don't exceed the condition caps for that power level
3. **Check Success Threshold:** Minor at 3, major at 4, severe at 5+
4. **Check Spell Description:** Individual spells may specify different conditions
5. **Be Consistent:** Similar spells should apply similar conditions

When creating custom weaves or adjudicating edge cases, prioritize thematic appropriateness over mechanical optimization. A fire spell should never freeze someone, and a cold spell should never ignite them.

For complete condition descriptions, mechanics, and recovery rules, see the **Conditions** document.

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
- ALL living creatures within range take 1d8 negative damage per 4 Energy spent
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