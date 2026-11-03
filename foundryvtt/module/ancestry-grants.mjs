import { SKILL_LABELS, SKILL_ATTRIBUTE_KEYS, normalizeSkillKey } from './skill-utils.mjs';
import { normalizeOriginKey } from './languages.mjs';

const ANCESTRY_FLAG_SCOPE = 'legends';
const ANCESTRY_FLAG_KEY = 'ancestryAbilityGrants';

function normalizeGrant(grant, fallbackId = '') {
  if (!grant || typeof grant !== 'object') return null;

  const name = String(grant.name || '').trim();
  const description = String(grant.description || '').trim();
  const id = String(grant.id || fallbackId || name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!name && !description) return null;

  const normalized = {
    id: id || fallbackId || 'grant',
    name: name || 'Ancestry Ability',
    description,
  };

  const skillGrant = grant.skillGrant;
  if (skillGrant && typeof skillGrant === 'object') {
    const mode = String(skillGrant.mode || '').trim();
    const targetRank = Math.max(0, Math.floor(Number(skillGrant.targetRank || 0) || 0));
    const count = Math.max(1, Math.floor(Number(skillGrant.count || 1) || 1));
    const excludeGrantIds = Array.isArray(skillGrant.excludeGrantIds)
      ? skillGrant.excludeGrantIds.map(String).filter(Boolean)
      : [];
    if (targetRank > 0 || mode) {
      normalized.skillGrant = {
        mode,
        targetRank,
        count,
        options: Array.isArray(skillGrant.options)
          ? skillGrant.options.map((entry) => String(entry || '').trim()).filter(Boolean)
          : [],
        skill: String(skillGrant.skill || '').trim(),
        excludeGrantIds,
      };
    }
  }

  return normalized;
}

function getAncestryGrantState(actor) {
  return foundry.utils.deepClone(actor.getFlag(ANCESTRY_FLAG_SCOPE, ANCESTRY_FLAG_KEY) || {});
}

async function setAncestryGrantState(actor, state) {
  await actor.setFlag(ANCESTRY_FLAG_SCOPE, ANCESTRY_FLAG_KEY, state);
}

function resolveSkillKey(value) {
  const normalized = normalizeSkillKey(value);
  return normalized || '';
}

async function applySkillBonuses(actor, bonuses) {
  const updates = {};

  for (const [skillKey, amount] of Object.entries(bonuses || {})) {
    const numericAmount = Number(amount || 0);
    if (!numericAmount) continue;

    const currentValue = actor.system?.skills?.[skillKey];
    const current = typeof currentValue === 'object'
      ? Number(currentValue?.value ?? 0)
      : Number(currentValue ?? 0);
    updates[`system.skills.${skillKey}`] = Math.max(2, current + numericAmount);
  }

  if (Object.keys(updates).length) {
    await actor.update(updates);
  }
}

async function removeGrantedItemsById(actor, itemIds = []) {
  const existingIds = itemIds.filter((id) => actor.items.get(id));
  if (existingIds.length) {
    await actor.deleteEmbeddedDocuments('Item', existingIds);
  }
}

function formatGrantDescription(grant, ancestryName) {
  const description = grant.description
    ? `<p>${Handlebars.escapeExpression(grant.description)}</p>`
    : '<p>This ability is granted by ancestry.</p>';

  return `${description}<p><em>Granted by ${Handlebars.escapeExpression(ancestryName)}.</em></p>`;
}

async function createGrantedAbility(actor, ancestry, grant, source = 'ancestry', sourceKey = '') {
  const itemData = {
    name: grant.name,
    type: 'ability',
    img: 'icons/svg/aura.svg',
    system: {
      description: { value: formatGrantDescription(grant, ancestry.name) },
      abilityType: 'passive',
      effect: grant.description || '',
      notes: `Granted by ${ancestry.name}`,
    },
    effects: [],
    flags: {
      legends: {
        grantedBy: {
          source,
          ancestryId: ancestry.id,
          ancestryName: ancestry.name,
          sourceKey,
          grantId: grant.id,
          grantName: grant.name,
        },
      },
    },
  };

  const [created] = await actor.createEmbeddedDocuments('Item', [itemData]);
  return created?.id || '';
}

function buildSkillOptions(grant, selectedSkillsMap = {}) {
  const skillGrant = grant.skillGrant || {};

  const excluded = new Set();
  for (const excludeId of (skillGrant.excludeGrantIds || [])) {
    const prev = selectedSkillsMap[excludeId];
    if (Array.isArray(prev)) prev.forEach(k => excluded.add(k));
    else if (prev) excluded.add(String(prev));
  }

  if (skillGrant.mode === 'fixed') {
    const key = resolveSkillKey(skillGrant.skill);
    return key ? [key] : [];
  }

  if (skillGrant.mode === 'allOf') {
    return skillGrant.options.map(e => resolveSkillKey(e)).filter(Boolean)
      .filter((e, i, a) => a.indexOf(e) === i);
  }

  if (skillGrant.mode === 'oneOf') {
    return skillGrant.options.map(e => resolveSkillKey(e)).filter(Boolean)
      .filter(k => !excluded.has(k))
      .filter((e, i, a) => a.indexOf(e) === i);
  }

  if (skillGrant.mode === 'any') {
    return Object.keys(SKILL_LABELS).filter(k => !excluded.has(k));
  }

  return [];
}

function buildSkillRowPreview(actor, skillKey, targetRank) {
  const label = SKILL_LABELS[skillKey] || skillKey;
  const attrKey = SKILL_ATTRIBUTE_KEYS[skillKey] || '';
  const attrLabel = attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
  const current = Number(actor.system?.skills?.[skillKey] ?? 0);
  const finalRank = targetRank > 0 ? Math.max(current, targetRank) : current;
  return `
    <div style="display: flex; flex-direction: column; gap: 8px; padding: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">
        <h4 style="margin: 0;">${Handlebars.escapeExpression(label)}</h4>
        <span style="font-size: 12px; color: #666;">${Handlebars.escapeExpression(attrLabel)}</span>
      </div>
      ${targetRank > 0 ? `<div style="font-size: 12px;">Rank: <strong>${current}</strong> → <strong>${finalRank}</strong></div>` : ''}
    </div>
  `;
}

async function promptForSkill(actor, ancestry, grant, options, previousKey = '') {
  if (!options.length) return '';
  if (options.length === 1) return options[0];

  const targetRank = grant.skillGrant?.targetRank || 0;
  const defaultIndex = Math.max(0, options.indexOf(previousKey));

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `${ancestry.name}: ${grant.name}` },
    position: { width: 620 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>${Handlebars.escapeExpression(grant.name)}</strong></div>
        ${grant.description ? `<div style="font-size: 12px; color: #666;">${Handlebars.escapeExpression(grant.description)}</div>` : ''}
        <input type="hidden" name="skillChoice" value="${defaultIndex}" />
        <div style="display: grid; grid-template-columns: minmax(200px, 260px) minmax(0, 1fr); gap: 14px; align-items: start;">
          <div>
            <label style="display: block; margin-bottom: 6px;">Choose a skill</label>
            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; padding-right: 4px;">
              ${options.map((skillKey, index) => `
                <div data-skill-option="${index}" tabindex="0"
                  style="border: 1px solid rgba(209,139,71,0.25); border-radius: 8px; padding: 8px 10px; cursor: pointer;">
                  <div style="font-weight: 600;">${Handlebars.escapeExpression(SKILL_LABELS[skillKey] || skillKey)}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 2px;">${Handlebars.escapeExpression((SKILL_ATTRIBUTE_KEYS[skillKey] || '').charAt(0).toUpperCase() + (SKILL_ATTRIBUTE_KEYS[skillKey] || '').slice(1))}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div data-skill-preview style="border: 1px solid rgba(209,139,71,0.25); border-radius: 10px; padding: 12px; min-height: 160px; overflow-y: auto;"></div>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'choose',
        label: 'Apply',
        default: true,
        callback: (event, button, dialog) => {
          const idx = Number.parseInt(dialog.element.querySelector('[name="skillChoice"]')?.value || `${defaultIndex}`, 10);
          return options[idx] || '';
        },
      },
      { action: 'cancel', label: 'Cancel' },
    ],
    render: (event, dialog) => {
      const input = dialog.element.querySelector('[name="skillChoice"]');
      const preview = dialog.element.querySelector('[data-skill-preview]');
      const rows = Array.from(dialog.element.querySelectorAll('[data-skill-option]'));

      const syncSelection = (index) => {
        const safeIndex = Math.max(0, Math.min(index, options.length - 1));
        if (input) input.value = String(safeIndex);
        rows.forEach((row, i) => {
          row.style.borderColor = i === safeIndex ? '#d18b47' : 'rgba(209,139,71,0.25)';
          row.style.background = i === safeIndex ? 'rgba(209,139,71,0.10)' : 'rgba(255,255,255,0.03)';
        });
        if (preview) preview.innerHTML = buildSkillRowPreview(actor, options[safeIndex], targetRank);
      };

      rows.forEach((row, i) => {
        row.addEventListener('click', () => syncSelection(i));
        row.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); syncSelection(i); }
        });
      });

      syncSelection(defaultIndex);
    },
  });

  return String(result || '').trim();
}

async function promptForMultipleSkills(actor, ancestry, grant, options, count, previousKeys = []) {
  const targetRank = grant.skillGrant?.targetRank || 0;
  const selected = new Set(previousKeys.filter(k => options.includes(k)).slice(0, count));
  let focusedKey = options[0] || '';

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `${ancestry.name}: ${grant.name}` },
    position: { width: 660 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <strong>${Handlebars.escapeExpression(grant.name)}</strong>
          <span style="font-size: 12px; color: #666;" data-selection-counter>${selected.size} of ${count} selected</span>
        </div>
        ${grant.description ? `<div style="font-size: 12px; color: #666;">${Handlebars.escapeExpression(grant.description)}</div>` : ''}
        <input type="hidden" name="selectedSkills" value="${[...selected].join(',')}" />
        <div style="display: grid; grid-template-columns: minmax(200px, 260px) minmax(0, 1fr); gap: 14px; align-items: start;">
          <div>
            <label style="display: block; margin-bottom: 6px;">Select ${count} skills</label>
            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 360px; overflow-y: auto; padding-right: 4px;">
              ${options.map((skillKey, index) => `
                <div data-skill-option="${index}" data-skill-key="${skillKey}" tabindex="0"
                  style="border: 1px solid rgba(209,139,71,0.25); border-radius: 8px; padding: 8px 10px; cursor: pointer;">
                  <div style="font-weight: 600;">${Handlebars.escapeExpression(SKILL_LABELS[skillKey] || skillKey)}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 2px;">${Handlebars.escapeExpression((SKILL_ATTRIBUTE_KEYS[skillKey] || '').charAt(0).toUpperCase() + (SKILL_ATTRIBUTE_KEYS[skillKey] || '').slice(1))}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div data-skill-preview style="border: 1px solid rgba(209,139,71,0.25); border-radius: 10px; padding: 12px; min-height: 160px; overflow-y: auto;">
            <div style="color: #666; font-style: italic; font-size: 12px;">Select a skill to preview.</div>
          </div>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'choose',
        label: 'Apply',
        default: true,
        callback: (event, button, dialog) => {
          const val = dialog.element.querySelector('[name="selectedSkills"]')?.value || '';
          return val.split(',').map(k => k.trim()).filter(Boolean);
        },
      },
      { action: 'cancel', label: 'Cancel' },
    ],
    render: (event, dialog) => {
      const input = dialog.element.querySelector('[name="selectedSkills"]');
      const preview = dialog.element.querySelector('[data-skill-preview]');
      const counter = dialog.element.querySelector('[data-selection-counter]');
      const rows = Array.from(dialog.element.querySelectorAll('[data-skill-option]'));
      const confirmBtn = dialog.element.querySelector('[data-action="choose"]');

      const syncRows = () => {
        if (counter) counter.textContent = `${selected.size} of ${count} selected`;
        if (input) input.value = [...selected].join(',');
        if (confirmBtn) confirmBtn.disabled = selected.size !== count;
        rows.forEach(row => {
          const key = row.dataset.skillKey;
          const isSel = selected.has(key);
          const isFoc = key === focusedKey;
          row.style.borderColor = isSel ? '#d18b47' : isFoc ? 'rgba(209,139,71,0.5)' : 'rgba(209,139,71,0.25)';
          row.style.background = isSel ? 'rgba(209,139,71,0.15)' : isFoc ? 'rgba(209,139,71,0.05)' : 'rgba(255,255,255,0.03)';
        });
        if (preview && focusedKey) preview.innerHTML = buildSkillRowPreview(actor, focusedKey, targetRank);
      };

      rows.forEach(row => {
        const key = row.dataset.skillKey;
        row.addEventListener('click', () => {
          focusedKey = key;
          if (selected.has(key)) selected.delete(key);
          else if (selected.size < count) selected.add(key);
          syncRows();
        });
        row.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
        });
        row.addEventListener('mouseover', () => { focusedKey = key; syncRows(); });
      });

      syncRows();
    },
  });

  if (!Array.isArray(result)) return [];
  return result.filter(k => options.includes(k));
}

// Returns { results: [{ skillKey, delta }], chosenKeys: string[] }
async function resolveSkillSelection(actor, ancestry, grant, selectedSkillsMap = {}, allowPrompt = true) {
  const skillGrant = grant.skillGrant || null;
  if (!skillGrant) return { results: [], chosenKeys: [] };

  const targetRank = skillGrant.targetRank || 0;
  const count = skillGrant.count || 1;
  const options = buildSkillOptions(grant, selectedSkillsMap);
  if (!options.length) return { results: [], chosenKeys: [] };

  const computeDelta = (skillKey) => {
    const current = Number(actor.system?.skills?.[skillKey] ?? 0);
    return targetRank > 0 ? Math.max(0, targetRank - current) : 0;
  };

  if (skillGrant.mode === 'allOf') {
    const chosenKeys = options;
    return { results: chosenKeys.map(k => ({ skillKey: k, delta: computeDelta(k) })), chosenKeys };
  }

  if (skillGrant.mode === 'fixed') {
    const skillKey = options[0];
    return { results: [{ skillKey, delta: computeDelta(skillKey) }], chosenKeys: [skillKey] };
  }

  const prev = selectedSkillsMap[grant.id];
  const previousKeys = Array.isArray(prev) ? prev : (prev ? [String(prev)] : []);

  if (!allowPrompt) {
    const valid = previousKeys.filter(k => options.includes(k));
    const keys = valid.length >= count ? valid.slice(0, count) : options.slice(0, count);
    return { results: keys.map(k => ({ skillKey: k, delta: computeDelta(k) })), chosenKeys: keys };
  }

  if (count > 1) {
    const chosen = await promptForMultipleSkills(actor, ancestry, grant, options, count, previousKeys);
    if (!chosen.length) return { results: [], chosenKeys: [] };
    return { results: chosen.map(k => ({ skillKey: k, delta: computeDelta(k) })), chosenKeys: chosen };
  }

  const chosen = await promptForSkill(actor, ancestry, grant, options, previousKeys[0] || '');
  if (!chosen) return { results: [], chosenKeys: [] };
  return { results: [{ skillKey: chosen, delta: computeDelta(chosen) }], chosenKeys: [chosen] };
}

function getAncestryAbilityGrants(ancestry) {
  const grants = Array.isArray(ancestry?.system?.abilityGrants)
    ? ancestry.system.abilityGrants
    : [];

  return grants
    .map((grant, index) => normalizeGrant(grant, `ancestry-${index + 1}`))
    .filter(Boolean);
}

function getOriginAbilityGrant(ancestry, originKey) {
  const normalizedOrigin = normalizeOriginKey(originKey);
  if (!normalizedOrigin) return null;

  const grants = ancestry?.system?.originAbilityGrants;
  if (!grants || typeof grants !== 'object' || Array.isArray(grants)) {
    return null;
  }

  return normalizeGrant(grants[normalizedOrigin], `origin-${normalizedOrigin}`);
}

function isHumanAncestry(ancestry) {
  const normalized = String(ancestry?.name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  return normalized === 'human' || normalized === 'humans';
}

async function clearAncestryGrantState(actor, state = null) {
  const current = state || getAncestryGrantState(actor);
  await removeGrantedItemsById(actor, current.abilityItemIds || []);
  await removeGrantedItemsById(actor, current.originAbilityItemId ? [current.originAbilityItemId] : []);

  const skillBonuses = {};
  for (const [skillKey, amount] of Object.entries(current.skillBonuses || {})) {
    skillBonuses[skillKey] = -(Number(amount || 0));
  }
  for (const [skillKey, amount] of Object.entries(current.originSkillBonuses || {})) {
    skillBonuses[skillKey] = (skillBonuses[skillKey] || 0) - Number(amount || 0);
  }
  await applySkillBonuses(actor, skillBonuses);

  await setAncestryGrantState(actor, {});
}

async function applyOriginGrant(actor, ancestry, originKey, state, allowPrompt = true) {
  const normalizedOrigin = normalizeOriginKey(originKey);
  const nextState = foundry.utils.deepClone(state || {});

  await removeGrantedItemsById(actor, nextState.originAbilityItemId ? [nextState.originAbilityItemId] : []);
  const originRemoval = {};
  for (const [skillKey, amount] of Object.entries(nextState.originSkillBonuses || {})) {
    originRemoval[skillKey] = -(Number(amount || 0));
  }
  await applySkillBonuses(actor, originRemoval);

  nextState.originAbilityItemId = '';
  nextState.originSkillBonuses = {};
  nextState.originSelectedSkills = {};
  nextState.originKey = normalizedOrigin;

  if (!isHumanAncestry(ancestry)) {
    return nextState;
  }

  const originGrant = getOriginAbilityGrant(ancestry, normalizedOrigin);
  if (!originGrant) {
    return nextState;
  }

  nextState.originAbilityItemId = await createGrantedAbility(actor, ancestry, originGrant, 'origin', normalizedOrigin);

  const { results, chosenKeys } = await resolveSkillSelection(
    actor, ancestry, originGrant, nextState.originSelectedSkills, allowPrompt,
  );

  for (const { skillKey, delta } of results) {
    if (skillKey && delta > 0) {
      nextState.originSkillBonuses[skillKey] = (nextState.originSkillBonuses[skillKey] || 0) + delta;
      await applySkillBonuses(actor, { [skillKey]: delta });
    }
  }
  if (chosenKeys.length) {
    nextState.originSelectedSkills[originGrant.id] = chosenKeys.length === 1 ? chosenKeys[0] : chosenKeys;
  }

  return nextState;
}

export async function applyAncestryAbilityGrants(actor, ancestry, { allowPrompt = true } = {}) {
  if (!actor || actor.type !== 'character' || !ancestry || ancestry.type !== 'ancestry') return;

  const previousState = getAncestryGrantState(actor);
  await clearAncestryGrantState(actor, previousState);

  const grants = getAncestryAbilityGrants(ancestry);
  const nextState = {
    ancestryId: ancestry.id,
    ancestryName: ancestry.name,
    abilityItemIds: [],
    skillBonuses: {},
    selectedSkills: {},
    originKey: normalizeOriginKey(actor.system?.biography?.origin),
    originAbilityItemId: '',
    originSkillBonuses: {},
    originSelectedSkills: {},
  };

  for (const grant of grants) {
    const createdId = await createGrantedAbility(actor, ancestry, grant, 'ancestry', grant.id);
    if (createdId) nextState.abilityItemIds.push(createdId);

    const { results, chosenKeys } = await resolveSkillSelection(actor, ancestry, grant, nextState.selectedSkills, allowPrompt);
    for (const { skillKey, delta } of results) {
      if (skillKey && delta > 0) {
        nextState.skillBonuses[skillKey] = (nextState.skillBonuses[skillKey] || 0) + delta;
      }
    }
    if (chosenKeys.length) {
      nextState.selectedSkills[grant.id] = chosenKeys.length === 1 ? chosenKeys[0] : chosenKeys;
    }
  }

  if (Object.keys(nextState.skillBonuses).length) {
    await applySkillBonuses(actor, nextState.skillBonuses);
  }

  const withOriginGrant = await applyOriginGrant(actor, ancestry, nextState.originKey, nextState, allowPrompt);
  await setAncestryGrantState(actor, withOriginGrant);
}

export async function revokeAncestryAbilityGrants(actor) {
  if (!actor || actor.type !== 'character') return;
  await clearAncestryGrantState(actor);
}

export async function syncAncestryGrantsForActor(actor, { allowPrompt = false } = {}) {
  if (!actor || actor.type !== 'character') return;
  const ancestry = actor.items.find((item) => item.type === 'ancestry');
  if (!ancestry) {
    await revokeAncestryAbilityGrants(actor);
    return;
  }

  const state = getAncestryGrantState(actor);
  if (state.ancestryId !== ancestry.id) {
    await applyAncestryAbilityGrants(actor, ancestry, { allowPrompt });
    return;
  }

  const updatedState = await applyOriginGrant(actor, ancestry, actor.system?.biography?.origin, state, allowPrompt);
  await setAncestryGrantState(actor, updatedState);
}

export function initializeAncestryGrantHandlers() {
  Hooks.on('createItem', async (item) => {
    if (!item || item.type !== 'ancestry') return;
    const actor = item.parent;
    if (!actor || actor.type !== 'character') return;
    await applyAncestryAbilityGrants(actor, item, { allowPrompt: true });
  });

  Hooks.on('deleteItem', async (item) => {
    if (!item || item.type !== 'ancestry') return;
    const actor = item.actor;
    if (!actor || actor.type !== 'character') return;
    await revokeAncestryAbilityGrants(actor);
  });

  Hooks.on('updateItem', async (item, diff) => {
    if (!item || item.type !== 'ancestry') return;
    const actor = item.actor;
    if (!actor || actor.type !== 'character') return;
    if (!diff.system && !diff.name) return;
    await applyAncestryAbilityGrants(actor, item, { allowPrompt: true });
  });

  Hooks.on('updateActor', async (actor, diff) => {
    if (!actor || actor.type !== 'character') return;
    if (!diff.system?.biography || !Object.hasOwn(diff.system.biography, 'origin')) return;
    await syncAncestryGrantsForActor(actor, { allowPrompt: true });
  });
}
