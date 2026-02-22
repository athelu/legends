# Complete Weave Structure Reference

This file shows the complete structure of a weave with all properties explained.

## Full Example: Fireball

```json
{
  // === FOUNDRY ITEM PROPERTIES ===
  "_id": "aba0af23c11f4986",           // Unique identifier (auto-generated)
  "name": "Fireball",                  // Display name
  "type": "weave",                     // Item type (always "weave")
  "img": "icons/magic/abjuration/abjuration-purple.webp",  // Icon path
  
  // === SYSTEM PROPERTIES ===
  "system": {
    
    // DESCRIPTION (HTML formatted)
    "description": {
      "value": "<p><strong>Primary Energy:</strong> Fire 5 (exploding ball of flame, damage) <strong>Supporting Energy:</strong> Space 4 (medium range 60ft + area 20ft radius) <strong>Range:</strong> Medium, 60 ft. <strong>Duration:</strong> Instantaneous <strong>Total Cost:</strong> 9 Energy <strong>Action:</strong> Complex weave (2 actions) <strong>Weaving Roll:</strong> Fire Potential + Fire Mastery + Space Potential + Space Mastery <strong>Effect:</strong> A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. All creatures in a 20-foot radius sphere take [[/damage 28 type=fire]] damage. Each target takes the full listed damage and makes their own save. <strong>Applies Effects:</strong> ignited <strong>Saving Throw:</strong> Reflex <strong>Damage Type:</strong> Fire (energy) <strong>DR Interaction:</strong> Half DR <strong>Success Scaling (Net successes = Your successes - Their successes):</strong> 0 = no damage, 1 = half damage (14), 2 = full damage (28), 3 = +[[/damage 8]] damage (36 total), 4 = +[[/damage 16]] damage (44 total), 5 = +[[/damage 24]] damage (52 total) + applies effects</p>"
    },
    
    // WEAVE TYPE & ACTIONS
    "weaveType": "complex",            // Complexity: simple | complex | intricate
    "actionCost": 2,                   // Actions required to cast (1-3)
    
    // ENERGY COSTS
    "energyCost": {
      "primary": {
        "type": "fire",                // Primary energy type
        "cost": 5                      // Primary energy cost
      },
      "supporting": {
        "type": "space",               // Supporting energy type (or "" for none)
        "cost": 4                      // Supporting energy cost
      }
      // Total Cost = 5 + 4 = 9 Energy
    },
    
    // TARGETING PROPERTIES
    "range": "Medium, 60 ft.",         // Distance weave can reach
    "duration": "Instantaneous",       // How long effect lasts
    "target": "",                      // Target selection (often specified in description)
    "savingThrow": "reflex",          // Save type: will | fortitude | reflex | none
    
    // DELIVERY & EFFECT TYPE
    "deliveryMethod": "save",          // How it resolves: attack | save | automatic
    "effect": "",                      // Detailed effect (usually in description)
    "effectType": "damage",            // Category: damage | healing | utility | control | buff | debuff
    
    // DAMAGE PROPERTIES
    "damage": {
      "base": 28,                      // Base damage at success level 2 (0 for non-damaging)
      "type": "fire",                  // Damage type: fire | cold | lightning | acid | sonic | force | etc.
      "drInteraction": "half",         // DR interaction: full | half | none
      
      // SUCCESS SCALING (see scaling-schema.json for all possible properties)
      "scaling": {
        "0": {                         // 0 net successes
          "damage": 0,
          "description": "no damage",
          "appliesEffects": false
        },
        "1": {                         // 1 net success
          "damage": 14,
          "description": "half damage",
          "appliesEffects": false
        },
        "2": {                         // 2 net successes (baseline)
          "damage": 28,
          "description": "full damage",
          "appliesEffects": false
        },
        "3": {                         // 3 net successes
          "damage": 36,
          "description": "enhanced",
          "appliesEffects": false
        },
        "4": {                         // 4 net successes
          "damage": 44,
          "description": "critical",
          "appliesEffects": false
        },
        "5": {                         // 5+ net successes
          "damage": 52,
          "description": "extreme",
          "appliesEffects": true       // Applies ignited condition at this level
        }
      }
    },
    
    // SUCCESS SCALING (text format - deprecated)
    "successScaling": "",
    
    // WEAVING ROLL (which attributes - usually in description)
    "weavingRoll": "",
    
    // EFFECTS TO APPLY
    "appliesEffects": [
      {
        "effectId": "ignited",         // ID matching condition compendium entry
        "params": {}                   // Additional parameters for effect
      }
    ],
    
    // CLASSIFICATION TAGS
    "tags": [
      "offensive",                     // Mechanical tag
      "aoe",                          // Targeting tag
      "ranged"                        // Range tag
    ]
  },
  
  // === ACTIVE EFFECTS ===
  "effects": [],                       // Active effects array (usually empty)
  
  // === LEVELDB KEY ===
  "_key": "!items!aba0af23c11f4986"   // LevelDB storage key
}
```

## Property Categories

### 1. Foundry Item Properties
| Property | Type | Description |
|----------|------|-------------|
| `_id` | string | Unique identifier (auto-generated by Foundry) |
| `name` | string | Display name shown in compendium and character sheets |
| `type` | string | Always "weave" for weaves |
| `img` | string | Path to icon image |
| `_key` | string | LevelDB key for compendium storage |

### 2. Energy & Casting
| Property | Type | Description |
|----------|------|-------------|
| `energyCost.primary.type` | enum | Primary energy type (fire, water, air, earth, positive, negative, space, time, force, entropy) |
| `energyCost.primary.cost` | number | Amount of primary energy required |
| `energyCost.supporting.type` | enum | Supporting energy type (or "" for none) |
| `energyCost.supporting.cost` | number | Amount of supporting energy required |
| `actionCost` | number | Number of actions to cast (1-3) |
| `weaveType` | enum | Complexity: simple, complex, or intricate |
| `weavingRoll` | string | Which attributes to roll for weaving |

**Total Energy Cost** = `primary.cost + supporting.cost`

### 3. Targeting & Range
| Property | Type | Description |
|----------|------|-------------|
| `range` | string | Distance weave can reach (Touch, Close/30ft, Medium/60ft, Long/120ft) |
| `duration` | string | How long effect lasts (Instantaneous, 1 minute, 1 hour, etc.) |
| `target` | string | Target selection description |
| `savingThrow` | enum | Save type: will, fortitude, reflex, or none/empty |

### 4. Delivery & Effects
| Property | Type | Description |
|----------|------|-------------|
| `deliveryMethod` | enum | How weave resolves: attack, save, or automatic |
| `effectType` | enum | Category: damage, healing, utility, control, buff, debuff |
| `effect` | string | Detailed effect description (often in description instead) |
| `appliesEffects` | array | Conditions/effects to apply (array of {effectId, params}) |
| `tags` | array | Classification keywords for filtering/display |

### 5. Damage Properties
| Property | Type | Description |
|----------|------|-------------|
| `damage.base` | number | Base damage at success level 2 (0 for non-damaging weaves) |
| `damage.type` | enum | Damage type: fire, cold, lightning, acid, sonic, force, bludgeoning, etc. |
| `damage.drInteraction` | enum | How DR applies: full (physical), half (energy), none (force) |
| `damage.scaling` | object | Success level entries (see scaling-schema.json) |

### 6. Success Scaling
Each entry in `damage.scaling` can have (all optional except description):

| Property | Type | Examples |
|----------|------|----------|
| `description` | string | "full damage", "10 minutes", "3 targets" |
| `appliesEffects` | boolean | true/false - should effects be applied at this level? |
| `damage` | number/object | 28, {amount: 28, type: "fire"} |
| `healing` | number | 12 |
| `duration` | object/string | {value: 10, unit: "minute"}, "10 minutes" |
| `range` | string | "60 feet", "120 feet" |
| `area` | string/object | "20-foot radius", {shape: "sphere", size: 20} |
| `quantity` | number | 3 (projectiles/duplicates) |
| `capacity` | number | 500 (pounds for telekinesis) |
| `targetCount` | number | 5 (simultaneous targets) |
| `pushDistance` | number | 15 (feet) |
| `specialMechanics` | string | "Targets believe suggestion is their own idea" |
| `hp` | number | 36 (for constructs/walls) |
| `drModifier` | number | 8 (DR bonus) |
| `effectType` | string | "frightened", "paralyzed" |
| `notes` | string | Additional details |

See [scaling-schema.json](scaling-schema.json) for complete property definitions.

## Energy Types

| Type | Description | Common Uses |
|------|-------------|-------------|
| **fire** | Flame, heat, combustion | Damage, light, warmth |
| **water** | Liquid, cold, ice | Damage, cold, water manipulation |
| **air** | Wind, lightning, gases | Lightning, movement, breath |
| **earth** | Stone, metal, plants | Damage, walls, plant growth |
| **positive** | Life, healing, light | Healing, light, life energy |
| **negative** | Death, necromancy, darkness | Necromancy, darkness, death |
| **space** | Distance, teleportation, area | Range extension, AOE, teleportation |
| **time** | Duration, speed, aging | Duration, haste, slow |
| **force** | Pure magical energy, shields | Force damage, shields, constructs |
| **entropy** | Chaos, transformation, randomness | Transmutation, chaos, randomness |

## Delivery Methods

| Method | Description | Workflow | Examples |
|--------|-------------|----------|----------|
| **attack** | Caster makes attack roll vs target defense | Roll attack → Hit/Miss → Apply damage | Fire Bolt, Lightning Touch |
| **save** | Targets make saving throw | Show card → Roll saves → Compare successes → Apply effects | Fireball, Sleep, Fear |
| **automatic** | No roll or save required | Cast → Apply immediately | Light, Identify, Heal |

## Weave Types & Actions

| Type | Actions | Description |
|------|---------|-------------|
| **simple** | 1 | Quick, straightforward weaves |
| **complex** | 2 | Standard power weaves |
| **intricate** | 3 | Powerful or complicated weaves |

## Saving Throws

| Type | Attribute | When Used |
|------|-----------|-----------|
| **will** | Willpower + skill | Mental effects, illusions, charms |
| **fortitude** | Endurance + skill | Physical resilience, poison, disease |
| **reflex** | Reflex + skill | Dodging, quick reactions, area effects |

## DR Interaction

| Value | Meaning | Typical Damage Types |
|-------|---------|---------------------|
| **full** | Full DR applies | Physical (bludgeoning, piercing, slashing) |
| **half** | Half DR applies | Energy (fire, cold, lightning, acid, sonic) |
| **none** | DR does not apply | Force, pure magical, special |

## Example Variations

### Damage Weave (Fireball)
- `damage.base > 0` (has base damage)
- `deliveryMethod: "save"` (targets roll saves)
- `damage.scaling` has damage at each level
- `effectType: "damage"`
- Tags: `offensive`, `aoe`, `ranged`

### Effect Weave (Sleep)
- `damage.base = 0` (no damage)
- `deliveryMethod: "save"` (targets roll saves)
- `damage.scaling` has duration at each level
- `appliesEffects: [{effectId: "asleep-unconscious"}]`
- Tags: `control`, `aoe`, `ranged`

### Utility Weave (Light)
- `damage.base = 0` (no damage)
- `deliveryMethod: "automatic"` (no roll/save)
- `savingThrow: "none"`
- `effectType: "utility"`
- Tags: `utility`, `touch`

### Attack Weave (Fire Bolt)
- `damage.base > 0` (has damage)
- `deliveryMethod: "attack"` (caster rolls attack)
- `savingThrow: "none"` (no save)
- Tags: `offensive`, `ranged`, `single-target`

## Property Defaults

Default values from `template.json`:

```json
{
  "weaveType": "simple",
  "actionCost": 1,
  "energyCost": {
    "primary": {"type": "fire", "cost": 0},
    "supporting": {"type": "", "cost": 0}
  },
  "range": "",
  "duration": "",
  "target": "",
  "savingThrow": "",
  "effect": "",
  "effectType": "damage",
  "deliveryMethod": "save",
  "damage": {
    "base": 0,
    "type": "fire",
    "drInteraction": "",
    "scaling": {}
  },
  "appliesEffects": [],
  "tags": []
}
```

## Validation

Required fields:
- `name` - Must have a display name
- `type: "weave"` - Must be set correctly
- `system.description.value` - Must have description
- `system.energyCost` - Must define energy costs
- `system.actionCost` - Must specify action cost

Optional but recommended:
- `range` - Specify targeting distance
- `duration` - Specify effect duration
- `savingThrow` - Specify if targets make saves
- `deliveryMethod` - Classify how weave resolves
- `tags` - Add classification keywords

## See Also

- [weave-schema.json](weave-schema.json) - Complete unified JSON Schema (includes all properties)
- [scaling-examples.json](scaling-examples.json) - 15 complete weave examples
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - How to integrate into build script
- [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md) - QA checklist for weaves
