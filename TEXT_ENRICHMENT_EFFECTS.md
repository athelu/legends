# Text Enrichment - Effect Syntax

## Overview
Effects can now be embedded directly in text content (weave descriptions, journal entries, item descriptions) using enrichment syntax. These appear as draggable inline elements that can be applied to actors.

## Syntax

### Basic Effect
```
[[/effect name=haste]]
```
- Creates a draggable "haste" effect element
- Uses default parameters from the effect template
- Applied with 2 successes (1 minute duration) when dropped

### Effect with Custom Label
```
[[/effect name=haste]]{Speed Boost}
```
- Displays as "Speed Boost" instead of "haste"
- Still applies the haste effect when dragged

### Effect with Parameters
```
[[/effect name=dr-bonus value=2]]
```
- Applies DR bonus effect with value=2
- Parameters are passed to the effect template

### Effect with Parameters and Label
```
[[/effect name=dr-bonus value=3]]{+3 Damage Reduction}
```
- Custom label with parameterized effect
- Shows "+3 Damage Reduction" as the draggable text

## Usage Examples

### In Weave Descriptions
```html
<p><strong>Effect:</strong> Target gains [[/effect name=haste]]{Haste} 
which provides +1 action per turn.</p>
```

Result: Text with inline draggable "Haste" effect that can be applied to characters.

### In Item Descriptions
```html
<p>This potion grants [[/effect name=temp-hp value=10]]{10 temporary HP} 
when consumed.</p>
```

Result: Inline draggable effect showing "10 temporary HP".

### In Journal Entries
```html
<p>The blessing of Ashan provides [[/effect name=dr-bonus value=2]]{divine protection (+2 DR)} 
to all followers within the temple.</p>
```

Result: GMs can drag the effect onto player tokens during temple scenes.

### Multiple Effects
```html
<p>The ritual grants both [[/effect name=flight]]{Flight} and 
[[/effect name=invisibility]]{Invisibility} for a short duration.</p>
```

Result: Two separate draggable effects in the same text.

## How It Works

### 1. Text Rendering
- Foundry's TextEditor processes enrichment patterns
- `[[/effect ...]]` syntax is matched and converted to HTML
- Creates a draggable `<div>` element with effect data

### 2. Drag & Drop
- User drags the inline effect element
- Drag data includes: `type: 'InlineEffect'`, `effectId`, `params`
- Can be dropped on actor tokens or character sheets

### 3. Effect Application
- Character sheet detects `InlineEffect` drop
- Applies effect with default context:
  - Origin: Self (the target actor)
  - Successes: 2 (standard 1 minute duration)
  - Potential: 0
  - Params: From the enrichment syntax
- Effect duration scales based on the default 2 successes

## Differences from Weave Effects

### WeaveEffect (from chat cards)
- Has full caster context (caster ID, weave ID, successes)
- Duration based on actual weave casting roll
- Includes caster's magical potential

### InlineEffect (from enriched text)
- Generic effect reference with no specific caster
- Default duration (2 successes = 1 minute)
- No magical potential modifier
- More flexible - can be used anywhere

## Visual Styling

Inline effects appear with:
- Purple border (matching system theme)
- Magic wand icon
- Effect name (or custom label)
- "(drag to actor)" hint
- Hover effects (elevation, color change)
- Grab/grabbing cursor states

## Parameter Support

All parameters are passed to the effect template:
```
[[/effect name=dr-bonus value=5 source=magical]]
```

Becomes:
```javascript
params = {
  value: "5",
  source: "magical"
}
```

The effect template can use these in formulas:
```javascript
activeEffects: [{
  key: "system.dr.bonus",
  mode: "add",
  value: "${value}" // Evaluates to 5
}]
```

## Best Practices

### When to Use Inline Effects
- **Weave descriptions**: Let players apply buff effects
- **Item descriptions**: Consumables, magic items with effects
- **Journal entries**: Environmental effects, blessings, curses
- **Feat descriptions**: Show what effects the feat can grant
- **GM notes**: Quick reference for effects to apply during play

### When to Use Weave Cast Effects
- **Combat spells**: Need full caster context and scaling
- **Targeted weaves**: Multiple targets from a single cast
- **Save-based weaves**: Effect depends on save results
- **Variable duration**: Duration scales with casting success

### Custom Labels
Use custom labels when:
- The effect name is technical (e.g., "dr-bonus" → "+2 DR")
- You want descriptive text (e.g., "haste" → "Blessing of Speed")
- Multiple effects use the same template with different params

## Examples in Practice

### Potion of Healing
```html
<p><strong>Effect:</strong> Restores [[/effect name=temp-hp value=15]]{15 HP}.</p>
```

### Blessing Spell
```html
<p>Target gains [[/effect name=dice-mod type=fortune]]{Fortune} on all rolls 
for the next minute.</p>
```

### Environmental Effect
```html
<p>The magical aura grants [[/effect name=dr-bonus value=3]]{+3 DR} to all 
within 30 feet of the shrine.</p>
```

### Transformation
```html
<p>The druid can assume [[/effect name=flight]]{flight} or 
[[/effect name=beastial-speed]]{enhanced speed} for 10 minutes.</p>
```

## Technical Implementation

### Files Modified
1. **enrichers.mjs**
   - Added `enrichEffect()` function
   - Updated pattern regex to include `effect`
   - Added dragstart handler for inline effects

2. **character-sheet.mjs**
   - Added `InlineEffect` drop handling
   - Applies with default context (2 successes)

3. **legends.css**
   - Added `.inline-effect` styling
   - Compact inline display with hover effects

### Drag Data Structure
```javascript
{
  type: 'InlineEffect',
  effectId: 'haste',
  params: { value: '2', custom: 'param' }
}
```

## Future Enhancements

Potential improvements:
- Right-click menu on inline effects for options
- Configuration dialog before applying (change duration, etc.)
- Preview tooltip showing effect details
- Support for conditional effects (if/when clauses)
- Integration with feat/trait granting systems
