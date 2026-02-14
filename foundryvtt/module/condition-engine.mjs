/**
 * Legends D8 TTRPG Condition Engine
 * Handles automatic condition mechanics: damage ticks, recovery saves, downgrades, and roll modifiers
 * Foundry VTT V13 - Uses renderChatMessageHTML hook (native DOM, not jQuery)
 */

/**
 * Enrich a string containing [[/check ...]], [[/save ...]], [[/damage ...]] enricher syntax.
 * Falls back to returning the original string if TextEditor is unavailable.
 * @param {string} text - Raw text potentially containing enricher patterns
 * @returns {Promise<string>} Enriched HTML string
 */
async function enrichText(text) {
  if (!text) return '';
  try {
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    return await TextEditor.enrichHTML(text, { async: true });
  } catch {
    return text;
  }
}

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
  // Process end-of-turn for the PREVIOUS combatant
  const previousTurn = options?.direction === 1
    ? (combat.turn === 0 ? combat.turns.length - 1 : combat.turn - 1)
    : (combat.turn === combat.turns.length - 1 ? 0 : combat.turn + 1);
  const previousCombatant = combat.turns[previousTurn];

  if (previousCombatant?.actor) {
    console.log(`Legends | Processing end-of-turn conditions for ${previousCombatant.actor.name}`);
    await processConditionsAtTiming(previousCombatant.actor, 'endOfTurn');
  }

  // Process start-of-turn for the CURRENT combatant
  const combatant = combat.combatant;
  if (!combatant || !combatant.actor) return;

  console.log(`Legends | Processing start-of-turn conditions for ${combatant.actor.name}`);
  await processConditionsAtTiming(combatant.actor, 'startOfTurn');
}

/**
 * Handle round start in combat
 * @param {Combat} combat - The combat instance
 * @param {object} updateData - The update data
 */
async function handleCombatRound(combat, updateData) {
  // NOTE: End-of-turn for the last combatant is already handled by handleCombatTurn
  // when advancing to the next round, so we don't need to process it again here.
  
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

  // Separate conditions by whether they have damage ticks and/or recovery at this timing
  const damageTicks = [];
  const recoveries = [];

  for (const condition of conditions) {
    const hasDamageTick = condition.system.damageTick?.frequency === timing;
    const hasRecovery = condition.system.recovery?.trigger === timing;

    if (hasDamageTick) damageTicks.push(condition);
    if (hasRecovery) recoveries.push(condition);
  }

  // Build a set of conditions that already have explicit recovery prompts at this timing
  const recoveryNames = new Set(recoveries.map(c => c.name));

  // Only show messages if there are conditions to process
  if (damageTicks.length === 0 && recoveries.length === 0) {
    return;
  }

  // Show a summary of active conditions at this timing
  const conditionNames = [...new Set([...damageTicks, ...recoveries].map(c => c.name))];
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="d8-condition-turn-prompt" style="background: rgba(255, 200, 100, 0.2); padding: 8px; border-left: 3px solid #ed8936; margin: 4px 0;">
      <strong style="color: #c05621;">⚠️ ${actor.name}</strong> is affected by: <strong>${conditionNames.join(', ')}</strong>
    </div>`
  });

  if (timing === 'endOfTurn') {
    // End of turn: recovery prompts FIRST (chance to avoid damage), then damage
    for (const condition of recoveries) {
      await processRecoverySave(actor, condition);
    }
    // Apply damage ticks (no separate warning needed - summary above is sufficient)
    for (const condition of damageTicks) {
      await processDamageTick(actor, condition);
    }
  } else {
    // Start of turn / each round: damage FIRST (guaranteed hit), then recovery prompt
    for (const condition of damageTicks) {
      await processDamageTick(actor, condition);
    }
    for (const condition of recoveries) {
      await processRecoverySave(actor, condition);
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
  let formula = damageTick.formula;

  // Skip damage if actor is at 0 HP or below (e.g. bleeding stops while dying)
  const currentHP = actor.system.hp?.value ?? 0;
  if (currentHP <= 0) {
    console.log(`Legends | Skipping ${condition.name} damage tick for ${actor.name} (at 0 HP)`);
    return;
  }

  // Handle stacking conditions (e.g., Bleeding does 2 damage per stack)
  const stacks = condition.system.stacks || 1;
  if (condition.system.stacking === 'stack' && stacks > 1) {
    // Multiply the formula by stack count
    formula = `(${formula}) * ${stacks}`;
  }

  // Roll damage
  const roll = new Roll(formula);
  await roll.evaluate();
  let damageAmount = roll.total;

  // Extract damage type from chatMessage or damageTick configuration
  let damageType = 'untyped';
  const chatMessage = damageTick.chatMessage || '';
  const typeMatch = chatMessage.match(/type=(\w+)/i);
  if (typeMatch) {
    damageType = typeMatch[1].toLowerCase();
  }

  // Calculate DR and apply it
  let drApplied = 0;
  const energyTypes = ['fire', 'cold', 'lightning', 'necrotic', 'poison', 'radiant', 'acid'];
  const isEnergyDamage = energyTypes.includes(damageType);
  
  // Get actor's DR
  let baseDR = 0;
  if (actor.system.equippedArmor && actor.system.equippedArmor.length > 0) {
    // Calculate DR from equipped armor
    for (let armor of actor.system.equippedArmor) {
      if (armor.dr && typeof armor.dr === 'object') {
        // New format: per-type DR
        baseDR += armor.dr[damageType] || armor.dr.all || 0;
      } else if (armor.baseDR !== undefined) {
        // Legacy format: single DR value
        baseDR += armor.baseDR || 0;
      }
    }
  } else if (actor.system.dr) {
    // Fallback to actor's base DR
    baseDR = actor.system.dr.value || 0;
  }

  // Apply 50% DR for energy damage, full DR for physical damage
  if (baseDR > 0) {
    if (isEnergyDamage) {
      drApplied = Math.floor(baseDR / 2);
    } else if (damageType !== 'untyped' && damageType !== 'force') {
      drApplied = baseDR;
    }
    // Force damage and untyped damage ignore DR
    
    damageAmount = Math.max(0, damageAmount - drApplied);
  }

  // Apply damage to actor
  const newHP = Math.max(0, currentHP - damageAmount);
  
  console.log(`Legends | Applying ${damageAmount} ${damageType} damage to ${actor.name}: ${currentHP} HP -> ${newHP} HP (DR: ${drApplied})`);

  await actor.update({
    'system.hp.value': newHP
  });

  // Create chat message using the condition's chatMessage (supports enricher syntax)
  const chatLabel = await enrichText(damageTick.chatMessage || `Take ${formula} damage from ${condition.name}`);
  
  // Add stack information if applicable
  const stackInfo = (condition.system.stacking === 'stack' && stacks > 1) 
    ? ` (${stacks} stacks)` 
    : '';

  // Add DR information if applicable
  const drInfo = drApplied > 0 
    ? ` <span style="font-size: 0.9em; opacity: 0.85;">(${roll.total} - ${drApplied} DR${isEnergyDamage ? ' at 50%' : ''})</span>` 
    : '';

  const messageContent = `
    <div class="d8-condition-damage">
      <h3>${condition.name}${stackInfo} - Damage</h3>
      <p>${chatLabel}</p>
      <div class="dice-roll">
        <div class="dice-result">
          <div class="dice-formula">${formula}</div>
          <div class="dice-tooltip" style="display: none;">
            ${roll.terms.map(t => t.results ? t.results.map(r => r.result).join(', ') : '').join(' ')}
          </div>
          <h4 class="dice-total">${roll.total}</h4>
        </div>
      </div>
      <p><strong>${actor.name}</strong> takes <strong>${damageAmount}</strong> damage from ${condition.name}${stackInfo}!${drInfo}</p>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: messageContent,
    rolls: [roll]
  });

  // Check if there's a save to reduce/end damage
  if (damageTick.save) {
    await promptForSave(actor, condition, damageTick.save, 'damage');
  }
}

/**
 * Notify via chat that a condition will deal damage, for conditions without an explicit recovery.
 * Gives the player awareness so they (or allies) can attempt to act.
 * @param {Actor} actor - The actor affected
 * @param {Item} condition - The damaging condition
 */
async function notifyConditionDamageWarning(actor, condition) {
  const damageTick = condition.system.damageTick;
  const description = condition.system.description?.value || '';

  // Extract recovery hints from the HTML description (look for Recovery/Stopping/Escaping headings)
  let recoveryHint = '';
  const recoveryMatch = description.match(/<(?:h[3-5]|p)><strong>(?:Stopping|Recovery|Escaping|Extinguishing)[^<]*<\/strong><\/(?:h[3-5]|p)>\s*([\s\S]*?)(?=<h[3-5]|$)/i);
  if (recoveryMatch) {
    const enrichedHint = await enrichText(recoveryMatch[1].trim());
    recoveryHint = `<div style="font-size: 0.9em; opacity: 0.85;">${enrichedHint}</div>`;
  }

  const messageContent = `
    <div class="d8-condition-warning">
      <h3>${condition.name} - Active</h3>
      <p><strong>${actor.name}</strong> is affected by <strong>${condition.name}</strong> and will take <strong>${damageTick.formula}</strong> damage.</p>
      ${recoveryHint}
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: messageContent,
    flags: {
      legends: {
        conditionWarning: true,
        actorId: actor.id,
        conditionId: condition.id
      }
    }
  });
}

/**
 * Show saving throw dialog for condition recovery
 * @param {Actor} actor - The actor making the save
 * @param {Item} condition - The condition being recovered from
 * @param {string} saveType - Type of save: 'fortitude', 'reflex', 'will'
 */
async function showConditionSaveDialog(actor, condition, saveType = 'fortitude') {
  // Determine which attribute to use
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
    default:
      attrKey = 'constitution';
      attrLabel = 'Constitution';
      skillLabel = 'Fortitude Save';
  }
  
  const attrValue = actor.system.attributes[attrKey]?.value ?? 2;
  const luckValue = actor.system.luck?.current ?? actor.system.attributes.luck?.value ?? 2;

  // Get and enrich the condition description
  const descriptionHTML = condition.system.description?.value 
    ? await enrichText(condition.system.description.value)
    : '';

  return foundry.applications.api.DialogV2.wait({
    window: { title: `${condition.name} - Recovery` },
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
        .recovery-info-summary {
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
          margin-bottom: 12px;
        }
        .recovery-info-summary:hover {
          background: rgba(0,0,0,0.15);
        }
        .recovery-info-details {
          display: none;
          padding: 8px;
          background: rgba(0,0,0,0.05);
          border-radius: 4px;
          margin-bottom: 12px;
          max-height: 300px;
          overflow-y: auto;
        }
        .toggle-chevron {
          transition: transform 0.2s;
        }
      </style>
      <form class="legends-save-dialog">
        ${descriptionHTML ? `
        <div class="recovery-info-summary">
          <strong>Recovery Options</strong>
          <i class="fas fa-chevron-down toggle-chevron"></i>
        </div>
        <div class="recovery-info-details">
          ${descriptionHTML}
        </div>
        ` : ''}
        <div class="form-group">
          <label><strong>${attrLabel} ${attrValue} + Luck ${luckValue}</strong></label>
        </div>
        <div class="form-group">
          <label>Modifier:</label>
          <input type="text" name="modifier" value="0" style="width: 60px; text-align: center;" placeholder="0"/>
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
    render: (event, html) => {
      // Set up collapsible recovery info
      const summary = html.querySelector('.recovery-info-summary');
      if (summary) {
        summary.addEventListener('click', () => {
          const details = html.querySelector('.recovery-info-details');
          const chevron = html.querySelector('.toggle-chevron');
          
          if (details.style.display === 'none' || !details.style.display) {
            details.style.display = 'block';
            chevron.style.transform = 'rotate(180deg)';
          } else {
            details.style.display = 'none';
            chevron.style.transform = 'rotate(0deg)';
          }
        });
      }
    },
    buttons: [
      {
        action: "normal",
        label: "Roll Recovery",
        default: true,
        callback: async (event, button, dialog) => {
          const modifierInput = dialog.element.querySelector('[name="modifier"]');
          const rawValue = modifierInput?.value || "";
          const modifier = parseInt(rawValue) || 0;
          const applyToAttr = dialog.element.querySelector('[name="applyToAttr"]').checked;
          const applyToSkill = dialog.element.querySelector('[name="applyToSkill"]').checked;
          
          return await rollConditionSave(actor, condition, saveType, {
            modifier,
            applyToAttr,
            applyToSkill,
            fortune: 0,
            misfortune: 0
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
          
          return await rollConditionSaveWithFortune(actor, condition, saveType, {
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
          
          return await rollConditionSaveWithFortune(actor, condition, saveType, {
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
 * Roll a saving throw for condition recovery with fortune/misfortune
 * @param {Actor} actor - The actor making the save
 * @param {Item} condition - The condition being recovered from
 * @param {string} saveType - Type of save
 * @param {object} options - Roll options
 */
async function rollConditionSaveWithFortune(actor, condition, saveType, options = {}) {
  const { modifier = 0, applyToAttr = true, applyToSkill = true, isFortune = true } = options;
  
  // Determine which attribute to use
  let attrKey, attrLabel;
  switch(saveType) {
    case 'fortitude':
      attrKey = 'constitution';
      attrLabel = 'Constitution';
      break;
    case 'reflex':
      attrKey = 'agility';
      attrLabel = 'Agility';
      break;
    case 'will':
      attrKey = 'wisdom';
      attrLabel = 'Wisdom';
      break;
    default:
      attrKey = 'constitution';
      attrLabel = 'Constitution';
  }
  
  const attrValue = actor.system.attributes[attrKey]?.value ?? 2;
  const luckValue = actor.system.luck?.current ?? actor.system.attributes.luck?.value ?? 2;
  
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
  return foundry.applications.api.DialogV2.wait({
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
            resultText = '2 Successes - Excellent!';
            resultClass = 'success';
          } else if (successes === 1) {
            resultText = '1 Success';
            resultClass = 'partial';
          } else {
            resultText = '0 Successes - Failed';
            resultClass = 'failure';
          }
          
          // Create chat message
          const messageContent = `
            <div class="d8-condition-save-result">
              <h3>${condition.name} - ${saveType.charAt(0).toUpperCase() + saveType.slice(1)} Save (${isFortune ? 'Fortune' : 'Misfortune'})</h3>
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
          
          // Apply recovery result
          await handleRecoveryResult(actor, condition, successes);
          
          return successes;
        }
      }
    ]
  });
}

/**
 * Roll a saving throw for condition recovery (no dialog, immediate roll)
 * @param {Actor} actor - The actor making the save
 * @param {Item} condition - The condition being recovered from
 * @param {string} saveType - Type of save: 'fortitude', 'reflex', 'will'
 * @param {object} options - Roll options
 */
async function rollConditionSave(actor, condition, saveType = 'fortitude', options = {}) {
  const { modifier = 0, applyToAttr = true, applyToSkill = true, fortune = 0, misfortune = 0 } = options;
  
  // Determine which attribute to use
  let attrKey, attrLabel;
  switch(saveType) {
    case 'fortitude':
      attrKey = 'constitution';
      attrLabel = 'Constitution';
      break;
    case 'reflex':
      attrKey = 'agility';
      attrLabel = 'Agility';
      break;
    case 'will':
      attrKey = 'wisdom';
      attrLabel = 'Wisdom';
      break;
    default:
      attrKey = 'constitution';
      attrLabel = 'Constitution';
  }
  
  const attrValue = actor.system.attributes[attrKey]?.value ?? 2;
  const luckValue = actor.system.luck?.current ?? actor.system.attributes.luck?.value ?? 2;
  
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
    resultText = '2 Successes - Excellent!';
    resultClass = 'success';
  } else if (successes === 1) {
    resultText = '1 Success';
    resultClass = 'partial';
  } else {
    resultText = '0 Successes - Failed';
    resultClass = 'failure';
  }
  
  // Create chat message with roll result
  const messageContent = `
    <div class="d8-condition-save-result">
      <h3>${condition.name} - ${saveType.charAt(0).toUpperCase() + saveType.slice(1)} Save</h3>
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
  
  // Apply recovery result
  await handleRecoveryResult(actor, condition, successes);
  
  return successes;
}

/**
 * Process recovery save for a condition
 * @param {Actor} actor - The actor making the save
 * @param {Item} condition - The condition being recovered from
 */
async function processRecoverySave(actor, condition) {
  const recovery = condition.system.recovery;

  if (!recovery.promptPlayer) return;

  const chatMessage = await enrichText(recovery.chatMessage || `Make a ${recovery.save?.type || 'saving throw'} to recover from ${condition.name}`);

  // Create interactive chat card for recovery
  const messageContent = `
    <div class="d8-condition-recovery">
      <h3>${condition.name} - Recovery</h3>
      <p>${chatMessage}</p>
      <div class="recovery-buttons" data-actor-id="${actor.id}" data-condition-id="${condition.id}">
        <button class="recovery-roll" data-save-type="${recovery.save?.type || 'fortitude'}">
          Roll Recovery
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
 * Get all conditions in the same family as the given condition
 * @param {string} conditionName - The condition name
 * @returns {Array<string>} Array of condition names in the same family
 */
function getConditionFamily(conditionName) {
  const families = {
    fire: ['Burning', 'Ignited', 'Smoldering', 'Singed'],
    cold: ['Frozen', 'Frosted', 'Numbed', 'Chilled'],
    fear: ['Cowering', 'Fleeing', 'Frightened'],
    stun: ['Paralyzed', 'Stunned', 'Dazed']
  };

  // Find which family this condition belongs to
  for (const [familyName, members] of Object.entries(families)) {
    if (members.includes(conditionName)) {
      return members;
    }
  }

  // Not part of a family, return only itself
  return [conditionName];
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
    // Condition ends completely - remove entire condition family
    const family = getConditionFamily(condition.name);
    
    // Remove all conditions in this family
    for (const familyMember of family) {
      const hasCondition = actor.items.find(i => i.type === 'condition' && i.name === familyMember);
      if (hasCondition) {
        await game.legends.removeCondition(actor, familyMember);
      }
    }
    
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p><strong>${actor.name}</strong> completely recovered from <strong>${condition.name}</strong>!</p>`
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
  // V2 hook: html is HTMLElement, not jQuery
  Hooks.on('renderChatMessageHTML', (message, html) => {
    // Handle recovery roll buttons
    html.querySelectorAll('.recovery-roll').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const recoveryButtons = html.querySelector('.recovery-buttons');
        const actorId = recoveryButtons?.dataset.actorId;
        const conditionId = recoveryButtons?.dataset.conditionId;
        const saveType = button.dataset.saveType;

        const actor = game.actors.get(actorId);
        const condition = actor?.items.get(conditionId);

        if (!actor || !condition) {
          ui.notifications.warn('Actor or condition not found');
          return;
        }

        // Show dialog for save with modifiers and fortune/misfortune options
        await showConditionSaveDialog(actor, condition, saveType);
      });
    });

    // Handle assistance buttons
    html.querySelectorAll('.recovery-assist').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        ui.notifications.info('Assistance feature requires proximity check - coming soon!');
      });
    });

    // Handle condition save buttons
    html.querySelectorAll('.condition-save-roll').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const actorId = button.dataset.actorId;
        const conditionId = button.dataset.conditionId;
        const saveType = button.dataset.saveType;

        const actor = game.actors.get(actorId);
        const condition = actor?.items.get(conditionId);
        
        if (!actor || !condition) {
          ui.notifications.warn('Actor or condition not found');
          return;
        }

        await showConditionSaveDialog(actor, condition, saveType);
      });
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
