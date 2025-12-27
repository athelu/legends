# Legends TTRPG - Foundry VTT System

Official Foundry VTT implementation of the Legends TTRPG system.

## Quick Links

- [System README](legends-system/README.md) - Full system documentation
- [Compendium Development](legends-system/COMPENDIUM_DEVELOPMENT.md) - Guide for adding content
- [Importing Backgrounds](legends-system/IMPORT_GUIDE.md) - How to populate compendiums

## Installation

### For Players (Release Version)

1. In Foundry VTT, go to **Game Systems**
2. Click **Install System**
3. Paste the manifest URL: `[URL will be provided when published]`
4. Click Install

### For Developers (From Source)

```bash
# Clone the repository
git clone https://github.com/athelu/legends.git
cd legends

# Copy to Foundry systems folder
cp -r legends-system [FoundryVTT]/Data/systems/legends

# Restart Foundry VTT
```

## Building Releases

```bash
# Build a release tarball
./build.sh

# Output will be in releases/legends-v0.6.0.tar.gz
```

## Repository Structure

```
.
├── build.sh                    # Release build script
├── .gitignore                  # Repository .gitignore
├── README.md                   # This file
└── legends-system/             # The Foundry system
    ├── system.json             # System manifest
    ├── template.json           # Data model definitions
    ├── module/                 # JavaScript modules
    ├── templates/              # Handlebars templates
    ├── styles/                 # CSS styling
    ├── lang/                   # Translations
    ├── packs/                  # Compendium packs
    │   └── legends/            # All Legends content
    │       ├── backgrounds/
    │       ├── ancestries/
    │       ├── traits/
    │       ├── flaws/
    │       ├── feats/
    │       ├── weapons/
    │       ├── armor/
    │       ├── equipment/
    │       └── weaves/
    ├── README.md               # System documentation
    └── COMPENDIUM_DEVELOPMENT.md
```

## Compendium Packs

All game content is organized under the `legends/` folder:

- ✅ **Backgrounds** - 50 character backgrounds
- ⏳ **Ancestries** - Character races/ancestries
- ⏳ **Traits** - Magical and extraordinary abilities
- ⏳ **Flaws** - Character disadvantages
- ⏳ **Feats** - Character abilities and features
- ⏳ **Weapons** - Melee and ranged weapons
- ⏳ **Armor** - All armor types
- ⏳ **Equipment** - General gear and supplies
- ⏳ **Weaves** - Spells and magical effects

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Adding Content

To add backgrounds, ancestries, or feats:

1. Edit the JSON in `d8-system/packs/[type]/_source/`
2. See [COMPENDIUM_DEVELOPMENT.md](d8-system/COMPENDIUM_DEVELOPMENT.md) for details
3. Submit a pull request

## Development Setup

```bash
# Install fvtt-cli (optional, for compendium management)
npm install -g @foundryvtt/fvtt-cli

# Configure Foundry path
fvtt configure set dataPath "/path/to/FoundryVTT/Data"

# Pack compendiums from source
fvtt package workon d8-ttrpg
fvtt package pack backgrounds --in d8-system/packs/backgrounds/_source/backgrounds.json
```

## License

This work is licensed under the MIT License. See [LICENSE.txt](d8-system/LICENSE.txt) for details.

The D8 TTRPG game system and rules are the intellectual property of Sean (athelu).

## Credits

**System Design**: Sean (athelu)  
**Foundry Implementation**: Sean (athelu)  
**Based on**: D8 TTRPG Core Rules v0.4.1

## Support

- **Issues**: [GitHub Issues](https://github.com/athelu/legends/issues)
- **Documentation**: [GitHub Wiki](https://github.com/athelu/legends/wiki)
- **Discord**: [Link TBD]
