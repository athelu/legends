/**
 * Social Check Context System
 *
 * Allows the GM to secretly inject attitude context into a player's social skill
 * roll without revealing the NPC's attitude or the numeric penalty to the player.
 *
 * Flow:
 *   1. GM opens an NPC sheet → clicks "Use for Social Check" (pre-fills attitude)
 *      OR calls game.legends.socialCheck.openGMContextSetter() directly.
 *   2. GM tells the player to roll.
 *   3. rollSkillCheck() detects a social skill, reads pending context or targeted
 *      token attitude, applies fortune/modifier/misfortune silently.
 *   4. A GM-only whisper confirms what was applied (label + effects).
 *   5. Pending context expires after 1 minute so stale data never bleeds into
 *      unrelated rolls.
 *
 * Rule reference (core_system.md "Current attitude modifies the test"):
 *   Devoted       — Fortune on roll
 *   Friendly      — Fortune on roll
 *   Cooperative   — No modifier (baseline)
 *   Indifferent   — +1 to both dice
 *   Uncooperative — +1 to both dice, Misfortune
 *   Hostile       — Cannot attempt normally  (blocked)
 *   Hatred        — Cannot attempt normally  (blocked)
 */

export const SOCIAL_SKILLS = new Set(['persuasion', 'deception', 'intimidate']);

/** How long (ms) a pending context remains valid before auto-expiring. */
const CONTEXT_TTL_MS = 60_000; // 1 minute

const SETTING_KEY = 'pendingSocialContext';

/**
 * Full attitude configuration.
 * modifier     — added to dice (higher = harder to beat target)
 * fortuneDelta — net fortune dice to add to the roll
 * misfortDelta — net misfortune dice to add to the roll
 * blocked      — cannot attempt without changing circumstances
 */
export const ATTITUDE_CONFIG = {
  devoted: {
    label: 'Devoted',
    modifier: 0, fortuneDelta: 1, misfortDelta: 0, blocked: false,
    note: 'Fortune on your roll.',
  },
  friendly: {
    label: 'Friendly',
    modifier: 0, fortuneDelta: 1, misfortDelta: 0, blocked: false,
    note: 'Fortune on your roll.',
  },
  cooperative: {
    label: 'Cooperative',
    modifier: 0, fortuneDelta: 0, misfortDelta: 0, blocked: false,
    note: 'Normal roll.',
  },
  indifferent: {
    label: 'Indifferent',
    modifier: 1, fortuneDelta: 0, misfortDelta: 0, blocked: false,
    note: '+1 to both dice.',
  },
  uncooperative: {
    label: 'Uncooperative',
    modifier: 1, fortuneDelta: 0, misfortDelta: 1, blocked: false,
    note: '+1 to both dice, Misfortune.',
  },
  hostile: {
    label: 'Hostile',
    modifier: 0, fortuneDelta: 0, misfortDelta: 0, blocked: true,
    note: 'Cannot attempt normally.',
  },
  hatred: {
    label: 'Hatred',
    modifier: 0, fortuneDelta: 0, misfortDelta: 0, blocked: true,
    note: 'Cannot attempt normally.',
  },
};

// ─── Settings registration ────────────────────────────────────────────────────

/**
 * Register the world setting that holds the pending context.
 * Must be called inside Hooks.once('init').
 */
export function registerSettings() {
  game.settings.register('legends', SETTING_KEY, {
    name: 'Pending Social Check Context',
    scope: 'world',
    config: false,
    type: Object,
    default: null,
  });
}

// ─── Context storage (GM only) ────────────────────────────────────────────────

/**
 * Open a GM-only dialog to pick an attitude and store it as pending context.
 * The player's roll will pick it up silently when they next roll a social skill.
 * @param {string} [preAttitude='indifferent'] - Pre-select this attitude in the dialog.
 */
export async function openGMContextSetter(preAttitude = 'indifferent') {
  if (!game.user.isGM) {
    ui.notifications.warn('Only the GM can set social check context.');
    return;
  }

  const options = Object.entries(ATTITUDE_CONFIG)
    .map(([key, cfg]) => {
      const sel = key === preAttitude ? ' selected' : '';
      const blocked = cfg.blocked ? ' [BLOCKED]' : '';
      return `<option value="${key}"${sel}>${cfg.label}${blocked} — ${cfg.note}</option>`;
    })
    .join('');

  const attitude = await foundry.applications.api.DialogV2.prompt({
    window: { title: 'Set Social Check Context (GM Only)' },
    content: `
      <p style="margin:0 0 8px;font-size:12px;color:#555;">
        The attitude modifier will be applied silently to the next social skill roll.
        The player will not see the attitude label — only the numeric effect.
      </p>
      <div class="form-group">
        <label>NPC Attitude toward party</label>
        <select name="attitude" style="width:100%">${options}</select>
      </div>
      <p style="margin:8px 0 0;font-size:11px;color:#888;">
        Context expires automatically after 1 minute if unused.
      </p>
    `,
    ok: {
      label: 'Set Context',
      callback: (event, button) => button.form.elements.attitude.value,
    },
    rejectClose: false,
  });

  if (!attitude) return;

  // Only GMs can write world settings — this is safe.
  await game.settings.set('legends', SETTING_KEY, {
    attitude,
    setAt: Date.now(),
  });

  const cfg = ATTITUDE_CONFIG[attitude];
  ui.notifications.info(`Social context set: ${cfg.label}. Applies to the next social skill roll.`);
}

// ─── Context resolution ───────────────────────────────────────────────────────

/**
 * Read the pending world-setting context (GM set).
 * Does NOT clear it — players cannot clear world settings.
 * Returns the ATTITUDE_CONFIG entry + raw attitude key, or null if expired/unset.
 */
function _readPendingContext() {
  let raw;
  try {
    raw = game.settings.get('legends', SETTING_KEY);
  } catch {
    return null;
  }
  if (!raw?.attitude) return null;
  if ((Date.now() - (raw.setAt ?? 0)) > CONTEXT_TTL_MS) return null;

  const cfg = ATTITUDE_CONFIG[raw.attitude];
  return cfg ? { attitude: raw.attitude, ...cfg } : null;
}

/**
 * Scan the current user's targeted tokens for an NPC with an attitude set.
 * Returns the first match as a context object, or null.
 */
function _readTargetContext() {
  for (const token of (game.user.targets ?? [])) {
    const actor = token.actor;
    if (!actor || actor.type !== 'npc') continue;
    const attitude = actor.system?.attitude;
    if (attitude && ATTITUDE_CONFIG[attitude]) {
      return {
        attitude,
        ...ATTITUDE_CONFIG[attitude],
        sourceTokenName: token.name,
      };
    }
  }
  return null;
}

/**
 * Resolve the social context to apply for the upcoming roll.
 * Priority: targeted token attitude > GM pending context.
 * Returns context object or null.
 */
export function resolveSocialContext() {
  return _readTargetContext() ?? _readPendingContext();
}

// ─── Roll data mutation ───────────────────────────────────────────────────────

/**
 * Mutate a rollData object (from rollSkillCheck) with social context effects.
 * @param {object} rollData
 * @param {object} context - from resolveSocialContext()
 */
export function applyContextToRollData(rollData, context) {
  rollData.modifier     = (rollData.modifier ?? 0)     + context.modifier;
  rollData.fortune      = (rollData.fortune ?? 0)       + context.fortuneDelta;
  rollData.misfortune   = (rollData.misfortune ?? 0)    + context.misfortDelta;
  rollData.socialContext = context; // stored for the GM whisper
}

// ─── GM whisper ───────────────────────────────────────────────────────────────

/**
 * Post a GM-only whisper summarising the social context that was applied.
 * Fire-and-forget — not awaited in the roll flow.
 * @param {Actor} actor
 * @param {string} skillKey
 * @param {object} context
 */
export function whisperSocialContext(actor, skillKey, context) {
  const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
  if (!gmIds.length) return;

  const source = context.sourceTokenName
    ? ` (from targeted token: <em>${context.sourceTokenName}</em>)`
    : ' (from pending GM context)';

  const effects = [];
  if (context.modifier)      effects.push(`+${context.modifier} to both dice`);
  if (context.fortuneDelta)  effects.push(`Fortune ×${context.fortuneDelta}`);
  if (context.misfortDelta)  effects.push(`Misfortune ×${context.misfortDelta}`);
  if (context.blocked)       effects.push('<strong>BLOCKED</strong> — allowed via GM override');
  const effectStr = effects.length ? effects.join(', ') : 'no mechanical effect (baseline)';

  const skillLabel = skillKey.charAt(0).toUpperCase() + skillKey.slice(1);

  ChatMessage.create({
    content: `
      <div style="border:1px solid #a00;padding:6px 8px;border-radius:4px;background:#fff5f5;">
        <strong>[GM] Social Check Context Applied</strong><br>
        ${actor.name} is rolling <em>${skillLabel}</em>${source}.<br>
        Attitude: <strong>${context.label}</strong> — ${effectStr}
      </div>
    `,
    whisper: gmIds,
    speaker: { alias: 'Legends System' },
  });
}

/**
 * If the GM manually clears the pending context (e.g., encounter ended).
 * Only callable from GM client.
 */
export async function clearPendingContext() {
  if (!game.user.isGM) return;
  await game.settings.set('legends', SETTING_KEY, null);
  ui.notifications.info('Social check context cleared.');
}
