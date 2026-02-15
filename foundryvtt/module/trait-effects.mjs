/**
 * Trait Effects System
 * Main dispatcher for applying trait effects (magical and non-magical)
 */

import * as magicalTraits from './magical-traits.mjs';

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize trait effect handlers
 * Sets up hooks to automatically apply trait effects when added to actors
 */
export function initializeTraitHandlers() {
  // Validate magical traits BEFORE they are added (prevents duplicates)
  Hooks.on('preCreateItem', async (item, options, userId) => {
    try {
      if (!item || item.type !== 'trait') return;
      const actor = item.parent;
      if (!actor || actor.type !== 'character') return;

      // Only validate magical traits
      if (!isMagicalTrait(item)) return;
      
      const traitType = getTraitType(item);
      const validation = magicalTraits.validateMagicalTraitApplication(actor, traitType);
      
      if (!validation.valid) {
        ui.notifications.error(validation.reason);
        // Prevent the trait from being added
        return false;
      }
    } catch (err) {
      console.error('Legends | Error validating trait:', err);
    }
  });
  
  // Automatically apply trait effects when a trait is added to a character
  Hooks.on('createItem', async (item, options, userId) => {
    try {
      if (!item || item.type !== 'trait') return;
      const actor = item.parent;
      if (!actor || actor.type !== 'character') return;

      console.log(`Legends | Trait added to ${actor.name}: ${item.name}`);
      
      // Apply trait effects (no validation here - already done in preCreateItem)
      await applyTraitEffects(actor, item);
    } catch (err) {
      console.error('Legends | Error applying trait effects:', err);
      ui.notifications.error(`Failed to apply trait: ${err.message}`);
    }
  });
}

// ========================================
// TRAIT TYPE IDENTIFICATION
// ========================================

/**
 * Identify trait type from item
 * @param {Item} traitItem - The trait item
 * @returns {string} Trait type identifier
 */
function getTraitType(traitItem) {
  const name = traitItem.name.toLowerCase();
  const systemType = traitItem.system?.magicalType?.toLowerCase();
  
  // Check system field first
  if (systemType) return systemType;
  
  // Fall back to name matching
  // Magical traits
  if (name.includes('mageborn')) return 'mageborn';
  if (name.includes('divine gift')) return 'divine-gift';
  if (name.includes('invoker')) return 'invoker';
  if (name.includes('infuser')) return 'infuser';
  if (name.includes('sorcerous origin')) return 'sorcerous-origin';
  if (name.includes('eldritch pact')) return 'eldritch-pact';
  if (name.includes('gifted mage')) return 'gifted-mage';
  if (name.includes('balanced channeler')) return 'balanced-channeler';
  
  // Non-magical traits handled directly
  return 'simple';
}

/**
 * Check if a trait is magical
 * @param {Item} traitItem - The trait item
 * @returns {boolean}
 */
export function isMagicalTrait(traitItem) {
  const type = getTraitType(traitItem);
  return ['mageborn', 'divine-gift', 'invoker', 'infuser', 'sorcerous-origin', 
          'eldritch-pact', 'gifted-mage', 'balanced-channeler'].includes(type);
}

// ========================================
// MAIN APPLICATION FUNCTION
// ========================================

/**
 * Apply trait effects to an actor
 * @param {Actor} actor - The actor to apply to
 * @param {Item} traitItem - The trait item being applied
 * @returns {Promise<boolean>} Success status
 */
export async function applyTraitEffects(actor, traitItem) {
  const traitType = getTraitType(traitItem);
  
  console.log(`Applying trait: ${traitItem.name} (type: ${traitType})`);
  
  // Handle magical traits
  if (isMagicalTrait(traitItem)) {
    // Primary magical traits are passive - just mark the type
    const primaryTraits = ['mageborn', 'divine-gift', 'invoker', 'infuser', 
                          'sorcerous-origin', 'eldritch-pact'];
    if (primaryTraits.includes(traitType)) {
      await actor.update({
        'system.magicalTrait.type': traitType,
        'system.magicalTrait.isSetup': false
      });
      ui.notifications.info(
        `${traitItem.name} added. Open the Magic tab on your character sheet to complete setup.`
      );
      return true;
    }
    
    // Modifier traits are also passive
    if (['gifted-mage', 'balanced-channeler'].includes(traitType)) {
      return await magicalTraits.applyGiftedMage(actor, traitItem);
    }
  }
  
  try {
    switch(traitType) {
      // Primary magical traits handled above (passive)
      case 'mageborn':
      case 'divine-gift':
      case 'invoker':
      case 'infuser':
      case 'sorcerous-origin':
      case 'eldritch-pact':
        return true;  // Already handled above
      
      case 'gifted-mage':
      case 'balanced-channeler':
        return await magicalTraits.applyGiftedMage(actor, traitItem);
      
      default:
        // Non-magical traits
        return await applySimpleTraitEffects(actor, traitItem);
    }
  } catch (error) {
    console.error("Error applying trait effects:", error);
    ui.notifications.error("Failed to apply trait effects");
    return false;
  }
}

// ========================================
// SIMPLE TRAIT APPLICATION
// ========================================

/**
 * Apply non-magical trait effects
 * @param {Actor} actor - The actor
 * @param {Item} traitItem - The trait item
 * @returns {Promise<boolean>}
 */
async function applySimpleTraitEffects(actor, traitItem) {
  const name = traitItem.name.toLowerCase();
  const updates = {};
  
  // Physical & Mental Traits
  if (name.includes('double-jointed')) {
    updates['system.skills.acrobatics'] = 3;
    ui.notifications.info("Acrobatics set to rank 3");
  }
  
  else if (name.includes('highly skilled')) {
    // Show dialog to choose skill
    const skill = await chooseSkill(actor);
    if (skill) {
      updates[`system.skills.${skill}`] = 4;
      ui.notifications.info(`${skill} set to rank 4`);
    }
  }
  
  else if (name.includes('mentor')) {
    // Show dialog to choose skill for rank 5
    const skill = await chooseSkill(actor);
    if (skill) {
      updates[`system.skills.${skill}`] = 5;
      updates['system.tier.xp'] = (actor.system.tier.xp || 0) + 40;
      ui.notifications.info(`${skill} set to rank 5, gained 40 XP`);
    }
  }
  
  else if (name.includes('mythic characteristic')) {
    // Show dialog to choose attribute
    const attr = await chooseAttribute(actor);
    if (attr) {
      const current = actor.system.attributes[attr].value;
      updates[`system.attributes.${attr}.value`] = Math.min(current + 2, 8);
      ui.notifications.info(`${attr} increased by 2`);
    }
  }
  
  // Apply updates if any
  if (Object.keys(updates).length > 0) {
    await actor.update(updates);
    return true;
  }
  
  // Traits without immediate mechanical application
  ui.notifications.info(`${traitItem.name} trait added - passive bonuses will be calculated automatically`);
  return true;
}

// ========================================
// PASSIVE TRAIT MODIFIERS
// ========================================

/**
 * Compute passive modifiers from all traits
 * Similar to feat-effects.mjs computeFeatModifiers
 * @param {Actor} actor - The actor
 * @returns {Object} Computed modifiers
 */
export function computeTraitModifiers(actor) {
  const mods = {
    attributes: {},
    skills: {},
    initiative: 0,
    hp: 0,
    dr: 0,
    perception: {
      all: 0,
      vision: 0,
      hearing: 0,
      smell: 0
    },
    saves: {
      reflex: 0,
      fortitude: 0,
      will: 0
    }
  };
  
  const traits = actor.items.filter(i => i.type === 'trait');
  
  for (let trait of traits) {
    const name = trait.name.toLowerCase();
    
    // Physical & Mental bonuses
    if (name.includes('acute hearing')) {
      mods.initiative += 1;
      mods.perception.hearing -= 1;
    }
    
    if (name.includes('acute taste and smell')) {
      mods.perception.smell -= 1;
    }
    
    if (name.includes('alertness')) {
      mods.initiative += 1;
      mods.perception.all -= 1;
    }
    
    if (name.includes('double-jointed')) {
      mods.saves.reflex -= 1;
    }
    
    if (name.includes('eidetic memory')) {
      if (!mods.skills.history) mods.skills.history = 0;
      if (!mods.skills.society) mods.skills.society = 0;
      if (!mods.skills.arcane) mods.skills.arcane = 0;
      mods.skills.history -= 2;
      mods.skills.society -= 2;
      mods.skills.arcane -= 2;
    }
    
    if (name.includes('intuition')) {
      if (!mods.skills.perception) mods.skills.perception = 0;
      if (!mods.skills.investigate) mods.skills.investigate = 0;
      mods.skills.perception -= 1;
      mods.skills.investigate -= 1;
    }
    
    if (name.includes('keen sight')) {
      mods.perception.vision -= 1;
    }
    
    if (name.includes('quickened reflexes')) {
      mods.initiative += 2;
      mods.perception.all -= 1;
      mods.saves.reflex -= 1;
    }
    
    if (name.includes('lion heart')) {
      mods.saves.will -= 1;
    }
    
    // Social traits
    if (name.includes('loyalty')) {
      if (!mods.skills.persuasion) mods.skills.persuasion = 0;
      mods.skills.persuasion -= 1;
    }
    
    if (name.includes('touch of good')) {
      if (!mods.skills.persuasion) mods.skills.persuasion = 0;
      mods.skills.persuasion -= 1;
    }
    
    // Sorcerer manifestation bonuses
    const magicalTrait = actor.system.magicalTrait;
    if (magicalTrait?.forceOfWill) {
      const manifestation = magicalTrait.forceOfWill;
      const tier = actor.system.tier?.value || 1;
      
      if (manifestation === 'unchangingStone') {
        mods.hp += tier;
        if (actor.items.filter(i => i.type === 'armor' && i.system.equipped).length === 0) {
          mods.dr += 1;
        }
      }
    }
  }
  
  return mods;
}

// ========================================
// HELPER DIALOGS
// ========================================

/**
 * Show dialog to choose a skill
 * @param {Actor} actor
 * @returns {Promise<string>} Skill key
 */
async function chooseSkill(actor) {
  return new Promise((resolve) => {
    const skills = Object.entries(actor.system.skills).map(([key, value]) => {
      const rank = typeof value === 'object' ? value.value : value;
      return `<option value="${key}">${key} (current: ${rank})</option>`;
    }).join('');
    
    const dialog = new Dialog({
      title: "Choose Skill",
      content: `
        <form>
          <div class="form-group">
            <label>Choose a skill to improve:</label>
            <select id="skill" name="skill">
              ${skills}
            </select>
          </div>
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            const skill = html.find('[name="skill"]').val();
            resolve(skill);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve(null)
        }
      },
      default: "ok",
      close: () => resolve(null)
    });
    dialog.render(true);
  });
}

/**
 * Show dialog to choose an attribute
 * @param {Actor} actor
 * @returns {Promise<string>} Attribute key
 */
async function chooseAttribute(actor) {
  return new Promise((resolve) => {
    const attributes = Object.entries(actor.system.attributes).map(([key, attr]) => 
      `<option value="${key}">${attr.label} (current: ${attr.value})</option>`
    ).join('');
    
    const dialog = new Dialog({
      title: "Choose Attribute",
      content: `
        <form>
          <div class="form-group">
            <label>Choose an attribute to improve:</label>
            <select id="attribute" name="attribute">
              ${attributes}
            </select>
          </div>
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            const attr = html.find('[name="attribute"]').val();
            resolve(attr);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve(null)
        }
      },
      default: "ok",
      close: () => resolve(null)
    });
    dialog.render(true);
  });
}

// ========================================
// EXPORTS
// ========================================

export default {
  applyTraitEffects,
  computeTraitModifiers,
  isMagicalTrait
};
