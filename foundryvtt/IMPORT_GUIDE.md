# How to Import All 50 Backgrounds - EASY METHOD

## The Problem

- Background item type exists, but the rich text editor may not show up properly
- "Import to Compendium" option doesn't exist in Foundry v13+ (it's been changed)

## The Solution: Use a Macro

This is the **easiest and most reliable method** to import all 50 backgrounds at once.

### Step-by-Step Instructions

1. **Open Foundry VTT** and load your D8 TTRPG world

2. **Create a New Macro**:
   - Click the **Macro Directory** button (dice icon at bottom)
   - Click **Create Macro**
   - Name it: "Import Backgrounds"
   - Type: **Script**

3. **Copy the Macro Code**:
   - Open `import-backgrounds-macro.js`
   - Copy the ENTIRE contents
   - Paste into the macro editor

4. **Execute the Macro**:
   - Click the macro to run it
   - You'll see a notification: "Starting import of 50 backgrounds..."
   - Wait a moment
   - You'll get: "Import complete! 50 imported, 0 skipped"

5. **Verify Import**:
   - Open **Compendium Packs** (books icon in sidebar)
   - Click on **"Backgrounds"**
   - You should see all 50 backgrounds listed!

6. **Use Backgrounds**:
   - Players can now drag backgrounds from the compendium to their character sheets
   - Or browse and read them directly from the compendium

## Alternative: Manual Entry (NOT Recommended)

If you really want to create backgrounds manually:

1. Go to **Compendium Packs** → **Backgrounds**
2. Click **"Create Document"** (the + icon)
3. This creates an item directly in the compendium
4. Fill in the name and description
5. Repeat 50 times (tedious!)

## Why the Macro Method is Better

✅ **Fast**: Imports all 50 in seconds  
✅ **Reliable**: Doesn't depend on UI quirks  
✅ **Accurate**: Uses the exact JSON data  
✅ **Consistent**: Every background has proper formatting  
✅ **Skips Duplicates**: Won't create duplicates if you run it twice  

## Troubleshooting

**"Backgrounds compendium not found"**
- Make sure you restarted Foundry after installing the system
- Check that `system.json` has the packs defined

**"backgrounds.json not found"**
- The file should be in: `Data/systems/d8-ttrpg/packs/backgrounds/_source/backgrounds.json`
- If missing, you may need to reinstall the system

**Macro shows errors**
- Check the Console (F12) for specific errors
- Make sure you copied the ENTIRE macro code
- Try closing and reopening Foundry

## What About Editing?

Once backgrounds are in the compendium:
- Right-click a background → **Edit Document**
- This opens the item sheet where you can edit the description
- The rich text editor should work properly when editing from the compendium

## Next Steps

After importing:
1. **Set Permissions**: Right-click Backgrounds compendium → Configure Ownership → Give players "Observer" or "Limited" access
2. **Test**: Have a player drag a background to their character sheet
3. **Enjoy**: All 50 backgrounds are now available!

---

**Need Help?**  
See `TROUBLESHOOTING.md` for more detailed solutions.
