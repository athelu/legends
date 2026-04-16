import { SKILL_LABELS, normalizeSkillKey } from './skill-utils.mjs';
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
    const ranks = Math.max(0, Math.floor(Number(skillGrant.ranks || 0) || 0));
    if (ranks > 0) {
      const normalizedGrant = {
        mode,
        ranks,
        options: Array.isArray(skillGrant.options)
          ? skillGrant.options.map((entry) => String(entry || '').trim()).filter(Boolean)
          : [],
        skill: String(skillGrant.skill || '').trim(),
      };
      normalized.skillGrant = normalizedGrant;
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
    updates[`system.skills.${skillKey}`] = Math.max(0, current + numericAmount);
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

function buildSkillOptions(grant) {
  const skillGrant = grant.skillGrant || {};

  if (skillGrant.mode === 'fixed') {
    const skillKey = resolveSkillKey(skillGrant.skill);
    return skillKey ? [skillKey] : [];
  }

  if (skillGrant.mode === 'oneOf') {
    return skillGrant.options
      .map((entry) => resolveSkillKey(entry))
      .filter(Boolean)
      .filter((entry, index, collection) => collection.indexOf(entry) === index);
  }

  if (skillGrant.mode === 'any') {
    return Object.keys(SKILL_LABELS);
  }

  return [];
}

async function promptForSkill(actor, ancestry, grant, options, selectedSkill) {
  if (!options.length) return '';
  if (options.length === 1) return options[0];

  const defaultIndex = Math.max(0, options.indexOf(selectedSkill));
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `${ancestry.name}: ${grant.name}` },
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Select a skill for ${Handlebars.escapeExpression(grant.name)}</strong></div>
        <div style="font-size: 12px; color: #666;">${Handlebars.escapeExpression(grant.description || 'Choose the granted skill bonus.')}</div>
        <div class="form-group">
          <label>Skill</label>
          <select name="skillChoice" style="width: 100%; padding: 6px;">
            ${options.map((skillKey, index) => `<option value="${index}" ${index === defaultIndex ? 'selected' : ''}>${Handlebars.escapeExpression(SKILL_LABELS[skillKey] || skillKey)}</option>`).join('')}
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'choose',
        label: 'Apply',
        default: true,
        callback: (event, button, dialog) => options[Number.parseInt(dialog.element.querySelector('[name="skillChoice"]')?.value || `${defaultIndex}`, 10)] || '',
      },
      {
        action: 'cancel',
        label: 'Cancel',
      },
    ],
    rejectClose: false,
  });

  return String(result || '').trim();
}

async function resolveSkillSelection(actor, ancestry, grant, selectedSkills = {}, allowPrompt = true) {
  const skillGrant = grant.skillGrant || null;
  if (!skillGrant || !Number(skillGrant.ranks || 0)) {
    return { skillKey: '', ranks: 0 };
  }

  const options = buildSkillOptions(grant);
  if (!options.length) {
    return { skillKey: '', ranks: 0 };
  }

  const previous = resolveSkillKey(selectedSkills[grant.id]);
  if (previous && options.includes(previous)) {
    return { skillKey: previous, ranks: Math.max(0, Math.floor(Number(skillGrant.ranks || 0) || 0)) };
  }

  if (!allowPrompt) {
    return { skillKey: options[0] || '', ranks: Math.max(0, Math.floor(Number(skillGrant.ranks || 0) || 0)) };
  }

  const selected = await promptForSkill(actor, ancestry, grant, options, previous);
  const skillKey = resolveSkillKey(selected);
  if (!skillKey) {
    return { skillKey: '', ranks: 0 };
  }

  return { skillKey, ranks: Math.max(0, Math.floor(Number(skillGrant.ranks || 0) || 0)) };
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

  const { skillKey, ranks } = await resolveSkillSelection(
    actor,
    ancestry,
    originGrant,
    nextState.originSelectedSkills,
    allowPrompt,
  );

  if (skillKey && ranks > 0) {
    nextState.originSkillBonuses[skillKey] = (nextState.originSkillBonuses[skillKey] || 0) + ranks;
    nextState.originSelectedSkills[originGrant.id] = skillKey;
    await applySkillBonuses(actor, { [skillKey]: ranks });
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

    const { skillKey, ranks } = await resolveSkillSelection(actor, ancestry, grant, nextState.selectedSkills, allowPrompt);
    if (skillKey && ranks > 0) {
      nextState.skillBonuses[skillKey] = (nextState.skillBonuses[skillKey] || 0) + ranks;
      nextState.selectedSkills[grant.id] = skillKey;
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
