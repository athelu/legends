# D8 TTRPG - Bestiary Framework & Design Guidelines

## Monster Design Philosophy

Monsters use the same core d8 roll-under mechanics as player characters, but with streamlined presentation and special abilities. Each monster has a **Tier** that indicates appropriate challenge level.

**Design targets (playtest-derived):**
- A standard encounter should resolve in **about 3-4 rounds**. Nobody enjoys a fight that lasts 5+.
- A boss fight can run longer, but should not exceed about 8 rounds.
- A standard encounter should cost a party roughly 30-40% of its total HP.

---

## Tier Rating System

### What a Tier Means
A **Tier N creature is worth one Tier N player character.** Encounters are built by counting creatures (see Encounter Building). Fractional tiers are fractions of a PC.

| Tier | Equivalent | Encounter Value | Notes |
|------|------------|-----------------|-------|
| 1/8 | CR 1/8 | 1/8 of a PC | Vermin, sprites, motes. Only dangerous in numbers |
| 1/4 | CR 1/4 | 1/4 of a PC | Animals, civilians, lesser spawn |
| 1/2 | CR 1/2 | 1/2 of a PC | Trained but unremarkable fighters |
| 1 | CR 1 | 1 Tier 1 PC | Competent fighter |
| 2 | CR 2-4 | 1 Tier 2 PC | |
| 3 | CR 5-7 | 1 Tier 3 PC | |
| 4 | CR 8-10 | 1 Tier 4 PC | |
| 5 | CR 11-15 | 1 Tier 5 PC | |
| 6 | CR 16-20 | 1 Tier 6 PC | |
| 7 | CR 21-25 | 1 Tier 7 PC | |
| 8 | CR 26+ | 1 Tier 8 PC | |

A lone Tier N creature is **not** a challenge for a party of four Tier N PCs. It is one quarter of one. A solo threat must use the Boss template.

---

## Design Baseline: The Reference PC

All benchmarks in this document are calibrated against the way players actually build characters, not against the standard array. Playtesting and simulation showed that the old creature benchmarks assumed a character far weaker than the one at the table.

**Reference PC assumptions:**
- **36 attribute points** (the average of 8d8), not the 32-point standard array.
- The **damage-supporting attribute is 7 or 8**: Agility for melee, Dexterity for ranged, the casting attribute for weaves.
- **Luck is 5 or more.** Creatures cannot spend Luck, but Luck is the second die on every saving throw, so it still matters for them.
- Players spend Luck to reduce dice and focus fire on one target.
- Armor, shields and feats routinely give a Tier 1 PC **DR 4-6**.
- Melee Combat or Ranged Combat is 5 at Tier 1, rising to 8 by Tier 4.
- PC HP is Con × 8 and never grows with tier. PCs become harder to hit, not harder to kill.

| Tier | Attack Attr | Attack Skill | Damage Attr | Con | HP | Typical DR | Weapon Damage |
|------|-------------|--------------|-------------|-----|----|-----------|---------------|
| 1 | 8 | 5 | 4 | 5 | 40 | 4 | 8 |
| 2 | 8 | 6 | 5 | 5 | 40 | 5 | 8 |
| 3 | 8 | 7 | 5 | 6 | 48 | 6 | 10 |
| 4 | 8 | 8 | 6 | 6 | 48 | 7 | 10 |
| 5 | 8 | 8 | 7 | 7 | 56 | 8 | 10 |

### Why Opposed Rolls Make Fights Long
Against an equal defender, an attacker hits about 47% of the time (tie-breakers included), but reaches Margin 2 only about 3% of the time. Margin 3 is effectively unreachable between equals. Whatever damage is attached to Margin 1 is therefore almost all the damage that is ever dealt. This drives every number in this document:
- Damage bonuses must apply on **Margin 1**, not only on higher margins.
- Creature HP must be low enough that a standard fight ends in 3-4 rounds.
- Creature damage is judged against an assumed PC DR of 4-6.

---

## Damage Model

Natural weapons and manufactured weapons deal damage as follows:

| Margin | Damage |
|--------|--------|
| 1 | Weapon damage + damage attribute (Str for melee and natural weapons, Dex for ranged), minus the target's full DR |
| 2 | The same damage, but the target's DR is **halved (round up)** |
| 3+ | The same damage, DR halved (round up), **plus a condition** (prone, disarmed, bleeding, or the attack's listed rider) |

Stat blocks list the damage value once and note the DR effect:

```
- **Margin 1:** 12 damage (8 + 4 Str)
- **Margin 2:** 12 damage, DR halved (round up)
- **Margin 3:** 12 damage, DR halved (round up), plus [condition]
```

A hit always deals at least 1 damage.

### Damage Caps by Tier
Damage must not scale with tier the way HP once did. PC HP is flat, so a hit that is acceptable at Tier 1 is still acceptable at Tier 8.

| Tier | Max Single Hit (Weapon + Attr) | Fail Damage on a Save-Based Effect |
|------|--------------------------------|------------------------------------|
| 1/8 | 6 | 4 |
| 1/4 | 8 | 6 |
| 1/2 | 10 | 8 |
| 1 | 12 | 12 |
| 2 | 14 | 16 |
| 3 | 16 | 20 |
| 4 | 18 | 24 |
| 5 | 20 | 28 |
| 6 | 22 | 32 |
| 7 | 24 | 36 |
| 8 | 26 | 40 |

**Save-based effects** (breath weapons, auras, area blasts) skip the attack roll, so they must be weaker than an attack. A failed save (0 successes) deals the amount above, 1 success deals half, and 2+ successes deal one quarter. Rounds up. Boss creatures may use 1.5× these values.

**Damage over time and auras:** Auras and start-of-turn damage deal no more than one quarter of the failed-save value per trigger.

**Riders:** Extra damage from abilities (Maul, Power Attack, Aggressive Charge and similar) counts toward the single-hit cap unless the ability is limited to once per encounter.

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

## Attribute Guidelines by Tier

### The 36-Point Baseline
**Every creature starts from a pool of 36 attribute points**, the same as a player character who rolled average on 8d8. The old standard array of 32 points is no longer used for creatures.

The 36-point baseline applies to humanoids at every tier and to non-humanoid creatures at Tier 1 and above. **Non-humanoid minions below Tier 1** (vermin, motes, small beasts) use a reduced pool of **28 (Tier 1/8), 30 (Tier 1/4) or 34 (Tier 1/2)**, because 36 points cannot be spent sensibly on a rat (an Int 1 creature does not need Wis 8 and Luck 7). Their weakness still comes mainly from skill ranks, HP and damage.

Higher tiers add points the way PCs earn them through XP:

| Tier | Attribute Pool | Attack Attr (Agil melee / Dex ranged) | Attack Skill | Damage Attr (Str melee / Dex ranged) | Con | Luck |
|------|----------------|---------------------------------------|--------------|--------------------------------------|-----|------|
| 1/8 | 36 | 6 | 1-2 | 2 | 2 | 5 |
| 1/4 | 36 | 6 | 2 | 3 | 3 | 5 |
| 1/2 | 36 | 7 | 3 | 4 | 4 | 5 |
| 1 | 36 | 8 | 4 | 4 | 5 | 5 |
| 2 | 38 | 8 | 5 | 5 | 5 | 5 |
| 3 | 40 | 8 | 6 | 5 | 6 | 5-6 |
| 4 | 43 | 8 | 7 | 6 | 6 | 5-6 |
| 5 | 46 | 8 | 7 | 7 | 7 | 5-6 |
| 6 | 49 | 8 | 8 | 7 | 7 | 6 |
| 7 | 52 | 8 | 8 | 8 | 8 | 6 |
| 8 | 55 | 8 | 8 | 8 | 8 | 6-7 |

These are **Standard role** values (see Role Adjustments). The remaining points go to the secondary attack attribute, Wis, Int, Cha and so on. Beasts that keep Int 1-2 simply have more points left for physical and sensory attributes.

**Luck is at least 5.** Creatures cannot spend Luck, but Luck is the second die on every Fortitude, Reflex and Willpower save. A creature with Luck 2-3 fails saves constantly, which makes every control weave and condition on the PC side far stronger than intended.

**Skill cap above attribute:** Monster skills can exceed their governing attribute by a limited amount:
- **Tier 1/8 to 1:** +1 maximum
- **Tier 2 to 4:** +2 maximum
- **Tier 5 to 8:** +3 maximum

### Role Adjustments
The Attack Attr and Attack Skill columns describe a skirmisher-type creature that fights as a PC does. Creatures that trade accuracy and defense for something else adjust as follows. Because Agility is both attack and defense, a slow brute is also easy to hit; that is part of the trade.

| Role | Attack Attr | Attack Skill | HP Type | Damage Attr | Examples |
|------|-------------|--------------|---------|-------------|----------|
| Skirmisher | Benchmark | Benchmark | Standard (×4) | Benchmark | Wolf, pirate, sprite |
| Brute | −2 to −3 | Benchmark | Tough (×5) | +1 over benchmark | Ogre, golem, giant |
| Artillery | Benchmark (Dex) | Benchmark | Fragile (×3) | Benchmark (Dex) | Archer, caster |
| Tough/Massive | Benchmark | −1 (Tough), −2 (Massive) | ×5 / ×6 | Benchmark | Dragons, titans |
| Minion | −1 | −1 | Fragile (×3) | −1 | Swarms, motes |

Tough and Massive creatures take longer to kill, so they count for more in an encounter (see Encounter Building).

---

## CRITICAL DISTINCTION: Humanoids vs Monsters

### IMPORTANT: Humanoid NPCs Use PC Creation Rules

**Humanoid NPCs (guards, soldiers, bandits, adventurers, etc.) are built using standard PC creation rules, with the following NPC adjustments:**

1. **Use 36 points for attributes.** Put the damage-supporting attribute at the benchmark above (Agility 7-8 for melee fighters, Dexterity 7-8 for archers) and **Luck at 5**. Example arrays:
   - Melee: Str 4 / Con 5 / Agil 8 / Dex 3 / Int 3 / Wis 4 / Cha 4 / Luck 5
   - Ranged: Str 3 / Con 5 / Agil 4 / Dex 8 / Int 3 / Wis 4 / Cha 4 / Luck 5
2. **Follow the PC creation process:** choose a background, spend XP per tier, select feats.
3. **Calculate HP = Constitution × 4** (Standard). Armored soldiers and veterans use ×5 (Tough). **NPCs do not use the PC Con × 8 rule.** PCs have the Dying state and Luck to absorb damage; NPCs die at 0 HP and are built to end fights in 3-4 rounds.
4. **Attack skill follows the tier benchmark above**, which is one rank below a PC of the same tier.
5. **XP budgets for humanoid NPCs:**

**PC skill baseline:** All PC skills begin at rank 2 under the current mechanics. In a humanoid NPC stat block, list only skills at rank 3 or higher; an omitted skill is rank 2 unless the entry explicitly says otherwise. This presentation rule applies to PC-equivalent humanoids only. Non-humanoid creatures use the benchmarks above, including ranks below 2 where appropriate.

| Tier | Class | XP Beyond Background | Max Purchased Feats | Attack (Attr / Skill) | 1+ Success Rate* |
|------|-------|---------------------|---------------------|-----------------------|------------------|
| 1/4 | Civilian | 0 (background only) | 0 | 6 / 2 | 67% |
| 1/2 | Early T1 | 60-80 XP | 1 | 7 / 3 | 81% |
| 1 | Mid-Late T1 | 120-180 XP | 2 | 8 / 4 | 92% |
| 2 | T2 | 240-300 XP | 4 | 8 / 5 | 94% |
| 3 | T3 | 480-540 XP | 6 | 8 / 6 | 95% |
| 4 | T4 | 720-780 XP | 8 | 8 / 7 | 97% |
| 5 | T5 | 960-1020 XP | 10 | 8 / 7 | 97% |
| 6 | T6 | 1200-1260 XP | 12 | 8 / 8 | 98% |
| 7 | T7 | 1440-1500 XP | 14 | 8 / 8 | 98% |
| 8 | T8 | 1680+ XP | 16 | 8 / 8 | 98% |

*Chance of at least one success on the attack roll. Success rate is a poor measure of threat in an opposed system: what matters is the margin against the defender's roll. Use the benchmark columns, not the success rate, to judge a build.

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
- 10% on feats (3 starting + 0-2 purchased)

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

At Tier 3, a character with Agil 5, Melee 5 has reached their ceiling. To grow further requires raising the attribute first, then the skill. Without attribute investment at this tier, a Tier 3 NPC will feel indistinguishable from a Tier 2 NPC.

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

**Judge a build by its margin, not its success rate.** The attack pool of the benchmark table above, set against a PC defense of about Agility 8 + skill 5, is what makes a creature threatening. A 97% chance of "1+ success" means little when the defender is also rolling.

**HP does not scale with tier.** HP stays low and flat; tier shows up as accuracy, defense, DR and abilities, exactly as it does for PCs.

---

## Hit Point Calculation Tables

### HP Formula by Creature Type

**HP = Constitution × HP Multiplier**

HP multipliers are **flat across tiers**. PC HP never grows with tier (Con × 8, 40-64 total), so creature HP must not either. Simulation showed that raising creature HP by only 50% over the benchmark, with offense unchanged, drops the party's win rate from about 98% to about 56% and doubles fight length.

| Type | Multiplier | Tier 1 (Con 5) | Tier 3 (Con 6) | Tier 5 (Con 7) |
|------|------------|----------------|----------------|----------------|
| Fragile | ×3 | 15 | 18 | 21 |
| Standard | ×4 | 20 | 24 | 28 |
| Tough | ×5 | 25 | 30 | 35 |
| Massive | ×6 | 30 | 36 | 42 |
| Boss | ×30 | 150 | 180 | 210 |

Tough and Massive creatures also take a −1 and −2 penalty to attack skill (see Role Adjustments). The Boss multiplier applies only to the Boss template (see Elite/Boss Monster Mechanics).

### Creature Type Categories

**Fragile:** Small beasts, Tiny creatures, low-Con spellcasters, swarms, minions

**Standard:** Most humanoids, medium beasts, constructs (medium toughness), standard undead

**Tough:** Warriors and soldiers in heavy armor, large beasts, armored constructs, tough undead (zombies), most monstrosities

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

#### Fae
**Fae Ancestry:** Fortune on saves vs charm effects.
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

Use the attack skill column of the Attribute Guidelines by Tier table. Against a PC defending with Agility 8 and a combat skill of 5, the attack pool that matters is the margin, not the success rate:

| Tier | Attack Pool (Attr / Skill) | Tough (−1) | Massive (−2) |
|------|----------------------------|------------|--------------|
| 1/8 | 6 / 1-2 | 6 / 1 | 6 / 1 |
| 1/4 | 6 / 2 | 6 / 1-2 | 6 / 1 |
| 1/2 | 7 / 3 | 7 / 2 | 7 / 1 |
| 1 | 8 / 4 | 8 / 3 | 8 / 2 |
| 2 | 8 / 5 | 8 / 4 | 8 / 3 |
| 3 | 8 / 6 | 8 / 5 | 8 / 4 |
| 4 | 8 / 7 | 8 / 6 | 8 / 5 |
| 5 | 8 / 7 | 8 / 6 | 8 / 5 |
| 6-8 | 8 / 8 | 8 / 7 | 8 / 6 |

Brutes subtract 2-3 from the attack attribute. Skills can exceed attributes for monsters to represent specialized combat ability, within the caps in the Attribute Guidelines.

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

**Resilient Defense (X/day):** When the creature fails a saving throw, it can choose to succeed instead. Common amounts: 1/day (Tier 3-4), 2/day (Tier 5-6), 3/day (Tier 7-8).

### Boss Template

A lone creature of the party's tier is worth about one quarter of the party (see Tier Rating System). To run a **solo or boss encounter**, apply the Boss template:

- **HP = Con × 30** (instead of Con × 4). Simulation showed that matching a party's action economy with HP alone needs far more HP and produces fights of 12+ rounds. HP × 30 plus Action Points gives roughly 5-6 rounds and about 35-40% party HP lost against the Reference PC.
- **3 Action Points**, available at every tier (not only Tier 4+), spent at the end of other creatures' turns. Attacks made with Action Points do not take the Multiple Action Penalty.
- **Resilient Defense** at the rates above.
- **Save-based effects** may use 1.5× the failed-save values in the Damage Caps table.
- The base attack benchmarks and damage caps are otherwise unchanged. Do **not** raise single-hit damage to make a boss threatening.

A Boss counts as **4 creatures** for Encounter Building. A boss encounter should still not exceed about 8 rounds; if the party is not threatening the boss by round 4, the boss has too much HP.

---

## Encounter Building

**Count creatures against the party.** Each creature of the party's tier counts as 1. Creatures one tier below count as 1/2, two tiers below as 1/4. Creatures one tier above count as 2, two tiers above as 4. Tough creatures count as 1.25, Massive creatures as 1.5, and Boss creatures as 4.

**Minions (fractional tiers).** Against Tier 1 PCs with DR 4-6, light attackers barely scratch the party, so minions are worth less than their name suggests. Use these values:

| Minion Tier | Value | Creatures per 1 Tier 1 Creature |
|-------------|-------|---------------------------------|
| 1/2 | 1/2 | 2 |
| 1/4 | 1/3 | 3 |
| 1/8 | 1/5 | 5 |

For a party of 4 PCs, simulated results for Tier 1 creatures at benchmark:

| Encounter | Creature Count | Expected Rounds | Party HP Lost |
|-----------|----------------|-----------------|---------------|
| Easy | 3 | 2-3 | 10-20% |
| Standard | 4-5 | 3-4 | 25-40% |
| Hard | 6 | 4-5 | 50-65% |
| Deadly | 7+ | 5+ | 75%+ |

In general: **Standard = party size + 1**, **Hard = party size + 2**, **Deadly = party size + 3**.

Minion crowds are limited by space as much as by the count: 6-8 creatures can surround four PCs; 16 cannot.

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
**Tier:** X
**Size:** [Tiny/Small/Medium/Large/Huge/Gargantuan] — [Creature Type]
**HP:** X (Con Y × Z, [Fragile/Standard/Tough/Massive/Boss])
**DR:** X (source)
**Speed:** X ft, [other movement types]
**Attributes:** Str X / Con X / Agil X / Dex X / Int X / Wis X / Cha X / Luck X
**Skills:** Melee Combat X, [other skills at rank 3+]
**Senses:** [Vision types and ranges]
**Equipment:** [If applicable — note weapon size if non-Medium]
**Initiative Bonus:** +X (Agil X)
**Languages:** [Local (region-dependent), named languages if applicable]

**Attacks:**
- **[Attack Name] [Combat]:** [Melee/Ranged] attack ([Attribute + Skill] vs [target])
  - Reach: X ft
  - Margin 1: X damage [type] (weapon + attribute)
  - Margin 2: X damage [type], DR halved (round up)
  - Margin 3: X damage [type], DR halved (round up), plus [condition]
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
Do not convert 5e HP. Set HP from Constitution × the flat multiplier in the Hit Point Calculation Tables (×3 Fragile, ×4 Standard, ×5 Tough, ×6 Massive, ×30 Boss). 5e hit point totals are far too high for this system.

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
Use d8 weapon damage tables with size modifiers applied, then add the damage attribute on any hit (Margin 1). Do not convert 5e average damage directly: clamp the result to the Max Single Hit and Save-Based Effect values in the Damage Caps table for the creature's tier.

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

### Fight Length and Attrition Targets

Playtest and simulation results against the Reference PC (see Design Baseline):

| Encounter | Rounds | Party HP Lost | Party Win Rate |
|-----------|--------|---------------|----------------|
| Standard (party size + 1 creatures) | 3-4 | 25-40% | 95%+ |
| Hard (party size + 2) | 4-5 | 50-65% | 80-90% |
| Boss (Boss template) | 5-8 | 40-60% | 90%+ |

If a test fight runs more than 5 rounds with a standard encounter, **lower creature HP or raise attack accuracy before raising damage.** Raising damage past the Max Single Hit cap makes creatures lethal at the moment they connect while leaving the fight length unchanged.

### Tuning Levers, In Order
1. **HP multiplier.** Most sensitive lever. A 50% HP increase flips a fair fight into a loss.
2. **Attack skill.** One rank of attack skill changes party HP lost by roughly 5-8 percentage points.
3. **Creature count.** Each extra creature adds roughly 10-20 percentage points of party HP lost in a standard fight.
4. **DR.** PC DR of 4-6 means damage below 6-8 is almost harmless. Check low-damage creatures against it.
5. **Damage.** Last. Stay inside the Damage Caps table.

Remember to account for the size modifier when setting skill ranks. A Large creature attacking Medium PCs has no size modifier. A Medium creature attacking a Large monster subtracts 1 from both attack dice. These modifiers affect the effective combat success rate without changing the listed skill rank.

### Things Playtesting Showed Were Weak Assumptions
- **Creature Luck of 2-3.** Luck is the second die on every save; PCs at Luck 5+ with Luck spending make creatures fail saves far more often than the framework assumed.
- **HP multipliers that grew with tier** while PC HP stayed flat.
- **Damage that grew with tier,** including save-based breath weapons and auras of 40+ against PCs with 40-64 HP.
- **Margin 2 as the damage bonus.** It almost never triggers against comparable defenders.
- **Ignoring DR.** PCs reach DR 4-6 at Tier 1 through armor, shields and feats.

---

## FINAL CHECKLIST FOR CREATURE CREATION

**Non-Humanoid Creatures:**
- [ ] Size category assigned with correct space, reach, and grapple limit
- [ ] Attack difficulty modifiers noted for expected combat scenarios (creature vs likely PC sizes)
- [ ] Natural weapon damage pulled from correct size row and weight category
- [ ] Equipment weapons noted as correct size; grip and damage modifier applied if non-native size
- [ ] Attribute pool totals 36 (plus tier raises), Luck at least 5
- [ ] Attack attribute, attack skill and damage attribute match the tier benchmark and role
- [ ] Skill ranks within the allowed excess over governing attribute
- [ ] HP calculated from Con × flat multiplier (×3 / ×4 / ×5 / ×6, or ×30 Boss)
- [ ] Single-hit damage (weapon + attribute) within the Max Single Hit cap for the tier
- [ ] Save-based and aura damage within the Save-Based Effect cap for the tier
- [ ] Creature type traits listed
- [ ] Resistances, immunities, and vulnerabilities specified
- [ ] Tactics section explains how size and special abilities work together

**Humanoid NPCs:**
- [ ] Used a 36-point attribute pool with the damage attribute at 7-8 and Luck 5
- [ ] Selected appropriate background
- [ ] XP budget calculated: Background + Tier XP
- [ ] Followed tier-appropriate XP spending strategy
- [ ] Selected 3 starting feats + appropriate purchased feats (max 2 per tier)
- [ ] Attack pool matches the tier benchmark
- [ ] HP = Constitution × 4 (×5 for armored veterans)
- [ ] Equipment follows equipment.md, armor.md, weapons.md

**Swarms:**
- [ ] Space listed as 5 × 5 ft
- [ ] Damage resistance (physical halved) noted
- [ ] Full damage and half-damage values both listed
- [ ] Condition immunities listed (Grappled, Restrained, Prone, Bleeding)
- [ ] Constituent creature type specified
- [ ] Secondary effects (disease, poison) noted with trigger conditions
- [ ] Swarm attack resolution uses Reflex save, not opposed melee roll
