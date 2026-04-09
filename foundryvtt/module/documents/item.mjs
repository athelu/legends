import { showSkillCheckDialog } from "../dice.mjs";
import * as featEffects from "../feat-effects.mjs";
import { getSkillValue, normalizeSkillKey, SKILL_ATTRIBUTE_KEYS, SKILL_LABELS } from "../skill-utils.mjs";

function slugifyActionName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
    if (itemData.type === 'equipment') this._prepareEquipmentData(itemData);
    if (itemData.type === 'weave') this._prepareWeaveData(itemData);
    if (itemData.type === 'feat') this._prepareFeatData(itemData);
    if (itemData.type === 'trait') this._prepareTraitData(itemData);
    if (itemData.type === 'flaw') this._prepareFlawData(itemData);
    if (itemData.type === 'background') this._prepareBackgroundData(itemData);
    if (itemData.type === 'ancestry') this._prepareAncestryData(itemData);
    if (itemData.type === 'action') this._prepareActionData(itemData);
    if (itemData.type === 'ability') this._prepareAbilityData(itemData);
    if (itemData.type === 'effect') this._prepareEffectData(itemData);
    if (itemData.type === 'condition') this._prepareConditionData(itemData);
  }

  _createDefaultRecoveryData(includeOnExpire = false) {
    const recovery = {
      trigger: 'onEvent',
      method: 'none',
      removeOnSuccess: false,
      promptPlayer: false,
      chatMessage: '',
      save: null,
      check: {
        skill: '',
        attribute: '',
        skills: [],
        attributes: [],
        opposed: false,
        label: '',
      },
      downgrades: {},
      assistance: null,
    };

    if (includeOnExpire) {
      recovery.onExpire = '';
    }

    return recovery;
  }

  _normalizeRecoveryData(recoveryData, { includeOnExpire = false } = {}) {
    const normalized = this._createDefaultRecoveryData(includeOnExpire);
    const validTriggers = ['onEvent', 'startOfTurn', 'endOfTurn', 'eachRound', 'onExpire'];
    const validMethods = ['none', 'save', 'check', 'automatic', 'manual'];
    const triggerAliases = {
      effectEnd: 'onExpire',
      turnStart: 'startOfTurn',
      turnEnd: 'endOfTurn',
    };

    if (!recoveryData || typeof recoveryData !== 'object' || Array.isArray(recoveryData)) {
      return normalized;
    }

    const normalizedTrigger = triggerAliases[recoveryData.trigger] ?? recoveryData.trigger;
    if (validTriggers.includes(normalizedTrigger)) {
      normalized.trigger = normalizedTrigger;
    }

    if (typeof recoveryData.method === 'string' && validMethods.includes(recoveryData.method)) {
      normalized.method = recoveryData.method;
    }

    normalized.removeOnSuccess = Boolean(recoveryData.removeOnSuccess);
    normalized.promptPlayer = Boolean(recoveryData.promptPlayer);
    normalized.chatMessage = typeof recoveryData.chatMessage === 'string' ? recoveryData.chatMessage.trim() : '';

    if (recoveryData.save && typeof recoveryData.save === 'object' && !Array.isArray(recoveryData.save)) {
      const saveType = typeof recoveryData.save.type === 'string' ? recoveryData.save.type.trim() : '';
      if (saveType) {
        normalized.save = { type: saveType };
        if (normalized.method === 'none') normalized.method = 'save';
      }
    }

    if (recoveryData.check && typeof recoveryData.check === 'object' && !Array.isArray(recoveryData.check)) {
      const rawSkills = Array.isArray(recoveryData.check.skills)
        ? recoveryData.check.skills
        : (typeof recoveryData.check.skill === 'string' && recoveryData.check.skill.trim() ? [recoveryData.check.skill] : []);
      const rawAttributes = Array.isArray(recoveryData.check.attributes)
        ? recoveryData.check.attributes
        : (typeof recoveryData.check.attribute === 'string' && recoveryData.check.attribute.trim() ? [recoveryData.check.attribute] : []);

      const skills = rawSkills.map(skill => String(skill || '').trim()).filter(Boolean);
      const attributes = rawAttributes.map(attribute => String(attribute || '').trim()).filter(Boolean);
      const skill = skills[0] ?? '';
      const attribute = attributes[0] ?? '';

      normalized.check = {
        skill,
        attribute,
        skills,
        attributes,
        opposed: Boolean(recoveryData.check.opposed),
        label: typeof recoveryData.check.label === 'string' ? recoveryData.check.label.trim() : '',
      };

      if ((skill || attribute || skills.length > 0 || attributes.length > 0) && normalized.method === 'none') {
        normalized.method = 'check';
      }
    }

    if (recoveryData.downgrades && typeof recoveryData.downgrades === 'object' && !Array.isArray(recoveryData.downgrades)) {
      normalized.downgrades = Object.fromEntries(
        Object.entries(recoveryData.downgrades)
          .filter(([key]) => typeof key === 'string' && key.trim())
          .map(([key, value]) => [key.trim(), value == null ? null : String(value).trim()])
      );
    }

    if (recoveryData.assistance && typeof recoveryData.assistance === 'object' && !Array.isArray(recoveryData.assistance)) {
      const assistance = {};

      if (Number.isFinite(recoveryData.assistance.range) && recoveryData.assistance.range > 0) {
        assistance.range = Math.floor(recoveryData.assistance.range);
      }

      if (recoveryData.assistance.downgrades && typeof recoveryData.assistance.downgrades === 'object' && !Array.isArray(recoveryData.assistance.downgrades)) {
        assistance.downgrades = Object.fromEntries(
          Object.entries(recoveryData.assistance.downgrades)
            .filter(([key]) => typeof key === 'string' && key.trim())
            .map(([key, value]) => [key.trim(), value == null ? null : String(value).trim()])
        );
      }

      if (recoveryData.assistance.check && typeof recoveryData.assistance.check === 'object' && !Array.isArray(recoveryData.assistance.check)) {
        const rawSkills = Array.isArray(recoveryData.assistance.check.skills)
          ? recoveryData.assistance.check.skills
          : (typeof recoveryData.assistance.check.skill === 'string' && recoveryData.assistance.check.skill.trim() ? [recoveryData.assistance.check.skill] : []);
        const rawAttributes = Array.isArray(recoveryData.assistance.check.attributes)
          ? recoveryData.assistance.check.attributes
          : (typeof recoveryData.assistance.check.attribute === 'string' && recoveryData.assistance.check.attribute.trim() ? [recoveryData.assistance.check.attribute] : []);

        const skills = rawSkills.map(skill => String(skill || '').trim()).filter(Boolean);
        const attributes = rawAttributes.map(attribute => String(attribute || '').trim()).filter(Boolean);
        assistance.check = {
          skill: skills[0] ?? '',
          attribute: attributes[0] ?? '',
          skills,
          attributes,
          opposed: Boolean(recoveryData.assistance.check.opposed),
          label: typeof recoveryData.assistance.check.label === 'string' ? recoveryData.assistance.check.label.trim() : '',
        };
      }

      normalized.assistance = Object.keys(assistance).length > 0 ? assistance : null;
    }

    if (includeOnExpire) {
      normalized.onExpire = typeof recoveryData.onExpire === 'string' ? recoveryData.onExpire.trim() : '';
    }

    return normalized;
  }

  _prepareEffectData(itemData) {
    const systemData = itemData.system || {};

    if (!systemData.description || typeof systemData.description !== 'object') {
      systemData.description = { value: '' };
    }

    if (!systemData.damageTick || typeof systemData.damageTick !== 'object' || Array.isArray(systemData.damageTick)) {
      systemData.damageTick = null;
    }

    systemData.recovery = this._normalizeRecoveryData(systemData.recovery, { includeOnExpire: true });
    itemData.system = systemData;
  }

  /**
   * Prepare Background-specific data
   */
  _prepareBackgroundData(itemData) {
    const systemData = itemData.system || {};

    if (!systemData.description || typeof systemData.description !== 'object') {
      systemData.description = { value: '' };
    }

    if (!Number.isFinite(systemData.startingXP)) systemData.startingXP = 0;

    for (const field of ['skillBonuses', 'startingEquipment', 'suggestedFeats', 'features', 'sampleNames', 'traits', 'notes']) {
      if (typeof systemData[field] !== 'string') systemData[field] = '';
    }

    if (!systemData.grantedSkills || typeof systemData.grantedSkills !== 'object' || Array.isArray(systemData.grantedSkills)) {
      systemData.grantedSkills = {};
    }

    if (!Array.isArray(systemData.itemGrants)) {
      systemData.itemGrants = [];
    }

    itemData.system = systemData;
  }

  /**
   * Prepare Ancestry-specific data
   */
  _prepareAncestryData(itemData) {
    const systemData = itemData.system || {};
    const abilityModifiers = (systemData.abilityModifiers && typeof systemData.abilityModifiers === 'object' && !Array.isArray(systemData.abilityModifiers))
      ? systemData.abilityModifiers
      : {};

    if (!systemData.bonuses || typeof systemData.bonuses !== 'object' || Array.isArray(systemData.bonuses)) {
      systemData.bonuses = { attributes: {} };
    }

    if (!systemData.bonuses.attributes || typeof systemData.bonuses.attributes !== 'object' || Array.isArray(systemData.bonuses.attributes)) {
      systemData.bonuses.attributes = {};
    }

    for (const attr of ['strength', 'constitution', 'agility', 'dexterity', 'intelligence', 'wisdom', 'charisma', 'luck']) {
      const current = systemData.bonuses.attributes[attr];
      const legacy = abilityModifiers[attr];
      if (!Number.isFinite(current)) {
        systemData.bonuses.attributes[attr] = Number.isFinite(legacy) ? legacy : 0;
      }
    }

    if (!['tiny', 'small', 'medium', 'large', 'huge'].includes(systemData.size)) {
      systemData.size = 'medium';
    }

    if (!Number.isFinite(systemData.speed)) systemData.speed = 30;
    if (!Number.isFinite(systemData.lifespan)) systemData.lifespan = 0;

    if (Array.isArray(systemData.traits)) {
      systemData.traits = systemData.traits.filter(Boolean).join(', ');
    } else if (typeof systemData.traits !== 'string') {
      systemData.traits = '';
    }

    for (const field of ['languages', 'specialAbilities', 'senses', 'culture', 'physicalDescription', 'notes']) {
      if (typeof systemData[field] !== 'string') systemData[field] = '';
    }

    systemData.requiresGMApproval = Boolean(systemData.requiresGMApproval);
    systemData.abilityModifiers = foundry.utils.deepClone(systemData.bonuses.attributes);
    itemData.system = systemData;
  }

  /**
   * Prepare Action-specific data
   */
  _prepareActionData(itemData) {
    const systemData = itemData.system || {};
    const validActionTypes = ['combat', 'move', 'interact', 'activate', 'free', 'reaction'];

    if (!systemData.description || typeof systemData.description !== 'object') {
      systemData.description = { value: '' };
    }

    if (!validActionTypes.includes(systemData.actionType)) {
      systemData.actionType = 'combat';
    }

    if (!Array.isArray(systemData.appliesEffects)) {
      systemData.appliesEffects = [];
    }

    systemData.appliesEffects = systemData.appliesEffects
      .map((effectRef) => {
        const effectId = String(effectRef?.effectId || '').trim();
        const operation = effectRef?.operation === 'remove' ? 'remove' : 'apply';
        const params = effectRef?.params && typeof effectRef.params === 'object' && !Array.isArray(effectRef.params)
          ? Object.fromEntries(
              Object.entries(effectRef.params)
                .map(([key, value]) => [String(key || '').trim(), value])
                .filter(([key]) => key)
            )
          : {};

        return effectId ? { effectId, operation, params } : null;
      })
      .filter(Boolean);

    for (const field of ['actionCost', 'requirements', 'trigger', 'effect', 'range', 'target', 'frequency', 'special']) {
      if (typeof systemData[field] !== 'string') systemData[field] = '';
      else systemData[field] = systemData[field].trim();
    }

    if (Array.isArray(systemData.keywords)) {
      systemData.keywords = systemData.keywords.map(keyword => String(keyword || '').trim()).filter(Boolean);
    } else if (typeof systemData.keywords === 'string') {
      systemData.keywords = systemData.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean);
    } else {
      systemData.keywords = [];
    }

    itemData.system = systemData;
  }

  _prepareAbilityData(itemData) {
    const systemData = itemData.system || {};
    const validAbilityTypes = ['passive', 'triggered', 'active', 'reaction'];

    if (!systemData.description || typeof systemData.description !== 'object') {
      systemData.description = { value: '' };
    }

    if (!validAbilityTypes.includes(systemData.abilityType)) {
      systemData.abilityType = 'passive';
    }

    if (!Array.isArray(systemData.appliesEffects)) {
      systemData.appliesEffects = [];
    }

    systemData.appliesEffects = systemData.appliesEffects
      .map((effectRef) => {
        const effectId = String(effectRef?.effectId || '').trim();
        const operation = effectRef?.operation === 'remove' ? 'remove' : 'apply';
        const params = effectRef?.params && typeof effectRef.params === 'object' && !Array.isArray(effectRef.params)
          ? Object.fromEntries(
              Object.entries(effectRef.params)
                .map(([key, value]) => [String(key || '').trim(), value])
                .filter(([key]) => key)
            )
          : {};

        return effectId ? { effectId, operation, params } : null;
      })
      .filter(Boolean);

    for (const field of ['trigger', 'effect', 'frequency', 'source']) {
      if (typeof systemData[field] !== 'string') systemData[field] = '';
      else systemData[field] = systemData[field].trim();
    }

    if (Array.isArray(systemData.keywords)) {
      systemData.keywords = systemData.keywords.map(keyword => String(keyword || '').trim()).filter(Boolean);
    } else if (typeof systemData.keywords === 'string') {
      systemData.keywords = systemData.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean);
    } else {
      systemData.keywords = [];
    }

    systemData.isActive = Boolean(systemData.isActive);

    itemData.system = systemData;
  }

  /**
   * Prepare Condition-specific data
   */
  _prepareConditionData(itemData) {
    const systemData = itemData.system || {};
    const validStackingModes = ['replace', 'stack', 'duration-merge', 'highest'];
    const validSeverities = ['minor', 'moderate', 'severe'];

    if (!systemData.description || typeof systemData.description !== 'object') {
      systemData.description = { value: '' };
    }

    if (typeof systemData.label !== 'string' || !systemData.label.trim()) {
      systemData.label = itemData.name || '';
    } else {
      systemData.label = systemData.label.trim();
    }

    for (const field of ['category', 'tokenIcon']) {
      if (typeof systemData[field] !== 'string') systemData[field] = '';
      else systemData[field] = systemData[field].trim();
    }

    if (Array.isArray(systemData.keywords)) {
      systemData.keywords = systemData.keywords.map(keyword => String(keyword || '').trim()).filter(Boolean);
    } else if (typeof systemData.keywords === 'string') {
      systemData.keywords = systemData.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean);
    } else {
      systemData.keywords = [];
    }

    if (Array.isArray(systemData.appliesConditions)) {
      systemData.appliesConditions = systemData.appliesConditions.map(name => String(name || '').trim()).filter(Boolean);
    } else if (typeof systemData.appliesConditions === 'string') {
      systemData.appliesConditions = systemData.appliesConditions.split(',').map(name => name.trim()).filter(Boolean);
    } else {
      systemData.appliesConditions = [];
    }

    if (Array.isArray(systemData.progressionChain)) {
      systemData.progressionChain = systemData.progressionChain.map(name => String(name || '').trim()).filter(Boolean);
    } else if (typeof systemData.progressionChain === 'string') {
      systemData.progressionChain = systemData.progressionChain.split(',').map(name => name.trim()).filter(Boolean);
    } else {
      systemData.progressionChain = [];
    }

    if (!Array.isArray(systemData.activeEffects)) {
      systemData.activeEffects = [];
    }

    if (!validStackingModes.includes(systemData.stacking)) {
      systemData.stacking = 'replace';
    }

    if (!validSeverities.includes(systemData.severity)) {
      systemData.severity = 'moderate';
    }

    if (!Number.isFinite(systemData.stacks) || systemData.stacks < 1) {
      systemData.stacks = 1;
    } else {
      systemData.stacks = Math.floor(systemData.stacks);
    }

    if (!Number.isFinite(systemData.overlayPriority)) {
      const priorityMap = { minor: 10, moderate: 20, severe: 30 };
      systemData.overlayPriority = priorityMap[systemData.severity] ?? 20;
    }

    if (!systemData.damageTick || typeof systemData.damageTick !== 'object' || Array.isArray(systemData.damageTick)) {
      systemData.damageTick = null;
    }

    systemData.recovery = this._normalizeRecoveryData(systemData.recovery);

    itemData.system = systemData;
  }

  /**
   * Prepare Equipment-specific data
   */
  _prepareEquipmentData(itemData) {
    const systemData = itemData.system || {};

    if (typeof systemData.equipmentType !== 'string' || !systemData.equipmentType) systemData.equipmentType = 'adventuring-gear';
    if (typeof systemData.capacity !== 'string') systemData.capacity = '';
    if (!Number.isFinite(systemData.brightLight)) systemData.brightLight = 0;
    if (!Number.isFinite(systemData.dimLight)) systemData.dimLight = 0;
    if (typeof systemData.duration !== 'string') systemData.duration = '';
    if (typeof systemData.associatedSkill !== 'string') systemData.associatedSkill = '';
    if (!Number.isFinite(systemData.toolBonus)) systemData.toolBonus = 0;
    if (typeof systemData.rarity !== 'string') systemData.rarity = '';
    if (typeof systemData.magicalProperties !== 'string') systemData.magicalProperties = '';
    if (typeof systemData.properties !== 'string') systemData.properties = '';
    if (typeof systemData.notes !== 'string') systemData.notes = '';

    if (!systemData.uses || typeof systemData.uses !== 'object') {
      systemData.uses = { value: 0, max: 0 };
    } else {
      if (!Number.isFinite(systemData.uses.value)) systemData.uses.value = 0;
      if (!Number.isFinite(systemData.uses.max)) systemData.uses.max = 0;
    }

    systemData.consumable = Boolean(systemData.consumable);
    systemData.requiresAttunement = Boolean(systemData.requiresAttunement);

    itemData.system = systemData;
  }

  /**
   * Prepare Flaw-specific data
   */
  _prepareFlawData(itemData) {
    const systemData = itemData.system || {};

    if (!Number.isFinite(systemData.pointValue)) systemData.pointValue = 0;
    if (typeof systemData.flawType !== 'string') systemData.flawType = 'mental';
    if (typeof systemData.severity !== 'string') systemData.severity = 'minor';
    if (typeof systemData.mechanicalEffects !== 'string') systemData.mechanicalEffects = '';
    if (typeof systemData.roleplayingImpact !== 'string') systemData.roleplayingImpact = '';
    if (typeof systemData.overcomeMethod !== 'string') systemData.overcomeMethod = '';
    if (typeof systemData.notes !== 'string') systemData.notes = '';

    systemData.canBeOvercome = Boolean(systemData.canBeOvercome);
    systemData.requiresGMApproval = Boolean(systemData.requiresGMApproval);

    if (!['minor', 'moderate', 'major'].includes(systemData.severity)) {
      if (systemData.pointValue <= 2) systemData.severity = 'minor';
      else if (systemData.pointValue <= 5) systemData.severity = 'moderate';
      else systemData.severity = 'major';
    }

    itemData.system = systemData;
  }

  /**
   * Prepare Trait-specific data
   */
  _prepareTraitData(itemData) {
    const systemData = itemData.system || {};

    if (typeof systemData.requirements !== 'string') systemData.requirements = '';
    if (typeof systemData.benefits !== 'string') systemData.benefits = '';
    if (typeof systemData.notes !== 'string') systemData.notes = '';
    if (typeof systemData.visualEffects !== 'string') systemData.visualEffects = '';
    if (typeof systemData.castingStat !== 'string') systemData.castingStat = '';
    if (typeof systemData.elementalAffinity !== 'string') systemData.elementalAffinity = '';
    if (typeof systemData.magicalType !== 'string') systemData.magicalType = '';

    systemData.isMagical = Boolean(systemData.isMagical);
    systemData.grantsEnergyPool = Boolean(systemData.grantsEnergyPool);
    systemData.grantsMasterySkills = Boolean(systemData.grantsMasterySkills);
    systemData.grantsRitualCasting = Boolean(systemData.grantsRitualCasting);
    systemData.requiresGMApproval = Boolean(systemData.requiresGMApproval);

    itemData.system = systemData;
  }

  /**
   * Prepare Feat-specific data
   */
  _prepareFeatData(itemData) {
    const systemData = itemData.system || {};

    const featClassification = typeof systemData.classification === 'string'
      ? systemData.classification.toLowerCase()
      : '';
    systemData.classification = featClassification === 'legendary' ? 'legendary' : 'standard';

    // Ensure prerequisites object shape
    if (!systemData.prerequisites || typeof systemData.prerequisites !== 'object') {
      systemData.prerequisites = {
        attributes: {},
        skills: '',
        feats: [],
        tier: 0,
        other: ''
      };
    } else {
      if (!systemData.prerequisites.attributes) systemData.prerequisites.attributes = {};
      if (!systemData.prerequisites.skills || typeof systemData.prerequisites.skills !== 'string') systemData.prerequisites.skills = '';
      if (!systemData.prerequisites.feats) systemData.prerequisites.feats = [];
    }

    // Ensure effects array exists
    if (!Array.isArray(systemData.effects)) systemData.effects = [];

    // Normalize feat cost from classification unless a positive explicit value is already set.
    if (!Number.isFinite(systemData.xpCost) || systemData.xpCost <= 0) {
      systemData.xpCost = systemData.classification === 'legendary' ? 80 : 40;
    }

    // Normalize usage fields if missing
    if (!systemData.usage) systemData.usage = { mode: 'passive', uses: null, recharge: null };

    itemData.system = systemData;
  }
  
  /**
   * Prepare Weapon-specific data
   */
  _prepareWeaponData(itemData) {
    const systemData = itemData.system;

    if (!systemData.damage || typeof systemData.damage !== 'object') {
      systemData.damage = {};
    }

    if (!Array.isArray(systemData.properties)) {
      systemData.properties = [];
    }

    if (typeof systemData.notes !== 'string') {
      systemData.notes = '';
    }

    if (typeof systemData.reload !== 'string') {
      systemData.reload = '';
    }

    if (typeof systemData.requirements !== 'string') {
      systemData.requirements = '';
    }

    if (!systemData.range || typeof systemData.range !== 'object') {
      systemData.range = { normal: 0, medium: 0, long: 0 };
    } else {
      if (!Number.isFinite(systemData.range.normal)) systemData.range.normal = 0;
      if (!Number.isFinite(systemData.range.medium)) systemData.range.medium = 0;
      if (!Number.isFinite(systemData.range.long)) systemData.range.long = 0;
    }
    
    // Set default damage if not specified
    if (!systemData.damage.base) {
      systemData.damage.base = 6; // Standard weapon
    }
    
    // Set default damage type if not specified
    if (!systemData.damage.type) {
      systemData.damage.type = 'slashing';
    }

    if (!Number.isFinite(systemData.damage.alternate)) {
      systemData.damage.alternate = 0;
    }

    if (typeof systemData.damage.alternateType !== 'string') {
      systemData.damage.alternateType = '';
    }

    if (typeof systemData.damage.multiType !== 'string') {
      systemData.damage.multiType = '';
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
    } else {
      systemData.attackModes = systemData.attackModes.map(mode => {
        const normalizedMode = mode && typeof mode === 'object' ? foundry.utils.deepClone(mode) : {};
        normalizedMode.name = typeof normalizedMode.name === 'string' && normalizedMode.name
          ? normalizedMode.name
          : 'Melee';

        const normalizedType = ['melee', 'ranged', 'thrown'].includes(normalizedMode.type)
          ? normalizedMode.type
          : 'melee';
        normalizedMode.type = normalizedType;

        if (normalizedMode.skill === 'meleeCombat') normalizedMode.skill = 'melee';
        if (normalizedMode.skill === 'rangedCombat') normalizedMode.skill = 'ranged';

        if (!['melee', 'ranged'].includes(normalizedMode.skill)) {
          normalizedMode.skill = normalizedType === 'melee' ? 'melee' : 'ranged';
        }

        if (!['melee', 'ranged'].includes(normalizedMode.defenseType)) {
          normalizedMode.defenseType = normalizedType === 'melee' ? 'melee' : 'ranged';
        }

        const defaultDamageAttr = normalizedType === 'melee' ? 'strength' : 'dexterity';
        if (!['strength', 'agility', 'dexterity'].includes(normalizedMode.damageAttr)) {
          normalizedMode.damageAttr = defaultDamageAttr;
        }

        if (normalizedType !== 'melee' && normalizedMode.damageAttr !== 'dexterity') {
          normalizedMode.damageAttr = 'dexterity';
        }

        if (!normalizedMode.range || typeof normalizedMode.range !== 'object') {
          normalizedMode.range = { normal: 0, medium: 0, long: 0 };
        } else {
          if (!Number.isFinite(normalizedMode.range.normal)) normalizedMode.range.normal = 0;
          if (!Number.isFinite(normalizedMode.range.medium)) normalizedMode.range.medium = 0;
          if (!Number.isFinite(normalizedMode.range.long)) normalizedMode.range.long = 0;
        }

        if (!normalizedMode.damage || typeof normalizedMode.damage !== 'object') {
          normalizedMode.damage = { base: systemData.damage.base, alternate: systemData.damage.alternate };
        } else {
          if (!Number.isFinite(normalizedMode.damage.base)) normalizedMode.damage.base = systemData.damage.base;
          if (!Number.isFinite(normalizedMode.damage.alternate)) normalizedMode.damage.alternate = systemData.damage.alternate;
        }

        return normalizedMode;
      });
    }
  }
    /**
   * Prepare Armor-specific data
   */
  _prepareArmorData(itemData) {
    const systemData = itemData.system;

    if (!Array.isArray(systemData.properties)) {
      systemData.properties = [];
    }
    
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
      systemData.shieldType = 'light';
    }
    
    // Ensure reactions array exists
    if (!Array.isArray(systemData.reactions)) {
      systemData.reactions = [];
    }

    if (!Array.isArray(systemData.linkedAbilities)) {
      systemData.linkedAbilities = [];
    }

    if (!systemData.meleeDefense && systemData.linkedAbilities.length) {
      systemData.meleeDefense = systemData.linkedAbilities
        .map(ability => ability?.name)
        .filter(Boolean)
        .join(', ');
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
      case 'action':
        return this._rollAction();
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

  async _rollAction() {
    const actionKey = slugifyActionName(this.name);

    switch (actionKey) {
      case 'grapple':
        return this._rollGrappleAction();
      case 'hide':
        return this._rollHideAction();
      case 'stalk':
        return this._rollStalkAction();
      case 'release-grapple':
        return this._rollReleaseGrappleAction();
      default:
        return this._displayDescription();
    }
  }

  _getPrimaryTargetToken() {
    const targets = Array.from(game.user?.targets || []);
    return targets[0] || null;
  }

  _getActorToken(actor) {
    return canvas.tokens?.placeables?.find(token => token.actor?.id === actor?.id) || null;
  }

  _getSkillConfig(actor, skillKey) {
    const normalizedSkillKey = normalizeSkillKey(skillKey) || skillKey;
    const attrKey = SKILL_ATTRIBUTE_KEYS[normalizedSkillKey];
    if (!attrKey) return null;

    const skillValue = getSkillValue(actor.system.skillsEffective || {}, normalizedSkillKey)
      || getSkillValue(actor.system.skills || {}, normalizedSkillKey);
    const attrValue = actor.system.attributesEffective?.[attrKey] ?? actor.system.attributes?.[attrKey]?.value;
    const attrLabel = actor.system.attributes?.[attrKey]?.label || attrKey;

    if (attrValue === undefined || attrValue === null) return null;

    let defaultModifier = 0;
    let defaultApplyToAttr = true;
    let defaultApplyToSkill = true;

    try {
      const featMods = featEffects.computeFeatModifiers(actor);
      const skillMod = featMods.skillDiceModifiers?.[normalizedSkillKey] || featMods.skillDiceModifiers?.[skillKey];
      if (skillMod) {
        defaultModifier = skillMod.value || 0;
        defaultApplyToAttr = !!skillMod.applyToAttr;
        defaultApplyToSkill = !!skillMod.applyToSkill;
      }
    } catch (error) {
      console.debug('Legends | Failed to compute feat modifiers for action roll', error);
    }

    return {
      actor,
      skillKey: normalizedSkillKey,
      attrValue,
      skillValue: typeof skillValue === 'object' ? (skillValue.value ?? skillValue) : skillValue,
      attrLabel,
      skillLabel: SKILL_LABELS[normalizedSkillKey] || game.i18n.localize(`D8.Skills.${normalizedSkillKey}`),
      defaultModifier,
      defaultApplyToAttr,
      defaultApplyToSkill,
    };
  }

  async _showActionSkillCheck(actor, skillKey, options = {}) {
    const config = this._getSkillConfig(actor, skillKey);
    if (!config) {
      ui.notifications.error(`Unable to roll ${skillKey} for ${actor.name}.`);
      return null;
    }

    return showSkillCheckDialog({
      ...config,
      onRollComplete: options.onRollComplete,
    });
  }

  async _chooseSkill(actor, skillKeys, title) {
    const normalizedSkills = skillKeys
      .map(skill => normalizeSkillKey(skill) || skill)
      .filter(Boolean);

    if (normalizedSkills.length === 1) {
      return normalizedSkills[0];
    }

    const options = normalizedSkills.map(skill => {
      const label = SKILL_LABELS[skill] || game.i18n.localize(`D8.Skills.${skill}`);
      const value = getSkillValue(actor.system.skillsEffective || {}, skill) || getSkillValue(actor.system.skills || {}, skill) || 0;
      return `<option value="${skill}">${label} (${value})</option>`;
    }).join('');

    return foundry.applications.api.DialogV2.wait({
      window: { title },
      content: `
        <form class="legends-action-dialog">
          <div class="form-group">
            <label><strong>${actor.name}</strong> chooses a skill:</label>
            <select name="skill" style="width: 100%;">${options}</select>
          </div>
        </form>
      `,
      buttons: [
        {
          action: 'confirm',
          label: 'Continue',
          default: true,
          callback: (event, button, dialog) => dialog.element.querySelector('[name="skill"]')?.value || null,
        },
        {
          action: 'cancel',
          label: 'Cancel',
        }
      ]
    });
  }

  async _postOpposedActionMessage({ title, sourceActor, targetActor, sourceResult, targetResult, margin, outcome }) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
      content: `
        <div class="d8-item">
          <h3>${title}</h3>
          <div><strong>${sourceActor.name}:</strong> ${sourceResult.successes} success${sourceResult.successes === 1 ? '' : 'es'}</div>
          <div><strong>${targetActor.name}:</strong> ${targetResult.successes} success${targetResult.successes === 1 ? '' : 'es'}</div>
          <div><strong>Margin:</strong> ${margin}</div>
          <div>${outcome}</div>
        </div>
      `
    });
  }

  async _runOpposedActionCheck({
    sourceSkill,
    targetActor,
    targetSkills,
    title,
    onResolved,
  }) {
    const sourceActor = this.actor;
    const targetSkill = await this._chooseSkill(targetActor, targetSkills, `${title}: ${targetActor.name}`);
    if (!targetSkill) return null;

    return this._showActionSkillCheck(sourceActor, sourceSkill, {
      onRollComplete: async (sourceResult) => {
        const targetResult = await this._showActionSkillCheck(targetActor, targetSkill);
        if (!targetResult) return;

        const margin = sourceResult.successes - targetResult.successes;
        await onResolved({ sourceResult, targetResult, margin, targetSkill });
      }
    });
  }

  async _rollGrappleAction() {
    const sourceActor = this.actor;
    const sourceToken = this._getActorToken(sourceActor);
    const targetToken = this._getPrimaryTargetToken();
    const targetActor = targetToken?.actor;

    if (!targetActor) {
      ui.notifications.warn('Select a target before using Grapple.');
      return null;
    }

    return this._runOpposedActionCheck({
      sourceSkill: 'athletics',
      targetActor,
      targetSkills: ['athletics', 'acrobatics', 'might'],
      title: this.name,
      onResolved: async ({ sourceResult, targetResult, margin }) => {
        if (margin >= 1) {
          const recoverySource = {
            actorId: sourceActor.id,
            tokenId: sourceToken?.id || '',
            label: sourceActor.name,
            successes: sourceResult.successes,
          };

          const hasRestrained = targetActor.items.some(item => item.type === 'condition' && item.name === 'Restrained');
          const hasGrappled = targetActor.items.some(item => item.type === 'condition' && item.name === 'Grappled');

          if (!hasRestrained && hasGrappled) {
            await game.legends.removeCondition(targetActor, 'Grappled');
            await game.legends.applyCondition(targetActor, 'Restrained', { source: this.name, recoverySource });
            await this._postOpposedActionMessage({
              title: this.name,
              sourceActor,
              targetActor,
              sourceResult,
              targetResult,
              margin,
              outcome: `${targetActor.name} is now Restrained.`,
            });
            return;
          }

          if (!hasGrappled) {
            await game.legends.applyCondition(targetActor, 'Grappled', { source: this.name, recoverySource });
          }

          await this._postOpposedActionMessage({
            title: this.name,
            sourceActor,
            targetActor,
            sourceResult,
            targetResult,
            margin,
            outcome: `${targetActor.name} is now Grappled.`,
          });
          return;
        }

        await this._postOpposedActionMessage({
          title: this.name,
          sourceActor,
          targetActor,
          sourceResult,
          targetResult,
          margin,
          outcome: `${sourceActor.name} fails to secure the grapple.`,
        });
      }
    });
  }

  async _rollHideAction() {
    const sourceActor = this.actor;
    const targetToken = this._getPrimaryTargetToken();
    const targetActor = targetToken?.actor;

    if (!targetActor) {
      ui.notifications.warn('Select an observing target before using Hide.');
      return null;
    }

    return this._runOpposedActionCheck({
      sourceSkill: 'stealth',
      targetActor,
      targetSkills: ['perception'],
      title: this.name,
      onResolved: async ({ sourceResult, targetResult, margin }) => {
        if (margin >= 1) {
          await game.legends.applyCondition(sourceActor, 'Hidden', {
            source: this.name,
            recoverySource: {
              actorId: targetActor.id,
              tokenId: targetToken.id,
              label: targetActor.name,
              successes: targetResult.successes,
            }
          });
        }

        await this._postOpposedActionMessage({
          title: this.name,
          sourceActor,
          targetActor,
          sourceResult,
          targetResult,
          margin,
          outcome: margin >= 1
            ? `${sourceActor.name} becomes Hidden from ${targetActor.name}.`
            : `${sourceActor.name} fails to hide from ${targetActor.name}.`,
        });
      }
    });
  }

  async _rollStalkAction() {
    const sourceActor = this.actor;
    const targetToken = this._getPrimaryTargetToken();
    const targetActor = targetToken?.actor;

    if (!targetActor) {
      ui.notifications.warn('Select an observing target before using Stalk.');
      return null;
    }

    const isHidden = sourceActor.items.some(item => item.type === 'condition' && item.name === 'Hidden');
    if (!isHidden) {
      ui.notifications.warn('You must be Hidden to use Stalk.');
      return null;
    }

    return this._runOpposedActionCheck({
      sourceSkill: 'stealth',
      targetActor,
      targetSkills: ['perception'],
      title: this.name,
      onResolved: async ({ sourceResult, targetResult, margin }) => {
        if (margin <= 0) {
          await game.legends.removeCondition(sourceActor, 'Hidden');
        }

        await this._postOpposedActionMessage({
          title: this.name,
          sourceActor,
          targetActor,
          sourceResult,
          targetResult,
          margin,
          outcome: margin >= 1
            ? `${sourceActor.name} changes position while remaining Hidden.`
            : `${sourceActor.name} loses the Hidden condition.`,
        });
      }
    });
  }

  async _removeConditionBySource(actor, conditionName, sourceActorId) {
    const matchingConditions = actor.items.filter(item =>
      item.type === 'condition'
      && item.name === conditionName
      && (sourceActorId ? item.flags?.legends?.recoverySource?.actorId === sourceActorId : true)
    );

    if (matchingConditions.length === 0) {
      return false;
    }

    await actor.deleteEmbeddedDocuments('Item', matchingConditions.map(item => item.id));

    const statusId = conditionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const effectIds = actor.effects
      .filter(effect => effect.statuses.has(statusId) && effect.flags?.legends?.isConditionMarker)
      .map(effect => effect.id);

    if (effectIds.length > 0) {
      await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
    }

    return true;
  }

  async _rollReleaseGrappleAction() {
    const sourceActor = this.actor;
    const targetToken = this._getPrimaryTargetToken();
    const targetActor = targetToken?.actor;

    if (!targetActor) {
      ui.notifications.warn('Select the grapple target before using Release Grapple.');
      return null;
    }

    const removedTargetGrapple = await this._removeConditionBySource(targetActor, 'Grappled', sourceActor.id);
    const removedTargetRestraint = await this._removeConditionBySource(targetActor, 'Restrained', sourceActor.id);
    const removedSelfGrapple = await this._removeConditionBySource(sourceActor, 'Grappled', targetActor.id);
    const removedSelfRestraint = await this._removeConditionBySource(sourceActor, 'Restrained', targetActor.id);

    if (!removedTargetGrapple && !removedTargetRestraint && !removedSelfGrapple && !removedSelfRestraint) {
      ui.notifications.info('No grappled or restrained conditions linked to that target were found.');
      return null;
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
      content: `
        <div class="d8-item">
          <h3>${this.name}</h3>
          <div><strong>${sourceActor.name}</strong> releases the grapple involving <strong>${targetActor.name}</strong>.</div>
        </div>
      `
    });

    return true;
  }
  
  /**
   * Display a feature (feat/trait)
   */
  async _displayFeature() {
    const item = this;
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    const descRaw = typeof item.system.description === 'string'
      ? item.system.description
      : (item.system.description?.value || '');
    const enrichedDesc = await TextEditor.enrichHTML(descRaw, { async: true });
    const enrichedBenefits = item.system.benefits
      ? await TextEditor.enrichHTML(item.system.benefits, { async: true })
      : '';

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="d8-feature">
          <h3>${item.name}</h3>
          <div class="description">${enrichedDesc}</div>
          ${enrichedBenefits ? `<div class="benefits"><strong>Benefits:</strong> ${enrichedBenefits}</div>` : ''}
        </div>
      `
    });
  }
  
  /**
   * Display item description
   */
  async _displayDescription() {
    const item = this;
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    const descRaw = typeof item.system.description === 'string'
      ? item.system.description
      : (item.system.description?.value || '');
    const enrichedDesc = await TextEditor.enrichHTML(descRaw, { async: true });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `
        <div class="d8-item">
          <h3>${item.name}</h3>
          <div class="description">${enrichedDesc}</div>
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
