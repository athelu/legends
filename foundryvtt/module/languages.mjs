const LANGUAGE_DEFINITIONS = [
  {
    key: 'meresagian',
    label: 'Meresagian',
    description: 'The language of the Kingdom of Meresaw and the most widely encountered tongue in central Estaea.'
  },
  {
    key: 'coudassian',
    label: 'Coudassian',
    description: 'A formal imperial language associated with law, scholarship, and bureaucracy.'
  },
  {
    key: 'bellikoz',
    label: 'Bellikoz',
    description: 'The warrior tongue of Bellicosia, rich in military and theological vocabulary.'
  },
  {
    key: 'echartean',
    label: 'Echartean',
    description: 'A precise mountain language associated with scholarship, prophecy, and hidden knowledge.'
  },
  {
    key: 'odani',
    label: 'Odani',
    description: 'An oral-first language of the Reshi and Tandu peoples, deeply shaped by social context.'
  },
  {
    key: 'urjack',
    label: 'Urjack',
    description: 'A highland language with unusually fine distinctions for weather, cold, and terrain.'
  },
  {
    key: 'hadriaeth',
    label: 'Hadriaeth',
    description: 'The ancient elven language, restored as a living tongue in the new Elven Kingdom.'
  },
  {
    key: 'dwarven',
    label: 'Dwarven',
    description: 'A dead scholarly language preserved primarily in inscriptions and academic study.'
  },
];

const ORIGIN_DEFINITIONS = [
  {
    key: 'bellicosian-empire',
    label: 'Bellicosian',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'bellikoz',
    summary: 'Bellicosian heritage. Martial Culture: raise Melee Combat and Religion to 3.',
    requiresGMApproval: false,
  },
  {
    key: 'republic-of-coudassis',
    label: 'Coudassian',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'coudassian',
    summary: 'Coudassian heritage. Old Blood: raise Persuasion and Athletics to 3.',
    requiresGMApproval: false,
  },
  {
    key: 'the-echartean-empire',
    label: 'Echartesh',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'echartean',
    summary: 'Echartesh heritage. Tradecraft: raise Empathy and Society to 3.',
    requiresGMApproval: false,
  },
  {
    key: 'kingdom-of-meresaw',
    label: 'Mersagian',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'meresagian',
    summary: 'Mersagian heritage. Cosmopolitan: raise Empathy and Athletics to 3.',
    requiresGMApproval: false,
  },
  {
    key: 'odani',
    label: 'Odani',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'odani',
    summary: 'Odani heritage. Coastal Hunter: raise Wilderness and Ranged Combat to 3.',
    requiresGMApproval: false,
  },
  {
    key: 'urjack',
    label: 'Urjack',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'urjack',
    summary: 'Urjack heritage. Mountain Peoples: raise Athletics and Wilderness to 3.',
    requiresGMApproval: false,
  },
  {
    key: 'alworum-nauroytaira',
    label: 'Alworum Nauroytaira',
    ancestries: ['elves'],
    nativeLanguage: 'hadriaeth',
    summary: 'Elven heritage from the Far-Eastern Grasslands. Native language is Hadriaeth.',
    requiresGMApproval: false,
  },
];

function normalizeLookupKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeLanguageKey(value) {
  return normalizeLookupKey(value);
}

export function normalizeOriginKey(value) {
  return normalizeLookupKey(value);
}

function inferAncestryKey(ancestryName) {
  const normalized = normalizeLookupKey(ancestryName);
  if (normalized === 'humans' || normalized === 'human') return 'humans';
  if (normalized === 'elves' || normalized === 'elf' || normalized === 'elven') return 'elves';
  return normalized;
}

export function getLanguageDefinitions() {
  return LANGUAGE_DEFINITIONS.map((entry) => ({ ...entry }));
}

export function getLanguageLabel(languageKey) {
  const normalized = normalizeLookupKey(languageKey);
  const entry = LANGUAGE_DEFINITIONS.find((candidate) => candidate.key === normalized);
  return entry?.label || String(languageKey || '').trim();
}

export function getOriginDefinitions() {
  return ORIGIN_DEFINITIONS.map((entry) => ({ ...entry, ancestries: [...entry.ancestries] }));
}

export function getOriginDefinition(originKey) {
  const normalized = normalizeLookupKey(originKey);
  const entry = ORIGIN_DEFINITIONS.find((candidate) => candidate.key === normalized);
  return entry ? { ...entry, ancestries: [...entry.ancestries] } : null;
}

export function getOriginLabel(originKey) {
  const normalized = normalizeLookupKey(originKey);
  const entry = ORIGIN_DEFINITIONS.find((candidate) => candidate.key === normalized);
  return entry?.label || String(originKey || '').trim();
}

export function getOriginOptionsForAncestry(ancestryName) {
  const ancestryKey = inferAncestryKey(ancestryName);
  return ORIGIN_DEFINITIONS
    .filter((entry) => !ancestryKey || entry.ancestries.includes(ancestryKey))
    .map((entry) => ({ ...entry, ancestries: [...entry.ancestries] }));
}

export function isOriginValidForAncestry(originKey, ancestryName) {
  const normalized = normalizeLookupKey(originKey);
  if (!normalized) return false;
  return getOriginOptionsForAncestry(ancestryName).some((entry) => entry.key === normalized);
}

export function getNativeLanguageKeyForOrigin(originKey) {
  return getOriginDefinition(originKey)?.nativeLanguage || '';
}

export function doesOriginRequireGMApproval(originKey) {
  return Boolean(getOriginDefinition(originKey)?.requiresGMApproval);
}

export function normalizeActorLanguageData(languageData = {}) {
  const native = normalizeLookupKey(languageData.native);
  const validLanguageKeys = new Set(LANGUAGE_DEFINITIONS.map((entry) => entry.key));
  const selected = Array.isArray(languageData.selected)
    ? languageData.selected
        .map((entry) => normalizeLookupKey(entry))
        .filter((entry, index, collection) => validLanguageKeys.has(entry) && entry !== native && collection.indexOf(entry) === index)
    : [];

  return {
    native: validLanguageKeys.has(native) ? native : '',
    selected,
  };
}

export function buildActorLanguageState(languageData = {}, skillRank = 0) {
  const normalized = normalizeActorLanguageData(languageData);
  const capacity = Math.max(0, Math.floor(Number(skillRank) || 0));
  const selectedKeys = normalized.selected.slice(0, capacity);
  const knownKeys = [normalized.native, ...selectedKeys].filter((entry, index, collection) => entry && collection.indexOf(entry) === index);

  return {
    nativeKey: normalized.native,
    nativeLabel: getLanguageLabel(normalized.native),
    selectedKeys,
    selectedLabels: selectedKeys.map((entry) => getLanguageLabel(entry)),
    knownKeys,
    knownLabels: knownKeys.map((entry) => getLanguageLabel(entry)),
    capacity,
    display: knownKeys.map((entry) => getLanguageLabel(entry)).join(', '),
  };
}