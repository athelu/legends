#!/usr/bin/env python3
"""
Build ancestries compendium pack from parsed ancestry.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_stable_id, ensure_key, md_to_html, apply_enrichers


ATTRIBUTE_NAMES = ['strength', 'constitution', 'agility', 'dexterity', 'intelligence', 'wisdom', 'charisma', 'luck']

HUMAN_ETHNICITY_ORIGIN_KEYS = {
    'bellicosian': 'bellicosian-empire',
    'coudassian': 'republic-of-coudassis',
    'echartesh': 'the-echartean-empire',
    'mersagian': 'kingdom-of-meresaw',
    'odani': 'odani',
    'urjack': 'urjack',
}


def generate_ancestry_id(name):
    normalized_name = re.sub(r'\s+', ' ', name).strip().lower()
    return generate_stable_id(f'ancestry:{normalized_name}')


def slugify(name):
    slug = name.lower()
    slug = re.sub(r"[\\/]+", '-', slug)
    slug = re.sub(r"[^\w\s-]", '', slug)
    slug = re.sub(r"\s+", '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def markdown_to_plaintext(text):
    if not text:
        return ''

    cleaned = re.sub(r'`([^`]+)`', r'\1', text)
    cleaned = re.sub(r'\*\*([^*]+)\*\*', r'\1', cleaned)
    cleaned = re.sub(r'\*([^*]+)\*', r'\1', cleaned)
    cleaned = re.sub(r'^#{1,6}\s+', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^[-*]\s+', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()


def extract_subsections(section_body):
    matches = list(re.finditer(r'^(#{2,6})\s+(.+)$', section_body, flags=re.MULTILINE))
    sections = []

    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(section_body)
        sections.append({
            'level': len(match.group(1)),
            'title': match.group(2).strip(),
            'body': section_body[start:end].strip(),
        })

    return sections


def extract_characteristics_summary(section_body):
    tables = re.findall(r'((?:\|[^\n]*\|\n){3,})', section_body)
    summaries = []

    for table in tables:
      if 'Characteristics' not in table:
        continue

      lines = [line.strip() for line in table.strip().splitlines() if line.strip().startswith('|')]
      rows = []
      for line in lines[2:]:
        cells = [cell.strip() for cell in line.strip('|').split('|')]
        if not any(cells):
          continue
        if len(cells) == 2:
          label, value = cells
          if label and value:
            rows.append(f'{label}: {value}')
        elif len(cells) >= 3:
          label = cells[0]
          remaining = [cell for cell in cells[1:] if cell]
          if label and remaining:
            rows.append(f"{label}: {' / '.join(remaining)}")

      if rows:
        summaries.append('\n'.join(rows))

    return '\n\n'.join(summaries).strip()


def extract_physical_description(section_body, description):
    paragraphs = []
    normalized_description = markdown_to_plaintext(description)
    if normalized_description:
        paragraphs.append(normalized_description)

    for subsection in extract_subsections(section_body):
        title = subsection['title'].lower()
        if 'optional' in title or 'starting age' in title or 'table' in title or 'texture' in title:
            continue

        body = subsection['body']
        if 'Characteristics' in body or '| d8 |' in body:
            continue

        plain_body = markdown_to_plaintext(body)
        if not plain_body:
            continue

        if re.search(r'appear|skin|hair|eye|tall|thin|height|weight|ears|complexion', plain_body, flags=re.IGNORECASE):
            paragraphs.append(plain_body)

    characteristics = extract_characteristics_summary(section_body)
    if characteristics:
        paragraphs.append(characteristics)

    return '\n\n'.join(dict.fromkeys(block for block in paragraphs if block)).strip()


def extract_culture(section_body):
    blocks = []

    for subsection in extract_subsections(section_body):
        title = subsection['title'].lower()
        if 'optional' in title or 'starting age' in title or 'table' in title or 'texture' in title:
            continue

        body = subsection['body']
        if 'Characteristics' in body or '| d8 |' in body:
            continue

        plain_body = markdown_to_plaintext(body)
        if not plain_body:
            continue

        blocks.append(f"{subsection['title']}\n{plain_body}")

    return '\n\n'.join(blocks).strip()


_WORD_TO_INT = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8}


def _parse_count(word):
    w = str(word).lower().strip()
    try:
        return int(w)
    except ValueError:
        return _WORD_TO_INT.get(w, 1)


def parse_skill_grant(description):
    if not description:
        return None

    # "increase N skills to rank M and N others to rank K" (compound — split into two grants)
    compound = re.search(
        r'increase\s+(\w+)\s+skills?.*?to\s+rank\s+(\d+)\s+and\s+(\w+)\s+others?\s+to\s+(?:rank\s+)?(\d+)',
        description, flags=re.IGNORECASE,
    )
    if compound:
        return {
            '_compound': True,
            'parts': [
                {'mode': 'any', 'targetRank': int(compound.group(2)), 'count': _parse_count(compound.group(1)), 'options': []},
                {'mode': 'any', 'targetRank': int(compound.group(4)), 'count': _parse_count(compound.group(3)), 'options': []},
            ],
        }

    # "increase any N skills to rank M"
    multi_any = re.search(
        r'increase\s+(?:any\s+)?(\w+)\s+skills?.*?to\s+rank\s+(\d+)',
        description, flags=re.IGNORECASE,
    )
    if multi_any:
        return {'mode': 'any', 'targetRank': int(multi_any.group(2)), 'count': _parse_count(multi_any.group(1)), 'options': []}

    # "Raise X to N and Y to N" or "Raise X to N and Y N" (both fixed, same rank → allOf)
    raise_both = re.search(
        r'[Rr]aise\s+(.+?)\s+to\s+(\d+)\s+and\s+(.+?)\s+(?:to\s+)?(\d+)',
        description,
    )
    if raise_both:
        skill1, rank1 = raise_both.group(1).strip(' .'), int(raise_both.group(2))
        skill2, rank2 = raise_both.group(3).strip(' .'), int(raise_both.group(4))
        if rank1 == rank2:
            return {'mode': 'allOf', 'targetRank': rank1, 'options': [skill1, skill2]}
        return {
            '_compound': True,
            'parts': [
                {'mode': 'fixed', 'skill': skill1, 'targetRank': rank1, 'options': []},
                {'mode': 'fixed', 'skill': skill2, 'targetRank': rank2, 'options': []},
            ],
        }

    return None


def parse_ability_line(line):
    stripped = line.strip()
    if not stripped:
        return None
    if stripped.startswith('|') or stripped.startswith('---'):
        return None

    match = re.match(r'^\*\*([^*]+?):\*\*\s*(.+)$', stripped)
    if not match:
        match = re.match(r'^\*\*([^*]+)\*\*:\s*(.+)$', stripped)
    if not match:
        match = re.match(r'^([^:*][^:]{1,120}):\s*(.+)$', stripped)
    if not match:
        return None

    name = markdown_to_plaintext(match.group(1)).strip(' .')
    description = markdown_to_plaintext(match.group(2)).strip()
    if not name or not description:
        return None

    grant = {
        'id': slugify(name),
        'name': name,
        'description': description,
    }
    skill_grant = parse_skill_grant(description)
    if skill_grant:
        grant['skillGrant'] = skill_grant
    return grant


def extract_ancestry_ability_grants(section_text):
    match = re.search(r'^##\s+[^\n]*abilities\s*$([\s\S]*?)(?=^##\s+|^#\s+|\Z)', section_text, flags=re.IGNORECASE | re.MULTILINE)
    if not match:
        return []

    body = match.group(1)
    subheading_match = re.search(r'^#{3,}\s+', body, flags=re.MULTILINE)
    if subheading_match:
        body = body[:subheading_match.start()]

    grants = []
    seen_ids = set()
    for line in body.splitlines():
        parsed = parse_ability_line(line)
        if not parsed:
            continue

        skill_grant = parsed.get('skillGrant')
        if skill_grant and skill_grant.get('_compound'):
            base_id = parsed['id']
            for i, part in enumerate(skill_grant['parts']):
                tier_id = f'{base_id}-tier-{i + 1}'
                if tier_id in seen_ids:
                    continue
                seen_ids.add(tier_id)
                tier_grant = dict(part)
                if i > 0:
                    tier_grant['excludeGrantIds'] = [f'{base_id}-tier-{j + 1}' for j in range(i)]
                grants.append({'id': tier_id, 'name': parsed['name'], 'description': parsed['description'], 'skillGrant': tier_grant})
        else:
            grant_id = parsed['id']
            if grant_id in seen_ids:
                continue
            seen_ids.add(grant_id)
            grants.append(parsed)

    return grants


def extract_human_origin_ability_grants(section_text):
    grants = {}
    for ethnicity_name, origin_key in HUMAN_ETHNICITY_ORIGIN_KEYS.items():
        section_match = re.search(
            rf'^###\s+{re.escape(ethnicity_name)}\s*$([\s\S]*?)(?=^###\s+|^##\s+|^#\s+|\Z)',
            section_text,
            flags=re.IGNORECASE | re.MULTILINE,
        )
        if not section_match:
            continue

        block = section_match.group(1)
        parsed_grant = None
        for line in block.splitlines():
            parsed = parse_ability_line(line)
            if parsed:
                parsed_grant = parsed
                break

        if parsed_grant:
            grants[origin_key] = parsed_grant

    return grants


def parse_ancestries_md(md_file):
    """
    Parse ancestry.md and extract ancestry items.
    
    Expected format:
    # Ancestry Name
    Description text...
    
    Ancestries are denoted by Heading 1 (# ) markers.
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for optional PACK marker
    m = re.search(r"<!--\s*PACK:ancestries\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []
    
    # Split by Heading 1 ancestry sections (# Ancestry Name)
    sections = re.split(r'^# ', content, flags=re.MULTILINE)[1:]
    
    for section in sections:
        lines = section.split('\n')
        item_name = lines[0].strip()
        
        if not item_name:
            continue
        
        # Get the main description (everything up to the first ## or ### heading)
        description_lines = []
        for line in lines[1:]:
            # Stop at the first subsection heading (## or ###)
            if re.match(r'^#{2,}\s+', line):
                break
            description_lines.append(line)
        
        description = '\n'.join(description_lines).strip()
        
        item = {
            '_id': generate_ancestry_id(item_name),
            'name': item_name,
            'type': 'ancestry',
            'img': 'icons/svg/person.svg',
            'system': {
                'description': {'value': ''},
                'size': 'medium',
                'speed': 30,
                'bonuses': {'attributes': {attr: 0 for attr in ATTRIBUTE_NAMES}},
                'traits': '',
                'languages': '',
                'specialAbilities': '',
                'senses': '',
                'abilityGrants': [],
                'originAbilityGrants': {},
                'lifespan': 0,
                'culture': '',
                'physicalDescription': '',
                'requiresGMApproval': False,
                'notes': ''
            },
            'effects': []
        }

        # Convert description to HTML
        item['system']['description'] = {'value': apply_enrichers(md_to_html(description))}
        item['system']['physicalDescription'] = extract_physical_description(section, description)
        item['system']['culture'] = extract_culture(section)
        item['system']['abilityModifiers'] = dict(item['system']['bonuses']['attributes'])
        ability_grants = extract_ancestry_ability_grants(section)
        item['system']['abilityGrants'] = ability_grants
        item['system']['specialAbilities'] = '\n'.join(
            f"{grant['name']}: {grant['description']}" for grant in ability_grants
        )

        if item_name.strip().lower() in {'human', 'humans'}:
            item['system']['originAbilityGrants'] = extract_human_origin_ability_grants(section)
        
        # Extract image path if specified
        img_match = re.search(r'\*?\*?Image:?\*?\*?\s*`?([^`\n|]+)`?', description)
        if img_match:
            item['img'] = img_match.group(1).strip()
        
        # Try to extract lifespan from the full section
        lifespan_match = re.search(r'Lifespan[:\s|]+(\d+(?:-\d+)?)\s*years?', section, re.IGNORECASE)
        if lifespan_match:
            lifespan_str = lifespan_match.group(1)
            # If it's a range like "200-400", take the average
            if '-' in lifespan_str:
                low, high = map(int, lifespan_str.split('-'))
                item['system']['lifespan'] = (low + high) // 2
            else:
                item['system']['lifespan'] = int(lifespan_str)
        
        items.append(item)
    
    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Parse from markdown
    md_file = script_dir / "ttrpg" / "03-ancestry.md"
    if md_file.exists():
        print("Parsing ancestry.md...")
        items = parse_ancestries_md(md_file)
        print(f"  Extracted {len(items)} ancestry items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "ancestries" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for existing in source_dir.glob('*.json'):
            existing.unlink()

        for item in items:
            json_file = source_dir / f"{slugify(item['name'])}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding ancestries pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "ancestries"
    success = build_pack_from_source(pack_dir, "ancestries")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
