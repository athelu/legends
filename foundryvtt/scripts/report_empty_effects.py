#!/usr/bin/env python3
import json
from pathlib import Path

p = Path('packs/feats/_source')
if not p.exists():
    print('Directory not found:', p)
    raise SystemExit(1)

files = sorted(p.glob('*.json'))
empty = []
for f in files:
    try:
        j = json.loads(f.read_text(encoding='utf-8'))
    except Exception as e:
        print('Error reading', f, e)
        continue
    effects = j.get('system', {}).get('effects', None)
    if not effects:
        empty.append(f)

print(len(empty), 'files with empty or missing system.effects')
for f in empty:
    print('-', f)
