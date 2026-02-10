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
 * Grant linked abilities/actions from a shield item onto an actor.
 * Created items are flagged so they can be removed when the shield is unequipped.
 * @param {Actor} actor
 * @param {Item} shield
 */
export async function grantLinkedItemsFromShield(actor, shield) {
  if (!actor || !shield) return;
  const linked = (shield.system?.linkedAbilities || []).concat(shield.system?.reactions || []);
  if (!linked.length) return;

  for (const entry of linked) {
    const name = entry.name;
    // Try to find the item in any compendium by name or id
    let found = null;
    for (const pack of game.packs.values()) {
      try {
        const idx = await pack.getIndex();
        const e = idx.find(i => (entry._id && (i.id === entry._id || i._id === entry._id)) || i.name === name);
        if (e) {
          try {
            const doc = await pack.getDocument(e.id || e._id || e._doc);
            if (doc) {
              found = { pack, doc };
              break;
            }
          } catch (err) {}
        }
      } catch (err) {}
    }

    if (found && found.doc) {
      // Create a copy on the actor and tag it as granted by this shield
      const copy = duplicate(found.doc.toObject());
      copy.flags = copy.flags || {};
      copy.flags.legends = copy.flags.legends || {};
      copy.flags.legends.grantedBy = { shieldId: shield.id, shieldName: shield.name, sourcePack: found.pack.collection, sourceId: found.doc.id };
      await actor.createEmbeddedDocuments('Item', [copy]);
    }
  }
}

/**
 * Revoke any items on the actor that were granted by a shield.
 * @param {Actor} actor
 * @param {Item} shield
 */
export async function revokeLinkedItemsFromShield(actor, shield) {
  if (!actor || !shield) return;
  const granted = actor.items.filter(i => i?.flags?.legends?.grantedBy?.shieldId === shield.id);
  if (!granted.length) return;
  const ids = granted.map(i => i.id);
  await actor.deleteEmbeddedDocuments('Item', ids);
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
