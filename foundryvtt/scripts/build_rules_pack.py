#!/usr/bin/env python3
"""Build the rules reference compendium pack from markdown documentation."""

import json
import re
from pathlib import Path

from pack_utils import apply_enrichers, build_pack_from_source, generate_stable_id, md_to_html


SECTION_HEADING_RE = re.compile(r'^##\s+(.+?)\s*$')
SKILL_HEADING_RE = re.compile(r'^###\s+(.+?)\s*\(([^)]+)\)\s*$')
HORIZONTAL_RULE_RE = re.compile(r'^\s*---+\s*$')


def slugify(value):
    slug = re.sub(r'[^a-z0-9]+', '-', value.strip().lower())
    return slug.strip('-')


def trim_block(lines):
    cleaned = list(lines)
    while cleaned and not cleaned[0].strip():
        cleaned.pop(0)
    while cleaned and not cleaned[-1].strip():
        cleaned.pop()
    return cleaned


def normalize_markdown(markdown_text):
    normalized_lines = []

    for raw_line in markdown_text.replace('\r\n', '\n').replace('\r', '\n').split('\n'):
        stripped = raw_line.strip()

        if stripped.startswith('<!--') and stripped.endswith('-->'):
            continue

        if HORIZONTAL_RULE_RE.match(stripped):
            continue

        if stripped.startswith('**') and normalized_lines and normalized_lines[-1].strip():
            normalized_lines.append('')

        normalized_lines.append(raw_line)

    return '\n'.join(trim_block(normalized_lines))


def to_html(markdown_text):
    enriched = apply_enrichers(normalize_markdown(markdown_text))
    return md_to_html(enriched)


def build_text_page(name, markdown_text, seed, sort):
    page_id = generate_stable_id(seed)
    return {
        '_id': page_id,
        'name': name,
        'type': 'text',
        'title': {
            'show': True,
            'level': 1,
        },
        'text': {
            'content': to_html(markdown_text),
            'markdown': normalize_markdown(markdown_text),
            'format': 1,
        },
        'sort': sort,
        'ownership': {
            'default': 0,
        },
        'flags': {},
        'src': None,
        'system': {},
    }


def parse_top_level_sections(content):
    lines = content.replace('\r\n', '\n').replace('\r', '\n').split('\n')

    while lines and (not lines[0].strip() or lines[0].startswith('# ')):
        lines.pop(0)

    sections = []
    current_name = None
    current_lines = []

    for line in lines:
        match = SECTION_HEADING_RE.match(line.strip())
        if match:
            if current_name is not None:
                sections.append((current_name, '\n'.join(trim_block(current_lines))))
            current_name = match.group(1).strip()
            current_lines = []
            continue

        if current_name is not None:
            current_lines.append(line)

    if current_name is not None:
        sections.append((current_name, '\n'.join(trim_block(current_lines))))

    return sections


def parse_skill_pages(skills_markdown):
    skill_pages = []
    current_name = None
    current_attribute = None
    current_lines = []

    for raw_line in skills_markdown.splitlines():
        stripped = raw_line.strip()
        heading_match = SKILL_HEADING_RE.match(stripped)

        if heading_match:
            if current_name is not None:
                body = '\n'.join(trim_block(current_lines))
                skill_pages.append((current_name, current_attribute, body))
            current_name = heading_match.group(1).strip()
            current_attribute = heading_match.group(2).strip()
            current_lines = []
            continue

        if HORIZONTAL_RULE_RE.match(stripped):
            continue

        if current_name is not None:
            current_lines.append(raw_line)

    if current_name is not None:
        body = '\n'.join(trim_block(current_lines))
        skill_pages.append((current_name, current_attribute, body))

    return skill_pages


def build_skills_reference(skills_md_path):
    content = skills_md_path.read_text(encoding='utf-8')
    sections = parse_top_level_sections(content)
    section_map = {name: body for name, body in sections}
    journal_id = generate_stable_id('journal:skills-reference')

    overview_markdown = section_map.get('Skills Overview', '')
    skills_markdown = section_map.get('Skills', '')
    trailing_sections = [(name, body) for name, body in sections if name not in {'Skills Overview', 'Skills'}]

    pages = []
    sort = 0

    if overview_markdown:
                pages.append(build_text_page('Overview', overview_markdown, 'journal:skills-reference:overview', sort))
                sort += 1000

    for skill_name, attribute, body in parse_skill_pages(skills_markdown):
        page_markdown = f'**Governing Attribute:** {attribute}\n\n{body}'.strip()
        pages.append(
            build_text_page(
                skill_name,
                page_markdown,
                f'journal:skills-reference:skill:{slugify(skill_name)}',
                sort,
            )
        )
        sort += 1000

    for section_name, section_body in trailing_sections:
        pages.append(
            build_text_page(
                section_name,
                section_body,
                f'journal:skills-reference:section:{slugify(section_name)}',
                sort,
            )
        )
        sort += 1000

    for page in pages:
        page['_key'] = f"!journal.pages!{journal_id}.{page['_id']}"

    return {
        '_id': journal_id,
        '_key': f"!journal!{journal_id}",
        'name': 'Skills Reference',
        'pages': pages,
        'folder': None,
        'sort': 0,
        'ownership': {
            'default': 0,
        },
        'flags': {},
    }


def main():
    script_dir = Path(__file__).resolve().parent
    pack_dir = script_dir.parent / 'packs' / 'rules'
    source_dir = pack_dir / '_source'
    skills_md_path = script_dir.parent.parent / 'ttrpg' / 'skills.md'

    source_dir.mkdir(parents=True, exist_ok=True)

    for existing_file in source_dir.glob('*.json'):
        existing_file.unlink()

    journal = build_skills_reference(skills_md_path)
    output_path = source_dir / 'skills-reference.json'
    output_path.write_text(f"{json.dumps(journal, indent=2)}\n", encoding='utf-8')

    print(f'Generated rules reference source: {output_path}')
    success = build_pack_from_source(pack_dir, 'rules', document_type='JournalEntry')
    return 0 if success else 1


if __name__ == '__main__':
    raise SystemExit(main())