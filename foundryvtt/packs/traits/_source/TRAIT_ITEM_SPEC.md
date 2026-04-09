Trait item specification for Foundry/legends system

Purpose
- Define the canonical field layout for trait items generated from `ttrpg/traits.md`.
- Keep trait parsing, sheet metadata, and compendium source JSON aligned.

Suggested item shape (JSON)

```json
{
  "name": "Mageborn (-7)",
  "type": "trait",
  "system": {
    "description": {
      "value": "<p>Narrative overview and non-mechanical explanatory text.</p>"
    },
    "pointCost": -7,
    "traitType": "magical",
    "isMagical": true,
    "magicalType": "mageborn",
    "requirements": "Intelligence ≥ 3",
    "benefits": "<ul><li>Mechanical rules text...</li></ul>",
    "visualEffects": "<p>Your eyes glow with violet light...</p>",
    "notes": "",
    "castingStat": "intelligence",
    "elementalAffinity": "",
    "grantsEnergyPool": true,
    "grantsMasterySkills": true,
    "grantsRitualCasting": true,
    "requiresGMApproval": false,
    "requiresExistingTrait": ""
  },
  "effects": []
}
```

Field definitions
- `system.description.value`: narrative description, lore, and explanatory text.
- `system.pointCost`: trait point adjustment. Negative values grant points.
- `system.traitType`: broad category such as `magical`, `physical`, `social`, `luck`, or `special`.
- `system.isMagical`: whether the trait participates in magical trait workflows.
- `system.magicalType`: normalized magical-trait identifier such as `mageborn`, `divine-gift`, or `alchemical-tradition`.
- `system.requirements`: short prerequisite or eligibility text.
- `system.benefits`: mechanical effects, option sets, sub-rules, and actionable gameplay text.
- `system.visualEffects`: descriptive manifestation text for magical traits.
- `system.notes`: GM guidance, edge cases, or supporting remarks that should not sit in the main description.
- `system.castingStat`: casting attribute granted by the trait, if any.
- `system.elementalAffinity`: optional affinity or focus choice captured directly on the item.
- `system.grantsEnergyPool`: whether the trait grants an energy pool.
- `system.grantsMasterySkills`: whether the trait grants magical mastery skills.
- `system.grantsRitualCasting`: whether the trait grants ritual casting.
- `system.requiresGMApproval`: whether the trait requires explicit GM approval.

Builder expectations
- Trait entries are identified by `##` or `###` headings in `ttrpg/traits.md` that include a point cost in the title.
- `**Image:**` and `**Requirements:**` lines are parsed as metadata, not left in the description body.
- Mechanical sections such as `**Mechanical Benefits:**`, `**Benefits:**`, and internal option headings are stored in `system.benefits`.
- Visual presentation sections such as `**Visual Effects:**` are stored in `system.visualEffects`.
- Narrative paragraphs remain in `system.description.value`.

Design notes
- Keep trait descriptions readable for players; reserve `benefits` for text that affects play.
- If a section is predominantly mechanical, prefer storing it in `benefits` even when it includes subheadings.
- Avoid duplicating metadata lines inside `description`; this causes drift between the parser and the item sheet.