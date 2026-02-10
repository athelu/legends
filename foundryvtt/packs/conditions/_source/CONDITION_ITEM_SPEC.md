# Condition Item Schema (Legends)

This document defines the `condition` item schema and recommended metadata fields for engine-friendly condition Items.

Purpose
- Represent a condition as an Item so GMs can apply it to tokens and packs can ship canonical condition Items.
- Encode machine-actionable metadata for: ActiveEffects, periodic damage (damage ticks), recovery/downgrade rules, stacking/override rules, and UI presentation.

Top-level shape (high-level)
```
Item {
  name: string
  type: "condition"
  img: string
  system: {
    label: string            // short label like "Frightened"
    category: string         // e.g., "fear", "movement", "damage-over-time"
    description: string      // long text for hover / tooltip
    tokenIcon?: string       // override token overlay icon

    // Active-effect style changes (engine interprets key/mode/value)
    activeEffects?: Array<{
      key: string            // semantic key (engine maps to actor fields)
      mode: "add"|"mult"|"override"
      value: number|string   // numeric or string (e.g., "1d6")
      predicate?: string     // optional rule predicate (text form)
      notes?: string
    }>

    // Periodic damage / damage ticks
    damageTick?: {
      frequency: "startOfTurn"|"endOfTurn"|"eachRound"
      formula: string        // dice expression, e.g., "1d6" or "1d6+1"
      save?: {type:string, dc?:number, effectOnSuccess?:"none"|"reduce"|"end"}
    }

    // Recovery & downgrade rules
    recovery?: {
      trigger: "endOfTurn"|"startOfTurn"|"onDamage"|"onEvent"
      save?: {type:string, dc?:number}
      assistance?: {range:number, skill?:string, successOn?:string}
      downgradeOnFailTo?: string   // name/id of condition to replace with
      removeOnSuccess?: boolean
    }

    // Stacking and override behaviour
    stacking?: "stack"|"replace"|"highest"|"duration-merge"

    // Metadata for token overlay / UI
    overlayPriority?: number
    severity?: "minor"|"moderate"|"severe"
  }
  flags?: object
}
```

Engine notes
- `activeEffects` entries are semantic; the engine must map keys to concrete actor data paths (e.g., `skillDiceMod.dexterity` → apply to roll-time dice modifiers for dexterity-based skills).
- `damageTick` should be processed by the condition engine on its configured `frequency` and honor any `save` provided.
- `recovery` rules are for end-of-turn evaluation. Assistance (ally help) is expressed by `assistance` and engine resolves checks accordingly.
- `stacking` determines how multiple instances of this condition interact.

Examples
- See `packs/conditions/_source/frightened.json` (Frightened), `prone.json` (Prone), `ignited.json` (Ignited) for sample usage.

Guidelines for conversion from text rules
- Prefer encoding concrete mechanical outcomes (die modifiers, forced save types, periodic damage) inside the fields above.
- If an effect is complex or situational, include a clear `description` and an `activeEffects` entry with `notes` describing when to apply.

Compatibility
- This schema is intentionally semantic and engine-agnostic; the module's `condition-engine` must implement the mapping of `activeEffects.key` values to your actor model's data paths and roll hooks.

