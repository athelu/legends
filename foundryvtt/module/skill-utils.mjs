export const SKILL_LABELS = {
  athletics: 'Athletics',
  might: 'Might',
  devices: 'Devices',
  thievery: 'Thievery',
  writing: 'Writing',
  rangedCombat: 'Ranged Combat',
  craft: 'Craft',
  acrobatics: 'Acrobatics',
  meleeCombat: 'Melee Combat',
  stealth: 'Stealth',
  investigate: 'Investigate',
  language: 'Language',
  history: 'History',
  arcane: 'Arcane',
  society: 'Society',
  perception: 'Perception',
  empathy: 'Empathy',
  medicine: 'Medicine',
  wilderness: 'Wilderness',
  religion: 'Religion',
  persuasion: 'Persuasion',
  intimidate: 'Intimidate',
  perform: 'Perform',
  deception: 'Deception'
};

export const SKILL_ATTRIBUTE_KEYS = {
  athletics: 'strength',
  might: 'strength',
  devices: 'dexterity',
  thievery: 'dexterity',
  writing: 'dexterity',
  rangedCombat: 'dexterity',
  craft: 'dexterity',
  acrobatics: 'agility',
  meleeCombat: 'agility',
  stealth: 'agility',
  investigate: 'intelligence',
  language: 'intelligence',
  history: 'intelligence',
  arcane: 'intelligence',
  society: 'intelligence',
  perception: 'wisdom',
  empathy: 'wisdom',
  medicine: 'wisdom',
  wilderness: 'wisdom',
  religion: 'wisdom',
  persuasion: 'charisma',
  intimidate: 'charisma',
  perform: 'charisma',
  deception: 'charisma'
};

export const SKILL_ATTRIBUTE_SHORT = {
  athletics: 'str',
  might: 'str',
  devices: 'dex',
  thievery: 'dex',
  writing: 'dex',
  rangedCombat: 'dex',
  craft: 'dex',
  acrobatics: 'agi',
  meleeCombat: 'agi',
  stealth: 'agi',
  investigate: 'int',
  language: 'int',
  history: 'int',
  arcane: 'int',
  society: 'int',
  perception: 'wis',
  empathy: 'wis',
  medicine: 'wis',
  wilderness: 'wis',
  religion: 'wis',
  persuasion: 'cha',
  intimidate: 'cha',
  perform: 'cha',
  deception: 'cha'
};

export const LEGACY_SKILL_KEYS = {
  wilderness: ['survival'],
  empathy: ['insight']
};

const RAW_SKILL_ALIASES = {
  athletics: 'athletics',
  might: 'might',
  devices: 'devices',
  thievery: 'thievery',
  writing: 'writing',
  craft: 'craft',
  acrobatics: 'acrobatics',
  stealth: 'stealth',
  language: 'language',
  history: 'history',
  society: 'society',
  perception: 'perception',
  medicine: 'medicine',
  persuasion: 'persuasion',
  deception: 'deception',
  intimidate: 'intimidate',
  intimidation: 'intimidate',
  perform: 'perform',
  performance: 'perform',
  arcane: 'arcane',
  arcana: 'arcane',
  investigate: 'investigate',
  investigation: 'investigate',
  empathy: 'empathy',
  insight: 'empathy',
  wilderness: 'wilderness',
  survival: 'wilderness',
  religion: 'religion',
  melee: 'meleeCombat',
  'melee combat': 'meleeCombat',
  meleecombat: 'meleeCombat',
  ranged: 'rangedCombat',
  'ranged combat': 'rangedCombat',
  rangedcombat: 'rangedCombat'
};

export function normalizeSkillKey(value) {
  if (!value) return '';

  const normalized = String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/[’']/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  return RAW_SKILL_ALIASES[normalized] || RAW_SKILL_ALIASES[normalized.replace(/\s+/g, '')] || '';
}

export function syncSkillAliases(skillData) {
  if (!skillData || typeof skillData !== 'object') return skillData;

  for (const [canonicalKey, legacyKeys] of Object.entries(LEGACY_SKILL_KEYS)) {
    const legacyValue = legacyKeys.find(key => skillData[key] !== undefined && skillData[key] !== null);
    if (skillData[canonicalKey] === undefined || skillData[canonicalKey] === null) {
      skillData[canonicalKey] = legacyValue ? skillData[legacyValue] : 0;
    }

    for (const legacyKey of legacyKeys) {
      if (skillData[legacyKey] === undefined || skillData[legacyKey] === null) {
        skillData[legacyKey] = skillData[canonicalKey] ?? 0;
      }
    }
  }

  for (const canonicalKey of Object.keys(SKILL_LABELS)) {
    if (skillData[canonicalKey] === undefined || skillData[canonicalKey] === null) {
      skillData[canonicalKey] = 0;
    }
  }

  return skillData;
}

export function getSkillValue(skillData, key) {
  if (!skillData || typeof skillData !== 'object') return 0;

  const canonicalKey = normalizeSkillKey(key);
  const candidates = [canonicalKey, ...(LEGACY_SKILL_KEYS[canonicalKey] || [])].filter(Boolean);
  for (const candidate of candidates) {
    if (skillData[candidate] !== undefined && skillData[candidate] !== null) {
      return skillData[candidate];
    }
  }

  return 0;
}