/**
 * Legends D8 TTRPG NPC Sheet
 * Foundry VTT V13 - Application V2 (HandlebarsApplicationMixin + ActorSheetV2)
 * Uses: static DEFAULT_OPTIONS, static PARTS, _prepareContext(), data-action event delegation
 */
const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class D8NPCSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["legends", "sheet", "actor", "npc"],
    position: { width: 600, height: 700 },
    actions: {
      rollItem: D8NPCSheet.#onRoll,
      skillRoll: D8NPCSheet.#onSkillRoll,
      saveRoll: D8NPCSheet.#onSaveRoll,
      itemCreate: D8NPCSheet.#onItemCreate,
      itemEdit: D8NPCSheet.#onItemEdit,
      itemDelete: D8NPCSheet.#onItemDelete,
    },
    form: { submitOnChange: true },
    window: { resizable: true }
  };

  static PARTS = {
    sheet: { template: "systems/legends/templates/actor/npc-sheet.hbs" }
  };

  /** @override */
  static TABS = {
    primary: {
      main: { id: "main", group: "primary", label: "Main" },
      combat: { id: "combat", group: "primary", label: "Combat" }
    }
  };

  tabGroups = { primary: "main" };

  /** @override - Configure the window title to show just the actor name */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.window = options.window || {};
    options.window.title = this.document.name || "NPC";
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

    // Prepare NPC data
    this._prepareItems(context);

    return context;
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

  /**
   * Organize Items
   */
  _prepareItems(context) {
    const weapons = [];
    const armor = [];
    const features = [];

    for (let item of this.actor.items) {
      const itemData = item.toObject(false);
      itemData.img = itemData.img || "icons/svg/item-bag.svg";

      if (itemData.type === 'weapon') weapons.push(itemData);
      else if (itemData.type === 'armor') armor.push(itemData);
      else features.push(itemData);
    }

    context.weapons = weapons;
    context.armor = armor;
    context.features = features;
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  /**
   * Handle rolls
   */
  static #onRoll(event, target) {
    const dataset = target.dataset;

    if (dataset.rollType === 'item') {
      const itemEl = target.closest('.item');
      const item = this.actor.items.get(itemEl?.dataset.itemId);
      if (item) return item.roll();
    }
  }

  /**
   * Handle skill rolls
   */
  static async #onSkillRoll(event, target) {
    const skill = target.dataset.skill;
    return game.legends.rollSkillCheck(this.actor, skill);
  }

  /**
   * Handle saving throw rolls
   */
  static async #onSaveRoll(event, target) {
    const saveType = target.dataset.save;
    return game.legends.rollSavingThrow(this.actor, saveType);
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
    const name = `New ${type.capitalize()}`;
    const itemData = {
      name: name,
      type: type,
      system: {}
    };
    return await Item.create(itemData, { parent: this.actor });
  }

  static #onItemEdit(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    return item.sheet.render(true);
  }

  static async #onItemDelete(event, target) {
    const li = target.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: `Delete ${item.name}?` },
      content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`,
      yes: { default: false }
    });

    if (confirmed) {
      await item.delete();
    }
  }
}
