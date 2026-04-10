/**
 * Legends D8 TTRPG Dice Rolling Functions
 * Implements the roll-under 2d8 success counting system
 * Foundry VTT V13 - Uses DialogV2, renderChatMessageHTML (native DOM, not jQuery)
 */

/**
 * Show roll configuration dialog (for attacks with MAP)
 * @param {Object} options - Roll options (actor, attrValue, skillValue, etc.)
 * @returns {Promise<void>}
 */
export async function showRollDialog(options) {
  const {
    actor,
    attrValue,
    skillValue,
    attrLabel,
    skillLabel,
    onRollComplete,
    defaultModifier = 0,
    defaultApplyToAttr = true,
    defaultApplyToSkill = true,
    defaultFortune = 0,
    defaultMisfortune = 0,
  } = options;

  const markTraining = async () => {
    if (!options.actor || !options.skillKey) return;
    await game.legends?.training?.markTrainingCheckbox?.(options.actor, 'skill', options.skillKey);
  };

  return foundry.applications.api.DialogV2.wait({
    window: { title: `Roll: ${skillLabel}` },
    content: `
      <style>
        .dialog-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          justify-content: center;
        }
        .dialog-buttons button {
          flex: 0 0 calc(33.333% - 4px);
        }
        .dialog-buttons button:nth-child(4),
        .dialog-buttons button:nth-child(5) {
          flex: 0 0 calc(50% - 3px);
        }
      </style>
      <form class="legends-roll-dialog">
        <div class="form-group">
          <label><strong>${attrLabel} ${attrValue} + ${skillLabel} ${skillValue}</strong></label>
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
            Apply to ${skillLabel} die
          </label>
        </div>
        <hr style="margin: 15px 0;"/>
        <div class="form-group">
          <p style="font-size: 12px; color: #666; margin: 0;">
            <strong>Multiple Attack Penalty (MAP):</strong><br/>
            Second Attack: -2 penalty, Third Attack: -4 penalty<br/>
            <strong>Fortune:</strong> Roll 3d8, choose best 2<br/>
            <strong>Misfortune:</strong> Roll 3d8, choose worst 2
          </p>
        </div>
      </form>
    `,
    buttons: [
      {
        action: "first-attack",
        label: "First Attack",
        default: true,
        callback: async (event, button, dialog) => {
          const modifierInput = dialog.element.querySelector('[name="modifier"]');
          const rawValue = modifierInput?.value || "";
          const modifier = parseInt(rawValue) || 0;
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          const result = await resolveD8DialogRoll({
            ...options,
            modifier,
            applyToAttr,
            applyToSkill,
            fortune: defaultFortune,
            misfortune: defaultMisfortune
          });
          await markTraining();
          if (onRollComplete) await onRollComplete(result);
          return result;
        }
      },
      {
        action: "second-attack",
        label: "Second Attack (MAP +2)",
        callback: async (event, button, dialog) => {
          const modifierInput = dialog.element.querySelector('[name="modifier"]');
          const rawValue = modifierInput?.value || "";
          const baseModifier = parseInt(rawValue) || 0;
          const modifier = baseModifier + 2; // Apply MAP penalty
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          const result = await resolveD8DialogRoll({
            ...options,
            modifier,
            applyToAttr,
            applyToSkill,
            fortune: defaultFortune,
            misfortune: defaultMisfortune
          });
          if (onRollComplete) await onRollComplete(result);
          return result;
        }
      },
      {
        action: "third-attack",
        label: "Third Attack (MAP +4)",
        callback: async (event, button, dialog) => {
          const modifierInput = dialog.element.querySelector('[name="modifier"]');
          const rawValue = modifierInput?.value || "";
          const baseModifier = parseInt(rawValue) || 0;
          const modifier = baseModifier + 4; // Apply MAP penalty
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          const result = await resolveD8DialogRoll({
            ...options,
            modifier,
            applyToAttr,
            applyToSkill,
            fortune: defaultFortune,
            misfortune: defaultMisfortune
          });
          if (onRollComplete) await onRollComplete(result);
          return result;
        }
      },
      {
        action: "fortune",
        label: "Fortune",
        callback: async (event, button, dialog) => {
          const modifier = parseInt(dialog.element.querySelector('[name="modifier"]').value) || 0;
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          return showDiceAssignmentDialog({
            ...options,
            modifier,
            applyToAttr,
            applyToSkill,
            isFortune: true,
            fortune: defaultFortune + 1,
            misfortune: defaultMisfortune,
            onRollComplete
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
          return showDiceAssignmentDialog({
            ...options,
            modifier,
            applyToAttr,
            applyToSkill,
            isFortune: false,
            fortune: defaultFortune,
            misfortune: defaultMisfortune + 1,
            onRollComplete
          });
        }
      }
    ]
  });
}

/**
 * Show roll configuration dialog for skill checks (without MAP)
 * @param {Object} options - Roll options (actor, attrValue, skillValue, etc.)
 * @returns {Promise<void>}
 */
export async function showSkillCheckDialog(options) {
  const {
    actor,
    attrValue,
    skillValue,
    attrLabel,
    skillLabel,
    onRollComplete,
    defaultModifier = 0,
    defaultApplyToAttr = true,
    defaultApplyToSkill = true,
    defaultFortune = 0,
    defaultMisfortune = 0,
  } = options;

  const markTraining = async () => {
    if (!options.actor || !options.skillKey || options.isSave) return;
    await game.legends?.training?.markTrainingCheckbox?.(options.actor, 'skill', options.skillKey);
  };

  return foundry.applications.api.DialogV2.wait({
    window: { title: `Roll: ${skillLabel}` },
    content: `
      <style>
        .dialog-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          justify-content: center;
        }
        .dialog-buttons button {
          flex: 0 0 calc(50% - 3px);
        }
      </style>
      <form class="legends-roll-dialog">
        <div class="form-group">
          <label><strong>${attrLabel} ${attrValue} + ${skillLabel} ${skillValue}</strong></label>
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
            Apply to ${skillLabel} die
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
        action: "roll",
        label: "Roll",
        default: true,
        callback: async (event, button, dialog) => {
          const modifierInput = dialog.element.querySelector('[name="modifier"]');
          const rawValue = modifierInput?.value || "";
          const modifier = parseInt(rawValue) || 0;
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          const result = await resolveD8DialogRoll({
            ...options,
            modifier,
            applyToAttr,
            applyToSkill,
            fortune: defaultFortune,
            misfortune: defaultMisfortune
          });
          await markTraining();
          if (onRollComplete) await onRollComplete(result);
          return result;
        }
      },
      {
        action: "fortune",
        label: "Fortune",
        callback: async (event, button, dialog) => {
          const modifier = parseInt(dialog.element.querySelector('[name="modifier"]').value) || 0;
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          return showDiceAssignmentDialog({
            ...options,
            modifier,
            applyToAttr,
            applyToSkill,
            isFortune: true,
            fortune: defaultFortune + 1,
            misfortune: defaultMisfortune,
            onRollComplete
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
          return showDiceAssignmentDialog({
            ...options,
            modifier,
            applyToAttr,
            applyToSkill,
            isFortune: false,
            fortune: defaultFortune,
            misfortune: defaultMisfortune + 1,
            onRollComplete
          });
        }
      }
    ]
  });
}

async function resolveD8DialogRoll(options) {
  const { fortune = 0, misfortune = 0 } = options;

  if (fortune > misfortune) {
    return showDiceAssignmentDialog({
      ...options,
      isFortune: true,
    });
  }

  if (misfortune > fortune) {
    return showDiceAssignmentDialog({
      ...options,
      isFortune: false,
    });
  }

  return rollD8Check(options);
}

/**
 * Show dice assignment dialog for Fortune/Misfortune
 * @param {Object} options - Roll options including isFortune flag
 * @returns {Promise<void>}
 */
async function showDiceAssignmentDialog(options) {
  const { actor, attrLabel, skillLabel, isFortune, fortune = isFortune ? 1 : 0, misfortune = isFortune ? 0 : 1 } = options;

  // Roll 3d8
  const roll = new Roll('3d8');
  await roll.evaluate();

  // Show the dice animation
  if (game.dice3d) {
    await game.dice3d.showForRoll(roll, game.user, true);
  }

  const results = roll.dice[0].results.map(r => r.result);

  // Sort to help player see best/worst options
  const sorted = [...results].sort((a, b) => a - b);
  const hint = isFortune
    ? `Best 2: ${sorted[0]}, ${sorted[1]}`
    : `Worst 2: ${sorted[1]}, ${sorted[2]}`;

  // Pre-select appropriate defaults based on fortune/misfortune
  let defaultAttrIdx, defaultSkillIdx;
  if (isFortune) {
    const sortedIndices = results.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
    defaultAttrIdx = sortedIndices[0].idx;
    defaultSkillIdx = sortedIndices[1].idx;
  } else {
    const sortedIndices = results.map((val, idx) => ({ val, idx })).sort((a, b) => b.val - a.val);
    defaultAttrIdx = sortedIndices[0].idx;
    defaultSkillIdx = sortedIndices[1].idx;
  }

  const markTraining = async () => {
    if (!options.actor || !options.skillKey || options.isSave) return;
    await game.legends?.training?.markTrainingCheckbox?.(options.actor, 'skill', options.skillKey);
  };

  return foundry.applications.api.DialogV2.wait({
    window: { title: `${isFortune ? 'Fortune' : 'Misfortune'} - Assign Dice` },
    position: { width: 400 },
    rejectClose: false,
    content: `
      <form class="legends-dice-assignment">
        <div class="form-group">
          <p style="margin-bottom: 10px;">
            <strong>Rolled 3d8:</strong> ${results.join(', ')}
          </p>
          <p style="font-size: 12px; color: #666; margin-bottom: 15px;">
            ${hint}
          </p>
        </div>

        <div class="form-group">
          <label>Assign to ${attrLabel}:</label>
          <select name="attrDie" style="width: 100%; padding: 5px;">
            ${results.map((die, idx) =>
              `<option value="${idx}" ${idx === defaultAttrIdx ? 'selected' : ''}>
                Die #${idx + 1}: ${die}
              </option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Assign to ${skillLabel}:</label>
          <select name="skillDie" style="width: 100%; padding: 5px;">
            ${results.map((die, idx) =>
              `<option value="${idx}" ${idx === defaultSkillIdx ? 'selected' : ''}>
                Die #${idx + 1}: ${die}
              </option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <p style="font-size: 11px; color: #999; margin-top: 10px;">
            Choose which 2 dice positions to use. Each die can only be used once.
          </p>
        </div>
      </form>
    `,
    buttons: [
      {
        action: "confirm",
        label: "Confirm Assignment",
        default: true,
        callback: async (event, button, dialog) => {
          const attrIdx = parseInt(dialog.element.querySelector('[name="attrDie"]').value);
          const skillIdx = parseInt(dialog.element.querySelector('[name="skillDie"]').value);

          if (attrIdx === skillIdx) {
            ui.notifications.error("Must assign different dice positions! Die #" + (attrIdx + 1) + " cannot be used twice.");
            return showDiceAssignmentDialog(options);
          }

          const attrDie = results[attrIdx];
          const skillDie = results[skillIdx];

          const usedIndices = new Set([attrIdx, skillIdx]);
          const discardedIdx = results.findIndex((_, idx) => !usedIndices.has(idx));
          const discarded = results[discardedIdx];

          const result = await rollD8CheckWithAssignedDice({
            ...options,
            attrDie, skillDie, discarded,
            allResults: results,
            fortune,
            misfortune
          });

          await markTraining();
          if (options.onRollComplete) await options.onRollComplete(result);
          return result;
        }
      },
      {
        action: "cancel",
        label: "Cancel"
      }
    ]
  });
}

/**
 * Roll with pre-assigned dice (for Fortune/Misfortune)
 * @param {Object} options - Roll options with assigned dice
 */
async function rollD8CheckWithAssignedDice(options) {
  const {
    actor,
    attrValue,
    skillValue,
    attrLabel,
    skillLabel,
    attrDie,
    skillDie,
    discarded,
    allResults,
    modifier = 0,
    applyToAttr = true,
    applyToSkill = true,
    fortune = 0,
    misfortune = 0,
    isSave = false
  } = options;
  
  // Apply modifiers based on checkboxes
  const attrModifier = applyToAttr ? modifier : 0;
  const skillModifier = applyToSkill ? modifier : 0;
  
  const modifiedAttrDie = attrDie + attrModifier;
  const modifiedSkillDie = skillDie + skillModifier;
  
  // Count successes
  let successes = 0;
  
  if (attrDie === 1) {
    successes++;
  } else if (attrDie !== 8 && modifiedAttrDie < attrValue) {
    successes++;
  }
  
  if (skillDie === 1) {
    successes++;
  } else if (skillDie !== 8 && modifiedSkillDie < skillValue) {
    successes++;
  }
  
// Check for critical success (double 1s)
const criticalSuccess = (attrDie === 1 && skillDie === 1);
if (criticalSuccess) {
  successes += 1; // Add +1 bonus success for critical
}
  
  const criticalFailure = (attrDie === 8 && skillDie === 8);
  if (criticalFailure) {
    successes = 0;
  }
  
  // Create message data
  const messageData = {
    actor: actor,
    actorId: actor.id,
    attrValue: attrValue,
    skillValue: skillValue,
    attrLabel: attrLabel,
    skillLabel: skillLabel,
    originalAttrDie: attrDie,
    originalSkillDie: skillDie,
    currentAttrDie: modifiedAttrDie,
    currentSkillDie: modifiedSkillDie,
    modifier: modifier,
    applyToAttr: applyToAttr,
    applyToSkill: applyToSkill,
    fortune: fortune,
    misfortune: misfortune,
    netFortune: fortune,
    netMisfortune: misfortune,
    discarded: discarded,
    isSave: isSave,
    luckSpent: 0,
    allResults: allResults
  };
  
  // Render and create message (same as rollD8Check)
  const content = await renderRollResult(messageData);
  const serializableData = {
    actorId: actor.id,
    attrValue: attrValue,
    skillValue: skillValue,
    attrLabel: attrLabel,
    skillLabel: skillLabel,
    originalAttrDie: attrDie,
    originalSkillDie: skillDie,
    currentAttrDie: modifiedAttrDie,
    currentSkillDie: modifiedSkillDie,
    modifier: modifier,
    applyToAttr: applyToAttr,
    applyToSkill: applyToSkill,
    fortune: fortune,
    misfortune: misfortune,
    netFortune: fortune,
    netMisfortune: misfortune,
    discarded: discarded,
    isSave: isSave,
    luckSpent: 0,
    allResults: allResults,
    successes: successes,
    criticalSuccess: criticalSuccess,
    criticalFailure: criticalFailure
  };

  const fakeRoll = Roll.fromData({
      class: "Roll",
      formula: `3d8`,
      terms: [{
        class: "Die",
        number: 3,
        faces: 8,
        results: allResults.map(r => ({ result: r, active: true }))
      }],
      total: allResults.reduce((a, b) => a + b, 0),
      evaluated: true
    });
  
  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: content,
    rolls: [fakeRoll],  // Pass the roll for Dice So Nice
    flags: {
      'legends.rollData': serializableData
    }
  });
  
  // Handle critical success
  if (criticalSuccess) {
    const maxLuck = actor.system.attributes.luck.value;
    await actor.update({ 'system.luck.current': maxLuck });
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="d8-luck-restore">${actor.name}'s Luck restored to ${maxLuck}!</div>`
    });
  }
  
  return {
    message: message,
    successes,
    criticalSuccess,
    criticalFailure
  };
}

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
    
// Apply modifiers based on flags (from dialog)
  const applyToAttr = options.applyToAttr !== undefined ? options.applyToAttr : true;
  const applyToSkill = options.applyToSkill !== undefined ? options.applyToSkill : true;
  
  const attrModifier = applyToAttr ? modifier : 0;
  const skillModifier = applyToSkill ? modifier : 0;
  
  const modifiedAttrDie = attrDie + attrModifier;
  const modifiedSkillDie = skillDie + skillModifier;

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
  
  const criticalSuccess = (attrDie === 1 && skillDie === 1);
  if (criticalSuccess) {
    successes += 1; // Add +1 bonus success for critical
  }
    
  // Check for critical failure (double 8s)
  const criticalFailure = (attrDie === 8 && skillDie === 8);
  if (criticalFailure) {
    successes = 0;
  }
  
// Store roll data for interactive luck spending
// Store roll data for rendering (includes actor object)
  const messageData = {
    actor: actor,
    actorId: actor.id,
    attrValue: attrValue,
    skillValue: skillValue,
    attrLabel: attrLabel,
    skillLabel: skillLabel,
    originalAttrDie: attrDie,
    originalSkillDie: skillDie,
    currentAttrDie: modifiedAttrDie,
    currentSkillDie: modifiedSkillDie,
    modifier: modifier,
    applyToAttr: applyToAttr,
    applyToSkill: applyToSkill,
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
  
  // Create serializable data WITHOUT actor object
  const serializableData = {
    actorId: actor.id,
    attrValue: attrValue,
    skillValue: skillValue,
    attrLabel: attrLabel,
    skillLabel: skillLabel,
    originalAttrDie: attrDie,
    originalSkillDie: skillDie,
    currentAttrDie: modifiedAttrDie,
    currentSkillDie: modifiedSkillDie,
    modifier: modifier,
    applyToAttr: applyToAttr,
    applyToSkill: applyToSkill,
    fortune: fortune,
    misfortune: misfortune,
    netFortune: netFortune,
    netMisfortune: netMisfortune,
    discarded: (netFortune > 0 || netMisfortune > 0) ? results[2] : null,
    isSave: isSave,
    luckSpent: 0,
    allResults: results,
    successes: successes,
    criticalSuccess: criticalSuccess,
    criticalFailure: criticalFailure
  };

  // Create chat message with serializable data
  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: content,
    rolls: [roll], 
    flags: {
      'legends.rollData': serializableData
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
  
  // currentAttrDie and currentSkillDie already have modifiers applied
  const modifiedAttrDie = currentAttrDie;
  const modifiedSkillDie = currentSkillDie;
  
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
  successes += 1; // Add +1 bonus success for critical
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
    primaryEnergyType = weave.system.energyCost.primary.type,
    supportingEnergyType = weave.system.energyCost.supporting.type,
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
  // First die checked against Potential, second die checked against Mastery
  const primaryDie1 = primaryResults[0];
  const primaryDie2 = primaryResults[1];
  
  // Check first die (Potential)
  const primaryModified1 = primaryDie1 + primaryOverspend;
  if (primaryDie1 === 1) {
    primarySuccesses++;
  } else if (primaryDie1 !== 8 && primaryModified1 < primaryPotential) {
    primarySuccesses++;
  }
  
  // Check second die (Mastery)
  const primaryModified2 = primaryDie2 + primaryOverspend;
  if (primaryDie2 === 1) {
    primarySuccesses++;
  } else if (primaryDie2 !== 8 && primaryModified2 < primaryMastery) {
    primarySuccesses++;
  }
  
  let supportingSuccesses = 0;
  let supportingResults = [];
  let supportingRoll = null;  // ADD THIS LINE
  
  if (supportingCost > 0 && supportingPotential > 0) {
    supportingRoll = new Roll('2d8');  // CHANGE: assign to supportingRoll
    await supportingRoll.evaluate();
    supportingResults = supportingRoll.dice[0].results.map(r => r.result);
    
    // First die checked against Potential, second die checked against Mastery
    const supportingDie1 = supportingResults[0];
    const supportingDie2 = supportingResults[1];
    
    // Check first die (Potential)
    const supportingModified1 = supportingDie1 + supportingOverspend;
    if (supportingDie1 === 1) {
      supportingSuccesses++;
    } else if (supportingDie1 !== 8 && supportingModified1 < supportingPotential) {
      supportingSuccesses++;
    }
    
    // Check second die (Mastery)
    const supportingModified2 = supportingDie2 + supportingOverspend;
    if (supportingDie2 === 1) {
      supportingSuccesses++;
    } else if (supportingDie2 !== 8 && supportingModified2 < supportingMastery) {
      supportingSuccesses++;
    }
  }
  
  let totalSuccesses = primarySuccesses + supportingSuccesses;

  // Check for critical
  const criticalSuccess = (primaryResults[0] === 1 && primaryResults[1] === 1) ||
                          (supportingResults.length > 0 && supportingResults[0] === 1 && supportingResults[1] === 1);

  if (criticalSuccess) {
    // Add +1 bonus success for critical
    totalSuccesses += 1;
    
    // Restore luck
    if (actor.system.luck) {
      await actor.update({ 'system.luck.current': actor.system.luck.max });
      ui.notifications.info(`${actor.name} rolled a critical success! All Luck restored!`);
    }
  }
  // Deduct energy
  const totalEnergyCost = primaryCost + supportingCost;
  const currentEnergy = actor.system.energy.current;
  
  if (totalSuccesses === 0) {
    // Failed weave - lose half energy
    const energyLost = Math.ceil(totalEnergyCost / 2);
    await actor.update({ 'system.energy.current': Math.max(0, currentEnergy - energyLost) });
  } else {
    // Successful weave - lose full energy
    await actor.update({ 'system.energy.current': Math.max(0, currentEnergy - totalEnergyCost) });
  }
  
  // Collect all rolls for Dice So Nice
  const allRolls = [primaryRoll];
  if (supportingRoll) allRolls.push(supportingRoll);
  
  // Create chat message
  const chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: await renderWeaveResult({
      weaveName: weave.name,
      primaryEnergy: primaryEnergyType,
      supportingEnergy: supportingEnergyType,
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
      supportingOverspend,
      actorId: actor.id,
      needsTargeting: true
    }),
    rolls: allRolls,
    flags: {
      'legends.weaveRollData': {
        actorId: actor.id,
        weaveId: weave.id,
        weaveName: weave.name,
        primaryEnergy: primaryEnergyType,
        supportingEnergy: supportingEnergyType,
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
        supportingOverspend,
        currentPrimaryDie1: primaryResults[0],
        currentPrimaryDie2: primaryResults[1],
        luckSpent: 0
      }
    }
  });
  
  return {
    successes: totalSuccesses,
    criticalSuccess,
    primarySuccesses,
    supportingSuccesses,
    // Return bonuses for targeting roll
    targetingBonus: totalSuccesses >= 5 ? 3 : (totalSuccesses >= 4 ? 2 : (totalSuccesses >= 3 ? 1 : 0))
  };
}

/**
 * Roll a targeting check (weave delivery)
 * @param {Object} options - Targeting roll options
 * @returns {Object} Roll result with targeting successes
 */
export async function rollTargetingCheck(options = {}) {
  const {
    actor,
    weave,
    castingStat,
    castingStatLabel,
    primaryEnergyType = weave.system.energyCost.primary.type,
    primaryMastery,
    weavingBonus = 0, // Bonus from weaving roll (0-3)
    bonusApplication = 'stacked' // 'stacked' or 'split'
  } = options;
  
  // castingStatValue is an alias for castingStat (numeric value)
  const castingStatValue = castingStat;
  
  // Roll 2d8 for targeting (Casting Stat + Primary Energy Mastery)
  const targetingRoll = new Roll('2d8');
  await targetingRoll.evaluate();
  const targetingResults = targetingRoll.dice[0].results.map(r => r.result);
  
  let targetingSuccesses = 0;
  const targetingDie1 = targetingResults[0];
  const targetingDie2 = targetingResults[1];
  
  // Apply weaving bonuses to dice results
  let modifiedDie1 = targetingDie1;
  let modifiedDie2 = targetingDie2;
  
  if (weavingBonus > 0) {
    if (bonusApplication === 'stacked') {
      // Apply all bonus to first die
      modifiedDie1 = Math.max(1, targetingDie1 - weavingBonus);
    } else {
      // Split bonus between dice (user chooses, default to balanced)
      // For now, apply to die that benefits most
      const die1Benefit = (targetingDie1 > castingStat && targetingDie1 !== 8) ? 1 : 0;
      const die2Benefit = (targetingDie2 > primaryMastery && targetingDie2 !== 8) ? 1 : 0;
      
      if (die1Benefit > die2Benefit) {
        modifiedDie1 = Math.max(1, targetingDie1 - weavingBonus);
      } else if (die2Benefit > die1Benefit) {
        modifiedDie2 = Math.max(1, targetingDie2 - weavingBonus);
      } else {
        // Equal benefit or no benefit, split evenly
        const bonus1 = Math.floor(weavingBonus / 2);
        const bonus2 = weavingBonus - bonus1;
        modifiedDie1 = Math.max(1, targetingDie1 - bonus1);
        modifiedDie2 = Math.max(1, targetingDie2 - bonus2);
      }
    }
  }
  
  // Check first die (Casting Stat)
  if (targetingDie1 === 1) {
    targetingSuccesses++;
  } else if (targetingDie1 !== 8 && modifiedDie1 < castingStat) {
    targetingSuccesses++;
  }
  
  // Check second die (Primary Mastery)
  if (targetingDie2 === 1) {
    targetingSuccesses++;
  } else if (targetingDie2 !== 8 && modifiedDie2 < primaryMastery) {
    targetingSuccesses++;
  }
  
  // Check for critical
  const criticalSuccess = (targetingDie1 === 1 && targetingDie2 === 1);
  
  if (criticalSuccess) {
    // Add +1 bonus success for critical
    targetingSuccesses = Math.min(3, targetingSuccesses + 1);
    
    // Restore luck
    if (actor.system.luck) {
      await actor.update({ 'system.luck.current': actor.system.luck.max });
      ui.notifications.info(`${actor.name} rolled a critical success on targeting! All Luck restored!`);
    }
  }
  
  // Create chat message for targeting roll
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: await renderTargetingResult({
      weaveName: weave.name,
      castingStat,
      castingStatValue,
      castingStatLabel: castingStatLabel || 'Casting Stat',
      primaryMastery,
      primaryMasteryLabel: primaryEnergyType,
      targetingResults,
      modifiedDie1,
      modifiedDie2,
      weavingBonus,
      targetingSuccesses,
      criticalSuccess,
      actorId: actor.id
    }),
    flags: {
      'legends.targetingRollData': {
        actorId: actor.id,
        weaveId: weave.id,
        weaveName: weave.name,
        castingStat,
        castingStatValue,
        castingStatLabel: castingStatLabel || 'Casting Stat',
        primaryMastery,
        primaryMasteryLabel: primaryEnergyType,
        targetingResults,
        currentTargetingDie1: targetingResults[0],
        currentTargetingDie2: targetingResults[1],
        weavingBonus,
        targetingSuccesses,
        criticalSuccess,
        luckSpent: 0
      }
    }
  });
  
  return {
    successes: targetingSuccesses,
    criticalSuccess,
    targetingResults,
    modifiedDie1,
    modifiedDie2,
    weavingBonus,
    castingStat,
    primaryMastery
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
    discarded,
    applyToAttr = true,
    applyToSkill = true
  } = data;
  
  // Get actor - handle both full actor object and actorId
  const actor = data.actor ? data.actor : game.actors.get(data.actorId);
  const currentLuck = actor.system.luck?.current ?? actor.system.attributes.luck.value;
  
  // ... rest of function stays the same
  
  // Calculate current results
  const result = calculateSuccesses(data);
  const { successes, criticalSuccess, criticalFailure } = result;
  // Determine which modifier was applied to each die
  const attrModifier = applyToAttr ? modifier : 0;
  const skillModifier = applyToSkill ? modifier : 0;
  const modifiedAttrDie = currentAttrDie;
  const modifiedSkillDie = currentSkillDie;

  const fortuneText = netFortune > 0 ? `<span class="fortune">Fortune (${netFortune})</span>` : '';
  const misfortuneText = netMisfortune > 0 ? `<span class="misfortune">Misfortune (${netMisfortune})</span>` : '';
  let modifierText = '';
  if (attrModifier !== 0 || skillModifier !== 0) {
    modifierText = `<span class="modifier">Modifier: ${attrModifier !== 0 ? (attrModifier > 0 ? '+' : '') + attrModifier + ' (Attribute)' : ''}${(attrModifier !== 0 && skillModifier !== 0) ? ', ' : ''}${skillModifier !== 0 ? (skillModifier > 0 ? '+' : '') + skillModifier + ' (Skill)' : ''}</span>`;
  }

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

  // Show luck spending buttons only if PLAYER CHARACTER has luck and can reduce dice
  const isPlayerCharacter = actor.type === "character" && actor.hasPlayerOwner;
  const canSpendOnAttr = isPlayerCharacter && currentLuck > data.luckSpent && currentAttrDie > 1 && originalAttrDie !== 1 && originalAttrDie !== 8;
  const canSpendOnSkill = isPlayerCharacter && currentLuck > data.luckSpent && currentSkillDie > 1 && originalSkillDie !== 1 && originalSkillDie !== 8;

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
      <div class="roll-summary" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: 8px;">
        <div>
          <strong>${skillLabel}${isSave ? ' Save' : ''}</strong> - 
          <strong style="font-size: 1.1em;">Successes: ${successes}</strong>
          ${criticalSuccess ? '<span class="crit-text" style="margin-left: 8px;">CRITICAL!</span>' : ''}
          ${criticalFailure ? '<span class="crit-text" style="margin-left: 8px;">CRITICAL FAILURE!</span>' : ''}
        </div>
        <i class="fas fa-chevron-down toggle-details" style="transition: transform 0.2s;"></i>
      </div>
      <div class="roll-details" style="display: none;">
        <div class="dice-results">
          <div class="die-result" style="margin-bottom: 12px;">
            <div style="margin-bottom: 4px;">
              <strong>${attrLabel} Check: ${attrValue}</strong>
            </div>
            <div class="${originalAttrDie === 1 ? 'natural-one' : originalAttrDie === 8 ? 'natural-eight' : ''}">
              Die Roll: ${originalAttrDie}, Modifier: ${attrModifier >= 0 ? '+' : ''}${attrModifier}, Total: ${modifiedAttrDie}
            </div>
          </div>
          <div class="die-result" style="margin-bottom: 12px;">
            <div style="margin-bottom: 4px;">
              <strong>${skillLabel} Check: ${skillValue}</strong>
            </div>
            <div class="${originalSkillDie === 1 ? 'natural-one' : originalSkillDie === 8 ? 'natural-eight' : ''}">
              Die Roll: ${originalSkillDie}, Modifier: ${skillModifier >= 0 ? '+' : ''}${skillModifier}, Total: ${modifiedSkillDie}
            </div>
          </div>
        </div>
        ${allDiceText}
        <div class="modifiers">
          ${fortuneText}
          ${misfortuneText}
          ${modifierText}
        </div>
        ${luckRestoreText}
        ${luckSpentText}
        ${luckButtons}
      </div>
    </div>
  `;
}

// Render a weave result
 async function renderWeaveResult(data) {
  const actor = data.actor || (data.actorId ? game.actors.get(data.actorId) : null);
  const currentLuck = actor ? (actor.system.luck?.current ?? actor.system.attributes.luck.value) : 0;
  const isPlayerCharacter = actor && actor.type === "character" && actor.hasPlayerOwner;
  
  const primaryOverspendText = data.primaryOverspend > 0 ? 
    `<span class="overspend">Overspending: +${data.primaryOverspend} to dice</span>` : '';
  const supportingOverspendText = data.supportingOverspend > 0 ? 
    `<span class="overspend">Overspending: +${data.supportingOverspend} to dice</span>` : '';
  
  // Primary energy dice breakdown
  const primaryDice1 = data.currentPrimaryDie1 ?? data.primaryResults[0];
  const primaryDice2 = data.currentPrimaryDie2 ?? data.primaryResults[1];
  const originalPrimaryDice1 = data.primaryResults[0];
  const originalPrimaryDice2 = data.primaryResults[1];
  const primaryModified1 = primaryDice1 + data.primaryOverspend;
  const primaryModified2 = primaryDice2 + data.primaryOverspend;
  
  // Determine success for each primary die
  const primary1Success = primaryDice1 === 1 || (primaryDice1 !== 8 && primaryModified1 < data.primaryPotential);
  const primary2Success = primaryDice2 === 1 || (primaryDice2 !== 8 && primaryModified2 < data.primaryMastery);
  
  // Check luck spending availability for primary dice
  const luckSpent = data.luckSpent || 0;
  const canSpendOnPrimary1 = isPlayerCharacter && currentLuck > luckSpent && primaryDice1 > 1 && originalPrimaryDice1 !== 1 && originalPrimaryDice1 !== 8;
  const canSpendOnPrimary2 = isPlayerCharacter && currentLuck > luckSpent && primaryDice2 > 1 && originalPrimaryDice2 !== 1 && originalPrimaryDice2 !== 8;
  
  const supportingSection = data.supportingEnergy ? `
    <div class="energy-section supporting">
      <h4>Supporting: ${data.supportingEnergy.charAt(0).toUpperCase() + data.supportingEnergy.slice(1)} (${data.supportingCost} Energy)</h4>
      <div class="dice-results">
        <div class="die-result" style="margin-bottom: 8px;">
          <div style="margin-bottom: 4px;">
            <strong>Potential Check: ${data.supportingPotential}</strong>
          </div>
          <div class="${data.supportingResults[0] === 1 ? 'natural-one' : data.supportingResults[0] === 8 ? 'natural-eight' : ''}">
            Die Roll: ${data.supportingResults[0]}, Modifier: ${data.supportingOverspend >= 0 ? '+' : ''}${data.supportingOverspend}, Total: ${data.supportingResults[0] + data.supportingOverspend}
            ${(() => {
              const die = data.supportingResults[0];
              const total = die + data.supportingOverspend;
              const success = die === 1 || (die !== 8 && total < data.supportingPotential);
              if (die === 1) return ' <span class="success-indicator">✓ (Natural 1 - Success!)</span>';
              if (die === 8) return ' <span class="failure-indicator">✗ (Natural 8 - Failure!)</span>';
              return success ? ' <span class="success-indicator">✓ Success</span>' : ' <span class="failure-indicator">✗ Failure</span>';
            })()}
          </div>
        </div>
        <div class="die-result">
          <div style="margin-bottom: 4px;">
            <strong>Mastery Check: ${data.supportingMastery}</strong>
          </div>
          <div class="${data.supportingResults[1] === 1 ? 'natural-one' : data.supportingResults[1] === 8 ? 'natural-eight' : ''}">
            Die Roll: ${data.supportingResults[1]}, Modifier: ${data.supportingOverspend >= 0 ? '+' : ''}${data.supportingOverspend}, Total: ${data.supportingResults[1] + data.supportingOverspend}
            ${(() => {
              const die = data.supportingResults[1];
              const total = die + data.supportingOverspend;
              const success = die === 1 || (die !== 8 && total < data.supportingMastery);
              if (die === 1) return ' <span class="success-indicator">✓ (Natural 1 - Success!)</span>';
              if (die === 8) return ' <span class="failure-indicator">✗ (Natural 8 - Failure!)</span>';
              return success ? ' <span class="success-indicator">✓ Success</span>' : ' <span class="failure-indicator">✗ Failure</span>';
            })()}
          </div>
        </div>
      </div>
      ${supportingOverspendText}
      <div class="energy-successes">Successes: ${data.supportingSuccesses}</div>
    </div>
  ` : '';
  
  return `
    <div class="d8-roll weave-roll ${data.criticalSuccess ? 'critical-success' : ''}">
      <div class="roll-summary" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: 8px;">
        <div>
          <strong>Weave: ${data.weaveName}</strong> - 
          <strong style="font-size: 1.1em;">Successes: ${data.totalSuccesses}</strong>
          ${data.criticalSuccess ? '<span class="crit-text" style="margin-left: 8px;">CRITICAL!</span>' : ''}
        </div>
        <i class="fas fa-chevron-down toggle-details" style="transition: transform 0.2s;"></i>
      </div>
      ${data.needsTargeting !== false ? `
        <div class="targeting-button-container" style="margin-bottom: 8px; text-align: center;">
          <button class="roll-targeting-btn" data-message-id="{{messageId}}" style="padding: 8px 16px; font-size: 14px; font-weight: bold; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            <i class="fas fa-magic"></i> Roll Targeting
          </button>
        </div>
      ` : ''}
      <div class="roll-details" style="display: none;">
        <div class="energy-section primary">
          <h4>Primary: ${data.primaryEnergy.charAt(0).toUpperCase() + data.primaryEnergy.slice(1)} (${data.primaryCost} Energy)</h4>
          <div class="dice-results">
            <div class="die-result" style="margin-bottom: 8px;">
              <div style="margin-bottom: 4px;">
                <strong>Potential Check: ${data.primaryPotential}</strong>
              </div>
              <div class="${primaryDice1 === 1 ? 'natural-one' : primaryDice1 === 8 ? 'natural-eight' : ''}">
                Die Roll: ${primaryDice1}, Modifier: ${data.primaryOverspend >= 0 ? '+' : ''}${data.primaryOverspend}, Total: ${primaryModified1}
                ${(() => {
                  if (primaryDice1 === 1) return ' <span class="success-indicator">✓ (Natural 1 - Success!)</span>';
                  if (primaryDice1 === 8) return ' <span class="failure-indicator">✗ (Natural 8 - Failure!)</span>';
                  return primary1Success ? ' <span class="success-indicator">✓ Success</span>' : ' <span class="failure-indicator">✗ Failure</span>';
                })()}
              </div>
            </div>
            <div class="die-result">
              <div style="margin-bottom: 4px;">
                <strong>Mastery Check: ${data.primaryMastery}</strong>
              </div>
              <div class="${primaryDice2 === 1 ? 'natural-one' : primaryDice2 === 8 ? 'natural-eight' : ''}">
                Die Roll: ${primaryDice2}, Modifier: ${data.primaryOverspend >= 0 ? '+' : ''}${data.primaryOverspend}, Total: ${primaryModified2}
                ${(() => {
                  if (primaryDice2 === 1) return ' <span class="success-indicator">✓ (Natural 1 - Success!)</span>';
                  if (primaryDice2 === 8) return ' <span class="failure-indicator">✗ (Natural 8 - Failure!)</span>';
                  return primary2Success ? ' <span class="success-indicator">✓ Success</span>' : ' <span class="failure-indicator">✗ Failure</span>';
                })()}
              </div>
            </div>
          </div>
          ${primaryOverspendText}
          <div class="energy-successes">Successes: ${data.primarySuccesses}</div>
        </div>
        ${supportingSection}
        <div class="energy-cost">
          <strong>Energy Cost:</strong> ${data.primaryCost + data.supportingCost}
        </div>
        ${luckSpent > 0 ? `<div class="luck-spent"><i class="fas fa-coins"></i> Luck Spent: ${luckSpent}</div>` : ''}
        ${(canSpendOnPrimary1 || canSpendOnPrimary2) ? `
          <div class="luck-spending">
            <div class="luck-header">
              <strong>Spend Luck?</strong> (Current: ${currentLuck})
            </div>
            <div class="luck-buttons">
              ${canSpendOnPrimary1 ? `<button class="spend-luck-weave-btn" data-target="primary1" data-message-id="{{messageId}}">
                <i class="fas fa-arrow-down"></i> Reduce Potential die (${primaryDice1} → ${primaryDice1 - 1})
              </button>` : ''}
              ${canSpendOnPrimary2 ? `<button class="spend-luck-weave-btn" data-target="primary2" data-message-id="{{messageId}}">
                <i class="fas fa-arrow-down"></i> Reduce Mastery die (${primaryDice2} → ${primaryDice2 - 1})
              </button>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Render a targeting roll result
async function renderTargetingResult(data) {
  const actor = data.actor || (data.actorId ? game.actors.get(data.actorId) : null);
  const currentLuck = actor ? (actor.system.luck?.current ?? actor.system.attributes.luck.value) : 0;
  const isPlayerCharacter = actor && actor.type === "character" && actor.hasPlayerOwner;
  
  const { 
    weaveName, 
    castingStat,
    castingStatValue,
    castingStatLabel,
    primaryMastery,
    primaryMasteryLabel,
    targetingResults, 
    weavingBonus, 
    targetingSuccesses, 
    criticalSuccess 
  } = data;
  
  // Get current dice (may be modified by luck)
  const die1 = data.currentTargetingDie1 ?? targetingResults[0];
  const die2 = data.currentTargetingDie2 ?? targetingResults[1];
  const originalDie1 = targetingResults[0];
  const originalDie2 = targetingResults[1];
  
  // Calculate modified dice with weaving bonus
  let modifiedDie1 = die1;
  let modifiedDie2 = die2;
  if (weavingBonus > 0) {
    modifiedDie1 = Math.max(1, die1 - weavingBonus);
  }
  
  // Determine success for each die
  const die1Success = die1 === 1 || (die1 !== 8 && modifiedDie1 < castingStatValue);
  const die2Success = die2 === 1 || (die2 !== 8 && modifiedDie2 < primaryMastery);
  
  // Check luck spending availability
  const luckSpent = data.luckSpent || 0;
  const canSpendOnDie1 = isPlayerCharacter && currentLuck > luckSpent && die1 > 1 && originalDie1 !== 1 && originalDie1 !== 8;
  const canSpendOnDie2 = isPlayerCharacter && currentLuck > luckSpent && die2 > 1 && originalDie2 !== 1 && originalDie2 !== 8;
  
  const bonusText = weavingBonus > 0 ? 
    `<div class="weaving-bonus">Weaving Bonus: -${weavingBonus} applied to dice</div>` : '';
  
  // Luck restore notification
  let luckRestoreText = '';
  if (criticalSuccess) {
    luckRestoreText = '<div class="luck-restore"><i class="fas fa-star"></i> All Luck Restored!</div>';
  }
  
  return `
    <div class="d8-roll weave-targeting ${criticalSuccess ? 'critical-success' : ''}">
      <div class="roll-summary" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: 8px;">
        <div>
          <strong>Targeting: ${weaveName}</strong> - 
          <strong style="font-size: 1.1em;">Successes: ${data.recalculatedSuccesses ?? targetingSuccesses}</strong>
          ${criticalSuccess ? '<span class="crit-text" style="margin-left: 8px;">CRITICAL!</span>' : ''}
        </div>
        <i class="fas fa-chevron-down toggle-details" style="transition: transform 0.2s;"></i>
      </div>
      <div class="roll-details" style="display: none;">
        ${bonusText}
        <div class="dice-results">
          <div class="die-result" style="margin-bottom: 8px;">
            <div style="margin-bottom: 4px;">
              <strong>${castingStatLabel} Check: ${castingStatValue}</strong>
            </div>
            <div class="${die1 === 1 ? 'natural-one' : die1 === 8 ? 'natural-eight' : ''}">
              Die Roll: ${die1}${weavingBonus > 0 ? `, Modified: ${modifiedDie1}` : ''}
              ${(() => {
                if (die1 === 1) return ' <span class="success-indicator">✓ (Natural 1 - Success!)</span>';
                if (die1 === 8) return ' <span class="failure-indicator">✗ (Natural 8 - Failure!)</span>';
                return die1Success ? ' <span class="success-indicator">✓ Success</span>' : ' <span class="failure-indicator">✗ Failure</span>';
              })()}
            </div>
          </div>
          <div class="die-result">
            <div style="margin-bottom: 4px;">
              <strong>${primaryMasteryLabel} Mastery Check: ${primaryMastery}</strong>
            </div>
            <div class="${die2 === 1 ? 'natural-one' : die2 === 8 ? 'natural-eight' : ''}">
              Die Roll: ${die2}${weavingBonus > 0 ? `, Modified: ${modifiedDie2}` : ''}
              ${(() => {
                if (die2 === 1) return ' <span class="success-indicator">✓ (Natural 1 - Success!)</span>';
                if (die2 === 8) return ' <span class="failure-indicator">✗ (Natural 8 - Failure!)</span>';
                return die2Success ? ' <span class="success-indicator">✓ Success</span>' : ' <span class="failure-indicator">✗ Failure</span>';
              })()}
            </div>
          </div>
        </div>
        ${luckRestoreText}
        ${luckSpent > 0 ? `<div class="luck-spent"><i class="fas fa-coins"></i> Luck Spent: ${luckSpent}</div>` : ''}
        ${(canSpendOnDie1 || canSpendOnDie2) ? `
          <div class="luck-spending">
            <div class="luck-header">
              <strong>Spend Luck?</strong> (Current: ${currentLuck})
            </div>
            <div class="luck-buttons">
              ${canSpendOnDie1 ? `<button class="spend-luck-targeting-btn" data-target="die1" data-message-id="{{messageId}}">
                <i class="fas fa-arrow-down"></i> Reduce ${castingStatLabel} die (${die1} → ${die1 - 1})
              </button>` : ''}
              ${canSpendOnDie2 ? `<button class="spend-luck-targeting-btn" data-target="die2" data-message-id="{{messageId}}">
                <i class="fas fa-arrow-down"></i> Reduce Mastery die (${die2} → ${die2 - 1})
              </button>` : ''}
            </div>
          </div>
        ` : ''}
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
  
  const rollData = message.flags.legends?.rollData;
  if (!rollData) return;
  
  const actor = game.actors.get(rollData.actorId);
  if (!actor) return;
  
  if (actor.type !== "character" || !actor.hasPlayerOwner) {
    ui.notifications.warn("NPCs cannot spend Luck!");
  return;
  }

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
  
  // Recalculate successes after modifying dice
  const updatedResult = calculateSuccesses(rollData);
  rollData.successes = updatedResult.successes;
  rollData.criticalSuccess = updatedResult.criticalSuccess;
  rollData.criticalFailure = updatedResult.criticalFailure;
  
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
 * Handle spending luck on a weave roll
 * @param {string} messageId - Chat message ID
 * @param {string} target - Which die to reduce ('primary1' or 'primary2')
 */
export async function spendLuckOnWeave(messageId, target) {
  const message = game.messages.get(messageId);
  if (!message) return;
  
  const weaveData = message.flags.legends?.weaveRollData;
  if (!weaveData) return;
  
  const actor = game.actors.get(weaveData.actorId);
  if (!actor) return;
  
  if (actor.type !== "character" || !actor.hasPlayerOwner) {
    ui.notifications.warn("NPCs cannot spend Luck!");
    return;
  }

  const currentLuck = actor.system.luck?.current ?? actor.system.attributes.luck.value;
  if (currentLuck < 1) {
    ui.notifications.warn("Not enough Luck!");
    return;
  }
  
  // Determine which die to reduce
  if (target === 'primary1') {
    if (weaveData.currentPrimaryDie1 <= 1 || weaveData.primaryResults[0] === 1 || weaveData.primaryResults[0] === 8) {
      ui.notifications.warn("Cannot reduce this die further!");
      return;
    }
    weaveData.currentPrimaryDie1 -= 1;
  } else if (target === 'primary2') {
    if (weaveData.currentPrimaryDie2 <= 1 || weaveData.primaryResults[1] === 1 || weaveData.primaryResults[1] === 8) {
      ui.notifications.warn("Cannot reduce this die further!");
      return;
    }
    weaveData.currentPrimaryDie2 -= 1;
  }
  
  weaveData.luckSpent = (weaveData.luckSpent || 0) + 1;
  
  // Recalculate successes with new dice values
  const primaryModified1 = weaveData.currentPrimaryDie1 + weaveData.primaryOverspend;
  const primaryModified2 = weaveData.currentPrimaryDie2 + weaveData.primaryOverspend;
  
  let newPrimarySuccesses = 0;
  if (weaveData.currentPrimaryDie1 === 1 || (weaveData.currentPrimaryDie1 !== 8 && primaryModified1 < weaveData.primaryPotential)) {
    newPrimarySuccesses++;
  }
  if (weaveData.currentPrimaryDie2 === 1 || (weaveData.currentPrimaryDie2 !== 8 && primaryModified2 < weaveData.primaryMastery)) {
    newPrimarySuccesses++;
  }
  
  weaveData.primarySuccesses = newPrimarySuccesses;
  weaveData.totalSuccesses = newPrimarySuccesses + (weaveData.supportingSuccesses || 0);
  
  // Update actor's luck
  await actor.update({ 'system.luck.current': currentLuck - 1 });
  
  // Re-render the message
  const newContent = await renderWeaveResult({
    ...weaveData,
    actor,
    needsTargeting: true
  });
  await message.update({
    content: newContent.replace('{{messageId}}', messageId),
    flags: {
      'legends.weaveRollData': weaveData
    }
  });
  
  ui.notifications.info(`Spent 1 Luck. ${currentLuck - 1} remaining.`);
}

/**
 * Handle spending luck on a targeting roll
 * @param {string} messageId - Chat message ID
 * @param {string} target - Which die to reduce ('die1' or 'die2')
 */
export async function spendLuckOnTargeting(messageId, target) {
  const message = game.messages.get(messageId);
  if (!message) return;
  
  const targetingData = message.flags.legends?.targetingRollData;
  if (!targetingData) return;
  
  const actor = game.actors.get(targetingData.actorId);
  if (!actor) return;
  
  if (actor.type !== "character" || !actor.hasPlayerOwner) {
    ui.notifications.warn("NPCs cannot spend Luck!");
    return;
  }

  const currentLuck = actor.system.luck?.current ?? actor.system.attributes.luck.value;
  if (currentLuck < 1) {
    ui.notifications.warn("Not enough Luck!");
    return;
  }
  
  // Determine which die to reduce
  if (target === 'die1') {
    if (targetingData.currentTargetingDie1 <= 1 || targetingData.targetingResults[0] === 1 || targetingData.targetingResults[0] === 8) {
      ui.notifications.warn("Cannot reduce this die further!");
      return;
    }
    targetingData.currentTargetingDie1 -= 1;
  } else if (target === 'die2') {
    if (targetingData.currentTargetingDie2 <= 1 || targetingData.targetingResults[1] === 1 || targetingData.targetingResults[1] === 8) {
      ui.notifications.warn("Cannot reduce this die further!");
      return;
    }
    targetingData.currentTargetingDie2 -= 1;
  }
  
  targetingData.luckSpent = (targetingData.luckSpent || 0) + 1;
  
  // Recalculate successes with new dice values
  const die1 = targetingData.currentTargetingDie1;
  const die2 = targetingData.currentTargetingDie2;
  const modifiedDie1 = Math.max(1, die1 - (targetingData.weavingBonus || 0));
  const modifiedDie2 = die2;
  
  let newSuccesses = 0;
  if (die1 === 1 || (die1 !== 8 && modifiedDie1 < targetingData.castingStatValue)) {
    newSuccesses++;
  }
  if (die2 === 1 || (die2 !== 8 && modifiedDie2 < targetingData.primaryMastery)) {
    newSuccesses++;
  }
  
  targetingData.recalculatedSuccesses = newSuccesses;
  
  // Update actor's luck
  await actor.update({ 'system.luck.current': currentLuck - 1 });
  
  // Re-render the message
  const newContent = await renderTargetingResult({
    ...targetingData,
    actor
  });
  await message.update({
    content: newContent.replace('{{messageId}}', messageId),
    flags: {
      'legends.targetingRollData': targetingData
    }
  });
  
  ui.notifications.info(`Spent 1 Luck. ${currentLuck - 1} remaining.`);
}

/**
 * Handle rolling targeting check from weave message
 * @param {string} messageId - Chat message ID
 */
export async function rollTargetingFromWeave(messageId) {
  const message = game.messages.get(messageId);
  if (!message) return;
  
  const weaveData = message.flags.legends?.weaveRollData;
  if (!weaveData) return;
  
  const actor = game.actors.get(weaveData.actorId);
  const weave = actor?.items.get(weaveData.weaveId);
  if (!actor || !weave) return;
  
  // Get casting stat info
  const castingStat = actor.system.castingStat?.value || 'intelligence';
  const castingStatValue = actor.system.attributes[castingStat]?.value || 0;
  const castingStatLabel = castingStat.charAt(0).toUpperCase() + castingStat.slice(1);
  
  // Calculate targeting bonus from weaving successes
  const targetingBonus = weaveData.totalSuccesses >= 5 ? 3 : (weaveData.totalSuccesses >= 4 ? 2 : (weaveData.totalSuccesses >= 3 ? 1 : 0));
  
  // Roll targeting check
  await rollTargetingCheck({
    actor,
    weave,
    castingStat: castingStatValue,
    castingStatLabel,
    primaryEnergyType: weaveData.primaryEnergy,
    primaryMastery: weaveData.primaryMastery,
    weavingBonus: targetingBonus,
    bonusApplication: 'stacked'
  });
}

/**
 * Initialize luck spending button handlers
 */
export function initializeLuckHandlers() {
  Hooks.on('renderChatMessageHTML', (message, html) => {
    // Luck spending buttons
    html.querySelectorAll('.spend-luck-btn').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        const target = btn.dataset.target;
        await spendLuckOnRoll(message.id, target);
      });
    });
    
    // Weave luck spending buttons
    html.querySelectorAll('.spend-luck-weave-btn').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        const target = btn.dataset.target;
        await spendLuckOnWeave(message.id, target);
      });
    });
    
    // Targeting luck spending buttons
    html.querySelectorAll('.spend-luck-targeting-btn').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        const target = btn.dataset.target;
        await spendLuckOnTargeting(message.id, target);
      });
    });
    
    // Roll targeting buttons
    html.querySelectorAll('.roll-targeting-btn').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        // Disable button after click
        btn.disabled = true;
        btn.textContent = 'Rolling...';
        await rollTargetingFromWeave(message.id);
      });
    });
    
    // Collapsible roll details
    html.querySelectorAll('.roll-summary').forEach(summary => {
      summary.addEventListener('click', (event) => {
        const rollCard = summary.closest('.d8-roll');
        const details = rollCard.querySelector('.roll-details');
        const chevron = summary.querySelector('.toggle-details');
        
        if (details.style.display === 'none') {
          details.style.display = 'block';
          chevron.style.transform = 'rotate(180deg)';
        } else {
          details.style.display = 'none';
          chevron.style.transform = 'rotate(0deg)';
        }
      });
    });
  });
}