/**
 * D8 TTRPG Character Sheet
 */
const { ActorSheet } = foundry.appv1.sheets;
export class D8CharacterSheet extends ActorSheet {
  
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["legends", "sheet", "actor", "character"],
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }
  
  /** @override */
  get template() {
    return `systems/legends/templates/actor/character-sheet.hbs`;
  }
  
  /** @override */
  async getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);
    
    context.system = actorData.system;
    context.flags = actorData.flags;
    
    // Prepare character data
    this._prepareItems(context);
    this._prepareSkills(context);
    
    // Add tier information
    context.tier = this._getTierInfo(context.system.tier?.xp || 0);
    
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
    const reactions = [];
    const otherActions = [];
    
    // Abilities
    const abilities = [];
    
    for (let item of context.items) {
      item.img = item.img || DEFAULT_TOKEN;
      
      switch (item.type) {
        case 'weapon':
          weapons.push(item);
          break;
        case 'armor':
          armor.push(item);
          break;
        case 'equipment':
          equipment.push(item);
          break;
        case 'weave':
          weaves.push(item);
          break;
        case 'feat':
          feats.push(item);
          break;
        case 'trait':
          traits.push(item);
          break;
        case 'flaw':
          flaws.push(item);
          break;
        case 'background':
          backgrounds.push(item);
          break;
        case 'ancestry':
          ancestries.push(item);
          break;
        case 'action':
          // Categorize actions by type
          if (item.system.actionType === 'combat') {
            combatActions.push(item);
          } else if (item.system.actionType === 'move') {
            movementActions.push(item);
          } else if (item.system.actionType === 'reaction') {
            reactions.push(item);
          } else {
            otherActions.push(item);
          }
          break;
        case 'ability':
          abilities.push(item);
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
    context.reactions = reactions;
    context.otherActions = otherActions;
    
    // Abilities
    context.abilities = abilities;
  }
  
  /**
   * Prepare skills with labels
   */
  _prepareSkills(context) {
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
    for (let [key, label] of Object.entries(skillLabels)) {
      skillList.push({
        key: key,
        label: label,
        value: skills[key] || 0,
        attr: skillAttributes[key]
      });
    }
    
    context.skillList = skillList;
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
  activateListeners(html) {
    super.activateListeners(html);
    
    if (!this.isEditable) return;
    
    // Rest buttons
    html.find('.short-rest-button').click(this._onShortRest.bind(this));
    html.find('.long-rest-button').click(this._onLongRest.bind(this));
    
    // Rollable skills
    html.find('.skill-roll').click(this._onSkillRoll.bind(this));
    
    // Rollable items
    html.find('.item-roll, .rollable[data-roll-type="item"]').click(this._onItemRoll.bind(this));
    
    // Item controls
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.item-equip').click(this._onItemEquip.bind(this));
    
    // Open compendium browsing
    html.find('.open-compendium').click(this._onOpenCompendium.bind(this));
    
    // Item chat (post to chat)
    html.find('.item-chat').click(this._onItemChat.bind(this));
    
    // Item view (open sheet in view mode)
    html.find('.item-view').click(this._onItemView.bind(this));
  }
  

  /**
   * Handle skill rolls
   */
  async _onSkillRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    
    // Try to get skill from button first, then from parent row
    let skill = button.dataset.skill;
    if (!skill) {
      const row = button.closest('.skill-row');
      if (row) {
        skill = row.dataset.skill;
      }
    }
    
    if (!skill) {
      console.error('No skill found for roll button', button);
      ui.notifications.error('Could not determine which skill to roll');
      return;
    }
    
    console.log(`Rolling skill: ${skill}`);
    
    // Make sure the roll function exists
    if (!game.legends || !game.legends.rollSkillCheck) {
      console.error('game.legends.rollSkillCheck not found');
      ui.notifications.error('Skill rolling system not initialized');
      return;
    }
    
    return game.legends.rollSkillCheck(this.actor, skill);
  }
  
  /**
   * Handle item rolls
   */
  async _onItemRoll(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.item').dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) return item.roll();
  }
  
  /**
   * Handle creating a new item
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = {
      name: `New ${type.capitalize()}`,
      type: type,
      system: {}
    };
    return await Item.create(data, {parent: this.actor});
  }
  
  /**
   * Handle editing an item
   */
  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    item.sheet.render(true);
  }
  
  /**
   * Handle deleting an item
   */
  async _onItemDelete(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) return item.delete();
  }
  
  /**
   * Handle equipping/unequipping an item
   */
  async _onItemEquip(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) {
      return item.update({ 'system.equipped': !item.system.equipped });
    }
  }
  
  /**
   * Handle opening a compendium browser
   */

  async _onOpenCompendium(event) {
    event.preventDefault();
    const button = event.currentTarget;
    
    // Check both data-compendium and data-type (for backwards compatibility)
    const compendiumType = button.dataset.compendium || button.dataset.type;
    
    // Check if compendium type is specified
    if (!compendiumType) {
      console.warn("No compendium type specified on button:", button);
      ui.notifications.warn("Button is missing data-compendium or data-type attribute.");
      return;
    }
    
    // Map compendium type to pack name
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
      'actions': 'legends.actions',
      'abilities': 'legends.abilities'
    };
    
    const packName = packNames[compendiumType];
    
    if (!packName) {
      console.warn(`Unknown compendium type: "${compendiumType}"`);
      ui.notifications.warn(`No compendium configured for type: ${compendiumType}`);
      return;
    }
    
    const pack = game.packs.get(packName);
    
    if (pack) {
      pack.render(true);
    } else {
      console.warn(`Compendium pack "${packName}" not found.`);
      ui.notifications.warn(`Compendium pack "${packName}" not found. Check system.json configuration.`);
    }
  }
  
  /**
   * Handle posting item to chat
   */
  async _onItemChat(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    
    if (item) {
      const description = item.system.description?.value || item.system.effect || "No description available.";
      
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="legends-item-card">
            <h3>${item.name}</h3>
            <div class="item-description">${description}</div>
            ${item.system.trigger ? `<p><strong>Trigger:</strong> ${item.system.trigger}</p>` : ''}
            ${item.system.frequency ? `<p><strong>Frequency:</strong> ${item.system.frequency}</p>` : ''}
            ${item.system.actionCost ? `<p><strong>Cost:</strong> ${item.system.actionCost}</p>` : ''}
          </div>
        `
      });
    }
  }
  
  /**
   * Handle viewing item details
   */
  _onItemView(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    if (item) {
      item.sheet.render(true, { editable: false });
    }
  }

    /**
   * Handle short rest button click
   */
  async _onShortRest(event) {
    event.preventDefault();
    
    // Confirm the action
    const confirmed = await Dialog.confirm({
      title: "Short Rest",
      content: `<p>Take a short rest (10 minutes)?</p>
                <p>You will regain <strong>${this.actor.system.attributes.constitution.value} HP</strong> and <strong>1 Luck</strong>.</p>`,
      yes: () => true,
      no: () => false
    });
    
    if (!confirmed) return;
    
    // Call the actor's shortRest method
    return this.actor.shortRest();
  }

  /**
   * Handle long rest button click
   */
  async _onLongRest(event) {
    event.preventDefault();
    
    const con = this.actor.system.attributes.constitution.value;
    const hpRestore = con * 4;
    
    // Build the content message
    let content = `<p>Take a long rest (8 hours)?</p>
                  <p>You will regain <strong>${hpRestore} HP</strong> and restore all <strong>Luck</strong> to maximum.`;
    
    if (this.actor.system.energy) {
      content += ` All <strong>Energy</strong> will also be restored.`;
    }
    
    content += `</p>`;
    
    // Confirm the action
    const confirmed = await Dialog.confirm({
      title: "Long Rest",
      content: content,
      yes: () => true,
      no: () => false
    });
    
    if (!confirmed) return;
    
    // Call the actor's longRest method
    return this.actor.longRest();
  }
}

