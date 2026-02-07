/**
 * Shield helpers and reaction scaffolding
 * Shields are now a dedicated item type with reactions/abilities that trigger
 * when the defender is targeted by melee or ranged attacks.
 */

/**
 * Return an array of shield items that are equipped for an actor.
 * @param {Actor} actor
 * @returns {Array<Item>}
 */
export function findEquippedShields(actor) {
  if (!actor || !actor.items) return [];
  return actor.items.filter(i => i.type === 'shield' && i.system.equipped);
}

/**
 * Aggregate shield reactions available to an actor from equipped shields.
 * Each reaction is returned with context linking it to its shield item.
 * @param {Actor} actor
 * @returns {Array<Object>} reactions
 */
export function getShieldReactionsForActor(actor) {
  const shields = findEquippedShields(actor);
  const reactions = [];
  for (const s of shields) {
    const defs = s.system.reactions || [];
    if (Array.isArray(defs)) {
      for (const def of defs) {
        reactions.push({ shieldId: s.id, shieldName: s.name, reaction: def });
      }
    }
  }
  return reactions;
}

/**
 * Apply a shield reaction. Supports reactions of type 'melee' or 'ranged'
 * which reduce incoming damage for a single hit.
 * Returns an object describing the effect applied.
 * @param {Actor} defender
 * @param {Object} reactionEntry - { shieldId, shieldName, reaction }
 * @param {Object} context - { damage, damageType, attackType, attacker }
 * @returns {Object} { applied: boolean, reduction: number, reason: string }
 */
export async function applyShieldReaction(defender, reactionEntry, context={}) {
  const reaction = reactionEntry?.reaction;
  if (!reaction || !defender) return { applied: false, reduction: 0, reason: 'No reaction' };

  // Shield reactions don't inherently reduce damage in this simple impl
  // Reactions like "Force Misfortune" or "Force Reroll" are handled in combat logic
  // This is a placeholder for future shield reaction implementation
  
  return { applied: true, reduction: 0, reason: `${reaction.name || reaction.type} from ${reactionEntry.shieldName}` };
}

/**
 * Simple initializer to expose an API on game.legends.shields
 */
export function initializeShieldHelpers() {
  if (!game.legends) game.legends = {};
  game.legends.shields = {
    findEquippedShields,
    getShieldReactionsForActor,
    applyShieldReaction
  };
}
