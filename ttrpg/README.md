# D8 TTRPG System - Core Rules v0.3.0

## Core Concept

A classless tabletop roleplaying game built entirely around the number eight, using d8 dice and a **roll-under** system with success counting.

## Design Notes

### Core Design Principles

- Everything based on the number 8
- Roll-under system rewards investment while maintaining challenge at all tiers
- Success counting creates gradients
- Resource management (Luck, Energy) creates tactical decisions
- **True classless system:** Any character can learn any ability if they meet prerequisites
- Feats replace class features, allowing unlimited customization

### Key Features

- **Classless progression:** No trait gates for martial abilities - feats are available to all who qualify
- Luck depletion: Rising tension throughout sessions
- Overspending penalties: Heroic risk-taking with consequences
- 4-success weaving: Combining energies increases power ceiling
- Opposed combat: Every fight tactical
- Critical restoration: Double 1s create legendary moments
- Channel Divinity: Reliable but indiscriminate area effects
- Static HP: Combat remains dangerous at all Tiers (levels)
- Armor matters: DR system makes protection crucial
- **Flexible character building:** Mix fighter techniques with rogue abilities with monk training

### Character Building Philosophy

**Traits** are reserved for:
- Magical abilities (Energy pools, Mastery skills, weaving systems)
- Unique resource systems (Lay on Hands, Sorcery Points)
- Supernatural characteristics (Immortality, Mythic attributes)

**Feats** provide:
- Combat techniques and abilities
- Class-like features (Rage, Sneak Attack, Flurry of Blows, etc.)
- Skill expertise and specializations
- Magical enhancements

**Results:**
- A "Fighter" takes Martial Training + Action Surge as starting feats
- A "Rogue" takes Sneak Attack + Cunning Action
- A "Fighter/Rogue hybrid" can take Martial Training + Sneak Attack
- Any combination is possible if prerequisites are met

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
- **Note:** Most "class features" are now feats, not traits

### Feats

- Feats provide access to combat abilities, techniques, and class-like features
- Cost: 40 XP per feat
- Starting characters receive 2 free feats
- Can purchase up to 2 additional feats per tier
- No trait prerequisites for martial feats - only attribute/skill requirements

### Experience System

- **24 XP per session** (awarded equally to all players)
- Spend XP on:
  - Skills: 8 × current rank
  - Attributes: 16 × current rank
  - Potentials (if magical): 16 × current rank
  - Feats: 40 XP each

## Sections

The rules are broken down into different sections for easier management:

```
legends/ttrpg/
├── action.md
├── backgrounds.md
├── character-creation.md
├── combat.md
├── conditions.md
├── core-system.md
├── equipment.md
├── feats.md
├── flaws.md
├── magic-system.md
├── README.md
├── traits.md
├── weaves(a-g).md
├── weaves(h-m).md
├── weaves(n-r).md
└── weaves(s-z).md
```

## Bonuses and Penalties

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