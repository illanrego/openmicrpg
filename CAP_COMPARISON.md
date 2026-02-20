# Cap Comparison: Visual Analysis

## Quick Comparison Table

| Cap Value | Max Difficulty Remains | Max Delivery Bonus | Max Joke Potential* | Max Chaos | Verdict |
|-----------|------------------------|-------------------|---------------------|-----------|---------|
| **120** (current) | 76% | +0.24 | +0.545 | ±0.076 | Current system |
| **150** | 70% | +0.30 | +0.682 | ±0.07 | ✅ Good balance |
| **180** | 64% | +0.36 | +0.818 | ±0.064 | ✅ Conservative |
| **200** | 60% | +0.40 (cap) | +0.909 | ±0.06 | ⭐ **RECOMMENDED** |
| **250** | 50% | +0.40 (cap) | +1.136 | ±0.05 | ⚠️ Too easy |
| **300** | 40% | +0.40 (cap) | +1.364 | ±0.04 | ❌ Too easy |

*Joke potential assumes current formula (`texto / 220`). Would need adjustment for higher caps.

---

## Detailed Breakdown: Cap = 200 (Recommended)

### Progression Milestones

| Entrega | Difficulty Remains | Delivery Bonus | Chaos Range | Status |
|---------|-------------------|----------------|-------------|--------|
| 0 | 100% | +0.00 | ±0.10 | Starting point |
| 50 | 90% | +0.10 | ±0.09 | Early progress |
| 100 | 80% | +0.20 | ±0.08 | Mid-game |
| 150 | 70% | +0.30 | ±0.07 | Late-game |
| 200 | 60% | +0.40 | ±0.06 | **MAX** |

### Texto Progression (with adjusted formula: `/250`)

| Texto | Joke Potential Contribution | Status |
|-------|----------------------------|--------|
| 0 | +0.00 | Starting |
| 50 | +0.20 | Mid-game |
| 100 | +0.40 | Late-game |
| 150 | +0.60 | Very late |
| 200 | +0.80 | **MAX** |

---

## Why Cap = 200 Works Best

### 1. **Delivery Bonus Milestone**
- At 200, delivery bonus hits the intended cap (+0.4)
- Feels like a meaningful achievement
- No wasted progression beyond this point

### 2. **Difficulty Balance**
- 60% difficulty remains at max
- Still challenging enough to fail with bad material
- But high entrega makes bombing almost impossible (as intended)

### 3. **Progression Feel**
- 120 → 200 is a meaningful jump (+80 points)
- Feels like real character growth
- Not too grindy, not too easy

### 4. **Formula Compatibility**
- With adjusted formulas (`texto / 250`), joke potential scales well
- Doesn't break the system
- Maintains balance

---

## Required Changes for Cap = 200

### 1. Update Clamp Values
```javascript
// Change all instances of:
clamp(..., 0, 120)
// To:
clamp(..., 0, 200)
```

### 2. Adjust Joke Potential Formulas
```javascript
// Joke Creation (line ~2507)
adjustedPotential = clamp(
  basePotential + 
  (state.texto / 250) +  // Changed from /220
  (state.motivation - 60) / 400 + 
  mode.textoBonus + 
  flowBonus + 
  perkPotentialBonus, 
  0.2, 0.98
)

// Rewrite (line ~3061)
joke.truePotential = clamp(
  basePotential + 
  (state.texto / 160) +  // Changed from /140
  flowBonus + 
  rewritePerkBonus, 
  0.2, 0.98
)
```

### 3. Update Initial State
```javascript
// Base state (line ~1715)
texto: 10, entrega: 5  // Keep same starting values
```

### 4. Update Comments
- Update difficulty comment to reflect new max
- Update delivery bonus comment

---

## Alternative: Keep 120, Adjust Difficulty Formula

If you prefer to keep cap at 120 but make it feel better:

**Change difficulty divisor from `/500` to `/400`:**
- At entrega=120: `max(0.2, 1 - 120/400)` = `max(0.2, 0.7)` = **70% remains**
- Makes current max feel stronger without raising cap
- No other changes needed

**But raising to 200 is better because:**
- More room for progression
- Delivery bonus hits intended cap
- Feels more rewarding
- Still balanced

---

## Final Recommendation

**Cap = 200** for both texto and entrega

**Why:**
- ✅ Delivery bonus hits intended cap (+0.4)
- ✅ Difficulty remains challenging (60% at max)
- ✅ Good progression curve
- ✅ Formula adjustments are simple
- ✅ Maintains game balance

**Implementation:**
1. Change all `clamp(..., 0, 120)` to `clamp(..., 0, 200)`
2. Adjust joke potential formulas (`/250` and `/160`)
3. Update comments

This gives players meaningful late-game progression while maintaining challenge.
