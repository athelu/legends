#!/usr/bin/env python3
"""
Build all Legends system packs with specialized parsers.

IMPORTANT: For Foundry V13, this script only generates _source/*.json files.
After running this script, you MUST run the Foundry CLI to compile the packs:

    npm run pack:all

This creates the LevelDB format files required by Foundry V13.

This script runs all individual pack builders in sequence:
- build_armor_pack.py (parses armor.md, creates armor + shield items)
- build_weapons_pack.py (parses weapons.md)
 - build_traits_pack.py (parses traits.md, flaws.md, feats.md)
- build_action_pack.py (parses actions.md)
- build_ability_pack.py (builds from JSON sources)

Usage:
    python build_all_packs.py
"""

import sys
import subprocess
from pathlib import Path


def run_script(script_name):
    """Run a build script and return success/failure."""
    script_path = Path(__file__).parent / script_name
    
    print(f"\n{'='*60}")
    print(f"Running {script_name}")
    print('='*60)
    
    try:
        result = subprocess.run([sys.executable, str(script_path)], check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {script_name} failed with return code {e.returncode}")
        return False


def main():
    scripts = [
        "build_armor_pack.py",
        "build_weapons_pack.py",
        "build_traits_pack.py",
        "build_flaws_pack.py",
        "build_feats_pack.py",
        "build_action_pack.py",
        "build_ability_pack.py",
        "build_backgrounds_pack.py",
        "build_ancestries_pack.py",
        "build_conditions_pack.py",
        "build_weaves_pack.py",
        "build_equipment_pack.py",
    ]
    
    print("Building all Legends system packs...")
    
    results = {}
    for script in scripts:
        results[script] = run_script(script)
    
    # Summary
    print(f"\n{'='*60}")
    print("Build Summary")
    print('='*60)
    
    successful = sum(1 for v in results.values() if v)
    total = len(results)
    
    for script, success in results.items():
        status = "OK" if success else "FAILED"
        print(f"  [{status}] {script}")
    
    print(f"\nTotal: {successful}/{total} successful")

    if successful < total:
        return 1
    else:
        print("\n✓ All pack source files generated successfully!")
        print("\n" + "="*60)
        print("⚠️  NEXT STEP REQUIRED FOR FOUNDRY V13")
        print("="*60)
        print("Run the following command to compile packs to LevelDB format:")
        print("")
        print("    npm run pack:all")
        print("")
        print("Or compile individual packs:")
        print("    npm run pack:feats")
        print("    npm run pack:armor")
        print("    npm run pack:weaves")
        print("    etc.")
        print("")
        print("This creates the LevelDB files (CURRENT, LOCK, MANIFEST-*, *.ldb)")
        print("required by Foundry VTT V13.")
        print("="*60 + "\n")
        return 0


if __name__ == "__main__":
    sys.exit(main())
