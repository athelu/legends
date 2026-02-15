/**
 * Effect Engine for Legends System
 * Handles application of effect items to actors with parameterized values
 */

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
    actor: origin.actor || '',
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
  }
  
  // Update badge for counter type
  if (effectInstance.system.badge?.type === 'counter') {
    effectInstance.system.badge.value = effectInstance.system.duration.value;
    effectInstance.system.badge.max = effectInstance.system.duration.value;
  }
  
  // Set granted by
  if (origin.weaveName) {
    effectInstance.system.grantedBy = origin.weaveName;
  }
  
  // Create the effect on the target actor
  const [createdEffect] = await target.createEmbeddedDocuments('Item', [effectInstance]);
  
  // Apply active effects to actor
  if (createdEffect) {
    await applyActiveEffects(target, createdEffect);
    
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
  // Try to find in effects compendium
  const pack = game.packs.get('legends.effects');
  if (!pack) {
    console.error('Legends | loadEffectTemplate: effects compendium not found');
    return null;
  }
  
  // Try by ID first
  let effect = await pack.getDocument(effectId);
  
  // Try by name if not found
  if (!effect) {
    const index = await pack.getIndex();
    const entry = index.find(e => e.name === effectId);
    if (entry) {
      effect = await pack.getDocument(entry._id);
    }
  }
  
  return effect ? effect.toObject() : null;
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
    
    // Apply modification based on mode
    let newValue;
    switch (mode) {
      case 'add':
        newValue = (currentValue || 0) + parseFloat(value);
        break;
      case 'mult':
        newValue = (currentValue || 0) * parseFloat(value);
        break;
      case 'override':
        newValue = value;
        break;
      case 'upgrade':
        newValue = Math.max(currentValue || 0, parseFloat(value));
        break;
      case 'downgrade':
        newValue = Math.min(currentValue || 0, parseFloat(value));
        break;
      default:
        console.warn(`Legends | applyActiveEffects: Unknown mode ${mode}`);
        continue;
    }
    
    // Update actor
    await actor.update({ [dataPath]: newValue });
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
  
  // Handle recovery/cleanup (e.g., Haste applies exhaustion)
  if (effect.system.recovery?.onExpire) {
    const action = effect.system.recovery.onExpire;
    if (action.startsWith('applyCondition:')) {
      const conditionName = action.split(':')[1];
      // Apply condition (would need condition system integration)
      console.log(`Legends | removeEffect: Would apply condition ${conditionName}`);
    }
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
  
  for (const effectData of activeEffects) {
    const { key, mode, value } = effectData;
    
    const dataPath = mapSemanticKey(key);
    if (!dataPath) continue;
    
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
  
  for (const effect of effects) {
    const duration = effect.system.duration;
    
    // Check if effect should decrement on this trigger
    if (duration.expireOn !== trigger && duration.expireOn !== 'sustained') {
      continue;
    }
    
    // Decrement duration
    if (duration.type === 'rounds' && duration.value > 0) {
      const newDuration = duration.value - 1;
      
      // Update badge if counter
      const updates = { 'system.duration.value': newDuration };
      if (effect.system.badge?.type === 'counter') {
        updates['system.badge.value'] = newDuration;
      }
      
      await effect.update(updates);
      
      // Remove if expired
      if (newDuration <= 0) {
        await removeEffect(actor, effect.id);
      }
    }
    
    // Process damage tick if appropriate
    if (effect.system.damageTick && effect.system.damageTick.frequency === trigger) {
      await processDamageTick(actor, effect);
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
    // Would prompt for save - for now just log
    console.log(`Legends | processDamageTick: ${actor.name} can make ${damageTick.save.type} save to end ${effect.name}`);
  }
}

/**
 * Initialize effect engine hooks
 */
export function initializeEffectEngine() {
  console.log('Legends | Initializing Effect Engine');
  
  // Hook into combat tracker for duration updates
  Hooks.on('combatTurn', async (combat, updateData, updateOptions) => {
    const combatant = combat.combatant;
    if (!combatant?.actor) return;
    
    await updateEffectDurations(combatant.actor, 'turnStart');
  });
  
  // Also handle end of turn (would need more sophisticated turn tracking)
  Hooks.on('combatRound', async (combat, updateData, updateOptions) => {
    // Process all combatants' effects at end of round
    for (const combatant of combat.combatants) {
      if (combatant.actor) {
        await updateEffectDurations(combatant.actor, 'turnEnd');
      }
    }
  });
}
