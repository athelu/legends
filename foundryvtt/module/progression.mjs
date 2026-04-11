import { validatePrereqs } from './feat-effects.mjs';
import { SKILL_LABELS } from './skill-utils.mjs';
import { MASTERY_KEYS, hasMasteryCheckbox, hasSkillCheckbox, clearMasteryCheckbox, clearSkillCheckbox } from './training.mjs';

const TIER_THRESHOLDS = [
  { tier: 1, xp: 0 },
  { tier: 2, xp: 120 },
  { tier: 3, xp: 360 },
  { tier: 4, xp: 600 },
  { tier: 5, xp: 840 },
  { tier: 6, xp: 1080 },
  { tier: 7, xp: 1320 },
  { tier: 8, xp: 1560 }
];

const MAX_TRANSACTION_HISTORY = 100;
const DEFAULT_SESSION_XP_AWARD = 24;

const ATTRIBUTE_LABELS = {
  strength: 'Strength',
  constitution: 'Constitution',
  agility: 'Agility',
  dexterity: 'Dexterity',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
  luck: 'Luck'
};

function normalizeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clampNonNegative(value) {
  return Math.max(0, Math.floor(normalizeNumber(value, 0)));
}

function normalizePhase(value) {
  return value === 'creation' ? 'creation' : 'advancement';
}

function normalizeTransactions(transactions) {
  if (!Array.isArray(transactions)) return [];

  return transactions
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      id: String(entry.id || foundry.utils.randomID()),
      type: String(entry.type || 'note'),
      amount: normalizeNumber(entry.amount, 0),
      reason: String(entry.reason || '').trim(),
      category: String(entry.category || '').trim(),
      notes: String(entry.notes || '').trim(),
      source: String(entry.source || '').trim(),
      timestamp: String(entry.timestamp || new Date().toISOString()),
      userId: String(entry.userId || game.user?.id || '')
    }))
    .slice(-MAX_TRANSACTION_HISTORY);
}

function buildTransaction(type, amount, options = {}) {
  return {
    id: foundry.utils.randomID(),
    type,
    amount: normalizeNumber(amount, 0),
    reason: String(options.reason || '').trim(),
    category: String(options.category || '').trim(),
    notes: String(options.notes || '').trim(),
    source: String(options.source || '').trim(),
    timestamp: new Date().toISOString(),
    userId: game.user?.id || ''
  };
}

function buildProgressionUpdate(actor, { xp, unspent, phase, manualOverride, transactions }) {
  const tierInfo = getTierInfoFromXp(xp);
  const normalizedUnspent = Math.min(tierInfo.xp, clampNonNegative(unspent));

  return {
    'system.tier.xp': tierInfo.xp,
    'system.tier.value': tierInfo.current,
    'system.tier.unspent': normalizedUnspent,
    'system.progression.phase': normalizePhase(phase),
    'system.progression.manualOverride': Boolean(manualOverride),
    'system.progression.transactions': normalizeTransactions(transactions)
  };
}

export function getTierInfoFromXp(totalXp = 0) {
  const xp = clampNonNegative(totalXp);
  let current = 1;
  let next = null;
  let nextXp = null;

  for (let index = TIER_THRESHOLDS.length - 1; index >= 0; index -= 1) {
    if (xp >= TIER_THRESHOLDS[index].xp) {
      current = TIER_THRESHOLDS[index].tier;
      const nextThreshold = TIER_THRESHOLDS[index + 1];
      next = nextThreshold?.tier ?? null;
      nextXp = nextThreshold?.xp ?? null;
      break;
    }
  }

  return {
    current,
    next,
    nextXp,
    xp,
    thresholds: TIER_THRESHOLDS
  };
}

export function getActorProgressionState(actor) {
  const tier = actor?.system?.tier || {};
  const progression = actor?.system?.progression || {};
  const tierInfo = getTierInfoFromXp(tier.xp);
  const unspent = Math.min(tierInfo.xp, clampNonNegative(tier.unspent));
  const phase = normalizePhase(progression.phase);
  const manualOverride = Boolean(progression.manualOverride);
  const transactions = normalizeTransactions(progression.transactions);

  return {
    ...tierInfo,
    totalXp: tierInfo.xp,
    unspent,
    phase,
    isCreation: phase === 'creation',
    phaseLabel: phase === 'creation' ? 'Character Creation' : 'Advancement',
    nextPhase: phase === 'creation' ? 'advancement' : 'creation',
    nextPhaseLabel: phase === 'creation' ? 'Switch to Advancement' : 'Switch to Creation',
    manualOverride,
    transactions,
    lastTransaction: transactions.length > 0 ? transactions[transactions.length - 1] : null
  };
}

export function canEditXPFields(actor, user = game.user) {
  if (!actor || (!actor.isOwner && !user?.isGM)) return false;
  const state = getActorProgressionState(actor);
  return state.isCreation || state.manualOverride;
}

export function canSpendXP(actor, user = game.user) {
  return Boolean(actor && (actor.isOwner || user?.isGM));
}

export function canAwardXP(actor, user = game.user) {
  return Boolean(actor && user?.isGM);
}

export function canManageProgression(actor, user = game.user) {
  return Boolean(actor && user?.isGM);
}

function canManagePartyAwards(user = game.user) {
  return Boolean(user?.isGM);
}

function getAwardablePlayerCharacters() {
  return game.actors
    .filter((actor) => actor?.type === 'character' && actor.hasPlayerOwner)
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
}

export async function awardXP(actor, amount, options = {}) {
  if (!actor) return null;

  const delta = normalizeNumber(amount, NaN);
  if (!Number.isFinite(delta) || delta === 0) return null;

  const state = getActorProgressionState(actor);
  const transactions = [...state.transactions, buildTransaction(delta >= 0 ? 'award' : 'revoke-award', delta, options)];

  await actor.update(buildProgressionUpdate(actor, {
    xp: state.totalXp + delta,
    unspent: state.unspent + delta,
    phase: state.phase,
    manualOverride: state.manualOverride,
    transactions
  }));

  if (options.notify) {
    const verb = delta >= 0 ? 'awarded' : 'removed';
    ui.notifications.info(`${Math.abs(delta)} XP ${verb} for ${actor.name}.`);
  }

  return actor;
}

export async function spendXP(actor, amount, options = {}) {
  if (!actor) return null;

  const cost = clampNonNegative(amount);
  if (cost <= 0) return null;

  const state = getActorProgressionState(actor);
  if (cost > state.unspent) {
    ui.notifications.warn(`${actor.name} only has ${state.unspent} unspent XP.`);
    return null;
  }

  const transactions = [...state.transactions, buildTransaction('spend', -cost, options)];

  await actor.update(buildProgressionUpdate(actor, {
    xp: state.totalXp,
    unspent: state.unspent - cost,
    phase: state.phase,
    manualOverride: state.manualOverride,
    transactions
  }));

  if (options.notify) {
    ui.notifications.info(`${actor.name} spent ${cost} XP.`);
  }

  return actor;
}

export async function toggleManualOverride(actor) {
  if (!actor) return null;
  const state = getActorProgressionState(actor);
  const enabled = !state.manualOverride;

  await actor.update({ 'system.progression.manualOverride': enabled });
  ui.notifications.info(`Manual XP override ${enabled ? 'enabled' : 'disabled'} for ${actor.name}.`);
  return enabled;
}

export async function cycleProgressionPhase(actor) {
  if (!actor) return null;
  const state = getActorProgressionState(actor);
  const nextPhase = state.nextPhase;

  await actor.update({ 'system.progression.phase': nextPhase });
  ui.notifications.info(`${actor.name} is now in ${nextPhase === 'creation' ? 'Character Creation' : 'Advancement'} mode.`);
  return nextPhase;
}

function buildAwardDialogContent(actor) {
  const state = getActorProgressionState(actor);
  return `
    <form class="legends-xp-dialog" style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
      <div><strong>${actor.name}</strong> currently has <strong>${state.totalXp}</strong> total XP and <strong>${state.unspent}</strong> unspent XP.</div>
      <div style="font-size: 12px; color: #666;">Default session award is <strong>${DEFAULT_SESSION_XP_AWARD} XP</strong>.</div>
      <div class="form-group">
        <label>Amount</label>
        <input type="number" name="amount" value="${DEFAULT_SESSION_XP_AWARD}" min="1" step="1" />
      </div>
      <div class="form-group">
        <label>Reason</label>
        <input type="text" name="reason" value="Session award" placeholder="Session award" />
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes" rows="3" placeholder="Optional notes"></textarea>
      </div>
    </form>
  `;
}

function buildPartyAwardDialogContent(characters) {
  return `
    <form class="legends-xp-dialog" style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
      <div><strong>${characters.length}</strong> player characters will receive XP.</div>
      <div style="font-size: 12px; color: #666;">Default session award is <strong>${DEFAULT_SESSION_XP_AWARD} XP</strong> per player character.</div>
      <div class="form-group">
        <label>Amount</label>
        <input type="number" name="amount" value="${DEFAULT_SESSION_XP_AWARD}" min="1" step="1" />
      </div>
      <div class="form-group">
        <label>Reason</label>
        <input type="text" name="reason" value="Session award" placeholder="Session award" />
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes" rows="3" placeholder="Optional notes for every award"></textarea>
      </div>
      <div style="font-size: 12px; color: #666;">Recipients: ${characters.map((actor) => actor.name).join(', ')}</div>
    </form>
  `;
}

function buildSpendDialogContent(actor) {
  const state = getActorProgressionState(actor);
  return `
    <form class="legends-xp-dialog" style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
      <div><strong>${actor.name}</strong> has <strong>${state.unspent}</strong> unspent XP available.</div>
      <div class="form-group">
        <label>Amount</label>
        <input type="number" name="amount" value="40" min="1" max="${state.unspent}" step="1" />
      </div>
      <div class="form-group">
        <label>Category</label>
        <select name="category">
          <option value="feat">Feat</option>
          <option value="skill">Skill</option>
          <option value="attribute">Attribute</option>
          <option value="equipment">Equipment</option>
          <option value="other" selected>Other</option>
        </select>
      </div>
      <div class="form-group">
        <label>Reason</label>
        <input type="text" name="reason" value="" placeholder="What was purchased?" />
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes" rows="3" placeholder="Optional notes"></textarea>
      </div>
      <div style="font-size: 12px; color: #666;">This first-pass workflow records the XP spend and updates unspent XP. It does not yet auto-apply feat, skill, or attribute changes.</div>
    </form>
  `;
}

function getDialogFormValues(dialog) {
  const root = dialog.element;
  return {
    amount: clampNonNegative(root.querySelector('[name="amount"]')?.value),
    category: String(root.querySelector('[name="category"]')?.value || '').trim(),
    reason: String(root.querySelector('[name="reason"]')?.value || '').trim(),
    notes: String(root.querySelector('[name="notes"]')?.value || '').trim()
  };
}

function getActorPurchaseCapabilities(actor) {
  const state = getActorProgressionState(actor);
  const magicalTraitType = String(actor?.system?.magicalTrait?.type || '').trim();
  const hasMagicAdvancement = Boolean(magicalTraitType) && magicalTraitType !== 'alchemical-tradition';
  const hasPotentials = hasMagicAdvancement && Object.keys(actor?.system?.potentials || {}).length > 0;
  const hasMasteries = hasMagicAdvancement && Object.keys(actor?.system?.mastery || {}).length > 0;

  return {
    state,
    canBypassCheckboxRequirement: state.isCreation || state.manualOverride,
    canBuyPotentials: hasPotentials,
    hasPotentials,
    hasMasteries
  };
}

function formatAttributePurchaseLabel(attributeKey, currentRank) {
  return `${ATTRIBUTE_LABELS[attributeKey] || attributeKey} ${currentRank} -> ${currentRank + 1} (${16 * currentRank} XP)`;
}

function formatSkillPurchaseLabel(skillKey, currentRank) {
  const cost = currentRank <= 0 ? 4 : 8 * currentRank;
  return `${SKILL_LABELS[skillKey] || skillKey} ${currentRank} -> ${currentRank + 1} (${cost} XP)`;
}

function formatPotentialPurchaseLabel(potentialKey, currentRank, label) {
  return `${label || potentialKey} ${currentRank} -> ${currentRank + 1} (${16 * currentRank} XP)`;
}

function buildSelectOptionsMarkup(options, selectedIndex = 0) {
  return options.map((option, index) => {
    const selected = index === selectedIndex ? 'selected' : '';
    const disabled = option.disabled ? 'disabled' : '';
    const detail = option.disabled && option.description ? ` - ${option.description}` : '';
    return `<option value="${index}" ${selected} ${disabled}>${option.label}${detail}</option>`;
  }).join('');
}

async function showPurchaseCategoryDialog(actor) {
  const { state, canBypassCheckboxRequirement, canBuyPotentials, hasMasteries } = getActorPurchaseCapabilities(actor);
  const buttons = [
    {
      action: 'feat',
      label: 'Feat',
      default: true,
      callback: () => 'feat'
    },
    {
      action: 'attribute',
      label: 'Attribute',
      callback: () => 'attribute'
    }
  ];

  buttons.push({
    action: 'skill',
    label: 'Skill',
    callback: () => 'skill'
  });

  if (hasMasteries) {
    buttons.push({
      action: 'mastery',
      label: 'Mastery',
      callback: () => 'mastery'
    });
  }

  if (canBuyPotentials) {
    buttons.push({
      action: 'potential',
      label: 'Potential',
      callback: () => 'potential'
    });
  }

  buttons.push({
    action: 'cancel',
    label: 'Cancel'
  });

  const checkboxNote = canBypassCheckboxRequirement
    ? '<p style="font-size: 12px; color: #666; margin-top: 8px;">Creation/manual override mode bypasses checkbox requirements for skills and masteries.</p>'
    : '<p style="font-size: 12px; color: #666; margin-top: 8px;">Skills and masteries require a marked training checkbox before they can be advanced.</p>';

  return foundry.applications.api.DialogV2.wait({
    window: { title: `Spend XP: ${actor.name}` },
    content: `
      <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px;">
        <div><strong>${actor.name}</strong> has <strong>${state.unspent}</strong> unspent XP.</div>
        <div>Choose what you want to purchase.</div>
        ${checkboxNote}
      </div>
    `,
    buttons
  });
}

function getAvailableAttributePurchases(actor) {
  const unspent = getActorProgressionState(actor).unspent;
  return Object.entries(actor.system?.attributes || {})
    .map(([key, attr]) => {
      const current = Number(attr?.value ?? 0);
      const cost = 16 * current;
      return {
        type: 'attribute',
        key,
        current,
        next: current + 1,
        cost,
        label: formatAttributePurchaseLabel(key, current),
        disabled: current >= 8 || cost > unspent,
        description: `${ATTRIBUTE_LABELS[key] || key} increases from ${current} to ${current + 1}.`
      };
    })
    .filter((entry) => !entry.disabled);
}

function getAvailableSkillPurchases(actor) {
  const { state, canBypassCheckboxRequirement } = getActorPurchaseCapabilities(actor);

  return Object.entries(actor.system?.skills || {})
    .map(([key, value]) => {
      const current = Number(value?.value ?? value ?? 0);
      const cost = current <= 0 ? 4 : 8 * current;
      const hasCheckbox = canBypassCheckboxRequirement || hasSkillCheckbox(actor, key);
      const disabled = current >= 8 || cost > state.unspent || !hasCheckbox;
      return {
        type: 'skill',
        key,
        current,
        next: current + 1,
        cost,
        label: formatSkillPurchaseLabel(key, current),
        disabled,
        description: !hasCheckbox
          ? `${SKILL_LABELS[key] || key} needs a training checkbox before it can be advanced.`
          : current >= 8
            ? `${SKILL_LABELS[key] || key} is already at the maximum rank.`
            : cost > state.unspent
              ? `${SKILL_LABELS[key] || key} costs ${cost} XP and only ${state.unspent} XP is unspent.`
              : `${SKILL_LABELS[key] || key} increases from ${current} to ${current + 1}.`
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

function getAvailableMasteryPurchases(actor) {
  const { state, canBypassCheckboxRequirement } = getActorPurchaseCapabilities(actor);

  return MASTERY_KEYS.map((key) => {
    const current = Number(actor.system?.mastery?.[key]?.value ?? 0);
    const potentialCap = Number(actor.system?.potentials?.[key]?.value ?? 0);
    const cost = current <= 0 ? 4 : 8 * current;
    const hasCheckbox = canBypassCheckboxRequirement || hasMasteryCheckbox(actor, key);
    return {
      type: 'mastery',
      key,
      current,
      next: current + 1,
      cost,
      label: `${MASTERY_LABELS[key] || key} ${current} -> ${current + 1} (${cost} XP)`,
      disabled: potentialCap <= 0 || current >= potentialCap || cost > state.unspent || !hasCheckbox,
      description: !hasCheckbox
        ? `${MASTERY_LABELS[key] || key} needs a training checkbox before it can be advanced.`
        : current >= potentialCap
          ? `${MASTERY_LABELS[key] || key} cannot exceed ${actor.system?.potentials?.[key]?.label || key} Potential ${potentialCap}.`
          : `${MASTERY_LABELS[key] || key} increases from ${current} to ${current + 1}.`
    };
  }).filter((entry) => !entry.disabled);
}

function getAvailablePotentialPurchases(actor) {
  const state = getActorProgressionState(actor);
  return Object.entries(actor.system?.potentials || {})
    .map(([key, potential]) => {
      const current = Number(potential?.value ?? 0);
      const cost = 16 * current;
      return {
        type: 'potential',
        key,
        current,
        next: current + 1,
        cost,
        label: formatPotentialPurchaseLabel(key, current, potential?.label),
        disabled: current <= 0 || current >= 8 || cost > state.unspent,
        description: `${potential?.label || key} increases from ${current} to ${current + 1}.`
      };
    })
    .filter((entry) => !entry.disabled);
}

async function getAvailableFeatPurchases(actor) {
  const state = getActorProgressionState(actor);
  const pack = game.packs.get('legends.feats');
  if (!pack) return [];

  const ownedFeatNames = new Set(
    actor.items
      .filter((item) => item.type === 'feat')
      .map((item) => String(item.name || '').trim().toLowerCase())
  );

  const documents = await pack.getDocuments();
  return documents
    .filter((feat) => !ownedFeatNames.has(String(feat.name || '').trim().toLowerCase()))
    .map((feat) => {
      const cost = Number(feat.system?.xpCost || 40);
      const reasons = validatePrereqs(actor, feat);
      return {
        type: 'feat',
        feat,
        key: feat.id,
        current: null,
        next: null,
        cost,
        label: `${feat.name} (${cost} XP)`,
        disabled: cost > state.unspent || reasons.length > 0,
        description: reasons.length > 0
          ? `Unavailable: ${reasons.join('; ')}`
          : `${feat.system?.classification === 'legendary' ? 'Legendary' : 'Standard'} feat`,
        reasons
      };
    })
    .filter((entry) => !entry.disabled)
    .sort((left, right) => left.label.localeCompare(right.label));
}

async function showPurchaseSelectionDialog(actor, category, options) {
  if (!options.length) {
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    ui.notifications.warn(`No ${categoryLabel.toLowerCase()} purchases are currently available for ${actor.name}.`);
    return null;
  }

  const availableOptions = options.filter((entry) => !entry.disabled);
  if (!availableOptions.length) {
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    ui.notifications.warn(`No ${categoryLabel.toLowerCase()} purchases are currently available for ${actor.name}.`);
    return null;
  }

  const selectedIndex = Math.max(0, options.findIndex((entry) => !entry.disabled));
  const helperText = category === 'skill'
    ? 'All skills are shown. Skills you cannot currently buy are greyed out with the reason appended.'
    : 'Only purchases you can currently afford and qualify for are shown.';

  return foundry.applications.api.DialogV2.wait({
    window: { title: `Spend XP: ${actor.name}` },
    content: `
      <form class="legends-xp-dialog" style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>${actor.name}</strong> has <strong>${getActorProgressionState(actor).unspent}</strong> unspent XP.</div>
        <div class="form-group">
          <label>Choose a ${category}</label>
          <select name="purchase" style="width: 100%; padding: 6px;">
            ${buildSelectOptionsMarkup(options, selectedIndex)}
          </select>
        </div>
        <div style="font-size: 12px; color: #666;">${helperText}</div>
      </form>
    `,
    buttons: [
      {
        action: 'choose',
        label: `Buy ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        default: true,
        callback: (event, button, dialog) => {
          const index = Number.parseInt(dialog.element.querySelector('[name="purchase"]')?.value || '0', 10);
          const selected = options[index] || null;
          return selected && !selected.disabled ? selected : null;
        }
      },
      {
        action: 'cancel',
        label: 'Cancel'
      }
    ]
  });
}

async function purchaseAttribute(actor, option) {
  await actor.update({ [`system.attributes.${option.key}.value`]: option.next });
  await spendXP(actor, option.cost, {
    reason: `Attribute increase: ${ATTRIBUTE_LABELS[option.key] || option.key}`,
    category: 'attribute',
    source: 'xp-purchase',
    notify: false
  });
  ui.notifications.info(`${actor.name} increased ${ATTRIBUTE_LABELS[option.key] || option.key} to ${option.next} for ${option.cost} XP.`);
}

async function purchaseSkill(actor, option) {
  await actor.update({ [`system.skills.${option.key}`]: option.next });
  await clearSkillCheckbox(actor, option.key);
  await spendXP(actor, option.cost, {
    reason: `Skill increase: ${SKILL_LABELS[option.key] || option.key}`,
    category: 'skill',
    source: 'xp-purchase',
    notify: false
  });
  ui.notifications.info(`${actor.name} increased ${SKILL_LABELS[option.key] || option.key} to ${option.next} for ${option.cost} XP.`);
}

async function purchaseMastery(actor, option) {
  await actor.update({ [`system.mastery.${option.key}.value`]: option.next });
  await clearMasteryCheckbox(actor, option.key);
  await spendXP(actor, option.cost, {
    reason: `Mastery increase: ${MASTERY_LABELS[option.key] || option.key}`,
    category: 'mastery',
    source: 'xp-purchase',
    notify: false
  });
  ui.notifications.info(`${actor.name} increased ${MASTERY_LABELS[option.key] || option.key} to ${option.next} for ${option.cost} XP.`);
}

async function purchasePotential(actor, option) {
  await actor.update({ [`system.potentials.${option.key}.value`]: option.next });
  const label = actor.system?.potentials?.[option.key]?.label || option.key;
  await spendXP(actor, option.cost, {
    reason: `Potential increase: ${label}`,
    category: 'potential',
    source: 'xp-purchase',
    notify: false
  });
  ui.notifications.info(`${actor.name} increased ${label} to ${option.next} for ${option.cost} XP.`);
}

async function purchaseFeat(actor, option) {
  const featData = option.feat.toObject();
  const [createdFeat] = await actor.createEmbeddedDocuments('Item', [featData]);
  if (!createdFeat) {
    ui.notifications.error(`Failed to purchase feat ${option.feat.name}.`);
    return null;
  }

  await spendXP(actor, option.cost, {
    reason: `Feat purchase: ${option.feat.name}`,
    category: 'feat',
    source: 'xp-purchase',
    notify: false
  });
  ui.notifications.info(`${actor.name} purchased ${option.feat.name} for ${option.cost} XP.`);
  return createdFeat;
}

async function executePurchaseOption(actor, option) {
  if (!option) return null;

  switch (option.type) {
    case 'attribute':
      return purchaseAttribute(actor, option);
    case 'skill':
      return purchaseSkill(actor, option);
    case 'potential':
      return purchasePotential(actor, option);
    case 'mastery':
      return purchaseMastery(actor, option);
    case 'feat':
      return purchaseFeat(actor, option);
    default:
      return null;
  }
}

export async function showAwardXPDialog(actor) {
  if (!canAwardXP(actor)) {
    ui.notifications.warn('Only the GM can award XP.');
    return null;
  }

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `Award XP: ${actor.name}` },
    content: buildAwardDialogContent(actor),
    buttons: [
      {
        action: 'award',
        label: 'Award XP',
        default: true,
        callback: (event, button, dialog) => getDialogFormValues(dialog)
      },
      {
        action: 'cancel',
        label: 'Cancel'
      }
    ]
  });

  if (!result?.amount) return null;
  return awardXP(actor, result.amount, {
    reason: result.reason || 'XP award',
    notes: result.notes,
    category: 'award',
    source: 'sheet-award',
    notify: true
  });
}

export async function awardPartyXP(amount, options = {}) {
  if (!canManagePartyAwards()) {
    ui.notifications.warn('Only the GM can award XP to the party.');
    return [];
  }

  const characters = getAwardablePlayerCharacters();
  if (!characters.length) {
    ui.notifications.warn('No player characters are available to award XP.');
    return [];
  }

  const results = [];
  for (const actor of characters) {
    const updated = await awardXP(actor, amount, {
      ...options,
      notify: false,
      category: options.category || 'award',
      source: options.source || 'party-award',
    });

    if (updated) {
      results.push(updated);
    }
  }

  if (results.length) {
    ui.notifications.info(`${Math.abs(Number(amount) || 0)} XP awarded to ${results.length} player characters.`);
  }

  return results;
}

export async function showAwardPartyXPDialog() {
  if (!canManagePartyAwards()) {
    ui.notifications.warn('Only the GM can award XP to the party.');
    return [];
  }

  const characters = getAwardablePlayerCharacters();
  if (!characters.length) {
    ui.notifications.warn('No player characters are available to award XP.');
    return [];
  }

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Award XP: All Player Characters' },
    content: buildPartyAwardDialogContent(characters),
    buttons: [
      {
        action: 'award',
        label: 'Award XP To All',
        default: true,
        callback: (event, button, dialog) => getDialogFormValues(dialog)
      },
      {
        action: 'cancel',
        label: 'Cancel'
      }
    ]
  });

  if (!result?.amount) return [];
  return awardPartyXP(result.amount, {
    reason: result.reason || 'XP award',
    notes: result.notes,
    category: 'award',
    source: 'party-award',
  });
}

export async function showSpendXPDialog(actor) {
  if (!canSpendXP(actor)) {
    ui.notifications.warn('You do not have permission to spend XP for this actor.');
    return null;
  }

  const category = await showPurchaseCategoryDialog(actor);
  if (!category || category === 'cancel') return null;

  let options = [];
  switch (category) {
    case 'feat':
      options = await getAvailableFeatPurchases(actor);
      break;
    case 'attribute':
      options = getAvailableAttributePurchases(actor);
      break;
    case 'skill':
      options = getAvailableSkillPurchases(actor);
      break;
    case 'mastery':
      options = getAvailableMasteryPurchases(actor);
      break;
    case 'potential':
      options = getAvailablePotentialPurchases(actor);
      break;
    default:
      return null;
  }

  const selection = await showPurchaseSelectionDialog(actor, category, options);
  if (!selection) return null;
  return executePurchaseOption(actor, selection);
}