<!-- PACK:action:Combat,Move,Activate,Interact,Free,Reaction -->
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
- **Cost:** 1
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
- **Cost:** 1
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
  - Making a ranged attack while threatened (enemy within 5 feet) add 1 to both attack dice

##### Simple Weave [Combat]
- **Cost:** 1
- **Requirements:** Ability to weave, sufficient Energy
- **Range:** Touch to 5-10 feet maximum (no supporting energy for range)
- **Effect:** Cast a single-energy weave (Primary Energy only, no Supporting Energy)
- **Weaving Roll:** Primary Energy Potential + Primary Energy Mastery (2d8 only)
- **Notes:**
  - Subject to Multiple Action Penalty
  - Limited to touch or very close range (raw energy emanation)
  - Cannot achieve area effects or duration without supporting energy
  - Single target, instantaneous effects only
  - See (Magic System) for full weaving rules and Simple Weave limitations

##### Complex Weave [Combat]
- **Cost:** 2
- **Requirements:** Ability to weave, sufficient Energy
- **Effect:** Cast a multi-energy weave using Primary + Supporting Energy
- **Weaving Roll:** Primary Potential + Primary Mastery + Supporting Potential + Supporting Mastery (4d8)
- **Notes:**
  - Counts as ONE combat action for Multiple Action Penalty purposes (even though it costs 2 actions)
  - Requires Supporting Energy to achieve range beyond touch, area effects, or duration
  - See (Magic System) for full weaving rules
  - Complex weaves typically have area effects, require saves, affect range/duration, or involve complex energy manipulation

##### Channel Divinity [Combat]
- **Cost:** 2
- **Requirements:** Divine Gift Trait
- **Range:** 30-foot radius centered on you
- **Effect:** Automatically succeeds for Heal/Harm intents (see Part 7 for full details)
- **Types:** Heal, Harm, Turn (undead), Command (undead)
- **Energy Cost:** Minimum 4 Energy, can spend more
- **Notes:**
  - Counts as ONE combat action for Multiple Action Penalty purposes
  - Indiscriminate area effect (affects friends and foes)
  - See (Magic System) for Channel Divinity details


##### Called Shot [Combat]
- **Cost:** 1
- **Effect:** Add 1 to both attack die results, but on hit choose one:
  - Bypass half DR (rounded down)
  - Apply specific condition (Bleeding, Dazzled, etc. - GM approval required)
  - Deny shield Ranged Defense [Reaction]
- **Notes:**
  - Declare before rolling
  - Subject to Multiple Action Penalty

##### Power Attack [Combat]
- **Cost:** 1
- **Requirements:** Power Attack feat, Str 3, Melee 3
- **Effect:** Add 1 to both attack die results, but deal +1d8 bonus damage on hit
- **Notes:**
  - Declare before rolling
  - Subject to Multiple Action Penalty
  - Only works with melee attacks

##### Disarm Attempt [Combat]
- **Cost:** 1
- **Effect:** Make normal attack roll against opponent
- **Success:**
  - Margin 1: No damage, target drops one held item (your choice)
  - Margin 2+: Base weapon damage AND target drops item
- **Notes:**
  - Declare before rolling
  - Subject to Multiple Action Penalty
  - Target must be holding the item

##### Trip Attempt [Combat]
- **Cost:** 1
- **Effect:** Make normal attack roll against opponent
- **Success:**
  - Margin 1: No damage, target falls Prone
  - Margin 2+: Base weapon damage AND target falls Prone
- **Notes:**
  - Declare before rolling
  - Subject to Multiple Action Penalty
  - Target must be no more than one size larger than you

##### Shove [Combat]
- **Cost:** 1
- **Effect:** Make opposed Athletics check (Strength + Athletics vs target's Athletics or Acrobatics)
- **Success:** Push target 5 feet away from you OR knock them Prone (your choice)
- **Notes:**
  - Target must be no more than one size larger than you
  - Subject to Multiple Action Penalty
  - Doesn't deal damage

##### Grapple [Combat]
- **Cost:** 1
- **Effect:** Make opposed Athletics check (Strength + Athletics vs target's Athletics or Acrobatics)
- **Success:** Target gains Grappled condition
- **Notes:**
  - Requires at least one free hand
  - You are also grappling (can't move unless you drag target)
  - Target can use action to attempt escape (opposed check)
  - Subject to Multiple Action Penalty

##### Two-Weapon Fighting [Combat]
- **Cost:** 1
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
  - See (Combat) for detailed examples

##### Ready an Action [Combat]
- **Cost:** 1 or 2
- **Effect:** Choose a trigger and an action. When the trigger occurs before your next turn, you can use your [Reaction] to perform the readied action
- **Examples:**
  - "I ready an attack for when the orc comes through the door" (1 action)
  - "I ready a Fireball for when enemies cluster together" (2 actions)
- **Notes:**
  - You must specify the trigger clearly
  - If trigger doesn't occur, the action is lost
  - Performing the readied action uses your [Reaction]
  - Readied weaves that aren't used still consume Energy

##### Aid Another [Combat]
- **Cost:** 1
- **Effect:** Make a skill check to help an ally with their action
- **Success (1+):** Your ally gains Fortune on their next roll for that task
- **Notes:**
  - Must be able to meaningfully help (GM discretion)
  - Can aid attacks, skill checks, or other actions
  - Subject to Multiple Action Penalty

##### Feint [Combat]
 - **Cost:** 1
- **Effect:** Make opposed Deception check (Charisma + Deception vs target's Empathy + Wisdom)
- **Success:** Your next attack against that target this turn has Fortune
- **Notes:**
  - Only works against creatures that can see and understand you
  - Subject to Multiple Action Penalty

##### Total Defense [Combat]
 - **Cost:** 3
- **Effect:** Focus entirely on defense until your next turn
- **Benefit:** All attacks against you have Misfortune
- **Notes:**
  - Cannot take any other actions this turn
  - Can still take your [Reaction]


## Movement Actions
Movement actions allow you to reposition, navigate terrain, and control the battlefield.

#### Basic Movement Mechanics:
- **Speed:** Your base movement speed is 30 feet per round (unless modified by race, conditions, or abilities)
- **Cost:** Advance costs 1 [Move] action per increment up to your speed
- **Cost:** Advance costs 1 per increment up to your speed
- **Terrain:** Difficult terrain costs 2 feet of movement for every 1 foot traveled
- **Multiple Movements:** You can take multiple [Move] actions in a turn, spending your actions as needed
- **Splitting Movement:** You can split your movement between other actions (move 15 feet, attack, move 15 feet more)

#### Standard Movement Actions

### Movement in Combat

#### Opportunity Attacks:
- Moving out of an enemy's reach provokes Opportunity Attacks (see Reactions)
- Forced movement (shoved, pushed by spells) doesn't provoke
- Teleportation doesn't provoke

#### Flanking (Optional Rule):
- When you and an ally are on opposite sides of an enemy (with both in melee reach)
- Both you and your ally subtract 1 from both dice when making attacks
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

### Movement Modifiers

#### Speed Increases:
- Fleet of Foot feat
- Haste weave
- Certain magic items or abilities

#### Speed Reductions:
- Exhaustion (level 2+)
- Grappled condition
- Restrained condition
- Difficult terrain
- Squeezing
- Climbing/Swimming
- stalk

All characters have access to these movement options:

##### Advance [Move]
- **Cost:** 1
- **Effect:** Move up to your speed in feet
- **Notes:**
  - Can be split between other actions
  - Advancing through difficult terrain (rubble, shallow water, undergrowth) costs double
  - Advancing through another creature's space requires their permission or an Acrobatics check (GM discretion)
  - Moving Diagonally more than once during an advance costs 7.5 ft.

##### Stand from Prone [Move]
- **Cost:** 1
- **Effect:** Stand up from the Prone condition
- **Notes:**
  - If your speed is 0, you cannot stand up
  - Standing up doesn't provoke Opportunity Attacks

##### Disengage [Move]
- **Cost:** 2
- **Effect:** Your movement doesn't provoke Opportunity Attacks for the rest of your turn
- **Restriction:** You cannot end your movement within melee reach of an enemy creature
- **Notes:**
  - You can still move your full speed after disengaging (using additional [Move] actions)
  - Useful for tactical repositioning without taking free attacks

##### Mount/Dismount [Move]
- **Cost:** 1
- **Effect:** Mount or dismount a creature/vehicle
- **Notes:**
  - The mount must be within 5 feet and willing
  - Mounting/dismounting doesn't provoke Opportunity Attacks
  - While mounted, you use the mount's speed instead of your own

##### Squeeze [Move]
- **Cost:** 1
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
- **Cost:** Costs 2 feet of movement for every 1 foot swum
- **Effect:** Move through water
- **Check:** Athletics check required for rough water, strong currents, or swimming while armored
- **Notes:**
  - Holding breath: Can hold breath for (Constitution) minutes
  - After that: Must make Fortitude save each round or begin drowning

##### Crawl [Move]
- **Cost:** Costs 2 feet of movement for every 1 foot crawled
- **Effect:** Move while Prone
- **Notes:**
  - All the penalties of being Prone still apply
  - Useful for moving under low obstacles or staying in cover

##### Tumble Through [Move]
- **Cost:** 1
- **Effect:** Acrobatics check (Agility + Acrobatics) to move through an enemy's space
- **Check:** Opposed by enemy's Reflex save (Agility + Luck)
- **Success:** You move through their space without provoking Opportunity Attacks
- **Failure:** Movement ends, you provoke Opportunity Attack
- **Notes:**
  - Enemy must be no more than one size larger than you
  - Useful for flanking or escaping surrounded positions

##### Hide [Move]
- **Cost:** 1
- **Effect:** Stealth check (Agility + stealth) with the aid of partial cover or greater.
- **Check:** Opposed by enemy's Perception (Wisdom + Perception)
- **Success:** You use cover to successfully become hidden
- **Failure:** You do not gain the Hidden condition from the enemy, but may have concealed from cover.
- **Notes:**
  - Per Enemy test, may be hidden from some (but you do not know which)
  - **Partial Cover:** Low wall, furniture, creature, tree trunk, etc

##### Stalk [Move]
- **Cost:** Costs 2 feet of movement for every 1 foot moved.
- **Effect:** While Hidden, you change location. Make a Stealth check (Agility + stealth).
- **Check:** Opposed by enemy's Perception (Wisdom + Perception)
- **Success:** You use cover to successfully change location while remaining hidden.
- **Failure:** You lose the Hidden condition, but may have concealed from cover.
- **Notes:**
  - Per Enemy test, may be hidden from some (but you do not know which)


## Activate Actions

Activate actions involve using items, equipment, or abilities that require deliberate triggering or operation. These actions represent more complex interactions than simple manipulation.

##### Activate Magic Item [Activate]
- **Cost:** 1 (or as specified by item)
- **Effect:** Trigger a magic item's power or property
- **Examples:**
  - Speaking a command word to activate a magic sword's flame ability
  - Rubbing a magic lamp
  - Activating a wand or staff
  - Triggering a ring's protective power
- **Notes:**
  - Some items specify different action costs (may require 2 actions or be [Free])
  - Command word items require you to be able to speak
  - See the item's description for specific activation requirements

##### Use Special Ability [Activate]
- **Cost:** 1 (or as specified by ability)
- **Effect:** Use a class feature, feat, or special ability that doesn't fit other categories
- **Notes:**
  - Specific action cost listed in ability description
  - Some abilities may be [Free] or [Reaction] instead

##### Drink Potion [Activate]
- **Cost:** 1
- **Effect:** Consume a potion and gain its effects
- **Notes:**
  - Administering a potion to another creature requires 1 [Activate] action
  - The unconscious/willing creature must be adjacent
  - Drinking while threatened provokes Opportunity Attacks (unless you use Disengage first)

##### Use Consumable [Activate]
- **Cost:** 1
- **Effect:** Use a consumable item (oil, poison, alchemical item, etc.)
- **Examples:**
  - Applying oil to a weapon
  - Throwing alchemist's fire
  - Using a bandage to stabilize a dying creature
  - Setting a bear trap
- **Notes:**
  - Some consumables may have different action costs (see item description)
  - Applying poison to a weapon requires 1 [Activate] action

##### Read Scroll [Activate]
- **Cost:** 2
- **Requirements:** Ability to read, appropriate magical knowledge
- **Effect:** Cast the spell contained in the scroll
- **Check:** Arcane check required if spell level exceeds your weaving capability
- **Notes:**
  - The scroll is consumed after use
  - Provokes Opportunity Attacks (like Complex Weave)
  - Failure may destroy the scroll

##### Don/Doff Shield [Activate]
- **Cost:** 1
- **Effect:** Equip or remove a shield
- **Notes:**
  - Drawing/stowing a shield requires focused effort (not quick like a weapon)
  - Cannot be done as part of a [Move] action
  - Shield must be readily accessible (on your back, at your side, etc.)

##### Don/Doff Armor [Activate]
- **Cost:** Variable (see table below)
- **Effect:** Put on or take off armor
- **Notes:**
  - Requires assistance to halve the time for medium/heavy armor
  - Cannot be done during combat rounds (too time-consuming)
  - Sleeping in armor may cause exhaustion

## Interact Actions

Interact actions involve manipulating objects, the environment, or simple physical tasks that don't require specialized skills. Many Interact actions can be combined with movement for efficiency.

##### Interact with Object [Interact]
- **Cost:** 1 (or Free with Move action, GM discretion)
- **Effect:** Manipulate an object or environmental feature
- **Notes:**
  - Simple, straightforward interactions
  - More complex manipulations may require full [Interact] action
  - GM determines if action can be done as [Free] during movement

##### Draw/Stow Weapon [Interact]
- **Cost:** Free with Move action, or 1 if standing still
- **Effect:** Draw a weapon or stow it in its sheath/holster
- **Notes:**
  - Can draw/stow ONE weapon per turn as part of movement
  - Drawing two weapons requires Quick Draw feat or two separate actions
  - Doesn't provoke Opportunity Attacks
  - Cannot draw/stow weapons while Grappled (hands not free)

##### Pick Up/Drop Item [Interact]
- **Cost:** Free to drop, Free with Move to pick up (or 1)
- **Effect:** Retrieve or release an item
- **Notes:**
  - Dropping an item is always [Free] and doesn't provoke
  - Picking up an item while threatened may provoke Opportunity Attacks (GM discretion)
  - Item must be within reach (typically 5 feet)

##### Manipulate Object [Interact]
- **Cost:** 1
- **Effect:** Perform a more complex object manipulation
- **Notes:**
  - More involved than simple interactions
  - May require skill check for complex tasks
  - GM determines if task requires multiple actions

##### Hand Off Item [Interact]
- **Cost:** Free
- **Effect:** Pass an item to an adjacent willing creature
- **Requirements:** Both creatures must have at least one free hand
- **Notes:**
  - Recipient must be within 5 feet
  - Both parties must be willing
  - Can hand off weapons, potions, items, etc.
  - Doesn't provoke Opportunity Attacks

##### Extinguish Flames [Interact]
- **Cost:** 1
- **Effect:** Put out flames on yourself or an adjacent creature
- **Notes:**
  - Ends the Burning condition (if small fire)
  - Larger magical fires may require multiple actions or skill checks
  - Uses your action but could save significant HP

##### Use Tool/Kit [Interact]
- **Cost:** Variable (typically 1-10)
- **Effect:** Use thieves' tools, healer's kit, artisan's tools, etc.
- **Notes:**
  - Most tool use requires proficiency or appropriate skills
  - Time requirements vary by task complexity
  - May require skill checks (Devices for locks, Medicine for healer's kit, etc.)

##### Ready/Stow Shield [Interact]
- **Cost:** See Don/Doff Shield in [Activate] actions
- **Note:** Shields are substantial equipment and cannot be readied as quickly as weapons

##### Search [Interact]
- **Cost:** 1 [Interact] action
- **Effect:** Make a Perception or Investigate check to find something
- **Notes:**
  - GM sets number of required successes
  - May require multiple actions for larger areas

##### Take Cover [Interact]
 - **Cost:** Free with Move action
- **Effect:** Position yourself to gain cover benefits
- **Notes:**
  - Must have cover available (wall, boulder, etc.)
  - See Cover rules in Combat section
  - Enemies may have Misfortune attacking you depending on cover quality

##### Speak/Signal [Interact]
 - **Cost:** Free
- **Effect:** Communicate briefly with allies or enemies
- **Notes:**
  - Complex communication requires full action
  - Can be done once per turn as [Free] action
  - Silenced creatures cannot speak

## Free Actions

Free actions require no significant time or effort and can be performed alongside other actions.

#### Free Action Limits
- **Limit:** You can take a reasonable number of [Free] actions per turn (typically 1-3), subject to GM discretion
- **Abuse Prevention:** GM may rule that excessive free actions (like dropping 20 items) require actual action costs
- **Timing:** Free actions can typically be taken at any point during your turn

##### Drop Item [Free]
- **Cost:** Free
- **Effect:** Release an item from your hand
- **Notes:**
  - Item falls in your space
  - Doesn't provoke Opportunity Attacks
  - Can drop multiple items per turn if necessary (GM discretion)

##### Release Grapple [Free]
- **Cost:** Free
- **Effect:** Stop grappling a creature you're currently grappling
- **Notes:**
  - The target is no longer Grappled by you
  - You are no longer grappling them
  - Doesn't require a check

##### Drop Prone [Free]
- **Cost:** Free
- **Effect:** Fall prone in your current space
- **Notes:**
  - Doesn't provoke Opportunity Attacks
  - Useful for gaining cover against ranged attacks (enemies have Misfortune)
  - Remember: Enemies have Fortune on melee attacks against you while prone

## Reactions
Reactions are special responses triggered by specific circumstances that occur outside your turn.

### Basic Reaction Mechanics:
- **Frequency:** You can take ONE reaction per round (between your turns)
- **Timing:** Reactions occur immediately when their trigger happens
- **Availability:** You can use your reaction even before your first turn in combat (unless Surprised)
- **Surprised Exception:** If you are Surprised, you cannot take reactions during the surprise round
- **Action Cost:** Reactions don't count against your 3 actions per turn
- **Choice:** If you have access to multiple reactions, you must choose which one to use when triggered
- **Additional Reactions:** Some feats, equipment, and weaves grant additional reaction options beyond those listed here

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

### Reactions

##### Ranged Defense [Reaction]
- **Trigger:** You are targeted by a Ranged attack while wielding a shield.
- **Effect:** Force Misfortune on one ranged attack per round.

##### Shield Block [Reaction]
- **Trigger:** You are hit by an attack while wielding a shield
- **Effect:** Once per round, Gain +6 DR against this attack only



### Universal Reactions
All characters have access to these reactions:

##### Opportunity Attack [Combat] (Reaction)
- **Trigger:** A hostile creature you can see moves out of your melee reach
- **Effect:** Make one melee attack against the triggering creature
- **Resolution:** Roll your Melee Combat skill normally. This attack uses your reaction for the round.
- **Notes:** 
  - Movement within your reach doesn't trigger this reaction
  - Teleportation and forced movement don't trigger this reaction
  - The Disengage action prevents opportunity attacks

##### Counterweave [Combat]
- **Requirements:** Ability to weave, Space energy available
- **Trigger:** You see a creature weaving within medium range (60ft)
- **Effect:** Attempt to counter the weave (see CounterWeave in Weaves)
- **Cost:** Energy equal to the weave being countered
- **Notes:** Requires successful Arcane check to identify the weave first

