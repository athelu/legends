import { normalizeSkillKey } from './skill-utils.mjs';
import { awardXP } from './progression.mjs';

const BACKGROUND_FLAG_SCOPE = 'legends';
const BACKGROUND_FLAG_KEY = 'backgroundGrants';

const DIRECT_ITEM_GRANTS = {
  'iron holy symbol': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Holy Symbol, Iron' },
  'prayer book': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Book, Prayer' },
  robe: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Robe' },
  'incense stick': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Incense, Stick' },
  'common clothes': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Clothes, Common' },
  shoes: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Shoes' },
  journal: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Journal' },
  'map case': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Map Case' },
  'travelers clothes': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: "Clothes, Traveler's" },
  'artisans tools choose type': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: "Artisan's Tools" },
  'artisans tools': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: "Artisan's Tools" },
  'belt pouch': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Pouch, Belt' },
  'artists tools': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: "Artist's Tools" },
  'fine clothes': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Clothes, Fine' },
  'hemp rope': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Rope, Jute/Hemp' },
  'lime bast rope': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Rope, Lime Bast' },
  'low boots': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Boots, Low' },
  razor: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Razor' },
  scissors: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Scissors' },
  comb: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Comb' },
  soap: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Soap' },
  apron: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Apron' },
  quill: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Quill' },
  ink: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Ink, 1 oz' },
  'vellum parchment': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Parchment, Vellum' },
  'papyrus parchment': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Parchment, Papyrus' },
  abacus: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Abacus' },
  cleaver: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Cleaver' },
  'meat hook': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Meat Hook' },
  'work clothes': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Clothes, Work' },
  'carpenters tools': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: "Carpenter's Tools" },
  'work gloves': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Gloves, Work' },
  'disguise kit': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Disguise Kit' },
  perfume: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Perfume' },
  'signet ring': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Signet Ring' },
  'riding boots': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Boots, Riding' },
  crowbar: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Crowbar' },
  'wool hood': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Hood, Wool' },
  whip: { mode: 'reference', itemType: 'weapon', pack: 'legends.weapons', sourceName: 'Whip' },
  bedroll: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Bedroll' },
  'basic musical instrument': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Musical Instrument, Basic' },
  net: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Net' },
  'dice set': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Dice Set' },
  uniform: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Uniform/Livery' },
  livery: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Uniform/Livery' },
  'uniform or livery': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Uniform/Livery' },
  manacles: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Manacles' },
  'herbalism kit': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Herbalism Kit' },
  'mortar and pestle': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Mortar and Pestle' },
  'magnifying glass': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Magnifying Glass' },
  lantern: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Lantern' },
  tent: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Tent' },
  waterskin: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Waterskin' },
  'general topic book': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Book, General Topic' },
  'belt knife': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Knife, Belt' },
  sling: { mode: 'reference', itemType: 'weapon', pack: 'legends.weapons', sourceName: 'Sling' },
  'smiths tools': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: "Smith's Tools" },
  hammer: { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Hammer' },
  'sewing kit': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Sewing Kit' },
  'high boots': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Boots, High' },
  'work boots': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Boots, Work' },
  'arrows bolts': { mode: 'reference', itemType: 'equipment', pack: 'legends.equipment', sourceName: 'Arrows/Bolts' }
};

const CHOICE_ITEM_GRANTS = {
  'spear or club': {
    mode: 'choice',
    itemType: 'weapon',
    options: [
      { mode: 'reference', itemType: 'weapon', pack: 'legends.weapons', sourceName: 'Spear' },
      { mode: 'reference', itemType: 'weapon', pack: 'legends.weapons', sourceName: 'Club' }
    ]
  },
  'bow or crossbow': {
    mode: 'choice',
    itemType: 'weapon',
    options: [
      { mode: 'reference', itemType: 'weapon', pack: 'legends.weapons', sourceName: 'Shortbow' },
      { mode: 'reference', itemType: 'weapon', pack: 'legends.weapons', sourceName: 'Longbow' },
      { mode: 'reference', itemType: 'weapon', pack: 'legends.weapons', sourceName: 'Light Crossbow' },
      { mode: 'reference', itemType: 'weapon', pack: 'legends.weapons', sourceName: 'Heavy Crossbow' }
    ]
  },
  'weapon of choice': {
    mode: 'weapon-choice',
    itemType: 'weapon',
    pack: 'legends.weapons'
  }
};

function normalizeEquipmentEntry(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[’']/g, '')
    .replace(/[,:]/g, ' ')
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cloneGrant(grant) {
  return foundry.utils.deepClone(grant);
}

function parseEquipmentEntry(rawEntry) {
  const text = String(rawEntry || '').trim();
  if (!text) return null;

  const quantityMatch = text.match(/\bx\s*(\d+)$/i);
  const quantity = quantityMatch ? Number.parseInt(quantityMatch[1], 10) : 1;
  const withoutQuantity = quantityMatch ? text.slice(0, quantityMatch.index).trim() : text;
  const normalized = normalizeEquipmentEntry(withoutQuantity);

  const choiceGrant = CHOICE_ITEM_GRANTS[normalized];
  if (choiceGrant) {
    const grant = cloneGrant(choiceGrant);
    grant.quantity = quantity;
    grant.originalText = text;
    if (Array.isArray(grant.options)) {
      grant.options = grant.options.map(option => ({ ...option, quantity }));
    }
    return grant;
  }

  const directGrant = DIRECT_ITEM_GRANTS[normalized];
  if (directGrant) {
    const grant = cloneGrant(directGrant);
    grant.quantity = quantity;
    grant.originalText = text;
    return grant;
  }

  return {
    mode: 'placeholder',
    itemType: 'equipment',
    sourceName: withoutQuantity,
    quantity,
    originalText: text
  };
}

export function parseBackgroundSkillBonuses(text) {
  const skills = {};
  let startingXP = 0;

  for (const rawPart of String(text || '').split(',')) {
    const part = rawPart.trim();
    if (!part) continue;

    const xpMatch = part.match(/^\+?(\d+)\s*xp$/i);
    if (xpMatch) {
      startingXP = Number.parseInt(xpMatch[1], 10);
      continue;
    }

    const skillMatch = part.match(/^(.+?)\s+(\d+)$/);
    if (!skillMatch) continue;

    const skillKey = normalizeSkillKey(skillMatch[1]);
    if (!skillKey) continue;
    skills[skillKey] = Number.parseInt(skillMatch[2], 10);
  }

  return { skills, startingXP };
}

export function parseBackgroundItemGrants(text) {
  return String(text || '')
    .split(/\r?\n|,/)
    .map(entry => parseEquipmentEntry(entry))
    .filter(Boolean);
}

export function normalizeBackgroundSystemData(systemData = {}) {
  if (!systemData.description || typeof systemData.description !== 'object') {
    systemData.description = { value: '' };
  }

  if (!Number.isFinite(systemData.startingXP)) {
    const parsed = parseBackgroundSkillBonuses(systemData.skillBonuses);
    systemData.startingXP = parsed.startingXP;
  }

  for (const field of ['skillBonuses', 'startingEquipment', 'suggestedFeats', 'features', 'sampleNames', 'traits', 'notes']) {
    if (typeof systemData[field] !== 'string') systemData[field] = '';
  }

  if (!systemData.grantedSkills || typeof systemData.grantedSkills !== 'object' || Array.isArray(systemData.grantedSkills)) {
    systemData.grantedSkills = parseBackgroundSkillBonuses(systemData.skillBonuses).skills;
  }

  if (!Array.isArray(systemData.itemGrants)) {
    systemData.itemGrants = parseBackgroundItemGrants(systemData.startingEquipment);
  }

  return systemData;
}

function getBackgroundGrantState(actor) {
  return foundry.utils.deepClone(actor.getFlag(BACKGROUND_FLAG_SCOPE, BACKGROUND_FLAG_KEY) || {});
}

async function setBackgroundGrantState(actor, state) {
  await actor.setFlag(BACKGROUND_FLAG_SCOPE, BACKGROUND_FLAG_KEY, state);
}

async function resolveGrantDocument(grant) {
  const pack = game.packs.get(grant.pack);
  if (!pack) return null;

  const index = await pack.getIndex();
  const entry = index.find(doc =>
    (grant.sourceId && (doc.id === grant.sourceId || doc._id === grant.sourceId)) ||
    (grant.sourceName && doc.name === grant.sourceName)
  );
  if (!entry) return null;

  const documentId = entry.id || entry._id || entry._doc;
  if (!documentId) return null;

  const doc = await pack.getDocument(documentId);
  return doc ? { pack, doc } : null;
}

function buildGrantedBy(background, grantIndex, grant) {
  return {
    backgroundId: background.id,
    backgroundName: background.name,
    grantIndex,
    sourcePack: grant.pack || null,
    sourceId: grant.sourceId || null,
    sourceName: grant.sourceName || grant.name || null,
    originalText: grant.originalText || grant.sourceName || grant.name || ''
  };
}

function buildPlaceholderItem(grant, background, grantIndex) {
  return {
    name: grant.sourceName || grant.name || grant.originalText || 'Background Item',
    type: grant.itemType || 'equipment',
    img: 'icons/svg/item-bag.svg',
    system: {
      description: {
        value: `<p>Granted by the ${background.name} background. No matching compendium source was found for this item, so a placeholder was created.</p>`
      },
      equipmentType: 'adventuring-gear',
      weight: 0,
      cost: 0,
      quantity: grant.quantity || 1,
      equipped: false,
      capacity: '',
      brightLight: 0,
      dimLight: 0,
      duration: '',
      uses: { value: 0, max: 0 },
      consumable: false,
      associatedSkill: '',
      toolBonus: 0,
      rarity: '',
      requiresAttunement: false,
      magicalProperties: '',
      properties: '',
      notes: `Background starter item from ${background.name}`
    },
    effects: [],
    flags: {
      legends: {
        grantedBy: buildGrantedBy(background, grantIndex, grant),
        placeholder: true
      }
    }
  };
}

async function chooseGrantOption(background, grant, previousSelection = null) {
  let options = [];

  if (grant.mode === 'choice') {
    options = grant.options || [];
  } else if (grant.mode === 'weapon-choice') {
    const pack = game.packs.get(grant.pack || 'legends.weapons');
    if (!pack) return null;
    const index = await pack.getIndex();
    options = index
      .map(entry => ({
        mode: 'reference',
        itemType: 'weapon',
        pack: pack.collection,
        sourceId: entry.id || entry._id || null,
        sourceName: entry.name,
        quantity: grant.quantity || 1,
        originalText: grant.originalText
      }))
      .sort((left, right) => left.sourceName.localeCompare(right.sourceName));
  }

  if (!options.length) return null;

  const defaultIndex = Math.max(0, options.findIndex(option =>
    previousSelection && option.sourceName === previousSelection.sourceName && option.pack === previousSelection.pack
  ));

  return foundry.applications.api.DialogV2.wait({
    window: { title: `${background.name} Starting Item` },
    position: { width: 420 },
    rejectClose: false,
    content: `
      <form class="legends-background-grant-choice" style="padding: 10px;">
        <div class="form-group">
          <label><strong>Choose an item for:</strong></label>
          <div style="margin: 6px 0 10px;">${grant.originalText || background.name}</div>
          <select name="grantChoice" style="width: 100%; padding: 6px;">
            ${options.map((option, index) => `
              <option value="${index}" ${index === defaultIndex ? 'selected' : ''}>${option.sourceName || option.name}</option>
            `).join('')}
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'choose',
        label: 'Select',
        default: true,
        callback: (event, button, dialog) => {
          const selectedIndex = Number.parseInt(dialog.element.querySelector('[name="grantChoice"]')?.value || `${defaultIndex}`, 10);
          return options[selectedIndex] || null;
        }
      },
      {
        action: 'cancel',
        label: 'Cancel'
      }
    ]
  });
}

async function createGrantedItem(actor, background, grantIndex, grant) {
  const grantedBy = buildGrantedBy(background, grantIndex, grant);
  const existing = actor.items.find(item =>
    item?.flags?.legends?.grantedBy?.backgroundId === background.id &&
    Number(item?.flags?.legends?.grantedBy?.grantIndex) === grantIndex
  );
  if (existing) return existing;

  if (grant.mode === 'placeholder') {
    const [createdPlaceholder] = await actor.createEmbeddedDocuments('Item', [buildPlaceholderItem(grant, background, grantIndex)]);
    return createdPlaceholder;
  }

  const resolved = await resolveGrantDocument(grant);
  if (!resolved?.doc) {
    const [createdFallback] = await actor.createEmbeddedDocuments('Item', [buildPlaceholderItem(grant, background, grantIndex)]);
    return createdFallback;
  }

  const copy = foundry.utils.deepClone(resolved.doc.toObject());
  copy.flags = copy.flags || {};
  copy.flags.legends = copy.flags.legends || {};
  copy.flags.legends.grantedBy = grantedBy;
  if (copy.system?.quantity !== undefined && Number.isFinite(grant.quantity) && grant.quantity > 0) {
    copy.system.quantity = grant.quantity;
  }

  const [created] = await actor.createEmbeddedDocuments('Item', [copy]);
  return created;
}

async function ensureBackgroundGrantedItems(actor, background, state, itemGrants) {
  const nextState = foundry.utils.deepClone(state || {});
  nextState.choices = nextState.choices || {};

  for (const [grantIndex, grant] of itemGrants.entries()) {
    let concreteGrant = grant;
    if (grant.mode === 'choice' || grant.mode === 'weapon-choice') {
      concreteGrant = nextState.choices[grantIndex] || await chooseGrantOption(background, grant, nextState.choices[grantIndex]);
      if (!concreteGrant) continue;
      nextState.choices[grantIndex] = concreteGrant;
    }

    await createGrantedItem(actor, background, grantIndex, concreteGrant);
  }

  return nextState;
}

export async function applyBackgroundGrants(actor, background) {
  if (!actor || actor.type !== 'character' || !background || background.type !== 'background') return;

  const parsedSkills = parseBackgroundSkillBonuses(background.system.skillBonuses);
  const skillGrants = Object.keys(background.system.grantedSkills || {}).length
    ? background.system.grantedSkills
    : parsedSkills.skills;
  const xpGrant = Number.isFinite(background.system.startingXP) ? background.system.startingXP : parsedSkills.startingXP;
  const itemGrants = Array.isArray(background.system.itemGrants) && background.system.itemGrants.length
    ? background.system.itemGrants
    : parseBackgroundItemGrants(background.system.startingEquipment);

  const state = getBackgroundGrantState(actor);
  if (state[background.id]?.applied) {
    state[background.id] = await ensureBackgroundGrantedItems(actor, background, state[background.id], itemGrants);
    await setBackgroundGrantState(actor, state);
    return;
  }

  const updates = {};
  for (const [skillKey, amount] of Object.entries(skillGrants)) {
    const current = Number(actor.system.skills?.[skillKey] ?? 0);
    updates[`system.skills.${skillKey}`] = Math.max(0, current + Number(amount || 0));
  }

  if (Object.keys(updates).length) {
    await actor.update(updates);
  }

  if (Number(xpGrant || 0) !== 0) {
    await awardXP(actor, Number(xpGrant || 0), {
      reason: `Background grant: ${background.name}`,
      category: 'background',
      source: 'background-grant'
    });
  }

  const nextState = await ensureBackgroundGrantedItems(actor, background, state[background.id] || {}, itemGrants);
  nextState.applied = true;
  nextState.appliedSkills = foundry.utils.deepClone(skillGrants);
  nextState.appliedXP = Number(xpGrant || 0);
  state[background.id] = nextState;
  await setBackgroundGrantState(actor, state);
}

export async function revokeBackgroundGrants(actor, background) {
  if (!actor || actor.type !== 'character' || !background || background.type !== 'background') return;

  const state = getBackgroundGrantState(actor);
  const backgroundState = state[background.id] || {};
  const appliedSkills = backgroundState.appliedSkills || background.system.grantedSkills || {};
  const appliedXP = Number(backgroundState.appliedXP || background.system.startingXP || 0);

  const updates = {};
  for (const [skillKey, amount] of Object.entries(appliedSkills)) {
    const current = Number(actor.system.skills?.[skillKey] ?? 0);
    updates[`system.skills.${skillKey}`] = Math.max(0, current - Number(amount || 0));
  }

  if (Object.keys(updates).length) {
    await actor.update(updates);
  }

  if (appliedXP !== 0) {
    await awardXP(actor, -appliedXP, {
      reason: `Background revoked: ${background.name}`,
      category: 'background',
      source: 'background-revoke'
    });
  }

  const grantedIds = actor.items
    .filter(item => item?.flags?.legends?.grantedBy?.backgroundId === background.id)
    .map(item => item.id);
  if (grantedIds.length) {
    await actor.deleteEmbeddedDocuments('Item', grantedIds);
  }

  delete state[background.id];
  await setBackgroundGrantState(actor, state);
}

export async function syncBackgroundsForActor(actor) {
  if (!actor || actor.type !== 'character') return;
  const backgrounds = actor.items.filter(item => item.type === 'background');
  const state = getBackgroundGrantState(actor);

  for (const background of backgrounds) {
    if (state[background.id]?.applied) {
      const itemGrants = Array.isArray(background.system.itemGrants) && background.system.itemGrants.length
        ? background.system.itemGrants
        : parseBackgroundItemGrants(background.system.startingEquipment);
      state[background.id] = await ensureBackgroundGrantedItems(actor, background, state[background.id], itemGrants);
      continue;
    }

    await applyBackgroundGrants(actor, background);
    Object.assign(state, getBackgroundGrantState(actor));
  }

  await setBackgroundGrantState(actor, state);
}

export function initializeBackgroundHandlers() {
  Hooks.on('preCreateItem', async (item) => {
    if (!item || item.type !== 'background') return;
    const actor = item.parent;
    if (!actor || actor.type !== 'character') return;

    const existing = actor.items.find(existingItem => existingItem.type === 'background');
    if (existing) {
      ui.notifications.warn(`${actor.name} already has a background. Remove the existing background before adding another.`);
      return false;
    }
  });

  Hooks.on('createItem', async (item) => {
    if (!item || item.type !== 'background') return;
    const actor = item.parent;
    if (!actor || actor.type !== 'character') return;
    await applyBackgroundGrants(actor, item);
  });

  Hooks.on('deleteItem', async (item) => {
    if (!item || item.type !== 'background') return;
    const actor = item.actor;
    if (!actor || actor.type !== 'character') return;
    await revokeBackgroundGrants(actor, item);
  });

  Hooks.on('updateItem', async (item, diff) => {
    if (!item || item.type !== 'background') return;
    const actor = item.actor;
    if (!actor || actor.type !== 'character') return;
    if (!diff.system && !diff.name) return;

    await revokeBackgroundGrants(actor, item);
    await applyBackgroundGrants(actor, item);
  });
}