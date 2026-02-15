# Effect System Usage Guide

## Overview
The effect system uses a **drag-and-drop** pattern inspired by PF2e. Effects appear as draggable elements in weave cast cards and can be dropped onto actor tokens or character sheets to apply them.

## How to Apply Effects

### Drag & Drop (Primary Method)
1. Cast a weave that has effects configured
2. The weave card appears in chat with draggable effect elements
3. Click and drag an effect onto an actor token or character sheet
4. The effect is applied with duration based on caster's successes

See [DRAG_DROP_EFFECTS.md](DRAG_DROP_EFFECTS.md) for complete documentation.

### Save System (For Damage)
The save button system is separate and primarily used for damage calculation:
1. Target clicks "Make [Save Type] Save"
2. Rolls save
3. Net successes calculated
4. Damage applied
5. **Effects must still be dragged** - they are NOT auto-applied after saves

## Integration Complete

### 1. Engine Initialization
The effect engine is initialized in the init hook:
- Location: [legends.mjs](foundryvtt/module/legends.mjs#L128)
- Registers combat hooks for duration tracking
- Sets up turn-based duration decrements

### 2. Effect Application During Weave Casting
Effects are automatically applied in `calculateWeaveEffect()`:
- Location: [legends.mjs](foundryvtt/module/legends.mjs#L1020-L1045)
- Checks if weave has `appliesEffects` array
- Only applies if margin > 0 (successful effect)
- Passes origin data (caster ID, weave ID, successes, potential)
- Evaluates parameterized formulas with net successes
- Displays applied effects in the result card

### 3. Sample Weaves Configured
Two sample weaves are ready to test:

#### Barkward (DR Bonus)
- Location: [barkward.json](foundryvtt/packs/weaves/_source/barkward.json)
- Applies: `dr-bonus` effect with value 2
- Effect: Grants +2 DR for duration based on net successes
- Duration Scaling: 1=1 round, 2=1 min, 3=10 min, 4=1 hour

#### Haste (Multiple Mods)
- Location: [haste.json](foundryvtt/packs/weaves/_source/haste.json)
- Applies: `haste` effect
- Effect: +1 action, -1 on Reflex saves/Agility checks
- On expiration: Applies 1 level of Exhaustion
- Duration Scaling: 1=1 round, 2=1 min, 3=10 min, 4=no exhaustion (1 hour)

## Testing the System

### In Foundry:
1. Launch Foundry and load the Legends system
2. Create a character or use an existing one
3. Add the Barkward or Haste weave to the character
4. Cast the weave targeting another token
5. The target makes a save (or use "Apply Effect" for no-save)
6. Check the result card for "Effects Applied" section
7. Check the target actor - effect should appear in their items
8. Enter combat and advance rounds to see duration decrement

### Expected Behavior:
- **On Cast Success**: Effect appears on target actor with calculated duration
- **On Turn/Round**: Duration automatically decrements
- **On Expiration**: Effect is removed, activeEffects reversed
- **With Damage Tick**: Periodic damage applied each turn
- **With Recovery**: Save offered each turn to end effect early

## Effect Template Reference
All effects are stored in: `foundryvtt/packs/effects/_source/`

Current templates:
- `dr-bonus.json` - Damage Reduction bonus
- `flight.json` - Flight capability with speed override
- `invisibility.json` - Visual concealment
- `haste.json` - Speed/action buff with exhaustion
- `fortunes-favor.json` - Dice modifier (fortune/misfortune)
- `temp-hp.json` - Temporary hit points

## Adding Effects to Weaves

In your weave JSON (`system` section):
```json
"appliesEffects": [
  {
    "effectId": "effect-name",
    "params": {
      "value": "2",
      "customParam": "${netSuccesses}"
    }
  }
]
```

### Parameters Support:
- Static values: `"value": "2"`
- Formulas: `"value": "${netSuccesses}"`
- Origin references: `"${origin.successes}"`, `"${origin.potential}"`
- Math expressions: `"${netSuccesses * 2}"`

## Duration Scaling
Standard pattern (configurable per effect):
- 0 net successes: Effect fails/resisted
- 1 net success: 1 round
- 2 net successes: 1 minute (10 rounds)
- 3 net successes: 10 minutes (100 rounds)
- 4+ net successes: 1 hour (600 rounds)

Duration type can be:
- `rounds`: Standard duration
- `instant`: Applied immediately, no duration tracking
- `permanent`: Lasts until dispelled/removed
- `until-save`: Lasts until successful save

## Effect Types Supported

### 1. Attribute Modifiers
- Semantic key: `attribute.{stat}`
- Example: Increase Strength, decrease Agility

### 2. Dice Modifiers
- Semantic key: `diceMod.fortune` or `diceMod.misfortune`
- Example: Add fortune/misfortune die to rolls

### 3. DR Modifications
- Semantic key: `system.dr.bonus`
- Example: Barkward (+2 DR)

### 4. Temporary HP
- Semantic key: `system.hp.temp`
- Example: Shield of faith

### 5. Speed Changes
- Semantic key: `actionsystem.actions.move.speed`
- Example: Haste (increased), Slow (decreased)

### 6. Action Modifications
- Semantic key: `actionsystem.actions.total`
- Example: Haste (+1 action)

### 7. Visibility/Concealment
- Semantic key: `visibility.hide`, `visibility.concealed`
- Example: Invisibility, Blur

### 8. Damage Over Time
- Uses `damageTick` property with repeating damage
- Half DR for energy types
- Can include save to reduce/end

## Next Steps

### Immediate:
- Test in actual Foundry session
- Verify combat integration (duration decrement)
- Confirm save mechanics work for damage ticks

### Future Enhancements:
- Create effect sheet (Application V2) for GUI editing
- Add more effect templates for common weave patterns
- Implement effect stacking rules (if needed)
- Add visual indicators/badges to tokens
- Create effect browser/compendium viewer

## Documentation
- Full specification: [EFFECT_ITEM_SPEC.md](foundryvtt/packs/effects/_source/EFFECT_ITEM_SPEC.md)
- Implementation guide: [EFFECTS_README.md](foundryvtt/packs/effects/_source/EFFECTS_README.md)
- Engine code: [effect-engine.mjs](foundryvtt/module/effect-engine.mjs)
