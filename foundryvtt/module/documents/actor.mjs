/**
 * Extend the base Actor class for D8 TTRPG
 */
export class D8Actor extends Actor {
  
  /** @override */
  prepareData() {
    super.prepareData();
  }
  
  /** @override */
  prepareBaseData() {
    // Calculate HP based on Constitution
    if (this.type === 'character' || this.type === 'npc') {
      const con = this.system.attributes.constitution.value;
      this.system.hp.max = con * 8;
      
      // Ensure current HP doesn't exceed max
      if (this.system.hp.value > this.system.hp.max) {
        this.system.hp.value = this.system.hp.max;
      }
    }
    
    // Calculate Energy Pool for magical characters
    if (this.type === 'character' && this.system.energy) {
      this.system.energy.max = this._calculateEnergyPool();
      
      // Ensure current energy doesn't exceed max
      if (this.system.energy.value > this.system.energy.max) {
        this.system.energy.value = this.system.energy.max;
      }
    }
    
    // Set luck max from attribute
    if (this.system.luck && this.system.attributes.luck) {
      this.system.luck.max = this.system.attributes.luck.value;
      
      // Ensure current luck doesn't exceed max
      if (this.system.luck.current > this.system.luck.max) {
        this.system.luck.current = this.system.luck.max;
      }
    }
  }
  
  /** @override */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.d8 || {};
    
    // Make separate methods for different Actor types
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'npc') this._prepareNPCData(actorData);
  }
  
  /**
   * Prepare Character-specific data
   */
  _prepareCharacterData(actorData) {
    const systemData = actorData.system;
    
    // Calculate DR from equipped armor
    let totalDR = 0;
    for (let item of actorData.items) {
      if (item.type === 'armor' && item.system.equipped) {
        totalDR += item.system.dr.value;
      }
    }
    systemData.dr.value = totalDR + (systemData.dr.bonus || 0);
  }
  
  /**
   * Prepare NPC-specific data
   */
  _prepareNPCData(actorData) {
    const systemData = actorData.system;
    // NPC-specific calculations can go here
  }
  
  /**
   * Calculate Energy Pool
   * Formula: (Sum of 8 Potentials) + (Casting Stat × 2) + Constitution + (Total Mastery Ranks ÷ 2, rounded down)
   */
  _calculateEnergyPool() {
    const systemData = this.system;
    
    if (!systemData.potentials) return 0;
    
    // Sum of all Potentials
    let potentialSum = 0;
    for (let [key, potential] of Object.entries(systemData.potentials)) {
      potentialSum += potential.value;
    }
    
    // Get casting stat value
    const castingStat = systemData.castingStat?.value || 'intelligence';
    const castingStatValue = systemData.attributes[castingStat]?.value || 0;
    
    // Constitution
    const constitution = systemData.attributes.constitution.value;
    
    // Sum of all Mastery ranks
    let masterySum = 0;
    for (let [key, mastery] of Object.entries(systemData.mastery)) {
      masterySum += mastery.value;
    }
    
    return potentialSum + (castingStatValue * 2) + constitution + Math.floor(masterySum / 2);
  }
  
  /**
   * Override getRollData() to provide data for inline rolls
   */
  getRollData() {
    const data = {...super.getRollData()};
    
    // Add convenience shortcuts
    if (this.type === 'character') {
      data.str = this.system.attributes.strength.value;
      data.con = this.system.attributes.constitution.value;
      data.agi = this.system.attributes.agility.value;
      data.dex = this.system.attributes.dexterity.value;
      data.int = this.system.attributes.intelligence.value;
      data.wis = this.system.attributes.wisdom.value;
      data.cha = this.system.attributes.charisma.value;
      data.lck = this.system.attributes.luck.value;
      data.currentLuck = this.system.luck?.current || data.lck;
    }
    
    return data;
  }
  
  /**
   * Take a short rest (10 minutes)
   */
  async shortRest() {
    const updates = {};
    
    // Regain HP equal to Constitution
    const con = this.system.attributes.constitution.value;
    const newHP = Math.min(this.system.hp.value + con, this.system.hp.max);
    updates['system.hp.value'] = newHP;
    
    // Regain 1 Luck
    if (this.system.luck) {
      const newLuck = Math.min(this.system.luck.current + 1, this.system.luck.max);
      updates['system.luck.current'] = newLuck;
    }
    
    await this.update(updates);
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="d8-rest">
          <h3>Short Rest</h3>
          <p>${this.name} takes a short rest (10 minutes)</p>
          <ul>
            <li>Regained ${con} HP</li>
            <li>Regained 1 Luck</li>
          </ul>
        </div>
      `
    });
  }
  
  /**
   * Take a long rest (8 hours)
   */
  async longRest() {
    const updates = {};
    
    // Regain HP equal to Constitution × 4
    const con = this.system.attributes.constitution.value;
    const newHP = Math.min(this.system.hp.value + (con * 4), this.system.hp.max);
    updates['system.hp.value'] = newHP;
    
    // Restore all Luck
    if (this.system.luck) {
      updates['system.luck.current'] = this.system.luck.max;
    }
    
    // Restore all Energy
    if (this.system.energy) {
      updates['system.energy.value'] = this.system.energy.max;
    }
    
    // Clear temporary HP
    updates['system.hp.temp'] = 0;
    
    await this.update(updates);
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="d8-rest">
          <h3>Long Rest</h3>
          <p>${this.name} takes a long rest (8 hours)</p>
          <ul>
            <li>Regained ${con * 4} HP</li>
            <li>Restored all Luck to ${this.system.luck.max}</li>
            ${this.system.energy ? `<li>Restored all Energy to ${this.system.energy.max}</li>` : ''}
          </ul>
        </div>
      `
    });
  }
  
  /**
   * Spend luck to modify a die result
   * @param {number} amount - Amount of luck to spend
   */
  async spendLuck(amount = 1) {
    if (!this.system.luck) return;
    
    const current = this.system.luck.current;
    if (current < amount) {
      ui.notifications.warn(`Not enough Luck! Current: ${current}, Needed: ${amount}`);
      return false;
    }
    
    await this.update({ 'system.luck.current': current - amount });
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="d8-luck">
          <p>${this.name} spends ${amount} Luck</p>
          <p>Remaining Luck: ${current - amount}</p>
        </div>
      `
    });
    
    return true;
  }
}
