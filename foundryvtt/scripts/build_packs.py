#!/usr/bin/env python3
"""
Build Foundry VTT pack files from source JSON files.

This script reads JSON files from _source/ directories within each pack folder
and generates .db files (line-delimited JSON format) that Foundry uses for
compendium packs.

Usage:
    python build_packs.py                    # Build all packs
    python build_packs.py --pack weapons     # Build specific pack
    python build_packs.py --help             # Show help
"""

import os
import json
import argparse
import sys
from pathlib import Path
import uuid


def generate_id():
    """
    Generate a unique ID for Foundry items.
    
    Returns:
        A random string ID compatible with Foundry's format
    """
    return uuid.uuid4().hex[:16]


def load_json_files(source_dir):
    """
    Load all JSON files from a source directory.
    
    Args:
        source_dir: Path to the _source directory
        
    Returns:
        List of (filename, data) tuples or just data items
    """
    items = []
    source_path = Path(source_dir)
    
    if not source_path.exists():
        print(f"Source directory not found: {source_dir}")
        return items
    
    # Load individual JSON files
    for json_file in sorted(source_path.glob("*.json")):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Handle both single items and arrays of items
                if isinstance(data, list):
                    for item in data:
                        items.append((json_file.stem, item))
                    print(f"  [+] Loaded {json_file.name} ({len(data)} items)")
                else:
                    items.append((json_file.stem, data))
                    print(f"  [+] Loaded {json_file.name}")
        except json.JSONDecodeError as e:
            print(f"  [-] Error parsing {json_file.name}: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"  [-] Error reading {json_file.name}: {e}")
            sys.exit(1)
    
    return items


def write_db_file(output_path, items):
    """
    Write items to a .db file in line-delimited JSON format.
    
    Args:
        output_path: Path to the output .db file
        items: List of item data dictionaries
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in items:
            # Skip if item is not a dict
            if not isinstance(item, dict):
                continue
                
            # Generate _id if missing
            if '_id' not in item:
                item['_id'] = generate_id()
                print(f"  ! Generated _id for: {item.get('name', 'unnamed')}")
            
            # Write as line-delimited JSON (one JSON object per line, no formatting)
            f.write(json.dumps(item, ensure_ascii=False, separators=(',', ':')))
            f.write('\n')
    
    print(f"  ✓ Generated {output_path.name} with {len(items)} items")


def build_pack(pack_dir, pack_name=None):
    """
    Build a single pack from its _source directory.
    
    Args:
        pack_dir: Path to the pack directory
        pack_name: Optional pack name for display
        
    Returns:
        True if successful, False otherwise
    """
    pack_name = pack_name or pack_dir.name
    source_dir = pack_dir / "_source"
    db_file = pack_dir / f"{pack_dir.name}.db"
    
    print(f"\nBuilding pack: {pack_name}")
    print(f"  Source: {source_dir}")
    print(f"  Output: {db_file}")
    
    if not source_dir.exists():
        print(f"  ! No _source directory found")
        return True  # Not an error - empty pack is valid
    
    items = load_json_files(source_dir)
    
    if not items:
        print(f"  ! No JSON files found in _source directory")
        return True  # Not an error - empty pack is valid
    
    write_db_file(db_file, [item_data for _, item_data in items])
    return True


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
        default="foundryvtt/packs",
        help="Path to packs directory (default: foundryvtt/packs)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Verbose output"
    )
    
    args = parser.parse_args()
    
    # Resolve paths relative to script location
    script_dir = Path(__file__).parent.parent
    packs_dir = script_dir / args.packs_dir
    
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
        results[args.pack] = build_pack(pack_path, args.pack)
    else:
        # Build all packs
        for pack_dir in sorted(packs_dir.iterdir()):
            if pack_dir.is_dir() and not pack_dir.name.startswith('.'):
                results[pack_dir.name] = build_pack(pack_dir)
    
    # Summary
    print("\n" + "=" * 60)
    print("Build Summary:")
    successful = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"  ✓ Successful: {successful}/{total}")
    
    if successful < total:
        failed = [k for k, v in results.items() if not v]
        print(f"  ✗ Failed: {', '.join(failed)}")
        sys.exit(1)
    else:
        print("\n✓ All packs built successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
