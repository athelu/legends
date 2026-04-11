"""
Shared utilities for building Foundry VTT pack files.
"""

import json
import re
import hashlib
import uuid
from pathlib import Path


def generate_id():
    """Generate a random ID suitable for Foundry items."""
    return uuid.uuid4().hex[:16]


def generate_stable_id(seed):
    """Generate a deterministic 16-character hex ID from a stable seed string."""
    if seed is None:
        raise ValueError('seed is required for deterministic ID generation')
    normalized_seed = str(seed).strip().lower()
    if not normalized_seed:
        raise ValueError('seed must not be empty for deterministic ID generation')
    return hashlib.sha256(normalized_seed.encode('utf-8')).hexdigest()[:16]


DOCUMENT_COLLECTION_KEYS = {
    'Item': 'items',
    'Actor': 'actors',
    'JournalEntry': 'journal',
    'Macro': 'macros',
    'RollTable': 'tables',
}


def ensure_key(item, collection='items'):
    """Ensure a document has the ClassicLevel _key expected by the Foundry CLI.

    The _key format is '!<collection>!<_id>', for example '!items!<_id>' or
    '!journal!<_id>'.
    """
    if '_key' not in item:
        _id = item.get('_id', generate_id())
        item['_key'] = f"!{collection}!{_id}"
    return item


def md_to_html(text):
    """Convert markdown text to Foundry-compatible HTML with enricher syntax.

    Handles:
      - ##### / #### / ### headings -> <h5> / <h4> / <h3>
      - **bold** -> <strong>bold</strong>
      - *italic* -> <em>italic</em>
      - Bullet lists with nesting (indented sub-items)
      - Numbered lists (1. item)
      - Blank-line separated paragraphs
      - Inline enricher insertion for skill checks, saves, and damage
    """
    if not text:
        return ''

    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    lines = text.strip().split('\n')
    html_parts = []
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Skip blank lines
        if not stripped:
            i += 1
            continue

        # Headings (any level # through ######)
        if stripped.startswith('#'):
            # Count heading level and cap at h6
            level = min(len(stripped) - len(stripped.lstrip('#')), 6)
            heading_text = stripped.lstrip('#').strip()
            heading_text = _inline_format(heading_text)
            html_parts.append(f'<h{level}>{heading_text}</h{level}>')
            i += 1
            continue

        # Bullet list block (lines starting with - at any indent level)
        if re.match(r'\s*-\s+', line):
            list_html, i = _parse_list(lines, i)
            html_parts.append(list_html)
            continue

        # Numbered list block
        if re.match(r'\s*\d+\.\s+', line):
            list_html, i = _parse_numbered_list(lines, i)
            html_parts.append(list_html)
            continue

        # Regular paragraph: collect consecutive non-special lines
        para_lines = []
        old_i = i
        while i < len(lines):
            l = lines[i].strip()
            if not l or l.startswith('#') or re.match(r'\s*-\s+', lines[i]) or re.match(r'\s*\d+\.\s+', lines[i]):
                break
            para_lines.append(l)
            i += 1
        if para_lines:
            para_text = ' '.join(para_lines)
            para_text = _inline_format(para_text)
            html_parts.append(f'<p>{para_text}</p>')
        elif i == old_i:
            # Safety: skip unrecognized line to prevent infinite loop
            i += 1

    return '\n'.join(html_parts)


def _inline_format(text):
    """Apply inline markdown formatting: bold, italic."""
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<em>\1</em>', text)
    return text


def _get_indent(line):
    """Return the number of leading spaces on a line."""
    return len(line) - len(line.lstrip())


def _parse_list(lines, start):
    """Parse a bullet list block (with nesting) starting at `start`.
    Handles continuation lines (indented non-bullet text) and nested sub-lists.
    Returns (html_string, next_line_index)."""
    items = []
    base_indent = _get_indent(lines[start])
    i = start

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Stop on blank line or non-list content at base indent
        if not stripped:
            i += 1
            break
        indent = _get_indent(line)
        if indent < base_indent:
            break
        if indent == base_indent and not re.match(r'\s*-\s+', line):
            break

        if indent > base_indent:
            # Check if this is a nested bullet list or a continuation line
            if re.match(r'\s*-\s+', line):
                # Nested bullet list — recurse
                nested_html, i = _parse_list(lines, i)
                if items:
                    items[-1] = items[-1] + '\n' + nested_html
                else:
                    items.append(nested_html)
            else:
                # Continuation text for the previous bullet item
                if items:
                    items[-1] = items[-1] + ' ' + stripped
                i += 1
            continue

        # Top-level list item at this indent
        item_text = re.sub(r'^\s*-\s+', '', line).strip()
        item_text = _inline_format(item_text)
        items.append(item_text)
        i += 1

    li_parts = '\n'.join(f'<li>{item}</li>' for item in items)
    return f'<ul>\n{li_parts}\n</ul>', i


def _parse_numbered_list(lines, start):
    """Parse a numbered list block starting at `start`.
    Returns (html_string, next_line_index)."""
    items = []
    i = start

    while i < len(lines):
        stripped = lines[i].strip()
        if not stripped:
            i += 1
            break
        m = re.match(r'\s*\d+\.\s+(.*)', lines[i])
        if not m:
            break
        item_text = _inline_format(m.group(1).strip())
        items.append(item_text)
        i += 1

    li_parts = '\n'.join(f'<li>{item}</li>' for item in items)
    return f'<ol>\n{li_parts}\n</ol>', i


# ---------------------------------------------------------------------------
#  Enricher helpers — insert [[/check ...]], [[/save ...]], [[/damage ...]]
# ---------------------------------------------------------------------------

# Skill key lookup: display name -> enricher key
SKILL_KEYS = {
    'athletics': 'athletics', 'might': 'might', 'devices': 'devices',
    'thievery': 'thievery', 'writing': 'writing', 'ranged combat': 'rangedCombat',
    'craft': 'craft', 'acrobatics': 'acrobatics', 'melee combat': 'meleeCombat',
    'stealth': 'stealth', 'investigation': 'investigate', 'language': 'language',
    'history': 'history', 'arcana': 'arcane', 'arcane': 'arcane',
    'society': 'society', 'perception': 'perception', 'wilderness': 'wilderness',
    'religion': 'religion', 'empathy': 'empathy',
    'persuasion': 'persuasion', 'deception': 'deception',
    'intimidation': 'intimidate', 'intimidate': 'intimidate',
    'performance': 'perform', 'perform': 'perform',
    'medicine': 'medicine',
}

SAVE_TYPES = {'fortitude', 'reflex', 'will'}


def apply_enrichers(text):
    """Replace natural-language references to skill checks, saves, and damage
    with Foundry enricher syntax ``[[/check ...]]``, ``[[/save ...]]``, and
    ``[[/damage ...]]``.

    This is intentionally conservative — it only converts patterns that are
    unambiguous so hand-written descriptions are not mangled.
    """
    if not text:
        return text

    # --- Saves: "Fortitude save", "Reflex save", "Will save" ---------------
    def _replace_save(m):
        save_type = m.group(1).lower()
        if save_type in SAVE_TYPES:
            return f'[[/save type={save_type}]]'
        return m.group(0)

    text = re.sub(
        r'\b(Fortitude|Reflex|Will)\s+save\b',
        _replace_save,
        text,
        flags=re.IGNORECASE,
    )

    # --- Skill checks: "Athletics check", "Medicine check", etc. -----------
    # Build alternation from known display names (longest first to avoid partial matches)
    skill_names_sorted = sorted(SKILL_KEYS.keys(), key=len, reverse=True)
    skill_pattern = '|'.join(re.escape(n) for n in skill_names_sorted)

    def _replace_check(m):
        skill_display = m.group(1).lower()
        key = SKILL_KEYS.get(skill_display)
        if key:
            return f'[[/check skill={key}]]'
        return m.group(0)

    text = re.sub(
        rf'\b({skill_pattern})\s+check\b',
        _replace_check,
        text,
        flags=re.IGNORECASE,
    )

    # --- Damage: "XdY <type> damage" or "X <type> damage" -----------------
    def _replace_damage(m):
        formula = m.group(1)
        dmg_type = (m.group(2) or '').strip().lower()
        type_part = f' type={dmg_type}' if dmg_type else ''
        return f'[[/damage {formula}{type_part}]] damage'

    text = re.sub(
        r'\b(\d+d\d+|\d+)\s+(\w+\s+)?damage\b',
        _replace_damage,
        text,
        flags=re.IGNORECASE,
    )

    return text


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


def validate_items(items, document_type='Item'):
    """
    Validate and fix items for Foundry compatibility.
    
    Args:
        items: List of document data dictionaries
        document_type: Foundry document type name
        
    Returns:
        Validated document list
    """
    collection = DOCUMENT_COLLECTION_KEYS.get(document_type, 'items')

    for item in items:
        # Ensure _id exists
        if '_id' not in item:
            item['_id'] = generate_id()

        # Ensure _key exists (required by Foundry CLI ClassicLevel packer)
        ensure_key(item, collection=collection)
            
        # Ensure name exists
        if 'name' not in item:
            item['name'] = "Unnamed Item"

        if document_type == 'JournalEntry':
            if 'pages' not in item:
                item['pages'] = []
            if 'folder' not in item:
                item['folder'] = None
            if 'sort' not in item:
                item['sort'] = 0
            if 'ownership' not in item:
                item['ownership'] = {'default': 0}
            if 'flags' not in item:
                item['flags'] = {}

            for index, page in enumerate(item['pages']):
                if '_id' not in page:
                    page['_id'] = generate_id()
                if '_key' not in page:
                    page['_key'] = f"!journal.pages!{item['_id']}.{page['_id']}"
                if 'name' not in page:
                    page['name'] = f'Page {index + 1}'
                if 'type' not in page:
                    page['type'] = 'text'
                if 'title' not in page:
                    page['title'] = {'show': True, 'level': 1}
                if 'sort' not in page:
                    page['sort'] = index * 1000
                if 'ownership' not in page:
                    page['ownership'] = {'default': 0}
                if 'flags' not in page:
                    page['flags'] = {}
                if 'system' not in page:
                    page['system'] = {}
                if 'src' not in page:
                    page['src'] = None

                if page.get('type') == 'text':
                    text_data = page.setdefault('text', {})
                    if 'content' not in text_data:
                        text_data['content'] = ''
                    if 'markdown' not in text_data:
                        text_data['markdown'] = ''
                    if 'format' not in text_data:
                        text_data['format'] = 1
            continue

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
    [DEPRECATED - Foundry V13+]
    
    This function writes line-delimited JSON .db files which are from older
    Foundry versions. Foundry V13 uses LevelDB format exclusively.
    
    Use the Foundry CLI instead:
        npm run pack:<packname>
    
    This function is kept for backwards compatibility but should not be used.
    """
    print(f"  WARNING: write_db_file() is deprecated for Foundry V13+")
    print(f"  Use 'npm run pack:<packname>' to create LevelDB files instead")
    return


def build_pack_from_source(pack_dir, pack_name=None, document_type='Item'):
    """
    Validate _source JSON files for a pack.
    
    NOTE: For Foundry V13, this function ONLY validates the _source/*.json files.
    It does NOT create .db files. After running this, you must run the Foundry CLI
    to compile the pack into LevelDB format:
    
        npm run pack:<packname>
    
    Args:
        pack_dir: Path to the pack directory
        pack_name: Optional pack name for display
        
    Returns:
        True if successful, False otherwise
    """
    pack_name = pack_name or pack_dir.name
    source_dir = pack_dir / "_source"
    
    print(f"\nValidating pack source files: {pack_name}")
    print(f"  Source directory: {source_dir.resolve()}")
    
    items = load_json_files(source_dir)
    
    if not items:
        print(f"  No items found in _source/")
        return False
    
    items = validate_items(items, document_type=document_type)
    print(f"  ✓ Validated {len(items)} items")
    print(f"  Next step: Run 'npm run pack:{pack_name}' to compile to LevelDB format")
    return True
