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

function getPrimaryBackgroundName(actor) {
  return actor?.items?.find(item => item.type === 'background')?.name || '';
}

async function syncActorBackgroundLabel(actor, explicitName = null) {
  if (!actor || actor.type !== 'character') return;

  const nextName = explicitName == null ? getPrimaryBackgroundName(actor) : String(explicitName || '');
  const currentName = String(actor.system?.biography?.background || '');
  if (currentName === nextName) return;

  await actor.update({ 'system.biography.background': nextName });
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

function escapeHtml(value) {
  return Handlebars.escapeExpression(String(value ?? ''));
}

function getGrantOptionMeta(option, doc = null) {
  const bits = [];
  if (doc?.type) bits.push(String(doc.type).charAt(0).toUpperCase() + String(doc.type).slice(1));
  if (Number(option?.quantity || 1) > 1) bits.push(`Qty ${Number(option.quantity)}`);
  const system = doc?.system || {};
  if (Number(system?.cost || 0) > 0) bits.push(`${Number(system.cost)} cost`);
  if (Number(system?.weight || 0) > 0) bits.push(`${Number(system.weight)} wt`);
  return bits.join(' • ');
}

function buildGrantOptionPreview(option) {
  const doc = option?.previewDoc;
  const system = doc?.system || {};
  const description = String(system?.description?.value || '').trim();
  const notes = String(system?.notes || '').trim();
  const meta = getGrantOptionMeta(option, doc);

  return `
    <div style="display: flex; flex-direction: column; gap: 10px; min-height: 320px;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">
          <h3 style="margin: 0;">${escapeHtml(option?.sourceName || option?.name || 'Item')}</h3>
          ${meta ? `<span style="font-size: 12px; color: #666;">${escapeHtml(meta)}</span>` : ''}
        </div>
      </div>
      ${option?.originalText ? `<div><strong>Granted By</strong><div style="margin-top: 6px;">${escapeHtml(option.originalText)}</div></div>` : ''}
      ${description ? `<div><strong>Description</strong><div style="margin-top: 6px;">${description}</div></div>` : '<div><strong>Description</strong><div style="margin-top: 6px; color: #666;">No detailed description is available for this item.</div></div>'}
      ${notes ? `<div><strong>Notes</strong><div style="margin-top: 6px;">${notes}</div></div>` : ''}
    </div>
  `;
}

function renderGrantOptionPicker(root, options, initialIndex = 0) {
  const container = root instanceof HTMLElement ? root : (root?.[0] || root);
  if (!container) return;

  const input = container.querySelector('[name="grantChoice"]');
  const preview = container.querySelector('[data-background-grant-preview]');
  const rows = Array.from(container.querySelectorAll('[data-background-grant-option]'));

  const syncSelection = (index) => {
    const safeIndex = Math.max(0, Math.min(index, options.length - 1));
    if (input) input.value = String(safeIndex);
    rows.forEach((row, rowIndex) => {
      row.style.borderColor = rowIndex === safeIndex ? '#d18b47' : 'rgba(209, 139, 71, 0.25)';
      row.style.background = rowIndex === safeIndex ? 'rgba(209, 139, 71, 0.10)' : 'rgba(255, 255, 255, 0.03)';
    });
    if (preview) preview.innerHTML = buildGrantOptionPreview(options[safeIndex]);
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

  const previewOptions = await Promise.all(options.map(async (option) => {
    const resolved = await resolveGrantDocument(option);
    return {
      ...option,
      previewDoc: resolved?.doc || null
    };
  }));

  const defaultIndex = Math.max(0, previewOptions.findIndex(option =>
    previousSelection && option.sourceName === previousSelection.sourceName && option.pack === previousSelection.pack
  ));

  return foundry.applications.api.DialogV2.wait({
    window: { title: `${background.name} Starting Item` },
    position: { width: 980 },
    rejectClose: false,
    content: `
      <form class="legends-background-grant-choice" style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
        <div><strong>Choose an item for:</strong> ${escapeHtml(grant.originalText || background.name)}</div>
        <div style="font-size: 12px; color: #666;">Review the list on the left and the item preview on the right before confirming your choice.</div>
        <input type="hidden" name="grantChoice" value="${defaultIndex >= 0 ? defaultIndex : 0}" />
        <div style="display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: 14px; align-items: start;">
          <div>
            <label style="display: block; margin-bottom: 6px;">Select an item</label>
            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 460px; overflow-y: auto; padding-right: 4px;">
              ${previewOptions.map((option, index) => `
                <div
                  data-background-grant-option="${index}"
                  tabindex="0"
                  style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 8px 10px; cursor: pointer;">
                  <div style="font-weight: 600;">${escapeHtml(option.sourceName || option.name)}</div>
                  <div style="font-size: 12px; color: #666; margin-top: 2px;">${escapeHtml(getGrantOptionMeta(option, option.previewDoc))}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div data-background-grant-preview style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 10px; padding: 12px; max-height: 460px; overflow-y: auto;"></div>
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
          const selected = previewOptions[selectedIndex] || null;
          if (!selected) return null;
          const { previewDoc, ...grantSelection } = selected;
          return grantSelection;
        }
      },
      {
        action: 'cancel',
        label: 'Cancel'
      }
    ],
    render: (event, dialog) => {
      renderGrantOptionPicker(dialog.element, previewOptions, defaultIndex >= 0 ? defaultIndex : 0);
    }
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
    await syncActorBackgroundLabel(actor, background.name);
    return;
  }

  const updates = {
    'system.biography.background': background.name
  };
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
  await syncActorBackgroundLabel(actor);
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
  await syncActorBackgroundLabel(actor);
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