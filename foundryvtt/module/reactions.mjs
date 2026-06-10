/**
 * Legends D8 TTRPG — Reaction System (Category 4)
 *
 * Provides reaction buttons on combat result cards for 18 reaction feats.
 * Reactions are triggered by attack outcome (hit/miss/melee/ranged) and
 * 0-HP events, and are resolved via follow-up chat messages or dialogs.
 *
 * Architecture:
 *  - buildReactionButtonsHtml()  → called from calculateDamage()
 *  - resolveReaction()           → called from click handler in initializeCombatSystem()
 *  - checkZeroHPReactions()      → called from legends.hpChanged hook
 *  - initializeReactions()       → registers the legends.hpChanged hook; called from legends.mjs
 */

import { hasFeat } from './feat-effects.mjs';

// ─────────────────────────────────────────────────────────────────────────────
// REACTION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
// trigger:
//   'miss-melee'           — attacker's melee attack missed the defender
//   'hit-melee'            — attacker's melee attack hit the defender
//   'hit-ranged'           — attacker's ranged attack hit the defender
//   'hit-any'              — any hit (melee or ranged)
//   'hp-zero'              — actor just dropped to 0 HP (handled via hook)
//   'ally-hit'             — an adjacent ally was hit (handled via ally scan)
//
// owner: 'defender' | 'victim' | 'ally'

const REACTION_DEFS = {
  // ── Defender: missed by melee ─────────────────────────────────────────────
  'Counter Strike': {
    trigger: 'miss-melee',
    owner: 'defender',
    icon: 'fas fa-reply',
    action: 'free-attack',
    note: 'Reaction — immediate melee attack',
  },
  'Flowing Guard': {
    trigger: 'miss-melee',
    owner: 'defender',
    requiresToggle: 'flowingGuard',
    icon: 'fas fa-hands-fist',
    action: 'unarmed-strike',
    note: 'Reaction — unarmed strike (costs 1 Luck)',
  },

  // ── Defender: hit by melee ────────────────────────────────────────────────
  'Cross Parry': {
    trigger: 'hit-melee',
    owner: 'defender',
    icon: 'fas fa-shield',
    action: 'reduce-str',
    note: 'Reduce damage by Strength',
  },
  'Blade Mastery': {
    trigger: 'hit-melee',
    owner: 'defender',
    requiresFeat: 'Cross Parry',
    icon: 'fas fa-shield',
    action: 'reduce-str',
    note: 'Cross Parry ×2/round',
  },
  'Shield Wall': {
    trigger: 'hit-melee',
    owner: 'defender',
    requiresShield: true,
    icon: 'fas fa-shield-halved',
    action: 'reduce-con',
    note: 'Reduce damage by Constitution',
  },
  'Retribution': {
    trigger: 'hit-melee',
    owner: 'defender',
    passive: true,
    icon: 'fas fa-rotate-left',
    action: 'retribution',
    note: 'Passive — attacker takes Str bludgeoning',
  },

  // ── Defender: hit by any ──────────────────────────────────────────────────
  'Instinctive Dodge': {
    trigger: 'hit-any',
    owner: 'defender',
    icon: 'fas fa-person-running',
    action: 'halve-damage',
    note: 'Halve incoming damage',
  },

  // ── Defender: hit by ranged ───────────────────────────────────────────────
  'Deflect Missiles': {
    trigger: 'hit-ranged',
    owner: 'defender',
    icon: 'fas fa-angles-right',
    action: 'deflect',
    note: 'Reduce by 4+Dex+Wis; optionally return',
  },

  // ── 0-HP reactions (handled via hook, not result card) ────────────────────
  'Relentless Fury': {
    trigger: 'hp-zero',
    owner: 'victim',
    requiresToggle: 'primalFury',
    icon: 'fas fa-fire',
    action: 'fort-save-1hp',
    note: 'Fortitude save to stay at 1 HP',
  },
  'Eldritch Resilience': {
    trigger: 'hp-zero',
    owner: 'victim',
    useLimitPeriod: 'longRest',
    icon: 'fas fa-bolt',
    action: 'stabilize-1hp',
    note: 'Stabilize at 1 HP; refill Energy (1/long rest)',
  },

  // ── Ally reactions (ally scan on hit) ─────────────────────────────────────
  'Bodyguard': {
    trigger: 'ally-hit',
    owner: 'ally',
    icon: 'fas fa-user-shield',
    action: 'redirect-to-self',
    note: 'Redirect attack to self (must be adjacent)',
  },
  "Guardian's Protection": {
    trigger: 'ally-hit',
    owner: 'ally',
    icon: 'fas fa-shield-heart',
    action: 'guardian-protect',
    note: '+2 DR for ally OR counter-attack attacker',
  },

  // ── Ally 0-HP reactions (handled via hook) ────────────────────────────────
  'Triage Specialist': {
    trigger: 'ally-hp-zero',
    owner: 'ally',
    icon: 'fas fa-kit-medical',
    action: 'immediate-stabilize',
    note: 'Immediate stabilization (within 10 ft)',
  },
  'Vessel of Faith': {
    trigger: 'ally-hp-zero',
    owner: 'ally',
    useLimitPeriod: 'longRest',
    icon: 'fas fa-cross',
    action: 'channel-divinity',
    note: 'Restore ally to 1 HP via Channel Divinity (1/long rest)',
  },

  // ── Other situational (shown as ally reactions on hit) ────────────────────
  'Opportunist': {
    trigger: 'ally-hit',   // fires when an ALLY hits (ally → reactor, attacker context reversed)
    owner: 'ally',
    icon: 'fas fa-bolt',
    action: 'opportunist-attack',
    note: 'Immediate attack on the same target',
  },

  // ── Manual-only (no automated trigger — GM reminder) ──────────────────────
  'Analytical Mind': {
    trigger: 'manual',
    owner: 'any',
    icon: 'fas fa-brain',
    action: 'arcana-check',
    note: 'Arcana check → Misfortune on enemy weave',
  },
  'Covering Fire': {
    trigger: 'manual',
    owner: 'any',
    icon: 'fas fa-crosshairs',
    action: 'covering-fire',
    note: 'Will save or stop movement in covered zone',
  },
  'Unraveling Word': {
    trigger: 'manual',
    owner: 'any',
    useLimitPeriod: 'shortRest',
    icon: 'fas fa-comment-slash',
    action: 'unraveling-word',
    note: 'Opposed check to negate enemy combat action (1/short rest)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Read an attribute value from an actor, checking effective then base. */
function _attr(actor, key) {
  return actor.system.attributesEffective?.[key]
    ?? actor.system.attributes?.[key]?.value
    ?? 0;
}

/** Resolve an actor by ID: canvas token first, then actor directory. */
function _resolveActor(id) {
  if (!id) return null;
  return canvas.tokens?.placeables.find(t => t.actor?.id === id)?.actor
    ?? game.actors.get(id)
    ?? null;
}

/** Measure scene distance (ft) between two canvas tokens. */
function _distanceBetweenTokens(t1, t2) {
  try {
    if (typeof canvas.grid?.measurePath === 'function') {
      return canvas.grid.measurePath([
        { x: t1.x + (t1.w ?? t1.width ?? 0) / 2, y: t1.y + (t1.h ?? t1.height ?? 0) / 2 },
        { x: t2.x + (t2.w ?? t2.width ?? 0) / 2, y: t2.y + (t2.h ?? t2.height ?? 0) / 2 },
      ]).distance ?? Infinity;
    }
    // Fallback: pixel distance → feet
    const dx = (t1.x + (t1.w ?? 0) / 2) - (t2.x + (t2.w ?? 0) / 2);
    const dy = (t1.y + (t1.h ?? 0) / 2) - (t2.y + (t2.h ?? 0) / 2);
    const pixels = Math.sqrt(dx * dx + dy * dy);
    const gridSize = canvas.grid?.size ?? 100;
    const gridDistance = canvas.grid?.distance ?? 5;
    return (pixels / gridSize) * gridDistance;
  } catch {
    return 0;
  }
}

/**
 * Collect reaction button configs for a single actor given a trigger context.
 * @param {Actor} actor
 * @param {'defender'|'victim'|'ally'} ownerRole
 * @param {Object} ctx  { margin, isRanged, proposedDamage, attackerId, defenderId }
 * @returns {Array<Object>}
 */
function _reactionsForActor(actor, ownerRole, ctx) {
  const { margin, isRanged, proposedDamage, damageType, attackerId, defenderId } = ctx;
  const isHit = margin >= 1;
  const isMiss = margin < 1;
  const results = [];

  for (const item of actor.items) {
    if (item.type !== 'feat') continue;
    const def = REACTION_DEFS[item.name];
    if (!def) continue;
    if (def.owner !== ownerRole && def.owner !== 'any') continue;

    // Skip triggers handled by other paths
    const skip = ['hp-zero', 'ally-hp-zero', 'manual'];
    if (skip.includes(def.trigger)) continue;

    // Match trigger to context
    const t = def.trigger;
    if (t === 'miss-melee' && !(isMiss && !isRanged)) continue;
    if (t === 'hit-melee'  && !(isHit && !isRanged)) continue;
    if (t === 'hit-ranged' && !(isHit && isRanged)) continue;
    if (t === 'hit-any'    && !isHit) continue;
    // ally-hit scanned separately

    // Toggle state requirement
    if (def.requiresToggle) {
      const on = actor.getFlag('legends', `toggleStates.${def.requiresToggle}`);
      if (!on) continue;
    }

    // Feat prerequisite
    if (def.requiresFeat && !hasFeat(actor, def.requiresFeat)) continue;

    // Shield requirement
    if (def.requiresShield) {
      const hasShield = actor.items.some(i => i.type === 'shield' && i.system?.equipped);
      if (!hasShield) continue;
    }

    results.push({
      ...def,
      featName: item.name,
      reactorId: actor.id,
      attackerId,
      defenderId,
      proposedDamage: proposedDamage ?? 0,
      damageType: damageType ?? 'slashing',
    });
  }

  return results;
}

/**
 * Scan canvas tokens for allies adjacent to the defender that have ally reactions.
 * @returns {Array<Object>}
 */
function _getAllyReactionButtons(defender, attacker, margin, isRanged, proposedDamage, damageType) {
  if (!canvas?.tokens?.placeables) return [];
  if (margin < 1) return []; // Ally reactions only fire on hits

  const defToken = canvas.tokens.placeables.find(t => t.actor?.id === defender.id);
  if (!defToken) return [];

  const allyFeatNames = ['Bodyguard', "Guardian's Protection", 'Opportunist'];
  const results = [];

  for (const token of canvas.tokens.placeables) {
    const ally = token.actor;
    if (!ally || ally.id === defender.id || ally.id === attacker.id) continue;
    if (ally.type !== 'character') continue;

    const dist = _distanceBetweenTokens(defToken, token);
    if (dist > 10) continue; // within 10 ft (adjacent + 5 ft range)

    for (const featName of allyFeatNames) {
      if (!hasFeat(ally, featName)) continue;
      const def = REACTION_DEFS[featName];
      if (!def) continue;
      results.push({
        ...def,
        featName,
        reactorId: ally.id,
        attackerId: attacker.id,
        defenderId: defender.id,
        proposedDamage: proposedDamage ?? 0,
        damageType: damageType ?? 'slashing',
        _allyName: ally.name,
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — RESULT CARD BUTTONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the reaction section HTML to embed in the combat result card.
 * Called from calculateDamage() in combat.mjs.
 *
 * @param {Actor}  attacker
 * @param {Actor}  defender
 * @param {number} margin          Positive = hit, negative = miss
 * @param {Object} attackMode      { type: 'melee'|'ranged', ... }
 * @param {number} proposedDamage  Damage before DR (so reactions can show correct reduction)
 * @returns {string} HTML string (may be empty)
 */
export function buildReactionButtonsHtml(attacker, defender, margin, attackMode, proposedDamage, damageType) {
  if (!attacker || !defender) return '';

  const isRanged = (attackMode?.type === 'ranged');
  const ctx = { margin, isRanged, proposedDamage, damageType: damageType ?? 'slashing', attackerId: attacker.id, defenderId: defender.id };

  const defBtns = _reactionsForActor(defender, 'defender', ctx);
  const allyBtns = _getAllyReactionButtons(defender, attacker, margin, isRanged, proposedDamage, ctx.damageType);

  const all = [...defBtns, ...allyBtns];
  if (all.length === 0) return '';

  const btnsHtml = all.map(btn => {
    const dataJson = encodeURIComponent(JSON.stringify(btn));
    const allyTag = btn._allyName ? ` <small class="reaction-ally">(${btn._allyName})</small>` : '';
    const passiveTag = btn.passive ? ' <em class="reaction-passive">[passive]</em>' : '';
    return `<button class="legends-reaction-btn${btn.passive ? ' is-passive' : ''}" data-reaction="${dataJson}">` +
      `<i class="${btn.icon}"></i> ${btn.featName}${passiveTag}${allyTag}` +
      (btn.note ? `<span class="reaction-note"> — ${btn.note}</span>` : '') +
      `</button>`;
  }).join('');

  return `<div class="reaction-section">` +
    `<strong class="reaction-heading"><i class="fas fa-shield-halved"></i> Reactions Available</strong>` +
    `<div class="reaction-btn-list">${btnsHtml}</div></div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — REACTION RESOLUTION (click dispatcher)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dispatch a reaction button click to the appropriate handler.
 * Called from the `.legends-reaction-btn` click handler in initializeCombatSystem().
 * @param {Object} cfg  Parsed JSON from data-reaction attribute
 */
export async function resolveReaction(cfg) {
  const reactor  = _resolveActor(cfg.reactorId);
  const attacker = _resolveActor(cfg.attackerId);
  const defender = _resolveActor(cfg.defenderId);

  if (!reactor) { ui.notifications.warn('Reacting actor not found.'); return; }

  // Permission check
  if (!reactor.isOwner && !game.user.isGM) {
    ui.notifications.warn(`Only ${reactor.name}'s player or the GM can activate this reaction.`);
    return;
  }

  switch (cfg.action) {
    case 'free-attack':
      await _reactFreeAttack(reactor, attacker, defender, cfg);
      break;
    case 'opportunist-attack':
      await _reactOpportunistAttack(reactor, attacker, defender, cfg);
      break;
    case 'unarmed-strike':
      await _reactUnarmedStrike(reactor, attacker, cfg);
      break;
    case 'reduce-str':
      await _reactReduceByAttr(reactor, 'strength', cfg);
      break;
    case 'reduce-con':
      await _reactReduceByAttr(reactor, 'constitution', cfg);
      break;
    case 'halve-damage':
      await _reactHalveDamage(reactor, cfg);
      break;
    case 'retribution':
      await _reactRetribution(reactor, attacker, cfg);
      break;
    case 'deflect':
      await _reactDeflect(reactor, attacker, cfg);
      break;
    case 'fort-save-1hp':
      await _reactRelentlessFury(reactor, cfg);
      break;
    case 'stabilize-1hp':
      await _reactEldritchResilience(reactor, cfg);
      break;
    case 'redirect-to-self':
      await _reactBodyguard(reactor, defender, cfg);
      break;
    case 'guardian-protect':
      await _reactGuardianProtect(reactor, defender, attacker, cfg);
      break;
    case 'immediate-stabilize':
      await _reactTriageStabilize(reactor, defender, cfg);
      break;
    case 'channel-divinity':
      await _reactVesselOfFaith(reactor, defender, cfg);
      break;
    case 'arcana-check':
      await _reactAnalyticalMind(reactor, attacker, cfg);
      break;
    case 'covering-fire':
      await _reactCoveringFire(reactor, cfg);
      break;
    case 'unraveling-word':
      await _reactUnravelingWord(reactor, attacker, cfg);
      break;
    default:
      ui.notifications.warn(`Unknown reaction action: ${cfg.action}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — 0-HP REACTION PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check an actor for 0-HP reactions and post prompts to chat.
 * Called from the `legends.hpChanged` hook when newHP <= 0 and oldHP > 0.
 * @param {Actor} actor  The actor that just dropped to 0 HP
 */
export async function checkZeroHPReactions(actor) {
  // ── Actor's own 0-HP reactions ────────────────────────────────────────────
  for (const item of actor.items) {
    if (item.type !== 'feat') continue;
    const def = REACTION_DEFS[item.name];
    if (!def || def.trigger !== 'hp-zero') continue;

    // Toggle requirement (e.g. Relentless Fury needs Primal Fury active)
    if (def.requiresToggle) {
      const on = actor.getFlag('legends', `toggleStates.${def.requiresToggle}`);
      if (!on) continue;
    }

    // Once-per-rest gate
    if (def.useLimitPeriod) {
      const flagKey = `reactionUsed.${item.name}`;
      const used = actor.getFlag('legends', flagKey);
      if (used) {
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="legends-combat-result"><em>${item.name}</em>: already used this ${def.useLimitPeriod}.</div>`,
          whisper: ChatMessage.getWhisperRecipients('GM'),
        });
        continue;
      }
    }

    const dataJson = encodeURIComponent(JSON.stringify({
      ...def,
      featName: item.name,
      reactorId: actor.id,
      attackerId: null,
      defenderId: actor.id,
      proposedDamage: 0,
    }));

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="legends-combat-result reaction-prompt">` +
        `<strong><i class="${def.icon}"></i> ${item.name}</strong> — reaction available!<br/>` +
        `<em>${def.note}</em><br/>` +
        `<button class="legends-reaction-btn" data-reaction="${dataJson}">` +
        `<i class="${def.icon}"></i> Activate ${item.name}</button></div>`,
    });
  }

  // ── Ally 0-HP reactions: scan nearby tokens ───────────────────────────────
  if (!canvas?.tokens?.placeables) return;
  const actorToken = canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
  if (!actorToken) return;

  const allyHPZeroFeats = ['Triage Specialist', 'Vessel of Faith'];
  for (const token of canvas.tokens.placeables) {
    const ally = token.actor;
    if (!ally || ally.id === actor.id || ally.type !== 'character') continue;
    const dist = _distanceBetweenTokens(actorToken, token);
    if (dist > 10) continue;

    for (const featName of allyHPZeroFeats) {
      if (!hasFeat(ally, featName)) continue;
      const def = REACTION_DEFS[featName];
      if (!def) continue;

      if (def.useLimitPeriod) {
        const used = ally.getFlag('legends', `reactionUsed.${featName}`);
        if (used) continue;
      }

      const dataJson = encodeURIComponent(JSON.stringify({
        ...def,
        featName,
        reactorId: ally.id,
        attackerId: null,
        defenderId: actor.id,
        proposedDamage: 0,
      }));

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: ally }),
        content: `<div class="legends-combat-result reaction-prompt">` +
          `<strong><i class="${def.icon}"></i> ${featName}</strong> — ${ally.name} can react!<br/>` +
          `<em>${def.note}</em><br/>` +
          `<button class="legends-reaction-btn" data-reaction="${dataJson}">` +
          `<i class="${def.icon}"></i> Activate ${featName}</button></div>`,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — INIT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register the legends.hpChanged hook that drives 0-HP reactions.
 * Call from Hooks.once('ready', ...) in legends.mjs.
 */
export function initializeReactions() {
  Hooks.on('legends.hpChanged', ({ target, oldHP, newHP }) => {
    if (newHP <= 0 && oldHP > 0) {
      checkZeroHPReactions(target).catch(err =>
        console.error('Legends | Error in checkZeroHPReactions:', err)
      );
    }
  });
  console.log('Legends | Reaction system initialized');
}

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL REACTION HANDLERS (private)
// ─────────────────────────────────────────────────────────────────────────────

/** Post a follow-up Apply Damage button with a new (reduced) damage amount, or "absorbed" text. */
async function _postReducedDamageCard(reactor, reducedDamage, originalDamage, note, cfg) {
  const content = `<div class="legends-combat-result reaction-result">` +
    `<p>${note}</p>` +
    (reducedDamage > 0
      ? `<button class="apply-damage-btn" ` +
        `data-target-id="${reactor.id}" ` +
        `data-damage="${reducedDamage}" ` +
        `data-damage-type="${cfg.damageType ?? 'physical'}">` +
        `<i class="fas fa-heart-broken"></i> Apply ${reducedDamage} Damage</button>`
      : `<p><em>All damage absorbed!</em></p>`
    ) +
    `</div>`;
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: reactor }), content });
}

async function _reactFreeAttack(reactor, attacker, defender, cfg) {
  // Counter Strike: reactor is the defender, free attack against the attacker
  const target = attacker;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><strong>${reactor.name}</strong> uses <em>${cfg.featName}</em> [Reaction]: ` +
      `free melee attack against <strong>${target?.name ?? 'attacker'}</strong>.</p>` +
      `<p><em>Initiate the attack from the character sheet.</em></p></div>`,
  });
}

async function _reactOpportunistAttack(reactor, attacker, defender, cfg) {
  // Opportunist: reactor is an ally; the "attacker" here is the enemy, "defender" is the ally's allied target
  // Actually: Opportunist fires when an ally hits. The ally (reactor) attacks the same target (attacker in original context).
  // We store defenderId as the original attacker (the enemy), attackerId as the original attacker.
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><strong>${reactor.name}</strong> uses <em>Opportunist</em> [Reaction]: ` +
      `immediate attack against <strong>${attacker?.name ?? 'target'}</strong>.</p>` +
      `<p><em>Initiate the attack from the character sheet.</em></p></div>`,
  });
}

async function _reactUnarmedStrike(reactor, target, cfg) {
  const currentLuck = reactor.system.luck?.current ?? reactor.system.attributes?.luck?.value ?? 2;
  if (currentLuck <= 0) {
    ui.notifications.warn(`${reactor.name} has no Luck remaining — Flowing Guard cannot activate.`);
    return;
  }
  await reactor.update({ 'system.luck.current': currentLuck - 1 });
  const strVal = _attr(reactor, 'strength');
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><strong>${reactor.name}</strong> uses <em>Flowing Guard</em> [Reaction]: ` +
      `unarmed strike against <strong>${target?.name ?? 'attacker'}</strong> (−1 Luck).</p>` +
      `<p><em>Roll Agi + Melee vs defender. Margin 1: unarmed base. Margin 2+: +${strVal} Str damage.</em></p></div>`,
  });
}

async function _reactReduceByAttr(reactor, attrKey, cfg) {
  const attrVal = _attr(reactor, attrKey);
  const reduced = Math.max(0, cfg.proposedDamage - attrVal);
  const featLabel = cfg.featName;
  const attrLabel = attrKey === 'strength' ? 'Strength' : 'Constitution';
  await _postReducedDamageCard(
    reactor, reduced, cfg.proposedDamage,
    `<strong>${reactor.name}</strong> uses <em>${featLabel}</em>: −${attrVal} damage (${attrLabel}). New damage: <strong>${reduced}</strong>.`,
    cfg
  );
}

async function _reactHalveDamage(reactor, cfg) {
  const halved = Math.ceil(cfg.proposedDamage / 2);
  await _postReducedDamageCard(
    reactor, halved, cfg.proposedDamage,
    `<strong>${reactor.name}</strong> uses <em>Instinctive Dodge</em>: damage halved to <strong>${halved}</strong> (was ${cfg.proposedDamage}).`,
    cfg
  );
}

async function _reactRetribution(reactor, attacker, cfg) {
  if (!attacker) return;
  const strVal = _attr(reactor, 'strength');
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><em>Retribution</em> [passive]: <strong>${attacker.name}</strong> takes ` +
      `<strong>${strVal}</strong> bludgeoning damage for striking ${reactor.name}.</p>` +
      `<button class="apply-damage-btn" ` +
      `data-target-id="${attacker.id}" ` +
      `data-damage="${strVal}" ` +
      `data-damage-type="bludgeoning">` +
      `<i class="fas fa-heart-broken"></i> Apply ${strVal} to ${attacker.name}</button></div>`,
  });
}

async function _reactDeflect(reactor, attacker, cfg) {
  const dex = _attr(reactor, 'dexterity');
  const wis = _attr(reactor, 'wisdom');
  const reduction = 4 + dex + wis;
  const reduced = Math.max(0, cfg.proposedDamage - reduction);

  const throwBackDmg = Math.floor(reduction / 2);
  const throwBackBtn = attacker
    ? `<button class="apply-damage-btn" ` +
      `data-target-id="${attacker.id}" ` +
      `data-damage="${throwBackDmg}" ` +
      `data-damage-type="piercing">` +
      `<i class="fas fa-angles-right"></i> Throw Back: ${throwBackDmg} to ${attacker.name}</button>`
    : '';

  const reducedBtn = reduced > 0
    ? `<button class="apply-damage-btn" ` +
      `data-target-id="${reactor.id}" ` +
      `data-damage="${reduced}" ` +
      `data-damage-type="${cfg.damageType ?? 'piercing'}">` +
      `<i class="fas fa-heart-broken"></i> Apply ${reduced} Damage</button>`
    : `<p><em>Missile fully deflected!</em></p>`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><strong>${reactor.name}</strong> uses <em>Deflect Missiles</em>: ` +
      `−${reduction} damage (4+${dex}Dex+${wis}Wis). New damage: <strong>${reduced}</strong>.</p>` +
      reducedBtn + ' ' + throwBackBtn + `</div>`,
  });
}

async function _reactRelentlessFury(reactor, cfg) {
  const result = await game.legends?.rollSavingThrow?.(reactor, 'fortitude');
  if (!result) return;
  if ((result.successes ?? 0) >= 1) {
    await reactor.update({ 'system.hp.value': 1 });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: reactor }),
      content: `<p><strong>${reactor.name}</strong> uses <em>Relentless Fury</em> — ` +
        `passes Fortitude and stays at <strong>1 HP</strong>!</p>`,
    });
  } else {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: reactor }),
      content: `<p><strong>${reactor.name}</strong>'s <em>Relentless Fury</em> fails — ` +
        `Fortitude save failed.</p>`,
    });
  }
}

async function _reactEldritchResilience(reactor, cfg) {
  const flagKey = 'reactionUsed.Eldritch Resilience';
  const used = reactor.getFlag('legends', flagKey);
  if (used) {
    ui.notifications.warn(`${reactor.name}: Eldritch Resilience already used this long rest.`);
    return;
  }
  await reactor.setFlag('legends', flagKey, true);
  await reactor.update({ 'system.hp.value': 1 });

  // Refill energy
  const maxEnergy = reactor.system.energy?.max ?? 0;
  if (maxEnergy > 0) {
    await reactor.update({ 'system.energy.current': maxEnergy });
  }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<p><strong>${reactor.name}</strong> triggers <em>Eldritch Resilience</em> — ` +
      `stabilizes at <strong>1 HP</strong>${maxEnergy > 0 ? ` with full Energy (${maxEnergy})` : ''}! ` +
      `(used for this long rest)</p>`,
  });
}

async function _reactBodyguard(reactor, originalDefender, cfg) {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><strong>${reactor.name}</strong> uses <em>Bodyguard</em> [Reaction]: ` +
      `redirecting the attack from <strong>${originalDefender?.name ?? 'ally'}</strong> to self.</p>` +
      `<p><em>GM: recalculate the attack against ${reactor.name} — discard the damage card above.</em></p></div>`,
  });
}

async function _reactGuardianProtect(reactor, defender, attacker, cfg) {
  await foundry.applications.api.DialogV2.wait({
    window: { title: `Guardian's Protection — ${reactor.name}` },
    rejectClose: false,
    content: `<p>Choose <em>Guardian's Protection</em> effect for <strong>${defender?.name ?? 'ally'}</strong>:</p>`,
    buttons: [
      {
        action: 'dr',
        label: '+2 DR for ally',
        callback: async () => {
          const existing = defender?.getFlag('legends', 'tempDRBonus') ?? 0;
          await defender?.setFlag('legends', 'tempDRBonus', existing + 2);
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: reactor }),
            content: `<p><strong>${reactor.name}</strong> uses <em>Guardian's Protection</em>: ` +
              `<strong>${defender?.name}</strong> gains +2 DR for this attack.</p>`,
          });
        },
      },
      {
        action: 'counter',
        label: 'Counter-attack attacker',
        default: true,
        callback: async () => {
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: reactor }),
            content: `<div class="legends-combat-result reaction-result">` +
              `<p><strong>${reactor.name}</strong> uses <em>Guardian's Protection</em> [Reaction]: ` +
              `counter-attack against <strong>${attacker?.name ?? 'attacker'}</strong>.</p>` +
              `<p><em>Initiate the attack from the character sheet.</em></p></div>`,
          });
        },
      },
    ],
  });
}

async function _reactTriageStabilize(reactor, downed, cfg) {
  const target = downed ?? _resolveActor(cfg.defenderId);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<p><strong>${reactor.name}</strong> uses <em>Triage Specialist</em> [Reaction]: ` +
      `stabilization attempt on <strong>${target?.name ?? 'ally'}</strong>.</p>` +
      `<p><em>Roll Medicine (rank 1+). 1 success: stable. 2 successes: restore 1 HP.</em></p>`,
  });
}

async function _reactVesselOfFaith(reactor, downed, cfg) {
  const flagKey = 'reactionUsed.Vessel of Faith';
  const used = reactor.getFlag('legends', flagKey);
  if (used) {
    ui.notifications.warn(`${reactor.name}: Vessel of Faith already used this long rest.`);
    return;
  }
  const target = downed ?? _resolveActor(cfg.defenderId);
  await reactor.setFlag('legends', flagKey, true);
  await target?.update({ 'system.hp.value': 1 });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<p><strong>${reactor.name}</strong> channels <em>Vessel of Faith</em>: ` +
      `<strong>${target?.name ?? 'ally'}</strong> stabilizes at <strong>1 HP</strong>! ` +
      `(used for this long rest)</p>`,
  });
}

async function _reactAnalyticalMind(reactor, caster, cfg) {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><strong>${reactor.name}</strong> uses <em>Analytical Mind</em> [Reaction]: ` +
      `Arcana check to impose Misfortune on <strong>${caster?.name ?? 'the caster'}</strong>'s weave.</p>` +
      `<p><em>Roll Int + Arcane vs GM DC. On success, the weave roll has Misfortune.</em></p></div>`,
  });
}

async function _reactCoveringFire(reactor, cfg) {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><strong>${reactor.name}</strong> uses <em>Covering Fire</em> [Reaction]: ` +
      `creature entering the covered zone must make a Will save or stop movement.</p>` +
      `<p><em>GM: call for a Will save (DC = reactor's Ranged Combat successes).</em></p></div>`,
  });
}

async function _reactUnravelingWord(reactor, attacker, cfg) {
  const flagKey = 'reactionUsed.Unraveling Word';
  const used = reactor.getFlag('legends', flagKey);
  if (used) {
    ui.notifications.warn(`${reactor.name}: Unraveling Word already used this short rest.`);
    return;
  }
  await reactor.setFlag('legends', flagKey, true);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: reactor }),
    content: `<div class="legends-combat-result reaction-result">` +
      `<p><strong>${reactor.name}</strong> uses <em>Unraveling Word</em> [Reaction]: ` +
      `opposed check to negate <strong>${attacker?.name ?? 'enemy'}</strong>'s action. ` +
      `(used for this short rest)</p>` +
      `<p><em>Roll opposed check (GM determines skills). On success, the enemy action is negated.</em></p></div>`,
  });
}
