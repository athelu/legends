# Magical Traits UI Workflow

## Overview

The magical traits system provides a guided, step-by-step workflow for applying magical traits to characters. The system automatically detects modifier traits (Gifted Mage, Balanced Channeler) and adjusts the potential generation accordingly.

## Workflow Architecture

### Detection Phase
1. **Modifier Trait Detection**: System checks if actor has Gifted Mage or Balanced Channeler
2. **Conflict Detection**: Validates that actor doesn't already have a primary magical trait
3. **Intro Dialog**: Shows user what to expect based on their configuration

### Generation Modes

#### Normal Mode
- Roll standard dice for potentials (8d8 or 5d8)
- Results posted to chat
- Sorted highest to lowest

#### Gifted Mage Mode
- Roll N+1 dice (9d8 or 6d8) 
- Drop lowest result
- Show all rolls with lowest crossed out
- Keep top N results

#### Balanced Channeler Mode
- Use fixed array instead of rolling
- 8d8 traits: [5, 4, 3, 3, 2, 2, 1, 1]
- 5d8 traits: [4, 3, 2, 2, 1]
- Post "roll" result to chat for consistency

## Trait-Specific Workflows

### Mageborn (-7)
**Requirements**: Intelligence ≥ 3

**Workflow Steps**:
1. Check for Gifted Mage/Balanced Channeler
2. Show intro dialog explaining process
3. Generate 8 potentials (mode-dependent)
4. **Choose Elemental Affinity** (Earth/Air/Fire/Water)
   - Highest roll + 2 (max 8) assigned to chosen element
5. **Choose Secondary Focus** (any other energy)
   - Any roll + 1 assigned to chosen energy
6. **Assign Remaining Rolls** to other 6 energies
7. Set Intelligence as Casting Stat
8. Initialize 8 Mastery skills (all rank 0)
9. Add Ritual Casting ability

**Key Choices**:
- Elemental affinity determines primary power focus
- Secondary focus often Time or Space for utility
- Manual assignment allows customization

### Divine Gift (-7)
**Requirements**: Wisdom ≥ 3

**Workflow Steps**:
1. Check for Gifted Mage/Balanced Channeler
2. Show intro dialog
3. Generate 8 potentials
4. **Choose Patron Deity** (9 options + Generalist)
   - Each patron has Primary and Secondary energies
   - Generalist gets +1 to top 3 rolls instead
5. **Auto-assign Primary** (highest + 2) and **Secondary** (2nd highest + 1)
6. **Assign Remaining Rolls** to other energies
7. Set Wisdom as Casting Stat
8. Initialize 8 Mastery skills
9. Add 2 Channel Divinity uses per long rest
10. Grant Channel Divinity abilities for chosen patron

**Key Choices**:
- Patron choice is permanent and defines your divine connection
- Primary/Secondary energies are auto-assigned based on patron
- Generalist has more flexibility but no focused power

### Invoker (-5)
**Requirements**: Charisma ≥ 3

**Workflow Steps**:
1. Check for Gifted Mage/Balanced Channeler
2. Show intro dialog
3. Generate 5 potentials
4. **Fix Air as Primary** (highest + 2) - Words of Power
5. **Fix Positive as Secondary** (2nd highest + 1) - True names of life
6. **Choose 5th Energy** (Earth, Fire, Water, or Negative)
   - This determines your elemental specialty
7. **Assign 3 Rolls** to Space, Time, and chosen element
8. Set Charisma as Casting Stat
9. Initialize 5 Mastery skills
10. Add Words of Power ability (1/short rest)

**Key Choices**:
- Air and Positive are fixed (invoker signature energies)
- 5th energy choice defines your elemental focus
- Space and Time provide utility

### Infuser (-5)
**Requirements**: Intelligence ≥ 3

**Workflow Steps**:
1. Check for Gifted Mage/Balanced Channeler
2. Show intro dialog
3. Generate 5 potentials
4. **Fix Earth as Primary** (highest + 2) - Material manipulation
5. **Fix Space as Secondary** (2nd highest + 1) - Barriers and containment
6. **Choose 5th Energy** (Air, Fire, Water, or Negative)
   - This determines your infusion specialty
7. **Assign 3 Rolls** to Positive, Time, and chosen element
8. Set Intelligence as Casting Stat
9. Initialize 5 Mastery skills
10. Add Imbue Item ability (1/short rest)

**Key Choices**:
- Earth and Space are fixed (infusion foundation)
- 5th energy choice defines your imbuing style
- Positive and Time for enhancement and duration

### Sorcerous Origin (-7)
**Requirements**: Wisdom ≥ 3

**Workflow Steps**:
1. Check for Gifted Mage/Balanced Channeler
2. Show intro dialog
3. Generate 8 potentials
4. **Choose Force of Will Manifestation**:
   - Unchanging Stone (Earth/Fire)
   - Thread of Fate (Time/Positive)
   - Death's Lesson (Fire/Negative)
   - Perfect Self-Perception (Space/Air)
5. **Choose Primary Energy** from manifestation's 2 options
   - Highest roll + 2 assigned
6. **Choose Secondary Focus** (any other energy)
   - Any roll + 1 assigned
7. **Assign Remaining Rolls** to other energies
8. Set Wisdom as Casting Stat
9. Initialize 8 Mastery skills
10. Grant manifestation-specific passive abilities

**Key Choices**:
- Manifestation defines your source of power and story
- Primary energy must match manifestation theme
- Secondary focus allows customization

### Eldritch Pact (-7)
**Requirements**: Charisma ≥ 3

**Workflow Steps**:
1. Check for Gifted Mage/Balanced Channeler
2. Show intro dialog
3. Generate 5 potentials
4. **Choose Pact Type**:
   - Survivor's Bargain (Space, Negative, Fire, Earth, Time)
   - Desperate Deal (Positive, Space, Air, Time, Water)
   - Answered Cry (Air, Negative, Space, Time, Water)
   - Stolen Shard (Fire, Negative, Space, Earth, Time)
5. **Auto-assign Primary** (highest + 2) based on pact
6. **Auto-assign Secondary** (2nd highest + 1) if pact specifies
7. **Assign Remaining Rolls** to pact's other energies
8. Set Charisma as Casting Stat
9. Initialize 5 Mastery skills
10. Grant pact-specific Conduit ability
11. Grant pact-specific Gift ability
12. Set Energy regeneration to short rest

**Key Choices**:
- Pact type determines all 5 energies (no choice)
- Reflects the traumatic/desperate origin of power
- Each pact has unique Conduit and Gift abilities

## Validation Rules

### Primary Trait Conflicts
A character **CANNOT** have multiple primary magical traits:
- ❌ Mageborn + Divine Gift
- ❌ Invoker + Infuser
- ❌ Sorcerous Origin + Eldritch Pact

### Modifier Trait Application
Modifier traits are **PASSIVE** and should be added **BEFORE** primary traits:
- **Gifted Mage** should be added to sheet BEFORE applying Mageborn/Divine Gift
- **Balanced Channeler** should be added to sheet BEFORE applying Mageborn/Divine Gift

**Application Order**:
1. Add modifier trait(s) to sheet (Gifted Mage/Balanced Channeler)
   - These just sit on the sheet as passive traits
   - No validation or workflow triggered
2. Add primary trait (Mageborn/Divine Gift/etc.)
   - System automatically detects modifiers via `getPotentialGenerationMode()`
   - Applies appropriate rolling method (9d8 drop lowest, fixed array, or normal)

**Why This Order?**
The system needs to know which modifiers are present BEFORE rolling potentials. If you add modifiers after the primary trait, they won't affect the initial potential generation.

## User Experience Flow

### Example: Mageborn with Gifted Mage

**Correct Application Order**:
```
Step 1: User drags "Gifted Mage (-2)" to character sheet
        System: ✅ "Gifted Mage added. When you apply Mageborn or Divine Gift,
                    you will automatically roll 9d8 and drop the lowest."

Step 2: User drags "Mageborn (-7)" to character sheet
        System detects: Gifted Mage is present!

Dialog 1: "You are about to apply Mageborn. 
          🌟 Gifted Mage detected! You will roll 9d8 and drop the lowest.
          Ready to begin?"
          
[User clicks Yes]

System rolls: 9d8 → [7, 6, 5, 5, 4, 3, 3, 2, 1]
Chat shows: "All Rolls: 7, 6, 5, 5, 4, 3, 3, 2, 1
             Dropped: 1̶
             Kept: 7, 6, 5, 5, 4, 3, 3, 2"

Dialog 2: "Choose your Elemental Affinity"
          [Fire] [Water] [Earth] [Air]
          
[User chooses Fire]

Dialog 3: "Your highest roll (7) + 2 = 8(max) → Fire Potential
          Choose your Secondary Focus"
          [Water] [Earth] [Air] [Positive] [Negative] [Time] [Space]
          
[User chooses Time]

Dialog 4: "Assign remaining rolls:
          Fire: 8 (locked)
          Time: Will receive +1
          
          Assign these rolls to remaining energies:
          Available rolls: 6, 5, 5, 4, 3, 3, 2
          
          Water: [ dropdown ]
          Earth: [ dropdown ]
          Air: [ dropdown ]
          Positive: [ dropdown ]
          Negative: [ dropdown ]
          Space: [ dropdown ]"

[User assigns all rolls]

System: ✅ "Mageborn trait applied successfully!"
        Updates: Potentials, Mastery skills, Casting Stat
        Adds: Ritual Casting ability
```

**Why This Order Works**:
- Gifted Mage is already on the sheet when Mageborn application starts
- `getPotentialGenerationMode()` detects Gifted Mage → returns 'gifted'
- `rollPotentials(8, 'gifted')` rolls 9d8 and drops lowest automatically

## Chat Integration

All potential rolls are posted to chat with:
- **Normal**: `Rolling 8d8 for Magical Potentials: [results]`
- **Gifted Mage**: `Rolling 9d8 (drop lowest): All [9 results], Dropped: X̶, Kept: [8 results]`
- **Balanced Channeler**: `8 Potentials (Balanced Channeler): Fixed Array: 5, 4, 3, 3, 2, 2, 1, 1`

This provides transparency and recordkeeping for character creation.

## Future Enhancements

### Phase 2 (Pending)
- Character sheet UI for displaying potentials/mastery
- Manual editing of potentials/mastery values
- Trait removal/reapplication logic
- Automatic trait application on item drop

### Phase 3 (Pending)  
- Prerequisites validation (Intelligence ≥ 3 for Mageborn)
- Ability item implementations (Ritual Casting, Channel Divinity options)
- Passive effect calculations (Sorcerer manifestation bonuses)
- Energy pool calculation display

## Trait Removal and Reapplication

### Automatic Cleanup on Deletion

When a primary magical trait is removed from a character (via item deletion):

**System automatically cleans up**:
1. ✅ Removes all granted abilities (Ritual Casting, Channel Divinity, Words of Power, etc.)
2. ✅ Clears all potentials (resets to 0)
3. ✅ Clears all mastery values (resets to 0)
4. ✅ Clears casting stat
5. ✅ Clears magicalTrait configuration (type, subtype, patron, etc.)
6. ✅ Resets isSetup flag to false
7. ✅ Clears Channel Divinity uses (for Divine Gift)

**What is preserved**:
- Other items and abilities not related to magical traits
- Character attributes, skills, and other system data
- Non-magical traits (Physical/Mental traits remain)

### Reapplication Flow

Characters can freely add a new magical trait after removing one:

1. **Remove Old Trait**: Delete the magical trait item from character sheet
   - System detects deletion via `Hooks.on('deleteItem')`
   - Calls `handleMagicalTraitRemoval(actor, item)`
   - All magical data cleared

2. **Add New Trait**: Drag a new magical trait onto the character
   - Validation checks if another primary trait exists (should pass since we cleaned up)
   - Sets `magicalTrait.type` to new trait type
   - Sets `isSetup: false`
   - Shows notification to visit Magic tab

3. **Complete Setup**: Open Magic tab and click setup button
   - Full guided workflow runs
   - New potentials rolled
   - New choices made
   - New abilities granted
   - `isSetup` set to true

### Modifier Traits (Gifted Mage / Balanced Channeler)

**Removing modifier traits**:
- No special cleanup needed (they're passive)
- Just removes the trait item
- Next primary trait won't detect the modifier anymore

**Re-adding before setup**:
- If you remove Gifted Mage then immediately re-add it
- The primary trait setup will detect it if not yet completed
- Once setup is complete, adding/removing modifiers has no effect

### Use Cases

**Character Creation Mistakes**:
```
1. Player adds Mageborn by accident
2. Player deletes Mageborn trait → All data cleared
3. Player adds Divine Gift instead → Fresh setup
4. Player completes Divine Gift setup → Success!
```

**Testing Different Builds**:
```
1. GM enables character edit mode
2. Delete Invoker trait → Abilities removed, data cleared
3. Add Sorcerous Origin → New setup workflow
4. Compare different magical approaches
```

**Respec During Campaign** (DM discretion):
```
1. Character story justifies changing magical source
2. DM allows trait removal
3. All magical abilities removed automatically
4. Player selects new trait and completes setup
5. Fresh start with new magical powers
```

### Implementation Details

**Hook**: `Hooks.on('deleteItem')` in `legends.mjs`
- Checks if deleted item is a trait
- Calls `magicalTraits.handleMagicalTraitRemoval(actor, item)`

**Cleanup Function**: `handleMagicalTraitRemoval(actor, item)` in `magical-traits.mjs`
- Identifies if trait is primary magical trait
- Finds all abilities granted by magical traits (by source or name pattern)
- Removes abilities via `actor.deleteEmbeddedDocuments('Item', ids)`
- Clears all magical trait data via `actor.update()`
- Shows confirmation notification

**Validation**: `validateTraitRemoval(actor, item)` (currently permissive)
- Could add restrictions in future (e.g., can't remove during combat)
- Returns `{ canRemove: boolean, reason?: string }`

## Technical Implementation

### Key Functions

**magical-traits.mjs**:
- `hasTraitWithName(actor, pattern)` - Detect trait by name
- `getPotentialGenerationMode(actor)` - Returns 'normal'/'gifted'/'balanced'
- `getExistingPrimaryMagicalTrait(actor)` - Find conflicting traits
- `validateMagicalTraitApplication(actor, type)` - Pre-apply validation
- `showWorkflowIntroDialog(name, mode)` - Intro confirmation
- `rollPotentials(count, mode)` - Generate potentials with modes
- `apply[TraitName](actor, item)` - Trait-specific workflows

**trait-effects.mjs**:
- `applyTraitEffects(actor, item)` - Main entry point with validation
- `getTraitType(item)` - Identify trait type
- `isMagicalTrait(item)` - Check if magical

### Data Model

**system.potentials**: `{ fire: X, water: X, ... }` (8 energy types)  
**system.mastery**: `{ fire: X, water: X, ... }` (8 mastery skills)  
**system.castingStat**: `{ value: 'intelligence'|'wisdom'|'charisma', label: string }`  
**system.magicalTrait**: Configuration object with trait-specific data  
**system.channelDivinity**: `{ current: X, max: X }` (Divine Gift only)

---

**Implementation Status**: ✅ Phase 1 Complete (Core workflow functions implemented)  
**Testing Status**: ⏳ Pending (Needs Foundry runtime testing)  
**UI Status**: ⏳ Pending (Character sheet integration required)
