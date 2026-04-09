#!/usr/bin/env python3
"""
Build traits compendium pack from parsed traits.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_stable_id, ensure_key, md_to_html, apply_enrichers


TRAIT_HEADING_RE = re.compile(
    r'^(#{2,3})\s+(.+?\((-?\d+)(?:\s+to\s+-?\d+)?\))\s*$',
    flags=re.MULTILINE,
)

LABELLED_BLOCK_RE = re.compile(r'^\*\*([^*]+?):\*\*\s*(.*)$', flags=re.DOTALL)

BENEFIT_LABELS = {
    'benefits',
    'mechanical benefits',
    'common mechanical elements',
    'sorcerer signature abilities',
    'manifestation benefits',
    'mechanical framework',
}

VISUAL_LABELS = {
    'visual effects',
    'visual aesthetics by manifestation',
}

NOTE_LABELS = {
    'flavor',
    'pact nature (roleplay guidance)',
}

MAGICAL_TRAIT_METADATA = {
    'mageborn': {
        'castingStat': 'intelligence',
        'grantsEnergyPool': True,
        'grantsMasterySkills': True,
        'grantsRitualCasting': True,
    },
    'divine-gift': {
        'castingStat': 'wisdom',
        'grantsEnergyPool': True,
        'grantsMasterySkills': True,
        'grantsRitualCasting': False,
    },
    'invoker': {
        'castingStat': 'charisma',
        'grantsEnergyPool': True,
        'grantsMasterySkills': True,
        'grantsRitualCasting': False,
    },
    'infuser': {
        'castingStat': 'intelligence',
        'grantsEnergyPool': True,
        'grantsMasterySkills': True,
        'grantsRitualCasting': False,
    },
    'sorcerous-origin': {
        'castingStat': 'wisdom',
        'grantsEnergyPool': True,
        'grantsMasterySkills': True,
        'grantsRitualCasting': False,
    },
    'eldritch-pact': {
        'castingStat': 'charisma',
        'grantsEnergyPool': True,
        'grantsMasterySkills': True,
        'grantsRitualCasting': False,
    },
    'alchemical-tradition': {
        'castingStat': 'intelligence',
        'grantsEnergyPool': False,
        'grantsMasterySkills': False,
        'grantsRitualCasting': False,
    },
}


def _generate_trait_id(name):
    """Generate a stable ID for a trait from its canonical name."""
    normalized_name = re.sub(r'\s+', ' ', name).strip().lower()
    return generate_stable_id(f'trait:{normalized_name}')


def _extract_trait_sections(content):
    """Extract real trait sections from traits markdown.

    A trait entry is defined by a ## or ### heading that includes its point cost.
    This excludes internal subsections such as patron choices, pact variants, and
    alchemical preparation subheadings.
    """
    matches = list(TRAIT_HEADING_RE.finditer(content))
    sections = []

    for index, match in enumerate(matches):
        item_name = match.group(2).strip()
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
        sections.append((item_name, content[start:end].strip()))

    return sections


def _strip_trait_metadata(section_body):
    """Remove builder metadata lines from the stored trait description body."""
    cleaned_lines = []

    for line in section_body.splitlines():
        stripped = line.strip()
        if re.match(r'^\*\*Image:\*\*', stripped, flags=re.IGNORECASE):
            continue
        if re.match(r'^\*\*Requirements?:\*\*', stripped, flags=re.IGNORECASE):
            continue
        cleaned_lines.append(line)

    return '\n'.join(cleaned_lines).strip()


def _split_markdown_blocks(text):
    """Split markdown into blank-line separated blocks while preserving inner structure."""
    return [block.strip() for block in re.split(r'\n\s*\n', text.strip()) if block.strip()]


def _strip_label_prefix(block):
    """Strip a leading **Label:** prefix from a block if present."""
    match = LABELLED_BLOCK_RE.match(block.strip())
    if not match:
        return block.strip()
    remainder = match.group(2).strip()
    return remainder if remainder else ''


def _append_block(target, block):
    """Append a non-empty markdown block to a target list."""
    cleaned = block.strip()
    if cleaned:
        target.append(cleaned)


def _split_mixed_block(block):
    """Split a block into narrative text before the first list line and the list content after it."""
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


def _extract_trait_content(section_body):
    """Split a trait section into description, benefits, visual effects, and notes."""
    body = _strip_trait_metadata(section_body)
    description_blocks = []
    benefit_blocks = []
    visual_blocks = []
    note_blocks = []
    benefits_started = False

    for block in _split_markdown_blocks(body):
        stripped = block.strip()
        if stripped == '---':
            continue
        label_match = LABELLED_BLOCK_RE.match(stripped)
        label = label_match.group(1).strip().lower() if label_match else ''
        is_heading = bool(re.match(r'^#{2,6}\s+', stripped))
        is_list_block = bool(re.match(r'^(?:[-*]\s+|\d+\.\s+)', stripped))

        if label in VISUAL_LABELS:
            _append_block(visual_blocks, _strip_label_prefix(stripped))
            continue

        if label in NOTE_LABELS:
            _append_block(note_blocks, stripped)
            continue

        if label in BENEFIT_LABELS:
            benefits_started = True
            _append_block(benefit_blocks, _strip_label_prefix(stripped))
            continue

        if is_heading:
            benefits_started = True
            _append_block(benefit_blocks, stripped)
            continue

        if benefits_started:
            _append_block(benefit_blocks, stripped)
            continue

        if not benefits_started and is_list_block:
            _append_block(benefit_blocks, stripped)
            continue

        mixed_description, mixed_benefits = _split_mixed_block(stripped)
        if mixed_benefits:
            _append_block(description_blocks, mixed_description)
            _append_block(benefit_blocks, mixed_benefits)
            continue

        _append_block(description_blocks, stripped)

    return {
        'description': '\n\n'.join(description_blocks).strip(),
        'benefits': '\n\n'.join(benefit_blocks).strip(),
        'visualEffects': '\n\n'.join(visual_blocks).strip(),
        'notes': '\n\n'.join(note_blocks).strip(),
    }


def parse_traits_md(md_file):
    """
    Parse traits.md and extract trait items.
    
    Expected format:
    ### Trait Name
    Description text...
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"<!--\s*PACK:traits\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Magical trait identifiers
    magical_traits = {
        'mageborn': 'mageborn',
        'divine gift': 'divine-gift',
        'invoker': 'invoker',
        'infuser': 'infuser',
        'sorcerous origin': 'sorcerous-origin',
        'eldritch pact': 'eldritch-pact',
        'alchemical tradition': 'alchemical-tradition',
        'gifted mage': 'gifted-mage',
        'balanced channeler': 'balanced-channeler'
    }
    
    sections = _extract_trait_sections(content)

    for item_name, section_body in sections:
        if not item_name:
            continue
        
        # Check if this is a magical trait
        is_magical = False
        magical_type = ''
        trait_type = 'physical'  # default
        
        name_lower = item_name.lower()
        for key, value in magical_traits.items():
            if key in name_lower:
                is_magical = True
                magical_type = value
                trait_type = 'magical'
                break
        
        # Categorize non-magical traits
        if not is_magical:
            if any(x in name_lower for x in ['hearing', 'smell', 'taste', 'sight', 'memory', 
                                              'jointed', 'skilled', 'reflexes', 'alertness', 'intuition']):
                trait_type = 'physical'
            elif any(x in name_lower for x in ['contacts', 'loyalty', 'touch of good']):
                trait_type = 'social'
            elif 'luck' in name_lower:
                trait_type = 'luck'
            elif any(x in name_lower for x in ['immortality', 'longevity', 'mentor', 'mythic']):
                trait_type = 'special'
        
        item = {
            '_id': _generate_trait_id(item_name),
            'name': item_name,
            'type': 'trait',
            'img': 'icons/skills/social/diplomacy-handshake.webp',
            'system': {
                'description': {'value': ''},
                'pointCost': 0,
                'traitType': trait_type,
                'isMagical': is_magical,
                'magicalType': magical_type,
                'requirements': '',
                'benefits': '',
                'notes': '',
                'visualEffects': '',
                'castingStat': '',
                'elementalAffinity': '',
                'grantsEnergyPool': False,
                'grantsMasterySkills': False,
                'grantsRitualCasting': False,
                'requiresGMApproval': any(x in name_lower for x in ['immortality', 'mentor', 'mythic']),
                'requiresExistingTrait': ''  # No longer used - modifiers are passive
            },
            'effects': []
        }

        content_fields = _extract_trait_content(section_body)
        item['system']['description'] = {'value': apply_enrichers(md_to_html(content_fields['description']))}
        item['system']['benefits'] = apply_enrichers(md_to_html(content_fields['benefits'])) if content_fields['benefits'] else ''
        item['system']['visualEffects'] = apply_enrichers(md_to_html(content_fields['visualEffects'])) if content_fields['visualEffects'] else ''
        item['system']['notes'] = apply_enrichers(md_to_html(content_fields['notes'])) if content_fields['notes'] else ''

        # Try to extract point cost from name like "Trait Name (-3)"
        cost_match = re.search(r'\((-?\d+)(?:\s+to\s+-?\d+)?\)', item_name)
        if cost_match:
            item['system']['pointCost'] = int(cost_match.group(1))
        
        # Extract image path if specified
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', section_body)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        # Extract requirements if specified
        req_match = re.search(r'\*?\*?Requirements?:?\*?\*?\s*([^\n]+)', section_body)
        if req_match:
            item['system']['requirements'] = req_match.group(1).strip()

        if magical_type in MAGICAL_TRAIT_METADATA:
            item['system'].update(MAGICAL_TRAIT_METADATA[magical_type])
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "traits.md"
    if md_file.exists():
        print("Parsing traits.md...")
        items = parse_traits_md(md_file)
        print(f"  Extracted {len(items)} trait items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "traits" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        # Clean old JSON files to prevent orphaned entries
        print("  Cleaning old JSON files...")
        for old_file in source_dir.glob("*.json"):
            old_file.unlink()
        print(f"  Removed old files")
        
        for item in items:
            json_file = source_dir / f"{item['name'].lower().replace(' ', '-').replace('/', '-').replace('(', '').replace(')', '')}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding traits pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "traits"
    success = build_pack_from_source(pack_dir, "traits")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
