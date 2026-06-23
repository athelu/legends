### Alchemical Creation Rules
Alchemical preparations are physical objects that store magical effects for later use. They are created during downtime using physical components that contain concentrated magical energy, following the energy requirements of weaves from the standard weave list.

Creating a crafted preparation requires three steps. Daily and short rest preparations skip Steps 2 and 3 entirely — they require no components and no check.

**Step 1 — Identify the desired effect and its energy requirements.**
The Alchemist consults the weave list to determine which energies and what quantities are needed. Any weave on the list may serve as the basis for a preparation, subject to Craft rank limits. The Alchemist may use Arcane checks or Research downtime to identify requirements for unfamiliar weaves.

**Step 2 — Gather components.**
Physical components containing the required energies at the required potency must be on hand before mixing begins. Each energy point in the weave requires one point of potency in the corresponding component type. A Fire Bolt equivalent (Fire 2, Space 1) requires Fire components totaling potency 2 and Space components totaling potency 1 — or the Space component may be replaced by thrown delivery.
Components may be combined freely to reach required totals. Two potency-1 Fire components substitute for one potency-2 Fire component.

**Step 3 — Mix the preparation.**
The Alchemist works for the time determined by the energy cost bracket. At the end of the required time, make a Craft: Alchemist check. Apply results and determine the activation catalyst. On success, produce a number of identical preparations equal to Craft: Alchemist rank.

**Craft: Alchemist Rank Gates:**
Craft: Alchemist rank governs both the complexity and potency of preparations the Alchemist can produce. Both limits apply simultaneously to all preparation types — daily, short rest, field improvised, and crafted.

| Craft Rank | Max Total Energy Cost | Max Single Component Potency | Crafted Yield |
|------------|-----------------------|------------------------------|---------------|
|    1       |           2           |             1                |      1        |
|    2       |           4           |             2                |      2        |
|    3       |           6           |             3                |      3        |
|    4       |           8           |             4                |      4        |
|    5       |           10          |             5                |      5        |
|    6       |           12          |             6                |      6        |
|    7       |           14          |             7                |      7        |
|    8       |           16          |             8                |      8        |


#### Activation Catalysts
Every preparation has a defined activation method chosen during creation. The catalyst is decided before mixing begins and cannot be changed after completion.

| Catalyst   | Description           | Typical Use                                  |
|------------|-----------------------|------------------------------|---------------|
| Ingested   | Consumed by drinking or eating | Healing draughts, attribute tinctures, subtle poisons |
| Applied    | Spread on a weapon surface or object | Contact poisons, weapon oils, trap components |
| Thrown     | Hurled as a projectile; activates on impact | Fire flasks, acid vials, frost bombs, offensive preparations |
| Triggered  | Activates when a specific condition is met (touch, light, sound, proximity) | Trap preparations, delayed effects, defensive items |
| Immediate  | Activates the moment mixing is complete | Only occurs on critical failure; cannot be chosen intentionally |

A preparation with a Thrown catalyst uses Dexterity + Ranged Combat to hit a target or location (range 30/60 ft). A preparation with an Applied catalyst activates when the coated surface strikes or is contacted. A preparation with a Triggered catalyst requires the Alchemist to define the trigger condition precisely at creation — the GM confirms whether the condition is specific enough to be reliable.

#### Crafting Time
Crafting time is determined by the total energy cost of the preparation. No per-modifier math is required — the complexity of what is being made determines how long it takes.

| Total Energy Cost | Crafting Time         |
|-------------------|-----------------------|
| 1–6               | 4 hours (1 Short Practice block) |
| 7–12              | 8 hours (1 Downtime Period) |
| 13–16             | 16 hours (2 Downtime Periods) |

Component cost multiplies by yield; time does not. A Craft rank 4 Alchemist making 4 healing draughts (Positive 3, total energy cost 3) spends 4 hours and walks away with 4 preparations.
All preparations in a crafted batch must be identical — same weave basis, same activation catalyst.

Example preparations and their crafting times:

| Preparation  |  Energy Basis         | Total Cost | Time    |
|--------------|-----------------------|------------|---------|
| Fire Flask   | Fire 2, thrown        | 2          | 4 hours |
| Frost Bomb   | Water 2, thrown       | 2          | 4 hours |
| Healing Draught | Positive 3, ingested	3 | 4 hours |
| Smoke Bomb   | Air 2, triggered	2 | 4 hours |
| Acid Vial    | Water 3, thrown	3 | 4 hours |
| Contact Poison (weak) | Negative 2, applied | 2 | 4 hours |
| Strong Healing Draught | Positive 6, ingested | 6 | 4 hours |
| Contact Poison (strong) | Negative 4, applied | 4 | 4 hours |
| Fire Bomb (area) | Fire 5, Space 2 | 7 | 8 hours |
| Paralytic Poison | Negative 4, Space 2, Paralyzed | 6 | 4 hours |
| Mass Healing Draught | Positive 5, Space 3 | 8 | 8 hours |
| Temporal Poison | Negative 3, Time 2, applied | 5 | 8 hours |
| Greater Fire Bomb | Fire 7, Space 4 | 11 | 8 hours |
| Legendary Preparation | Any, 13+ | cost	13+ | 16 hours |

#### The Craft Check
The Alchemist makes a Craft: Alchemist check (Dexterity + Craft: Alchemist rank) at the end of the required time investment.

| Result                  | Outcome                            |
|-------------------------|------------------------------------|
| Required successes met  | Preparation completed successfully at full effect |
| 1 success when 2 needed | Preparation completed but unstable — GM rolls secretly. On 1–4 (d8) it functions normally; on 5–8 it activates immediately when used (Immediate catalyst, regardless of chosen catalyst) |
| 0 successes, no complication | Work continues — add one additional period, make another check |
| 0 successes, complication | All components consumed and lost; preparation fails; must restart with new components |
| Critical failure (double 8s) | Preparation activates immediately in the workspace — see Critical Failure on Mixing |

#### Check difficulty by preparation complexity:
| Total Energy Cost | Successes Required           |
|-------------------|------------------------------|
| 1–4               | 1 success               | 
| 5–8               | 1 success               | 
| 9–12              | 2 successes               | 
| 13+               | 2 successes + Add 1 to both dice |

**Complication check:** When the Alchemist achieves 0 successes, roll 1d8. If the result exceeds Current Luck, a complication occurs and components are lost.

#### Using a Preparation
Alchemical preparations may be used by any character, no magical trait is required. The magic is contained within the object.

#### Action cost by catalyst:
| Catalyst     | Action Cost                  |
|--------------|------------------------------|
| Ingested     | 1 [Activate] action          |
| Applied (to own weapon) | 1 [Activate] action |
| Applied (to another's weapon) | 1 [Interact] action (adjacent ally) |
| Thrown       | 1 [Combat] action |
| Triggered    | No action at trigger time — activation is automatic |

- **Targeting:** Preparations that affect a specific target use the following targeting resolution:
- **Thrown preparations:** Dexterity + Ranged Combat attack roll, then normal weave success scaling applies
- **Ingested/Applied preparations:** No attack roll — effect resolves automatically on contact
- **Area preparations (those with Space components):** Normal weave targeting as if cast by the Alchemist, using Intelligence + Craft: Alchemist rank as the targeting roll
- **Success scaling:** Preparations resolve using the same margin-of-success scaling as weaves. The "targeting roll" for non-thrown preparations uses the Alchemist's Intelligence + Craft: Alchemist rank. The preparation's effect is determined by the number of successes on this roll compared against the target's save (if applicable).

#### Alchemical Components
Magical energy concentrates in natural objects over time. The degree of concentration depends on proximity to ley lines and nexus points, the age and extremity of the environment, and the specific elemental conditions of the source location. An Alchemist must identify, locate, and correctly harvest these concentrations to use them in preparations.

**Every component has:**
- **Energy type** — which of the eight energies it contains
- **Potency** — how many points of that energy it provides (1–8)
- **Source** — where it comes from
- **Rarity** — how difficult it is to obtain

Components may be combined to meet energy requirements. Two potency-1 components of the same type substitute for one potency-2 component. Components of different types may not be combined.

#### Component Rarity by Energy Type
| Rarity       | Energy Types              | General Availability |
|--------------|---------------------------|----------------------|
| Common       | Fire, Air, Earth, Water   | Natural geological and environmental sources; low-potency versions purchasable in most markets |
| Uncommon     | Positive, Negative        | Sites of divine activity, significant death, or prolonged life; purchasable in cities with appropriate contacts |
| Rare         | Time, Space               | Do not occur naturally in the material world; found only at exceptional nexus points or harvested from specific Daemons |


#### Fire Components
| Component    | Potency | Source     | Availability      |
|--------------|---------|------------|----------------------|
| Sulfur       |    1    | Volcanic regions, mineral markets | Common market purchase |
| Coal (alchemical grade) | 1 | Mining regions, markets | Common market purchase |
| Obsidian     |    2    | Volcanic terrain | Markets in volcanic regions; Wilderness check elsewhere |
| Volcanic glass | 3     | Active volcanic terrain | Wilderness check in appropriate terrain |
| Fire-ley obsidian | 4  | Volcanic terrain adjacent to Fire ley line | Requires ley line location knowledge |
| Hearthstone | 5–6      | Ancient volcanic formations at nexus-adjacent locations | Nexus exploration |

#### Air Components
| Component    | Potency | Source     | Availability      |
|--------------|---------|------------|----------------------|
| Raptor feather (storm species) | 1 | Highland and coastal regions | Wilderness check or market |
| Thunderstone | 2 | High mountain peaks, storm-prone ridgelines | Wilderness check in appropriate terrain |
| Cyclone salt | 3 | Coastal cliff formations in high-wind regions | Wilderness check, coastal highlands |
| Ley-wind crystal | 4 | Stone formations adjacent to Air ley line | Requires ley line location knowledge |
| Stormheart crystal | 5–6 | Ancient formations at Air nexus points | Nexus exploration |


#### Earth Components
| Component    | Potency | Source     | Availability      |
|--------------|---------|------------|----------------------|
| Iron ore | 1 | Mining regions, markets | Common market purchase |
| Lodestone | 2 | Specific mineral deposits | Markets in mining cities; Wilderness check elsewhere |
| Deep granite | 3 | Ancient mine shafts, old mountain formations | Wilderness check in ancient mining regions |
| Ley-earth mineral | 4 | Mineral deposits adjacent to Earth ley line | Requires ley line location knowledge |
| Rootstone | 5–6 | Ancient formations at Earth nexus points | Nexus exploration |

#### Water Components
| Component    | Potency | Source     | Availability      |
|--------------|---------|------------|----------------------|
| Sea salt | 1 | Coastal regions | Common market purchase |
| Deep spring water | 2 | Underground springs | Wilderness check or known location |
| Glacial ice | 3 | Mountain glaciers, extreme northern terrain | Wilderness check in appropriate terrain |
| Ley-water mineral | 4 | Springs or seabeds adjacent to Water ley line | Requires ley line location knowledge |
| Deepshard crystal | 5–6 | Ancient formations at Water nexus points | Nexus exploration |

#### Positive Components
| Component    | Potency | Source     | Availability      |
|--------------|---------|------------|----------------------|
| Temple-blessed herbs | 2 | Temple gardens, available from priests | City temples; requires respectful approach |
| Shrine-spring water | 3 | Springs adjacent to active temples or shrines | Specific known locations |
| Nexus-spring water (Positive) | 4–5 | Springs at Positive ley line nexus points | Nexus exploration |
| First Age holy site remnant | 6 | Ancient sacred sites predating the Dragon devastation | Story acquisition |

#### Negative Components
| Component    | Potency | Source     | Availability      |
|--------------|---------|------------|----------------------|
| Ley-shadow mineral | 2 | Deposits adjacent to Negative ley line | Requires ley line location knowledge |
| Grave soil | 2 | Ancient burial sites, old battlefields | Wilderness check in historically significant locations |
| Deep Fens peat | 3 | The Fens region; ancient, death-saturated deposits | Wilderness check in the Fens |
| Bone Garden residue | 4 | Nevil's sacred site at the Fens | Specific location, may require faction standing |
| Ley-death crystal | 5–6 | Negative ley line nexus formations | Nexus exploration |

#### Rare Components
Time and Space energies do not concentrate naturally in the material world. They exist in the planes but barely touch the material realm. The only sources on Athelu are exceptional nexus points where the relevant planes intersect particularly strongly, and certain Daemons whose nature is tied to these conceptual energies.

Daemon harvesting for Time and Space components is GM controlled. The GM determines which creatures in the campaign yield these components, based on the nature of the creature and the story. This is not routine — it requires the Alchemist to know in advance what a specific creature yields, and to be prepared to harvest immediately after defeat.

#### Time Components
| Component    | Potency | Source     |
|--------------|---------|------------|
| Temporal residue | 3 | Sites where Time weaves have been used repeatedly over centuries — extremely rare, GM determined |
| Time-aspected Daemon essence | 4–6 | Harvested from Daemons with Time affinity — GM controlled |
| Nexus temporal crystal | 5–7 | Time-aspected nexus point — exceptional rarity, story acquisition |

#### Space Components
| Component    | Potency | Source     |
|--------------|---------|------------|
| Portal fragment | 3 | Remnants of destroyed magical portals in First Age ruins |
| Space-aspected Daemon essence | 4–6 | Harvested from Daemons with Space affinity — GM controlled |
| Nexus spatial crystal | 5–7 | Space-aspected nexus point — exceptional rarity, story acquisition |

#### Component Purchasing
Low-potency Common components are available in most settlements with a market. Higher-potency components and all Uncommon components require larger cities, specialist suppliers, or faction contacts.

| Component Type      | Availability     | Approximate Cost  |
|---------------------|------------------|-------------------|
| Common, potency1–2  | Most settlements | 5–15 gp per unit |
| Common, potency 3–4 | Larger towns, specialist suppliers | 20–50 gp per unit |
| Common, potency 5–6 | Cities, rare specialty shops | 75–150 gp per unit |
| Uncommon, potency 2–3 | Cities with temple or guild contacts | 30–75 gp per unit |
| Uncommon, potency 4–5 | Major cities, significant faction standing | 100–250 gp per unit |
| Rare (Time/Space) | Cannot generally be purchased	Story | acquisition only |

#### Harvesting Components
Collecting components from natural sources uses the Wilderness skill.  An Alchemist may gather components directly from appropriate terrain during downtime.
The Alchemist identifies a likely source location using Wilderness (Easy task for Common components in appropriate terrain; Hard task for specific high-potency locations).
The Alchemist must spend at least a Short Practice block (4 hours) harvesting. Make a Craft: Alchemist check at the end of this period to determine if  materials were successfully extracted.

#### Harvesting Results

| Result | Yield |
|--------|-------|
| 2 successes | Full yield — potency 1–4 components appropriate to location (GM determines specific type and quantity based on terrain) |
| 1 success | Partial yield — half the normal quantity |
| 0 successes | Component is contaminated or incorrectly extracted — no usable material |

**Ley-line adjacent harvesting:** When the Alchemist harvests within a confirmed ley line region (located using Arcane or the Pneuma Sensitivity feat), the GM may allow potency 3–5 components appropriate to the ley line's energy type. This requires both the Wilderness check to locate suitable formations and the Craft: Alchemist check to harvest correctly.

**Nexus harvesting:** At a confirmed nexus point, potency 5–7 components may be available. The Alchemist must make an Arcane check (Hard task) to identify the highest-concentration materials before harvesting.

#### Daemons Harvesting 
When a Daemon that yields Time or Space components has been defeated, the Alchemist may attempt to harvest usable essence. The Alchemist must know in advance what the creature yields and how to extract it (requires prior Research). Harvesting must begin within 1 hour of defeat (magical essence dissipates rapidly). A Short Practice block (4 hours) is required to attempt the harvest. The Alchemist must make a Craft: Alchemist check (Hard task — 2 successes)

#### Daemon Harvesting
| Result | Yield |
|--------|-------|
| 2 successes | Usable essence recovered at full potency (GM determines potency based on creature) |
| 1 success | Essence recovered at half potency (round down, minimum 1) |
| 0 successes | Essence contaminated during extraction — no usable material recovered |

