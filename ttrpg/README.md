# Legends TTRPG System - Core Rules v0.4.3

## Core Concept

A classless tabletop roleplaying game built entirely around the number eight, using d8 dice and a **roll-under** system with success counting.

## Design Notes

### Core Design Principles

- Everything based on the number 8
- Roll-under system rewards investment while maintaining challenge at all tiers
- Success counting creates gradients
- Resource management (Luck, Energy) creates tactical decisions
- **True classless system:** Any character can learn any ability if they meet prerequisites
- Characters are specialists, not jack-of-all-trades. 

### Key Features

- No Levels: Power tiers, similar to how many game systems manage threats instead of character levels
- Static HP: Combat remains dangerous at all Tiers (levels)
- XP Spending: XP Gained is directly spent into improving your character
- Luck depletion: use luck to adjust dice rolls
- Elemental Energy Magic System: ad-hoc spell creation (templates provided for common spells)
- Opposed combat: Attacks are opposed rolls, negating or reducing the damage.
- Armor matters: DR instead of AC. Armor protects you from damage, not from being hit.


### Character Building Philosophy

**Feats** provide:
- Combat techniques and abilities
- Skill expertise and specializations
- Magical enhancements

### Flaws and Traits

- Access to some powerful abilities and character options (traits) require taking flaws
- Flaws and traits may only be taken during character creation
- Taking a flaw provides points to purchase traits
- You cannot spend more points on traits than you have gained from flaws

#### Flaws

- Flaws represent Physical and Societal penalties the character has/must endure
- Flaws range in value from 1 - 10
- Some Flaws require DM Approval

#### Traits

- Traits represent magical abilities, unique resource systems, and supernatural characteristics
- Traits range in value from 1 - 10
- Some Traits require DM Approval

### Experience System

- **24 XP per session** (awarded equally to all players)
- Spend XP on:
  - Untrained Skills: Rank 0 -> 1 costs 4 xp
  - Skills: 8 × current rank
  - Attributes: 16 × current rank
  - Potentials (if magical): 16 × current rank
  - Feats: 40 XP each

## Sections

The rules are broken down into different sections for easier management:

```
legends/ttrpg/
├── actions.md
├── ancestry.md
├── armor.md
├── ashan.md
├── backgrounds.md
├── bestiary.md
├── bestiary_framework.md
├── character_creation.md
├── combat.md
├── conditions.md
├── core_system.md
├── daemon.md
├── equipment.md
├── faith.md
├── feats.md
├── flaws.md
├── history.md
├── magic_system.md
├── magic.md
├── number8.md
├── README.md
├── skills.md
├── traits.md
├── weapons.md
├── weaves(a-g).md
├── weaves(h-m).md
├── weaves(n-r).md
└── weaves(s-z).md
```

## Bonuses and Penalties
Guidelines for applying bonus/penatlies
| Modifier | Effect on Success | Use For |
|----------|-------------------|---------|
| Add 1 to one die | ~9% penalty | Minor/specific penalty |
| Add 1 to both dice | ~15% penalty | Moderate penalty |
| Misfortune (3d8 worst 2) | ~25% penalty | Major penalty |
| Subtract 1 from one die | ~9% benefit | Minor/specific bonus |
| Subtract 1 from both dice | ~15% benefit | Moderate bonus |
| Fortune (3d8 best 2) | ~25% benefit | Major bonus |

## Tier Progression

| Tier | XP Range | Sessions at 24/session | Max Feats | D&D Equivalent |
|------|----------|------------------------|-----------|----------------|
| 1 | 0–120 | ~5 | 2 start + 2 purchased | Levels 1–2 |
| 2 | 120–360 | ~10 | 2 start + 4 purchased | Levels 3–5 |
| 3 | 360–600 | ~10 | 2 start + 6 purchased | Levels 6–8 |
| 4 | 600–840 | ~10 | 2 start + 8 purchased | Levels 9–11 |
| 5 | 840–1080 | ~10 | 2 start + 10 purchased | Levels 12–14 |
| 6 | 1080–1320 | ~10 | 2 start + 12 purchased | Levels 15–17 |
| 7 | 1320–1560 | ~10 | 2 start + 14 purchased | Levels 18–19 |
| 8 | 1560+ | ~10+ | 2 start + 16 purchased | Level 20 |

## Version History

### v0.4.3 - New feats and World content
- Pantheon added to aid in building out divine powers
- World History added
- Daemon: definition for low magic setting
- Number 8: More examples of how the number 8 influences the setting
- Feats: new feats based on core campaign concepts

### v0.4.2 - Equipment and summaries
- Reorganize documents to aid with foundry compendiums
- Equipment: organize and expand
- Actions: clarify interact/activate actions
- Ancestry: created rollable tables for random characteristics

### v0.4.1 - Invoker and Infuser
- Invoker replaces bard (homebrew world flavor)
- Infuser = Artificer. Based on original idea for alchemist. may still make alchemist
- Added a character sheet for playtesting
- Python script for combat testing (work in progress)
- Necromantic - banned/forbidden magic type (homebrew world flavor)
- Magic user classification (Arcanist/Diabolist/Divine)
- Created charmed condition
- add gp cost to equipment/gear

### v0.4.0 - Roll Under Conversion
- System moved from roll under-and-equal to Roll under.
- Natural 1 always succeed. allows for skill/attribute/master 1 to have success in roll under.
- Create DR and Save mechanics for Magic
- Adjusted bestiary creation guidelines
- Created new conditions
- Created guidelines for simples combat weaves (and rules for making new ones)

### v0.3.0 - Classless System Refactor
- Removed martial trait gates (Martial Prowess, Roguish Training, Ranger's Path, Monastic Training)
- Converted all martial abilities to feats with prerequisite requirements
- Increased XP per session from 20 to 24 for better divisibility
- Adjusted tier XP thresholds to accommodate new feat economy
- Granted 2 free starting feats (up from 1)
- Clarified trait philosophy: magical/resource systems only
- Enabled true multiclass flexibility through feat combinations

### v0.2.1 - Previous Version
- Original trait-gated class system
- 20 XP per session
- 1 free starting feat