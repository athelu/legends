/**
 * D8 TTRPG Character Sheet
 */
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
    
    // Enrich biography HTML
    context.enrichedBiography = await TextEditor.enrichHTML(context.system.biography.value, {
      secrets: this.actor.isOwner,
      async: true
    });
    
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
      }
    }
    
    context.weapons = weapons;
    context.armor = armor;
    context.equipment = equipment;
    context.weaves = weaves;
    context.feats = feats;
    context.traits = traits;
    context.flaws = flaws;
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
      empathy: "Empathy",
      medicine: "Medicine",
      wilderness: "Wilderness",
      religion: "Religion",
      persuasion: "Persuasion",
      intimidate: "Intimidate",
      perform: "Perform",
      deception: "Deception"
    };
    
    context.skillList = Object.keys(skills).map(key => ({
      key,
      label: skillLabels[key] || key,
      value: skills[key].value,
      attr: skills[key].attr
    }));
  }
  
  /**
   * Get tier information based on XP
   */
  _getTierInfo(xp) {
    const tiers = [
      { tier: 1, min: 0, max: 120, maxFeats: 4 },
      { tier: 2, min: 120, max: 360, maxFeats: 6 },
      { tier: 3, min: 360, max: 600, maxFeats: 8 },
      { tier: 4, min: 600, max: 840, maxFeats: 10 },
      { tier: 5, min: 840, max: 1080, maxFeats: 12 },
      { tier: 6, min: 1080, max: 1320, maxFeats: 14 },
      { tier: 7, min: 1320, max: 1560, maxFeats: 16 },
      { tier: 8, min: 1560, max: 99999, maxFeats: 18 }
    ];
    
    for (let t of tiers) {
      if (xp >= t.min && xp < t.max) {
        return {
          current: t.tier,
          xp: xp,
          xpInTier: xp - t.min,
          xpToNext: t.max - xp,
          maxFeats: t.maxFeats
        };
      }
    }
    
    return { current: 1, xp: 0, xpInTier: 0, xpToNext: 120, maxFeats: 4 };
  }
  
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    
    // Rollable abilities
    html.find('.rollable').click(this._onRoll.bind(this));
    
    // Attribute rolls
    html.find('.attribute-roll').click(this._onAttributeRoll.bind(this));
    
    // Skill rolls
    html.find('.skill-roll').click(this._onSkillRoll.bind(this));
    
    // Saving throws
    html.find('.save-roll').click(this._onSaveRoll.bind(this));
    
    // Rest buttons
    html.find('.short-rest').click(this._onShortRest.bind(this));
    html.find('.long-rest').click(this._onLongRest.bind(this));
    
    // Spend luck
    html.find('.spend-luck').click(this._onSpendLuck.bind(this));
    
    // Item controls
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.item-equip').click(this._onItemEquip.bind(this));
    
    // Drag events for macros
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  
  /**
   * Handle clickable rolls
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    
    if (dataset.rollType) {
      if (dataset.rollType === 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }
    
    // Handle other roll types
    if (dataset.roll) {
      let label = dataset.label ? `${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }
  
  /**
   * Handle attribute rolls
   */
  async _onAttributeRoll(event) {
    event.preventDefault();
    const attr = event.currentTarget.dataset.attribute;
    
    // For now, just display the attribute value
    // In the future, this could roll d8 against the attribute
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="d8-roll"><h3>${attr.charAt(0).toUpperCase() + attr.slice(1)}</h3><p>Value: ${this.actor.system.attributes[attr].value}</p></div>`
    });
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
  
  /**
   * Handle short rest
   */
  async _onShortRest(event) {
    event.preventDefault();
    return this.actor.shortRest();
  }
  
  /**
   * Handle long rest
   */
  async _onLongRest(event) {
    event.preventDefault();
    return this.actor.longRest();
  }
  
  /**
   * Handle spending luck
   */
  async _onSpendLuck(event) {
    event.preventDefault();
    
    // Prompt for amount
    const amount = await Dialog.prompt({
      title: "Spend Luck",
      content: `
        <form>
          <div class="form-group">
            <label>Amount to spend:</label>
            <input type="number" name="amount" value="1" min="1" max="${this.actor.system.luck.current}" />
          </div>
        </form>
      `,
      callback: html => {
        const form = html[0].querySelector("form");
        return parseInt(form.amount.value);
      },
      rejectClose: false
    });
    
    if (amount) {
      return this.actor.spendLuck(amount);
    }
  }
  
  /**
   * Handle creating a new Owned Item
   */
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
  
  /**
   * Handle editing an Item
   */
  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    return item.sheet.render(true);
  }
  
  /**
   * Handle deleting an Item
   */
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
  
  /**
   * Handle equipping/unequipping an Item
   */
  async _onItemEquip(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    
    return item.update({ 'system.equipped': !item.system.equipped });
  }
}
