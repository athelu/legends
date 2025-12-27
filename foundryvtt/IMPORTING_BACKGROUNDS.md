# Importing All 50 Backgrounds into Foundry

This guide will help you import all 50 D8 TTRPG backgrounds into your Foundry VTT system.

## Method 1: Import via Foundry UI (Recommended)

### Step 1: Install a JSON Import Module

1. In Foundry, go to **Add-on Modules**
2. Install **"Compendium Folders"** or **"Scene Packer"** (both support JSON import)
3. Alternatively, use the built-in import features in Foundry v13+

### Step 2: Manual Import (No Module Required)

Since the JSON is already formatted, you can import each background manually:

1. Open **Compendium Packs** sidebar
2. Click on **"D8 TTRPG.Backgrounds"** to open it
3. Click **"Create Entry"**
4. For each background from `all-backgrounds.json`:
   - Copy the name, description, and other fields
   - Paste into the form
   - Click Create
5. Repeat for all 50 backgrounds

**Note:** This is time-consuming but works without any modules.

## Method 2: Using fvtt-cli (Advanced - For Developers)

If you're comfortable with command-line tools:

1. Install fvtt-cli: `npm install -g @foundryvtt/fvtt-cli`
2. Configure your Foundry data path
3. Run: `fvtt package workon d8-ttrpg`
4. Import the JSON using fvtt-cli's pack command

## Method 3: Direct Database Import (Most Efficient)

This is the fastest method but requires some technical knowledge:

### Prerequisites
- Access to your Foundry VTT server files
- Basic understanding of file systems

### Steps

1. **Locate Your System Folder**
   - Navigate to: `[Foundry Data]/Data/systems/d8-ttrpg/`

2. **Create Background Items in Your World First**
   - Create 1-2 test backgrounds manually in your world
   - Right-click → "Import to Compendium" → Choose "Backgrounds"
   - This initializes the compendium pack

3. **Use a Compendium Editor Module**
   - Install **"Compendium Folder"** module
   - Or use **"DF Manual Rolls"** which includes import tools
   - These modules can import JSON directly

4. **Alternative: Python Script**
   - A Python script can convert the JSON to Foundry's .db format
   - See `convert_to_db.py` in the scripts folder (if provided)

## Quick Import Script (Foundry Macro)

You can create a macro in Foundry to import all backgrounds:

```javascript
// Create this as a Script Macro in Foundry
const backgrounds = [/* paste the JSON array here */];

const pack = game.packs.get("d8-ttrpg.backgrounds");

for (let bg of backgrounds) {
  await Item.create(bg, {pack: pack.collection});
  console.log(`Created: ${bg.name}`);
}

ui.notifications.info("Imported all backgrounds!");
```

**To use:**
1. Create a new Macro (Script type)
2. Copy the content from `all-backgrounds.json`
3. Paste it where it says `/* paste the JSON array here */`
4. Execute the macro
5. All 50 backgrounds will be imported!

## Verification

After importing, verify:
1. Open the Backgrounds compendium
2. You should see all 50 backgrounds listed alphabetically
3. Click each to verify the description is formatted correctly

## Background List (All 50)

1. Acolyte
2. Archaeologist
3. Artisan
4. Artist
5. Athlete
6. Bandit
7. Barber
8. Barkeep
9. Barrister
10. Bookkeeper
11. Butcher
12. Carpenter
13. Charlatan
14. Cook
15. Courtier
16. Courier
17. Criminal
18. Driver
19. Entertainer
20. Farmer
21. Fisher
22. Gambler
23. Guard
24. Herbalist
25. Hermit
26. Hunter
27. Investigator
28. Laborer
29. Merchant
30. Mercenary
31. Miner
32. Noble
33. Nomad
34. Refugee
35. Sage
36. Sailor
37. Scholar
38. Servant
39. Shepherd
40. Smith
41. Smuggler
42. Soldier
43. Squire
44. Tailor
45. Teacher
46. Urchin
47. Ward
48. Weaver

(Note: Some may use placeholder icons - you can replace these with custom icons later)

## Troubleshooting

**Issue:** Compendium not showing up
- Make sure you've restarted Foundry after installing the system
- Check that system.json includes the packs definition

**Issue:** Import fails
- Ensure you're using Foundry v13 or higher
- Check that the JSON is valid (no syntax errors)
- Try importing one at a time to identify problematic entries

**Issue:** Formatting looks wrong
- HTML in descriptions should render correctly
- If not, you may need to enable rich text editing in the item sheet

## Next Steps

Once imported:
1. Set appropriate permissions for players to view the compendium
2. Players can drag-and-drop backgrounds to their character sheets
3. Consider adding custom icons for each background
4. Share your complete system with your players!
