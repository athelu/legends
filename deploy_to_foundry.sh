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
mkdir -p "$TARGET_DIR/packs"

# Sync runtime directories so sheet template/style changes are deployed too
for dir in module styles templates lang images ui; do
  if [ -d "$SOURCE_DIR/$dir" ]; then
    echo "Syncing $dir/..."
    mkdir -p "$TARGET_DIR/$dir"
    cp -r "$SOURCE_DIR/$dir/." "$TARGET_DIR/$dir/"
  fi
done

# Copy root runtime files
for file in system.json template.json README.md LICENSE.txt; do
  if [ -f "$SOURCE_DIR/$file" ]; then
    echo "Copying $file..."
    cp "$SOURCE_DIR/$file" "$TARGET_DIR/"
  fi
done

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
