import { SKILL_LABELS } from './skill-utils.mjs';

export const MASTERY_KEYS = ['earth', 'air', 'fire', 'water', 'positive', 'negative', 'time', 'space'];

export const MASTERY_LABELS = {
  earth: 'Earth Mastery',
  air: 'Air Mastery',
  fire: 'Fire Mastery',
  water: 'Water Mastery',
  positive: 'Positive Mastery',
  negative: 'Negative Mastery',
  time: 'Time Mastery',
  space: 'Space Mastery'
};

function normalizeBoolean(value) {
  return Boolean(value);
}

export function getDefaultTrainingState() {
  const skills = {};
  for (const key of Object.keys(SKILL_LABELS)) {
    skills[key] = false;
  }

  const mastery = {};
  for (const key of MASTERY_KEYS) {
    mastery[key] = false;
  }

  return { skills, mastery };
}

export function normalizeTrainingState(trainingState = {}) {
  const normalized = getDefaultTrainingState();
  const inputSkills = trainingState?.skills || {};
  const inputMastery = trainingState?.mastery || {};

  for (const key of Object.keys(normalized.skills)) {
    normalized.skills[key] = normalizeBoolean(inputSkills[key]);
  }

  for (const key of Object.keys(normalized.mastery)) {
    normalized.mastery[key] = normalizeBoolean(inputMastery[key]);
  }

  return normalized;
}

export function getTrainingState(actor) {
  return normalizeTrainingState(actor?.system?.training);
}

export function hasSkillCheckbox(actor, skillKey) {
  const state = getTrainingState(actor);
  return Boolean(state.skills[skillKey]);
}

export function hasMasteryCheckbox(actor, masteryKey) {
  const state = getTrainingState(actor);
  return Boolean(state.mastery[masteryKey]);
}

function getTrainingPath(type, key) {
  if (type === 'skill') return `system.training.skills.${key}`;
  if (type === 'mastery') return `system.training.mastery.${key}`;
  return '';
}

export async function setTrainingCheckbox(actor, type, key, checked, { notify = false, source = 'manual' } = {}) {
  if (!actor || !key) return null;

  const path = getTrainingPath(type, key);
  if (!path) return null;

  const value = normalizeBoolean(checked);
  await actor.update({ [path]: value });

  if (notify) {
    const label = type === 'mastery' ? (MASTERY_LABELS[key] || key) : (SKILL_LABELS[key] || key);
    ui.notifications.info(`${label} checkbox ${value ? 'marked' : 'cleared'} for ${actor.name}.`);
  }

  return { actor, type, key, checked: value, source };
}

export async function markTrainingCheckbox(actor, type, key, options = {}) {
  if (!actor || !key) return null;

  const alreadyChecked = type === 'mastery'
    ? hasMasteryCheckbox(actor, key)
    : hasSkillCheckbox(actor, key);

  if (alreadyChecked) {
    return { actor, type, key, checked: true, skipped: true };
  }

  return setTrainingCheckbox(actor, type, key, true, options);
}

export async function clearTrainingCheckbox(actor, type, key, options = {}) {
  return setTrainingCheckbox(actor, type, key, false, options);
}

export async function clearSkillCheckbox(actor, skillKey, options = {}) {
  return clearTrainingCheckbox(actor, 'skill', skillKey, options);
}

export async function clearMasteryCheckbox(actor, masteryKey, options = {}) {
  return clearTrainingCheckbox(actor, 'mastery', masteryKey, options);
}

export async function toggleTrainingCheckbox(actor, type, key, options = {}) {
  if (!actor || !key) return null;

  const checked = type === 'mastery'
    ? hasMasteryCheckbox(actor, key)
    : hasSkillCheckbox(actor, key);

  return setTrainingCheckbox(actor, type, key, !checked, options);
}