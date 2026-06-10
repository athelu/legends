import { normalizeSkillKey } from './skill-utils.mjs';

const ENERGY_KEYS = new Set(['fire', 'water', 'earth', 'air', 'positive', 'negative', 'time', 'space']);

// ─────────────────────────────────────────────────────────────────────────────
// FEAT EFFECT TYPE CATALOG
//
// Each feat's system.effects array contains objects with these supported shapes:
//
//   roll.modifier
//     Adds a modifier to dice for a specific roll type. In the roll-under d8
//     system, negative values subtract from dice (easier), positive adds (harder).
//     { type, rollType, saveType?, skillKey?, value, applyTo, when? }
//     rollType: "attack" | "defense" | "save" | "skill" | "initiative" | "weaving" | "targeting"
//     applyTo:  "both" | "attr" | "skill"
//     value:    number  (-1 = subtract 1 from die = easier; +1 = add = harder)
//
//   fortune.grant
//     Grants Fortune (roll 3d8, take best 2) on a specific roll type.
//     { type, rollType, saveType?, skillKey?, when? }
//
//   misfortune.grant
//     Grants Misfortune (roll 3d8, take worst 2) on a specific roll type.
//     { type, rollType, saveType?, skillKey?, when? }
//
//   initiative.modify
//     Flat bonus to initiative order value.
//     { type, value, when? }
//
//   hp.bonus
//     Flat or formula-based bonus to maximum HP. Formula may use attribute names and `tier`.
//     { type, value?, formula?, when? }
//     Example: { type: "hp.bonus", formula: "constitution * tier" }  (Tough)
//
//   hp.shortRest.bonus
//     Extra HP recovered during a short rest.
//     { type, value?, formula?, when? }
//     Example: { type: "hp.shortRest.bonus", formula: "constitution" }  (Fast Healer)
//
//   damage.bonus
//     Flat bonus to damage dealt. Target scopes what attacks it applies to.
//     { type, value, target?, when? }
//     target: "all" | "melee" | "ranged" | "unarmed"  (default "all")
//
//   dr.modify
//     Adds flat or formula-based DR. damageTypes scopes which physical types benefit.
//     { type, value?, formula?, damageTypes?, when? }
//     damageTypes: "all" | "physical" | "slashing" | "piercing" | "bludgeoning"  (default "all")
//     Example: { type: "dr.modify", formula: "wisdom", when: "unarmoredNoShield" }  (Mystic Defense)
//
//   condition.immunity
//     Grants immunity to one or more conditions, optionally conditional.
//     { type, conditionName, when? }
//     conditionName: string or string[]
//
//   toggle.state
//     Defines a toggleable combat state (e.g. Primal Fury, Defensive Stance).
//     The state key is stored in actor.flags.legends.toggleStates.<stateKey>.
//     Nested effects are only active while the toggle is on.
//     { type, stateKey, label, onExit?: string, effects: [...nested effect objects] }
//     onExit: key into TOGGLE_EXIT_HOOKS — called when the toggle is turned off.
//             Currently supported: "fortitudeExhaustionCheck" (Primal Fury exit save)
//
//   skill.modify    (existing)
//     { type, target, value, apply: "rank"|"dice"|"both"|"attr"|"skill" }
//
//   attribute.modify (existing)
//     { type, target, value, apply: "rank"|"flat"|"dice" }
//
//   defense.modify  (existing, kept for compatibility)
//     { type, target, value }
//
//   save.modify     (existing, kept for compatibility)
//     { type, target, value, apply: "both"|"attr"|"skill"|"flat" }
//
//   resist.add      (existing)
//     { type, target, value|"immune", apply? }
//
//   action.add      (existing)
//     { type, description, actionType?: "combat"|"reaction" }
//
//   reaction.add    (existing)
//     { type, description }
//
//   custom          (existing — narrative only, not automated)
//     { type, description, actionType? }
//
// ─── CONDITION STRINGS (used in the `when` field) ───────────────────────────
//   "unarmored"          — no armor item is equipped
//   "noShield"           — no shield is equipped
//   "shieldEquipped"     — a shield is equipped
//   "unarmoredNoShield"  — no armor AND no shield (for DR feats like Mystic Defense)
//   "oneHandFree"        — one melee weapon, off-hand empty (no shield/second weapon)
//   "twoHandedWeapon"    — a two-handed weapon is equipped
//   "dualWielding"       — two weapons equipped
//   "belowHalfHP"        — current HP < max HP / 2
//   "primalFury"         — toggle state primalFury is active
//   "defensiveStance"    — toggle state defensiveStance is active
//   "recklessAttack"     — toggle state recklessAttack is active
//   "flowingGuard"       — toggle state flowingGuard is active
//   "elementalMantle"    — toggle state elementalMantle is active
//   "elementalBody"      — toggle state elementalBody is active
//   "hasFeat:<Name>"     — actor owns a feat with the given name
//   Conditions can be AND-combined: "unarmored,noShield"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Condition evaluators keyed by condition name used in `when` fields.
 * Each returns a boolean indicating whether the condition is met for the actor.
 */
const CONDITION_EVALUATORS = {
  unarmored: (actor) => !actor.items.some(i => i.type === 'armor' && i.system?.equipped),
  noShield: (actor) => !actor.items.some(i => i.type === 'shield' && i.system?.equipped),
  shieldEquipped: (actor) => actor.items.some(i => i.type === 'shield' && i.system?.equipped),
  unarmoredNoShield: (actor) =>
    !actor.items.some(i => (i.type === 'armor' || i.type === 'shield') && i.system?.equipped),
  oneHandFree: (actor) => {
    // One melee weapon equipped, off-hand free (no shield, no second weapon, not two-handed).
    // Ranged weapons (property "ranged") don't count — use a ranged-specific condition if needed.
    const equipped = actor.items.filter(i => i.system?.equipped);
    const meleeWeapons = equipped.filter(i =>
      i.type === 'weapon' &&
      !i.system?.properties?.includes('two-handed') &&
      !i.system?.properties?.includes('ranged')
    );
    const shields = equipped.filter(i => i.type === 'shield');
    return meleeWeapons.length === 1 && shields.length === 0;
  },
  // Alias used by Precision Duelist and similar feats — semantically identical to oneHandFree.
  duelistStance: (actor) => {
    const equipped = actor.items.filter(i => i.system?.equipped);
    const meleeWeapons = equipped.filter(i =>
      i.type === 'weapon' &&
      !i.system?.properties?.includes('two-handed') &&
      !i.system?.properties?.includes('ranged')
    );
    const shields = equipped.filter(i => i.type === 'shield');
    return meleeWeapons.length === 1 && shields.length === 0;
  },
  twoHandedWeapon: (actor) =>
    actor.items.some(i => i.type === 'weapon' && i.system?.equipped &&
      i.system?.properties?.includes('two-handed')),
  dualWielding: (actor) =>
    actor.items.filter(i => i.type === 'weapon' && i.system?.equipped).length >= 2,
  belowHalfHP: (actor) => {
    const hp = actor.system?.hp;
    return hp ? (hp.value ?? 0) < Math.floor((hp.max ?? 1) / 2) : false;
  },
  primalFury:      (actor) => Boolean(actor.flags?.legends?.toggleStates?.primalFury),
  defensiveStance: (actor) => Boolean(actor.flags?.legends?.toggleStates?.defensiveStance),
  recklessAttack:  (actor) => Boolean(actor.flags?.legends?.toggleStates?.recklessAttack),
  flowingGuard:    (actor) => Boolean(actor.flags?.legends?.toggleStates?.flowingGuard),
  elementalMantle: (actor) => Boolean(actor.flags?.legends?.toggleStates?.elementalMantle),
  elementalBody:   (actor) => Boolean(actor.flags?.legends?.toggleStates?.elementalBody),
};

/**
 * Evaluate a `when` condition string against an actor.
 * Multiple conditions can be AND-joined with commas: "unarmored,noShield"
 * @param {Actor} actor
 * @param {string} when - Condition key or comma-separated list
 * @param {Object} [rollContext] - Optional runtime context (e.g. { flanking, isRanged })
 * @returns {boolean}
 */
export function evaluateFeatCondition(actor, when, rollContext = {}) {
  if (!when) return true;
  const parts = String(when).split(',').map(s => s.trim()).filter(Boolean);
  return parts.every(cond => {
    if (CONDITION_EVALUATORS[cond]) return CONDITION_EVALUATORS[cond](actor);
    if (cond === 'flanking') return Boolean(rollContext.flanking);
    if (cond === 'ranged')   return Boolean(rollContext.isRanged);
    if (cond.startsWith('hasFeat:')) return hasFeat(actor, cond.slice('hasFeat:'.length).trim());
    console.warn(`Legends | evaluateFeatCondition: unknown condition "${cond}"`);
    return true; // unknown → permissive
  });
}

/**
 * Check whether an actor owns a feat with the given name (case-insensitive).
 * @param {Actor} actor
 * @param {string} featName
 * @returns {boolean}
 */
export function hasFeat(actor, featName) {
  if (!actor || !featName) return false;
  const lower = featName.toLowerCase().trim();
  return actor.items.some(i => i.type === 'feat' && i.name.toLowerCase().trim() === lower);
}

/**
 * Return the current toggle-state map for an actor.
 * Keys are stateKey strings (e.g. "primalFury"); values are booleans.
 * @param {Actor} actor
 * @returns {Object}
 */
export function computeToggleStates(actor) {
  return actor?.flags?.legends?.toggleStates ?? {};
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE EXIT HOOKS
//
// When setToggleState(actor, stateKey, false) is called, any handler registered
// here under the matching stateKey is invoked AFTER the flag is cleared.
// Each handler: async (actor) => void
// ─────────────────────────────────────────────────────────────────────────────

const EXHAUSTION_CHAIN = ['Fatigued', 'Exhausted', 'Severely Exhausted', 'Near Collapse', 'Collapse'];

/**
 * On-exit hook for Primal Fury.
 * Prompts a Fortitude save and applies/removes Exhaustion based on successes:
 *   0 successes → gain 1 Exhaustion level
 *   1 success   → no change
 *   2 successes → remove 1 Exhaustion level (if any)
 */
async function _onExitPrimalFury(actor) {
  // Roll Fortitude save via the live game API (avoids circular import).
  const result = await game.legends?.rollSavingThrow?.(actor, 'fortitude', {
    flavor: 'Exiting Primal Fury — Fortitude save',
  });
  if (!result) return; // dialog cancelled

  const successes = result.successes ?? 0;

  if (successes === 0) {
    // Gain 1 Exhaustion level
    const conditionNames = new Set(
      (actor.items ?? []).filter(i => i.type === 'condition').map(i => i.name)
    );
    const currentIndex = [...EXHAUSTION_CHAIN].reverse()
      .map(n => EXHAUSTION_CHAIN.indexOf(n))
      .find(idx => conditionNames.has(EXHAUSTION_CHAIN[idx])) ?? -1;
    const nextCondition = EXHAUSTION_CHAIN[currentIndex + 1];
    if (nextCondition) {
      await game.legends?.applyCondition?.(actor, nextCondition, { source: 'primal-fury-exit' });
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<p><strong>${actor.name}</strong> gains <em>${nextCondition}</em> from exiting Primal Fury.</p>`,
      });
    }
  } else if (successes >= 2) {
    // Remove 1 Exhaustion level
    const conditionNames = new Set(
      (actor.items ?? []).filter(i => i.type === 'condition').map(i => i.name)
    );
    const currentCondition = [...EXHAUSTION_CHAIN].reverse()
      .find(n => conditionNames.has(n));
    if (currentCondition) {
      await game.legends?.removeCondition?.(actor, currentCondition);
      const currentIndex = EXHAUSTION_CHAIN.indexOf(currentCondition);
      const newCondition = currentIndex > 0 ? EXHAUSTION_CHAIN[currentIndex - 1] : null;
      if (newCondition) {
        await game.legends?.applyCondition?.(actor, newCondition, { source: 'primal-fury-exit-recovery' });
      }
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<p><strong>${actor.name}</strong> recovers from Primal Fury — ${currentCondition} ${newCondition ? `downgraded to ${newCondition}` : 'removed'}.</p>`,
      });
    }
  }
  // 1 success: no exhaustion change, no message needed
}

/** Registry of onExit hook keys → handler functions. */
const TOGGLE_EXIT_HOOKS = {
  fortitudeExhaustionCheck: _onExitPrimalFury,
};

/**
 * Activate or deactivate a named toggle state on an actor.
 * If deactivating, checks the actor's feat items for a toggle.state effect with
 * a matching stateKey and invokes its onExit hook if one is registered.
 * @param {Actor} actor
 * @param {string} stateKey
 * @param {boolean} active
 * @returns {Promise<void>}
 */
export async function setToggleState(actor, stateKey, active) {
  if (!actor || !stateKey) return;
  await actor.update({ [`flags.legends.toggleStates.${stateKey}`]: Boolean(active) });

  if (!active) {
    // Find the toggle.state effect for this key to read its onExit value.
    for (const item of actor.items ?? []) {
      if (item.type !== 'feat') continue;
      const effects = item.system?.effects ?? [];
      const toggleEff = effects.find(e => e.type === 'toggle.state' && e.stateKey === stateKey);
      if (!toggleEff?.onExit) continue;
      const hook = TOGGLE_EXIT_HOOKS[toggleEff.onExit];
      if (hook) await hook(actor);
      break;
    }
  }
}

/**
 * Evaluate a simple formula string against actor attributes.
 * Supported tokens: attribute names (e.g. "constitution", "wisdom"), "tier".
 * Arithmetic operators + - * / floor() ceil() are supported.
 * @param {string} formula
 * @param {Actor} actor
 * @returns {number}
 */
function evaluateFeatFormula(formula, actor) {
  if (!formula) return 0;
  const attrs = actor.system?.attributes ?? {};
  const tier = Number(actor.system?.tier?.value ?? actor.system?.tier ?? 1);
  let expr = String(formula).toLowerCase();
  for (const [key, val] of Object.entries(attrs)) {
    const v = Number(val?.value ?? val ?? 0);
    expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(v));
  }
  expr = expr.replace(/\btier\b/g, String(tier));
  try {
    // eslint-disable-next-line no-new-func
    return Math.max(0, Number(new Function(`return ${expr}`)()) || 0);
  } catch {
    console.warn(`Legends | evaluateFeatFormula: could not evaluate "${formula}"`);
    return 0;
  }
}

/**
 * Check whether a roll.modifier / fortune.grant effect applies to the given roll context.
 * @param {Object} eff - Effect descriptor
 * @param {string} rollType - e.g. "attack", "save"
 * @param {string} saveType - e.g. "fortitude", "reflex", "will"
 * @param {string} skillKey - normalized skill key
 * @returns {boolean}
 */
function rollTypeMatches(eff, rollType, saveType, skillKey) {
  const effRollType = String(eff.rollType || '');
  if (!effRollType || effRollType === 'all') return true;
  if (effRollType !== rollType) return false;
  if (rollType === 'save' && eff.saveType && saveType) {
    if (String(eff.saveType).toLowerCase() !== saveType.toLowerCase()) return false;
  }
  if ((rollType === 'skill' || rollType === 'attack') && eff.skillKey && skillKey) {
    if (String(eff.skillKey).toLowerCase() !== normalizeSkillKey(skillKey)?.toLowerCase()) return false;
  }
  return true;
}

/**
 * Process a single nested effect inside a toggle.state block, accumulating results
 * into the computeFeatModifiers output object.
 * @param {Actor} actor
 * @param {Object} eff - Nested effect descriptor
 * @param {Object} out - Output accumulator (mutated in place)
 */
function processToggleSubEffect(actor, eff, out) {
  const type = String(eff.type || '');
  if (!type) return;
  if (eff.when && !evaluateFeatCondition(actor, eff.when)) return;
  const rawValue = eff.value;
  const value = parseInt(rawValue, 10);

  switch (type) {
    case 'damage.bonus': {
      const dmgKey = String(eff.target || 'all');
      out.damage[dmgKey] = (out.damage[dmgKey] || 0) + (isNaN(value) ? 0 : value);
      if (eff.formula) out.damage[dmgKey] += evaluateFeatFormula(eff.formula, actor);
      break;
    }
    case 'dr.modify': {
      const flat = isNaN(value) ? 0 : value;
      const formulaVal = eff.formula ? evaluateFeatFormula(eff.formula, actor) : 0;
      const total = flat + formulaVal;
      const dmgTypes = String(eff.damageTypes || 'all').toLowerCase();
      if (dmgTypes === 'all' || dmgTypes === 'physical' || dmgTypes.includes('slash')) out.dr.slashing += total;
      if (dmgTypes === 'all' || dmgTypes === 'physical' || dmgTypes.includes('pierc')) out.dr.piercing += total;
      if (dmgTypes === 'all' || dmgTypes === 'physical' || dmgTypes.includes('bludge')) out.dr.bludgeoning += total;
      break;
    }
    case 'condition.immunity': {
      const names = Array.isArray(eff.conditionName) ? eff.conditionName : [eff.conditionName];
      out.conditionImmunities.push(...names.filter(Boolean));
      break;
    }
    case 'initiative.modify':
      out.initiative += isNaN(value) ? 0 : value;
      break;
    // roll.modifier / fortune.grant inside toggle states are picked up at roll-time via getFeatRollModifiers
    default:
      break;
  }
}

/**
 * Gather accumulated roll modifiers that feat effects apply to a specific dice roll.
 * Call this just before opening a roll dialog to pre-populate modifier/fortune values.
 *
 * @param {Actor} actor
 * @param {Object} rollContext
 * @param {string}  rollContext.rollType    - "attack"|"defense"|"save"|"skill"|"initiative"|"weaving"|"targeting"
 * @param {string}  [rollContext.saveType]  - "fortitude"|"reflex"|"will"
 * @param {string}  [rollContext.skillKey]  - normalized skill key
 * @param {boolean} [rollContext.flanking]  - ally within 5 ft of target
 * @param {boolean} [rollContext.isRanged]  - ranged attack
 * @returns {{ attrModifier: number, skillModifier: number, fortune: number, misfortune: number, sources: string[] }}
 */
export function getFeatRollModifiers(actor, rollContext = {}) {
  const { rollType = '', saveType = '', skillKey = '', flanking = false, isRanged = false } = rollContext;
  const ctx = { flanking, isRanged };
  const result = { attrModifier: 0, skillModifier: 0, fortune: 0, misfortune: 0, sources: [] };
  if (!actor || !actor.items) return result;

  const processEff = (eff, sourceName) => {
    const type = String(eff.type || '');
    if (!type) return;
    if (eff.when && !evaluateFeatCondition(actor, eff.when, ctx)) return;

    if (type === 'roll.modifier') {
      if (!rollTypeMatches(eff, rollType, saveType, skillKey)) return;
      const val = Number(eff.value) || 0;
      if (val === 0) return;
      const applyTo = String(eff.applyTo || 'both').toLowerCase();
      if (applyTo === 'both' || applyTo === 'attr')  result.attrModifier  += val;
      if (applyTo === 'both' || applyTo === 'skill') result.skillModifier += val;
      result.sources.push(`${sourceName} (${val > 0 ? '+' : ''}${val} to ${applyTo === 'both' ? 'both dice' : applyTo + ' die'})`);
      return;
    }
    if (type === 'fortune.grant') {
      if (!rollTypeMatches(eff, rollType, saveType, skillKey)) return;
      result.fortune++;
      result.sources.push(`${sourceName} (Fortune)`);
      return;
    }
    if (type === 'misfortune.grant') {
      if (!rollTypeMatches(eff, rollType, saveType, skillKey)) return;
      result.misfortune++;
      result.sources.push(`${sourceName} (Misfortune)`);
      return;
    }
  };

  for (const item of actor.items) {
    if (!item || item.type !== 'feat') continue;
    const effects = Array.isArray(item.system?.effects) ? item.system.effects : [];
    for (const eff of effects) {
      processEff(eff, item.name);
      // Process nested effects inside active toggle states
      if (String(eff.type || '') === 'toggle.state') {
        const active = Boolean(actor.flags?.legends?.toggleStates?.[eff.stateKey]);
        if (active) {
          for (const subEff of (eff.effects || [])) processEff(subEff, `${item.name} (active)`);
        }
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// ON-HIT FEAT EFFECTS (Category 5)
//
// Maps feat name → button descriptor for the post-attack combat result card.
//
// action types:
//   'apply'       — directly apply `condition` to the target
//   'choice'      — player picks from `choices[]`, then applyCondition is called
//   'save'        — target makes `saveType` save; on 0 successes apply `condition`
//   'eldritch'    — set eldritchStrike flag on target (next weave −1 save die)
//   'dr-reduce'   — apply a DR-reduction flag to target for rest of combat/attack
//   'damage'      — post a bonus-damage prompt (Dual Strike)
//   'free-attack' — post a reminder that a free attack is available (Momentum Strike)
//
// requires (optional):
//   'twoHanded'        — attacker must have a two-handed weapon equipped
//   'dualWielding'     — attacker must have two weapons equipped
//   'hasFeat:<name>'   — attacker must own the named feat
//
// minMargin (optional): minimum attack margin for the button to appear (default 1)
// ─────────────────────────────────────────────────────────────────────────────

const ON_HIT_FEAT_EFFECTS = {
  'Setup Strike': {
    icon: 'fas fa-crosshairs',
    action: 'choice',
    choices: ['Slowed (Minor)', 'Disoriented'],
    note: '1/turn',
  },
  'Tripping Strike': {
    icon: 'fas fa-person-falling',
    action: 'save',
    saveType: 'reflex',
    condition: 'Prone',
    note: '1/turn',
  },
  'Disarming Technique': {
    icon: 'fas fa-hand-sparkles',
    action: 'save',
    saveType: 'fortitude',
    condition: 'Disarmed',   // narrative — no pack entry; posts chat message
    note: '1/turn — save or drop held item',
  },
  'Stunning Strike': {
    icon: 'fas fa-stars',
    action: 'save',
    saveType: 'will',
    condition: 'Stunned',
    note: 'after hitting same target 2+ times this turn',
  },
  'Sharpshooter': {
    icon: 'fas fa-bullseye',
    action: 'save',
    saveType: 'fortitude',
    condition: 'Slowed (Minor)',
    note: 'declared before roll — speed halved on failed save',
  },
  'Crippling Strike': {
    icon: 'fas fa-person-walking-arrow-right',
    action: 'apply',
    condition: 'Slowed (Minor)',
    note: 'if Exploit Weakness triggered',
  },
  'Death by a Thousand Cuts': {
    icon: 'fas fa-droplet',
    action: 'apply',
    condition: 'Bleeding',
    note: 'if Exploit Weakness triggered',
  },
  'Debilitating Strike': {
    icon: 'fas fa-arrow-down',
    action: 'apply',
    condition: 'Weakened',   // closest analogue: Weakened adds 1 to attack dice
    note: 'if Exploit Weakness triggered (target attack dice +1)',
  },
  'Bleeding Edge': {
    icon: 'fas fa-droplet',
    action: 'apply',
    condition: 'Bleeding',
    note: 'if Exposed Strike triggered',
  },
  'Bleeding Flurry': {
    icon: 'fas fa-droplet',
    action: 'apply',
    condition: 'Bleeding',
    requires: 'hasFeat:Dual Strike',
    note: 'if Dual Strike triggered',
  },
  'Dual Strike': {
    icon: 'fas fa-swords',
    action: 'damage',
    requires: 'dualWielding',
    note: 'if both TWF attacks hit — bonus Str damage',
  },
  'Weapon Momentum': {
    icon: 'fas fa-rotate',
    action: 'choice',
    choices: ['Slowed (Minor)', 'Disoriented'],
    requires: 'dualWielding',
    note: 'if both TWF attacks hit',
  },
  'Eldritch Strike': {
    icon: 'fas fa-wand-sparkles',
    action: 'eldritch',
    note: 'next weave vs this target: −1 to save dice',
  },
  'Crushing Advance': {
    icon: 'fas fa-shield-halved',
    action: 'dr-reduce',
    value: 2,
    requires: 'twoHanded',
    persistent: false,
    note: 'DR −2 for this attack',
  },
  'Shattering Blow': {
    icon: 'fas fa-shield-halved',
    action: 'dr-reduce',
    value: 4,
    requires: 'twoHanded',
    minMargin: 2,
    persistent: true,
    note: '1/short rest — DR −4 rest of combat',
  },
  'Momentum Strike': {
    icon: 'fas fa-person-running',
    action: 'free-attack',
    note: 'after killing blow — free attack on adjacent creature',
  },
  'Decisive Strike': {
    icon: 'fas fa-bolt',
    action: 'choice',
    choices: ['Slowed (Minor)', 'Disoriented', 'Prone', 'Frightened', 'Blinded'],
    requires: 'hasFeat:Precision Training',
    note: 'if Precision Training triggered',
  },
};

/**
 * Return button descriptor objects for all on-hit feat effects the attacker qualifies for.
 * Called in calculateDamage when the net margin is >= 1.
 *
 * @param {Actor} actor - The attacking actor
 * @param {Object} hitContext
 * @param {number}  hitContext.margin        - Net attack margin (>= 1 means a hit)
 * @param {string}  hitContext.targetId      - Defender actor ID
 * @param {Object}  [hitContext.attackMode]  - Attack mode object from the weapon dialog
 * @param {Object}  [hitContext.weapon]      - The weapon item used
 * @returns {Array<Object>} Array of button descriptor objects (may be empty)
 */
export function getOnHitButtons(actor, { margin = 0, targetId, attackMode, weapon } = {}) {
  if (margin < 1 || !actor || !targetId) return [];

  const isTwoHanded = weapon?.system?.properties?.includes('two-handed') ??
    actor.items.some(i => i.type === 'weapon' && i.system?.equipped &&
      i.system?.properties?.includes('two-handed'));
  const isDualWielding = actor.items.filter(i => i.type === 'weapon' && i.system?.equipped).length >= 2;

  const buttons = [];

  for (const item of actor.items) {
    if (item.type !== 'feat') continue;
    const cfg = ON_HIT_FEAT_EFFECTS[item.name];
    if (!cfg) continue;

    // Equipment / prerequisite gates
    if (cfg.requires) {
      if (cfg.requires === 'twoHanded' && !isTwoHanded) continue;
      if (cfg.requires === 'dualWielding' && !isDualWielding) continue;
      if (cfg.requires.startsWith('hasFeat:') &&
          !hasFeat(actor, cfg.requires.slice('hasFeat:'.length).trim())) continue;
    }

    // Minimum margin gate
    if (cfg.minMargin && margin < cfg.minMargin) continue;

    buttons.push({
      ...cfg,
      featName: item.name,
      targetId,
      attackerId: actor.id,
    });
  }

  return buttons;
}

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

  const otherText = String(prereqs.other || '').trim();
  if (otherText) {
    reasons.push(...validateOtherPrereqs(actor, otherText));
  }

  return reasons;
}

function validateOtherPrereqs(actor, otherText) {
  const reasons = [];
  const parts = otherText.split(/[;,]/).map(part => part.trim()).filter(Boolean);
  const ownedItemNames = actor.items.map((entry) => String(entry.name || '').trim().toLowerCase());

  const getSkillValue = (skillKey) => {
    const direct = actor.system?.skills?.[skillKey];
    const normalized = actor.system?.skills?.[normalizeSkillKey(skillKey)];
    const source = direct ?? normalized;
    return Number(source?.value ?? source ?? 0);
  };

  const getAllSkillValues = () => Object.keys(actor.system?.skills || {}).map((skillKey) => getSkillValue(skillKey));

  const getElementalMasteryValues = () => {
    const mastery = actor.system?.mastery || {};
    return ['fire', 'water', 'earth', 'air'].map((energyKey) => Number(mastery?.[energyKey]?.value ?? 0));
  };

  const getAllMasteryValues = () => {
    const mastery = actor.system?.mastery || {};
    return ['fire', 'water', 'earth', 'air', 'positive', 'negative', 'time', 'space'].map((energyKey) => Number(mastery?.[energyKey]?.value ?? 0));
  };

  for (const part of parts) {
    const normalizedPart = String(part || '').trim().toLowerCase();

    if (normalizedPart.includes('pneuma strike')) {
      const hasPneumaStrike = ownedItemNames.some((name) => name.includes('pneuma strike'));
      if (!hasPneumaStrike) reasons.push('Requires feat/trait: Pneuma Strike');
      // Continue parsing this part for additional constraints like mastery thresholds.
    }

    const anySkillRankMatch = normalizedPart.match(/^any\s+skill\s+rank\s+(\d+)$/i);
    if (anySkillRankMatch) {
      const required = Number(anySkillRankMatch[1] || 0);
      const highest = getAllSkillValues().reduce((max, current) => Math.max(max, current), 0);
      if (highest < required) reasons.push(`Requires any skill rank ${required}+ (highest is ${highest})`);
      continue;
    }

    const chosenCombatSkillMatch = normalizedPart.match(/^chosen\s+combat\s+skill\s+(\d+)$/i);
    if (chosenCombatSkillMatch) {
      const required = Number(chosenCombatSkillMatch[1] || 0);
      const melee = getSkillValue('meleeCombat');
      const ranged = getSkillValue('rangedCombat');
      const highestCombat = Math.max(melee, ranged);
      if (highestCombat < required) reasons.push(`Requires chosen combat skill ${required}+ (best combat skill is ${highestCombat})`);
      continue;
    }

    const anyElementalMasteryMatch = normalizedPart.match(/^any\s+elemental\s+mastery\s+(\d+)$/i);
    if (anyElementalMasteryMatch) {
      const required = Number(anyElementalMasteryMatch[1] || 0);
      const highest = getElementalMasteryValues().reduce((max, current) => Math.max(max, current), 0);
      if (highest < required) reasons.push(`Requires any elemental Mastery ${required}+ (highest is ${highest})`);
      continue;
    }

    const chosenElementalMasteryMatch = normalizedPart.match(/^chosen\s+elemental\s+mastery\s+(\d+)$/i);
    if (chosenElementalMasteryMatch) {
      const required = Number(chosenElementalMasteryMatch[1] || 0);
      const highest = getElementalMasteryValues().reduce((max, current) => Math.max(max, current), 0);
      if (highest < required) reasons.push(`Requires chosen elemental Mastery ${required}+ (highest is ${highest})`);
      continue;
    }

    const elementalMasteryInlineMatch = normalizedPart.match(/\b(any|chosen)\s+elemental\s+mastery\s+(\d+)\b/i);
    if (elementalMasteryInlineMatch) {
      const required = Number(elementalMasteryInlineMatch[2] || 0);
      const highest = getElementalMasteryValues().reduce((max, current) => Math.max(max, current), 0);
      if (highest < required) reasons.push(`Requires ${elementalMasteryInlineMatch[1]} elemental Mastery ${required}+ (highest is ${highest})`);
      continue;
    }

    // "any Energy Mastery X" — any of the 8 energy types (elemental + conceptual)
    const anyEnergyMasteryMatch = normalizedPart.match(/\b(any|chosen)\s+energy\s+mastery\s+(\d+)\b/i);
    if (anyEnergyMasteryMatch) {
      const required = Number(anyEnergyMasteryMatch[2] || 0);
      const highest = getAllMasteryValues().reduce((max, current) => Math.max(max, current), 0);
      if (highest < required) reasons.push(`Requires any energy Mastery ${required}+ (highest is ${highest})`);
      continue;
    }

    // "Two non-combat skills rank 5+" — X non-combat skills at rank Y+
    const nonCombatSkillCountMatch = normalizedPart.match(/^(\w+)\s+non[- ]combat\s+skills?\s+rank\s+(\d+)\+?$/i);
    if (nonCombatSkillCountMatch) {
      const WORD_TO_NUMBER = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
      const countWord = String(nonCombatSkillCountMatch[1] || '').toLowerCase();
      const countRequired = WORD_TO_NUMBER[countWord] ?? Number(nonCombatSkillCountMatch[1]);
      const rankRequired = Number(nonCombatSkillCountMatch[2]);
      const COMBAT_SKILLS = new Set(['meleeCombat', 'rangedCombat']);
      const nonCombatAtRank = Object.keys(actor.system?.skills || {})
        .filter((key) => !COMBAT_SKILLS.has(key))
        .filter((key) => getSkillValue(key) >= rankRequired).length;
      if (nonCombatAtRank < countRequired) {
        reasons.push(`Requires ${nonCombatSkillCountMatch[1]} non-combat skill${countRequired !== 1 ? 's' : ''} rank ${rankRequired}+ (has ${nonCombatAtRank})`);
      }
      continue;
    }

    const namedFeatLikeReq = part.match(/^[a-z][a-z\s'()\-]+$/i);
    if (namedFeatLikeReq
      && !/\b(mastery|potential|attribute|spellcaster|skill\s+rank|combat\s+skill)\b/i.test(normalizedPart)
      && !ownedItemNames.some((name) => name === normalizedPart || name.includes(normalizedPart) || normalizedPart.includes(name))) {
      reasons.push(`Requires feat/trait: ${part}`);
      continue;
    }

    const masteryMatch = part.match(/^(fire|water|earth|air|positive|negative|time|space)\s+mastery\s+(\d+)$/i);
    if (masteryMatch) {
      const energyKey = String(masteryMatch[1] || '').toLowerCase();
      const required = Number(masteryMatch[2] || 0);
      const current = Number(actor.system?.mastery?.[energyKey]?.value ?? 0);
      if (current < required) reasons.push(`Requires ${capitalize(energyKey)} Mastery ${required}+ (actor has ${current})`);
      continue;
    }

    const potentialMatch = part.match(/^(fire|water|earth|air|positive|negative|time|space)\s+potential\s+(\d+)$/i);
    if (potentialMatch) {
      const energyKey = String(potentialMatch[1] || '').toLowerCase();
      const required = Number(potentialMatch[2] || 0);
      const current = Number(actor.system?.potentials?.[energyKey]?.value ?? 0);
      if (current < required) reasons.push(`Requires ${capitalize(energyKey)} Potential ${required}+ (actor has ${current})`);
      continue;
    }

    if (/^any\s+magical\s+tradition\s+trait$/i.test(part)) {
      const magicalTraitType = String(actor.system?.magicalTrait?.type || '').trim().toLowerCase();
      if (!magicalTraitType) reasons.push('Requires any magical tradition trait');
      continue;
    }

    if (/^(must be a spellcaster|spellcaster)$/i.test(part)) {
      const magicalTraitType = String(actor.system?.magicalTrait?.type || '').trim().toLowerCase();
      if (!magicalTraitType || magicalTraitType === 'alchemical-tradition') {
        reasons.push('Requires a spellcasting magical trait');
      }
      continue;
    }

    const castingAttributeMatch = part.match(/^casting\s+attribute\s+(\d+)$/i);
    if (castingAttributeMatch) {
      const required = Number(castingAttributeMatch[1] || 0);
      const castingStatKey = String(actor.system?.castingStat?.value || '').trim();
      const current = Number(actor.system?.attributes?.[castingStatKey]?.value ?? 0);
      if (!castingStatKey || current < required) {
        reasons.push(`Requires Casting Attribute ${required}+ (actor has ${current})`);
      }
      continue;
    }
  }

  return reasons;
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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

/**
 * Compute aggregated modifiers from all feat effects on an actor.
 * Returns an object with structure: { skills: {}, attributes: {}, dr: {slashing, piercing, bludgeoning}, saves: {}, resistances: {}, actions: [], reactions: [] }
 */
export function computeFeatModifiers(actor) {
  const out = {
    // Permanent rank/value changes (used in actor.prepareDerivedData)
    skills: {},
    attributes: {},
    dr: { slashing: 0, piercing: 0, bludgeoning: 0 },
    saves: {},
    resistances: {},
    actions: [],
    reactions: [],
    // Per-skill / per-attr dice modifiers (accumulated here; consumed by getFeatRollModifiers)
    skillDiceModifiers: {},
    attributeDiceModifiers: {},
    // New: flat stat bonuses
    initiative: 0,
    hp: 0,
    hpShortRestBonus: 0,
    damage: {},           // keyed by target scope: "all", "melee", "ranged", "unarmed"
    conditionImmunities: [],
    toggleStates: [],     // array of { key, label, active, featName }
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

      // Gate effects with a `when` condition on current actor state
      if (eff.when && !evaluateFeatCondition(actor, eff.when)) continue;

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
        case 'save.modify': {
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
        }

        // ── New effect types ─────────────────────────────────────────────────

        case 'initiative.modify':
          out.initiative += isNaN(value) ? 0 : value;
          break;

        case 'hp.bonus':
          if (eff.formula) out.hp += evaluateFeatFormula(eff.formula, actor);
          else out.hp += isNaN(value) ? 0 : value;
          break;

        case 'hp.shortRest.bonus':
          if (eff.formula) out.hpShortRestBonus += evaluateFeatFormula(eff.formula, actor);
          else out.hpShortRestBonus += isNaN(value) ? 0 : value;
          break;

        case 'damage.bonus': {
          const dmgKey = String(eff.target || 'all');
          const dmgFlat = isNaN(value) ? 0 : value;
          const dmgFormula = eff.formula ? evaluateFeatFormula(eff.formula, actor) : 0;
          out.damage[dmgKey] = (out.damage[dmgKey] || 0) + dmgFlat + dmgFormula;
          break;
        }

        case 'dr.modify': {
          const drFlat = isNaN(value) ? 0 : value;
          const drFormula = eff.formula ? evaluateFeatFormula(eff.formula, actor) : 0;
          const drTotal = drFlat + drFormula;
          const dmgTypes = String(eff.damageTypes || 'all').toLowerCase();
          if (dmgTypes === 'all' || dmgTypes === 'physical' || dmgTypes.includes('slash'))   out.dr.slashing   += drTotal;
          if (dmgTypes === 'all' || dmgTypes === 'physical' || dmgTypes.includes('pierc'))   out.dr.piercing   += drTotal;
          if (dmgTypes === 'all' || dmgTypes === 'physical' || dmgTypes.includes('bludge'))  out.dr.bludgeoning += drTotal;
          break;
        }

        case 'condition.immunity': {
          const names = Array.isArray(eff.conditionName) ? eff.conditionName : [eff.conditionName];
          out.conditionImmunities.push(...names.filter(Boolean));
          break;
        }

        case 'toggle.state': {
          const stateKey = String(eff.stateKey || '');
          if (!stateKey) break;
          const isActive = Boolean(actor.flags?.legends?.toggleStates?.[stateKey]);
          out.toggleStates.push({
            key: stateKey,
            label: eff.label || stateKey,
            active: isActive,
            featName: item.name,
          });
          // If the toggle is currently on, fold its nested effects into the modifiers
          if (isActive && Array.isArray(eff.effects)) {
            for (const subEff of eff.effects) {
              processToggleSubEffect(actor, subEff, out);
            }
          }
          break;
        }

        // roll.modifier / fortune.grant / misfortune.grant are consumed at roll-time
        // via getFeatRollModifiers and do not modify prepareDerivedData totals.
        case 'roll.modifier':
        case 'fortune.grant':
        case 'misfortune.grant':
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
