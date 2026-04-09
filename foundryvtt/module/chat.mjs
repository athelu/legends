/**
 * Legends D8 TTRPG Chat Message Helpers
 */

/**
 * Create a chat card for an item
 */
export async function createItemChatCard(item, options = {}) {
  const speaker = ChatMessage.getSpeaker({ actor: item.actor });
  const rollMode = game.settings.get('core', 'rollMode');
  const itemAppliesEffects = (item.system.appliesEffects || [])
    .map((effectRef) => ({
      effectId: effectRef.effectId || '',
      operation: effectRef.operation === 'remove' ? 'remove' : 'apply',
      label: effectRef.operation === 'remove'
        ? `Remove ${effectRef.effectId || ''}`
        : (effectRef.effectId || ''),
      paramsJson: JSON.stringify(effectRef.params || {}),
      sourceType: 'item',
      actorId: item.actor?.id || '',
      itemId: item.id || '',
      itemName: item.name || ''
    }))
    .filter((effectRef) => effectRef.effectId);
  
  const content = await renderTemplate('systems/legends/templates/chat/item-card.hbs', {
    item: item,
    system: item.system,
    description: await TextEditor.enrichHTML(item.system.description?.value || "", { async: true }),
    itemAppliesEffects
  });
  
  return ChatMessage.create({
    speaker,
    rollMode,
    content,
    ...options
  });
}

/**
 * Create a chat card for a roll result
 */
export async function createRollChatCard(result, options = {}) {
  const speaker = options.speaker || ChatMessage.getSpeaker();
  const rollMode = game.settings.get('core', 'rollMode');
  
  return ChatMessage.create({
    speaker,
    rollMode,
    content: result.html || result.content,
    ...options
  });
}
