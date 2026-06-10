/**
 * Legends D8 — Item Identification System
 *
 * Magic items are unidentified until a character succeeds on an Arcana or
 * Religion skill check against the item's identification difficulty.
 *
 * Difficulty tiers:
 *   normal — 1 success required, no die modifier
 *   hard   — 2 successes required, no die modifier
 *   expert — 2 successes required, +1 added to each die (harder)
 *   master — 2 successes required, +2 added to each die (very hard)
 */
import { showSkillCheckDialog } from './dice.mjs';
import { SKILL_ATTRIBUTE_KEYS } from './skill-utils.mjs';

/** Identification difficulty tiers */
export const IDENTIFY_DC = {
  normal: { label: 'Normal',  successesRequired: 1, modifier: 0 },
  hard:   { label: 'Hard',    successesRequired: 2, modifier: 0 },
  expert: { label: 'Expert',  successesRequired: 2, modifier: 1 },
  master: { label: 'Master',  successesRequired: 2, modifier: 2 },
};

/** Default unidentified display names by item type */
export const DEFAULT_UNIDENTIFIED_NAMES = {
  weapon:    'Unidentified Weapon',
  armor:     'Unidentified Armor',
  shield:    'Unidentified Shield',
  equipment: 'Unidentified Magic Item',
  scroll:    'Unidentified Scroll',
  rod:       'Unidentified Rod',
  staff:     'Unidentified Staff',
  wand:      'Unidentified Wand',
  ring:      'Unidentified Ring',
};

/**
 * Returns the name to display for the item.
 * For unidentified magic items returns unidentifiedName or a type default.
 * @param {object} item  Plain item data object (toObject()) or Item document
 */
export function getDisplayName(item) {
  const sys = item.system ?? {};
  if (!sys.isMagical || sys.identified !== false) return item.name;
  return String(sys.unidentifiedName || '').trim()
    || DEFAULT_UNIDENTIFIED_NAMES[item.type]
    || 'Unidentified Item';
}

/**
 * Open the identification dialog for an item, then run the chosen skill check.
 * @param {Actor} actor  The actor attempting identification
 * @param {Item}  item   The item to identify
 */
export async function openIdentifyDialog(actor, item) {
  const dcKey = item.system?.identifyDC || 'normal';
  const dc = IDENTIFY_DC[dcKey] ?? IDENTIFY_DC.normal;
  const displayName = getDisplayName(item);

  const difficultyText = dc.modifier > 0
    ? `${dc.label} — ${dc.successesRequired} success${dc.successesRequired > 1 ? 'es' : ''} required, +${dc.modifier} penalty per die`
    : `${dc.label} — ${dc.successesRequired} success${dc.successesRequired > 1 ? 'es' : ''} required`;

  const skillChoice = await foundry.applications.api.DialogV2.wait({
    window: { title: `Identify: ${displayName}` },
    position: { width: 440 },
    content: `
      <div style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${item.img}" width="44" height="44" style="border: none; object-fit: contain; flex-shrink: 0;"/>
          <div>
            <div style="font-weight: bold; font-size: 14px;">${Handlebars.escapeExpression(displayName)}</div>
            <div style="font-size: 12px; color: #555; margin-top: 3px;">Difficulty: ${difficultyText}</div>
          </div>
        </div>
        <div style="font-size: 13px; color: #444; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          Choose a skill to attempt identification. A successful roll reveals the item's true name and properties.
        </div>
      </div>
    `,
    buttons: [
      {
        action: 'arcane',
        label: '<i class="fas fa-book"></i> Roll Arcana (INT)',
        default: true,
        callback: () => 'arcane',
      },
      {
        action: 'religion',
        label: '<i class="fas fa-pray"></i> Roll Religion (WIS)',
        callback: () => 'religion',
      },
      {
        action: 'cancel',
        label: 'Cancel',
        callback: () => 'cancel',
      },
    ],
    rejectClose: false,
  });

  if (!skillChoice || skillChoice === 'cancel') return;
  await _rollIdentifyCheck(actor, item, skillChoice, dc);
}

/**
 * @private  Perform the actual skill roll and apply the result.
 */
async function _rollIdentifyCheck(actor, item, skillKey, dc) {
  const attrKey = SKILL_ATTRIBUTE_KEYS[skillKey] ?? 'intelligence';

  // Prefer feat-effective values when available
  const rawAttr = actor.system.attributesEffective?.[attrKey] ?? actor.system.attributes?.[attrKey];
  const attrValue = typeof rawAttr === 'object' ? (rawAttr?.value ?? 2) : (Number(rawAttr) || 2);

  const rawSkill = actor.system.skillsEffective?.[skillKey] ?? actor.system.skills?.[skillKey] ?? 0;
  const skillValue = typeof rawSkill === 'object' ? (rawSkill?.value ?? 0) : (Number(rawSkill) || 0);

  const attrLabel = attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
  const skillLabel = skillKey === 'arcane' ? 'Arcana' : 'Religion';

  await showSkillCheckDialog({
    actor,
    skillKey,
    attrValue,
    skillValue,
    attrLabel,
    skillLabel,
    defaultModifier: dc.modifier,
    defaultApplyToAttr: true,
    defaultApplyToSkill: true,
    defaultFortune: 0,
    defaultMisfortune: 0,
    onRollComplete: async (result) => {
      if (!result) return;
      const successes = result.successes ?? 0;
      if (successes >= dc.successesRequired) {
        await item.update({ 'system.identified': true });
        ui.notifications.info(`${actor.name} successfully identified "${item.name}"!`);
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="d8-identify-success" style="padding: 4px 8px;">
            <i class="fas fa-check-circle" style="color: #22c55e;"></i>
            <strong>${actor.name}</strong> identified <strong>${item.name}</strong>
            (${successes} success${successes !== 1 ? 'es' : ''}).
          </div>`,
        });
      } else {
        ui.notifications.warn(
          `Identification failed — ${successes} of ${dc.successesRequired} successes needed. Try again when ready.`
        );
      }
    },
  });
}
