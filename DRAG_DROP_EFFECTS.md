# Drag & Drop Effect System

## Overview
Following the PF2e pattern, effects can be dragged from two sources and dropped onto actor tokens or character sheets:

1. **Weave Cast Cards**: Effects from weave castings with full caster context
2. **Enriched Text**: Inline effects embedded in descriptions using `[[/effect name=...]]` syntax

See also: [TEXT_ENRICHMENT_EFFECTS.md](TEXT_ENRICHMENT_EFFECTS.md) for inline effect syntax.

## How It Works

### 1. Weave Cast Card Effects

#### Casting a Weave with Effects
When you cast a weave that has `appliesEffects` configured:
- The weave cast card appears in chat
- Effects are listed in a "Effects" section with a purple border
- Each effect shows: icon, effect name, and "(drag to actor)" hint
- Effects are draggable - cursor changes to "grab" on hover

### 2. Applying Effects via Drag & Drop
To apply an effect:
1. Click and hold on the effect element in the chat card
2. Drag it over an actor token on the canvas OR over a character sheet
3. Release to drop
4. The effect is applied with:
   - Caster's weaving successes as the baseline
   - Origin data (caster ID, weave ID, magical potential)
   - Parameterized values from the effect reference
   - Duration calculated from caster's successes

### 3. Save System (Separate)
The save system remains for damage calculation:
- Target clicks "Make [Save Type] Save" button
- Rolls their save
- Net successes determined (caster successes - save successes)
- Damage calculated and applied
- **Effects are NOT auto-applied** - they must be dragged

### 4. Inline Effects (from Enriched Text)
Effects can also be embedded in text using enrichment syntax:
- Use `[[/effect name=haste]]` in any text editor field
- Appears as an inline draggable effect element
- Can be used in: weave descriptions, item descriptions, journal entries
- Applies with default context (2 successes = 1 minute duration)
- Perfect for items, feats, environmental effects

**Example in Weave Description:**
```html
<p>Target gains [[/effect name=haste]]{Haste} (+1 action per turn).</p>
```

**Example in Item Description:**
```html
<p>Drinking this potion grants [[/effect name=temp-hp value=15]]{15 temporary HP}.</p>
```

See [TEXT_ENRICHMENT_EFFECTS.md](TEXT_ENRICHMENT_EFFECTS.md) for complete syntax guide.

## Configuration

### Adding Effects to Weaves
In the weave's JSON (`system` section):
```json
"appliesEffects": [
  {
    "effectId": "haste",
    "params": {}
  },
  {
    "effectId": "dr-bonus",
    "params": {
      "value": "2"
    }
  }
]
```

### Effect Parameters
- `effectId`: Name or ID of the effect in the effects compendium
- `params`: Object with effect-specific parameters (e.g., `value: "2"` for DR bonus amount)

## Examples

### Example 1: Haste
```json
"appliesEffects": [
  {
    "effectId": "haste",
    "params": {}
  }
]
```
- Cast Haste weave, roll 3 successes
- Haste effect appears in chat card as draggable
- Drag to ally's token
- Haste effect applied with 3 successes (duration = 10 minutes)

### Example 2: Barkward (DR Bonus)
```json
"appliesEffects": [
  {
    "effectId": "dr-bonus",
    "params": {
      "value": "2"
    }
  }
]
```
- Cast Barkward, roll 2 successes
- DR Bonus effect appears in chat card
- Drag to target's token
- +2 DR applied with 1 minute duration (2 successes = 1 min)

## Technical Details

### Drag Data Structures

#### WeaveEffect (from cast cards)
```javascript
{
  type: 'WeaveEffect',
  effectId: 'haste',
  casterId: 'actor123',
  weaveId: 'weave456',
  casterSuccesses: 3,
  params: {}
}
```

#### InlineEffect (from enriched text)
```javascript
{
  type: 'InlineEffect',
  effectId: 'temp-hp',
  params: { value: '15' }
}
```

### Drop Handling
Character sheets handle both `WeaveEffect` and `InlineEffect` drops:

**For WeaveEffect:**
1. Retrieve caster and weave from IDs
2. Load effect template from compendium
3. Evaluate formulas with full caster context:
   - `${netSuccesses}` = caster's successes
   - `${origin.successes}` = caster's successes
   - `${origin.potential}` = caster's magical potential
   - `${value}` = from params
4. Apply activeEffects to the actor
5. Set duration based on caster's successes

**For InlineEffect:**
1. Load effect template from compendium
2. Evaluate formulas with default context:
   - `${netSuccesses}` = 2 (default)
   - `${origin.successes}` = 2
   - `${origin.potential}` = 0
   - `${value}` = from params
3. Apply activeEffects to the actor
4. Set duration to 1 minute (2 successes default)
5. Origin set to target actor (self-origin)

### Duration Scaling

**WeaveEffect** - Based on caster's actual roll:
- 1 success: 1 round
- 2 successes: 1 minute (10 rounds)
- 3 successes: 10 minutes (100 rounds)
- 4+ successes: 1 hour (600 rounds)

**InlineEffect** - Fixed default (2 successes):
- Always 1 minute (10 rounds)
- Unless effect template specifies different duration type

Some effects may override this scaling (see effect template configuration).

## WeaveEffect vs InlineEffect Comparison

| Feature | WeaveEffect | InlineEffect |
|---------|-------------|--------------|
| **Source** | Weave cast cards | Enriched text (`[[/effect ...]]`) |
| **Caster Context** | Full (caster ID, weave ID) | None (self-origin) |
| **Duration** | Based on casting roll | Fixed (2 successes = 1 min) |
| **Magical Potential** | Uses caster's value | Always 0 |
| **Parameters** | From weave config | From enrichment syntax |
| **Use Cases** | Combat spells, targeted weaves | Items, feats, environmental effects |
| **Net Successes** | Variable (based on roll) | Fixed at 2 |
| **Origin Actor** | The caster | The target (self) |

### When to Use Each Type

**Use WeaveEffect when:**
- Casting in combat with variable outcomes
- Success/failure matters for effectiveness
- Need to track who cast the effect
- Duration should scale with caster's power
- Multiple targets from one casting

**Use InlineEffect when:**
- Representing consumable items (potions, scrolls)
- Feat/trait granted abilities
- Environmental or area effects (shrines, zones)
- GM tools for quick effect application
- Documentation and reference materials

## Implementation Files

### Modified Files
1. **legends.mjs** (`createWeaveCastCard`)
   - Added draggable effects section to cast card HTML
   - Added data attributes for drag handling
   - Removed "Apply Effect" button when effects are present
   
2. **combat.mjs** (`renderChatMessageHTML` hook)
   - Added dragstart event handler for `.draggable-effect` elements
   - Sets drag data with WeaveEffect information

3. **enrichers.mjs** (NEW)
   - Added `enrichEffect()` function
   - Updated pattern regex to include `effect` type
   - Added dragstart handler for inline effects
   - Creates draggable inline effect elements from text

4. **character-sheet.mjs** (`_onDropItem`)
   - Added handling for `WeaveEffect` type drops
   - Added handling for `InlineEffect` type drops
   - Calls `effectEngine.applyEffect()` with proper context
   
5. **legends.css**
   - Added styles for `.weave-effects-list` and `.draggable-effect`
   - Added styles for `.inline-effect` (compact inline display)
   - Visual feedback (hover, grab cursor, elevation)

### Effect Application Flow
```
Cast Weave
  ↓
Chat Card Created
  ↓
Effect Elements Rendered (draggable=true)
  ↓
User Drags Effect
  ↓
dragstart Event → Set Drag Data
  ↓
User Drops on Actor
  ↓
_onDropItem → Detect WeaveEffect Type
  ↓
effectEngine.applyEffect()
  ↓
Load Effect Template from Compendium
  ↓
Evaluate Formulas
  ↓
Apply ActiveEffects to Actor
  ↓
Set Duration
  ↓
Add Effect Item to Actor
```

## Advantages Over Auto-Apply

1. **Flexibility**: Can apply effects to any actor, not just original targets
2. **Control**: GM/players decide when and to whom effects apply
3. **Clarity**: Visual representation of available effects
4. **PF2e-Style UX**: Familiar pattern for experienced Foundry users
5. **Separation of Concerns**: Damage/saves separate from buff/debuff effects

## Future Enhancements

### Potential Improvements
- Token HUD drop support (in addition to sheet drops)
- Visual indicators on tokens when dragging effects over them
- Effect preview tooltip when hovering during drag
- Multi-target application (shift+drag to apply to multiple?)
- Effect stacking rules and limitations
- "Quick apply" button as alternative to drag/drop

### Integration Points
- Spell effect links in chat (click to see description)
- Right-click menu on effects for options
- Condition tracking integration (some effects might apply conditions)
- Combat tracker integration (duration display)

## Notes for Weave Builders

When adding effects to weaves:
1. **Save-based weaves**: Effects should still be draggable, not auto-applied after saves
2. **Buff weaves**: Perfect for drag/drop (Haste, Barkward, etc.)
3. **Debuff weaves**: Can be dragged onto enemies or used with save system
4. **Damage weaves**: Use save system for damage, drag for secondary effects

## Important: Build Script Impact

⚠️ **WARNING**: The weave build script (`build_weaves_pack.py`) regenerates JSON from markdown files, which will **remove manually added `appliesEffects` fields**. 

To preserve effect configurations:
1. After running the build script, manually re-add `appliesEffects` to affected weaves
2. OR modify the build script to preserve these fields
3. OR add effect information to the markdown source files

Current affected weaves:
- `haste.json` - has `appliesEffects: [{ effectId: "haste", params: {} }]`
- `barkward.json` - has `appliesEffects: [{ effectId: "dr-bonus", params: { value: "2" } }]`
