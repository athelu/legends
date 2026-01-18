/**
 * D8 TTRPG Dice Rolling Functions
 * Implements the roll-under 2d8 success counting system with interactive luck spending
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
    isSave = false,
    label = null
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
  let attrDie, skillDie, discarded = null;
  
  if (netFortune > 0) {
    // Take best 2
    const sorted = [...results].sort((a, b) => a - b);
    attrDie = sorted[0];
    skillDie = sorted[1];
    discarded = sorted[2];
  } else if (netMisfortune > 0) {
    // Take worst 2
    const sorted = [...results].sort((a, b) => b - a);
    attrDie = sorted[0];
    skillDie = sorted[1];
    discarded = sorted[2];
  } else {
    // Normal roll
    attrDie = results[0];
    skillDie = results[1];
  }
  
  // Store original values
  const originalAttrDie = attrDie;
  const originalSkillDie = skillDie;
  
  // Create initial chat message with interactive luck spending
  const messageData = {
    actor: actor,
    attrValue: attrValue,
    skillValue: skillValue,
    attrLabel: attrLabel,
    skillLabel: skillLabel,
    originalAttrDie: originalAttrDie,
    originalSkillDie: originalSkillDie,
    currentAttrDie: originalAttrDie,
    currentSkillDie: originalSkillDie,
    modifier: modifier,
    fortune: fortune,
    misfortune: misfortune,
    netFortune: netFortune,
    netMisfortune: netMisfortune,
    discarded: discarded,
    isSave: isSave,
    label: label || `${attrLabel} + ${skillLabel}`,
    luckSpent: 0,
    luckSpentOnAttr: 0,
    luckSpentOnSkill: 0
  };
  
  const content = await renderRollCard(messageData);
  
  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: content,
    flags: {
      'legends.rollData': messageData
    }
  });
  
  return {
    message: message,
    ...calculateSuccesses(messageData)
  };
}

/**
 * Calculate successes from roll data
 */
function calculateSuccesses(data) {
  const {
    attrValue,
    skillValue,
    currentAttrDie,
    currentSkillDie,
    modifier
  } = data;
  
  // Apply modifiers
  const modifiedAttrDie = currentAttrDie + modifier;
  const modifiedSkillDie = currentSkillDie + modifier;
  
  // Count successes (roll under target, natural 1 always succeeds, 8 always fails)
  let successes = 0;
  
  // Attribute die (check original value for natural 1/8)
  if (data.originalAttrDie === 1) {
    successes++;
  } else if (data.originalAttrDie !== 8 && modifiedAttrDie < attrValue) {
    successes++;
  }
  
  // Skill die (check original value for natural 1/8)
  if (data.originalSkillDie === 1) {
    successes++;
  } else if (data.originalSkillDie !== 8 && modifiedSkillDie < skillValue) {
    successes++;
  }
  
  // Check for critical success (double 1s on ORIGINAL rolls)
  const criticalSuccess = (data.originalAttrDie === 1 && data.originalSkillDie === 1);
  if (criticalSuccess) {
    successes = Math.max(successes, 3); // Minimum 3 successes on crit
  }
  
  // Check for critical failure (double 8s on ORIGINAL rolls)
  const criticalFailure = (data.originalAttrDie === 8 && data.originalSkillDie === 8);
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
 * Render the roll chat card
 */
async function renderRollCard(data) {
  const actor = data.actor;
  const currentLuck = actor.system.luck?.current ?? actor.system.attributes.luck.value;
  
  const {
    successes,
    criticalSuccess,
    criticalFailure,
    modifiedAttrDie,
    modifiedSkillDie
  } = calculateSuccesses(data);
  
  const fortuneText = data.netFortune > 0 ? `<span class="fortune">Fortune</span>` : '';
  const misfortuneText = data.netMisfortune > 0 ? `<span class="misfortune">Misfortune</span>` : '';
  const modifierText = data.modifier !== 0 ? `<span class="modifier">Mod: ${data.modifier > 0 ? '+' : ''}${data.modifier}</span>` : '';
  
  const critClass = criticalSuccess ? 'critical-success' : (criticalFailure ? 'critical-failure' : '');
  
  let discardedText = '';
  if (data.discarded !== null) {
    discardedText = `<div class="discarded-die">Discarded: ${data.discarded}</div>`;
  }
  
  let luckRestoreText = '';
  if (criticalSuccess) {
    luckRestoreText = '<div class="luck-restore"><i class="fas fa-star"></i> Luck Restored!</div>';
  }
  
  // Show luck spending buttons only if player has luck and hasn't already reduced dice to 1
  const canSpendOnAttr = currentLuck > data.luckSpent && data.currentAttrDie > 1 && data.originalAttrDie !== 1 && data.originalAttrDie !== 8;
  const canSpendOnSkill = currentLuck > data.luckSpent && data.currentSkillDie > 1 && data.originalSkillDie !== 1 && data.originalSkillDie !== 8;
  
  let luckButtons = '';
  if (canSpendOnAttr || canSpendOnSkill) {
    luckButtons = `
      <div class="luck-spending">
        <div class="luck-header">
          <strong>Spend Luck?</strong> (Current: ${currentLuck})
        </div>
        <div class="luck-buttons">
          ${canSpendOnAttr ? `<button class="spend-luck-btn" data-target="attr" data-message-id="{{messageId}}">
            <i class="fas fa-arrow-down"></i> Reduce ${data.attrLabel} die (${data.currentAttrDie} → ${data.currentAttrDie - 1})
          </button>` : ''}
          ${canSpendOnSkill ? `<button class="spend-luck-btn" data-target="skill" data-message-id="{{messageId}}">
            <i class="fas fa-arrow-down"></i> Reduce ${data.skillLabel} die (${data.currentSkillDie} → ${data.currentSkillDie - 1})
          </button>` : ''}
        </div>
      </div>
    `;
  }
  
  let luckSpentText = '';
  if (data.luckSpent > 0) {
    luckSpentText = `<div class="luck-spent"><i class="fas fa-coins"></i> Luck Spent: ${data.luckSpent}</div>`;
  }
  
  return `
    <div class="d8-roll ${critClass}" data-actor-id="${actor.id}">
      <h3>${data.label} ${data.isSave ? '(Save)' : ''}</h3>
      <div class="roll-info">
        ${fortuneText} ${misfortuneText} ${modifierText}
      </div>
      ${discardedText}
      <div class="dice-results">
        <div class="die-result">
          <span class="die-label">${data.attrLabel} (target < ${data.attrValue})</span>
          <span class="die-value ${data.originalAttrDie === 1 ? 'natural-one' : data.originalAttrDie === 8 ? 'natural-eight' : ''}">
            ${data.currentAttrDie}${data.currentAttrDie !== data.originalAttrDie ? ` (was ${data.originalAttrDie})` : ''}
            ${modifiedAttrDie !== data.currentAttrDie ? ` [${modifiedAttrDie}]` : ''}
          </span>
        </div>
        <div class="die-result">
          <span class="die-label">${data.skillLabel} (target < ${data.skillValue})</span>
          <span class="die-value ${data.originalSkillDie === 1 ? 'natural-one' : data.originalSkillDie === 8 ? 'natural-eight' : ''}">
            ${data.currentSkillDie}${data.currentSkillDie !== data.originalSkillDie ? ` (was ${data.originalSkillDie})` : ''}
            ${modifiedSkillDie !== data.currentSkillDie ? ` [${modifiedSkillDie}]` : ''}
          </span>
        </div>
      </div>
      <div class="result">
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

/**
 * Handle spending luck on a roll
 */
export async function spendLuckOnRoll(messageId, target) {
  const message = game.messages.get(messageId);
  if (!message) return;
  
  const rollData = message.flags['legends.rollData'];
  if (!rollData) return;
  
  const actor = game.actors.get(rollData.actor._id || rollData.actor.id);
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
    rollData.luckSpentOnAttr += 1;
  } else if (target === 'skill') {
    if (rollData.currentSkillDie <= 1 || rollData.originalSkillDie === 1 || rollData.originalSkillDie === 8) {
      ui.notifications.warn("Cannot reduce this die further!");
      return;
    }
    rollData.currentSkillDie -= 1;
    rollData.luckSpentOnSkill += 1;
  }
  
  rollData.luckSpent += 1;
  
  // Update actor's luck
  await actor.update({ 'system.luck.current': currentLuck - 1 });
  
  // Re-render the message
  const newContent = await renderRollCard(rollData);
  await message.update({
    content: newContent.replace('{{messageId}}', messageId),
    flags: {
      'legends.rollData': rollData
    }
  });
  
  ui.notifications.info(`Spent 1 Luck. ${currentLuck - 1} remaining.`);
}

/**
 * Initialize luck spending handlers
 */
export function initializeLuckHandlers() {
  Hooks.on('renderChatMessage', (message, html, data) => {
    // Add click handlers to luck spending buttons
    html.find('.spend-luck-btn').click(async (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      const target = button.dataset.target;
      const messageId = message.id;
      
      await spendLuckOnRoll(messageId, target);
    });
  });
}

// Export for use in other modules
export { rollD8Check };
