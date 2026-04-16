const VISION_TEXT_ITEM_TYPES = new Set(['ancestry', 'trait', 'feat', 'ability', 'effect']);
const LIGHT_SOURCE_ITEM_TYPES = new Set(['equipment']);

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRangeFromText(text, fallback = 0) {
  const normalized = normalizeText(text);
  if (!normalized) return Math.max(0, fallback);

  const match = normalized.match(/(\d+)\s*(?:ft\.?|feet|foot)/i)
    || normalized.match(/(\d+)[-\s]*(?:foot|feet)/i);

  if (!match) return Math.max(0, fallback);
  return Math.max(0, Number.parseInt(match[1], 10) || fallback);
}

function getItemVisionText(item) {
  if (!item || !VISION_TEXT_ITEM_TYPES.has(item.type)) return '';

  const system = item.system || {};
  return [
    item.name,
    system.senses,
    system.specialAbilities,
    system.benefits,
    system.mechanicalEffects,
    system.effect,
    system.notes,
    system.description?.value,
  ].map(normalizeText).filter(Boolean).join('\n');
}

function getActorDetectionModeId(preferredIds) {
  const ids = Array.isArray(preferredIds) ? preferredIds : [preferredIds];
  const modes = CONFIG?.Canvas?.detectionModes;
  if (!modes) return ids[0] || null;

  for (const preferredId of ids) {
    if (!preferredId) continue;

    if (modes instanceof Map) {
      if (modes.has(preferredId)) return preferredId;
      continue;
    }

    if (Array.isArray(modes)) {
      if (modes.some((mode) => mode?.id === preferredId)) return preferredId;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(modes, preferredId)) {
      return preferredId;
    }

    if (Object.values(modes).some((mode) => mode?.id === preferredId)) {
      return preferredId;
    }
  }

  return null;
}

export function buildActorVisionProfile(actor) {
  const systemVision = actor?.system?.vision || {};
  const profile = {
    lowLight: Boolean(systemVision.lowLight),
    darkvision: Math.max(0, toNumber(systemVision.darkvision, 0)),
    blindsight: Math.max(0, toNumber(systemVision.blindsight, 0)),
    tremorsense: Math.max(0, toNumber(systemVision.tremorsense, 0)),
    perfectSight: Math.max(0, toNumber(systemVision.perfectSight, 0)),
    brightLight: 0,
    dimLight: 0,
  };

  const actorText = [
    actor?.system?.ancestryEffects?.senses,
    actor?.system?.ancestryEffects?.specialAbilities,
  ].map(normalizeText).filter(Boolean).join('\n');

  if (/low[\s-]*light vision/i.test(actorText)) {
    profile.lowLight = true;
  }
  if (/darkvision/i.test(actorText)) {
    profile.darkvision = Math.max(profile.darkvision, extractRangeFromText(actorText, 60));
  }
  if (/(?:blindsight|blindsense)/i.test(actorText)) {
    profile.blindsight = Math.max(profile.blindsight, extractRangeFromText(actorText, 0));
  }
  if (/tremorsense/i.test(actorText)) {
    profile.tremorsense = Math.max(profile.tremorsense, extractRangeFromText(actorText, 0));
  }
  if (/perfect sight/i.test(actorText)) {
    profile.perfectSight = Math.max(profile.perfectSight, extractRangeFromText(actorText, profile.darkvision));
  }

  for (const item of actor?.items || []) {
    const text = getItemVisionText(item);

    if (text) {
      if (/low[\s-]*light vision/i.test(text)) {
        profile.lowLight = true;
      }
      if (/darkvision/i.test(text)) {
        profile.darkvision = Math.max(profile.darkvision, extractRangeFromText(text, 60));
      }
      if (/blindsight/i.test(text)) {
        profile.blindsight = Math.max(profile.blindsight, extractRangeFromText(text, 0));
      }
      if (/blindsense/i.test(text)) {
        profile.blindsight = Math.max(profile.blindsight, extractRangeFromText(text, 10));
      }
      if (/tremorsense/i.test(text)) {
        profile.tremorsense = Math.max(profile.tremorsense, extractRangeFromText(text, 0));
      }
      if (/perfect sight/i.test(text)) {
        profile.perfectSight = Math.max(profile.perfectSight, extractRangeFromText(text, profile.darkvision));
      }
    }

    const carryState = String(item.system?.encumbrance?.carryState || '').trim().toLowerCase();
    const emitsLight = Boolean(item.system?.equipped) || carryState === 'equipped';
    if (LIGHT_SOURCE_ITEM_TYPES.has(item.type) && emitsLight) {
      const bright = Math.max(0, toNumber(item.system?.brightLight, 0));
      const dimExtension = Math.max(0, toNumber(item.system?.dimLight, 0));
      if (bright > 0 || dimExtension > 0) {
        profile.brightLight = Math.max(profile.brightLight, bright);
        profile.dimLight = Math.max(profile.dimLight, bright + dimExtension);
      }
    }
  }

  const sightRange = Math.max(profile.darkvision, profile.perfectSight, 0);
  const detectionModes = [];

  const basicSight = getActorDetectionModeId('basicSight') || 'basicSight';
  detectionModes.push({ id: basicSight, enabled: true, range: sightRange });

  const seeAll = getActorDetectionModeId(['seeAll', 'senseAll']);
  if (seeAll && profile.blindsight > 0) {
    detectionModes.push({ id: seeAll, enabled: true, range: profile.blindsight });
  }

  const feelTremor = getActorDetectionModeId(['feelTremor', 'tremor']);
  if (feelTremor && profile.tremorsense > 0) {
    detectionModes.push({ id: feelTremor, enabled: true, range: profile.tremorsense });
  }

  const seeInvisibility = getActorDetectionModeId(['seeInvisibility', 'senseInvisibility']);
  if (seeInvisibility && profile.perfectSight > 0) {
    detectionModes.push({ id: seeInvisibility, enabled: true, range: profile.perfectSight });
  }

  return {
    ...profile,
    sightEnabled: true,
    sightRange,
    visionMode: sightRange > 0 ? 'darkvision' : 'basic',
    detectionModes,
  };
}

function sameDetectionModes(currentModes = [], nextModes = []) {
  const normalizeModes = (modes) => JSON.stringify(
    (Array.isArray(modes) ? modes : [])
      .map((mode) => ({
        id: String(mode?.id || ''),
        enabled: Boolean(mode?.enabled),
        range: Math.max(0, toNumber(mode?.range, 0)),
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  );

  return normalizeModes(currentModes) === normalizeModes(nextModes);
}

function buildPrototypeTokenUpdate(actor, profile) {
  const currentSight = actor.prototypeToken?.sight || {};
  const currentLight = actor.prototypeToken?.light || {};
  const currentDetectionModes = actor.prototypeToken?.detectionModes || [];
  const updates = {};

  if (Boolean(currentSight.enabled) !== Boolean(profile.sightEnabled)) {
    updates['prototypeToken.sight.enabled'] = profile.sightEnabled;
  }
  if (Math.max(0, toNumber(currentSight.range, 0)) !== profile.sightRange) {
    updates['prototypeToken.sight.range'] = profile.sightRange;
  }
  if (String(currentSight.visionMode || 'basic') !== String(profile.visionMode || 'basic')) {
    updates['prototypeToken.sight.visionMode'] = profile.visionMode;
  }
  if (Math.max(0, toNumber(currentLight.bright, 0)) !== profile.brightLight) {
    updates['prototypeToken.light.bright'] = profile.brightLight;
  }
  if (Math.max(0, toNumber(currentLight.dim, 0)) !== profile.dimLight) {
    updates['prototypeToken.light.dim'] = profile.dimLight;
  }
  if (!sameDetectionModes(currentDetectionModes, profile.detectionModes)) {
    updates['prototypeToken.detectionModes'] = profile.detectionModes;
  }

  return updates;
}

function buildSceneTokenUpdate(tokenDoc, profile) {
  const currentSight = tokenDoc.sight || {};
  const currentLight = tokenDoc.light || {};
  const currentDetectionModes = tokenDoc.detectionModes || [];
  const update = { _id: tokenDoc.id };
  let changed = false;

  if (Boolean(currentSight.enabled) !== Boolean(profile.sightEnabled)
    || Math.max(0, toNumber(currentSight.range, 0)) !== profile.sightRange
    || String(currentSight.visionMode || 'basic') !== String(profile.visionMode || 'basic')) {
    update.sight = {
      ...currentSight,
      enabled: profile.sightEnabled,
      range: profile.sightRange,
      visionMode: profile.visionMode,
    };
    changed = true;
  }

  if (Math.max(0, toNumber(currentLight.bright, 0)) !== profile.brightLight
    || Math.max(0, toNumber(currentLight.dim, 0)) !== profile.dimLight) {
    update.light = {
      ...currentLight,
      bright: profile.brightLight,
      dim: profile.dimLight,
    };
    changed = true;
  }

  if (!sameDetectionModes(currentDetectionModes, profile.detectionModes)) {
    update.detectionModes = profile.detectionModes;
    changed = true;
  }

  return changed ? update : null;
}

export async function syncActorTokenVision(actor) {
  if (!actor || (actor.type !== 'character' && actor.type !== 'npc')) return;

  const profile = buildActorVisionProfile(actor);
  const actorUpdates = buildPrototypeTokenUpdate(actor, profile);

  if (Object.keys(actorUpdates).length > 0) {
    await actor.update(actorUpdates, { legendsSkipVisionSync: true, render: false });
  }

  for (const scene of game.scenes || []) {
    const tokenUpdates = [];
    for (const tokenDoc of scene.tokens || []) {
      if (tokenDoc.actorId !== actor.id) continue;
      if (!tokenDoc.actorLink) continue;

      const update = buildSceneTokenUpdate(tokenDoc, profile);
      if (update) tokenUpdates.push(update);
    }

    if (tokenUpdates.length > 0) {
      await scene.updateEmbeddedDocuments('Token', tokenUpdates, { render: false });
    }
  }
}

export function initializeVisionHooks() {
  Hooks.on('updateActor', async (actor, diff, options) => {
    if (options?.legendsSkipVisionSync) return;
    if (!actor || (actor.type !== 'character' && actor.type !== 'npc')) return;
    await syncActorTokenVision(actor);
  });

  Hooks.on('createItem', async (item) => {
    const actor = item?.actor;
    if (!actor) return;
    await syncActorTokenVision(actor);
  });

  Hooks.on('updateItem', async (item) => {
    const actor = item?.actor;
    if (!actor) return;
    await syncActorTokenVision(actor);
  });

  Hooks.on('deleteItem', async (item) => {
    const actor = item?.actor;
    if (!actor) return;
    await syncActorTokenVision(actor);
  });
}
