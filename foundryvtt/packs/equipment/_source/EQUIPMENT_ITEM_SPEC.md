# Equipment Item Spec

Equipment items use the `equipment` item type in `template.json` and are primarily built from `ttrpg/equipment.md` via `build_equipment_pack.py`.

## Core Fields

- `system.description.value`: Rich-text item description
- `system.equipmentType`: One of `adventuring-gear`, `tools`, `clothing`, `consumable`, `container`, `mount`, `light-source`, `trade-goods`, `magic-item`, `other`
- `system.weight`: Numeric weight in pounds
- `system.cost`: Numeric cost in gold-piece units
- `system.quantity`: Stack count
- `system.equipped`: Whether the item is currently active/equipped

## Structured Metadata

- `system.capacity`: Freeform capacity text for containers
- `system.brightLight`: Bright light range in feet
- `system.dimLight`: Additional dim light range in feet
- `system.duration`: Duration text, typically for light sources or limited-use items
- `system.uses.value` / `system.uses.max`: Charges or uses when applicable
- `system.consumable`: Whether the item is consumed on use
- `system.associatedSkill`: Skill typically used with tools
- `system.toolBonus`: Flat bonus granted by the tool, if any
- `system.rarity`: Magic item rarity when applicable
- `system.requiresAttunement`: Whether a magic item requires attunement
- `system.magicalProperties`: Freeform magical effect text for magic items
- `system.properties`: Miscellaneous structured properties that do not warrant their own field
- `system.notes`: Builder or editor notes

## Builder Behavior

- IDs are deterministic and generated from `equipment:<name>`.
- The builder classifies items by name/description into sheet categories.
- Container, tool, light-source, and consumable metadata is inferred where the markdown text provides it.