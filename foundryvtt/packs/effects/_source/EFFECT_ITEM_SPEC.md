# Effect Item Schema (Legends)

This document defines the `effect` item schema for weave-granted, feat-granted, or equipment-granted effects.

## Purpose
- Represent buffs, debuffs, transformations, and other temporary effects as Items
- Allow weaves to reference and apply effects with parameterized values  
- Track duration, charges, and ongoing benefits/penalties
- Extend beyond simple conditions to include complex buffs and transformations

## Differences from Conditions
- **Conditions**: State-based (Prone, Blinded), typically binary, often negative
- **Effects**: Time-limited buffs/debuffs, value-scaled, can be positive or negative
- **Both**: Can use activeEffects, damageTick, recovery mechanics

## Top-Level Schema

```json
{
  "name": "Effect Name",
  "type": "effect",
  "img": "path/to/icon.svg",
  "system": {
    "label": "Display Name",
    "category": "buff|debuff|transformation|utility|zone|summon",
    "effectType": "attribute-mod|dice-mod|temp-hp|damage-over-time|transformation|summon",
    "description": {"value": "HTML description"},
    "tokenIcon": "path/to/overlay.svg",
    
    // Badge display (duration, charges, value)
    "badge": {
      "type": "none|counter|value",  // Show number on token?
      "value": 0,          // Current value (rounds left, charges, etc.)
      "max": 0             // Maximum value (for visual indicator)
    },
    
    // Active effect modifications (semantic keys)
    "activeEffects": [
      {
        "key": "system.dr.bonus",     // Actor field path or semantic key
        "mode": "add|mult|override|upgrade|downgrade",
        "value": "2",                  // Can be formula: "${origin.successes}"
        "predicate": "",               // Optional condition
        "notes": "Description"
      }
    ],
    
    // Duration configuration
    "duration": {
      "type": "rounds|minutes|hours|instant|permanent",
      "value": 1,                      // Current remaining duration
      "base": 1,                       // Base duration
      "scaling": "none|netSuccesses|casterPotential|custom",
      "scalingFormula": "",            // For custom: "1 + ${origin.successes}"
      "expireOn": "turnEnd|turnStart|sustained|dispelled",
      "sustaining": false              // Requires concentration?
    },
    
    // Origin tracking (what granted this effect)
    "origin": {
      "type": "weave|feat|equipment|other",
      "id": "",                        // Source item ID
      "actor": "",                     // Caster/granter actor ID
      "successes": 0                   // For scaling calculations
    },
    
    // Stacking behavior
    "stacking": "stack|replace|highest|extend",
    "overlayPriority": 10,
    
    // Periodic damage/healing (from activeEffects or damageTick)
    "damageTick": {
      "frequency": "startOfTurn|endOfTurn",
      "formula": "1d8",                // Can reference origin: "${origin.successes}d8"
      "type": "fire",
      "save": {
        "type": "reflex",
        "effectOnSuccess": "end|reduce|none"
      }
    },
    
    // Recovery/expiration rules
    "recovery": {
      "trigger": "endOfTurn|startOfTurn|onDamage",
      "save": {"type": "will"},
      "removeOnSuccess": true,
      "assistance": {"range": 5, "action": true}
    },
    
    // Parameterized values (for effect templates)
    "parameterized": {
      "valueFormula": "${origin.successes} + 1",     // Calculate DR/bonus
      "durationFormula": "netSuccesses >= 4 ? 60 : netSuccesses >= 3 ? 10 : 1"
    },
    
    // Conditions this effect grants (e.g., Fly grants Hidden when moving vertically)
    "conditions": [],
    
    // What granted this (for display)
    "grantedBy": "Barkward"
  }
}
```

## Key Fields Explained

### `category`
- `buff`: Positive effect (DR, speed, Fortune)
- `debuff`: Negative effect (penalties, Misfortune)
- `transformation`: Changes creature form/stats
- `utility`: Non-combat effects (Light, Invisibility)
- `zone`: Area effect (Wall of Fire, Silence)
- `summon`: Tracks summoned creature

### `effectType`
- `attribute-mod`: Modifies actor attributes (DR, speed, HP)
- `dice-mod`: Adds Fortune/Misfortune or die bonuses/penalties
- `temp-hp`: Grants temporary HP (one-time or recurring)
- `damage-over-time`: Ongoing damage (Ignited, Poison)
- `transformation`: Replaces stats (Beastial Transformation)
- `summon`: Creates/tracks summoned entity

### `badge.type`
- `none`: No visible badge
- `counter`: Show remaining rounds/charges
- `value`: Show effect magnitude (DR +3, Speed +10)

### `duration.scaling`
Determines how net successes affect duration:
- `none`: Fixed duration
- `netSuccesses`: 1=1 round, 2=1 min, 3=10 min, 4=1 hour (common pattern)
- `casterPotential`: Duration = caster's relevant Potential value
- `custom`: Use `scalingFormula`

### `activeEffects[].key` (Semantic Keys)
Maps to actor fields or handled by engine:
- `system.dr.bonus` → Add to DR
- `system.attributes.*.tempValue` → Temporary attribute override
- `system.hp.temp` → Temporary HP
- `system.speed.base` → Movement speed
- `diceMod.fortune` → Add Fortune to specific roll types
- `diceMod.attack` → Attack roll modifiers
- `actions.max` → Maximum actions per turn (Haste/Slow)

### `parameterized` (Advanced)
Allows effect templates with variable values:
```json
{
  "valueFormula": "${origin.successes} * 2",
  "durationFormula": "${netSuccesses} >= 3 ? 10 : 1"
}
```
Engine evaluates these when applying the effect.

## Examples

### DR Bonus (Barkward-style)
```json
{
  "name": "DR Bonus",
  "type": "effect",
  "system": {
    "label": "DR Bonus",
    "category": "buff",
    "effectType": "attribute-mod",
    "badge": {"type": "value", "value": 2},
    "activeEffects": [
      {"key": "system.dr.bonus", "mode": "add", "value": "2"}
    ],
    "duration": {
      "type": "rounds",
      "base": 1,
      "scaling": "netSuccesses"
    }
  }
}
```

### Flight
```json
{
  "name": "Flight",
  "type": "effect",
  "system": {
    "label": "Flight",
    "category": "buff",
    "effectType": "attribute-mod",
    "activeEffects": [
      {"key": "system.movement.fly", "mode": "override", "value": "30"}
    ],
    "duration": {
      "type": "minutes",
      "base": 10,
      "scaling": "netSuccesses"
    }
  }
}
```

### Ignited (Damage Over Time)
```json
{
  "name": "Ignited",
  "type": "effect",
  "system": {
    "label": "Ignited",
    "category": "debuff",
    "effectType": "damage-over-time",
    "tokenIcon": "icons/svg/fire.svg",
    "badge": {"type": "counter"},
    "damageTick": {
      "frequency": "startOfTurn",
      "formula": "1d8",
      "type": "fire",
      "save": {
        "type": "reflex",
        "effectOnSuccess": "end"
      }
    },
    "recovery": {
      "trigger": "startOfTurn",
      "save": {"type": "reflex"},
      "removeOnSuccess": true,
      "assistance": {"range": 5, "action": true}
    }
  }
}
```

### Haste (Complex Multi-Effect)
```json
{
  "name": "Haste",
  "type": "effect",
  "system": {
    "label": "Haste",
    "category": "buff",
    "effectType": "attribute-mod",
    "activeEffects": [
      {"key": "actions.max", "mode": "add", "value": "1"},
      {"key": "diceMod.reflex", "mode": "add", "value": "-1"},
      {"key": "diceMod.agility", "mode": "add", "value": "-1"}
    ],
    "duration": {
      "type": "minutes",
      "base": 1,
      "scaling": "netSuccesses"
    },
    "conditions": ["exhausted-1"],  // Applied when effect ends
    "grantedBy": "Haste"
  }
}
```

## Engine Integration

The condition-engine (or new effect-engine) must:
1. **Interpret `activeEffects`**: Map semantic keys to actor data paths
2. **Process `damageTick`**: Apply damage at specified frequency
3. **Handle `duration`**: Decrement on appropriate trigger, remove when expired
4. **Evaluate `parameterized`**: Substitute variables when creating effect
5. **Apply `badge`**: Show visual indicator on token
6. **Manage `stacking`**: Handle duplicate effects per rules
7. **Process `recovery`**: Allow saves to end effect early

## Creating New Effects

1. Copy template from above or existing effect
2. Set appropriate `category`, `effectType`, `badge`
3. Define `activeEffects` with semantic keys
4. Configure `duration` and `scaling`
5. Add `damageTick` or `recovery` if needed
6. Test by applying to actor and verifying behavior

## Weave Integration

Weaves reference effects in their data:
```json
{
  "system": {
    "effects": [
      {
        "effectId": "dr-bonus",
        "paramValues": {
          "value": 2,
          "duration": "netSuccesses"
        }
      }
    ]
  }
}
```

When weave resolves, effect-engine:
1. Loads effect template by ID
2. Evaluates parameterized formulas with actual values
3. Creates effect instance on target actor
4. Tracks origin data for later reference
