/**
 * Implement Use System (rods, staves, wands)
 *
 * Workflow:
 *   Step 1: Guard — require a magical trait; if absent, show refusal dialog (no charges consumed).
 *   Step 2: If item has multiple weaves, show a selection dialog; else auto-select the only weave.
 *   Step 3: Guard — require sufficient charges.
 *   Step 4: Targeting roll — castingStat + primaryEnergy mastery; attackBonus reduces both dice.
 *   Step 5: Consume charges; post chat card with weave name, description, and targeting result.
 */

import { showSkillCheckDialog } from './dice.mjs';
import { detectPrimaryMagicalTrait } from './magical-traits.mjs';

/**
 * Returns true if the actor's magical trait grants an energy pool and
 * therefore permits implement use.
 * Alchemical Tradition is explicitly excluded: alchemists brew preparations
 * rather than channelling magic, so they have no energy mastery to aim with.
 */
function _canUseImplement(actor) {
  const trait = detectPrimaryMagicalTrait(actor);
  return Boolean(trait) && trait.type !== 'alchemical-tradition';
}

const VALID_TRAITS_LABEL =
  'Mageborn, Divine Gift, Invoker, Infuser, Sorcerous Origin, Eldritch Pact, or Summoner';

const ENERGY_LABELS = {
  earth:    'Earth',
  air:      'Air',
  fire:     'Fire',
  water:    'Water',
  positive: 'Positive',
  negative: 'Negative',
  space:    'Space',
  time:     'Time',
};

// ─── Energy label map ─────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────
  return (
    actor.system?.attributesEffective?.[key] ??
    actor.system?.attributes?.[key]?.value ??
    0
  );
}

function _getMasteryValue(actor, energyKey) {
  return actor.system?.mastery?.[energyKey]?.value ?? 0;
}

// ─── Weave selection ─────────────────────────────────────────────────────────

/**
 * Show a dialog to pick one granted weave.
 * If the item only has one weave it is returned immediately.
 * Returns the selected weave object, or null if the dialog was cancelled.
 * @param {Actor} actor
 * @param {Item}  item
 * @returns {Promise<object|null>}
 */
async function _selectWeave(actor, item) {
  const weaves = item.system?.grantedWeaves ?? [];
  const currentCharges = item.system?.charges?.value ?? 0;

  if (weaves.length === 0) {
    ui.notifications.warn(`${item.name} has no granted weaves.`);
    return null;
  }

  if (weaves.length === 1) return weaves[0];

  const options = weaves
    .map((w, i) => {
      const canAfford = currentCharges >= w.chargeCost;
      const costLabel = `${w.chargeCost} charge${w.chargeCost !== 1 ? 's' : ''}`;
      return `<option value="${i}" ${!canAfford ? 'disabled' : ''}>${w.name} — ${costLabel}${!canAfford ? ' (insufficient charges)' : ''}</option>`;
    })
    .join('');

  const maxCharges = item.system?.charges?.max ?? 0;

  const index = await foundry.applications.api.DialogV2.prompt({
    window: { title: `Activate ${item.name}` },
    content: `
      <form>
        <p>Current charges: <strong>${currentCharges} / ${maxCharges}</strong></p>
        <div class="form-group">
          <label>Choose weave to activate:</label>
          <select name="weaveIndex" style="width:100%;">${options}</select>
        </div>
      </form>
    `,
    rejectClose: false,
    ok: {
      label: 'Activate',
      callback: (_event, button) => parseInt(button.form.elements.weaveIndex.value),
    },
  });

  if (index === null || index === undefined || Number.isNaN(index)) return null;
  return weaves[index] ?? null;
}

// ─── Roll parameters ──────────────────────────────────────────────────────────

/**
 * Build targeting roll parameters from the actor and implement.
 * Die 1: castingStat  |  Die 2: primaryEnergy mastery
 * attackBonus is applied as a negative modifier (reduces both dice → easier to succeed).
 */
function _buildRollParams(actor, item) {
  const castingStatKey = actor.system?.castingStat?.value ?? 'intelligence';
  const attrValue = _getAttrValue(actor, castingStatKey);
  const attrLabel =
    actor.system?.attributes?.[castingStatKey]?.label ??
    castingStatKey.charAt(0).toUpperCase() + castingStatKey.slice(1);

  const primaryEnergy = item.system?.primaryEnergy ?? '';
  const masteryValue  = primaryEnergy ? _getMasteryValue(actor, primaryEnergy) : 0;
  const energyName    = ENERGY_LABELS[primaryEnergy] ?? (primaryEnergy || 'Unknown');
  const masteryLabel  = primaryEnergy
    ? (actor.system?.mastery?.[primaryEnergy]?.label ?? `${energyName} Mastery`)
    : 'Energy Mastery';

  // attackBonus: positive bonus → negative modifier (dice are reduced → easier)
  const attackBonus    = Number(item.system?.attackBonus || 0);
  const defaultModifier = -attackBonus;

  return { attrValue, skillValue: masteryValue, attrLabel, skillLabel: masteryLabel, defaultModifier };
}

// ─── Chat card ────────────────────────────────────────────────────────────────

async function _postChatCard(actor, item, weave, rollResult, chargeCost, chargesAfter) {
  const successes      = rollResult?.successes ?? 0;
  const criticalSuccess = rollResult?.criticalSuccess ?? false;
  const maxCharges     = item.system?.charges?.max ?? 0;

  const marginLabel = successes === 0
    ? '<span style="color:#c0392b;font-weight:bold;">Miss</span>'
    : successes === 1
      ? '<span style="color:#e67e22;font-weight:bold;">Margin 1</span>'
      : successes === 2
        ? '<span style="color:#27ae60;font-weight:bold;">Margin 2</span>'
        : `<span style="color:#2980b9;font-weight:bold;">Margin ${successes}</span>`;

  const content = `
    <div class="legends-chat-card implement-use">
      <div class="card-header">
        <h3>${item.name}</h3>
        <p class="subtitle">${actor.name} activates <em>${weave.name}</em></p>
      </div>
      <div class="card-body">
        <p><strong>Targeting:</strong> ${marginLabel}${criticalSuccess ? ' &mdash; <span style="color:goldenrod;font-weight:bold;">Critical!</span>' : ''}</p>
        ${weave.description ? `<p>${weave.description}</p>` : ''}
        <p style="font-size:11px;color:#888;margin-top:6px;">
          Charges used: ${chargeCost} &nbsp;|&nbsp; Remaining: ${chargesAfter}/${maxCharges}
        </p>
      </div>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
  });
}

// ─── Main entry points ────────────────────────────────────────────────────────

/**
 * Activate a specific granted weave on an implement.
 * Called by the item sheet's Use (⚡) button with a pre-resolved weave object.
 * @param {Actor}  actor
 * @param {Item}   item   - rod, staff, or wand
 * @param {object} weave  - { name, chargeCost, description }
 */
export async function useImplementWeave(actor, item, weave) {
  // Step 1: Require an energy-pool magical trait
  if (!_canUseImplement(actor)) {
    await foundry.applications.api.DialogV2.alert({
      window: { title: 'Cannot Activate Implement' },
      content: `
        <p><strong>${actor.name}</strong> cannot channel power through ${item.name}.</p>
        <p>Activating an implement requires a magical trait that grants an energy pool (${VALID_TRAITS_LABEL}). Alchemical Tradition characters brew preparations rather than channelling magic directly.</p>
      `,
    });
    return;
  }

  // Step 2: Check charges
  const currentCharges = item.system?.charges?.value ?? 0;
  if (currentCharges < weave.chargeCost) {
    ui.notifications.warn(
      `${item.name} needs ${weave.chargeCost} charge${weave.chargeCost !== 1 ? 's' : ''} to activate ${weave.name}, but only has ${currentCharges}.`
    );
    return;
  }

  // Step 3: Targeting roll
  const rollParams = _buildRollParams(actor, item);

  await showSkillCheckDialog({
    actor,
    attrValue:        rollParams.attrValue,
    skillValue:       rollParams.skillValue,
    attrLabel:        rollParams.attrLabel,
    skillLabel:       rollParams.skillLabel,
    defaultModifier:  rollParams.defaultModifier,
    onRollComplete: async (result) => {
      // Step 4: Consume charges (always, even on miss — the attempt costs the charge)
      const chargesAfter = (item.system?.charges?.value ?? 0) - weave.chargeCost;
      await item.update({ 'system.charges.value': Math.max(0, chargesAfter) });

      // Step 5: Post chat card
      await _postChatCard(actor, item, weave, result, weave.chargeCost, Math.max(0, chargesAfter));
    },
  });
}

/**
 * Open the implement use workflow from the character sheet inventory.
 * Shows a weave selection dialog first (or skips it when there is only one weave).
 * @param {Actor} actor
 * @param {Item}  item  - rod, staff, or wand
 */
export async function useImplement(actor, item) {
  if (!['rod', 'staff', 'wand'].includes(item.type)) {
    ui.notifications.warn('Only rods, staves, and wands can be activated with this action.');
    return;
  }

  // Step 1: Require an energy-pool magical trait (checked before weave picker to fail fast)
  if (!_canUseImplement(actor)) {
    await foundry.applications.api.DialogV2.alert({
      window: { title: 'Cannot Activate Implement' },
      content: `
        <p><strong>${actor.name}</strong> cannot channel power through ${item.name}.</p>
        <p>Activating an implement requires a magical trait that grants an energy pool (${VALID_TRAITS_LABEL}). Alchemical Tradition characters brew preparations rather than channelling magic directly.</p>
      `,
    });
    return;
  }

  // Step 2: Choose weave
  const weave = await _selectWeave(actor, item);
  if (!weave) return;

  return useImplementWeave(actor, item, weave);
}

// ─── Rod activation ───────────────────────────────────────────────────────────

async function _postRodChatCard(actor, item, weave, chargesAfter) {
  const maxCharges = item.system?.charges?.max ?? 0;
  const depleted = chargesAfter === 0;
  const content = `
    <div class="legends-chat-card rod-use">
      <div class="card-header">
        <h3>${item.name}</h3>
        <p class="subtitle">${actor.name} activates <em>${weave.name}</em></p>
      </div>
      <div class="card-body">
        <p><strong>Effect:</strong> <span style="color:#27ae60;font-weight:bold;">Margin 2</span> (automatic)</p>
        ${weave.description ? `<p>${weave.description}</p>` : ''}
        <p style="font-size:11px;color:#888;margin-top:6px;">
          Charges remaining: ${chargesAfter}/${maxCharges}${depleted ? ' &mdash; <em>depleted until next Long Rest</em>' : ''}
        </p>
      </div>
    </div>
  `;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
  });
}

/**
 * Activate a specific granted weave on a rod.
 * No magical trait required. No targeting roll — effect fires at Margin 2.
 * @param {Actor}  actor
 * @param {Item}   item   - rod item
 * @param {object} weave  - { name, chargeCost, description }
 */
export async function useRodWeave(actor, item, weave) {
  const currentCharges = item.system?.charges?.value ?? 0;
  if (currentCharges < weave.chargeCost) {
    ui.notifications.warn(
      `${item.name} has no charges remaining (needs ${weave.chargeCost}, has ${currentCharges}).`
    );
    return;
  }
  const chargesAfter = Math.max(0, currentCharges - weave.chargeCost);
  await item.update({ 'system.charges.value': chargesAfter });
  await _postRodChatCard(actor, item, weave, chargesAfter);
}

/**
 * Open rod activation from the character sheet inventory — picks weave then activates.
 * @param {Actor} actor
 * @param {Item}  item  - rod item
 */
export async function useRod(actor, item) {
  if (item.type !== 'rod') {
    ui.notifications.warn('Only rods can be activated with this action.');
    return;
  }
  if (item.system?.requiresBinding && !item.system?.bound) {
    ui.notifications.warn(`${item.name} is not Bound to ${actor.name}. Take a Short Rest to Bind it before use.`);
    return;
  }
  const weave = await _selectWeave(actor, item);
  if (!weave) return;
  return useRodWeave(actor, item, weave);
}

// ─── Ring activation ──────────────────────────────────────────────────────────

async function _postRingChatCard(actor, item, weave, chargesAfter) {
  const maxCharges = item.system?.charges?.max ?? 0;
  const depleted = chargesAfter === 0;
  const content = `
    <div class="legends-chat-card ring-use">
      <div class="card-header">
        <h3>${item.name}</h3>
        <p class="subtitle">${actor.name} activates <em>${weave.name}</em></p>
      </div>
      <div class="card-body">
        <p><strong>Effect:</strong> <span style="color:#27ae60;font-weight:bold;">Margin 2</span> (automatic)</p>
        ${weave.description ? `<p>${weave.description}</p>` : ''}
        <p style="font-size:11px;color:#888;margin-top:6px;">
          Charges remaining: ${chargesAfter}/${maxCharges}${depleted ? ' &mdash; <em>depleted until next Long Rest</em>' : ''}
        </p>
      </div>
    </div>
  `;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
  });
}

/**
 * Activate a specific granted weave on a ring.
 * No magical trait required. No targeting roll — effect fires at Margin 2.
 * @param {Actor}  actor
 * @param {Item}   item   - ring item
 * @param {object} weave  - { name, chargeCost, description }
 */
export async function useRingWeave(actor, item, weave) {
  const currentCharges = item.system?.charges?.value ?? 0;
  if (currentCharges < weave.chargeCost) {
    ui.notifications.warn(
      `${item.name} has no charges remaining (needs ${weave.chargeCost}, has ${currentCharges}).`
    );
    return;
  }
  const chargesAfter = Math.max(0, currentCharges - weave.chargeCost);
  await item.update({ 'system.charges.value': chargesAfter });
  await _postRingChatCard(actor, item, weave, chargesAfter);
}

/**
 * Open ring activation from the character sheet inventory — picks weave then activates.
 * @param {Actor} actor
 * @param {Item}  item  - ring item
 */
export async function useRing(actor, item) {
  if (item.type !== 'ring') {
    ui.notifications.warn('Only rings can be activated with this action.');
    return;
  }
  if (item.system?.requiresBinding && !item.system?.bound) {
    ui.notifications.warn(`${item.name} is not Bound to ${actor.name}. Take a Short Rest while wearing it to Bind it before use.`);
    return;
  }
  const weave = await _selectWeave(actor, item);
  if (!weave) return;
  return useRingWeave(actor, item, weave);
}
