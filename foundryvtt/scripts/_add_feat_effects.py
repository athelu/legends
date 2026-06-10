#!/usr/bin/env python3
"""
One-off script to inject **Effects:** fields into feats.md for Category 1/2/3/6 feats.
Run once; afterwards feats.md is the source of truth.
Only adds the field if the feat doesn't already have an Effects: field.
"""

import re
from pathlib import Path

FEATS_MD = Path(__file__).parent.parent.parent / 'ttrpg' / 'feats.md'

# Maps feat name → list of effect lines to inject.
# Each string is one effect in the _parse_effects format:
#   type key=value key=value ...
# Multi-line effects use \n separator within the string value.
FEAT_EFFECTS = {
    # ── Category 1+2: Pure passive modifiers ─────────────────────────────
    'Alert': [
        'initiative.modify value=2',
        'condition.immunity conditionName=Surprised',
    ],
    'Feral Instinct': [
        'initiative.modify value=2',
        'condition.immunity conditionName=Surprised',
        'condition.immunity conditionName=Frightened,Charmed when=primalFury',
    ],
    'Acrobatic Defense': [
        'roll.modifier rollType=defense value=-1 applyTo=both when=unarmored',
    ],
    'Expertise': [
        # Expertise applies to a "chosen skill" — stored as target=chosen at data-entry time.
        # GMs customise per-character via the feat JSON. We emit a placeholder.
        'roll.modifier rollType=skill value=-1 applyTo=both target=chosen',
    ],
    'Evasive Fighter': [
        # Opportunity attacks against you add 1 to both attack dice.
        # This is a defensive modifier on attack rolls targeting the actor.
        'roll.modifier rollType=attack value=1 applyTo=both',
    ],
    'Flanking Mastery': [
        'roll.modifier rollType=attack value=-1 applyTo=both when=flanking',
    ],
    'Power Attack': [
        # Declared before rolling: adds 1 to both dice (harder) in exchange for +4 damage.
        # Modelled as an opt-in misfortune on the attack roll.
        'roll.modifier rollType=attack value=1 applyTo=both',
        'damage.bonus target=melee value=4',
    ],
    'Master Archer': [
        'damage.bonus target=ranged value=2',
    ],
    'Sharpshooter': [
        # Declared before rolling: +1 to both attack dice, +4 damage on hit.
        'roll.modifier rollType=attack value=1 applyTo=both',
        'damage.bonus target=ranged value=4',
    ],
    'Tough': [
        'hp.bonus formula="constitution * tier"',
    ],
    'Fast Healer': [
        'hp.shortRest.bonus formula=constitution',
    ],
    'Iron Fortress': [
        'dr.modify value=2 damageTypes=physical',
    ],
    'Natural Explorer': [
        # Fortune on initiative in chosen terrain (terrain stored in notes by GM).
        'fortune.grant rollType=initiative',
        'roll.modifier rollType=skill skillKey=wilderness value=-1 applyTo=both',
    ],
    'Precision Duelist': [
        'roll.modifier rollType=attack value=-1 applyTo=skill when=duelistStance',
        'damage.bonus target=melee value=2 when=duelistStance',
    ],
    'Victor\'s Discipline': [
        # subtract 1 from both attack dice while below half HP
        'roll.modifier rollType=attack value=-1 applyTo=both when=belowHalfHP',
    ],
    'Unbroken': [
        # subtract 1 from both attack dice below half HP
        'roll.modifier rollType=attack value=-1 applyTo=both when=belowHalfHP',
    ],

    # ── Category 3: Toggle states ─────────────────────────────────────────
    'Primal Fury': [
        'toggle.state stateKey=primalFury label="Primal Fury"',
        # Sub-effects while toggled on go in nested effects on the toggle itself;
        # listed separately here and handled by processToggleSubEffect:
        'damage.bonus target=melee value=2 when=primalFury',
        'dr.modify value=2 damageTypes=physical when=primalFury',
        'roll.modifier rollType=save saveType=fortitude value=-1 applyTo=both when=primalFury',
    ],
    'Reckless Attack': [
        'toggle.state stateKey=recklessAttack label="Reckless Attack"',
        'roll.modifier rollType=attack value=-1 applyTo=both when=recklessAttack',
    ],
    'Defensive Stance': [
        'toggle.state stateKey=defensiveStance label="Defensive Stance"',
    ],
    'Flowing Guard': [
        'toggle.state stateKey=flowingGuard label="Flowing Guard"',
    ],

    # ── Category 6: Condition-sensitive / feat-chained ────────────────────
    'Bloodied Fury': [
        'roll.modifier rollType=attack value=-1 applyTo=both when=primalFury,belowHalfHP',
        'damage.bonus target=melee value=2 when=primalFury,belowHalfHP',
    ],
    'Brutal Critical': [
        # Engine note: double damage on double-1s — not yet automatable in current engine.
        # Registered as a custom effect so it appears in the feat actions list.
        'roll.modifier rollType=attack value=0 applyTo=both when=primalFury',
    ],
    'Primal Multiattack': [
        # Extra attack while Primal Fury is active — registered as a feat action.
        'action.add description="Primal Multiattack: two melee attacks as 1 Combat action" when=primalFury',
    ],
    'Savage Momentum': [
        'roll.modifier rollType=attack value=-1 applyTo=both when=primalFury',
    ],
    'Relentless Fury': [
        'roll.modifier rollType=attack value=1 applyTo=both when=primalFury',
    ],
    'Wrath Incarnate': [
        'toggle.state stateKey=wrathIncarnate label="Wrath Incarnate"',
        'dr.modify value=4 damageTypes=physical when=wrathIncarnate',
        'condition.immunity conditionName=Frightened,Charmed,Stunned when=wrathIncarnate',
    ],
    'Elemental Mantle': [
        'toggle.state stateKey=elementalMantle label="Elemental Mantle"',
    ],
    'Elemental Body': [
        'toggle.state stateKey=elementalBody label="Elemental Body"',
    ],
    'Formation Fighting': [
        # +2 DR when in formation (party coordination — approximated as passive dr.modify;
        # exact trigger is condition-engine territory).
        'dr.modify value=2 damageTypes=physical',
    ],
    'Devastating Charge': [
        'roll.modifier rollType=attack value=-1 applyTo=both',
    ],
    'Mounted Combatant': [
        'roll.modifier rollType=attack value=-1 applyTo=both',
    ],
}


def inject_effects(content: str, feat_name: str, effect_lines: list[str]) -> str:
    """Insert an **Effects:** block after the **Benefit:** line of a feat section."""
    # Find the feat heading (exact, whole-line match)
    heading_pattern = re.compile(
        r'(^#### ' + re.escape(feat_name) + r'\n'   # heading
        r'(?:(?!\n####)[\s\S])*?'                    # everything until next feat
        r'\*\*Benefit:\*\*[^\n]*(?:\n(?!\*\*|\n####)[^\n]*)*)'  # Benefit: + continuation lines
        , re.MULTILINE
    )
    match = heading_pattern.search(content)
    if not match:
        print(f'  WARN: feat "{feat_name}" not found')
        return content

    section = match.group(1)
    # Check if Effects: field already exists in this section
    if re.search(r'^\*\*Effects?\*\*:', section, re.MULTILINE | re.IGNORECASE):
        print(f'  SKIP: "{feat_name}" already has Effects field')
        return content

    # Build the Effects block
    effects_block = '**Effects:**\n' + '\n'.join(effect_lines)

    # Insert after the Benefit block
    insert_pos = match.end(1)
    return content[:insert_pos] + '\n' + effects_block + content[insert_pos:]


def main():
    content = FEATS_MD.read_text(encoding='utf-8')
    original = content

    for feat_name, effects in FEAT_EFFECTS.items():
        print(f'Processing: {feat_name}')
        content = inject_effects(content, feat_name, effects)

    if content != original:
        FEATS_MD.write_text(content, encoding='utf-8')
        added = len([n for n in FEAT_EFFECTS if n in content])
        print(f'\nDone. Updated feats.md ({len(FEAT_EFFECTS)} feats targeted).')
    else:
        print('\nNo changes made.')


if __name__ == '__main__':
    main()
