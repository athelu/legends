/**
 * LegendsD8 TTRPG Item Sheet
 * Foundry VTT V13 - Application V2 (HandlebarsApplicationMixin + ItemSheetV2)
 * Uses: static DEFAULT_OPTIONS, static PARTS, _prepareContext(), data-action event delegation
 * Dynamic template selection via _configureRenderOptions() based on item type
 */
const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class D8ItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["legends", "sheet", "item"],
    position: { width: 520, height: 480 },
    actions: {
      addEffect: D8ItemSheet.#onAddEffect,
      removeEffect: D8ItemSheet.#onRemoveEffect,
      addAttackMode: D8ItemSheet.#onAddAttackMode,
      removeAttackMode: D8ItemSheet.#onRemoveAttackMode,
    },
    form: { submitOnChange: true },
    window: { resizable: true }
  };

  static PARTS = {
    sheet: { template: "systems/legends/templates/item/item-feat-sheet.hbs" }
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ["sheet"];
    // Dynamically set the template based on item type
    this.constructor.PARTS.sheet.template =
      `systems/legends/templates/item/item-${this.document.type}-sheet.hbs`;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const itemData = this.document.toObject(false);

    context.system = itemData.system;
    context.flags = itemData.flags;
    context.item = itemData;

    // CRITICAL: Set these for the editor helper
    context.owner = this.document.isOwner;
    context.editable = this.isEditable;

    // Enrich description - handle both {value: "..."} object and plain string formats
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    const descRaw = typeof context.system.description === 'string'
      ? context.system.description
      : (context.system.description?.value || "");
    context.enrichedDescription = await TextEditor.enrichHTML(
      descRaw,
      {
        secrets: this.document.isOwner,
        async: true
      }
    );

    // Enrich benefits text (feats) -- supports inline roll enrichers
    if (context.system.benefits) {
      context.enrichedBenefits = await TextEditor.enrichHTML(
        context.system.benefits,
        {
          secrets: this.document.isOwner,
          async: true
        }
      );
    }

    // Add property descriptions for weapons (Legends system)
    if (this.document.type === 'weapon') {
      // FILTER OUT EMPTY PROPERTY VALUES!
      if (context.system.properties && Array.isArray(context.system.properties)) {
        context.system.properties = context.system.properties.filter(prop =>
          prop && typeof prop === 'string' && prop.trim() !== ''
        );
      }

      context.propertyDescriptions = {
        // Hand Usage Properties
        'light': 'Can dual wield without penalty. Use d6 for attack rolls.',
        'standard': 'Normal one-handed weapon. Use d8 for attack rolls.',
        'versatile': 'Can use one or two hands. Use d8 (1H) or d10 (2H) for attack rolls.',
        'two-handed': 'Requires both hands to use. Use d10 for attack rolls.',

        // Combat Properties
        'finesse': 'Use Agility instead of Strength for attack rolls',
        'reach': 'Extends melee range by 5 feet',
        'monk': 'Usable with martial arts techniques',

        // Attack Type Properties
        'ranged': 'Attacks at distance (requires range values)',
        'thrown': 'Can be thrown as a ranged attack',

        // Special Properties
        'alternate-strike': 'Can deal an alternate damage type (specify in notes)',
        'multi-type': 'Deals multiple damage types simultaneously'
      };
    }

    // Filter empty properties for armor too
    if (this.document.type === 'armor') {
      // FILTER OUT EMPTY PROPERTY VALUES!
      if (context.system.properties && Array.isArray(context.system.properties)) {
        context.system.properties = context.system.properties.filter(prop =>
          prop && typeof prop === 'string' && prop.trim() !== ''
        );
      }
    }

    // Add type-specific data for weaves
    if (this.document.type === 'weave') {
      context.energyTypes = {
        earth: "Earth",
        air: "Air",
        fire: "Fire",
        water: "Water",
        positive: "Positive",
        negative: "Negative",
        time: "Time",
        space: "Space"
      };

      context.effectTypes = {
        damage: "Damage",
        healing: "Healing",
        buff: "Buff/Debuff",
        control: "Control",
        summon: "Summon",
        transformation: "Transformation",
        utility: "Utility",
        protection: "Protection",
        divination: "Divination"
      };
    }

    return context;
  }

  tabGroups = { primary: "description" };

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // AppV2 doesn't auto-wire V1-style tabs. Set up tab switching manually.
    const nav = this.element.querySelector('.sheet-tabs[data-group="primary"]');
    if (nav) {
      const tabs = nav.querySelectorAll('[data-tab]');
      const body = this.element.querySelector('.sheet-body');
      const activeTab = this.tabGroups.primary || "description";

      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
      if (body) {
        body.querySelectorAll(':scope > .tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === activeTab);
        });
      }

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

    // Handle armor type changes to show/hide relevant fields (native DOM)
    const armorTypeSelect = this.element.querySelector('.armor-type-select');
    if (armorTypeSelect) {
      armorTypeSelect.addEventListener('change', this._onArmorTypeChange.bind(this));
    }

    // Attach improved autocomplete for effect targets (datalist-based)
    this.element.querySelectorAll('input[list="effects-targets"]').forEach(el => {
      el.addEventListener('input', this._onEffectTargetInput.bind(this));
      el.addEventListener('focus', this._onEffectTargetInput.bind(this));
      el.addEventListener('blur', this._onEffectTargetBlur.bind(this));
    });
  }

  /** @override */
  _processSubmitData(event, formData) {
    // Foundry converts array field names like "system.effects.0.type" into
    // nested objects with numeric keys, which corrupts actual arrays.
    // Reconstruct any such arrays before passing to the update.
    const expanded = foundry.utils.expandObject(formData);

    // Fix system.effects (feat effects builder)
    if (expanded.system?.effects && !Array.isArray(expanded.system.effects)) {
      const effectsObj = expanded.system.effects;
      const effectsArr = [];
      for (const key of Object.keys(effectsObj).sort((a, b) => Number(a) - Number(b))) {
        effectsArr.push(effectsObj[key]);
      }
      expanded.system.effects = effectsArr;
    }

    // Fix system.attackModes (weapon attack modes)
    if (expanded.system?.attackModes && !Array.isArray(expanded.system.attackModes)) {
      const modesObj = expanded.system.attackModes;
      const modesArr = [];
      for (const key of Object.keys(modesObj).sort((a, b) => Number(a) - Number(b))) {
        modesArr.push(modesObj[key]);
      }
      expanded.system.attackModes = modesArr;
    }

    // Flatten back and return
    return foundry.utils.flattenObject(expanded);
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  /**
   * Add a new effect entry to the feat's system.effects array
   */
  static async #onAddEffect(event, target) {
    const effects = foundry.utils.duplicate(this.document.system.effects || []);
    effects.push({
      id: foundry.utils.randomID(),
      type: 'custom',
      target: '',
      value: '',
      actionType: 'passive',
      condition: '',
      description: ''
    });
    await this.document.update({ 'system.effects': effects });
  }

  /**
   * Remove an effect by index
   */
  static async #onRemoveEffect(event, target) {
    const idx = Number(target.dataset.index);
    if (isNaN(idx)) return;
    const effects = foundry.utils.duplicate(this.document.system.effects || []);
    if (idx < 0 || idx >= effects.length) return;
    effects.splice(idx, 1);
    await this.document.update({ 'system.effects': effects });
  }

  /**
   * Handle adding a new attack mode
   */
  static async #onAddAttackMode(event, target) {
    const modes = foundry.utils.duplicate(this.document.system.attackModes || []);

    modes.push({
      name: "New Mode",
      type: "melee",
      skill: "melee",
      damageAttr: "strength",
      defenseType: "melee",
      range: { normal: 0, medium: 0, long: 0 }
    });

    await this.document.update({ 'system.attackModes': modes });
  }

  /**
   * Handle removing an attack mode
   */
  static async #onRemoveAttackMode(event, target) {
    const index = parseInt(target.dataset.index);
    const modes = foundry.utils.duplicate(this.document.system.attackModes || []);

    modes.splice(index, 1);

    await this.document.update({ 'system.attackModes': modes });
  }

  /**
   * Handle armor type changes to show/hide relevant fields
   */
  _onArmorTypeChange(event) {
    const armorType = event.currentTarget.value;
    const form = event.currentTarget.closest('form');

    const armorFields = form.querySelector('.armor-only-fields');
    const shieldFields = form.querySelector('.shield-only-fields');

    if (armorType === 'shield') {
      if (armorFields) armorFields.style.display = 'none';
      if (shieldFields) shieldFields.style.display = '';
    } else {
      if (armorFields) armorFields.style.display = '';
      if (shieldFields) shieldFields.style.display = 'none';
    }
  }

  _onEffectTargetInput(event) {
    const input = event.currentTarget;
    const listId = input.getAttribute('list');
    if (!listId) return;
    const dataList = document.getElementById(listId);
    if (!dataList) return;

    const raw = input.value || '';
    // Get current token after last comma
    const parts = raw.split(',');
    const token = parts[parts.length - 1].trim().toLowerCase();

    // Build suggestions
    const options = Array.from(dataList.options).map(o => ({ value: o.value, label: o.value }));
    const matches = options.filter(o => o.value.toLowerCase().includes(token));

    // Remove any existing suggestion box
    document.querySelectorAll('.feat-target-suggestions').forEach(el => el.remove());

    if (matches.length === 0) return;

    // Create suggestion box
    const box = document.createElement('div');
    box.className = 'feat-target-suggestions';
    box.style.cssText = 'position: absolute; z-index: 10000; background: #fff; border: 1px solid #ccc; max-height: 200px; overflow: auto; padding: 4px;';

    matches.slice(0, 20).forEach(m => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.style.cssText = 'padding:4px; cursor: pointer;';
      item.textContent = m.label;
      item.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        // Insert selection into input replacing current token
        const current = input.value || '';
        const idx = current.lastIndexOf(',');
        let prefix = '';
        if (idx >= 0) prefix = current.substring(0, idx + 1) + ' ';
        const newVal = (prefix + m.value).replace(/\s+,/, ',');
        input.value = newVal;
        input.dispatchEvent(new Event('change'));
        document.querySelectorAll('.feat-target-suggestions').forEach(el => el.remove());
      });
      box.appendChild(item);
    });

    // Position box under input
    document.body.appendChild(box);
    const rect = input.getBoundingClientRect();
    box.style.top = (rect.bottom + window.scrollY) + 'px';
    box.style.left = (rect.left + window.scrollX) + 'px';
    box.style.minWidth = rect.width + 'px';
  }

  _onEffectTargetBlur(event) {
    // Delay removal to allow click handler to fire
    setTimeout(() => {
      document.querySelectorAll('.feat-target-suggestions').forEach(el => el.remove());
    }, 150);
  }
}
