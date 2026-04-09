#!/usr/bin/env python3
"""
Build flaws compendium pack from parsed flaws.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_stable_id, ensure_key, md_to_html, apply_enrichers


FLAW_HEADING_RE = re.compile(r'^###\s+(.+?\((\d+(?:-\d+)?)\))\s*$', flags=re.MULTILINE)
SECTION_HEADING_RE = re.compile(r'^##\s+(.+)$', flags=re.MULTILINE)

GM_APPROVAL_RE = re.compile(r'^\*\*(GM Approval Required(?:\s*-\s*[^*]+)?)\*\*$', flags=re.IGNORECASE)

SECTION_TYPE_MAP = {
    'physical flaws': 'physical',
    'mental flaws': 'mental',
    'social flaws': 'social',
}

FLAW_TYPE_OVERRIDES = {
    'berserk': 'combat',
    'cursed': 'supernatural',
    'plague': 'supernatural',
    'touch of evil': 'supernatural',
    'lecherousness': 'social',
}


def _generate_flaw_id(name):
    """Generate a stable ID for a flaw from its canonical name."""
    normalized_name = re.sub(r'\s+', ' ', name).strip().lower()
    return generate_stable_id(f'flaw:{normalized_name}')


def _split_markdown_blocks(text):
    """Split markdown into blank-line separated blocks while preserving inner structure."""
    return [block.strip() for block in re.split(r'\n\s*\n', text.strip()) if block.strip()]


def _split_mixed_block(block):
    """Split a block into narrative text before the first list line and list content after it."""
    lines = block.splitlines()
    first_list_index = None

    for index, line in enumerate(lines):
        if re.match(r'^(?:[-*]\s+|\d+\.\s+)', line.strip()):
            first_list_index = index
            break

    if first_list_index is None or first_list_index == 0:
        return block.strip(), ''

    leading = '\n'.join(lines[:first_list_index]).strip()
    trailing = '\n'.join(lines[first_list_index:]).strip()
    return leading, trailing


def _extract_flaw_sections(content):
    """Extract flaw sections and their current top-level flaw category."""
    headings = list(re.finditer(r'^(#{2,3})\s+(.+)$', content, flags=re.MULTILINE))
    sections = []
    current_section = ''

    for index, match in enumerate(headings):
        level = len(match.group(1))
        heading_text = match.group(2).strip()

        if level == 2:
            current_section = heading_text
            continue

        flaw_match = re.match(r'^(.+?\((\d+(?:-\d+)?)\))\s*$', heading_text)
        if not flaw_match:
            continue

        start = match.end()
        end = headings[index + 1].start() if index + 1 < len(headings) else len(content)
        sections.append((flaw_match.group(1).strip(), content[start:end].strip(), current_section))

    return sections


def _parse_point_range(item_name):
    """Parse a point value or range from a flaw title like 'Chronic Pain (3-5)'."""
    match = re.search(r'\((\d+)(?:-(\d+))?\)', item_name)
    if not match:
        return 0, 0
    minimum = int(match.group(1))
    maximum = int(match.group(2) or match.group(1))
    return minimum, maximum


def _severity_from_range(minimum, maximum):
    """Derive flaw severity from the upper end of the flaw's point range."""
    if maximum <= 2:
        return 'minor'
    if maximum <= 5:
        return 'moderate'
    return 'major'


def _infer_flaw_type(section_name, item_name):
    """Infer flaw type from the enclosing section heading and known overrides."""
    name_lower = item_name.lower()
    for key, value in FLAW_TYPE_OVERRIDES.items():
        if key in name_lower:
            return value

    section_key = re.sub(r'\s+', ' ', section_name).strip().lower()
    if section_key in SECTION_TYPE_MAP:
        return SECTION_TYPE_MAP[section_key]

    return 'mental'


def _extract_flaw_content(section_body):
    """Split flaw markdown into description, mechanics, roleplaying impact, and notes."""
    description_blocks = []
    mechanical_blocks = []
    roleplaying_blocks = []
    note_blocks = []
    requires_gm_approval = False

    for block in _split_markdown_blocks(section_body):
        stripped = block.strip()
        if stripped == '---':
            continue

        gm_match = GM_APPROVAL_RE.match(stripped)
        if gm_match:
            requires_gm_approval = True
            note_blocks.append(f'**{gm_match.group(1)}**')
            continue

        if 'gm approval required' in stripped.lower():
            requires_gm_approval = True

        is_list_block = bool(re.match(r'^(?:[-*]\s+|\d+\.\s+)', stripped))

        if not description_blocks and not is_list_block:
            leading, trailing = _split_mixed_block(stripped)
            if leading:
                description_blocks.append(leading)
            if trailing:
                mechanical_blocks.append(trailing)
            continue

        if is_list_block:
            mechanical_blocks.append(stripped)
            continue

        if mechanical_blocks:
            roleplaying_blocks.append(stripped)
            continue

        description_blocks.append(stripped)

    return {
        'description': '\n\n'.join(description_blocks).strip(),
        'mechanicalEffects': '\n\n'.join(mechanical_blocks).strip(),
        'roleplayingImpact': '\n\n'.join(roleplaying_blocks).strip(),
        'notes': '\n\n'.join(note_blocks).strip(),
        'requiresGMApproval': requires_gm_approval,
    }


def parse_flaws_md(md_file):
    """
    Parse flaws.md and extract flaw items.
    
    Expected format:
    ### Flaw Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"<!--\s*PACK:flaws\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    sections = _extract_flaw_sections(content)

    for item_name, section_body, section_name in sections:
        
        if not item_name:
            continue

        point_min, point_max = _parse_point_range(item_name)
        flaw_type = _infer_flaw_type(section_name, item_name)
        content_fields = _extract_flaw_content(section_body)
        
        item = {
            '_id': _generate_flaw_id(item_name),
            'name': item_name,
            'type': 'flaw',
            'img': 'icons/svg/hazard.svg',
            'system': {
                'description': {'value': ''},
                'pointValue': point_min,
                'flawType': flaw_type,
                'severity': _severity_from_range(point_min, point_max),
                'mechanicalEffects': '',
                'roleplayingImpact': '',
                'canBeOvercome': False,
                'overcomeMethod': '',
                'requiresGMApproval': content_fields['requiresGMApproval'],
                'notes': ''
            },
            'effects': []
        }

        item['system']['description'] = {'value': apply_enrichers(md_to_html(content_fields['description']))}
        item['system']['mechanicalEffects'] = apply_enrichers(md_to_html(content_fields['mechanicalEffects'])) if content_fields['mechanicalEffects'] else ''
        item['system']['roleplayingImpact'] = apply_enrichers(md_to_html(content_fields['roleplayingImpact'])) if content_fields['roleplayingImpact'] else ''
        item['system']['notes'] = apply_enrichers(md_to_html(content_fields['notes'])) if content_fields['notes'] else ''
        
        # Extract image path if specified
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', section_body)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "flaws.md"
    if md_file.exists():
        print("Parsing flaws.md...")
        items = parse_flaws_md(md_file)
        print(f"  Extracted {len(items)} flaw items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "flaws" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding flaws pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "flaws"
    success = build_pack_from_source(pack_dir, "flaws")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
