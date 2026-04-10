/**
 * Extend the base Actor class for D8 TTRPG
 */
import * as featEffects from "../feat-effects.mjs";
import { buildAbilityRechargeUpdate, buildFeatRechargeUpdate } from "./item.mjs";
import { getTierInfoFromXp } from "../progression.mjs";
import { normalizeSkillKey, syncSkillAliases } from "../skill-utils.mjs";
import { normalizeTrainingState } from "../training.mjs";

const NO_REST_BENEFIT_CONDITIONS = new Set(['Poisoned (Deadly)']);
const NO_SHORT_REST_BENEFIT_CONDITIONS = new Set(['Exhausted', 'Severely Exhausted', 'Near Collapse']);
const NO_SHORT_REST_HP_CONDITIONS = new Set(['Fatigued']);
const HALF_REST_HP_CONDITIONS = new Set(['Poisoned (Weak)', 'Poisoned (Strong)']);
const EXHAUSTION_CONDITION_CHAIN = ['Fatigued', 'Exhausted', 'Severely Exhausted', 'Near Collapse', 'Collapse'];

export class D8Actor extends Actor {
  
  /** @override */
  prepareData() {
    super.prepareData();
  }
  
  /** @override */
  prepareBaseData() {
    if ((this.type === 'character' || this.type === 'npc') && this.system?.skills) {
      syncSkillAliases(this.system.skills);
    }

    const usesMagicalEnergy = this.type === 'character'
      && !!this.system?.magicalTrait?.type
      && this.system.magicalTrait.type !== 'alchemical-tradition';

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
    if (usesMagicalEnergy && this.system.energy) {
      this.system.energy.max = this._calculateEnergyPool();
      
      // Ensure current energy doesn't exceed max
      if (this.system.energy.current > this.system.energy.max) {
        this.system.energy.current = this.system.energy.max;
      }
    } else if (this.system.energy) {
      this.system.energy.max = 0;
      this.system.energy.current = 0;
    }
    
    // Set luck max from attribute
    if (this.system.luck && this.system.attributes.luck) {
      this.system.luck.max = this.system.attributes.luck.value;
      
      // Ensure current luck doesn't exceed max
      if (this.system.luck.current > this.system.luck.max) {
        this.system.luck.current = this.system.luck.max;
      }
    }

    if (this.type === 'character') {
      const tierInfo = getTierInfoFromXp(this.system?.tier?.xp ?? 0);
      this.system.tier = this.system.tier || {};
      this.system.tier.xp = tierInfo.xp;
      this.system.tier.value = tierInfo.current;
      this.system.tier.unspent = Math.min(tierInfo.xp, Math.max(0, Number(this.system.tier.unspent || 0)));
      this.system.progression = this.system.progression || {};
      this.system.progression.phase = this.system.progression.phase === 'creation' ? 'creation' : 'advancement';
      this.system.progression.manualOverride = Boolean(this.system.progression.manualOverride);
      this.system.progression.transactions = Array.isArray(this.system.progression.transactions)
        ? this.system.progression.transactions
        : [];
      this.system.training = normalizeTrainingState(this.system.training);
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
  const ancestryEffects = this._collectAncestryEffects(actorData.items);
  // Aggregate DR per damage type from equipped armor
  let slashingTotal = 0;
  let piercingTotal = 0;
  let bludgeoningTotal = 0;

  // Store armor pieces for reference
  systemData.equippedArmor = [];
  systemData.equippedShields = [];

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
      systemData.equippedShields.push({
        name: item.name,
        shieldType: item.system.shieldType,
        reactions: item.system.reactions || [],
        linkedAbilities: item.system.linkedAbilities || []
      });
    }
  }

  // Store aggregated DR totals and a simple summary value
  if (!systemData.dr) systemData.dr = {};
  systemData.ancestryEffects = ancestryEffects;
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
      const canonicalKey = normalizeSkillKey(k) || k;
      const mod = featMods.skills[canonicalKey] || featMods.skills[k] || 0;
      systemData.skillsEffective[k] = (typeof v === 'object' ? (v.value ?? 0) : v) + mod;
    }

    systemData.attributesEffective = {};
    for (const [attrKey, attrObj] of Object.entries(systemData.attributes || {})) {
      const base = attrObj?.value ?? 0;
      const mod = (ancestryEffects.attributes[attrKey] || 0) + (featMods.attributes[attrKey] || 0);
      systemData.attributesEffective[attrKey] = base + mod;
    }

    // Attach computed actions/reactions for UI
    systemData.featActions = featMods.actions || [];
    systemData.featReactions = featMods.reactions || [];
  }

  _getActiveConditionNames() {
    return new Set(
      this.items
        .filter(item => item.type === 'condition')
        .map(item => String(item.name || '').trim())
        .filter(Boolean)
    );
  }

  getRestRecoveryState(restType) {
    const conditionNames = this._getActiveConditionNames();
    const blockedBy = Array.from(conditionNames).find(name => NO_REST_BENEFIT_CONDITIONS.has(name)) || '';
    const shortRestBlockedBy = restType === 'shortRest' && !blockedBy
      ? Array.from(conditionNames).find(name => NO_SHORT_REST_BENEFIT_CONDITIONS.has(name)) || ''
      : '';
    const hpBlockedBy = blockedBy
      || (restType === 'shortRest' ? Array.from(conditionNames).find(name => NO_SHORT_REST_HP_CONDITIONS.has(name)) || '' : '');
    const hpHalvedBy = hpBlockedBy
      ? ''
      : Array.from(conditionNames).find(name => HALF_REST_HP_CONDITIONS.has(name)) || '';
    const exhaustionCondition = [...EXHAUSTION_CONDITION_CHAIN].reverse().find(name => conditionNames.has(name)) || '';

    return {
      blockedBy,
      shortRestBlockedBy,
      hpBlockedBy,
      hpHalvedBy,
      exhaustionCondition,
      blocksAllBenefits: Boolean(blockedBy),
      blocksShortRestBenefits: Boolean(shortRestBlockedBy),
      blocksHpRecovery: Boolean(hpBlockedBy),
      halvesHpRecovery: Boolean(hpHalvedBy),
    };
  }

  _collectAncestryEffects(items) {
    const emptyAttributes = {
      strength: 0,
      constitution: 0,
      agility: 0,
      dexterity: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
      luck: 0
    };

    const ancestryItems = items.filter(item => item.type === 'ancestry');
    const primary = ancestryItems[0] ?? null;

    const effects = {
      count: ancestryItems.length,
      primaryName: primary?.name ?? '',
      attributes: { ...emptyAttributes },
      traits: '',
      languages: '',
      senses: '',
      specialAbilities: '',
      culture: primary?.system?.culture ?? '',
      physicalDescription: primary?.system?.physicalDescription ?? '',
      lifespan: Number.isFinite(primary?.system?.lifespan) ? primary.system.lifespan : 0,
      requiresGMApproval: ancestryItems.some(item => item.system?.requiresGMApproval)
    };

    const traitNames = [];
    const languages = [];
    const senses = [];
    const specialAbilities = [];

    for (const ancestry of ancestryItems) {
      const bonuses = ancestry.system?.bonuses?.attributes;
      const legacy = ancestry.system?.abilityModifiers;

      for (const attrKey of Object.keys(emptyAttributes)) {
        const value = Number.isFinite(bonuses?.[attrKey])
          ? bonuses[attrKey]
          : (Number.isFinite(legacy?.[attrKey]) ? legacy[attrKey] : 0);
        effects.attributes[attrKey] += value;
      }

      const traitText = typeof ancestry.system?.traits === 'string' ? ancestry.system.traits : '';
      for (const part of traitText.split(',')) {
        const cleaned = part.trim();
        if (cleaned && !traitNames.includes(cleaned)) traitNames.push(cleaned);
      }

      for (const field of [
        ['languages', languages],
        ['senses', senses],
        ['specialAbilities', specialAbilities]
      ]) {
        const [key, collection] = field;
        const value = ancestry.system?.[key];
        if (typeof value === 'string' && value.trim()) {
          collection.push(value.trim());
        }
      }
    }

    effects.traits = traitNames.join(', ');
    effects.languages = [...new Set(languages)].join('\n');
    effects.senses = [...new Set(senses)].join('\n');
    effects.specialAbilities = [...new Set(specialAbilities)].join('\n\n');
    return effects;
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
   * Take a short rest (1 hour)
   */
  async shortRest() {
    const updates = {};
    const restoredAbilities = [];
    const restoredFeats = [];
    const restState = this.getRestRecoveryState('shortRest');
    
    // Regain HP equal to Constitution
    const con = this.system.attributes.constitution.value;
    const hpRecovery = restState.blocksHpRecovery
      ? 0
      : Math.floor(con / (restState.halvesHpRecovery ? 2 : 1));
    const newHP = Math.min(this.system.hp.value + hpRecovery, this.system.hp.max);
    updates['system.hp.value'] = newHP;
    
    // Regain 1 Luck
    if (!restState.blocksAllBenefits && !restState.blocksShortRestBenefits && this.system.luck) {
      const newLuck = Math.min(this.system.luck.current + 1, this.system.luck.max);
      updates['system.luck.current'] = newLuck;
    }

    const abilityUpdates = restState.blocksAllBenefits || restState.blocksShortRestBenefits
      ? []
      : this.items
          .filter(item => item.type === 'ability')
          .map(item => {
            const update = buildAbilityRechargeUpdate(item, 'shortRest');
            if (update) restoredAbilities.push(item.name);
            return update;
          })
          .filter(Boolean);

    const featUpdates = restState.blocksAllBenefits || restState.blocksShortRestBenefits
      ? []
      : this.items
          .filter(item => item.type === 'feat')
          .map(item => {
            const update = buildFeatRechargeUpdate(item, 'shortRest');
            if (update) restoredFeats.push(item.name);
            return update;
          })
          .filter(Boolean);
    
    await this.update(updates);

    if (abilityUpdates.length > 0 || featUpdates.length > 0) {
      await this.updateEmbeddedDocuments('Item', [...abilityUpdates, ...featUpdates]);
    }
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="d8-rest">
          <h3>Short Rest</h3>
          <p>${this.name} takes a short rest (1 hour)</p>
          <ul>
            <li>${hpRecovery > 0 ? `Regained ${hpRecovery} HP` : 'Recovered no HP'}</li>
            <li>${restState.blocksAllBenefits || restState.blocksShortRestBenefits ? 'Recovered no Luck' : 'Regained 1 Luck'}</li>
            ${restoredAbilities.length > 0 ? `<li>Recharged abilities: ${restoredAbilities.join(', ')}</li>` : ''}
            ${restoredFeats.length > 0 ? `<li>Recharged feats: ${restoredFeats.join(', ')}</li>` : ''}
            ${restState.blocksAllBenefits ? `<li>No short rest benefits due to ${restState.blockedBy}</li>` : ''}
            ${!restState.blocksAllBenefits && restState.blocksShortRestBenefits ? `<li>No short rest benefits due to ${restState.shortRestBlockedBy}</li>` : ''}
            ${!restState.blocksAllBenefits && !restState.blocksShortRestBenefits && restState.blocksHpRecovery ? `<li>No HP recovery due to ${restState.hpBlockedBy}</li>` : ''}
            ${!restState.blocksHpRecovery && restState.halvesHpRecovery ? `<li>HP recovery halved due to ${restState.hpHalvedBy}</li>` : ''}
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
    const usesMagicalEnergy = !!this.system?.magicalTrait?.type && this.system.magicalTrait.type !== 'alchemical-tradition';
    const restoresChannelDivinity = (this.system.channelDivinity?.max ?? 0) > 0;
    const restoredAbilities = [];
    const restoredFeats = [];
    const restState = this.getRestRecoveryState('longRest');
    let exhaustionRecovery = '';
    
    // Regain HP equal to Constitution × 4
    const con = this.system.attributes.constitution.value;
    const hpRecovery = restState.blocksHpRecovery
      ? 0
      : Math.floor((con * 4) / (restState.halvesHpRecovery ? 2 : 1));
    const newHP = Math.min(this.system.hp.value + hpRecovery, this.system.hp.max);
    updates['system.hp.value'] = newHP;
    
    // Restore all Luck
    if (!restState.blocksAllBenefits && this.system.luck) {
      updates['system.luck.current'] = this.system.luck.max;
    }
    
    // Restore all Energy
    if (!restState.blocksAllBenefits && usesMagicalEnergy && this.system.energy) {
      updates['system.energy.current'] = this.system.energy.max;
    }

    if (!restState.blocksAllBenefits && restoresChannelDivinity) {
      updates['system.channelDivinity.current'] = this.system.channelDivinity.max;
    }
    
    // Clear temporary HP
    updates['system.hp.temp'] = 0;

    const abilityUpdates = restState.blocksAllBenefits
      ? []
      : this.items
          .filter(item => item.type === 'ability')
          .map(item => {
            const update = buildAbilityRechargeUpdate(item, 'longRest');
            if (update) restoredAbilities.push(item.name);
            return update;
          })
          .filter(Boolean);

    const featUpdates = restState.blocksAllBenefits
      ? []
      : this.items
          .filter(item => item.type === 'feat')
          .map(item => {
            const update = buildFeatRechargeUpdate(item, 'longRest');
            if (update) restoredFeats.push(item.name);
            return update;
          })
          .filter(Boolean);
    
    await this.update(updates);

    if (abilityUpdates.length > 0 || featUpdates.length > 0) {
      await this.updateEmbeddedDocuments('Item', [...abilityUpdates, ...featUpdates]);
    }

    if (!restState.blocksAllBenefits && restState.exhaustionCondition) {
      const currentIndex = EXHAUSTION_CONDITION_CHAIN.indexOf(restState.exhaustionCondition);
      const nextCondition = currentIndex > 0 ? EXHAUSTION_CONDITION_CHAIN[currentIndex - 1] : '';
      await game.legends?.removeCondition?.(this, restState.exhaustionCondition);
      if (nextCondition) {
        await game.legends?.applyCondition?.(this, nextCondition, { source: 'long-rest-recovery' });
        exhaustionRecovery = `${restState.exhaustionCondition} downgraded to ${nextCondition}`;
      } else {
        exhaustionRecovery = `${restState.exhaustionCondition} removed`;
      }
    }
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="d8-rest">
          <h3>Long Rest</h3>
          <p>${this.name} takes a long rest (8 hours)</p>
          <ul>
            <li>${hpRecovery > 0 ? `Regained ${hpRecovery} HP` : 'Recovered no HP'}</li>
            <li>${restState.blocksAllBenefits ? 'Recovered no Luck' : `Restored all Luck to ${this.system.luck.max}`}</li>
            ${!restState.blocksAllBenefits && usesMagicalEnergy && this.system.energy ? `<li>Restored all Energy to ${this.system.energy.max}</li>` : ''}
            ${!restState.blocksAllBenefits && restoresChannelDivinity ? `<li>Restored all Channel Divinity uses to ${this.system.channelDivinity.max}</li>` : ''}
            ${restoredAbilities.length > 0 ? `<li>Recharged abilities: ${restoredAbilities.join(', ')}</li>` : ''}
            ${restoredFeats.length > 0 ? `<li>Recharged feats: ${restoredFeats.join(', ')}</li>` : ''}
            ${restState.blocksAllBenefits ? `<li>No rest benefits due to ${restState.blockedBy}</li>` : ''}
            ${!restState.blocksHpRecovery && restState.halvesHpRecovery ? `<li>HP recovery halved due to ${restState.hpHalvedBy}</li>` : ''}
            ${exhaustionRecovery ? `<li>${exhaustionRecovery}</li>` : ''}
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
