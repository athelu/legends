#!/usr/bin/env python3
"""Export the canonical weave Markdown files (ttrpg/2x-weaves*.md) to CSV.

Produces one CSV per source file next to the Markdown source, plus a combined
`ttrpg/weaves.csv` containing every weave with a `Source File` column.

Usage:
    python export_weaves_csv.py
"""

import csv
import re
from pathlib import Path

TTRPG_DIR = Path(__file__).resolve().parent.parent

WEAVE_FILES = [
    '21-weaves(a-g).md',
    '22-weaves(h-m).md',
    '23-weaves(n-r).md',
    '24-weaves(s-z).md',
]

# Preferred column order; any extra fields discovered are appended after these.
FIELD_ORDER = [
    'Name',
    'Primary Energy',
    'Supporting Energy',
    'Range',
    'Duration',
    'Total Cost',
    'Action',
    'Weaving Roll',
    'Targeting Roll',
    'Description',
    'Damage Base',
    'Applies Effects',
    'Saving Throw',
    'Damage Type',
    'DR Interaction',
    'Targeting Success Scaling',
]

FIELD_RE = re.compile(r'^\*\*([^:*]+):\*\*\s*(.*)$')


def parse_weaves(md_path: Path) -> list[dict]:
    """Parse a weaves Markdown file into a list of weave dicts."""
    content = md_path.read_text(encoding='utf-8')
    sections = re.split(r'^### ', content, flags=re.MULTILINE)[1:]

    weaves = []
    for section in sections:
        lines = section.split('\n')
        name = lines[0].strip()
        if not name:
            continue

        weave = {'Name': name}
        current_field = None
        for line in lines[1:]:
            match = FIELD_RE.match(line.strip())
            if match:
                current_field = match.group(1).strip()
                weave[current_field] = match.group(2).strip()
            elif current_field and line.strip():
                # Continuation of a multi-line field value
                weave[current_field] += ' ' + line.strip()
            elif not line.strip():
                current_field = None

        weaves.append(weave)

    return weaves


def build_columns(weaves: list[dict]) -> list[str]:
    """Column list: preferred order first, then any extra fields found."""
    extra = sorted({k for w in weaves for k in w} - set(FIELD_ORDER))
    return FIELD_ORDER + extra


def write_csv(csv_path: Path, weaves: list[dict], columns: list[str]) -> None:
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(weaves)


def main() -> None:
    all_weaves = []
    for weave_file in WEAVE_FILES:
        md_path = TTRPG_DIR / weave_file
        if not md_path.exists():
            print(f'  Warning: {weave_file} not found, skipping')
            continue

        weaves = parse_weaves(md_path)
        for w in weaves:
            w['Source File'] = weave_file
        all_weaves.extend(weaves)

        csv_path = md_path.with_suffix('.csv')
        write_csv(csv_path, weaves, build_columns(weaves))
        print(f'  {weave_file} -> {csv_path.name} ({len(weaves)} weaves)')

    if all_weaves:
        combined_path = TTRPG_DIR / 'weaves.csv'
        # 'Source File' is already picked up as an extra field by build_columns
        write_csv(combined_path, all_weaves, build_columns(all_weaves))
        print(f'  Combined -> {combined_path.name} ({len(all_weaves)} weaves)')


if __name__ == '__main__':
    main()
