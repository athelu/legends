## Action Types
### Combat Actions
Combat actions represent attacks, weaves, and tactical maneuvers used to engage enemies.

#### Basic Combat Mechanics:
- **Multiple Action Penalty:** Using multiple [Combat] actions in a turn adds cumulative penalties
  - First [Combat] action: Normal
  - Second [Combat] action: Add 1 to both die results
  - Third [Combat] action: Add 2 to both die results
- **Action Cost:** Most combat actions cost 1-2 actions as specified
- **Targeting:** You must be able to perceive your target (see Blinded condition for penalties)

#### Multiple Action Penalty Examples:
- Attack, then Attack again, then Move: First attack normal, second attack +1 to both dice
- Cast Simple Weave, Attack: Weave normal, attack +1 to both dice
- Cast Complex Weave (2 actions), Attack: Weave normal, attack +1 to both dice

### Standard Combat Actions

All characters have access to these combat options:

##### Melee Attack [Combat]
- **Cost:** 1 [Combat] action
- **Requirements:** Target must be within your melee reach (typically 5 feet)
- **Effect:** Make an opposed attack roll (Agility + Melee Combat vs opponent's Agility + Melee Combat)
- **Damage on Success:**
  - Margin 0 (Tie): Defender wins, no damage
  - Margin 1: Base weapon damage
  - Margin 2+: Base weapon damage + Strength modifier
- **Notes:**
  - Uses Agility + Melee Combat skill
  - Subject to Multiple Action Penalty
  - Can be modified by combat maneuvers (see below)

##### Ranged Attack [Combat]
- **Cost:** 1 [Combat] action
- **Requirements:** Ranged weapon, target within range
- **Effect:** Make an attack roll (Dexterity + Ranged Combat)
- **Range Bands:**
  - **Short range:** 1 success needed for base damage, 2 successes for base + Dexterity modifier
  - **Medium range:** 2 successes needed for base + Dexterity modifier
  - **Long range:** 2 successes needed, Add 1 to both die results
- **Shooting into Melee:** Add 1 to both die results (unless you have Precise Shot feat)
- **Notes:**
  - Unopposed roll (target doesn't roll defense)
  - Subject to Multiple Action Penalty
  - Making a ranged attack while threatened (enemy within 5 feet) has Misfortune

##### Simple Weave [Combat]
- **Cost:** 1 [Combat] action
- **Requirements:** Ability to weave, sufficient Energy
- **Range:** Typically touch or close range (30 feet)
- **Effect:** Cast a single-energy weave or basic effect
- **Examples:** Fire Bolt, Healing Word, Mage Hand, Light
- **Weaving Roll:** Primary Energy Potential + Primary Energy Mastery (2d8)
- **Notes:**
  - Subject to Multiple Action Penalty
  - See Part 7 (Magic System) for full weaving rules
  - Simple weaves are single-target or basic effects

##### Complex Weave [Combat]
- **Cost:** 2 [Combat] actions
- **Requirements:** Ability to weave, sufficient Energy
- **Effect:** Cast a multi-energy weave with range, area, or duration
- **Examples:** Fireball, Cure Wounds, Hold Person, Invisibility
- **Weaving Roll:** Primary Potential + Primary Mastery + Supporting Potential + Supporting Mastery (4d8)
- **Notes:**
  - Counts as ONE combat action for Multiple Action Penalty purposes (even though it costs 2 actions)
  - See Part 7 (Magic System) for full weaving rules
  - Complex weaves typically have area effects, require saves, or affect range/duration

### Weaving While Threatened

##### Opportunity Attacks from Weaving:
- **Simple Weaves (1 action):** Don't provoke Opportunity Attacks - these are quick, instinctive magical effects
- **Complex Weaves (2 actions):** Provoke Opportunity Attacks - these require concentration, gestures, and time

##### Tactical Options:
- Use Disengage action before casting a Complex Weave
- Use Simple Weaves when in melee
- Position yourself before combat to avoid being threatened
- Have allies protect you while weaving

##### Channel Divinity [Combat]
- **Cost:** 2 [Combat] actions
- **Requirements:** Divine Gift advantage
- **Range:** 30-foot radius centered on you
- **Effect:** Automatically succeeds for Heal/Harm intents (see Part 7 for full details)
- **Types:** Heal, Harm, Turn (undead), Command (undead)
- **Energy Cost:** Minimum 4 Energy, can spend more
- **Notes:**
  - Counts as ONE combat action for Multiple Action Penalty purposes
  - Indiscriminate area effect (affects friends and foes)
  - See Part 7 (Magic System) for Channel Divinity details

### Combat Maneuvers

These maneuvers modify or replace your standard attacks:

##### Called Shot [Combat]
- **Cost:** 1 [Combat] action (replaces normal attack)
- **Effect:** Add 1 to both attack die results, but on hit choose one:
  - Bypass half DR (rounded down)
  - Apply specific condition (Bleeding, Dazzled, etc. - GM approval required)
- **Notes:**
  - Declare before rolling
  - Subject to Multiple Action Penalty
  - Higher risk, higher reward

##### Power Attack [Combat]
- **Cost:** 1 [Combat] action (replaces normal attack)
- **Requirements:** Power Attack feat, Str 4, Melee 3
- **Effect:** Add 1 to both attack die results, but deal +1d8 bonus damage on hit
- **Notes:**
  - Declare before rolling
  - Subject to Multiple Action Penalty
  - Only works with melee attacks

##### Disarm Attempt [Combat]
- **Cost:** 1 [Combat] action (replaces normal attack)
- **Effect:** Make normal attack roll against opponent
- **Success:**
  - Margin 1: No damage, target drops one held item (your choice)
  - Margin 2+: Base weapon damage AND target drops item
- **Notes:**
  - Declare before rolling
  - Subject to Multiple Action Penalty
  - Target must be holding the item

##### Trip Attempt [Combat]
- **Cost:** 1 [Combat] action (replaces normal attack)
- **Effect:** Make normal attack roll against opponent
- **Success:**
  - Margin 1: No damage, target falls Prone
  - Margin 2+: Base weapon damage AND target falls Prone
- **Notes:**
  - Declare before rolling
  - Subject to Multiple Action Penalty
  - Target must be no more than one size larger than you

##### Shove [Combat]
- **Cost:** 1 [Combat] action
- **Effect:** Make opposed Athletics check (Strength + Athletics vs target's Athletics or Acrobatics)
- **Success:** Push target 5 feet away from you OR knock them Prone (your choice)
- **Notes:**
  - Target must be no more than one size larger than you
  - Subject to Multiple Action Penalty
  - Doesn't deal damage

##### Grapple [Combat]
- **Cost:** 1 [Combat] action
- **Effect:** Make opposed Athletics check (Strength + Athletics vs target's Athletics or Acrobatics)
- **Success:** Target becomes Grappled (see Conditions)
- **Notes:**
  - Requires at least one free hand
  - You are also grappling (can't move unless you drag target)
  - Target can use action to attempt escape (opposed check)
  - Subject to Multiple Action Penalty

##### Two-Weapon Fighting [Combat]
- **Cost:** 1 [Combat] action for both attacks
- **Requirements:** Wielding two weapons, off-hand weapon must have Light property
- **Without Feat:**
  - Use Shared Attribute Roll (roll attribute once for both attacks)
  - First attack: Add 1 to both die results
  - Second attack: Add 2 to both die results
- **With Two-Weapon Fighting Feat:**
  - First attack: Normal (no penalty)
  - Second attack: Add 1 to both die results
- **Notes:**
  - Both attacks made as part of single [Combat] action
  - Subject to Multiple Action Penalty if you make additional combat actions
  - See Part 6 (Combat) for detailed examples

##### Opportunity Attack [Combat] (Reaction)
- **Cost:** Your reaction for the round
- **Trigger:** A hostile creature you can see moves out of your melee reach
- **Effect:** Make one melee attack against the triggering creature
- **Notes:**
  - See Reactions section for full details
  - Movement within reach doesn't trigger
  - Doesn't count toward Multiple Action Penalty (it's a reaction, not on your turn)

### Special Combat Actions

##### Ready an Action [Combat]
- **Cost:** 1 or 2 actions (depending on what you're readying)
- **Effect:** Choose a trigger and an action. When the trigger occurs before your next turn, you can use your reaction to perform the readied action
- **Examples:**
  - "I ready an attack for when the orc comes through the door" (1 action)
  - "I ready a Fireball for when enemies cluster together" (2 actions)
- **Notes:**
  - You must specify the trigger clearly
  - If trigger doesn't occur, the action is lost
  - Performing the readied action uses your reaction
  - Readied weaves that aren't used still consume Energy

##### Aid Another [Combat]
- **Cost:** 1 [Combat] action
- **Effect:** Make a skill check to help an ally with their action
- **Success (1+):** Your ally gains Fortune on their next roll for that task
- **Notes:**
  - Must be able to meaningfully help (GM discretion)
  - Can aid attacks, skill checks, or other actions
  - Subject to Multiple Action Penalty

##### Feint [Combat]
- **Cost:** 1 [Combat] action
- **Effect:** Make opposed Deception check (Charisma + Deception vs target's Empathy + Wisdom)
- **Success:** Your next attack against that target this turn has Fortune
- **Notes:**
  - Only works against creatures that can see and understand you
  - Subject to Multiple Action Penalty

##### Total Defense [Combat]
- **Cost:** All 3 of your actions
- **Effect:** Focus entirely on defense until your next turn
- **Benefit:** All attacks against you have Misfortune
- **Notes:**
  - Cannot take any other actions this turn
  - Can still take your reaction
  - Useful when severely wounded or retreating

### Important Clarifications

**You cannot:**
- Make attacks of opportunity on your own turn
- Use [Combat] actions if you're Unconscious, Paralyzed, or Stunned
- Target creatures you cannot perceive (unless using specific senses or abilities)

**You can:**
- Mix [Combat] actions with [Move], [Activate], and [Interact] actions freely
- Take multiple [Combat] actions, but each adds to the penalty
- Delay effects of the Multiple Action Penalty don't stack with other sources that add to die results
- Choose not to attack even when you could

**Multiple Action Penalty applies to:**
- All actions with the [Combat] keyword
- Stacks cumulatively throughout your turn
- Resets at the start of your next turn


[Activate] (1 action):
-   Drink potion
-   Use magic item
-   Activate device/mechanism

[Interact] (1 action):
-   Most skill checks
-   Search
-   Medicine check (stabilize dying ally)
-   Social skills (rally frightened ally, etc.)

## Movement Actions
Movement actions allow you to reposition, navigate terrain, and control the battlefield.

#### Basic Movement Mechanics:
- **Speed:** Your base movement speed is 30 feet per round (unless modified by race, conditions, or abilities)
- **Cost:** Advance costs 1 [Move] action per increment up to your speed
- **Terrain:** Difficult terrain costs 2 feet of movement for every 1 foot traveled
- **Multiple Movements:** You can take multiple [Move] actions in a turn, spending your actions as needed
- **Splitting Movement:** You can split your movement between other actions (move 15 feet, attack, move 15 feet more)

#### Standard Movement Actions

All characters have access to these movement options:

##### Advance [Move]
- **Cost:** 1 [Move] action
- **Effect:** Move up to your speed in feet
- **Notes:**
  - Can be split between other actions
  - Advancing through difficult terrain (rubble, shallow water, undergrowth) costs double
  - Advancing through another creature's space requires their permission or an Acrobatics check (GM discretion)
  - Moving Diagonally more than once during an advance costs 7.5 ft.

##### Stand from Prone [Move]
- **Cost:** 1 [Move] action
- **Effect:** Stand up from the Prone condition
- **Notes:**
  - If your speed is 0, you cannot stand up
  - Standing up doesn't provoke Opportunity Attacks
  - You can stand and move in the same turn by spending 2 [Move] actions

##### Disengage [Move]
- **Cost:** 1 [Move] action
- **Effect:** Your movement doesn't provoke Opportunity Attacks for the rest of your turn
- **Restriction:** You cannot end your movement within melee reach of an enemy creature
- **Notes:**
  - You can still move your full speed after disengaging (using additional [Move] actions)
  - Useful for tactical repositioning without taking free attacks

##### Mount/Dismount [Move]
- **Cost:** 1 [Move] action
- **Effect:** Mount or dismount a creature/vehicle
- **Notes:**
  - The mount must be within 5 feet and willing
  - Mounting/dismounting doesn't provoke Opportunity Attacks
  - While mounted, you use the mount's speed instead of your own

##### Squeeze [Move]
- **Cost:** 1 [Move] action
- **Effect:** Move through a space one size smaller than you
- **Speed:** Costs 2 feet of movement for every 1 foot traveled
- **Penalties:** While squeezing:
  - All attacks and skill checks: Add 1 to die results
  - Attacks against you have Fortune
- **Notes:**
  - A Medium creature can squeeze through a space at least 2.5 feet wide
  - Exiting the tight space ends the penalties

##### Jump [Move]
- **Cost:** Part of your movement (consumes feet of movement)
- **Long Jump:** 
  - Running start (10+ feet): Jump up to your Strength score in feet
  - Standing jump: Jump up to half your Strength score in feet
- **High Jump:**
  - Running start (10+ feet): Jump up to 3 + (Strength ÷ 2, rounded down) feet
  - Standing jump: Jump up to half that distance
- **Notes:**
  - Athletics check may be required for difficult jumps (GM discretion)
  - Landing in difficult terrain may require Acrobatics check to avoid falling prone

##### Climb [Move]
- **Cost:** Costs 2 feet of movement for every 1 foot climbed
- **Effect:** Move along a vertical surface
- **Check:** Athletics check required for difficult climbs (smooth walls, overhangs)
- **Notes:**
  - Slippery or unstable surfaces may impose Misfortune
  - Falling damage applies if you fail by 2+ successes

##### Swim [Move]
- **Cost:** Costs 2 feet of movement for every 1 foot swum (3 feet if wearing medium armor, 4 feet if wearing heavy armor)
- **Effect:** Move through water
- **Check:** Athletics check required for rough water, strong currents, or swimming while armored
- **Notes:**
  - Holding breath: Can hold breath for (Constitution) minutes
  - After that: Must make Fortitude save each round (DC increases) or begin drowning

##### Crawl [Move]
- **Cost:** Costs 2 feet of movement for every 1 foot crawled
- **Effect:** Move while Prone
- **Notes:**
  - All the penalties of being Prone still apply
  - Useful for moving under low obstacles or staying in cover

##### Tumble Through [Move]
- **Cost:** 1 [Move] action
- **Effect:** Acrobatics check (Agility + Acrobatics) to move through an enemy's space
- **Check:** Opposed by enemy's Reflex save (Agility + Luck)
- **Success:** You move through their space without provoking Opportunity Attacks
- **Failure:** Movement ends, you provoke Opportunity Attack
- **Notes:**
  - Enemy must be no more than one size larger than you
  - Useful for flanking or escaping surrounded positions

### Movement Modifiers

#### Speed Increases:
- Fleet of Foot feat: +50% speed
- Haste weave: Gain +1 action that can be used for Move
- Certain magic items or abilities

#### Speed Reductions:
- Exhaustion (level 2+): Half speed
- Exhaustion (level 4): Quarter speed
- Grappled condition: Speed 0
- Restrained condition: Speed 0
- Difficult terrain: Double movement cost
- Squeezing: Double movement cost
- Climbing/Swimming: Double (or more) movement cost

### Movement in Combat

#### Opportunity Attacks:
- Moving out of an enemy's reach provokes Opportunity Attacks (see Reactions)
- Forced movement (shoved, pushed by spells) doesn't provoke
- Teleportation doesn't provoke

#### Flanking (Optional Rule):
- When you and an ally are on opposite sides of an enemy (with both in melee reach)
- Both you and your ally have Fortune on melee attacks against that enemy
- Enemy must be no more than one size larger than you

### Important Clarifications

**You cannot:**
- Move through an enemy's space unless you Tumble Through or have special permission
- Move if your speed is reduced to 0 (Grappled, Restrained, etc.)
- Split a single [Move] action between multiple turns

**You can:**
- Split your movement between different actions in the same turn
- Take multiple [Move] actions per turn if you have actions available
- Choose not to use all your available movement
- Move through allies' spaces (costs normal movement)


[Minor] (1 action, or free with [Move]):
-   Draw/stow weapon
-   Open/close door
-   Speak/shout/give command
-   Pick up item

[Free] (no action cost):
-   Drop item
-   Brief communication (a few words)
-   End concentration on a spell
-   Release a grapple
-   **Limit:** You can take a reasonable number of [Free] actions per turn (typically 1-2), subject to GM discretion

##### Drop Prone [Free]
- **Cost:** [Free] action
- **Effect:** Fall prone in your current space
- **Notes:**
  - Doesn't provoke Opportunity Attacks
  - Useful for gaining cover against ranged attacks (enemies have Misfortune)
  - Remember: Enemies have Fortune on melee attacks against you while prone

## Reactions
Reactions are special responses triggered by specific circumstances that occur outside your turn.

#### Basic Reaction Mechanics:
- **Frequency:** You can take ONE reaction per round (between your turns)
- **Timing:** Reactions occur immediately when their trigger happens
- **Availability:** You can use your reaction even before your first turn in combat (unless Surprised)
- **Surprised Exception:** If you are Surprised, you cannot take reactions during the surprise round
- **Action Cost:** Reactions don't count against your 3 actions per turn
- **Choice:** If you have access to multiple reactions, you must choose which one to use when triggered
- **Additional Reactions:** Some feats, equipment, and weaves grant additional reaction options beyond those listed here

#### Universal Reactions

All characters have access to these reactions:

##### Opportunity Attack [Attack]
- **Trigger:** A hostile creature you can see moves out of your melee reach
- **Effect:** Make one melee attack against the triggering creature
- **Resolution:** Roll your Melee Combat skill normally. This attack uses your reaction for the round.
- **Notes:** 
  - Movement within your reach doesn't trigger this reaction
  - Teleportation and forced movement don't trigger this reaction
  - The Disengage action (see below) prevents opportunity attacks

##### Shield Block (requires wielding a shield)
- **Trigger:** You are hit by a melee attack while wielding a shield
- **Effect:** Choose one:
  - **Force Reroll:** Attacker must reroll one of their dice (attacker chooses which die, must keep new result)
  - **Increase DR:** Gain +2 DR against this attack only
- **Notes:** 
  - Only works against melee attacks
  - Cannot be used if you've already used your reaction this round
  - See Equipment (Part 8) for shield-specific bonus reactions

##### Counterweave [Combat]
- **Requirements:** Ability to weave, Space energy available
- **Trigger:** You see a creature weaving within medium range (60ft)
- **Effect:** Attempt to counter the weave (see Counterspell in Part 10: Weaves)
- **Cost:** Energy equal to the weave being countered
- **Notes:** Requires successful Arcane check to identify the weave first

### Reaction Priority and Timing

When multiple creatures have reactions that could trigger simultaneously:
1. The reacting creature closest to the triggering creature goes first
2. If equidistant, highest Initiative Bonus acts first
3. If still tied, reactions resolve simultaneously

### Important Clarifications

**You cannot:**
- Take more than one reaction per round
- Use a reaction on your own turn (except for specific triggered abilities)
- Ready a reaction "just in case" - reactions only trigger from specific circumstances

**You can:**
- Use your reaction before your first turn in initiative order (unless Surprised)
- Choose not to use your reaction when triggered
- Use different reactions on different rounds (if you have access to multiple reaction types)
