#!/usr/bin/env python3
"""
Build conditions compendium pack from parsed conditions.md documentation.
Also extracts cover conditions from combat.md.
"""

import json
import re
from pathlib import Path

from pack_utils import apply_enrichers, build_pack_from_source, ensure_key, generate_stable_id, md_to_html


SECTION_CATEGORY_MAP = {
    'conditions': 'general',
    'cold effects': 'magic',
    'exhaustion effects': 'physical',
    'fear effects': 'fear',
    'fire effects': 'magic',
}

VALID_METADATA_LABELS = {'keyword', 'keywords', 'effect', 'recovery', 'ally assistance'}
LABEL_LINE_RE = re.compile(r'^\s*(?:[-*]\s+)?(?:\*\*)?([A-Za-z][A-Za-z /()\-]*?)(?:\*\*)?:\s*(.*)$')
PROGRESSION_FAMILY_PATTERNS = [
    (re.compile(r'\(Level\s+\d+\s+Cold\)', re.IGNORECASE), 'cold'),
    (re.compile(r'\(Level\s+\d+\s+Fear\)', re.IGNORECASE), 'fear'),
    (re.compile(r'\(Level\s+\d+\s+Fire\)', re.IGNORECASE), 'fire'),
    (re.compile(r'\(Exhaustion\s+Level\s+\d+\)', re.IGNORECASE), 'exhaustion'),
]

SKILL_KEY_ALIASES = {
    'athletics': 'athletics',
    'might': 'might',
    'devices': 'devices',
    'device': 'devices',
    'thievery': 'thievery',
    'writing': 'writing',
    'craft': 'craft',
    'acrobatics': 'acrobatics',
    'stealth': 'stealth',
    'language': 'language',
    'history': 'history',
    'society': 'society',
    'perception': 'perception',
    'medicine': 'medicine',
    'persuasion': 'persuasion',
    'intimidate': 'intimidate',
    'intimidation': 'intimidate',
    'perform': 'perform',
    'performance': 'perform',
    'arcane': 'arcane',
    'arcana': 'arcane',
    'investigate': 'investigate',
    'investigation': 'investigate',
    'empathy': 'empathy',
    'insight': 'empathy',
    'wilderness': 'wilderness',
    'survival': 'wilderness',
    'religion': 'religion',
    'melee': 'meleeCombat',
    'melee combat': 'meleeCombat',
    'ranged': 'rangedCombat',
    'ranged combat': 'rangedCombat',
}

ATTRIBUTE_KEY_ALIASES = {
    'strength': 'strength',
    'constitution': 'constitution',
    'agility': 'agility',
    'dexterity': 'dexterity',
    'intelligence': 'intelligence',
    'wisdom': 'wisdom',
    'charisma': 'charisma',
    'luck': 'luck',
}


def slugify(value):
    """Convert an item name into a filesystem-safe slug."""
    slug = re.sub(r'[^a-z0-9]+', '-', value.strip().lower())
    return slug.strip('-')


def normalize_condition_name(name):
    """Normalize a condition heading while preserving important qualifiers."""
    cleaned = ' '.join(str(name).split())
    cleaned = re.sub(r'\s*\((?:level|exhaustion level)[^)]*\)\s*$', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def clean_metadata_value_line(value):
    """Remove markdown emphasis wrappers that should not leak into structured fields."""
    cleaned = value.strip()
    cleaned = re.sub(r'^\*\*\s*', '', cleaned)
    cleaned = re.sub(r'\s*\*\*$', '', cleaned)
    return cleaned.strip()


def parse_condition_metadata(section_text):
    """Parse labeled metadata blocks from a condition section."""
    entries = []
    current_label = None
    current_lines = []

    for raw_line in section_text.splitlines():
        stripped = raw_line.strip()
        match = LABEL_LINE_RE.match(stripped)

        if match:
            label = match.group(1).strip().lower()
            if label in VALID_METADATA_LABELS:
                if current_label is not None:
                    entries.append((current_label, '\n'.join(current_lines).strip()))
                current_label = label
                initial_value = clean_metadata_value_line(match.group(2))
                current_lines = [initial_value] if initial_value else []
                continue

        if current_label is None:
            continue

        current_lines.append(clean_metadata_value_line(stripped))

    if current_label is not None:
        entries.append((current_label, '\n'.join(current_lines).strip()))

    metadata = {}
    for label, value in entries:
        metadata[label] = value
    return metadata


def extract_keywords(keyword_text):
    """Extract bracketed keywords from a Keyword field."""
    if not keyword_text:
        return []

    keywords = []
    for keyword in re.findall(r'\[([^\]]+)\]', keyword_text):
        clean_keyword = keyword.strip()
        if clean_keyword and clean_keyword not in keywords:
            keywords.append(clean_keyword)
    return keywords


def detect_progression_family(raw_condition_name):
    """Detect a leveled progression family from the raw condition heading."""
    for pattern, family in PROGRESSION_FAMILY_PATTERNS:
        if pattern.search(raw_condition_name or ''):
            return family
    return None


def determine_condition_category(condition_name, section_title, progression_family=None):
    """Map a condition name and source section to the condition category schema."""
    name_lower = condition_name.lower()

    if any(word in name_lower for word in ['hidden', 'concealed', 'revealed', 'invisible']):
        return 'visibility'
    if any(word in name_lower for word in ['blind', 'deaf', 'dazzled']):
        return 'sensory'
    if any(word in name_lower for word in ['dying', 'dead', 'unconscious', 'asleep', 'paralyzed', 'grievously wounded']):
        return 'incapacitation'
    if any(word in name_lower for word in ['prone', 'grappled', 'restrained', 'bound', 'slowed']):
        return 'movement'
    if any(word in name_lower for word in ['charmed', 'dazed', 'disoriented']):
        return 'mental'
    if any(word in name_lower for word in ['bleeding', 'poisoned']):
        return 'damage-over-time'

    if progression_family == 'fear':
        return 'fear'
    if progression_family in {'cold', 'fire'}:
        return 'magic'
    if progression_family == 'exhaustion':
        return 'physical'

    section_key = section_title.strip().lower()
    if section_key in SECTION_CATEGORY_MAP:
        return SECTION_CATEGORY_MAP[section_key]

    return 'general'


def determine_condition_icon(condition_name, keywords, category):
    """Select an icon for the condition from its name and metadata."""
    name_lower = condition_name.lower()
    keyword_set = {keyword.lower() for keyword in keywords}

    if any(word in name_lower for word in ['frighten', 'flee', 'cower']):
        return 'icons/svg/terror.svg'
    if 'blind' in name_lower:
        return 'icons/svg/blind.svg'
    if 'deaf' in name_lower:
        return 'icons/svg/deaf.svg'
    if 'prone' in name_lower:
        return 'icons/svg/falling.svg'
    if 'stun' in name_lower or 'dazed' in name_lower:
        return 'icons/svg/stoned.svg'
    if 'paralyz' in name_lower:
        return 'icons/svg/paralysis.svg'
    if any(word in name_lower for word in ['ignite', 'burn', 'fire', 'smolder', 'singed']):
        return 'icons/svg/fire.svg'
    if any(word in name_lower for word in ['frozen', 'frost', 'chill', 'numb']):
        return 'icons/svg/frozen.svg'
    if 'poison' in name_lower:
        return 'icons/svg/poison.svg'
    if 'bleed' in name_lower:
        return 'icons/svg/blood.svg'
    if any(word in name_lower for word in ['grappl', 'restrain', 'bound']):
        return 'icons/svg/net.svg'
    if any(word in name_lower for word in ['unconscious', 'asleep', 'dying']):
        return 'icons/svg/unconscious.svg'
    if 'dead' in name_lower:
        return 'icons/svg/skull.svg'
    if any(word in name_lower for word in ['exhaust', 'fatigued', 'collapse']):
        return 'icons/svg/sleep.svg'
    if any(word in name_lower for word in ['hidden', 'invisible']) or 'tactical' in keyword_set:
        return 'icons/svg/invisible.svg'
    if 'concealed' in name_lower:
        return 'icons/svg/fog.svg'
    if 'revealed' in name_lower:
        return 'icons/svg/light.svg'
    if 'charm' in name_lower:
        return 'icons/svg/daze.svg'
    if 'sicken' in name_lower:
        return 'icons/svg/acid.svg'
    if 'weak' in name_lower:
        return 'icons/svg/downgrade.svg'
    if category == 'defense':
        return 'icons/svg/shield.svg'

    return 'icons/svg/hazard.svg'


def extract_active_effects(effect_text):
    """Extract simple active-effect metadata from effect prose."""
    if not effect_text:
        return []

    active_effects = []

    match = re.search(r'all rolls?[^\n]*?add\s+(\d+)\s+to\s+(?:both\s+)?die\s+results', effect_text, re.IGNORECASE)
    if match:
        penalty = int(match.group(1))
        active_effects.append({
            'key': 'diceMod.allRolls',
            'mode': 'add',
            'value': penalty,
            'notes': f'Add {penalty} to all die results'
        })

    match = re.search(r'attacks?[^\n]*?add\s+(\d+)\s+to\s+(?:both\s+)?die\s+results', effect_text, re.IGNORECASE)
    if match:
        penalty = int(match.group(1))
        active_effects.append({
            'key': 'diceMod.attack.all',
            'mode': 'add',
            'value': penalty,
            'notes': f'Add {penalty} to attack dice'
        })

    match = re.search(r'initiative[:\s]+[−\-](\d+)', effect_text, re.IGNORECASE)
    if match:
        penalty = int(match.group(1))
        active_effects.append({
            'key': 'initiative.flat',
            'mode': 'add',
            'value': -penalty,
            'notes': f'-{penalty} to initiative'
        })

    for attribute in ['strength', 'constitution', 'agility', 'dexterity', 'intelligence', 'wisdom', 'charisma', 'luck']:
        match = re.search(rf'{attribute}\s+based\s+skill\s+checks?[^\n]*?add\s+(\d+)\s+to\s+(?:ability|attribute)\s+die\s+results', effect_text, re.IGNORECASE)
        if match:
            penalty = int(match.group(1))
            active_effects.append({
                'key': f'diceMod.attribute.{attribute}',
                'mode': 'add',
                'value': penalty,
                'notes': f'Add {penalty} to {attribute} attribute die results'
            })

    for save_type in ['fortitude', 'reflex', 'will']:
        match = re.search(rf'{save_type}\s+saves?[:\s]+add\s+(\d+)\s+to\s+(?:both\s+)?die\s+results', effect_text, re.IGNORECASE)
        if match:
            penalty = int(match.group(1))
            active_effects.append({
                'key': f'diceMod.save.{save_type}',
                'mode': 'add',
                'value': penalty,
                'notes': f'Add {penalty} to {save_type} saves'
            })

    return active_effects


def detect_save_type(text):
    """Detect the save type referenced in a text block."""
    for save_type in ['will', 'fortitude', 'reflex']:
        if re.search(rf'\b{save_type}\s+save\b', text, re.IGNORECASE):
            return save_type
    return None


def normalize_skill_key(skill_name):
    """Normalize prose skill names to system skill keys."""
    normalized = re.sub(r'\s+', ' ', str(skill_name or '').strip().lower())
    return SKILL_KEY_ALIASES.get(normalized, '')


def normalize_attribute_key(attribute_name):
    """Normalize prose attribute names to system attribute keys."""
    normalized = re.sub(r'\s+', ' ', str(attribute_name or '').strip().lower())
    return ATTRIBUTE_KEY_ALIASES.get(normalized, '')


def extract_check_data(text):
    """Extract structured skill/attribute check options from recovery prose."""
    if not text or not re.search(r'\bcheck\b', text, re.IGNORECASE):
        return None

    lowered = text.lower()
    skills = []
    attributes = []
    labels = []

    for match in re.finditer(r'((?:[A-Za-z]+(?:\s*,\s*|\s+or\s+|\s+and\s+|/))*[A-Za-z]+)\s+check\b', text, re.IGNORECASE):
        options_text = match.group(1).strip()
        options_text = re.sub(r'^(?:make\s+|with\s+|by\s+)', '', options_text, flags=re.IGNORECASE)
        options_text = re.sub(r'^(?:an?\s+)', '', options_text, flags=re.IGNORECASE)
        options_text = re.sub(r'^(?:opposed\s+by\s+|opposed\s+)', '', options_text, flags=re.IGNORECASE)
        options_text = re.sub(r'^(?:observers?\s+)', '', options_text, flags=re.IGNORECASE)
        options_text = re.sub(r'\b(?:to|for)\b.*$', '', options_text, flags=re.IGNORECASE).strip(' .:')
        if not options_text:
            continue

        labels.append(options_text)
        candidate_parts = re.split(r',|\bor\b|\band\b|/', options_text, flags=re.IGNORECASE)
        for part in candidate_parts:
            cleaned = re.sub(r'\b(?:an?|the)\b', '', part, flags=re.IGNORECASE)
            cleaned = re.sub(r'\s+', ' ', cleaned).strip(' .:')
            if not cleaned:
                continue
            skill_key = normalize_skill_key(cleaned)
            attribute_key = normalize_attribute_key(cleaned)
            if skill_key and skill_key not in skills:
                skills.append(skill_key)
            elif attribute_key and attribute_key not in attributes:
                attributes.append(attribute_key)

    return {
        'skill': skills[0] if skills else '',
        'attribute': attributes[0] if attributes else '',
        'skills': skills,
        'attributes': attributes,
        'opposed': 'opposed' in lowered,
        'label': ' / '.join(dict.fromkeys(labels)),
    }


def build_damage_tick(condition_name, effect_text, stacking_mode):
    """Parse damage-over-time metadata from effect prose."""
    if not effect_text:
        return None

    match = re.search(
        r'take\s+(\d+d\d+|\d+)\s+(\w+\s+)?damage\s+(?:per\s+stack\s+)?at\s+the\s+(beginning|start|end)\s+of\s+(?:each\s+of\s+)?(?:your|their|the)\s+turn',
        effect_text,
        re.IGNORECASE,
    )
    if not match:
        return None

    formula = match.group(1)
    damage_type = (match.group(2) or '').strip().lower()
    timing = match.group(3).lower()

    damage_tick = {
        'frequency': 'endOfTurn' if timing == 'end' else 'startOfTurn',
        'formula': formula,
        'showInChat': True,
    }

    save_type = detect_save_type(effect_text)
    if save_type:
        damage_tick['save'] = {
            'type': save_type,
            'effectOnSuccess': 'end',
        }

    damage_command = f'[[/damage {formula}'
    if damage_type:
        damage_command += f' type={damage_type}'
    damage_command += ']]'
    stack_text = ' per stack' if stacking_mode == 'stack' else ''
    damage_tick['chatMessage'] = f'Take {damage_command} damage{stack_text} from {condition_name}'

    return damage_tick


def normalize_target_name(target_name):
    """Normalize a downgrade target name extracted from prose."""
    target = target_name.strip().rstrip('.').rstrip(':')
    target = re.sub(r'\s+condition$', '', target, flags=re.IGNORECASE)
    return ' '.join(target.split())


def expand_success_key(success_text):
    """Convert textual success counts into one or more runtime outcome keys."""
    base = success_text.strip()
    if base == '1+':
        return ['1_success', '2_success']
    return [f"{base.replace('+', '')}_success"]


def expand_margin_key(margin_text):
    """Convert textual margin counts into runtime outcome keys."""
    base = margin_text.strip()
    if base.endswith('+'):
        return [f"margin_{base[:-1]}_plus"]
    return [f'margin_{base}']


def extract_downgrades(text):
    """Extract downgrade outcomes from a recovery text block."""
    if not text:
        return {}

    downgrades = {}

    remove_pattern = re.compile(
        r'(\d+\+?)\s+success(?:es)?[:\s]+(?:remove\s+(?:all\s+)?[^\n.]*(?:conditions?|stacks?)|condition\s+ends?(?:\s+completely)?|[^\n.]*\s+ends?(?:\s+completely)?)',
        re.IGNORECASE,
    )
    for match in remove_pattern.finditer(text):
        for key in expand_success_key(match.group(1)):
            downgrades[key] = None

    stack_pattern = re.compile(
        r'(\d+\+?)\s+success(?:es)?[:\s]+remove\s+(\d+)\s+[^\n.]*?stacks?',
        re.IGNORECASE,
    )
    for match in stack_pattern.finditer(text):
        reduction = int(match.group(2))
        for key in expand_success_key(match.group(1)):
            downgrades[key] = f'reduceStacks:{reduction}'

    margin_remove_pattern = re.compile(
        r'margin\s+(\d+\+?)[:\s]+(?:remove\s+(?:all\s+)?[^\n.]*(?:conditions?|stacks?)|condition\s+ends?(?:\s+completely)?|[^\n.]*\s+ends?(?:\s+completely)?)',
        re.IGNORECASE,
    )
    for match in margin_remove_pattern.finditer(text):
        for key in expand_margin_key(match.group(1)):
            downgrades[key] = None

    margin_downgrade_pattern = re.compile(
        r'margin\s+(\d+\+?)[:\s]+(?:downgrade|reduce)(?:\s+condition|\s+effect)?\s+to\s+([^\n.]+)',
        re.IGNORECASE,
    )
    for match in margin_downgrade_pattern.finditer(text):
        target = normalize_target_name(match.group(2))
        for key in expand_margin_key(match.group(1)):
            downgrades[key] = target

    downgrade_pattern = re.compile(
        r'(\d+\+?)\s+success(?:es)?[:\s]+(?:downgrade|reduce)(?:\s+condition)?\s+to\s+([^\n.]+)',
        re.IGNORECASE,
    )
    for match in downgrade_pattern.finditer(text):
        target = normalize_target_name(match.group(2))
        for key in expand_success_key(match.group(1)):
            downgrades[key] = target

    remain_pattern = re.compile(r'0\s+success(?:es)?[:\s]+remains?\s+([^\n.]+)', re.IGNORECASE)
    for match in remain_pattern.finditer(text):
        downgrades['0_success'] = normalize_target_name(match.group(1))

    inline_remove_patterns = [
        re.compile(r'\((\d+\+?)\s+success(?:es)?\)\s+can\s+end\s+early', re.IGNORECASE),
        re.compile(r'\((\d+\+?)\s+success(?:es)?\s+to\s+wake\)', re.IGNORECASE),
        re.compile(r'(\d+\+?)\s+success(?:es)?\s+to\s+wake\b', re.IGNORECASE),
    ]
    for pattern in inline_remove_patterns:
        for match in pattern.finditer(text):
            for key in expand_success_key(match.group(1)):
                downgrades.setdefault(key, None)

    return downgrades


def build_recovery(condition_name, recovery_text, assistance_text):
    """Build structured recovery metadata from recovery prose."""
    combined_text = '\n'.join(part for part in [recovery_text, assistance_text] if part).strip()
    if not combined_text:
        return None

    recovery = {
        'trigger': 'onEvent',
        'method': 'manual',
        'removeOnSuccess': False,
    }

    lower_text = combined_text.lower()
    if 'end of each turn' in lower_text or 'end of your turn' in lower_text or 'end of turn' in lower_text:
        recovery['trigger'] = 'endOfTurn'
    elif 'start of each turn' in lower_text or 'start of your turn' in lower_text or 'beginning of your turn' in lower_text:
        recovery['trigger'] = 'startOfTurn'
    elif 'each round' in lower_text:
        recovery['trigger'] = 'eachRound'

    save_type = detect_save_type(recovery_text)
    recovery_check = extract_check_data(recovery_text)
    assistance_check = extract_check_data(assistance_text)

    if save_type:
        recovery['method'] = 'save'
        recovery['save'] = {'type': save_type}
        recovery['removeOnSuccess'] = True
        recovery['promptPlayer'] = True
        recovery['chatMessage'] = f'Make a [[/save type={save_type}]] to recover from {condition_name}'
    elif recovery_check and (recovery_check['skills'] or recovery_check['attributes']):
        recovery['method'] = 'check'
    elif re.search(r'automatically\s+ends|automatically\s+removed|ends\s+immediately|long\s+rest\s+removes', combined_text, re.IGNORECASE):
        recovery['method'] = 'automatic'

    if recovery_check and (recovery_check['skills'] or recovery_check['attributes'] or recovery_check['opposed'] or recovery_check['label']):
        recovery['check'] = recovery_check

    range_match = re.search(r'ally(?:\s+within)?\s+(\d+)\s+feet', assistance_text or '', re.IGNORECASE)
    if range_match:
        recovery['assistance'] = {'range': int(range_match.group(1))}

    downgrades = extract_downgrades(recovery_text)
    if downgrades:
        recovery['downgrades'] = downgrades
        if any(value is None and not key.startswith('margin_') for key, value in downgrades.items()):
            recovery['removeOnSuccess'] = True

    assistance_downgrades = extract_downgrades(assistance_text)
    if assistance_downgrades:
        if 'assistance' not in recovery:
            recovery['assistance'] = {}
        recovery['assistance']['downgrades'] = assistance_downgrades

    # Visibility conditions use opposed observer checks but the prose omits
    # explicit machine-readable margin outcomes.
    if recovery.get('check', {}).get('opposed') and 'downgrades' not in recovery:
        normalized_name = condition_name.strip().lower()
        if normalized_name == 'hidden':
            recovery['downgrades'] = {'margin_1_plus': None}
        elif normalized_name == 'invisible' and re.search(r'reduc\w+\s+(?:effect\s+)?to\s+concealed', combined_text, re.IGNORECASE):
            recovery['downgrades'] = {'margin_1_plus': 'Concealed'}

    if assistance_check and (assistance_check['skills'] or assistance_check['attributes'] or assistance_check['opposed'] or assistance_check['label']):
        if 'assistance' not in recovery:
            recovery['assistance'] = {}
        recovery['assistance']['check'] = assistance_check

    return recovery


def extract_applied_conditions(effect_text, condition_name):
    """Extract automatically applied conditions referenced in effect prose."""
    if not effect_text:
        return []

    applied_conditions = []
    excluded_words = {
        'condition', 'conditions', 'hp', 'damage', 'turn', 'action', 'round', 'save',
        'check', 'roll', 'success', 'failure', 'attack', 'defense', 'movement',
        'speed', 'distance', 'range', 'target', 'effect', 'duration', 'time',
        'bonus', 'penalty', 'modifier', 'stack', 'level', 'at', 'or', 'and', 'the'
    }

    for pattern in [
        r'([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+condition\s+active',
        r'\b(?:grants?|gains?|also\s+applies?)\b[:\s]+(?:the\s+)?([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+condition',
    ]:
        for match in re.findall(pattern, effect_text, re.IGNORECASE):
            candidate = normalize_target_name(match)
            words = {word.lower() for word in candidate.split()}
            if candidate and candidate.lower() != condition_name.lower() and not (words & excluded_words):
                if candidate not in applied_conditions:
                    applied_conditions.append(candidate)

    return applied_conditions


def determine_stacking_mode(condition_name, section_title, effect_text, progression_family=None):
    """Determine condition stacking behavior."""
    name_lower = condition_name.lower()
    section_lower = section_title.lower()
    effect_lower = effect_text.lower()

    if 'bleeding' in name_lower or 'multiple bleeding effects add together' in effect_lower:
        return 'stack'
    if progression_family == 'exhaustion' or 'exhaustion' in section_lower:
        return 'stack'
    if progression_family == 'fire':
        return 'duration-merge'
    return 'replace'


def determine_severity(condition_name):
    """Derive condition severity from the condition name."""
    name_lower = condition_name.lower()
    if any(word in name_lower for word in ['dead', 'dying', 'unconscious', 'paralyzed', 'burning', 'frozen', 'collapse']):
        return 'severe'
    if any(word in name_lower for word in ['minor', 'singed', 'chilled', 'slowed (minor)', 'dazed']):
        return 'minor'
    return 'moderate'


def create_condition_item(condition_name, condition_text, section_title, progression_chain=None, progression_family=None):
    """Create a condition item from parsed markdown metadata."""
    if not condition_name or not condition_text.strip():
        return None

    condition_name = normalize_condition_name(condition_name)
    metadata = parse_condition_metadata(condition_text)
    keywords = extract_keywords(metadata.get('keyword', '') or metadata.get('keywords', ''))
    effect_text = metadata.get('effect', '')
    recovery_text = metadata.get('recovery', '')
    assistance_text = metadata.get('ally assistance', '')
    category = determine_condition_category(condition_name, section_title, progression_family=progression_family)
    icon = determine_condition_icon(condition_name, keywords, category)
    severity = determine_severity(condition_name)
    overlay_priority = {'minor': 10, 'moderate': 20, 'severe': 30}[severity]
    stacking_mode = determine_stacking_mode(condition_name, section_title, effect_text, progression_family=progression_family)
    damage_tick = build_damage_tick(condition_name, effect_text, stacking_mode)
    recovery = build_recovery(condition_name, recovery_text, assistance_text)
    applied_conditions = extract_applied_conditions(effect_text, condition_name)
    progression_values = progression_chain or []

    item = {
        '_id': generate_stable_id(f'condition:{condition_name}'),
        'name': condition_name,
        'type': 'condition',
        'img': icon,
        'system': {
            'description': {'value': apply_enrichers(md_to_html(condition_text.strip()))},
            'label': condition_name,
            'category': category,
            'keywords': keywords,
            'tokenIcon': icon,
            'activeEffects': extract_active_effects(effect_text),
            'appliesConditions': applied_conditions,
            'progressionChain': progression_values,
            'stacking': stacking_mode,
            'stacks': 1,
            'severity': severity,
            'overlayPriority': overlay_priority,
            'damageTick': damage_tick,
            'recovery': recovery,
        },
        'flags': {},
    }

    return item


def parse_conditions_md(md_file):
    """Parse conditions.md using the current ## section and ### condition structure."""
    content = Path(md_file).read_text(encoding='utf-8')
    lines = content.splitlines()

    current_section = 'Conditions'
    current_name = None
    current_lines = []
    conditions = []
    progression_names = {}

    def flush_current():
        if current_name is None:
            return
        progression_family = detect_progression_family(current_name)
        conditions.append({
            'name': current_name,
            'section': current_section,
            'text': '\n'.join(current_lines).strip(),
            'progressionFamily': progression_family,
        })
        if progression_family:
            progression_names.setdefault(progression_family, []).append(normalize_condition_name(current_name))

    for line in lines:
        section_match = re.match(r'^##\s+(.+)$', line)
        if section_match:
            flush_current()
            current_name = None
            current_lines = []
            current_section = section_match.group(1).strip()
            continue

        condition_match = re.match(r'^###\s+(.+)$', line)
        if condition_match:
            flush_current()
            current_lines = []
            heading = condition_match.group(1).strip()
            if heading.lower() == 'condition keywords':
                current_name = None
                continue
            current_name = heading
            continue

        if current_name is not None:
            current_lines.append(line)

    flush_current()

    items = []
    for condition in conditions:
        progression_family = condition.get('progressionFamily')
        progression_chain = progression_names.get(progression_family, []) if progression_family else []

        item = create_condition_item(
            condition['name'],
            condition['text'],
            condition['section'],
            progression_chain=progression_chain,
            progression_family=progression_family,
        )
        if item:
            items.append(item)

    return items


def create_cover_condition(name, description, dr_bonus=0, reflex_bonus=0):
    """Create a cover-related condition item."""
    item = {
        '_id': generate_stable_id(f'condition:{name}'),
        'name': name,
        'type': 'condition',
        'img': 'icons/svg/shield.svg',
        'system': {
            'description': {'value': apply_enrichers(description)},
            'label': name,
            'category': 'defense',
            'keywords': ['Tactical'],
            'tokenIcon': 'icons/svg/shield.svg',
            'activeEffects': [],
            'appliesConditions': [],
            'progressionChain': [],
            'stacking': 'highest',
            'stacks': 1,
            'severity': 'minor',
            'overlayPriority': 15,
            'damageTick': None,
            'recovery': None,
        },
        'flags': {},
    }

    if dr_bonus > 0:
        item['system']['activeEffects'].append({
            'key': 'defense.cover.dr',
            'mode': 'add',
            'value': dr_bonus,
            'notes': f'+{dr_bonus} DR vs melee attacks',
        })

    if reflex_bonus != 0:
        item['system']['activeEffects'].append({
            'key': 'defense.cover.reflex',
            'mode': 'add',
            'value': reflex_bonus,
            'notes': f'{reflex_bonus:+d} to Reflex save to dodge ranged attacks',
        })

    return item


def parse_cover_conditions(combat_md_file):
    """Parse combat.md to extract cover condition information."""
    content = Path(combat_md_file).read_text(encoding='utf-8')
    cover_section_match = re.search(r'^## Cover\s*\n(.*?)(?=^##|\Z)', content, flags=re.MULTILINE | re.DOTALL)
    if not cover_section_match:
        return []

    return [
        create_cover_condition(
            'Covered',
            '<p>The creature benefits from cover: improved defenses against attacks based on degree of cover. See Cover rules in Combat chapter for details.</p>',
        ),
        create_cover_condition(
            'Partial Cover',
            '<p>Low wall, furniture, creature, tree trunk (1/4 to 1/2 body covered). Against Melee: +1 DR. Against Ranged: Make [[/save type=reflex]]{Reflex save} to duck behind cover (1+ successes = miss).</p>',
            dr_bonus=1,
        ),
        create_cover_condition(
            'Half Cover',
            '<p>Portcullis, arrow slit, thick tree trunk (1/2 to 3/4 body covered). Against Melee: +2 DR. Against Ranged: Make [[/save type=reflex]]{Reflex save} (subtract 1 from both dice) to duck behind cover (1+ successes = miss).</p>',
            dr_bonus=2,
            reflex_bonus=-1,
        ),
        create_cover_condition(
            'Three-Quarters Cover',
            '<p>Murder hole, small window, only small part visible (3/4+ body covered). Against Melee: +3 DR. Against Ranged: Make [[/save type=reflex]]{Reflex save} (subtract 1 from both dice) to duck behind cover (1+ successes = miss).</p>',
            dr_bonus=3,
            reflex_bonus=-1,
        ),
        create_cover_condition(
            'Full Cover',
            '<p>Completely behind solid obstacle. Cannot be directly targeted by attacks or most weaves.</p>',
        ),
    ]


def validate_condition_downgrades(items):
    """Validate that all downgrade targets exist in the conditions list."""
    condition_names = {item['name'] for item in items}
    warnings = []

    for item in items:
        recovery = item.get('system', {}).get('recovery') or {}
        downgrades = recovery.get('downgrades', {})
        for success_key, target_name in downgrades.items():
            if target_name is None:
                continue
            if isinstance(target_name, str) and target_name.startswith('reduceStacks:'):
                continue
            if target_name not in condition_names:
                warnings.append(
                    f"Warning: Condition '{item['name']}' downgrades to '{target_name}' "
                    f"(on {success_key}), but '{target_name}' condition not found in pack."
                )

    if warnings:
        print('\n=== Downgrade Validation Warnings ===')
        for warning in warnings:
            print(f'  {warning}')
        print('=' * 50)

    return len(warnings) == 0


def main():
    script_dir = Path(__file__).parent.parent.parent
    items = []

    md_file = script_dir / 'ttrpg' / 'conditions.md'
    if md_file.exists():
        print('Parsing conditions.md...')
        condition_items = parse_conditions_md(md_file)
        print(f'  Extracted {len(condition_items)} condition items from conditions.md')
        items.extend(condition_items)
    else:
        print(f'  Warning: {md_file} not found')

    combat_md_file = script_dir / 'ttrpg' / 'combat.md'
    if combat_md_file.exists():
        print('Parsing cover conditions from combat.md...')
        cover_items = parse_cover_conditions(combat_md_file)
        print(f'  Extracted {len(cover_items)} cover condition items from combat.md')
        items.extend(cover_items)
    else:
        print(f'  Warning: {combat_md_file} not found')

    if not items:
        print('  No items extracted')
        return 1

    print('\nValidating condition downgrades...')
    validate_condition_downgrades(items)

    source_dir = script_dir / 'foundryvtt' / 'packs' / 'conditions' / '_source'
    source_dir.mkdir(parents=True, exist_ok=True)

    print('  Cleaning old JSON files...')
    for old_file in source_dir.glob('*.json'):
        old_file.unlink()
    print('  Removed old files')

    for item in items:
        json_file = source_dir / f"{slugify(item['name'])}.json"
        with open(json_file, 'w', encoding='utf-8') as handle:
            ensure_key(item)
            json.dump(item, handle, indent=2, ensure_ascii=False)
        print(f'  Saved {json_file.name}')

    print('\nBuilding conditions pack...')
    pack_dir = script_dir / 'foundryvtt' / 'packs' / 'conditions'
    success = build_pack_from_source(pack_dir, 'conditions')

    return 0 if success else 1


if __name__ == '__main__':
    import sys

    sys.exit(main())
