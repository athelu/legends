import { validatePrereqs } from './feat-effects.mjs';
import { getNativeLanguageKeyForOrigin, getOriginOptionsForAncestry, normalizeOriginKey } from './languages.mjs';
import { setupMagicalTraits } from './magical-traits.mjs';
import { getActorProgressionState, showSpendXPDialog } from './progression.mjs';
import { SKILL_LABELS, normalizeSkillKey } from './skill-utils.mjs';

const CREATION_FLAG_SCOPE = 'legends';
const CREATION_FLAG_KEY = 'characterCreationWorkflow';

const ATTRIBUTE_KEYS = [
  'strength',
  'constitution',
  'agility',
  'dexterity',
  'intelligence',
  'wisdom',
  'charisma',
  'luck'
];

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

const CREATION_STEP_METADATA = [
  { key: 'attributes', label: 'Determine Attributes' },
  { key: 'ancestry', label: 'Choose Ancestry' },
  { key: 'origin', label: 'Choose Nationality and Native Language' },
  { key: 'background', label: 'Choose Background' },
  { key: 'traitsAndFlaws', label: 'Select Traits and Flaws' },
  { key: 'startingFeats', label: 'Select 2 Starting Feats' },
  { key: 'spendXp', label: 'Spend Starting XP' },
  { key: 'hitPoints', label: 'Calculate Hit Points' },
  { key: 'equipment', label: 'Select Starting Equipment' },
];

const STANDARD_ARRAY = [5, 4, 3, 3, 3, 2, 2, 2];

const BACKGROUND_RANDOM_TABLE = {
  11: 'Acolyte',
  12: 'Archaeologist',
  13: 'Artisan',
  14: 'Artist',
  15: 'Athlete',
  16: 'Bandit',
  17: 'Barber',
  18: 'Barkeep',
  21: 'Barrister',
  22: 'Bookkeeper',
  23: 'Butcher',
  24: 'Carpenter',
  25: 'Charlatan',
  26: 'Cook',
  27: 'Courtier',
  28: 'Courier',
  31: 'Criminal',
  32: 'Driver',
  33: 'Entertainer',
  34: 'Farmer',
  35: 'Fisher',
  36: 'Gambler',
  37: 'Guard',
  38: 'Herbalist',
  41: 'Hermit',
  42: 'Hunter',
  43: 'Investigator',
  44: 'Laborer',
  45: 'Merchant',
  46: 'Mercenary',
  47: 'Miner',
  48: 'Noble',
  51: 'Nomad',
  52: 'Refugee',
  53: 'Sage',
  54: 'Sailor',
  55: 'Scholar',
  56: 'Servant',
  57: 'Shepherd',
  58: 'Smith',
  61: 'Smuggler',
  62: 'Soldier',
  63: 'Squire',
  64: 'Tailor',
  65: 'Teacher',
  66: 'Urchin',
  67: 'Ward',
  68: 'Reroll (Player\'s Choice)',
  71: 'Reroll (Player\'s Choice)',
  72: 'Reroll (Player\'s Choice)',
  73: 'Reroll (Player\'s Choice)',
  74: 'Reroll (Player\'s Choice)',
  75: 'Reroll (Player\'s Choice)',
  76: 'Reroll (Player\'s Choice)',
  77: 'Reroll (Player\'s Choice)',
  78: 'Reroll (Player\'s Choice)',
  81: 'Reroll (Player\'s Choice)',
  82: 'Reroll (Player\'s Choice)',
  83: 'Reroll (Player\'s Choice)',
  84: 'Reroll (Player\'s Choice)',
  85: 'Reroll (Player\'s Choice)',
  86: 'Reroll (Player\'s Choice)',
  87: 'Reroll (Player\'s Choice)',
  88: 'Reroll (Player\'s Choice)'
};

function getWorkflowState(actor) {
  return foundry.utils.deepClone(actor?.getFlag(CREATION_FLAG_SCOPE, CREATION_FLAG_KEY) || {});
}

async function updateWorkflowState(actor, updates) {
  const nextState = foundry.utils.mergeObject(getWorkflowState(actor), updates, { inplace: false, recursive: true });
  await actor.setFlag(CREATION_FLAG_SCOPE, CREATION_FLAG_KEY, nextState);
  return nextState;
}

function escapeHtml(value) {
  return Handlebars.escapeExpression(String(value ?? ''));
}

function normalizeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function formatFeatPrerequisites(prereqs) {
  if (typeof prereqs === 'string') return prereqs;
  if (!prereqs || typeof prereqs !== 'object') return '';

  const parts = [];
  for (const [attr, value] of Object.entries(prereqs.attributes || {})) {
    if (!value) continue;
    parts.push(`${ATTRIBUTE_LABELS[attr] || attr} ${value}+`);
  }

  const skillSpec = typeof prereqs.skills === 'string' ? prereqs.skills : '';
  for (const part of skillSpec.split(',').map((entry) => entry.trim()).filter(Boolean)) {
    const [skillKey, value] = part.split(':').map((entry) => entry.trim());
    if (!skillKey || !value) continue;
    const normalized = normalizeSkillKey(skillKey) || skillKey;
    parts.push(`${SKILL_LABELS[normalized] || skillKey} ${value}+`);
  }

  const featList = Array.isArray(prereqs.feats)
    ? prereqs.feats
    : String(prereqs.feats || '').split(',').map((entry) => entry.trim()).filter(Boolean);
  parts.push(...featList.filter(Boolean));

  if (Number(prereqs.tier || 0) > 0) {
    parts.push(`Tier ${Number(prereqs.tier)}`);
  }

  if (String(prereqs.other || '').trim()) {
    parts.push(String(prereqs.other).trim());
  }

  return parts.join(', ');
}

function formatKeywordList(keywords) {
  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(', ');
  return String(keywords || '').trim();
}

function buildStartingFeatPreview(entry) {
  const feat = entry.feat;
  const system = feat.system || {};
  const prereqText = formatFeatPrerequisites(system.prerequisites);
  const keywords = formatKeywordList(system.keywords);
  const statusTone = entry.disabled ? '#a64545' : '#567a43';
  const statusText = entry.disabled ? 'Not currently qualified' : 'Currently qualified';
  const reasonHtml = entry.reasons.length
    ? `<ul style="margin: 8px 0 0 18px;">${entry.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>`
    : '<div style="margin-top: 8px; color: #567a43;">This character currently meets the listed prerequisites.</div>';

  return `
    <div style="display: flex; flex-direction: column; gap: 10px; min-height: 420px;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">
          <h3 style="margin: 0;">${escapeHtml(feat.name)}</h3>
          <span style="font-size: 12px; color: #666;">${escapeHtml(system.classification === 'legendary' ? 'Legendary Feat' : 'Standard Feat')} • ${escapeHtml(String(system.xpCost || 40))} XP</span>
        </div>
        <div style="margin-top: 6px; font-size: 12px; color: ${statusTone};">${statusText}</div>
      </div>
      ${keywords ? `<div><strong>Keywords:</strong> ${escapeHtml(keywords)}</div>` : ''}
      ${prereqText ? `<div><strong>Prerequisites:</strong> ${escapeHtml(prereqText)}</div>` : '<div><strong>Prerequisites:</strong> None listed</div>'}
      <div>
        <strong>Eligibility</strong>
        ${reasonHtml}
      </div>
      ${system.description?.value ? `<div><strong>Description</strong><div style="margin-top: 6px;">${system.description.value}</div></div>` : ''}
      ${system.benefits ? `<div><strong>Benefits</strong><div style="margin-top: 6px;">${system.benefits}</div></div>` : ''}
      ${String(system.notes || '').trim() ? `<div><strong>Notes</strong><div style="margin-top: 6px; white-space: pre-wrap;">${escapeHtml(system.notes)}</div></div>` : ''}
    </div>
  `;
}

function renderStartingFeatPicker(root, options, initialIndex) {
  const input = root.querySelector('[name="featChoice"]');
  const preview = root.querySelector('[data-starting-feat-preview]');
  const rows = Array.from(root.querySelectorAll('[data-starting-feat-option]'));

  const syncSelection = (index) => {
    const safeIndex = Math.max(0, Math.min(index, options.length - 1));
    if (input) input.value = String(safeIndex);
    rows.forEach((row, rowIndex) => {
      row.style.borderColor = rowIndex === safeIndex ? '#d18b47' : 'rgba(209, 139, 71, 0.25)';
      row.style.background = rowIndex === safeIndex ? 'rgba(209, 139, 71, 0.10)' : (options[rowIndex]?.disabled ? 'rgba(120, 120, 120, 0.10)' : 'rgba(255, 255, 255, 0.03)');
    });
    if (preview) preview.innerHTML = buildStartingFeatPreview(options[safeIndex]);
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

function rollD8() {
  return Math.floor(Math.random() * 8) + 1;
}

function hasCompletedWorkflowStep(state, stepKey) {
  return Boolean(state?.[stepKey]?.completedAt);
}

function getResumeWorkflowStep(steps, state) {
  const currentStep = steps.find((step) => step.key === state?.currentStep);
  if (currentStep && !hasCompletedWorkflowStep(state, currentStep.key)) {
    return currentStep;
  }

  return steps.find((step) => !hasCompletedWorkflowStep(state, step.key)) || null;
}

function formatAttributeSummary(values) {
  return ATTRIBUTE_KEYS.map((key, index) => `${ATTRIBUTE_LABELS[key]} ${Number(values?.[index] || 0)}`).join(', ');
}

function getCurrentAttributes(actor) {
  return ATTRIBUTE_KEYS.map((key) => Number(actor.system?.attributes?.[key]?.value ?? 0));
}

function formatItemList(items, emptyText) {
  if (!items.length) return `<p style="margin: 0; color: #666;">${escapeHtml(emptyText)}</p>`;
  return `<ul style="margin: 0; padding-left: 18px;">${items.map((item) => `<li>${escapeHtml(item.name)}</li>`).join('')}</ul>`;
}

function getCreationXpPurchaseSummary(state) {
  const transactions = Array.isArray(state?.transactions) ? state.transactions : [];
  const purchases = transactions
    .filter((entry) => entry?.type === 'spend' && entry?.source === 'xp-purchase')
    .map((entry) => ({
      id: String(entry.id || ''),
      reason: String(entry.reason || 'XP purchase').trim() || 'XP purchase',
      amount: Math.abs(Number(entry.amount || 0)),
      category: String(entry.category || '').trim(),
      timestamp: String(entry.timestamp || ''),
    }));

  const totalSpent = purchases.reduce((sum, entry) => sum + entry.amount, 0);
  return {
    purchases,
    totalSpent,
  };
}

function formatCreationXpPurchaseList(summary) {
  if (!summary.purchases.length) {
    return '<p style="margin: 0; color: #666;">No XP has been spent yet.</p>';
  }

  const rows = [...summary.purchases]
    .reverse()
    .map((entry) => `<li><strong>${escapeHtml(entry.reason)}</strong> <span style="color: #666;">(${entry.amount} XP)</span></li>`)
    .join('');

  return `<ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px;">${rows}</ul>`;
}

function getTraitFlawPointSummary(actor) {
  const traits = actor.items.filter((item) => item.type === 'trait');
  const flaws = actor.items.filter((item) => item.type === 'flaw');
  const spent = traits.reduce((total, item) => total + Math.abs(Number(item.system?.pointCost || 0)), 0);
  const earned = flaws.reduce((total, item) => total + Number(item.system?.pointValue || 0), 0);
  return {
    spent,
    earned,
    remaining: earned - spent,
    isOverspent: spent > earned,
  };
}

function getCreationFeatItems(actor) {
  return actor.items.filter((item) => item.type === 'feat' && item.getFlag('legends', 'creation.freeFeat'));
}

async function showWizardDialog({ title, content, buttons, position, ...dialogOptions }) {
  return foundry.applications.api.DialogV2.wait({
    window: { title },
    content,
    buttons,
    position,
    rejectClose: false,
    ...dialogOptions,
  });
}

function mapValuesToPoolIndices(currentValues, pool) {
  const remainingIndices = pool.map((_, index) => index);
  const selections = [];

  for (const value of currentValues) {
    const matchIndex = remainingIndices.findIndex((poolIndex) => pool[poolIndex] === value);
    if (matchIndex >= 0) {
      selections.push(remainingIndices.splice(matchIndex, 1)[0]);
      continue;
    }

    selections.push(remainingIndices.shift() ?? 0);
  }

  return selections;
}

function renderAttributeAssignmentSelectors(root, pool, initialSelections) {
  const selects = Array.from(root.querySelectorAll('[data-attribute-assignment-select]'));
  const selectedIndices = [...initialSelections];

  const syncSelectOptions = () => {
    selects.forEach((select, selectIndex) => {
      const reservedByOthers = new Set(
        selectedIndices.filter((poolIndex, poolSelectionIndex) => poolSelectionIndex !== selectIndex)
      );

      const availableIndices = pool
        .map((value, poolIndex) => ({ value, poolIndex }))
        .filter((entry) => entry.poolIndex === selectedIndices[selectIndex] || !reservedByOthers.has(entry.poolIndex));

      const currentSelection = selectedIndices[selectIndex];
      const nextSelection = availableIndices.some((entry) => entry.poolIndex === currentSelection)
        ? currentSelection
        : (availableIndices[0]?.poolIndex ?? currentSelection);

      selectedIndices[selectIndex] = nextSelection;
      select.innerHTML = availableIndices
        .map((entry) => `<option value="${entry.poolIndex}" ${entry.poolIndex === nextSelection ? 'selected' : ''}>${entry.value}</option>`)
        .join('');
      select.value = String(nextSelection);
    });
  };

  selects.forEach((select, selectIndex) => {
    select.addEventListener('change', () => {
      selectedIndices[selectIndex] = Number.parseInt(select.value || '0', 10);
      syncSelectOptions();
    });
  });

  syncSelectOptions();
}

async function showIntroDialog(actor) {
  const state = getWorkflowState(actor);
  if (state.hideIntro) return 'begin';
  const resumeStep = getResumeWorkflowStep(CREATION_STEP_METADATA, state);
  const beginLabel = resumeStep ? 'Resume Creation Workflow' : 'Begin Creation Workflow';

  const result = await showWizardDialog({
    title: `Character Creation: ${actor.name}`,
    position: { width: 560 },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <p style="margin: 0;">This workflow follows the character creation steps in the rules and walks the actor through attributes, ancestry, background, traits/flaws, starting feats, XP spending, HP, and equipment/wealth guidance.</p>
        ${resumeStep ? `<p style="margin: 0;"><strong>Next step:</strong> ${escapeHtml(resumeStep.label)}</p>` : ''}
        <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px;">
          <li>Determine Attributes</li>
          <li>Choose Ancestry</li>
          <li>Choose Nationality and Native Language</li>
          <li>Choose Background</li>
          <li>Select Traits and Flaws</li>
          <li>Select 2 Starting Feats</li>
          <li>Spend Starting XP</li>
          <li>Calculate Hit Points</li>
          <li>Select Starting Equipment</li>
        </ol>
        <label class="checkbox" style="padding: 0;">
          <input type="checkbox" name="hideIntro" ${state.hideIntro ? 'checked' : ''} />
          <span>Don\'t show this again for this actor</span>
        </label>
      </form>
    `,
    buttons: [
      {
        action: 'begin',
        label: beginLabel,
        default: true,
        callback: (event, button, dialog) => ({
          action: 'begin',
          hideIntro: Boolean(dialog.element.querySelector('[name="hideIntro"]')?.checked),
        }),
      },
      {
        action: 'skip',
        label: 'Skip For Now',
        callback: (event, button, dialog) => ({
          action: 'skip',
          hideIntro: Boolean(dialog.element.querySelector('[name="hideIntro"]')?.checked),
        }),
      },
    ],
  });

  if (!result) return null;
  await updateWorkflowState(actor, { hideIntro: Boolean(result.hideIntro) });
  return result.action;
}

function buildAttributePoolAssignmentMarkup(pool, currentValues) {
  const selectedPoolIndices = mapValuesToPoolIndices(currentValues, pool);

  const rows = ATTRIBUTE_KEYS.map((key, index) => {
    return `
      <div class="form-group" style="margin: 0;">
        <label>${ATTRIBUTE_LABELS[key]}</label>
        <select name="attr-${key}" data-attribute-assignment-select="true" data-select-index="${index}" style="width: 100%; padding: 6px;">
          <option value="${selectedPoolIndices[index]}">${pool[selectedPoolIndices[index]]}</option>
        </select>
      </div>
    `;
  }).join('');

  return { rows, selectedPoolIndices };
}

async function applyAttributeAssignments(actor, values, metadata) {
  const updates = {};
  ATTRIBUTE_KEYS.forEach((key, index) => {
    updates[`system.attributes.${key}.value`] = Number(values[index] || 0);
  });

  await actor.update(updates);
  await updateWorkflowState(actor, {
    attributes: {
      method: metadata.method,
      values: values.map((value) => Number(value || 0)),
      rolledValues: metadata.rolledValues || null,
      completedAt: new Date().toISOString(),
    },
  });
}

async function runArrayAssignmentStep(actor, method, pool) {
  while (true) {
    const currentValues = getCurrentAttributes(actor);
    const { rows, selectedPoolIndices } = buildAttributePoolAssignmentMarkup(pool, currentValues);
    const poolLabel = pool.join(', ');
    const result = await showWizardDialog({
      title: `Character Creation: Determine Attributes (${method === 'random' ? 'Random Roll' : 'Standard Array'})`,
      position: { width: 640 },
      content: `
        <form style="padding: 12px; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <div><strong>Available values:</strong> ${escapeHtml(poolLabel)}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Assign each rolled or standard-array value exactly once.</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;">
            ${rows}
          </div>
        </form>
      `,
      buttons: [
        {
          action: 'apply',
          label: 'Apply Attributes',
          default: true,
          callback: (event, button, dialog) => {
            const selections = ATTRIBUTE_KEYS.map((key) => Number.parseInt(dialog.element.querySelector(`[name="attr-${key}"]`)?.value || '-1', 10));
            return { action: 'apply', selections };
          },
        },
        {
          action: 'skip',
          label: 'Skip Step',
          callback: () => ({ action: 'skip' }),
        },
      ],
      render: (event, dialog) => {
        renderAttributeAssignmentSelectors(dialog.element, pool, selectedPoolIndices);
      },
    });

    if (!result || result.action === 'skip') return true;

    const chosenValues = result.selections.map((index) => pool[index]);
    const isValid = chosenValues.length === pool.length
      && [...chosenValues].sort((left, right) => left - right).join(',') === [...pool].sort((left, right) => left - right).join(',');
    if (!isValid) {
      ui.notifications.warn('Each value in the pool must be used exactly once.');
      continue;
    }

    await applyAttributeAssignments(actor, chosenValues, {
      method,
      rolledValues: method === 'random' ? [...pool] : null,
    });
    return true;
  }
}

async function runFreeformAttributeStep(actor) {
  while (true) {
    const currentValues = getCurrentAttributes(actor);
    const result = await showWizardDialog({
      title: `Character Creation: Determine Attributes (Freeform)`,
      position: { width: 640 },
      content: `
        <form style="padding: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;">
          ${ATTRIBUTE_KEYS.map((key, index) => `
            <div class="form-group" style="margin: 0;">
              <label>${ATTRIBUTE_LABELS[key]}</label>
              <input type="number" name="attr-${key}" value="${currentValues[index]}" min="1" max="8" step="1" />
            </div>
          `).join('')}
        </form>
      `,
      buttons: [
        {
          action: 'apply',
          label: 'Apply Attributes',
          default: true,
          callback: (event, button, dialog) => ({
            action: 'apply',
            values: ATTRIBUTE_KEYS.map((key) => Number.parseInt(dialog.element.querySelector(`[name="attr-${key}"]`)?.value || '0', 10)),
          }),
        },
        {
          action: 'skip',
          label: 'Skip Step',
          callback: () => ({ action: 'skip' }),
        },
      ],
    });

    if (!result || result.action === 'skip') return true;
    const invalid = result.values.some((value) => !Number.isInteger(value) || value < 1 || value > 8);
    if (invalid) {
      ui.notifications.warn('Freeform attributes must be whole numbers between 1 and 8.');
      continue;
    }

    await applyAttributeAssignments(actor, result.values, { method: 'freeform' });
    return true;
  }
}

async function runAttributeStep(actor) {
  const state = getWorkflowState(actor);
  if (state.attributes?.completedAt) {
    await showWizardDialog({
      title: `Character Creation: Step 1 of 9`,
      position: { width: 560 },
      content: `
        <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div><strong>Determine Attributes</strong></div>
          <div>This step has already been completed for this creation workflow.</div>
          <div>Method: <strong>${escapeHtml(state.attributes.method || 'unknown')}</strong></div>
          <div style="font-size: 12px; color: #666;">${escapeHtml(formatAttributeSummary(state.attributes.values || getCurrentAttributes(actor)))}</div>
          <div style="font-size: 12px; color: #666;">To avoid repeated rerolls, guided attribute assignment is locked after completion. You can continue to the next step.</div>
        </div>
      `,
      buttons: [
        {
          action: 'continue',
          label: 'Continue',
          default: true,
          callback: () => 'continue',
        },
      ],
    });
    return true;
  }

  const result = await showWizardDialog({
    title: `Character Creation: Step 1 of 9`,
    position: { width: 520 },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Determine Attributes</strong></div>
        <label><input type="radio" name="attributeMethod" value="standard" checked /> Standard Array (5, 4, 3, 3, 3, 2, 2, 2)</label>
        <label><input type="radio" name="attributeMethod" value="random" /> Random Roll (8d8, then assign)</label>
        <label><input type="radio" name="attributeMethod" value="freeform" /> Freeform Assignment</label>
      </form>
    `,
    buttons: [
      {
        action: 'continue',
        label: 'Continue',
        default: true,
        callback: (event, button, dialog) => String(dialog.element.querySelector('[name="attributeMethod"]:checked')?.value || 'standard'),
      },
      {
        action: 'skip',
        label: 'Skip Step',
        callback: () => 'skip',
      },
    ],
  });

  if (!result || result === 'skip') return true;
  if (result === 'standard') return runArrayAssignmentStep(actor, 'standard', [...STANDARD_ARRAY]);
  if (result === 'random') {
    const rolled = Array.from({ length: 8 }, () => rollD8());
    return runArrayAssignmentStep(actor, 'random', rolled);
  }
  return runFreeformAttributeStep(actor);
}

async function chooseCompendiumDocument(packName, title, options = {}) {
  const pack = game.packs.get(packName);
  if (!pack) {
    ui.notifications.warn(`Compendium pack "${packName}" not found.`);
    return null;
  }

  const documents = (await pack.getDocuments())
    .filter((entry) => !options.filter || options.filter(entry))
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));

  if (!documents.length) {
    ui.notifications.warn(`No options are available in ${packName}.`);
    return null;
  }

  const result = await showWizardDialog({
    title,
    position: { width: 520 },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        ${options.description ? `<div>${options.description}</div>` : ''}
        <div class="form-group">
          <label>Select an option</label>
          <select name="compendiumChoice" style="width: 100%; padding: 6px;">
            ${documents.map((doc, index) => `<option value="${index}">${escapeHtml(doc.name)}</option>`).join('')}
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'choose',
        label: options.confirmLabel || 'Choose',
        default: true,
        callback: (event, button, dialog) => documents[Number.parseInt(dialog.element.querySelector('[name="compendiumChoice"]')?.value || '0', 10)] || null,
      },
      {
        action: 'skip',
        label: options.skipLabel || 'Skip Step',
        callback: () => null,
      },
    ],
  });

  return result || null;
}

async function replaceSingleActorItem(actor, type, document) {
  const existing = actor.items.find((item) => item.type === type);
  if (existing && existing.name === document.name) return existing;

  if (existing) {
    await existing.delete();
    if (type === 'ancestry') {
      await actor.update({
        'system.biography.ancestry': '',
        'system.biography.origin': '',
        'system.languages.native': '',
        'system.languages.selected': [],
      });
    }
  }

  const [created] = await actor.createEmbeddedDocuments('Item', [document.toObject()]);
  if (created && type === 'ancestry') {
    await actor.update({ 'system.biography.ancestry': created.name });
  }

  return created || null;
}

async function runAncestryStep(actor) {
  const current = actor.items.find((item) => item.type === 'ancestry');
  const choice = await chooseCompendiumDocument('legends.ancestries', `Character Creation: Step 2 of 9`, {
    description: `<div><strong>Choose Ancestry</strong>${current ? `<br />Current ancestry: <strong>${escapeHtml(current.name)}</strong>` : ''}</div>`,
    confirmLabel: current ? 'Replace Ancestry' : 'Choose Ancestry',
  });

  if (!choice) return true;
  const created = await replaceSingleActorItem(actor, 'ancestry', choice);
  if (created) {
    await updateWorkflowState(actor, { ancestry: { name: created.name, completedAt: new Date().toISOString() } });
    ui.notifications.info(`${actor.name} ancestry set to ${created.name}.`);
  }
  return true;
}

async function runOriginStep(actor) {
  const primaryAncestry = actor.items.find((item) => item.type === 'ancestry');
  if (!primaryAncestry) {
    ui.notifications.warn('Choose an ancestry before selecting an origin.');
    return true;
  }

  const options = getOriginOptionsForAncestry(primaryAncestry.name);
  if (!options.length) {
    ui.notifications.info(`No origin selection is configured for ${primaryAncestry.name}.`);
    return true;
  }

  const currentOrigin = normalizeOriginKey(actor.system?.biography?.origin);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.key === currentOrigin));
  const result = await showWizardDialog({
    title: `Character Creation: Step 3 of 9`,
    position: { width: 600 },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Choose Nationality and Native Language</strong></div>
        <div>Selected ancestry: <strong>${escapeHtml(primaryAncestry.name)}</strong></div>
        <div style="font-size: 12px; color: #666;">Nationality determines the native language assigned to the character.</div>
        <div class="form-group">
          <label>Nationality</label>
          <select name="originChoice" style="width: 100%; padding: 6px;">
            ${options.map((option, index) => `<option value="${index}" ${index === selectedIndex ? 'selected' : ''}>${escapeHtml(option.label)}${option.requiresGMApproval ? ' (GM approval)' : ''}</option>`).join('')}
          </select>
        </div>
        <div style="font-size: 12px; color: #666;">${escapeHtml(options[selectedIndex]?.summary || options[0]?.summary || '')}</div>
      </form>
    `,
    buttons: [
      {
        action: 'apply',
        label: 'Apply Nationality',
        default: true,
        callback: (event, button, dialog) => options[Number.parseInt(dialog.element.querySelector('[name="originChoice"]')?.value || String(selectedIndex), 10)] || null,
      },
      {
        action: 'skip',
        label: 'Skip Step',
        callback: () => 'skip',
      },
    ],
  });

  if (!result || result === 'skip') return true;
  if (result.requiresGMApproval && !game.user?.isGM) {
    ui.notifications.warn(`${result.label} requires GM approval.`);
    return false;
  }

  const nativeLanguage = getNativeLanguageKeyForOrigin(result.key);
  const selectedLanguages = Array.isArray(actor.system?.languages?.selected)
    ? actor.system.languages.selected.filter((entry) => entry !== nativeLanguage)
    : [];

  await actor.update({
    'system.biography.origin': result.key,
    'system.languages.native': nativeLanguage,
    'system.languages.selected': selectedLanguages,
  });
  await updateWorkflowState(actor, {
    origin: {
      key: result.key,
      label: result.label,
      nativeLanguage,
      completedAt: new Date().toISOString(),
    },
  });
  ui.notifications.info(`${actor.name} origin set to ${result.label}. Native language assigned.`);
  return true;
}

function rollRandomBackgroundResult() {
  const tens = rollD8();
  const ones = rollD8();
  const roll = Number(`${tens}${ones}`);
  return {
    roll,
    name: BACKGROUND_RANDOM_TABLE[roll] || null,
  };
}

async function runBackgroundStep(actor) {
  const current = actor.items.find((item) => item.type === 'background');
  const method = await showWizardDialog({
    title: `Character Creation: Step 4 of 9`,
    position: { width: 520 },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Choose Background</strong>${current ? `<br />Current background: <strong>${escapeHtml(current.name)}</strong>` : ''}</div>
        <label><input type="radio" name="backgroundMethod" value="choose" checked /> Choose from compendium</label>
        <label><input type="radio" name="backgroundMethod" value="random" /> Roll on the random background table</label>
      </form>
    `,
    buttons: [
      {
        action: 'continue',
        label: 'Continue',
        default: true,
        callback: (event, button, dialog) => String(dialog.element.querySelector('[name="backgroundMethod"]:checked')?.value || 'choose'),
      },
      {
        action: 'skip',
        label: 'Skip Step',
        callback: () => 'skip',
      },
    ],
  });

  if (!method || method === 'skip') return true;

  let choice = null;
  let rolledBackground = null;
  if (method === 'random') {
    const result = rollRandomBackgroundResult();
    rolledBackground = result;
    if (!result.name || result.name.startsWith('Reroll')) {
      ui.notifications.info(`Background roll ${result.roll} grants player choice.`);
    } else {
      choice = await chooseCompendiumDocument('legends.backgrounds', `Character Creation: Random Background ${result.roll}`, {
        description: `<div>You rolled <strong>${result.roll}</strong>: <strong>${escapeHtml(result.name)}</strong>.</div>`,
        filter: (entry) => String(entry.name || '').trim().toLowerCase() === result.name.toLowerCase(),
        confirmLabel: 'Use Rolled Background',
        skipLabel: 'Choose Manually Instead',
      });
    }
  }

  if (!choice) {
    choice = await chooseCompendiumDocument('legends.backgrounds', `Character Creation: Step 4 of 9`, {
      description: '<div>Select a background. Background grants will be applied automatically.</div>',
      confirmLabel: current ? 'Replace Background' : 'Choose Background',
    });
  }

  if (!choice) return true;
  const created = await replaceSingleActorItem(actor, 'background', choice);
  if (created) {
    await updateWorkflowState(actor, {
      background: {
        name: created.name,
        rolled: rolledBackground,
        completedAt: new Date().toISOString(),
      },
    });
    ui.notifications.info(`${actor.name} background set to ${created.name}.`);
  }
  return true;
}

async function addTraitOrFlaw(actor, type) {
  const packName = type === 'trait' ? 'legends.traits' : 'legends.flaws';
  const pack = game.packs.get(packName);
  if (!pack) {
    ui.notifications.warn(`Compendium pack "${packName}" not found.`);
    return false;
  }

  const summary = getTraitFlawPointSummary(actor);
  const ownedNames = new Set(
    actor.items
      .filter((item) => item.type === type)
      .map((item) => String(item.name || '').trim().toLowerCase())
  );

  const documents = await pack.getDocuments();
  const options = documents
    .filter((entry) => !ownedNames.has(String(entry.name || '').trim().toLowerCase()))
    .map((entry) => {
      const pointDelta = type === 'trait'
        ? Math.abs(Number(entry.system?.pointCost || 0))
        : Number(entry.system?.pointValue || 0);
      const disabled = type === 'trait' && pointDelta > summary.remaining;
      return {
        document: entry,
        disabled,
        label: type === 'trait' ? `${entry.name} (${pointDelta} points)` : `${entry.name} (+${pointDelta} points)`,
        reason: disabled ? `Requires ${pointDelta} points, only ${summary.remaining} available.` : '',
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  if (!options.length) {
    ui.notifications.warn(`No ${type}s are available to add.`);
    return false;
  }

  const selected = await showWizardDialog({
    title: `Character Creation: Add ${type === 'trait' ? 'Trait' : 'Flaw'}`,
    position: { width: 520 },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Creation Point Budget</strong>: ${summary.spent} spent / ${summary.earned} earned (${summary.remaining} remaining)</div>
        <div class="form-group">
          <label>Select a ${type}</label>
          <select name="creationChoice" style="width: 100%; padding: 6px;">
            ${options.map((option, index) => `<option value="${index}" ${option.disabled ? 'disabled' : ''}>${escapeHtml(option.label)}${option.reason ? ` - ${escapeHtml(option.reason)}` : ''}</option>`).join('')}
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'add',
        label: `Add ${type === 'trait' ? 'Trait' : 'Flaw'}`,
        default: true,
        callback: (event, button, dialog) => options[Number.parseInt(dialog.element.querySelector('[name="creationChoice"]')?.value || '-1', 10)] || null,
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
  });

  if (!selected) return false;
  if (selected.disabled) {
    ui.notifications.warn(selected.reason || `That ${type} is not currently available.`);
    return false;
  }

  const [created] = await actor.createEmbeddedDocuments('Item', [selected.document.toObject()]);
  if (!created) {
    ui.notifications.error(`Failed to add ${selected.document.name}.`);
    return false;
  }

  ui.notifications.info(`${created.name} added to ${actor.name}.`);
  return true;
}

async function removeTraitOrFlaw(actor, type) {
  const items = actor.items.filter((item) => item.type === type).sort((left, right) => left.name.localeCompare(right.name));
  if (!items.length) {
    ui.notifications.warn(`No ${type}s are available to remove.`);
    return false;
  }

  const selected = await showWizardDialog({
    title: `Character Creation: Remove ${type === 'trait' ? 'Trait' : 'Flaw'}`,
    position: { width: 460 },
    content: `
      <form style="padding: 12px;">
        <div class="form-group">
          <label>Select a ${type} to remove</label>
          <select name="removalChoice" style="width: 100%; padding: 6px;">
            ${items.map((item, index) => `<option value="${index}">${escapeHtml(item.name)}</option>`).join('')}
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'remove',
        label: `Remove ${type === 'trait' ? 'Trait' : 'Flaw'}`,
        default: true,
        callback: (event, button, dialog) => items[Number.parseInt(dialog.element.querySelector('[name="removalChoice"]')?.value || '0', 10)] || null,
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
  });

  if (!selected) return false;
  await selected.delete();
  ui.notifications.info(`${selected.name} removed from ${actor.name}.`);
  return true;
}

async function runTraitsAndFlawsStep(actor) {
  while (true) {
    const summary = getTraitFlawPointSummary(actor);
    const traits = actor.items.filter((item) => item.type === 'trait');
    const flaws = actor.items.filter((item) => item.type === 'flaw');
    const canSetupMagic = Boolean(actor.system?.magicalTrait?.type) && !actor.system?.magicalTrait?.isSetup;

    const action = await showWizardDialog({
      title: `Character Creation: Step 5 of 9`,
      position: { width: 620 },
      content: `
        <div style="padding: 12px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px;">
          <div>
            <div style="margin-bottom: 8px;"><strong>Creation Point Budget</strong>: ${summary.spent} spent / ${summary.earned} earned (${summary.remaining} remaining)</div>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Traits cost flaw points. Flaws earn points. Primary magical traits should be configured before leaving this step.</p>
          </div>
          <div>
            <strong>Traits</strong>
            ${formatItemList(traits, 'No traits selected.')}
            <div style="height: 10px;"></div>
            <strong>Flaws</strong>
            ${formatItemList(flaws, 'No flaws selected.')}
          </div>
        </div>
      `,
      buttons: [
        { action: 'addFlaw', label: 'Add Flaw', callback: () => 'addFlaw' },
        { action: 'addTrait', label: 'Add Trait', callback: () => 'addTrait' },
        { action: 'removeFlaw', label: 'Remove Flaw', callback: () => 'removeFlaw' },
        { action: 'removeTrait', label: 'Remove Trait', callback: () => 'removeTrait' },
        ...(canSetupMagic ? [{ action: 'setupMagic', label: 'Setup Magical Trait', callback: () => 'setupMagic' }] : []),
        { action: 'continue', label: 'Continue', default: true, callback: () => 'continue' },
      ],
    });

    if (!action) return false;
    if (action === 'continue') {
      if (summary.isOverspent) {
        ui.notifications.warn(`${actor.name} has spent more trait points than they have earned from flaws.`);
        continue;
      }

      if (canSetupMagic) {
        const setupNow = await foundry.applications.api.DialogV2.confirm({
          window: { title: `Character Creation: Magical Trait Setup` },
          content: `<p><strong>${actor.name}</strong> has a primary magical trait that has not been configured yet.</p><p>Run the magical trait setup now before continuing?</p>`,
        });
        if (setupNow) {
          await setupMagicalTraits(actor);
          continue;
        }
      }

      await updateWorkflowState(actor, {
        traitsAndFlaws: {
          completedAt: new Date().toISOString(),
          summary,
        },
      });
      return true;
    }

    if (action === 'addFlaw') await addTraitOrFlaw(actor, 'flaw');
    if (action === 'addTrait') await addTraitOrFlaw(actor, 'trait');
    if (action === 'removeFlaw') await removeTraitOrFlaw(actor, 'flaw');
    if (action === 'removeTrait') await removeTraitOrFlaw(actor, 'trait');
    if (action === 'setupMagic') await setupMagicalTraits(actor);
  }
}

async function chooseStartingFeat(actor) {
  const pack = game.packs.get('legends.feats');
  if (!pack) {
    ui.notifications.warn('Compendium pack "legends.feats" not found.');
    return false;
  }

  const ownedNames = new Set(
    actor.items
      .filter((item) => item.type === 'feat')
      .map((item) => String(item.name || '').trim().toLowerCase())
  );

  const options = (await pack.getDocuments())
    .filter((feat) => !ownedNames.has(String(feat.name || '').trim().toLowerCase()))
    .map((feat) => ({
      feat,
      reasons: validatePrereqs(actor, feat),
    }))
    .map((entry) => ({
      ...entry,
      disabled: entry.reasons.length > 0,
    }))
    .sort((left, right) => left.feat.name.localeCompare(right.feat.name));

  if (!options.length) {
    ui.notifications.warn(`No feats are currently available for ${actor.name}.`);
    return false;
  }

  const availableCount = options.filter((entry) => !entry.disabled).length;
  const initialIndex = Math.max(0, options.findIndex((entry) => !entry.disabled));

  const selected = await showWizardDialog({
    title: `Character Creation: Choose Starting Feat`,
    position: { width: 980 },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Choose a free starting feat.</strong> These two feats do not cost XP.</div>
        <div style="font-size: 12px; color: #666;">Showing all feats. Unavailable options remain visible so players can review prerequisites and effects before they qualify.</div>
        <div style="font-size: 12px; color: #666;">${availableCount} of ${options.length} feats currently qualify for this character.</div>
        <input type="hidden" name="featChoice" value="${initialIndex >= 0 ? initialIndex : 0}" />
        <div style="display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: 14px; align-items: start;">
          <div>
            <label style="display: block; margin-bottom: 6px;">Feats</label>
            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 460px; overflow-y: auto; padding-right: 4px;">
              ${options.map((entry, index) => `
                <div
                  data-starting-feat-option="${index}"
                  tabindex="0"
                  style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 8px 10px; cursor: pointer; opacity: ${entry.disabled ? '0.65' : '1'};">
                  <div style="font-weight: 600;">${escapeHtml(entry.feat.name)}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 2px;">${escapeHtml(entry.feat.system?.classification === 'legendary' ? 'Legendary' : 'Standard')}${entry.disabled ? ' • Not qualified' : ' • Available now'}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div data-starting-feat-preview style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 10px; padding: 12px; max-height: 460px; overflow-y: auto;"></div>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'add',
        label: 'Add Feat',
        default: true,
        callback: (event, button, dialog) => options[Number.parseInt(dialog.element.querySelector('[name="featChoice"]')?.value || '0', 10)] || null,
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
    render: (event, dialog) => {
      renderStartingFeatPicker(dialog.element, options, initialIndex >= 0 ? initialIndex : 0);
    },
  });

  if (!selected) return false;
  if (selected.disabled) {
    ui.notifications.warn(selected.reasons[0] || `${selected.feat.name} is not currently available.`);
    return false;
  }
  const featData = selected.feat.toObject();
  featData.flags = featData.flags || {};
  featData.flags.legends = featData.flags.legends || {};
  featData.flags.legends.creation = featData.flags.legends.creation || {};
  featData.flags.legends.creation.freeFeat = true;

  const [created] = await actor.createEmbeddedDocuments('Item', [featData]);
  if (!created) {
    ui.notifications.error(`Failed to add ${selected.feat.name}.`);
    return false;
  }

  ui.notifications.info(`${created.name} added as a starting feat.`);
  return true;
}

async function removeStartingFeat(actor) {
  const feats = getCreationFeatItems(actor).sort((left, right) => left.name.localeCompare(right.name));
  if (!feats.length) {
    ui.notifications.warn('No starting feats are available to remove.');
    return false;
  }

  const selected = await showWizardDialog({
    title: `Character Creation: Remove Starting Feat`,
    position: { width: 460 },
    content: `
      <form style="padding: 12px;">
        <div class="form-group">
          <label>Select a starting feat to remove</label>
          <select name="startingFeatChoice" style="width: 100%; padding: 6px;">
            ${feats.map((feat, index) => `<option value="${index}">${escapeHtml(feat.name)}</option>`).join('')}
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'remove',
        label: 'Remove Feat',
        default: true,
        callback: (event, button, dialog) => feats[Number.parseInt(dialog.element.querySelector('[name="startingFeatChoice"]')?.value || '0', 10)] || null,
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
  });

  if (!selected) return false;
  await selected.delete();
  ui.notifications.info(`${selected.name} removed.`);
  return true;
}

async function runStartingFeatsStep(actor) {
  while (true) {
    const startingFeats = getCreationFeatItems(actor);
    const action = await showWizardDialog({
      title: `Character Creation: Step 6 of 9`,
      position: { width: 580 },
      content: `
        <div style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          <div><strong>Starting Feats</strong>: choose exactly 2 free feats.</div>
          <div>Selected: <strong>${startingFeats.length}</strong> / 2</div>
          ${formatItemList(startingFeats, 'No starting feats selected yet.')}
        </div>
      `,
      buttons: [
        { action: 'add', label: 'Add Feat', callback: () => 'add' },
        { action: 'remove', label: 'Remove Feat', callback: () => 'remove' },
        { action: 'continue', label: 'Continue', default: true, callback: () => 'continue' },
      ],
    });

    if (!action) return false;
    if (action === 'continue') {
      if (startingFeats.length !== 2) {
        ui.notifications.warn('Choose exactly 2 starting feats before continuing.');
        continue;
      }

      await updateWorkflowState(actor, {
        startingFeats: {
          completedAt: new Date().toISOString(),
          featIds: startingFeats.map((item) => item.id),
        },
      });
      return true;
    }

    if (action === 'add') {
      if (startingFeats.length >= 2) {
        ui.notifications.warn('This actor already has 2 starting feats selected.');
        continue;
      }
      await chooseStartingFeat(actor);
    }

    if (action === 'remove') await removeStartingFeat(actor);
  }
}

async function runSpendXpStep(actor) {
  while (true) {
    const state = getActorProgressionState(actor);
    const purchaseSummary = getCreationXpPurchaseSummary(state);
    const action = await showWizardDialog({
      title: `Character Creation: Step 7 of 9`,
      position: { width: 620 },
      content: `
        <div style="padding: 12px; display: grid; grid-template-columns: minmax(0, 220px) minmax(0, 1fr); gap: 16px; align-items: start;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div><strong>Spend Starting XP</strong></div>
            <div>Total XP: <strong>${state.totalXp}</strong></div>
            <div>Unspent XP: <strong>${state.unspent}</strong></div>
            <div>Spent Here: <strong>${purchaseSummary.totalSpent}</strong></div>
            <div style="font-size: 12px; color: #666;">Use the purchase flow as many times as needed, then continue when you are satisfied.</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div><strong>XP Purchases So Far</strong></div>
            ${formatCreationXpPurchaseList(purchaseSummary)}
          </div>
        </div>
      `,
      buttons: [
        { action: 'spend', label: 'Spend XP', callback: () => 'spend' },
        { action: 'continue', label: 'Continue', default: true, callback: () => 'continue' },
      ],
    });

    if (!action) return false;
    if (action === 'continue') {
      await updateWorkflowState(actor, {
        spendXp: {
          completedAt: new Date().toISOString(),
          unspent: state.unspent,
          totalXp: state.totalXp,
        },
      });
      return true;
    }

    if (action === 'spend') await showSpendXPDialog(actor);
  }
}

async function runHitPointStep(actor) {
  const constitution = Number(actor.system?.attributes?.constitution?.value ?? 0);
  const hitPoints = constitution * 8;
  const luck = Number(actor.system?.attributes?.luck?.value ?? 0);

  const result = await showWizardDialog({
    title: `Character Creation: Step 8 of 9`,
    position: { width: 500 },
    content: `
      <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div><strong>Calculate Hit Points</strong></div>
        <div>Constitution: <strong>${constitution}</strong></div>
        <div>HP = Constitution × 8 = <strong>${hitPoints}</strong></div>
        <div style="font-size: 12px; color: #666;">Applying this step will also refill current HP and current Luck to match the actor\'s starting values.</div>
      </div>
    `,
    buttons: [
      {
        action: 'apply',
        label: 'Apply HP',
        default: true,
        callback: () => 'apply',
      },
      {
        action: 'skip',
        label: 'Skip Step',
        callback: () => 'skip',
      },
    ],
  });

  if (!result || result === 'skip') return true;

  await actor.update({
    'system.hp.max': hitPoints,
    'system.hp.value': hitPoints,
    'system.luck.current': luck,
  });

  await updateWorkflowState(actor, {
    hitPoints: {
      completedAt: new Date().toISOString(),
      value: hitPoints,
    },
  });
  return true;
}

async function runStartingEquipmentStep(actor) {
  const currentBackground = actor.items.find((item) => item.type === 'background');
  const equipmentNote = currentBackground
    ? `Background-granted equipment from <strong>${escapeHtml(currentBackground.name)}</strong> has already been added automatically where possible.`
    : 'No background is currently set, so no background-granted equipment could be applied.';

  const result = await showWizardDialog({
    title: `Character Creation: Step 9 of 9`,
    position: { width: 560 },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Select Starting Equipment</strong></div>
        <div>${equipmentNote}</div>
        <div style="font-size: 12px; color: #666;">Starting wealth will be written into the actor's coin fields.</div>
        <label><input type="radio" name="wealthMethod" value="default" checked /> Default starting wealth: 150 gp</label>
        <label><input type="radio" name="wealthMethod" value="roll" /> Roll 3d8 × 10 gp</label>
        <label><input type="radio" name="wealthMethod" value="none" /> Leave starting wealth unset</label>
      </form>
    `,
    buttons: [
      {
        action: 'apply',
        label: 'Finish Step',
        default: true,
        callback: (event, button, dialog) => String(dialog.element.querySelector('[name="wealthMethod"]:checked')?.value || 'default'),
      },
      {
        action: 'skip',
        label: 'Skip Step',
        callback: () => 'skip',
      },
    ],
  });

  if (!result || result === 'skip') return true;

  const wealth = { method: result, gp: null, rolled: null, completedAt: new Date().toISOString() };
  if (result === 'default') {
    wealth.gp = 150;
  } else if (result === 'roll') {
    const rolls = [rollD8(), rollD8(), rollD8()];
    wealth.rolled = rolls;
    wealth.gp = rolls.reduce((total, value) => total + value, 0) * 10;
    ui.notifications.info(`${actor.name} rolled ${rolls.join(' + ')} = ${wealth.gp} gp starting wealth.`);
  }

  if (wealth.gp != null) {
    await actor.update({
      'system.currency.gp': wealth.gp,
      'system.currency.sp': 0,
      'system.currency.cp': 0,
    });
  }

  await updateWorkflowState(actor, {
    equipment: wealth,
    completedAt: new Date().toISOString(),
    lastRunAt: new Date().toISOString(),
  });
  return true;
}

async function ensureFinalMagicalTraitSetup(actor) {
  const magicalTraitType = String(actor.system?.magicalTrait?.type || '').trim();
  if (!magicalTraitType) {
    return { attempted: false, completed: false, pending: false, traitType: '' };
  }

  if (actor.system?.magicalTrait?.isSetup) {
    return { attempted: false, completed: true, pending: false, traitType: magicalTraitType };
  }

  ui.notifications.info(`${actor.name} has a magical trait selected. Launching magical tradition setup before finishing character creation.`);
  const completed = await setupMagicalTraits(actor);
  return {
    attempted: true,
    completed: Boolean(completed),
    pending: !completed,
    traitType: magicalTraitType,
  };
}

async function finalizeCharacterCreation(actor) {
  await updateWorkflowState(actor, {
    currentStep: null,
    lastRunAt: new Date().toISOString(),
  });

  const magicalSetup = await ensureFinalMagicalTraitSetup(actor);
  await showCompletionDialog(actor, magicalSetup);
  return true;
}

async function showCompletionDialog(actor, magicalSetup = null) {
  const wealth = actor.system?.currency?.gp;
  const setupState = magicalSetup || {
    attempted: false,
    completed: Boolean(actor.system?.magicalTrait?.isSetup),
    pending: Boolean(actor.system?.magicalTrait?.type) && !actor.system?.magicalTrait?.isSetup,
    traitType: String(actor.system?.magicalTrait?.type || '').trim(),
  };

  const magicalSummary = !setupState.traitType
    ? ''
    : setupState.completed
      ? '<div>Magical tradition setup is complete.</div>'
      : '<div style="color: #a36a00;">Magical tradition setup is still pending. You can run it from the character sheet when you are ready.</div>';

  await showWizardDialog({
    title: `Character Creation Complete: ${actor.name}`,
    position: { width: 520 },
    content: `
      <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div><strong>The guided character creation workflow is complete.</strong></div>
        <div>You can remain in creation mode to make further adjustments, or switch back to advancement when you are done.</div>
        ${wealth != null ? `<div>Starting coins applied: <strong>${wealth} gp</strong></div>` : ''}
        ${magicalSummary}
      </div>
    `,
    buttons: [
      {
        action: 'done',
        label: 'Close',
        default: true,
      },
    ],
  });
}

export async function launchCharacterCreationWorkflow(actor) {
  if (!actor || actor.type !== 'character') return false;

  const introAction = await showIntroDialog(actor);
  if (!introAction || introAction === 'skip') return false;

  const steps = [
    { key: 'attributes', run: runAttributeStep },
    { key: 'ancestry', run: runAncestryStep },
    { key: 'origin', run: runOriginStep },
    { key: 'background', run: runBackgroundStep },
    { key: 'traitsAndFlaws', run: runTraitsAndFlawsStep },
    { key: 'startingFeats', run: runStartingFeatsStep },
    { key: 'spendXp', run: runSpendXpStep },
    { key: 'hitPoints', run: runHitPointStep },
    { key: 'equipment', run: runStartingEquipmentStep },
  ];

  const currentState = getWorkflowState(actor);
  const resumeStep = getResumeWorkflowStep(steps, currentState);
  const startIndex = resumeStep ? steps.findIndex((step) => step.key === resumeStep.key) : -1;

  if (startIndex < 0) {
    return finalizeCharacterCreation(actor);
  }

  for (let index = startIndex; index < steps.length; index += 1) {
    const step = steps[index];
    const nextStep = steps[index + 1] || null;
    await updateWorkflowState(actor, {
      currentStep: step.key,
      lastRunAt: new Date().toISOString(),
    });

    const shouldContinue = await step.run(actor);
    if (!shouldContinue) {
      await updateWorkflowState(actor, {
        currentStep: step.key,
        lastRunAt: new Date().toISOString(),
      });
      return false;
    }

    await updateWorkflowState(actor, {
      currentStep: nextStep?.key || null,
      lastRunAt: new Date().toISOString(),
    });
  }

  return finalizeCharacterCreation(actor);
}
