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
    if (itemData.type === 'shield') this._prepareShieldData(itemData);
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
    
    // Initialize DR structure with all three damage types
    if (!systemData.dr) {
      systemData.dr = {};
    }
    
    // Ensure all damage types have values
    if (systemData.dr.slashing === undefined || systemData.dr.slashing === null) {
      systemData.dr.slashing = 0;
    }
    if (systemData.dr.piercing === undefined || systemData.dr.piercing === null) {
      systemData.dr.piercing = 0;
    }
    if (systemData.dr.bludgeoning === undefined || systemData.dr.bludgeoning === null) {
      systemData.dr.bludgeoning = 0;
    }
    
    // Initialize stealth penalty
    if (!systemData.stealthPenalty) {
      systemData.stealthPenalty = 'none';
    }
    
    // Auto-compute don/doff times and swim penalties based on armor type
    const armorType = systemData.armorType || 'light';
    const armorProperties = {
      'light': { don: '1 minute', doff: '1 minute', swim: 'No penalty' },
      'medium': { don: '5 minutes', doff: '1 minute', swim: '+1 athletics die, swim speed 1/3' },
      'heavy': { don: '10 minutes', doff: '5 minutes', swim: '+2 athletics die, swim speed 1/4' }
    };
    
    const props = armorProperties[armorType] || armorProperties['light'];
    systemData.donTime = props.don;
    systemData.doffTime = props.doff;
    systemData.swimPenalty = props.swim;
    
    // Initialize shield metadata for shield items
    if (systemData.isShield === undefined || systemData.isShield === null) {
      systemData.isShield = false;
    }
    if (!Array.isArray(systemData.shieldAbilities)) {
      systemData.shieldAbilities = [];
    }
  }

  /**
   * Prepare Shield-specific data
   */
  _prepareShieldData(itemData) {
    const systemData = itemData.system;
    
    // Initialize shield type
    if (!systemData.shieldType) {
      systemData.shieldType = 'buckler';
    }
    
    // Ensure reactions array exists
    if (!Array.isArray(systemData.reactions)) {
      systemData.reactions = [];
    }
    
    // Ensure planted mode flag exists
    if (systemData.plantedMode === undefined) {
      systemData.plantedMode = false;
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
    game.legends.rollWeave(actor, item);
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
