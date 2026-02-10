/**
 * Condition Engine for Legends System
 * Handles automatic condition mechanics: damage ticks, recovery saves, downgrades, and roll modifiers
 */

/**
 * Initialize the condition engine
 */
export function initializeConditionEngine() {
  console.log('Legends | Initializing Condition Engine');

  // Hook into combat turn tracking
  Hooks.on('combatTurn', handleCombatTurn);
  Hooks.on('combatRound', handleCombatRound);

  // Hook into roll modifications
  Hooks.on('preRollSkillCheck', applyConditionModifiers);
  Hooks.on('preRollSavingThrow', applyConditionModifiers);

  // Hook into token selection for condition overlay UI
  Hooks.on('controlToken', renderTokenConditionOverlay);
  Hooks.on('hoverToken', renderTokenConditionOverlay);

  console.log('Legends | Condition Engine initialized');
}

/* -------------------------------------------- */
/*  Combat Turn Handling                        */
/* -------------------------------------------- */

/**
 * Handle turn start/end in combat
 * @param {Combat} combat - The combat instance
 * @param {object} updateData - The update data
 * @param {object} options - Additional options
 */
async function handleCombatTurn(combat, updateData, options) {
  const combatant = combat.combatant;
  if (!combatant || !combatant.actor) return;

  const actor = combatant.actor;

  console.log(`Legends | Processing turn for ${actor.name}`);

  // Process conditions at start of turn
  await processConditionsAtTiming(actor, 'startOfTurn');

  // Schedule end of turn processing
  // Note: We'll also need to handle this when the turn actually ends
  // For now, we'll process at the start of the NEXT turn
}

/**
 * Handle round start in combat
 * @param {Combat} combat - The combat instance
 * @param {object} updateData - The update data
 */
async function handleCombatRound(combat, updateData) {
  // Process conditions that trigger each round
  for (const combatant of combat.combatants) {
    if (!combatant.actor) continue;
    await processConditionsAtTiming(combatant.actor, 'eachRound');
  }
}

/**
 * Process conditions for a given timing
 * @param {Actor} actor - The actor to process conditions for
 * @param {string} timing - The timing: 'startOfTurn', 'endOfTurn', 'eachRound'
 */
async function processConditionsAtTiming(actor, timing) {
  const conditions = actor.items.filter(i => i.type === 'condition');

  for (const condition of conditions) {
    // Process damage ticks
    if (condition.system.damageTick) {
      const damageTick = condition.system.damageTick;
      if (damageTick.frequency === timing) {
        await processDamageTick(actor, condition);
      }
    }

    // Process recovery saves
    if (condition.system.recovery) {
      const recovery = condition.system.recovery;
      if (recovery.trigger === timing) {
        await processRecoverySave(actor, condition);
      }
    }
  }
}

/**
 * Process damage tick for a condition
 * @param {Actor} actor - The actor taking damage
 * @param {Item} condition - The condition causing damage
 */
async function processDamageTick(actor, condition) {
  const damageTick = condition.system.damageTick;
  const formula = damageTick.formula;

  // Roll damage
  const roll = new Roll(formula);
  await roll.evaluate();

  // Apply damage to actor
  const currentHP = actor.system.health?.value ?? actor.system.hp?.value ?? 0;
  const newHP = Math.max(0, currentHP - roll.total);

  await actor.update({
    'system.health.value': newHP
  });

  // Create chat message
  const chatMessage = damageTick.chatMessage || `Take ${formula} damage from ${condition.name}`;

  const messageContent = `
    <div class="d8-condition-damage">
      <h3>${condition.name} - Damage</h3>
      <div class="dice-roll">
        <div class="dice-result">
          <div class="dice-formula">${formula}</div>
          <div class="dice-tooltip" style="display: none;">
            ${roll.terms.map(t => t.results ? t.results.map(r => r.result).join(', ') : '').join(' ')}
          </div>
          <h4 class="dice-total">${roll.total}</h4>
        </div>
      </div>
      <p><strong>${actor.name}</strong> takes <strong>${roll.total}</strong> damage from ${condition.name}!</p>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: messageContent,
    roll: roll,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL
  });

  // Check if there's a save to reduce/end damage
  if (damageTick.save) {
    await promptForSave(actor, condition, damageTick.save, 'damage');
  }
}

/**
 * Process recovery save for a condition
 * @param {Actor} actor - The actor making the save
 * @param {Item} condition - The condition being recovered from
 */
async function processRecoverySave(actor, condition) {
  const recovery = condition.system.recovery;

  if (!recovery.promptPlayer) return;

  const chatMessage = recovery.chatMessage || `Make a ${recovery.save?.type || 'saving throw'} to recover from ${condition.name}`;

  // Create interactive chat card for save
  const messageContent = `
    <div class="d8-condition-recovery">
      <h3>${condition.name} - Recovery</h3>
      <p>${chatMessage}</p>
      <div class="recovery-buttons" data-actor-id="${actor.id}" data-condition-id="${condition.id}">
        <button class="recovery-roll" data-save-type="${recovery.save?.type || 'fortitude'}">
          Roll ${recovery.save?.type || 'Save'}
        </button>
        ${recovery.assistance ? `<button class="recovery-assist" data-range="${recovery.assistance.range}">Request Assistance (${recovery.assistance.range} ft)</button>` : ''}
      </div>
    </div>
  `;

  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: messageContent,
    flags: {
      legends: {
        conditionRecovery: true,
        actorId: actor.id,
        conditionId: condition.id,
        saveType: recovery.save?.type,
        downgrades: recovery.downgrades
      }
    }
  });

  return message;
}

/**
 * Prompt for a saving throw
 * @param {Actor} actor - The actor making the save
 * @param {Item} condition - The condition being saved against
 * @param {object} saveData - Save configuration
 * @param {string} context - Context: 'damage' or 'recovery'
 */
async function promptForSave(actor, condition, saveData, context) {
  const saveType = saveData.type || 'fortitude';
  const effectOnSuccess = saveData.effectOnSuccess || 'none';

  const messageContent = `
    <div class="d8-condition-save">
      <h3>${condition.name} - Save</h3>
      <p>Make a <strong>${saveType}</strong> save!</p>
      <button class="condition-save-roll" data-actor-id="${actor.id}" data-condition-id="${condition.id}" data-save-type="${saveType}" data-effect="${effectOnSuccess}">
        Roll ${saveType} Save
      </button>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: messageContent,
    flags: {
      legends: {
        conditionSave: true,
        actorId: actor.id,
        conditionId: condition.id,
        saveType: saveType,
        effectOnSuccess: effectOnSuccess
      }
    }
  });
}

/**
 * Handle recovery save results
 * @param {Actor} actor - The actor who made the save
 * @param {Item} condition - The condition being recovered from
 * @param {number} successes - Number of successes rolled (0, 1, or 2)
 */
export async function handleRecoveryResult(actor, condition, successes) {
  const recovery = condition.system.recovery;
  const downgrades = recovery.downgrades;

  if (!downgrades) return;

  // Determine what happens based on success count
  const outcomeKey = `${successes}_success`;
  const outcome = downgrades[outcomeKey];

  if (outcome === null || outcome === 'null') {
    // Condition ends completely
    await game.legends.removeCondition(actor, condition.name);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p><strong>${actor.name}</strong> recovered from <strong>${condition.name}</strong>!</p>`
    });
  } else if (outcome && outcome !== condition.name) {
    // Downgrade to a different condition
    await game.legends.removeCondition(actor, condition.name);
    await game.legends.applyCondition(actor, outcome, {
      source: 'downgrade'
    });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p><strong>${actor.name}</strong>'s <strong>${condition.name}</strong> downgraded to <strong>${outcome}</strong>!</p>`
    });
  } else {
    // Remains the same
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p><strong>${actor.name}</strong> remains <strong>${condition.name}</strong>.</p>`
    });
  }
}

/* -------------------------------------------- */
/*  Roll Modifiers                              */
/* -------------------------------------------- */

/**
 * Apply condition modifiers to rolls
 * @param {object} rollData - The roll data being prepared
 */
function applyConditionModifiers(rollData) {
  const actor = rollData.actor;
  if (!actor) return;

  const conditions = actor.items.filter(i => i.type === 'condition');

  let totalModifier = 0;
  const modifierSources = [];

  for (const condition of conditions) {
    if (!condition.system.activeEffects) continue;

    for (const effect of condition.system.activeEffects) {
      // Check if this effect applies to this roll
      const applies = checkEffectApplies(effect, rollData);
      if (!applies) continue;

      const value = parseInt(effect.value) || 0;
      totalModifier += value;
      modifierSources.push({
        name: condition.name,
        value: value,
        notes: effect.notes
      });
    }
  }

  // Apply the modifier to the roll
  if (totalModifier !== 0) {
    rollData.modifier = (rollData.modifier || 0) + totalModifier;
    rollData.conditionModifiers = modifierSources;
  }
}

/**
 * Check if an active effect applies to a given roll
 * @param {object} effect - The active effect to check
 * @param {object} rollData - The roll data
 * @returns {boolean} Whether the effect applies
 */
function checkEffectApplies(effect, rollData) {
  const key = effect.key;

  // Check for all rolls modifier
  if (key === 'diceMod.allRolls') {
    return true;
  }

  // Check for attack modifiers
  if (key.startsWith('diceMod.attack') && rollData.isAttack) {
    return true;
  }

  // Check for skill-specific modifiers
  if (key.startsWith('skillDiceMod.') && rollData.skillKey) {
    const skillName = key.split('.')[1];
    return rollData.skillKey === skillName;
  }

  // Check for attribute-specific modifiers
  if (key.startsWith('diceMod.attribute.') && rollData.attrKey) {
    const attrName = key.split('.')[2];
    return rollData.attrKey === attrName;
  }

  // Check for save modifiers
  if (key.startsWith('diceMod.save.') && rollData.isSave) {
    const saveType = key.split('.')[2];
    return !saveType || saveType === 'all' || rollData.saveType === saveType;
  }

  return false;
}

/* -------------------------------------------- */
/*  Token Condition Overlay                     */
/* -------------------------------------------- */

/**
 * Get the next condition in a progression chain (upgrade)
 * @param {string} conditionName - Current condition name
 * @returns {string|null} Next condition name or null if at max
 */
function getNextConditionInChain(conditionName) {
  const progressionChains = {
    // Fear progression
    'Frightened': 'Fleeing',
    'Fleeing': 'Cowering',
    'Cowering': null,

    // Fire progression
    'Singed': 'Smoldering',
    'Smoldering': 'Ignited',
    'Ignited': 'Burning',
    'Burning': null,

    // Cold progression
    'Chilled': 'Numbed',
    'Numbed': 'Frosted',
    'Frosted': 'Frozen',
    'Frozen': null,

    // Stun progression
    'Dazed': 'Stunned',
    'Stunned': 'Paralyzed',
    'Paralyzed': null,

    // Movement progression
    'Grappled': 'Restrained',
    'Restrained': 'Paralyzed'
  };

  return progressionChains[conditionName] || null;
}

/**
 * Get the previous condition in a progression chain (downgrade)
 * @param {string} conditionName - Current condition name
 * @returns {string|null} Previous condition name or null if at min
 */
function getPreviousConditionInChain(conditionName) {
  const progressionChains = {
    // Fear progression
    'Cowering': 'Fleeing',
    'Fleeing': 'Frightened',
    'Frightened': null,

    // Fire progression
    'Burning': 'Ignited',
    'Ignited': 'Smoldering',
    'Smoldering': 'Singed',
    'Singed': null,

    // Cold progression
    'Frozen': 'Frosted',
    'Frosted': 'Numbed',
    'Numbed': 'Chilled',
    'Chilled': null,

    // Stun progression
    'Paralyzed': 'Stunned',
    'Stunned': 'Dazed',
    'Dazed': null,

    // Movement progression - special case, Paralyzed can come from Restrained or Stunned
    'Restrained': 'Grappled',
    'Grappled': null
  };

  return progressionChains[conditionName] || null;
}

/**
 * Render condition overlay on selected/hovered token
 * @param {Token} token - The token being controlled/hovered
 * @param {boolean} controlled - Whether the token is controlled
 */
function renderTokenConditionOverlay(token, controlled) {
  // Remove existing overlays first
  removeTokenConditionOverlay(token);

  // Only show for controlled or hovered tokens
  if (!controlled && !token._hover) return;

  const actor = token.actor;
  if (!actor) return;

  const conditions = actor.items.filter(i => i.type === 'condition');
  if (conditions.length === 0) return;

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.classList.add('legends-condition-overlay');
  overlay.dataset.tokenId = token.id;

  // Position in upper right of token
  overlay.style.position = 'absolute';
  overlay.style.right = '10px';
  overlay.style.top = '10px';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.gap = '4px';
  overlay.style.alignItems = 'flex-end';
  overlay.style.pointerEvents = 'auto'; // Changed to auto to allow clicks
  overlay.style.zIndex = '1000';

  // Add each condition
  for (const condition of conditions) {
    const conditionChip = document.createElement('div');
    conditionChip.classList.add('condition-chip');
    conditionChip.style.background = 'rgba(0, 0, 0, 0.85)';
    conditionChip.style.border = '2px solid #444';
    conditionChip.style.borderRadius = '4px';
    conditionChip.style.padding = '4px 8px';
    conditionChip.style.display = 'flex';
    conditionChip.style.alignItems = 'center';
    conditionChip.style.gap = '6px';
    conditionChip.style.fontSize = '12px';
    conditionChip.style.color = '#fff';
    conditionChip.style.whiteSpace = 'nowrap';
    conditionChip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
    conditionChip.style.cursor = 'pointer';
    conditionChip.style.transition = 'all 0.2s';

    // Add hover effect
    conditionChip.addEventListener('mouseenter', () => {
      conditionChip.style.background = 'rgba(0, 0, 0, 0.95)';
      conditionChip.style.borderColor = '#666';
      conditionChip.style.transform = 'scale(1.05)';
    });

    conditionChip.addEventListener('mouseleave', () => {
      conditionChip.style.background = 'rgba(0, 0, 0, 0.85)';
      conditionChip.style.borderColor = '#444';
      conditionChip.style.transform = 'scale(1)';
    });

    // Add tooltip with condition description
    conditionChip.title = `${condition.name}\n\n${condition.system.description}\n\n[Left Click] Increase severity\n[Right Click] Decrease severity`;

    // Left click: Increase severity (upgrade in progression)
    conditionChip.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!game.user.isGM && !actor.isOwner) {
        ui.notifications.warn('You do not have permission to modify this token\'s conditions');
        return;
      }

      const nextCondition = getNextConditionInChain(condition.name);
      if (nextCondition) {
        await game.legends.removeCondition(actor, condition.name);
        await game.legends.applyCondition(actor, nextCondition);
        ui.notifications.info(`${condition.name} → ${nextCondition}`);
      } else {
        ui.notifications.warn(`${condition.name} is already at maximum severity`);
      }
    });

    // Right click: Decrease severity (downgrade in progression)
    conditionChip.addEventListener('contextmenu', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!game.user.isGM && !actor.isOwner) {
        ui.notifications.warn('You do not have permission to modify this token\'s conditions');
        return;
      }

      const prevCondition = getPreviousConditionInChain(condition.name);
      await game.legends.removeCondition(actor, condition.name);

      if (prevCondition) {
        await game.legends.applyCondition(actor, prevCondition);
        ui.notifications.info(`${condition.name} → ${prevCondition}`);
      } else {
        ui.notifications.info(`${condition.name} removed`);
      }
    });

    // Add icon
    const icon = document.createElement('img');
    icon.src = condition.img;
    icon.style.width = '20px';
    icon.style.height = '20px';
    icon.style.borderRadius = '2px';
    icon.style.pointerEvents = 'none'; // Prevent icon from blocking clicks

    // Add name
    const name = document.createElement('span');
    name.textContent = condition.name;
    name.style.pointerEvents = 'none'; // Prevent text from blocking clicks

    conditionChip.appendChild(icon);
    conditionChip.appendChild(name);
    overlay.appendChild(conditionChip);
  }

  // Append to canvas interface
  document.body.appendChild(overlay);

  // Position overlay relative to token on screen
  updateOverlayPosition(token, overlay);

  // Store reference for cleanup
  token._conditionOverlay = overlay;

  // Update position on canvas pan/zoom
  const updateHandler = () => updateOverlayPosition(token, overlay);
  canvas.stage.on('refresh', updateHandler);
  token._overlayUpdateHandler = updateHandler;
}

/**
 * Update overlay position relative to token
 * @param {Token} token - The token
 * @param {HTMLElement} overlay - The overlay element
 */
function updateOverlayPosition(token, overlay) {
  if (!token || !overlay) return;

  const tokenBounds = token.bounds;
  const scale = canvas.stage.scale.x;

  // Calculate position in screen coordinates
  const x = tokenBounds.right * scale;
  const y = tokenBounds.top * scale;

  overlay.style.left = `${x + 10}px`;
  overlay.style.top = `${y + 10}px`;
}

/**
 * Remove condition overlay from token
 * @param {Token} token - The token to remove overlay from
 */
function removeTokenConditionOverlay(token) {
  if (token._conditionOverlay) {
    token._conditionOverlay.remove();
    delete token._conditionOverlay;
  }

  // Remove update handler
  if (token._overlayUpdateHandler) {
    canvas.stage.off('refresh', token._overlayUpdateHandler);
    delete token._overlayUpdateHandler;
  }

  // Also remove any orphaned overlays
  document.querySelectorAll(`.legends-condition-overlay[data-token-id="${token.id}"]`).forEach(el => el.remove());
}

/* -------------------------------------------- */
/*  Chat Interaction Handlers                   */
/* -------------------------------------------- */

/**
 * Initialize chat interaction handlers
 */
export function initializeChatHandlers() {
  Hooks.on('renderChatMessage', (message, html, data) => {
    // Handle recovery roll buttons
    html.find('.recovery-roll').click(async (event) => {
      const button = event.currentTarget;
      const actorId = html.find('.recovery-buttons').data('actor-id');
      const conditionId = html.find('.recovery-buttons').data('condition-id');
      const saveType = button.dataset.saveType;

      const actor = game.actors.get(actorId);
      const condition = actor?.items.get(conditionId);

      if (!actor || !condition) {
        ui.notifications.warn('Actor or condition not found');
        return;
      }

      // Trigger save roll (this should open the roll dialog)
      const result = await game.legends.rollSavingThrow(actor, saveType);

      // After roll, determine successes and handle recovery
      // Note: This requires the roll dialog to return success count
      // For now, we'll need to manually count successes
    });

    // Handle assistance buttons
    html.find('.recovery-assist').click(async (event) => {
      ui.notifications.info('Assistance feature requires proximity check - coming soon!');
    });

    // Handle condition save buttons
    html.find('.condition-save-roll').click(async (event) => {
      const button = event.currentTarget;
      const actorId = button.dataset.actorId;
      const conditionId = button.dataset.conditionId;
      const saveType = button.dataset.saveType;

      const actor = game.actors.get(actorId);
      if (!actor) return;

      await game.legends.rollSavingThrow(actor, saveType);
    });
  });
}

/* -------------------------------------------- */
/*  Exports                                     */
/* -------------------------------------------- */

export const conditionEngine = {
  initializeConditionEngine,
  initializeChatHandlers,
  handleRecoveryResult,
  renderTokenConditionOverlay,
  removeTokenConditionOverlay
};
