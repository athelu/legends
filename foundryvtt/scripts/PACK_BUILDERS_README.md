# Compendium Pack Builders

This directory contains Python scripts for building Foundry VTT compendium packs from source files and documentation.

## Quick Start

**Build all packs at once:**
```bash
python build_all_packs.py
```

**Build specific pack:**
```bash
python build_armor_pack.py
python build_weapons_pack.py
python build_traits_pack.py
python build_action_pack.py
python build_ability_pack.py
```

**Build from existing _source/ JSON:**
```bash
python build_packs_simple.py
python build_packs_simple.py --pack armor
```

## Pack Builders

### Specialized Parsers
These scripts parse markdown documentation and extract items automatically.

#### `build_armor_pack.py`
- Parses: `ttrpg/armor.md`
- Creates: Armor items + Shield items (auto-detected by name)
- Generates: `foundryvtt/packs/legends/armor/armor.db`
- Detects shields by checking if "shield" is in the item name
- Automatically determines armor type (light/medium/heavy)

#### `build_weapons_pack.py`
- Parses: `ttrpg/weapons.md`
- Creates: Weapon items
- Generates: `foundryvtt/packs/legends/weapons/weapons.db`

#### `build_traits_pack.py`
- Parses: `ttrpg/traits.md`, `ttrpg/flaws.md`, `ttrpg/feats.md`
- Creates: Trait, Flaw, and Feat items
- Generates: Three separate `.db` files

#### `build_action_pack.py`
- Parses: `ttrpg/actions.md`
- Creates: Action items with type categorization
- Generates: `foundryvtt/packs/legends/action/action.db`
- Extracts action type from markdown headers (e.g., `[Combat]`, `[Movement]`)
- Parses cost, requirements, effect, range, trigger, etc.

#### `build_ability_pack.py`
- Builds from: `foundryvtt/packs/legends/abilities/_source/*.json`
- Creates: Ability items
- Generates: `foundryvtt/packs/legends/abilities/abilities.db`
- Abilities are manually created JSON files (no automatic parsing)

### General Purpose
These scripts work with any existing _source/ JSON files.

#### `build_packs_simple.py`
- Reads all JSON files from `_source/` directories
- Builds corresponding `.db` files
- Useful for manual JSON editing or migration

## Directory Structure

```
foundryvtt/
├── packs/
│   └── legends/
│       ├── armor/
│       │   ├── armor.db              (generated)
│       │   └── _source/
│       │       ├── light-armor.json
│       │       ├── plate-armor.json
│       │       ├── tower-shield.json
│       │       └── ...
│       ├── weapons/
│       │   ├── weapons.db
│       │   └── _source/
│       ├── action/
│       │   ├── action.db
│       │   └── _source/
│       ├── abilities/
│       │   ├── abilities.db
│       │   └── _source/
│       └── [other packs...]
└── scripts/
    ├── build_all_packs.py
    ├── build_armor_pack.py
    ├── build_weapons_pack.py
    ├── build_traits_pack.py
    ├── build_action_pack.py
    ├── build_ability_pack.py
    ├── build_packs_simple.py
    ├── pack_utils.py
    └── BUILD_PACKS_README.md
```

## Item Format

Each JSON file in `_source/` should have this structure:

```json
{
  "_id": "unique-id-here",
  "name": "Item Name",
  "type": "item-type",
  "img": "path/to/image.webp",
  "system": {
    "description": "Item description",
    "property1": "value1"
  },
  "effects": []
}
```

Required fields:
- `_id`: Unique identifier (auto-generated if missing)
- `name`: Item name
- `type`: Item type (armor, weapon, action, ability, etc.)
- `system`: System-specific fields (varies by type)
- `effects`: Active effects array (can be empty)

Optional but recommended:
- `img`: Image path for the item icon

## Creating New Abilities

To add custom abilities:

1. Create a JSON file in `foundryvtt/packs/legends/abilities/_source/`
2. Follow the template:
   ```json
   {
     "_id": "ability-unique-id",
     "name": "Ability Name",
     "type": "ability",
     "img": "icons/svg/item-bag.svg",
     "system": {
       "description": "What this ability does"
     }
   }
   ```
3. Run: `python build_ability_pack.py`
4. The `.db` file will be generated and committed to git

## Workflow

### Adding items from documentation:
1. Update the markdown file (e.g., `ttrpg/armor.md`)
2. Run the specialized parser: `python build_armor_pack.py`
3. JSON files are created in `_source/`
4. `.db` pack file is generated
5. Commit both to git

### Editing items in code:
1. Edit the JSON file directly in `_source/`
2. Run the builder: `python build_packs_simple.py --pack armor`
3. Commit both JSON and `.db` changes

### Fixing `.db` conflicts in git:
1. Edit the source JSON files
2. Run the builder to regenerate `.db`
3. Commit the fixed files

## Image Paths

Items use custom images with these patterns:

- **Armor**: `icons/equipment/chest/plate-armor-gray.webp`
- **Weapons**: `icons/weapons/swords/sword-long-crossguard-brown.webp`
- **Actions**: `icons/skills/melee/blade-damage.webp`
- **Traits/Feats**: `icons/skills/social/diplomacy-handshake.webp`
- **Flaws**: `icons/svg/hazard.svg`
- **Default**: `icons/svg/item-bag.svg`

To use custom images, edit the image path in:
- The source JSON files, OR
- The parser script's image mapping, OR
- The `pack_utils.py` validation function

## Troubleshooting

**"No items found" error:**
- Check that `_source/` directory exists
- Verify JSON files are in the correct directory
- Ensure markdown file is in `ttrpg/` directory

**"No compendium configured" in Foundry:**
- Verify `system.json` has the pack configured
- Check the pack path matches the directory structure
- Reload Foundry after updating `system.json`

**Merge conflicts in `.db` files:**
- Edit the source JSON files directly
- Re-run the builder to regenerate `.db`
- Commit the fixed files

## Scripts Summary

| Script | Input | Output | Purpose |
|--------|-------|--------|---------|
| `build_all_packs.py` | Runs all builders | All packs | Master build script |
| `build_armor_pack.py` | `armor.md` | `armor.db` | Parse armor + shields |
| `build_weapons_pack.py` | `weapons.md` | `weapons.db` | Parse weapons |
| `build_traits_pack.py` | `traits.md`, `flaws.md`, `feats.md` | 3 `.db` files | Parse traits/flaws/feats |
| `build_action_pack.py` | `actions.md` | `action.db` | Parse actions |
| `build_ability_pack.py` | JSON files | `abilities.db` | Build abilities |
| `build_packs_simple.py` | JSON files | `.db` files | Generic builder |
| `pack_utils.py` | - | - | Shared utilities |
