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
    'invoker', 'infuser', 'eldritch pact', 'alchemical tradition', 'summoner'
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
  const normalizedTraitType = String(traitType || '').toLowerCase();
  const existingTrait = getExistingPrimaryMagicalTrait(actor);
  const progressionPhase = actor?.system?.progression?.phase === 'creation' ? 'creation' : 'advancement';
  
  // Modifiers (Gifted Mage, Balanced Channeler) are passive - no validation needed
  // They should be added to the sheet BEFORE applying primary magical traits
  // They're detected by getPotentialGenerationMode() when primary trait is applied
  if (['gifted-mage', 'balanced-channeler'].includes(normalizedTraitType)) {
    return { valid: true };
  }

  if (['mageborn', 'sorcerous-origin'].includes(normalizedTraitType) && progressionPhase !== 'creation') {
    return {
      valid: false,
      reason: `${normalizedTraitType === 'mageborn' ? 'Mageborn' : 'Sorcerous Origin'} can only be gained during character creation.`
    };
  }
  
  // Primary magical traits cannot stack
  const primaryTraits = ['mageborn', 'divine-gift', 'sorcerous-origin', 
                         'invoker', 'infuser', 'eldritch-pact', 'alchemical-tradition', 'summoner'];
  
  if (primaryTraits.includes(normalizedTraitType)) {
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
    { pattern: 'eldritch pact', type: 'eldritch-pact' },
    { pattern: 'alchemical tradition', type: 'alchemical-tradition' },
    { pattern: 'summoner', type: 'summoner' }
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
  const magicalTraitUpdate = updates['system.magicalTrait'] || {};
  
  // Determine which abilities to grant
  switch (traitType) {
    case 'mageborn':
      abilityNamesToGrant.push('Ritual Casting');
      break;
      
    case 'divine-gift':
      // Grant Channel Divinity abilities based on patron
      const patron = magicalTraitUpdate.patron || 'generalist';
      
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
      const pactType = magicalTraitUpdate.pactType || updates['system.magicalTrait.pactType'];
      
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

    case 'alchemical-tradition':
      break;

    case 'summoner':
      // Summoner's unique weave is granted directly from the weaves compendium
      // (see applySummonerWorkflow for auto-grant logic)
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
    'eldritch-pact': 'Eldritch Pact',
    'alchemical-tradition': 'Alchemical Tradition',
    'summoner': 'Summoner'
  };
  
  const modeDescriptions = {
    'normal': 'Standard rolling',
    'gifted': '🌟 <strong>Gifted Mage</strong>: Roll 9d8 and drop the lowest',
    'balanced': '⚖️ <strong>Balanced Channeler</strong>: Use fixed array [5,4,3,3,2,2,1,1]'
  };
  
  const traitName = traitNames[primaryTrait.type] || primaryTrait.type;
  const noPoolTrait = ['alchemical-tradition'].includes(primaryTrait.type);
  const modeDesc = noPoolTrait
    ? 'No potential generation required'
    : (modeDescriptions[mode] || 'Standard rolling');
  const workflowSteps = noPoolTrait
    ? `
      <ol>
        ${primaryTrait.type === 'summoner'
          ? `<li>Choose your Primary Resonance (daemon affinity)</li>
             <li>Set Charisma as your effective casting stat</li>
             <li>Gain access to Summoning weaves for all eight energies</li>`
          : `<li>Set Intelligence as your effective casting stat</li>
             <li>Mark Alchemical Tradition as configured on the actor</li>
             <li>Use Craft: Alchemist and the downtime rules to create preparations</li>`
        }
      </ol>
    `
    : `
      <ol>
        <li>Generating your Magical Potentials</li>
        <li>Making trait-specific choices</li>
        <li>Assigning potentials to energy types</li>
      </ol>
    `;
  
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Character Creation: Setup Magical Trait' },
    position: { width: 500 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <p style="margin: 0;">You are about to configure <strong>${traitName}</strong> as your primary magical trait.</p>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div><strong>Primary Trait:</strong> ${traitName}</div>
          <div><strong>Generation Mode:</strong> ${modeDesc}</div>
        </div>
        <div>
          <div style="margin-bottom: 4px;"><strong>You will be guided through:</strong></div>
          <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px;">
            ${primaryTrait.type === 'alchemical-tradition'
              ? `<li>Set Intelligence as your effective casting stat</li>
                 <li>Mark Alchemical Tradition as configured on the actor</li>
                 <li>Use Craft: Alchemist and the downtime rules to create preparations</li>`
              : primaryTrait.type === 'summoner'
              ? `<li>Choose your Primary Resonance (daemon affinity)</li>
                 <li>Roll 8 Magical Potentials and assign them across all energy types</li>
                 <li>Set Charisma as your effective casting stat</li>
                 <li>Gain access to Summoning weaves for all eight energies</li>`
              : `<li>Generating your Magical Potentials</li>
                 <li>Making trait-specific choices</li>
                 <li>Assigning potentials to energy types</li>`
            }
          </ol>
        </div>
        <p style="margin: 0; font-size: 12px; color: #666;"><em>This cannot be easily undone. Make sure you have all desired modifier traits (Gifted Mage, Balanced Channeler) added first.</em></p>
      </form>
    `,
    buttons: [
      {
        action: 'confirm',
        label: 'Begin Setup',
        default: true,
        callback: () => true,
      },
      {
        action: 'cancel',
        label: 'Cancel',
        callback: () => false,
      },
    ],
  });

  return result === true;
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
    const confirm = await foundry.applications.api.DialogV2.wait({
      window: { title: 'Magical Traits Already Setup' },
      position: { width: 460 },
      rejectClose: false,
      content: `
        <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          <p style="margin: 0;">Your magical traits have already been configured.</p>
          <p style="margin: 0; font-size: 12px; color: #666;">Re-running setup will reset all your potentials, mastery, and related abilities. Are you sure you want to continue?</p>
        </form>
      `,
      buttons: [
        { action: 'confirm', label: 'Reset and Re-run', default: false, callback: () => true },
        { action: 'cancel', label: 'Cancel', default: true, callback: () => false },
      ],
    });

    if (confirm !== true) return false;
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
      case 'alchemical-tradition':
        success = await applyAlchemicalTraditionWorkflow(actor, primaryTrait.item, mode);
        break;
      case 'summoner':
        success = await applySummonerWorkflow(actor, primaryTrait.item, mode);
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
  
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `Apply ${traitName}` },
    position: { width: 460 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <p style="margin: 0;">You are about to apply the <strong>${traitName}</strong> magical trait.</p>
        <p style="margin: 0;">${modeText[mode]}</p>
        <div>
          <div style="margin-bottom: 4px;"><strong>You will be guided through:</strong></div>
          <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px;">
            <li>Generating your Magical Potentials</li>
            <li>Making trait-specific choices</li>
            <li>Assigning potentials to energy types</li>
          </ol>
        </div>
      </form>
    `,
    buttons: [
      { action: 'confirm', label: 'Begin', default: true, callback: () => true },
      { action: 'cancel', label: 'Cancel', callback: () => false },
    ],
  });

  return result === true;
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

// Summoner Primary Resonance configurations
export const SUMMONER_RESONANCES = {
  earth: {
    name: "Earth — Elementals, Fae, Nephilim",
    primary: 'earth',
    secondary: 'water',
    daemons: ['Elementals', 'Fae', 'Nephilim']
  },
  air: {
    name: "Air — Elementals, Fae, Nephilim",
    primary: 'air',
    secondary: 'fire',
    daemons: ['Elementals', 'Fae', 'Nephilim']
  },
  fire: {
    name: "Fire — Elementals, Fae, Nephilim",
    primary: 'fire',
    secondary: 'air',
    daemons: ['Elementals', 'Fae', 'Nephilim']
  },
  water: {
    name: "Water — Elementals, Fae, Nephilim",
    primary: 'water',
    secondary: 'earth',
    daemons: ['Elementals', 'Fae', 'Nephilim']
  },
  positive: {
    name: "Positive — Outsiders",
    primary: 'positive',
    secondary: 'space',
    daemons: ['Outsiders']
  },
  negative: {
    name: "Negative — Shadow Creatures, Outsiders",
    primary: 'negative',
    secondary: 'space',
    daemons: ['Shadow Creatures', 'Outsiders']
  },
  space: {
    name: "Space — Aberrations",
    primary: 'space',
    secondary: 'time',
    daemons: ['Aberrations']
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

/**
 * Calculate the initial energy pool so it can be set to full at creation time.
 * Mirrors actor._calculateEnergyPool() but works from the pending assignments
 * before the actor update has been applied.
 * @param {Actor} actor
 * @param {Object} assignments - energy -> value map
 * @param {string} castingStat - e.g. 'intelligence'
 * @returns {number}
 */
function calcInitialEnergy(actor, assignments, castingStat) {
  const potentialSum = Object.values(assignments).reduce((a, b) => a + b, 0);
  const castingStatValue = actor.system.attributes[castingStat]?.value || 0;
  const constitution = actor.system.attributes.constitution.value;
  // Mastery is all 0 at creation, masterySum = 0
  return potentialSum + (castingStatValue * 2) + constitution;
}

// ========================================
// DIALOG FUNCTIONS
// ========================================

/**
 * Show dialog to choose elemental affinity
 * @returns {Promise<string>} Chosen element
 */
export async function showAffinityDialog() {
  const affinityHtml = ELEMENTAL_ENERGIES.map(e =>
    `<option value="${e}">${ENERGY_TYPES[e].label} ${ENERGY_TYPES[e].icon}</option>`
  ).join('');

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Choose Elemental Affinity' },
    position: { width: 420 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-weight: bold;">Elemental Affinity:</label>
          <select name="affinity" style="width: 100%;">
            ${affinityHtml}
          </select>
        </div>
        <p style="margin: 0; font-size: 12px; color: #666;"><em>Your affinity will receive +2 bonus (max 8 total)</em></p>
      </form>
    `,
    buttons: [
      {
        action: 'confirm',
        label: 'Confirm',
        default: true,
        callback: (event, button, dialog) => dialog.element.querySelector('[name="affinity"]').value,
      },
      { action: 'cancel', label: 'Cancel', callback: () => null },
    ],
  });

  return (result && result !== 'cancel') ? result : null;
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
  
  const secondaryHtml = availableEnergies.map(e =>
    `<option value="${e}">${ENERGY_TYPES[e].label} ${ENERGY_TYPES[e].icon}</option>`
  ).join('');

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Choose Secondary Focus' },
    position: { width: 420 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-weight: bold;">Secondary Focus:</label>
          <select name="secondary" style="width: 100%;">
            ${secondaryHtml}
          </select>
        </div>
        <p style="margin: 0; font-size: 12px; color: #666;"><em>Your secondary focus will receive +1 bonus (max 8 total)</em></p>
      </form>
    `,
    buttons: [
      {
        action: 'confirm',
        label: 'Confirm',
        default: true,
        callback: (event, button, dialog) => dialog.element.querySelector('[name="secondary"]').value,
      },
      { action: 'cancel', label: 'Cancel', callback: () => null },
    ],
  });

  return (result && result !== 'cancel') ? result : null;
}

/**
 * Show dialog to choose divine patron
 * @returns {Promise<string>} Chosen patron key
 */
export async function showPatronDialog() {
  const patronsHtml = Object.entries(DIVINE_PATRONS).map(([key, data]) =>
    `<option value="${key}">${data.name}</option>`
  ).join('');

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Choose Divine Patron' },
    position: { width: 420 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-weight: bold;">Divine Patron:</label>
          <select name="patron" style="width: 100%;">
            ${patronsHtml}
          </select>
        </div>
        <p style="margin: 0; font-size: 12px; color: #666;"><em>Your patron determines your energy affinities</em></p>
      </form>
    `,
    buttons: [
      {
        action: 'confirm',
        label: 'Confirm',
        default: true,
        callback: (event, button, dialog) => dialog.element.querySelector('[name="patron"]').value,
      },
      { action: 'cancel', label: 'Cancel', callback: () => null },
    ],
  });

  return (result && result !== 'cancel') ? result : null;
}

/**
 * Show dialog to choose Summoner Primary Resonance
 * @returns {Promise<string>} Chosen resonance key
 */
export async function showPrimaryResonanceDialog() {
  const resonancesHtml = Object.entries(SUMMONER_RESONANCES).map(([key, data]) =>
    `<option value="${key}">${data.name}</option>`
  ).join('');

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Choose Primary Resonance' },
    position: { width: 480 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-weight: bold;">Primary Resonance:</label>
          <select name="resonance" style="width: 100%;">
            ${resonancesHtml}
          </select>
        </div>
        <p style="margin: 0; font-size: 12px; color: #666;"><em>Your resonance determines which daemon categories your pneuma naturally attracts and grants bonuses to your primary and secondary energies.</em></p>
      </form>
    `,
    buttons: [
      {
        action: 'confirm',
        label: 'Confirm',
        default: true,
        callback: (event, button, dialog) => dialog.element.querySelector('[name="resonance"]').value,
      },
      {
        action: 'cancel',
        label: 'Cancel',
        callback: () => null,
      },
    ],
  });

  return (result && result !== 'cancel') ? result : null;
}

/**
 * Show dialog to choose Force of Will manifestation
 * @returns {Promise<string>} Chosen manifestation key
 */
export async function showForceOfWillDialog() {
  const stories = Object.fromEntries(Object.entries(FORCE_OF_WILL).map(([k, v]) => [k, v.story]));
  const manifestationsHtml = Object.entries(FORCE_OF_WILL).map(([key, data]) =>
    `<option value="${key}">${data.name}</option>`
  ).join('');

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Choose Force of Will' },
    position: { width: 480 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-weight: bold;">Force of Will Manifestation:</label>
          <select name="manifestation" style="width: 100%;">
            ${manifestationsHtml}
          </select>
        </div>
        <div id="manifestation-story" style="padding: 8px; background: rgba(0,0,0,0.15); border-radius: 4px; font-size: 12px;">
          <em>${FORCE_OF_WILL.unchangingStone.story}</em>
        </div>
      </form>
    `,
    render: (event, dialog) => {
      const select = dialog.element.querySelector('[name="manifestation"]');
      const storyBox = dialog.element.querySelector('#manifestation-story');
      select.addEventListener('change', () => {
        storyBox.innerHTML = `<em>${stories[select.value] ?? ''}</em>`;
      });
    },
    buttons: [
      {
        action: 'confirm',
        label: 'Confirm',
        default: true,
        callback: (event, button, dialog) => dialog.element.querySelector('[name="manifestation"]').value,
      },
      {
        action: 'cancel',
        label: 'Cancel',
        callback: () => null,
      },
    ],
  });

  return (result && result !== 'cancel') ? result : null;
}

/**
 * Show dialog to choose pact type
 * @returns {Promise<string>} Chosen pact key
 */
export async function showPactTypeDialog() {
  const stories = Object.fromEntries(Object.entries(PACT_TYPES).map(([k, v]) => [k, v.story]));
  const pactsHtml = Object.entries(PACT_TYPES).map(([key, data]) =>
    `<option value="${key}">${data.name}</option>`
  ).join('');

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Choose Eldritch Pact' },
    position: { width: 480 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-weight: bold;">Pact Type:</label>
          <select name="pact" style="width: 100%;">
            ${pactsHtml}
          </select>
        </div>
        <div id="pact-story" style="padding: 8px; background: rgba(0,0,0,0.15); border-radius: 4px; font-size: 12px;">
          <em>${PACT_TYPES.survivorsBargain.story}</em>
        </div>
      </form>
    `,
    render: (event, dialog) => {
      const select = dialog.element.querySelector('[name="pact"]');
      const storyBox = dialog.element.querySelector('#pact-story');
      select.addEventListener('change', () => {
        storyBox.innerHTML = `<em>${stories[select.value] ?? ''}</em>`;
      });
    },
    buttons: [
      {
        action: 'confirm',
        label: 'Confirm',
        default: true,
        callback: (event, button, dialog) => dialog.element.querySelector('[name="pact"]').value,
      },
      {
        action: 'cancel',
        label: 'Cancel',
        callback: () => null,
      },
    ],
  });

  return (result && result !== 'cancel') ? result : null;
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
export async function showAssignmentDialog(rolls, energies, preAssigned = {}, options = {}) {
  const { allRolls = null, preAssignedDetails = {} } = options;
  let assignments = {...preAssigned};

  // Filter out pre-assigned energies from the dropdown
  const preAssignedKeys = Object.keys(preAssigned);
  const availableEnergies = energies.filter(e => !preAssignedKeys.includes(e));

  const energyOptions = availableEnergies.map(e =>
    `<option value="${e}">${ENERGY_TYPES[e].label}</option>`
  ).join('');

  const rollsHtml = rolls.map((roll, idx) => `
    <div class="roll-assignment" data-roll-index="${idx}" style="display: flex; align-items: center; gap: 8px;">
      <span class="roll-value" style="font-weight: bold; min-width: 24px; text-align: right;">${roll}</span>
      <select name="energy-${idx}" style="flex: 1;">
        <option value="">— Choose energy —</option>
        ${energyOptions}
      </select>
    </div>
  `).join('');

  // Roll summary bar (all rolls sorted descending)
  const displayRolls = allRolls ? [...allRolls].sort((a, b) => b - a) : null;
  const rollSummaryHtml = displayRolls ? `
    <div style="padding: 6px 8px; background: rgba(0,0,0,0.1); border-radius: 4px; font-size: 12px;">
      <strong>All rolls:</strong> ${displayRolls.join(', ')} <span style="color: #888;">(${displayRolls.length} dice)</span>
    </div>
  ` : '';

  // Pre-assigned section with breakdown of roll + bonus
  const preAssignedHtml = Object.keys(preAssigned).length > 0 ? `
    <div style="padding: 8px; background: rgba(0,0,0,0.15); border-radius: 4px; font-size: 12px;">
      <strong>Pre-assigned (best rolls chosen automatically):</strong>
      <ul style="margin: 4px 0 0 0; padding-left: 18px;">
        ${Object.entries(preAssigned).map(([e, v]) => {
          const d = preAssignedDetails[e];
          const note = d
            ? ` <span style="color:#888;">(rolled ${d.roll} + ${d.bonus} bonus${d.roll + d.bonus > 8 ? ', capped at 8' : ''})</span>`
            : '';
          return `<li>${ENERGY_TYPES[e].label}: <strong>${v}</strong>${note}</li>`;
        }).join('')}
      </ul>
    </div>
  ` : '';

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Assign Potential Rolls' },
    position: { width: 480 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        ${rollSummaryHtml}
        <p style="margin: 0; font-weight: bold;">Assign each remaining roll to an energy type:</p>
        <div class="roll-assignments" style="display: flex; flex-direction: column; gap: 6px;">
          ${rollsHtml}
        </div>
        ${preAssignedHtml}
      </form>
    `,
    render: (event, dialog) => {
      const selects = Array.from(dialog.element.querySelectorAll('select[name^="energy-"]'));
      function syncOptions() {
        const used = new Set(selects.map(s => s.value).filter(v => v));
        selects.forEach(sel => {
          const current = sel.value;
          sel.querySelectorAll('option').forEach(opt => {
            if (!opt.value) return;
            opt.disabled = used.has(opt.value) && opt.value !== current;
          });
        });
      }
      selects.forEach(sel => sel.addEventListener('change', syncOptions));
      syncOptions();
    },
    buttons: [
      {
        action: 'confirm',
        label: 'Confirm',
        default: true,
        callback: (event, button, dialog) => {
          rolls.forEach((roll, idx) => {
            const energy = dialog.element.querySelector(`[name="energy-${idx}"]`)?.value;
            if (energy) assignments[energy] = (assignments[energy] || 0) + roll;
          });
          return assignments;
        },
      },
      { action: 'cancel', label: 'Cancel', callback: () => null },
    ],
  });

  return (result && result !== 'cancel') ? result : null;
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
  const preAssignedDetails = {
    [affinity]: { roll: affinityRoll, bonus: 2 },
    [secondary]: { roll: secondaryRoll, bonus: 1 }
  };
  
  // Let player assign remaining rolls
  const assignments = await showAssignmentDialog(
    availableRolls, 
    ALL_ENERGIES.filter(e => e !== affinity && e !== secondary),
    preAssigned,
    { allRolls: rolls, preAssignedDetails }
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
    'system.energy.current': calcInitialEnergy(actor, assignments, 'intelligence'),
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
  let preAssignedDetails = {};
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
      preAssignedDetails[energy] = { roll, bonus: 1 };
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
    preAssignedDetails = {
      [patron.primary]: { roll: primaryRoll, bonus: 2 },
      [patron.secondary]: { roll: secondaryRoll, bonus: 1 }
    };
    remainingRolls = availableRolls;
  }
  
  // Step 4: Assign remaining rolls
  const energiesForDialog = ALL_ENERGIES.filter(e => !Object.keys(preAssigned).includes(e));
  const assignments = await showAssignmentDialog(
    remainingRolls,
    energiesForDialog,
    preAssigned,
    { allRolls: rolls, preAssignedDetails }
  );
  
  if (!assignments) {
    ui.notifications.warn("Divine Gift application cancelled");
    return false;
  }

  const tier = actor.system.tier?.value || 1;
  
  // Step 5: Build updates object
  const updates = {
    'system.potentials': createPotentialsObject(assignments),
    'system.mastery': initializeMastery(ALL_ENERGIES),
    'system.castingStat.value': 'wisdom',
    'system.energy.current': calcInitialEnergy(actor, assignments, 'wisdom'),
    'system.magicalTrait': {
      type: 'divine-gift',
      subtype: 'divine',
      patron: patronKey,
      availableEnergies: ALL_ENERGIES,
      isSetup: true
    },
    'system.channelDivinity': {
      current: tier,
      max: tier
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
  const preAssignedDetails = {
    air: { roll: airRoll, bonus: 2 },
    positive: { roll: positiveRoll, bonus: 1 }
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
    preAssigned,
    { allRolls: rolls, preAssignedDetails }
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
    'system.energy.current': calcInitialEnergy(actor, assignments, 'charisma'),
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
 * Alchemical Tradition workflow - called from setupMagicalTraits()
 */
export async function applyAlchemicalTraditionWorkflow(actor, traitItem, mode) {
  ui.notifications.info("Setting up Alchemical Tradition...");

  const updates = {
    'system.potentials': createPotentialsObject({}),
    'system.mastery': initializeMastery([]),
    'system.energy.current': 0,
    'system.energy.max': 0,
    'system.castingStat.value': 'intelligence',
    'system.magicalTrait': {
      type: 'alchemical-tradition',
      subtype: 'alchemical',
      availableEnergies: [],
      isSetup: true
    },
    'system.channelDivinity': {
      current: 0,
      max: 0
    }
  };

  await grantMagicalTraitAbilities(actor, 'alchemical-tradition', updates);
  await actor.update(updates);

  ui.notifications.info("Alchemical Tradition applied successfully!");
  return true;
}

/**
 * Summoner workflow - called from setupMagicalTraits()
 */
export async function applySummonerWorkflow(actor, traitItem, mode) {
  ui.notifications.info("Setting up Summoner...");

  // Step 1: Choose Primary Resonance
  const resonanceKey = await showPrimaryResonanceDialog();
  if (!resonanceKey) {
    ui.notifications.warn("Summoner application cancelled");
    return false;
  }

  const resonance = SUMMONER_RESONANCES[resonanceKey];

  // Step 2: Roll 8 potentials and apply resonance bonuses
  const rolls = await rollPotentials(8, mode);
  const availableRolls = [...rolls];

  const primaryIndex = findOptimalRollForBonus(availableRolls, 2);
  const primaryRoll = availableRolls.splice(primaryIndex, 1)[0];

  const secondaryIndex = findOptimalRollForBonus(availableRolls, 1);
  const secondaryRoll = availableRolls.splice(secondaryIndex, 1)[0];

  const preAssigned = {
    [resonance.primary]: Math.min(primaryRoll + 2, 8),
    [resonance.secondary]: Math.min(secondaryRoll + 1, 8)
  };
  const preAssignedDetails = {
    [resonance.primary]: { roll: primaryRoll, bonus: 2 },
    [resonance.secondary]: { roll: secondaryRoll, bonus: 1 }
  };

  // Step 3: Assign remaining rolls
  const remainingEnergies = ALL_ENERGIES.filter(
    e => e !== resonance.primary && e !== resonance.secondary
  );
  const assignments = await showAssignmentDialog(
    availableRolls,
    remainingEnergies,
    preAssigned,
    { allRolls: rolls, preAssignedDetails }
  );

  if (!assignments) {
    ui.notifications.warn("Summoner application cancelled");
    return false;
  }

  // Step 4: Build updates
  const updates = {
    'system.potentials': createPotentialsObject(assignments),
    'system.mastery': initializeMastery(ALL_ENERGIES),
    'system.castingStat.value': 'charisma',
    'system.energy.current': calcInitialEnergy(actor, assignments, 'charisma'),
    'system.magicalTrait': {
      type: 'summoner',
      subtype: 'summoner',
      primaryResonance: resonanceKey,
      primaryEnergy: resonance.primary,
      secondaryEnergy: resonance.secondary,
      daemonCategories: resonance.daemons,
      availableEnergies: ALL_ENERGIES,
      isSetup: true
    }
  };

  await grantMagicalTraitAbilities(actor, 'summoner', updates);
  await actor.update(updates);

  // Grant the Summon Daemon weave automatically
  const weavesPack = game.packs.get('legends.weaves');
  if (weavesPack) {
    const weaveIndex = await weavesPack.getIndex();
    const weaveEntry = weaveIndex.find(e => e.name === 'Summon Daemon');
    if (weaveEntry) {
      const weaveDoc = await weavesPack.getDocument(weaveEntry._id);
      if (weaveDoc) {
        await actor.createEmbeddedDocuments('Item', [weaveDoc.toObject()]);
        ui.notifications.info('Summon Daemon weave added to your weave list.');
      }
    } else {
      console.warn('Summon Daemon weave not found in legends.weaves compendium — pack may need to be rebuilt.');
    }
  }

  ui.notifications.info(`Summoner trait applied! Primary Resonance: ${resonance.name}`);
  return true;
}

/**
 * Apply Gifted Mage trait (passive modifier)
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
  const preAssignedDetails = {
    earth: { roll: earthRoll, bonus: 2 },
    space: { roll: spaceRoll, bonus: 1 }
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
    preAssigned,
    { allRolls: rolls, preAssignedDetails }
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
    'system.energy.current': calcInitialEnergy(actor, assignments, 'intelligence'),
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
  const primaryEnergy = await foundry.applications.api.DialogV2.wait({
    window: { title: 'Choose Primary Energy' },
    position: { width: 420 },
    rejectClose: false,
    content: `
      <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-weight: bold;">Primary Energy for ${manifestation.name}:</label>
          <select name="primary" style="width: 100%;">
            ${manifestation.energies.map(e =>
              `<option value="${e}">${ENERGY_TYPES[e].label}</option>`
            ).join('')}
          </select>
        </div>
      </form>
    `,
    buttons: [
      {
        action: 'confirm',
        label: 'Confirm',
        default: true,
        callback: (event, button, dialog) => dialog.element.querySelector('[name="primary"]').value,
      },
      { action: 'cancel', label: 'Cancel', callback: () => null },
    ],
  }).then(r => (r && r !== 'cancel') ? r : null);
  
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
  const preAssignedDetails = {
    [primaryEnergy]: { roll: primaryRoll, bonus: 2 },
    [secondary]: { roll: secondaryRoll, bonus: 1 }
  };
  
  const assignments = await showAssignmentDialog(
    availableRolls,
    ALL_ENERGIES.filter(e => e !== primaryEnergy && e !== secondary),
    preAssigned,
    { allRolls: rolls, preAssignedDetails }
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
    'system.energy.current': calcInitialEnergy(actor, assignments, 'wisdom'),
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
  const preAssignedDetails = {
    [pact.primary]: { roll: primaryRoll, bonus: 2 },
    [pact.secondary]: { roll: secondaryRoll, bonus: 1 }
  };
  
  // Step 4: Assign remaining rolls
  const remainingEnergies = pact.energies.filter(
    e => e !== pact.primary && e !== pact.secondary
  );
  const assignments = await showAssignmentDialog(
    availableRolls,
    remainingEnergies,
    preAssigned,
    { allRolls: rolls, preAssignedDetails }
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
    'system.energy.current': calcInitialEnergy(actor, assignments, 'charisma'),
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
    'sorcerous origin', 'eldritch pact', 'alchemical tradition'
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
      source.includes('alchemical tradition') ||
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
