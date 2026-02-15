/**
 * Legends D8 TTRPG Custom TextEditor Enrichers
 *
 * Provides inline roll syntax for item descriptions and journal entries:
 *   [[/check skill=acrobatics]]       → clickable Acrobatics Check link
 *   [[/save type=fortitude]]          → clickable Fortitude Save link
 *   [[/damage 6 type=slashing]]       → styled damage display
 *   [[/check skill=athletics]]{Climb} → custom label "Climb"
 */

/* -------------------------------------------- */
/*  Skill / Save display-name maps              */
/* -------------------------------------------- */

const SKILL_LABELS = {
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
  investigate: "Investigation",
  language: "Language",
  history: "History",
  arcane: "Arcana",
  society: "Society",
  perception: "Perception",
  survival: "Survival",
  persuasion: "Persuasion",
  deception: "Deception",
  intimidate: "Intimidation",
  perform: "Performance",
  insight: "Insight",
  medicine: "Medicine",
  animalHandling: "Animal Handling"
};

const SAVE_LABELS = {
  fortitude: "Fortitude",
  reflex: "Reflex",
  will: "Will"
};

/* -------------------------------------------- */
/*  Config parser                               */
/* -------------------------------------------- */

/**
 * Parse a config string like " skill=acrobatics" or " 6 type=slashing"
 * into { skill: "acrobatics" } or { _values: ["6"], type: "slashing" }.
 */
function parseConfig(str) {
  const config = { _values: [] };
  if (!str) return config;
  const tokens = str.trim().split(/\s+/);
  for (const token of tokens) {
    const eq = token.indexOf("=");
    if (eq > 0) {
      config[token.slice(0, eq)] = token.slice(eq + 1);
    } else {
      config._values.push(token);
    }
  }
  return config;
}

/* -------------------------------------------- */
/*  Enricher dispatcher                         */
/* -------------------------------------------- */

async function enrichString(match, options) {
  const { type, config: configStr, label } = match.groups;
  const config = parseConfig(configStr);

  switch (type.toLowerCase()) {
    case "check": return enrichCheck(config, label);
    case "save":  return enrichSave(config, label);
    case "damage": return enrichDamage(config, label);
  }
  return null;
}

/* -------------------------------------------- */
/*  Individual enrichers                        */
/* -------------------------------------------- */

function enrichCheck(config, label) {
  const skill = config.skill || config._values[0] || "";
  if (!skill) return null;

  const displayName = label || `${SKILL_LABELS[skill] || skill} Check`;

  const a = document.createElement("a");
  a.classList.add("legends-roll-link");
  a.dataset.action = "check";
  a.dataset.skill = skill;
  a.innerHTML = `<i class="fas fa-dice-d8"></i> ${displayName}`;
  return a;
}

function enrichSave(config, label) {
  const saveType = config.type || config._values[0] || "";
  if (!saveType) return null;

  const displayName = label || `${SAVE_LABELS[saveType] || saveType} Save`;

  const a = document.createElement("a");
  a.classList.add("legends-roll-link");
  a.dataset.action = "save";
  a.dataset.save = saveType;
  a.innerHTML = `<i class="fas fa-shield-alt"></i> ${displayName}`;
  return a;
}

function enrichDamage(config, label) {
  const amount = config._values[0] || "";
  const dmgType = config.type || "";
  const displayName = label || [amount, dmgType].filter(Boolean).join(" ");

  const span = document.createElement("span");
  span.classList.add("legends-damage-tag");
  span.innerHTML = `<i class="fas fa-burst"></i> ${displayName}`;
  return span;
}

/* -------------------------------------------- */
/*  Click handler                               */
/* -------------------------------------------- */

function _onClickRollLink(event) {
  const link = event.target.closest("a.legends-roll-link");
  if (!link) return;

  event.preventDefault();
  event.stopPropagation();

  // Resolve actor: selected token first, then assigned character
  const actor = canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character;
  if (!actor) {
    ui.notifications.warn("Select a token or assign a character to roll.");
    return;
  }

  const action = link.dataset.action;
  if (action === "check") {
    game.legends.rollSkillCheck(actor, link.dataset.skill);
  } else if (action === "save") {
    game.legends.rollSavingThrow(actor, link.dataset.save);
  }
}

/* -------------------------------------------- */
/*  Registration                                */
/* -------------------------------------------- */

export function registerEnrichers() {
  CONFIG.TextEditor.enrichers.push({
    pattern: /\[\[\/(?<type>check|save|damage)(?<config>[^\]]*)\]\](?:\{(?<label>[^}]+)\})?/gi,
    enricher: enrichString
  });

  document.addEventListener("click", _onClickRollLink);
}
