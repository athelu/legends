# Armor & Shields
In Legends, armor does not make you harder to hit, it makes you harder to hurt. The system uses Damage Reduction (DR) rather than Armor Class, meaning a well-placed blow lands regardless of what you're wearing, but the steel between you and the blade absorbs a portion of what would otherwise be a serious wound.
Each armor type lists separate DR values for Slashing, Piercing, and Bludgeoning damage, reflecting how different materials and constructions resist different kinds of force. 
Shields work differently from armor. Rather than providing passive DR, they grant reactions and abilities you actively use during combat, intercepting attacks and deflecting missiles.
When selecting armor, weigh protection against the penalties heavier suits impose on swimming, stealth, and endurance in prolonged combat. No armor covers every situation equally, and a fighter who never leaves the dungeon has different needs than a scout who must cross a river.


### Armor Properties
- **[Noisy]** - Armor with this keyword imparts a +1 penalty to the stealth skill die.
- **[Loud]** - Armor with this keyword imparts a +2 penalty to the stealth skill die.
- **[LightArmor]** - Armor with this Keyword requires 1 minute to don/doff
- **[MediumArmor]** - Armor with this keyword impart a +1 to athletics die on swimming checks. Swim speed is reduced to 1/3 movement speed. This armor requires 5 minute to don, 1 minute to doff
- **[HeavyArmor]** - Armor with this keyword impart a +2 to athletics die on swimming checks. Swim speed is reduced to 1/4 movement speed. Heavy armor worn 8+ hours in extreme conditions or contant battle require Constitution checks or gain Exhaustion. This armor requires 10 minutes to don, 5 minutes to doff

## Shields
---

### Buckler
- **Image:** `icons/equipment/shield/buckler-metal-blue.webp`
- **Description:** A small, round shield typically 12-18 inches in diameter, strapped to the forearm or gripped in the fist. The buckler is the duelist's shield being light enough to leave the hand partially free for grappling or pommel strikes, and fast enough to actively intercept blows rather than simply absorb them.
- **Shield Type:** light
- **Hand Usage:** Occupies off-hand but allows punch/pommel strikes
- **Granted Reactions:** Shield Block
- **Granted Ability:** Active Parry
- **Special:** Can make off-hand attacks with the buckler itself (treat as light weapon, 4 damage bludgeoning) using the two-weapon combat action.
- **Cost:** 10 gp

### Targe
- **Image:** `icons/equipment/shield/round-wood-reinforced.webp`
- **Description:** A round shield of moderate size, typically constructed from layered wood and leather with metal reinforcement at the rim and center. The targe is a versatile all-purpose shield that balances coverage with maneuverability, offering solid defense against both melee and ranged attacks without the encumbrance of heavier designs.
- **Shield Type:** Medium
- **Hand Usage:** Occupies off-hand completely.
- **Granted Ability:** Shield Defense
- **Granted Reactions:** Shield Block, Ranged Defense
- **Special:** Can be slung on back when not in use (takes 1 [Minor] action to ready).
- **Cost:** 10 gp

### Heater Shield
- **Image:** `icons/equipment/shield/heater-marked-red.webp`
- **Description:** A triangular shield with a flat top and tapered point, designed to protect the body from shoulder to mid-thigh while allowing full freedom of movement in the sword arm. The heater's shape provides excellent coverage against angled blows,
- **Shield Type:** Medium
- **Hand Usage:** Occupies off-hand completely
- **Granted Ability:** Shield Defense
- **Granted Reactions:** Shield Block, Ranged Defense
- **Special:** Can be slung on back when not in use (takes 1 [Minor] action to ready)
- **Cost:** 15 gp

### Kite Shield
- **Image:** `icons/equipment/shield/kite-steel-blue.webp`
- **Description:** A large elongated shield that extends from shoulder to knee, with a rounded top and a pointed lower section that evolved to protect a mounted warrior's legs. On foot the kite shield is cumbersome but offers exceptional coverage, and when the bearer crouches behind it, the point digs into the ground and provides a stable partial barricade.
- **Shield Type:** Heavy
- **Hand Usage:** Occupies off-hand completely
- **Granted Ability:** Fortune on defensive melee combat rolls
- **Granted Reactions:** Shield Block, Ranged Defense
- **Requirements:** Strength 3 minimum or suffer Misfortune on your own attacks
- **Special:** Provides Partial Cover when crouching
- **Cost:** 20 gp

### Tower Shield
- **Image:** `icons/equipment/shield/tower-wood-blue.webp`
- **Description:** An enormous rectangular or slightly curved shield large enough to shelter the bearer's entire body. Tower shields are not fighting tools so much as mobile fortifications. In open combat they are awkward and exhausting, demanding significant strength just to keep upright.
- **Shield Type:** Heavy
- **Hand Usage:** Occupies off-hand completely
- **Granted Ability:** Shield Defense
- **Granted Reactions:** Shield Block, Ranged Defense
- **Requirements:** Strength 4 minimum
- **Special:** Provides Full Cover when crouching
- **Cost:** 25 gp

### Pavise
- **Image:** `icons/equipment/shield/pavise-wood-steel.webp`
- **Description:** A freestanding shield large enough to shelter an archer or crossbowman entirely, designed to be planted in the ground and used as a portable wall rather than carried into melee. In planted mode the pavise transforms a section of open ground into a fortified firing position, providing full cover against ranged attacks from a single direction.
- **Shield Type:** Heavy
- **Hand Usage:** Requires both hands to move/position, but can be planted
- **Granted Ability:** Shield Defense
- **Granted Reactions:** Shield Block, Ranged Defense
- **Planted Mode:** Use 1 [Move] action to plant shield. While planted:
    - Provides full cover against ranged attacks from one direction (choose direction when planting)
    - Use 1 [Move] action to retrieve it from planted
- **Carried Mode:** Functions as Tower Shield but with Misfortune on your attacks
- **Requirements:** Strength 4 minimum
- **Special:** Primarily a siege/defensive weapon, awkward in mobile combat
- **Cost:** 40 gp

## Armor Types
---

#### Aketon/Light Padded
- **Image:** `icons/equipment/chest/coat-collared-red-gold.webp`
- **Description:** Layers of quilted linen or wool stitched tightly together, the aketon is the most accessible armor available to common soldiers and the starting point for most fighting careers. Cheap to produce, easy to wear for extended periods, and silent in movement, it offers modest protection against cuts and superior cushioning against blunt impacts. It is frequently worn beneath heavier armor to prevent chafing and absorb shock.
- **DR:** Slashing 2, Piercing 1, Bludgeoning 3
- **Cost:** 15 gp
- **Keyword:** [LightArmor]

#### Brigandine/Coat of Plates
- **Image:** `icons/equipment/chest/coat-collared-studded-red.webp`
- **Description:** Small rectangular plates of steel riveted to the inside of a fabric or leather coat, with the rivet heads visible on the exterior as rows of metal studs. The brigandine distributes protection broadly and evenly across the torso, providing consistent resistance to all physical damage types without the pronounced weaknesses of some other construction methods.
- **DR:** Slashing 6, Piercing 6, Bludgeoning 6
- **Cost:** 400 gp
- **Keyword:** [MediumArmor], [Noisy]

#### Chain Mail
- **Image:** `icons/equipment/chest/breastplate-scale-grey.webp`
- **Description:** Thousands of interlocking metal rings riveted together into a flexible mesh that drapes over the body like a heavy garment. Chain mail is excellent against slashing attacks, which struggle to find purchase between the rings, but offers less resistance to the focused point of a thrust or the concentrated impact of a crushing blow.
- **DR:** Slashing 6, Piercing 5, Bludgeoning 4
- **Cost:** 200 gp
- **Keyword:** [MediumArmor], [Noisy]

#### Gambeson
- **Image:** `icons/equipment/chest/breastplate-quilted-brown.webp`
- **Description:** A thicker, more heavily padded coat than the aketon, with additional quilted layers that provide meaningful protection in their own right. The gambeson excels at absorbing the crushing force of bludgeoning weapons. It remains popular with soldiers who cannot afford the expense of mail.
- **DR:** Slashing 4, Piercing 2, Bludgeoning 5
- **Cost:** 40 gp
- **Keyword:** [MediumArmor]

#### Leather Armor, Hardened
- **Image:** `icons/equipment/chest/breastplate-layered-leather-brown-silver.webp`
- **Description:** Hardened leather that has been boiled, shaped, and stiffened into rigid plates, offering significantly better protection than simple padded cloth while remaining light and silent. The cost reflects the skilled labor required to shape and harden the material properly.
- **DR:** Slashing 3, Piercing 2, Bludgeoning 4
- **Cost:** 200 gp
- **Keyword:** [LightArmor]

#### Plate, Full
- **Image:** `icons/equipment/chest/breastplate-cuirass-steel-grey.webp`
- **Description:** The pinnacle of the armorer's craft, a complete articulated harness of shaped steel plates covering the entire body from head to foot. Each piece is formed to deflect rather than simply absorb incoming force, and the articulated construction allows a surprising degree of movement once properly fitted. A suit requires a skilled armorer and represents a substantial investment,the cost alone places it beyond the reach of most soldiers. 
- **DR:** Slashing 9, Piercing 8, Bludgeoning 6
- **Cost:** 750 gp
- **Keyword:** [HeavyArmor], [Loud]

#### Scale Mail
- **Image:** `icons/equipment/chest/breastplate-metal-scaled-grey.webp`
- **Description:** Overlapping metal scales sewn or laced to a backing of leather or cloth, each scale riveted at the top and free to flex at the bottom. The overlapping arrangement provides solid coverage against slashing and reasonable resistance to thrusts. Scale mail is heavier than chain and similarly noisy, but its construction makes it easier to repair in the field.
- **DR:** Slashing 6, Piercing 5, Bludgeoning 4
- **Cost:** 250 gp
- **Keyword:** [MediumArmor], [Noisy]

#### Splint Mail
- **Image:** `icons/equipment/chest/breastplate-banded-steel-gold.webp`
- **Description:** Vertical strips of metal riveted to a backing of leather and mail, covering the major surfaces of the torso and limbs with rigid bands that resist both cutting and crushing force. Splint mail sits between chain and full plate in the hierarchy of protection being significantly more resistant to damage than mail while remaining more affordable and faster to don than a full harness.
- **DR:** Slashing 8, Piercing 7, Bludgeoning 6
- **Cost:** 500 gp
- **Keyword:** [HeavyArmor], [Loud]

