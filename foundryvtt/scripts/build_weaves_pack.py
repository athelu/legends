#!/usr/bin/env python3
"""
Build weaves compendium pack from parsed weaves.md documentation.

The weaves are split across multiple files:
- weaves(a-g).md
- weaves(h-m).md
- weaves(n-r).md
- weaves(s-z).md

This script will parse all of them and preserve manually-added fields
(such as appliesEffects) from existing JSON files.
"""

import json
import re
import sys
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file, ensure_key, md_to_html, apply_enrichers

# Add source/weaves directory to path for detectors
script_dir = Path(__file__).parent
weave_tools_path = script_dir.parent / 'source' / 'weaves'
sys.path.insert(0, str(weave_tools_path))

# Import detectors
try:
    import delivery_method_detector
    import tag_detector
    detect_delivery_method = delivery_method_detector.detect_delivery_method
    detect_all_tags = tag_detector.detect_all_tags
    DETECTORS_AVAILABLE = True
    print(f"[OK] Loaded detectors from {weave_tools_path}")
except ImportError as e:
    print(f"Warning: Could not import detectors: {e}")
    print(f"  Tried path: {weave_tools_path}")
    print("Weaves will be created without auto-classification.")
    DETECTORS_AVAILABLE = False

# Import schema validation (optional)
try:
    import jsonschema
    SCHEMA_VALIDATION_AVAILABLE = True
    # Load schema
    schema_path = script_dir.parent / 'source' / 'weaves' / 'weave-schema.json'
    if schema_path.exists():
        with open(schema_path, 'r', encoding='utf-8') as f:
            WEAVE_SCHEMA = json.load(f)
        print(f"[OK] Loaded schema from {schema_path}")
    else:
        WEAVE_SCHEMA = None
        print(f"Warning: Schema file not found at {schema_path}")
except ImportError:
    print("Warning: jsonschema not installed. Schema validation disabled.")
    print("Install with: pip install jsonschema")
    SCHEMA_VALIDATION_AVAILABLE = False
    WEAVE_SCHEMA = None


def _safe_filename(name: str) -> str:
    """Return a filesystem-safe filename for item names (cross-platform).

    Replace characters that are invalid on Windows (and awkward elsewhere)
    with hyphens and collapse repeated hyphens.
    """
    # Replace any character that is not alphanumeric, period, underscore, space or hyphen
    s = re.sub(r"[^A-Za-z0-9 ._\-]", "-", name)
    s = s.strip().lower()
    s = re.sub(r"[\s]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s


def _load_existing_weave(source_dir, weave_name):
    """
    Load existing weave JSON to preserve manually-added fields like appliesEffects.
    Returns None if the file doesn't exist.
    """
    filename = _safe_filename(weave_name) + '.json'
    json_file = source_dir / filename
    
    if json_file.exists():
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"  Warning: Could not load existing {filename}: {e}")
    
    return None


def _preserve_manual_fields(new_item, existing_item):
    """
    Preserve manually-added fields from existing item that shouldn't be overwritten.
    Currently preserves:
    - system.appliesEffects (effect references)
    """
    if existing_item and 'system' in existing_item:
        # Preserve appliesEffects if it exists and is not empty
        if 'appliesEffects' in existing_item['system']:
            applies_effects = existing_item['system']['appliesEffects']
            if applies_effects:  # Only if non-empty
                new_item['system']['appliesEffects'] = applies_effects
                return True  # Indicate that we preserved something
    
    return False


def _parse_applies_effects(effects_str):
    """
    Parse the Applies Effects field from markdown into appliesEffects array.
    
    Formats supported:
    - "haste" → [{ effectId: "haste", params: {} }]
    - "dr-bonus (value=2)" → [{ effectId: "dr-bonus", params: { value: "2" } }]
    - "effect1; effect2 (param=value)" → multiple effects
    - "effect1, effect2" → multiple effects (comma-separated)
    """
    if not effects_str:
        return []
    
    applies_effects = []
    
    # Split by semicolon or comma
    effect_entries = re.split(r'[;,]', effects_str)
    
    for entry in effect_entries:
        entry = entry.strip()
        if not entry:
            continue
        
        # Parse: "effect-name (param1=value1, param2=value2)"
        match = re.match(r'^([a-z0-9\-]+)\s*(?:\(([^)]+)\))?$', entry, re.IGNORECASE)
        if match:
            effect_id = match.group(1).strip()
            params_str = match.group(2)
            
            params = {}
            if params_str:
                # Parse parameters: "value=2, type=bonus"
                param_parts = params_str.split(',')
                for param_part in param_parts:
                    param_part = param_part.strip()
                    if '=' in param_part:
                        key, value = param_part.split('=', 1)
                        params[key.strip()] = value.strip()
            
            applies_effects.append({
                'effectId': effect_id,
                'params': params
            })
    
    return applies_effects


def _parse_damage_scaling(scaling_text, description, base_damage, applies_effects):
    """
    Parse Success Scaling text into structured scaling table.
    
    Input example: "0 = miss, 1 = half damage (4), 2 = full damage (8), 3 = +8 damage (16 total), 4 = +16 damage (24 total), 5 = +16 damage (24 total) + applies effects"
    
    Also looks for condition thresholds like "**Sickened Condition (at 5 successes):**"
    
    Output: {
        "0": { "damage": 0, "description": "miss" },
        "1": { "damage": 4, "description": "half damage" },
        "2": { "damage": 8, "description": "full damage" },
        "3": { "damage": 16, "description": "enhanced" },
        "4": { "damage": 24, "description": "critical" },
        "5": { "damage": 24, "appliesEffects": true, "description": "critical + applies effects" }
    }
    """
    if not scaling_text:
        return {}
    
    scaling_table = {}
    
    # Parse main scaling line: "0 = miss, 1 = half damage (4), 2 = full damage (8), ..."
    # Split by comma, then parse each entry
    entries = scaling_text.split(',')
    
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        
        # Match: "0 = miss" or "1 = half damage (4)" or "3 = +8 damage (16 total)" or "5 = ... + applies effects"
        match = re.match(r'^(\d+)\s*[=:]\s*(.+)', entry)
        if match:
            success_level = match.group(1)
            rest = match.group(2).strip()
            
            # Check if this entry has "+ applies effects" or "+ Applies effects" or "+ Applies effect"
            applies_effects_in_entry = False
            if re.search(r'\+\s*[Aa]pplies\s+[Ee]ffects?', rest):
                applies_effects_in_entry = True
                # Remove the "+ applies effects" part from the description
                rest = re.sub(r'\s*\+\s*[Aa]pplies\s+[Ee]ffects?', '', rest).strip()
            
            # Extract damage amount from parentheses like "(4)" or "(16 total)"
            damage_match = re.search(r'\((\d+)(?:\s+total)?\)', rest)
            damage = 0
            if damage_match:
                damage = int(damage_match.group(1))
            elif 'miss' in rest.lower() or 'no damage' in rest.lower():
                damage = 0
            
            # Determine description
            desc = rest
            # Clean up description
            if damage_match:
                desc = re.sub(r'\s*\(\d+(?:\s+total)?\)', '', desc).strip()
            
            # Simplify common descriptions
            if 'miss' in desc.lower():
                desc = 'miss'
            elif 'half' in desc.lower() and 'damage' in desc.lower():
                desc = 'half damage'
            elif 'full' in desc.lower() and 'damage' in desc.lower():
                desc = 'full damage'
            elif '+' in desc and 'damage' in desc.lower():
                desc = 'enhanced'
            
            # Add "+ applies effects" back to description if it was present
            if applies_effects_in_entry:
                desc = desc + ' + applies effects'
            
            scaling_entry = {
                'damage': damage,
                'description': desc
            }
            
            # Add appliesEffects flag if "+ applies effects" was in the entry
            if applies_effects_in_entry:
                scaling_entry['appliesEffects'] = True
            
            scaling_table[success_level] = scaling_entry
    
    # Parse condition thresholds from description
    # Pattern: "**ConditionName Condition (at N successes):**"
    condition_matches = re.finditer(
        r'\*\*([A-Za-z]+)\s+Condition\s*\(at\s+(\d+)\s+successes?\):\*\*',
        description,
        re.IGNORECASE
    )
    
    for match in condition_matches:
        condition_name = match.group(1).lower()
        success_level = match.group(2)
        
        # Add effect to that success level
        if success_level in scaling_table:
            scaling_table[success_level]['effect'] = condition_name
            # Update description if it doesn't mention the effect
            if 'applies' not in scaling_table[success_level]['description']:
                scaling_table[success_level]['description'] = f"applies {condition_name}"
        else:
            # Create new entry if level doesn't exist
            # Use previous damage value or base damage
            prev_damage = base_damage
            for i in range(int(success_level) - 1, -1, -1):
                if str(i) in scaling_table and 'damage' in scaling_table[str(i)]:
                    prev_damage = scaling_table[str(i)]['damage']
                    break
            
            scaling_table[success_level] = {
                'damage': prev_damage,
                'effect': condition_name,
                'description': f"applies {condition_name}"
            }
    
    return scaling_table


def _parse_effect_scaling(scaling_text, applies_effects):
    """
    Parse Success Scaling text for effect weaves (no damage).
    
    Input example: "0 = no effect, 1 = 1 round, 2 = full effect, 3 = 10 minutes, 4 = 1 hour, 5 = 4 hours"
    
    Output: {
        "0": { "appliesEffects": false, "description": "no effect", "duration": null },
        "1": { "appliesEffects": true, "description": "1 round", "duration": "1 round" },
        "2": { "appliesEffects": true, "description": "full effect", "duration": "full" },
        "3": { "appliesEffects": true, "description": "10 minutes", "duration": "10 minutes" },
        "4": { "appliesEffects": true, "description": "1 hour", "duration": "1 hour" },
        "5": { "appliesEffects": true, "description": "4 hours", "duration": "4 hours" }
    }
    """
    if not scaling_text:
        return {}
    
    scaling_table = {}
    
    # Parse scaling line: "0 = no effect, 1 = 1 round, 2 = full effect, ..."
    entries = scaling_text.split(',')
    
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        
        # Match: "0 = no effect" or "1 = 1 round" or "3 = 10 minutes"
        match = re.match(r'^(\d+)\s*[=:]\s*(.+)', entry)
        if match:
            success_level = match.group(1)
            description = match.group(2).strip()
            
            # Determine if effects apply at this level
            applies = 'no effect' not in description.lower()
            
            # Extract duration if present
            duration = None
            if applies:
                # Common duration patterns: "1 round", "full effect", "10 minutes", "1 hour", etc.
                duration = description
            
            scaling_entry = {
                'appliesEffects': applies,
                'description': description,
                'duration': duration
            }
            
            scaling_table[success_level] = scaling_entry
    
    return scaling_table


def parse_weaves_md(ttrpg_dir, source_dir=None):
    """
    Parse all weaves.md files and extract weave items.
    
    Expected format:
    ### Weave Name
    Description and details...
    
    If source_dir is provided, will load existing JSON files to preserve
    manually-added fields like appliesEffects.
    """
    items = []
    
    # List of weave files to parse
    weave_files = [
        'weaves(a-g).md',
        'weaves(h-m).md',
        'weaves(n-r).md',
        'weaves(s-z).md'
    ]
    
    for weave_file in weave_files:
        md_path = ttrpg_dir / weave_file
        if not md_path.exists():
            print(f"  Warning: {weave_file} not found")
            continue
        
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by weave sections (### Heading)
        sections = re.split(r'^### ', content, flags=re.MULTILINE)[1:]
        
        for section in sections:
            lines = section.split('\n')
            weave_name = lines[0].strip()
            
            if not weave_name:
                continue
            
            item = {
                '_id': generate_id(),
                'name': weave_name,
                'type': 'weave',
                'img': 'icons/magic/abjuration/abjuration-purple.webp',
                'system': {
                    'description': {'value': ''},
                    'weaveType': '',
                    'actionCost': 1,
                    'energyCost': {
                        'primary': {'type': '', 'cost': 0},
                        'supporting': {'type': '', 'cost': 0}
                    },
                    'range': '',
                    'duration': '',
                    'target': '',
                    'savingThrow': 'none',
                    'effect': '',
                    'effectType': '',
                    'weaveType': '',
                    'damage': {'base': 0, 'type': '', 'drInteraction': '', 'scaling': {}},
                    'successScaling': '',
                    'weavingRoll': '',
                    'actionCost': 1,
                    'appliesEffects': []
                },
                'effects': []
            }

            # Extract full text for parsing
            full_text = '\n'.join(lines[1:]).strip()
            
            # Extract only the Description/Effect field for description.value
            # Look for "**Description:**" or "**Effect:**" field
            description_match = re.search(
                r'\*\*(?:Description|Effect):\*\*\s*([^\*]+?)(?=\s*\*\*[A-Z]|\s*$)',
                full_text,
                re.DOTALL
            )
            
            if description_match:
                description_text = description_match.group(1).strip()
                item['system']['description'] = {'value': apply_enrichers(md_to_html(description_text))}
            else:
                # Fallback: use full text if we can't find Description/Effect field
                item['system']['description'] = {'value': apply_enrichers(md_to_html(full_text))}

            # Try to parse energy costs from full text
            description = full_text  # Keep using 'description' variable name for backward compat
            primary_match = re.search(r'\*\*Primary Energy:\*\*\s*(\w+)\s+(\d+)', description)
            if primary_match:
                item['system']['energyCost']['primary']['type'] = primary_match.group(1).lower()
                item['system']['energyCost']['primary']['cost'] = int(primary_match.group(2))
            supporting_match = re.search(r'\*\*Supporting Energy:\*\*\s*(\w+)\s+(\d+)', description)
            if supporting_match:
                item['system']['energyCost']['supporting']['type'] = supporting_match.group(1).lower()
                item['system']['energyCost']['supporting']['cost'] = int(supporting_match.group(2))
                item['system']['weaveType'] = 'complex'
            elif primary_match:
                item['system']['weaveType'] = 'simple'
            
            # Parse Action field to determine actionCost
            action_match = re.search(r'\*\*Action:\*\*\s*([^\n]+)', description)
            if action_match:
                action_text = action_match.group(1).strip().lower()
                if 'complex' in action_text or '2 action' in action_text:
                    item['system']['actionCost'] = 2
                elif 'simple' in action_text or '1 action' in action_text:
                    item['system']['actionCost'] = 1
            else:
                # Fallback: Set actionCost based on weaveType if no Action field
                if item['system']['weaveType'] == 'complex':
                    item['system']['actionCost'] = 2
                else:
                    item['system']['actionCost'] = 1
            
            # Extract image path if specified
            img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', description)
            if img_match:
                item['img'] = img_match.group(1).strip()
            
            # Parse damage information from Effect field
            # Try to match "X <type> damage" or "X <type> and <type> damage"
            # Examples: "28 bludgeoning damage" or "28 bludgeoning and cold damage"
            effect_match = re.search(r'\*\*Effect:\*\*[^*]*?(\d+)\s+((?:\w+(?:\s+and\s+)?)+)\s*damage', description, re.IGNORECASE)
            if effect_match:
                damage_amount = int(effect_match.group(1))
                damage_types_str = effect_match.group(2).strip()
                # Extract first damage type from compound types (e.g., "bludgeoning and cold" -> "bludgeoning")
                first_type = damage_types_str.split()[0].lower()
                item['system']['damage']['base'] = damage_amount
                item['system']['damage']['type'] = first_type
                item['system']['effectType'] = 'damage'
            else:
                # Try to match "deals X damage" or "takes X damage" without type
                effect_match_simple = re.search(r'\*\*Effect:\*\*[^*]*?(?:deals|takes)\s+(\d+)\s+damage', description, re.IGNORECASE)
                if effect_match_simple:
                    damage_amount = int(effect_match_simple.group(1))
                    item['system']['damage']['base'] = damage_amount
                    item['system']['effectType'] = 'damage'
            
            # Parse Range field
            range_match = re.search(r'\*\*Range:\*\*\s*([^\n]+)', description)
            if range_match:
                item['system']['range'] = range_match.group(1).strip()
            
            # Parse Duration field
            duration_match = re.search(r'\*\*Duration:\*\*\s*([^\n]+)', description)
            if duration_match:
                item['system']['duration'] = duration_match.group(1).strip()
            
            # Parse Saving Throw field
            save_match = re.search(r'\*\*Saving Throw:\*\*\s*([^\n(]+)', description)
            if save_match:
                save_text = save_match.group(1).strip().lower()
                if 'none' in save_text or 'attack weave' in save_text:
                    item['system']['savingThrow'] = 'none'
                elif 'fortitude' in save_text:
                    item['system']['savingThrow'] = 'fortitude'
                elif 'reflex' in save_text:
                    item['system']['savingThrow'] = 'reflex'
                elif 'will' in save_text:
                    item['system']['savingThrow'] = 'will'
            
            # Parse Damage Type field (for more explicit damage type extraction)
            # Only use if it's an actual damage type, not descriptive words like "Physical" or "Energy"
            valid_damage_types = ['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'acid', 
                                  'lightning', 'force', 'necrotic', 'radiant', 'psychic', 'poison', 'thunder']
            damage_type_match = re.search(r'\*\*Damage Type:\*\*[^*]*?(slashing|piercing|bludgeoning|fire|cold|acid|lightning|force|necrotic|radiant|psychic|poison|thunder)', 
                                         description, re.IGNORECASE)
            if damage_type_match and item['system']['damage']['base'] > 0:
                extracted_type = damage_type_match.group(1).lower()
                if extracted_type in valid_damage_types:
                    item['system']['damage']['type'] = extracted_type
            
            # Parse DR Interaction field
            dr_match = re.search(r'\*\*DR Interaction:\*\*\s*([^\n]+)', description)
            if dr_match:
                dr_text = dr_match.group(1).strip().lower()
                if 'half dr' in dr_text or 'half' in dr_text:
                    item['system']['damage']['drInteraction'] = 'half'
                elif 'full dr' in dr_text or 'full' in dr_text:
                    item['system']['damage']['drInteraction'] = 'full'
                elif 'none' in dr_text or 'ignores dr' in dr_text or 'ignore' in dr_text:
                    item['system']['damage']['drInteraction'] = 'ignore'
            
            # Parse Applies Effects field from markdown first (needed for scaling parser)
            applies_match = re.search(r'\*\*Applies Effects:\*\*\s*([^\n]+)', description)
            applies_effects_list = []
            if applies_match:
                effects_str = applies_match.group(1).strip()
                applies_effects_list = _parse_applies_effects(effects_str)
                item['system']['appliesEffects'] = applies_effects_list
            
            # Parse Success Scaling field into structured data
            # Handle variations like "Success Scaling:" or "Success Scaling (Net successes...):"
            scaling_match = re.search(r'\*\*Success Scaling[^:]*:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)', description)
            if scaling_match:
                scaling_text = scaling_match.group(1).strip()
                if item['system']['damage']['base'] > 0:
                    # Damage weave: parse damage scaling
                    item['system']['damage']['scaling'] = _parse_damage_scaling(
                        scaling_text,
                        description,
                        item['system']['damage']['base'],
                        applies_effects_list
                    )
                else:
                    # Effect weave: parse effect/duration scaling
                    item['system']['damage']['scaling'] = _parse_effect_scaling(
                        scaling_text,
                        applies_effects_list
                    )
            
            # Preserve manually-added fields from existing JSON (if available)
            # This is now mainly for backward compatibility
            if source_dir:
                existing = _load_existing_weave(source_dir, weave_name)
                if existing:
                    # Only preserve if not already parsed from markdown
                    if not applies_match and existing.get('system', {}).get('appliesEffects'):
                        item['system']['appliesEffects'] = existing['system']['appliesEffects']
                    # Keep the same _id to maintain references
                    item['_id'] = existing.get('_id', item['_id'])
            
            # Auto-detect and apply classification
            if DETECTORS_AVAILABLE:
                # Detect delivery method
                delivery_method = detect_delivery_method(item)
                item['system']['deliveryMethod'] = delivery_method
                
                # Detect tags
                tags = detect_all_tags(item)
                item['system']['tags'] = tags
                
                # Clean up **[Tag]** markers from name
                original_name = item['name']
                cleaned_name = re.sub(r'\s*\*\*\[([^\]]+)\]\*\*', '', original_name)
                if cleaned_name != original_name:
                    item['name'] = cleaned_name.strip()
            
            items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    ttrpg_dir = script_dir / "ttrpg"
    source_dir = script_dir / "foundryvtt" / "packs" / "weaves" / "_source"
    
    # Parse from markdown
    if ttrpg_dir.exists():
        print("Parsing weaves.md files...")
        # Pass source_dir to enable preservation of IDs
        items = parse_weaves_md(ttrpg_dir, source_dir)
        print(f"  Extracted {len(items)} weave items from documentation")
        
        # Count how many have appliesEffects (from markdown or preserved)
        effects_count = sum(1 for item in items if item['system'].get('appliesEffects'))
        if effects_count > 0:
            print(f"  {effects_count} weave(s) with appliesEffects configured")
        
        # Validate against schema (if available)
        if SCHEMA_VALIDATION_AVAILABLE and WEAVE_SCHEMA:
            print("\nValidating weaves against schema...")
            validation_errors = []
            for item in items:
                try:
                    jsonschema.validate(instance=item, schema=WEAVE_SCHEMA)
                except jsonschema.ValidationError as e:
                    validation_errors.append((item['name'], str(e.message)))
            
            if validation_errors:
                print(f"  Warning: {len(validation_errors)} validation error(s):")
                for name, error in validation_errors[:5]:  # Show first 5
                    print(f"    - {name}: {error}")
                if len(validation_errors) > 5:
                    print(f"    ... and {len(validation_errors) - 5} more")
            else:
                print(f"  [OK] All {len(items)} weaves validated successfully")
        
        # Classification summary
        if DETECTORS_AVAILABLE:
            print("\nClassification summary:")
            delivery_counts = {}
            for item in items:
                method = item['system'].get('deliveryMethod', 'unknown')
                delivery_counts[method] = delivery_counts.get(method, 0) + 1
            
            for method, count in sorted(delivery_counts.items()):
                print(f"  {method}: {count}")
            
            # Tag statistics
            all_tags = set()
            for item in items:
                all_tags.update(item['system'].get('tags', []))
            print(f"\nUnique tags found: {len(all_tags)}")
            if all_tags:
                print(f"  {', '.join(sorted(all_tags))}")
        
        # Save to _source/
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            filename = _safe_filename(item['name']) + '.json'
            json_file = source_dir / filename
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding weaves pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "weaves"
    success = build_pack_from_source(pack_dir, "weaves")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
