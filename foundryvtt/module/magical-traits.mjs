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
    'invoker', 'infuser', 'eldritch pact', 'alchemical tradition'
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
                         'invoker', 'infuser', 'eldritch-pact', 'alchemical-tradition'];
  
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
    { pattern: 'alchemical tradition', type: 'alchemical-tradition' }
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
        case 'shuJahan':
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
        case 'survivorsBargain':
          abilityNamesToGrant.push("Scavenged Power (Survivor's Bargain)");
          break;
        case 'desperate':
        case 'desperateDeal':
          abilityNamesToGrant.push('Borrowed Vitality (Desperate Deal)');
          break;
        case 'answered':
        case 'answeredCry':
          abilityNamesToGrant.push('Void Resonance (Answered Cry)', 'Void Speech (Answered Cry)');
          break;
        case 'stolen':
        case 'stolenShard':
          abilityNamesToGrant.push('Unstable Surge (Stolen Shard)', "Shard's Terror (Stolen Shard)");
          break;
      }
      break;

    case 'alchemical-tradition':
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
    'alchemical-tradition': 'Alchemical Tradition'
  };

  const modeDescriptions = {
    normal: 'Standard rolling',
    gifted: 'Gifted Mage: roll an extra die and drop the lowest.',
    balanced: 'Balanced Channeler: use the fixed array [5, 4, 3, 3, 2, 2, 1, 1].'
  };

  const traitName = traitNames[primaryTrait.type] || primaryTrait.type;
  const modeDesc = primaryTrait.type === 'alchemical-tradition'
    ? 'No potential generation is required for this path.'
    : (modeDescriptions[mode] || 'Standard rolling');
  const workflowSteps = primaryTrait.type === 'alchemical-tradition'
    ? `
      <ul style="margin: 6px 0 0 18px;">
        <li>Set Intelligence as your effective casting stat</li>
        <li>Mark Alchemical Tradition as configured</li>
        <li>Unlock alchemical preparation play</li>
      </ul>
    `
    : `
      <ul style="margin: 6px 0 0 18px;">
        <li>Roll or assign magical potentials</li>
        <li>Choose your trait-specific magical identity</li>
        <li>Finalize energy assignments and mastery</li>
      </ul>
    `;

  return Dialog.confirm({
    title: 'Setup Magical Traits',
    content: `
      <div style="padding: 8px 4px; display: flex; flex-direction: column; gap: 10px;">
        <div>
          <div style="font-size: 18px; font-weight: 700;">Ready to configure your magical powers?</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">This walkthrough now matches the newer character-creation selection flow.</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
          <div style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.04em;">Primary Trait</div>
            <div style="font-weight: 600; margin-top: 4px;">${traitName}</div>
          </div>
          <div style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.04em;">Generation Mode</div>
            <div style="font-weight: 600; margin-top: 4px;">${mode === 'gifted' ? 'Gifted' : mode === 'balanced' ? 'Balanced' : 'Standard'}</div>
          </div>
        </div>
        <div style="font-size: 13px;">${modeDesc}</div>
        <div>
          <strong>This setup will guide you through:</strong>
          ${workflowSteps}
        </div>
        <div style="font-size: 12px; color: #666;">Make sure any modifier traits such as Gifted Mage or Balanced Channeler are already chosen before continuing.</div>
      </div>
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
      case 'alchemical-tradition':
        success = await applyAlchemicalTraditionWorkflow(actor, primaryTrait.item, mode);
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

function escapeHtml(value) {
  return Handlebars.escapeExpression(String(value ?? ''));
}

function getEnergyDescription(energyKey) {
  const descriptions = {
    fire: 'Passion, destruction, explosive force, and raw heat.',
    water: 'Adaptability, flow, restoration, and resilience.',
    earth: 'Stability, endurance, shape, and patient strength.',
    air: 'Movement, swiftness, sound, and freedom.',
    positive: 'Life, blessing, radiance, and restorative magic.',
    negative: 'Decay, endings, entropy, and underworld power.',
    time: 'Fate, rhythm, memory, and the pull of destiny.',
    space: 'Distance, perception, motion, and impossible geometry.'
  };

  return descriptions[energyKey] || 'A channel for distinctive magical potential.';
}

function buildBadgeList(entries = []) {
  const list = Array.isArray(entries) ? entries.filter(Boolean) : [entries].filter(Boolean);
  if (!list.length) return '';

  return `
    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
      ${list.map((entry) => `
        <span style="border: 1px solid rgba(209, 139, 71, 0.35); border-radius: 999px; padding: 2px 8px; font-size: 11px; color: #5a4a34; background: rgba(209, 139, 71, 0.08);">
          ${escapeHtml(entry)}
        </span>
      `).join('')}
    </div>
  `;
}

function buildMagicalSelectionPreview(option) {
  const details = Array.isArray(option?.details) ? option.details.filter(Boolean) : [];

  return `
    <div style="display: flex; flex-direction: column; gap: 10px; min-height: 320px;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">
          <h3 style="margin: 0;">${escapeHtml(option?.title || option?.label || option?.key || 'Option')}</h3>
          ${option?.subtitle ? `<span style="font-size: 12px; color: #666;">${escapeHtml(option.subtitle)}</span>` : ''}
        </div>
        ${buildBadgeList(option?.badges || [])}
      </div>
      ${option?.bonusText ? `<div><strong>Mechanical Impact:</strong> ${escapeHtml(option.bonusText)}</div>` : ''}
      ${option?.description ? `<div><strong>Overview</strong><div style="margin-top: 6px;">${escapeHtml(option.description)}</div></div>` : ''}
      ${option?.story ? `<div><strong>Story Cue</strong><div style="margin-top: 6px;"><em>${escapeHtml(option.story)}</em></div></div>` : ''}
      ${details.length ? `<div><strong>Details</strong><ul style="margin: 6px 0 0 18px;">${details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join('')}</ul></div>` : ''}
    </div>
  `;
}

function renderMagicalOptionPicker(root, options, initialIndex = 0) {
  const container = root instanceof HTMLElement ? root : (root?.[0] || root);
  if (!container) return;

  const input = container.querySelector('[name="magicalChoice"]');
  const preview = container.querySelector('[data-magical-preview]');
  const rows = Array.from(container.querySelectorAll('[data-magical-option]'));

  const syncSelection = (index) => {
    const safeIndex = Math.max(0, Math.min(index, options.length - 1));
    if (input) input.value = String(safeIndex);

    rows.forEach((row, rowIndex) => {
      row.style.borderColor = rowIndex === safeIndex ? '#d18b47' : 'rgba(209, 139, 71, 0.25)';
      row.style.background = rowIndex === safeIndex ? 'rgba(209, 139, 71, 0.10)' : 'rgba(255, 255, 255, 0.03)';
    });

    if (preview) preview.innerHTML = buildMagicalSelectionPreview(options[safeIndex]);
  };

  rows.forEach((row, rowIndex) => {
    row.addEventListener('click', () => syncSelection(rowIndex));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        syncSelection(rowIndex);
      }
    });
  });

  syncSelection(initialIndex);
}

async function showMagicalSelectionDialog({
  title,
  heading,
  description = '',
  options = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}) {
  if (!Array.isArray(options) || !options.length) return null;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const dialog = new Dialog({
      title,
      content: `
        <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          <div><strong>${escapeHtml(heading)}</strong></div>
          ${description ? `<div style="font-size: 12px; color: #666;">${escapeHtml(description)}</div>` : ''}
          <input type="hidden" name="magicalChoice" value="0" />
          <div style="display: grid; grid-template-columns: minmax(260px, 320px) minmax(0, 1fr); gap: 14px; align-items: start;">
            <div>
              <label style="display: block; margin-bottom: 6px;">Select an option</label>
              <div style="display: flex; flex-direction: column; gap: 6px; max-height: 440px; overflow-y: auto; padding-right: 4px;">
                ${options.map((option, index) => `
                  <div
                    data-magical-option="${index}"
                    tabindex="0"
                    style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 8px 10px; cursor: pointer;">
                    <div style="font-weight: 600;">${escapeHtml(option.title || option.label || option.key || `Option ${index + 1}`)}</div>
                    ${option.subtitle ? `<div style="font-size: 12px; color: #666; margin-top: 2px;">${escapeHtml(option.subtitle)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            <div data-magical-preview style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 10px; padding: 12px; max-height: 440px; overflow-y: auto;"></div>
          </div>
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: confirmLabel,
          callback: (html) => {
            const root = html?.[0] || html;
            const value = root?.querySelector('[name="magicalChoice"]')?.value || '0';
            const selectedIndex = Number.parseInt(String(value), 10);
            finish(options[selectedIndex]?.key ?? null);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: cancelLabel,
          callback: () => finish(null)
        }
      },
      default: 'ok',
      render: (html) => renderMagicalOptionPicker(html?.[0] || html, options, 0),
      close: () => finish(null)
    });

    dialog.render(true);
  });
}

async function showEnergySelectionDialog({ title, heading, description = '', energies = [], confirmLabel = 'Confirm' }) {
  const options = energies.map((energy) => ({
    key: energy,
    title: `${ENERGY_TYPES[energy]?.icon || ''} ${ENERGY_TYPES[energy]?.label || energy}`.trim(),
    subtitle: 'Energy Choice',
    description: getEnergyDescription(energy),
    bonusText: description,
    badges: [ENERGY_TYPES[energy]?.label || energy],
    details: ['This selection will influence your magical focus and final setup.']
  }));

  return showMagicalSelectionDialog({ title, heading, description, options, confirmLabel });
}

/**
 * Show dialog to choose elemental affinity
 * @returns {Promise<string>} Chosen element
 */
export async function showAffinityDialog() {
  return showEnergySelectionDialog({
    title: 'Choose Elemental Affinity',
    heading: 'Choose your Elemental Affinity',
    description: 'Your affinity receives a +2 potential bonus, to a maximum of 8.',
    energies: ELEMENTAL_ENERGIES,
    confirmLabel: 'Choose Affinity'
  });
}

/**
 * Show dialog to choose secondary focus
 * @param {string} excludeEnergy - Energy to exclude (already chosen as affinity)
 * @returns {Promise<string>} Chosen energy
 */
export async function showSecondaryFocusDialog(excludeEnergy = null, excludeMultiple = []) {
  const excluded = excludeEnergy ? [excludeEnergy, ...excludeMultiple] : excludeMultiple;
  const availableEnergies = ALL_ENERGIES.filter((energy) => !excluded.includes(energy));

  return showEnergySelectionDialog({
    title: 'Choose Secondary Focus',
    heading: 'Choose your Secondary Focus',
    description: 'Your secondary focus receives a +1 potential bonus, to a maximum of 8.',
    energies: availableEnergies,
    confirmLabel: 'Choose Focus'
  });
}

/**
 * Show dialog to choose divine patron
 * @returns {Promise<string>} Chosen patron key
 */
export async function showPatronDialog() {
  const patronSummaries = {
    alkira: 'A martial patron of discipline, conquest, and iron order.',
    ambis: 'A nurturing divine path centered on mercy, protection, and life.',
    athore: 'Justice, judgment, law, and the weight of righteous truth.',
    enschede: 'Fate, prophecy, timing, and the unseen pattern of events.',
    hirnaloyta: 'Nature, growth, renewal, and the old living world.',
    nevil: 'Death, endings, memory, and reverence for the underworld.',
    rudlu: 'Luck, trickery, misdirection, and impossible chances.',
    shuJahan: 'Wisdom, philosophy, reflection, and transcendental knowledge.',
    generalist: 'A broad devotion to the full pantheon rather than one divine source.'
  };

  const options = Object.entries(DIVINE_PATRONS).map(([key, data]) => {
    const [title, subtitle] = String(data.name || key).split(' - ');
    const favoredEnergies = [data.primary, data.secondary, data.tertiary]
      .filter(Boolean)
      .map((energy) => `${ENERGY_TYPES[energy]?.icon || ''} ${ENERGY_TYPES[energy]?.label || energy}`.trim());

    return {
      key,
      title,
      subtitle: subtitle || 'Divine Patron',
      description: patronSummaries[key] || 'Your chosen patron shapes your miracles and favored energies.',
      bonusText: key === 'generalist'
        ? 'Choose three favored energies; each receives a +1 bonus.'
        : `${ENERGY_TYPES[data.primary]?.label || 'Primary'} receives +2, and ${ENERGY_TYPES[data.secondary]?.label || 'Secondary'} receives +1.`,
      badges: favoredEnergies,
      details: [
        key === 'generalist'
          ? 'Generalists gain a wider but flatter spread of divine affinities.'
          : `Channel Divinity abilities and granted powers will align with ${title}.`
      ]
    };
  });

  return showMagicalSelectionDialog({
    title: 'Choose Divine Patron',
    heading: 'Choose which deity you serve',
    description: 'Your patron determines your divine affinities and granted abilities.',
    options,
    confirmLabel: 'Choose Patron'
  });
}

/**
 * Show dialog to choose Force of Will manifestation
 * @returns {Promise<string>} Chosen manifestation key
 */
export async function showForceOfWillDialog() {
  const options = Object.entries(FORCE_OF_WILL).map(([key, data]) => ({
    key,
    title: data.name,
    subtitle: 'Force of Will',
    description: `Favored energies: ${data.energies.map((energy) => ENERGY_TYPES[energy]?.label || energy).join(' and ')}.`,
    bonusText: 'Your chosen primary manifestation energy receives +2. You will select a secondary focus afterward for +1.',
    story: data.story,
    badges: data.energies.map((energy) => `${ENERGY_TYPES[energy]?.icon || ''} ${ENERGY_TYPES[energy]?.label || energy}`.trim()),
    details: ['This defines the narrative shape of your sorcerous power.']
  }));

  return showMagicalSelectionDialog({
    title: 'Choose Force of Will',
    heading: 'Choose your Force of Will manifestation',
    description: 'Each manifestation suggests a different expression of innate sorcery.',
    options,
    confirmLabel: 'Choose Manifestation'
  });
}

/**
 * Show dialog to choose pact type
 * @returns {Promise<string>} Chosen pact key
 */
export async function showPactTypeDialog() {
  const options = Object.entries(PACT_TYPES).map(([key, data]) => ({
    key,
    title: data.name,
    subtitle: 'Eldritch Pact',
    description: `Favored energies: ${data.energies.map((energy) => ENERGY_TYPES[energy]?.label || energy).join(', ')}.`,
    bonusText: `${ENERGY_TYPES[data.primary]?.label || 'Primary'} receives +2, and ${ENERGY_TYPES[data.secondary]?.label || 'Secondary'} receives +1.`,
    story: data.story,
    badges: data.energies.map((energy) => `${ENERGY_TYPES[energy]?.icon || ''} ${ENERGY_TYPES[energy]?.label || energy}`.trim()),
    details: ['Your pact type determines the feel and focus of your gained power.']
  }));

  return showMagicalSelectionDialog({
    title: 'Choose Eldritch Pact',
    heading: 'Choose your Pact Type',
    description: 'Select the story and energy profile that matches your bargain.',
    options,
    confirmLabel: 'Choose Pact'
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
    let assignments = { ...preAssigned };

    const preAssignedKeys = Object.keys(preAssigned);
    const availableEnergies = energies.filter((energy) => !preAssignedKeys.includes(energy));

    const energyOptions = availableEnergies.map((energy) =>
      `<option value="${energy}">${ENERGY_TYPES[energy]?.icon || ''} ${ENERGY_TYPES[energy]?.label || energy}</option>`
    ).join('');

    const rollsHtml = rolls.map((roll, idx) => `
      <div style="display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 10px; align-items: center; border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 8px 10px;">
        <div style="border-radius: 999px; background: rgba(209, 139, 71, 0.14); padding: 6px 0; text-align: center; font-weight: 700;">${roll}</div>
        <div>
          <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Assign this roll</label>
          <select name="energy-${idx}" style="width: 100%; padding: 6px;">
            <option value="">Unassigned</option>
            ${energyOptions}
          </select>
        </div>
      </div>
    `).join('');

    const assignedPreview = Object.keys(preAssigned).length > 0
      ? `
        <div style="border: 1px solid rgba(209, 139, 71, 0.25); border-radius: 8px; padding: 10px;">
          <strong>Locked-in bonuses</strong>
          <ul style="margin: 6px 0 0 18px;">
            ${Object.entries(preAssigned).map(([energy, value]) => `
              <li>${escapeHtml(ENERGY_TYPES[energy]?.label || energy)}: ${escapeHtml(String(value))}</li>
            `).join('')}
          </ul>
        </div>
      `
      : '';

    const dialog = new Dialog({
      title: 'Assign Potential Rolls',
      content: `
        <form style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          <div><strong>Assign each remaining roll to an energy type</strong></div>
          <div style="font-size: 12px; color: #666;">This finalizes your potential spread for the selected magical path.</div>
          ${assignedPreview}
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${rollsHtml}
          </div>
        </form>
      `,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Apply Potentials',
          callback: (html) => {
            rolls.forEach((roll, idx) => {
              const energy = html.find(`[name="energy-${idx}"]`).val();
              if (energy) {
                assignments[energy] = (assignments[energy] || 0) + roll;
              }
            });
            resolve(assignments);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => resolve(null)
        }
      },
      default: 'ok',
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

  const tier = actor.system.tier?.value || 1;
  
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
  const primaryEnergy = await showEnergySelectionDialog({
    title: 'Choose Primary Energy',
    heading: `Choose your primary energy for ${manifestation.name}`,
    description: 'This primary energy receives a +2 potential bonus, to a maximum of 8.',
    energies: manifestation.energies,
    confirmLabel: 'Choose Primary Energy'
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
