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

## Creature Size

Size governs how much space a creature occupies, how far its natural weapons reach, how much damage those weapons deal, and how the creature interacts with grappling, cover, attack difficulty, and movement.

### Size Categories

| Size | Space | Natural Reach | Grapple Limit |
|------|-------|---------------|---------------|
| Tiny | 2.5 × 2.5 ft | 0 ft (must enter target's space) | Up to one size larger (Small) |
| Small | 5 × 5 ft | 5 ft | Up to one size larger (Medium) |
| Medium | 5 × 5 ft | 5 ft | Up to one size larger (Large) |
| Large | 10 × 10 ft | 10 ft | Up to one size larger (Huge) |
| Huge | 15 × 15 ft | 15 ft | Up to one size larger (Gargantuan) |
| Gargantuan | 20 × 20 ft | 20 ft | Any size |

**Natural reach with [Reach] weapons:** Add +5 ft to the creature's natural reach. A Large creature wielding a spear reaches 15 ft, not 10 ft.

### Size and Attack Difficulty

When attacking a creature of a different size, apply the following modifier to both attack dice. The modifier is based on the size difference between attacker and target.

| Target is... | Attack Dice Modifier |
|---|---|
| Two or more sizes larger than attacker | Subtract 1 from both dice |
| One size larger than attacker | No modifier |
| Same size as attacker | No modifier |
| One size smaller than attacker | Add 1 to both dice |
| Two sizes smaller than attacker | Add 2 to both dice |
| Three or more sizes smaller than attacker | Add 3 to both dice |

This modifier applies to melee and ranged attacks. It does not apply to weaves that use saving throws — size doesn't meaningfully help a creature dodge a Fireball.

Tiny creatures present the sharpest challenge. A Medium creature attacking a Tiny creature adds 1 to both attack dice. A Large creature attacking a Tiny creature adds 2. At the lower end, a Medium creature attacking a Gargantuan creature subtracts 1 from both attack dice — the creature is simply hard to miss. The attack landing isn't the problem. What it does in return is.

### Weapon Sizes

All weapons in the equipment tables are Medium by default. A creature wields weapons sized for its own size category. When a creature uses a weapon built for a different size, the grip requirement shifts and a damage modifier applies.

**Grip shift by size difference:** Each size category of difference shifts the grip requirement one step. One step heavier means one-handed becomes two-handed, and two-handed becomes unwieldable. One step lighter means two-handed becomes one-handed, and one-handed becomes effectively light (usable in off-hand).

**Grip steps from lightest to heaviest:**
- Light (one hand, off-hand eligible)
- One-handed (one hand, no off-hand benefit)
- Two-handed (requires both hands)
- Cannot wield

| Weapon Built For | Wielded By | Grip Requirement | Damage Modifier | Attack Dice |
|-----------------|------------|-----------------|-----------------|-------------|
| Medium | Small | One step heavier | −2 (minimum 2) | No change |
| Medium | Medium | As listed | Normal | No change |
| Medium | Large | One step lighter | −2 | No change |
| Large | Small | Cannot wield | — | — |
| Large | Medium | One step heavier | +2 | Add 1 to both dice |
| Large | Large | As listed | Normal | No change |
| Large | Huge | One step lighter | −2 | No change |

The pattern generalizes across all size categories. Each size category of difference shifts grip one step and applies a ±2 damage modifier. Two or more categories of difference in either direction makes the weapon unwieldable, with one exception: a creature using a weapon two or more sizes smaller than itself treats it as a Light weapon with −4 damage (minimum 2), representing using a weapon entirely unsuited to its frame.

**[Versatile] weapons and size:** A [Versatile] weapon used by a creature one size smaller loses the versatile benefit — the grip has already shifted to two-handed, so there is no one-handed option remaining and no additional benefit from gripping it with both hands. Use the size-adjusted damage value at two-handed grip.

**Weapons built for non-Medium sizes** are not listed in the equipment tables. They exist in the world — an ogre's greatclub is a Large two-handed weapon — but players purchasing equipment buy Medium weapons by default. The GM determines availability and cost of other sizes.

### Natural Weapon Damage by Size

Natural weapons fall into three weight categories. The creature's stat block specifies which category applies to each attack.

| Size | Light | Standard | Heavy |
|------|-------|----------|-------|
| Tiny | 2 | 3 | 4 |
| Small | 3 | 4 | 6 |
| Medium | 4 | 6 | 8 |
| Large | 6 | 8 | 10 |
| Huge | 8 | 10 | 12 |
| Gargantuan | 10 | 12 | 14 |

**Light:** Small, fast natural weapons. Rat bite, imp claw, sprite sting.
**Standard:** Primary natural weapons. Wolf bite, bear claw, orc fist.
**Heavy:** The creature's defining weapon. Dragon bite, owlbear beak, giant's slam.

A [Reach] natural weapon adds +5 ft to natural reach but does not change its damage category.

### Size and Grappling

A creature can only initiate a grapple against a target no more than one size category larger than itself. A grappled creature that is smaller than its grappler adds 1 to both escape attempt dice. A grappled creature that is the same size or larger uses normal escape rules.

Grapple, Shove, Trip, and Disarm attempts follow the same one-size-larger limit. A creature cannot Shove a target two or more size categories larger than itself.

### Size and Carrying Capacity

Size categories above Medium scale Strength-based carrying thresholds. Powerful Build grants a creature the next size category's thresholds regardless of actual size.

| Size | Unencumbered | Encumbered | Heavily Encumbered | Max |
|------|-------------|------------|-------------------|-----|
| Tiny | Str × 5 | Str × 7 | Str × 10 | Str × 10 |
| Small | Str × 8 | Str × 12 | Str × 16 | Str × 16 |
| Medium | Str × 10 | Str × 15 | Str × 20 | Str × 20 |
| Large | Str × 15 | Str × 22 | Str × 30 | Str × 30 |
| Huge | Str × 20 | Str × 30 | Str × 40 | Str × 40 |
| Gargantuan | Str × 30 | Str × 45 | Str × 60 | Str × 60 |

### Size and Movement Through Spaces

A creature moves through a space one size smaller than itself at half speed, adding 1 to both attack and skill dice while squeezing. Attacks against a squeezing creature have Fortune. Two or more sizes smaller is impassable.

Moving through an ally's space costs no check but cannot end there. Moving through a hostile creature's space requires Tumble Through regardless of size difference.

### Size and Cover (Creatures as Obstacles)

The comparison is between the intervening creature and the target, not the attacker.

- Intervening creature same size as target: Partial Cover
- Intervening creature one size larger than target: Half Cover
- Intervening creature two or more sizes larger than target: Full Cover

---

## Swarms

A swarm is a mass of Tiny or Small creatures acting as a unified threat — a colony of rats, a cloud of hornets, a carpet of centipedes. The stat block represents the collective, not any individual within it.

### Swarm Properties

**Space:** 5 × 5 ft. A swarm occupies one standard grid square.

**Swarm Body:** A swarm can occupy the same space as another creature and move through any opening large enough for its constituent creatures. A swarm of rats flows under a door. A swarm of hornets surrounds a target entirely.

**Damage Resistance:** Physical damage (Slashing, Piercing, Bludgeoning) is halved against swarms. Individual weapons are simply not efficient against hundreds of small targets. Fire, acid, thunder, and area-effect weaves bypass this resistance entirely.

**Area Vulnerability:** Any weave or effect that covers the swarm's full space deals full damage. No saving throw is required on the damage application, though saves still apply to conditions from those effects.

**Cannot Be Grappled or Restrained:** Grapple, Shove, Trip, and Disarm attempts automatically fail against a swarm. Forced movement effects also fail.

**Reduced Output:** When a swarm drops to half its maximum HP or below, its damage is halved. Individual creatures have been killed or scattered. The stat block lists both damage values.

**Condition Immunities:** Grappled, Restrained, Prone, Bleeding.

**Size and Attack Difficulty with Swarms:** Swarms use the standard size modifier table when attacking. A swarm of Tiny creatures attacking a Large target subtracts 1 from both attack dice — the individual creatures are hard to miss when the target fills that much space. Note that Pack Tactics stacks with this modifier; a swarm of rats attacking a giant with Pack Tactics active is quite accurate, which is correct behavior.

### Swarm Attack Resolution

A swarm attacking a creature in its space does not use a standard opposed melee roll. The target makes a Reflex save opposed by the swarm's attack roll.

- Target loses (margin 0 or less for the target): full swarm damage
- Target wins (margin 1+ for the target): half swarm damage

Swarms cannot make opportunity attacks and do not benefit from flanking.

### Swarm Stat Block Notes

Specify the constituent creature type. Carry over relevant special abilities from the constituent creature — disease transmission, poison delivery, and similar effects — and note whether they trigger on full damage, half damage, or both. The stat block should list damage at full strength and damage at half strength separately. Whether secondary effects like disease transmission persist at half strength is worth specifying in the individual entry rather than leaving it to interpretation.

---

## Attribute Guidelines by Threat Rating

### Attribute Benchmarks

| Threat | Primary Attrs | Secondary Attrs | Dump Attrs | Skill Ranks (combat) | Max Skill > Attr |
|--------|---------------|-----------------|------------|---------------------|------------------|
| 1/8 | 2-3 | 1-2 | 1 | 0-1 | +1 |
| 1/4 | 2-3 | 2 | 1 | 1-2 | +1 |
| 1/2 | 3-4 | 2-3 | 1-2 | 2-3 | +1 |
| 1 | 3-4 | 2-3 | 1-2 | 2-3 | +1 |
| 2 | 4-5 | 3-4 | 1-2 | 3-4 | +2 |
| 3 | 4-6 | 3-5 | 1-3 | 4-5 | +2 |
| 4 | 5-7 | 4-6 | 2-3 | 5-6 | +2 |
| 5 | 6-8 | 5-7 | 2-4 | 6-7 | +3 |
| 6 | 7-8 | 6-8 | 3-5 | 7-8 | +3 |
| 7-8 | 8 | 7-8 | 4-6 | 8 | +3 |

**Note:** Monster skills can exceed their governing attribute by a limited amount:
- **TR 1/8 to 1:** Skills can exceed attribute by +1 maximum
- **TR 2 to 4:** Skills can exceed attribute by +2 maximum
- **TR 5 to 8:** Skills can exceed attribute by +3 maximum

This represents innate talent, specialized training, or supernatural ability.

**Examples:**
- Wolf (TR 1/4, Agi 4): Melee Combat can be 4 or 5 (max +1)
- Orc Warrior (TR 1/2, Agi 3): Melee Combat can be 3 or 4 (max +1)
- Young Dragon (TR 4, Agi 6): Melee Combat can be 6, 7, or 8 (max +2)
- Ancient Dragon (TR 8, Agi 8): Melee Combat can be 8 (already at max, +3 would exceed cap)

### Primary Attributes
- Physical monsters: Str, Con, Agi
- Ranged monsters: Dex, Agi, Wis (perception)
- Spellcasters: Int, Wis, or Cha (depending on type)
- All threatening creatures: Luck 2+ (represents threat level)

---

## CRITICAL DISTINCTION: Humanoids vs Monsters

### IMPORTANT: Humanoid NPCs Use PC Creation Rules

**The attribute benchmarks table applies ONLY to non-humanoid creatures** (beasts, monstrosities, undead, constructs, dragons, etc.).

**Humanoid NPCs (guards, soldiers, bandits, adventurers, etc.) MUST be built using standard PC creation rules:**

1. **Use PC Attribute Array:** 5, 4, 3, 3, 3, 2, 2, 2 (total 24)
2. **Follow PC Creation Process:** Choose background, spend XP per tier, select feats, calculate HP = Constitution × 8
3. **XP Budgets for Humanoid NPCs:**

| Threat | Tier | XP Beyond Background | Max Purchased Feats | Target Success Rate* |
|--------|------|---------------------|---------------------|---------------------|
| 1/4 | Civilian | 0 (background only) | 0 | 55-60% |
| 1/2 | Early T1 | 60-80 XP | 1 | 65-75% |
| 1 | Mid-Late T1 | 120-180 XP | 2 | 80-90% |
| 2 | T2 | 240-300 XP | 4 | 85-90% |
| 3 | T3 | 480-540 XP | 6 | 90-95% |
| 4 | T4 | 720-780 XP | 8 | 95-98% |
| 5 | T5 | 960-1020 XP | 10 | 98-100% |
| 6 | T6 | 1200-1260 XP | 12 | 100% |
| 7 | T7 | 1440-1500 XP | 14 | 100% |
| 8 | T8 | 1680+ XP | 16 | 100% |

*Target success rate for primary action (1+ success on primary attribute + skill roll)

---

## XP SPENDING STRATEGY FOR HUMANOID NPCs

The natural progression of the Legends system creates **three distinct phases** of character development.

### The Three Phases of Progression

#### Phase 1: Journeyman (Tiers 1-2)
**Focus: Skills first, attributes second**

Characters are learning their trades. They maximize efficiency by raising skills to their attribute caps before investing in expensive attribute increases.

**XP Distribution:**
- 70-80% on skills
- 10-20% on attributes (usually just for HP or feat prerequisites)
- 10% on feats (2 starting + 0-2 purchased)

**Typical Progression:**
- **Tier 1/4 (TR 1/4):** Background skills only, no additional advancement
- **Tier 1/2 (TR 1/2):** Background skills + raise primary skill from 1→3 or 2→3
- **Tier 1 (TR 1):** Background skills + raise primary skill to cap (equal to attribute)

---

#### Phase 2: Expert to Master (Tiers 3-5) — INFLECTION POINT
**Focus: Attributes + Skills in tandem**

To continue progressing, characters MUST invest in raising attributes to enable higher skill caps.

**XP Distribution:**
- 40% on attributes (breaking through caps)
- 40% on skills (keeping pace with new attribute values)
- 20% on feats

At Tier 3, a character with Agi 5, Melee 5 has reached their ceiling. To grow further requires raising the attribute first, then the skill. Without attribute investment at this tier, a Tier 3 NPC will feel indistinguishable from a Tier 2 NPC.

---

#### Phase 3: Legendary (Tiers 6-8)
**Focus: Perfection and breadth**

Primary attributes and skills have reached or are approaching 8/8 mastery. Focus shifts to perfecting secondary attributes, spreading expertise, and collecting powerful feat combinations.

**XP Distribution:**
- 30% on attributes (bringing secondaries to 7-8)
- 30% on skills (spreading expertise broadly)
- 40% on feats (building legendary feat trees)

---

## SPELLCASTER XP SPENDING

For magical humanoid NPCs, the same three-phase progression applies. Mastery costs the same as skills (8 × rank — efficient). Potentials cost the same as attributes (16 × rank — expensive). Prioritize Mastery before Potentials, exactly as martials prioritize Skills before Attributes.

An effective caster needs high Mastery in their primary energy, and a strong supporting Mastery that flavors their type of weaving.

### Universal Pattern for Casters

**Tier 1-2:** Primary Element Mastery 3-5, Suporting Mastery 2-4, Time Mastery 1-3

**Tier 3-4:** Primary Element Mastery 5-6, Supporting Mastery 4-5, Time Mastery 3-4, Secondary Element 2-3

**Tier 5-8:** Primary Element Mastery 7-8, Supporting Mastery 6-7, Time Mastery 5-6, multiple secondaries at 4-5

---

## KEY TAKEAWAYS FOR HUMANOID NPC DESIGN

**Respect the three phases.** Tiers 1-2 spend on skills first. Tiers 3-5 split between attributes and skills. Tiers 6-8 spread broad and invest in feats.

**Tier 3 is the inflection point.** Without attribute raises, Tier 3 NPCs feel like Tier 2. Budget 80-150 XP for attributes at this tier.

**Skills cost half what attributes do.** Always max skills before raising attributes except for prerequisites or caps.

**For casters: Mastery before Potentials.** Same principle. Mastery is rolled every weave. Potentials mainly affect the Energy pool.

**Success rate progression should feel smooth:**

| Tier | Target Success (1+) | Feel |
|------|---------------------|------|
| 1 | 65-85% | Competent but unreliable |
| 2 | 85-90% | Professional |
| 3 | 90-95% | Heroic (clear jump from Tier 2) |
| 4 | 95-98% | Champion |
| 5-8 | 98-100% | Mastery |

**Don't forget HP scaling.** Con raises matter for survivability at higher tiers.

---

## Hit Point Calculation Tables

### HP Formula by Creature Type

**HP = Constitution × HP Multiplier**

| Threat Rating | Fragile (×) | Standard (×) | Tough (×) | Massive (×) |
|--------------|-------------|--------------|-----------|-------------|
| 1/8 | 5 | 7 | 7 | 11 |
| 1/4 | 6 | 8 | 8 | 12 |
| 1/2 | 7 | 9 | 9 | 13 |
| 1 | 8 | 10 | 10 | 14 |
| 2 | 10 | 13 | 14 | 19 |
| 3 | 12 | 16 | 18 | 24 |
| 4 | 15 | 20 | 23 | 30 |
| 5 | 18 | 24 | 28 | 36 |
| 6 | 22 | 30 | 36 | 46 |
| 7 | 26 | 36 | 44 | 56 |
| 8 | 30 | 42 | 52 | 66 |

### Creature Type Categories

**Fragile:** Small beasts, Tiny creatures, low-Con spellcasters, swarms

**Standard:** Most humanoids, medium beasts, constructs (medium toughness), standard undead

**Tough:** Warriors and soldiers, large beasts, armored constructs, tough undead (zombies), most monstrosities

**Massive:** Giants, dragons, Huge+ creatures, siege monsters, legendary creatures

---

## Creature Type Keywords

### Creature Type Traits

#### Beast
Natural animal (not magical). Normal intelligence (Int 1-2). No special immunities.

#### Monstrosity
Magical or unnatural creature. May have unusual anatomy. No standard immunities.

#### Undead
**Undead Immunities:** Immune to poison damage, Poisoned condition, disease, exhaustion.
**Mindless (if applicable):** Immune to mind-affecting effects (Beguiling Weave, fear, Sleep), fear, psychic effects.
**Does not need:** Air, food, drink, sleep.
**Negative Healing (optional):** Healed by negative energy, harmed by positive.

#### Construct
**Construct Immunities:** Immune to poison, Poisoned, disease, exhaustion, Paralyzed, Petrified.
**Mindless (if applicable):** Immune to mind-affecting effects, fear, psychic effects.
**Does not need:** Air, food, drink, sleep.

#### Aberration
Alien biology. Often has alien mind (Fortune vs mental effects or vulnerability, varies). Unusual anatomy.

#### Drake
**Drake Senses:** Darkvision 120 ft, Blindsight 30-60 ft (varies by age).
**Frightful Presence:** Can impose fear conditions.
**Energy Affinity:** Resistance or immunity to one energy type.

#### Elemental
**Elemental Body:** Immune to poison, Poisoned, disease, exhaustion, Paralyzed, Petrified, Unconscious.
**Elemental Immunity:** Immune to associated element (fire elemental = immune to fire).
**Does not need:** Air, food, drink, sleep.

#### Fiend (Demon/Devil)
**Fiend Resistances:** Often resistant to cold, fire, lightning.
**Magic Resistance:** Subtract 1 from both dice on saves vs magical effects.
**Devil's Sight (Devils):** See through magical darkness.

#### Celestial
**Celestial Resistances:** Often resistant to positive, negative energy.
**Magic Resistance:** Subtract 1 from both dice on saves vs magical effects.

#### Fey
**Fey Ancestry:** Fortune on saves vs charm effects.
**Magic Affinity:** Often can innately weave.
**Iron Weakness (optional):** Takes extra damage from cold iron.

#### Giant
Large size or bigger. **Powerful Build:** Count as one size larger for carrying, pushing, dragging.

#### Humanoid
Standard mortal creature. No special immunities. Uses equipment normally.

#### Nephilim
Daemons from the elemental planes that manifest on the prime material as giant humanoids. Their physical form is the elemental energy of their home plane made flesh — a Fire Nephilim bleeds magma, an Earth Nephilim sheds gravel when struck. They are a subtype of Giant and carry all Giant traits unless noted otherwise.

- **Size:** Large minimum. Many are Huge.
- **Powerful Build:** Counts as one size category larger for carrying, pushing, dragging, and lifting.
- **Elemental Affinity:** Each Nephilim is associated with one of the four classical elements. They are immune to damage from their associated element and have Resistance (+2 DR) against one additional damage type appropriate to their element (see individual entries).
- **Elemental Aura:** Most Nephilim passively express their element in a 5-foot radius. The specific effect varies by entry.
- **Creature Type:** Nephilim entries use the tag **Nephilim (Giant)** to indicate both their functional category and their daemon origin.
- **Does not need:** Air, food, drink, or sleep in the conventional sense. Nephilim sustain themselves on elemental energy from their home plane.

**Damage type associations by element:**

| Element | Immunity | Resistance (+2 DR) |
|---------|----------|--------------------|
| Fire | Fire | Lightning |
| Air | Lightning | Cold |
| Earth | Piercing (non-magical) | Bludgeoning (non-magical) |
| Water | Cold | Fire |

#### Shadow
Creatures native to the Shadow Plane — the dark reflection of the prime material where light is dim, color is absent, and life energy is sparse. Shadow creatures are not undead. They are living things shaped by a lightless environment where competition for vital energy is constant.

- **Darkvision:** Minimum 120 ft. Shadow creatures above TR 1/2 can see through magical darkness as if it were dim light (Devil's Sight).
- **Shadow Meld (Passive):** In dim light or darkness, Shadow creatures have Fortune on Stealth checks, and attacks against them add 1 to both dice.
- **Sunlight Sensitivity:** Most Shadow creatures (noted in individual entries) add 1 to both attack dice and skill check dice while in bright light. Creatures without this notation have adapted to cross between planes without penalty.
- **Positive Vulnerability:** Shadow creatures take full damage from Positive energy — no DR reduction applies. This is the one universal weakness across the entire creature type.
- **Cold Resistance:** Shadow creatures have Resistance to cold damage (+2 DR). The Shadow Plane is profoundly cold.
- **Does not need:** Air, food, drink, or sleep as mortals understand these.

**Shadow Subtype Note:** Some Shadow creatures are the corrupted remnants of things that were once mortal or elemental — these may carry secondary tags (Shadow/Fae, Shadow/Elemental) indicating their origin. Pure Shadow creatures carry no secondary tag.

#### Ooze
**Ooze Immunities:** Immune to Blinded, Deafened, Exhaustion, Frightened, Prone.
**Mindless:** Immune to mind-affecting effects, fear, psychic effects.
**Amorphous:** Can squeeze through tiny spaces.
**Corrosive (many):** Deals acid damage, dissolves equipment.

#### Plant
**Plant Immunities:** Often immune to Blinded, Deafened, Exhaustion.
**Vulnerability to Fire (many):** Takes extra fire damage.
**False Appearance (many):** Appears to be normal vegetation.

#### Swarm
**Swarm Body:** Can occupy other creatures' spaces. Moves through openings large enough for constituent creatures.
**Swarm Resistance:** Halved damage from Slashing, Piercing, Bludgeoning. Full damage from fire, acid, thunder, and area-effect weaves.
**Area Vulnerability:** Area effects covering the swarm's space deal full damage without a damage save.
**Cannot be Grappled, Restrained, Tripped, or Disarmed.**
**Reduced Damage (half HP):** Damage output halved when below half HP.
**Condition Immunities:** Grappled, Restrained, Prone, Bleeding.
**Size:** Always 5 × 5 ft regardless of constituent creature size.

---

## Vision Types

### Standard Vision Types

#### Normal Vision
Sees in normal light. Cannot see in darkness. Standard for most humanoids.

#### Low-Light Vision
Treats dim light as bright light. Cannot see in complete darkness. Common: elves, some beasts.

#### Darkvision (specify range)
Sees in darkness as if dim light (black and white only). Sees in dim light as if bright light. Most common ranges: 60 ft, 90 ft, 120 ft.

#### Superior Darkvision (specify range)
As Darkvision but sees in darkness as if bright light (in color). Range typically 120 ft.

#### Blindsight (specify range)
Perceives surroundings without relying on sight. Not affected by Blinded condition, invisibility, or darkness. Does not work around corners or through solid barriers. Any target detected using only Blindsight gains the Concealed condition to the detecting creature. Common ranges: 10 ft, 30 ft, 60 ft.

#### Tremorsense (specify range)
Detects vibrations through surfaces. Only works against creatures touching the ground. Any target detected using only Tremorsense gains the Concealed condition.

#### Perfect Sight (specify range)
Ignores the Hidden condition of targets. Sees through magical darkness and illusory effects within range.

#### Seam Sense (specify range)
Perceives thin points in the planar fabric — locations where the boundary between the prime material and adjacent planes is weaker than usual. A creature with Seam Sense automatically knows where these planar seams are within the specified range. This sense does not detect creatures or objects and has no effect on normal combat targeting. It is primarily relevant for planar navigation, identifying summoning locations, and locating weaknesses in dimensional barriers. Seam Sense is native to Aberrations that exist partly between planes.

---

## Equipment & Gear

### Monsters with Equipment

When a monster wields manufactured weapons or wears armor, apply weapon size rules from the Creature Size section. A Large creature using a Medium weapon uses a weapon one size smaller than itself — apply the appropriate grip shift and damage modifier.

Weapons: Use standard weapon damage tables, apply size modifiers, gain weapon properties (reach, versatile, etc.). Can be disarmed.

Armor: Provides DR as normal. May affect stealth.

Shields: Grant Shield Block reaction. Standard shield reactions apply.

List equipped items separately in the stat block. Total DR from armor and shield appears in the main DR stat.

---

## Monster Combat Skills

### Mandatory Combat Skill Listings

All monsters must list Melee Combat rank (if they make melee attacks) and Ranged Combat rank (if they make ranged attacks).

### Skill Rank Guidelines

| Threat | Skill Rank (combat) | With Attribute 4 | Success Rate (1+) |
|--------|---------------------|------------------|-------------------|
| 1/8-1/4 | 1-2 | 4/2 | 44-53% |
| 1/2-1 | 2-3 | 4/3 | 53-66% |
| 2 | 3-4 | 5/4 | 66-78% |
| 3 | 4-5 | 5/5 | 78-86% |
| 4 | 5-6 | 6/6 | 86-94% |
| 5+ | 6-8 | 7/7-8/8 | 94-100% |

Skills can exceed attributes for monsters to represent specialized combat ability.

---

## Multiattack Ability

### Multiattack Rules for Monsters

**Multiattack [Combat]**
- **Cost:** 1 [Combat] action
- **Effect:** Make multiple specified attacks as part of a single action
- **Shared Attribute Roll:** Roll the governing attribute once, apply to all attacks. Roll skill die separately for each attack.
- **No Multiple Action Penalty** between the attacks within the Multiattack — it counts as ONE [Combat] action
- **Frequency:** Once per turn. Cannot be combined with additional [Combat] actions to make more Multiattacks.
- **Movement:** Can move before or after Multiattack, but not between individual attacks within the Multiattack.

### Multiattack and Additional Actions

If a monster uses Multiattack as its first [Combat] action, subsequent [Combat] actions apply the standard Multiple Action Penalty.

---

## Special Abilities & Powers

### Recharge Mechanics (Using d8)

Some abilities recharge during combat by rolling 1d8 at the start of the creature's turn.

**Recharge 7-8:** Recharges on 7 or 8. Very powerful abilities (ancient dragon breath).
**Recharge 6-8:** Recharges on 6, 7, or 8. Powerful abilities (adult dragon breath).
**Recharge 5-8:** Recharges on 5, 6, 7, or 8. Moderate abilities (young dragon breath).

Limited Uses: "3/day" resets after long rest. "1/day" resets after long rest. "Recharge after short rest" returns after 10 minutes.

### Regeneration

**Format:**
```
Regeneration X: Regains X HP at start of its turn if it has at least 1 HP.
  - Suppressed by: [damage type(s)]
```

### Damage Resistances & Vulnerabilities

**Resistance Tiers:**
- **Resistance:** +2 DR vs specified type
- **Greater Resistance:** +4 DR vs specified type
- **Legendary Resistance:** +8 DR vs specified type
- **Immunity:** No damage from source, cannot be affected
- **Vulnerability:** +50% damage from type (rounded up)
- **Weakness:** DR halved (rounded down) vs type

---

## Action Economy & Reactions

Monsters use the same 3 actions per turn as PCs and are subject to the same Multiple Action Penalty for multiple [Combat] actions. All monsters can potentially use Opportunity Attack when an enemy leaves their melee reach, and Shield Block if wielding a shield.

---

## Elite/Boss Monster Mechanics

### Action Points (replaces Legendary Actions)

Some powerful monsters (typically Threat 4+) have **Action Points** representing their superior combat prowess.

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

### Resilient Defense (replaces Legendary Resistance)

**Resilient Defense (X/day):** When the creature fails a saving throw, it can choose to succeed instead. Common amounts: 1/day (Threat 3-4), 2/day (Threat 5-6), 3/day (Threat 7-8).

---

---

## Daemon Categories and Creature Types

The Summoner trait organizes summoned beings into daemon categories (Elementals, Fae, Nephilim, Outsiders, Shadow creatures, Aberrations). These categories describe the being's plane of origin and the Primary Resonance energy used to call them. They do not map one-to-one to creature type keywords.

| Summoner Daemon Category | Creature Type Keyword(s) |
|---|---|
| Elementals | Elemental |
| Fae | Fey |
| Nephilim | Nephilim (Giant) |
| Outsiders — Celestial | Celestial |
| Outsiders — Fiend | Fiend |
| Shadow creatures | Shadow |
| Aberrations | Aberration |

Creature type keywords govern immunities, trait interactions, and mechanical behavior. Daemon categories govern what a Summoner can call and what Primary Resonance energy they need. Stat blocks for summoned daemons carry both tags in the creature type line for clarity.

### Standardized Creature Type Trait Blocks

Use these as a starting point when writing new entries. Copy the appropriate block and edit only what the individual creature modifies.

**Elemental (standard):**
Immune to poison damage, Poisoned condition, disease, exhaustion, Paralyzed, Petrified, Unconscious. Immune to [associated element] damage. Does not need air, food, drink, or sleep.

**Fey (standard):**
Fortune on saving throws against charm effects. Does not need air, food, drink, or sleep in the conventional sense. Individual entries note additional traits.

**Nephilim/Giant (standard):**
Occupies [size] space. Powerful Build: counts as one size larger for carrying, pushing, dragging, lifting. Immune to [associated element] damage. Resistance to [secondary element] (+2 DR). Does not need air, food, drink, or sleep.

**Celestial (standard):**
Immune to poison damage, Poisoned condition, disease, fear. Fortune on saving throws against magic. Does not need air, food, drink, or sleep.

**Fiend (standard):**
Immune to poison damage, Poisoned condition. Resistance to fire, cold, lightning damage (+2 DR each). Fortune on saving throws against magic. Does not need air, food, drink, or sleep.

**Shadow (standard):**
Darkvision 120 ft. Shadow Meld (passive). Positive energy vulnerability (full damage, no DR reduction). Cold Resistance (+2 DR). Sunlight Sensitivity if noted. Does not need air, food, drink, or sleep.

**Aberration (standard):**
Immune to mind-affecting effects (charm, fear, sleep) in most cases — note exceptions. Fortune on saving throws against magic. Does not need air, food, drink, or sleep.

---

## Sample Stat Block Template

```
### [Monster Name]
**Threat Rating:** X
**Size:** [Tiny/Small/Medium/Large/Huge/Gargantuan] — [Creature Type]
**HP:** X (Con Y × Multiplier Z [Fragile/Standard/Tough/Massive])
**DR:** X (source)
**Speed:** X ft, [other movement types]
**Attributes:** Str X / Con X / Agi X / Dex X / Int X / Wis X / Cha X / Luck X
**Skills:** Melee Combat X, [other skills]
**Senses:** [Vision types and ranges]
**Equipment:** [If applicable — note weapon size if non-Medium]
**Initiative Bonus:** +X (Agi X)
**Languages:** [If applicable]

**Attacks:**
- **[Attack Name] [Combat]:** [Melee/Ranged] attack ([Attribute + Skill] vs [target])
  - Reach: X ft
  - Margin 1: X damage [type]
  - Margin 2: X damage + X ([attribute] mod) [type]
  - [Special effects if any]

**Multiattack (if applicable):**
- Specify attacks included
- Shared Attribute Roll: roll [Attribute] once, apply to all attacks

**Special Abilities:**
- **[Ability Name] ([Recharge/Limited]):** Description and mechanical effect

**Creature Type Traits:**
- [List applicable keyword traits from the Creature Type Keywords section]

**Resistances/Immunities:**
- [List with mechanical effects]

**Action Points (if applicable):**
- [List available actions and costs]

**Resilient Defense (if applicable):**
- X/day

**Tactics:** [How the creature fights, how it uses its abilities, when it retreats or escalates]
```

---

## D&D 5e Conversion Guidelines

### Conversion Process

#### 1. Attributes (5e → d8)

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

#### 2. Attack Bonus → Attribute + Skill

**Method 1 — Break Down the Math:**
1. Convert 5e ability score to d8 attribute
2. Subtract the 5e ability modifier from the attack bonus to isolate the proficiency bonus
3. Convert proficiency bonus to skill rank:

| 5e Proficiency | D8 Skill Rank |
|----------------|---------------|
| +2 | 2-3 |
| +3 | 3-4 |
| +4 | 5-6 |
| +5 | 6-7 |
| +6 | 7-8 |

**Method 2 — Quick Rule of Thumb:** Convert attribute, then divide the 5e attack bonus by 2 (round as needed) for approximate skill rank. Adjust up for primary skills, down for secondary.

#### 3. HP (5e → d8)
Take 5e HP and reduce by 30-40%, then round to match the HP multiplier table.

#### 4. AC → DR

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

#### 5. Damage (5e → d8)
Use d8 weapon damage tables with size modifiers applied. Convert average damage to the closest d8 equivalent. Strength or Dexterity modifiers to damage translate to the Margin 2 bonus.

#### 6. Save DCs (5e → d8)

| 5e DC | D8 Requirement |
|-------|----------------|
| 10-12 | 1 success |
| 13-15 | 1 success (with minor penalty) or 2 successes |
| 16-18 | 2 successes |
| 19-21 | 2 successes (with penalty: add 1 to both dice) |
| 22+ | 2 successes (add 2 to both dice) |

#### 7. Special Abilities
- 5e Advantage/Disadvantage → Fortune/Misfortune
- 5e Proficiency bonus → approximate d8 skill rank (roughly half)
- 5e Multiattack → d8 Multiattack with Shared Attribute Roll
- 5e Legendary Actions → d8 Action Points
- 5e Legendary Resistance → d8 Resilient Defense

#### 8. Size Conversion
5e size categories map directly to d8 size categories. Apply all size rules from the Creature Size section: attack difficulty modifiers, natural weapon damage by size, weapon size adjustments, grapple limits, and carrying capacity.

---

## Balancing & Playtesting

### Success Rate Targets

| Threat | vs Same-Tier PC Defense | Target Success Rate (1+) |
|--------|-------------------------|-------------------------|
| 1/8-1/4 | ~40% | At least 1 hit per 3 attacks |
| 1/2-1 | ~50% | At least 1 hit per 2 attacks |
| 2-3 | ~60% | At least 2 hits per 3 attacks |
| 4-5 | ~70% | At least 7 hits per 10 attacks |
| 6+ | ~80% | At least 4 hits per 5 attacks |

Remember to account for the size modifier when setting skill ranks. A Large creature attacking Medium PCs has no size modifier. A Medium creature attacking a Large monster subtracts 1 from both attack dice. These modifiers affect the effective combat success rate without changing the listed skill rank.

### Damage Output Benchmarks

| Threat | Avg Damage per Hit | % of PC HP (Tier-appropriate) |
|--------|-------------------|------------------------------|
| 1/8 | 4-6 | 15-25% |
| 1/4-1/2 | 6-10 | 20-30% |
| 1-2 | 10-16 | 25-40% |
| 3-4 | 16-24 | 30-50% |
| 5+ | 24-40+ | 40-60% |

Elite/Boss Monsters can exceed these benchmarks by 50-100% due to lower numbers on the field.

---

## FINAL CHECKLIST FOR CREATURE CREATION

**Non-Humanoid Creatures:**
- [ ] Size category assigned with correct space, reach, and grapple limit
- [ ] Attack difficulty modifiers noted for expected combat scenarios (creature vs likely PC sizes)
- [ ] Natural weapon damage pulled from correct size row and weight category
- [ ] Equipment weapons noted as correct size; grip and damage modifier applied if non-native size
- [ ] Attribute benchmarks match Threat Rating
- [ ] Skill ranks within the allowed excess over governing attribute
- [ ] HP calculated from Con × appropriate multiplier
- [ ] Creature type traits listed
- [ ] Resistances, immunities, and vulnerabilities specified
- [ ] Tactics section explains how size and special abilities work together

**Humanoid NPCs:**
- [ ] Used standard PC attribute array (5, 4, 3, 3, 3, 2, 2, 2)
- [ ] Selected appropriate background
- [ ] XP budget calculated: Background + Tier XP
- [ ] Followed tier-appropriate XP spending strategy
- [ ] Selected 2 starting feats + appropriate purchased feats (max 2 per tier)
- [ ] Success rate matches tier expectations
- [ ] HP = Constitution × 8
- [ ] Equipment follows equipment.md, armor.md, weapons.md

**Swarms:**
- [ ] Space listed as 5 × 5 ft
- [ ] Damage resistance (physical halved) noted
- [ ] Full damage and half-damage values both listed
- [ ] Condition immunities listed (Grappled, Restrained, Prone, Bleeding)
- [ ] Constituent creature type specified
- [ ] Secondary effects (disease, poison) noted with trigger conditions
- [ ] Swarm attack resolution uses Reflex save, not opposed melee roll
