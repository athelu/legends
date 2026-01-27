/**
 * Extend the base Item class for D8 TTRPG
 */
export class D8Item extends Item {
  
  /** @override */
  prepareData() {
    super.prepareData();
  }
  
  /** @override */
  prepareBaseData() {
    // Item-specific data preparation
  }
  
  /** @override */
  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;
    const flags = itemData.flags.d8 || {};
    
    // Make calculations specific to item types
    if (itemData.type === 'weapon') this._prepareWeaponData(itemData);
    if (itemData.type === 'armor') this._prepareArmorData(itemData);
    if (itemData.type === 'weave') this._prepareWeaveData(itemData);
  }
  
  /**
   * Prepare Weapon-specific data
   */
  _prepareWeaponData(itemData) {
    const systemData = itemData.system;
    
    // Set default damage if not specified
    if (!systemData.damage.base) {
      systemData.damage.base = 6; // Standard weapon
    }
    
    // Set default damage type if not specified
    if (!systemData.damage.type) {
      systemData.damage.type = 'slashing';
    }
    
    // Ensure attackModes array exists with at least one mode
    if (!systemData.attackModes || systemData.attackModes.length === 0) {
      systemData.attackModes = [
        {
          name: "Melee",
          type: "melee",
          skill: "melee",
          damageAttr: "strength",
          defenseType: "melee",
          range: { normal: 0, medium: 0, long: 0 }
        }
      ];
    }
  }
    /**
   * Prepare Armor-specific data
   */
  _prepareArmorData(itemData) {
    const systemData = itemData.system;
    
    // Set default DR if not specified
    if (!systemData.dr.value) {
      systemData.dr.value = 0;
    }
  }
  
  /**
   * Prepare Weave-specific data
   */
  _prepareWeaveData(itemData) {
    const systemData = itemData.system;
    
    // Calculate total energy cost
    const primaryCost = systemData.energyCost?.primary?.cost || 0;
    const supportingCost = systemData.energyCost?.supporting?.cost || 0;
    systemData.totalEnergyCost = primaryCost + supportingCost;
    
    // Determine if simple or complex weave
    if (!systemData.weaveType) {
      systemData.weaveType = supportingCost > 0 ? 'complex' : 'simple';
    }
    
    // Set action cost based on weave type
    systemData.actionCost = systemData.weaveType === 'simple' ? 1 : 2;
  }
  
  /**
   * Handle item rolls
   */
  async roll() {
    const item = this;
    const actor = this.actor;
    
    if (!actor) {
      ui.notifications.warn("This item must be owned by an actor to be used.");
      return;
    }
    
    // Handle different item types
    switch (item.type) {
      case 'weapon':
        return this._rollWeapon();
      case 'weave':
        return this._rollWeave();
      case 'feat':
      case 'trait':
        return this._displayFeature();
      default:
        return this._displayDescription();
    }
  }
  
  /**
   * Roll a weapon attack
   */
  * Roll a weapon attack
  */
  async _rollWeapon() {
    const actor = this.actor;
    const item = this;
    
    // Use the new combat system
    return game.legends.combat.rollWeaponAttack(actor, item);
  }
  
  /**
   * Cast a weave
   */
  async _rollWeave() {
    const actor = this.actor;
    const item = this;
    
    // Check if actor has enough energy
    const totalCost = item.system.totalEnergyCost;
    if (actor.system.energy && actor.system.energy.value < totalCost) {
      ui.notifications.warn(`Not enough Energy! Need ${totalCost}, have ${actor.system.energy.value}`);
      return;
    }
    
    // Roll the weave
    game.d8.rollWeave(actor, item);
  }
  
  /**
   * Display a feature (feat/trait)
   */
  async _displayFeature() {
    const item = this;
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="d8-feature">
          <h3>${item.name}</h3>
          <div class="description">${item.system.description.value}</div>
          ${item.system.benefits ? `<div class="benefits"><strong>Benefits:</strong> ${item.system.benefits}</div>` : ''}
        </div>
      `
    });
  }
  
  /**
   * Display item description
   */
  async _displayDescription() {
    const item = this;
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="d8-item">
          <h3>${item.name}</h3>
          <div class="description">${item.system.description.value}</div>
        </div>
      `
    });
  }
  
  /**
   * Handle creating an owned item
   */
  async _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    
    // Auto-equip first armor/weapon if character has none equipped
    if (this.actor && (this.type === 'armor' || this.type === 'weapon')) {
      const hasEquipped = this.actor.items.filter(i => 
        i.type === this.type && i.system.equipped && i.id !== this.id
      ).length > 0;
      
      if (!hasEquipped) {
        await this.update({ 'system.equipped': true });
      }
    }
  }
}
