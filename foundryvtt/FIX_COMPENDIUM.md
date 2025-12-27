# Fix: "Backgrounds Compendium Not Found"

This error means Foundry hasn't initialized the compendium pack yet. Here's how to fix it:

## Step 1: Run the Diagnostic Macro

First, let's see what's happening:

1. Create a new macro (Script type)
2. Copy the contents of `diagnostic-macro.js`
3. Run it
4. Press **F12** to open the console
5. Look at the output - it will tell you what's missing

## Step 2: Most Likely Fix - Initialize the Compendium

The compendium folder exists, but Foundry needs to create the database file. Here's how:

### Method A: Create One Item Manually

1. Go to **Compendium Packs** in the sidebar (books icon)
2. Look for a pack called **"Backgrounds"** or **"D8 TTRPG.Backgrounds"**
3. **Click to open it**
4. Click the **+ icon** at the top ("Create Document")
5. Fill in:
   - **Name**: Test Background
   - **Type**: Should auto-select "background"
6. Click **Create**
7. **Close the compendium**

Now the compendium database is initialized! The import macro should work now.

### Method B: If You Don't See the Compendium at All

This means Foundry hasn't loaded the pack definitions. Try:

1. **Completely close Foundry VTT** (don't just refresh)
2. **Restart Foundry VTT**
3. Open your world
4. Check the Compendium Packs sidebar again

If you STILL don't see "Backgrounds", the system may not be installed correctly:

## Step 3: Verify System Installation

Check that these files/folders exist in your Foundry data directory:

```
[FoundryVTT]/Data/systems/d8-ttrpg/
├── system.json                      ← Must exist
├── template.json                    ← Must exist
├── packs/
│   └── backgrounds/                 ← Folder must exist
│       └── _source/
│           └── backgrounds.json     ← File must exist
```

**To find your Foundry data directory:**
- In Foundry, go to **Configuration** → **Data Path**
- Or look in Foundry's config file

## Step 4: Reinstall if Needed

If files are missing:

1. **Delete** the `d8-ttrpg` folder from `Data/systems/`
2. **Extract** the system tarball fresh
3. Make sure files are in the right place:
   - **WRONG**: `Data/systems/d8-ttrpg/d8-system/system.json`
   - **RIGHT**: `Data/systems/d8-ttrpg/system.json`
4. **Restart Foundry**

## Step 5: Alternative - Create Compendium in World

If the system compendium still won't work, create a world compendium instead:

1. Go to **Compendium Packs** sidebar
2. Click **Create Compendium**
3. Fill in:
   - **Name**: backgrounds
   - **Label**: Backgrounds  
   - **Type**: Item
   - **Package**: Your World (not the system)
4. Click **Create**

Now update the import macro to use `world.backgrounds` instead:

```javascript
// Change this line:
const pack = game.packs.get("d8-ttrpg.backgrounds");

// To this:
const pack = game.packs.get("world.backgrounds");
```

## Quick Test Macro

Run this to see what compendiums exist:

```javascript
console.log("All compendium packs:");
for (let pack of game.packs) {
  console.log(`${pack.collection} - ${pack.metadata.label}`);
}
```

Press F12 to see the console output. You should see a list of all available compendiums.

## Common Issues

**"My world uses a different system"**
- Make sure you created a world with the D8 TTRPG system
- You can't use D8 backgrounds in a D&D5e world, for example

**"System.json is missing"**
- You may have extracted the files to the wrong location
- Files should be directly in `Data/systems/d8-ttrpg/`, not in a subfolder

**"I see the compendium but it's empty"**
- That's fine! The import macro will populate it
- Just make sure you can open it first

## Expected Behavior

When everything is working:
1. Compendium Packs sidebar shows "Backgrounds" 
2. Clicking it opens an (empty) list
3. The + icon lets you create entries
4. The import macro can add items to it

If you can do step 1-3, the import macro will work!
