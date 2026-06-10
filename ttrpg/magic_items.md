# Magic Items

Canonical definitions for named magic items in the Legends system. Reference these in bestiary entries using `[[Item Name]]` notation inside a `### Equipment` section.

---

## Magic Item Slots & Binding

### Body Slots

Each worn magic item occupies a **body slot**. Only one item may occupy a slot at a time; the Ring slot is the exception — each hand can wear one ring (2 rings total).

| Slot | Typical Items |
|---|---|
| Head | Circlets, helms, crowns, hoods |
| Eyes | Goggles, lenses, monocles |
| Neck | Amulets, necklaces, pendants, brooches |
| Shoulders | Cloaks, capes, mantles |
| Chest | Vests, robes, medallions |
| Wrists | Bracers, bracelets |
| Hands | Gloves, gauntlets |
| Ring | Rings (2 slots: left and right hand) |
| Waist | Belts, sashes |
| Feet | Boots, sandals |

Items held rather than worn — rods, staves, and wands — occupy **no body slot**.

**Curios** are slotless magic items (stones, tokens, fetishes, flasks) that are carried rather than worn in a specific slot.

### Binding

Some magic items require a personal bond — called **Binding** — before they can be activated. A Bound item is attuned to a specific character's essence; only that character can trigger its effects.

**Rules:**
- A character may have up to **3 Bound items** at once.
- **Binding** an item requires a **Short Rest** (1 hour) of uninterrupted attentive contact with the item.
- **Unbinding** an item requires a **Long Rest** with deliberate intent, or happens automatically when the character takes a Long Rest without the item in their possession.
- Picking up an unbound item that Requires Binding grants no activations — it occupies its body slot but is otherwise inert to the new holder.

---

## Using Magic Implements (Staves & Wands)

### Requirements
Only characters with a **magical trait** that grants an energy pool can activate an implement's weaves:

| Trait | Casting Stat | Notes |
|---|---|---|
| Mageborn | Intelligence | |
| Divine Gift | Wisdom | |
| Invoker | Charisma | |
| Infuser | Intelligence | |
| Sorcerous Origin | Wisdom | |
| Eldritch Pact | Charisma | |
| Summoner | Charisma | Uses summoning energy pool |

**Alchemical Tradition** characters **cannot** activate implements. Alchemists brew preparations using physical materials; they do not channel magical energy directly. An alchemist holding a wand is just holding a stick.

### Activation
1. The wielder selects a weave from the implement's list of granted weaves.
2. The implement must have sufficient **charges** to cover the weave's charge cost.
3. A **targeting roll** is made to deliver the effect.
4. Charges are consumed whether or not the targeting roll succeeds — the attempt itself costs the charge.

### Targeting Roll
The effect is assumed successfully woven (no casting roll is needed — the implement holds the weave). Only targeting is required.

Roll **2d8** and check each die:
- **Die 1** vs. the wielder's **Casting Stat** (Intelligence, Wisdom, or Charisma — determined by magical trait)
- **Die 2** vs. the wielder's **mastery level** for the implement's **Primary Energy** type

If the implement has an **Attack Bonus**, it is applied as a bonus to both dice (each die result is reduced by the attack bonus, making the target threshold easier to meet).

| Targeting Successes | Result |
|---|---|
| 0 | Miss — effect fails to reach the target; charges still consumed |
| 1 | Margin 1 — effect lands at reduced potency |
| 2 | Margin 2 — effect lands at full potency |
| 2 + Critical | Critical — both dice roll a natural 1; full effect, all Luck restored |

### Charges
Each implement has a **charge pool** (e.g. 10/10). Charges replenish according to the item's **recharge period**:
- **Short Rest** — replenishes automatically at the end of a short rest (also replenishes on long rest)
- **Long Rest** — replenishes automatically at the end of a long rest only
- **Never** — charges do not replenish; the implement is finite

---

## Using Magic Rods

### Overview
Rods are utilitarian magic items that anyone can activate — no magical trait required. They contain self-contained effects triggered on command, not channelled energy. A fighter, a rogue, or a scholar can all use a rod equally well.

### Activation
1. The wielder spends an **Action** and speaks the rod's command word or triggers its mechanism.
2. The rod must have at least enough **charges** to cover the effect's cost.
3. No targeting roll is made — the effect fires automatically at **Margin 2** (full potency).
4. Charges are consumed.

Rods may also function as a bludgeoning weapon (typically 1d4 damage) regardless of charges.

### Charges
Rods use the standard charge model. Most rods recharge at the end of a **Long Rest**.

| Recharge Period | Meaning |
|---|---|
| Long Rest | Refills automatically at the end of a long rest |
| Short Rest | Refills at the end of a short rest (and on long rest) |
| Never | Charges do not replenish; the rod is finite |

---

## Using Magic Rings

### Requirements
Magic rings require **no magical trait**. Any character may wear and activate a ring — they channel a bound, self-contained effect that requires no personal energy pool.

### Activation
1. The wearer spends an **Action** and speaks the ring's command word.
2. The ring must have at least 1 **charge** available.
3. No targeting roll is made — the effect fires automatically at **Margin 2** (full potency).
4. 1 charge is consumed.

Because rings are typically utility or buff weaves that affect the wearer or a fixed area, the reliable Margin 2 activation reflects the self-contained nature of the bound weave.

### Charges
Rings use the standard charge model. Most rings have **1/1 charge** that refills automatically after a **Long Rest**.

| Recharge Period | Meaning |
|---|---|
| Long Rest | Refills automatically at the end of a long rest |
| Short Rest | Refills at the end of a short rest (and on long rest) |

---

## Staff of the Darach
**Type:** Staff
**Rarity:** Rare
**Attack Bonus:** 1
**Primary Energy:** earth
**Damage:** 1d6 bludgeoning (Versatile)
**Weight:** 4
**Charges:** 10/10 (recharge: 1d8 at Long Rest)
**Description:** A jagged length of blackened wood crowned with a green-glowing orb wreathed in thorns. The light it casts is the wrong shade of green.
**Properties:**
- Functions as a magic quarterstaff with [Versatile]. Attacks subtract 1 from the skill die (magic weapon bonus).
- While held, subtract 1 from one targeting die on all weave targeting rolls.
- **Verdant Veil (Passive):** While carrying the staff, the wielder has Fortune on Stealth checks and leaves no tracks in natural terrain. Creatures tracking by scent or mundane means automatically fail unless they have magic or Tremorsense.

### Granted Weaves
| Weave | Charge Cost |
|---|---|
| Grasping Vines | 1 |
| Revealing Light | 1 |
| Barkward | 2 |
| Speak with Plants | 2 |
| Shape Stone | 4 |
| Biting Swarm (Grasping Vines, Greater + Toxic Mist combined effect) | 4 |

**Biting Swarm (4 charges):** Calls a 20-foot diameter swarm of biting insects at medium range. Every creature in the area makes a Reflex save. Creatures that fail take 12 piercing damage, gain the Poisoned (Weak) condition, and treat the swarm's area as difficult terrain for 1 minute.

---

## Ring of Fog Calling
**Type:** Ring
**Rarity:** Uncommon
**Slot:** Ring
**Primary Energy:** air
**Weight:** 0
**Charges:** 1/1 (recharge: Long Rest)
**Description:** This wooden band has an intricate scene of rolling clouds carved on it. The wearer can use an action to speak the command word to summon a concealing fog centered on themselves.

### Granted Weaves
| Weave | Charge Cost |
|---|---|
| Fog Cloud | 1 |

**Fog Cloud (1 charge):** Creates a heavily obscured sphere 40 feet in diameter centered on the wearer. All creatures inside gain the Concealed condition against all attackers. Duration: 1 minute or until dispersed by strong wind.

---

## Haunt Scrap
**Type:** Broach
**Rarity:** Rare
**Slot:** Neck
**Weight:** 0
**Description:** A ragged piece of heavy, dark-green, woolen cloth with a blacksmith’s nail pushed through it like a pin. 
While worn it becomes difficult for undead creatures  to locate you. An undead creature must succeed on a DC 14 Wisdom saving throw or be unable to detect or locate you with sight, hearing or smell. Even extraordinary senses such as blindsight and tremorsense are not effective. The effects automatically end if you take an action which uses radiant energy, attempt to turn undead, or attack an undead creature, at which point the effect is lost until after a long rest.
The Haunt Scrap must be bound before it may be used.

---

## Leystone
**Type:** Curio
**Rarity:** rare
**Slot:** None
**Weight:** 0
**Description:** While this vaguely arrow shaped stone is on your person, you can correctly detect the direction toward the nearest ley line. 

---

## Tooth of Old One-eye
**Type:** Weapon (Dagger)
**Rarity:** Uncommon
**Attack Bonus:** 1 (2 vs beasts)
**Weight:** 1
**Description:** The tooth of the ancient crocodile known as Old One-eye — 11 inches of yellowed, ridged ivory. It functions as a magic dagger. Its Attack Bonus of 1 is reduced from the skill die as normal. Against beasts, its Attack Bonus is treated as 2 instead (an additional −1 to the die result).

The tooth carries an old, territorial magic. While it is on your person, you benefit passively from the effects of **Barkward** — your skin takes on a faint bark-like hardness without any action on your part.

**Passive Effect:** Barkward (always active while carried; no charges or activation required)

> **Foundry:** `attackBonus: 1`, `conditionalBonuses: [{ value: 1, condition: "beast" }]`, `passiveEffects: [{ effectId: "Barkward" }]`. When the attacker has a beast targeted, the system automatically adds the extra −1 to the die roll modifier.

---

## Twisted Wand
**Type:** Wand
**Rarity:** uncommon
**Primary Energy:** Earth
**Weight:** 1
**Charges:** 5/5 (recharge: 1d8/2 at Long Rest)
**Description:** This wand has 5 charges. As an action the wielder may expend a charge which causes tall grass, weeds, and other plants to grow and wrap around creatures in the area of effect or those that enter the area. This functions identically to the spell Grasping Vines. The wand regains 1d8/2 charges after a long rest. If you expend the wand’s last charge, roll a d8. On a 8, the wand crumbles into ash and is destroyed. 

### Granted Weaves
| Weave | Charge Cost |
|---|---|
| Grasping Vines | 1 |

---

## Circlet of the Faun
**Type:** Circlet
**Rarity:** Uncommon
**Slot:** Head
**Weight:** 0
**Description:** While wearing this circlet, you can understand and be understood by animals as though sharing a common language. This is a passive benefit — no action or charges are required. The effect ends if the circlet is removed.

This ability allows natural communication but confers no special influence over animals; their disposition and cooperation remain entirely up to the GM. Note that it does not replicate the **Beast Courier** weave, which compels a beast to deliver a message.

---

## Root Stem
**Type:** Curio
**Rarity:** Uncommon
**Primary Energy:** Earth
**Weight:** 2
**Charges:** 1/1 (recharge: Long Rest)
**Description:** A dense ball of tangled, living roots that pulses faintly with earth energy. The bearer can expend its charge to release the weave **Plant Growth**, causing nearby vegetation to erupt into a thick, impassable tangle.

### Granted Weaves
| Weave | Charge Cost |
|---|---|
| Plant Growth | 1 |

---

## Moon's Edge
**Type:** Weapon (Katana)
**Rarity:** Rare
**Attack Bonus:** 1
**Weight:** 5
**Description:** A katana with a blackened blade and a brilliant, razor-sharp edge that catches the light like a crescent moon. The tsuba features cut-out phases of the moon; the tsuka is inlaid to match. On a critical success (double 1s on the attack roll), the target takes an additional 1d8 slashing damage beyond the normal critical result.

> **Foundry:** `attackBonus: 1`, `criticalDamageBonus: "1d8"`. The bonus damage is rolled automatically and added to the damage total whenever `criticalSuccess` is true on the attack roll.