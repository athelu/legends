/**
 * D8 TTRPG Item Sheet
 */
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
    
    // Enrich description
    context.enrichedDescription = await TextEditor.enrichHTML(context.system.description?.value || "", {
      secrets: this.item.isOwner,
      async: true
    });
    
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
  }
  
  /**
   * Handle item rolls
   */
  async _onItemRoll(event) {
    event.preventDefault();
    return this.item.roll();
  }
}
