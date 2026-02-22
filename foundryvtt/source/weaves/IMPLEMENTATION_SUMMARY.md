# Weave Success Scaling Schema - Implementation Summary

## Created Files

### 1. `weave-schema.json`
- **Complete unified JSON Schema (Draft-07 compatible)**
- Covers ALL weave properties in one file:
  - **Base properties**: name, type, img, energyCost, range, duration, etc.
  - **Success scaling**: damage.scaling structure with all property types
  - **Classification**: deliveryMethod enum (attack/save/automatic)
  - **Tags**: 24+ tag enums for filtering/organization
  - **Energy types**: 10 energy type enums
  - **Effects**: appliesEffects array structure
- Uses `$defs` for reusable patterns:
  - structuredDuration, rangeObject, areaObject
  - quantityObject, capacityObject, pushDistanceObject
- **3 complete examples**: Fireball (damage), Sleep (effect), Light (utility)
- Single source of truth for validation
- Ready for JSON Schema validators

### 2. `scaling-examples.json`
- 15 comprehensive examples showing all identified scaling patterns:
  - Core: description, appliesEffects
  - Combat: damage, healing, pushDistance
  - Temporal/Spatial: duration, range, area
  - Quantities: quantity, capacity, targetCount
  - Special: effectType, specialMechanics, drModifier, hp, notes



### 2. `delivery-method-detector.py`
- Python auto-detection functions for build script
- `detect_delivery_method()` - Analyzes weave properties and description
- `classify_weave_type()` - Returns deliveryMethod, subtype, and confidence
- Includes test cases and examples
- Ready to integrate into build_weaves_pack.py

### 3. `tag-detector.py`
- Python auto-detection functions for tags
- `detect_all_tags()` - Returns array of all applicable tags
- Helper functions for each tag category:
  - `extract_explicit_tags()` - Parse **[Necromantic]** markers
  - `detect_thematic_tags()` - Necromantic, illusion, summoning, etc.
  - `detect_mechanical_tags()` - Healing, offensive, control, etc.
  - `detect_targeting_tags()` - AOE, touch, ranged, etc.
  - `detect_special_tags()` - Wall, zone, construct, ritual, etc.
- Includes test cases with expected output
- Ready to integrate into build_weaves_pack.py

### 4. `scaling-examples.json`
- 14 comprehensive examples covering all identified patterns:
  1. Damage Scaling (Acid Blast)
  2. Duration Scaling (Sleep)
  3. Range Scaling (Spatial Step)
  4. Area Scaling (Shape Stone)
  5. Healing Scaling (Healing Burst)
  6. Quantity Scaling (Unerring Bolt)
  7. Capacity Scaling (Telekinesis)
  8. Hybrid Damage+Healing (Vampiric Touch)
  9. Hybrid Damage+Push (Thunder Burst)
  10. Conditional Effect Progression (Fear)
  11. Target Count Scaling (Heroism)
  12. Special Mechanics (Suggestion)
  13. Multi-Attribute (Wall of Force)
  14. Quality/Complexity (Identify)
  15. Comprehensive Multi-Attribute (Hypothetical - demonstrates all properties)

### 5. `scaling-utils.mjs`
- JavaScript utility functions for FoundryVTT
- Functions to read and use structured scaling data
- Helper functions for:
  - Getting values at specific success levels
  - Checking if effects should apply
  - Formatting duration, area, range for display
  - Calculating duration in seconds
  - Creating HTML tables for chat display
- Example usage patterns for legends.mjs integration

### 6. `scaling-parser-example.py`
- Python parser functions for build script
- Converts markdown text to structured JSON
- Includes specialized parsers for:
  - Damage amounts (including dice notation)
  - Healing amounts
  - Duration (structured and text)
  - Range and distance
  - Area effects
  - Quantities and capacities
  - Special mechanics
  - Effect types and conditions
- Example integration code for build_weaves_pack.py

### 7. `INTEGRATION_GUIDE.md`
- Step-by-step guide for integrating both detectors
- Import instructions for build_weaves_pack.py
- Code examples for applying detection
- Expected output examples
- Edge case handling
- FoundryVTT usage patterns (display, filtering, warnings)
- Maintenance guidelines

### 8. `CLASSIFICATION_GUIDE.md`
- Quick reference for weave delivery method classification
- Decision tree for determining correct type
- Button flow diagrams for each type
- Common pitfalls and solutions

### 9. `WEAVE_STRUCTURE.md`
- Complete annotated weave structure reference
- Full Fireball example with every property explained
- Property categories and tables
- Energy types, delivery methods, action costs
- Validation requirements and defaults
- Example variations (damage, effect, utility, attack weaves)
- Quick reference for all enums and options

### 10. `VALIDATION_CHECKLIST.md`
- Quality assurance checklist for creating/reviewing weaves
- Required properties verification
- Consistency checks (energy costs, action costs, delivery methods)
- Tag accuracy guidelines
- Common mistakes and fixes
- Example validation (Fireball walkthrough)
- Testing checklist

### 11. `README.md`
- Comprehensive documentation
- Weave classification by delivery method
- Tag classification system with all 24+ tags
- Base properties and success scaling overview
- Links to all other documentation files
- Examples of all 14+ scaling patterns
- Usage guidelines for build scripts
- Migration plan for existing weaves
- Benefits and next steps

### 8. `IMPLEMENTATION_SUMMARY.md`
- This file - project status and implementation guide

## Weave Classification System

A new `deliveryMethod` field explicitly classifies weaves into three mechanical categories:

### Classification Types

1. **"attack"** - Attack Roll Weaves
   - Caster makes attack roll vs target defense
   - Hit/miss determines damage
   - No saving throw
   - Examples: Fire Bolt, Lightning Touch, Stone Fist
   - Detection: "attack roll" in description or weavingRoll

2. **"save"** - Saving Throw Weaves
   - Targets make saving throw (Will/Fortitude/Reflex)
   - Success comparison determines outcome
   - Two subtypes:
     - **save-damage** (damage.base > 0): Acid Blast, Fireball
     - **save-effect** (damage.base = 0): Sleep, Fear, Paralysis
   - Detection: Has savingThrow field populated

3. **"automatic"** - Automatic/Utility Weaves
   - No attack roll or save required
   - Effects happen automatically
   - Typically buffs or utility
   - Examples: Light, Identify, Comprehend Languages
   - Detection: No savingThrow, no attack mentions

### Integration Points

**template.json**: Added `deliveryMethod: "save"` as default field in weave template

**Build Script**: Can use `delivery-method-detector.py` functions to auto-detect and populate

**FoundryVTT**: Use to route weaves through correct workflow:
- attack → Show attack roll dialog
- save → Show weave card, roll saves button
- automatic → Cast and apply immediately

### Benefits

- Clear separation of weave mechanics
- Correct workflow routing in Foundry
- Better UI - show appropriate buttons
- Easier for players to understand
- Simplified automation logic
- Can filter/search by delivery method
- Build script validation

## Schema Design Principles

### 1. Flexibility
- Optional fields - only include what's relevant
- Can handle simple or complex weaves
- Extensible - new properties can be added without breaking existing data
- **Composable** - Any combination of properties can be used at each success level

### 2. Clarity
- Human-readable structure
- Descriptive property names
- Documentation in schema and examples

### 3. Machine-Readable
- Type-safe with JSON Schema validation
- Structured data for programmatic access
- Consistent patterns across all weave types

### 4. Composability
- **All properties are optional** (except `description`)
- **Any number of properties can be combined** at a single success level
- Examples:
  - Simple: Just damage
  - Moderate: Damage + duration + area
  - Complex: Damage + healing + range + area + duration + pushDistance + targetCount + specialMechanics
- Real-world example at success level 4: `hp: 36, drModifier: 8, duration: 1 hour` (Wall of Force)
- See `comprehensive_multi_attribute` in scaling-examples.json for a demonstration with nearly all properties

### 4. Backward Compatible
- Old damage.scaling tables still work
- Can gradually migrate weaves
- Keep existing _parse_damage_scaling for compatibility

## Integration Path

### Phase 1: Foundation (Complete)
✅ Schema definition complete
✅ Examples documented
✅ Utility functions written
✅ Parser examples provided
✅ Delivery method classification system
✅ Delivery method auto-detector with tests
✅ Tag classification system (24+ tags)
✅ Tag auto-detector with tests
✅ Integration guide written
✅ Classification guide written
✅ Both fields added to template.json

### Phase 2: Build Script Integration (Next)
- [ ] Update `build_weaves_pack.py`:
  - Import delivery-method-detector.py
  - Import tag-detector.py
  - Apply detect_delivery_method() to each weave
  - Apply detect_all_tags() to each weave
  - Optional: Clean **[Tag]** markers from names
  - Import parser functions from scaling-parser-example.py
  - Replace/augment existing scaling parsers
  - Test with a few weaves first
- [ ] Validate output:
  - Check deliveryMethod field populated
  - Check tags array populated
  - Check JSON matches schema
  - Compare with examples
  - Verify all fields populated correctly
- [ ] Rebuild all weaves with new classification

### Phase 3: FoundryVTT Integration
- [ ] Add `scaling-utils.mjs` to module/
- [ ] Update `legends.mjs`:
  - Route by deliveryMethod field (attack/save/automatic)
  - Import ScalingUtils
  - Replace manual scaling checks with utility functions
  - Use structured data for damage/healing/duration
  - Calculate push distance, area effects, etc.
- [ ] Update templates:
  - Display tags as color-coded badges
  - Show success level tables in chat cards
  - Highlight current success level achieved
- [ ] Add compendium features:
  - Filter by tags
  - Search by delivery method
  - Warning dialogs for "forbidden" tag
  - Hide restricted tags for certain campaigns

### Phase 4: Advanced Features
- [ ] Use duration data for actual effect durations
- [ ] Implement push distance automation
- [ ] Handle area effect visualization
- [ ] Target count validation
- [ ] Special mechanics automation
- [ ] Effect type conditional logic
- [ ] Tag-based sorting/organization
- [ ] Tag-based permissions/restrictions

### Phase 5: Migration
- [ ] Migrate all weaves to structured format
- [ ] Update markdown documentation with clearer formatting
- [ ] Verify all classifications correct
- [ ] Add new tags as needed
- [ ] Deprecate old scaling format
- [ ] Add validation tests

## Benefits of This Approach

### For Development
- **Type Safety**: JSON Schema validation catches errors early
- **Consistency**: Same structure for all weaves
- **Maintenance**: Easier to update and extend
- **Debugging**: Clear structure makes issues obvious

### For Gameplay
- **Clarity**: Players see exactly what each success level does
- **Automation**: More effects can be applied automatically
- **Feedback**: Better UI showing success outcomes
- **Balance**: Easier to compare and balance weaves

### For Content Creation
- **Guidance**: Clear examples of all patterns
- **Validation**: Schema ensures correct structure
- **Documentation**: Self-documenting with examples
- **Reuse**: Copy patterns from examples

## Example: Sleep Weave Before and After

### Before (Current)
```json
{
  "damage": {
    "base": 0,
    "scaling": {}
  },
  "successScaling": ""
}
```

### After (With Schema)
```json
{
  "damage": {
    "base": 0,
    "scaling": {
      "0": {
        "description": "no effect",
        "appliesEffects": false,
        "duration": null
      },
      "1": {
        "description": "1 round",
        "appliesEffects": true,
        "duration": { "value": 1, "unit": "round" }
      },
      "2": {
        "description": "full effect (1 minute)",
        "appliesEffects": true,
        "duration": { "value": 1, "unit": "minute" }
      },
      "3": {
        "description": "10 minutes",
        "appliesEffects": true,
        "duration": { "value": 10, "unit": "minute" }
      },
      "4": {
        "description": "1 hour",
        "appliesEffects": true,
        "duration": { "value": 1, "unit": "hour" }
      },
      "5": {
        "description": "4 hours",
        "appliesEffects": true,
        "duration": { "value": 4, "unit": "hour" }
      }
    }
  }
}
```

## Next Immediate Steps

1. **✅ Schema complete** - Covers all identified patterns
2. **✅ Classification systems complete** - Delivery method and tags
3. **✅ Auto-detectors ready** - Both detectors tested and working
4. **Next: Integrate into build script** - Apply detectors to populate fields
5. **Then: Rebuild weaves** - Generate with new classifications
6. **Then: Update legends.mjs** - Use deliveryMethod for workflow routing
7. **Then: Update templates** - Display tags as badges
8. **Finally: Test in Foundry** - Verify everything works end-to-end

## Questions to Consider

1. Do we need additional property types not covered in the schema?
2. Should some properties be required instead of optional?
3. Do we want to validate against the schema during build?
4. Should we support success levels above 5?
5. Do we need versioning for the schema?
6. **Should we automatically clean **[Tag]** markers from names?** (Recommended: Yes)
7. **Should forbidden tag block casting without GM override?** (Recommended: No, just warn)
8. **How should we handle weaves with multiple delivery methods?** (Use primary mechanic)

## Notes

- The schema is designed to be **additive** - you only include properties that are relevant
- Empty or null values are acceptable for optional properties
- The parser can be enhanced to handle more edge cases as they're discovered
- The utility functions provide a clean API so legends.mjs doesn't need to know the schema details
- This approach makes it much easier to add new weaves or modify existing ones
- **Classification is orthogonal**: deliveryMethod = "how", tags = "what"
- **Tags are composable**: A weave can have multiple tags across all categories
- **Auto-detection is high confidence**: Tested with real weave data

---

**Status**: Schema design and classification systems complete, ready for build script integration
**Last Updated**: [Current Date]
**Location**: `c:\repos\legends\foundryvtt\source\weaves\`
**Files Ready**:
- scaling-schema.json
- delivery-method-schema.json + detector
- tags-schema.json + detector
- Integration guide
- Classification guide
- All examples and utilities
