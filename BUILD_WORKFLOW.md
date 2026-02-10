# Legends TTRPG - Build Workflow

This document describes the complete workflow for building and deploying the Legends system for Foundry VTT.

## Overview

The build process has two main stages:

1. **Content Generation** (Python) - Parse markdown documentation and generate `_source/*.json` files
2. **Pack Compilation** (Foundry CLI) - Compile `_source/*.json` files into `.db` pack files

## Prerequisites

### Required Software

- **Python 3.8+** - For running the build scripts
- **Node.js & npm** - For the Foundry CLI
- **Foundry VTT CLI** - For compiling pack files

### Installation

1. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org/
   - Or use a package manager:
     - Windows: `winget install OpenJS.NodeJS`
     - macOS: `brew install node`
     - Linux: `sudo apt install nodejs npm`

2. **Install project dependencies**:
   ```bash
   cd c:/repos/legends
   npm install
   ```

   This will install the `@foundryvtt/foundryvtt-cli` package.

## Build Process

### Step 1: Generate Source Files from Markdown

Run the master build script to parse all markdown documentation and generate `_source/*.json` files:

```bash
# From the repo root
python foundryvtt/scripts/build_all_packs.py
```

This will:
- Parse markdown files from `ttrpg/*.md`
- Generate individual JSON files in `foundryvtt/packs/*/._source/`
- Validate item structure and data

**Individual Pack Scripts:**
You can also run individual pack builders if you only need to update specific content:

```bash
python foundryvtt/scripts/build_feats_pack.py
python foundryvtt/scripts/build_armor_pack.py
python foundryvtt/scripts/build_weapons_pack.py
# etc.
```

### Step 2: Compile Pack Files with Foundry CLI

After generating source files, compile them into `.db` pack files using the official Foundry CLI:

```bash
# Compile all packs
npm run pack:all

# Or compile individual packs
npm run pack:feats
npm run pack:armor
npm run pack:weapons
# etc.
```

This uses the `fvtt package pack` command to compile `_source/*.json` → `.db` files.

**What this does:**
- Reads JSON files from `foundryvtt/packs/*/._source/`
- Compiles them into line-delimited JSON `.db` files
- Ensures compatibility with your Foundry VTT version

## Complete Build Command

To rebuild everything from scratch:

```bash
# 1. Generate source files from markdown
python foundryvtt/scripts/build_all_packs.py

# 2. Compile pack files
npm run pack:all
```

Or use the combined npm script:

```bash
npm run build:all
```

## Deployment

### Deploy to Foundry Server

After building the packs, deploy to your Foundry VTT installation:

```bash
# Using the deployment script
bash deploy_to_foundry.sh
```

This will copy:
- All module JavaScript files
- CSS styles
- Templates
- System configuration (system.json)
- All compiled pack `.db` files

### Manual Deployment

If you prefer manual deployment, copy these files to your Foundry installation:

```
foundryvtt/module/          → /path/to/foundry/Data/systems/legends/module/
foundryvtt/styles/          → /path/to/foundry/Data/systems/legends/styles/
foundryvtt/templates/       → /path/to/foundry/Data/systems/legends/templates/
foundryvtt/packs/*/*.db     → /path/to/foundry/Data/systems/legends/packs/*/
foundryvtt/system.json      → /path/to/foundry/Data/systems/legends/
```

**After deployment:**
1. Restart Foundry VTT server
2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Verify compendiums are loading correctly

## Development Workflow

### Making Content Changes

1. **Edit markdown files** in `ttrpg/` directory
2. **Run build script** for that pack type:
   ```bash
   python foundryvtt/scripts/build_feats_pack.py
   ```
3. **Compile with Foundry CLI**:
   ```bash
   npm run pack:feats
   ```
4. **Deploy to Foundry** (if testing):
   ```bash
   bash deploy_to_foundry.sh
   ```

### Making Code Changes

1. **Edit JavaScript/CSS/templates** in `foundryvtt/` directory
2. **Deploy to Foundry**:
   ```bash
   bash deploy_to_foundry.sh
   ```
3. **Restart Foundry** and hard refresh browser

## Foundry CLI Commands

### Pack Commands

```bash
# Compile a pack from source files
fvtt package pack <pack-name> --in foundryvtt/packs/<pack-name>/_source

# Extract a pack to source files
fvtt package unpack <pack-name> --out foundryvtt/packs/<pack-name>/_source

# Example: Compile feats pack
fvtt package pack feats --in foundryvtt/packs/feats/_source
```

### Unpack Commands

If you need to extract existing `.db` files back to JSON:

```bash
# Unpack all packs
npm run unpack:all

# Or unpack individual packs
npm run unpack:feats
npm run unpack:armor
# etc.
```

## Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run build:all` | Full rebuild: Python → Foundry CLI |
| `npm run pack:all` | Compile all packs with Foundry CLI |
| `npm run pack:<name>` | Compile specific pack (e.g., `pack:feats`) |
| `npm run unpack:all` | Extract all packs to source files |
| `npm run unpack:<name>` | Extract specific pack to source files |

## Troubleshooting

### "npm: command not found"

Install Node.js and npm (see Prerequisites above).

### "fvtt: command not found"

Make sure you've run `npm install` in the project root. The Foundry CLI is installed as a dev dependency.

### Packs show as empty in Foundry

1. Check that `.db` files exist in `foundryvtt/packs/*/`
2. Verify `system.json` has correct pack paths
3. Make sure you deployed all files to the server
4. Restart Foundry and hard refresh browser
5. Check browser console for JavaScript errors

### Python script errors

Make sure you're using Python 3.8 or later:
```bash
python --version
```

## File Structure

```
legends/
├── ttrpg/                          # Source markdown documentation
│   ├── feats.md
│   ├── armor.md
│   ├── weapons.md
│   └── ...
├── foundryvtt/
│   ├── packs/
│   │   ├── feats/
│   │   │   ├── _source/           # JSON source files (generated)
│   │   │   │   ├── feat-1.json
│   │   │   │   └── ...
│   │   │   └── feats.db           # Compiled pack (Foundry CLI)
│   │   └── ...
│   ├── scripts/
│   │   ├── build_all_packs.py     # Master build script
│   │   ├── build_feats_pack.py    # Individual pack builders
│   │   └── ...
│   └── ...
├── package.json                    # NPM configuration
└── deploy_to_foundry.sh           # Deployment script
```

## References

- [Foundry VTT CLI GitHub](https://github.com/foundryvtt/foundryvtt-cli)
- [Foundry VTT CLI on npm](https://www.npmjs.com/package/@foundryvtt/foundryvtt-cli)
- [Compendium Packs Documentation](https://foundryvtt.com/article/compendium/)
- [Foundry Development Guide](https://foundryvtt.com/article/packaging-guide/)
