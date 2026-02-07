// Legends TTRPG - Import All 50 Backgrounds Macro
// 
// HOW TO USE:
// 1. Create a new Macro (Script type) in Foundry
// 2. Copy and paste this entire file into the macro
// 3. Execute the macro
// 4. All 50 backgrounds will be imported!

console.log("=== Legends TTRPG - Import Backgrounds ===");

const pack = game.packs.get("legends.backgrounds");

if (!pack) {
  ui.notifications.error("Backgrounds compendium not found!");
  console.log("Available packs:", Array.from(game.packs.keys()));
  return;
}

let backgrounds;
try {
  const response = await fetch("systems/legends/packs/backgrounds/_source/backgrounds.json");
  backgrounds = await response.json();
  console.log(`✓ Loaded ${backgrounds.length} backgrounds`);
} catch (err) {
  ui.notifications.error("Could not load backgrounds.json");
  console.error(err);
  return;
}

let imported = 0, skipped = 0;

for (let bg of backgrounds) {
  const existing = pack.index.find(i => i.name === bg.name);
  if (existing) {
    skipped++;
    continue;
  }
  
  await Item.create(bg, {pack: pack.collection});
  imported++;
  console.log(`✓ ${bg.name}`);
}

ui.notifications.info(`Done! ${imported} imported, ${skipped} skipped`);
