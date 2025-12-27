// D8 TTRPG System Diagnostic
// Run this macro to check if the system is installed correctly

console.log("=== D8 TTRPG System Diagnostic ===");

// 1. Check if system is active
const currentSystem = game.system.id;
console.log(`Current system: ${currentSystem}`);

if (currentSystem !== "d8-ttrpg") {
  ui.notifications.warn(`You're using ${currentSystem}, not d8-ttrpg!`);
  console.log("❌ Wrong system! Make sure your world is using the D8 TTRPG system.");
} else {
  console.log("✓ D8 TTRPG system is active");
}

// 2. Check compendium packs
console.log("\n=== Compendium Packs ===");
console.log("All packs in game:");
for (let pack of game.packs) {
  console.log(`  ${pack.collection} - ${pack.metadata.label} (${pack.metadata.type})`);
}

console.log("\nD8 TTRPG packs:");
const d8Packs = game.packs.filter(p => 
  p.metadata.system === "d8-ttrpg" || 
  p.metadata.packageName === "d8-ttrpg"
);

if (d8Packs.length === 0) {
  console.log("❌ No D8 TTRPG packs found!");
  ui.notifications.error("No D8 compendiums found! System may not be installed correctly.");
} else {
  for (let pack of d8Packs) {
    console.log(`  ✓ ${pack.collection} - ${pack.metadata.label}`);
  }
  ui.notifications.info(`Found ${d8Packs.length} D8 TTRPG compendium packs`);
}

// 3. Specifically check for backgrounds pack
console.log("\n=== Backgrounds Pack Check ===");
const backgroundsPack = game.packs.get("d8-ttrpg.backgrounds");
if (backgroundsPack) {
  console.log("✓ Backgrounds pack found!");
  console.log(`  Name: ${backgroundsPack.collection}`);
  console.log(`  Label: ${backgroundsPack.metadata.label}`);
  console.log(`  Current entries: ${backgroundsPack.index.size}`);
} else {
  console.log("❌ Backgrounds pack NOT found");
  console.log("Trying alternative names...");
  
  const alternatives = ["backgrounds", "world.backgrounds"];
  for (let name of alternatives) {
    const alt = game.packs.get(name);
    if (alt) {
      console.log(`  Found as: ${name}`);
    }
  }
}

// 4. Check item types
console.log("\n=== Item Types ===");
console.log("Available item types:", CONFIG.Item.documentClass.TYPES);

if (CONFIG.Item.documentClass.TYPES.includes("background")) {
  console.log("✓ 'background' item type is registered");
} else {
  console.log("❌ 'background' item type is NOT registered");
}

// 5. Check file access
console.log("\n=== File Access Check ===");
try {
  const response = await fetch("systems/d8-ttrpg/system.json");
  const systemData = await response.json();
  console.log("✓ Can access system files");
  console.log(`  System version: ${systemData.version}`);
  console.log(`  Packs defined: ${systemData.packs.length}`);
} catch (err) {
  console.log("❌ Cannot access system files");
  console.error(err);
}

// 6. Summary
console.log("\n=== SUMMARY ===");
let issues = [];

if (currentSystem !== "d8-ttrpg") {
  issues.push("Wrong system selected");
}
if (!backgroundsPack) {
  issues.push("Backgrounds compendium not found");
}
if (!CONFIG.Item.documentClass.TYPES.includes("background")) {
  issues.push("Background item type not registered");
}

if (issues.length === 0) {
  console.log("✓ Everything looks good!");
  ui.notifications.info("System check passed! Ready to import backgrounds.");
} else {
  console.log("Issues found:");
  for (let issue of issues) {
    console.log(`  ❌ ${issue}`);
  }
  ui.notifications.warn(`Found ${issues.length} issue(s). Check console (F12) for details.`);
}

console.log("\n=== RECOMMENDATIONS ===");
if (!backgroundsPack) {
  console.log("1. Make sure the D8 TTRPG system is fully installed");
  console.log("2. Restart Foundry VTT completely (not just refresh)");
  console.log("3. Check that these files exist:");
  console.log("   - Data/systems/d8-ttrpg/system.json");
  console.log("   - Data/systems/d8-ttrpg/packs/backgrounds/ (folder)");
}
