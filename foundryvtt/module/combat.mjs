/**
 * Legends D8 TTRPG Combat System
 * Handles weapon attacks, defense reactions, and damage application
 */

import { rollD8Check, showRollDialog } from './dice.mjs';

/**
 * Roll a weapon attack with targeting support
 * @param {Actor} actor - The attacking actor
 * @param {Item} weapon - The weapon item being used
 */
export async function rollWeaponAttack(actor, weapon) {
  // Get selected targets
  const targets = Array.from(game.user.targets);
  const target = targets.length > 0 ? targets[0] : null;
  
  // Check if weapon has multiple attack modes
  const attackModes = weapon.system.attackModes || [];
  
  if (attackModes.length === 0) {
    ui.notifications.error("This weapon has no attack modes configured!");
    return;
  }
  
  // If multiple modes, show selection dialog
  if (attackModes.length > 1) {
    const selectedMode = await showAttackModeDialog(weapon, attackModes);
    if (!selectedMode) return; // User cancelled
    
    return executeWeaponAttack(actor, weapon, selectedMode, target);
  } else {
    // Single mode, use it directly
    return executeWeaponAttack(actor, weapon, attackModes[0], target);
  }
}

/**
 * Show dialog to select attack mode
 * @param {Item} weapon - The weapon
 * @param {Array} attackModes - Available attack modes
 * @returns {Promise<Object>} Selected attack mode or null if cancelled
 */
async function showAttackModeDialog(weapon, attackModes) {
  return new Promise((resolve) => {
    new Dialog({
      title: `${weapon.name} - Select Attack Mode`,
      content: `
        <form class="legends-attack-mode-dialog">
          <div class="form-group">
            <label><strong>Choose how to attack with ${weapon.name}:</strong></label>
            <select name="attackMode" style="width: 100%; padding: 5px; margin-top: 10px;">
              ${attackModes.map((mode, idx) => `
                <option value="${idx}">
                  ${mode.name} 
                  (${mode.skill === 'melee' ? 'Melee Combat' : 'Ranged Combat'}
                  ${mode.range.normal > 0 ? `, Range: ${mode.range.normal}/${mode.range.medium}/${mode.range.long}` : ''})
                </option>
              `).join('')}
            </select>
          </div>
        </form>
      `,
      buttons: {
        attack: {
          icon: '<i class="fas fa-sword"></i>',
          label: "Attack",
          callback: (html) => {
            const idx = parseInt(html.find('[name="attackMode"]').val());
            resolve(attackModes[idx]);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve(null)
        }
      },
      default: "attack"
    }, {
      width: 400
    }).render(true);
  });
}

/**
 * Execute a weapon attack with a specific mode
 * @param {Actor} actor - The attacking actor
 * @param {Item} weapon - The weapon item
 * @param {Object} attackMode - The selected attack mode
 * @param {Token} target - The targeted token (or null)
 */
async function executeWeaponAttack(actor, weapon, attackMode, target) {
  // Determine which skill to use
  const skillKey = attackMode.skill === 'melee' ? 'meleeCombat' : 'rangedCombat';
  const skill = actor.system.skills[skillKey];
  
  // Determine which attribute to use (Agility for melee, Dexterity for ranged/thrown)
  const attrKey = attackMode.skill === 'melee' ? 'agility' : 'dexterity';
  const attribute = actor.system.attributes[attrKey];
  
  // Show the roll dialog - this will create the dice roll chat card
  await showRollDialog({
    actor: actor,
    attrValue: attribute.value,
    skillValue: skill.value,
    attrLabel: attribute.label,
    skillLabel: 'Combat',
    onRollComplete: async (rollResult) => {
      // IMPORTANT: Wait a tiny bit for the dice roll message to post first
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create attack chat card with targeting info AFTER dice roll posts
      await createAttackChatCard({
        actor: actor,
        weapon: weapon,
        attackMode: attackMode,
        target: target,
        rollResult: rollResult,
        skillKey: skillKey,
        attrKey: attrKey,
        attackRollMessageId: rollResult.message?.id  // Store the dice roll message ID
      });
    }
  });
}

/**
 * Create a chat card for a weapon attack
 * @param {Object} options - Attack data
 */
async function createAttackChatCard(options) {
  const {
    actor,
    weapon,
    attackMode,
    target,
    rollResult,
    skillKey,
    attrKey,
    attackRollMessageId
  } = options;
  
  const speaker = ChatMessage.getSpeaker({ actor });
  
  // Build target info
  const targetInfo = target 
    ? `<div class="attack-target"><strong>Target:</strong> ${target.name}</div>`
    : '';
  
  // Show successes from the roll
  const successesInfo = `<div class="attack-successes"><strong>Attack Successes:</strong> ${rollResult.successes}</div>`;
  
  // Build defense button (only if target selected)
  const defenseButton = target 
    ? `
      <div class="defense-section">
        <button class="defense-button" 
                data-attack-message-id="{{MESSAGE_ID}}"
                data-attacker-id="${actor.id}"
                data-weapon-id="${weapon.id}"
                data-attack-mode="${encodeURIComponent(JSON.stringify(attackMode))}"
                data-target-id="${target.id}"
                data-attack-successes="${rollResult.successes}"
                data-attack-roll-message-id="${attackRollMessageId}">
          <i class="fas fa-shield-alt"></i> Defend (${target.name})
        </button>
      </div>
    `
    : '<div class="no-target"><em>No target selected - test roll only</em></div>';
  
  const content = `
    <div class="legends-attack-card">
      <h3><i class="fas fa-sword"></i> ${weapon.name} Attack</h3>
      <div class="attack-mode"><strong>Mode:</strong> ${attackMode.name}</div>
      ${targetInfo}
      ${successesInfo}
      <div class="attack-damage">
        <strong>Base Damage:</strong> ${weapon.system.damage.base} ${weapon.system.damage.type}
      </div>
      ${defenseButton}
    </div>
  `;
  
  const message = await ChatMessage.create({
    speaker,
    content: content,
    flags: {
      'legends.attackData': {
        actorId: actor.id,
        weaponId: weapon.id,
        attackMode: attackMode,
        targetId: target?.actor?.id,  // FIXED: Use actor ID, not token ID
        attackSuccesses: rollResult.successes,
        baseDamage: weapon.system.damage.base,
        damageType: weapon.system.damage.type,
        damageAttr: attackMode.damageAttr,
        defenseType: attackMode.defenseType,
        attackRollMessageId: attackRollMessageId
      }
    }
  });
  
  // Replace {{MESSAGE_ID}} in the content
  await message.update({
    content: content.replace('{{MESSAGE_ID}}', message.id)
  });
}

/**
 * Handle defense button click
 * @param {string} messageId - The attack message ID
 * @param {Object} attackData - Attack data from the message flags
 */
export async function handleDefenseClick(messageId, attackData) {
  const attacker = game.actors.get(attackData.actorId);
  const defender = game.actors.get(attackData.targetId);  // FIXED: Get actor directly
  
  if (!defender) {
    ui.notifications.error("Target not found!");
    return;
  }
  
  // Check if current user controls the defender or is GM
  if (!defender.isOwner && !game.user.isGM) {
    ui.notifications.warn("You don't have permission to roll defense for this token!");
    return;
  }
  
  const defenseType = attackData.defenseType;
  
  // Determine defense roll based on defenseType
  if (defenseType === 'melee') {
    // Opposed melee roll
    await rollMeleeDefense(defender, attackData, messageId);
  } else if (defenseType === 'ranged-reflex') {
    // Ranged attack - check if in cover, if so allow Reflex save
    await handleRangedDefense(defender, attackData, messageId);
  } else if (defenseType === 'none') {
    // Auto-hit, proceed to damage
    await calculateDamage(attackData, messageId, 0, attackData.attackSuccesses);
  }
}

/**
 * Roll melee defense (opposed roll)
 * @param {Actor} defender - The defending actor
 * @param {Object} attackData - Attack data
 * @param {string} attackMessageId - The attack message ID
 */
async function rollMeleeDefense(defender, attackData, attackMessageId) {
  const agility = defender.system.attributes.agility;
  const meleeCombat = defender.system.skills.meleeCombat;
  
  await showRollDialog({
    actor: defender,
    attrValue: agility.value,
    skillValue: meleeCombat.value,
    attrLabel: agility.label,
    skillLabel: 'Melee Defense',
    isSave: false,
    onRollComplete: async (rollResult) => {
      // Wait for defense roll to post
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Calculate margin and damage
      await calculateDamage(
        attackData,
        attackMessageId,
        rollResult.successes,
        attackData.attackSuccesses
      );
    }
  });
}

/**
 * Handle ranged defense
 * @param {Actor} defender - The defending actor
 * @param {Object} attackData - Attack data
 * @param {string} attackMessageId - The attack message ID
 */
async function handleRangedDefense(defender, attackData, attackMessageId) {
  // For now, simplified: check if they want to attempt Reflex save (if in cover)
  // TODO: Implement cover detection
  
  new Dialog({
    title: "Ranged Defense",
    content: `
      <p>You are being attacked by a ranged weapon.</p>
      <p>Are you in cover? If yes, you can attempt a Reflex save.</p>
    `,
    buttons: {
      cover: {
        icon: '<i class="fas fa-shield"></i>',
        label: "I'm in Cover (Reflex Save)",
        callback: async () => {
          const agility = defender.system.attributes.agility;
          const currentLuck = defender.system.luck?.current ?? defender.system.attributes.luck.value;
          
          await showRollDialog({
            actor: defender,
            attrValue: agility.value,
            skillValue: currentLuck,
            attrLabel: agility.label,
            skillLabel: 'Luck',
            isSave: true,
            onRollComplete: async (rollResult) => {
              // Wait for defense roll to post
              await new Promise(resolve => setTimeout(resolve, 100));
              
              await calculateDamage(
                attackData,
                attackMessageId,
                rollResult.successes,
                attackData.attackSuccesses
              );
            }
          });
        }
      },
      noCover: {
        icon: '<i class="fas fa-times"></i>',
        label: "No Cover (Auto-hit)",
        callback: async () => {
          await calculateDamage(
            attackData,
            attackMessageId,
            0,
            attackData.attackSuccesses
          );
        }
      }
    },
    default: "noCover"
  }).render(true);
}

/**
 * Calculate damage and create comparison result card
 * @param {Object} attackData - Attack data
 * @param {string} attackMessageId - The attack message ID
 * @param {number} defenseSuccesses - Defender's successes
 * @param {number} attackSuccesses - Attacker's successes
 */
async function calculateDamage(attackData, attackMessageId, defenseSuccesses, attackSuccesses) {
  const margin = attackSuccesses - defenseSuccesses;
  
  const attacker = game.actors.get(attackData.actorId);
  const defender = game.actors.get(attackData.targetId);
  
  if (!attacker || !defender) {
    ui.notifications.error("Could not find attacker or defender!");
    console.error("Missing actors:", { attacker, defender, attackData });
    return;
  }
  
  let damageAmount = 0;
  let damageDescription = '';
  
  if (margin <= 0) {
    // Defender wins or ties
    damageDescription = 'Defender wins! No damage.';
  } else if (margin === 1) {
    // Base damage only
    damageAmount = attackData.baseDamage;
    damageDescription = `${damageAmount} ${attackData.damageType} damage (base)`;
  } else {
    // Base damage + attribute modifier
    const attrValue = attacker.system.attributes[attackData.damageAttr].value;
    damageAmount = attackData.baseDamage + attrValue;
    damageDescription = `${damageAmount} ${attackData.damageType} damage (base ${attackData.baseDamage} + ${attrValue} ${attackData.damageAttr})`;
  }
  
  // Create comparison result card
  const content = `
    <div class="legends-combat-result">
      <h3><i class="fas fa-exchange-alt"></i> Attack Result</h3>
      <div class="comparison">
        <div class="attacker-result">
          <strong>Attacker:</strong> ${attacker.name}<br/>
          <strong>Successes:</strong> ${attackSuccesses}
        </div>
        <div class="defender-result">
          <strong>Defender:</strong> ${defender.name}<br/>
          <strong>Successes:</strong> ${defenseSuccesses}
        </div>
        <div class="margin">
          <strong>Margin:</strong> ${margin}
        </div>
      </div>
      <div class="damage-result">
        <strong>Result:</strong> ${damageDescription}
      </div>
      ${damageAmount > 0 ? `
        <div class="damage-buttons">
          <button class="apply-damage-btn" 
                  data-target-id="${attackData.targetId}"
                  data-damage="${damageAmount}"
                  data-damage-type="${attackData.damageType}">
            <i class="fas fa-heart-broken"></i> Apply ${damageAmount} Damage
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attacker }),
    content: content
  });
}

/**
 * Calculate DR for a specific damage type
 * @param {Actor} target - The target actor
 * @param {string} damageType - The damage type (slashing, piercing, bludgeoning)
 * @returns {number} The effective DR against this damage type
 */
function calculateEffectiveDR(target, damageType) {
  let effectiveDR = 0;
  
  // Get equipped armor data
  const equippedArmor = target.system.equippedArmor || [];
  
  // If no equipped armor data, fall back to base DR
  if (equippedArmor.length === 0) {
    return target.system.dr?.value || 0;
  }
  
  // Calculate DR for each armor piece
  for (let armor of equippedArmor) {
    let armorDR = armor.baseDR;
    
    // Check for weakness against this damage type
    if (armor.weakness?.type === damageType && armor.weakness?.dr !== undefined) {
      armorDR = armor.weakness.dr;
    }
    
    // Check for resistance against this damage type
    else if (armor.resistance?.type === damageType && armor.resistance?.dr !== undefined) {
      armorDR = armor.resistance.dr;
    }
    
    effectiveDR += armorDR;
  }
  
  // Add any bonus DR
  effectiveDR += target.system.dr?.bonus || 0;
  
  return effectiveDR;
}

/**
 * Apply damage to a target
 * @param {string} targetId - The target actor ID
 * @param {number} damage - The damage amount
 * @param {string} damageType - The damage type
 */
export async function applyDamage(targetId, damage, damageType) {
  // Try to find the token actor first (handles unlinked tokens with separate HP)
  let target = canvas.tokens.placeables.find(t => t.actor?.id === targetId)?.actor;
  
  // Fallback to base actor if no token found
  if (!target) {
    target = game.actors.get(targetId);
  }
  
  if (!target) {
    ui.notifications.error("Target not found!");
    return;
  }
  
  // Check permissions
  if (!target.isOwner && !game.user.isGM) {
    ui.notifications.warn("You don't have permission to modify this actor's HP!");
    return;
  }
  
  // Get CURRENT HP
  const currentHP = target.system.hp.value;
  
  // Calculate effective DR based on damage type
  let dr = 0;
  
  // Physical damage types: check armor weakness/resistance
  if (['slashing', 'piercing', 'bludgeoning'].includes(damageType)) {
    dr = calculateEffectiveDR(target, damageType);
  } else {
    // Energy damage types: use half of base DR
    const baseDR = target.system.dr?.value || 0;
    dr = Math.floor(baseDR / 2);
  }
  
  // Apply DR
  const finalDamage = Math.max(0, damage - dr);
  
  const newHP = Math.max(0, currentHP - finalDamage);
  
  await target.update({ 'system.hp.value': newHP });
  
  ui.notifications.info(
    `${target.name} takes ${finalDamage} ${damageType} damage${dr > 0 ? ` (${damage} - ${dr} DR)` : ''}`
  );
  
  // Post damage notification to chat (without revealing HP totals)
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

/**
 * Initialize combat system hooks
 */
export function initializeCombatSystem() {
  // Handle defense button clicks
  Hooks.on('renderChatMessage', (message, html) => {
    html.find('.defense-button').click(async (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      const attackData = message.flags.legends?.attackData;
      
      if (attackData) {
        await handleDefenseClick(message.id, attackData);
      }
    });
    
    // Handle apply damage button clicks
    html.find('.apply-damage-btn').click(async (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      const targetId = button.dataset.targetId;
      const damage = parseInt(button.dataset.damage);
      const damageType = button.dataset.damageType;
      
      await applyDamage(targetId, damage, damageType);
    });
  });
}
