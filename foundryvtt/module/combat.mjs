/**
 * Legends D8 TTRPG Combat System
 * Handles weapon attacks, defense reactions, and damage application
 * Foundry VTT V13 - Uses renderChatMessageHTML hook (native DOM, not jQuery)
 */

import { rollD8Check, showRollDialog } from './dice.mjs';
import * as featEffects from './feat-effects.mjs';

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
 * Show comprehensive attack options dialog based on weapon properties
 * @param {Actor} actor - The attacking actor
 * @param {Item} weapon - The weapon item
 * @param {Object} attackMode - The selected attack mode
 * @returns {Promise<Object>} Attack configuration or null if cancelled
 */
async function showAttackOptionsDialog(actor, weapon, attackMode) {
  const properties = weapon.system.properties || [];
  
  // Determine what options to show
  const hasVersatile = properties.includes('versatile');
  const hasMultiType = properties.includes('multi-type');
  const hasAlternateStrike = properties.includes('alternate-strike');
  const hasFinesse = properties.includes('finesse');
  
  // If no special options, return default config
  if (!hasVersatile && !hasMultiType && !hasAlternateStrike && !hasFinesse) {
    return {
      damageBase: weapon.system.damage.base,
      damageType: weapon.system.damage.type,
      damageAttr: attackMode.damageAttr,
      label: attackMode.name
    };
  }
  
  // Build dialog content
  let content = `<form class="legends-attack-options" style="padding: 10px;">`;
  
  // Versatile: 1H vs 2H
  if (hasVersatile) {
    content += `
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>Grip:</strong></label>
        <select name="grip" style="width: 100%; padding: 5px;">
          <option value="1h">One-Handed</option>
          <option value="2h">Two-Handed (+1 damage)</option>
        </select>
      </div>
    `;
  }
  
  // Multi-Type: Choose damage type
  if (hasMultiType) {
    const primaryType = weapon.system.damage.type;
    const secondaryType = weapon.system.damage.multiType;
    
    content += `
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>Damage Type:</strong></label>
        <select name="damageType" style="width: 100%; padding: 5px;">
          <option value="${primaryType}">${primaryType.charAt(0).toUpperCase() + primaryType.slice(1)}</option>
          ${secondaryType ? `<option value="${secondaryType}">${secondaryType.charAt(0).toUpperCase() + secondaryType.slice(1)}</option>` : ''}
        </select>
      </div>
    `;
  }
  
  // Alternate Strike: Normal vs alternate
  if (hasAlternateStrike) {
    const alternateDamage = weapon.system.damage.alternate || (weapon.system.damage.base - 2);
    const alternateType = weapon.system.damage.alternateType || 'bludgeoning';
    
    content += `
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>Attack Mode:</strong></label>
        <select name="strikeMode" style="width: 100%; padding: 5px;">
          <option value="normal">Normal (${weapon.system.damage.base} ${weapon.system.damage.type})</option>
          <option value="alternate">Alternate Strike (${alternateDamage} ${alternateType})</option>
        </select>
      </div>
    `;
  }
  
  // Finesse: Strength vs Agility
  if (hasFinesse) {
    const str = actor.system.attributes.strength.value;
    const agi = actor.system.attributes.agility.value;
    
    content += `
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;"><strong>Damage Attribute:</strong></label>
        <select name="finesseAttr" style="width: 100%; padding: 5px;">
          <option value="strength">Strength (${str})</option>
          <option value="agility">Agility (${agi})</option>
        </select>
      </div>
    `;
  }
  
  content += `</form>`;
  
  // Show dialog and get results (DialogV2)
  return foundry.applications.api.DialogV2.wait({
    window: { title: `${weapon.name} - Attack Options` },
    position: { width: 400 },
    rejectClose: false,
    content: content,
    buttons: [
      {
        action: "attack",
        label: "Attack",
        default: true,
        callback: (event, button, dialog) => {
          // Parse all selections (native DOM) - dialog is a DialogV2 instance, use .element for DOM
          const el = dialog.element;
          const grip = el.querySelector('[name="grip"]')?.value;
          const damageType = el.querySelector('[name="damageType"]')?.value;
          const strikeMode = el.querySelector('[name="strikeMode"]')?.value;
          const finesseAttr = el.querySelector('[name="finesseAttr"]')?.value;

          // Calculate final values
          let finalDamage = weapon.system.damage.base;
          let finalType = weapon.system.damage.type;
          let finalAttr = attackMode.damageAttr;
          let label = attackMode.name;

          // IMPORTANT: Track if using 2H for versatile bonus
          let versatileBonus = 0;

          // Apply versatile FIRST to get the bonus
          if (grip === '2h') {
            versatileBonus = 1;
            label += " (Two-Handed)";
          } else if (grip === '1h') {
            label += " (One-Handed)";
          }

          // Apply alternate strike
          if (strikeMode === 'alternate') {
            finalDamage = weapon.system.damage.alternate || (weapon.system.damage.base - 2);
            finalType = weapon.system.damage.alternateType || 'bludgeoning';
            label += " (Alternate)";

            // APPLY VERSATILE BONUS TO ALTERNATE STRIKE DAMAGE
            finalDamage += versatileBonus;
          } else {
            // Normal strike - apply versatile bonus
            finalDamage += versatileBonus;
          }

          // Apply multi-type
          if (damageType) {
            finalType = damageType;
          }

          // Apply finesse
          if (finesseAttr) {
            finalAttr = finesseAttr;
          }

          return {
            damageBase: finalDamage,
            damageType: finalType,
            damageAttr: finalAttr,
            label: label
          };
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
 * Show dialog to select attack mode
 * @param {Item} weapon - The weapon
 * @param {Array} attackModes - Available attack modes
 * @returns {Promise<Object>} Selected attack mode or null if cancelled
 */
async function showAttackModeDialog(weapon, attackModes) {
  return foundry.applications.api.DialogV2.wait({
    window: { title: `${weapon.name} - Select Attack Mode` },
    position: { width: 400 },
    rejectClose: false,
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
    buttons: [
      {
        action: "attack",
        label: "Attack",
        default: true,
        callback: (event, button, dialog) => {
          const idx = parseInt(dialog.element.querySelector('[name="attackMode"]').value);
          return attackModes[idx];
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
 * Execute a weapon attack with a specific mode
 * @param {Actor} actor - The attacking actor
 * @param {Item} weapon - The weapon item
 * @param {Object} attackMode - The selected attack mode
 * @param {Token} target - The targeted token (or null)
 */
export async function executeWeaponAttack(actor, weapon, attackMode, target) {
  // Show attack options dialog for weapon properties
  const attackConfig = await showAttackOptionsDialog(actor, weapon, attackMode);
  
  if (!attackConfig) return; // User cancelled
  
  // Determine which skill to use
  const skillKey = attackMode.skill === 'melee' ? 'meleeCombat' : 'rangedCombat';
  const skill = actor.system.skillsEffective?.[skillKey] ?? actor.system.skills[skillKey] ?? 0;
  
  // Determine which attribute to use for attack roll
  // Melee: Agility, Ranged/Thrown: Dexterity
  const attrKey = attackMode.skill === 'melee' ? 'agility' : 'dexterity';
  const attribute = actor.system.attributesEffective?.[attrKey] ? { value: actor.system.attributesEffective[attrKey], label: actor.system.attributes[attrKey]?.label || attrKey } : actor.system.attributes[attrKey];
  
  // Show the roll dialog
  await showRollDialog({
    actor: actor,
    attrValue: attribute.value,
    skillValue: (typeof skill === 'object' ? skill.value ?? skill : skill),
    attrLabel: attribute.label,
    skillLabel: 'Combat',
    onRollComplete: async (rollResult) => {
      // Wait for the dice roll message to post first
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create attack chat card with configuration
      await createAttackChatCard({
        actor: actor,
        weapon: weapon,
        attackMode: attackMode,
        attackConfig: attackConfig, // Pass the config
        target: target,
        rollResult: rollResult,
        skillKey: skillKey,
        attrKey: attackConfig.damageAttr, // Use configured damage attribute
        attackRollMessageId: rollResult.message?.id
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
    attackConfig,
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
  
  // Build attack mode display with configuration details
  const modeInfo = `<div class="attack-mode"><strong>Mode:</strong> ${attackConfig.label}</div>`;
  
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
      ${modeInfo}
      ${targetInfo}
      ${successesInfo}
      <div class="attack-damage">
        <strong>Base Damage:</strong> ${attackConfig.damageBase} ${attackConfig.damageType}
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
        baseDamage: attackConfig.damageBase,
        damageType: attackConfig.damageType,
        damageAttr: attackConfig.damageAttr,
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
  // Before rolling defenses, offer shield reactions if available
  try {
    if (game.legends?.shields === undefined) {
      const mod = await import('./shields.mjs');
      mod.initializeShieldHelpers();
    }
  } catch (err) {
    // ignore
  }

  const shieldAbilities = game.legends?.shields?.getShieldReactionsForActor(defender) || [];

  if (shieldAbilities.length > 0) {
    // Build dialog content listing available shield reactions
    let content = `<p>Select a shield reaction to use (or Skip to continue):</p><ul>`;
    for (let i = 0; i < shieldAbilities.length; i++) {
      const a = shieldAbilities[i];
      content += `<li><strong>${a.reaction.name || a.reaction.type}</strong> — from <em>${a.shieldName}</em>: ${a.reaction.description || ''}</li>`;
    }
    content += `</ul>`;

    await foundry.applications.api.DialogV2.wait({
      window: { title: 'Shield Reaction' },
      rejectClose: false,
      content: content,
      buttons: [
        ...shieldAbilities.map((a, idx) => ({
          action: `use_${idx}`,
          label: `Use: ${a.reaction.name || a.reaction.type}`,
          callback: async () => {
            const result = await game.legends.shields.applyShieldReaction(defender, a, { damage: attackData.baseDamage, damageType: attackData.damageType, attacker: attackData.actorId });
            attackData._shieldEffect = result;
            await _continueDefenseFlow(defenseType, defender, attackData, messageId);
          }
        })),
        {
          action: "skip",
          label: "Skip",
          default: true,
          callback: async () => {
            await _continueDefenseFlow(defenseType, defender, attackData, messageId);
          }
        }
      ]
    });
    return;
  }

  // No shield abilities or none chosen — continue
  await _continueDefenseFlow(defenseType, defender, attackData, messageId);
}

async function _continueDefenseFlow(defenseType, defender, attackData, messageId) {
  if (defenseType === 'melee') {
    await rollMeleeDefense(defender, attackData, messageId);
  } else if (defenseType === 'ranged-reflex') {
    await handleRangedDefense(defender, attackData, messageId);
  } else if (defenseType === 'none') {
    await calculateDamage(attackData, messageId, 0, attackData.attackSuccesses, attackData._shieldEffect);
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
        attackData.attackSuccesses,
        attackData._shieldEffect
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

  await foundry.applications.api.DialogV2.wait({
    window: { title: "Ranged Defense" },
    rejectClose: false,
    content: `
      <p>You are being attacked by a ranged weapon.</p>
      <p>Are you in cover? If yes, you can attempt a Reflex save.</p>
    `,
    buttons: [
      {
        action: "cover",
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
              await new Promise(resolve => setTimeout(resolve, 100));

              await calculateDamage(
                attackData,
                attackMessageId,
                rollResult.successes,
                attackData.attackSuccesses,
                attackData._shieldEffect
              );
            }
          });
        }
      },
      {
        action: "noCover",
        label: "No Cover (Auto-hit)",
        default: true,
        callback: async () => {
          await calculateDamage(
            attackData,
            attackMessageId,
            0,
            attackData.attackSuccesses,
            attackData._shieldEffect
          );
        }
      }
    ]
  });
}

/**
 * Calculate damage and create comparison result card
 * @param {Object} attackData - Attack data
 * @param {string} attackMessageId - The attack message ID
 * @param {number} defenseSuccesses - Defender's successes
 * @param {number} attackSuccesses - Attacker's successes
 */
async function calculateDamage(attackData, attackMessageId, defenseSuccesses, attackSuccesses, shieldEffect=null) {
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
  
  // Apply shield effect (if any)
  let _shieldNote = '';
  if (shieldEffect && shieldEffect.applied && (shieldEffect.reduction || shieldEffect.reduction === 0)) {
    const red = Number(shieldEffect.reduction) || 0;
    const prev = damageAmount;
    damageAmount = Math.max(0, damageAmount - red);
    damageDescription += ` (reduced by ${red} from shield${shieldEffect.reason ? `: ${shieldEffect.reason}` : ''})`;
    _shieldNote = `<div class="shield-note"><strong>Shield:</strong> ${shieldEffect.reason || ''} (-${red} damage)</div>`;
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
      ${_shieldNote}
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
  
  // If no equipped armor data, fall back to base DR summary
  if (equippedArmor.length === 0) {
    return target.system.dr?.total || 0;
  }
  
  // Calculate DR for each armor piece
  for (let armor of equippedArmor) {
    // New format: armor.dr is an object with per-type values
    if (armor.dr && typeof armor.dr === 'object') {
      effectiveDR += armor.dr[damageType] || 0;
    }
    // Legacy format: baseDR with optional weakness/resistance
    else if (armor.baseDR !== undefined) {
      let armorDR = armor.baseDR;
      if (armor.weakness?.type === damageType && armor.weakness?.dr !== undefined) {
        armorDR = armor.weakness.dr;
      } else if (armor.resistance?.type === damageType && armor.resistance?.dr !== undefined) {
        armorDR = armor.resistance.dr;
      }
      effectiveDR += armorDR;
    }

    // Shield abilities are reaction-based and do not automatically add static DR here.
  }
  
  // Add any bonus DR (legacy field)
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
    // Energy damage types: use half of base DR summary
    const baseDR = target.system.dr?.total || 0;
    dr = Math.floor(baseDR / 2);
  }
  
  // Apply feat-provided resistances (e.g., from savant feats or others)
  let resistance = 0;
  try {
    const featMods = featEffects.computeFeatModifiers(target);
    const r = featMods.resistances?.[damageType];
    if (r === 'immune') {
      // Full immunity
      resistance = damage;
    } else {
      resistance = r || 0;
    }
  } catch (err) {
    // ignore
  }
  
  // Apply DR
  const finalDamage = Math.max(0, damage - dr - (isNaN(resistance) ? 0 : resistance));
  
  const newHP = Math.max(0, currentHP - finalDamage);
  
  await target.update({ 'system.hp.value': newHP });
  
  ui.notifications.info(
    `${target.name} takes ${finalDamage} ${damageType} damage${dr > 0 ? ` (${damage} - ${dr} DR` : ''}${resistance > 0 ? ` - ${resistance} resist` : ''}${dr > 0 ? `)` : ''}`
  );
  
  // Post damage notification to chat (without revealing HP totals)
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: target }),
    content: `
      <div class="legends-damage-applied">
        <i class="fas fa-heart-broken"></i> <strong>${target.name}</strong> took ${finalDamage} ${damageType} damage!
         ${dr > 0 ? `<br/><small>(${damage} damage - ${dr} DR${resistance > 0 ? ` - ${resistance} resist` : ''} = ${finalDamage} applied)</small>` : ''}
      </div>
    `
  });
}

/**
 * Initialize combat system hooks
 */
export function initializeCombatSystem() {
  // Handle defense button clicks (V2 hook: html is HTMLElement, not jQuery)
  Hooks.on('renderChatMessageHTML', (message, html) => {
    html.querySelectorAll('.defense-button').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        const attackData = message.flags.legends?.attackData;

        if (attackData) {
          await handleDefenseClick(message.id, attackData);
        }
      });
    });

    // Handle apply damage button clicks
    html.querySelectorAll('.apply-damage-btn').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.preventDefault();

        // Initialize shield helpers if available
        try {
          if (game.legends?.shields === undefined) {
            // lazy-load initializer if module available
            const mod = await import('./shields.mjs');
            mod.initializeShieldHelpers();
          }
        } catch (err) {
          // ignore - shields helper not critical here
        }
        const button = event.currentTarget;
        const targetId = button.dataset.targetId;
        const damage = parseInt(button.dataset.damage);
        const damageType = button.dataset.damageType;

        await applyDamage(targetId, damage, damageType);
      });
    });
  });
}
