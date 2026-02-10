Feat item specification for Foundry/legends system

Purpose
- Provide a minimal, structured item type for feats so the system can validate prerequisites, tier, usage and enable future automation of benefits.

Suggested item shape (JSON)

```json
{
  "name": "Acrobatic Defense",
  "type": "feat",
  "data": {
    "tier": 2,
    "prerequisites": {
      "attributes": { "Agi": 4 },
      "skills": { "Acrobatics": 4 },
      "traits": []
    },
    "benefit": {
      "text": "When unarmored, subtract 1 from both defense dice",
      "effects": [
        {
          "id": "acrobatic-defense-1",
          "type": "defense.modify",
          "target": "self",
          "condition": "unarmored",
          "payload": {
            "subtract_from_defense_dice": 1
          }
        }
      ]
    },
    "usage": {
      "mode": "passive",         
      "actionType": null,
      "uses": null,
      "recharge": null
    },
    "keywords": ["Combat","Defense"],
    "notes": "Original description or GM guidance here"
  }
}
```

Field definitions
- `name` (string): human-readable name shown on the item.
- `type` (string): should equal `feat` to allow system-specific handling.
- `data.tier` (int): the minimum character Tier required to take the feat.
- `data.prerequisites` (object): structured prereqs to allow programmatic checks
  - `attributes` (map): attribute short-name -> minimum value (e.g. {"Agi":4})
  - `skills` (map): skill name -> minimum rank
  - `traits` (array): trait names required (e.g. ["Sorcerous Origin"]).
- `data.benefit.text` (string): plain-text description for tooltips and GM reading.
- `data.benefit.effects` (array, optional): structured effect objects for automation.
  - `type` (string): machine-readable effect type (e.g. `defense.modify`, `damage.add`, `save.modify`, `initiative.modify`).
  - `condition` (string|null): optional condition under which the effect applies (e.g. `unarmored`, `while_in_fury`).
  - `payload` (object): parameters for the effect type (e.g. `{ "subtract_from_defense_dice":1 }`).
- `data.usage` (object): how the feat is used
  - `mode`: `passive` | `action` | `reaction` | `limited`
  - `actionType`: `combat` | `minor` | `free` | `reaction` (if applicable)
  - `uses`: integer or null (if limited)
  - `recharge`: `short_rest` | `long_rest` | `per_session` | null
- `data.keywords` (array): tags to aid filtering and compendium organization.
- `data.notes` (string): optional longer description or GM notes.

Design notes / integration guidance
- Validation: when a character attempts to add a feat, check `data.tier` and compare to the character's Tier, then validate all entries in `data.prerequisites`.
- Benefit automation: populate `benefit.effects` where practical. Start with common effect types (defense.modify, save.modify, damage.add, resist.add, condition.apply, movement.modify, hp.modify). The system should map effect types to engine handlers.
- Usage handling: feats with `mode: passive` require no tracking. For `limited` use feats, store current usage on the Actor (e.g. `actor.data.flags.legends.featUses[featId]`) and use `recharge` to reset.
- UI: in the item sheet, display `tier`, `prerequisites` and parse `benefit.effects` into readable lines; allow GMs to author both free-text and structured effects.
- Compendium packing: feats belong in a `feats` pack; include both text and `effects` JSON so automated imports can seed actor data and effect handlers.

Example (Acrobatic Defense)

See the JSON at the top of this document for an example representation of the "Acrobatic Defense" feat taken from `ttrpg/feats.md`.

Next steps
- Implement a simple effect handler registry in the system's scripting (e.g. `foundryvtt/scripts/featEffects.js`) supporting the common effect types.
- Add a `feat` item sheet template (foundryvtt/module/items/feat-sheet.hbs) showing structured fields and the parsed effects.
- Add import script to convert the existing markdown feats into packed JSON Items in `packs/feats` using the structured schema above.

If you'd like, I can:
- create a minimal `feat` item sheet template and stub effect handler code,
- write a script to convert the `ttrpg/feats.md` entries into JSON items and populate a compendium.

