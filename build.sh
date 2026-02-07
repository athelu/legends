#!/bin/bash
# Build script for Legends TTRPG system releases
# This creates a release tarball ready for distribution

set -e

VERSION="0.6.0"
SYSTEM_NAME="legends"
BUILD_DIR="build"
RELEASE_DIR="releases"

echo "Building Legends TTRPG System v${VERSION}..."

# Create build directory
mkdir -p "${BUILD_DIR}"
mkdir -p "${RELEASE_DIR}"

# Copy system files to build directory
echo "Copying system files..."
rsync -av \
    --exclude='.*' \
    --exclude='node_modules' \
    --exclude='build' \
    --exclude='releases' \
    --exclude='*.tar.gz' \
    --exclude='COMPENDIUM_DEVELOPMENT.md' \
    --exclude='IMPORTING_BACKGROUNDS.md' \
    --exclude='IMPORT_GUIDE.md' \
    --exclude='TROUBLESHOOTING.md' \
    --exclude='FIX_COMPENDIUM.md' \
    --exclude='example-backgrounds.json' \
    --exclude='all-backgrounds.json' \
    --exclude='diagnostic-macro.js' \
    --exclude='import-backgrounds-macro.js' \
    --exclude='build.sh' \
    ./ "${BUILD_DIR}/${SYSTEM_NAME}/"

# Create tarball
echo "Creating release tarball..."
cd "${BUILD_DIR}"
tar -czf "../${RELEASE_DIR}/${SYSTEM_NAME}-v${VERSION}.tar.gz" "${SYSTEM_NAME}/"
cd ..

# Cleanup
echo "Cleaning up..."
rm -rf "${BUILD_DIR}"

echo "✅ Release built: ${RELEASE_DIR}/${SYSTEM_NAME}-v${VERSION}.tar.gz"
echo ""
echo "To include pre-populated compendiums:"
echo "1. Install the system in Foundry"
echo "2. Import backgrounds using the macro"
echo "3. Copy the .db files from Foundry's data folder to packs/backgrounds/"
echo "4. Re-run this script"
echo ""
echo "OR use fvtt-cli (see COMPENDIUM_DEVELOPMENT.md)"
