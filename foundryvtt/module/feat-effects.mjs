/**
 * Feat validation and usage handlers for Legends
 */
export function initializeFeatHandlers() {
  // Validate prerequisites before a feat is created on an actor
  Hooks.on('preCreateItem', async (item, options, userId) => {
    try {
      if (!item || item.type !== 'feat') return;
      const actor = item.parent;
      if (!actor || actor.type !== 'character') return;

      const reasons = validatePrereqs(actor, item);
      if (reasons.length > 0) {
        const msg = `Cannot add feat '${item.name}': ${reasons.join('; ')}`;
        ui.notifications.warn(msg);
        throw new Error(msg);
      }
    } catch (err) {
      console.warn('Feat validation error', err);
      throw err;
    }
  });

  // After a feat is created, initialize any limited-use tracking on the actor
  Hooks.on('createItem', async (item, options, userId) => {
    try {
      if (!item || item.type !== 'feat') return;
      const actor = item.parent;
      if (!actor || actor.type !== 'character') return;

      // Normalize possible fields for usage
      const usage = item.system?.usage || item.system?.usageType || {};
      // If the feat declares a `uses` count, store remaining uses on the actor flags
      const uses = item.system?.uses ?? item.system?.usage?.uses ?? null;
      if (typeof uses === 'number' && uses > 0) {
        const flag = actor.getFlag('legends', 'featUses') || {};
        flag[item.id] = { remaining: uses, max: uses };
        await actor.setFlag('legends', 'featUses', flag);
      }
    } catch (err) {
      console.warn('Error initializing feat uses', err);
    }
  });
}

/**
 * Validate prerequisites for a feat item against an actor.
 * Returns an array of human-readable failure reasons (empty if valid).
 */
export function validatePrereqs(actor, item) {
  const reasons = [];
  if (!actor || !item) return reasons;

  const prereqs = item.system?.prerequisites || {};

  // Tier check (flexible: supports numeric tier or nested object)
  const requiredTier = prereqs.tier ?? item.system?.tier ?? prereqs?.minimumTier;
  if (requiredTier) {
    const actorTierValue = actor.system?.tier?.value ?? actor.system?.tier?.xp ?? actor.system?.tier ?? 0;
    if (Number(actorTierValue) < Number(requiredTier)) {
      reasons.push(`Requires Tier ${requiredTier} (actor has ${actorTierValue})`);
    }
  }

  // Attributes (object of attributeName:minimum)
  const attributes = prereqs.attributes || {};
  for (const [attr, req] of Object.entries(attributes)) {
    if (!req) continue;
    const actorAttr = actor.system?.attributes?.[attr]?.value ?? actor.system?.attributes?.[attr];
    if (actorAttr === undefined) {
      reasons.push(`Missing attribute ${attr} on actor`);
      continue;
    }
    if (Number(actorAttr) < Number(req)) {
      reasons.push(`${attr} ${req}+ required (actor has ${actorAttr})`);
    }
  }

  // Skills: support either object map or string "skill:rank, skill2:rank"
  let skillsSpec = prereqs.skills || {};
  if (typeof skillsSpec === 'string') {
    skillsSpec = parseSkillString(skillsSpec);
  }
  if (skillsSpec && typeof skillsSpec === 'object') {
    for (const [skillKey, req] of Object.entries(skillsSpec)) {
      if (!req) continue;
      // Try several common key variants
      const actorSkill = actor.system?.skills?.[skillKey] ?? actor.system?.skills?.[normalizeSkillKey(skillKey)];
      const actorSkillValue = actorSkill?.value ?? actorSkill ?? 0;
      if (Number(actorSkillValue) < Number(req)) {
        reasons.push(`Skill ${skillKey} ${req}+ required (actor has ${actorSkillValue})`);
      }
    }
  }

  // Feat prerequisites: comma-separated names or array
  const featReqs = prereqs.feats || prereqs.traits || prereqs.requiredFeats || [];
  let featArray = featReqs;
  if (typeof featReqs === 'string') {
    featArray = featReqs.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(featArray) && featArray.length > 0) {
    for (const name of featArray) {
      const found = actor.items.find(i => i.name.toLowerCase() === name.toLowerCase());
      if (!found) reasons.push(`Requires feat/trait: ${name}`);
    }
  }

  return reasons;
}

// Expose normalizeSkillKey for other modules if needed
export { normalizeSkillKey };

function parseSkillString(str) {
  const out = {};
  if (!str || typeof str !== 'string') return out;
  const parts = str.split(',');
  for (const p of parts) {
    const pair = p.split(':').map(s => s.trim());
    if (pair.length === 2) {
      out[normalizeSkillKey(pair[0])] = Number(pair[1]) || 0;
    }
  }
  return out;
}

function normalizeSkillKey(key) {
  return key.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
}

/**
 * Compute aggregated modifiers from all feat effects on an actor.
 * Returns an object with structure: { skills: {}, attributes: {}, dr: {slashing, piercing, bludgeoning}, saves: {}, resistances: {}, actions: [], reactions: [] }
 */
export function computeFeatModifiers(actor) {
  const out = {
    skills: {},
    attributes: {},
    dr: { slashing: 0, piercing: 0, bludgeoning: 0 },
    saves: {},
    resistances: {},
    actions: [],
    reactions: [],
    // dice-specific modifiers
    skillDiceModifiers: {},
    attributeDiceModifiers: {}
  };

  if (!actor || !actor.items) return out;

    for (const item of actor.items) {
    if (!item || item.type !== 'feat') continue;
    const effects = item.system?.effects || [];
    for (const eff of effects) {
      const type = eff.type || eff.effectType || 'custom';
      const target = (eff.target || '').toString();
      const rawValue = eff.value;
      const value = parseInt(rawValue, 10);
      const apply = (eff.apply || '').toString().toLowerCase();

      switch (type) {
        case 'skill.modify':
          // Determine whether this modifies rank or dice
          (target.split(',') || ['']).map(t => t.trim()).filter(Boolean).forEach(t => {
            const key = normalizeSkillKey(t);
            if (apply === 'rank') {
              // modify skill ranks (permanent)
              out.skills[key] = (out.skills[key] || 0) + (isNaN(value) ? 0 : value);
            } else {
              // modify dice when rolling: record as dice modifier
              out.skillDiceModifiers[key] = out.skillDiceModifiers[key] || { value: 0, applyToAttr: false, applyToSkill: true };
              // default: apply to skill die (but if 'both' specified, set both)
              if (apply === 'both' || apply === '') {
                out.skillDiceModifiers[key].applyToAttr = true;
                out.skillDiceModifiers[key].applyToSkill = true;
              } else if (apply === 'attr') {
                out.skillDiceModifiers[key].applyToAttr = true;
                out.skillDiceModifiers[key].applyToSkill = false;
              } else if (apply === 'skill') {
                out.skillDiceModifiers[key].applyToAttr = false;
                out.skillDiceModifiers[key].applyToSkill = true;
              }
              out.skillDiceModifiers[key].value += (isNaN(value) ? 0 : value);
            }
          });
          break;
        case 'attribute.modify':
          (target.split(',') || ['']).map(t => t.trim()).filter(Boolean).forEach(t => {
            const key = t.replace(/\s+/g,'').toLowerCase();
            if (apply === 'rank' || apply === 'flat') {
              out.attributes[key] = (out.attributes[key] || 0) + (isNaN(value) ? 0 : value);
            } else {
              // treat as dice modifier applied to attribute die
              out.attributeDiceModifiers[key] = out.attributeDiceModifiers[key] || { value: 0 };
              out.attributeDiceModifiers[key].value += (isNaN(value) ? 0 : value);
            }
          });
          break;
        case 'defense.modify':
          // target could be 'all' or specific type
          if (!target || target === 'all') {
            out.dr.slashing += isNaN(value) ? 0 : value;
            out.dr.piercing += isNaN(value) ? 0 : value;
            out.dr.bludgeoning += isNaN(value) ? 0 : value;
          } else {
            const t = target.toLowerCase();
            if (t.includes('slash')) out.dr.slashing += isNaN(value) ? 0 : value;
            if (t.includes('pierce')) out.dr.piercing += isNaN(value) ? 0 : value;
            if (t.includes('bludge')) out.dr.bludgeoning += isNaN(value) ? 0 : value;
          }
          break;
        case 'resist.add':
          // support numeric resist or 'immune' flag
          if ((eff.apply || '').toString().toLowerCase() === 'immune' || (''+rawValue).toLowerCase().startsWith('immune')) {
            out.resistances[target] = 'immune';
          } else {
            out.resistances[target] = (out.resistances[target] || 0) + (isNaN(value) ? 0 : value);
          }
          break;
        case 'action.add':
          out.actions.push({ name: eff.description || item.name + ' action', config: eff });
          break;
        case 'reaction.add':
          out.reactions.push({ name: eff.description || item.name + ' reaction', config: eff });
          break;
        case 'save.modify':
          // Save modifiers can be either dice modifiers (apply to attr/skill) or flat rank changes
          const saveKey = target.toLowerCase();
          const existing = out.saves[saveKey] || { value: 0, applyToAttr: true, applyToSkill: true };
          if (apply === 'flat' || apply === 'rank') {
            existing.value += (isNaN(value) ? 0 : value);
          } else if (apply === 'attr') {
            existing.value += (isNaN(value) ? 0 : value);
            existing.applyToAttr = true; existing.applyToSkill = false;
          } else if (apply === 'skill') {
            existing.value += (isNaN(value) ? 0 : value);
            existing.applyToAttr = false; existing.applyToSkill = true;
          } else {
            // default: apply to both dice
            existing.value += (isNaN(value) ? 0 : value);
            existing.applyToAttr = true; existing.applyToSkill = true;
          }
          out.saves[saveKey] = existing;
          break;
        default:
          // custom/text effects are ignored for automation but recorded as actions if marked
          if (type === 'custom' && (eff.actionType === 'combat' || eff.actionType === 'reaction')) {
            if (eff.actionType === 'reaction') out.reactions.push({ name: eff.description || item.name, config: eff });
            else out.actions.push({ name: eff.description || item.name, config: eff });
          }
          break;
      }
    }
  }

  return out;
}
