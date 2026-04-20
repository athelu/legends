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
    label: 'The Bellicosian Empire',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'bellikoz',
    summary: 'Characters raised in the Bellicosian Empire typically speak Bellikoz as their native language.',
    requiresGMApproval: false,
  },
  {
    key: 'republic-of-coudassis',
    label: 'The Republic of Coudassis',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'coudassian',
    summary: 'Characters raised in Coudassis typically speak Coudassian as their native language.',
    requiresGMApproval: false,
  },
  {
    key: 'the-echartean-empire',
    label: 'The Echartean Empire',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'echartean',
    summary: 'Characters raised in Echartea typically speak Echartean as their native language. This origin requires GM approval.',
    requiresGMApproval: true,
  },
  {
    key: 'kingdom-of-meresaw',
    label: 'The Kingdom of Meresaw',
    ancestries: ['humans', 'elves'],
    nativeLanguage: 'meresagian',
    summary: 'Characters raised in Meresaw typically speak Meresagian as their native language.',
    requiresGMApproval: false,
  },
  {
    key: 'odani',
    label: 'Odani Communities',
    ancestries: ['humans'],
    nativeLanguage: 'odani',
    summary: 'Humans raised among the Odani typically speak Odani as their native language.',
    requiresGMApproval: false,
  },
  {
    key: 'urjack',
    label: 'Urjack Highlands',
    ancestries: ['humans'],
    nativeLanguage: 'urjack',
    summary: 'Humans raised in the Urjack highlands typically speak Urjack as their native language.',
    requiresGMApproval: false,
  },
  {
    key: 'alworum-nauroytaira',
    label: 'Alworum Nauroytaira',
    ancestries: ['elves'],
    nativeLanguage: 'hadriaeth',
    summary: 'Elves raised in the Far-Eastern Grasslands typically speak Hadriaeth as their native language.',
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
  if (normalized === 'elves' || normalized === 'elf') return 'elves';
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