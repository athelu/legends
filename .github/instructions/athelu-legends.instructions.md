---
name: "Athelu Legends Canon"
description: "Use when working on Legends rules, mechanics, character options, Foundry VTT implementations, compendium packs, build scripts, sheets, templates, or documentation derived from the rules."
---

# Athelu Legends Canon

- Treat the Markdown files in `ttrpg/` as the canonical source of truth for all Legends rules and mechanics.
- Before changing or explaining a rule, mechanic, character option, action, condition, item, feat, trait, skill, or spell, consult the relevant file in `ttrpg/` first.
- If `foundryvtt/`, `pf2e/`, generated packs, templates, or module code conflicts with `ttrpg/`, preserve the `ttrpg/` interpretation and update the derived implementation when the task calls for it.
- Do not infer a new rule from Foundry data, code, or generated content when the relevant `ttrpg/` source is absent or unclear. State the uncertainty and ask for clarification when it affects behavior.
- Keep derived data and implementation terminology aligned with the canonical wording unless a compatibility constraint requires otherwise.
- Treat Foundry compendium entry JSON files as compiled, temporary output produced from the source documents by scripts in `foundryvtt/scripts/`.
- Do not edit individual compendium entry JSON files directly. Make changes in the canonical `ttrpg/` source or the appropriate script in `foundryvtt/scripts/`, then regenerate the affected compendium data.
- Dialogs and system-prompt options must follow the Foundry v2 pattern established by the character-creation workflow in `foundryvtt/module/character-creation.mjs`.
- Prefer the existing `showWizardDialog` wrapper and `foundry.applications.api.DialogV2` APIs, including v2 `window`, `content`, `buttons`, `position`, `render`, and callback conventions, instead of legacy dialog APIs or ad hoc option shapes.
- All Foundry-facing code must be compatible with Foundry VTT v13 and later. Use v13+ APIs and current best practices, avoid deprecated or legacy APIs when an established v13+ replacement exists, and preserve compatibility with the system's declared Foundry version.
- When implementing a mechanic, verify the result against the relevant canonical text and test the affected behavior where a focused check exists.