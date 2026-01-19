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
    
    // Add type-specific data
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
    
    if (!this.isEditable) return;
    
    // Roll item
    html.find('.item-roll').click(this._onItemRoll.bind(this));
    
    // ===================================================================
    // ARMOR CONDITIONAL DISPLAY - Added from armor-conditional-display.mjs
    // Handle armor type changes to show/hide relevant fields
    // ===================================================================
    html.find('.armor-type-select').change(this._onArmorTypeChange.bind(this));
  }
  
  /**
   * Handle item rolls
   */
  async _onItemRoll(event) {
    event.preventDefault();
    return this.item.roll();
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
}
