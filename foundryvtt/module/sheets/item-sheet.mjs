/**
 * D8 TTRPG Item Sheet
 */
const { ItemSheet } = foundry.appv1.sheets;

export class D8ItemSheet extends ItemSheet {
  
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["legends", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }
  
  /** @override */
  get template() {
    const path = "systems/legends/templates/item";
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }
  
  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = this.item.toObject(false);
    
    context.system = itemData.system;
    context.flags = itemData.flags;
    
    // CRITICAL: Set these for the editor helper
    context.owner = this.item.isOwner;
    context.editable = this.isEditable;
    
    // Enrich description
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    context.enrichedDescription = await TextEditor.enrichHTML(
      context.system.description?.value || "", 
      {
        secrets: this.item.isOwner,
        async: true
      }
    );
    
    // Add property descriptions for weapons (Legends system)
    if (this.item.type === 'weapon') {
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
    if (this.item.type === 'armor') {
      // FILTER OUT EMPTY PROPERTY VALUES!
      if (context.system.properties && Array.isArray(context.system.properties)) {
        context.system.properties = context.system.properties.filter(prop => 
          prop && typeof prop === 'string' && prop.trim() !== ''
        );
      }
    }
    
    // Add type-specific data for weaves
    if (this.item.type === 'weave') {
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

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
  // Everything uses jQuery
  if (typeof html.find !== 'function') {
    html = $(html);
  }
 
  // Attack mode management
  html.find('.add-attack-mode').click(this._onAddAttackMode.bind(this));
  html.find('.remove-attack-mode').click(this._onRemoveAttackMode.bind(this));


    if (!this.isEditable) return;
    
    // Roll item
    html.find('.item-roll').click(this._onItemRoll.bind(this));
    // Effect management for feats
    html.find('.add-effect').click(this._onAddEffect.bind(this));
    html.find('.remove-effect').click(this._onRemoveEffect.bind(this));
    // Attach improved autocomplete for effect targets (datalist-based)
    html.find('input[list="effects-targets"]').each((i, el) => {
      const $el = $(el);
      $el.off('input.featTarget').on('input.featTarget', this._onEffectTargetInput.bind(this));
      $el.off('focus.featTarget').on('focus.featTarget', this._onEffectTargetInput.bind(this));
      $el.off('blur.featTarget').on('blur.featTarget', this._onEffectTargetBlur.bind(this));
    });
    
    // ===================================================================
    // ARMOR CONDITIONAL DISPLAY - Added from armor-conditional-display.mjs
    // Handle armor type changes to show/hide relevant fields
    // ===================================================================
    html.find('.armor-type-select').change(this._onArmorTypeChange.bind(this));
  }

  _onEffectTargetInput(event) {
    const input = event.currentTarget;
    const $input = $(input);
    const listId = $input.attr('list');
    if (!listId) return;
    const dataList = document.getElementById(listId);
    if (!dataList) return;

    const raw = $input.val() || '';
    // Get current token after last comma
    const parts = raw.split(',');
    const token = parts[parts.length - 1].trim().toLowerCase();

    // Build suggestions
    const options = Array.from(dataList.options).map(o => ({ value: o.value, label: o.value }));
    const matches = options.filter(o => o.value.toLowerCase().includes(token));

    // Remove any existing suggestion box
    $('.feat-target-suggestions').remove();

    if (matches.length === 0) return;

    // Create suggestion box
    const box = $('<div class="feat-target-suggestions" style="position: absolute; z-index: 10000; background: #fff; border: 1px solid #ccc; max-height: 200px; overflow: auto; padding: 4px;"></div>');
    matches.slice(0, 20).forEach(m => {
      const item = $(`<div class="suggestion-item" style="padding:4px; cursor: pointer;">${m.label}</div>`);
      item.on('mousedown', (ev) => {
        ev.preventDefault();
        // Insert selection into input replacing current token
        const current = $input.val() || '';
        const idx = current.lastIndexOf(',');
        let prefix = '';
        if (idx >= 0) prefix = current.substring(0, idx + 1) + ' ';
        const newVal = (prefix + m.value).replace(/\s+,/, ',');
        $input.val(newVal);
        $input.trigger('change');
        $('.feat-target-suggestions').remove();
      });
      box.append(item);
    });

    // Position box under input
    $('body').append(box);
    const offset = $input.offset();
    box.css({ top: offset.top + $input.outerHeight(), left: offset.left, minWidth: $input.outerWidth() });
  }

  _onEffectTargetBlur(event) {
    // Delay removal to allow click handler to fire
    setTimeout(() => $('.feat-target-suggestions').remove(), 150);
  }
  
  /**
   * Handle item rolls
   */
  async _onItemRoll(event) {
    event.preventDefault();
    return this.item.roll();
  }

  /**
   * Add a new effect entry to the feat's system.effects array
   */
  async _onAddEffect(event) {
    event.preventDefault();
    const effects = foundry.utils.duplicate(this.item.system.effects || []);
    effects.push({
      id: foundry.utils.randomID(),
      type: 'custom',
      target: '',
      value: '',
      actionType: 'passive',
      condition: '',
      description: ''
    });
    await this.item.update({ 'system.effects': effects });
  }

  /**
   * Remove an effect by index
   */
  async _onRemoveEffect(event) {
    event.preventDefault();
    const idx = Number(event.currentTarget.dataset.index);
    if (isNaN(idx)) return;
    const effects = foundry.utils.duplicate(this.item.system.effects || []);
    if (idx < 0 || idx >= effects.length) return;
    effects.splice(idx, 1);
    await this.item.update({ 'system.effects': effects });
  }
  
  /**
   * Handle armor type changes to show/hide relevant fields
   * This is triggered when the armor type dropdown changes
   */
  _onArmorTypeChange(event) {
    const armorType = event.currentTarget.value;
    const form = $(event.currentTarget).closest('form');
    
    const armorFields = form.find('.armor-only-fields');
    const shieldFields = form.find('.shield-only-fields');
    
    if (armorType === 'shield') {
      armorFields.hide();
      shieldFields.show();
    } else {
      armorFields.show();
      shieldFields.hide();
    }
  }

    /**
   * Handle adding a new attack mode
   */
  async _onAddAttackMode(event) {
    event.preventDefault();
    const modes = this.item.system.attackModes || [];
    
    modes.push({
      name: "New Mode",
      type: "melee",
      skill: "melee",
      damageAttr: "strength",
      defenseType: "melee",
      range: { normal: 0, medium: 0, long: 0 }
    });
    
    await this.item.update({ 'system.attackModes': modes });
  }

  /**
   * Handle removing an attack mode
   */
  async _onRemoveAttackMode(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const modes = foundry.utils.duplicate(this.item.system.attackModes || []);
    
    modes.splice(index, 1);
    
    await this.item.update({ 'system.attackModes': modes });
  }
}
