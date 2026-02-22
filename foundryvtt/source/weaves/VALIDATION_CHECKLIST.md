# Weave Validation Checklist

Use this checklist when creating or reviewing weaves to ensure all required properties are set correctly.

## ✅ Required Properties

### Item Level
- [ ] **name** - Display name is set and descriptive
- [ ] **type** - Set to "weave"
- [ ] **img** - Icon path is valid

### System Level
- [ ] **description.value** - Complete HTML formatted description
- [ ] **energyCost.primary.type** - Energy type selected from valid enum
- [ ] **energyCost.primary.cost** - Non-negative number
- [ ] **energyCost.supporting.type** - Energy type or empty string
- [ ] **energyCost.supporting.cost** - Non-negative number (0 if no supporting)
- [ ] **actionCost** - Set to 1, 2, or 3
- [ ] **weaveType** - Set to "simple", "complex", or "intricate"

## ✅ Targeting Properties

- [ ] **range** - Clear distance specified (Touch, Close 30ft, Medium 60ft, Long 120ft, etc.)
- [ ] **duration** - How long effect lasts (Instantaneous, 1 minute, 1 hour, etc.)
- [ ] **savingThrow** - Set correctly:
  - "will" for mental effects
  - "fortitude" for physical resilience
  - "reflex" for dodging/reactions
  - "none" or "" for automatic/attack weaves

## ✅ Classification

- [ ] **deliveryMethod** - Set to correct type:
  - "attack" - Caster rolls attack vs defense
  - "save" - Targets roll saving throws
  - "automatic" - No roll/save required
- [ ] **effectType** - Category selected (damage, healing, utility, control, buff, debuff)
- [ ] **tags** - Array populated with relevant keywords

## ✅ Damage Properties

### If Damage Weave (damage.base > 0)
- [ ] **damage.base** - Base damage value at success level 2
- [ ] **damage.type** - Damage type selected (fire, cold, lightning, acid, etc.)
- [ ] **damage.drInteraction** - Set correctly:
  - "full" for physical damage
  - "half" for energy damage
  - "none" for force/special damage
- [ ] **damage.scaling** - Has entries for success levels:
  - [ ] "0" - No/minimal effect
  - [ ] "1" - Reduced effect
  - [ ] "2" - Full/base effect
  - [ ] "3" - Enhanced effect
  - [ ] "4" - Greater effect
  - [ ] "5" - Maximum effect

### If Effect Weave (damage.base = 0)
- [ ] **damage.base** - Set to 0
- [ ] **damage.type** - Empty string
- [ ] **damage.drInteraction** - Empty string
- [ ] **damage.scaling** - Has duration/effect entries for each success level
- [ ] **appliesEffects** - Array populated with condition IDs

## ✅ Success Scaling Entries

For each entry in `damage.scaling`, verify:

- [ ] **description** (required) - Clear text description
- [ ] **appliesEffects** (if applicable) - Boolean indicating whether effects apply
- [ ] Properties match weave type:
  - Damage weaves: `damage` property
  - Healing weaves: `healing` property
  - Duration weaves: `duration` object
  - Area weaves: `area` property
  - Multi-target: `targetCount` property
  - Hybrid: Multiple properties combined

## ✅ Effects Configuration

- [ ] **appliesEffects** - Array format correct:
  ```json
  [{"effectId": "condition-name", "params": {}}]
  ```
- [ ] Effect IDs match compendium entries
- [ ] Effects only apply at appropriate success levels

## ✅ Consistency Checks

### Energy Costs
- [ ] Total cost = primary.cost + supporting.cost
- [ ] Primary type is never empty string
- [ ] Supporting cost is 0 if supporting type is empty
- [ ] Primary cost matches description
- [ ] Supporting cost matches description

### Action Cost & Weave Type
- [ ] actionCost matches weaveType:
  - simple → 1 action
  - complex → 2 actions
  - intricate → 3 actions
- [ ] Description states correct action count

### Delivery Method & Saving Throw
- [ ] If deliveryMethod = "attack" → savingThrow = "none" or ""
- [ ] If deliveryMethod = "save" → savingThrow is "will", "fortitude", or "reflex"
- [ ] If deliveryMethod = "automatic" → savingThrow = "none" or ""

### Damage Type & DR Interaction
- [ ] Physical damage (bludgeoning, piercing, slashing) → drInteraction = "full"
- [ ] Energy damage (fire, cold, lightning, acid, sonic) → drInteraction = "half"
- [ ] Force damage or special → drInteraction = "none"

## ✅ Tags Accuracy

### Thematic Tags
- [ ] "necromantic" - Only if deals with undead/death/souls
- [ ] "forbidden" - Only if dangerous/restricted knowledge
- [ ] "illusion" - Only if creates false sensory impressions
- [ ] "summoning" - Only if conjures creatures/entities
- [ ] "divination" - Only if reveals information
- [ ] "teleportation" - Only if involves instant movement

### Mechanical Tags
- [ ] "healing" - Only if restores HP
- [ ] "offensive" - If deals damage
- [ ] "defensive" - If provides protection
- [ ] "utility" - If non-combat functionality
- [ ] "buff" - If positive effects on allies
- [ ] "debuff" - If negative effects on enemies
- [ ] "control" - If impairs movement/actions

### Targeting Tags
- [ ] "aoe" - If has area effect (radius, cone, cube, line)
- [ ] "single-target" - If affects one creature only
- [ ] "multi-target" - If affects multiple specific creatures
- [ ] "self" - If only affects caster
- [ ] "touch" - If requires physical contact
- [ ] "ranged" - If works at distance

### Special Tags
- [ ] "zone" - If creates persistent area
- [ ] "wall" - If creates linear barrier
- [ ] "construct" - If creates temporary object
- [ ] "ritual" - If high cost or requires preparation
- [ ] "concentration" - If requires ongoing focus

## ✅ Description Quality

- [ ] All properties listed in description match data fields
- [ ] Energy costs correctly calculated and stated
- [ ] Range clearly specified
- [ ] Duration clearly specified
- [ ] Action cost stated
- [ ] Weaving roll attributes listed
- [ ] Effect mechanics explained clearly
- [ ] Saving throw type stated (if applicable)
- [ ] Damage type stated (if applicable)
- [ ] DR interaction stated (if applicable)
- [ ] Success scaling summarized

## ✅ Common Mistakes

- [ ] NOT using empty scaling object `{}` for effect weaves - should have entries
- [ ] NOT mixing damage and effect weaves - clarify primary purpose
- [ ] NOT using structured duration objects - use `{value: 10, unit: "minute"}`
- [ ] NOT setting appliesEffects boolean in scaling entries
- [ ] NOT cleaning up **[Tag]** markers from name after adding to tags array
- [ ] NOT matching deliveryMethod with actual mechanics
- [ ] NOT verifying tag applicability - only include relevant tags

## ✅ Testing Checklist

After creating weave:

- [ ] Build script parses without errors
- [ ] JSON validates against weave-base-schema.json
- [ ] Weave appears in compendium
- [ ] Icon displays correctly
- [ ] Description renders properly
- [ ] Energy costs display correctly
- [ ] Tags appear as badges (if implemented)
- [ ] Casting triggers correct workflow (attack/save/automatic)
- [ ] Success scaling works as expected
- [ ] Effects apply at correct success levels
- [ ] Damage calculation correct
- [ ] DR interaction functions properly

## Validation Commands

```bash
# Rebuild weaves from markdown
npm run pack:weaves

# Check for errors in specific weave
# (Manual inspection of JSON file)

# Validate JSON structure
# (Can use online JSON Schema validators with weave-schema.json)
```

## Example Validation: Fireball

```
✅ name: "Fireball"
✅ type: "weave"
✅ img: "icons/magic/abjuration/abjuration-purple.webp"
✅ energyCost.primary: {type: "fire", cost: 5}
✅ energyCost.supporting: {type: "space", cost: 4}
✅ Total Energy: 9 (matches description)
✅ actionCost: 2
✅ weaveType: "complex"
✅ range: "Medium, 60 ft." (clear and specific)
✅ duration: "Instantaneous"
✅ savingThrow: "reflex" (makes sense for area damage)
✅ deliveryMethod: "save" (targets roll saves)
✅ effectType: "damage"
✅ damage.base: 28 (non-zero for damage weave)
✅ damage.type: "fire" (matches primary energy)
✅ damage.drInteraction: "half" (correct for energy damage)
✅ damage.scaling: Has entries 0-5 with damage values
✅ appliesEffects: [] (empty array, not used here)
✅ tags: ["offensive", "aoe", "ranged"] (accurate)
✅ Description: Complete and matches all data fields
```

## Common Fixes

### Missing Scaling Entries
**Problem**: Empty scaling object `{}`  
**Fix**: Add entries for success levels 0-5

### Wrong Delivery Method
**Problem**: deliveryMethod = "save" but no savingThrow  
**Fix**: Set savingThrow or change deliveryMethod to "automatic"

### Inconsistent Costs
**Problem**: Description says "7 Energy" but primary 5 + supporting 3 = 8  
**Fix**: Update description or adjust energy costs

### Missing Tags
**Problem**: tags array is empty  
**Fix**: Run tag-detector.py or manually add appropriate tags

### Damage Type Mismatch
**Problem**: Primary energy is "fire" but damage.type is "cold"  
**Fix**: Align damage type with primary energy or add explanation

## See Also

- [weave-schema.json](weave-schema.json) - Complete unified JSON Schema
- [WEAVE_STRUCTURE.md](WEAVE_STRUCTURE.md) - Annotated structure guide
- [delivery-method-detector.py](delivery-method-detector.py) - Auto-classification
- [tag-detector.py](tag-detector.py) - Auto-tagging
