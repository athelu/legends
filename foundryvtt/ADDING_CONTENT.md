# Adding Backgrounds, Ancestries, and Feats to D8 TTRPG

This guide explains how to add backgrounds, ancestries, and feats to your D8 TTRPG system using Foundry VTT's built-in compendium tools.

## Compendium Packs Available

The system includes three empty compendium packs ready for content:

1. **Backgrounds** - Character backgrounds (Soldier, Scholar, Criminal, etc.)
2. **Ancestries** - Character races/ancestries (Human, Elf, Dwarf, etc.)
3. **Feats** - Character feats and abilities

## Method 1: Using Foundry's Compendium Editor (Recommended)

### Step 1: Create Items in Your World

1. **Open Foundry VTT** and load your world using the D8 TTRPG system
2. Go to the **Items Directory** (folder icon in the sidebar)
3. Click **Create Item**
4. Choose the type:
   - **Background** for character backgrounds
   - **Ancestry** for races
   - **Feat** for character abilities
5. Fill in the item details:
   - **Name**: The background/ancestry/feat name
   - **Description**: Rich text description
   - **System-specific fields**: Any relevant game mechanics

### Step 2: Add Items to Compendium

1. In the **Items Directory**, find the item you just created
2. **Right-click** on the item
3. Select **Import to Compendium**
4. Choose the appropriate compendium:
   - `D8 TTRPG.Backgrounds`
   - `D8 TTRPG.Ancestries`
   - `D8 TTRPG.Feats`
5. Click **Import**

The item is now in the compendium and will be available to all worlds using this system!

### Step 3: Repeat for All Content

Create and import all your backgrounds, ancestries, and feats following the same process.

## Method 2: Importing from JSON (Advanced)

If you have background data in JSON format, you can create `.db` files in the pack directories:

### Background Example JSON Structure

```json
{
  "name": "Soldier",
  "type": "background",
  "img": "icons/svg/sword.svg",
  "system": {
    "description": {
      "value": "<p>You have served in a military organization, learning discipline and combat tactics.</p>"
    }
  }
}
```

### Creating Compendium Data Files

1. Create JSON files in the appropriate pack directory
2. Use Foundry's compendium migration tools to convert to `.db` format
3. Or use community tools like `fvtt-cli` for bulk imports

## Method 3: Using the Compendium Sidebar

1. Open the **Compendium Packs** tab (books icon in sidebar)
2. Find the pack you want to edit (e.g., "Backgrounds")
3. Click on it to open
4. Click **Create Entry** button
5. Fill in the form directly in the compendium

## Example Backgrounds to Add

Here are some common D&D/TTRPG backgrounds you might want to add:

- Acolyte
- Criminal
- Folk Hero
- Noble
- Sage
- Sailor
- Soldier
- Urchin
- Entertainer
- Guild Artisan
- Hermit
- Outlander

## Tips

- **Use Icons**: Assign appropriate icons to each item for easy identification
- **Rich Descriptions**: Use the rich text editor to format descriptions nicely
- **Organize**: You can create folders within compendiums in Foundry v12+
- **Backup**: Export your compendiums regularly as backup

## Making Compendiums Visible to Players

1. Right-click on the compendium in the sidebar
2. Select **Configure Ownership**
3. Set appropriate permissions for players
4. Players can now browse and drag items from the compendium to their character sheets

## Distributing Your Content

Once you've populated the compendiums:
1. The `.db` files in `/packs/` contain all your data
2. These files are included when you share your system
3. Anyone installing your system will have access to all the backgrounds, ancestries, and feats you've created

---

**Need more help?** Check the Foundry VTT documentation on Compendium Packs:
https://foundryvtt.com/article/compendium/
