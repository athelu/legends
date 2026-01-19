/**
 * D8 TTRPG NPC Sheet
 */
const { ActorSheet } = foundry.appv1.sheets;
export class D8NPCSheet extends ActorSheet {
  
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["legends", "sheet", "actor", "npc"],
      width: 600,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }
  
  /** @override */
  get template() {
    return `systems/legends/templates/actor/npc-sheet.hbs`;
  }
  
  /** @override */
  async getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);
    
    context.system = actorData.system;
    context.flags = actorData.flags;
    
    // Prepare NPC data
    this._prepareItems(context);
    
    return context;
  }
  
  /**
   * Organize Items
   */
  _prepareItems(context) {
    const weapons = [];
    const armor = [];
    const features = [];
    
    for (let item of context.items) {
      item.img = item.img || DEFAULT_TOKEN;
      
      if (item.type === 'weapon') weapons.push(item);
      else if (item.type === 'armor') armor.push(item);
      else features.push(item);
    }
    
    context.weapons = weapons;
    context.armor = armor;
    context.features = features;
  }
  
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    if (!this.isEditable) return;
    
    // Rollable abilities
    html.find('.rollable').click(this._onRoll.bind(this));
    html.find('.skill-roll').click(this._onSkillRoll.bind(this));
    html.find('.save-roll').click(this._onSaveRoll.bind(this));
    
    // Item controls
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
  }
  
  /**
   * Handle rolls
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    
    if (dataset.rollType === 'item') {
      const itemId = element.closest('.item').dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (item) return item.roll();
    }
  }
  
  /**
   * Handle skill rolls
   */
  async _onSkillRoll(event) {
    event.preventDefault();
    const skill = event.currentTarget.dataset.skill;
    return game.d8.rollSkillCheck(this.actor, skill);
  }
  
  /**
   * Handle saving throw rolls
   */
  async _onSaveRoll(event) {
    event.preventDefault();
    const saveType = event.currentTarget.dataset.save;
    return game.d8.rollSavingThrow(this.actor, saveType);
  }
  
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);
    const name = `New ${type.capitalize()}`;
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    delete itemData.system["type"];
    
    return await Item.create(itemData, {parent: this.actor});
  }
  
  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    return item.sheet.render(true);
  }
  
  async _onItemDelete(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    
    const confirmed = await Dialog.confirm({
      title: `Delete ${item.name}?`,
      content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`,
      defaultYes: false
    });
    
    if (confirmed) {
      await item.delete();
      li.slideUp(200, () => this.render(false));
    }
  }
}
