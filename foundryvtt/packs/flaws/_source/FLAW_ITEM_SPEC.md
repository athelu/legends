Flaw item specification for Foundry/legends system

Purpose
- Define the canonical field layout for flaw items generated from `ttrpg/flaws.md`.
- Keep flaw parsing, sheet metadata, and compendium source JSON aligned.

Suggested item shape (JSON)

```json
{
  "name": "Bad Luck (6)",
  "type": "flaw",
  "system": {
    "description": {
      "value": "<p>Luck is costly and inefficient.</p>"
    },
    "pointValue": 6,
    "flawType": "physical",
    "severity": "major",
    "mechanicalEffects": "<ul><li>Spending Luck costs 2 points per die reduction instead of 1</li></ul>",
    "roleplayingImpact": "",
    "canBeOvercome": false,
    "overcomeMethod": "",
    "requiresGMApproval": false,
    "notes": ""
  },
  "effects": []
}
```

Field definitions
- `system.description.value`: short narrative summary of the flaw.
- `system.pointValue`: points granted by taking the flaw. For ranged-value flaws, builders default this to the low end of the range.
- `system.flawType`: category such as `physical`, `mental`, `social`, `supernatural`, or `combat`.
- `system.severity`: normalized severity bucket: `minor`, `moderate`, or `major`.
- `system.mechanicalEffects`: mechanical penalties, restrictions, and rules text.
- `system.roleplayingImpact`: narrative or behavioral expectations that affect play but are not pure mechanics.
- `system.canBeOvercome`: whether the flaw can be bought off or overcome in play.
- `system.overcomeMethod`: how the flaw can be overcome when applicable.
- `system.requiresGMApproval`: whether this flaw requires explicit GM approval.
- `system.notes`: GM-facing caveats or special notes such as table-safety warnings.

Builder expectations
- Flaw entries are identified by `###` headings in `ttrpg/flaws.md` that include a point cost in the title.
- Top-level `##` sections determine the base `flawType` where possible.
- Introductory prose is stored in `system.description.value`.
- Bullet lists and structured penalties are stored in `system.mechanicalEffects`.
- GM approval warnings are stored in `system.notes` and set `system.requiresGMApproval` to `true`.
- Flaws use deterministic IDs derived from their canonical names.

Design notes
- Keep `description` concise; prefer putting operational rules in `mechanicalEffects`.
- Use `notes` for moderation, approval, or table-safety guidance rather than mixing those warnings into mechanical text.
- If a flaw has a point range, the item name should preserve the range even if `pointValue` defaults to the minimum value for editing.