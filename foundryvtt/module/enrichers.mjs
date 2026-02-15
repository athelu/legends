/**
 * Legends D8 TTRPG Custom TextEditor Enrichers
 *
 * Provides inline syntax for item descriptions and journal entries:
 *   [[/check skill=acrobatics]]        → clickable Acrobatics Check link
 *   [[/save type=fortitude]]           → clickable Fortitude Save link
 *   [[/damage 6 type=slashing]]        → styled damage display
 *   [[/effect name=haste]]             → draggable effect element
 *   [[/check skill=athletics]]{Climb}  → custom label "Climb"
 *   [[/effect name=dr-bonus value=2]]{+2 DR} → effect with params and label
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
    case "effect": return enrichEffect(config, label);
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

function enrichEffect(config, label) {
  const effectId = config.name || config.id || config._values[0] || "";
  if (!effectId) return null;

  const displayName = label || effectId;
  
  // Extract params (anything that's not 'name' or 'id')
  const params = {};
  for (const [key, value] of Object.entries(config)) {
    if (key !== 'name' && key !== 'id' && key !== '_values') {
      params[key] = value;
    }
  }

  const div = document.createElement("div");
  div.classList.add("draggable-effect", "inline-effect");
  div.draggable = true;
  div.dataset.effectId = effectId;
  div.dataset.params = JSON.stringify(params);
  div.innerHTML = `<i class="fas fa-magic"></i> <span>${displayName}</span> <em class="drag-hint">(drag to actor)</em>`;
  
  return div;
}

/* -------------------------------------------- */
/*  Drag handler for inline effects             */
/* -------------------------------------------- */

function _onDragStartInlineEffect(event) {
  const effectEl = event.target.closest("div.inline-effect[draggable]");
  if (!effectEl) return;
  
  const effectId = effectEl.dataset.effectId;
  const params = JSON.parse(effectEl.dataset.params || '{}');
  
  // For inline effects, we don't have a specific caster/weave
  // They're generic effect references that can be applied
  const dragData = {
    type: 'InlineEffect',
    effectId: effectId,
    params: params
  };
  
  event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
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
    pattern: /\[\[\/(?<type>check|save|damage|effect)(?<config>[^\]]*)\]\](?:\{(?<label>[^}]+)\})?/gi,
    enricher: enrichString
  });

  document.addEventListener("click", _onClickRollLink);
  document.addEventListener("dragstart", _onDragStartInlineEffect);
}
