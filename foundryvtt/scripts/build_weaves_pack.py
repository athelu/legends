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
from pack_utils import build_pack_from_source, generate_stable_id, ensure_key, md_to_html, apply_enrichers

# Add source/weaves directory to path for detectors
script_dir = Path(__file__).parent
weave_tools_path = script_dir.parent / 'source' / 'weaves'
sys.path.insert(0, str(weave_tools_path))

# Import detectors
try:
    import delivery_method_detector  # type: ignore
    import tag_detector  # type: ignore
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
    import jsonschema  # type: ignore
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


def _canonical_weave_name(name: str) -> str:
    """Strip markdown and trailing tag decoration from a weave heading."""
    cleaned = re.sub(r'\s*\*\*\[([^\]]+)\]\*\*', '', name)
    cleaned = re.sub(r'\s*\[([^\]]+)\]\s*$', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def _safe_filename(name: str) -> str:
    """Return a deterministic canonical filename slug for a weave."""
    canonical_name = _canonical_weave_name(name)
    slug = re.sub(r'[^a-z0-9]+', '-', canonical_name.strip().lower())
    return slug.strip('-')


def _legacy_filename(name: str) -> str:
    """Return the legacy weave filename slug used before canonical cleanup."""
    legacy = re.sub(r"[^A-Za-z0-9 ._\-]", "-", name)
    legacy = legacy.strip().lower()
    legacy = re.sub(r"[\s]+", "-", legacy)
    legacy = re.sub(r"-+", "-", legacy)
    return legacy.strip('-')


def _generate_weave_id(name: str) -> str:
    """Generate a stable Foundry document ID from the canonical weave name."""
    canonical_name = _canonical_weave_name(name).lower()
    return generate_stable_id(f'weave:{canonical_name}')


def _load_existing_weave(source_dir, weave_name):
    """
    Load existing weave JSON to preserve manually-added fields like appliesEffects.
    Returns None if the file doesn't exist.
    """
    candidate_filenames = [f"{_safe_filename(weave_name)}.json"]
    legacy_filename = f"{_legacy_filename(weave_name)}.json"
    if legacy_filename not in candidate_filenames:
        candidate_filenames.append(legacy_filename)

    for filename in candidate_filenames:
        json_file = source_dir / filename
        if not json_file.exists():
            continue
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
    
    Supports both old and new formats:
    - Old: "0 = miss, 1 = half damage (4), 2 = full damage (8), ..."
    - New (attack): "0 successes: miss, 1 success: half damage (4), ..."
    - New (save): "Net 0 or less: resist, Net 1: half damage (14), ..."
    
    Also looks for condition thresholds like "**Sickened Condition (at 5 successes):**"
    
    Output: {
        "0": { "damage": 0, "description": "miss" },
        "1": { "damage": 4, "description": "half damage" },
        "2": { "damage": 8, "description": "full damage" },
        "3": { "damage": 16, "description": "enhanced", "appliesEffects": true }
    }
    """
    if not scaling_text:
        return {}
    
    scaling_table = {}
    
    # Parse main scaling line
    # Split by comma or newline (some entries span multiple lines)
    entries = re.split(r'[,\n]\s*', scaling_text)
    
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        
        # Match various formats:
        # - "0 = miss" (old format)
        # - "0 successes: miss" (old format with label)
        # - "Net 0 or less: resist" (new save format)
        # - "Net 1: half damage (14)" (new save format)
        # - "1 success: half damage (4)" (new attack format)
        match = re.match(
            r'^(?:Net\s+)?(\d+)(?:\s+(?:or\s+less|successes?|success))?[=:]\s*(.+)', 
            entry, 
            re.IGNORECASE
        )
        if match:
            success_level = match.group(1)
            rest = match.group(2).strip()
            
            # Check if this entry has "+ applies effects" or "+ Applies effects" or "+ Applies effect"
            applies_effects_in_entry = False
            if re.search(r'\+\s*[Aa]pplies\s+[Ee]ffects?', rest):
                applies_effects_in_entry = True
                # Remove the "+ applies effects" part from the description
                rest = re.sub(r'\s*\+\s*[Aa]pplies\s+[Ee]ffects?', '', rest).strip()
            
            # Extract damage amount from parentheses like "(4)" or "(16 total)" or "(14)"
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
            
            normalized_description = description.lower()

            # Determine if effects apply at this level
            applies = not any(term in normalized_description for term in ['no effect', 'fail', 'fails', 'miss', 'misses', 'resist'])
            
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


def _extract_markdown_field(text, labels):
    """Extract the first matching markdown field value for one of the labels."""
    if not text:
        return ''

    label_pattern = '|'.join(re.escape(label) for label in labels)
    match = re.search(
        rf'\*\*(?:{label_pattern}):\*\*\s*(.+?)(?=\n\*\*[A-Z]|\Z)',
        text,
        re.DOTALL
    )
    if not match:
        return ''

    return match.group(1).strip()


def _strip_markdown_text(text):
    """Convert a short markdown fragment into plain text for structured fields."""
    if not text:
        return ''

    stripped = re.sub(r'\[\[/[^\]]+\]\]', '', text)
    stripped = re.sub(r'[`*_#>]+', '', stripped)
    stripped = re.sub(r'\s+', ' ', stripped)
    return stripped.strip()


def _parse_energy_spec(text):
    """Parse an energy field into a normalized energy type and numeric cost."""
    plain_text = _strip_markdown_text(text)
    if not plain_text:
        return '', 0

    match = re.match(r'(.+?)\s+(\d+)(?:\b|$)', plain_text)
    if not match:
        return '', 0

    raw_type = match.group(1).strip().lower()
    cost = int(match.group(2))
    normalized_type = re.sub(r'\s+', ' ', raw_type)

    energy_aliases = {
        'earth': 'earth',
        'air': 'air',
        'fire': 'fire',
        'water': 'water',
        'positive': 'positive',
        'negative': 'negative',
        'space': 'space',
        'time': 'time',
        'force': 'force',
        'entropy': 'entropy',
        'matching elemental energy (earth/air/fire/water)': 'variable-elemental',
        'matching elemental energy': 'variable-elemental',
        'your primary energy': 'variable-elemental'
    }

    return energy_aliases.get(normalized_type, ''), cost


def _derive_target_category(range_text, effect_text):
    """Map prose/range hints to the categorical target values expected by the item sheet."""
    normalized_range = range_text.lower()
    haystack = f"{range_text} {effect_text}".lower()

    if 'cone' in haystack:
        return 'cone'
    if re.search(r'\bline\b', haystack):
        return 'line'
    if any(keyword in haystack for keyword in ['radius', 'sphere', 'burst']) and any(marker in haystack for marker in ['creature', 'target', 'enemy', 'humanoid', 'within', 'all ']):
        return 'sphere'
    if any(keyword in haystack for keyword in ['cube', 'hemisphere', 'area', 'zone', 'wall']) and any(marker in haystack for marker in ['creature', 'target', 'enemy', 'within', 'all ']):
        return 'area'
    if re.search(r'up to\s+\d+\s+(targets?|creatures?)', haystack) or any(keyword in haystack for keyword in ['all creatures', 'all creature', 'multiple targets', 'multiple creatures', 'each creature', 'each target']):
        return 'multiple'
    if any(keyword in haystack for keyword in ['single-target', 'single target', 'one creature', 'humanoid target', 'touched creature', 'target at ', 'target one ']):
        return 'single'
    if any(keyword in haystack for keyword in ['object you touch', 'one object', 'touched object']):
        return 'single'
    if 'self' in normalized_range:
        return 'single'
    if 'touch' in haystack:
        return 'single'

    return ''


def _derive_effect_type(effect_text, applies_effects, damage_base):
    """Infer a broad effect category that matches current weave runtime fields."""
    if damage_base > 0:
      return 'damage'

    normalized_effect = effect_text.lower()
    effect_ids = [entry.get('effectId', '').lower() for entry in applies_effects]

    if any(word in normalized_effect for word in ['heal', 'healing', 'restore', 'regain']):
        return 'healing'

    summon_markers = ['summon', 'conjure', 'animate', 'animating', 'servant', 'elemental', 'zombie', 'skeleton', 'undead under your control']
    if any(marker in normalized_effect for marker in summon_markers):
        return 'summon'

    transformation_markers = ['transform', 'transformation', 'polymorph', 'shapechange', 'changes into', 'turn into', 'size shift', 'malleable form']
    if any(marker in normalized_effect for marker in transformation_markers):
        return 'transformation'

    divination_markers = ['identify', 'learn', 'reveal', 'detect', 'sense', 'scry', 'perceive', 'see ', 'see through', 'commune', 'communion']
    if any(marker in normalized_effect for marker in divination_markers):
        return 'divination'

    protection_markers = ['protection', 'ward', 'shield', 'armor', 'damage reduction', 'dr increases', 'reflect', 'reflection', 'resistance']
    if any(marker in normalized_effect for marker in protection_markers):
        return 'protection'

    control_effects = {
        'frightened', 'fleeing', 'cowering', 'paralyzed', 'stunned', 'restrained', 'grappled',
        'prone', 'slowed', 'dazed', 'charmed', 'hidden', 'invisible', 'concealed', 'revealed',
        'blinded', 'deafened', 'asleep', 'sleep', 'confusion', 'sickened'
    }
    if any(effect_id in control_effects for effect_id in effect_ids):
        return 'control'

    buff_markers = ['bonus', 'fortune', 'blessing', 'haste', 'gain', 'gains', 'increase', 'enhance']
    if any(marker in normalized_effect for marker in ['gain', 'gains', 'increase', 'protect', 'grant']) or any(marker in effect_id for effect_id in effect_ids for marker in buff_markers):
        return 'buff'

    debuff_markers = ['penalty', 'misfortune', 'reduce', 'weaken', 'slow']
    if any(marker in normalized_effect for marker in debuff_markers):
        return 'debuff'

    return 'utility'


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
                '_id': _generate_weave_id(weave_name),
                'name': _canonical_weave_name(weave_name),
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
                    'targetingSuccessScaling': '',  # Unified field for all weaves
                    'weavingRoll': '',
                    'targetingRoll': '',
                    'actionCost': 1,
                    'appliesEffects': []
                },
                'effects': []
            }

            # Extract full text for parsing
            full_text = '\n'.join(lines[1:]).strip()

            effect_text = _extract_markdown_field(full_text, ['Effect', 'Description'])
            item['system']['effect'] = _strip_markdown_text(effect_text)
            
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
            primary_energy_text = _extract_markdown_field(description, ['Primary Energy'])
            primary_type, primary_cost = _parse_energy_spec(primary_energy_text)
            if primary_type or primary_cost:
                item['system']['energyCost']['primary']['type'] = primary_type
                item['system']['energyCost']['primary']['cost'] = primary_cost

            supporting_energy_text = _extract_markdown_field(description, ['Supporting Energy'])
            supporting_type, supporting_cost = _parse_energy_spec(supporting_energy_text)
            if supporting_type or supporting_cost:
                item['system']['energyCost']['supporting']['type'] = supporting_type
                item['system']['energyCost']['supporting']['cost'] = supporting_cost
                item['system']['weaveType'] = 'complex'
            elif primary_type or primary_cost:
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

            item['system']['target'] = _derive_target_category(item['system']['range'], effect_text)
            
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
            
            # Parse Weaving Roll field
            weaving_roll_match = re.search(r'\*\*Weaving Roll:\*\*\s*([^\n]+)', description)
            if weaving_roll_match:
                item['system']['weavingRoll'] = weaving_roll_match.group(1).strip()
            
            # Parse Targeting Roll field (NEW - two-roll system)
            targeting_roll_match = re.search(r'\*\*Targeting Roll:\*\*\s*([^\n]+)', description)
            if targeting_roll_match:
                item['system']['targetingRoll'] = targeting_roll_match.group(1).strip()
            
            # Parse Applies Effects field from markdown first (needed for scaling parser)
            applies_match = re.search(r'\*\*Applies Effects:\*\*\s*([^\n]+)', description)
            applies_effects_list = []
            if applies_match:
                effects_str = applies_match.group(1).strip()
                applies_effects_list = _parse_applies_effects(effects_str)
                item['system']['appliesEffects'] = applies_effects_list

            item['system']['effectType'] = _derive_effect_type(
                item['system']['effect'],
                applies_effects_list,
                item['system']['damage']['base']
            )
            
            # Parse Success Scaling field into structured data
            # NEW: All weaves use "Targeting Success Scaling:" in the two-roll system
            # Also support old "Success Scaling:" for backward compatibility
            scaling_match = re.search(
                r'\*\*(?:Targeting Success Scaling|Success Scaling)[^:]*:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)', 
                description
            )
            if scaling_match:
                scaling_text = scaling_match.group(1).strip()
                item['system']['targetingSuccessScaling'] = scaling_text  # Unified field for all weaves
                
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
            
            # Auto-detect and apply classification
            if DETECTORS_AVAILABLE:
                # Detect delivery method
                delivery_method = detect_delivery_method(item)
                item['system']['deliveryMethod'] = delivery_method
                
                # Detect tags
                tags = detect_all_tags(item)
                item['system']['tags'] = tags
            
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

        for old_file in source_dir.glob('*.json'):
            old_file.unlink()
        
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
