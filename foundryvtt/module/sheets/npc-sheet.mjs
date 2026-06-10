/**
 * Legends D8 TTRPG NPC Sheet
 * Foundry VTT V13 - Application V2 (HandlebarsApplicationMixin + ActorSheetV2)
 * Uses: static DEFAULT_OPTIONS, static PARTS, _prepareContext(), data-action event delegation
 */
import { SKILL_LABELS, SKILL_ATTRIBUTE_KEYS, SKILL_ATTRIBUTE_SHORT } from '../skill-utils.mjs';
import { getLanguageDefinitions } from '../languages.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

// ── Reference data ──────────────────────────────────────────────────────────

const SIZE_OPTIONS = [
  { value: 'tiny',        label: 'Tiny' },
  { value: 'small',       label: 'Small' },
  { value: 'medium',      label: 'Medium' },
  { value: 'large',       label: 'Large' },
  { value: 'huge',        label: 'Huge' },
  { value: 'gargantuan',  label: 'Gargantuan' },
];

const CREATURE_TYPE_OPTIONS = [
  { value: 'humanoid',    label: 'Humanoid' },
  { value: 'beast',       label: 'Beast' },
  { value: 'undead',      label: 'Undead' },
  { value: 'construct',   label: 'Construct' },
  { value: 'elemental',   label: 'Elemental' },
  { value: 'drake',       label: 'Drake' },
  { value: 'monstrosity', label: 'Monstrosity' },
  { value: 'nephilim',    label: 'Nephilim' },
  { value: 'fey',         label: 'Fey' },
  { value: 'fiend',       label: 'Fiend' },
  { value: 'celestial',   label: 'Celestial' },
  { value: 'aberration',  label: 'Aberration' },
  { value: 'plant',       label: 'Plant' },
  { value: 'swarm',       label: 'Swarm' },
  { value: 'other',       label: 'Other' },
];

const HP_MULTIPLIER_OPTIONS = [
  { value: 6,  label: '×6 — Fragile' },
  { value: 7,  label: '×7 — Weak' },
  { value: 8,  label: '×8 — Standard' },
  { value: 9,  label: '×9 — Tough' },
  { value: 10, label: '×10 — Hardy' },
  { value: 12, label: '×12 — Resilient' },
  { value: 15, label: '×15 — Massive' },
  { value: 19, label: '×19 — Titanic' },
  { value: 30, label: '×30 — Legendary' },
];

const DAMAGE_TYPES = [
  // Physical
  'slashing', 'piercing', 'bludgeoning',
  // Physical qualifier — for constructs / golems immune to non-magical weapons
  'nonmagical-physical',
  // Elemental / energy
  'fire', 'cold', 'lightning', 'thunder',
  'necrotic', 'radiant', 'poison',
  'acid', 'force', 'psychic',
  // System-specific potential energy types
  'positive', 'negative',
];

const CONDITION_TYPES = [
  'bleeding', 'blinded', 'burning', 'charmed',
  'deafened', 'disease', 'exhaustion',
  'frightened', 'grappled', 'paralyzed',
  'petrified', 'poisoned', 'prone',
  'restrained', 'slowed', 'unconscious',
];

// Derived from the world language registry — keys are canonical, labels are display names
const LANGUAGE_OPTIONS = getLanguageDefinitions().map(l => ({ key: l.key, label: l.label }));

export class D8NPCSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["legends", "sheet", "actor", "npc"],
    position: { width: 600, height: 700 },
    actions: {
      rollItem: D8NPCSheet.#onRoll,
      skillRoll: D8NPCSheet.#onSkillRoll,
      saveRoll: D8NPCSheet.#onSaveRoll,
      itemCreate: D8NPCSheet.#onItemCreate,
      itemEdit: D8NPCSheet.#onItemEdit,
      itemDelete: D8NPCSheet.#onItemDelete,
      setSocialContext: D8NPCSheet.#onSetSocialContext,
      addSkill: D8NPCSheet.#onAddSkill,
      removeSkill: D8NPCSheet.#onRemoveSkill,
      addImmunity: D8NPCSheet.#onAddImmunity,
      removeImmunity: D8NPCSheet.#onRemoveImmunity,
      addResistance: D8NPCSheet.#onAddResistance,
      removeResistance: D8NPCSheet.#onRemoveResistance,
      addLanguage: D8NPCSheet.#onAddLanguage,
      removeLanguage: D8NPCSheet.#onRemoveLanguage,
    },
    form: { submitOnChange: true },
    window: { resizable: true }
  };

  static PARTS = {
    sheet: { template: "systems/legends/templates/actor/npc-sheet.hbs" }
  };

  /** @override */
  static TABS = {
    primary: {
      initial: "main",
      tabs: [
        { id: "main",    label: "Main" },
        { id: "details", label: "Details" },
        { id: "combat",  label: "Combat" }
      ]
    }
  };

  tabGroups = { primary: "main" };

  get title() {
    return this.document.name || "NPC";
  }

  /** @override - Configure the window title to show just the actor name */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ["sheet"];
    options.window = options.window || {};
    options.window.title = this.title;
  }

  /** @override */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    const rect = this.element?.getBoundingClientRect?.();
    if (!rect) return;
    if (rect.width < 560 || rect.height < 420) {
      this.setPosition({ width: 600, height: 700 });
    }
  }

  /** @override - Attach listeners to form inputs */
  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);
    
    // Add click listener for profile image to open file picker
    const profileImg = htmlElement.querySelector('.profile-img[data-edit="img"]');
    if (profileImg) {
      profileImg.addEventListener('click', this._onEditImage.bind(this));
      // Add context menu for right-click options
      this._contextMenu(profileImg);
    }
  }

  /** Set up context menu for profile image */
  _contextMenu(img) {
    new foundry.applications.ux.ContextMenu.implementation(this.element, img, [
      {
        name: "View Image",
        icon: '<i class="fas fa-eye"></i>',
        callback: () => {
          const ip = new ImagePopout(this.document.img, {
            title: this.document.name,
            uuid: this.document.uuid
          });
          ip.render(true);
        }
      },
      {
        name: "Share Image",
        icon: '<i class="fas fa-eye"></i>',
        condition: game.user.isGM,
        callback: () => {
          const ip = new ImagePopout(this.document.img, {
            title: this.document.name,
            uuid: this.document.uuid,
            shareable: true
          });
          ip.render(true);
          ip.shareImage();
        }
      }
    ], {
      jQuery: false
    });
  }

  /** Handle clicking on the profile image to change it */
  async _onEditImage(event) {
    event.preventDefault();
    const attr = event.currentTarget.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: path => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }

  /** @override - Handle form submission properly for ActorSheetV2 */
  async _processSubmitData(event, form, submitData) {
    const expanded = foundry.utils.expandObject(submitData);

    // When switching to monster type, default attitude to hostile if it was indifferent.
    // When switching to npc type, default attitude to indifferent if it was hostile.
    const prevNpcType = this.actor.system?.npcType ?? 'npc';
    const newNpcType = expanded.system?.npcType;
    if (newNpcType && newNpcType !== prevNpcType) {
      const currentAttitude = expanded.system?.attitude ?? this.actor.system?.attitude ?? 'indifferent';
      if (newNpcType === 'monster' && currentAttitude === 'indifferent') {
        expanded.system.attitude = 'hostile';
      } else if (newNpcType === 'npc' && currentAttitude === 'hostile') {
        expanded.system.attitude = 'indifferent';
      }
    }

    await this.document.update(expanded);
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actorData = this.actor.toObject(false);

    context.system = actorData.system;
    context.flags = actorData.flags;
    context.actor = actorData;
    context.owner = this.actor.isOwner;
    context.isGM = game.user.isGM;
    context.editable = this.isEditable;

    // Prepare NPC data
    this._prepareItems(context);

    // Prepare active skills (only those with a rank > 0)
    const rawSkills = context.system.skills || {};
    context.activeSkills = Object.entries(SKILL_LABELS)
      .map(([key, label]) => {
        const raw = rawSkills[key];
        const value = typeof raw === 'number' ? raw : (raw?.value ?? 0);
        return { key, label, value, attrShort: SKILL_ATTRIBUTE_SHORT[key] || '' };
      })
      .filter(s => s.value > 0)
      .sort((a, b) => a.label.localeCompare(b.label));

    // Details tab data
    context.sizeOptions        = SIZE_OPTIONS;
    context.creatureTypeOptions = CREATURE_TYPE_OPTIONS;
    context.hpMultiplierOptions = HP_MULTIPLIER_OPTIONS;

    const sys = context.system;
    context.immunityDamageChips  = (sys.immunities?.damageTypes  || []).map(t => ({ value: t, label: _capitalize(t) }));
    context.immunityCondChips    = (sys.immunities?.conditions   || []).map(t => ({ value: t, label: _capitalize(t) }));
    context.resistanceChips      = (sys.resistances              || []).map(r => ({
      value: r.type, dr: r.dr,
      label: `${_capitalize(r.type)} (DR +${r.dr})`
    }));
    context.languageChips = (sys.languages || []).map(k => ({
      value: k,
      label: LANGUAGE_OPTIONS.find(l => l.key === k)?.label ?? k
    }));

    // Speed display: only non-zero entries beyond walk
    context.speedExtras = Object.entries(sys.speed || {})
      .filter(([k, v]) => k !== 'walk' && v > 0)
      .map(([k, v]) => ({ key: k, label: _capitalize(k), value: v }));

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // AppV2 doesn't auto-wire V1-style tabs. Set up tab switching manually.
    const nav = this.element.querySelector('.sheet-tabs[data-group="primary"]');
    if (nav) {
      const tabs = nav.querySelectorAll('[data-tab]');
      const body = this.element.querySelector('.sheet-body');
      const activeTab = this.tabGroups.primary || "main";

      // Set initial active state
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
      if (body) {
        body.querySelectorAll(':scope > .tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === activeTab);
        });
      }

      // Attach click handlers
      tabs.forEach(t => {
        t.addEventListener('click', (ev) => {
          ev.preventDefault();
          const tab = t.dataset.tab;
          this.tabGroups.primary = tab;
          tabs.forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
          if (body) {
            body.querySelectorAll(':scope > .tab').forEach(c => {
              c.classList.toggle('active', c.dataset.tab === tab);
            });
          }
        });
      });
    }
  }

  /**
   * Organize Items
   */
  _prepareItems(context) {
    const weapons = [];
    const armor = [];
    const features = [];

    for (let item of this.actor.items) {
      const itemData = item.toObject(false);
      itemData.img = itemData.img || "icons/svg/item-bag.svg";

      if (itemData.type === 'weapon') weapons.push(itemData);
      else if (itemData.type === 'armor') armor.push(itemData);
      else features.push(itemData);
    }

    context.weapons = weapons;
    context.armor = armor;
    context.features = features;
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  /**
   * Handle rolls
   */
  static #onRoll(event, target) {
    const dataset = target.dataset;

    if (dataset.rollType === 'item') {
      const itemEl = target.closest('.item');
      const item = this.actor.items.get(itemEl?.dataset.itemId);
      if (item) return item.roll();
    }
  }

  /**
   * Handle skill rolls
   */
  static async #onSkillRoll(event, target) {
    const skill = target.dataset.skill;
    return game.legends.rollSkillCheck(this.actor, skill);
  }

  /**
   * Handle saving throw rolls
   */
  static async #onSaveRoll(event, target) {
    const saveType = target.dataset.save;
    return game.legends.rollSavingThrow(this.actor, saveType);
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
    const name = `New ${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Item'}`;
    const itemData = {
      name: name,
      type: type,
      system: {}
    };
    return await Item.create(itemData, { parent: this.actor });
  }

  static #onItemEdit(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    return item.sheet.render(true);
  }

  static async #onItemDelete(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: `Delete ${item.name}?` },
      content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`,
      yes: { default: false }
    });

    if (confirmed) {
      await item.delete();
    }
  }

  /**
   * Open the GM-only social context setter pre-filled with this NPC's current attitude.
   * Only usable by GMs (the button is hidden from players in the template).
   */
  static async #onSetSocialContext(event, target) {
    const attitude = this.actor.system?.attitude ?? 'indifferent';
    return game.legends.socialCheck.openGMContextSetter(attitude);
  }

  /**
   * Open a V2 dialog to pick a skill and rank to assign to this NPC.
   */
  static async #onAddSkill(event, target) {
    const existing = this.actor.system.skills || {};

    // Group unassigned skills by governing attribute
    const ATTR_LABELS = {
      strength: 'Strength', agility: 'Agility', dexterity: 'Dexterity',
      intelligence: 'Intelligence', wisdom: 'Wisdom', charisma: 'Charisma'
    };
    const byAttr = {};
    for (const [key, label] of Object.entries(SKILL_LABELS)) {
      const raw = existing[key];
      const current = typeof raw === 'number' ? raw : (raw?.value ?? 0);
      if (current > 0) continue; // already assigned
      const attr = SKILL_ATTRIBUTE_KEYS[key] || 'other';
      if (!byAttr[attr]) byAttr[attr] = [];
      byAttr[attr].push({ key, label });
    }

    if (!Object.keys(byAttr).length) {
      ui.notifications.info('All skills are already assigned to this NPC.');
      return;
    }

    let options = '';
    for (const [attr, skills] of Object.entries(byAttr)) {
      options += `<optgroup label="${ATTR_LABELS[attr] || attr}">`;
      for (const { key, label } of skills) {
        options += `<option value="${key}">${label}</option>`;
      }
      options += '</optgroup>';
    }

    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: 'Add NPC Skill' },
      position: { width: 320 },
      rejectClose: false,
      content: `
        <div class="form-group">
          <label>Skill</label>
          <select name="skillKey" style="flex:1">${options}</select>
        </div>
        <div class="form-group">
          <label>Rank (1–8)</label>
          <input type="number" name="skillRank" value="1" min="1" max="8" style="flex:1"/>
        </div>`,
      buttons: [
        {
          action: 'add',
          label: 'Add Skill',
          default: true,
          callback: (event, button, dialog) => ({
            key: dialog.element.querySelector('[name="skillKey"]')?.value,
            rank: Number(dialog.element.querySelector('[name="skillRank"]')?.value) || 1
          })
        },
        { action: 'cancel', label: 'Cancel' }
      ]
    });

    if (result?.key) {
      const rank = Math.max(1, Math.min(8, result.rank));
      await this.actor.update({ [`system.skills.${result.key}`]: rank });
    }
  }

  /**
   * Remove a skill from the NPC by zeroing its rank.
   */
  static async #onRemoveSkill(event, target) {
    const skill = target.closest('[data-skill]')?.dataset.skill;
    if (!skill) return;
    await this.actor.update({ [`system.skills.${skill}`]: 0 });
  }

  // ── Immunity handlers ──────────────────────────────────────────────────────

  static async #onAddImmunity(event, target) {
    const kind = target.dataset.kind; // 'damage' or 'condition'
    const isDamage = kind === 'damage';
    const pool = isDamage ? DAMAGE_TYPES : CONDITION_TYPES;
    const existing = isDamage
      ? (this.actor.system.immunities?.damageTypes || [])
      : (this.actor.system.immunities?.conditions  || []);
    const available = pool.filter(t => !existing.includes(t));

    if (!available.length) {
      ui.notifications.info(`All ${isDamage ? 'damage type' : 'condition'} immunities are already assigned.`);
      return;
    }

    const opts = available.map(t => `<option value="${t}">${_capitalize(t)}</option>`).join('');
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: `Add ${isDamage ? 'Damage' : 'Condition'} Immunity` },
      position: { width: 300 },
      rejectClose: false,
      content: `<div class="form-group"><label>${isDamage ? 'Damage Type' : 'Condition'}</label>
                 <select name="val" style="flex:1">${opts}</select></div>`,
      buttons: [
        {
          action: 'add', label: 'Add', default: true,
          callback: (ev, btn, dlg) => dlg.element.querySelector('[name="val"]')?.value
        },
        { action: 'cancel', label: 'Cancel' }
      ]
    });

    if (!result) return;
    const updated = [...existing, result];
    const path = isDamage ? 'system.immunities.damageTypes' : 'system.immunities.conditions';
    await this.actor.update({ [path]: updated });
  }

  static async #onRemoveImmunity(event, target) {
    const kind  = target.dataset.kind;
    const value = target.dataset.value;
    const isDamage = kind === 'damage';
    const path = isDamage ? 'system.immunities.damageTypes' : 'system.immunities.conditions';
    const existing = isDamage
      ? (this.actor.system.immunities?.damageTypes || [])
      : (this.actor.system.immunities?.conditions  || []);
    await this.actor.update({ [path]: existing.filter(t => t !== value) });
  }

  // ── Resistance handlers ────────────────────────────────────────────────────

  static async #onAddResistance(event, target) {
    const existing = this.actor.system.resistances || [];
    const usedTypes = existing.map(r => r.type);
    const available = DAMAGE_TYPES.filter(t => !usedTypes.includes(t));

    if (!available.length) {
      ui.notifications.info('Resistances for all damage types are already set.');
      return;
    }

    const opts = available.map(t => `<option value="${t}">${_capitalize(t)}</option>`).join('');
    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: 'Add Damage Resistance' },
      position: { width: 320 },
      rejectClose: false,
      content: `
        <div class="form-group">
          <label>Damage Type</label>
          <select name="rType" style="flex:1">${opts}</select>
        </div>
        <div class="form-group">
          <label>DR Bonus</label>
          <input type="number" name="rDr" value="1" min="1" max="20" style="flex:1"/>
        </div>`,
      buttons: [
        {
          action: 'add', label: 'Add', default: true,
          callback: (ev, btn, dlg) => ({
            type: dlg.element.querySelector('[name="rType"]')?.value,
            dr:   Number(dlg.element.querySelector('[name="rDr"]')?.value) || 1
          })
        },
        { action: 'cancel', label: 'Cancel' }
      ]
    });

    if (result?.type) {
      await this.actor.update({ 'system.resistances': [...existing, { type: result.type, dr: result.dr }] });
    }
  }

  static async #onRemoveResistance(event, target) {
    const value = target.dataset.value;
    const updated = (this.actor.system.resistances || []).filter(r => r.type !== value);
    await this.actor.update({ 'system.resistances': updated });
  }

  // ── Language handlers ──────────────────────────────────────────────────────

  static async #onAddLanguage(event, target) {
    const existing = this.actor.system.languages || [];

    const available = LANGUAGE_OPTIONS.filter(l => !existing.includes(l.key));

    const opts = available
      .map(l => `<option value="${l.key}">${l.label}</option>`)
      .join('');

    const customOpt = `<option value="__custom__">— Enter custom —</option>`;

    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: 'Add Language' },
      position: { width: 300 },
      rejectClose: false,
      content: `
        <div class="form-group">
          <label>Language</label>
          <select name="lang" style="flex:1">
            ${opts}
            ${customOpt}
          </select>
        </div>
        <div class="form-group" id="customLangGroup" style="display:none">
          <label>Custom</label>
          <input type="text" name="customLang" placeholder="Language name" style="flex:1"/>
        </div>`,
      render: (event, dialog) => {
        const sel = dialog.element.querySelector('[name="lang"]');
        const grp = dialog.element.querySelector('#customLangGroup');
        sel?.addEventListener('change', () => {
          grp.style.display = sel.value === '__custom__' ? '' : 'none';
        });
      },
      buttons: [
        {
          action: 'add', label: 'Add', default: true,
          callback: (ev, btn, dlg) => {
            const sel = dlg.element.querySelector('[name="lang"]')?.value;
            if (sel === '__custom__') return dlg.element.querySelector('[name="customLang"]')?.value?.trim() || null;
            return sel || null;
          }
        },
        { action: 'cancel', label: 'Cancel' }
      ]
    });

    if (result && !existing.includes(result)) {
      await this.actor.update({ 'system.languages': [...existing, result] });
    }
  }

  static async #onRemoveLanguage(event, target) {
    const value = target.dataset.value;
    const updated = (this.actor.system.languages || []).filter(l => l !== value);
    await this.actor.update({ 'system.languages': updated });
  }
}

// ── Module helpers ─────────────────────────────────────────────────────────

function _capitalize(str) {
  if (!str) return '';
  // Handle compound keys like 'nonmagical-physical' → 'Non-Magical Physical'
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}
