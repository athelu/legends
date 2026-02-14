/**
 * Extend the base Actor class for D8 TTRPG
 */
import * as featEffects from "../feat-effects.mjs";

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
  // Aggregate DR per damage type from equipped armor
  let slashingTotal = 0;
  let piercingTotal = 0;
  let bludgeoningTotal = 0;

  // Store armor pieces for reference
  systemData.equippedArmor = [];

  for (let item of actorData.items) {
    if (item.type === 'armor' && item.system.equipped) {
      // If armor uses per-type DR object, add those. If legacy single value exists, apply to all types.
      if (item.system.dr && typeof item.system.dr === 'object') {
        slashingTotal += item.system.dr.slashing || 0;
        piercingTotal += item.system.dr.piercing || 0;
        bludgeoningTotal += item.system.dr.bludgeoning || 0;
      } else if (item.system.dr && (item.system.dr.value !== undefined)) {
        // legacy single-value DR (apply to all types)
        const v = item.system.dr.value || 0;
        slashingTotal += v;
        piercingTotal += v;
        bludgeoningTotal += v;
      }

      systemData.equippedArmor.push({
        name: item.name,
        dr: item.system.dr || {},
        isShield: false
      });
    }
    
    // Shields are tracked separately, not included in armor DR aggregation
    if (item.type === 'shield' && item.system.equipped) {
      if (!systemData.equippedShields) systemData.equippedShields = [];
      systemData.equippedShields.push({
        name: item.name,
        shieldType: item.system.shieldType,
        reactions: item.system.reactions || []
      });
    }
  }

  // Store aggregated DR totals and a simple summary value
  if (!systemData.dr) systemData.dr = {};
  systemData.dr.slashing = slashingTotal;
  systemData.dr.piercing = piercingTotal;
  systemData.dr.bludgeoning = bludgeoningTotal;
  // summary: best protection
    // Incorporate feat-provided DR and other modifiers
    const featMods = featEffects.computeFeatModifiers(this);
    systemData.dr.slashing = slashingTotal + (featMods.dr.slashing || 0);
    systemData.dr.piercing = piercingTotal + (featMods.dr.piercing || 0);
    systemData.dr.bludgeoning = bludgeoningTotal + (featMods.dr.bludgeoning || 0);
    systemData.dr.total = Math.max(systemData.dr.slashing, systemData.dr.piercing, systemData.dr.bludgeoning);

    // Apply skill and attribute effective values from feats
    systemData.skillsEffective = {};
    for (const [k, v] of Object.entries(systemData.skills || {})) {
      const mod = featMods.skills[k] || 0;
      systemData.skillsEffective[k] = (typeof v === 'object' ? (v.value ?? 0) : v) + mod;
    }

    systemData.attributesEffective = {};
    for (const [attrKey, attrObj] of Object.entries(systemData.attributes || {})) {
      const base = attrObj?.value ?? 0;
      const mod = featMods.attributes[attrKey] || 0;
      systemData.attributesEffective[attrKey] = base + mod;
    }

    // Attach computed actions/reactions for UI
    systemData.featActions = featMods.actions || [];
    systemData.featReactions = featMods.reactions || [];
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

    // For characters, prefer effective (computed) attribute/skill totals
    if (this.type === 'character') {
      // Clone attributes and overwrite values with effective totals when available
      const baseAttributes = this.system.attributes || {};
      const attrEff = this.system.attributesEffective || {};
      const attributes = {};
      for (const [k, v] of Object.entries(baseAttributes)) {
        const baseVal = v?.value ?? 0;
        const total = (attrEff[k] !== undefined) ? attrEff[k] : baseVal;
        attributes[k] = { ...(typeof v === 'object' ? v : {}), value: total };
      }
      data.attributes = attributes;

      // Shortcuts (totals)
      data.str = data.attributes.strength?.value ?? 0;
      data.con = data.attributes.constitution?.value ?? 0;
      data.agi = data.attributes.agility?.value ?? 0;
      data.dex = data.attributes.dexterity?.value ?? 0;
      data.int = data.attributes.intelligence?.value ?? 0;
      data.wis = data.attributes.wisdom?.value ?? 0;
      data.cha = data.attributes.charisma?.value ?? 0;
      data.lck = data.attributes.luck?.value ?? 0;
      data.currentLuck = this.system.luck?.current ?? data.lck;

      // Skills: expose totals (and preserve object shape when present)
      const baseSkills = this.system.skills || {};
      const skillsEff = this.system.skillsEffective || {};
      const skills = {};
      for (const [k, v] of Object.entries(baseSkills)) {
        const baseVal = (typeof v === 'object') ? (v.value ?? 0) : (v ?? 0);
        const total = (skillsEff[k] !== undefined) ? skillsEff[k] : baseVal;
        if (typeof v === 'object') skills[k] = { ...(v || {}), value: total };
        else skills[k] = total;
      }
      data.skills = skills;
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
