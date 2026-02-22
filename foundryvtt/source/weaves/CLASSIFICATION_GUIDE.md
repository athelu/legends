# Weave Classification Quick Reference

## Three Main Weave Types

### 1. Attack Weaves (`deliveryMethod: "attack"`)
**How it works:** Roll attack vs defense
**Success:** Hit = damage, Miss = no damage  
**No saving throw involved**

**Examples:**
- Fire Bolt
- Lightning Touch
- Frost Touch
- Shadow Touch
- Stone Fist

**Workflow:**
1. Caster clicks "Cast & Roll Attack"
2. Attack roll dialog shows
3. Roll vs target defense
4. If hit, apply damage automatically

**Detection:**
- "attack roll" in description
- "make an attack" in description
- weavingRoll mentions attack

---

### 2. Saving Throw Weaves (`deliveryMethod: "save"`)
**How it works:** Targets make saving throws
**Success:** Compare successes, apply effects/damage based on margin

#### 2A. Save-Damage (`damage.base > 0`)
**Has base damage, scales with successes**

**Examples:**
- Acid Blast
- Fireball
- Lightning Bolt
- Chain Lightning

**Workflow:**
1. Caster clicks "Cast"
2. Weave card shows in chat (effects hidden initially)
3. Targets click "Roll Save"
4. Compare successes
5. Apply damage based on margin
6. If high enough successes, also apply effects

**Detection:**
- Has `savingThrow` field (will/fortitude/reflex)
- `damage.base > 0`

#### 2B. Save-Effect (`damage.base = 0`)
**No damage, effect/condition only**

**Examples:**
- Sleep
- Fear
- Binding Paralysis
- Confusion
- Calm Emotions

**Workflow:**
1. Caster clicks "Cast"
2. Weave card shows in chat (effects hidden)
3. Targets click "Roll Save"
4. Compare successes
5. Apply effects/conditions based on margin
6. Duration may scale with net successes

**Detection:**
- Has `savingThrow` field
- `damage.base = 0`
- Has `appliesEffects` array

---

### 3. Automatic Weaves (`deliveryMethod: "automatic"`)
**How it works:** No roll needed, effects happen automatically
**Success:** Always succeeds

**Examples:**
- Light
- Floating Lights
- Comprehend Languages
- Identify
- Sense Magic
- Gentle Descent

**Workflow:**
1. Caster clicks "Cast"
2. Effects applied immediately
3. No rolls or saves needed

**Detection:**
- No `savingThrow` or savingThrow = "none"
- No attack roll mentions
- Typically utility/buff weaves

---

## Summary Table

| Type | Roll/Save | Damage | Effects | Success Scaling |
|------|-----------|--------|---------|-----------------|
| **attack** | Attack roll | Yes | Sometimes | Margin of success |
| **save-damage** | Saving throw | Yes | At high successes | Net successes |
| **save-effect** | Saving throw | No | Yes | Net successes (duration) |
| **automatic** | None | No | Yes | N/A |

---

## Implementation Checklist

### In template.json
- [x] Add `deliveryMethod: "save"` to weave template

### In build_weaves_pack.py
- [ ] Import `detect_delivery_method` from delivery-method-detector.py
- [ ] Auto-detect and set deliveryMethod for each weave
- [ ] Log low-confidence detections for manual review
- [ ] Validate that attack weaves have weavingRoll with attack
- [ ] Validate that save weaves have savingThrow field

### In legends.mjs
- [ ] Check deliveryMethod instead of inferring from other fields
- [ ] Route attack weaves through attack workflow
- [ ] Route save weaves through save workflow
- [ ] Route automatic weaves through immediate application
- [ ] Use deliveryMethod to determine which buttons to show

### UI Updates
- [ ] Attack weaves: Show "Cast & Roll Attack" button
- [ ] Save weaves: Show "Cast" button, then "Roll Save" for targets
- [ ] Automatic weaves: Show "Cast" button only
- [ ] Filter compendium by delivery method
- [ ] Show delivery method icon/badge on weave cards

### Documentation
- [ ] Update player handbook with weave classification
- [ ] Add examples of each type
- [ ] Explain workflows for each type
- [ ] GM guide for creating custom weaves

---

## Common Questions

**Q: What if a weave has both attack roll AND saving throw?**
A: Very rare, but classify as "attack" primary. The save would be secondary effect.

**Q: What about weaves that target willing creatures only?**
A: Classify as "automatic" since there's no opposed roll.

**Q: Can a utility weave require a save?**
A: Yes - e.g., Teleport might require save for unwilling targets. Classify as "save".

**Q: How do we handle weaves that scale differently for willing vs unwilling targets?**
A: Classify based on the hostile use case. Document in specialMechanics.

**Q: What about counterweaves or reactive weaves?**
A: These are special cases. Might need a 4th category "reactive" or handle via specialMechanics.

---

## Migration Notes

### Existing Weaves
- Run auto-detection on all existing weaves
- Review low-confidence classifications manually
- Update any that were misclassified
- No changes to actual mechanics, just classification

### New Weaves
- Set deliveryMethod explicitly when creating
- Build script will validate consistency
- Description should match delivery method

### Testing
- Test each weave type in Foundry after migration
- Verify correct buttons appear
- Verify correct workflow executes
- Verify effects applied correctly

---

**Created:** February 17, 2026
**Location:** `c:\repos\legends\foundryvtt\source\weaves\`
**Status:** Ready for implementation
