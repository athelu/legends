# D8 TTRPG System for Foundry VTT

A Foundry VTT implementation of the D8 TTRPG - a classless tabletop roleplaying game built entirely around the number eight, using d8 dice and a roll-under system with success counting.

## Features

### Core Mechanics
- **Roll-Under 2d8 System**: Roll attribute + skill, count successes for results under target values
- **Success Counting**: 0-4 successes determine outcome quality
- **Fortune & Misfortune**: Roll 3d8 and take best/worst 2 for advantage/disadvantage
- **Critical Success (Double 1s)**: Extra success + restore all Luck
- **Critical Failure (Double 8s)**: Automatic failure

### Character Management
- **Eight Attributes**: Strength, Constitution, Agility, Dexterity, Intelligence, Wisdom, Charisma, Luck
- **24 Skills**: Organized by governing attribute
- **Luck System**: Depleting resource used for saves and modifications
- **HP & Energy Pools**: Automatically calculated from attributes
- **Tier Progression**: 8 tiers of advancement with XP tracking

### Magic System
- **Eight Energies**: Earth, Air, Fire, Water, Positive, Negative, Time, Space
- **Potentials & Mastery**: Roll-under weaving with success counting
- **Simple & Complex Weaves**: 1-action vs 2-action spells
- **Overspending Penalties**: Cast beyond mastery with penalties
- **Energy Pool Management**: Automatic energy deduction and tracking

### Combat Features
- **Integrated Initiative**: Roll with Agility + Luck + Skill + 1d8
- **Damage Resistance (DR)**: Physical protection from armor
- **Saving Throws**: Fortitude, Reflex, and Will saves
- **Weapons & Armor**: Full equipment management
- **Short & Long Rests**: Automated HP and resource recovery

### Item Types
- **Weapons**: Melee and ranged with damage tracking
- **Armor**: DR value and equip management
- **Weaves (Spells)**: Full magic system integration
- **Feats**: Character abilities and features
- **Traits & Flaws**: Character creation options
- **Equipment**: General gear and supplies

## Installation

### Method 1: Manifest URL (Recommended when published)
1. In Foundry VTT, go to "Game Systems"
2. Click "Install System"
3. Paste the manifest URL: `[URL will be added when published]`
4. Click "Install"

### Method 2: Manual Installation
1. Download the latest release
2. Extract to `[Foundry Data]/Data/systems/d8-ttrpg`
3. Restart Foundry VTT
4. Create a new world using the "D8 TTRPG System"

## Quick Start Guide

### Creating a Character

1. **Create Actor**: Right-click in Actors directory → Create Actor → Type: Character
2. **Set Attributes**: Use standard array (5,4,3,3,3,2,2,2) or roll 8d8
3. **Assign Skills**: Rank 0 = untrained, increase with XP
4. **Add Features**: 
   - Drag Feats (2 free at start)
   - Add Traits (if magical)
   - Add Flaws (for trait points)
5. **Equipment**: Add weapons, armor, and gear
6. **Magic Users**: Set Potentials and Mastery values for each energy type

### Rolling Checks

- **Skill Checks**: Click the dice icon next to any skill
- **Saving Throws**: Click Fortitude/Reflex/Will buttons
- **Attribute Rolls**: Click dice icon next to attributes
- **Attacks**: Click weapon names in Combat tab
- **Weaves**: Click weave names in Magic tab

### Managing Resources

- **Luck**: 
  - Automatically used in saving throws
  - Click "Spend Luck" to manually reduce
  - Restores on rests and critical successes
  
- **HP**:
  - Edit directly in header
  - Short Rest: +Constitution HP
  - Long Rest: +(Constitution × 4) HP
  
- **Energy** (magic users):
  - Automatically deducted when casting weaves
  - Full restore on long rest

### Creating Weaves (Spells)

1. Create new Item → Type: Weave
2. Set **Weave Type**: Simple (1 action) or Complex (2 actions)
3. Set **Primary Energy**: Choose energy type and cost
4. Set **Supporting Energy**: Optional, for range/area/duration
5. Set **Effect Type**: Damage, healing, buff, etc.
6. Configure details: Range, targets, duration, save type
7. Add to character sheet

## Game Mechanics Reference

### Success Thresholds
- **0 Successes**: Failure
- **1 Success**: Partial success or reduced effect
- **2 Successes**: Full success
- **3 Successes**: Enhanced success
- **4 Successes**: Maximum success

### Fortune & Misfortune Sources
- **Fortune**: Beneficial positioning, helpful conditions, advantage
- **Misfortune**: Poor positioning, hindering conditions, disadvantage
- Multiple sources cancel 1-to-1

### Tier Progression
| Tier | XP Range | Max Feats | D&D Equivalent |
|------|----------|-----------|----------------|
| 1 | 0-120 | 4 | Levels 1-2 |
| 2 | 120-360 | 6 | Levels 3-5 |
| 3 | 360-600 | 8 | Levels 6-8 |
| 4 | 600-840 | 10 | Levels 9-11 |
| 5 | 840-1080 | 12 | Levels 12-14 |
| 6 | 1080-1320 | 14 | Levels 15-17 |
| 7 | 1320-1560 | 16 | Levels 18-19 |
| 8 | 1560+ | 18 | Level 20 |

### XP Costs
- **Skills**: 4 XP (untrained → rank 1), then 8 × current rank
- **Attributes**: 16 × current rank
- **Potentials**: 16 × current rank (magical characters)
- **Feats**: 40 XP each

## Customization

### Modifying the System
The system is built with modularity in mind:
- `module/dice.mjs`: Core rolling mechanics
- `module/documents/actor.mjs`: Actor calculations
- `module/documents/item.mjs`: Item behaviors
- `module/sheets/`: Sheet templates and logic
- `styles/d8-ttrpg.css`: Visual styling

### Adding Content

The system includes three compendium packs ready for your content:
- **Backgrounds** - Character backgrounds (Soldier, Scholar, Criminal, etc.)
- **Ancestries** - Character races/ancestries
- **Feats** - Character feats and abilities

See `ADDING_CONTENT.md` for detailed instructions on populating these compendiums.
Example backgrounds are provided in `example-backgrounds.json` as templates.

You can also:
- Create compendiums for weaves and equipment
- Import from JSON or create in-world
- Share via module system

## Roadmap

### Planned Features
- [ ] Combat tracker integration with initiative automation
- [ ] Condition tracking and automation
- [ ] Bestiary compendiums
- [ ] Feats compendium
- [ ] Weaves compendium
- [ ] Active effects for buffs/debuffs
- [ ] Automated damage calculation
- [ ] Token action HUD integration
- [ ] Character import/export

## Support & Contributing

### Issues
Report bugs and request features on [GitHub Issues](https://github.com/athelu/legends/issues)

### Contributing
Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

### Community
- **Discord**: [Link TBD]
- **Documentation**: [GitHub Wiki](https://github.com/athelu/legends/wiki)

## Credits

**System Design**: Sean (athelu)
**Foundry Implementation**: Sean (athelu)
**Based on**: D8 TTRPG Core Rules v0.4.1

## License

This work is licensed under the MIT License. See [LICENSE.txt](LICENSE.txt) for details.

The D8 TTRPG game system and rules are the intellectual property of Sean (athelu).

## Version History

### v0.1.0 (Current)
- Initial Foundry VTT implementation
- Core 2d8 roll-under mechanics
- Character sheet with all attributes and skills
- Magic system with Potentials and Mastery
- Weave creation and casting
- Basic item types (weapons, armor, equipment, feats, traits, flaws)
- Short and long rest automation
- Luck management
- Energy pool calculation and management
- Saving throws (Fortitude, Reflex, Will)
- Fortune & Misfortune support
- Critical success/failure handling
