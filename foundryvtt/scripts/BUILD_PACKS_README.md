# Compendium Pack Building

This document explains how to manage Foundry VTT compendium packs in the code repository.

## Overview

Foundry compendiums are stored as `.db` files, which use a line-delimited JSON format (one JSON object per line). Instead of editing packs through the Foundry interface, you can maintain source JSON files and generate the `.db` files automatically.

## Directory Structure

```
packs/
├── armor/
│   ├── armor.db              # Generated pack file (committed to repo)
│   └── _source/
│       ├── light-armor.json   # Individual item source files
│       ├── medium-armor.json
│       └── heavy-armor.json
├── weapons/
│   ├── weapons.db
│   └── _source/
│       ├── sword.json
│       └── bow.json
└── [other packs...]
```

## Workflow

### Adding/Editing Items

1. **Edit source JSON files** in `packs/[packname]/_source/` using your code editor
2. **Run the build script** to generate the `.db` file:
   ```bash
   python scripts/build_packs.py
   ```
3. **Commit both** the source JSON and generated `.db` file to git

### Building Specific Pack

```bash
python scripts/build_packs.py --pack weapons
```

### Exporting from Foundry

If you have items in Foundry you want to add to the repo:

1. Right-click the item in Foundry → "Export Data"
2. Save as JSON in the appropriate `_source/` directory
3. Run the build script
4. The `.db` file will be updated

## Item Format

Each JSON file in `_source/` should represent a complete item with Foundry's required fields:

```json
{
  "_id": "unique-id-here",
  "name": "Item Name",
  "type": "armor",
  "system": {
    "description": "Item description",
    "dr": {
      "slashing": 2,
      "piercing": 2,
      "bludgeoning": 1
    }
  },
  "effects": []
}
```

**Required fields:**
- `_id`: Unique identifier (use UUIDs or alphanumeric strings)
- `name`: Item name
- `type`: Item type (armor, weapon, feat, trait, etc.)
- `system`: System-specific data
- `effects`: Array of active effects (can be empty)

## Tips

- Keep one item per JSON file for easier version control
- Use descriptive filenames (e.g., `plate-armor.json`, `longsword.json`)
- The build script validates JSON syntax and warns about missing `_id` fields
- The `.db` files should be committed to git for distribution
- If merge conflicts occur in `.db` files, regenerate them: `python scripts/build_packs.py`

## Build Script Options

```bash
# Build all packs
python scripts/build_packs.py

# Build specific pack
python scripts/build_packs.py --pack armor

# Custom packs directory
python scripts/build_packs.py --packs-dir path/to/packs

# Verbose output
python scripts/build_packs.py --verbose
```

## Integration

You can integrate this into your build workflow (e.g., in `build.sh`):

```bash
#!/bin/bash
echo "Building compendium packs..."
python foundryvtt/scripts/build_packs.py || exit 1
echo "Packs built successfully!"
```
