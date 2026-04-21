import { validatePrereqs } from './feat-effects.mjs';
import { SKILL_LABELS } from './skill-utils.mjs';
import { getLanguageDefinitions, normalizeLanguageKey } from './languages.mjs';
import { MASTERY_KEYS, MASTERY_LABELS, hasMasteryCheckbox, hasSkillCheckbox, clearMasteryCheckbox, clearSkillCheckbox } from './training.mjs';

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

function formatCategoryLabel(value) {
  return String(value || '')
    .trim()
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildPurchaseOptionPreview(option, category, actor) {
  if (!option) return '<div>No option selected.</div>';

  if (option.type === 'feat') {
    const feat = option.feat;
    const system = feat.system || {};
    const prereqText = typeof system.prerequisites === 'string'
      ? system.prerequisites
      : '';
    const statusTone = option.disabled ? '#a64545' : '#567a43';
    const statusText = option.disabled
      ? (option.description || 'Not currently available')
      : `Available for ${option.cost} XP.`;
    const reasonHtml = Array.isArray(option.reasons) && option.reasons.length
      ? `<ul style="margin: 8px 0 0 18px;">${option.reasons.map((reason) => `<li>${Handlebars.escapeExpression(reason)}</li>`).join('')}</ul>`
      : '<div style="margin-top: 8px; color: #567a43;">This character currently meets the listed prerequisites.</div>';

    return `
      <div style="display: flex; flex-direction: column; gap: 10px; min-height: 420px;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">
            <h3 style="margin: 0;">${Handlebars.escapeExpression(feat.name)}</h3>
            <span style="font-size: 12px; color: #666;">${Handlebars.escapeExpression(system.classification === 'legendary' ? 'Legendary Feat' : 'Standard Feat')} • ${option.cost} XP</span>
          </div>
          <div style="margin-top: 6px; font-size: 12px; color: ${statusTone};">${Handlebars.escapeExpression(statusText)}</div>
        </div>
        ${prereqText ? `<div><strong>Prerequisites:</strong> ${Handlebars.escapeExpression(prereqText)}</div>` : '<div><strong>Prerequisites:</strong> None listed</div>'}
        <div>
          <strong>Eligibility</strong>
          ${reasonHtml}
        </div>
        ${system.description?.value ? `<div><strong>Description</strong><div style="margin-top: 6px;">${system.description.value}</div></div>` : ''}
        ${system.benefits ? `<div><strong>Benefits</strong><div style="margin-top: 6px;">${system.benefits}</div></div>` : ''}
        ${String(system.notes || '').trim() ? `<div><strong>Notes</strong><div style="margin-top: 6px; white-space: pre-wrap;">${Handlebars.escapeExpression(system.notes)}</div></div>` : ''}
      </div>
    `;
  }

  const label = option.type === 'attribute'
    ? (ATTRIBUTE_LABELS[option.key] || option.key)
    : option.type === 'skill'
      ? (SKILL_LABELS[option.key] || option.key)
      : option.type === 'mastery'
        ? (MASTERY_LABELS[option.key] || option.key)
        : option.type === 'potential'
          ? (actor.system?.potentials?.[option.key]?.label || option.key)
          : option.label;
  const typeLabel = formatCategoryLabel(category || option.type);
  const statusTone = option.disabled ? '#a64545' : '#567a43';
  const statusText = option.disabled
    ? (option.description || 'Not currently available')
    : `Available for ${option.cost} XP.`;

  return `
    <div style="display: flex; flex-direction: column; gap: 10px; min-height: 320px;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">
          <h3 style="margin: 0;">${Handlebars.escapeExpression(label)}</h3>
          <span style="font-size: 12px; color: #666;">${Handlebars.escapeExpression(typeLabel)} • ${option.cost} XP</span>
        </div>
        <div style="margin-top: 6px; font-size: 12px; color: ${statusTone};">${Handlebars.escapeExpression(statusText)}</div>
      </div>
      <div><strong>Current Rank:</strong> ${option.current}</div>
      <div><strong>New Rank:</strong> ${option.next}</div>
      <div><strong>Cost:</strong> ${option.cost} XP</div>
      ${String(option.description || '').trim() ? `<div><strong>Details</strong><div style="margin-top: 6px; white-space: pre-wrap;">${Handlebars.escapeExpression(option.description)}</div></div>` : ''}
    </div>
  `;
}

function renderPurchaseOptionPicker(root, options, initialIndex, category, actor) {
  const input = root.querySelector('[name="purchase"]');
  const preview = root.querySelector('[data-purchase-preview]');
  const rows = Array.from(root.querySelectorAll('[data-purchase-option]'));

  const syncSelection = (index) => {
    const safeIndex = Math.max(0, Math.min(index, options.length - 1));
    if (input) input.value = String(safeIndex);
    rows.forEach((row, rowIndex) => {
      row.style.borderColor = rowIndex === safeIndex ? '#d18b47' : 'rgba(209, 139, 71, 0.25)';
      row.style.background = rowIndex === safeIndex ? 'rgba(209, 139, 71, 0.10)' : (options[rowIndex]?.disabled ? 'rgba(120, 120, 120, 0.10)' : 'rgba(255, 255, 255, 0.03)');
    });
    if (preview) preview.innerHTML = buildPurchaseOptionPreview(options[safeIndex], category, actor);
  };

  rows.forEach((row, rowIndex) => {
    row.addEventListener('click', () => syncSelection(rowIndex));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        syncSelection(rowIndex);
      }
    });
  });

  syncSelection(initialIndex);
}

function buildLanguageSelectionPreview(languageOption, { nativeLanguage, selectedKeys, capacity }) {
  if (!languageOption) return '<div>No language selected.</div>';

  const isNative = languageOption.key === nativeLanguage;
  const isSelected = selectedKeys.includes(languageOption.key);
  const status = isNative
    ? 'Native language'
    : (isSelected ? 'Selected as additional language' : 'Available to select');

  return `
    <div style="display: flex; flex-direction: column; gap: 10px; min-height: 320px;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">
          <h3 style="margin: 0;">${Handlebars.escapeExpression(languageOption.label)}</h3>
          <span style="font-size: 12px; color: #666;">Language</span>
        </div>
        <div style="margin-top: 6px; font-size: 12px; color: ${isNative ? '#567a43' : (isSelected ? '#2b6cb0' : '#666')};">${Handlebars.escapeExpression(status)}</div>
      </div>
      <div><strong>Additional Slots:</strong> ${selectedKeys.length} / ${capacity}</div>
      <div>
        <strong>Lore</strong>
        <div style="margin-top: 6px; line-height: 1.5;">${Handlebars.escapeExpression(languageOption.description || 'No lore description is currently defined for this language.')}</div>
      </div>
    </div>
  `;
}

function renderLanguageSelectionPicker(root, definitions, nativeLanguage, capacity, initialSelectedKeys) {
  const hiddenInput = root.querySelector('[name="selectedLanguageKeys"]');
  const preview = root.querySelector('[data-language-picker-preview]');
  const rows = Array.from(root.querySelectorAll('[data-language-picker-option]'));
  const counter = root.querySelector('[data-language-picker-count]');
  const selected = new Set(initialSelectedKeys);

  const syncState = (focusIndex = 0) => {
    const boundedIndex = Math.max(0, Math.min(focusIndex, definitions.length - 1));

    rows.forEach((row, rowIndex) => {
      const option = definitions[rowIndex];
      if (!option) return;

      const isNative = option.key === nativeLanguage;
      const isSelected = selected.has(option.key);
      const isAtCapacity = selected.size >= capacity;
      const isDisabled = isNative || (!isSelected && isAtCapacity);

      row.style.opacity = isDisabled ? '0.65' : '1';
      row.style.cursor = isNative ? 'not-allowed' : 'pointer';
      row.style.borderColor = rowIndex === boundedIndex ? '#d18b47' : 'rgba(209, 139, 71, 0.25)';
      row.style.background = rowIndex === boundedIndex
        ? 'rgba(209, 139, 71, 0.10)'
        : (isSelected ? 'rgba(66, 153, 225, 0.10)' : 'rgba(255, 255, 255, 0.03)');

      const status = row.querySelector('[data-language-picker-status]');
      if (status) {
        status.textContent = isNative ? 'Native' : (isSelected ? 'Selected' : (isDisabled ? 'No slots' : 'Available'));
      }
    });

    if (counter) counter.textContent = `${selected.size} / ${capacity} selected`;
    if (hiddenInput) hiddenInput.value = JSON.stringify([...selected]);
    if (preview) {
      preview.innerHTML = buildLanguageSelectionPreview(definitions[boundedIndex], {
        nativeLanguage,
        selectedKeys: [...selected],
        capacity,
      });
    }
  };

  rows.forEach((row, rowIndex) => {
    const option = definitions[rowIndex];
    if (!option) return;

    row.addEventListener('click', () => {
      const isNative = option.key === nativeLanguage;
      if (isNative) {
        syncState(rowIndex);
        return;
      }

      const isSelected = selected.has(option.key);
      if (isSelected) {
        selected.delete(option.key);
        syncState(rowIndex);
        return;
      }

      if (selected.size >= capacity) {
        ui.notifications.warn(`This character can only select ${capacity} additional language${capacity === 1 ? '' : 's'}.`);
        syncState(rowIndex);
        return;
      }

      selected.add(option.key);
      syncState(rowIndex);
    });

    row.addEventListener('keydown', (dialogEvent) => {
      if (dialogEvent.key === 'Enter' || dialogEvent.key === ' ') {
        dialogEvent.preventDefault();
        row.click();
      }
    });
  });

  syncState(0);
}

async function showLanguageSelectionDialog(actor, capacityOverride = null) {
  const definitions = getLanguageDefinitions();
  if (!definitions.length) return null;

  const nativeLanguage = normalizeLanguageKey(actor.system?.languages?.native);
  const languageSkillData = actor.system?.skills?.language;
  const languageRank = typeof languageSkillData === 'object'
    ? Number(languageSkillData?.value ?? 0)
    : Number(languageSkillData ?? 0);
  const capacity = Math.max(0, Math.floor(Number(capacityOverride ?? languageRank) || 0));
  const validLanguageKeys = new Set(definitions.map((entry) => entry.key));
  const selectedKeys = Array.isArray(actor.system?.languages?.selected)
    ? actor.system.languages.selected
        .map((entry) => normalizeLanguageKey(entry))
        .filter((entry, index, collection) => entry && entry !== nativeLanguage && validLanguageKeys.has(entry) && collection.indexOf(entry) === index)
        .slice(0, capacity)
    : [];

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `Choose Languages: ${actor.name}` },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Additional Languages</strong> are granted by your Language skill rank.</div>
        <div style="font-size: 12px; color: #666;">Select up to ${capacity} additional language${capacity === 1 ? '' : 's'} and review each language's lore in the preview panel.</div>
        <div style="font-size: 12px; color: #666;" data-language-picker-count>${selectedKeys.length} / ${capacity} selected</div>
        <input type="hidden" name="selectedLanguageKeys" value='${Handlebars.escapeExpression(JSON.stringify(selectedKeys))}' />
        <div style="display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: 14px; align-items: start;">
          <div>
            <label style="display: block; margin-bottom: 6px;">Languages</label>
            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 460px; overflow-y: auto; padding-right: 4px;">
              ${definitions.map((entry, index) => {
                const isNative = entry.key === nativeLanguage;
                const isSelected = selectedKeys.includes(entry.key);
                const status = isNative ? 'Native' : (isSelected ? 'Selected' : 'Available');
                return `
                  <div
                    data-language-picker-option="${index}"
                    tabindex="0"
                    style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 8px 10px; cursor: pointer; opacity: ${isNative ? '0.65' : '1'};">
                    <div style="font-weight: 600;">${Handlebars.escapeExpression(entry.label)}</div>
                    <div data-language-picker-status style="font-size: 12px; color: #666; margin-top: 2px;">${Handlebars.escapeExpression(status)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div data-language-picker-preview style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 10px; padding: 12px; max-height: 460px; overflow-y: auto;"></div>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'apply',
        label: 'Apply Languages',
        default: true,
        callback: (dialogEvent, button, dialog) => {
          const raw = String(dialog.element.querySelector('[name="selectedLanguageKeys"]')?.value || '[]');
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : selectedKeys;
          } catch (error) {
            console.warn('Failed to parse selected language keys from picker dialog.', error);
            return selectedKeys;
          }
        },
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
    render: (dialogEvent, dialog) => {
      renderLanguageSelectionPicker(dialog.element, definitions, nativeLanguage, capacity, selectedKeys);
    },
  });

  if (!result) return null;
  return result;
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

  const categoryLabel = formatCategoryLabel(category);

  return foundry.applications.api.DialogV2.wait({
    window: { title: `Spend XP: ${actor.name}` },
    content: `
      <form class="legends-xp-dialog" style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>${actor.name}</strong> has <strong>${getActorProgressionState(actor).unspent}</strong> unspent XP.</div>
        <div style="font-size: 12px; color: #666;">${helperText}</div>
        <input type="hidden" name="purchase" value="${selectedIndex >= 0 ? selectedIndex : 0}" />
        <div style="display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: 14px; align-items: start;">
          <div>
            <label style="display: block; margin-bottom: 6px;">Choose a ${category}</label>
            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 460px; overflow-y: auto; padding-right: 4px;">
              ${options.map((option, index) => {
                const status = option.disabled ? 'Not available now' : 'Available now';
                const meta = option.type === 'feat'
                  ? `${option.cost} XP • ${option.feat.system?.classification === 'legendary' ? 'Legendary' : 'Standard'} • ${status}`
                  : `${option.current} -> ${option.next} • ${option.cost} XP • ${status}`;
                return `
                  <div
                    data-purchase-option="${index}"
                    tabindex="0"
                    style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 8px 10px; cursor: pointer; opacity: ${option.disabled ? '0.65' : '1'};">
                    <div style="font-weight: 600;">${Handlebars.escapeExpression(option.label)}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 2px;">${Handlebars.escapeExpression(meta)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div data-purchase-preview style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 10px; padding: 12px; max-height: 460px; overflow-y: auto;"></div>
        </div>
      </form>
    `,
    position: { width: 980 },
    buttons: [
      {
        action: 'choose',
        label: `Buy ${categoryLabel}`,
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
    ],
    render: (event, dialog) => {
      renderPurchaseOptionPicker(dialog.element, options, selectedIndex >= 0 ? selectedIndex : 0, category, actor);
    }
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

  if (option.key === 'language') {
    const selectedLanguages = await showLanguageSelectionDialog(actor, option.next);
    if (selectedLanguages) {
      await actor.update({ 'system.languages.selected': selectedLanguages });
    }
  }
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