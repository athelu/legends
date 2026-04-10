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
import * as effectEngine from "./effect-engine.mjs";
import * as magicalTraits from "./magical-traits.mjs";
import * as backgrounds from "./backgrounds.mjs";
import * as progression from "./progression.mjs";
import * as training from "./training.mjs";
import { initializeConditionEngine, initializeChatHandlers, handleRecoveryResult } from "./condition-engine.mjs";
import { registerEnrichers } from "./enrichers.mjs";

const ELEMENTAL_ENERGIES = ["earth", "air", "fire", "water"];

function resolveWeaveEnergyType(actor, energyType) {
  if (energyType !== "variable-elemental") {
    return energyType;
  }

  const magicalTrait = actor.system.magicalTrait ?? {};
  const preferredCandidates = [
    magicalTrait.elementalAffinity,
    magicalTrait.chosenElement,
    ...(magicalTrait.availableEnergies ?? []).filter((candidate) => ELEMENTAL_ENERGIES.includes(candidate))
  ].filter(Boolean);

  for (const candidate of preferredCandidates) {
    if (actor.system.potentials?.[candidate] && actor.system.mastery?.[candidate]) {
      return candidate;
    }
  }

  return ELEMENTAL_ENERGIES.reduce((best, candidate) => {
    const candidateMastery = actor.system.mastery?.[candidate]?.value ?? -1;
    const bestMastery = actor.system.mastery?.[best]?.value ?? -1;
    return candidateMastery > bestMastery ? candidate : best;
  }, "earth");
}

function getWeavePotentialValue(actor, weave) {
  const primaryEnergyType = weave?.system?.energyCost?.primary?.type;
  const resolvedEnergyType = resolveWeaveEnergyType(actor, primaryEnergyType);
  return actor?.system?.potentials?.[resolvedEnergyType]?.value ?? 0;
}

function isDraggedEffectData(data) {
  return data?.type === "WeaveEffect" || data?.type === "InlineEffect" || data?.type === "ItemEffect";
}

function normalizeEffectName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getFirstStatusId(activeEffect) {
  const statuses = activeEffect?.statuses;
  if (!statuses) return null;
  if (typeof statuses.first === 'function') return statuses.first();
  if (Array.isArray(statuses)) return statuses[0] ?? null;
  if (typeof statuses[Symbol.iterator] === 'function') {
    return Array.from(statuses)[0] ?? null;
  }
  return null;
}

async function removeConditionBySource(actor, conditionName, sourceActorId) {
  const matchingConditions = actor.items.filter((item) =>
    item.type === 'condition'
    && item.name === conditionName
    && (sourceActorId ? item.flags?.legends?.recoverySource?.actorId === sourceActorId : true)
  );

  if (matchingConditions.length === 0) {
    return false;
  }

  await actor.deleteEmbeddedDocuments('Item', matchingConditions.map((item) => item.id));

  const statusId = conditionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const effectIds = actor.effects
    .filter((effect) => effect.statuses.has(statusId) && effect.flags?.legends?.isConditionMarker)
    .map((effect) => effect.id);

  if (effectIds.length > 0) {
    await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
  }

  return true;
}

async function removeLinkedGrapple(sourceActor, targetActor) {
  const removedTargetGrapple = await removeConditionBySource(targetActor, 'Grappled', sourceActor.id);
  const removedTargetRestraint = await removeConditionBySource(targetActor, 'Restrained', sourceActor.id);
  const removedSelfGrapple = await removeConditionBySource(sourceActor, 'Grappled', targetActor.id);
  const removedSelfRestraint = await removeConditionBySource(sourceActor, 'Restrained', targetActor.id);

  return removedTargetGrapple || removedTargetRestraint || removedSelfGrapple || removedSelfRestraint;
}

async function removeReleaseGrappleConditions(targetActor, data) {
  const sourceActor = data?.actorId ? game.actors.get(data.actorId) : null;
  const linkedActorIds = new Set();

  if (sourceActor && sourceActor.id !== targetActor.id) {
    linkedActorIds.add(sourceActor.id);
  }

  for (const item of targetActor.items) {
    if (item.type !== 'condition') continue;
    if (item.name !== 'Grappled' && item.name !== 'Restrained') continue;

    const linkedActorId = item.flags?.legends?.recoverySource?.actorId;
    if (linkedActorId && linkedActorId !== targetActor.id) {
      linkedActorIds.add(linkedActorId);
    }
  }

  let removed = false;

  if (linkedActorIds.size === 0) {
    removed = await removeDraggedEffect(targetActor, 'Grappled');
    return removed;
  }

  for (const linkedActorId of linkedActorIds) {
    const linkedActor = game.actors.get(linkedActorId);
    if (!linkedActor) continue;

    if (linkedActor.id === targetActor.id) continue;
    removed = await removeLinkedGrapple(linkedActor, targetActor) || removed;
    removed = await removeLinkedGrapple(targetActor, linkedActor) || removed;
  }

  if (!removed) {
    throw new Error(`No grappled or restrained conditions linked to ${targetActor.name} were found.`);
  }

  return true;
}

async function removeDraggedEffect(targetActor, effectId) {
  const normalizedTarget = normalizeEffectName(effectId);
  let removed = false;

  const matchingConditions = targetActor.items.filter((item) =>
    item.type === 'condition' && normalizeEffectName(item.name) === normalizedTarget
  );

  for (const condition of matchingConditions) {
    await removeCondition(targetActor, condition.name);
    removed = true;
  }

  const matchingEffects = targetActor.items.filter((item) =>
    item.type === 'effect' && normalizeEffectName(item.name) === normalizedTarget
  );

  for (const effect of matchingEffects) {
    await effectEngine.removeEffect(targetActor, effect.id);
    removed = true;
  }

  if (!removed) {
    throw new Error(`${targetActor.name} does not have ${effectId}`);
  }

  return true;
}

async function applyDraggedEffect(targetActor, data) {
  if (!targetActor) {
    throw new Error("No target actor provided");
  }

  if (data?.type === "WeaveEffect") {
    const caster = game.actors.get(data.casterId);
    const weave = caster?.items.get(data.weaveId);

    if (!caster || !weave) {
      throw new Error("Unable to apply effect - weave or caster not found");
    }

    return effectEngine.applyEffect({
      target: targetActor,
      effect: data.effectId,
      origin: {
        casterId: data.casterId,
        actorId: data.casterId,
        weaveId: data.weaveId,
        weaveName: weave.name,
        successes: data.casterSuccesses,
        potential: getWeavePotentialValue(caster, weave)
      },
      params: data.params || {},
      netSuccesses: data.casterSuccesses
    });
  }

  if (data?.type === "InlineEffect") {
    return effectEngine.applyEffect({
      target: targetActor,
      effect: data.effectId,
      origin: {
        casterId: targetActor.id,
        actorId: targetActor.id,
        weaveId: null,
        weaveName: null,
        successes: 2,
        potential: 0,
        type: "inline-effect",
        label: "inline effect"
      },
      params: data.params || {},
      netSuccesses: 2
    });
  }

  if (data?.type === "ItemEffect") {
    if (data.operation === 'remove') {
      if (data.params?.linkedGrapple === true && normalizeEffectName(data.effectId) === 'grappled') {
        return removeReleaseGrappleConditions(targetActor, data);
      }

      return removeDraggedEffect(targetActor, data.effectId);
    }

    return effectEngine.applyEffect({
      target: targetActor,
      effect: data.effectId,
      origin: {
        actorId: data.actorId || '',
        id: data.itemId || '',
        type: 'item',
        label: data.itemName || 'item effect',
        successes: 0
      },
      params: data.params || {},
      netSuccesses: 0
    });
  }

  return null;
}
import { getSkillValue, normalizeSkillKey, SKILL_ATTRIBUTE_KEYS } from "./skill-utils.mjs";

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

    // Weave targeting functions
    handleSaveClick,
    handleApplyEffectClick,
    handleApplyDamageClick,
    applyWeaveDamage,
    applyDraggedEffect,
    isDraggedEffectData,
    rollItemMacro,

    // Condition management
    applyCondition,
    removeCondition,
    handleRecoveryResult,
    cleanupDuplicateConditionEffects,

    // Module references
    dice,
    chat,
    combat,
    backgrounds,
    progression,
    training,
    featEffects,
    traitEffects,
    magicalTraits,
    effectEngine
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

  // Initialize background grant handlers
  backgrounds.initializeBackgroundHandlers();

  // Initialize condition engine
  initializeConditionEngine();
  initializeChatHandlers();

  // Initialize effect engine
  effectEngine.initializeEffectEngine();

  // Register custom TextEditor enrichers (inline rolls)
  registerEnrichers();
});

Hooks.on("dropCanvasData", async function(canvas, data) {
  if (!isDraggedEffectData(data)) {
    return;
  }

  const targetToken = [...(canvas.tokens?.placeables || [])]
    .reverse()
    .find(token => token.actor && token.bounds?.contains(data.x, data.y));

  if (!targetToken?.actor) {
    ui.notifications.warn("Drop the effect onto a token to apply it");
    return false;
  }

  try {
    await applyDraggedEffect(targetToken.actor, data);
  } catch (err) {
    console.error("Legends | Failed to apply dragged effect to token", err);
    ui.notifications.error(`Failed to apply effect: ${err.message}`);
  }

  return false;
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
      await backgrounds.syncBackgroundsForActor(actor);
      await shields.syncShieldLinkedItemsForActor(actor);
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
  const statusId = getFirstStatusId(activeEffect);
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

Hooks.on('preCreateItem', async (item) => {
  if (!item || item.type !== 'ancestry') return;

  const actor = item.parent;
  if (!actor || actor.type !== 'character') return;

  const existing = actor.items.find(existingItem => existingItem.type === 'ancestry');
  if (existing) {
    ui.notifications.warn(`${actor.name} already has an ancestry. Remove the existing ancestry before adding another.`);
    return false;
  }
});

// Handle condition removal via token HUD
Hooks.on('preDeleteActiveEffect', async (activeEffect, options, userId) => {
  // Only handle our condition marker effects
  if (!activeEffect.flags?.legends?.isConditionMarker) {
    return true; // Allow deletion of non-condition effects
  }

  const statusId = getFirstStatusId(activeEffect);
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
    if (!actor) return;
    await shields.syncShieldLinkedItemsForActor(actor);
  } catch (err) {
    console.warn('Legends | Error handling shield equip change', err);
  }
});

Hooks.on('deleteItem', async (item, options, userId) => {
  try {
    if (!item || item.type !== 'shield') return;

    const actor = item.actor;
    if (!actor) return;

    await shields.syncShieldLinkedItemsForActor(actor);
  } catch (err) {
    console.warn('Legends | Error handling shield removal', err);
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
    const { onRollComplete = null } = options;
    const normalizedSkillKey = normalizeSkillKey(skillKey) || skillKey;
    // Get skill value (prefer effective value computed from feats)
      const skillValue = getSkillValue(actor.system.skillsEffective || {}, normalizedSkillKey) || getSkillValue(actor.system.skills || {}, normalizedSkillKey);
      // Prefill any dice modifiers from feats
      let defaultModifier = 0;
      let defaultApplyToAttr = true;
      let defaultApplyToSkill = true;
      try {
        const featMods = featEffects.computeFeatModifiers(actor);
        const s = featMods.skillDiceModifiers?.[normalizedSkillKey] || featMods.skillDiceModifiers?.[skillKey];
        if (s) {
          defaultModifier = s.value || 0;
          defaultApplyToAttr = !!s.applyToAttr;
          defaultApplyToSkill = !!s.applyToSkill;
        }
      } catch (err) {
        // ignore
      }
    
    // Map skill keys to their governing attributes
    // Get the attribute key for this skill
    const attrKey = SKILL_ATTRIBUTE_KEYS[normalizedSkillKey];
    
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
    
    const resolvedSkillValue = typeof skillValue === 'object' ? skillValue.value ?? skillValue : skillValue;
    const rollData = {
      actor,
      skillKey: normalizedSkillKey,
      attrKey,
      attrValue: attr.value,
      skillValue: resolvedSkillValue,
      isAttack: false,
      isSave: false,
      modifier: defaultModifier,
      defaultApplyToAttr,
      defaultApplyToSkill,
      fortune: 0,
      misfortune: 0,
    };
    Hooks.call('preRollSkillCheck', rollData);

    // Show roll dialog instead of rolling immediately
    return dice.showSkillCheckDialog({
      actor,
      skillKey: normalizedSkillKey,
      attrValue: attr.value,
      skillValue: resolvedSkillValue,
      attrLabel: attr.label,
      skillLabel: game.i18n.localize(`D8.Skills.${normalizedSkillKey}`),
      defaultModifier: rollData.modifier || 0,
      defaultApplyToAttr: rollData.defaultApplyToAttr ?? defaultApplyToAttr,
      defaultApplyToSkill: rollData.defaultApplyToSkill ?? defaultApplyToSkill,
      defaultFortune: rollData.fortune || 0,
      defaultMisfortune: rollData.misfortune || 0,
      onRollComplete,
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
  
  // Normalize saveType to lowercase
  const normalizedSaveType = (saveType || '').toLowerCase();
  
  switch(normalizedSaveType) {
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
    default:
      console.error(`Legends | Unknown save type: ${saveType}`);;
      attrKey = 'constitution';
      attrLabel = 'Constitution';
      skillLabel = 'Fortitude Save';
      break;
  }
  
  const attr = actor.system.attributesEffective?.[attrKey] 
    ? { value: actor.system.attributesEffective[attrKey], label: actor.system.attributes[attrKey]?.label || attrLabel } 
    : actor.system.attributes?.[attrKey] || { value: 2, label: attrLabel };
  const luckCurrent = actor.system.luck?.current ?? actor.system.attributes?.luck?.value ?? 2;
  
  // Compute feat-derived save modifiers (if any)
  let defaultModifier = 0;
  try {
    const featMods = featEffects.computeFeatModifiers(actor);
    defaultModifier = featMods.saves?.[normalizedSaveType] ?? 0;
  } catch (err) {
    // ignore
  }

  // Call preRollSavingThrow hook to allow conditions and other effects to modify the roll
  const rollData = {
    actor,
    saveType: normalizedSaveType,
    attrKey,
    attrValue: attr.value,
    luckValue: luckCurrent,
    modifier: defaultModifier,
    defaultApplyToAttr: true,
    defaultApplyToSkill: true,
    fortune: 0,
    misfortune: 0,
    isSave: true,
    isAttack: false,
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
    saveType: normalizedSaveType,
    defaultModifier,
    defaultApplyToAttr: rollData.defaultApplyToAttr ?? true,
    defaultApplyToSkill: rollData.defaultApplyToSkill ?? true,
    defaultFortune: rollData.fortune || 0,
    defaultMisfortune: rollData.misfortune || 0,
  });
}

/**
 * Show saving throw dialog
 * @param {object} options - Dialog options
 */
async function showSavingThrowDialog(options) {
  const {
    actor,
    attrKey,
    attrValue,
    luckValue,
    attrLabel,
    skillLabel,
    saveType,
    defaultModifier = 0,
    defaultApplyToAttr = true,
    defaultApplyToSkill = true,
    defaultFortune = 0,
    defaultMisfortune = 0,
  } = options;

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
            <input type="checkbox" name="applyToAttr" ${defaultApplyToAttr ? 'checked' : ''}/>
            Apply to ${attrLabel} die
          </label>
        </div>
        <div class="form-group" style="margin-left: 20px;">
          <label>
            <input type="checkbox" name="applyToSkill" ${defaultApplyToSkill ? 'checked' : ''}/>
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

          if (defaultFortune > defaultMisfortune) {
            return await rollSavingThrowWithFortune(actor, saveType, attrKey, attrLabel, attrValue, luckValue, {
              modifier,
              applyToAttr,
              applyToSkill,
              isFortune: true
            });
          }

          if (defaultMisfortune > defaultFortune) {
            return await rollSavingThrowWithFortune(actor, saveType, attrKey, attrLabel, attrValue, luckValue, {
              modifier,
              applyToAttr,
              applyToSkill,
              isFortune: false
            });
          }
          
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
 * Roll a weave (spell) with two-roll system
 * Roll 1: Weaving (channeling quality) - provides bonuses
 * Roll 2: Targeting (effect delivery) - determines success
 * @param {Actor} actor - The actor casting the weave
 * @param {Item} weave - The weave item being cast
 */
export async function rollWeave(actor, weave) {
  // Get selected targets
  const targets = Array.from(game.user.targets);
  
  const primaryEnergy = resolveWeaveEnergyType(actor, weave.system.energyCost.primary.type);
  const supportingEnergy = resolveWeaveEnergyType(actor, weave.system.energyCost.supporting.type);
  
  const primaryPotential = actor.system.potentials[primaryEnergy].value;
  const primaryMastery = actor.system.mastery[primaryEnergy].value;

  await game.legends?.training?.markTrainingCheckbox?.(actor, 'mastery', primaryEnergy);
  
  let supportingPotential = 0;
  let supportingMastery = 0;
  
  if (supportingEnergy) {
    supportingPotential = actor.system.potentials[supportingEnergy].value;
    supportingMastery = actor.system.mastery[supportingEnergy].value;
    if (supportingEnergy !== primaryEnergy) {
      await game.legends?.training?.markTrainingCheckbox?.(actor, 'mastery', supportingEnergy);
    }
  }
  
  // ROLL 1: Weaving Check (channeling quality)
  const weavingResult = await dice.rollWeaveCheck({
    actor,
    weave,
    primaryEnergyType: primaryEnergy,
    supportingEnergyType: supportingEnergy,
    primaryPotential,
    primaryMastery,
    supportingPotential,
    supportingMastery
  });
  
  // Wait for dice roll message to post first
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check if weaving failed
  if (weavingResult.successes === 0) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="legends-weave-card failure">
          <h3><i class="fas fa-magic"></i> ${weave.name}</h3>
          <div class="weave-failure">
            <strong>Weave Failed!</strong> The energies slip from your grasp.
          </div>
        </div>
      `
    });
    return { weavingResult, targetingResult: null, weaveFailed: true };
  }
  
  // Determine casting stat
  const castingStat = actor.system.castingStat?.value || 'intelligence';
  const castingStatValue = actor.system.attributes[castingStat]?.value || 0;
  const castingStatLabel = castingStat.charAt(0).toUpperCase() + castingStat.slice(1);
  
  // ROLL 2: Targeting Check (effect delivery)
  // Only for hostile effects (weaves with saves, damage, or attack rolls)
  const hasSave = weave.system.savingThrow && weave.system.savingThrow.toLowerCase() !== 'none';
  const isDamage = weave.system.effectType === 'damage';
  const isAttack = weave.system.deliveryMethod === 'attack';
  const needsTargeting = hasSave || isDamage || isAttack || targets.length > 0;
  
  // Don't auto-roll targeting - let player spend luck on weaving first
  // Store weave data for manual targeting roll
  if (needsTargeting) {
    // Store targeting info in the last message for later use
    const messages = game.messages.contents;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      await lastMessage.update({
        flags: {
          'legends.weavingComplete': true,
          'legends.weaveData': {
            actorId: actor.id,
            weaveId: weave.id,
            castingStat: castingStatValue,
            castingStatLabel,
            primaryEnergyType: primaryEnergy,
            primaryMastery,
            weavingBonus: weavingResult.targetingBonus,
            targets: targets.map(t => t.id)
          }
        }
      });
    }
  }
  
  return { weavingResult, targetingResult: null, needsTargeting };
}

/**
 * Create chat card for a weave cast with targeting
 * @param {Object} options - Cast data
 */
async function createWeaveCastCard(options) {
  const { actor, weave, targets, weavingResult, targetingResult } = options;
  const speaker = ChatMessage.getSpeaker({ actor });
  
  // Build target list (for display)
  const targetList = targets.map(t => {
    return `
      <div class="weave-target">
        <div class="target-info">
          <strong>${t.name}</strong>
        </div>
      </div>
    `;
  }).join('');
  
  // Add save button or note for non-save weaves
  const savingThrow = weave.system.savingThrow;
  const hasSave = savingThrow && savingThrow.toLowerCase() !== 'none';
  const hasEffects = weave.system.appliesEffects?.length > 0;
  const isDamage = weave.system.effectType === 'damage' && weave.system.damage?.base > 0;
  
  // Check if all targets are GM-owned for batch processing hint
  const allGMOwned = targets.length > 1 && targets.every(t => {
    return t.actor?.isOwner && game.user.isGM;
  });
  const batchHint = allGMOwned ? ' (GM: will process all targets at once)' : '';
  
  // Use targeting successes (not weaving successes) for effects
  const effectiveSuccesses = targetingResult ? targetingResult.successes : weavingResult.successes;
  
  let actionButton = '';
  if (hasSave) {
    actionButton = `
      <div class="save-section">
        <p><em>Affected targets: Select your token and click below to make your save${batchHint}</em></p>
        <button class="save-button" 
                data-weave-message-id="{{MESSAGE_ID}}"
                data-caster-id="${actor.id}"
                data-weave-id="${weave.id}"
                data-caster-successes="${effectiveSuccesses}"
                data-save-type="${savingThrow.toLowerCase()}">
          <i class="fas fa-shield-alt"></i> Make ${savingThrow} Save
        </button>
      </div>
    `;
  } else if (isDamage) {
    // No save but deals damage - show apply damage button
    actionButton = `
      <div class="apply-section">
        <p><em>No save allowed. Affected targets: Select your token and click below to apply damage${batchHint}</em></p>
        <button class="apply-damage-button" 
                data-weave-message-id="{{MESSAGE_ID}}"
                data-caster-id="${actor.id}"
                data-weave-id="${weave.id}"
                data-caster-successes="${effectiveSuccesses}">
          <i class="fas fa-heart-broken"></i> Apply Damage
        </button>
      </div>
    `;
  } else if (!hasEffects) {
    // No save, no damage, and no effects - show generic apply button
    actionButton = `
      <div class="apply-section">
        <p><em>No save allowed. Affected targets: Select your token and click below to apply effect${batchHint}</em></p>
        <button class="apply-effect-button" 
                data-weave-message-id="{{MESSAGE_ID}}"
                data-caster-id="${actor.id}"
                data-weave-id="${weave.id}"
                data-caster-successes="${effectiveSuccesses}">
          <i class="fas fa-bolt"></i> Apply Effect
        </button>
      </div>
    `;
  }
  // If no save, no damage, but has effects, no button needed - just drag the effects
  
  // Calculate actual damage based on targeting successes
  let calculatedDamage = 0;
  if (weave.system.effectType === 'damage' && weave.system.damage?.base > 0) {
    const successes = effectiveSuccesses;
    // New system: Net 0 = resist, Net 1 = half, Net 2 = full, Net 3 = +8
    if (weave.system.damage.scaling && weave.system.damage.scaling[successes.toString()]) {
      calculatedDamage = weave.system.damage.scaling[successes.toString()].damage;
    } else {
      // Default scaling for attack weaves (no save)
      if (successes === 0) calculatedDamage = 0;
      else if (successes === 1) calculatedDamage = Math.floor(weave.system.damage.base / 2);
      else if (successes === 2) calculatedDamage = weave.system.damage.base;
      else if (successes >= 3) calculatedDamage = weave.system.damage.base + 8;
    }
  }
  
  // Build effect info - show calculated damage, not base
  const effectInfo = weave.system.effectType === 'damage' && weave.system.damage?.base > 0
    ? `<div class="weave-damage"><strong>Base Damage:</strong> ${weave.system.damage.base} ${weave.system.damage.type || 'untyped'}</div>
       <div class="weave-damage-calculated"><strong>Damage (${effectiveSuccesses} targeting success${effectiveSuccesses !== 1 ? 'es' : ''}):</strong> ${calculatedDamage} ${weave.system.damage.type || 'untyped'}</div>`
    : '';
  
  const successInfo = weave.system.targetingSuccessScaling
    ? `<div class="success-scaling"><strong>Targeting Success Scaling:</strong> ${weave.system.targetingSuccessScaling}</div>`
    : '';
  
  // Build draggable effects section - only show if success threshold is met
  // For save-based weaves, effects are applied automatically after saves, not dragged
  let effectsSection = '';
  if (weave.system.appliesEffects?.length > 0 && !hasSave) {
    // Check if effects should be shown based on success threshold
    let showEffects = false;
    const successes = effectiveSuccesses;
    
    // Check if this success level enables effects
    if (weave.system.damage?.scaling && weave.system.damage.scaling[successes.toString()]) {
      // Use structured scaling data if available
      showEffects = weave.system.damage.scaling[successes.toString()].appliesEffects === true;
    } else if (weave.system.targetingSuccessScaling) {
      // Parse the text-based scaling to determine effect threshold
      // Look for patterns like "3 = ... + applies [effect]" or "3 = ... + [effect]"
      const scalingText = weave.system.targetingSuccessScaling.toLowerCase();
      const lines = scalingText.split('\n').map(l => l.trim());
      
      // Find the minimum success level that mentions applying effects
      let effectThreshold = 0; // Default: always apply if not specified
      for (const line of lines) {
        // Match patterns like "- 3 = ... + applies" or "- 3 = ... + ignited"
        const match = line.match(/^-?\s*(\d+)\s*=.*\+\s*(applies|ignited|sickened|slowed|frightened|stunned|paralyzed|petrified|blinded|deafened|charmed|exhausted)/i);
        if (match) {
          const level = parseInt(match[1]);
          if (effectThreshold === 0 || level < effectThreshold) {
            effectThreshold = level;
          }
        }
      }
      
      // Show effects if we meet or exceed the threshold
      // If no threshold found in text and it's not a damage weave, show effects at all success levels
      if (effectThreshold > 0) {
        showEffects = successes >= effectThreshold;
      } else {
        // No damage weave or effect always applies
        showEffects = weave.system.effectType !== 'damage' || successes > 0;
      }
    } else {
      // If no scaling info at all, show effects for non-damage weaves
      showEffects = weave.system.effectType !== 'damage' || successes > 0;
    }
    
    if (showEffects) {
      const effectsList = weave.system.appliesEffects.map(effectRef => {
        const effectId = effectRef.effectId || effectRef.name;
        return `
          <div class="draggable-effect" 
               draggable="true"
               data-effect-id="${effectId}"
               data-caster-id="${actor.id}"
               data-weave-id="${weave.id}"
               data-caster-successes="${effectiveSuccesses}"
               data-params='${JSON.stringify(effectRef.params || {})}'>
            <i class="fas fa-magic"></i>
            <span>${effectId}</span>
            <em class="drag-hint">(drag to actor)</em>
          </div>
        `;
      }).join('');
      
      effectsSection = `
        <div class="weave-effects-list">
          <h4>Effects</h4>
          <p class="effects-help"><em>Drag effects onto character tokens or sheets to apply</em></p>
          ${effectsList}
        </div>
      `;
    }
  }
  
  const content = `
    <div class="legends-weave-card">
      <h3><i class="fas fa-magic"></i> ${weave.name}</h3>
      <div class="weave-info">
        <div class="weave-successes">
          <strong>Weaving Successes:</strong> ${weavingResult.successes} (bonus: ${weavingResult.targetingBonus || 0})<br/>
          ${targetingResult ? `<strong>Targeting Successes:</strong> ${targetingResult.successes}` : ''}
        </div>
        ${effectInfo}
        <div class="weave-effect"><strong>Effect:</strong> ${weave.system.effect || 'See weave description'}</div>
        ${successInfo}
      </div>
      ${effectsSection}
      <div class="weave-targets">
        <h4>Targets (${targets.length})</h4>
        ${targetList}
      </div>
      ${actionButton}
    </div>
  `;
  
  const message = await ChatMessage.create({
    speaker,
    content: content,
    flags: {
      'legends.weaveData': {
        casterId: actor.id,
        weaveId: weave.id,
        casterSuccesses: effectiveSuccesses, // Use targeting successes
        weavingSuccesses: weavingResult.successes,
        targetingSuccesses: targetingResult?.successes || 0,
        targets: targets.map(t => t.actor.id),
        savingThrow: weave.system.savingThrow,
        damage: weave.system.damage,
        effectType: weave.system.effectType,
        targetingSuccessScaling: weave.system.targetingSuccessScaling
      }
    }
  });
  
  // Replace {{MESSAGE_ID}} in the content
  await message.update({
    content: content.replace(/\{\{MESSAGE_ID\}\}/g, message.id)
  });
}

/**
 * Handle saving throw button click
 * @param {string} messageId - The weave message ID
 * @param {Object} weaveData - Weave data from the message flags
 */
export async function handleSaveClick(messageId, weaveData) {
  // Check if we should batch process (all targets owned by current user, typically GM)
  const targetIds = weaveData.targets || [];
  const targetActors = targetIds.map(id => game.actors.get(id)).filter(a => a);
  
  // Check if all targets are owned by the current user
  const allOwnedByUser = targetActors.length > 0 && targetActors.every(actor => {
    return actor.isOwner && game.user.isGM;
  });
  
  // If GM owns all targets, batch process them
  if (allOwnedByUser && targetActors.length > 1) {
    await handleBatchSave(messageId, weaveData, targetActors);
    return;
  }
  
  // Otherwise, single target mode - require token selection
  const controlled = canvas.tokens.controlled;
  if (controlled.length === 0) {
    ui.notifications.warn("Please select your token first!");
    return;
  }
  
  const defender = controlled[0].actor;
  if (!defender) {
    ui.notifications.error("Selected token has no actor!");
    return;
  }
  
  // Determine which save to make
  const saveType = weaveData.savingThrow;
  
  // Show save dialog and get result
  const result = await rollSavingThrow(defender, saveType);
  
  // If result is undefined/null, dialog was cancelled
  if (!result) return;
  
  // Apply the effect based on successes
  await calculateWeaveEffect(
    weaveData,
    messageId,
    result.successes,
    weaveData.casterSuccesses,
    defender.id
  );
}

/**
 * Handle batch processing of saves for multiple targets owned by GM
 * @param {string} messageId - The weave message ID
 * @param {Object} weaveData - Weave data from the message flags
 * @param {Actor[]} targetActors - Array of target actors
 */
async function handleBatchSave(messageId, weaveData, targetActors) {
  const saveType = weaveData.savingThrow;
  const results = [];
  
  // Roll saves for each target
  for (const defender of targetActors) {
    const result = await rollSavingThrow(defender, saveType);
    if (result) {
      results.push({
        actor: defender,
        successes: result.successes
      });
    }
  }
  
  // Process all results in one batch
  await calculateBatchWeaveEffect(
    weaveData,
    messageId,
    results,
    weaveData.casterSuccesses
  );
}

/**
 * Handle apply effect button click for weaves without saves
 * @param {string} messageId - The weave message ID
 * @param {Object} weaveData - Weave data from the message flags
 */
export async function handleApplyEffectClick(messageId, weaveData) {
  // Check if we should batch process (all targets owned by current user, typically GM)
  const targetIds = weaveData.targets || [];
  const targetActors = targetIds.map(id => game.actors.get(id)).filter(a => a);
  
  // Check if all targets are owned by the current user
  const allOwnedByUser = targetActors.length > 0 && targetActors.every(actor => {
    return actor.isOwner && game.user.isGM;
  });
  
  // If GM owns all targets, batch process them
  if (allOwnedByUser && targetActors.length > 1) {
    const results = targetActors.map(actor => ({
      actor: actor,
      successes: 0  // No save
    }));
    await calculateBatchWeaveEffect(weaveData, messageId, results, weaveData.casterSuccesses);
    return;
  }
  
  // Otherwise, single target mode
  const controlled = canvas.tokens.controlled;
  if (controlled.length === 0) {
    ui.notifications.warn("Please select your token first!");
    return;
  }
  
  const defender = controlled[0].actor;
  if (!defender) {
    ui.notifications.error("Selected token has no actor!");
    return;
  }
  
  // No save, so defender gets 0 successes (full effect)
  await calculateWeaveEffect(
    weaveData,
    messageId,
    0, // No save successes
    weaveData.casterSuccesses,
    defender.id
  );
}

/**
 * Handle apply damage button click for damage weaves without saves
 * @param {string} messageId - The weave message ID
 * @param {Object} weaveData - Weave data from the message flags
 */
export async function handleApplyDamageClick(messageId, weaveData) {
  // Check if we should batch process (all targets owned by current user, typically GM)
  const targetIds = weaveData.targets || [];
  const targetActors = targetIds.map(id => game.actors.get(id)).filter(a => a);
  
  // Check if all targets are owned by the current user
  const allOwnedByUser = targetActors.length > 0 && targetActors.every(actor => {
    return actor.isOwner && game.user.isGM;
  });
  
  // If GM owns all targets, batch process them
  if (allOwnedByUser && targetActors.length > 1) {
    const results = targetActors.map(actor => ({
      actor: actor,
      successes: 0  // No save
    }));
    await calculateBatchWeaveEffect(weaveData, messageId, results, weaveData.casterSuccesses);
    return;
  }
  
  // Otherwise, single target mode
  const controlled = canvas.tokens.controlled;
  if (controlled.length === 0) {
    ui.notifications.warn("Please select your token first!");
    return;
  }
  
  const defender = controlled[0].actor;
  if (!defender) {
    ui.notifications.error("Selected token has no actor!");
    return;
  }
  
  // Get the original message to access flags
  const message = game.messages.get(messageId);
  if (!message) {
    ui.notifications.error("Original weave message not found!");
    return;
  }
  
  const messageWeaveData = message.flags?.legends?.weaveData;
  if (!messageWeaveData) {
    ui.notifications.error("Weave data not found in message!");
    return;
  }
  
  const casterSuccesses = weaveData.casterSuccesses;
  const damage = messageWeaveData.damage;
  
  // Calculate damage based on targeting successes (for attack weaves with no save)
  // Net 0 = miss, Net 1 = half, Net 2 = full, Net 3 = +8
  let damageAmount = 0;
  if (damage && damage.scaling) {
    const scalingEntry = damage.scaling[casterSuccesses.toString()];
    if (scalingEntry) {
      damageAmount = scalingEntry.damage;
    } else {
      // Fallback to new system defaults
      if (casterSuccesses === 0) damageAmount = 0;
      else if (casterSuccesses === 1) damageAmount = Math.floor(damage.base / 2);
      else if (casterSuccesses === 2) damageAmount = damage.base;
      else if (casterSuccesses >= 3) damageAmount = damage.base + 8;
    }
  } else {
    // Use new system defaults
    if (casterSuccesses === 0) damageAmount = 0;
    else if (casterSuccesses === 1) damageAmount = Math.floor(damage.base / 2);
    else if (casterSuccesses === 2) damageAmount = damage.base;
    else if (casterSuccesses >= 3) damageAmount = damage.base + 8;
  }
  
  if (damageAmount > 0) {
    await applyWeaveDamage(damageAmount, damage.type, damage.drInteraction);
    
    // Create result message
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: defender }),
      content: `
        <div class="legends-weave-result">
          <h3><i class="fas fa-magic"></i> Damage Applied</h3>
          <div class="effect-result">
            <strong>Weaving Successes:</strong> ${casterSuccesses}<br/>
            <strong>Damage:</strong> ${damageAmount} ${damage.type}
          </div>
        </div>
      `
    });
  } else {
    ui.notifications.info(`No damage applied - insufficient successes (${casterSuccesses})`);
  }
}

/**
 * Calculate weave effect for multiple targets (batch processing)
 * @param {Object} weaveData - Weave data
 * @param {string} weaveMessageId - The weave message ID
 * @param {Array} results - Array of {actor, successes} objects
 * @param {number} casterSuccesses - Caster's successes
 */
async function calculateBatchWeaveEffect(weaveData, weaveMessageId, results, casterSuccesses) {
  const caster = game.actors.get(weaveData.casterId);
  const weave = caster?.items.get(weaveData.weaveId);
  
  if (!caster || !weave) {
    ui.notifications.error("Unable to calculate weave effect - missing data");
    return;
  }
  
  const targetResults = [];
  
  // Process each target
  for (const result of results) {
    const defender = result.actor;
    const saveSuccesses = result.successes;
    const netSuccesses = casterSuccesses - saveSuccesses;
    const margin = Math.max(0, netSuccesses);
    
    let effectDescription = '';
    let damageAmount = 0;
    let appliedEffects = [];
    
    // Determine effect based on type and net successes
    if (weaveData.effectType === 'damage' && weaveData.damage?.base > 0) {
      // New system: Net 0 = resist, Net 1 = half, Net 2 = full, Net 3 = +8
      if (margin === 0) {
        effectDescription = 'Resisted!';
        damageAmount = 0;
      } else if (margin === 1) {
        damageAmount = Math.floor(weaveData.damage.base / 2);
        effectDescription = `${damageAmount} ${weaveData.damage.type} (reduced)`;
      } else if (margin === 2) {
        damageAmount = weaveData.damage.base;
        effectDescription = `${damageAmount} ${weaveData.damage.type}`;
      } else if (margin >= 3) {
        damageAmount = weaveData.damage.base + 8;
        effectDescription = `${damageAmount} ${weaveData.damage.type} (enhanced!)`;
      }
    } else {
      if (margin === 0) {
        effectDescription = 'Resisted!';
      } else {
        effectDescription = `Affected (${margin} net)`;
      }
    }
    
    // Apply effects automatically if conditions are met
    // Check if effects should apply based on success scaling
    let shouldApplyEffects = false;
    
    if (margin > 0 && weave.system.appliesEffects && weave.system.appliesEffects.length > 0) {
      // Check if there's a scaling table with entries
      const hasScalingEntries = weave.system.damage?.scaling && Object.keys(weave.system.damage.scaling).length > 0;
      
      if (hasScalingEntries) {
        // For damage weaves with scaling tables, check if this success level enables effects
        const scalingEntry = weave.system.damage.scaling[casterSuccesses.toString()];
        shouldApplyEffects = scalingEntry?.appliesEffects === true;
      } else {
        // For non-damage weaves or weaves without scaling, apply effects if margin > 0
        shouldApplyEffects = true;
      }
    }
    
    if (shouldApplyEffects) {
      for (const effectRef of weave.system.appliesEffects) {
        try {
          const appliedEffect = await effectEngine.applyEffect({
            target: defender,
            effect: effectRef.effectId,
            origin: {
              casterId: caster.id,
              weaveId: weave.id,
              weaveName: weave.name,
              successes: casterSuccesses,
              potential: getWeavePotentialValue(caster, weave)
            },
            params: effectRef.params || {},
            netSuccesses: margin
          });
          
          if (appliedEffect) {
            appliedEffects.push(appliedEffect.name);
          }
        } catch (err) {
          console.error(`Failed to apply effect ${effectRef.effectId} to ${defender.name}:`, err);
        }
      }
    }
    
    targetResults.push({
      name: defender.name,
      saveSuccesses,
      netSuccesses: margin,
      effectDescription,
      damageAmount,
      damageType: weaveData.damage?.type,
      appliedEffects
    });
  }
  
  // Create consolidated result card
  const targetRows = targetResults.map(tr => `
    <tr class="${tr.netSuccesses === 0 ? 'resisted' : tr.netSuccesses >= 3 ? 'critical' : ''}">
      <td><strong>${tr.name}</strong></td>
      <td>${tr.saveSuccesses}</td>
      <td>${tr.netSuccesses}</td>
      <td>${tr.effectDescription}</td>
      ${tr.appliedEffects.length > 0 ? `<td>${tr.appliedEffects.join(', ')}</td>` : '<td>—</td>'}
    </tr>
  `).join('');
  
  const content = `
    <div class="legends-weave-result batch">
      <h3><i class="fas fa-magic"></i> ${weave.name} - Batch Results</h3>
      <div class="batch-summary">
        <strong>Caster:</strong> ${caster.name} (${casterSuccesses} successes)<br/>
        <strong>Targets:</strong> ${targetResults.length}
      </div>
      <table class="weave-batch-results">
        <thead>
          <tr>
            <th>Target</th>
            <th>Save</th>
            <th>Net</th>
            <th>Result</th>
            <th>Effects</th>
          </tr>
        </thead>
        <tbody>
          ${targetRows}
        </tbody>
      </table>
      ${weaveData.effectType === 'damage' && weaveData.damage?.base > 0 ? `
        <p class="damage-note"><em>Each target: Select token and use "Apply Damage" button in your character sheet or manually apply damage shown above.</em></p>
      ` : ''}
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: caster }),
    content: content
  });
}

/**
 * Calculate weave effect based on net successes
 * @param {Object} weaveData - Weave data
 * @param {string} weaveMessageId - The weave message ID
 * @param {number} saveSuccesses - Defender's successes
 * @param {number} casterSuccesses - Caster's successes
 */
async function calculateWeaveEffect(weaveData, weaveMessageId, saveSuccesses, casterSuccesses, defenderId) {
  const caster = game.actors.get(weaveData.casterId);
  const defender = game.actors.get(defenderId);
  const weave = caster?.items.get(weaveData.weaveId);
  
  if (!caster || !defender || !weave) {
    ui.notifications.error("Unable to calculate weave effect - missing data");
    return;
  }
  
  const netSuccesses = casterSuccesses - saveSuccesses;
  const margin = Math.max(0, netSuccesses);
  
  let effectDescription = '';
  let damageAmount = 0;
  let appliedEffects = [];
  
  // Determine effect based on type and net successes
  if (weaveData.effectType === 'damage' && weaveData.damage?.base > 0) {
    // New system: Net 0 = resist, Net 1 = half, Net 2 = full, Net 3 = +8
    if (margin === 0) {
      effectDescription = `${defender.name} resisted the weave! No effect.`;
      damageAmount = 0;
    } else if (margin === 1) {
      // Reduced damage (half)
      damageAmount = Math.floor(weaveData.damage.base / 2);
      effectDescription = `${defender.name}: ${damageAmount} ${weaveData.damage.type} damage (reduced)`;
    } else if (margin === 2) {
      // Full damage
      damageAmount = weaveData.damage.base;
      effectDescription = `${defender.name}: ${damageAmount} ${weaveData.damage.type} damage`;
    } else if (margin >= 3) {
      // Enhanced damage (+8)
      damageAmount = weaveData.damage.base + 8;
      effectDescription = `${defender.name}: ${damageAmount} ${weaveData.damage.type} damage (enhanced!)`;
    }
  } else {
    // Non-damage effect
    if (margin === 0) {
      effectDescription = `${defender.name} resisted the weave!`;
    } else {
      effectDescription = `${defender.name} is affected! Net successes: ${margin}`;
    }
  }
  
  // Apply effects automatically if conditions are met
  // Check if effects should apply based on success scaling
  let shouldApplyEffects = false;
  
  console.log('Legends | Effect Application Check:', {
    margin,
    hasAppliesEffects: weave.system.appliesEffects?.length > 0,
    appliesEffects: weave.system.appliesEffects,
    damageScaling: weave.system.damage?.scaling,
    scalingKeys: weave.system.damage?.scaling ? Object.keys(weave.system.damage.scaling) : []
  });
  
  if (margin > 0 && weave.system.appliesEffects && weave.system.appliesEffects.length > 0) {
    // Check if there's a scaling table with entries
    const hasScalingEntries = weave.system.damage?.scaling && Object.keys(weave.system.damage.scaling).length > 0;
    
    console.log('Legends | hasScalingEntries:', hasScalingEntries);
    
    if (hasScalingEntries) {
      // For damage weaves with scaling tables, check if this success level enables effects
      const scalingEntry = weave.system.damage.scaling[casterSuccesses.toString()];
      shouldApplyEffects = scalingEntry?.appliesEffects === true;
      console.log('Legends | Damage weave - scalingEntry at', casterSuccesses, ':', scalingEntry, 'shouldApply:', shouldApplyEffects);
    } else {
      // For non-damage weaves or weaves without scaling, apply effects if margin > 0
      shouldApplyEffects = true;
      console.log('Legends | Effect weave - shouldApply:', shouldApplyEffects);
    }
  }
  
  console.log('Legends | Final shouldApplyEffects:', shouldApplyEffects);
  
  const effectsToApply = shouldApplyEffects ? weave.system.appliesEffects : [];
  
  console.log('Legends | effectsToApply:', effectsToApply);
  
  if (effectsToApply.length > 0) {
    console.log('Legends | Applying', effectsToApply.length, 'effects...');
    for (const effectRef of effectsToApply) {
      console.log('Legends | Attempting to apply effect:', effectRef);
      try {
        const appliedEffect = await effectEngine.applyEffect({
          target: defender,
          effect: effectRef.effectId,
          origin: {
            casterId: caster.id,
            weaveId: weave.id,
            weaveName: weave.name,
            successes: casterSuccesses,
            potential: getWeavePotentialValue(caster, weave)
          },
          params: effectRef.params || {},
          netSuccesses: margin
        });
        
        console.log('Legends | Applied effect result:', appliedEffect);
        
        if (appliedEffect) {
          appliedEffects.push(appliedEffect.name);
        }
      } catch (err) {
        console.error(`Failed to apply effect ${effectRef.effectId}:`, err);
        ui.notifications.warn(`Could not auto-apply ${effectRef.effectId} - use manual fallback below`);
      }
    }
  }
  
  // Build fallback draggable effects if any failed to apply
  let fallbackEffects = '';
  if (margin > 0 && effectsToApply.length > 0 && appliedEffects.length < effectsToApply.length) {
    const failedEffects = effectsToApply.filter(ref => {
      return !appliedEffects.some(name => name.toLowerCase().includes(ref.effectId.toLowerCase()));
    });
    
    if (failedEffects.length > 0) {
      const effectsList = failedEffects.map(effectRef => {
        const effectId = effectRef.effectId || effectRef.name;
        return `
          <div class="draggable-effect" 
               draggable="true"
               data-effect-id="${effectId}"
               data-caster-id="${caster.id}"
               data-weave-id="${weave.id}"
               data-caster-successes="${casterSuccesses}"
               data-params='${JSON.stringify(effectRef.params || {})}'>
            <i class="fas fa-magic"></i>
            <span>${effectId}</span>
            <em class="drag-hint">(drag to actor)</em>
          </div>
        `;
      }).join('');
      
      fallbackEffects = `
        <div class="weave-effects-list">
          <h4>Manual Effect Application</h4>
          <p class="effects-help"><em>Some effects failed to auto-apply. Drag them onto the character token or sheet:</em></p>
          ${effectsList}
        </div>
      `;
    }
  }
  
  // Create result card
  const content = `
    <div class="legends-weave-result">
      <h3><i class="fas fa-magic"></i> Weave Result</h3>
      <div class="result-comparison">
        <div class="caster-result">
          <strong>Caster:</strong> ${caster.name}<br/>
          <strong>Weaving Successes:</strong> ${casterSuccesses}
        </div>
        <div class="defender-result">
          <strong>Target:</strong> ${defender.name}<br/>
          <strong>Save Successes:</strong> ${saveSuccesses}
        </div>
        <div class="margin">
          <strong>Net Successes:</strong> ${margin}
        </div>
      </div>
      <div class="effect-result">
        <strong>Result:</strong> ${effectDescription}
      </div>
      ${appliedEffects.length > 0 ? `
        <div class="applied-effects">
          <strong>Effects Applied:</strong>
          <ul>
            ${appliedEffects.map(e => `<li>${e}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${fallbackEffects}
      ${damageAmount > 0 ? `
        <div class="damage-buttons">
          <p><em>${defender.name}: Select your token and click below to apply damage</em></p>
          <button class="apply-weave-damage-btn" 
                  data-damage="${damageAmount}"
                  data-damage-type="${weaveData.damage.type}">
            <i class="fas fa-heart-broken"></i> Apply ${damageAmount} ${weaveData.damage.type} Damage
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: caster }),
    content: content
  });
}

/**
 * Apply weave damage to the currently selected token
 * @param {number} damage - The damage amount
 * @param {string} damageType - The damage type
 * @param {string} drInteraction - How DR applies: 'half' for energy, 'full' for physical
 */
export async function applyWeaveDamage(damage, damageType, drInteraction = 'half') {
  // Get the currently selected token
  const controlled = canvas.tokens.controlled;
  if (controlled.length === 0) {
    ui.notifications.warn("Please select your token first!");
    return;
  }
  
  const target = controlled[0].actor;
  if (!target) {
    ui.notifications.error("Selected token has no actor!");
    return;
  }
  
  if (!target.isOwner && !game.user.isGM) {
    ui.notifications.warn("You don't have permission to modify this actor's HP!");
    return;
  }
  
  const currentHP = target.system.hp.value;
  
  // Calculate effective DR based on damage type and DR interaction
  let dr = 0;
  const physicalTypes = ['slashing', 'piercing', 'bludgeoning'];
  
  if (physicalTypes.includes(damageType.toLowerCase())) {
    // Physical damage: use specific DR type
    if (drInteraction === 'full') {
      // Full DR applies (e.g., Hailstorm)
      dr = target.system.dr?.[damageType.toLowerCase()] || 0;
    } else {
      // Half DR applies (unusual for physical, but possible)
      const baseDR = target.system.dr?.[damageType.toLowerCase()] || 0;
      dr = Math.floor(baseDR / 2);
    }
  } else {
    // Energy damage: use half of total DR by default
    const baseDR = target.system.dr?.total || 0;
    if (drInteraction === 'full') {
      // Full DR applies (unusual for energy)
      dr = baseDR;
    } else {
      // Half DR applies (standard for energy)
      dr = Math.floor(baseDR / 2);
    }
  }
  
  const finalDamage = Math.max(0, damage - dr);
  const newHP = Math.max(0, currentHP - finalDamage);
  
  await target.update({ 'system.hp.value': newHP });
  
  ui.notifications.info(
    `${target.name} takes ${finalDamage} ${damageType} damage${dr > 0 ? ` (${damage} - ${dr} DR)` : ''}`
  );
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: target }),
    content: `
      <div class="legends-damage-applied">
        <i class="fas fa-heart-broken"></i> <strong>${target.name}</strong> took ${finalDamage} ${damageType} damage!
        ${dr > 0 ? `<br/><small>(${damage} damage - ${dr} DR = ${finalDamage} applied)</small>` : ''}
      </div>
    `
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
function normalizeRecoverySourceData(options = {}) {
  const source = options.recoverySource;
  const fallbackActor = options.sourceActor;
  const fallbackToken = options.sourceToken;
  const fallbackSuccesses = options.sourceSuccesses;

  const actorId = source?.actorId || source?.actor?.id || fallbackActor?.id || '';
  const tokenId = source?.tokenId || source?.token?.id || fallbackToken?.id || '';
  const label = source?.label || source?.actor?.name || fallbackActor?.name || '';
  const successesValue = source?.successes ?? fallbackSuccesses;
  const parsedSuccesses = Number.parseInt(successesValue, 10);
  const successes = Number.isFinite(parsedSuccesses) ? parsedSuccesses : null;

  if (!actorId && !tokenId && !label && successes === null) {
    return null;
  }

  return {
    actorId,
    tokenId,
    label,
    successes,
  };
}

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
    const recoverySource = normalizeRecoverySourceData(options);
    if (options.duration) {
      conditionData.system.duration = options.duration;
    }
    if (options.source) {
      conditionData.flags = conditionData.flags || {};
      conditionData.flags.legends = conditionData.flags.legends || {};
      conditionData.flags.legends.source = options.source;
    }
    if (recoverySource) {
      conditionData.flags = conditionData.flags || {};
      conditionData.flags.legends = conditionData.flags.legends || {};
      conditionData.flags.legends.recoverySource = recoverySource;
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
          source: condition.name,
          recoverySource,
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
  
  const command = `game.legends.rollItemMacro(${JSON.stringify(item.name)});`;
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

async function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  const actor = game.actors.get(speaker.actor) || game.user.character;

  if (!actor) {
    return ui.notifications.warn('No actor available for this macro.');
  }

  const item = actor.items.find(candidate => candidate.name === itemName);
  if (!item) {
    return ui.notifications.warn(`${actor.name} does not have an item named ${itemName}.`);
  }

  return item.roll();
}
