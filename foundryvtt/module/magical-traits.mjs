/**
 * Magical Traits System
 * Handles application and management of magical traits (Mageborn, Divine Gift, etc.)
 */

// ========================================
// CONSTANTS & DATA STRUCTURES
// ========================================

/**
 * Check if actor has a specific trait by name pattern
 * @param {Actor} actor - The actor to check
 * @param {string} traitPattern - Pattern to match (e.g., 'gifted mage')
 * @returns {boolean}
 */
export function hasTraitWithName(actor, traitPattern) {
  if (!actor || !actor.items) return false;
  const pattern = traitPattern.toLowerCase();
  return actor.items.some(item => 
    item.type === 'trait' && item.name.toLowerCase().includes(pattern)
  );
}

/**
 * Determine potential generation mode based on modifier traits
 * @param {Actor} actor - The actor to check
 * @returns {string} 'normal', 'gifted', or 'balanced'
 */
export function getPotentialGenerationMode(actor) {
  if (hasTraitWithName(actor, 'gifted mage')) return 'gifted';
  if (hasTraitWithName(actor, 'balanced channeler')) return 'balanced';
  return 'normal';
}

/**
 * Check if actor already has a primary magical trait
 * @param {Actor} actor - The actor to check
 * @returns {string|null} Name of existing primary trait, or null
 */
export function getExistingPrimaryMagicalTrait(actor) {
  if (!actor || !actor.items) return null;
  
  const primaryTraits = [
    'mageborn', 'divine gift', 'sorcerous origin', 
    'invoker', 'infuser', 'eldritch pact'
  ];
  
  for (const item of actor.items) {
    if (item.type === 'trait') {
      const name = item.name.toLowerCase();
      for (const pattern of primaryTraits) {
        if (name.includes(pattern)) {
          return item.name;
        }
      }
    }
  }
  return null;
}

/**
 * Validate that actor can receive this magical trait
 * @param {Actor} actor - The actor to check  
 * @param {string} traitType - Type of trait being applied
 * @returns {object} { valid: boolean, reason: string }
 */
export function validateMagicalTraitApplication(actor, traitType) {
  const existingTrait = getExistingPrimaryMagicalTrait(actor);
  
  // Modifiers (Gifted Mage, Balanced Channeler) are passive - no validation needed
  // They should be added to the sheet BEFORE applying primary magical traits
  // They're detected by getPotentialGenerationMode() when primary trait is applied
  if (['gifted-mage', 'balanced-channeler'].includes(traitType.toLowerCase())) {
    return { valid: true };
  }
  
  // Primary magical traits cannot stack
  const primaryTraits = ['mageborn', 'divine-gift', 'sorcerous-origin', 
                         'invoker', 'infuser', 'eldritch-pact'];
  
  if (primaryTraits.includes(traitType.toLowerCase())) {
    if (existingTrait) {
      return {
        valid: false,
        reason: `You already have ${existingTrait}. Characters cannot have multiple primary magical traits.`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Detect which primary magical trait the actor has
 * @param {Actor} actor - The actor to check
 * @returns {object|null} { type: string, item: Item } or null
 */
export function detectPrimaryMagicalTrait(actor) {
  if (!actor || !actor.items) return null;
  
  const primaryTraits = [
    { pattern: 'mageborn', type: 'mageborn' },
    { pattern: 'divine gift', type: 'divine-gift' },
    { pattern: 'invoker', type: 'invoker' },
    { pattern: 'infuser', type: 'infuser' },
    { pattern: 'sorcerous origin', type: 'sorcerous-origin' },
    { pattern: 'eldritch pact', type: 'eldritch-pact' }
  ];
  
  for (const item of actor.items) {
    if (item.type === 'trait') {
      const name = item.name.toLowerCase();
      for (const { pattern, type } of primaryTraits) {
        if (name.includes(pattern)) {
          return { type, item };
        }
      }
    }
  }
  
  return null;
}

/**
 * Grant magical trait abilities from compendium
 * @param {Actor} actor - The actor
 * @param {string} traitType - Type of magical trait
 * @param {object} updates - Actor updates containing trait data
 * @returns {Promise<void>}
 */
async function grantMagicalTraitAbilities(actor, traitType, updates) {
  const abilitiesPack = game.packs.get('legends.abilities');
  if (!abilitiesPack) {
    console.warn('Abilities compendium not found');
    return;
  }
  
  const abilityNamesToGrant = [];
  
  // Determine which abilities to grant
  switch (traitType) {
    case 'mageborn':
      abilityNamesToGrant.push('Ritual Casting');
      break;
      
    case 'divine-gift':
      // Grant Channel Divinity abilities based on patron
      const patron = updates['system.magicalTrait'].patron || 'generalist';
      
      switch (patron) {
        case 'alkira':
          abilityNamesToGrant.push('Guided Strike (Alkira)', "Alkira's Wrath", 'Rally the Troops (Alkira)');
          break;
        case 'ambis':
          abilityNamesToGrant.push('Preserve Life (Ambis)', "Mother's Embrace (Ambis)", 'Sanctuary (Ambis)');
          break;
        case 'athore':
          abilityNamesToGrant.push('Divine Judgment (Athore)', 'Hammer of Justice (Athore)', 'Zone of Truth (Athore)');
          break;
        case 'enschede':
          abilityNamesToGrant.push('Portent (Enschede)', 'Glimpse of Destiny (Enschede)', "Kismet's Touch (Enschede)");
          break;
        case 'hirnaloyta':
          abilityNamesToGrant.push('Speak with Nature (Hirnaloyta)', "Nature's Wrath (Hirnaloyta)", "Hirnaloyta's Bounty");
          break;
        case 'nevil':
          abilityNamesToGrant.push('Claim the Dead (Nevil)', 'Guide the Soul (Nevil)', 'Touch of Death (Nevil)');
          break;
        case 'rudlu':
          abilityNamesToGrant.push('Blessing of the Trickster (Rudlu)', 'Curse of Misfortune (Rudlu)', "Trickster's Escape (Rudlu)");
          break;
        case 'shu-jahan':
          abilityNamesToGrant.push('Knowledge of the Ages (Shu-Jahan)', 'Read Thoughts (Shu-Jahan)', "Philosopher's Insight (Shu-Jahan)");
          break;
        case 'generalist':
          // Generalist gets one option from each patron
          abilityNamesToGrant.push(
            'Guided Strike (Alkira)',
            'Preserve Life (Ambis)',
            'Zone of Truth (Athore)',
            'Glimpse of Destiny (Enschede)',
            'Speak with Nature (Hirnaloyta)',
            'Guide the Soul (Nevil)',
            'Blessing of the Trickster (Rudlu)',
            "Philosopher's Insight (Shu-Jahan)"
          );
          break;
      }
      break;
      
    case 'invoker':
      abilityNamesToGrant.push('Words of Power');
      break;
      
    case 'infuser':
      abilityNamesToGrant.push('Imbue Item');
      break;
      
    case 'sorcerous-origin':
      abilityNamesToGrant.push('Harmonic Weaving');
      break;
      
    case 'eldritch-pact':
      // Grant pact-specific abilities based on pact type
      const pactType = updates['system.magicalTrait.eldritchPact.pactType'];
      
      switch (pactType) {
        case 'survivor':
          abilityNamesToGrant.push("Scavenged Power (Survivor's Bargain)");
          break;
        case 'desperate':
          abilityNamesToGrant.push('Borrowed Vitality (Desperate Deal)');
          break;
        case 'answered':
          abilityNamesToGrant.push('Void Resonance (Answered Cry)', 'Void Speech (Answered Cry)');
          break;
        case 'stolen':
          abilityNamesToGrant.push('Unstable Surge (Stolen Shard)', "Shard's Terror (Stolen Shard)");
          break;
      }
      break;
  }
  
  // Fetch and create abilities
  if (abilityNamesToGrant.length === 0) {
    return;
  }
  
  const index = await abilitiesPack.getIndex();
  const abilitiesToCreate = [];
  
  for (const abilityName of abilityNamesToGrant) {
    const entry = index.find(e => e.name === abilityName);
    if (entry) {
      const document = await abilitiesPack.getDocument(entry._id);
      if (document) {
        abilitiesToCreate.push(document.toObject());
      } else {
        console.warn(`Could not load ability: ${abilityName}`);
      }
    } else {
      console.warn(`Ability not found in compendium: ${abilityName}`);
    }
  }
  
  if (abilitiesToCreate.length > 0) {
    await actor.createEmbeddedDocuments('Item', abilitiesToCreate);
    ui.notifications.info(`Granted ${abilitiesToCreate.length} magical trait abilities`);
  }
}

/**
 * Show setup confirmation dialog with preview
 * @param {object} primaryTrait - { type, item }
 * @param {string} mode - Generation mode
 * @returns {Promise<boolean>}
 */
async function showSetupConfirmationDialog(primaryTrait, mode) {
  const traitNames = {
    'mageborn': 'Mageborn',
    'divine-gift': 'Divine Gift',
    'invoker': 'Invoker',
    'infuser': 'Infuser',
    'sorcerous-origin': 'Sorcerous Origin',
    'eldritch-pact': 'Eldritch Pact'
  };
  
  const modeDescriptions = {
    'normal': 'Standard rolling',
    'gifted': '🌟 <strong>Gifted Mage</strong>: Roll 9d8 and drop the lowest',
    'balanced': '⚖️ <strong>Balanced Channeler</strong>: Use fixed array [5,4,3,3,2,2,1,1]'
  };
  
  const traitName = traitNames[primaryTrait.type] || primaryTrait.type;
  const modeDesc = modeDescriptions[mode] || 'Standard rolling';
  
  return Dialog.confirm({
    title: "Setup Magical Traits",
    content: `
      <h3>Ready to setup your magical powers?</h3>
      <p><strong>Primary Trait:</strong> ${traitName}</p>
      <p><strong>Generation Mode:</strong> ${modeDesc}</p>
      <hr>
      <p>You will be guided through:</p>
      <ol>
        <li>Generating your Magical Potentials</li>
        <li>Making trait-specific choices</li>
        <li>Assigning potentials to energy types</li>
      </ol>
      <p><em>This cannot be easily undone. Make sure you have all desired modifier traits 
      (Gifted Mage, Balanced Channeler) added first.</em></p>
      <p>Ready to begin?</p>
    `,
    defaultYes: false
  });
}

/**
 * Main orchestrator function for magical trait setup
 * Called from the Magic tab button on character sheet
 * @param {Actor} actor - The actor to setup
 * @returns {Promise<boolean>} Success status
 */
export async function setupMagicalTraits(actor) {
  // Step 1: Detect primary magical trait
  const primaryTrait = detectPrimaryMagicalTrait(actor);
  
  if (!primaryTrait) {
    ui.notifications.warn("No primary magical trait found. Add Mageborn, Divine Gift, or another magical trait first.");
    return false;
  }
  
  // Step 2: Check if already setup
  if (actor.system.magicalTrait?.isSetup) {
    const confirm = await Dialog.confirm({
      title: "Magical Traits Already Setup",
      content: `
        <p>Your magical traits have already been configured.</p>
        <p>Re-running setup will reset all your potentials, mastery, and related abilities.</p>
        <p>Are you sure you want to continue?</p>
      `,
      defaultYes: false
    });
    
    if (!confirm) return false;
  }
  
  // Step 3: Detect modifiers
  const mode = getPotentialGenerationMode(actor);
  
  // Step 4: Show confirmation with preview
  const confirmed = await showSetupConfirmationDialog(primaryTrait, mode);
  if (!confirmed) {
    ui.notifications.info("Magical trait setup cancelled");
    return false;
  }
  
  // Step 5: Run appropriate workflow
  let success = false;
  
  try {
    switch(primaryTrait.type) {
      case 'mageborn':
        success = await applyMagebornWorkflow(actor, primaryTrait.item, mode);
        break;
      case 'divine-gift':
        success = await applyDivineGiftWorkflow(actor, primaryTrait.item, mode);
        break;
      case 'invoker':
        success = await applyInvokerWorkflow(actor, primaryTrait.item, mode);
        break;
      case 'infuser':
        success = await applyInfuserWorkflow(actor, primaryTrait.item, mode);
        break;
      case 'sorcerous-origin':
        success = await applySorcerousOriginWorkflow(actor, primaryTrait.item, mode);
        break;
      case 'eldritch-pact':
        success = await applyEldritchPactWorkflow(actor, primaryTrait.item, mode);
        break;
      default:
        ui.notifications.error(`Unknown magical trait type: ${primaryTrait.type}`);
        return false;
    }
    
    // Note: isSetup flag is now set within each workflow function
    return success;
    
  } catch (error) {
    console.error("Error during magical trait setup:", error);
    ui.notifications.error(`Setup failed: ${error.message}`);
    return false;
  }
}

/**
 * Show initial workflow dialog explaining the magical trait setup process
 * @param {string} traitName - Name of the trait being applied
 * @param {string} mode - Generation mode ('normal', 'gifted', 'balanced')
 * @returns {Promise<boolean>} Whether to continue
 */
export async function showWorkflowIntroDialog(traitName, mode) {
  const modeText = {
    normal: "You will roll dice to generate your Magical Potentials.",
    gifted: "<strong>Gifted Mage detected!</strong> You will roll extra dice and drop the lowest.",
    balanced: "<strong>Balanced Channeler detected!</strong> You will use a fixed array instead of rolling."
  };
  
  return Dialog.confirm({
    title: `Apply ${traitName}`,
    content: `
      <p>You are about to apply the <strong>${traitName}</strong> magical trait.</p>
      <p>${modeText[mode]}</p>
      <p>You will be guided through:</p>
      <ol>
        <li>Generating your Magical Potentials</li>
        <li>Making trait-specific choices</li>
        <li>Assigning potentials to energy types</li>
      </ol>
      <p>Ready to begin?</p>
    `,
    defaultYes: true
  });
}

export const ENERGY_TYPES = {
  fire: { label: "Fire", icon: "🔥" },
  water: { label: "Water", icon: "💧" },
  earth: { label: "Earth", icon: "🪨" },
  air: { label: "Air", icon: "💨" },
  positive: { label: "Positive", icon: "✨" },
  negative: { label: "Negative", icon: "💀" },
  time: { label: "Time", icon: "⏰" },
  space: { label: "Space", icon: "🌌" }
};

export const ELEMENTAL_ENERGIES = ['fire', 'water', 'earth', 'air'];
export const CONCEPTUAL_ENERGIES = ['positive', 'negative', 'time', 'space'];
export const ALL_ENERGIES = [...ELEMENTAL_ENERGIES, ...CONCEPTUAL_ENERGIES];

export const CASTING_STATS = {
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  charisma: "Charisma"
};

// Patron deity configurations
export const DIVINE_PATRONS = {
  alkira: { 
    name: "Alkira - God of War and Order", 
    primary: "fire", 
    secondary: "positive" 
  },
  ambis: { 
    name: "Ambis - The Mother", 
    primary: "positive", 
    secondary: "water" 
  },
  athore: { 
    name: "Athore - God of Justice", 
    primary: "positive", 
    secondary: "fire" 
  },
  enschede: { 
    name: "Enschede - Goddess of Fate", 
    primary: "time", 
    secondary: "space" 
  },
  hirnaloyta: { 
    name: "Hirnaloyta - Goddess of Nature", 
    primary: "earth", 
    secondary: "water" 
  },
  nevil: { 
    name: "Nevil - God of the Underworld", 
    primary: "negative", 
    secondary: "earth" 
  },
  rudlu: { 
    name: "Rudlu - Goddess of Luck", 
    primary: "space", 
    secondary: "air" 
  },
  shuJahan: { 
    name: "Shu-Jahan - God of Wisdom", 
    primary: "time", 
    secondary: "space" 
  },
  generalist: { 
    name: "Pantheon Generalist", 
    primary: null, 
    secondary: null,
    tertiary: null
  }
};

// Sorcerous Origin manifestations
export const FORCE_OF_WILL = {
  unchangingStone: {
    name: "Unchanging Stone",
    energies: ['earth', 'fire'],
    story: "I know my nature completely—I am solid as stone, constant as truth"
  },
  threadOfFate: {
    name: "Thread of Fate",
    energies: ['time', 'positive'],
    story: "I perceive my place in the pattern—I see where I'm meant to be"
  },
  deathsLesson: {
    name: "Death's Lesson",
    energies: ['fire', 'negative'],
    story: "I understand survival is my truth—I've seen death and know it's not my path"
  },
  perfectSelfPerception: {
    name: "Perfect Self-Perception",
    energies: ['space', 'air'],
    story: "I perceive myself completely across space and time—I exist in total self-awareness"
  }
};

// Eldritch Pact types
export const PACT_TYPES = {
  survivorsBargain: {
    name: "The Survivor's Bargain",
    energies: ['space', 'negative', 'fire', 'earth', 'time'],
    primary: 'space',
    secondary: 'negative',
    story: "You should have died. You didn't. Something intervened."
  },
  desperateDeal: {
    name: "The Desperate Deal",
    energies: ['positive', 'space', 'air', 'time', 'water'],
    primary: 'positive',
    secondary: 'space',
    story: "You promised something to someone in your darkest hour. Power came immediately."
  },
  answeredCry: {
    name: "The Answered Cry",
    energies: ['air', 'negative', 'space', 'time', 'water'],
    primary: 'air',
    secondary: 'negative',
    story: "You screamed into the void. The void answered."
  },
  stolenShard: {
    name: "The Stolen Shard",
    energies: ['fire', 'negative', 'space', 'earth', 'time'],
    primary: 'fire',
    secondary: 'negative',
    story: "You found/touched/stole something not meant for you. This power wasn't offered—you took it."
  }
};

// ========================================
// CORE ROLLING & ASSIGNMENT FUNCTIONS
// ========================================

/**
 * Roll potentials with support for modifiers (Gifted Mage, Balanced Channeler)
 * @param {number} count - Number of dice to roll (8 or 5)
 * @param {string} mode - 'normal', 'gifted', or 'balanced'
 * @returns {Promise<Array<number>>} Sorted rolls (highest to lowest)
 */
export async function rollPotentials(count = 8, mode = 'normal') {
  if (mode === 'balanced') {
    // Fixed array for Balanced Channeler
    const array = count === 8 ? [5,4,3,3,2,2,1,1] : [4,3,2,2,1];
    
    // Create a fake roll message for consistency
    const content = `
      <div class="dice-roll">
        <div class="dice-formula">${count} Potentials (Balanced Channeler)</div>
        <div class="dice-total">Fixed Array: ${array.join(', ')}</div>
      </div>
    `;
    await ChatMessage.create({
      content,
      speaker: ChatMessage.getSpeaker(),
      flavor: "Magical Potentials - Balanced Channeler"
    });
    
    return array;
  }
  
  if (mode === 'gifted') {
    // Roll extra die and drop lowest for Gifted Mage
    const rollCount = count + 1;
    const roll = await new Roll(`${rollCount}d8`).evaluate();
    
    const allRolls = roll.terms[0].results.map(r => r.result).sort((a, b) => a - b);
    const lowest = allRolls[0];
    const kept = allRolls.slice(1).sort((a, b) => b - a);
    
    // Create custom message showing the drop
    const content = `
      <div class="dice-roll">
        <div class="dice-formula">${rollCount}d8 (drop lowest) for Magical Potentials</div>
        <div class="dice-tooltip">
          <div class="dice">All Rolls: ${allRolls.join(', ')}</div>
          <div>Dropped: <span style="text-decoration: line-through;">${lowest}</span></div>
          <div>Kept: ${kept.join(', ')}</div>
        </div>
        <div class="dice-total">Final: ${kept.join(', ')}</div>
      </div>
    `;
    await ChatMessage.create({
      content,
      speaker: ChatMessage.getSpeaker(),
      flavor: "Magical Potentials - Gifted Mage"
    });
    
    return kept;
  }
  
  // Normal mode
  const roll = await new Roll(`${count}d8`).evaluate();
  await roll.toMessage({
    flavor: `Rolling ${count}d8 for Magical Potentials`,
    speaker: ChatMessage.getSpeaker()
  });
  
  return roll.terms[0].results.map(r => r.result).sort((a, b) => b - a);
}

/**
 * Initialize mastery skills (all start at 0)
 * @param {string[]} energies - List of energy types
 * @returns {Object} Mastery object with all values at 0
 */
export function initializeMastery(energies) {
  const mastery = {};
  for (const energy of ALL_ENERGIES) {
    mastery[energy] = { 
      value: energies.includes(energy) ? 0 : null, 
      label: `${ENERGY_TYPES[energy].label} Mastery` 
    };
  }
  return mastery;
}

/**
 * Create potentials object from assigned values
 * @param {Object} assignments - Map of energy -> value
 * @returns {Object} Potentials object
 */
export function createPotentialsObject(assignments) {
  const potentials = {};
  for (const energy of ALL_ENERGIES) {
    potentials[energy] = {
      value: assignments[energy] || 0,
      label: ENERGY_TYPES[energy].label
    };
  }
  return potentials;
}

// ========================================
// DIALOG FUNCTIONS
// ========================================

/**
 * Show dialog to choose elemental affinity
 * @returns {Promise<string>} Chosen element
 */
export async function showAffinityDialog() {
  return new Promise((resolve) => {
    const dialog = new Dialog({
      title: "Choose Elemental Affinity",
      content: `
        <form>
          <div class="form-group">
            <label>Choose your Elemental Affinity:</label>
            <select id="affinity" name="affinity">
              ${ELEMENTAL_ENERGIES.map(e => 
                `<option value="${e}">${ENERGY_TYPES[e].label} ${ENERGY_TYPES[e].icon}</option>`
              ).join('')}
            </select>
          </div>
          <p><em>Your affinity will receive +2 bonus (max 8 total)</em></p>
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            const affinity = html.find('[name="affinity"]').val();
            resolve(affinity);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    });
    dialog.render(true);
  });
}

/**
 * Show dialog to choose secondary focus
 * @param {string} excludeEnergy - Energy to exclude (already chosen as affinity)
 * @returns {Promise<string>} Chosen energy
 */
export async function showSecondaryFocusDialog(excludeEnergy = null, excludeMultiple = []) {
  // Combine single exclude and multiple excludes
  const excluded = excludeEnergy ? [excludeEnergy, ...excludeMultiple] : excludeMultiple;
  const availableEnergies = ALL_ENERGIES.filter(e => !excluded.includes(e));
  
  return new Promise((resolve) => {
    const dialog = new Dialog({
      title: "Choose Secondary Focus",
      content: `
        <form>
          <div class="form-group">
            <label>Choose your Secondary Focus:</label>
            <select id="secondary" name="secondary">
              ${availableEnergies.map(e => 
                `<option value="${e}">${ENERGY_TYPES[e].label} ${ENERGY_TYPES[e].icon}</option>`
              ).join('')}
            </select>
          </div>
          <p><em>Your secondary focus will receive +1 bonus (max 8 total)</em></p>
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            const secondary = html.find('[name="secondary"]').val();
            resolve(secondary);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    });
    dialog.render(true);
  });
}

/**
 * Show dialog to choose divine patron
 * @returns {Promise<string>} Chosen patron key
 */
export async function showPatronDialog() {
  return new Promise((resolve) => {
    const patronsHtml = Object.entries(DIVINE_PATRONS).map(([key, data]) => 
      `<option value="${key}">${data.name}</option>`
    ).join('');
    
    const dialog = new Dialog({
      title: "Choose Divine Patron",
      content: `
        <form>
          <div class="form-group">
            <label>Choose which deity you serve:</label>
            <select id="patron" name="patron">
              ${patronsHtml}
            </select>
          </div>
          <p><em>Your patron determines your energy affinities</em></p>
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            const patron = html.find('[name="patron"]').val();
            resolve(patron);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    });
    dialog.render(true);
  });
}

/**
 * Show dialog to choose Force of Will manifestation
 * @returns {Promise<string>} Chosen manifestation key
 */
export async function showForceOfWillDialog() {
  return new Promise((resolve) => {
    const manifestationsHtml = Object.entries(FORCE_OF_WILL).map(([key, data]) => 
      `<option value="${key}">${data.name}</option>`
    ).join('');
    
    const dialog = new Dialog({
      title: "Choose Force of Will",
      content: `
        <form>
          <div class="form-group">
            <label>Choose your Force of Will manifestation:</label>
            <select id="manifestation" name="manifestation">
              ${manifestationsHtml}
            </select>
          </div>
          <div id="manifestation-story" style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.1);">
            <em>${FORCE_OF_WILL.unchangingStone.story}</em>
          </div>
        </form>
        <script>
          $('[name="manifestation"]').on('change', function() {
            const key = $(this).val();
            const story = ${JSON.stringify(Object.fromEntries(Object.entries(FORCE_OF_WILL).map(([k,v]) => [k, v.story])))};
            $('#manifestation-story em').text(story[key]);
          });
        </script>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            const manifestation = html.find('[name="manifestation"]').val();
            resolve(manifestation);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    });
    dialog.render(true);
  });
}

/**
 * Show dialog to choose pact type
 * @returns {Promise<string>} Chosen pact key
 */
export async function showPactTypeDialog() {
  return new Promise((resolve) => {
    const pactsHtml = Object.entries(PACT_TYPES).map(([key, data]) => 
      `<option value="${key}">${data.name}</option>`
    ).join('');
    
    const dialog = new Dialog({
      title: "Choose Eldritch Pact",
      content: `
        <form>
          <div class="form-group">
            <label>Choose your Pact Type:</label>
            <select id="pact" name="pact">
              ${pactsHtml}
            </select>
          </div>
          <div id="pact-story" style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.1);">
            <em>${PACT_TYPES.survivorsBargain.story}</em>
          </div>
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            const pact = html.find('[name="pact"]').val();
            resolve(pact);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    });
    dialog.render(true);
  });
}

/**
 * Find the optimal roll to assign a bonus to maximize final value
 * Priority: 1) Reach cap with exact bonus, 2) Reach cap (even if bonus wasted), 3) Use highest available
 * @param {number[]} rolls - Available rolls (not yet assigned)
 * @param {number} bonus - Bonus to apply (+1 or +2)
 * @param {number} max - Maximum value (default 8)
 * @returns {number} Index of optimal roll, or -1 if none found
 */
function findOptimalRollForBonus(rolls, bonus, max = 8) {
  if (rolls.length === 0) return -1;
  
  const target = max - bonus;  // Ideal roll that uses full bonus perfectly (e.g., 6 for +2, 7 for +1)
  
  // Priority 1: Find exact match - uses full bonus and reaches cap with no waste
  let bestIndex = rolls.findIndex(r => r === target);
  if (bestIndex !== -1) return bestIndex;
  
  // Priority 2: Find highest roll that reaches cap with the bonus (even if some bonus wasted)
  // Example: For +2 bonus, prefer 7 (7+2=8, wastes 1) over 5 (5+2=7, no waste but doesn't cap)
  bestIndex = -1;
  let bestRoll = -1;
  
  for (let i = 0; i < rolls.length; i++) {
    const finalValue = Math.min(rolls[i] + bonus, max);
    if (finalValue === max && rolls[i] > bestRoll) {
      bestRoll = rolls[i];
      bestIndex = i;
    }
  }
  
  // If we found a roll that reaches cap, use it
  if (bestIndex !== -1) return bestIndex;
  
  // Priority 3: No rolls reach cap, so use highest available roll to maximize final value
  // This gives the highest result even if it doesn't reach cap
  bestRoll = -1;
  for (let i = 0; i < rolls.length; i++) {
    if (rolls[i] > bestRoll) {
      bestRoll = rolls[i];
      bestIndex = i;
    }
  }
  
  return bestIndex;
}

/**
 * Show dialog to manually assign rolls to energies
 * @param {number[]} rolls - Sorted roll results
 * @param {string[]} energies - Available energies 
 * @param {Object} preAssigned - Pre-assigned energy bonuses {energy: bonus}
 * @returns {Promise<Object>} Map of energy -> value
 */
export async function showAssignmentDialog(rolls, energies, preAssigned = {}) {
  return new Promise((resolve) => {
    let assignments = {...preAssigned};
    const availableRolls = [...rolls];
    
    // Filter out pre-assigned energies from the dropdown
    const preAssignedKeys = Object.keys(preAssigned);
    const availableEnergies = energies.filter(e => !preAssignedKeys.includes(e));
    
    const energyOptions = availableEnergies.map(e => 
      `<option value="${e}">${ENERGY_TYPES[e].label}</option>`
    ).join('');
    
    const rollsHtml = rolls.map((roll, idx) => `
      <div class="roll-assignment" data-roll-index="${idx}">
        <span class="roll-value">${roll}</span>
        <select name="energy-${idx}">
          <option value="">Unassigned</option>
          ${energyOptions}
        </select>
      </div>
    `).join('');
    
    const dialog = new Dialog({
      title: "Assign Potential Rolls",
      content: `
        <form>
          <p>Assign each roll to an energy type:</p>
          <div class="roll-assignments">
            ${rollsHtml}
          </div>
          ${Object.keys(preAssigned).length > 0 ? `
            <p style="margin-top: 10px;"><strong>Pre-assigned bonuses:</strong></p>
            <ul>
              ${Object.entries(preAssigned).map(([e, v]) => 
                `<li>${ENERGY_TYPES[e].label}: +${v}</li>`
              ).join('')}
            </ul>
          ` : ''}
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            rolls.forEach((roll, idx) => {
              const energy = html.find(`[name="energy-${idx}"]`).val();
              if (energy) {
                assignments[energy] = (assignments[energy] || 0) + roll;
              }
            });
            resolve(assignments);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    });
    dialog.render(true);
  });
}

// ========================================
// TRAIT APPLICATION FUNCTIONS
// ========================================

/**
 * Mageborn workflow - called from setupMagicalTraits()
 * @param {Actor} actor - The actor
 * @param {Item} traitItem - The trait item
 * @param {string} mode - Generation mode ('normal', 'gifted', 'balanced')
 * @returns {Promise<boolean>}
 */
export async function applyMagebornWorkflow(actor, traitItem, mode) {
  ui.notifications.info(`Setting up Mageborn (${mode} mode)...`);
  
  // Step 1: Generate potentials with appropriate mode
  const rolls = await rollPotentials(8, mode);
  
  // Step 2: Choose affinity
  const affinity = await showAffinityDialog();
  if (!affinity) {
    ui.notifications.warn("Mageborn application cancelled");
    return false;
  }
  
  // Step 3: Choose secondary focus
  const secondary = await showSecondaryFocusDialog(affinity);
  if (!secondary) {
    ui.notifications.warn("Mageborn application cancelled");
    return false;
  }
  
  // Step 4: Intelligently assign bonuses to maximize value
  const availableRolls = [...rolls]; // Copy array
  
  // Find optimal roll for affinity (+2 bonus)
  const affinityIndex = findOptimalRollForBonus(availableRolls, 2);
  const affinityRoll = availableRolls.splice(affinityIndex, 1)[0];
  
  // Find optimal roll for secondary (+1 bonus)
  const secondaryIndex = findOptimalRollForBonus(availableRolls, 1);
  const secondaryRoll = availableRolls.splice(secondaryIndex, 1)[0];
  
  const preAssigned = {
    [affinity]: Math.min(affinityRoll + 2, 8),
    [secondary]: Math.min(secondaryRoll + 1, 8)
  };
  
  // Let player assign remaining rolls
  const assignments = await showAssignmentDialog(
    availableRolls, 
    ALL_ENERGIES.filter(e => e !== affinity && e !== secondary),
    preAssigned
  );
  
  if (!assignments) {
    ui.notifications.warn("Mageborn application cancelled");
    return false;
  }
  
  // Step 5: Build updates object
  const updates = {
    'system.potentials': createPotentialsObject(assignments),
    'system.mastery': initializeMastery(ALL_ENERGIES),
    'system.castingStat.value': 'intelligence',
    'system.magicalTrait': {
      type: 'mageborn',
      subtype: 'arcane',
      elementalAffinity: affinity,
      secondaryFocus: secondary,
      availableEnergies: ALL_ENERGIES,
      isSetup: true
    }
  };
  
  // Step 6: Grant abilities and update actor
  await grantMagicalTraitAbilities(actor, 'mageborn', updates);
  await actor.update(updates);
  
  ui.notifications.info("Mageborn trait applied successfully!");
  return true;
}

/**
 * Divine Gift workflow - called from setupMagicalTraits()
 * @param {Actor} actor - The actor
 * @param {Item} traitItem - The trait item
 * @param {string} mode - Generation mode
 * @returns {Promise<boolean>}
 */
export async function applyDivineGiftWorkflow(actor, traitItem, mode) {
  ui.notifications.info(`Setting up Divine Gift (${mode} mode)...`);
  
  // Step 1: Generate potentials with appropriate mode
  const rolls = await rollPotentials(8, mode);
  
  // Step 2: Choose patron
  const patronKey = await showPatronDialog();
  if (!patronKey) {
    ui.notifications.warn("Divine Gift application cancelled");
    return false;
  }
  
  const patron = DIVINE_PATRONS[patronKey];
  
  // Step 3: Intelligently assign bonuses to maximize value
  const availableRolls = [...rolls]; // Copy array
  let preAssigned = {};
  let remainingRolls = [];
  
  if (patronKey === 'generalist') {
    // Generalist: +1 to top 3 rolls that benefit most
    const energyChoices = [];
    for (let i = 0; i < 3; i++) {
      const energy = await showSecondaryFocusDialog(null, energyChoices);
      if (!energy) {
        ui.notifications.warn("Divine Gift application cancelled");
        return false;
      }
      energyChoices.push(energy);
      
      const rollIndex = findOptimalRollForBonus(availableRolls, 1);
      const roll = availableRolls.splice(rollIndex, 1)[0];
      preAssigned[energy] = Math.min(roll + 1, 8);
    }
    remainingRolls = availableRolls;
  } else {
    // Patron-based: +2 to primary, +1 to secondary
    const primaryIndex = findOptimalRollForBonus(availableRolls, 2);
    const primaryRoll = availableRolls.splice(primaryIndex, 1)[0];
    
    const secondaryIndex = findOptimalRollForBonus(availableRolls, 1);
    const secondaryRoll = availableRolls.splice(secondaryIndex, 1)[0];
    
    preAssigned = {
      [patron.primary]: Math.min(primaryRoll + 2, 8),
      [patron.secondary]: Math.min(secondaryRoll + 1, 8)
    };
    remainingRolls = availableRolls;
  }
  
  // Step 4: Assign remaining rolls
  const energiesForDialog = ALL_ENERGIES.filter(e => !Object.keys(preAssigned).includes(e));
  const assignments = await showAssignmentDialog(
    remainingRolls,
    energiesForDialog,
    preAssigned
  );
  
  if (!assignments) {
    ui.notifications.warn("Divine Gift application cancelled");
    return false;
  }
  
  // Step 5: Build updates object
  const updates = {
    'system.potentials': createPotentialsObject(assignments),
    'system.mastery': initializeMastery(ALL_ENERGIES),
    'system.castingStat.value': 'wisdom',
    'system.magicalTrait': {
      type: 'divine-gift',
      subtype: 'divine',
      patron: patronKey,
      availableEnergies: ALL_ENERGIES,
      isSetup: true
    },
    'system.channelDivinity': {
      current: 2,
      max: 2
    }
  };
  
  // Step 6: Grant abilities and update actor
  await grantMagicalTraitAbilities(actor, 'divine-gift', updates);
  await actor.update(updates);
  
  ui.notifications.info("Divine Gift trait applied successfully!");
  return true;
}

/**
 * Invoker workflow - called from setupMagicalTraits()
 */
export async function applyInvokerWorkflow(actor, traitItem, mode) {
  ui.notifications.info(`Setting up Invoker (${mode} mode)...`);
  
  // Step 1: Generate potentials with appropriate mode
  const rolls = await rollPotentials(5, mode);
  
  // Step 2: Intelligently assign bonuses for Air (+2) and Positive (+1)
  const availableRolls = [...rolls];
  
  const airIndex = findOptimalRollForBonus(availableRolls, 2);
  const airRoll = availableRolls.splice(airIndex, 1)[0];
  
  const positiveIndex = findOptimalRollForBonus(availableRolls, 1);
  const positiveRoll = availableRolls.splice(positiveIndex, 1)[0];
  
  const preAssigned = {
    air: Math.min(airRoll + 2, 8),
    positive: Math.min(positiveRoll + 1, 8)
  };
  
  // Step 3: Choose one elemental or conceptual for 5th slot
  const chosenElement = await showSecondaryFocusDialog();
  if (!chosenElement) {
    ui.notifications.warn("Invoker application cancelled");
    return false;
  }
  
  // Step 4: Assign remaining rolls (Space, Time, chosen element)
  const availableEnergies = ['space', 'time', chosenElement];
  const assignments = await showAssignmentDialog(
    availableRolls,
    availableEnergies,
    preAssigned
  );
  
  if (!assignments) {
    ui.notifications.warn("Invoker application cancelled");
    return false;
  }
  
  const invokerEnergies = ['air', 'positive', 'space', 'time', chosenElement];
  
  // Step 5: Build updates object
  const updates = {
    'system.potentials': createPotentialsObject(assignments),
    'system.mastery': initializeMastery(invokerEnergies),
    'system.castingStat.value': 'charisma',
    'system.magicalTrait': {
      type: 'invoker',
      subtype: 'diabolist',
      chosenElement: chosenElement,
      availableEnergies: invokerEnergies,
      isSetup: true
    }
  };
  
  // Step 6: Grant abilities and update actor
  await grantMagicalTraitAbilities(actor, 'invoker', updates);
  await actor.update(updates);
  
  ui.notifications.info("Invoker trait applied successfully!");
  return true;
}

/**
 * Infuser workflow - called from setupMagicalTraits()
 */
export async function applyInfuserWorkflow(actor, traitItem, mode) {
  ui.notifications.info(`Setting up Infuser (${mode} mode)...`);
  
  // Step 1: Generate potentials with appropriate mode
  const rolls = await rollPotentials(5, mode);
  
  // Step 2: Intelligently assign bonuses for Earth (+2) and Space (+1)
  const availableRolls = [...rolls];
  
  const earthIndex = findOptimalRollForBonus(availableRolls, 2);
  const earthRoll = availableRolls.splice(earthIndex, 1)[0];
  
  const spaceIndex = findOptimalRollForBonus(availableRolls, 1);
  const spaceRoll = availableRolls.splice(spaceIndex, 1)[0];
  
  const preAssigned = {
    earth: Math.min(earthRoll + 2, 8),
    space: Math.min(spaceRoll + 1, 8)
  };
  
  // Step 3: Choose one elemental or conceptual for 5th slot
  const chosenElement = await showSecondaryFocusDialog();
  if (!chosenElement) {
    ui.notifications.warn("Infuser application cancelled");
    return false;
  }
  
  // Step 4: Assign remaining rolls (Positive, Time, chosen element)
  const availableEnergies = ['positive', 'time', chosenElement];
  const assignments = await showAssignmentDialog(
    availableRolls,
    availableEnergies,
    preAssigned
  );
  
  if (!assignments) {
    ui.notifications.warn("Infuser application cancelled");
    return false;
  }
  
  const infuserEnergies = ['earth', 'space', 'positive', 'time', chosenElement];
  
  // Step 5: Build updates object
  const updates = {
    'system.potentials': createPotentialsObject(assignments),
    'system.mastery': initializeMastery(infuserEnergies),
    'system.castingStat.value': 'intelligence',
    'system.magicalTrait': {
      type: 'infuser',
      subtype: 'diabolist',
      chosenElement: chosenElement,
      availableEnergies: infuserEnergies,
      isSetup: true
    }
  };
  
  // Step 6: Grant abilities and update actor
  await grantMagicalTraitAbilities(actor, 'infuser', updates);
  await actor.update(updates);
  
  ui.notifications.info("Infuser trait applied successfully!");
  return true;
}

/**
 * Sorcerous Origin workflow - called from setupMagicalTraits()
 */
export async function applySorcerousOriginWorkflow(actor, traitItem, mode) {
  ui.notifications.info(`Setting up Sorcerous Origin (${mode} mode)...`);
  
  // Step 1: Generate potentials with appropriate mode
  const rolls = await rollPotentials(8, mode);
  
  // Step 2: Choose Force of Will
  const manifestationKey = await showForceOfWillDialog();
  if (!manifestationKey) {
    ui.notifications.warn("Sorcerous Origin application cancelled");
    return false;
  }
  
  const manifestation = FORCE_OF_WILL[manifestationKey];
  
  // Step 3: Choose primary energy from manifestation options
  const primaryEnergy = await new Promise((resolve) => {
    const dialog = new Dialog({
      title: "Choose Primary Energy",
      content: `
        <p>Choose your primary energy for ${manifestation.name}:</p>
        <select id="primary">
          ${manifestation.energies.map(e => 
            `<option value="${e}">${ENERGY_TYPES[e].label}</option>`
          ).join('')}
        </select>
      `,
      buttons: {
        ok: {
          label: "Confirm",
          callback: (html) => resolve(html.find('#primary').val())
        }
      },
      default: "ok"
    });
    dialog.render(true);
  });
  
  // Step 4: Choose secondary focus
  const secondary = await showSecondaryFocusDialog(primaryEnergy);
  if (!secondary) {
    ui.notifications.warn("Sorcerous Origin application cancelled");
    return false;
  }
  
  // Step 5: Intelligently assign bonuses
  const availableRolls = [...rolls];
  
  const primaryIndex = findOptimalRollForBonus(availableRolls, 2);
  const primaryRoll = availableRolls.splice(primaryIndex, 1)[0];
  
  const secondaryIndex = findOptimalRollForBonus(availableRolls, 1);
  const secondaryRoll = availableRolls.splice(secondaryIndex, 1)[0];
  
  const preAssigned = {
    [primaryEnergy]: Math.min(primaryRoll + 2, 8),
    [secondary]: Math.min(secondaryRoll + 1, 8)
  };
  
  const assignments = await showAssignmentDialog(
    availableRolls,
    ALL_ENERGIES.filter(e => e !== primaryEnergy && e !== secondary),
    preAssigned
  );
  
  if (!assignments) {
    ui.notifications.warn("Sorcerous Origin application cancelled");
    return false;
  }
  
  // Step 6: Build updates object
  const updates = {
    'system.potentials': createPotentialsObject(assignments),
    'system.mastery': initializeMastery(ALL_ENERGIES),
    'system.castingStat.value': 'wisdom',
    'system.magicalTrait': {
      type: 'sorcerous-origin',
      subtype: 'sorcerous',
      forceOfWill: manifestationKey,
      primaryEnergy: primaryEnergy,
      secondaryFocus: secondary,
      availableEnergies: ALL_ENERGIES,
      isSetup: true
    }
  };
  
  // Step 7: Grant abilities and update actor
  await grantMagicalTraitAbilities(actor, 'sorcerous-origin', updates);
  await actor.update(updates);
  
  ui.notifications.info("Sorcerous Origin trait applied successfully!");
  return true;
}

/**
 * Eldritch Pact workflow - called from setupMagicalTraits()
 */
export async function applyEldritchPactWorkflow(actor, traitItem, mode) {
  ui.notifications.info(`Setting up Eldritch Pact (${mode} mode)...`);
  
  // Step 1: Generate potentials with appropriate mode
  const rolls = await rollPotentials(5, mode);
  
  // Step 2: Choose pact type
  const pactKey = await showPactTypeDialog();
  if (!pactKey) {
    ui.notifications.warn("Eldritch Pact application cancelled");
    return false;
  }
  
  const pact = PACT_TYPES[pactKey];
  
  // Step 3: Intelligently assign bonuses
  const availableRolls = [...rolls];
  
  const primaryIndex = findOptimalRollForBonus(availableRolls, 2);
  const primaryRoll = availableRolls.splice(primaryIndex, 1)[0];
  
  const secondaryIndex = findOptimalRollForBonus(availableRolls, 1);
  const secondaryRoll = availableRolls.splice(secondaryIndex, 1)[0];
  
  const preAssigned = {
    [pact.primary]: Math.min(primaryRoll + 2, 8),
    [pact.secondary]: Math.min(secondaryRoll + 1, 8)
  };
  
  // Step 4: Assign remaining rolls
  const remainingEnergies = pact.energies.filter(
    e => e !== pact.primary && e !== pact.secondary
  );
  const assignments = await showAssignmentDialog(
    availableRolls,
    remainingEnergies,
    preAssigned
  );
  
  if (!assignments) {
    ui.notifications.warn("Eldritch Pact application cancelled");
    return false;
  }
  
  // Step 5: Build updates object
  const updates = {
    'system.potentials': createPotentialsObject(assignments),
    'system.mastery': initializeMastery(pact.energies),
    'system.castingStat.value': 'charisma',
    'system.magicalTrait': {
      type: 'eldritch-pact',
      subtype: 'diabolist',
      pactType: pactKey,
      availableEnergies: pact.energies,
      isSetup: true
    }
  };
  
  // Step 6: Grant abilities and update actor
  await grantMagicalTraitAbilities(actor, 'eldritch-pact', updates);
  await actor.update(updates);
  
  ui.notifications.info("Eldritch Pact trait applied successfully!");
  return true;
}

/**
 * Apply Gifted Mage trait (passive modifier)
 * This trait is detected automatically when applying primary magical traits
 */
export async function applyGiftedMage(actor, traitItem) {
  // This is a passive modifier trait that affects how primary magical traits work
  // It should be added to the sheet BEFORE applying Mageborn/Divine Gift
  // The system will detect it via getPotentialGenerationMode() and roll 9d8 drop lowest
  
  ui.notifications.info(
    "Gifted Mage added. When you apply Mageborn or Divine Gift, " +
    "you will automatically roll 9d8 and drop the lowest."
  );
  
  return true;
}

/**
 * Apply Balanced Channeler trait (passive modifier)
 * This trait is detected automatically when applying primary magical traits
 */
export async function applyBalancedChanneler(actor, traitItem) {
  // This is a passive modifier trait that affects how primary magical traits work
  // It should be added to the sheet BEFORE applying Mageborn/Divine Gift
  // The system will detect it via getPotentialGenerationMode() and use fixed arrays
  
  ui.notifications.info(
    "Balanced Channeler added. When you apply Mageborn or Divine Gift, " +
    "you will automatically use the fixed array [5,4,3,3,2,2,1,1] instead of rolling."
  );
  
  return true;
}

// ========================================
// TRAIT REMOVAL & CLEANUP
// ========================================

/**
 * Handle magical trait removal - clean up all related data
 * @param {Actor} actor - The actor
 * @param {Item} traitItem - The trait item being removed
 * @returns {Promise<void>}
 */
export async function handleMagicalTraitRemoval(actor, traitItem) {
  if (!actor || !traitItem) return;
  
  const traitName = traitItem.name.toLowerCase();
  const traitType = traitItem.system?.traitType?.toLowerCase() || '';
  
  // Check if this is a primary magical trait
  const isPrimaryTrait = [
    'mageborn', 'divine gift', 'invoker', 'infuser', 
    'sorcerous origin', 'eldritch pact'
  ].some(pattern => traitName.includes(pattern));
  
  if (!isPrimaryTrait) {
    // Not a magical trait, or just a modifier trait (Gifted Mage, Balanced Channeler)
    console.log(`Legends | Removed trait: ${traitItem.name} (no cleanup needed)`);
    return;
  }
  
  console.log(`Legends | Removing primary magical trait: ${traitItem.name}`);
  
  // Step 1: Identify which abilities to remove
  const abilitiesToRemove = [];
  
  // Identify abilities granted by this trait
  for (const item of actor.items) {
    if (item.type !== 'ability') continue;
    
    const source = item.system?.source?.toLowerCase() || '';
    const abilityName = item.name.toLowerCase();
    
    // Check if this ability was granted by a magical trait
    if (source.includes('mageborn') || source.includes('divine gift') || 
        source.includes('invoker') || source.includes('infuser') ||
        source.includes('sorcerous origin') || source.includes('eldritch pact')) {
      abilitiesToRemove.push(item.id);
      continue;
    }
    
    // Also check by name patterns for abilities we know come from magical traits
    if (abilityName.includes('ritual casting') ||
        abilityName.includes('channel divinity') ||
        abilityName.includes('words of power') ||
        abilityName.includes('imbue item') ||
        abilityName.includes('harmonic weaving') ||
        abilityName.includes('resonant weaving') ||
        abilityName.includes('scavenged power') ||
        abilityName.includes('borrowed vitality') ||
        abilityName.includes('void resonance') ||
        abilityName.includes('void speech') ||
        abilityName.includes('unstable surge') ||
        abilityName.includes("shard's terror") ||
        // Channel Divinity abilities by patron name
        abilityName.includes('(alkira)') ||
        abilityName.includes('(ambis)') ||
        abilityName.includes('(athore)') ||
        abilityName.includes('(enschede)') ||
        abilityName.includes('(hirnaloyta)') ||
        abilityName.includes('(nevil)') ||
        abilityName.includes('(rudlu)') ||
        abilityName.includes('(shu-jahan)')) {
      abilitiesToRemove.push(item.id);
    }
  }
  
  // Step 2: Remove abilities
  if (abilitiesToRemove.length > 0) {
    await actor.deleteEmbeddedDocuments('Item', abilitiesToRemove);
    console.log(`Legends | Removed ${abilitiesToRemove.length} magical trait abilities`);
  }
  
  // Step 3: Clear magical trait data
  const updates = {
    'system.potentials': {
      fire: 0, water: 0, earth: 0, air: 0,
      positive: 0, negative: 0, time: 0, space: 0
    },
    'system.mastery': {
      fire: 0, water: 0, earth: 0, air: 0,
      positive: 0, negative: 0, time: 0, space: 0
    },
    'system.castingStat.value': '',
    'system.magicalTrait': {
      type: '',
      subtype: '',
      isSetup: false,
      setupDate: null
    }
  };
  
  // Also clear Divine Gift specific data if present
  if (traitName.includes('divine gift')) {
    updates['system.channelDivinity'] = {
      current: 0,
      max: 0
    };
  }
  
  await actor.update(updates);
  
  ui.notifications.info(
    `${traitItem.name} removed. All magical trait data has been cleared. ` +
    `You can add a different magical trait if desired.`
  );
}

/**
 * Check if actor can have trait removed (validation)
 * @param {Actor} actor - The actor
 * @param {Item} traitItem - The trait item to be removed
 * @returns {object} { canRemove: boolean, reason?: string }
 */
export function validateTraitRemoval(actor, traitItem) {
  // For now, all traits can be removed freely
  // In the future, you might add restrictions like:
  // - Can't remove traits during combat
  // - Can't remove traits if they've been used in certain ways
  // - Require confirmation dialog for major traits
  
  return { canRemove: true };
}

// ========================================
// Kept for reference but no longer used.
