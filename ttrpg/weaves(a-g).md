# Weaves

## Using This Guide

Each weave entry includes:
**Primary Energy:** The energy that creates the core effect
**Supporting Energy:** Optional energies for range, area, or duration
**Base Cost:** Typical energy point investment
**Action Cost:** Simple (1 action) or Complex (2 actions)
**Description:** What the weave does and how it scales with successes
**Applies Effects:** (Optional) Draggable effect IDs that can be applied from this weave

**Note on Applies Effects:** When specified, this weave creates draggable effects in the chat card. Format: `effect-id (param=value)` or multiple with semicolons. Examples:
- `haste` - Simple effect reference
- `dr-bonus (value=2)` - Effect with parameter
- `flight; invisibility` - Multiple effects

**Remember:** You can adjust energy expenditure to increase damage, range, area, or duration. Overspending beyond your Mastery adds penalties.

### Notes on Weave Design
Energy costs can be adjusted by weavers (spend more for more damage, larger area, etc.)
Success scaling shows what happens at different weaving success levels
Complex weaves (2 actions) are typically save-based or have area effects
Simple weaves (1 action) are typically direct effects or touch range
Weavers can combine energies creatively
Increase Damage: Spend 2 more Energy per damage tier (8/16/24/32)
Increase Range: +1 Energy per range increment (Touch/Close/Medium/Long)
Increase Area: +1 Energy per area increase (single, 2 targets/10ft. 4 targets/20ft, 6 targets/30ft)
Increase Duration: +1 Energy per duration step (instant/1 round/1minute/10 minutes/1 hour)
Overspending Penalty Remember: Spending Energy beyond your Mastery in that energy type adds +1 to both dice per point over. Plan your weaves within your capabilities or accept the penalty for heroic moments!
These weaves are guidelines. Work with your GM to create unique effects by combining energies in new ways. The eight energies are tools

<!-- PACK:weaves -->
## A

### Acid Blast
**Primary Energy:** Water 2 (acidic vapor damage)
**Supporting Energy:** Space 1 (close range 30ft)
**Range:** Close, 30 ft.  
**Duration:** Instantaneous
**Total Cost:** 3 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Water Potential + Water Mastery / Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Water Mastery
**Description:** Single-target ranged attack. Target takes 8 acid damage.
**Applies Effects:** sickened
**Saving Throw:** None
**Damage Type:** Acid
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Miss
- 1 = Half damage (4)
- 2 = Full damage (8)  
- 3 = Enhanced damage (16) + applies Sickened

### Banishment
**Primary Energy:** Space 6 (forcibly ejecting to another plane)
**Supporting Energy:** Time 2 (duration 1 minute)
**Range:** Medium, 60 ft.  
**Duration:** 1 minute
**Total Cost:** 8 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Space Potential + Space Mastery / Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** Target at medium range makes Will save. Calculate net successes (targeting - save). If you have more net successes, extraplanar creatures are sent to their home plane. Native creatures are sent to a harmless demiplane. Target reappears when weave ends.
**Saving Throw:** Will
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 minute
- 3 = 10 minutes 

### Barkward
**Primary Energy:** Earth 4 (hardening skin like tree bark)
**Supporting Energy:** Time 2 (duration 1 minute)
**Range:** Touch, self  
**Duration:** 1 minute
**Total Cost:** 6 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Earth Potential + Earth Mastery / Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Earth Mastery
**Description:** Target's DR increases by 4 (doesn't stack with armor). Touch range by default.
**Applies Effects:** dr-bonus (value=4)
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 minute
- 3 = 10 minutes

### Beast Courier
**Primary Energy:** Positive 3 (animating natural creature with purpose)  
**Supporting Energy:** Space 6 (close range + 24 hours with 1-min casting reduction)  
**Range:** Close, 30 ft.  
**Duration:** Up to 24 hours  
**Total Cost:** 9 Energy  
**Action:** Complex weave (2 actions), requires 1 minute to cast  
**Weaving Roll:** Positive Potential + Positive Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Positive Mastery
**Description:** Target one Tiny beast you can see within close range. The beast travels to a location you specify (must be familiar to you) and delivers a message of up to 25 words to a creature you describe. The beast travels at 50 miles per day (fly) or 25 miles per day (ground).  
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 12 hours
- 2 = 24 hours
- 3 = 48 hours

### Beastial Transformation
**Primary Energy:** Space 7 (transforming into another creature, major transformation, 30 ft. range)
**Supporting Energy:** Time 3 (duration up to 10 minutes)
**Range:** Touch or self  
**Duration:** 10 minutes
**Total Cost:** 10 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Space Potential + Space Mastery / Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** Transform touched creature into a beast. Target gains beast's HP (temporary), physical stats, and abilities. Keeps mental stats and personality. Unwilling targets get Fortitude save. Compare your Targeting successes to their save successes. Reverts when reaching 0 HP or weave ends (returns to previous HP total).
**Saving Throw:** Fortitude
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 minute
- 2 = 10 minutes
- 3 = 1 hour

### Beguiling Weave
**Primary Energy:** Positive 2 (creating friendly feelings, minor mental effect)  
**Supporting Energy:** Space 5 (close range + 1 hour)  
**Range:** Close, 30 ft.  
**Duration:** 1 hour  
**Total Cost:** 7 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Positive Potential + Positive Mastery / Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Positive Mastery
**Description:** Humanoid target makes Will save. Compare your weaving successes to their save successes. If you have more, target regards you as a friendly acquaintance. Lasts 1 hour or until you or allies harm target. Target knows it was charmed when weave ends.  
**Applies Effects:** charmed
**Saving Throw:** Will
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 hour
- 3 = 4 hours

### Bind the Fallen **[Necromantic]**
**Primary Energy:** Negative 6 (binding soul fragments to corpses)
**Supporting Energy:** Time 4 (duration 1 hour of control)
**Range:** Touch
**Duration:** 1 hour
**Total Cost:** 10 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Negative Potential + Negative Mastery / Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Negative Mastery
**Description:** **[FORBIDDEN KNOWLEDGE]** Bind soul fragments or echoes to 1 corpse, animating it as a skeleton or zombie under your control. Undead has HP equal to your Negative Potential × 4, deals 6 damage, uses your Negative Mastery for attacks. Can command as [Free] action.
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 hour
- 3 = 4 hours

### Binding Paralysis
**Primary Energy:** Space 7 (paralysis + close range)  
**Supporting Energy:** Time 2 (duration 1 minute)  
**Range:** Close, 30 ft.  
**Duration:** 1 minute  
**Total Cost:** 9 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Space Potential + Space Mastery / Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** Humanoid target at close range makes Will save. Compare your weaving successes to their save successes. If you have more, target is Paralyzed. Target can repeat save at end of each turn to break free (1 success ends effect).  
**Applies Effects:** paralyzed
**Saving Throw:** Will
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 minute
- 3 = 10 minutes

### Breach
**Primary Energy:** Space 2 (forcing locks and barriers open)
**Supporting Energy:** Space 1 (close range 30ft, instantaneous)
**Range:** Close, 30 ft.  
**Duration:** Instantaneous
**Total Cost:** 3 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** One locked door, window, gate, chest, or similar object becomes unlocked. Removes Arcane Lock. Creates a loud bang audible up to 300 feet away.
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Fails
- 2 = Opens
- 3 = Opens (silent)

### Calm Emotions
**Primary Energy:** Positive 4 (soothing emotional turmoil)  
**Supporting Energy:** Space 6 (medium range + 20ft radius + 1 minute)  
**Range:** Medium, 60 ft. (20-foot radius sphere)  
**Duration:** 1 minute  
**Total Cost:** 10 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Positive Potential + Positive Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Positive Mastery
**Description:** All creatures in a 20-foot radius sphere at medium range must make Will saves. Compare your weaving successes to each target's save successes. Those you beat can choose to be affected (suppressing Charmed or Frightened) or you can suppress hostility (they become indifferent if not directly threatened). Creatures immune to charm are immune to this weave.  
**Saving Throw:** Will
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 minute
- 3 = 10 minutes

### Chain Lightning
**Primary Energy:** Air 7 (arcing electricity, high damage)
**Supporting Energy:** Space 3 (medium range 60ft + 4 targets)
**Range:** Medium, 60 ft.  
**Duration:** Instantaneous
**Total Cost:** 10 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Air Potential + Air Mastery + Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Air Mastery
**Description:** Lightning arcs to 4 targets within range (first target, then 3 others within 30ft of previous). Each target makes their own Reflex save. Calculate net successes for each target.
**Applies Effects:** stunned
**Saving Throw:** Reflex
**Damage Type:** Lightning (energy)
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = miss
- 1 = Half damage (20)
- 2 = Full damage (40)
- 3 = Enhanced damage (48) + applies Stunned

### Command
**Primary Energy:** Negative 2 (imposing your will through compulsion)  
**Supporting Energy:** Space 1 (close range)  
**Range:** Close, 30 ft.  
**Duration:** Instantaneous  
**Total Cost:** 3 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Negative Potential + Negative Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Negative Mastery
**Description:** Speak a one-word command to a creature you can see within close range. Target makes Will save. Compare your weaving successes to their save successes. If you have more, target follows the command on their next turn. Commands: Approach, Drop, Flee, Grovel (prone), Halt (no actions). Cannot command self-harm. Creatures immune to charm are immune.  
**Saving Throw:** Will
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Fails
- 2 = 1 round
- 3 = 2 rounds

### Commune with Dead **[Necromantic]**
**Primary Energy:** Negative 4 (forcing communion with departed soul)
**Supporting Energy:** Time 2 (duration of questioning, 1 minute)
**Range:** Touch
**Duration:** 1 minute
**Total Cost:** 6 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Negative Potential + Negative Mastery + Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Negative Mastery
**Description:** **[FORBIDDEN KNOWLEDGE]** Force brief communion with the departed soul of a corpse (dead no more than 10 days) at touch. Can ask up to 3 questions. Corpse can only answer what it knew in life. Answers are usually brief, cryptic, or repetitive. Same corpse can't be questioned this way again for 10 days.
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 2 questions
- 2 = 3 questions
- 3 = 4 questions

### Complex Illusion
**Primary Energy:** Space 6 (complex illusion + medium range + 20ft cube area)  
**Supporting Energy:** Time 3 (duration 10 minutes)  
**Range:** Medium, 60 ft. (20-foot cube)  
**Duration:** 10 minutes  
**Total Cost:** 9 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Space Potential + Space Mastery / Time Potential + Time Mastery  
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** Create an illusion of an object, creature, or phenomenon within a 20-foot cube at medium range. The illusion includes sight, sound, smell, and temperature effects. Physical interaction reveals it as an illusion.  
**Saving Throw:** Perception vs Space Mastery
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 minute
- 2 = 10 minutes
- 3 = 1 hour

### Comprehend Languages
**Primary Energy:** Air 2 (understanding spoken communication)  
**Supporting Energy:** Time 4 (duration 1 hour)  
**Range:** Self  
**Duration:** 1 hour  
**Total Cost:** 6 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Air Potential + Air Mastery / Time Potential + Time Mastery  
**Targeting Roll:** Casting Stat + Air Mastery
**Description:** For the duration, you understand the literal meaning of any spoken language you hear. You also understand written languages you see, but must touch the surface on which words are written. Reading takes about 1 minute per page.  
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 10 minutes
- 2 = 1 hour
- 3 = 4 hours

### Confusion
**Primary Energy:** Negative 6 (mental chaos and discord)  
**Supporting Energy:** Space 5 (medium range + 10ft radius + 1 minute)  
**Range:** Medium, 60 ft. (10-foot radius)  
**Duration:** 1 minute  
**Total Cost:** 11 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Negative Potential + Negative Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Negative Mastery
**Description:** All creatures in 10-foot radius sphere at medium range make Will saves. Compare your Targeting successes to each target's save successes. Those you beat are confused. At the start of each confused creature's turn, roll 1d8: 1-2 = do nothing, 3-4 = no action and move random direction, 5-6 = attack nearest creature, 7-8 = act normally. Can repeat save at end of each turn (1 success ends effect). Creatures immune to charm are immune to this weave.
**Saving Throw:** Will
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 minute
- 3 = 1 minute (20-foot radius)

### Conjure Water
**Primary Energy:** Water 2 (conjuring clean water)  
**Supporting Energy:** Space 1 (close range)  
**Range:** Close, 30 ft.  
**Duration:** Instantaneous  
**Total Cost:** 3 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Water Potential + Water Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Water Mastery
**Description:** Create up to 10 gallons of clean water in an open container. Or create rain in 30ft cube that extinguishes open flames.  
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 5 gallons
- 2 = 10 gallons
- 3 = 20 gallons

### CounterWeave
**Primary Energy:** Space 4 (disrupting magical energy)
**Supporting Energy:** None (medium range 60ft, reaction)
**Range:** Medium, 60 ft.  
**Duration:** Instantaneous
**Total Cost:** 4 Energy base (must match or exceed target weave cost)
**Action:** Reaction (when you see a weave being cast)
**Weaving Roll:** Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** Attempt to interrupt a weave being cast. Make an arcana check to determine the weave being cast. Must spend Energy equal to or greater than the weave you're countering. Compare your Targeting successes to their weaving successes. If you have more, their weave fails.
**Applies Effects:** dazed
**Saving Throw:** Opposed weaving check
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Reduce target spell by 1 success
- 2 = Counter successful
- 3 = Counter successful (regain 4 energy)

### Cutting Words
**Primary Energy:** Negative 2 (psychic assault through cruel words)  
**Supporting Energy:** Space 2 (medium range)  
**Range:** Medium, 60 ft.  
**Duration:** Instantaneous  
**Total Cost:** 4 Energy  
**Action:** Complex weave (2 actions)
**Weaving Roll:** Negative Potential + Negative Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Negative Mastery
**Description:** Speak cutting words at one creature you can see within medium range. Target takes 4 psychic damage and makes Will save. Compare your targeting successes to their save successes. If you have more, target adds 1 to their next attack roll before end of their next turn.  
**Saving Throw:** Will
**Damage Type:** Psychic (mental)  
**DR Interaction:** Ignore
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Half damage (2)
- 2 = Full damage (4) + penalty on attack
- 3 = Enhanced damage (8) + penalty on attack

### Death's Touch **[Necromantic]**
**Primary Energy:** Negative 8 (pure death energy combined with soul binding)
**Supporting Energy:** Space 2 (medium range 60ft)
**Range:** Medium, 60 ft.  
**Duration:** Instantaneous
**Total Cost:** 10 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Negative Potential + Negative Mastery + Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Negative Mastery
**Description:** Target takes 40 negative damage. Target makes Fortitude save to reduce. If reduced to 0 HP by this weave, target dies and rises as a zombie under your control after 1 minute.
**Saving Throw:** Fortitude
**Damage Type:** Negative (energy)
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Half damage (20)
- 2 = Full damage (40)
- 3 = Enhanced damage (48)

### Dimensional Refuge
**Primary Energy:** Space 4 (creating extradimensional space)
**Supporting Energy:** Time 3 (duration 10 minutes)
**Range:** Touch
**Duration:** 10 minutes
**Total Cost:** 7 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Space Potential + Space Mastery + Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** Touch a surface to create an extradimensional space holding up to 8 Medium creatures. The surface may be closed like a door. From outside door and the space are invisible. Space holds up to 12 hours of air.
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 minute
- 2 = 10 minutes
- 3 = 1 hour

### Disintegrate
**Primary Energy:** Negative 8 (reducing matter to dust, extreme damage)
**Supporting Energy:** Space 2 (medium range 60ft)
**Range:** Medium, 60 ft.  
**Duration:** Instantaneous
**Total Cost:** 10 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Negative Potential + Negative Mastery + Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Negative Mastery
**Description:** Target takes 40 negative damage. Target makes Fortitude save to reduce. If reduced to 0 HP by this weave, target is disintegrated (turned to dust). Only resurrection magic can restore them.
**Saving Throw:** Fortitude
**Damage Type:** Negative (energy)
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Half damage (20)
- 2 = Full damage (40)
- 3 = Enhanced damage (48)

### Disk of Force
**Primary Energy:** Space 3 (force platform)
**Supporting Energy:** Time 3 (duration 10 minutes)
**Range:** Self
**Duration:** 10 minutes
**Total Cost:** 6 Energy
**Action:** Complex weave (1 action)
**Weaving Roll:** Space Potential + Space Mastery + Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** Create a 3-foot diameter horizontal disk of force that floats 3 feet above ground. Holds up to 500 lbs and follows you at a distance of 20 feet. Can't move more than 30 feet from you or it ends.
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 minute
- 2 = 10 minutes
- 3 = 1 hour

### Earthquake
**Primary Energy:** Earth 8 (major terrain disruption)  
**Supporting Energy:** Space 7 (medium range + 50ft radius + 1 minute)  
**Range:** Medium, 60 ft. (50-foot radius)  
**Duration:** 1 minute  
**Total Cost:** 15 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Earth Potential + Earth Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Earth Mastery
**Description:** Ground shakes violently in area. All creatures make Reflex save. Compare your weaving successes to their save successes. If you have more, creatures fall Prone. Structures may collapse (GM discretion). Area becomes difficult terrain.  
**Applies Effects:** prone
**Saving Throw:** Reflex
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Prone (1 round, 25ft radius)
- 2 = Prone (1 minute, 50ft radius)
- 3 = Prone (1 minute, 100ft radius)

### Ethereal Shift
**Primary Energy:** Space 7 (shifting to ethereal plane)
**Supporting Energy:** Time 4 (duration 1 hour)
**Range:** Self, touch
**Duration:** 1 hour
**Total Cost:** 9 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Space Potential + Space Mastery + Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** You step into the border of the Ethereal Plane. You can see and hear the material plane (dim and muted). Can move through objects and creatures. Cannot affect or be affected by anything on material plane. Can end early as [Free] action.
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 minute
- 2 = 1 hour
- 3 = 4 hours

### Extraplanar Binding
**Primary Energy:** Space 6 (binding extraplanar creature, major binding)
**Supporting Energy:** Time 4 (duration 1 hour or until service completed)
**Range:** Close, 30 ft.  
**Duration:** 1 hour
**Total Cost:** 10 Energy
**Action:** Complex weave (2 actions), takes 1 hour to cast
**Targeting Roll:** Casting Stat + Space Mastery
**Weaving Roll:** Space Potential + Space Mastery + Time Potential + Time Mastery
**Description:** Bind one extraplanar creature (celestial, elemental, fey, fiend) at close range (30ft) to your service. Creature makes Will save. Compare your targeting successes to their save successes. If you have more, creature must serve you for duration or until completing one task. Must negotiate payment/service.
**Saving Throw:** Will
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 10 minutes
- 2 = 1 hour
- 3 = 4 hours

### Fear
**Primary Energy:** Negative 5 (projecting terror, mental effect)  
**Supporting Energy:** Space 4 (30ft cone + 1 minute)  
**Range:** 30ft. cone  
**Duration:** 1 minute  
**Total Cost:** 9 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Negative Potential + Negative Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Negative Mastery
**Description:** All creatures in cone make Will saves. Compare your targeting successes to each target's save successes. Based on net successes: 1 = Frightened, 2 = Fleeing, 3+ = Cowering. Creatures can make saves at end of turn to downgrade/end (1 success downgrades or ends).  
**Applies Effects:** frightened; fleeing
**Saving Throw:** Will
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Frightened (1 round)
- 2 = Frightened (1 minute)
- 3 = Fleeing (1 minute)

### Fire Bolt
**Primary Energy:** Fire 2 (bolt of flame, damage)  
**Supporting Energy:** Space 1 (close range)  
**Range:** Close, 30 ft.  
**Duration:** Instantaneous  
**Total Cost:** 3 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Fire Potential + Fire Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Fire Mastery
**Description:** You hurl a mote of fire at a creature or object within range. Target takes 8 fire damage. This is an attack weave—no saving throw allowed.  
**Applies Effects:** ignited
**Saving Throw:** None
**Damage Type:** Fire (energy)  
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Miss
- 1 = Half damage (4)
- 2 = Full damage (8)
- 3 = Enhanced damage (16) + ignited

### Fireball
**Primary Energy:** Fire 5 (exploding ball of flame, damage)
**Supporting Energy:** Space 4 (medium range 60ft + area 20ft radius)
**Range:** Medium, 60 ft.  
**Duration:** Instantaneous
**Total Cost:** 9 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Fire Potential + Fire Mastery + Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Fire Mastery
**Description:** A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. All creatures in a 20-foot radius sphere take 28 fire damage. Each target takes the full listed damage and makes their own save.
**Applies Effects:** ignited
**Saving Throw:** Reflex
**Damage Type:** Fire (energy)
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Half damage (14)
- 2 = Full damage (28)
- 3 = Enhanced damage (36) + ignited

### Fire Burst
**Primary Energy:** Fire 2 (burst of flame from palm, damage)
**Supporting Energy:** None (touch to 5ft range)
**Range:** Touch
**Duration:** Instantaneous
**Total Cost:** 2 Energy
**Action:** Simple weave (1 action)
**Weaving Roll:** Fire Potential + Fire Mastery
**Targeting Roll:** Casting Stat + Fire Mastery
**Description:** Channel flames through your palm to burn a target within 5 feet. Target takes 4 fire damage. This is an attack weave—no saving throw allowed.
**Applies Effects:** ignited
**Saving Throw:** None
**Damage Type:** Fire (energy)
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Half damage (2)
- 2 = Full damage (4)
- 3 = Enhanced damage (8)

### Flame Burst
**Primary Energy:** Fire 3 (cone of flames, damage)
**Supporting Energy:** Space 1 (self, 15ft cone affecting 2 targets)
**Range:** 15ft cone
**Duration:** Instantaneous
**Total Cost:** 4 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Fire Potential + Fire Mastery + Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Fire Mastery
**Description:** A cone of flames shoots from your hands. All creatures in a 15-foot cone take 16 fire damage. Each target takes the full listed damage and makes their own save.
**Applies Effects:** ignited
**Saving Throw:** Reflex
**Damage Type:** Fire (energy)
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Half damage (8)
- 2 = Full damage (16)
- 3 = Enhanced damage (24) + ignited

### Floating Lights
**Primary Energy:** Fire 2 (creating floating lights, minor effect)  
**Supporting Energy:** Space 4 (medium range + 1 minute)
**Range:** Medium, 60 ft.  
**Duration:** 1 minute
**Total Cost:** 6 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Fire Potential + Fire Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Fire Mastery
**Description:** Create up to 4 torch-sized lights at medium range that hover and shed dim light in 10ft radius. Can move lights up to 60 feet as [Free] action.  
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 minute
- 3 = 10 minutes

### Fly
**Primary Energy:** Air 5 (levitation and propulsion, flight)
**Supporting Energy:** Time 3 (duration 10 minutes)
**Range:** Self, touch
**Duration:** 10 minutes
**Total Cost:** 8 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Air Potential + Air Mastery + Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Air Mastery
**Description:** Target at touch gains flying speed equal to their normal movement speed. If weave ends while airborne, target falls.
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 minute
- 2 = 10 minutes
- 3 = 1 hour

### Force Armor
**Primary Energy:** Space 3 (force armor)
**Supporting Energy:** Time 4 (duration 1 hour)
**Range:** Self, touch
**Duration:** 1 hour
**Total Cost:** 7 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Space Potential + Space Mastery + Time Potential + Time Mastery
**Targeting Roll:** Casting Stat + Space Mastery
**Description:** Target at touch gains DR 5 (doesn't stack with worn armor). Counts as no armor for purposes of Acrobatic Defense and similar abilities.
**Applies Effects:** dr-bonus (value=5)
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 10 minutes
- 2 = 1 hour
- 3 = 4 hours

### Fortune's Favor
**Primary Energy:** Positive 3 (divine blessing)  
**Supporting Energy:** Space 5 (close range + 3 targets + 1 minute)  
**Range:** Close, 30 ft.  
**Duration:** 1 minute  
**Total Cost:** 8 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Positive Potential + Positive Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Positive Mastery
**Description:** Up to 3 targets subtract 1 from one die (their choice) on each roll they make.  
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 minute
- 3 = 10 minutes

### Freezing Blast
**Primary Energy:** Water 6 (freezing blast, high damage)
**Supporting Energy:** Space 3 (60ft cone)
**Range:** 60ft cone
**Duration:** Instantaneous
**Total Cost:** 9 Energy
**Action:** Complex weave (2 actions)
**Weaving Roll:** Water Potential + Water Mastery + Space Potential + Space Mastery
**Targeting Roll:** Casting Stat + Water Mastery
**Description:** A blast of cold air erupts from your hands. All creatures in a 60-foot cone take 40 cold damage. Each target takes the full listed damage and makes their own save.
**Applies Effects:** slowed
**Saving Throw:** Reflex
**Damage Type:** Cold (energy)
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Half damage (20)
- 2 = Full damage (40)
- 3 = Enhanced damage (48)  + Slowed

### Frost Touch
**Primary Energy:** Water 2 (freezing touch, damage)
**Supporting Energy:** None (touch range only)
**Range:** Touch
**Duration:** Instantaneous
**Total Cost:** 2 Energy
**Action:** Simple weave (1 action)
**Weaving Roll:** Water Potential + Water Mastery
**Targeting Roll:** Casting Stat + Water Mastery
**Description:** Touch a target and channel freezing energy into them. Target takes 4 cold damage. This is an attack weave—no saving throw allowed.
**Saving Throw:** None
**Damage Type:** Cold (energy)
**DR Interaction:** Half DR
**Targeting Success Scaling:**
- 0 = Fails
- 1 = Half damage (2)
- 2 = Full damage (4)
- 3 = Enhanced damage (8)

### Gentle Descent
**Primary Energy:** Air 2 (slowing fall with updraft)  
**Supporting Energy:** Space 5 (close range + 5 creatures + up to 1 minute)  
**Range:** Close, 30 ft.  
**Duration:** Up to 1 minute (until they land)  
**Total Cost:** 7 Energy  
**Action:** [Reaction] when you or creature within close range falls  
**Weaving Roll:** Air Potential + Air Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Air Mastery
**Description:** Up to 5 falling creatures within close range descend 60 feet per round and take no falling damage. Weave lasts until they land (up to 1 minute).  
**Saving Throw:** None
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 creature
- 2 = 5 creatures
- 3 = 10 creatures


### Grasping Vines
**Primary Energy:** Earth 3 (animating plants to restrain)  
**Supporting Energy:** Space 6 (medium range + 20ft square + 1 minute)  
**Range:** Medium, 60 ft. (20-foot square)  
**Duration:** 1 minute  
**Total Cost:** 9 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Earth Potential + Earth Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Earth Mastery
**Description:** Plants in area animate and grasp at creatures. Creatures in area when cast or entering make Reflex save. Compare your targeting successes to their save successes. If you have more, target becomes Restrained (reflex save). Repeat save at end of affected player turn (1 success ends effect).  
**Applies Effects:** restrained
**Saving Throw:** Reflex
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round (10ft square)
- 2 = 1 minute (20ft square)
- 3 = 10 minutes (30ft square)

### Grease
**Primary Energy:** Water 2 (slippery oil/grease, effect)  
**Supporting Energy:** Space 4 (close range + 10ft square + 1 minute)  
**Range:** Close, 30 ft. (10-foot square)  
**Duration:** 1 minute  
**Total Cost:** 6 Energy  
**Action:** Complex weave (2 actions)  
**Weaving Roll:** Water Potential + Water Mastery / Space Potential + Space Mastery  
**Targeting Roll:** Casting Stat + Water Mastery
**Description:** Area becomes slippery difficult terrain. Creatures entering or starting turn in area make Reflex save or fall Prone. Those running must save or fall. Compare your targeting successes to their save successes.  
**Saving Throw:** Reflex
**Targeting Success Scaling:**
- 0 = Fails
- 1 = 1 round
- 2 = 1 minute
- 3 = 10 minutes (20ft square)
