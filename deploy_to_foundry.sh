#!/bin/bash

# Deployment script for Legends system to Foundry VTT server
# This script copies all modified files to the Foundry installation

SOURCE_DIR="foundryvtt"
TARGET_DIR="/home/azureuser/foundrydata/Data/systems/legends"

echo "Deploying Legends system to Foundry..."
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
echo ""

# Create necessary directories if they don't exist
mkdir -p "$TARGET_DIR/module"
mkdir -p "$TARGET_DIR/module/sheets"
mkdir -p "$TARGET_DIR/module/documents"
mkdir -p "$TARGET_DIR/styles"
mkdir -p "$TARGET_DIR/templates/item"
mkdir -p "$TARGET_DIR/packs"

# Copy NEW module files (critical!)
echo "Copying new module files..."
cp "$SOURCE_DIR/module/condition-engine.mjs" "$TARGET_DIR/module/"
cp "$SOURCE_DIR/module/feat-effects.mjs" "$TARGET_DIR/module/"

# Copy modified module files
echo "Copying modified module files..."
cp "$SOURCE_DIR/module/legends.mjs" "$TARGET_DIR/module/"
cp "$SOURCE_DIR/module/combat.mjs" "$TARGET_DIR/module/"
cp "$SOURCE_DIR/module/dice.mjs" "$TARGET_DIR/module/"
cp "$SOURCE_DIR/module/shields.mjs" "$TARGET_DIR/module/"
cp "$SOURCE_DIR/module/documents/actor.mjs" "$TARGET_DIR/module/documents/"
cp "$SOURCE_DIR/module/documents/item.mjs" "$TARGET_DIR/module/documents/"
cp "$SOURCE_DIR/module/sheets/character-sheet.mjs" "$TARGET_DIR/module/sheets/"
cp "$SOURCE_DIR/module/sheets/item-sheet.mjs" "$TARGET_DIR/module/sheets/"

# Copy styles
echo "Copying styles..."
cp "$SOURCE_DIR/styles/legends.css" "$TARGET_DIR/styles/"

# Copy templates
echo "Copying templates..."
cp "$SOURCE_DIR/templates/item/item-feat-sheet.hbs" "$TARGET_DIR/templates/item/"

# Copy system configuration
echo "Copying system.json..."
cp "$SOURCE_DIR/system.json" "$TARGET_DIR/"

# Copy all pack .db files
echo "Copying pack databases..."
for pack_dir in "$SOURCE_DIR/packs"/*; do
  if [ -d "$pack_dir" ]; then
    pack_name=$(basename "$pack_dir")
    mkdir -p "$TARGET_DIR/packs/$pack_name"

    # Copy .db file if it exists
    if [ -f "$pack_dir/${pack_name}.db" ]; then
      cp "$pack_dir/${pack_name}.db" "$TARGET_DIR/packs/$pack_name/"
      echo "  - Copied $pack_name.db"
    fi
  fi
done

echo ""
echo "Deployment complete!"
echo "Please restart your Foundry VTT server for changes to take effect."
