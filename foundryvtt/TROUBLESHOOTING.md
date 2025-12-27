# Troubleshooting: Background Items Not Showing

## Problem: "Background" is not in the Item Type dropdown

If you don't see "Background" as an option when creating items, try these solutions:

### Solution 1: Restart Foundry (Most Common Fix)

After installing or updating the D8 TTRPG system:

1. **Completely close Foundry VTT** (not just refresh the browser)
2. **Restart Foundry VTT**
3. **Open your world**
4. Try creating an item again - "Background" should now appear

**Why:** Foundry caches the system's data model. A restart forces it to reload.

### Solution 2: Verify System Installation

Check that the system is properly installed:

1. Go to **Game Systems** in Foundry
2. Find "D8 TTRPG System"
3. Check the version number
4. If it shows errors, try:
   - Uninstalling the system
   - Reinstalling from scratch
   - Restarting Foundry

### Solution 3: Check for Console Errors

1. Press **F12** to open browser developer tools
2. Go to the **Console** tab
3. Look for any red error messages
4. Common errors:
   - `template.json` syntax errors
   - Missing files
   - Module conflicts

### Solution 4: Use the Import Macro Instead

You don't actually need to create backgrounds manually! Use the import macro:

1. Go to **Macro Directory**
2. Click **Create Macro**
3. Set Type to **Script**
4. Copy the contents of `import-backgrounds-macro.js`
5. Paste into the macro
6. Execute it
7. ✅ All 50 backgrounds imported automatically!

## Alternative: Manual Compendium Entry

If item creation still doesn't work, you can add backgrounds directly to the compendium:

1. Go to **Compendium Packs** sidebar
2. Find and open **"Backgrounds"**
3. Click **"Create Entry"** inside the compendium
4. This creates a background item directly in the compendium

## Checking System Configuration

Verify `template.json` has backgrounds defined:

```bash
# In your Foundry data folder
cd Data/systems/d8-ttrpg
cat template.json | grep -A 5 '"background"'
```

Should show:
```json
"background": {
  "templates": ["common"],
  "startingXP": 0,
  "skillBonuses": {},
  "startingEquipment": []
}
```

And in the types array:
```json
"types": ["weapon", "armor", "equipment", "weave", "feat", "trait", "flaw", "background", "ancestry"]
```

## Still Not Working?

### Check Module Conflicts

Some modules can interfere with item creation:

1. **Disable all modules** except D8 TTRPG
2. Restart Foundry
3. Try creating a background
4. If it works, enable modules one at a time to find the conflict

### Verify File Permissions

On Linux/Mac, ensure proper permissions:

```bash
chmod -R 755 Data/systems/d8-ttrpg
```

### Check Foundry Version

The D8 TTRPG system requires **Foundry VTT v13 or higher**:

1. Go to **Configuration** → **About**
2. Check your Foundry version
3. If below v13, update Foundry

## Quick Test

Create this simple test macro to verify the system is loaded:

```javascript
// Test macro
console.log("Available item types:", CONFIG.Item.documentClass.TYPES);

if (CONFIG.Item.documentClass.TYPES.includes("background")) {
  ui.notifications.info("✅ Background type is available!");
} else {
  ui.notifications.error("❌ Background type not found!");
}
```

If this shows "Background type not found", the system didn't load correctly - try reinstalling.

## Working Workaround: Import Macro

The **easiest and most reliable method** is to use the import macro. It bypasses all UI issues and imports backgrounds directly:

1. Open `import-backgrounds-macro.js`
2. Create a macro in Foundry
3. Paste the entire content
4. Execute
5. Done!

This works even if the UI is having issues.

## Getting Help

If none of these solutions work:

1. Check the [GitHub Issues](https://github.com/athelu/legends/issues)
2. Create a new issue with:
   - Your Foundry version
   - Browser console errors (F12 → Console tab)
   - Screenshot of the Item creation dialog
   - List of active modules

## Summary: Recommended Import Method

**Don't manually create backgrounds.** Use the import macro:

✅ **Fastest**: Imports all 50 at once  
✅ **Most Reliable**: Doesn't depend on UI  
✅ **Easiest**: Just paste and click  

See `import-backgrounds-macro.js` for the ready-to-use macro!
