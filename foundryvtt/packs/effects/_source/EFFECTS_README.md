# Effects System - Implementation Guide

## What We've Built

The Legends system now has a robust **effects framework** inspired by PF2e but adapted to our d8 system. Effects are separate from conditions and represent temporary buffs, debuffs, transformations, and other time-limited modifications.

## Components Created

### 1. **Effect Item Type** (`template.json`)
- Added `"effect"` to Item types
- Comprehensive schema with:
  - `activeEffects` - Semantic modifications to actor data
  - `duration` - Parameterized timing with scaling
  - `badge` - Visual indicators on tokens
  - `origin` - Tracks caster/source information
  - `parameterized` - Formula-based values
  - `damageTick` - Periodic damage/healing
  - `recovery` - Save mechanics to end early

### 2. **Effects Compendium** (`packs/effects/`)
- Registered in `system.json`
- Contains `_source/` folder with JSON definitions
- Sample effects created:
  - **DR Bonus** - Increases damage reduction
  - **Flight** - Grants flying movement
  - **Invisibility** - Hidden condition + dice mods
  - **Haste** - Complex multi-effect with exhaustion
  - **Fortune's Favor** - Minor dice modifier
  - **Temporary HP** - Depleting temporary hit points

### 3. **Documentation** (`EFFECT_ITEM_SPEC.md`)
- Complete schema reference
- Semantic key explanations
- Parameterized formula system
- Integration examples
- Creation guidelines

### 4. **Weave Integration** (`template.json`)
- Added `appliesEffects` array to weaves
- Weaves can reference effects to apply with parameters

## How It Works

### Effect Structure
```json
{
  "name": "DR Bonus",
  "type": "effect",
  "system": {
    "category": "buff",
    "effectType": "attribute-mod",
    "badge": {"type": "value", "value": 2},
    "activeEffects": [
      {"key": "system.dr.bonus", "mode": "add", "value": "${value}"}
    ],
    "duration": {
      "base": 1,
      "scaling": "netSuccesses"
    },
    "parameterized": {
      "valueFormula": "${value}",
      "durationFormula": "${netSuccesses} >= 4 ? 3600 : 60"
    }
  }
}
```

### Weave References Effects
```json
{
  "name": "Barkward",
  "system": {
    "appliesEffects": [
      {
        "effectId": "drbonus0000000001",
        "effectName": "DR Bonus",
        "params": {
          "value": 2
        }
      }
    ]
  }
}
```

### Application Flow
1. Weave is cast → targets selected
2. Weaving check made → successes determined
3. Targets make saves → net successes calculated
4. For each effect referenced:
   - Load effect template from compendium   - Evaluate parameterized formulas with actual values
   - Create effect instance on target actor
   - Set origin data (caster, successes)
   - Apply activeEffects to actor
   - Add badge to token
   - Start duration tracking

## Semantic Keys (activeEffects)

The engine interprets these keys to modify actor data:

### Attributes
- `system.dr.bonus` - Add to damage reduction
- `system.dr.value` - Override damage reduction
- `system.hp.temp` - Temporary HP
- `system.attributes.*.tempValue` - Temporary attribute override
- `system.speed.base` - Movement speed
- `system.movement.fly` - Flying speed

### Dice Modifiers
- `diceMod.fortune` - Add Fortune to rolls
- `diceMod.misfortune` - Add Misfortune to rolls
- `diceMod.attack` - Modify attack rolls
- `diceMod.reflex` - Modify Reflex saves
- `diceMod.agility` - Modify Agility checks
- `diceMod.stealth` - Modify Stealth checks

### Action Economy
- `system.actions.max` - Maximum actions per turn
- `system.actions.bonus` - Bonus actions

### Visibility
- `visibility.invisible` - Set invisibility status
- `visibility.concealed` - Concealment level

## Parameterized Formulas

Effects can use variables in formulas:
- `${value}` - Passed in from weave
- `${netSuccesses}` - Net successes (caster - target save)
- `${origin.successes}` - Caster's weaving successes
- `${origin.potential}` - Caster's relevant Potential score

Example:
```json
{
  "valueFormula": "${origin.successes} * 2",
  "durationFormula": "${netSuccesses} >= 4 ? 3600 : ${netSuccesses} >= 3 ? 600 : 60"
}
```

## Duration Scaling

Common pattern for `duration.scaling: "netSuccesses"`:
- Net 1: 1 round
- Net 2: 1 minute (10 rounds)
- Net 3: 10 minutes
- Net 4: 1 hour

Custom scaling uses `durationFormula`.

## Stacking Rules

- `replace` - New effect replaces old (default)
- `stack` - Multiple instances stack
- `highest` - Keep highest value
- `extend` - Extend duration but keep value

## Next Steps (Not Yet Implemented)

### Effect Application Engine
Create `effect-engine.mjs` to:
1. Load effect template from compendium
2. Evaluate parameterized formulas
3. Create effect instance on actor
4. Apply activeEffects to actor data
5. Add visual badges/overlays
6. Track duration and expiration

### Effect Sheet
Build Application V2 sheet for editing effects:
- Visual editor for activeEffects
- Duration configuration UI
- Formula builder
- Preview mode

### Weave Integration
Modify `calculateWeaveEffect` to:
1. Check `weave.system.appliesEffects`
2. For each effect reference:
   - Load effect template
   - Pass parameters (value, netSuccesses, origin)
   - Apply to target actor

### Token Badges
Visual indicators showing:
- Effect duration (rounds remaining)
- Effect value (DR +2, Speed +10)
- Effect icons overlaid on token

### Duration Tracking
Hook into combat/time system:
- Decrement effect duration each round/turn
- Remove expired effects
- Handle "until sustained" effects
- Process damageTick effects

## Examples

### Simple Buff (Force Armor)
```json
{
  "appliesEffects": [
    {
      "effectId": "drbonus0000000001",
      "params": {"value": 3}
    }
  ]
}
```
Applies +3 DR, duration scales with net successes.

### Complex Multi-Effect (Haste)
```json
{
  "appliesEffects": [
    {
      "effectId": "haste000000000001",
      "params": {}
    }
  ]
}
```
Grants +1 action, gives penalties, applies exhaustion on end.

### Damage Over Time (Ignited)
```json
{
  "damageTick": {
    "frequency": "startOfTurn",
    "formula": "1d8",
    "type": "fire",
    "save": {"type": "reflex", "effectOnSuccess": "end"}
  }
}
```
Target takes 1d8 fire at start of turn, can save to extinguish.

## Comparison to PF2e

**Similarities:**
- Separate effect item type
- Data-driven modifications
- Duration tracking with badges
- Origin tracking for scaling

**Differences:**
- We use semantic keys (simpler than PF2e's rule elements)
- Our formulas are JavaScript-based (PF2e uses their own DSL)
- We integrate directly with our success-counting system
- Fewer effect types (focused on d8 system needs)

**Why This Approach:**
- Simpler for GMs to create custom effects
- Leverages existing condition system patterns
- Scales well for homebrew content
- Integrates with our weaving success mechanics

## Usage

1. **GMs**: Drag effects from compendium onto actors
2. **Weaves**: Reference effects in `appliesEffects` field
3. **Custom**: Create new effects using templates as examples
4 **Editing**: Use effect sheet (to be implemented) or edit JSON directly

## Files Modified/Created

- `template.json` - Added effect type + weave.appliesEffects
- `system.json` - Registered effects compendium
- `packs/effects/_source/EFFECT_ITEM_SPEC.md` - Complete documentation
- `packs/effects/_source/*.json` - Sample effects
- `packs/effects/_source/EFFECTS_README.md` - This file

## Testing

To test the current implementation:
1. Start Foundry
2. Unlock effects compendium
3. Import an effect (e.g., DR Bonus)
4. Manually drag it onto an actor
5. Verify it appears in actor's items
6. (Effect application from weaves requires effect-engine implementation)

Once effect-engine is built, weaves will automatically apply referenced effects when cast successfully.
