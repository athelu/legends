/**
 * D8 TTRPG Dice Rolling Functions
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
  
  // Create chat message
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: await renderRollResult({
      attrLabel,
      skillLabel,
      attrValue,
      skillValue,
      attrDie: modifiedAttrDie,
      skillDie: modifiedSkillDie,
      rawAttrDie: attrDie,
      rawSkillDie: skillDie,
      allResults: results,
      successes,
      criticalSuccess,
      criticalFailure,
      fortune: netFortune,
      misfortune: netMisfortune,
      modifier,
      isSave
    })
  });
  
  return {
    successes,
    criticalSuccess,
    criticalFailure,
    attrDie: modifiedAttrDie,
    skillDie: modifiedSkillDie
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

/**
 * Render a skill check result
 */
async function renderRollResult(data) {
  const fortuneText = data.fortune > 0 ? `<span class="fortune">Fortune (${data.fortune})</span>` : '';
  const misfortuneText = data.misfortune > 0 ? `<span class="misfortune">Misfortune (${data.misfortune})</span>` : '';
  const modifierText = data.modifier !== 0 ? `<span class="modifier">Modifier: ${data.modifier > 0 ? '+' : ''}${data.modifier}</span>` : '';
  
  const critClass = data.criticalSuccess ? 'critical-success' : (data.criticalFailure ? 'critical-failure' : '');
  
  let allDiceText = '';
  if (data.allResults.length > 2) {
    allDiceText = `<div class="all-dice">All rolls: ${data.allResults.join(', ')}</div>`;
  }
  
  return `
    <div class="d8-roll ${critClass}">
      <h3>${data.attrLabel} + ${data.skillLabel} ${data.isSave ? '(Save)' : ''}</h3>
      <div class="dice-results">
        <div class="die-result">
          <span class="die-label">${data.attrLabel} (${data.attrValue})</span>
          <span class="die-value ${data.rawAttrDie === 1 ? 'natural-one' : data.rawAttrDie === 8 ? 'natural-eight' : ''}">
            ${data.attrDie}${data.rawAttrDie !== data.attrDie ? ` (${data.rawAttrDie})` : ''}
          </span>
        </div>
        <div class="die-result">
          <span class="die-label">${data.skillLabel} (${data.skillValue})</span>
          <span class="die-value ${data.rawSkillDie === 1 ? 'natural-one' : data.rawSkillDie === 8 ? 'natural-eight' : ''}">
            ${data.skillDie}${data.rawSkillDie !== data.skillDie ? ` (${data.rawSkillDie})` : ''}
          </span>
        </div>
      </div>
      ${allDiceText}
      <div class="modifiers">
        ${fortuneText}
        ${misfortuneText}
        ${modifierText}
      </div>
      <div class="successes ${data.criticalSuccess ? 'critical' : ''}">
        <strong>Successes:</strong> ${data.successes}
        ${data.criticalSuccess ? '<span class="crit-text">CRITICAL SUCCESS!</span>' : ''}
        ${data.criticalFailure ? '<span class="crit-text">CRITICAL FAILURE!</span>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render a weave result
 */
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
