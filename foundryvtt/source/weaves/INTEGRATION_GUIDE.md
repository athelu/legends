# Weave Classification Integration Guide

This guide shows how to integrate the delivery method and tag detection systems into `build_weaves_pack.py`.

## Overview

The classification system has two orthogonal components:

1. **Delivery Method** (single value) - How the weave mechanically resolves
   - `"attack"` - Attack roll vs defense
   - `"save"` - Saving throw
   - `"automatic"` - No roll/save required

2. **Tags** (array) - What the weave does thematically/mechanically
   - Thematic: `necromantic`, `forbidden`, `illusion`, `summoning`, etc.
   - Mechanical: `healing`, `offensive`, `defensive`, `control`, etc.
   - Targeting: `aoe`, `single-target`, `touch`, `ranged`, etc.
   - Special: `zone`, `wall`, `construct`, `ritual`, etc.

## Integration Steps

### 1. Import the Detectors

Add these imports at the top of `build_weaves_pack.py`:

```python
import sys
from pathlib import Path

# Add source/weaves directory to path
weave_tools_path = Path(__file__).parent.parent / 'source' / 'weaves'
sys.path.insert(0, str(weave_tools_path))

# Import detectors
from delivery_method_detector import detect_delivery_method
from tag_detector import detect_all_tags
```

### 2. Apply Detection During Parsing

In the `parse_weaves_md()` function, after creating each item but before saving:

```python
def parse_weaves_md(ttrpg_dir, source_dir=None):
    # ... existing parsing code that creates items list ...
    
    for item in items:
        # Auto-detect delivery method
        delivery_method = detect_delivery_method(item)
        item['system']['deliveryMethod'] = delivery_method
        
        # Auto-detect tags
        tags = detect_all_tags(item)
        item['system']['tags'] = tags
        
        # Optional: Clean up name by removing **[Tag]** markers
        name = item['name']
        cleaned_name = re.sub(r'\\s*\\*\\*\\[([^\\]]+)\\]\\*\\*', '', name)
        if cleaned_name != name:
            item['name'] = cleaned_name.strip()
            print(f"  Cleaned: {name} -> {cleaned_name}")
        
        # Log classification
        print(f"  {item['name']:40} {delivery_method:12} tags: {', '.join(tags)}")
        
        # ... continue with existing save logic ...
```

### 3. Expected Output

When you run `npm run pack:weaves`, you should see output like:

```
Processing: c:\repos\legends\ttrpg\weaves(a-g).md

Acid Blast                                save-damage  tags: aoe, offensive, ranged
Bind the Fallen **[Necromantic]**         automatic    tags: forbidden, necromantic, ritual, summoning, touch
  Cleaned: Bind the Fallen **[Necromantic]** -> Bind the Fallen
Fear                                      save-effect  tags: control, ranged
Fire Bolt                                 attack       tags: offensive, ranged, single-target
Fireball                                  save-damage  tags: aoe, offensive, ranged
Floating Lights                           automatic    tags: ranged, utility
Healing Burst                             automatic    tags: healing, ranged, utility
Light                                     automatic    tags: touch, utility
Sleep                                     save-effect  tags: aoe, control, ranged

Processed 10 weaves total.
```

## Testing Classification

### Test Individual Weaves

Create a test script to verify classification:

```python
# test_classification.py
from delivery_method_detector import detect_delivery_method
from tag_detector import detect_all_tags
import json

# Load a weave JSON file
with open('foundryvtt/packs/weaves/_source/sleep.json') as f:
    weave = json.load(f)

# Test detection
delivery = detect_delivery_method(weave)
tags = detect_all_tags(weave)

print(f"Weave: {weave['name']}")
print(f"Delivery Method: {delivery}")
print(f"Tags: {', '.join(tags)}")
```

### Manual Verification

After rebuilding the pack, check a few weaves in FoundryVTT:

1. Open the Weaves compendium
2. Right-click a weave → "Edit"
3. Check the Data tab for:
   - `system.deliveryMethod` field
   - `system.tags` array

## Edge Cases

### Multiple Delivery Patterns

Some weaves may have multiple phases:

```json
// Wall of Flame - creates zone (automatic) but creatures take damage (save)
{
  "name": "Wall of Flame",
  "deliveryMethod": "save",  // Primary mechanic is saving throw
  "tags": ["defensive", "offensive", "wall", "zone", "ranged"]
}
```

The detector chooses based on primary mechanic. If a weave requires a save for its main effect, use `"save"`.

### Ambiguous Tags

If uncertain whether to include a tag:

- **Include if obvious** - "Fireball" clearly has `offensive` and `aoe`
- **Exclude if marginal** - Don't tag every weave with damage as `offensive`
- **Use description keywords** - If the word "heal" appears, add `healing` tag

### Manual Override

For weaves that defy auto-detection, manually edit the JSON:

```json
{
  "name": "Weird Edge Case",
  "system": {
    "deliveryMethod": "automatic",  // Override auto-detected value
    "tags": ["utility", "special"]   // Override auto-detected tags
  }
}
```

After rebuilding the pack, manual changes will be preserved as long as the markdown definition doesn't change.

## FoundryVTT Usage

### Display Tags as Badges

In the weave card/sheet template:

```handlebars
{{#if system.tags.length}}
<div class="weave-tags">
  {{#each system.tags}}
    <span class="tag tag-{{this}}">{{this}}</span>
  {{/each}}
</div>
{{/if}}
```

Add CSS for tag styling:

```css
.weave-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.tag-necromantic { background: #9d4edd; color: white; }
.tag-forbidden { background: #d00000; color: white; }
.tag-healing { background: #06ffa5; color: black; }
.tag-offensive { background: #ff5400; color: white; }
.tag-defensive { background: #4361ee; color: white; }
.tag-utility { background: #6c757d; color: white; }
.tag-control { background: #f72585; color: white; }
/* ... more tag colors ... */
```

### Filter by Tags

In the compendium browser:

```javascript
// Add tag filters to compendium
const tagFilters = {
  thematic: ['necromantic', 'forbidden', 'illusion', 'summoning'],
  mechanical: ['healing', 'offensive', 'defensive', 'utility'],
  targeting: ['aoe', 'single-target', 'touch', 'ranged']
};

// Filter weaves by selected tags
function filterWeavesByTags(weaves, selectedTags) {
  if (selectedTags.length === 0) return weaves;
  
  return weaves.filter(weave => {
    return selectedTags.every(tag => weave.system.tags.includes(tag));
  });
}
```

### Warning for Restricted Tags

Show warnings for dangerous weaves:

```javascript
// Check for forbidden tag when casting
async function castWeave(weave) {
  if (weave.system.tags.includes('forbidden')) {
    const confirmed = await Dialog.confirm({
      title: 'Forbidden Knowledge',
      content: '<p>This weave contains dangerous or morally questionable magic.</p><p>Are you sure you want to cast it?</p>'
    });
    
    if (!confirmed) return;
  }
  
  // Continue with normal casting...
}
```

### Delivery Method Routing

Use delivery method to route to correct workflow:

```javascript
async function handleWeaveCast(weave, actor) {
  const method = weave.system.deliveryMethod;
  
  switch (method) {
    case 'attack':
      return await attackRollWorkflow(weave, actor);
    
    case 'save':
      // Check if damage or effect type
      const hasDamage = weave.system.damage.base > 0;
      return await savingThrowWorkflow(weave, actor, hasDamage);
    
    case 'automatic':
      return await automaticCastWorkflow(weave, actor);
    
    default:
      console.warn(`Unknown delivery method: ${method}`);
      return await automaticCastWorkflow(weave, actor);
  }
}
```

## Benefits

1. **Searchability** - Players can search for "healing" or "necromantic" weaves
2. **Filtering** - GM can hide forbidden/necromantic weaves for certain campaigns
3. **Visual Identification** - Color-coded badges make weave types obvious
4. **Workflow Routing** - Delivery method ensures correct button flow
5. **Content Warnings** - Forbidden tag triggers confirmation dialogs
6. **Auto-Organization** - Build script automatically classifies all weaves

## Maintenance

When adding new weaves:

1. Use markdown format as usual
2. Add `**[Necromantic]**` or other explicit tags to title if needed
3. Run `npm run pack:weaves`
4. Detection automatically classifies the weave
5. Manual override in JSON only if auto-detection fails

When adding new tags:

1. Add definition to `tags-schema.json`
2. Add detection logic to `tag_detector.py`
3. Add CSS styling for the new tag
4. Rebuild all weaves to apply new tag

## Next Steps

1. ✅ Create delivery method detector
2. ✅ Create tag detector
3. ⬜ Integrate both into build_weaves_pack.py
4. ⬜ Rebuild all weaves with classification
5. ⬜ Update Foundry templates to display tags
6. ⬜ Add compendium filtering by tags
7. ⬜ Add warning dialogs for forbidden tags
8. ⬜ Update legends.mjs to route by delivery method
