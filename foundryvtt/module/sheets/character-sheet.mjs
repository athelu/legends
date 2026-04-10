/**
 * Legends D8 TTRPG Character Sheet
 * Foundry VTT V13 - Application V2 (HandlebarsApplicationMixin + ActorSheetV2)
 * Uses: static DEFAULT_OPTIONS, static PARTS, _prepareContext(), data-action event delegation
 */
import { SKILL_ATTRIBUTE_SHORT, SKILL_LABELS } from '../skill-utils.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const ITEM_COMPENDIUM_PACKS = {
  weapon: 'legends.weapons',
  armor: 'legends.armor',
  shield: 'legends.armor',
  equipment: 'legends.equipment',
  weave: 'legends.weaves',
  feat: 'legends.feats',
  trait: 'legends.traits',
  flaw: 'legends.flaws',
  background: 'legends.backgrounds',
  ancestry: 'legends.ancestries',
  action: 'legends.action',
  actions: 'legends.action',
  ability: 'legends.abilities',
  abilities: 'legends.abilities',
  condition: 'legends.conditions'
};

export class D8CharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["legends", "sheet", "actor", "character"],
    position: { width: 720, height: 800 },
    window: { 
      resizable: true,
      title: "TYPES.Actor.character"
    },
    actions: {
      shortRest: D8CharacterSheet.#onShortRest,
      longRest: D8CharacterSheet.#onLongRest,
      awardXp: D8CharacterSheet.#onAwardXp,
      spendXp: D8CharacterSheet.#onSpendXp,
      toggleTrainingCheckbox: D8CharacterSheet.#onToggleTrainingCheckbox,
      toggleProgressionPhase: D8CharacterSheet.#onToggleProgressionPhase,
      toggleManualOverride: D8CharacterSheet.#onToggleManualOverride,
      skillRoll: D8CharacterSheet.#onSkillRoll,
      weaponAttack: D8CharacterSheet.#onWeaponAttack,
      itemCreate: D8CharacterSheet.#onItemCreate,
      itemEdit: D8CharacterSheet.#onItemEdit,
      itemDelete: D8CharacterSheet.#onItemDelete,
      itemEquip: D8CharacterSheet.#onItemEquip,
      itemRoll: D8CharacterSheet.#onItemRoll,
      openCompendium: D8CharacterSheet.#onOpenCompendium,
      conditionRemove: D8CharacterSheet.#onConditionRemove,
      itemChat: D8CharacterSheet.#onItemChat,
      expandItem: D8CharacterSheet.#onExpandItem,
      itemView: D8CharacterSheet.#onItemView,
      setupMagicalTraits: D8CharacterSheet.#onSetupMagicalTraits,
      changeHeaderChoice: D8CharacterSheet.#onChangeHeaderChoice,
    },
    dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
  };

  static PARTS = {
    sheet: { template: "systems/legends/templates/actor/character-sheet.hbs" }
  };

  static TABS = {
    primary: {
      initial: "main",
      tabs: [
        { id: "main", label: "Main" },
        { id: "weapons", label: "Weapons" },
        { id: "actions", label: "Actions" },
        { id: "magic", label: "Magic" },
        { id: "features", label: "Features" },
        { id: "effects", label: "Effects" },
        { id: "equipment", label: "Equipment" },
        { id: "biography", label: "Biography" }
      ]
    }
  };

  tabGroups = { primary: "main" };

  get title() {
    return this.document.name || "Character";
  }

  /** @override - Configure the window title to show just the actor name */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ["sheet"];
    options.window = options.window || {};
    options.window.title = this.title;
  }

  /** @override */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    const rect = this.element?.getBoundingClientRect?.();
    if (!rect) return;
    if (rect.width < 700 || rect.height < 500) {
      this.setPosition({ width: 720, height: 800 });
    }
  }

  /** @override - Attach listeners to form inputs */
  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);
    
    // Add change listeners to all numeric inputs
    const numericInputs = htmlElement.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
      input.addEventListener('change', this._onNumericInputChange.bind(this));
      input.addEventListener('blur', this._onNumericInputChange.bind(this));
    });

    // Add click listener for profile image to open file picker
    const profileImg = htmlElement.querySelector('.profile-img[data-edit="img"]');
    if (profileImg) {
      profileImg.addEventListener('click', this._onEditImage.bind(this));
      // Add context menu for right-click options
      this._contextMenu(profileImg);
    }
  }

  /** Set up context menu for profile image */
  _contextMenu(img) {
    new foundry.applications.ux.ContextMenu.implementation(this.element, img, [
      {
        name: "View Image",
        icon: '<i class="fas fa-eye"></i>',
        callback: () => {
          const ip = new ImagePopout(this.document.img, {
            title: this.document.name,
            uuid: this.document.uuid
          });
          ip.render(true);
        }
      },
      {
        name: "Share Image",
        icon: '<i class="fas fa-eye"></i>',
        condition: game.user.isGM,
        callback: () => {
          const ip = new ImagePopout(this.document.img, {
            title: this.document.name,
            uuid: this.document.uuid,
            shareable: true
          });
          ip.render(true);
          ip.shareImage();
        }
      }
    ], {
      jQuery: false
    });
  }

  /** Handle clicking on the profile image to change it */
  async _onEditImage(event) {
    event.preventDefault();
    const attr = event.currentTarget.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: path => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }

  /** Handle numeric input changes and immediately update the actor */
  async _onNumericInputChange(event) {
    const input = event.currentTarget;
    const fieldName = input.name;
    const value = input.value;
    
    if (!fieldName || value === '') return;

    const canEditAdvancementFields = this._canEditAdvancementFields();
    const isXpField = fieldName === 'system.tier.xp' || fieldName === 'system.tier.unspent';
    if (isXpField && !game.legends?.progression?.canEditXPFields?.(this.document, game.user)) {
      ui.notifications.warn('XP values are locked outside character creation or manual override.');
      input.value = this._getNestedValue(this.document.system, fieldName.replace('system.', '')) || 0;
      return;
    }

    const isAdvancementField = fieldName.startsWith('system.skills.')
      || /^system\.attributes\.[^.]+\.value$/.test(fieldName)
      || /^system\.mastery\.[^.]+\.value$/.test(fieldName)
      || /^system\.potentials\.[^.]+\.value$/.test(fieldName);

    if (isAdvancementField && !canEditAdvancementFields) {
      ui.notifications.warn('Skills, attributes, mastery, and potentials are locked outside character creation or manual override.');
      input.value = this._getNestedValue(this.document.system, fieldName.replace('system.', '')) || 0;
      return;
    }
    
    const numValue = input.type === 'number' ? Number(value) : value;
    const updateData = {};
    updateData[fieldName] = numValue;

    if (fieldName === 'system.tier.xp') {
      const tierInfo = game.legends?.progression?.getTierInfoFromXp?.(numValue);
      if (tierInfo) {
        updateData['system.tier.value'] = tierInfo.current;
        const currentUnspent = Number(this.document.system.tier?.unspent || 0);
        updateData['system.tier.unspent'] = Math.min(tierInfo.xp, Math.max(0, currentUnspent));
      }
    }

    if (fieldName === 'system.tier.unspent') {
      updateData[fieldName] = Math.min(
        Math.max(0, Number(numValue)),
        Number(this.document.system.tier?.xp || 0)
      );
      input.value = updateData[fieldName];
    }
    
    try {
      const expanded = foundry.utils.expandObject(updateData);
      
      if (Object.keys(expanded).length === 0) {
        console.warn('Update data expansion failed for field:', fieldName);
        return;
      }
      
      await this.document.update(expanded);
      
    } catch (error) {
      console.error(`Failed to update ${fieldName}:`, error);
      const currentValue = this._getNestedValue(this.document.system, fieldName.replace('system.', ''));
      input.value = currentValue || 0;
    }
  }

  /** Helper to get nested values from object */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  _canEditAdvancementFields() {
    return Boolean(this.isEditable && game.legends?.progression?.canEditXPFields?.(this.actor, game.user));
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actorData = this.actor.toObject(false);

    context.system = foundry.utils.deepClone(this.actor.system);
    context.flags = actorData.flags;
    context.actor = actorData;
    context.training = game.legends?.training?.getTrainingState?.(this.actor) || { skills: {}, mastery: {} };
    context.owner = this.actor.isOwner;
    context.editable = this.isEditable;

    // Prepare character data
    this._prepareItems(context);
    // Compute feat/trait/flaw/ancestry/ability breakdowns for attributes/skills
    const featMods = game.legends?.featEffects?.computeFeatModifiers?.(this.actor) || {};
    this._prepareAttributes(context, featMods);
    this._prepareSkills(context, featMods);
    this._prepareMagicalTraitHelpers(context);
    context.primaryBackground = context.backgrounds[0] || null;
    context.primaryAncestry = context.ancestries[0] || null;
    context.tier = this._getTierInfo(context.system.tier?.xp ?? 0);
    context.progression = game.legends?.progression?.getActorProgressionState?.(this.actor) || {
      phase: 'advancement',
      phaseLabel: 'Advancement',
      manualOverride: false,
      nextPhaseLabel: 'Switch to Creation',
      lastTransaction: null,
      unspent: context.system.tier?.unspent ?? 0
    };
    context.canEditXpFields = this._canEditAdvancementFields();
    context.canEditAdvancementFields = context.canEditXpFields;
    context.canAwardXp = Boolean(this.isEditable && game.legends?.progression?.canAwardXP?.(this.actor, game.user));
    context.canSpendXp = Boolean(this.isEditable && game.legends?.progression?.canSpendXP?.(this.actor, game.user));
    context.canManageProgression = Boolean(this.isEditable && game.legends?.progression?.canManageProgression?.(this.actor, game.user));
    context.canChangeOriginChoices = Boolean(this.isEditable && context.progression?.isCreation);
    context.xpFieldHint = context.canEditXpFields
      ? 'XP fields can be edited directly in character creation or manual override mode.'
      : 'XP fields are locked outside character creation or manual override.';
    return context;
  }

  /**
   * Organize and classify Items for Character sheets
   */
  _prepareItems(context) {
    const weapons = [];
    const armor = [];
    const shields = [];
    const equipment = [];
    const weaves = [];
    const feats = [];
    const traits = [];
    const flaws = [];
    const backgrounds = [];
    const ancestries = [];

    // Actions categorized by type
    const combatActions = [];
    const movementActions = [];
    const activateActions = [];
    const interactActions = [];
    const freeActions = [];
    const reactions = [];

    // Abilities
    const abilities = [];

    // Conditions
    const conditions = [];

    for (let item of this.actor.items) {
      const i = item.toObject(false);
      i.img = i.img || "icons/svg/item-bag.svg";

      switch (i.type) {
        case 'weapon':
          weapons.push(i);
          break;
        case 'armor':
          armor.push(i);
          break;
        case 'shield':
          shields.push(i);
          break;
        case 'equipment':
          equipment.push(i);
          break;
        case 'weave':
          weaves.push(i);
          break;
        case 'feat':
          feats.push(i);
          break;
        case 'trait':
          traits.push(i);
          break;
        case 'flaw':
          flaws.push(i);
          break;
        case 'background':
          backgrounds.push(i);
          break;
        case 'ancestry':
          ancestries.push(i);
          break;
        case 'action':
          // Categorize actions by type
          if (i.system.actionType === 'combat') {
            combatActions.push(i);
          } else if (i.system.actionType === 'move' || i.system.actionType === 'movement') {
            movementActions.push(i);
          } else if (i.system.actionType === 'activate') {
            activateActions.push(i);
          } else if (i.system.actionType === 'interact') {
            interactActions.push(i);
          } else if (i.system.actionType === 'free') {
            freeActions.push(i);
          } else if (i.system.actionType === 'reaction') {
            reactions.push(i);
          }
          break;
        case 'ability':
          abilities.push(i);
          break;
        case 'condition':
          conditions.push(i);
          break;
      }
    }

    context.weapons = weapons;
    context.armor = armor;
    context.shields = shields;
    context.equipment = equipment;
    context.weaves = weaves;
    context.feats = feats;
    context.traits = traits;
    context.flaws = flaws;
    context.backgrounds = backgrounds;
    context.ancestries = ancestries;
    const traitPointsSpent = traits.reduce((total, item) => total + Number(item.system?.pointCost || 0), 0);
    const flawPointsEarned = flaws.reduce((total, item) => total + Number(item.system?.pointValue || 0), 0);
    context.traitPointSummary = {
      spent: traitPointsSpent,
      earned: flawPointsEarned,
      remaining: flawPointsEarned - traitPointsSpent,
      isOverspent: traitPointsSpent > flawPointsEarned
    };

    // Action categories
    context.combatActions = combatActions;
    context.movementActions = movementActions;
    context.activateActions = activateActions;
    context.interactActions = interactActions;
    context.freeActions = freeActions;
    context.reactions = reactions;

    // Abilities
    context.abilities = abilities;

    // Conditions
    context.conditions = conditions;
  }

  /**
   * Prepare attributes with ancestry and feat breakdowns.
   */
  _prepareAttributes(context, featMods = {}) {
    const attributes = context.system.attributes || {};
    const attributeList = [];
    const featBonuses = featMods.attributes || {};
    const ancestryBonuses = context.system.ancestryEffects?.attributes || {};

    for (const [key, attribute] of Object.entries(attributes)) {
      const base = attribute?.value ?? 0;
      const ancestryBonus = ancestryBonuses[key] || 0;
      const featBonus = featBonuses[key] || 0;
      const effective = context.system.attributesEffective?.[key] ?? (base + ancestryBonus + featBonus);
      const bonus = effective - base;

      const breakdownLines = [`Base: ${base}`];
      if (ancestryBonus) breakdownLines.push(`+${ancestryBonus} from ancestry`);
      if (featBonus) breakdownLines.push(`+${featBonus} from feats/abilities`);
      if (bonus) breakdownLines.push(`= ${effective}`);

      attributeList.push({
        key,
        label: attribute?.label || key,
        base,
        bonus,
        total: effective,
        breakdown: bonus ? breakdownLines.join('\n') : ''
      });
    }
    context.attributeList = attributeList;
  }

  /**
   * Prepare skills with labels
   */
  _prepareSkills(context, featMods = {}) {
    const skills = context.system.skills;
    const skillList = [];
    const skillBonuses = featMods.skills || {};
    for (const [key, label] of Object.entries(SKILL_LABELS)) {
      const baseRaw = skills?.[key];
      const base = (typeof baseRaw === 'object') ? (baseRaw.value ?? 0) : (baseRaw ?? 0);
      const effective = context.system.skillsEffective?.[key] ?? base;
      const bonus = effective - base;
      // Build breakdown string
      let breakdown = '';
      if (bonus !== 0) {
        breakdown = `Base: ${base}`;
        if (skillBonuses[key]) breakdown += `\n+${skillBonuses[key]} from feats/abilities`;
        // Add more sources here if needed
        breakdown += `\n= ${effective}`;
      }
      skillList.push({
        key: key,
        label: label,
        base: base,
        bonus: bonus,
        total: effective,
        checked: Boolean(context.training?.skills?.[key]),
        attr: SKILL_ATTRIBUTE_SHORT[key],
        breakdown
      });
    }

    context.skillList = skillList;
  }

  /**
   * Prepare magical trait helper data for template
   */
  _prepareMagicalTraitHelpers(context) {
    const magicalTrait = context.system.magicalTrait || {};
    const detectedTrait = !magicalTrait.type
      ? game.legends.magicalTraits.detectPrimaryMagicalTrait(this.actor)
      : null;
    const effectiveTraitType = magicalTrait.type || detectedTrait?.type || '';

    if (!context.system.magicalTrait || typeof context.system.magicalTrait !== 'object') {
      context.system.magicalTrait = {};
    }

    if (effectiveTraitType && !context.system.magicalTrait.type) {
      context.system.magicalTrait.type = effectiveTraitType;
    }

    if (detectedTrait && context.system.magicalTrait.isSetup == null) {
      context.system.magicalTrait.isSetup = false;
    }

    if (!effectiveTraitType) {
      return;
    }
    
    // Display name mapping
    const traitNames = {
      'mageborn': 'Mageborn',
      'divine-gift': 'Divine Gift',
      'invoker': 'Invoker',
      'infuser': 'Infuser',
      'sorcerous-origin': 'Sorcerous Origin',
      'eldritch-pact': 'Eldritch Pact',
      'alchemical-tradition': 'Alchemical Tradition'
    };
    
    context.magicalTraitDisplayName = traitNames[effectiveTraitType] || effectiveTraitType;
    context.isAlchemicalTradition = effectiveTraitType === 'alchemical-tradition';
    
    // Enrich casting stat display
    if (context.system.castingStat && context.system.castingStat.value && context.system.attributes) {
      const abilityKey = context.system.castingStat.value;
      const attribute = context.system.attributes[abilityKey];
      if (attribute) {
        const value = attribute.value || 0;
        context.system.castingStat.displayLabel = attribute.label || abilityKey;
        context.system.castingStat.displayValue = value;
      }
    }
    
    // Check for modifier traits
    const items = this.actor.items;
    context.hasGiftedMage = items.some(i => 
      i.type === 'trait' && i.name.toLowerCase().includes('gifted mage')
    );
    context.hasBalancedChanneler = items.some(i => 
      i.type === 'trait' && i.name.toLowerCase().includes('balanced channeler')
    );
  }

  /**
   * Get tier information from XP
   */
  _getTierInfo(xp) {
    return game.legends?.progression?.getTierInfoFromXp?.(xp) || {
      current: 1,
      xp: Number(xp || 0)
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // AppV2 doesn't auto-wire V1-style tabs. Set up tab switching manually.
    const nav = this.element.querySelector('.sheet-tabs[data-group="primary"]');
    if (nav) {
      const tabs = nav.querySelectorAll('[data-tab]');
      const body = this.element.querySelector('.sheet-body');
      const activeTab = this.tabGroups.primary || "main";

      // Set initial active state
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
      if (body) {
        body.querySelectorAll(':scope > .tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === activeTab);
        });
      }

      // Attach click handlers
      tabs.forEach(t => {
        t.addEventListener('click', (ev) => {
          ev.preventDefault();
          const tab = t.dataset.tab;
          this.tabGroups.primary = tab;
          tabs.forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
          if (body) {
            body.querySelectorAll(':scope > .tab').forEach(c => {
              c.classList.toggle('active', c.dataset.tab === tab);
            });
          }
        });
      });
    }
  }

  /** @override */
  async _onDropItem(event, data) {
    if (game.legends.isDraggedEffectData(data)) {
      try {
        await game.legends.applyDraggedEffect(this.actor, data);
      } catch (err) {
        console.error("Failed to apply dragged effect:", err);
        ui.notifications.error(`Failed to apply effect: ${err.message}`);
      }
      return;
    }

    const item = await Item.implementation.fromDropData(data);
    if ( item?.type === "condition" ) {
      await game.legends.applyCondition(this.actor, item.name);
      return;
    }

    return super._onDropItem(event, data);
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  /**
   * Handle weapon attack button clicks
   */
  static async #onWeaponAttack(event, target) {
    event.stopPropagation(); // Prevent triggering expandItem
    const li = target.closest('.item-collapsible');
    const itemId = li?.dataset.itemId;
    if (!itemId) {
      console.error('Item container not found');
      return;
    }
    const modeIndex = parseInt(target.dataset.modeIndex);

    const weapon = this.actor.items.get(itemId);

    if (!weapon) {
      console.error('Weapon not found:', itemId);
      ui.notifications.error('Weapon not found');
      return;
    }

    const attackMode = weapon.system.attackModes[modeIndex];

    if (!attackMode) {
      console.error('Attack mode not found:', modeIndex);
      ui.notifications.error('Attack mode not found');
      return;
    }

    if (!game.legends || !game.legends.combat) {
      console.error('Combat system not initialized');
      ui.notifications.error('Combat system not initialized');
      return;
    }

    // Get selected target
    const targets = Array.from(game.user.targets);
    const targetActor = targets.length > 0 ? targets[0] : null;

    return game.legends.combat.executeWeaponAttack(this.actor, weapon, attackMode, targetActor);
  }

  /**
   * Handle skill rolls
   */
  static async #onSkillRoll(event, target) {
    // Try to get skill from target first, then from parent row
    let skill = target.dataset.skill;
    if (!skill) {
      const row = target.closest('.skill-row');
      if (row) {
        skill = row.dataset.skill;
      }
    }

    if (!skill) {
      ui.notifications.warn('Skill roll is missing its target skill.');
      return;
    }

    return game.legends.rollSkillCheck(this.actor, skill);
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
    const name = `New ${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Item'}`;
    const itemData = {
      name,
      type,
      system: {}
    };
    return await Item.create(itemData, { parent: this.actor });
  }

  static #onItemEdit(event, target) {
    event.stopPropagation();
    const li = target.closest(".item-collapsible");
    const item = this.actor.items.get(li.dataset.itemId);
    item.sheet.render(true);
  }

  /**
   * Handle deleting an item
   */
  static async #onItemDelete(event, target) {
    event.stopPropagation();
    const li = target.closest(".item-collapsible");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) return item.delete();
  }

  /**
   * Handle equipping/unequipping an item
   */
  static async #onItemEquip(event, target) {
    event.stopPropagation();
    const li = target.closest(".item-collapsible");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) {
      return item.update({ 'system.equipped': !item.system.equipped });
    }
  }

  /**
   * Handle opening a compendium browser
   */
  static async #onOpenCompendium(event, target) {
    const compendiumType = target.dataset.compendium || target.dataset.type;

    if (!compendiumType) {
      ui.notifications.warn("Button is missing data-compendium or data-type attribute.");
      return;
    }

    const packName = ITEM_COMPENDIUM_PACKS[compendiumType];

    if (!packName) {
      ui.notifications.warn(`No compendium configured for type: ${compendiumType}`);
      return;
    }

    if (['trait', 'flaw'].includes(compendiumType)) {
      const progressionState = game.legends?.progression?.getActorProgressionState?.(this.actor);
      if (progressionState?.isCreation) {
        return D8CharacterSheet.#showTraitFlawCreationWorkflow.call(this, compendiumType, packName);
      }
    }

    const pack = game.packs.get(packName);

    if (pack) {
      pack.render(true);
    } else {
      ui.notifications.warn(`Compendium pack "${packName}" not found. Check system.json configuration.`);
    }
  }

  static #getTraitFlawPointSummary(actor) {
    const traits = actor.items.filter((item) => item.type === 'trait');
    const flaws = actor.items.filter((item) => item.type === 'flaw');
    const spent = traits.reduce((total, item) => total + Number(item.system?.pointCost || 0), 0);
    const earned = flaws.reduce((total, item) => total + Number(item.system?.pointValue || 0), 0);
    return {
      spent,
      earned,
      remaining: earned - spent,
      isOverspent: spent > earned
    };
  }

  static async #showTraitFlawCreationWorkflow(type, packName) {
    const pack = game.packs.get(packName);
    if (!pack) {
      ui.notifications.warn(`Compendium pack "${packName}" not found. Check system.json configuration.`);
      return;
    }

    const actor = this.actor;
    const pointSummary = D8CharacterSheet.#getTraitFlawPointSummary(actor);
    const ownedNames = new Set(
      actor.items
        .filter((item) => item.type === type)
        .map((item) => String(item.name || '').trim().toLowerCase())
    );

    const documents = await pack.getDocuments();
    const options = documents
      .filter((entry) => !ownedNames.has(String(entry.name || '').trim().toLowerCase()))
      .map((entry) => {
        const pointDelta = type === 'trait'
          ? Number(entry.system?.pointCost || 0)
          : Number(entry.system?.pointValue || 0);
        const requiresGMApproval = Boolean(entry.system?.requiresGMApproval);
        const disabled = type === 'trait' && pointDelta > pointSummary.remaining;
        const reason = disabled
          ? `Requires ${pointDelta} points, only ${pointSummary.remaining} available.`
          : requiresGMApproval
            ? 'Requires GM approval.'
            : '';
        return {
          document: entry,
          pointDelta,
          disabled,
          reason,
          label: type === 'trait'
            ? `${entry.name} (${pointDelta} points)`
            : `${entry.name} (+${pointDelta} points)`
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    const availableOptions = options.filter((option) => !option.disabled);
    if (type === 'trait' && availableOptions.length === 0) {
      ui.notifications.warn(`${actor.name} does not have enough unspent flaw points to add another trait during creation.`);
      return;
    }

    if (!options.length) {
      ui.notifications.warn(`No ${type}s are available to import.`);
      return;
    }

    const optionMarkup = options.map((option, index) => {
      const suffix = option.reason ? ` - ${option.reason}` : '';
      return `<option value="${index}" ${option.disabled ? 'disabled' : ''}>${Handlebars.escapeExpression(option.label + suffix)}</option>`;
    }).join('');

    const titleLabel = type === 'trait' ? 'Add Trait' : 'Add Flaw';
    const budgetNote = type === 'trait'
      ? `<div style="font-size: 12px; color: #666;">Traits spend flaw points during creation. Only affordable traits can be selected.</div>`
      : `<div style="font-size: 12px; color: #666;">Flaws add points to the creation budget and can still require GM approval.</div>`;

    const selectedOption = await foundry.applications.api.DialogV2.wait({
      window: { title: `${titleLabel}: ${actor.name}` },
      content: `
        <form style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
          <div><strong>Creation Point Budget</strong>: ${pointSummary.spent} spent / ${pointSummary.earned} earned (${pointSummary.remaining} remaining)</div>
          <div class="form-group">
            <label>Select a ${type}</label>
            <select name="creationImport" style="width: 100%; padding: 6px;">
              ${optionMarkup}
            </select>
          </div>
          ${budgetNote}
        </form>
      `,
      buttons: [
        {
          action: 'import',
          label: titleLabel,
          default: true,
          callback: (event, button, dialog) => {
            const index = Number.parseInt(dialog.element.querySelector('[name="creationImport"]')?.value || '-1', 10);
            return options[index] || null;
          }
        },
        {
          action: 'cancel',
          label: 'Cancel'
        }
      ]
    });

    if (!selectedOption) return;

    if (selectedOption.disabled) {
      ui.notifications.warn(selectedOption.reason || `That ${type} is not currently available.`);
      return;
    }

    const itemData = selectedOption.document.toObject();
    const [created] = await actor.createEmbeddedDocuments('Item', [itemData]);
    if (!created) {
      ui.notifications.error(`Failed to add ${selectedOption.document.name}.`);
      return;
    }

    ui.notifications.info(`${created.name} added to ${actor.name}.`);
  }

  /**
   * Handle removing a condition
   */
  static async #onConditionRemove(event, target) {
    const conditionName = target.dataset.conditionName;
    if (conditionName) {
      await game.legends.removeCondition(this.actor, conditionName);
    }
  }

  /**
   * Handle posting item to chat
   */
  static async #onItemChat(event, target) {
    event.stopPropagation();
    const li = target.closest(".item-collapsible");
    const item = this.actor.items.get(li.dataset.itemId);

    if (item) {
      // Use the proper chat template system
      await game.legends.chat.createItemChatCard(item);
    }
  }

  /**
   * Handle rolling an item (e.g., casting a weave)
   */
  static async #onItemRoll(event, target) {
    event.stopPropagation();
    const li = target.closest(".item-collapsible");
    const item = this.actor.items.get(li.dataset.itemId);

    if (item) {
      return item.roll();
    }
  }

  /**
   * Handle viewing item details
   */
  static #onItemView(event, target) {
    event.stopPropagation();
    const li = target.closest(".item-collapsible");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) {
      item.sheet.render(true, { editable: false });
    }
  }

  static async #onChangeHeaderChoice(event, target) {
    event.preventDefault();
    event.stopPropagation();

    const itemType = String(target.dataset.itemType || '').trim();
    const packName = ITEM_COMPENDIUM_PACKS[itemType];
    if (!itemType || !packName) {
      ui.notifications.warn('That header choice is not configured for compendium selection.');
      return;
    }

    const progressionState = game.legends?.progression?.getActorProgressionState?.(this.actor);
    if (!progressionState?.isCreation) {
      ui.notifications.warn('Background and ancestry can only be changed from the header during character creation.');
      return;
    }

    const existingItem = this.actor.items.find((item) => item.type === itemType);
    if (existingItem) {
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: `Change ${itemType === 'ancestry' ? 'Ancestry' : 'Background'}` },
        content: `<p>Replace <strong>${existingItem.name}</strong>?</p><p>This removes the current ${itemType} and opens its compendium so you can pick a new one.</p>`
      });

      if (!confirmed) return;

      await existingItem.delete();
      if (itemType === 'ancestry') {
        await this.actor.update({ 'system.biography.ancestry': '' });
      }
    }

    const pack = game.packs.get(packName);
    if (!pack) {
      ui.notifications.warn(`Compendium pack "${packName}" not found. Check system.json configuration.`);
      return;
    }

    pack.render(true);
  }

  /**
   * Handle short rest button click
   */
  static async #onShortRest(event, target) {
    const restState = this.actor.getRestRecoveryState?.('shortRest') || {};
    const con = this.actor.system.attributes.constitution.value;
    const hpRestore = restState.blocksHpRecovery ? 0 : Math.floor(con / (restState.halvesHpRecovery ? 2 : 1));
    let content = `<p>Take a short rest (1 hour)?</p>`;

    if (restState.blocksAllBenefits) {
      content += `<p>You will recover <strong>no short rest benefits</strong> because of <strong>${restState.blockedBy}</strong>.</p>`;
    } else if (restState.blocksShortRestBenefits) {
      content += `<p>You will recover <strong>no short rest benefits</strong> because of <strong>${restState.shortRestBlockedBy}</strong>.</p>`;
    } else {
      content += `<p>You will regain <strong>${hpRestore} HP</strong> and <strong>1 Luck</strong>.</p>`;
      if (restState.blocksHpRecovery) {
        content += `<p><strong>HP recovery is blocked</strong> by <strong>${restState.hpBlockedBy}</strong>.</p>`;
      } else if (restState.halvesHpRecovery) {
        content += `<p><strong>HP recovery is halved</strong> by <strong>${restState.hpHalvedBy}</strong>.</p>`;
      }
    }

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Short Rest" },
      content
    });

    if (!confirmed) return;
    return this.actor.shortRest();
  }

  /**
   * Handle long rest button click
   */
  static async #onLongRest(event, target) {
    const con = this.actor.system.attributes.constitution.value;
    const restState = this.actor.getRestRecoveryState?.('longRest') || {};
    const hpRestore = restState.blocksHpRecovery ? 0 : Math.floor((con * 4) / (restState.halvesHpRecovery ? 2 : 1));

    let content = `<p>Take a long rest (8 hours)?</p>
                  <p>You will regain <strong>${hpRestore} HP</strong> and restore all <strong>Luck</strong> to maximum.`;

    if (restState.blocksAllBenefits) {
      content = `<p>Take a long rest (8 hours)?</p>
                 <p>You will recover <strong>no rest benefits</strong> because of <strong>${restState.blockedBy}</strong>.</p>`;
    } else if (this.actor.system.magicalTrait?.type && this.actor.system.magicalTrait.type !== 'alchemical-tradition') {
      content += ` All <strong>Energy</strong> will also be restored.`;
    }

    if (!restState.blocksAllBenefits && (this.actor.system.channelDivinity?.max ?? 0) > 0) {
      content += ` All <strong>Channel Divinity</strong> uses will also be restored.`;
    }

    if (!restState.blocksAllBenefits) {
      content += `</p>`;
      if (restState.halvesHpRecovery) {
        content += `<p><strong>HP recovery is halved</strong> by <strong>${restState.hpHalvedBy}</strong>.</p>`;
      }
      if (restState.exhaustionCondition) {
        content += `<p><strong>${restState.exhaustionCondition}</strong> will improve by one step.</p>`;
      }
    }

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Long Rest" },
      content: content
    });

    if (!confirmed) return;
    return this.actor.longRest();
  }

  /**
   * Handle setup magical traits button click
   */
  static async #onSetupMagicalTraits(event, target) {
    try {
      const magicalTraits = game.legends.magicalTraits;
      if (!magicalTraits || !magicalTraits.setupMagicalTraits) {
        ui.notifications.error("Magical traits system not loaded");
        return;
      }
      
      const success = await magicalTraits.setupMagicalTraits(this.actor);
      
      if (success) {
        // Re-render sheet to show updated state
        this.render();
      }
    } catch (error) {
      console.error("Error setting up magical traits:", error);
      ui.notifications.error(`Failed to setup magical traits: ${error.message}`);
    }
  }

  static async #onAwardXp(event, target) {
    await game.legends?.progression?.showAwardXPDialog?.(this.actor);
    this.render();
  }

  static async #onSpendXp(event, target) {
    await game.legends?.progression?.showSpendXPDialog?.(this.actor);
    this.render();
  }

  static async #onToggleProgressionPhase(event, target) {
    if (!game.user.isGM) {
      ui.notifications.warn('Only the GM can change progression phase.');
      return;
    }

    await game.legends?.progression?.cycleProgressionPhase?.(this.actor);
    this.render();
  }

  static async #onToggleManualOverride(event, target) {
    if (!game.user.isGM) {
      ui.notifications.warn('Only the GM can toggle manual override.');
      return;
    }

    await game.legends?.progression?.toggleManualOverride?.(this.actor);
    this.render();
  }

  static async #onToggleTrainingCheckbox(event, target) {
    const type = String(target.dataset.trainingType || '').trim();
    const key = String(target.dataset.trainingKey || '').trim();
    if (!type || !key) {
      ui.notifications.warn('Training checkbox is missing its target.');
      return;
    }

    await game.legends?.training?.toggleTrainingCheckbox?.(this.actor, type, key, { notify: true, source: 'sheet-toggle' });
    this.render();
  }

  /**
   * Handle expanding/collapsing item details
   * Universal system for all item types (weapons, armor, feats, etc.)
   */
  static async #onExpandItem(event, target) {
    event.preventDefault();
    
    // Find the collapsible item container
    const itemContainer = target.closest(".item-collapsible");
    if (!itemContainer) {
      console.warn("No .item-collapsible container found for expand action");
      return;
    }
    
    const summary = itemContainer.querySelector('.item-summary');
    const caret = itemContainer.querySelector('.item-caret');
    
    if (!summary) {
      console.warn("No .item-summary element found in collapsible item");
      return;
    }
    
    const isExpanded = itemContainer.classList.contains('expanded');
    
    if (!isExpanded) {
      // EXPANDING: Load content if needed, then expand
      await D8CharacterSheet._loadItemSummaryContent.call(this, itemContainer, summary);
      
      // Add expanded class to trigger CSS animations
      itemContainer.classList.add('expanded');
      
      // Update caret
      if (caret) {
        caret.classList.remove('fa-caret-right');
        caret.classList.add('fa-caret-down');
      }
    } else {
      // COLLAPSING: Remove expanded class
      itemContainer.classList.remove('expanded');
      
      // Update caret
      if (caret) {
        caret.classList.remove('fa-caret-down');
        caret.classList.add('fa-caret-right');
      }
    }
  }

  /**
   * Load content into item summary (similar to PF2E's lazy loading approach)
   */
  static async _loadItemSummaryContent(itemContainer, summary) {
    // Check if content is already loaded
    const existingContent = summary.querySelector('.item-summary-content');
    if (existingContent && existingContent.children.length > 0) {
      return; // Content already loaded
    }
    
    // Get item data
    const itemId = itemContainer.dataset.itemId;
    if (!itemId) {
      console.warn("No item ID found on collapsible item");
      return;
    }
    
    const item = this.actor.items.get(itemId);
    if (!item) {
      console.warn(`Item with ID ${itemId} not found`);
      return;
    }
    
    // Show loading state
    summary.classList.add('loading');
    
    try {
      // Create or update summary content
      let contentDiv = existingContent || document.createElement('div');
      contentDiv.className = 'item-summary-content';
      
      // Generate content based on item type
      const content = await D8CharacterSheet._generateItemSummaryHTML(item);
      contentDiv.innerHTML = content;
      
      if (!existingContent) {
        summary.appendChild(contentDiv);
      }
      
    } catch (error) {
      console.error("Error loading item summary content:", error);
      summary.innerHTML = '<div class=\"item-summary-content\"><p>Error loading item details</p></div>';
    } finally {
      summary.classList.remove('loading');
    }
  }

  /**
   * Generate HTML content for item summary based on item type
   */
  static async _generateItemSummaryHTML(item) {
    const system = item.system;
    let html = '';
    
    // Item description
    if (system.description?.value) {
      const TextEditor = foundry.applications.ux.TextEditor.implementation;
      const enrichedDescription = await TextEditor.enrichHTML(system.description.value, { async: true });
      html += `<div class=\"description\">${enrichedDescription}</div>`;
    }
    
    // Type-specific details
    switch (item.type) {
      case 'ancestry':
        html += D8CharacterSheet._generateAncestrySummary(system);
        break;
      case 'weapon':
        html += D8CharacterSheet._generateWeaponSummary(system);
        break;
      case 'armor':
        html += D8CharacterSheet._generateArmorSummary(system);
        break;
      case 'shield':
        html += D8CharacterSheet._generateShieldSummary(system);
        break;
      case 'weave':
        html += D8CharacterSheet._generateWeaveSummary(system);
        break;
      case 'feat':
        html += D8CharacterSheet._generateFeatSummary(system);
        break;
      case 'trait':
      case 'flaw':
        html += D8CharacterSheet._generateTraitSummary(system);
        break;
      case 'action':
        html += D8CharacterSheet._generateActionSummary(system);
        break;
      case 'ability':
        html += D8CharacterSheet._generateAbilitySummary(system);
        break;
      case 'condition':
        html += D8CharacterSheet._generateConditionSummary(system);
        break;
      default:
        html += D8CharacterSheet._generateGenericSummary(system);
    }
    
    return html;
  }

  static _generateAncestrySummary(system) {
    let html = '<div class="details-section">';

    if (system.size) {
      html += `<div class="detail-row"><span class="detail-label">Size:</span><span class="detail-value">${system.size}</span></div>`;
    }
    if (Number.isFinite(system.speed)) {
      html += `<div class="detail-row"><span class="detail-label">Speed:</span><span class="detail-value">${system.speed} ft</span></div>`;
    }
    if (Number.isFinite(system.lifespan) && system.lifespan > 0) {
      html += `<div class="detail-row"><span class="detail-label">Lifespan:</span><span class="detail-value">${system.lifespan} years</span></div>`;
    }
    if (system.traits) {
      html += `<div class="detail-row"><span class="detail-label">Traits:</span><span class="detail-value">${system.traits}</span></div>`;
    }

    if (system.effect) {
      html += `<div class="details-section"><div class="detail-row"><span class="detail-label">Effect:</span><span class="detail-value">${system.effect.replace(/\n/g, '<br>')}</span></div></div>`;
    }

    if (system.special) {
      html += `<div class="details-section"><div class="detail-row"><span class="detail-label">Special:</span><span class="detail-value">${system.special.replace(/\n/g, '<br>')}</span></div></div>`;
    }
    if (system.languages) {
      html += `<div class="detail-row"><span class="detail-label">Languages:</span><span class="detail-value">${system.languages.replace(/\n/g, '<br>')}</span></div>`;
    }
    if (system.senses) {
      html += `<div class="detail-row"><span class="detail-label">Senses:</span><span class="detail-value">${system.senses.replace(/\n/g, '<br>')}</span></div>`;
    }
    html += '</div>';

    if (system.specialAbilities) {
      html += `<h4>Special Abilities</h4><div class="details-section"><div class="detail-row"><span class="detail-value">${system.specialAbilities.replace(/\n/g, '<br>')}</span></div></div>`;
    }
    if (system.culture) {
      html += `<h4>Culture</h4><div class="details-section"><div class="detail-row"><span class="detail-value">${system.culture.replace(/\n/g, '<br>')}</span></div></div>`;
    }
    if (system.physicalDescription) {
      html += `<h4>Physical Description</h4><div class="details-section"><div class="detail-row"><span class="detail-value">${system.physicalDescription.replace(/\n/g, '<br>')}</span></div></div>`;
    }

    return html;
  }

  /**
   * Generate ability-specific summary content
   */
  static _generateAbilitySummary(system) {
    let html = '<div class="details-section">';

    if (system.abilityType) {
      html += `<div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${system.abilityType}</span></div>`;
    }
    if (system.source) {
      html += `<div class="detail-row"><span class="detail-label">Source:</span><span class="detail-value">${system.source}</span></div>`;
    }
    if (system.actionCost) {
      html += `<div class="detail-row"><span class="detail-label">Cost:</span><span class="detail-value">${system.actionCost}</span></div>`;
    }
    if (system.requirements) {
      html += `<div class="detail-row"><span class="detail-label">Requirements:</span><span class="detail-value">${system.requirements}</span></div>`;
    }
    if (system.trigger) {
      html += `<div class="detail-row"><span class="detail-label">Trigger:</span><span class="detail-value">${system.trigger}</span></div>`;
    }
    if (system.range) {
      html += `<div class="detail-row"><span class="detail-label">Range:</span><span class="detail-value">${system.range}</span></div>`;
    }
    if (system.target) {
      html += `<div class="detail-row"><span class="detail-label">Target:</span><span class="detail-value">${system.target}</span></div>`;
    }
    if (system.frequency) {
      html += `<div class="detail-row"><span class="detail-label">Frequency:</span><span class="detail-value">${system.frequency}</span></div>`;
    }
    if ((system.uses?.max || 0) > 0) {
      html += `<div class="detail-row"><span class="detail-label">Uses:</span><span class="detail-value">${system.uses.value}/${system.uses.max}</span></div>`;
    }
    if (system.recharge?.period) {
      const rechargeLabel = system.recharge.period === 'shortRest' ? 'Short Rest' : 'Long Rest';
      html += `<div class="detail-row"><span class="detail-label">Recharge:</span><span class="detail-value">${rechargeLabel}</span></div>`;
    }
    if (system.usage) {
      html += `<div class="detail-row"><span class="detail-label">Usage:</span><span class="detail-value">${system.usage}</span></div>`;
    }
    html += '</div>';

    if (system.keywords?.length) {
      html += D8CharacterSheet._generateTraitTags(system.keywords);
    }

    if (system.effect) {
      html += `<div class="details-section"><div class="detail-row"><span class="detail-label">Effect:</span><span class="detail-value">${system.effect.replace(/\n/g, '<br>')}</span></div></div>`;
    }

    return html;
  }

  /**
   * Generate weapon-specific summary content
   */
  static _generateWeaponSummary(system) {
    let html = '';
    
    if (system.damage?.base || system.attack?.bonus) {
      html += '<div class=\"details-section\">';
      if (system.attack?.bonus) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Attack Bonus:</span><span class=\"detail-value\">+${system.attack.bonus}</span></div>`;
      }
      if (system.damage?.base) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Damage:</span><span class=\"detail-value\">${system.damage.base} ${system.damage.type || ''}</span></div>`;
      }
      if (system.range) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Range:</span><span class=\"detail-value\">${system.range}</span></div>`;
      }
      if (system.weight) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Weight:</span><span class=\"detail-value\">${system.weight} lbs</span></div>`;
      }
      html += '</div>';
    }
    
    if (system.traits?.length) {
      html += D8CharacterSheet._generateTraitTags(system.traits);
    }
    
    return html;
  }

  /**
   * Generate armor-specific summary content
   */
  static _generateArmorSummary(system) {
    let html = '';
    const armorTypeLabels = {
      light: 'Light Armor',
      medium: 'Medium Armor',
      heavy: 'Heavy Armor'
    };
    const stealthPenaltyLabels = {
      none: 'None',
      noisy: 'Noisy (+1 to both dice on Stealth checks)',
      loud: 'Loud (+2 to both dice on Stealth checks)'
    };
    
    if (system.armorType || system.dr || system.stealthPenalty || system.swimPenalty || system.donTime || system.doffTime || system.weight || system.cost) {
      html += '<div class=\"details-section\">';
      if (system.armorType) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Type:</span><span class=\"detail-value\">${armorTypeLabels[system.armorType] || system.armorType}</span></div>`;
      }
      if (system.dr) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">DR:</span><span class=\"detail-value\">S:${system.dr.slashing || 0} P:${system.dr.piercing || 0} B:${system.dr.bludgeoning || 0}</span></div>`;
      }
      if (system.stealthPenalty) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Stealth:</span><span class=\"detail-value\">${stealthPenaltyLabels[system.stealthPenalty] || system.stealthPenalty}</span></div>`;
      }
      if (system.swimPenalty) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Swim:</span><span class=\"detail-value\">${system.swimPenalty}</span></div>`;
      }
      if (system.donTime) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Don Time:</span><span class=\"detail-value\">${system.donTime}</span></div>`;
      }
      if (system.doffTime) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Doff Time:</span><span class=\"detail-value\">${system.doffTime}</span></div>`;
      }
      if (system.weight) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Weight:</span><span class=\"detail-value\">${system.weight} lbs</span></div>`;
      }
      if (system.cost) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Cost:</span><span class=\"detail-value\">${system.cost} gp</span></div>`;
      }
      html += '</div>';
    }
    
    if (system.properties?.length) {
      html += D8CharacterSheet._generateTraitTags(system.properties);
    }

    if (system.notes) {
      html += `<div class="details-section"><div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${system.notes.replace(/\n/g, '<br>')}</span></div></div>`;
    }
    
    return html;
  }

  /**
   * Generate shield-specific summary content
   */
  static _generateShieldSummary(system) {
    let html = '<div class="details-section">';
    const linkedAbilities = Array.isArray(system.linkedAbilities) ? system.linkedAbilities : [];
    const reactions = Array.isArray(system.reactions) ? system.reactions : [];

    if (system.shieldType) {
      html += `<div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${system.shieldType}</span></div>`;
    }
    if (system.handUsage) {
      html += `<div class="detail-row"><span class="detail-label">Hand Usage:</span><span class="detail-value">${system.handUsage}</span></div>`;
    }
    if (system.meleeDefense) {
      html += `<div class="detail-row"><span class="detail-label">Melee Defense:</span><span class="detail-value">${system.meleeDefense}</span></div>`;
    }
    if (system.requirements) {
      html += `<div class="detail-row"><span class="detail-label">Requirements:</span><span class="detail-value">${system.requirements}</span></div>`;
    }
    if (system.plantedMode) {
      html += '<div class="detail-row"><span class="detail-label">Planted:</span><span class="detail-value">Yes</span></div>';
    }
    if (system.weight) {
      html += `<div class="detail-row"><span class="detail-label">Weight:</span><span class="detail-value">${system.weight} lbs</span></div>`;
    }
    if (system.cost) {
      html += `<div class="detail-row"><span class="detail-label">Cost:</span><span class="detail-value">${system.cost} gp</span></div>`;
    }
    html += '</div>';

    if (reactions.length) {
      html += '<h4>Reactions</h4><div class="details-section">';
      reactions.forEach(reaction => {
        const reactionName = reaction?.name || reaction?.type || 'Reaction';
        const reactionDescription = reaction?.description || reaction?.effect || '';
        html += `<div class="detail-row"><span class="detail-label">${reactionName}:</span><span class="detail-value">${reactionDescription}</span></div>`;
      });
      html += '</div>';
    }

    if (linkedAbilities.length) {
      html += '<h4>Granted Abilities</h4><div class="details-section">';
      linkedAbilities.forEach(ability => {
        const abilityName = ability?.name || ability?.sourceName || 'Ability';
        const abilityDescription = ability?.description || ability?.effect || 'Granted while equipped';
        html += `<div class="detail-row"><span class="detail-label">${abilityName}:</span><span class="detail-value">${abilityDescription}</span></div>`;
      });
      html += '</div>';
    }

    if (system.specialAbilities) {
      html += `<div class="details-section"><div class="detail-row"><span class="detail-label">Special Abilities:</span><span class="detail-value">${system.specialAbilities.replace(/\n/g, '<br>')}</span></div></div>`;
    }

    if (system.notes) {
      html += `<div class="details-section"><div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${system.notes.replace(/\n/g, '<br>')}</span></div></div>`;
    }

    return html;
  }

  /**
   * Generate weave-specific summary content
   */
  static _generateWeaveSummary(system) {
    let html = '';
    
    html += '<div class="details-section">';
    if (system.weaveType) {
      html += `<div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${system.weaveType}</span></div>`;
    }
    if (system.actionCost) {
      html += `<div class="detail-row"><span class="detail-label">Actions:</span><span class="detail-value">${system.actionCost}</span></div>`;
    }
    if (system.range) {
      html += `<div class="detail-row"><span class="detail-label">Range:</span><span class="detail-value">${system.range}</span></div>`;
    }
    if (system.duration) {
      html += `<div class="detail-row"><span class="detail-label">Duration:</span><span class="detail-value">${system.duration}</span></div>`;
    }
    html += '</div>';
    
    // Energy costs
    if (system.energyCost || system.energyCosts) {
      const costs = system.energyCost || system.energyCosts;
      if (costs.primary || costs.supporting) {
        html += '<h4>Energy Costs</h4><div class="details-section">';
        if (costs.primary && (costs.primary.type || costs.primary.cost)) {
          const primaryTypeLabel = costs.primary.type === 'variable-elemental' ? 'Variable Elemental' : (costs.primary.type || 'Unknown');
          const primaryIcon = costs.primary.type && costs.primary.type !== 'variable-elemental' ? `<img src="systems/legends/images/icons/magic/${costs.primary.type}.svg" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" title="${costs.primary.type}" />` : '';
          html += `<div class="detail-row"><span class="detail-label">Primary:</span><span class="detail-value">${primaryIcon}${primaryTypeLabel} ${costs.primary.cost || 0}</span></div>`;
        }
        if (costs.supporting && (costs.supporting.type || costs.supporting.cost)) {
          const supportingTypeLabel = costs.supporting.type === 'variable-elemental' ? 'Variable Elemental' : (costs.supporting.type || 'Unknown');
          const supportIcon = costs.supporting.type && costs.supporting.type !== 'variable-elemental' ? `<img src="systems/legends/images/icons/magic/${costs.supporting.type}.svg" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" title="${costs.supporting.type}" />` : '';
          html += `<div class="detail-row"><span class="detail-label">Supporting:</span><span class="detail-value">${supportIcon}${supportingTypeLabel} ${costs.supporting.cost || 0}</span></div>`;
        }
        html += '</div>';
      }
    }
    
    // Additional weave properties
    if (system.effect) {
      html += `<div class="detail-row"><span class="detail-label">Effect:</span><span class="detail-value">${system.effect}</span></div>`;
    }
    if (system.savingThrow) {
      html += `<div class="detail-row"><span class="detail-label">Saving Throw:</span><span class="detail-value">${system.savingThrow}</span></div>`;
    }
    if (system.successScaling) {
      html += `<div class="detail-row"><span class="detail-label">Success Scaling:</span><span class="detail-value">${system.successScaling}</span></div>`;
    }
    
    return html;
  }

  /**
   * Generate feat-specific summary content
   */
  static _generateFeatSummary(system) {
    let html = '';
    const usage = system.usage && typeof system.usage === 'object' ? system.usage : null;
    const usageMode = usage?.mode || system.usageType || '';
    const usageText = typeof usage?.text === 'string' ? usage.text.trim() : '';
    const trackedUses = Number(usage?.uses?.max || 0) > 0;
    const rechargeLabel = usage?.recharge?.period === 'shortRest'
      ? 'Short Rest'
      : (usage?.recharge?.period === 'longRest' ? 'Long Rest' : '');
    const prereqText = D8CharacterSheet._formatPrerequisites(system.prerequisites);
      if (prereqText) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Prerequisites:</span><span class=\"detail-value\">${prereqText}</span></div>`;
      }
    
    if (usageMode) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Usage:</span><span class=\"detail-value\">${usageMode}</span></div>`;
    }

    if (usageText) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Usage Text:</span><span class=\"detail-value\">${usageText}</span></div>`;
    }

    if (trackedUses) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Uses:</span><span class=\"detail-value\">${usage.uses.value}/${usage.uses.max}</span></div>`;
      if (rechargeLabel) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Recharge:</span><span class=\"detail-value\">${rechargeLabel}</span></div>`;
      }
    }
    
    if (system.keywords?.length) {
      html += D8CharacterSheet._generateTraitTags(system.keywords);
    }
    
    return html;
  }

  /**
   * Format prerequisites object into a readable string
   */
  static _formatPrerequisites(prereqs) {
    // Handle string format (legacy)
    if (typeof prereqs === 'string') {
      return prereqs;
    }
    
    // Handle object format
    if (typeof prereqs !== 'object' || prereqs === null) {
      return '';
    }
    
    const parts = [];
    
    // Attribute names map
    const attrNames = {
      strength: 'Str',
      constitution: 'Con',
      agility: 'Agi',
      dexterity: 'Dex',
      intelligence: 'Int',
      wisdom: 'Wis',
      charisma: 'Cha',
      luck: 'Luck'
    };
    
    // Skill names map
    const skillNames = SKILL_LABELS;
    
    // Format attributes
    if (prereqs.attributes && typeof prereqs.attributes === 'object') {
      for (const [attr, value] of Object.entries(prereqs.attributes)) {
        if (value) {
          const displayName = attrNames[attr] || attr;
          parts.push(`${displayName} ${value}`);
        }
      }
    }
    
    // Format skills
    if (prereqs.skills) {
      const skillStr = typeof prereqs.skills === 'string' ? prereqs.skills : '';
      const skillParts = skillStr.split(',').map(s => s.trim()).filter(Boolean);
      for (const skillPart of skillParts) {
        const [skill, value] = skillPart.split(':');
        if (skill && value) {
          const displayName = skillNames[skill.trim()] || skill.trim();
          parts.push(`${displayName} ${value}`);
        }
      }
    }
    
    // Format feats
    if (prereqs.feats && Array.isArray(prereqs.feats) && prereqs.feats.length > 0) {
      parts.push(...prereqs.feats.filter(Boolean));
    }
    
    // Format tier
    if (prereqs.tier && prereqs.tier > 1) {
      parts.push(`Tier ${prereqs.tier}`);
    }
    
    // Format other
    if (prereqs.other && typeof prereqs.other === 'string' && prereqs.other.trim()) {
      parts.push(prereqs.other.trim());
    }
    
    return parts.join(', ');
  }

  /**
   * Generate trait/flaw summary content
   */
  static _generateTraitSummary(system) {
    let html = '';
    
    if (system.category) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Category:</span><span class=\"detail-value\">${system.category}</span></div>`;
    }
    
    if (system.tier) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Tier:</span><span class=\"detail-value\">${system.tier}</span></div>`;
    }
    
    return html;
  }

  /**
   * Generate action summary content
   */
  static _generateActionSummary(system) {
    let html = '<div class=\"details-section\">';

    if (system.actionType) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Type:</span><span class=\"detail-value\">${system.actionType}</span></div>`;
    }
    if (system.actionCost) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Cost:</span><span class=\"detail-value\">${system.actionCost}</span></div>`;
    }
    if (system.requirements) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Requirements:</span><span class=\"detail-value\">${system.requirements}</span></div>`;
    }
    if (system.trigger) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Trigger:</span><span class=\"detail-value\">${system.trigger}</span></div>`;
    }
    if (system.range) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Range:</span><span class=\"detail-value\">${system.range}</span></div>`;
    }
    if (system.target) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Target:</span><span class=\"detail-value\">${system.target}</span></div>`;
    }
    if (system.frequency) {
      html += `<div class=\"detail-row\"><span class=\"detail-label\">Frequency:</span><span class=\"detail-value\">${system.frequency}</span></div>`;
    }
    html += '</div>';
    
    if (system.keywords?.length) {
      html += D8CharacterSheet._generateTraitTags(system.keywords);
    }

    if (system.effect) {
      html += `<div class=\"details-section\"><div class=\"detail-row\"><span class=\"detail-label\">Effect:</span><span class=\"detail-value\">${system.effect.replace(/\n/g, '<br>')}</span></div></div>`;
    }

    if (system.special) {
      html += `<div class=\"details-section\"><div class=\"detail-row\"><span class=\"detail-label\">Special:</span><span class=\"detail-value\">${system.special.replace(/\n/g, '<br>')}</span></div></div>`;
    }
    
    return html;
  }

  /**
   * Generate condition summary content
   */
  static _generateConditionSummary(system) {
    let html = '<div class="details-section">';

    if (system.category) {
      html += `<div class="detail-row"><span class="detail-label">Category:</span><span class="detail-value">${system.category}</span></div>`;
    }
    if (system.severity) {
      html += `<div class="detail-row"><span class="detail-label">Severity:</span><span class="detail-value">${system.severity}</span></div>`;
    }
    if (system.stacking) {
      html += `<div class="detail-row"><span class="detail-label">Stacking:</span><span class="detail-value">${system.stacking}</span></div>`;
    }
    if ((system.stacks || 0) > 1) {
      html += `<div class="detail-row"><span class="detail-label">Stacks:</span><span class="detail-value">${system.stacks}</span></div>`;
    }
    if (system.damageTick?.formula && system.damageTick?.frequency) {
      html += `<div class="detail-row"><span class="detail-label">Damage Tick:</span><span class="detail-value">${system.damageTick.formula} (${system.damageTick.frequency})</span></div>`;
    }
    if (system.appliesConditions?.length) {
      html += `<div class="detail-row"><span class="detail-label">Applies:</span><span class="detail-value">${system.appliesConditions.join(', ')}</span></div>`;
    }

    html += '</div>';

    if (system.keywords?.length) {
      html += D8CharacterSheet._generateTraitTags(system.keywords);
    }

    return html;
  }

  /**
   * Generate generic item summary content
   */
  static _generateGenericSummary(system) {
    let html = '';
    
    if (system.weight || system.cost) {
      html += '<div class=\"details-section\">';
      if (system.weight) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Weight:</span><span class=\"detail-value\">${system.weight} lbs</span></div>`;
      }
      if (system.cost) {
        html += `<div class=\"detail-row\"><span class=\"detail-label\">Cost:</span><span class=\"detail-value\">${system.cost} gp</span></div>`;
      }
      html += '</div>';
    }
    
    return html;
  }

  /**
   * Generate trait tags HTML
   */
  static _generateTraitTags(traits) {
    if (!traits) return '';
    
    // Convert to array if needed
    let traitArray = [];
    if (Array.isArray(traits)) {
      traitArray = traits;
    } else if (typeof traits === 'string') {
      // If it's a comma-separated string, split it
      traitArray = traits.split(',').map(t => t.trim()).filter(t => t);
    } else if (typeof traits === 'object') {
      // If it's an object, try to get values
      traitArray = Object.values(traits).filter(t => t);
    }
    
    if (traitArray.length === 0) return '';
    
    let html = '<div class=\"item-tags\">';
    traitArray.forEach(trait => {
      html += `<span class=\"item-tag\">${trait}</span>`;
    });
    html += '</div>';
    
    return html;
  }
}
