/**
 * LegendsD8 TTRPG Item Sheet
 * Foundry VTT V13 - Application V2 (HandlebarsApplicationMixin + ItemSheetV2)
 * Uses: static DEFAULT_OPTIONS, static PARTS, _prepareContext(), data-action event delegation
 * Dynamic template selection via _configureRenderOptions() based on item type
 */
import { parseBackgroundItemGrants, parseBackgroundSkillBonuses } from '../backgrounds.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class D8ItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["legends", "sheet", "item"],
    position: { width: 520, height: 480 },
    actions: {
      addEffect: D8ItemSheet.#onAddEffect,
      removeEffect: D8ItemSheet.#onRemoveEffect,
      addWeaveEffect: D8ItemSheet.#onAddWeaveEffect,
      removeWeaveEffect: D8ItemSheet.#onRemoveWeaveEffect,
      addAttackMode: D8ItemSheet.#onAddAttackMode,
      removeAttackMode: D8ItemSheet.#onRemoveAttackMode,
    },
    form: { submitOnChange: true },
    window: { resizable: true }
  };

  static PARTS = {
    sheet: { template: "systems/legends/templates/item/item-feat-sheet.hbs" }
  };

  /** @override - Attach listeners */
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

    // Enrich benefit-style text fields -- supports inline roll enrichers
    if (context.system.benefits) {
      context.enrichedBenefits = await TextEditor.enrichHTML(
        context.system.benefits,
        {
          secrets: this.document.isOwner,
          async: true
        }
      );
    }

    if (context.system.visualEffects) {
      context.enrichedVisualEffects = await TextEditor.enrichHTML(
        context.system.visualEffects,
        {
          secrets: this.document.isOwner,
          async: true
        }
      );
    }

    if (context.system.notes) {
      context.enrichedNotes = await TextEditor.enrichHTML(
        context.system.notes,
        {
          secrets: this.document.isOwner,
          async: true
        }
      );
    }

    if (context.system.mechanicalEffects) {
      context.enrichedMechanicalEffects = await TextEditor.enrichHTML(
        context.system.mechanicalEffects,
        {
          secrets: this.document.isOwner,
          async: true
        }
      );
    }

    if (context.system.roleplayingImpact) {
      context.enrichedRoleplayingImpact = await TextEditor.enrichHTML(
        context.system.roleplayingImpact,
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
        buff: "Buff",
        debuff: "Debuff",
        control: "Control",
        summon: "Summon",
        transformation: "Transformation",
        utility: "Utility",
        protection: "Protection",
        divination: "Divination"
      };

      context.weaveAppliesEffects = (context.system.appliesEffects || []).map((effectRef, index) => ({
        index,
        effectId: effectRef.effectId || '',
        paramsText: Object.entries(effectRef.params || {})
          .map(([key, value]) => `${key}=${value}`)
          .join(', ')
      }));
    }

    if (this.document.type === 'action') {
      context.actionAppliesEffects = (context.system.appliesEffects || []).map((effectRef, index) => ({
        index,
        effectId: effectRef.effectId || '',
        operation: effectRef.operation === 'remove' ? 'remove' : 'apply',
        paramsText: Object.entries(effectRef.params || {})
          .map(([key, value]) => `${key}=${value}`)
          .join(', ')
      }));
    }

    if (this.document.type === 'ability') {
      context.abilityAppliesEffects = (context.system.appliesEffects || []).map((effectRef, index) => ({
        index,
        effectId: effectRef.effectId || '',
        operation: effectRef.operation === 'remove' ? 'remove' : 'apply',
        paramsText: Object.entries(effectRef.params || {})
          .map(([key, value]) => `${key}=${value}`)
          .join(', ')
      }));

      context.abilityRechargeLabel = context.system.recharge?.period === 'shortRest'
        ? 'Short Rest'
        : (context.system.recharge?.period === 'longRest' ? 'Long Rest' : '');
    }

    if (this.document.type === 'feat') {
      if (Array.isArray(context.system?.prerequisites?.feats)) {
        context.system.prerequisites.feats = context.system.prerequisites.feats.join(', ');
      }

      context.featRechargeLabel = context.system.usage?.recharge?.period === 'shortRest'
        ? 'Short Rest'
        : (context.system.usage?.recharge?.period === 'longRest' ? 'Long Rest' : '');
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
    // Handle checkbox arrays (like weapon properties)
    // Multiple checkboxes with the same name don't automatically create arrays
    const form = this.element.querySelector('form');
    if (form) {
      // Collect all checked property checkboxes
      const propertyCheckboxes = form.querySelectorAll('input[name="system.properties"]:checked');
      if (propertyCheckboxes.length > 0) {
        // Remove any existing system.properties from formData
        delete formData['system.properties'];
        // Add each checked value as an array element
        const properties = [];
        propertyCheckboxes.forEach(cb => {
          if (cb.value) properties.push(cb.value);
        });
        // Add to formData using array notation
        properties.forEach((prop, idx) => {
          formData[`system.properties.${idx}`] = prop;
        });
      } else {
        // If no checkboxes are checked, explicitly set empty array
        formData['system.properties'] = [];
      }
    }

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

    // Fix system.properties (convert to proper array)
    if (expanded.system?.properties && !Array.isArray(expanded.system.properties)) {
      const propsObj = expanded.system.properties;
      const propsArr = [];
      for (const key of Object.keys(propsObj).sort((a, b) => Number(a) - Number(b))) {
        propsArr.push(propsObj[key]);
      }
      expanded.system.properties = propsArr;
    }

    if (this.document.type === 'weapon') {
      if (typeof expanded.system?.reload !== 'string') expanded.system.reload = '';
      if (typeof expanded.system?.requirements !== 'string') expanded.system.requirements = '';

      const firstRangedMode = Array.isArray(expanded.system?.attackModes)
        ? expanded.system.attackModes.find(mode => ['ranged', 'thrown'].includes(mode?.type))
        : null;

      expanded.system.range = firstRangedMode?.range
        ? foundry.utils.deepClone(firstRangedMode.range)
        : { normal: 0, medium: 0, long: 0 };
    }

    if (this.document.type === 'weave') {
      if (expanded.system?.appliesEffects && !Array.isArray(expanded.system.appliesEffects)) {
        const appliesEffectsObj = expanded.system.appliesEffects;
        const appliesEffectsArr = [];
        for (const key of Object.keys(appliesEffectsObj).sort((a, b) => Number(a) - Number(b))) {
          appliesEffectsArr.push(appliesEffectsObj[key]);
        }
        expanded.system.appliesEffects = appliesEffectsArr;
      }

      for (const field of ['range', 'duration', 'target', 'savingThrow', 'effectType', 'effect', 'deliveryMethod', 'weavingRoll', 'targetingRoll', 'targetingSuccessScaling']) {
        if (typeof expanded.system?.[field] !== 'string') expanded.system[field] = '';
        else expanded.system[field] = expanded.system[field].trim();
      }

      if (Array.isArray(expanded.system?.tags)) {
        expanded.system.tags = expanded.system.tags.map(tag => String(tag || '').trim()).filter(Boolean);
      } else {
        expanded.system.tags = String(expanded.system?.tags || '')
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean);
      }

      const validEffectTypes = ['damage', 'healing', 'buff', 'debuff', 'control', 'summon', 'transformation', 'utility', 'protection', 'divination'];
      if (!validEffectTypes.includes(expanded.system.effectType)) {
        expanded.system.effectType = expanded.system.damage?.base > 0 ? 'damage' : 'utility';
      }

      const validDeliveryMethods = ['attack', 'save', 'automatic'];
      if (!validDeliveryMethods.includes(expanded.system.deliveryMethod)) {
        expanded.system.deliveryMethod = 'automatic';
      }

      const validSaveTypes = ['', 'none', 'fortitude', 'reflex', 'will'];
      if (!validSaveTypes.includes(expanded.system.savingThrow)) {
        expanded.system.savingThrow = 'none';
      }

      if (!Array.isArray(expanded.system?.appliesEffects)) {
        expanded.system.appliesEffects = [];
      }

      expanded.system.appliesEffects = expanded.system.appliesEffects
        .map(effectRef => {
          const effectId = String(effectRef?.effectId || '').trim();
          const operation = effectRef?.operation === 'remove' ? 'remove' : 'apply';
          const rawParams = String(effectRef?.paramsText || '').trim();
          const params = {};

          if (rawParams) {
            for (const entry of rawParams.split(',')) {
              const [key, ...rest] = entry.split('=');
              const paramKey = String(key || '').trim();
              const paramValue = rest.join('=').trim();
              if (paramKey) params[paramKey] = paramValue;
            }
          }

          return effectId ? { effectId, operation, params } : null;
        })
        .filter(Boolean);

      if (!Number.isFinite(expanded.system?.actionCost)) {
        expanded.system.actionCost = 1;
      }
    }

    if (this.document.type === 'background') {
      for (const field of ['skillBonuses', 'startingEquipment', 'suggestedFeats', 'features', 'sampleNames', 'traits', 'notes']) {
        if (typeof expanded.system?.[field] !== 'string') expanded.system[field] = '';
      }

      const parsedSkills = parseBackgroundSkillBonuses(expanded.system.skillBonuses || '');
      expanded.system.grantedSkills = parsedSkills.skills;
      expanded.system.itemGrants = parseBackgroundItemGrants(expanded.system.startingEquipment || '');

      if (!Number.isFinite(expanded.system.startingXP) || (expanded.system.startingXP <= 0 && parsedSkills.startingXP > 0)) {
        expanded.system.startingXP = parsedSkills.startingXP;
      }
    }

    if (this.document.type === 'ancestry') {
      if (!expanded.system?.bonuses || typeof expanded.system.bonuses !== 'object' || Array.isArray(expanded.system.bonuses)) {
        expanded.system.bonuses = { attributes: {} };
      }

      if (!expanded.system.bonuses.attributes || typeof expanded.system.bonuses.attributes !== 'object' || Array.isArray(expanded.system.bonuses.attributes)) {
        expanded.system.bonuses.attributes = {};
      }

      for (const attr of ['strength', 'constitution', 'agility', 'dexterity', 'intelligence', 'wisdom', 'charisma', 'luck']) {
        const value = expanded.system.bonuses.attributes[attr];
        expanded.system.bonuses.attributes[attr] = Number.isFinite(value) ? value : 0;
      }

      for (const field of ['traits', 'languages', 'specialAbilities', 'senses', 'culture', 'physicalDescription', 'notes']) {
        if (typeof expanded.system?.[field] !== 'string') expanded.system[field] = '';
      }

      if (!Number.isFinite(expanded.system.speed)) expanded.system.speed = 30;
      if (!Number.isFinite(expanded.system.lifespan)) expanded.system.lifespan = 0;
      expanded.system.requiresGMApproval = Boolean(expanded.system.requiresGMApproval);
      expanded.system.abilityModifiers = foundry.utils.deepClone(expanded.system.bonuses.attributes);
    }

    if (this.document.type === 'action') {
      if (expanded.system?.appliesEffects && !Array.isArray(expanded.system.appliesEffects)) {
        const appliesEffectsObj = expanded.system.appliesEffects;
        const appliesEffectsArr = [];
        for (const key of Object.keys(appliesEffectsObj).sort((a, b) => Number(a) - Number(b))) {
          appliesEffectsArr.push(appliesEffectsObj[key]);
        }
        expanded.system.appliesEffects = appliesEffectsArr;
      }

      if (!Array.isArray(expanded.system?.appliesEffects)) {
        expanded.system.appliesEffects = [];
      }

      expanded.system.appliesEffects = expanded.system.appliesEffects
        .map(effectRef => {
          const effectId = String(effectRef?.effectId || '').trim();
          const operation = effectRef?.operation === 'remove' ? 'remove' : 'apply';
          const rawParams = String(effectRef?.paramsText || '').trim();
          const params = {};

          if (rawParams) {
            for (const entry of rawParams.split(',')) {
              const [key, ...rest] = entry.split('=');
              const paramKey = String(key || '').trim();
              const paramValue = rest.join('=').trim();
              if (paramKey) params[paramKey] = paramValue;
            }
          }

          return effectId ? { effectId, operation, params } : null;
        })
        .filter(Boolean);

      const validActionTypes = ['combat', 'move', 'interact', 'activate', 'free', 'reaction'];

      if (!validActionTypes.includes(expanded.system?.actionType)) {
        expanded.system.actionType = 'combat';
      }

      for (const field of ['actionCost', 'requirements', 'trigger', 'effect', 'range', 'target', 'frequency', 'special']) {
        if (typeof expanded.system?.[field] !== 'string') expanded.system[field] = '';
        else expanded.system[field] = expanded.system[field].trim();
      }

      if (Array.isArray(expanded.system?.keywords)) {
        expanded.system.keywords = expanded.system.keywords.map(keyword => String(keyword || '').trim()).filter(Boolean);
      } else {
        expanded.system.keywords = String(expanded.system?.keywords || '')
          .split(',')
          .map(keyword => keyword.trim())
          .filter(Boolean);
      }
    }

    if (this.document.type === 'ability') {
      if (expanded.system?.appliesEffects && !Array.isArray(expanded.system.appliesEffects)) {
        const appliesEffectsObj = expanded.system.appliesEffects;
        const appliesEffectsArr = [];
        for (const key of Object.keys(appliesEffectsObj).sort((a, b) => Number(a) - Number(b))) {
          appliesEffectsArr.push(appliesEffectsObj[key]);
        }
        expanded.system.appliesEffects = appliesEffectsArr;
      }

      if (!Array.isArray(expanded.system?.appliesEffects)) {
        expanded.system.appliesEffects = [];
      }

      expanded.system.appliesEffects = expanded.system.appliesEffects
        .map(effectRef => {
          const effectId = String(effectRef?.effectId || '').trim();
          const rawParams = String(effectRef?.paramsText || '').trim();
          const params = {};

          if (rawParams) {
            for (const entry of rawParams.split(',')) {
              const [key, ...rest] = entry.split('=');
              const paramKey = String(key || '').trim();
              const paramValue = rest.join('=').trim();
              if (paramKey) params[paramKey] = paramValue;
            }
          }

          return effectId ? { effectId, params } : null;
        })
        .filter(Boolean);

      const validAbilityTypes = ['passive', 'triggered', 'active', 'reaction'];

      if (!validAbilityTypes.includes(expanded.system?.abilityType)) {
        expanded.system.abilityType = 'passive';
      }

      for (const field of ['actionCost', 'requirements', 'trigger', 'range', 'target', 'effect', 'frequency', 'usage', 'source']) {
        if (typeof expanded.system?.[field] !== 'string') expanded.system[field] = '';
        else expanded.system[field] = expanded.system[field].trim();
      }

      if (Array.isArray(expanded.system?.keywords)) {
        expanded.system.keywords = expanded.system.keywords.map(keyword => String(keyword || '').trim()).filter(Boolean);
      } else {
        expanded.system.keywords = String(expanded.system?.keywords || '')
          .split(',')
          .map(keyword => keyword.trim())
          .filter(Boolean);
      }

      expanded.system.isActive = Boolean(expanded.system?.isActive);
    }

    if (this.document.type === 'feat') {
      if (!expanded.system?.prerequisites || typeof expanded.system.prerequisites !== 'object' || Array.isArray(expanded.system.prerequisites)) {
        expanded.system.prerequisites = { attributes: {}, skills: '', feats: [], tier: 0, other: '' };
      }

      if (!expanded.system.prerequisites.attributes || typeof expanded.system.prerequisites.attributes !== 'object' || Array.isArray(expanded.system.prerequisites.attributes)) {
        expanded.system.prerequisites.attributes = {};
      }

      expanded.system.prerequisites.skills = String(expanded.system.prerequisites.skills || '').trim();
      expanded.system.prerequisites.other = String(expanded.system.prerequisites.other || '').trim();
      expanded.system.prerequisites.feats = String(expanded.system.prerequisites.feats || '')
        .split(',')
        .map(feat => feat.trim())
        .filter(Boolean);

      if (!expanded.system?.usage || typeof expanded.system.usage !== 'object' || Array.isArray(expanded.system.usage)) {
        expanded.system.usage = {};
      }

      const validUsageModes = ['passive', 'active', 'reaction', 'free', 'special', 'unlimited', 'once'];
      expanded.system.usage.mode = String(expanded.system.usage.mode || expanded.system.usageType || '').trim().toLowerCase();
      if (!validUsageModes.includes(expanded.system.usage.mode)) {
        expanded.system.usage.mode = 'passive';
      }

      expanded.system.usage.text = String(expanded.system.usage.text || '').trim();

      if (!expanded.system.usage.uses || typeof expanded.system.usage.uses !== 'object' || Array.isArray(expanded.system.usage.uses)) {
        expanded.system.usage.uses = { value: 0, max: 0 };
      }

      expanded.system.usage.uses.value = Number.isFinite(expanded.system.usage.uses.value) ? expanded.system.usage.uses.value : 0;
      expanded.system.usage.uses.max = Number.isFinite(expanded.system.usage.uses.max) ? expanded.system.usage.uses.max : 0;

      if (!expanded.system.usage.recharge || typeof expanded.system.usage.recharge !== 'object' || Array.isArray(expanded.system.usage.recharge)) {
        expanded.system.usage.recharge = { period: '', formula: '' };
      }

      expanded.system.usage.recharge.period = String(expanded.system.usage.recharge.period || '').trim();
      expanded.system.usage.recharge.formula = String(expanded.system.usage.recharge.formula || '').trim();
      expanded.system.usageType = expanded.system.usage.mode;

      if (Array.isArray(expanded.system?.keywords)) {
        expanded.system.keywords = expanded.system.keywords.map(keyword => String(keyword || '').trim()).filter(Boolean);
      } else {
        expanded.system.keywords = String(expanded.system?.keywords || '')
          .split(',')
          .map(keyword => keyword.trim())
          .filter(Boolean);
      }

      expanded.system.notes = String(expanded.system.notes || '').trim();
    }

    if (this.document.type === 'condition') {
      const validStackingModes = ['replace', 'stack', 'duration-merge', 'highest'];
      const validSeverities = ['minor', 'moderate', 'severe'];

      if (typeof expanded.system?.label !== 'string' || !expanded.system.label.trim()) {
        expanded.system.label = String(expanded.name || this.document.name || '').trim();
      } else {
        expanded.system.label = expanded.system.label.trim();
      }

      for (const field of ['category', 'tokenIcon']) {
        if (typeof expanded.system?.[field] !== 'string') expanded.system[field] = '';
        else expanded.system[field] = expanded.system[field].trim();
      }

      if (Array.isArray(expanded.system?.keywords)) {
        expanded.system.keywords = expanded.system.keywords.map(keyword => String(keyword || '').trim()).filter(Boolean);
      } else {
        expanded.system.keywords = String(expanded.system?.keywords || '')
          .split(',')
          .map(keyword => keyword.trim())
          .filter(Boolean);
      }

      if (Array.isArray(expanded.system?.appliesConditions)) {
        expanded.system.appliesConditions = expanded.system.appliesConditions.map(name => String(name || '').trim()).filter(Boolean);
      } else {
        expanded.system.appliesConditions = String(expanded.system?.appliesConditions || '')
          .split(',')
          .map(name => name.trim())
          .filter(Boolean);
      }

      if (Array.isArray(expanded.system?.progressionChain)) {
        expanded.system.progressionChain = expanded.system.progressionChain.map(name => String(name || '').trim()).filter(Boolean);
      } else {
        expanded.system.progressionChain = String(expanded.system?.progressionChain || '')
          .split(',')
          .map(name => name.trim())
          .filter(Boolean);
      }

      if (!validStackingModes.includes(expanded.system?.stacking)) {
        expanded.system.stacking = 'replace';
      }

      if (!validSeverities.includes(expanded.system?.severity)) {
        expanded.system.severity = 'moderate';
      }

      if (!Number.isFinite(expanded.system?.stacks) || expanded.system.stacks < 1) {
        expanded.system.stacks = 1;
      } else {
        expanded.system.stacks = Math.floor(expanded.system.stacks);
      }

      if (!Number.isFinite(expanded.system?.overlayPriority)) {
        const priorityMap = { minor: 10, moderate: 20, severe: 30 };
        expanded.system.overlayPriority = priorityMap[expanded.system.severity] ?? 20;
      }
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

  static async #onAddWeaveEffect(event, target) {
    const effects = foundry.utils.duplicate(this.document.system.appliesEffects || []);
    effects.push({ effectId: '', params: {} });
    await this.document.update({ 'system.appliesEffects': effects });
  }

  static async #onRemoveWeaveEffect(event, target) {
    const idx = Number(target.dataset.index);
    if (isNaN(idx)) return;
    const effects = foundry.utils.duplicate(this.document.system.appliesEffects || []);
    if (idx < 0 || idx >= effects.length) return;
    effects.splice(idx, 1);
    await this.document.update({ 'system.appliesEffects': effects });
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

    const firstRangedMode = modes.find(mode => ['ranged', 'thrown'].includes(mode?.type));

    await this.document.update({
      'system.attackModes': modes,
      'system.range': firstRangedMode?.range || { normal: 0, medium: 0, long: 0 }
    });
  }

  /**
   * Handle removing an attack mode
   */
  static async #onRemoveAttackMode(event, target) {
    const index = parseInt(target.dataset.index);
    const modes = foundry.utils.duplicate(this.document.system.attackModes || []);

    modes.splice(index, 1);

    const firstRangedMode = modes.find(mode => ['ranged', 'thrown'].includes(mode?.type));

    await this.document.update({
      'system.attackModes': modes,
      'system.range': firstRangedMode?.range || { normal: 0, medium: 0, long: 0 }
    });
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
