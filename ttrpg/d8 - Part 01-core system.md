# D8 TTRPG System - Core Rules v2.1

## Core Concept

A classless tabletop roleplaying game built entirely around the number
eight, using d8 dice and a roll equal-to-or-under system with success
counting.

## Design Notes

### Core Design Principles

-   Everything based on the number 8
-   Roll-under system rewards investment
-   Success counting creates gradients
-   Resource management (Luck, Energy) creates tactical decisions
-   Classless system allows flexible character concepts

### Key Features

-   Luck depletion: Rising tension throughout sessions
-   Overspending penalties: Heroic risk-taking with consequences
-   4-success weaving: Combining energies increases power ceiling
-   Opposed combat: Every fight tactical
-   Critical restoration: Double 1s create legendary moments
-   Channel Divinity: Reliable but indiscriminate area effects
-   Static HP: Combat remains dangerous at all levels
-   Armor matters: DR system makes protection crucial

### Core Mechanic: Roll Equal-to-or-Under

#### Basic Skill Test

1.  Roll d8 for the governing attribute
2.  Roll d8 for the skill
3.  Each die that rolls equal to or under its value = 1 success
4.  Maximum 2 successes per basic test

#### Success Thresholds
-   Easy Task: 1 success required
-   Hard Task: 2 successes required

### Advanced Rolling Mechanics

**Shared Attribute Roll:** When making multiple checks with the same attribute as part of a single action or simultaneous activity, roll the attribute die once. Each check uses this same attribute result but rolls its own skill die separately.

**Single Die Modifiers:** Some effects specify they modify only the "attribute die" or "skill die" rather than both. Unless a rule specifically states it affects only one die, all modifiers apply to both dice in a check.

**Examples:**
-   "Add 1 to both die results" - affects both attribute and skill dice
-   "Add 1 to the attribute die only" - only affects attribute die
-   "Reroll the skill die" - only affects skill die

## Fortune & Misfortune
### Fortune (beneficial modifier):
-   Roll 3d8 total (instead of the normal 2d8)
-   Take the best (lowest) 2 results
-   Assign one result to the attribute, one to the skill
-   Count successes normally
-   Represents favorable circumstances, superior positioning, or cosmic luck

### Misfortune (detrimental modifier):
-   Roll 3d8 total (instead of the normal 2d8)
-   Take the worst (highest) 2 results
-   Assign one result to the attribute, one to the skill
-   Count successes normally
-   Represents unfavorable circumstances, poor positioning, or cosmic ill luck

#### Example with Fortune:
-   Stealth check: Agility 4, Stealth 3
-   Roll 3d8: results are 2, 5, 7
-   Take best 2: 2 and 5
-   Assign: 2 to Agility (≤4? Success!), 5 to Stealth (≤3? Failure)
-   Total: 1 success

**Multiple sources:** Fortune and Misfortune cancel each other out on a 1-to-1 basis. If you have 2 sources of Fortune and 1 source of Misfortune, you have 1 Fortune remaining.

## Critical Results
### Critical Success: Rolling double 1s (1.56% chance)
-   Action succeeds spectacularly
-   Restore all Luck points to maximum

### Critical Failure: Rolling double 8s (1.56% chance)
-   Action fails catastrophically
-   GM determines consequences

### Opposed Rolls
-   Both participants roll their relevant attribute + skill
-   More successes wins
-   Tie goes to the defender (or lowest total rolled)

## The Luck System
### Luck Pool
-   Each session begins with Luck points equal to your Luck attribute
-   Current Luck depletes as you spend it throughout the session
-   Resets to full after a long rest/new session

### Spending Luck (Active Use)
-   Cost: 1 Luck point reduces any single die result by 1
-   Can spend multiple points on one roll

### Luck for Complications (Reactive)
When you achieve partial success (1 success when 2 needed):
1.  Roll d8
2.  If result is ≤ your Current Luck: No complication
3.  If result is \> your Current Luck: GM introduces a complication, cost, or consequence

### Luck in Saving Throws
All three saving throw types roll Attribute + Current Luck and count successes:
-   Fortitude Save: Constitution + Current Luck
-   Reflex Save: Agility + Current Luck
-   Will Save: Wisdom + Current Luck

Roll 2d8 (one for the attribute, one for Current Luck), count successes.
These successes are compared against the threat\'s successes.

**Important:** As you spend Luck throughout the session, your Current Luck decreases, making it harder to generate successes on your Luck die!

#### Example:
-   Early session with Current Luck 3: Roll Constitution d8 and Luck d8
    (need ≤3 on Luck die)
-   Late session with Current Luck 0: Roll Constitution d8 and Luck d8 (need ≤0 on Luck die = impossible!)
-   Your Constitution can still generate successes, but Luck cannot

### Restoring Luck During Sessions

#### Short Rest (10 minutes):
-   Regain 1 Luck point
-   Cannot exceed maximum

#### GM Story Awards (1-2 Luck):
-   Heroic actions and epic roleplay
-   Clever solutions
-   Lucky breaks and fortuitous discoveries
-   Major story milestones
-   Defeating significant enemies

#### Critical Success Bonus:
-   Rolling double 1s restores ALL Luck points to maximum

#### Consumable Items (Optional):
-   Lucky charms and talismans can restore 1-3 Luck
-   Found as treasure or purchased from merchants

## Hit Point Recovery

### Short Rest (10 minutes)
-   Regain HP equal to Constitution attribute
-   Regain 1 Luck point
-   No limit on frequency (can be taken as often as needed)

### Long Rest (8 hours of sleep)
-   Regain HP equal to Constitution × 4
-   Restore all Luck points to maximum
-   Restore all Energy points to maximum
-   Remove certain conditions (GM discretion)

#### Example: A character with Constitution 4 (32 max HP):
-   Short rest: Regains 4 HP
-   Long rest: Regains 16 HP (half max HP)
-   Full recovery requires 2 long rests without magical healing

## Action Economy

### Actions Per Turn

Each character gets 3 actions per turn

#### Actions can be spent on:
-   Standard Actions (attack, weave, use item, skill check, etc.)
-   Move Actions (move up to your speed)
-   Minor Actions (draw weapon, open door, speak, etc.)

### Action Keywords
-   [Attack] - Direct attacks against targets
-   [Combat] - Offensive/tactical combat abilities
-   [Activate] - Using items or devices
-   [Interact] - Non-combat interactions and skills
-   [Move] - Movement and positioning
-   [Minor] - Quick, simple actions
-   [Free] - No action cost
-   [Reaction] - Triggered responses (don't use turn actions)

#### Minor Action Rule
-   One [Minor] action can be combined with a [Move] action for free
-   Examples: Draw weapon while moving, open door while moving

### Multiple Action Penalty

Only actions with [Attack] or [Combat] keywords trigger the penalty:
-   First [Attack]/[Combat] action: Normal
-   Second [Attack\]/[Combat] action: Add 1 to both die results
-   Third [Attack]/[Combat] action: Add 2 to both die results

All other keyword types can be used multiple times without penalty.

### Action Types

[Attack] (1 action):
-   Melee attack
-   Ranged attack

[Combat] (variable actions):
-   Simple weave (1 action) - touch range, single target, basic effect
-   Complex weave (2 actions) - range, area effect, or multiple energies
-   Channel Divinity (2 actions)
-   Combat maneuvers (disarm, trip, shove) (1 action)

[Activate] (1 action):
-   Drink potion
-   Use magic item
-   Activate device/mechanism

[Interact] (1 action):
-   Most skill checks
-   Search
-   Medicine check (stabilize dying ally)
-   Social skills (rally frightened ally, etc.)

[Move] (1 action):
-   Move up to your speed
-   Stand up from prone
-   Mount/dismount

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

[Reaction] (one per round, between turns):
-   Counterweave [Combat]
-   Opportunity attack [Attack]
-   Defensive abilities

#### Success Probability Reference
| Value | Single Die | At Least 1 Success | Both Succeed (2 successes) |
|-------:|:----------:|:------------------:|:--------------------------:|
| 1/1    | 12.5%      | 23%                | 1.6%                       |
| 2/2    | 25%        | 44%                | 6.25%                      |
| 3/3    | 37.5%      | 61%                | 14%                        |
| 4/4    | 50%        | 75%                | 25%                        |
| 5/5    | 62.5%      | 86%                | 39%                        |
| 6/6    | 75%        | 94%                | 56%                        |
| 7/7    | 87.5%      | 98%                | 77%                        |
| 8/8    | 100%       | 100%               | 100%                       |

#### Typical Starting Character Success Rates

With array 4,3,3,3,3,2,2,1 and skills at 2-3:

##### Best skills (Attribute 4/Skill 3):
-   66% at least one success
-   19% both successes

##### Good skills (Attribute 3/Skill 2):
-   53% at least one success
-   9% both successes

##### Weak areas (Attribute 2/Skill 1):
-   34% at least one success
-   3% both successes

### Weaving Expected Successes

Using two energies, within trained ability (no overspending):

##### Competent Weaver (Potential 4, Mastery 3):
-   Average: 1.75 successes (typically 2)

##### Skilled Weaver (Potential 5, Mastery 4):
-   Average: 2.25 successes (typically 2-3)

##### Expert Weaver (Potential 6, Mastery 5):
-   Average: 2.75 successes (typically 3)

##### Master Weaver (Potential 8, Mastery 7):
-   Average: 3.75 successes (typically 4)

## The Dying Mechanic

### Reaching 0 HP
-   Any attack that reduces you to 0 HP or below stops at 0 HP (excess damage ignored)
-   Immediately gain Dying, Unconscious, Blinded, and Prone conditions

### Stabilization Attempts
On your turn while Dying:

#### At 0 HP: Make Fortitude save (Constitution + Current Luck)
-   1+ successes: Stabilize at 0 HP (Dying ends, remain Unconscious, Blinded and Prone)
-   0 successes: Drop to -1 HP

### Death Threshold
If negative HP equals your Constitution score, you die
-   **Example:** Constitution 4 character dies at -4 HP

#### Ally Assistance
An ally can use an [Interact] action to stabilize you with a Medicine
check:
-   2 successes: You stabilize at 0 HP
-   1 success: You gain +1 to your next stabilization save

Magical healing immediately restores you to consciousness and removes
Dying, Unconcious, and Blinded conditions.

### Recovering from Stabilization
Once stabilized, you remain Unconscious Blinded and Prone.
At the end of your next turn, make a Will save (Wisdom + Luck):
-   1+ successes: Regain consciousness with 1 HP. Remove Unconcious, and Blinded Conditions. Receive Grievously Wounded condition
-   0 successes: Remain Unconscious, Blinded and Prone. Repeat save each turn

## Conditions

### Fear/Morale Conditions

#### Frightened (Base Fear Condition)
-   All rolls: Add 1 to die results while the source of fear is perceived
-   Can act normally but suffers the penalty
-   Can choose to flee or stand and fight
-   **Recovery:** At the end of each turn, make Will save (Wisdom + Luck):
    -   1 success: Condition ends
    -   0 successes: Remains Frightened

-   Ally Assistance: An ally within 5 feet can use an [Interact]
    action with Persuasion or Intimidate check:
    -   1+ successes: Condition ends

#### Fleeing (Moderate Fear)
-   Must use movement to get away from the fear source by the safest
    route available
-   All rolls: Add 1 to die results
-   Cannot willingly move closer to the fear source
-   Can defend if cornered or attacked, but cannot make attacks against the fear source
-   Can engage other threats that aren\'t the source of fear (though still add 1 to die results)
-   **Recovery:** At the end of each turn, make Will save:
    -   2 successes: Condition ends completely
    -   1 success: Downgrade to Frightened
    -   0 successes: Remains Fleeing

-   **Ally Assistance:** An ally within 5 feet can use an [Interact] action with Persuasion or Intimidate check:
    -   2 successes: Downgrade to Frightened
    -   1 success: May reroll next recovery save

#### Cowering (Severe Fear/Broken Morale)
-   Cannot take any actions except defensive reactions
-   Cannot move voluntarily
-   Attacks against you have Fortune
-   **Recovery:** At the end of each turn, make Will save:
    -   2 successes: Downgrade to Frightened
    -   1 success: Downgrade to Fleeing
    -   0 successes: Remains Cowering

-   **Ally Assistance:** An ally within 5 feet can use an [Interact] action with Persuasion or Intimidate check:
    -   2 successes: Downgrade to Frightened
    -   1 success: Downgrade to Fleeing

### General Fear Rules:

-   If you can no longer see/perceive the fear source: Subtract 1 from recovery save die results
-   If the source of fear is destroyed/defeated, immediately downgrade one level (Cowering→Fleeing→Frightened→none)
-   You can spend Luck on recovery saves as normal

### Sensory Conditions

#### Blinded
-   Cannot see
-   Vision-based Perception checks automatically fail
-   Attacks against you have Fortune
-   Your attacks have Misfortune

#### Deafened
-   Cannot hear
-   Sound-based Perception checks automatically fail
-   Initiative: -2
-   Cannot benefit from verbal communication or warnings

#### Dazzled
-   Vision impaired by bright light, spots, disorientation, or
    overstimulation
-   Vision-based Perception checks: Add 1 to die results
-   Attack rolls: Add 1 to die results

### Physical Conditions

#### Clumsy
-   Physical coordination impaired
-   Dexterity and Agility checks: Add 1 to die results
-   Reflex saves: Add 1 to die results

#### Prone
-   Lying on the ground
-   Melee attacks against you have Fortune
-   Ranged attacks against you have Misfortune
-   Your melee attacks have Misfortune
-   Your ranged attacks have Misfortune (unless weapon can be used prone)
-   Standing up from prone costs 1 [Move] action

#### Grievously Wounded
-   Applied when you regain consciousness at 0 HP or below
-   Clumsy condition active
-   Dazzled condition active
-   Can only take one action per turn (move OR standard action, not both)
-   Cannot take reactions
-   **Recovery:** Condition ends when healed above 1 HP

### Incapacitation & Death States

#### Asleep/Unconscious (Incapacitated)
-   Cannot take actions or reactions
-   Cannot move
-   Blinded condition active
-   Prone condition active
-   Automatically fail Fortitude and Reflex saves
-   Attacks against you have Fortune
-   **Recovery (Asleep):**
    -   Loud noises or physical contact: Make Perception check (1 success to wake)
    -   Deep Sleeper flaw: Requires 2 successes to wake, add 2 to all
        die results first round after waking
    -   Light Sleeper trait: Automatically wake to subtle noises, no
        penalties

-   **Recovery (Unconscious):** Depends on cause (damage, poison, magic, etc.)

#### Paralyzed

-   Cannot take actions, reactions, or move
-   Cannot speak
-   Automatically fail Fortitude and Reflex saves
-   Attacks against you have Fortune
-   May be aware of surroundings through senses
-   **Recovery:** At the end of each turn, make Fortitude save (Constitution + Current Luck):
    -   2 successes: Condition ends
    -   1 success: Subtract 1 from next recovery save die results
    -   0 successes: Remains Paralyzed

#### Dying
-   At 0 HP or below
-   Cannot take actions, reactions, or move
-   Unconscious condition active
-   Blinded condition active
-   Prone condition active
-   See Dying Mechanic section in Core Rules for full details

#### Dead
-   Character is deceased
-   Cannot be affected by normal healing
-   Requires resurrection magic or special circumstances

### Combat Conditions
#### Surprised
-   Cannot act during the surprise round
-   Defense: Add 2 to die results until your first turn
-   After surprise round ends, act normally

#### Exhausted (Multiple Levels)

##### Level 1 - Fatigued:
-   All skill checks: Add 1 to die results
-   Cannot benefit from short rests for HP recovery (still recover Luck)
-   Recovery: Long rest removes 1 level of Exhaustion

##### Level 2 - Exhausted:
-   All skill checks: Add 2 to die results
-   Movement speed reduced by half
-   Cannot benefit from short rests at all
-   Recovery: Long rest removes 1 level of Exhaustion

##### Level 3 - Severely Exhausted:
-   All rolls (including attacks and saves): Add 2 to die results
-   Movement speed reduced by half
-   Can only take 2 actions per turn instead of 3
-   Cannot benefit from short rests
-   Recovery: Long rest removes 1 level of Exhaustion

##### Level 4 - Near Collapse:
-   All rolls: Add 3 to die results
-   Movement speed reduced to quarter
-   Can only take 1 action per turn
-   Cannot take reactions
-   Recovery: Long rest removes 1 level of Exhaustion

##### Level 5 - Collapse:
-   Character becomes Unconscious
-   Cannot be awakened until Exhaustion reduced below level 5
-   Recovery: Long rest removes 1 level of Exhaustion

#### Gaining Exhaustion:
-   Marching for 8+ hours without rest: Fortitude save or gain 1 level
-   Going without sleep for 24 hours: Automatic 1 level
-   Extreme environmental conditions (heat, cold): Fortitude save per hour or gain 1 level
-   Certain spells, poisons, or abilities

### Poisoned
#### Standard Poison Effect:
-   All attribute dice: Add 1 to die results (makes all rolls harder)
-   Fortitude saves: Add 1 to die results (harder to resist)
-   HP regeneration from short/long rests reduced by half

#### Duration:
-   Depends on poison type (typically 1 hour to 24 hours)
-   Some poisons require saves each hour or worsen

#### Recovery:
-   Fortitude save at end of duration to shake off poison
-   Medicine check (2 successes) can end Poisoned early with proper treatment
-   Magical healing removes poison
-   Antidotes (if available) automatically remove poison

#### Poison Types (Optional):
-   Weak Poison: Add 1 to attribute dice, duration 1 hour
-   Strong Poison: Add 2 to attribute dice, duration 4 hours, 1d8 damage per hour
-   Deadly Poison: Add 2 to all dice, 2d8 damage per hour, requires
    Fortitude save each hour or die

### Stunned
#### Effect:
-   Cannot take actions or reactions for 1 round
-   Automatically fail Reflex saves
-   Attacks against you have Fortune
-   You can still speak and perceive surroundings

#### Duration:
-   Typically lasts until the end of your next turn
-   Some effects specify longer duration

#### Recovery:
-   Automatically ends after specified duration
-   Some stun effects allow Fortitude save at end of turn to end early

#### Common Sources:
-   Critical hits from bludgeoning weapons (optional rule)
-   Thunder/sonic damage weaves
-   Special monster abilities
-   Certain combat maneuvers

### Grappled
#### Effect:
-   Movement speed reduced to 0
-   Cannot take [Move] actions
-   Attacks and skill checks: Add 1 to die results
-   Can still attack and act normally otherwise
-   Attacks against you: No modifier

#### Initiating Grapple:
-   Use 1 [Attack] action
-   Make opposed Athletics (Str + Athletics) check vs target's choice of Athletics or Acrobatics
-   If you win: Target becomes Grappled
-   Both you and target are grappling (you cannot move either, but can release as [Free] action)

#### Escaping Grapple:
-   Use 1 action to make opposed Athletics or Acrobatics check
-   If you equal or exceed grappler's successes: Escape and can move normally

### Restrained (More Severe)
#### Effect:
-   Movement speed reduced to 0
-   Cannot take [Move] actions
-   All attacks and skill checks: Add 2 to die results
-   Attacks against you have Fortune
-   Automatically fail Reflex saves

#### Common Sources:
-   Nets, chains, magical bindings
-   Special monster abilities (web, constrict)
-   Space weaves (force cage)

#### Escaping Restrained:
-   Depends on source
-   Physical bonds: Athletics or Devices check (typically 2 successes)
-   Magical bonds: Usually requires dispelling or breaking concentration

### Bleeding
#### Effect:
-   Take 2 damage per stack at the end of each of your turns
-   Stacks: Multiple bleeding effects add together (2 stacks = 4 damage
    per turn, 3 stacks = 6 damage per turn)
-   Bleeding damage occurs at the end of your turn, even if you received
    healing (unless the bleeding condition itself was removed)

#### Bleeding While Dying:

-   If at 0 HP or below, bleeding damage stops (no damage taken while dying)
-   However, add your total bleeding stack count to both dice when making stabilization saves.

-   **Example:** At -2 HP with 2 bleeding stacks, you add 2 (from negative HP) = add 2 total to both your Constitution die and Luck die when attempting to stabilize
-   This makes it much harder to stabilize.

#### Stopping Bleeding:
-   Medicine check (1 action, 1 success): Stop 1 bleeding stack on adjacent ally
-   Self-treatment (1 action, 2 successes): Stop 1 bleeding stack on yourself
-   Magical healing: Automatically stops all bleeding stacks
-   Pressure/Bandages: Can attempt Medicine check even without training
-   Short rest: Automatically stops 1 bleeding stack

#### Duration:
-   Continues until stopped by Medicine check, magic, or rest
-   Each stack must be treated separately

#### Gaining Bleeding:
-   Critical hits with slashing weapons (optional rule)
-   Special monster abilities (claws, teeth)
-   Called shots to cause bleeding
-   Certain environments (barbed wire, thorns)

##### Example:
-   Character takes a critical hit and gains 2 bleeding stacks
-   On their turn, they can use an action to attempt self-treatment (2 successes needed)
-   At the end of their turn, if bleeding wasn\'t stopped, they take 4 damage
