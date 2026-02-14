/**
 * Legends System for Foundry VTT
 * Author: Sean (athelu)
 * Software License: MIT
 *
 * Compatible with: Foundry VTT V13
 * Uses: Application V2 (AppV2) framework, renderChatMessageHTML hooks
 */

// Import document classes
import { D8Actor } from "./documents/actor.mjs";
import { D8Item } from "./documents/item.mjs";

// Import sheet classes
import { D8CharacterSheet } from "./sheets/character-sheet.mjs";
import { D8NPCSheet } from "./sheets/npc-sheet.mjs";
import { D8ItemSheet } from "./sheets/item-sheet.mjs";

// Import helpers
import * as dice from "./dice.mjs";
import * as chat from "./chat.mjs";
import * as combat from "./combat.mjs";
import * as shields from "./shields.mjs";
import * as featEffects from "./feat-effects.mjs";
import * as traitEffects from "./trait-effects.mjs";
import * as magicalTraits from "./magical-traits.mjs";
import { initializeConditionEngine, initializeChatHandlers, handleRecoveryResult } from "./condition-engine.mjs";
import { registerEnrichers } from "./enrichers.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {
  console.log('Legends | Initializing Legends System');

  // Create the main game.legends namespace
  game.legends = {
    // Document classes
    D8Actor,
    D8Item,

    // Rolling functions
    rollSkillCheck,
    rollSavingThrow,
    rollInitiative,
    rollWeave,

    // Condition management
    applyCondition,
    removeCondition,
    handleRecoveryResult,
    cleanupDuplicateConditionEffects,

    // Module references
    dice,
    chat,
    combat,
    featEffects,
    traitEffects,
    magicalTraits
  };

  // DEPRECATED: Backward compatibility alias
  // Remove this in a future major version
  game.d8 = game.legends;

  // Define custom Document classes
  CONFIG.Actor.documentClass = D8Actor;
  CONFIG.Item.documentClass = D8Item;

  // Clear default Foundry status effects immediately so they never appear
  CONFIG.statusEffects = [];
  CONFIG.specialStatusEffects = {};

  // Register sheet application classes (AppV2)
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.applications.sheets.ActorSheetV2);
  foundry.documents.collections.Actors.registerSheet("legends", D8CharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "D8.SheetLabels.Character"
  });

  foundry.documents.collections.Actors.registerSheet("legends", D8NPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "D8.SheetLabels.NPC"
  });

  foundry.documents.collections.Items.unregisterSheet("core", foundry.applications.sheets.ItemSheetV2);
  foundry.documents.collections.Items.registerSheet("legends", D8ItemSheet, {
    makeDefault: true,
    label: "D8.SheetLabels.Item"
  });

  // Preload Handlebars templates
  await foundry.applications.handlebars.loadTemplates([
    // Template partials can be added here if needed
  ]);
  
  // Register Handlebars helpers
  registerHandlebarsHelpers();
   
  // Initialize luck spending handlers
  dice.initializeLuckHandlers();

  // Initialize combat handlers
  combat.initializeCombatSystem();
  
  // Initialize feat validation & usage handlers
  featEffects.initializeFeatHandlers();
  
  // Initialize trait effect handlers
  traitEffects.initializeTraitHandlers();

  // Initialize condition engine
  initializeConditionEngine();
  initializeChatHandlers();

  // Register custom TextEditor enrichers (inline rolls)
  registerEnrichers();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async function() {
  console.log('Legends | System Ready');

  // Register conditions as status effects for token HUD (packs are fully loaded at ready)
  await registerConditionsAsStatusEffects();

  // On ready, ensure any equipped shields have granted items applied
  try {
    for (const actor of game.actors.values()) {
      const shieldsEquipped = shields.findEquippedShields(actor);
      for (const s of shieldsEquipped) {
        await shields.grantLinkedItemsFromShield(actor, s);
      }
    }
  } catch (err) {
    console.warn('Legends | Error applying shield-linked items on ready', err);
  }
});

/* -------------------------------------------- */
/*  Token HUD Condition Management              */
/* -------------------------------------------- */

// Intercept status effect toggling to use our condition system
Hooks.on('preCreateActiveEffect', async (activeEffect, data, options, userId) => {
  // Skip if this is one of our condition marker effects (to prevent recursion)
  if (activeEffect.flags?.legends?.isConditionMarker) {
    return true; // Allow creation
  }

  // Check if this is a condition from our system
  const statusId = activeEffect.statuses?.first();
  if (!statusId) return true;

  // Find the condition in our registered status effects
  const statusEffect = CONFIG.statusEffects.find(e => e.id === statusId);
  if (!statusEffect || !statusEffect.reference) return true;

  // Get the actor
  const actor = activeEffect.parent;
  if (!actor || !(actor instanceof Actor)) return true;

  // Prevent the default active effect creation
  // and use our condition system instead
  const conditionName = statusEffect.name;
  await applyCondition(actor, conditionName);

  return false; // Prevent default creation
});

// Handle condition removal via token HUD
Hooks.on('preDeleteActiveEffect', async (activeEffect, options, userId) => {
  // Only handle our condition marker effects
  if (!activeEffect.flags?.legends?.isConditionMarker) {
    return true; // Allow deletion of non-condition effects
  }

  const statusId = activeEffect.statuses?.first();
  if (!statusId) return true;

  const statusEffect = CONFIG.statusEffects.find(e => e.id === statusId);
  if (!statusEffect) return true;

  const actor = activeEffect.parent;
  if (!actor || !(actor instanceof Actor)) return true;

  // Use our condition removal system
  const conditionName = statusEffect.name;
  await removeCondition(actor, conditionName);

  return false; // Prevent default deletion (we already handled it)
});

// Watch for shield equip/unequip (item updates)
Hooks.on('updateItem', async (item, diff, options, userId) => {
  try {
    if (!item || item.type !== 'shield') return;
    const actor = item.actor;
    const equipped = diff?.system?.equipped;
    if (equipped === true) {
      await shields.grantLinkedItemsFromShield(actor, item);
    } else if (equipped === false) {
      await shields.revokeLinkedItemsFromShield(actor, item);
    }
  } catch (err) {
    console.warn('Legends | Error handling shield equip change', err);
  }
});

// Watch for trait deletions to clean up magical trait data
Hooks.on('deleteItem', async (item, options, userId) => {
  try {
    if (!item || item.type !== 'trait') return;
    
    const actor = item.actor;
    if (!actor) return;
    
    // Handle magical trait removal
    await magicalTraits.handleMagicalTraitRemoval(actor, item);
  } catch (err) {
    console.error('Legends | Error handling trait removal', err);
  }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

Hooks.on("hotbarDrop", (bar, data, slot) => {
  if (data.type !== "Item") return;
  createItemMacro(data, slot);
  return false;
});

/* -------------------------------------------- */
/*  Core Rolling Functions                      */
/* -------------------------------------------- */

/**
 * Roll a skill check using the 2d8 roll-under system
 * @param {Actor} actor - The actor making the check
 * @param {string} skillKey - The skill being tested
 * @param {Object} options - Additional rolling options
 */
  export async function rollSkillCheck(actor, skillKey, options = {}) {
    // Get skill value (prefer effective value computed from feats)
      const skillValue = actor.system.skillsEffective?.[skillKey] ?? actor.system.skills[skillKey] ?? 0;
      // Prefill any dice modifiers from feats
      let defaultModifier = 0;
      let defaultApplyToAttr = true;
      let defaultApplyToSkill = true;
      try {
        const featMods = featEffects.computeFeatModifiers(actor);
        const s = featMods.skillDiceModifiers?.[skillKey];
        if (s) {
          defaultModifier = s.value || 0;
          defaultApplyToAttr = !!s.applyToAttr;
          defaultApplyToSkill = !!s.applyToSkill;
        }
      } catch (err) {
        // ignore
      }
    
    // Map skill keys to their governing attributes
    const skillToAttribute = {
      athletics: 'strength',
      might: 'strength',
      devices: 'dexterity',
      thievery: 'dexterity',
      writing: 'dexterity',
      rangedCombat: 'dexterity',
      craft: 'dexterity',
      acrobatics: 'agility',
      meleeCombat: 'agility',
      stealth: 'agility',
      investigate: 'intelligence',
      language: 'intelligence',
      history: 'intelligence',
      arcane: 'intelligence',
      society: 'intelligence',
      perception: 'wisdom',
      survival: 'wisdom',
      persuasion: 'charisma',
      deception: 'charisma',
      intimidate: 'charisma',
      perform: 'charisma',
      insight: 'wisdom',
      medicine: 'wisdom',
      animalHandling: 'wisdom'
    };
    
    // Get the attribute key for this skill
    const attrKey = skillToAttribute[skillKey];
    
    if (!attrKey) {
      console.error(`Unknown skill: ${skillKey}`);
      ui.notifications.error(`Unknown skill: ${skillKey}`);
      return;
    }
    
    const attr = actor.system.attributesEffective?.[attrKey] ? { value: actor.system.attributesEffective[attrKey], label: actor.system.attributes[attrKey]?.label || attrKey } : actor.system.attributes[attrKey];
    
    if (!attr) {
      console.error(`Attribute not found: ${attrKey}`);
      ui.notifications.error(`Attribute not found: ${attrKey}`);
      return;
    }
    
    // Show roll dialog instead of rolling immediately
    return dice.showRollDialog({
      actor,
      attrValue: attr.value,
      skillValue: (typeof skillValue === 'object' ? skillValue.value ?? skillValue : skillValue),
      attrLabel: attr.label,
      skillLabel: game.i18n.localize(`D8.Skills.${skillKey}`),
      defaultModifier: defaultModifier,
      defaultApplyToAttr: defaultApplyToAttr,
      defaultApplyToSkill: defaultApplyToSkill
    });
  }


/**
 * Roll a saving throw
 * @param {Actor} actor - The actor making the save
 * @param {string} saveType - Type of save: fortitude, reflex, or will
 * @param {Object} options - Additional rolling options
 */
export async function rollSavingThrow(actor, saveType, options = {}) {
  let attrKey, attrLabel, skillLabel;
  
  switch(saveType) {
    case 'fortitude':
      attrKey = 'constitution';
      attrLabel = 'Constitution';
      skillLabel = 'Fortitude Save';
      break;
    case 'reflex':
      attrKey = 'agility';
      attrLabel = 'Agility';
      skillLabel = 'Reflex Save';
      break;
    case 'will':
      attrKey = 'wisdom';
      attrLabel = 'Wisdom';
      skillLabel = 'Willpower Save';
      break;
  }
  
  const attr = actor.system.attributesEffective?.[attrKey] ? { value: actor.system.attributesEffective[attrKey], label: actor.system.attributes[attrKey]?.label || attrKey } : actor.system.attributes[attrKey];
  const luckCurrent = actor.system.luck?.current ?? actor.system.attributes.luck.value;
  
  // Compute feat-derived save modifiers (if any)
  let defaultModifier = 0;
  try {
    const featMods = featEffects.computeFeatModifiers(actor);
    defaultModifier = featMods.saves?.[saveType] ?? 0;
  } catch (err) {
    // ignore
  }

  // Call preRollSavingThrow hook to allow conditions and other effects to modify the roll
  const rollData = {
    actor,
    saveType,
    attrKey,
    attrValue: attr.value,
    luckValue: luckCurrent,
    modifier: defaultModifier
  };
  Hooks.call('preRollSavingThrow', rollData);
  
  // Use modified values from hook
  defaultModifier = rollData.modifier || 0;

  // Show simplified save dialog (no attack buttons)
  return showSavingThrowDialog({
    actor,
    attrKey,
    attrValue: attr.value,
    luckValue: luckCurrent,
    attrLabel,
    skillLabel,
    saveType,
    defaultModifier
  });
}

/**
 * Show saving throw dialog
 * @param {object} options - Dialog options
 */
async function showSavingThrowDialog(options) {
  const { actor, attrKey, attrValue, luckValue, attrLabel, skillLabel, saveType, defaultModifier = 0 } = options;

  return foundry.applications.api.DialogV2.wait({
    window: { title: `${skillLabel}` },
    content: `
      <style>
        .dialog-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .dialog-buttons button {
          flex: 0 0 calc(33.333% - 4px);
        }
      </style>
      <form class="legends-save-dialog">
        <div class="form-group">
          <label><strong>${attrLabel} ${attrValue} + Luck ${luckValue}</strong></label>
        </div>
        <div class="form-group">
          <label>Modifier:</label>
          <input type="text" name="modifier" value="${defaultModifier}" style="width: 60px; text-align: center;" placeholder="0"/>
        </div>
        <div class="form-group" style="margin-left: 20px;">
          <label>
            <input type="checkbox" name="applyToAttr" checked/>
            Apply to ${attrLabel} die
          </label>
        </div>
        <div class="form-group" style="margin-left: 20px;">
          <label>
            <input type="checkbox" name="applyToSkill" checked/>
            Apply to Luck die
          </label>
        </div>
        <hr style="margin: 15px 0;"/>
        <div class="form-group">
          <p style="font-size: 12px; color: #666; margin: 0;">
            <strong>Fortune:</strong> Roll 3d8, choose best 2<br/>
            <strong>Misfortune:</strong> Roll 3d8, choose worst 2
          </p>
        </div>
      </form>
    `,
    buttons: [
      {
        action: "normal",
        label: "Roll Save",
        default: true,
        callback: async (event, button, dialog) => {
          const modifierInput = dialog.element.querySelector('[name="modifier"]');
          const rawValue = modifierInput?.value || "";
          const modifier = parseInt(rawValue) || 0;
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          
          return await rollSavingThrowDice(actor, saveType, attrKey, attrLabel, attrValue, luckValue, {
            modifier,
            applyToAttr,
            applyToSkill
          });
        }
      },
      {
        action: "fortune",
        label: "Fortune",
        callback: async (event, button, dialog) => {
          const modifier = parseInt(dialog.element.querySelector('[name="modifier"]').value) || 0;
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          
          return await rollSavingThrowWithFortune(actor, saveType, attrKey, attrLabel, attrValue, luckValue, {
            modifier,
            applyToAttr,
            applyToSkill,
            isFortune: true
          });
        }
      },
      {
        action: "misfortune",
        label: "Misfortune",
        callback: async (event, button, dialog) => {
          const modifier = parseInt(dialog.element.querySelector('[name="modifier"]').value) || 0;
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          
          return await rollSavingThrowWithFortune(actor, saveType, attrKey, attrLabel, attrValue, luckValue, {
            modifier,
            applyToAttr,
            applyToSkill,
            isFortune: false
          });
        }
      }
    ]
  });
}

/**
 * Roll saving throw dice (normal roll)
 * @param {Actor} actor - The actor making the save
 * @param {string} saveType - Type of save
 * @param {string} attrKey - Attribute key
 * @param {string} attrLabel - Attribute label
 * @param {number} attrValue - Attribute value
 * @param {number} luckValue - Luck value
 * @param {object} options - Roll options
 */
async function rollSavingThrowDice(actor, saveType, attrKey, attrLabel, attrValue, luckValue, options = {}) {
  const { modifier = 0, applyToAttr = true, applyToSkill = true } = options;
  
  // Roll 2d8 (attribute die + luck die)
  const attrRoll = new Roll('1d8');
  const luckRoll = new Roll('1d8');
  
  await attrRoll.evaluate();
  await luckRoll.evaluate();
  
  let attrDie = attrRoll.total;
  let luckDie = luckRoll.total;
  
  // Apply modifiers
  if (applyToAttr && modifier !== 0) attrDie += modifier;
  if (applyToSkill && modifier !== 0) luckDie += modifier;
  
  // Count successes
  let successes = 0;
  if (attrDie <= attrValue) successes++;
  if (luckDie <= luckValue) successes++;
  
  // Determine result
  let resultText = '';
  let resultClass = '';
  if (successes >= 2) {
    resultText = '2 Successes';
    resultClass = 'success';
  } else if (successes === 1) {
    resultText = '1 Success';
    resultClass = 'partial';
  } else {
    resultText = '0 Successes';
    resultClass = 'failure';
  }
  
  // Create chat message with roll result
  const messageContent = `
    <div class="d8-save-result">
      <h3>${saveType.charAt(0).toUpperCase() + saveType.slice(1)} Save</h3>
      <div class="dice-roll">
        <div class="dice-result">
          <div class="dice-formula">${attrLabel} ${attrValue} + Luck ${luckValue}${modifier !== 0 ? ` (${modifier >= 0 ? '+' : ''}${modifier})` : ''}</div>
          <div class="dice-details">
            <span class="${attrDie <= attrValue ? 'success' : 'failure'}">${attrLabel}: ${attrDie} ${attrDie <= attrValue ? '✓' : '✗'}</span>
            <span class="${luckDie <= luckValue ? 'success' : 'failure'}">Luck: ${luckDie} ${luckDie <= luckValue ? '✓' : '✗'}</span>
          </div>
          <h4 class="dice-total ${resultClass}">${resultText}</h4>
        </div>
      </div>
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: messageContent,
    rolls: [attrRoll, luckRoll]
  });
  
  return { successes, attrDie, luckDie };
}

/**
 * Roll saving throw with fortune/misfortune
 * @param {Actor} actor - The actor making the save
 * @param {string} saveType - Type of save
 * @param {string} attrKey - Attribute key
 * @param {string} attrLabel - Attribute label
 * @param {number} attrValue - Attribute value
 * @param {number} luckValue - Luck value
 * @param {object} options - Roll options
 */
async function rollSavingThrowWithFortune(actor, saveType, attrKey, attrLabel, attrValue, luckValue, options = {}) {
  const { modifier = 0, applyToAttr = true, applyToSkill = true, isFortune = true } = options;
  
  // Roll 3d8 for each die
  const attrRolls = [];
  const luckRolls = [];
  
  for (let i = 0; i < 3; i++) {
    const aRoll = new Roll('1d8');
    const lRoll = new Roll('1d8');
    await aRoll.evaluate();
    await lRoll.evaluate();
    attrRolls.push(aRoll);
    luckRolls.push(lRoll);
  }
  
  // Sort to find best/worst
  const sortedAttrIndices = attrRolls.map((r, i) => ({ index: i, value: r.total }))
    .sort((a, b) => isFortune ? a.value - b.value : b.value - a.value);
  const sortedLuckIndices = luckRolls.map((r, i) => ({ index: i, value: r.total }))
    .sort((a, b) => isFortune ? a.value - b.value : b.value - a.value);
  
  const defaultAttrIndex = sortedAttrIndices[0].index;
  const defaultLuckIndex = sortedLuckIndices[0].index;
  
  // Show dice assignment dialog
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `${isFortune ? 'Fortune' : 'Misfortune'} - Assign Dice` },
    content: `
      <form class="legends-dice-assignment">
        <p>Choose which dice to assign to ${attrLabel} and Luck:</p>
        <div style="display: flex; gap: 10px; margin: 10px 0;">
          ${attrRolls.map((r, i) => `<div style="text-align: center; padding: 10px; border: 2px solid #666; border-radius: 4px; font-size: 18px; font-weight: bold;">${r.total}</div>`).join('')}
        </div>
        <div class="form-group">
          <label>${attrLabel} die:</label>
          <select name="attrDie">
            ${attrRolls.map((r, i) => `<option value="${i}" ${i === defaultAttrIndex ? 'selected' : ''}>Die ${i + 1}: ${r.total}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Luck die:</label>
          <select name="luckDie">
            ${luckRolls.map((r, i) => `<option value="${i}" ${i === defaultLuckIndex ? 'selected' : ''}>Die ${i + 1}: ${r.total}</option>`).join('')}
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: "assign",
        label: "Assign Dice",
        callback: async (event, button, dialog) => {
          const attrDieIndex = parseInt(dialog.element.querySelector('[name="attrDie"]').value);
          const luckDieIndex = parseInt(dialog.element.querySelector('[name="luckDie"]').value);
          
          const selectedAttrRoll = attrRolls[attrDieIndex];
          const selectedLuckRoll = luckRolls[luckDieIndex];
          
          let attrDie = selectedAttrRoll.total;
          let luckDie = selectedLuckRoll.total;
          
          // Apply modifiers
          if (applyToAttr && modifier !== 0) attrDie += modifier;
          if (applyToSkill && modifier !== 0) luckDie += modifier;
          
          // Count successes
          let successes = 0;
          if (attrDie <= attrValue) successes++;
          if (luckDie <= luckValue) successes++;
          
          // Determine result
          let resultText = '';
          let resultClass = '';
          if (successes >= 2) {
            resultText = '2 Successes';
            resultClass = 'success';
          } else if (successes === 1) {
            resultText = '1 Success';
            resultClass = 'partial';
          } else {
            resultText = '0 Successes';
            resultClass = 'failure';
          }
          
          // Create chat message
          const messageContent = `
            <div class="d8-save-result">
              <h3>${saveType.charAt(0).toUpperCase() + saveType.slice(1)} Save (${isFortune ? 'Fortune' : 'Misfortune'})</h3>
              <div class="dice-roll">
                <div class="dice-result">
                  <div class="dice-formula">${attrLabel} ${attrValue} + Luck ${luckValue}${modifier !== 0 ? ` (${modifier >= 0 ? '+' : ''}${modifier})` : ''}</div>
                  <div class="dice-details">
                    <div>Rolled: ${attrRolls.map(r => r.total).join(', ')}</div>
                    <div>Selected: ${attrLabel} ${selectedAttrRoll.total}, Luck ${selectedLuckRoll.total}</div>
                    <span class="${attrDie <= attrValue ? 'success' : 'failure'}">${attrLabel}: ${attrDie} ${attrDie <= attrValue ? '✓' : '✗'}</span>
                    <span class="${luckDie <= luckValue ? 'success' : 'failure'}">Luck: ${luckDie} ${luckDie <= luckValue ? '✓' : '✗'}</span>
                  </div>
                  <h4 class="dice-total ${resultClass}">${resultText}</h4>
                </div>
              </div>
            </div>
          `;
          
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: messageContent,
            rolls: [selectedAttrRoll, selectedLuckRoll]
          });
          
          return { successes, attrDie, luckDie };
        }
      }
    ]
  });
  
  return result;
}

/**
 * Roll initiative
 * @param {Actor} actor - The actor rolling initiative
 * @param {string} skillKey - The skill being used for initiative
 */
export async function rollInitiative(actor, skillKey = 'perception') {
  const skill = actor.system.skillsEffective?.[skillKey] ?? actor.system.skills[skillKey] ?? 0;
  const agility = actor.system.attributesEffective?.agility ?? actor.system.attributes.agility.value;
  const luckCurrent = actor.system.luck?.current ?? actor.system.attributes.luck.value;
  
  // Roll 1d8
  const roll = new Roll('1d8');
  await roll.evaluate();
  
  const skillVal = (typeof skill === 'object' ? skill.value ?? skill : skill);
  const total = agility + luckCurrent + skillVal + roll.total;
  
  // Create chat message
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="d8-roll initiative-roll">
        <h3>Initiative</h3>
        <div class="formula">
          ${agility} (Agility) + ${luckCurrent} (Luck) + ${skillVal} (${game.i18n.localize(`D8.Skills.${skillKey}`)}) + ${roll.total}
        </div>
        <div class="total">
          <strong>Total:</strong> ${total}
        </div>
      </div>
    `
  });
  
  return total;
}

/**
 * Roll a weave (spell)
 * @param {Actor} actor - The actor casting the weave
 * @param {Item} weave - The weave item being cast
 */
export async function rollWeave(actor, weave) {
  const primaryEnergy = weave.system.energyCost.primary.type;
  const supportingEnergy = weave.system.energyCost.supporting.type;
  
  const primaryPotential = actor.system.potentials[primaryEnergy].value;
  const primaryMastery = actor.system.mastery[primaryEnergy].value;
  
  let supportingPotential = 0;
  let supportingMastery = 0;
  
  if (supportingEnergy) {
    supportingPotential = actor.system.potentials[supportingEnergy].value;
    supportingMastery = actor.system.mastery[supportingEnergy].value;
  }
  
  return dice.rollWeaveCheck({
    actor,
    weave,
    primaryPotential,
    primaryMastery,
    supportingPotential,
    supportingMastery
  });
}

/* -------------------------------------------- */
/*  Condition System Integration                */
/* -------------------------------------------- */

/**
 * Apply a condition to an actor with full metadata support
 * @param {Actor} actor - The actor to apply the condition to
 * @param {string} conditionName - Name of the condition to apply
 * @param {Object} options - Additional options (duration, source, etc.)
 * @returns {Promise<Item>} The created condition item on the actor
 */
async function applyCondition(actor, conditionName, options = {}) {
  try {
    // Get the conditions compendium
    const pack = game.packs.get('legends.conditions');
    if (!pack) {
      ui.notifications.warn('Conditions compendium not found');
      return null;
    }

    // Find the condition by name
    const conditionId = conditionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const index = pack.index.find(i =>
      i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === conditionId
    );

    if (!index) {
      ui.notifications.warn(`Condition "${conditionName}" not found`);
      return null;
    }

    // Load the full condition document
    const condition = await pack.getDocument(index._id);


    // Check stacking behavior
    const existingConditions = actor.items.filter(i =>
      i.type === 'condition' && i.name === condition.name
    );

    const stackingMode = condition.system.stacking || 'replace';

    if (existingConditions.length > 0) {
      switch (stackingMode) {
        case 'replace':
          // Remove existing condition items
          await actor.deleteEmbeddedDocuments('Item', existingConditions.map(c => c.id));
          // Also remove associated ActiveEffect markers to prevent duplicates
          const statusId = condition.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const effectsToRemove = actor.effects.filter(e => 
            e.statuses.has(statusId) && e.flags?.legends?.isConditionMarker
          );
          if (effectsToRemove.length > 0) {
            await actor.deleteEmbeddedDocuments('ActiveEffect', effectsToRemove.map(e => e.id));
          }
          break;
        case 'stack': {
          // Only allow one instance, increment stack count
          const existing = existingConditions[0];
          const currentStacks = existing.system.stacks || 1;
          await existing.update({ 'system.stacks': currentStacks + 1 });
          // Optionally, show a chat message for stack increment
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div class="d8-condition-applied"><strong>${actor.name}</strong> gained an additional stack of <strong>${condition.name}</strong> (${currentStacks + 1} stacks).</div>`
          });
          return existing;
        }
        case 'duration-merge':
          // Keep existing, extend duration if applicable
          ui.notifications.info(`${condition.name} duration extended`);
          return existingConditions[0];
        case 'highest':
          // Keep whichever has higher severity/value
          return existingConditions[0];
      }
    }

    // Create the condition item on the actor
    const conditionData = condition.toObject();

    // Apply any custom options (e.g., duration, source)
    if (options.duration) {
      conditionData.system.duration = options.duration;
    }
    if (options.source) {
      conditionData.flags = conditionData.flags || {};
      conditionData.flags.legends = conditionData.flags.legends || {};
      conditionData.flags.legends.source = options.source;
    }

    const [createdCondition] = await actor.createEmbeddedDocuments('Item', [conditionData]);

    // Create a corresponding Active Effect for token overlay visualization
    const statusId = condition.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // First, check if there's already an ActiveEffect for this condition (cleanup any orphaned effects)
    const existingEffects = actor.effects.filter(e => 
      e.statuses.has(statusId) && e.flags?.legends?.isConditionMarker
    );
    
    if (existingEffects.length > 0) {
      console.warn(`Legends | Found ${existingEffects.length} existing ActiveEffect(s) for ${condition.name}, removing duplicates`);
      await actor.deleteEmbeddedDocuments('ActiveEffect', existingEffects.map(e => e.id));
    }
    
    const effectData = {
      name: condition.name,
      icon: condition.img,
      statuses: [statusId],
      flags: {
        legends: {
          conditionId: createdCondition.id,
          isConditionMarker: true
        }
      }
    };

    // Add any active effects from the condition
    if (condition.system.activeEffects && condition.system.activeEffects.length > 0) {
      effectData.changes = condition.system.activeEffects.map(ae => ({
        key: ae.key,
        mode: ae.mode === 'add' ? 2 : ae.mode === 'mult' ? 1 : 5,
        value: ae.value,
        priority: 20
      }));
    }

    await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);

    // Check if this condition applies other conditions automatically
    if (condition.system.appliesConditions && condition.system.appliesConditions.length > 0) {
      for (const appliedConditionName of condition.system.appliesConditions) {
        await applyCondition(actor, appliedConditionName, {
          source: condition.name
        });
      }
    }

    // Create chat message
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="d8-condition-applied">
        <strong>${actor.name}</strong> gained the <strong>${condition.name}</strong> condition.
      </div>`
    });

    return createdCondition;
  } catch (error) {
    console.error('Legends | Error applying condition:', error);
    ui.notifications.error('Failed to apply condition');
    return null;
  }
}

/**
 * Remove a condition from an actor
 * @param {Actor} actor - The actor to remove the condition from
 * @param {string} conditionName - Name of the condition to remove
 */
async function removeCondition(actor, conditionName) {
  const conditions = actor.items.filter(i =>
    i.type === 'condition' && i.name === conditionName
  );

  if (conditions.length > 0) {
    // Remove the condition items
    await actor.deleteEmbeddedDocuments('Item', conditions.map(c => c.id));

    // Also remove the corresponding active effect marker
    const statusId = conditionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const effects = actor.effects.filter(e =>
      e.statuses.has(statusId) && e.flags?.legends?.isConditionMarker
    );

    if (effects.length > 0) {
      await actor.deleteEmbeddedDocuments('ActiveEffect', effects.map(e => e.id));
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="d8-condition-removed">
        <strong>${actor.name}</strong> is no longer <strong>${conditionName}</strong>.
      </div>`
    });
  }
}

/**
 * Cleanup duplicate condition effects on an actor
 * Ensures each condition has only one ActiveEffect
 * @param {Actor} actor - The actor to clean up
 */
async function cleanupDuplicateConditionEffects(actor) {
  console.log(`Legends | Cleaning up duplicate effects on ${actor.name}`);
  
  // Get all conditions on the actor
  const conditions = actor.items.filter(i => i.type === 'condition');
  console.log(`Legends | Found ${conditions.length} condition items:`, conditions.map(c => c.name));
  
  // Get all condition marker effects
  const conditionEffects = actor.effects.filter(e => e.flags?.legends?.isConditionMarker);
  console.log(`Legends | Found ${conditionEffects.size} condition marker effects`);
  
  // Group effects by status ID
  const effectsByStatus = new Map();
  for (const effect of conditionEffects) {
    const statusId = Array.from(effect.statuses)[0];
    if (!statusId) continue;
    
    if (!effectsByStatus.has(statusId)) {
      effectsByStatus.set(statusId, []);
    }
    effectsByStatus.get(statusId).push(effect);
  }
  
  // Find and remove duplicates
  const toDelete = [];
  for (const [statusId, effects] of effectsByStatus) {
    if (effects.length > 1) {
      console.warn(`Legends | Found ${effects.length} duplicate effects for status '${statusId}'`);
      // Keep the first one, delete the rest
      for (let i = 1; i < effects.length; i++) {
        toDelete.push(effects[i].id);
      }
    }
  }
  
  if (toDelete.length > 0) {
    console.log(`Legends | Deleting ${toDelete.length} duplicate effect(s)`);
    await actor.deleteEmbeddedDocuments('ActiveEffect', toDelete);
    ui.notifications.info(`Cleaned up ${toDelete.length} duplicate condition effect(s) on ${actor.name}`);
  } else {
    console.log(`Legends | No duplicate effects found`);
    ui.notifications.info(`No duplicate condition effects found on ${actor.name}`);
  }
  
  return toDelete.length;
}

/**
 * Load conditions from compendium and register as status effects for token HUD
 */
async function registerConditionsAsStatusEffects() {
  try {
    // Get the conditions compendium
    const pack = game.packs.get('legends.conditions');
    if (!pack) {
      console.warn('Legends | Conditions compendium not found, skipping status effect registration');
      return;
    }

    // Load index to get all condition documents
    await pack.getIndex();

    // Define severity priority (for sorting)
    const severityOrder = { severe: 1, moderate: 2, minor: 3 };

    // Build status effects array from conditions
    const statusEffects = [];

    for (const index of pack.index) {
      const condition = await pack.getDocument(index._id);
      if (!condition || condition.type !== 'condition') continue;

      const severity = condition.system.severity || 'moderate';
      const overlayPriority = condition.system.overlayPriority || 20;

      statusEffects.push({
        id: condition.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: condition.name,
        img: condition.img,
        // Store reference to compendium item for later retrieval
        reference: condition.uuid,
        // Include severity for sorting
        _severity: severityOrder[severity] || 2,
        _overlayPriority: overlayPriority
      });
    }

    // Sort by severity (severe first), then by overlay priority, then alphabetically
    statusEffects.sort((a, b) => {
      if (a._severity !== b._severity) {
        return a._severity - b._severity;
      }
      if (a._overlayPriority !== b._overlayPriority) {
        return b._overlayPriority - a._overlayPriority;
      }
      return a.name.localeCompare(b.name);
    });

    // Remove sorting metadata
    statusEffects.forEach(effect => {
      delete effect._severity;
      delete effect._overlayPriority;
    });

    // Register with Foundry's CONFIG
    CONFIG.statusEffects = statusEffects;

    console.log(`Legends | Registered ${statusEffects.length} conditions as status effects`);
  } catch (error) {
    console.error('Legends | Error registering conditions as status effects:', error);
  }
}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

function registerHandlebarsHelpers() {
  Handlebars.registerHelper('concat', function(...args) {
    args.pop(); // Remove options object
    return args.join('');
  });
  
  Handlebars.registerHelper('times', function(n, block) {
    let result = '';
    for (let i = 0; i < n; ++i) {
      result += block.fn(i);
    }
    return result;
  });
  
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });
  
  // Check if an array contains a value
  Handlebars.registerHelper('contains', function(array, value) {
    if (!array) return false;
    if (!Array.isArray(array)) return false;
    return array.includes(value);
  });
  
  // Capitalize first letter of each word
  Handlebars.registerHelper('capitalize', function(str) {
    if (!str) return '';
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  });
  
  // Uppercase entire string
  Handlebars.registerHelper('uppercase', function(str) {
    if (!str) return '';
    return str.toUpperCase();
  });
  
  // Greater than comparison
  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });
  
  // Less than comparison
  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });
  
  // Lookup value in object
  Handlebars.registerHelper('lookup', function(obj, key) {
    if (!obj) return '';
    return obj[key] || '';
  });
  
  Handlebars.registerHelper('add', function(a, b) {
    return a + b;
  });
  
  Handlebars.registerHelper('subtract', function(a, b) {
    return a - b;
  });

  // Check if an array has any items (not empty)
  Handlebars.registerHelper('hasItems', function(array) {
    if (!array) return false;
    if (!Array.isArray(array)) return false;
    return array.length > 0;
  });

  // Register JSON stringify helper for serializing arrays/objects in templates
  Handlebars.registerHelper('json', function(context) {
    if (!context) return '';
    if (typeof context === 'string') return context;
    return JSON.stringify(context, null, 2);
  });
}

/* -------------------------------------------- */
/*  Macro Functions                             */
/* -------------------------------------------- */

async function createItemMacro(data, slot) {
  const item = await fromUuid(data.uuid);
  if (!item) return ui.notifications.warn("Could not find item");
  
  const command = `game.legends.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "legends.itemMacro": true }
    });
  }
  
  game.user.assignHotbarMacro(macro, slot);
}
