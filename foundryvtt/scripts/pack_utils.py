"""
Shared utilities for building Foundry VTT pack files.
"""

import json
import uuid
from pathlib import Path


def generate_id():
    """Generate a random ID suitable for Foundry items."""
    return uuid.uuid4().hex[:16]


def ensure_key(item):
    """Ensure the item has a _key field required by the Foundry CLI (ClassicLevel).

    The _key format is '!items!<_id>' for item-type documents.
    """
    if '_key' not in item:
        _id = item.get('_id', generate_id())
        item['_key'] = f"!items!{_id}"
    return item


def load_json_files(source_dir):
    """
    Load all JSON files from a source directory.
    
    Args:
        source_dir: Path to the _source directory
        
    Returns:
        List of item data dictionaries
    """
    items = []
    source_path = Path(source_dir)
    
    if not source_path.exists():
        print(f"  Source directory not found: {source_dir}")
        return items
    
    # Load individual JSON files (accept both .json and .JSON)
    json_files = sorted(source_path.glob("*.json")) + sorted(source_path.glob("*.JSON"))
    # Deduplicate while preserving order (some filesystems match both globs)
    seen = set()
    unique_files = []
    for p in json_files:
        key = str(p.resolve())
        if key in seen:
            continue
        seen.add(key)
        unique_files.append(p)

    for json_file in unique_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Handle both single items and arrays of items
                if isinstance(data, list):
                    items.extend(data)
                    print(f"  Loaded {json_file.name} ({len(data)} items)")
                else:
                    items.append(data)
                    print(f"  Loaded {json_file.name}")
        except json.JSONDecodeError as e:
            print(f"  Error parsing {json_file.name}: {e}")
        except Exception as e:
            print(f"  Error reading {json_file.name}: {e}")
    
    return items


def validate_items(items):
    """
    Validate and fix items for Foundry compatibility.
    
    Args:
        items: List of item data dictionaries
        
    Returns:
        Validated items list
    """
    for item in items:
        # Ensure _id exists
        if '_id' not in item:
            item['_id'] = generate_id()

        # Ensure _key exists (required by Foundry CLI ClassicLevel packer)
        ensure_key(item)
            
        # Ensure name exists
        if 'name' not in item:
            item['name'] = "Unnamed Item"
            
        # Ensure type exists
        if 'type' not in item:
            item['type'] = "item"
            
        # Ensure system object exists
        if 'system' not in item:
            item['system'] = {}
            
        # Ensure effects array exists
        if 'effects' not in item:
            item['effects'] = []
        
        # Set default image if not specified
        if 'img' not in item:
            item['img'] = "icons/svg/item-bag.svg"
    
    return items


def write_db_file(output_path, items):
    """
    Write items to a .db file in line-delimited JSON format.
    
    Args:
        output_path: Path to the output .db file
        items: List of item data dictionaries
    """
    if not items:
        print(f"  No items to write")
        return
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in items:
            # Write as line-delimited JSON (one JSON object per line)
            f.write(json.dumps(item, ensure_ascii=False, separators=(',', ':')))
            f.write('\n')
    
    print(f"  Generated {output_path.name} with {len(items)} items")


def build_pack_from_source(pack_dir, pack_name=None):
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
    print(f"  Source directory: {source_dir.resolve()}")
    
    items = load_json_files(source_dir)
    
    if not items:
        print(f"  No items found")
        return False
    
    items = validate_items(items)
    write_db_file(db_file, items)
    return True
