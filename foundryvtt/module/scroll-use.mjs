/**
 * Scroll Use System
 * Implements the rules for using a scroll (core_system.md §Using a Scroll)
 *
 * Step 1: Identification warning (identification handled separately)
 * Step 2: Targeting roll  — with trait: castingStat + primaryEnergy mastery
 *                         — without trait: intelligence + wisdom, +2 mod to both dice
 * Step 3: Scroll consumed (always)
 * Step 4: Apply result:  success → weave resolves; fail + trait → nothing;
 *                        fail + no trait → Scroll Mishap Table
 */

import { showSkillCheckDialog } from './dice.mjs';
import { detectPrimaryMagicalTrait } from './magical-traits.mjs';

/** Compendium pack name that contains the Scroll Mishap RollTable */
const MISHAP_PACK_NAME = 'legends.tables';
const MISHAP_TABLE_NAME = 'Scroll Mishap Table';

// ─── Mishap table data (fallback if compendium unavailable) ──────────────────

const MISHAP_ENTRIES = [
  {
    roll: 1,
    label: 'Discharge',
    description: 'The energy releases harmlessly in a vivid but non-damaging display.',
  },
  {
    roll: 2,
    label: 'Backlash',
    description:
      "The energy reverses into the reader. They take damage equal to the scroll's Energy cost using the scroll's primary energy type. Half DR applies.",
  },
  {
    roll: 3,
    label: 'Misfire',
    description:
      'The weave triggers but strikes a random creature within range instead of the intended target, including allies. Use a normal targeting roll against the new target.',
  },
  {
    roll: 4,
    label: 'Diminished',
    description: 'The weave triggers with Margin 1 effect.',
  },
  {
    roll: 5,
    label: 'Overload',
    description:
      'The weave triggers at full effect against the intended target. The reader also gains the Dazed condition until the end of their next turn.',
  },
  {
    roll: 6,
    label: 'Surge',
    description:
      'For 1 minute the reader deals 4 damage of that energy type on any successful melee strike, but also takes 4 damage of that type at the start of each of their turns until the effect ends.',
  },
  {
    roll: 7,
    label: 'Resonance',
    description:
      'The weave triggers normally against its intended target. The reader is also struck by the same effect at Margin 1.',
  },
  {
    roll: 8,
    label: 'Unraveling',
    description:
      "Every creature in a 15-foot radius centered on the reader (including the reader) makes a Reflex save — Hard if the scroll's Energy cost exceeds 8, Easy otherwise. Those who fail take damage equal to the scroll's Energy cost using the primary energy type. Half DR applies.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get an actor attribute value, preferring effectiveValues.
 * @param {Actor} actor
 * @param {string} key  - e.g. 'intelligence'
 * @returns {number}
 */
function _getAttrValue(actor, key) {
  return (
    actor.system?.attributesEffective?.[key] ??
    actor.system?.attributes?.[key]?.value ??
    0
  );
}

/**
 * Get an actor mastery value.
 * @param {Actor} actor
 * @param {string} energyKey  - e.g. 'fire'
 * @returns {number}
 */
function _getMasteryValue(actor, energyKey) {
  return actor.system?.mastery?.[energyKey]?.value ?? 0;
}

/**
 * Look up the Scroll Mishap RollTable from the compendium.
 * Returns null if unavailable.
 * @returns {Promise<RollTable|null>}
 */
async function _getMishapTable() {
  try {
    const pack = game.packs.get(MISHAP_PACK_NAME);
    if (!pack) return null;
    await pack.getIndex();
    const entry = pack.index.find(
      (e) => e.name.toLowerCase() === MISHAP_TABLE_NAME.toLowerCase(),
    );
    if (!entry) return null;
    return await pack.getDocument(entry._id);
  } catch {
    return null;
  }
}

// ─── Mishap roll ─────────────────────────────────────────────────────────────

/**
 * Roll on the Scroll Mishap Table and post the result to chat.
 * Tries the compendium RollTable first; falls back to inline data.
 * @param {Actor} actor
 * @param {Item} item   - the scroll
 */
async function _rollMishap(actor, item) {
  const speaker = ChatMessage.getSpeaker({ actor });

  // Try compendium table first — opens the standard Foundry table-roll UI.
  const table = await _getMishapTable();
  if (table) {
    return table.draw({ displayChat: true });
  }

  // Fallback: roll in code and post a chat message.
  const roll = new Roll('1d8');
  await roll.evaluate();
  const result = roll.total;
  const entry = MISHAP_ENTRIES.find((e) => e.roll === result) ?? {
    label: 'Unknown',
    description: 'Something unexpected occurred.',
  };

  const energyLabel = item.system?.sourceWeave?.energyCost?.primary?.type ?? 'unknown';

  const content = `
    <div class="legends-chat-card scroll-mishap">
      <div class="card-header">
        <h3>Scroll Mishap!</h3>
        <p class="subtitle">${actor.name} — ${item.name}</p>
      </div>
      <div class="card-body">
        <p><strong>Roll:</strong> ${result} — <strong>${entry.label}</strong></p>
        <p>${entry.description.replace(/scroll's Energy cost/g, `scroll's Energy cost (${_getScrollEnergyCost(item)})`)}</p>
        <p style="font-size:11px;color:#888;">Energy type: ${energyLabel}</p>
      </div>
    </div>
  `;

  await ChatMessage.create({ speaker, content });
}

/**
 * Return the total energy cost stored in a scroll's sourceWeave.
 * @param {Item} item
 * @returns {number}
 */
function _getScrollEnergyCost(item) {
  const primary = item.system?.sourceWeave?.energyCost?.primary?.cost ?? 0;
  const supporting = item.system?.sourceWeave?.energyCost?.supporting?.cost ?? 0;
  return primary + supporting;
}

// ─── Consume scroll ───────────────────────────────────────────────────────────

/**
 * Decrement scroll uses by 1, deleting the item when uses reach 0.
 * @param {Actor} actor
 * @param {Item} item
 */
async function _consumeScroll(actor, item) {
  const current = item.system?.uses?.value ?? 1;
  if (current <= 1) {
    await item.delete();
    ui.notifications.info(`${item.name} was consumed and removed from inventory.`);
  } else {
    await item.update({ 'system.uses.value': current - 1 });
    ui.notifications.info(`${item.name} used. ${current - 1} use(s) remaining.`);
  }
}

// ─── Targeting roll ───────────────────────────────────────────────────────────

/**
 * Build roll parameters depending on whether the reader has a magical trait.
 * Uses the scroll's weave primary energy for the mastery die (not the actor's
 * own primary energy), so the check reflects the power level encoded in the scroll.
 * @param {Actor} actor
 * @param {Item}  item   - the scroll being used
 * @returns {{ attrValue, skillValue, attrLabel, skillLabel, defaultModifier, hasMagicalTrait }}
 */
function _buildRollParams(actor, item) {
  const trait = detectPrimaryMagicalTrait(actor);

  if (trait) {
    const castingStatKey = actor.system?.castingStat?.value ?? 'intelligence';
    const attrValue = _getAttrValue(actor, castingStatKey);
    const attrLabel =
      actor.system?.attributes?.[castingStatKey]?.label ??
      castingStatKey.charAt(0).toUpperCase() + castingStatKey.slice(1);

    // Use the scroll's weave primary energy, not the actor's own primary energy
    const scrollEnergy = item.system?.sourceWeave?.energyCost?.primary?.type ?? '';
    const masteryValue = scrollEnergy ? _getMasteryValue(actor, scrollEnergy) : 0;
    const masteryLabel = scrollEnergy
      ? (actor.system?.mastery?.[scrollEnergy]?.label ?? `${scrollEnergy.charAt(0).toUpperCase() + scrollEnergy.slice(1)} Mastery`)
      : 'Energy Mastery';

    return {
      attrValue,
      skillValue: masteryValue,
      attrLabel,
      skillLabel: masteryLabel,
      defaultModifier: 0,
      hasMagicalTrait: true,
    };
  }

  // No magical trait: Intelligence + Wisdom, +2 penalty to both dice
  const intValue = _getAttrValue(actor, 'intelligence');
  const wisValue = _getAttrValue(actor, 'wisdom');
  return {
    attrValue: intValue,
    skillValue: wisValue,
    attrLabel: actor.system?.attributes?.intelligence?.label ?? 'Intelligence',
    skillLabel: actor.system?.attributes?.wisdom?.label ?? 'Wisdom',
    defaultModifier: 2,
    hasMagicalTrait: false,
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Open the "Use Scroll" workflow for an actor using a scroll item.
 * @param {Actor} actor
 * @param {Item}  item
 */
export async function useScroll(actor, item) {
  if (item.type !== 'scroll') {
    ui.notifications.warn('Only scroll items can be used with this action.');
    return;
  }

  // Step 1: Identification warning
  const isIdentified = item.system?.identified !== false;
  if (!isIdentified) {
    const proceed = await foundry.applications.api.DialogV2.confirm({
      window: { title: 'Unidentified Scroll' },
      content: `
        <p><strong>${item.system?.unidentifiedName || 'This scroll'}</strong> has not been identified.</p>
        <p>You do not know what effect it will produce. Proceed anyway?</p>
      `,
    });
    if (!proceed) return;
  }

  const rollParams = _buildRollParams(actor, item);
  const weaveName = item.system?.sourceWeave?.name || item.name;

  // Build a descriptive subtitle for the dialog
  const traitNote = rollParams.hasMagicalTrait
    ? ''
    : '<p style="color:#c0392b;font-size:12px;">⚠ No magical trait — +2 penalty to both dice. Failure triggers a Scroll Mishap.</p>';

  await showSkillCheckDialog({
    actor,
    attrValue: rollParams.attrValue,
    skillValue: rollParams.skillValue,
    attrLabel: rollParams.attrLabel,
    skillLabel: rollParams.skillLabel,
    defaultModifier: rollParams.defaultModifier,
    defaultApplyToAttr: true,
    defaultApplyToSkill: true,
    title: `Use Scroll — ${weaveName}`,
    // Prepend a note to the dialog by overriding the label via the hint mechanism
    // (the dialog will show attrLabel/skillLabel as normal; we post a pre-flight chat message instead)
    onRollComplete: async (result) => {
      const succeeded = (result?.successes ?? 0) >= 1;

      // Step 3: consume scroll (always)
      await _consumeScroll(actor, item);

      // Step 4: apply result
      if (succeeded) {
        const speaker = ChatMessage.getSpeaker({ actor });
        const content = `
          <div class="legends-chat-card">
            <div class="card-header">
              <h3>Scroll Used Successfully</h3>
              <p class="subtitle">${actor.name} — <em>${weaveName}</em></p>
            </div>
            <div class="card-body">
              <p>The weave channels through the scroll. <strong>The GM resolves the effect.</strong></p>
              ${item.system?.sourceWeave?.description ? `<p style="font-style:italic;font-size:12px;">${item.system.sourceWeave.description}</p>` : ''}
            </div>
          </div>
        `;
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
      } else {
        // Failure
        if (rollParams.hasMagicalTrait) {
          const speaker = ChatMessage.getSpeaker({ actor });
          await ChatMessage.create({
            speaker,
            content: `
              <div class="legends-chat-card">
                <div class="card-header">
                  <h3>Scroll — Targeting Failed</h3>
                  <p class="subtitle">${actor.name} — <em>${weaveName}</em></p>
                </div>
                <div class="card-body">
                  <p>The weave does not trigger. The scroll is consumed.</p>
                </div>
              </div>
            `,
          });
        } else {
          // No magical trait — roll mishap
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `
              <div class="legends-chat-card">
                <div class="card-header">
                  <h3>Scroll — Targeting Failed (No Magical Trait)</h3>
                  <p class="subtitle">${actor.name} — <em>${weaveName}</em></p>
                </div>
                <div class="card-body">
                  <p>The stored energy releases through an untrained conduit — rolling on the <strong>Scroll Mishap Table</strong>…</p>
                </div>
              </div>
            `,
          });
          await _rollMishap(actor, item);
        }
      }
    },
  });
}

// ─── Exported table data (for GM reference / macro use) ──────────────────────

export const SCROLL_MISHAP_TABLE = MISHAP_ENTRIES;
