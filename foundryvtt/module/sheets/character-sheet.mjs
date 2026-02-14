/**
 * Legends D8 TTRPG Character Sheet
 * Foundry VTT V13 - Application V2 (HandlebarsApplicationMixin + ActorSheetV2)
 * Uses: static DEFAULT_OPTIONS, static PARTS, _prepareContext(), data-action event delegation
 */
const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

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
      skillRoll: D8CharacterSheet.#onSkillRoll,
      weaponAttack: D8CharacterSheet.#onWeaponAttack,
      itemCreate: D8CharacterSheet.#onItemCreate,
      itemEdit: D8CharacterSheet.#onItemEdit,
      itemDelete: D8CharacterSheet.#onItemDelete,
      itemEquip: D8CharacterSheet.#onItemEquip,
      openCompendium: D8CharacterSheet.#onOpenCompendium,
      conditionRemove: D8CharacterSheet.#onConditionRemove,
      itemChat: D8CharacterSheet.#onItemChat,
      expandItem: D8CharacterSheet.#onExpandItem,
      itemView: D8CharacterSheet.#onItemView,
      setupMagicalTraits: D8CharacterSheet.#onSetupMagicalTraits,
    },
    dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    form: { submitOnChange: true }
  };

  static PARTS = {
    sheet: { template: "systems/legends/templates/actor/character-sheet.hbs" }
  };

  tabGroups = { primary: "main" };

  /** @override - Configure the window title to show just the actor name */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.window = options.window || {};
    options.window.title = this.document.name || "Character";
  }

  /** @override - Handle form submission properly for ActorSheetV2 */
  async _processSubmitData(event, form, submitData) {
    // Expand the flattened submission data
    const expanded = foundry.utils.expandObject(submitData);
    // Update the actor document with the expanded data
    await this.document.update(expanded);
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actorData = this.actor.toObject(false);

    context.system = actorData.system;
    context.flags = actorData.flags;
    context.actor = actorData;
    context.owner = this.actor.isOwner;
    context.editable = this.isEditable;

    // Prepare character data
    this._prepareItems(context);
    // Compute feat/trait/flaw/ancestry/ability breakdowns for attributes/skills
    const featMods = game.legends?.featEffects?.computeFeatModifiers?.(this.actor) || {};
    this._prepareAttributes(context, featMods);
    this._prepareSkills(context, featMods);

    // Add tier information
    context.tier = this._getTierInfo(context.system.tier?.xp || 0);

    // Add magical trait helpers
    this._prepareMagicalTraitHelpers(context);

    // Update header fields from background/ancestry items
    const backgroundItem = this.actor.items.find(i => i.type === 'background');
    const ancestryItem = this.actor.items.find(i => i.type === 'ancestry');

    if (backgroundItem) {
      context.system.biography.background = backgroundItem.name;
    }
    if (ancestryItem) {
      context.system.biography.ancestry = ancestryItem.name;
    }

    // Enrich biography HTML
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    context.enrichedBiography = await TextEditor.enrichHTML(
      context.system.biography.value,
      {
        secrets: this.actor.isOwner,
        async: true
      }
    );

    return context;
  }

  /**
   * Prepare attributes with base/bonus/total breakdowns
   */
  _prepareAttributes(context, featMods = {}) {
    const attrs = context.system.attributes || {};
    const eff = context.system.attributesEffective || {};
    const list = [];
    const attrBonuses = featMods.attributes || {};
    for (const [key, attr] of Object.entries(attrs)) {
      const base = attr?.value ?? 0;
      const total = eff?.[key] ?? base;
      const bonus = total - base;
      // Build breakdown string
      let breakdown = '';
      if (bonus !== 0) {
        breakdown = `Base: ${base}`;
        if (attrBonuses[key]) breakdown += `\n+${attrBonuses[key]} from feats/abilities`;
        // Add more sources here if needed
        breakdown += `\n= ${total}`;
      }
      list.push({ key, label: attr.label || key, base, bonus, total, breakdown });
    }
    context.attributeList = list;
  }

  /**
   * Organize and classify Items for Character sheets
   */
  _prepareItems(context) {
    const weapons = [];
    const armor = [];
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
    context.equipment = equipment;
    context.weaves = weaves;
    context.feats = feats;
    context.traits = traits;
    context.flaws = flaws;
    context.backgrounds = backgrounds;
    context.ancestries = ancestries;

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
   * Prepare skills with labels
   */
  _prepareSkills(context, featMods = {}) {
    const skills = context.system.skills;
    const skillLabels = {
      athletics: "Athletics",
      might: "Might",
      devices: "Devices",
      thievery: "Thievery",
      writing: "Writing",
      rangedCombat: "Ranged Combat",
      craft: "Craft",
      acrobatics: "Acrobatics",
      meleeCombat: "Melee Combat",
      stealth: "Stealth",
      investigate: "Investigate",
      language: "Language",
      history: "History",
      arcane: "Arcane",
      society: "Society",
      perception: "Perception",
      survival: "Survival",
      persuasion: "Persuasion",
      deception: "Deception",
      intimidate: "Intimidate",
      perform: "Perform",
      insight: "Insight",
      medicine: "Medicine",
      animalHandling: "Animal Handling"
    };

    const skillAttributes = {
      athletics: "str",
      might: "str",
      devices: "dex",
      thievery: "dex",
      writing: "dex",
      rangedCombat: "dex",
      craft: "dex",
      acrobatics: "agi",
      meleeCombat: "agi",
      stealth: "agi",
      investigate: "int",
      language: "int",
      history: "int",
      arcane: "int",
      society: "int",
      perception: "wis",
      survival: "wis",
      persuasion: "cha",
      deception: "cha",
      intimidate: "cha",
      perform: "cha",
      insight: "wis",
      medicine: "wis",
      animalHandling: "wis"
    };

    const skillList = [];
    const skillBonuses = featMods.skills || {};
    for (let [key, label] of Object.entries(skillLabels)) {
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
        attr: skillAttributes[key],
        breakdown
      });
    }

    context.skillList = skillList;
  }

  /**
   * Prepare magical trait helper data for template
   */
  _prepareMagicalTraitHelpers(context) {
    const magicalTrait = context.system.magicalTrait;
    
    // Auto-detect magical trait if not already set
    if (!magicalTrait || !magicalTrait.type) {
      // Check if actor has a magical trait item but magicalTrait.type isn't set
      const detectedTrait = game.legends.magicalTraits.detectPrimaryMagicalTrait(this.actor);
      if (detectedTrait) {
        console.log(`Legends | Auto-detected magical trait: ${detectedTrait.type} (not configured)`);
        // Set the type flag so the setup UI appears
        this.actor.update({
          'system.magicalTrait.type': detectedTrait.type,
          'system.magicalTrait.isSetup': false
        }).then(() => {
          // Re-render to show setup button
          this.render();
        });
      }
      return;
    }
    
    // Display name mapping
    const traitNames = {
      'mageborn': 'Mageborn',
      'divine-gift': 'Divine Gift',
      'invoker': 'Invoker',
      'infuser': 'Infuser',
      'sorcerous-origin': 'Sorcerous Origin',
      'eldritch-pact': 'Eldritch Pact'
    };
    
    context.magicalTraitDisplayName = traitNames[magicalTrait.type] || magicalTrait.type;
    
    // Enrich casting stat display
    if (context.system.castingStat && context.system.castingStat.value && context.system.abilities) {
      const abilityKey = context.system.castingStat.value;
      const ability = context.system.abilities[abilityKey];
      if (ability) {
        const modifier = ability.mod >= 0 ? `+${ability.mod}` : `${ability.mod}`;
        context.system.castingStat.displayLabel = ability.label;
        context.system.castingStat.displayValue = `${ability.value} (${modifier})`;
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
    const tiers = [
      { tier: 1, xp: 0 },
      { tier: 2, xp: 100 },
      { tier: 3, xp: 200 },
      { tier: 4, xp: 400 },
      { tier: 5, xp: 800 },
      { tier: 6, xp: 1600 }
    ];

    let currentTier = 1;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (xp >= tiers[i].xp) {
        currentTier = tiers[i].tier;
        break;
      }
    }

    return {
      current: currentTier,
      xp: xp
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
    // Resolve the dropped item
    const item = await Item.implementation.fromDropData(data);
    if ( item?.type === "condition" ) {
      // Use our condition system instead of creating a plain embedded item
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
    const li = target.closest('.weapon-item');
    const itemId = li.dataset.itemId;
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
      console.error('No skill found for roll button', target);
      ui.notifications.error('Could not determine which skill to roll');
      return;
    }

    return game.legends.rollSkillCheck(this.actor, skill);
  }

  /**
   * Handle creating a new item
   */
  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
    const data = {
      name: `New ${type.capitalize()}`,
      type: type,
      system: {}
    };
    return await Item.create(data, { parent: this.actor });
  }

  /**
   * Handle editing an item
   */
  static #onItemEdit(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    item.sheet.render(true);
  }

  /**
   * Handle deleting an item
   */
  static async #onItemDelete(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) return item.delete();
  }

  /**
   * Handle equipping/unequipping an item
   */
  static async #onItemEquip(event, target) {
    const li = target.closest(".item");
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

    const packNames = {
      'weapon': 'legends.weapons',
      'armor': 'legends.armor',
      'equipment': 'legends.equipment',
      'weave': 'legends.weaves',
      'feat': 'legends.feats',
      'trait': 'legends.traits',
      'flaw': 'legends.flaws',
      'background': 'legends.backgrounds',
      'ancestry': 'legends.ancestries',
      'action': 'legends.action',
      'actions': 'legends.action',
      'abilities': 'legends.abilities',
      'condition': 'legends.conditions'
    };

    const packName = packNames[compendiumType];

    if (!packName) {
      ui.notifications.warn(`No compendium configured for type: ${compendiumType}`);
      return;
    }

    const pack = game.packs.get(packName);

    if (pack) {
      pack.render(true);
    } else {
      ui.notifications.warn(`Compendium pack "${packName}" not found. Check system.json configuration.`);
    }
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
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);

    if (item) {
      // Use the proper chat template system
      await game.legends.chat.createItemChatCard(item);
    }
  }

  /**
   * Handle viewing item details
   */
  static #onItemView(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) {
      item.sheet.render(true, { editable: false });
    }
  }

  /**
   * Handle short rest button click
   */
  static async #onShortRest(event, target) {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Short Rest" },
      content: `<p>Take a short rest (10 minutes)?</p>
                <p>You will regain <strong>${this.actor.system.attributes.constitution.value} HP</strong> and <strong>1 Luck</strong>.</p>`
    });

    if (!confirmed) return;
    return this.actor.shortRest();
  }

  /**
   * Handle long rest button click
   */
  static async #onLongRest(event, target) {
    const con = this.actor.system.attributes.constitution.value;
    const hpRestore = con * 4;

    let content = `<p>Take a long rest (8 hours)?</p>
                  <p>You will regain <strong>${hpRestore} HP</strong> and restore all <strong>Luck</strong> to maximum.`;

    if (this.actor.system.energy) {
      content += ` All <strong>Energy</strong> will also be restored.`;
    }

    content += `</p>`;

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
  /**
   * Handle expanding/collapsible item details
   */
  static async #onExpandItem(event, target) {
    event.preventDefault();
    const li = target.closest(".item");
    const details = li.querySelector('.item-details');
    const caret = li.querySelector('.expand-caret');
    
    if (details && caret) {
      if (details.style.display === 'none' || !details.style.display) {
        details.style.display = 'block';
        caret.classList.remove('fa-caret-right');
        caret.classList.add('fa-caret-down');
        li.classList.add('expanded');
      } else {
        details.style.display = 'none';
        caret.classList.remove('fa-caret-down');
        caret.classList.add('fa-caret-right');
        li.classList.remove('expanded');
      }
    }
  }
}
