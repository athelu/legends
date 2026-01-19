/**
 * Legends D8 TTRPG Dice Rolling Functions
 * Implements the roll-under 2d8 success counting system
 */

/**
 * Roll a standard D8 check (attribute + skill)
 * @param {Object} options - Rolling options
 * @returns {Object} Roll result with successes
 */
export async function rollD8Check(options = {}) {
  const {
    actor,
    attrValue,
    skillValue,
    attrLabel,
    skillLabel,
    fortune = 0,
    misfortune = 0,
    modifier = 0,
    isSave = false
  } = options;
  
  // Calculate net fortune/misfortune
  const netFortune = Math.max(0, fortune - misfortune);
  const netMisfortune = Math.max(0, misfortune - fortune);
  
  // Determine number of dice to roll
  let numDice = 2;
  if (netFortune > 0) numDice = 3;
  if (netMisfortune > 0) numDice = 3;
  
  // Roll the dice
  const roll = new Roll(`${numDice}d8`); 
  await roll.evaluate();
  
  const results = roll.dice[0].results.map(r => r.result);
  
  // Select appropriate dice based on fortune/misfortune
  let attrDie, skillDie;
  
  if (netFortune > 0) {
    // Take best 2
    const sorted = [...results].sort((a, b) => a - b);
    attrDie = sorted[0];
    skillDie = sorted[1];
  } else if (netMisfortune > 0) {
    // Take worst 2
    const sorted = [...results].sort((a, b) => b - a);
    attrDie = sorted[0];
    skillDie = sorted[1];
  } else {
    // Normal roll
    attrDie = results[0];
    skillDie = results[1];
  }
  
  // Apply modifiers
  const modifiedAttrDie = attrDie + modifier;
  const modifiedSkillDie = skillDie + modifier;
  
  // Count successes (roll under target, natural 1 always succeeds, 8 always fails)
  let successes = 0;
  
  // Attribute die
  if (attrDie === 1) {
    successes++;
  } else if (attrDie !== 8 && modifiedAttrDie < attrValue) {
    successes++;
  }
  
  // Skill die
  if (skillDie === 1) {
    successes++;
  } else if (skillDie !== 8 && modifiedSkillDie < skillValue) {
    successes++;
  }
  
  // Check for critical success (double 1s)
  const criticalSuccess = (attrDie === 1 && skillDie === 1);
  if (criticalSuccess) {
    successes = Math.max(successes, 3); // Minimum 3 successes on crit
  }
  
  // Check for critical failure (double 8s)
  const criticalFailure = (attrDie === 8 && skillDie === 8);
  if (criticalFailure) {
    successes = 0;
  }
  
// Store roll data for interactive luck spending
  const messageData = {
    actor: actor,        // Keep for initial render
    actorId: actor.id,
    attrValue: attrValue,
    skillValue: skillValue,
    attrLabel: attrLabel,
    skillLabel: skillLabel,
    originalAttrDie: attrDie,
    originalSkillDie: skillDie,
    currentAttrDie: attrDie,
    currentSkillDie: skillDie,
    modifier: modifier,
    fortune: fortune,
    misfortune: misfortune,
    netFortune: netFortune,
    netMisfortune: netMisfortune,
    discarded: (netFortune > 0 || netMisfortune > 0) ? results[2] : null,
    isSave: isSave,
    luckSpent: 0,
    allResults: results
  };
  
  // Render the chat card
  const content = await renderRollResult(messageData);

  // Create a clean copy without the actor object for serialization
  const { actor: _, ...serializableData } = messageData;
  
  // Create chat message with stored data
  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: content,
    flags: {
      'legends.rollData': serializableData  // ← FIX: save without actor object
    }
  });
  
  // Handle critical success - restore luck
  const result = calculateSuccesses(messageData);
  if (result.criticalSuccess) {
    const maxLuck = actor.system.attributes.luck.value;
    await actor.update({ 'system.luck.current': maxLuck });
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="d8-luck-restore">${actor.name}'s Luck restored to ${maxLuck}!</div>`
    });
  }
  
  return {
    message: message,
    ...result
  };
}
/**
 * Calculate successes from roll data
 * @param {Object} data - Roll data object
 * @returns {Object} Success counts and crit flags
 */
function calculateSuccesses(data) {
  const {
    attrValue,
    skillValue,
    currentAttrDie,
    currentSkillDie,
    originalAttrDie,
    originalSkillDie,
    modifier
  } = data;
  
  // Apply modifiers
  const modifiedAttrDie = currentAttrDie + modifier;
  const modifiedSkillDie = currentSkillDie + modifier;
  
  // Count successes (roll under target, natural 1 always succeeds, 8 always fails)
  let successes = 0;
  
  // Attribute die (check original value for natural 1/8)
  if (originalAttrDie === 1) {
    successes++;
  } else if (originalAttrDie !== 8 && modifiedAttrDie < attrValue) {
    successes++;
  }
  
  // Skill die (check original value for natural 1/8)
  if (originalSkillDie === 1) {
    successes++;
  } else if (originalSkillDie !== 8 && modifiedSkillDie < skillValue) {
    successes++;
  }
  
  // Check for critical success (double 1s on ORIGINAL rolls)
  const criticalSuccess = (originalAttrDie === 1 && originalSkillDie === 1);
  if (criticalSuccess) {
    successes = Math.max(successes, 3); // Minimum 3 successes on crit
  }
  
  // Check for critical failure (double 8s on ORIGINAL rolls)
  const criticalFailure = (originalAttrDie === 8 && originalSkillDie === 8);
  if (criticalFailure) {
    successes = 0;
  }
  
  return {
    successes,
    criticalSuccess,
    criticalFailure,
    modifiedAttrDie,
    modifiedSkillDie
  };
}
/**
 * Roll a weave check (magic casting)
 * @param {Object} options - Weave rolling options
 * @returns {Object} Roll result with successes
 */
export async function rollWeaveCheck(options = {}) {
  const {
    actor,
    weave,
    primaryPotential,
    primaryMastery,
    supportingPotential = 0,
    supportingMastery = 0
  } = options;
  
  const primaryCost = weave.system.energyCost.primary.cost;
  const supportingCost = weave.system.energyCost.supporting.cost || 0;
  
  // Check overspending
  const primaryOverspend = Math.max(0, primaryCost - primaryMastery);
  const supportingOverspend = supportingCost > 0 ? Math.max(0, supportingCost - supportingMastery) : 0;
  
  // Roll primary energy
  const primaryRoll = new Roll('2d8');
  await primaryRoll.evaluate();
  const primaryResults = primaryRoll.dice[0].results.map(r => r.result);
  
  let primarySuccesses = 0;
  for (let die of primaryResults) {
    const modified = die + primaryOverspend;
    if (die === 1) {
      primarySuccesses++;
    } else if (die !== 8 && modified < primaryPotential) {
      primarySuccesses++;
    }
  }
  
  let supportingSuccesses = 0;
  let supportingResults = [];
  
  if (supportingCost > 0 && supportingPotential > 0) {
    const supportingRoll = new Roll('2d8');
    await supportingRoll.evaluate();
    supportingResults = supportingRoll.dice[0].results.map(r => r.result);
    
    for (let die of supportingResults) {
      const modified = die + supportingOverspend;
      if (die === 1) {
        supportingSuccesses++;
      } else if (die !== 8 && modified < supportingPotential) {
        supportingSuccesses++;
      }
    }
  }
  
  const totalSuccesses = primarySuccesses + supportingSuccesses;
  
  // Check for critical
  const criticalSuccess = (primaryResults[0] === 1 && primaryResults[1] === 1) ||
                          (supportingResults.length > 0 && supportingResults[0] === 1 && supportingResults[1] === 1);
  
  if (criticalSuccess) {
    // Restore luck
    if (actor.system.luck) {
      await actor.update({ 'system.luck.current': actor.system.luck.max });
      ui.notifications.info(`${actor.name} rolled a critical success! All Luck restored!`);
    }
  }
  
  // Deduct energy
  const totalEnergyCost = primaryCost + supportingCost;
  const currentEnergy = actor.system.energy.value;
  
  if (totalSuccesses === 0) {
    // Failed weave - lose half energy
    const energyLost = Math.ceil(totalEnergyCost / 2);
    await actor.update({ 'system.energy.value': Math.max(0, currentEnergy - energyLost) });
  } else {
    // Successful weave - lose full energy
    await actor.update({ 'system.energy.value': Math.max(0, currentEnergy - totalEnergyCost) });
  }
  
  // Create chat message
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: await renderWeaveResult({
      weaveName: weave.name,
      primaryEnergy: weave.system.energyCost.primary.type,
      supportingEnergy: weave.system.energyCost.supporting.type,
      primaryPotential,
      primaryMastery,
      supportingPotential,
      supportingMastery,
      primaryCost,
      supportingCost,
      primaryResults,
      supportingResults,
      primarySuccesses,
      supportingSuccesses,
      totalSuccesses,
      criticalSuccess,
      primaryOverspend,
      supportingOverspend
    })
  });
  
  return {
    successes: totalSuccesses,
    criticalSuccess,
    primarySuccesses,
    supportingSuccesses
  };
}
// Render a skill check result
 async function renderRollResult(data) {
  // Extract values from data object
  const {
    attrLabel,
    skillLabel,
    attrValue,
    skillValue,
    currentAttrDie,
    currentSkillDie,
    originalAttrDie,
    originalSkillDie,
    allResults,
    modifier,
    fortune,
    misfortune,
    netFortune,
    netMisfortune,
    isSave,
    discarded
  } = data;
  
  // Get actor - handle both full actor object and actorId
  const actor = data.actor ? data.actor : game.actors.get(data.actorId);
  const currentLuck = actor.system.luck?.current ?? actor.system.attributes.luck.value;
  
  // ... rest of function stays the same
  
  // Calculate current results
  const result = calculateSuccesses(data);
  const { successes, criticalSuccess, criticalFailure } = result;
  const modifiedAttrDie = currentAttrDie + modifier;
  const modifiedSkillDie = currentSkillDie + modifier;
  
  const fortuneText = netFortune > 0 ? `<span class="fortune">Fortune (${netFortune})</span>` : '';
  const misfortuneText = netMisfortune > 0 ? `<span class="misfortune">Misfortune (${netMisfortune})</span>` : '';
  const modifierText = modifier !== 0 ? `<span class="modifier">Modifier: ${modifier > 0 ? '+' : ''}${modifier}</span>` : '';
  
  const critClass = criticalSuccess ? 'critical-success' : (criticalFailure ? 'critical-failure' : '');
  
  let allDiceText = '';
  if (allResults && allResults.length > 2) {
    allDiceText = `<div class="all-dice">All rolls: ${allResults.join(', ')}</div>`;
  }

  // Luck spending UI
  let luckSpentText = '';
  if (data.luckSpent > 0) {
    luckSpentText = `<div class="luck-spent"><i class="fas fa-coins"></i> Luck Spent: ${data.luckSpent}</div>`;
  }
  
  // Luck restore notification
  let luckRestoreText = '';
  if (criticalSuccess) {
    luckRestoreText = '<div class="luck-restore"><i class="fas fa-star"></i> All Luck Restored!</div>';
  }
  
  // Show luck spending buttons only if player has luck and can reduce dice
  const canSpendOnAttr = currentLuck > data.luckSpent && currentAttrDie > 1 && originalAttrDie !== 1 && originalAttrDie !== 8;
  const canSpendOnSkill = currentLuck > data.luckSpent && currentSkillDie > 1 && originalSkillDie !== 1 && originalSkillDie !== 8;
  
  let luckButtons = '';
  if (canSpendOnAttr || canSpendOnSkill) {
    luckButtons = `
      <div class="luck-spending">
        <div class="luck-header">
          <strong>Spend Luck?</strong> (Current: ${currentLuck})
        </div>
        <div class="luck-buttons">
          ${canSpendOnAttr ? `<button class="spend-luck-btn" data-target="attr" data-message-id="{{messageId}}">
            <i class="fas fa-arrow-down"></i> Reduce ${attrLabel} die (${currentAttrDie} → ${currentAttrDie - 1})
          </button>` : ''}
          ${canSpendOnSkill ? `<button class="spend-luck-btn" data-target="skill" data-message-id="{{messageId}}">
            <i class="fas fa-arrow-down"></i> Reduce ${skillLabel} die (${currentSkillDie} → ${currentSkillDie - 1})
          </button>` : ''}
        </div>
      </div>
    `;
  }
  
  return `
    <div class="d8-roll ${critClass}">
      <h3>${attrLabel} + ${skillLabel} ${isSave ? '(Save)' : ''}</h3>
      <div class="dice-results">
        <div class="die-result">
          <span class="die-label">${attrLabel} (${attrValue})</span>
          <span class="die-value ${originalAttrDie === 1 ? 'natural-one' : originalAttrDie === 8 ? 'natural-eight' : ''}">
            ${currentAttrDie}${currentAttrDie !== originalAttrDie ? ` (was ${originalAttrDie})` : ''}
          </span>
        </div>
        <div class="die-result">
          <span class="die-label">${skillLabel} (${skillValue})</span>
          <span class="die-value ${originalSkillDie === 1 ? 'natural-one' : originalSkillDie === 8 ? 'natural-eight' : ''}">
            ${currentSkillDie}${currentSkillDie !== originalSkillDie ? ` (was ${originalSkillDie})` : ''}
          </span>
        </div>
      </div>
      ${allDiceText}
      <div class="modifiers">
        ${fortuneText}
        ${misfortuneText}
        ${modifierText}
      </div>
      <div class="successes ${criticalSuccess ? 'critical' : ''}">
        <strong>Successes:</strong> ${successes}
        ${criticalSuccess ? '<span class="crit-text">CRITICAL SUCCESS!</span>' : ''}
        ${criticalFailure ? '<span class="crit-text">CRITICAL FAILURE!</span>' : ''}
      </div>
      ${luckRestoreText}
      ${luckSpentText}
      ${luckButtons}
    </div>
  `;
}

// Render a weave result
 async function renderWeaveResult(data) {
  const primaryOverspendText = data.primaryOverspend > 0 ? 
    `<span class="overspend">Overspending: +${data.primaryOverspend} to dice</span>` : '';
  const supportingOverspendText = data.supportingOverspend > 0 ? 
    `<span class="overspend">Overspending: +${data.supportingOverspend} to dice</span>` : '';
  
  const supportingSection = data.supportingEnergy ? `
    <div class="energy-section supporting">
      <h4>Supporting: ${data.supportingEnergy.charAt(0).toUpperCase() + data.supportingEnergy.slice(1)}</h4>
      <div class="dice-results">
        <div class="die-result">
          <span class="die-label">Potential (${data.supportingPotential})</span>
          <span class="die-value">${data.supportingResults[0]}</span>
        </div>
        <div class="die-result">
          <span class="die-label">Mastery (${data.supportingMastery})</span>
          <span class="die-value">${data.supportingResults[1]}</span>
        </div>
      </div>
      ${supportingOverspendText}
      <div class="energy-successes">Successes: ${data.supportingSuccesses}</div>
    </div>
  ` : '';
  
  return `
    <div class="d8-roll weave-roll ${data.criticalSuccess ? 'critical-success' : ''}">
      <h3>Weave: ${data.weaveName}</h3>
      <div class="energy-section primary">
        <h4>Primary: ${data.primaryEnergy.charAt(0).toUpperCase() + data.primaryEnergy.slice(1)} (${data.primaryCost} Energy)</h4>
        <div class="dice-results">
          <div class="die-result">
            <span class="die-label">Potential (${data.primaryPotential})</span>
            <span class="die-value">${data.primaryResults[0]}</span>
          </div>
          <div class="die-result">
            <span class="die-label">Mastery (${data.primaryMastery})</span>
            <span class="die-value">${data.primaryResults[1]}</span>
          </div>
        </div>
        ${primaryOverspendText}
        <div class="energy-successes">Successes: ${data.primarySuccesses}</div>
      </div>
      ${supportingSection}
      <div class="total-successes ${data.criticalSuccess ? 'critical' : ''}">
        <strong>Total Successes:</strong> ${data.totalSuccesses}
        ${data.criticalSuccess ? '<span class="crit-text">CRITICAL! Luck Restored!</span>' : ''}
      </div>
      <div class="energy-cost">
        <strong>Energy Cost:</strong> ${data.primaryCost + data.supportingCost}
      </div>
    </div>
  `;
}
/**
 * Handle spending luck on a roll
 * @param {string} messageId - Chat message ID
 * @param {string} target - Which die to reduce ('attr' or 'skill')
 */
export async function spendLuckOnRoll(messageId, target) {
  const message = game.messages.get(messageId);
  if (!message) return;
  
  const rollData = message.flags['legends.rollData'];
  if (!rollData) return;
  
  const actor = game.actors.get(rollData.actorId);
  if (!actor) return;
  
  // Check if actor has luck
  const currentLuck = actor.system.luck?.current ?? actor.system.attributes.luck.value;
  if (currentLuck < 1) {
    ui.notifications.warn("Not enough Luck!");
    return;
  }
  
  // Determine which die to reduce
  if (target === 'attr') {
    if (rollData.currentAttrDie <= 1 || rollData.originalAttrDie === 1 || rollData.originalAttrDie === 8) {
      ui.notifications.warn("Cannot reduce this die further!");
      return;
    }
    rollData.currentAttrDie -= 1;
  } else if (target === 'skill') {
    if (rollData.currentSkillDie <= 1 || rollData.originalSkillDie === 1 || rollData.originalSkillDie === 8) {
      ui.notifications.warn("Cannot reduce this die further!");
      return;
    }
    rollData.currentSkillDie -= 1;
  }
  
  rollData.luckSpent += 1;
  
  // Update actor's luck
  await actor.update({ 'system.luck.current': currentLuck - 1 });
  
  // Re-render the message
  const newContent = await renderRollResult(rollData);
  await message.update({
    content: newContent.replace('{{messageId}}', messageId),
    flags: {
      'legends.rollData': rollData
    }
  });
  
  ui.notifications.info(`Spent 1 Luck. ${currentLuck - 1} remaining.`);
}

/**
 * Initialize luck spending button handlers
 */
export function initializeLuckHandlers() {
  Hooks.on('renderChatMessage', (message, html, data) => {
    html.find('.spend-luck-btn').click(async (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      const target = button.dataset.target;
      const messageId = message.id;
      
      await spendLuckOnRoll(messageId, target);
    });
  });
}