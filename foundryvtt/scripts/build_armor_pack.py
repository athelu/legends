#!/usr/bin/env python3
"""
Build armor compendium pack from parsed armor.md documentation.
"""

import json
import re
from pathlib import Path
from pack_utils import build_pack_from_source, generate_id, validate_items, write_db_file, ensure_key, md_to_html, apply_enrichers


def parse_armor_md(md_file):
    """
    Parse armor.md and extract armor and shield items.
    
    This is a custom parser that understands the armor documentation format.
    Automatically detects shields by name and creates them as shield items.
    """
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"<!--\s*PACK:armor\s*-->", content, flags=re.IGNORECASE)
    if m:
        content = content[m.end():]
    
    items = []

    def parse_money_to_gp(raw: str):
        """Convert a money string like '10 gp', '5 sp', '20 cp' to gp (float).
        Returns None if not parseable.
        """
        if not raw:
            return None
        s = raw.lower()
        gp = 0.0
        m = re.search(r"(\d+(?:\.\d+)?)\s*gp", s)
        if m:
            try:
                gp += float(m.group(1))
            except Exception:
                pass
        m = re.search(r"(\d+(?:\.\d+)?)\s*sp", s)
        if m:
            try:
                gp += float(m.group(1)) / 10.0
            except Exception:
                pass
        m = re.search(r"(\d+(?:\.\d+)?)\s*cp", s)
        if m:
            try:
                gp += float(m.group(1)) / 100.0
            except Exception:
                pass
        return gp if gp != 0.0 else None

    def parse_weight(raw: str):
        if not raw:
            return None
        m = re.search(r"(\d+(?:\.\d+)?)", raw)
        if m:
            try:
                return float(m.group(1))
            except Exception:
                return None
        return None

    def parse_dr(raw: str):
        """Parse DR expressed as 'Slashing 2, Piercing 1, Bludgeoning 3' or '2/1/3'."""
        if not raw:
            return None
        s = raw.strip()
        # Try slash-separated numeric form
        m = re.search(r"(\d+)\s*/\s*(\d+)\s*/\s*(\d+)", s)
        if m:
            return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
        # Try named form
        slash = re.search(r"[Ss]lashing[:\s]*(\d+)", s)
        pierce = re.search(r"[Pp]iercing[:\s]*(\d+)", s)
        blud = re.search(r"[Bb]ludgeon(?:ing)?[:\s]*(\d+)", s)
        if slash or pierce or blud:
            return (
                int(slash.group(1)) if slash else 0,
                int(pierce.group(1)) if pierce else 0,
                int(blud.group(1)) if blud else 0,
            )
        # Try comma-separated like 'Slashing 2, Piercing 1, Bludgeoning 3'
        parts = re.findall(r"([A-Za-z]+)\s*(\d+)", s)
        if parts:
            vals = {'slashing': 0, 'piercing': 0, 'bludgeoning': 0}
            for k, v in parts:
                k2 = k.lower()
                if 'slash' in k2:
                    vals['slashing'] = int(v)
                elif 'pierc' in k2:
                    vals['piercing'] = int(v)
                elif 'blud' in k2 or 'bludge' in k2:
                    vals['bludgeoning'] = int(v)
            return (vals['slashing'], vals['piercing'], vals['bludgeoning'])
        return None
    
    # Split by armor/shield sections (### or #### Heading)
    # Use a capturing group to preserve the heading level
    sections = re.split(r'^(###(?:#)?)\s+', content, flags=re.MULTILINE)[1:]
    
    # Process sections in pairs (heading_marker, content)
    for i in range(0, len(sections), 2):
        if i + 1 >= len(sections):
            break
        
        heading_marker = sections[i]
        armor_section = sections[i + 1]
        lines = armor_section.split('\n')
        item_name = lines[0].strip()
        
        # Skip empty sections
        if not item_name:
            continue
        
        # Detect if this is a shield
        is_shield = 'shield' in item_name.lower()
        
        if is_shield:
            # Create shield item
            item = {
                '_id': generate_id(),
                'name': item_name,
                'type': 'shield',
                'img': 'icons/equipment/shield/heater-marked-red.webp',
                'system': {
                    # Foundry expects description.value
                    'description': {'value': ''},
                    'shieldType': '',
                    'handUsage': '',
                    'meleeDefense': '',
                    'requirements': '',
                    'specialAbilities': '',
                    'plantedMode': False,
                    'reactions': [],
                    'weight': 0,
                    'cost': 0,
                    'quantity': 1,
                    'notes': ''
                },
                'effects': []
            }
        else:
            # Create armor item
            item = {
                '_id': generate_id(),
                'name': item_name,
                'type': 'armor',
                'img': 'icons/equipment/chest/plate-armor-gray.webp',
                'system': {
                    'description': {'value': ''},
                    'armorType': '',
                    'dr': {
                        'slashing': 0,
                        'piercing': 0,
                        'bludgeoning': 0
                    },
                    'stealthPenalty': 'none',
                    'swimPenalty': '',
                    'donTime': '',
                    'doffTime': '',
                    'weight': 0,
                    'cost': 0,
                    'quantity': 1,
                    'notes': ''
                },
                'effects': []
            }
        
        # Parse the section
        section_text = '\n'.join(lines[1:])
        
        # Extract image path (support inline code and plain text, with or without bold markers)
        img_match = re.search(r'\*?\*?Image\*?\*?[:\s]+`?([^`\n|]+)`?', section_text)
        if img_match:
            img_val = img_match.group(1).strip().strip('`')
            if img_val and not img_val.startswith('**'):
                item['img'] = img_val

        # Collect bold metadata (e.g. '- **Cost:** 10 gp', '- **DR:** Slashing 2, Piercing 1, Bludgeoning 3')
        meta_pairs = re.findall(r'-\s*\*\*([^*]+)\*\*[:\s]+([^\n]+)', section_text)
        meta = {k.strip().rstrip(':').lower(): v.strip() for k, v in meta_pairs}

        # Use image from metadata if not already set
        if 'image' in meta:
            img_val = meta['image'].strip().strip('`')
            if img_val and 'icons/' in img_val:
                item['img'] = img_val

        # Remove the bold metadata lines (including image) from the description to avoid duplication
        section_text = re.sub(r'-\s*\*\*[^*]+\*\*[:\s]+[^\n]+\n?', '', section_text)

        # Extract cost from metadata if present
        if 'cost' in meta:
            gp = parse_money_to_gp(meta.get('cost'))
            item['system']['cost'] = gp if gp is not None else 0

        # Extract weight from metadata if present
        if 'weight' in meta:
            w = parse_weight(meta.get('weight'))
            item['system']['weight'] = w if w is not None else 0

        # Description: remaining text (including Special) — trim and normalize
        desc = section_text.strip()
        # Normalize bullets and whitespace
        desc = re.sub(r'^[\-\s]+', '', desc)
        desc = re.sub(r'\n\s*\n', '\n\n', desc)
        item['system']['description']['value'] = desc

        # If image wasn't captured cleanly, try to find an icons/ path inside the description
        if item.get('img') in (None, '', '**') or item.get('img', '').strip() == '**':
            icon_in_desc = re.search(r'(icons/[\w\-/\.]+)', item['system']['description']['value'])
            if icon_in_desc:
                item['img'] = icon_in_desc.group(1)
                # remove the icon token and stray backticks/hyphens from description
                item['system']['description']['value'] = re.sub(r'[`\-]*icons/[\w\-/\.]+[`\-]*', '', item['system']['description']['value']).strip()

        # cleanup description leading bullets, bold markers, or stray punctuation
        item['system']['description']['value'] = re.sub(r'^[\-\s\*]+', '', item['system']['description']['value']).strip()
        item['system']['description']['value'] = item['system']['description']['value'].replace('**', '')
        # remove any leftover trailing hyphens or bullets
        item['system']['description']['value'] = re.sub(r'^[\-\s]+|[\-\s]+$', '', item['system']['description']['value'])

        # Populate common fields from parsed metadata where applicable
        if 'requirements' in meta:
            item['system']['requirements'] = meta.get('requirements')
        if 'hand usage' in meta:
            item['system']['handUsage'] = meta.get('hand usage')
        if 'special' in meta:
            # append special into description if not already present
            special = meta.get('special')
            if special and special not in item['system']['description']['value']:
                existing = item['system']['description']['value'].strip()
                sep = '\n' if existing else ''
                item['system']['description']['value'] = existing + sep + special
        # Keywords -> parse bracketed tokens like [LightArmor] and map to fields
        kws = []
        if 'keyword' in meta or 'keywords' in meta:
            kw = meta.get('keyword') or meta.get('keywords')
            kws = re.findall(r'\[([^\]]+)\]', kw)
        # Also look for inline [Keyword] tokens remaining in description
        kws += re.findall(r'\[([^\]]+)\]', item['system']['description']['value'])
        if kws:
            # Normalize keywords
            norm = [k.strip() for k in kws if k.strip()]
            item['system'].setdefault('keywords', [])
            for k in norm:
                if k not in item['system']['keywords']:
                    item['system']['keywords'].append(k)
            # Map common keywords to armor fields
            lk = [k.lower() for k in norm]
            if any('lightarmor' == kk.lower() or 'light' in kk.lower() for kk in lk):
                item['system']['armorType'] = 'light'
            if any('mediumarmor' == kk.lower() or 'medium' in kk.lower() for kk in lk):
                item['system']['armorType'] = 'medium'
            if any('heavyarmor' == kk.lower() or 'heavy' in kk.lower() for kk in lk):
                item['system']['armorType'] = 'heavy'
            if any('noisy' in kk.lower() for kk in lk):
                item['system']['stealthPenalty'] = 'noisy'
            if any('loud' in kk.lower() for kk in lk):
                item['system']['stealthPenalty'] = 'loud'
        
        if is_shield:
            # Extract shield-specific data from parsed metadata
            if 'type' in meta:
                item['system']['shieldType'] = meta['type']
            # Requirements
            if 'requirements' in meta:
                item['system']['requirements'] = meta['requirements']
            # Reactions from metadata (key: 'granted reactions' or 'reactions')
            raw_reactions = meta.get('granted reactions') or meta.get('reactions') or ''
            if raw_reactions:
                raw = raw_reactions
                # If raw looks like JSON array, try to load
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        item['system']['reactions'] = parsed
                except Exception:
                    # otherwise, parse comma/newline-separated names and create action items
                    names = [x.strip() for x in re.split(r'[,:;]+', raw) if x.strip()]
                    item['system']['reactions'] = []
                    # Link to existing action/_source files rather than creating new ones
                    action_src = Path(__file__).parent.parent.parent / 'foundryvtt' / 'packs' / 'action' / '_source'
                    for name in names:
                        clean_name = re.sub(r"[*`\-]+", "", name).strip()
                        if not clean_name:
                            continue
                        slug = re.sub(r"[^a-z0-9]+", "-", clean_name.lower()).strip('-')
                        candidate = action_src / f"{slug}.json"
                        aid = None
                        if candidate.exists():
                            try:
                                with open(candidate, 'r', encoding='utf-8') as fh:
                                    data = json.load(fh)
                                    aid = data.get('_id')
                            except Exception:
                                aid = None
                        # add the link; if no _id found we'll still keep the name so the relation is visible
                        item['system']['reactions'].append({'name': clean_name, '_id': aid})
            # Parse granted abilities from metadata
            bold_pairs = []
            granted_raw = meta.get('granted ability') or meta.get('granted abilities') or ''
            if granted_raw:
                names = [x.strip() for x in re.split(r'[,:;]+', granted_raw) if x.strip()]
                for n in names:
                    bold_pairs.append((n, ''))
            if bold_pairs:
                abilities = []
                ability_src = Path(__file__).parent.parent.parent / 'foundryvtt' / 'packs' / 'abilities' / '_source'
                for name, desc in bold_pairs:
                    name = name.strip()
                    clean_name = re.sub(r"[*`\-]+", "", name).strip()
                    desc = desc.strip()
                    if clean_name.lower() in ('cost', 'weight', 'image', 'type', 'requirements', 'reactions'):
                        continue
                    existing_reaction_names = [r['name'].lower() for r in item['system'].get('reactions', [])]
                    if clean_name.lower() in existing_reaction_names:
                        continue
                    slug = re.sub(r"[^a-z0-9]+", "-", clean_name.lower()).strip('-')
                    candidate = ability_src / f"{slug}.json"
                    aid = None
                    if candidate.exists():
                        try:
                            with open(candidate, 'r', encoding='utf-8') as fh:
                                data = json.load(fh)
                                aid = data.get('_id')
                        except Exception:
                            aid = None
                    abilities.append({'name': clean_name, '_id': aid})
                if abilities:
                    item['system'].setdefault('linkedAbilities', [])
                    item['system']['linkedAbilities'].extend(abilities)
        else:
            # Armor-specific parsing
            # Parse DR from metadata
            if 'dr' in meta:
                dr_tuple = parse_dr(meta['dr'])
                if dr_tuple:
                    item['system']['dr']['slashing'] = dr_tuple[0]
                    item['system']['dr']['piercing'] = dr_tuple[1]
                    item['system']['dr']['bludgeoning'] = dr_tuple[2]
            
            # Also try inline DR parsing in case it wasn't in meta
            if item['system']['dr']['slashing'] == 0:
                m_slash = re.search(r'[Ss]lashing[:\s]*?(\d+)', section_text)
                m_pierce = re.search(r'[Pp]iercing[:\s]*?(\d+)', section_text)
                m_blud = re.search(r'[Bb]ludgeon(?:ing)?[:\s]*?(\d+)', section_text)
                if m_slash:
                    item['system']['dr']['slashing'] = int(m_slash.group(1))
                if m_pierce:
                    item['system']['dr']['piercing'] = int(m_pierce.group(1))
                if m_blud:
                    item['system']['dr']['bludgeoning'] = int(m_blud.group(1))
            
            dr_match = re.search(r'DR[:\s]+(\d+)/(\d+)/(\d+)', section_text)
            if dr_match:
                item['system']['dr']['slashing'] = int(dr_match.group(1))
                item['system']['dr']['piercing'] = int(dr_match.group(2))
                item['system']['dr']['bludgeoning'] = int(dr_match.group(3))
            
            # Determine armor type from name
            name_lower = item_name.lower()
            if 'light' in name_lower:
                item['system']['armorType'] = 'light'
            elif 'medium' in name_lower:
                item['system']['armorType'] = 'medium'
            elif 'heavy' in name_lower:
                item['system']['armorType'] = 'heavy'

        # Convert markdown description to HTML with enrichers
        item['system']['description']['value'] = apply_enrichers(md_to_html(item['system']['description']['value']))

        items.append(item)

    # Also parse level-4 armor type entries (#### Name) used under 'Armor Types'
    existing_names = {it['name'] for it in items}
    parts = re.split(r'^####\s+', content, flags=re.MULTILINE)[1:]
    for part in parts:
        lines = part.strip().splitlines()
        if not lines:
            continue
        name = lines[0].strip()
        if not name or name in existing_names:
            continue
        body = '\n'.join(lines[1:]).strip()

        item = {
            '_id': generate_id(),
            'name': name,
            'type': 'armor',
            'img': 'icons/equipment/chest/plate-armor-gray.webp',
            'system': {
                'description': {'value': ''},
                'armorType': '',
                'dr': {
                    'slashing': 0,
                    'piercing': 0,
                    'bludgeoning': 0
                },
                'stealthPenalty': 'none',
                'swimPenalty': '',
                'donTime': '',
                'doffTime': '',
                'weight': 0,
                'cost': 0,
                'quantity': 1,
                'notes': ''
            },
            'effects': []
        }

        # Extract cost and weight
        cost_match = re.search(r'\*?\*?Cost[:\s]+([^|\n]+)', body)
        if cost_match:
            gp = parse_money_to_gp(cost_match.group(1).strip())
            item['system']['cost'] = gp if gp is not None else 0
        weight_match = re.search(r'\*?\*?Weight[:\s]+([^|\n]+)', body)
        if weight_match:
            w = parse_weight(weight_match.group(1).strip())
            item['system']['weight'] = w if w is not None else 0

        # Extract inline metadata for this armor entry
        meta_pairs = re.findall(r'-\s*\*\*([^*]+)\*\*[:\s]+([^\n]+)', body)
        meta = {k.strip().rstrip(':').lower(): v.strip() for k, v in meta_pairs}

        # Description: take first paragraph and remove metadata lines
        desc = re.sub(r'-\s*\*\*[^*]+\*\*[:\s]+[^\n]+\n?', '', body)
        desc = desc.strip()
        desc = re.sub(r'^[-\s]+', '', desc)
        item['system']['description']['value'] = desc

        # Parse DR expressed as 'Slashing 2, Piercing 1, Bludgeoning 3' or similar
        s = body
        m_slash = re.search(r'[Ss]lashing[:\s]*?(\d+)', s)
        m_pierce = re.search(r'[Pp]iercing[:\s]*?(\d+)', s)
        m_blud = re.search(r'[Bb]ludgeon(?:ing)?[:\s]*?(\d+)', s)
        if m_slash:
            item['system']['dr']['slashing'] = int(m_slash.group(1))
        if m_pierce:
            item['system']['dr']['piercing'] = int(m_pierce.group(1))
        if m_blud:
            item['system']['dr']['bludgeoning'] = int(m_blud.group(1))

        # Determine armor type via name or keyword
        name_lower = name.lower()
        if 'light' in name_lower:
            item['system']['armorType'] = 'light'
        elif 'medium' in name_lower:
            item['system']['armorType'] = 'medium'
        elif 'heavy' in name_lower:
            item['system']['armorType'] = 'heavy'

        # Populate fields from inline meta if present (stealth, keyword, cost already handled above)
        if 'stealth' in meta:
            st = meta.get('stealth').lower()
            if 'no' in st:
                item['system']['stealthPenalty'] = 'none'
            elif 'penalty' in st:
                item['system']['stealthPenalty'] = st
        # Keywords from meta or description bracket tokens
        kws = []
        if 'keyword' in meta or 'keywords' in meta:
            kw = meta.get('keyword') or meta.get('keywords')
            kws = re.findall(r'\[([^\]]+)\]', kw)
        kws += re.findall(r'\[([^\]]+)\]', item['system']['description']['value'])
        if kws:
            item['system'].setdefault('keywords', [])
            for k in kws:
                k2 = k.strip()
                if k2 and k2 not in item['system']['keywords']:
                    item['system']['keywords'].append(k2)
            # Map common keywords to armorType/stealth as above
            lk = [k.lower() for k in item['system']['keywords']]
            if any('lightarmor' == kk or 'light' in kk for kk in lk):
                item['system']['armorType'] = 'light'
            if any('mediumarmor' == kk or 'medium' in kk for kk in lk):
                item['system']['armorType'] = 'medium'
            if any('heavyarmor' == kk or 'heavy' in kk for kk in lk):
                item['system']['armorType'] = 'heavy'

        # Convert markdown description to HTML with enrichers
        item['system']['description']['value'] = apply_enrichers(md_to_html(item['system']['description']['value']))

        items.append(item)

    return items


def main():
    script_dir = Path(__file__).parent.parent.parent
    
    # Try to parse from markdown
    md_file = script_dir / "ttrpg" / "armor.md"
    if md_file.exists():
        print("Parsing armor.md...")
        items = parse_armor_md(md_file)
        print(f"  Extracted {len(items)} armor items from documentation")
        
        # Save to _source/
        source_dir = script_dir / "foundryvtt" / "packs" / "armor" / "_source"
        source_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            # Use a filesystem-safe slug for filenames
            slug = re.sub(r"[^a-z0-9]+", "-", item['name'].lower()).strip('-') or 'item'
            json_file = source_dir / f"{slug}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                ensure_key(item)
                json.dump(item, f, indent=2, ensure_ascii=False)
            print(f"  Saved {json_file.name}")
    
    # Build the pack
    print("\nBuilding armor pack...")
    pack_dir = script_dir / "foundryvtt" / "packs" / "armor"
    success = build_pack_from_source(pack_dir, "armor")
    
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
