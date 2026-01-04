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

---

### IMPORTANT: Humanoid NPCs Use PC Creation Rules

**The attribute benchmarks table applies ONLY to non-humanoid creatures** (beasts, monstrosities, undead, constructs, dragons, etc.).

**Humanoid NPCs (guards, soldiers, bandits, adventurers, etc.) MUST be built using standard PC creation rules:**

1. **Use PC Attribute Array:** 5, 4, 3, 3, 3, 2, 2, 2 (total 24)
   - Assign these values based on the NPC's role
   - Example: Guard might use Str 5, Con 4, Agi 3, Wis 3, Dex 3, Luck 2, Cha 2, Int 2

2. **Follow PC Creation Process:**
   - Choose appropriate background (Guard, Soldier, Criminal, etc.)
   - Background provides skill ranks and bonus XP
   - Spend XP according to threat rating tier
   - Select 2 starting feats + purchased feats per tier limits
   - Calculate HP = Constitution × 8

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

The natural progression of the Legends system creates **three distinct phases** of character development. Following this rhythm creates properly scaled NPCs that match their tier expectations.

### The Three Phases of Progression

#### Phase 1: Journeyman (Tiers 1-2)
**Focus: Skills first, attributes second**

**Philosophy:** Characters are learning their trades. They maximize efficiency by raising skills to their attribute caps before investing in expensive attribute increases.

**XP Distribution:**
- 70-80% on skills
- 10-20% on attributes (usually just for HP or feat prerequisites)
- 10% on feats (2 starting + 0-2 purchased)

**Typical Progression:**
- **Tier 1/2 (TR 1/4):** Background skills only, no additional advancement
- **Tier 1/2 (TR 1/2):** Background skills + raise primary skill from 1→3 or 2→3
- **Tier 1 (TR 1):** Background skills + raise primary skill to cap (equal to attribute)

**Example - Town Guard (TR 1):**
- Attributes: Str 5, Con 4, Agi 3 (from initial array)
- Skills: Melee Combat 3 (capped by Agi 3), Perception 3, Society 2
- XP: 104 skill XP, 40 feat XP = 144 of 150-180 available
- Success rate: ~68% (appropriate for tier)

**Why this works:**
- Skills cost 8 × rank (cheap)
- Attributes cost 16 × rank (expensive)
- Skills max at attribute value (no benefit from higher skills until attribute rises)
- Creates competent but still growing combatants

---

#### Phase 2: Expert to Master (Tiers 3-5) ⚠️ **INFLECTION POINT**
**Focus: Attributes + Skills in tandem**

**Philosophy:** This is where the **critical transition** occurs. To continue progressing, characters MUST invest in raising attributes to enable higher skill caps. The skill-only strategy hits a wall.

**XP Distribution:**
- 40% on attributes (breaking through caps)
- 40% on skills (keeping pace with new attribute values)
- 20% on feats

**The Mathematical Reality:**
At Tier 3, a character with Agi 5, Melee 5 has reached their ceiling. To grow further requires:
- Agi 5→6 = 80 XP (opens Melee 6 possibility)
- Melee 5→6 = 40 XP
- **Total: 120 XP investment** to gain 1 rank in combat effectiveness

This is expensive but **necessary** - without it, Tier 3 characters are indistinguishable from Tier 2.

**Typical Progression:**
- **Tier 3 (TR 3):** Raise 1-2 primary attributes by 1 rank, raise skills to match
- **Tier 4 (TR 4):** Continue raising attributes, push skills to 6-7
- **Tier 5 (TR 5):** Achieve mastery (8/8) in primary attribute + skill

**Example - Knight-Captain (TR 3):**
- Attributes: Str 5, Con 6 (raised from 5), Agi 5 (raised from 4), other 3s and 2s
- Skills: Melee Combat 5, Athletics 4, Intimidate 4, Perception 3
- XP: 128 attribute XP, 232 skill XP, 160 feat XP = 520 of 480-540 available
- Success rate: ~87% (appropriate jump from Tier 2's 81%)

**Example - Master-at-Arms (TR 4):**
- Attributes: Str 5, Con 6, Agi 5, Wis 4, other 3s and 2s
- Skills: Melee Combat 6 (capped by Agi 5... wait for Agi 6), Athletics 5, Perception 5
- XP: 144 attribute XP, 292 skill XP, 240 feat XP = 676 of 720-780 available
- Success rate: ~90% (can improve further by raising Agi to 6)

**Why this works:**
- Breaks through the Tier 2 plateau (87% vs 81%)
- Creates clear power progression
- Attributes enable skill growth (skills can't exceed attributes)
- Matches D&D 6-8 power level expectations

---

#### Phase 3: Legendary (Tiers 6-8)
**Focus: Perfection and breadth**

**Philosophy:** Primary attributes and skills have reached or are approaching 8/8 mastery. Focus shifts to perfecting secondary attributes, spreading expertise, and collecting powerful feat combinations.

**XP Distribution:**
- 30% on attributes (bringing secondaries to 7-8)
- 30% on skills (spreading expertise broadly)
- 40% on feats (building legendary feat trees)

**Typical Progression:**
- **Tier 6 (TR 6):** Primary at 8/8, secondary attributes at 6-7
- **Tier 7 (TR 7):** Multiple attributes at 7-8, many skills at 6+
- **Tier 8 (TR 8):** Multiple attributes at 8, multiple skills at 8, 18 total feats

**Example - Legendary Weapon Master (TR 8):**
- Attributes: Str 8, Con 8, Agi 8, Wis 6, Dex 5, others 3-4
- Skills: Melee Combat 8, Ranged Combat 6, Athletics 8, Perception 6, Intimidate 6, Acrobatics 6
- Success rate: 100% on primary actions (mastery achieved)

**Why this works:**
- Character has achieved mastery in their specialty
- Spreading to secondaries creates well-rounded legendary figures
- Multiple 8s represent decades/centuries of training
- Feat collection creates unique legendary abilities

---

## TIER-BY-TIER XP SPENDING EXAMPLES

### TR 1/4 - Civilian/Untrained (Tier 1, ~0 XP)
**Attributes:** 5, 4, 3, 3, 3, 2, 2, 2 (initial array)
**Background:** Farmer, Guard, Laborer, etc.
**XP Spending:** Background skills only
**Feats:** 0-2 starting (many don't invest in combat training)

**Example:**
- Background: Farmer (Wilderness 2, Might 2, Athletics 1, Craft 1)
- Additional XP: 0
- Feats: None
- Result: Competent at farming, weak in combat

---

### TR 1/2 - Early Professional (Tier 1, ~70 XP)
**XP Priority:** Skills first
**Strategy:** Raise 1-2 primary skills from background ranks to 3

**Example - Bandit:**
- Background: Criminal (Stealth 2, Thievery 2, Deception 2, Intimidate 2, +24 XP)
- Additional XP: 70 XP
  - Ranged Combat 0→3 = 28 XP
  - Melee Combat 0→2 = 12 XP
  - Reserve: 30 XP
- Feats: Precise Shot, Swift Movement (2 starting)
- Result: Agi 4, Ranged 3 = ~78% success on archery

---

### TR 1 - Experienced Professional (Tier 1, ~150 XP)
**XP Priority:** Skills to caps, maybe 1 attribute for prerequisites
**Strategy:** Max out primary skill to attribute cap

**Example - Guard Captain:**
- Background: Soldier (Melee Combat 3, Athletics 1, Intimidate 1, +36 XP)
- Additional XP: 150 XP
  - Melee Combat 3→4 = 24 XP
  - Athletics 1→3 = 20 XP
  - Intimidate 1→3 = 20 XP
  - Perception 0→3 = 28 XP
  - Society 0→2 = 12 XP
  - Feats: 40 XP (Power Attack)
  - Total: 144 XP
- Result: Agi 3, Melee 4 = ~68% success

---

### TR 2 - Elite Professional (Tier 2, ~270 XP)
**XP Priority:** Still mostly skills, but hitting caps hard
**Strategy:** Max skills, consider 1 attribute raise for HP or feats

**Example - Royal Guard:**
- Background: Soldier (Melee Combat 3, Athletics 1, Intimidate 1, +36 XP)
- Additional XP: 270 XP
  - Skills: Melee 3→5 (56), Athletics 1→3 (20), Intimidate 1→3 (20), Perception 0→3 (28), Society 0→2 (12) = 136 XP
  - Attributes: Con 4→5 (64 XP) for HP boost
  - Feats: 80 XP (Power Attack, Formation Fighting)
  - Total: 280 XP
- Result: Agi 4, Melee 5 = ~81% success
- **Problem:** This is approaching the skill cap (Melee 5 capped by Agi 4)

---

### TR 3 - Hero (Tier 3, ~510 XP) ⚠️ **CRITICAL TIER**
**XP Priority:** MUST raise attributes to continue progression
**Strategy:** Raise 1-2 key attributes, raise skills to match new caps

**Example - Knight-Captain:**
- Background: Squire (Melee Combat 2, Athletics 2, Society 1, Empathy 1, +40 XP)
- Additional XP: 510 XP
  - **Attributes (critical investment):**
    - Con 5→6 = 80 XP (HP and survivability)
    - Agi 4→5 = 64 XP (enables Melee 6 in future, better defense)
    - Cha 3→4 = 48 XP (enables Intimidating Presence feat)
    - Total Attributes: 192 XP
  - **Skills:**
    - Melee Combat 2→5 = 72 XP
    - Athletics 2→3 = 16 XP
    - Society 1→3 = 24 XP
    - Intimidate 0→4 = 60 XP
    - Perception 0→3 = 28 XP
    - Total Skills: 200 XP
  - **Feats:** 120 XP (Shield Master, Defensive Stance, Power Attack, Formation Fighting, Devastating Charge)
  - **Total:** 512 XP

**Result:** Agi 5, Melee 5 = ~87% success (significant jump from TR 2's 81%)

**Why Tier 3 is critical:**
- Without attribute raises, stays at TR 2 performance
- Attribute investment is expensive but essential
- This is where "heroes" emerge from "professionals"

---

### TR 4 - Champion (Tier 4, ~750 XP)
**XP Priority:** Continue attribute growth, push skills to 6-7
**Strategy:** Get primary attribute to 6, max primary skill to 6-7

**Example - Master-at-Arms:**
- Background: Soldier (Melee Combat 3, Athletics 1, Intimidate 1, +36 XP)
- Additional XP: 750 XP
  - **Attributes:**
    - Con 5→6 = 80 XP
    - Agi 4→5 = 64 XP
    - Total: 144 XP
  - **Skills:**
  - **Skills (corrected):**
    - Melee 3→6 = 96 XP
    - Athletics 1→5 = 80 XP
    - Intimidate 1→3 = 24 XP
    - Perception 0→4 = 60 XP
    - Ranged Combat 0→3 = 28 XP
    - Acrobatics 0→2 = 12 XP
    - Total: 300 XP
  - **Feats:** 8 purchased × 40 = 320 XP
  - **Total:** 144 + 300 + 320 = 764 XP (within 750-780 budget) ✓

**Result:** Agi 5, Melee 6 = ~90% success

---

### TR 5 - Master (Tier 5, ~990 XP)
**XP Priority:** Push toward 8/8 in primary
**Strategy:** Primary attribute to 7-8, primary skill to 7-8

**Example - Weapon Master:**
- Attributes: Agi 5→7 (80 + 96 = 176 XP), Con 6→7 (96 XP), Str 5→6 (80 XP)
- Skills: Melee to 7, Athletics to 6, multiple combat skills to 5+
- Result: Agi 7, Melee 7 = ~98% success

---

### TR 6-8 - Legendary (Tier 6-8, 1200+ XP)
**XP Priority:** Multiple 8s, broad expertise
**Strategy:** Primary at 8/8, secondaries at 6-8, massive feat collection

**Example - Legendary Master (TR 8):**
- Attributes: Str 8, Con 8, Agi 8, Wis 6, Dex 5
- Skills: Melee 8, Athletics 8, multiple skills at 6+
- Feats: 18 total (2 starting + 16 purchased)
- Result: 100% success on primary actions

---
## SPELLCASTER XP SPENDING

For magical humanoid NPCs (Mageborn, Divine Gift, etc.), the same three-phase progression applies with one key difference:

**Mastery vs Potentials:**
- **Mastery:** 8 × rank (same as skills - EFFICIENT)
- **Potentials:** 16 × rank (same as attributes - EXPENSIVE)

**Strategy: Prioritize Mastery over Potentials**

Just like martials prioritize Skills over Attributes, casters should prioritize Mastery over Potentials.

### CRITICAL: Space and Time are Universal Supporting Energies

**Looking at the actual weaves in the system, nearly ALL complex weaves use:**
- **Space** for range and area effects
- **Time** for duration and concentration

**Typical Weave Structure:**
- Primary Energy: Fire 4 (damage effect)
- Supporting Energy: Space 2 (medium range 60ft) + Time 1 (duration 1 round)
- Weaving Roll: Fire Potential + Fire Mastery + Space Potential + Space Mastery + Time Potential + Time Mastery (6d8)

**This means effective casters need:**
1. **Primary specialization** (one elemental energy at high mastery)
2. **Space Mastery** (used in almost every weave for range/area)
3. **Time Mastery** (used in almost every weave for duration)
4. **Secondary elements** (dabbling in 1-2 other energies at low ranks)

### Revised Example - Battle Mage (TR 2)
**Specialization: Fire with Space/Time support**
- **Potentials:** Start with initial rolls (Fire 6, Space 5, Time 4, others 2-4) - don't raise yet
- **Mastery priorities:**
  - Fire Mastery 0→5 = 120 XP (primary specialization)
  - Space Mastery 0→4 = 60 XP (universal supporting energy)
  - Time Mastery 0→3 = 28 XP (universal supporting energy)
  - Total Mastery: 208 XP
- **Attributes:** Int 5→6 (80 XP) - needed for higher Fire Mastery cap
- **Total magic XP:** 288 XP of 310 available
- **Result:** Int 6, Fire 5, Space 4, Time 3 = effective Fire Bolt caster (rolls 6d8: Fire Pot 6 + Fire Mas 5 + Space Pot 5 + Space Mas 4 + Time Pot 4 + Time Mas 3)

**Why this works:**
- Fire Mastery 5 makes primary attack weaves powerful
- Space Mastery 4 gives range and area coverage (used in EVERY combat weave)
- Time Mastery 3 provides duration for buffs and control (used in most weaves)
- This matches how weaves are actually structured in the system

### Revised Example - Archmage (TR 4, 300 years of study)
**Specialization: Fire specialist with strong Space/Time foundation**
- **Mastery investments:**
  - Fire Mastery 0→6 = 168 XP (primary specialization - devastating damage)
  - Space Mastery 0→5 = 120 XP (universal support - all weaves)
  - Time Mastery 0→4 = 60 XP (universal support - all weaves)
  - Air Mastery 0→3 = 28 XP (secondary element - Lightning Bolt)
  - Water Mastery 0→2 = 12 XP (tertiary element - dabbling)
  - Total: 388 XP (highly efficient)
- **Potential investments:**
  - Fire 6→7 = 96 XP (enables future Mastery 7)
  - Space 5→6 = 80 XP (critical for high-level weaves)
  - Total: 176 XP (only raised when needed for caps)
- **Attributes:** Int 5→6 = 80 XP
- **Total magic investment:** 644 XP of 790 available

**Result:** Three centuries of focused magical study creates:
- **Fire Mastery 6** = devastating fire damage
- **Space Mastery 5** = excellent range, area, and teleportation
- **Time Mastery 4** = strong duration and concentration effects
- This reflects actual weave construction: primary element + Space + Time

### The Universal Pattern for Casters

**Tier 1-2: Establish Foundation**
- Primary Element Mastery 3-5
- Space Mastery 2-4 (essential for range)
- Time Mastery 1-3 (essential for duration)

**Tier 3-4: Specialize and Expand**
- Primary Element Mastery 5-6
- Space Mastery 4-5 (advanced teleportation, area effects)
- Time Mastery 3-4 (long durations, complex concentration)
- Secondary Element Mastery 2-3 (versatility)

**Tier 5-8: Master and Perfect**
- Primary Element Mastery 7-8 (legendary power)
- Space Mastery 6-7 (teleportation networks, demi-planes)
- Time Mastery 5-6 (permanent effects, time manipulation)
- Multiple secondary elements at 4-5 (broad expertise)

### Why Space and Time Matter More Than Multiple Elements

**Looking at Fire Bolt:**
- Primary: Fire 4
- Supporting: Space 2 (range), Time 1 (duration)
- **Without Space Mastery:** Forced to use touch-range only (dangerous!)
- **Without Time Mastery:** Effects are weaker, shorter duration

**Looking at Fireball:**
- Primary: Fire 6
- Supporting: Space 3 (range + area)
- **Without Space Mastery:** Can't create area effects or reach distant targets

**Conclusion:** A Fire 6 / Space 5 / Time 4 mage is far more effective than a Fire 6 / Air 5 / Water 4 mage, because the first can actually USE their fire magic at range with area effects and duration, while the second is limited to touch-range fire with poor area coverage.

---
## KEY TAKEAWAYS FOR HUMANOID NPC DESIGN

### 1. Respect the Three Phases
- **Tiers 1-2:** Skills first (80% of XP)
- **Tiers 3-5:** Attributes + Skills together (40%/40%)
- **Tiers 6-8:** Breadth and mastery (30%/30%/40% feats)

### 2. Tier 3 is the Inflection Point
- Without attribute raises, TR 3 NPCs will feel like TR 2
- Budget 80-150 XP for attribute advancement at TR 3
- This creates the power jump expected of "heroes"

### 3. Skills Cost Half What Attributes Do
- Skill 3→4 = 24 XP
- Attribute 5→6 = 80 XP
- Always max skills before raising attributes (except for prerequisites or caps)

### 4. For Casters: Mastery Before Potentials
- Same principle as Skills before Attributes
- Mastery is rolled every weave, Potentials mainly affect Energy pool
- Three centuries of study = Mastery 6-7, not necessarily Potential 8

### 5. Success Rate Progression Should Feel Smooth

| Tier | Target Success (1+) | Feel |
|------|---------------------|------|
| 1 | 65-85% | Competent but unreliable |
| 2 | 85-90% | Professional |
| 3 | 90-95% | Heroic (clear jump from Tier 2) |
| 4 | 95-98% | Champion |
| 5-8 | 98-100% | Mastery |

### 6. Don't Forget HP Scaling
Constitution raises aren't just for casters:
- Con 4 = 32 HP
- Con 5 = 40 HP
- Con 6 = 48 HP

At higher tiers, NPCs should invest in Constitution to survive tier-appropriate threats.
---


## FINAL CHECKLIST FOR HUMANOID NPC CREATION

✅ Used standard PC attribute array (5,4,3,3,3,2,2,2)
✅ Selected appropriate background for role
✅ Calculated XP budget: Background + Tier XP
✅ Followed tier-appropriate XP spending strategy:
   - Tiers 1-2: Skills first
   - Tiers 3-5: Attributes + Skills
   - Tiers 6-8: Breadth + Feats
✅ Selected 2 starting feats + appropriate purchased feats (max 2 per tier)
✅ Verified success rate matches tier expectations
✅ HP = Constitution × 8
✅ Equipment follows equipment.md, armor.md, weapons.md
✅ No class restrictions on armor/weapons
---

**This framework ensures humanoid NPCs scale smoothly from Tier 1 through Tier 8, matching player character progression and creating appropriately challenging encounters at every tier.**

## Hit Point Calculation Tables

### HP Formula by Creature Type

**HP = Constitution × HP Multiplier (from table below)**

**HP Multiplier Table:**

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
- Orc Warrior (Threat 1/2, Con 4, Tough): 4 × 9 = 36 HP
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
- **Mindless (if applicable):** immune to mind-affecting effects effects (Beguiling Weave, fear, Sleep), fear, psychic effects
- **Does not need:** Air, food, drink, sleep
- **Negative Healing (optional):** Healed by negative energy, harmed by positive

#### **Construct**
- **Construct Immunities:** Immune to poison, Poisoned, disease, exhaustion, Paralyzed, Petrified
- **Mindless (if applicable):** immune to mind-affecting effects effects (Beguiling Weave, fear, Sleep), fear, psychic effects
- **Does not need:** Air, food, drink, sleep

#### **Aberration**
- Alien biology
- Often has alien mind (Fortune vs mental effects or vulnerability, varies)
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
- **Celestial Resistances:** Often resistant to positive, negative energy
- **Magic Resistance:** Subtract 1 from both dice on saves vs magical effects
- **Holy Aura:** May deal positive damage or have protective effects

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
- **Mindless:** immune to mind-affecting effects (Beguiling Weave, fear, Sleep), fear, psychic effects
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

#### **Perfect Sight (specify range)**
- Sees in normal and magical darkness
- Sees invisible creatures and objects
- Detects illusory effects and sees through them
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
- May affect stealth

#### **Shields:**
- Grants Shield Block reaction
- Provides +1 DR (standard shield) or +2 DR (tower shield)

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
- Uses Multiattack: Roll Agi die once (1d8, need <4), roll skill die three times (1d8, need <5)
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