#!/usr/bin/env python3
"""
Build all Foundry VTT pack files from source JSON files.

This is the main bulk-build script. For specialized parsing and building of
specific pack types from documentation, use the individual build_*_pack.py scripts.

Usage:
    python build_packs_simple.py                    # Build all packs
    python build_packs_simple.py --pack weapons     # Build specific pack
    python build_packs_simple.py --help             # Show help
"""

import os
import sys
import argparse
from pathlib import Path

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from pack_utils import build_pack_from_source


def main():
    parser = argparse.ArgumentParser(
        description="Build Foundry VTT pack files from source JSON files"
    )
    parser.add_argument(
        "--pack",
        help="Specific pack to build (e.g., 'weapons', 'armor')"
    )
    parser.add_argument(
        "--packs-dir",
        default="packs",
        help="Path to packs directory (default: packs)"
    )
    
    args = parser.parse_args()
    
    # Resolve paths relative to script location
    script_dir = Path(__file__).parent.parent.parent
    packs_dir = script_dir / "foundryvtt" / args.packs_dir
    
    if not packs_dir.exists():
        print(f"Error: Packs directory not found: {packs_dir}")
        sys.exit(1)
    
    print(f"Building Foundry VTT packs from {packs_dir}")
    print("=" * 60)
    
    results = {}
    
    if args.pack:
        # Build specific pack
        pack_path = packs_dir / args.pack
        if not pack_path.exists():
            print(f"Error: Pack directory not found: {pack_path}")
            sys.exit(1)
        results[args.pack] = build_pack_from_source(pack_path, args.pack)
    else:
        # Build all packs
        for pack_dir in sorted(packs_dir.iterdir()):
            if pack_dir.is_dir() and not pack_dir.name.startswith('.'):
                results[pack_dir.name] = build_pack_from_source(pack_dir)
    
    # Summary
    print("\n" + "=" * 60)
    print("Build Summary:")
    successful = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"  Successful: {successful}/{total}")
    
    if successful < total:
        failed = [k for k, v in results.items() if not v]
        print(f"  Failed: {', '.join(failed)}")
        sys.exit(1)
    else:
        print("\nAll packs built successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
