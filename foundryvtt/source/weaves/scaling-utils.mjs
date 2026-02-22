/**
 * Utility functions for working with structured success scaling data
 * 
 * This file demonstrates how to:
 * 1. Parse markdown scaling text into structured format
 * 2. Read and use structured scaling data
 * 3. Calculate values based on net successes
 */

/**
 * Get the scaling entry for a given success level
 * @param {Object} scaling - The scaling object from weave.system.damage.scaling
 * @param {number} successLevel - The net successes achieved
 * @returns {Object|null} The scaling entry or null if not found
 */
export function getScalingEntry(scaling, successLevel) {
  if (!scaling || typeof scaling !== 'object') return null;
  
  const key = successLevel.toString();
  return scaling[key] || null;
}

/**
 * Check if effects should be applied at a given success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {boolean} Whether effects should be applied
 */
export function shouldApplyEffects(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  if (!scaling || Object.keys(scaling).length === 0) {
    // No scaling table - apply effects if margin > 0 (effect weaves)
    return successLevel > 0;
  }
  
  const entry = getScalingEntry(scaling, successLevel);
  if (!entry) {
    // No entry for this success level - use closest lower entry
    for (let i = successLevel; i >= 0; i--) {
      const fallbackEntry = getScalingEntry(scaling, i);
      if (fallbackEntry) {
        return fallbackEntry.appliesEffects === true;
      }
    }
    return false;
  }
  
  return entry.appliesEffects === true;
}

/**
 * Get the damage amount for a given success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {number} The damage amount
 */
export function getDamageForSuccessLevel(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  const entry = getScalingEntry(scaling, successLevel);
  
  if (!entry) return 0;
  
  if (typeof entry.damage === 'number') {
    return entry.damage;
  }
  
  if (entry.damage && typeof entry.damage === 'object') {
    return entry.damage.amount || 0;
  }
  
  return 0;
}

/**
 * Get the healing amount for a given success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {number} The healing amount
 */
export function getHealingForSuccessLevel(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  const entry = getScalingEntry(scaling, successLevel);
  
  return entry?.healing || 0;
}

/**
 * Get the duration for a given success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {Object|string|null} Duration object {value, unit} or text string
 */
export function getDurationForSuccessLevel(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  const entry = getScalingEntry(scaling, successLevel);
  
  return entry?.duration || null;
}

/**
 * Format duration for display
 * @param {Object|string} duration - Duration from scaling entry
 * @returns {string} Formatted duration text
 */
export function formatDuration(duration) {
  if (!duration) return 'instantaneous';
  
  if (typeof duration === 'string') {
    return duration;
  }
  
  if (duration.value && duration.unit) {
    const plural = duration.value !== 1 ? 's' : '';
    return `${duration.value} ${duration.unit}${plural}`;
  }
  
  return 'unknown';
}

/**
 * Get the area effect for a given success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {Object|null} Area object {shape, size} or null
 */
export function getAreaForSuccessLevel(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  const entry = getScalingEntry(scaling, successLevel);
  
  return entry?.area || null;
}

/**
 * Format area for display
 * @param {Object} area - Area from scaling entry
 * @returns {string} Formatted area text
 */
export function formatArea(area) {
  if (!area) return '';
  
  const { shape, size, unit = 'feet' } = area;
  
  switch (shape) {
    case 'radius':
      return `${size}-foot radius`;
    case 'cube':
      return `${size}-foot cube`;
    case 'square':
      return `${size}-foot square`;
    case 'line':
      return `${size}-foot line`;
    case 'cone':
      return `${size}-foot cone`;
    case 'sphere':
      return `${size}-foot sphere`;
    default:
      return `${size} ${unit} ${shape}`;
  }
}

/**
 * Get the range for a given success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {Object|null} Range object {value, unit} or null
 */
export function getRangeForSuccessLevel(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  const entry = getScalingEntry(scaling, successLevel);
  
  return entry?.range || null;
}

/**
 * Get the push distance for a given success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {number} Push distance in feet
 */
export function getPushDistanceForSuccessLevel(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  const entry = getScalingEntry(scaling, successLevel);
  
  return entry?.pushDistance?.distance || 0;
}

/**
 * Get special mechanics for a given success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {Array<string>} Array of special mechanics
 */
export function getSpecialMechanics(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  const entry = getScalingEntry(scaling, successLevel);
  
  return entry?.specialMechanics || [];
}

/**
 * Get a complete description of what happens at a success level
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {string} Full description
 */
export function getSuccessLevelDescription(weave, successLevel) {
  const scaling = weave.system?.damage?.scaling;
  const entry = getScalingEntry(scaling, successLevel);
  
  if (!entry) return `Success level ${successLevel}: No data`;
  
  const parts = [entry.description];
  
  // Add additional details
  if (entry.damage) {
    parts.push(`${entry.damage} damage`);
  }
  
  if (entry.healing) {
    parts.push(`heal ${entry.healing} HP`);
  }
  
  if (entry.duration) {
    parts.push(`Duration: ${formatDuration(entry.duration)}`);
  }
  
  if (entry.area) {
    parts.push(`Area: ${formatArea(entry.area)}`);
  }
  
  if (entry.pushDistance) {
    parts.push(`Push ${entry.pushDistance.distance} feet`);
  }
  
  if (entry.targetCount) {
    parts.push(`Affects ${entry.targetCount} target(s)`);
  }
  
  if (entry.specialMechanics && entry.specialMechanics.length > 0) {
    parts.push(`Special: ${entry.specialMechanics.join(', ')}`);
  }
  
  return parts.join(' | ');
}

/**
 * Get all success levels that exist in the scaling table
 * @param {Object} weave - The weave item
 * @returns {Array<number>} Sorted array of success levels
 */
export function getAvailableSuccessLevels(weave) {
  const scaling = weave.system?.damage?.scaling;
  if (!scaling) return [];
  
  return Object.keys(scaling)
    .map(k => parseInt(k))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
}

/**
 * Example: Create a detailed success table for display
 * @param {Object} weave - The weave item
 * @returns {string} HTML table of success levels
 */
export function createSuccessTable(weave) {
  const levels = getAvailableSuccessLevels(weave);
  
  if (levels.length === 0) {
    return '<p>No scaling information available.</p>';
  }
  
  let html = '<table class="success-scaling-table">';
  html += '<thead><tr><th>Net Successes</th><th>Effect</th></tr></thead>';
  html += '<tbody>';
  
  for (const level of levels) {
    const description = getSuccessLevelDescription(weave, level);
    const appliesEffects = shouldApplyEffects(weave, level);
    const rowClass = appliesEffects ? 'applies-effects' : '';
    
    html += `<tr class="${rowClass}">`;
    html += `<td>${level}</td>`;
    html += `<td>${description}</td>`;
    html += '</tr>';
  }
  
  html += '</tbody></table>';
  
  return html;
}

/**
 * Calculate duration in seconds from net successes
 * Useful for actual effect duration calculation
 * @param {Object} weave - The weave item
 * @param {number} successLevel - The net successes achieved
 * @returns {number} Duration in seconds, or -1 for permanent, 0 for instantaneous
 */
export function calculateDurationInSeconds(weave, successLevel) {
  const duration = getDurationForSuccessLevel(weave, successLevel);
  
  if (!duration) return 0;
  
  if (typeof duration === 'string') {
    // Parse common text strings
    if (duration === 'permanent' || duration === 'until dispelled') return -1;
    if (duration === 'instantaneous') return 0;
    if (duration === 'full effect') {
      // Look up base duration from weave description
      return parseBaseDuration(weave);
    }
    return 0;
  }
  
  if (duration.value && duration.unit) {
    const timeUnits = {
      'round': 6, // Combat round = 6 seconds
      'minute': 60,
      'hour': 3600,
      'day': 86400,
      'week': 604800,
      'month': 2592000,
      'year': 31536000
    };
    
    const multiplier = timeUnits[duration.unit] || 0;
    return duration.value * multiplier;
  }
  
  return 0;
}

/**
 * Helper to parse base duration from weave description
 * @param {Object} weave - The weave item
 * @returns {number} Duration in seconds
 */
function parseBaseDuration(weave) {
  const durationText = weave.system?.duration || '';
  
  // Parse common patterns
  const match = durationText.match(/(\d+)\s*(round|minute|hour|day)s?/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const timeUnits = {
      'round': 6,
      'minute': 60,
      'hour': 3600,
      'day': 86400
    };
    
    return value * (timeUnits[unit] || 60);
  }
  
  return 60; // Default to 1 minute
}

// Example usage in legends.mjs:
/*
import * as ScalingUtils from './scaling-utils.mjs';

// In calculateWeaveEffect:
const damage = ScalingUtils.getDamageForSuccessLevel(weave, casterSuccesses);
const healing = ScalingUtils.getHealingForSuccessLevel(weave, casterSuccesses);
const shouldApply = ScalingUtils.shouldApplyEffects(weave, casterSuccesses);
const pushDistance = ScalingUtils.getPushDistanceForSuccessLevel(weave, casterSuccesses);

// In effect application:
if (shouldApply && weave.system.appliesEffects) {
  const durationSeconds = ScalingUtils.calculateDurationInSeconds(weave, casterSuccesses);
  await effectEngine.applyEffect({
    target: defender,
    effect: effectRef.effectId,
    duration: durationSeconds,
    netSuccesses: margin
  });
}

// In chat card display:
const successTable = ScalingUtils.createSuccessTable(weave);
messageContent += successTable;
*/
