/**
 * Effect Engine for Legends System
 * Handles application of effect items to actors with parameterized values
 */

import { processRecoveryPrompt, promptForSave } from './condition-engine.mjs';

const ROUND_CONVERSION = {
  rounds: 1,
  minutes: 10,
  hours: 600,
};

function normalizeEffectTrigger(trigger) {
  return trigger === 'turnStart' ? 'startOfTurn' : trigger === 'turnEnd' ? 'endOfTurn' : trigger;
}

function coerceEffectValue(value, currentValue) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value;
  }

  const stringValue = String(value ?? '').trim();
  if (!stringValue) {
    return stringValue;
  }

  if (stringValue === 'true') return true;
  if (stringValue === 'false') return false;

  const numericValue = Number(stringValue);
  if (!Number.isNaN(numericValue) && stringValue !== '') {
    return numericValue;
  }

  if (typeof currentValue === 'boolean') {
    return stringValue.toLowerCase() === 'true';
  }

  return stringValue;
}

function convertDurationToRounds(duration = {}) {
  if (!duration || typeof duration !== 'object') {
    return null;
  }

  const value = Number(duration.value);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const factor = ROUND_CONVERSION[duration.type] ?? null;
  if (!factor) {
    return null;
  }

  return Math.max(1, Math.floor(value * factor));
}

function buildDurationState(duration = {}) {
  if (!duration || typeof duration !== 'object') {
    return null;
  }

  const remainingRounds = convertDurationToRounds(duration);
  if (!Number.isFinite(remainingRounds)) {
    return null;
  }

  return {
    remainingRounds,
    totalRounds: remainingRounds,
  };
}

function getStoredDurationState(effect) {
  const state = effect?.flags?.legends?.durationState;
  if (!state || typeof state !== 'object') {
    return null;
  }

  const remainingRounds = Number(state.remainingRounds);
  const totalRounds = Number(state.totalRounds);
  if (!Number.isFinite(remainingRounds) || !Number.isFinite(totalRounds)) {
    return null;
  }

  return {
    remainingRounds,
    totalRounds,
  };
}

async function ensureDurationState(effect) {
  const existingState = getStoredDurationState(effect);
  if (existingState) {
    return existingState;
  }

  const state = buildDurationState(effect?.system?.duration);
  if (!state) {
    return null;
  }

  await effect.update({
    'flags.legends.durationState': state,
  });

  return state;
}

function shouldAdvanceDuration(duration = {}, trigger) {
  if (!duration || typeof duration !== 'object') {
    return false;
  }

  const normalizedTrigger = normalizeEffectTrigger(trigger);
  const normalizedExpireOn = normalizeEffectTrigger(duration.expireOn);

  if (normalizedExpireOn === 'sustained') {
    return normalizedTrigger === 'endOfTurn';
  }

  return normalizedExpireOn === normalizedTrigger;
}

async function executeExpireAction(actor, effect, action) {
  const normalizedAction = String(action || '').trim();
  if (!normalizedAction) {
    return;
  }

  if (normalizedAction.startsWith('applyCondition:')) {
    const conditionName = normalizedAction.split(':')[1]?.trim();
    if (conditionName) {
      await game.legends.applyCondition(actor, conditionName, {
        source: effect.name,
      });
    }
    return;
  }

  if (normalizedAction.startsWith('applyEffect:')) {
    const effectName = normalizedAction.split(':')[1]?.trim();
    if (effectName) {
      await applyEffect({
        target: actor,
        effect: effectName,
        origin: {
          type: 'effect-expire',
          label: effect.name,
          actorId: effect.system?.origin?.actor || '',
          successes: effect.system?.origin?.successes || 0,
        },
      });
    }
  }
}

function getActivityExpireModes(activityType) {
  switch (activityType) {
    case 'cast-weave':
      return new Set(['cast-weave', 'combat-action']);
    case 'combat-action':
      return new Set(['combat-action']);
    default:
      return new Set([activityType]);
  }
}

function buildRecoverySourceFromOrigin(origin = {}) {
  const actorId = origin.actorId || origin.actor?.id || origin.actor || origin.casterId || '';
  const tokenId = origin.tokenId || origin.token?.id || origin.token || '';
  const sourceActor = actorId ? game.actors?.get(actorId) : null;
  const successesValue = origin.successes;
  const parsedSuccesses = Number.parseInt(successesValue, 10);
  const successes = Number.isFinite(parsedSuccesses) ? parsedSuccesses : null;

  if (!actorId && !tokenId && successes === null) {
    return null;
  }

  return {
    actorId,
    tokenId,
    label: sourceActor?.name || origin.label || origin.weaveName || origin.type || '',
    successes,
  };
}

/**
 * Apply an effect to a target actor
 * @param {Object} options - Effect application options
 * @param {Actor} options.target - Target actor
 * @param {string|Item} options.effect - Effect item or ID
 * @param {Object} options.origin - Origin data (caster, weave, successes)
 * @param {Object} options.params - Parameters to pass to effect (value, etc.)
 * @param {number} options.netSuccesses - Net successes for duration scaling
 * @returns {Promise<Item|null>} The created effect item on the actor
 */
export async function applyEffect(options) {
  const { target, effect, origin = {}, params = {}, netSuccesses = 0 } = options;
  
  if (!target) {
    console.error('Legends | applyEffect: No target provided');
    return null;
  }
  
  // Load effect template if ID provided
  let effectData;
  if (typeof effect === 'string') {
    effectData = await loadEffectTemplate(effect);
    if (!effectData) {
      console.error(`Legends | applyEffect: Could not find effect ${effect}`);
      return null;
    }
  } else if (effect instanceof Item) {
    effectData = effect.toObject();
  } else {
    effectData = effect;
  }
  
  // Clone effect data for modification
  const effectInstance = foundry.utils.duplicate(effectData);
  
  // Set origin data
  effectInstance.system.origin = {
    type: origin.type || 'weave',
    id: origin.id || '',
    actor: origin.actor || origin.actorId || origin.casterId || '',
    successes: origin.successes || 0
  };
  
  // Evaluate parameterized formulas
  const context = {
    value: params.value || 0,
    netSuccesses: netSuccesses,
    origin: effectInstance.system.origin
  };
  
  // Evaluate valueFormula if present
  if (effectInstance.system.parameterized?.valueFormula) {
    try {
      const evaluatedValue = evaluateFormula(effectInstance.system.parameterized.valueFormula, context);
      // Apply evaluated value to activeEffects
      for (const ae of effectInstance.system.activeEffects) {
        if (ae.value && typeof ae.value === 'string' && ae.value.includes('${')) {
          ae.value = String(evaluatedValue);
        }
      }
      // Update badge
      if (effectInstance.system.badge?.type === 'value') {
        effectInstance.system.badge.value = evaluatedValue;
      }
    } catch (err) {
      console.warn(`Legends | applyEffect: Error evaluating valueFormula`, err);
    }
  }
  
  // Evaluate durationFormula if present
  if (effectInstance.system.parameterized?.durationFormula) {
    try {
      const evaluatedDuration = evaluateFormula(effectInstance.system.parameterized.durationFormula, context);
      effectInstance.system.duration.value = evaluatedDuration;
    } catch (err) {
      console.warn(`Legends | applyEffect: Error evaluating durationFormula`, err);
    }
  } else if (effectInstance.system.duration?.scaling === 'netSuccesses') {
    // Apply standard netSuccesses scaling pattern
    effectInstance.system.duration.value = calculateDurationFromNetSuccesses(netSuccesses, effectInstance.system.duration.type);
  } else if (!effectInstance.system.duration && netSuccesses > 0) {
    // If no duration field exists (e.g., conditions), add one based on netSuccesses
    effectInstance.system.duration = {
      type: 'rounds',
      value: calculateDurationFromNetSuccesses(netSuccesses, 'rounds'),
      base: calculateDurationFromNetSuccesses(netSuccesses, 'rounds'),
      scaling: 'netSuccesses',
      expireOn: 'turnEnd',
      sustaining: false
    };
  }

  effectInstance.flags = effectInstance.flags || {};
  effectInstance.flags.legends = effectInstance.flags.legends || {};
  const durationState = buildDurationState(effectInstance.system.duration);
  if (durationState) {
    effectInstance.flags.legends.durationState = durationState;
  }
  
  // Update badge for counter type
  const badgeValue = durationState?.remainingRounds ?? effectInstance.system.duration?.value;
  if (effectInstance.system.badge?.type === 'counter' && Number.isFinite(badgeValue)) {
    effectInstance.system.badge.value = badgeValue;
    effectInstance.system.badge.max = durationState?.totalRounds ?? badgeValue;
  } else if (effectInstance.system.duration && !effectInstance.system.badge && Number.isFinite(badgeValue)) {
    // Add a counter badge for conditions with duration
    effectInstance.system.badge = {
      type: 'counter',
      value: badgeValue,
      max: durationState?.totalRounds ?? badgeValue
    };
  }
  
  // Set granted by
  if (origin.weaveName) {
    effectInstance.system.grantedBy = origin.weaveName;
  }

  if (effectInstance.type === 'condition') {
    return game.legends.applyCondition(target, effectInstance.name, {
      duration: effectInstance.system.duration,
      source: origin.weaveName || origin.label || origin.type || 'effect',
      recoverySource: buildRecoverySourceFromOrigin(origin),
    });
  }
  
  // Create the effect on the target actor
  const [createdEffect] = await target.createEmbeddedDocuments('Item', [effectInstance]);
  
  // Apply active effects to actor
  if (createdEffect) {
    await applyActiveEffects(target, createdEffect);
    await applyLinkedConditions(target, createdEffect);
    
    ui.notifications.info(`${target.name} gains ${effectInstance.name}`);
  }
  
  return createdEffect;
}

/**
 * Load an effect template from compendium
 * @param {string} effectId - Effect ID or name
 * @returns {Promise<Object|null>} Effect data
 */
async function loadEffectTemplate(effectId) {
  // Normalize the search term for flexible matching
  const normalizeString = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };
  const normalizedSearch = normalizeString(effectId);
  
  // Try to find in effects compendium first
  let pack = game.packs.get('legends.effects');
  if (pack) {
    // Try by ID first
    let effect = await pack.getDocument(effectId);
    
    // Try by name if not found
    if (!effect) {
      const index = await pack.getIndex();
      const entry = index.find(e => {
        return e.name === effectId || 
               e.name.toLowerCase() === effectId.toLowerCase() ||
               normalizeString(e.name) === normalizedSearch;
      });
      if (entry) {
        effect = await pack.getDocument(entry._id);
      }
    }
    
    if (effect) {
      return effect.toObject();
    }
  }
  
  // Fallback: try conditions compendium
  pack = game.packs.get('legends.conditions');
  if (pack) {
    // Try by ID first
    let effect = await pack.getDocument(effectId);
    
    // Try by name if not found
    if (!effect) {
      const index = await pack.getIndex();
      const entry = index.find(e => {
        return e.name === effectId || 
               e.name.toLowerCase() === effectId.toLowerCase() ||
               normalizeString(e.name) === normalizedSearch;
      });
      if (entry) {
        effect = await pack.getDocument(entry._id);
      }
    }
    
    if (effect) {
      return effect.toObject();
    }
  }
  
  console.error(`Legends | loadEffectTemplate: effect/condition "${effectId}" not found in compendiums`);
  return null;
}

/**
 * Evaluate a parameterized formula
 * @param {string} formula - Formula string with ${variable} syntax
 * @param {Object} context - Variable context
 * @returns {number} Evaluated result
 */
function evaluateFormula(formula, context) {
  // Replace ${variable} with context values
  let processedFormula = formula;
  
  // Handle ${value}
  if (context.value !== undefined) {
    processedFormula = processedFormula.replace(/\$\{value\}/g, context.value);
  }
  
  // Handle ${netSuccesses}
  if (context.netSuccesses !== undefined) {
    processedFormula = processedFormula.replace(/\$\{netSuccesses\}/g, context.netSuccesses);
  }
  
  // Handle ${origin.successes}
  if (context.origin?.successes !== undefined) {
    processedFormula = processedFormula.replace(/\$\{origin\.successes\}/g, context.origin.successes);
  }
  
  // Handle ${origin.potential}
  if (context.origin?.potential !== undefined) {
    processedFormula = processedFormula.replace(/\$\{origin\.potential\}/g, context.origin.potential);
  }
  
  // Evaluate the formula safely
  try {
    // Use Function constructor for safe evaluation (better than eval)
    const fn = new Function(`return ${processedFormula}`);
    return fn();
  } catch (err) {
    console.error('Legends | evaluateFormula: Error evaluating formula', processedFormula, err);
    return 0;
  }
}

/**
 * Calculate duration from net successes using standard pattern
 * @param {number} netSuccesses - Net successes
 * @param {string} durationType - Duration type (rounds, minutes, hours)
 * @returns {number} Duration in the specified type
 */
function calculateDurationFromNetSuccesses(netSuccesses, durationType) {
  // Standard pattern: 1=1 round, 2=1 min, 3=10 min, 4=1 hour
  // Convert to rounds for internal tracking
  let rounds;
  
  switch (netSuccesses) {
    case 0:
    case 1:
      rounds = 1; // 1 round
      break;
    case 2:
      rounds = 10; // 1 minute = 10 rounds
      break;
    case 3:
      rounds = 100; // 10 minutes = 100 rounds
      break;
    case 4:
    default:
      rounds = 600; // 1 hour = 600 rounds
      break;
  }
  
  // Convert to requested type
  switch (durationType) {
    case 'rounds':
      return rounds;
    case 'minutes':
      return Math.floor(rounds / 10);
    case 'hours':
      return Math.floor(rounds / 600);
    default:
      return rounds;
  }
}

/**
 * Apply active effects from an effect item to an actor
 * @param {Actor} actor - Target actor
 * @param {Item} effectItem - Effect item with activeEffects
 */
async function applyActiveEffects(actor, effectItem) {
  const activeEffects = effectItem.system.activeEffects || [];
  const originalValues = {};
  
  for (const effectData of activeEffects) {
    const { key, mode, value } = effectData;
    
    // Map semantic keys to actor data paths
    const dataPath = mapSemanticKey(key);
    if (!dataPath) {
      console.warn(`Legends | applyActiveEffects: Unknown semantic key ${key}`);
      continue;
    }
    
    // Get current value
    const currentValue = foundry.utils.getProperty(actor, dataPath);
    if (!Object.prototype.hasOwnProperty.call(originalValues, dataPath)) {
      originalValues[dataPath] = currentValue;
    }
    
    // Apply modification based on mode
    let newValue;
    const parsedValue = coerceEffectValue(value, currentValue);
    switch (mode) {
      case 'add':
        newValue = Number(currentValue || 0) + Number(parsedValue || 0);
        break;
      case 'mult':
        newValue = Number(currentValue || 0) * Number(parsedValue || 0);
        break;
      case 'override':
        newValue = parsedValue;
        break;
      case 'upgrade':
        newValue = Math.max(Number(currentValue || 0), Number(parsedValue || 0));
        break;
      case 'downgrade':
        newValue = Math.min(Number(currentValue || 0), Number(parsedValue || 0));
        break;
      default:
        console.warn(`Legends | applyActiveEffects: Unknown mode ${mode}`);
        continue;
    }
    
    // Update actor
    await actor.update({ [dataPath]: newValue });
  }

  if (Object.keys(originalValues).length > 0) {
    await effectItem.update({
      'flags.legends.appliedState.originalValues': originalValues,
    });
  }
}

async function applyLinkedConditions(actor, effectItem) {
  const conditionNames = effectItem.system.conditions || [];
  if (!Array.isArray(conditionNames) || conditionNames.length === 0) {
    return;
  }

  const appliedConditions = [];
  for (const conditionName of conditionNames) {
    const createdCondition = await game.legends.applyCondition(actor, conditionName, {
      source: effectItem.id,
      recoverySource: buildRecoverySourceFromOrigin(effectItem.system?.origin || {}),
    });

    if (createdCondition) {
      appliedConditions.push({ id: createdCondition.id, name: createdCondition.name });
    }
  }

  if (appliedConditions.length > 0) {
    await effectItem.update({
      'flags.legends.appliedState.conditions': appliedConditions,
    });
  }
}

async function removeLinkedConditions(actor, effectItem) {
  const appliedConditions = effectItem.flags?.legends?.appliedState?.conditions || [];
  if (!Array.isArray(appliedConditions) || appliedConditions.length === 0) {
    return;
  }

  const conditionIds = appliedConditions
    .map((entry) => entry?.id)
    .filter((id) => typeof id === 'string' && actor.items.get(id)?.type === 'condition');

  if (conditionIds.length > 0) {
    await actor.deleteEmbeddedDocuments('Item', conditionIds);
  }
}

/**
 * Map semantic keys to actor data paths
 * @param {string} semanticKey - Semantic key
 * @returns {string|null} Actor data path
 */
function mapSemanticKey(semanticKey) {
  const keyMap = {
    // DR
    'system.dr.bonus': 'system.dr.bonus',
    'system.dr.value': 'system.dr.value',
    
    // HP
    'system.hp.temp': 'system.hp.temp',
    'system.hp.max': 'system.hp.max',
    
    // Speed
    'system.speed.base': 'system.speed.base',
    'system.movement.fly': 'system.movement.fly',
    'system.movement.swim': 'system.movement.swim',
    'system.movement.climb': 'system.movement.climb',
    
    // Actions
    'system.actions.max': 'system.actions.max',
    'system.actions.bonus': 'system.actions.bonus',
    
    // Attributes (temporary overrides)
    'system.attributes.strength.tempValue': 'system.attributes.strength.tempValue',
    'system.attributes.constitution.tempValue': 'system.attributes.constitution.tempValue',
    'system.attributes.agility.tempValue': 'system.attributes.agility.tempValue',
    'system.attributes.dexterity.tempValue': 'system.attributes.dexterity.tempValue',
    'system.attributes.intelligence.tempValue': 'system.attributes.intelligence.tempValue',
    'system.attributes.wisdom.tempValue': 'system.attributes.wisdom.tempValue',
    'system.attributes.charisma.tempValue': 'system.attributes.charisma.tempValue',
    
    // Visibility
    'visibility.invisible': 'system.visibility.invisible',
    'visibility.concealed': 'system.visibility.concealed',
  };
  
  return keyMap[semanticKey] || null;
}

/**
 * Remove an effect from an actor
 * @param {Actor} actor - Actor with the effect
 * @param {string} effectId - Effect item ID
 */
export async function removeEffect(actor, effectId) {
  const effect = actor.items.get(effectId);
  if (!effect || effect.type !== 'effect') {
    return;
  }
  
  // Reverse active effects before removing
  await reverseActiveEffects(actor, effect);
  await removeLinkedConditions(actor, effect);
  
  // Handle recovery/cleanup (e.g., Haste applies exhaustion)
  if (effect.system.recovery?.onExpire) {
    await executeExpireAction(actor, effect, effect.system.recovery.onExpire);
  }
  
  await effect.delete();
  ui.notifications.info(`${actor.name} loses ${effect.name}`);
}

/**
 * Reverse active effects when removing an effect
 * @param {Actor} actor - Target actor
 * @param {Item} effectItem - Effect item being removed
 */
async function reverseActiveEffects(actor, effectItem) {
  const activeEffects = effectItem.system.activeEffects || [];
  const originalValues = effectItem.flags?.legends?.appliedState?.originalValues || {};
  
  for (const effectData of activeEffects) {
    const { key, mode, value } = effectData;
    
    const dataPath = mapSemanticKey(key);
    if (!dataPath) continue;

    if (Object.prototype.hasOwnProperty.call(originalValues, dataPath)) {
      await actor.update({ [dataPath]: originalValues[dataPath] });
      continue;
    }
    
    const currentValue = foundry.utils.getProperty(actor, dataPath);
    
    // Reverse the modification
    let newValue;
    switch (mode) {
      case 'add':
        newValue = (currentValue || 0) - parseFloat(value);
        break;
      case 'mult':
        newValue = (currentValue || 0) / parseFloat(value);
        break;
      case 'override':
        // Can't easily reverse override, would need to track original
        newValue = currentValue;
        break;
      default:
        continue;
    }
    
    await actor.update({ [dataPath]: newValue });
  }
}

/**
 * Update effect duration (called each turn/round)
 * @param {Actor} actor - Actor with effects
 * @param {string} trigger - When this is called (turnStart, turnEnd)
 */
export async function updateEffectDurations(actor, trigger = 'turnEnd') {
  const effects = actor.items.filter(i => i.type === 'effect');
  const recoveryTrigger = normalizeEffectTrigger(trigger);
  const timingTrigger = normalizeEffectTrigger(trigger);
  
  for (const effect of effects) {
    const duration = effect.system.duration;
    const recovery = effect.system.recovery || {};
    let expired = false;
    const durationState = await ensureDurationState(effect);
    const shouldDecrement = shouldAdvanceDuration(duration, trigger);

    // Decrement duration
    if (shouldDecrement && durationState && durationState.remainingRounds > 0) {
      const newDuration = durationState.remainingRounds - 1;
      
      // Update badge if counter
      const updates = { 'flags.legends.durationState.remainingRounds': newDuration };
      if (effect.system.badge?.type === 'counter') {
        updates['system.badge.value'] = newDuration;
      }
      
      await effect.update(updates);
      
      // Remove if expired
      if (newDuration <= 0) {
        expired = true;
      }
    }
    
    // Process damage tick if appropriate
    if (effect.system.damageTick && normalizeEffectTrigger(effect.system.damageTick.frequency) === timingTrigger) {
      await processDamageTick(actor, effect);
    }

    if (recovery.trigger === recoveryTrigger) {
      await processRecoveryPrompt(actor, effect);
    }

    const hasExpireCheck = Boolean(
      recovery.save?.type
      || recovery.check?.skill
      || recovery.check?.attribute
      || (Array.isArray(recovery.check?.skills) && recovery.check.skills.length > 0)
      || (Array.isArray(recovery.check?.attributes) && recovery.check.attributes.length > 0)
      || recovery.assistance?.check?.skill
      || recovery.assistance?.check?.attribute
      || (Array.isArray(recovery.assistance?.check?.skills) && recovery.assistance.check.skills.length > 0)
      || (Array.isArray(recovery.assistance?.check?.attributes) && recovery.assistance.check.attributes.length > 0)
    );

    if (expired && recovery.trigger === 'onExpire' && hasExpireCheck) {
      await processRecoveryPrompt(actor, effect);
      continue;
    }

    if (expired) {
      await removeEffect(actor, effect.id);
    }
  }
}

/**
 * Process damage tick for an effect
 * @param {Actor} actor - Actor with the effect
 * @param {Item} effect - Effect with damageTick
 */
async function processDamageTick(actor, effect) {
  const damageTick = effect.system.damageTick;
  
  // Roll damage
  const roll = new Roll(damageTick.formula);
  await roll.evaluate();
  
  const damage = roll.total;
  const damageType = damageTick.type || 'untyped';
  
  // Apply damage
  const currentHP = actor.system.hp.value;
  let dr = actor.system.dr?.value || 0;
  
  // Energy damage gets half DR
  const energyTypes = ['fire', 'cold', 'acid', 'lightning', 'force', 'necrotic', 'radiant', 'psychic'];
  if (energyTypes.includes(damageType.toLowerCase())) {
    dr = Math.floor(dr / 2);
  }
  
  const finalDamage = Math.max(0, damage - dr);
  const newHP = Math.max(0, currentHP - finalDamage);
  
  await actor.update({ 'system.hp.value': newHP });
  
  // Show message
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="legends-damage-tick">
      <strong>${effect.name}:</strong> ${actor.name} takes ${finalDamage} ${damageType} damage${dr > 0 ? ` (${damage} - ${dr} DR)` : ''}
    </div>`
  });
  
  // Allow save if specified
  if (damageTick.save && damageTick.save.effectOnSuccess === 'end') {
    await promptForSave(actor, effect, damageTick.save, 'damage');
  }
}

/**
 * Initialize effect engine hooks
 */
export function initializeEffectEngine() {
  console.log('Legends | Initializing Effect Engine');
  
  // Hook into combat tracker for duration updates
  Hooks.on('combatTurn', async (combat, updateData, options) => {
    const previousTurn = options?.direction === 1
      ? (combat.turn === 0 ? combat.turns.length - 1 : combat.turn - 1)
      : (combat.turn === combat.turns.length - 1 ? 0 : combat.turn + 1);
    const previousCombatant = combat.turns[previousTurn];

    if (previousCombatant?.actor) {
      await updateEffectDurations(previousCombatant.actor, 'turnEnd');
    }

    const combatant = combat.combatant;
    if (!combatant?.actor) return;

    await updateEffectDurations(combatant.actor, 'turnStart');
  });
  
  Hooks.on('combatRound', async (combat, updateData, updateOptions) => {
    for (const combatant of combat.combatants) {
      if (combatant.actor) {
        await updateEffectDurations(combatant.actor, 'eachRound');
      }
    }
  });

  Hooks.on('updateActor', async (actor, diff) => {
    const updatedTempHp = foundry.utils.getProperty(diff, 'system.hp.temp');
    if (!Number.isFinite(updatedTempHp) || updatedTempHp > 0) {
      return;
    }

    const depletedEffects = actor.items.filter(item => item.type === 'effect' && item.system?.duration?.expireOn === 'depleted');
    for (const effect of depletedEffects) {
      await removeEffect(actor, effect.id);
    }
  });
}

export async function handleActorActivity(actor, activityType) {
  if (!actor || !activityType) {
    return;
  }

  const expireModes = getActivityExpireModes(activityType);
  const matchingEffects = actor.items.filter(item =>
    item.type === 'effect' && expireModes.has(item.system?.duration?.expireOn)
  );

  for (const effect of matchingEffects) {
    await removeEffect(actor, effect.id);
  }
}
