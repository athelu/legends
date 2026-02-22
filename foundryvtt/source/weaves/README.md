# Weave Success Scaling Schema

This directory contains the JSON schema and examples for defining success scaling behavior for weaves in the Legends TTRPG system.

## Files

### Schema
- **weave-schema.json** - Complete JSON Schema (Draft-07) for all weave properties:
  - Base properties (name, energy, range, duration, etc.)
  - Success scaling structure (damage, healing, duration, area, etc.)
  - Classification enums (delivery methods, tags, energy types)
  - Uses `$defs` for reusable patterns
  - Three complete examples (Fireball, Sleep, Light)

### Detectors & Utilities
- **delivery-method-detector.py** - Auto-detection logic for delivery methods
- **tag-detector.py** - Auto-detection logic for tags
- **scaling-utils.mjs** - JavaScript utilities for FoundryVTT
- **scaling-parser-example.py** - Python parser functions for build script

### Examples & Documentation
- **scaling-examples.json** - 15 comprehensive weave examples
- **WEAVE_STRUCTURE.md** - Complete annotated weave structure reference
- **INTEGRATION_GUIDE.md** - Step-by-step integration instructions
- **CLASSIFICATION_GUIDE.md** - Quick reference for delivery methods
- **VALIDATION_CHECKLIST.md** - Quality assurance checklist for weaves
- **IMPLEMENTATION_SUMMARY.md** - Project status and roadmap
- **README.md** - This file

## Weave Classification

Weaves are classified by their **delivery method** - how they mechanically resolve:

### 1. Attack Roll (`deliveryMethod: "attack"`)
- Caster makes attack roll vs target defense
- Hit = damage dealt, miss = no damage  
- **No saving throw**
- Examples: Fire Bolt, Lightning Touch, Frost Touch, Stone Fist
- Buttons: "Cast & Roll Attack"

### 2. Saving Throw (`deliveryMethod: "save"`)
- Targets make saving throw (Will/Fortitude/Reflex)
- Caster successes compared to target save successes
- Two subcategories:

#### 2a. Save-Damage (damage.base > 0)
- Damage scales with net successes
- May apply effects at high success levels
- Examples: Acid Blast, Fireball, Lightning Bolt, Chain Lightning
- Buttons: "Cast & Show Card", "Roll Save", "Apply Damage"

#### 2b. Save-Effect (damage.base = 0)  
- No base damage, effect-only
- Effects/conditions applied based on net successes
- Duration may scale with success level
- Examples: Sleep, Fear, Binding Paralysis, Confusion
- Buttons: "Cast & Show Card", "Roll Save", "Apply Effect"

### 3. Automatic/Utility (`deliveryMethod: "automatic"`)
- No attack roll or saving throw required
- Effects happen automatically when cast
- Typically utility or buff weaves
- Examples: Floating Lights, Light, Identify, Sense Magic, Gentle Descent
- Buttons: "Cast"

This classification is stored in `weave.system.deliveryMethod` and helps route weaves through the correct workflow in FoundryVTT.

## Weave Tags

Weaves are tagged with multiple descriptive keywords that classify their thematic and mechanical properties. Tags enable filtering, searching, and display in the compendium.

### Tag Categories

#### Thematic Tags
- **necromantic** - Deals with death, undead, souls (Bind the Fallen, Death's Touch)
- **forbidden** - Dangerous/restricted knowledge requiring GM approval
- **illusion** - Creates false sensory impressions
- **summoning** - Conjures creatures or entities
- **divination** - Reveals information or detects things
- **teleportation** - Instant movement across space

#### Mechanical Tags  
- **healing** - Restores hit points
- **offensive** - Deals damage to enemies
- **defensive** - Provides protection or damage reduction
- **utility** - Non-combat functionality
- **buff** - Positive effects on allies
- **debuff** - Negative effects on enemies
- **control** - Impairs movement or actions (paralysis, sleep, fear)

#### Targeting Tags
- **aoe** - Area of effect (radius, cone, cube, line)
- **single-target** - Affects one creature
- **multi-target** - Affects multiple specific creatures
- **self** - Only affects the caster
- **touch** - Requires physical contact
- **ranged** - Works at a distance

#### Special Property Tags
- **zone** - Creates persistent area (Wall of Force, Warding Sphere)
- **wall** - Linear barrier structure
- **construct** - Creates temporary object (servant, disk)
- **ritual** - High energy cost or requires preparation
- **concentration** - Requires ongoing focus to maintain

### Tag Examples

```json
// Necromantic summon
"Bind the Fallen": ["necromantic", "forbidden", "summoning", "control", "touch"]

// Damage AOE
"Fireball": ["offensive", "aoe", "ranged"]

// Control effect
"Sleep": ["control", "aoe", "ranged"]

// Utility
"Light": ["utility", "touch"]

// Healing
"Healing Burst": ["healing", "ranged"]

// Defensive zone
"Wall of Force": ["defensive", "wall", "zone", "ranged"]
```

Tags are stored as an array in `weave.system.tags` and auto-detected by the build script based on weave properties and description.

## Base Weave Properties

Every weave has a set of core properties defined in `weave-base-schema.json`:

### Item Properties
- **name** - Display name of the weave
- **type** - Always "weave"
- **img** - Icon path

### System Properties

#### Energy & Casting
- **energyCost** - Primary and supporting energy types and costs
  - Primary: Main energy type (fire, water, air, earth, positive, negative, space, time, force, entropy)
  - Supporting: Optional second energy type
- **actionCost** - Number of actions to cast (1-3)
- **weaveType** - Complexity: simple, complex, or intricate
- **weavingRoll** - Which attributes to roll

#### Targeting & Effects  
- **range** - Distance (Touch, Close 30ft, Medium 60ft, Long 120ft)
- **duration** - How long effect lasts (Instantaneous, 1 minute, etc.)
- **target** - Target selection details
- **savingThrow** - Save type: will, fortitude, reflex, or none
- **deliveryMethod** - How it resolves: attack, save, or automatic

#### Damage & Effects
- **damage** - Damage properties and success scaling
  - base: Base damage value (0 for non-damaging weaves)
  - type: Damage type (fire, cold, lightning, acid, etc.)
  - drInteraction: How DR applies (full, half, none)
  - scaling: Success level entries (see below)
- **appliesEffects** - Array of conditions/effects to apply
- **tags** - Classification keywords (see above)

#### Metadata
- **description** - Formatted HTML description with all details
- **effectType** - Category: damage, healing, utility, control, etc.

See [weave-schema.json](weave-schema.json) for complete property definitions, validation rules, and examples.

## Success Scaling

Success scaling is defined within `damage.scaling` in the main schema. Each success level (0-5+) can specify:

### Core Properties

- **description** (required) - Human-readable description of the effect
- **appliesEffects** (boolean) - Whether configured effects/conditions should be applied

### Damage & Healing

- **damage** - Damage dealt (number or object with type)
- **healing** - HP healed (number)

### Temporal & Spatial

- **duration** - How long the effect lasts (structured or text)
- **range** - Distance the weave can reach
- **area** - Size and shape of affected area

### Quantities & Capacities

- **quantity** - Number of items/projectiles/duplicates
- **capacity** - Weight capacity for telekinetic effects
- **targetCount** - Number of simultaneous targets

### Special Mechanics

- **pushDistance** - Distance targets are pushed/pulled
- **effectType** - Specific condition type (frightened, fleeing, etc.)
- **specialMechanics** - Array of special rules
- **drModifier** - Damage Reduction value
- **hp** - Hit points (for constructs like walls)
- **notes** - Additional clarifications

## Combining Properties

**Important:** You can combine **ANY number of properties** at a single success level. All properties are optional (except `description`), so each success level entry can be as simple or complex as needed.

### Examples of Combined Properties:

**Simple (1-2 properties):**
```json
"2": {
  "description": "full damage",
  "damage": 8
}
```

**Moderate (3-4 properties):**
```json
"3": {
  "description": "enhanced with push",
  "damage": 16,
  "pushDistance": { "distance": 10, "unit": "feet" },
  "duration": { "value": 1, "unit": "minute" }
}
```

**Complex (5+ properties):**
```json
"4": {
  "description": "powerful multi-effect",
  "appliesEffects": true,
  "damage": 32,
  "healing": 16,
  "range": { "value": 120, "unit": "feet" },
  "area": { "shape": "radius", "size": 20 },
  "duration": { "value": 1, "unit": "hour" },
  "pushDistance": { "distance": 15, "unit": "feet" },
  "targetCount": 3,
  "specialMechanics": ["ignores cover"]
}
```

See the `comprehensive_multi_attribute` example in `scaling-examples.json` for a demonstration with nearly all properties combined.

## Scaling Pattern Examples

### 1. Damage Scaling (Acid Blast)
```json
{
  "0": { "description": "miss", "appliesEffects": false, "damage": 0 },
  "1": { "description": "half damage", "damage": 4 },
  "2": { "description": "full damage", "damage": 8 },
  "5": { "description": "critical + applies effects", "appliesEffects": true, "damage": 24 }
}
```

### 2. Duration Scaling (Sleep)
```json
{
  "0": { "description": "no effect", "appliesEffects": false },
  "1": { "description": "1 round", "appliesEffects": true, "duration": { "value": 1, "unit": "round" } },
  "2": { "description": "full effect", "appliesEffects": true, "duration": { "value": 1, "unit": "minute" } }
}
```

### 3. Range Scaling (Spatial Step)
```json
{
  "1": { "description": "100 feet", "appliesEffects": true, "range": { "value": 100, "unit": "feet" } },
  "2": { "description": "500 feet", "appliesEffects": true, "range": { "value": 500, "unit": "feet" } }
}
```

### 4. Area Scaling (Shape Stone)
```json
{
  "1": { "description": "2ft cube", "appliesEffects": true, "area": { "shape": "cube", "size": 2 } },
  "2": { "description": "5ft cube", "appliesEffects": true, "area": { "shape": "cube", "size": 5 } }
}
```

### 5. Healing Scaling (Healing Burst)
```json
{
  "0": { "description": "no healing", "healing": 0 },
  "1": { "description": "4 HP", "healing": 4 },
  "2": { "description": "8 HP", "healing": 8 }
}
```

### 6. Quantity Scaling (Unerring Bolt)
```json
{
  "1": { "description": "1 dart", "quantity": { "amount": 1, "unit": "darts" }, "damage": 4 },
  "2": { "description": "3 darts", "quantity": { "amount": 3, "unit": "darts" }, "damage": 12 }
}
```

### 7. Capacity Scaling (Telekinesis)
```json
{
  "1": { "capacity": { "weight": 100, "unit": "lbs" }, "duration": { "value": 1, "unit": "minute" } },
  "2": { "capacity": { "weight": 500, "unit": "lbs" }, "duration": { "value": 10, "unit": "minute" } }
}
```

### 8. Hybrid Damage + Healing (Vampiric Touch)
```json
{
  "2": { "description": "full (8 damage, heal 4)", "damage": 8, "healing": 4 },
  "3": { "description": "+8 damage (16 total, heal 8)", "damage": 16, "healing": 8 }
}
```

### 9. Hybrid Damage + Push (Thunder Burst)
```json
{
  "2": { "damage": 12, "pushDistance": { "distance": 10, "unit": "feet" } },
  "4": { "damage": 20, "pushDistance": { "distance": 15, "unit": "feet" } }
}
```

### 10. Conditional Effect Progression (Fear)
```json
{
  "1": { "effectType": "frightened", "damage": 0 },
  "4": { "effectType": "fleeing", "damage": 32 },
  "5": { "effectType": "cowering", "damage": 32 }
}
```

### 11. Target Count Scaling (Heroism)
```json
{
  "2": { "targetCount": 1, "duration": { "value": 1, "unit": "minute" } },
  "4": { "targetCount": 2, "duration": { "value": 10, "unit": "minute" } },
  "5": { "targetCount": 4, "duration": { "value": 1, "unit": "hour" } }
}
```

### 12. Special Mechanics (Suggestion)
```json
{
  "4": {
    "duration": { "value": 12, "unit": "hour" },
    "specialMechanics": ["requires 2 successes to shake off"]
  }
}
```

### 13. Multi-Attribute (Wall of Force)
```json
{
  "4": {
    "hp": 36,
    "drModifier": 8,
    "duration": { "value": 1, "unit": "hour" }
  }
}
```

### 14. Quality/Complexity (Identify)
```json
{
  "1": { "specialMechanics": ["reveals basic function"] },
  "2": { "specialMechanics": ["reveals all properties"] },
  "3": { "specialMechanics": ["reveals all properties", "reveals curses"] }
}
```

## Usage in Build Scripts

When parsing weaves markdown, the build script can:

1. Extract the "Success Scaling:" field
2. Parse it into structured JSON using this schema
3. Store it in `weave.system.damage.scaling` (for all weave types, not just damage)
4. Use the structured data for:
   - Automatic effect application (`appliesEffects` flag)
   - Duration calculation from net successes
   - Damage/healing calculation
   - UI display of what each success level does
   - Automation of push/distance/area effects

## Benefits

1. **Machine-Readable** - Code can programmatically check what happens at each success level
2. **Comprehensive** - Covers all 14+ scaling patterns found in the system
3. **Flexible** - New attributes can be added without breaking existing data
4. **Human-Readable** - Clear structure with descriptive field names
5. **Validation** - JSON Schema provides type checking and validation

## Next Steps

1. Update `build_weaves_pack.py` to parse markdown into this schema format
2. Update `legends.mjs` to read structured scaling data instead of just checking `appliesEffects`
3. Use scaling data to:
   - Display detailed success level information in chat cards
   - Automate edge cases (push distance, area effects, etc.)
   - Provide better feedback to players about what each success level does
   - Calculate durations for effect application

## Migration Plan

For existing weaves:
1. Keep current `_parse_damage_scaling` for backward compatibility
2. Create new `_parse_structured_scaling` that outputs this schema format
3. Gradually migrate weaves to structured format
4. Eventually deprecate old format
