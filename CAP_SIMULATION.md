# Cap Simulation: Finding Optimal Max for Texto & Entrega

## Current System (Cap = 120)

### Formulas:
- **Difficulty**: `max(0.2, 1 - entrega / 500)` → At 120: 76% remains
- **Delivery Bonus**: `min(entrega / 500, 0.4)` → At 120: +0.24 (capped at 0.4 when entrega=200)
- **Joke Potential**: `texto / 220` → At 120: +0.545 contribution
- **Chaos**: `luckBase * (1 - entrega / 500)` → At 120: ±0.076

---

## Simulation: Different Cap Values

### Scenario 1: Cap = 150

**At max (150):**
- **Difficulty**: `max(0.2, 1 - 150/500)` = `max(0.2, 0.7)` = **70% remains**
- **Delivery**: `min(150/500, 0.4)` = **+0.30**
- **Joke Potential**: `150/220` = **+0.682** (would hit 0.98 cap easier)
- **Chaos**: `0.10 * (1 - 150/500)` = **±0.07**

**Analysis:**
- ✅ Difficulty still meaningful (70% remains)
- ✅ Delivery bonus reasonable (+0.30, still below cap)
- ✅ More room for texto scaling
- ⚠️ Might make late-game slightly easier

---

### Scenario 2: Cap = 200

**At max (200):**
- **Difficulty**: `max(0.2, 1 - 200/500)` = `max(0.2, 0.6)` = **60% remains**
- **Delivery**: `min(200/500, 0.4)` = **+0.40** (hits cap!)
- **Joke Potential**: `200/220` = **+0.909** (very strong)
- **Chaos**: `0.10 * (1 - 200/500)` = **±0.06**

**Analysis:**
- ✅ Delivery bonus hits intended cap (+0.4)
- ✅ Difficulty still significant (60% remains)
- ✅ Joke potential gets very strong
- ⚠️ Might make late-game too easy

---

### Scenario 3: Cap = 250

**At max (250):**
- **Difficulty**: `max(0.2, 1 - 250/500)` = `max(0.2, 0.5)` = **50% remains**
- **Delivery**: `min(250/500, 0.4)` = **+0.40** (still capped)
- **Joke Potential**: `250/220` = **+1.136** (would need clamp adjustment)
- **Chaos**: `0.10 * (1 - 250/500)` = **±0.05**

**Analysis:**
- ⚠️ Difficulty drops to 50% (might be too easy)
- ✅ Delivery bonus still capped at +0.4
- ⚠️ Joke potential formula would need adjustment (exceeds 1.0)
- ⚠️ Chaos becomes very low (±0.05)

---

### Scenario 4: Cap = 300

**At max (300):**
- **Difficulty**: `max(0.2, 1 - 300/500)` = `max(0.2, 0.4)` = **40% remains**
- **Delivery**: `min(300/500, 0.4)` = **+0.40** (still capped)
- **Joke Potential**: `300/220` = **+1.364** (way too high)
- **Chaos**: `0.10 * (1 - 300/500)` = **±0.04**

**Analysis:**
- ❌ Difficulty too low (40% remains)
- ✅ Delivery bonus capped
- ❌ Joke potential formula breaks
- ⚠️ Chaos very low

---

## Key Insights

### Difficulty Floor Analysis
The formula `max(0.2, 1 - entrega / 500)` means:
- **At entrega=400**: `max(0.2, 0.2)` = 20% (hits theoretical floor)
- **At entrega=500**: `max(0.2, 0.0)` = 20% (floor prevents going below)

**So the 20% floor would actually apply at entrega=400+**

### Delivery Bonus Cap
The formula `min(entrega / 500, 0.4)` means:
- **At entrega=200**: Hits cap (+0.4)
- Beyond 200, no additional benefit

### Joke Potential Scaling
Current: `texto / 220` means:
- At texto=120: +0.545
- At texto=200: +0.909
- At texto=250: +1.136 (exceeds 1.0, would need clamp)

---

## Recommended Cap Values

### Option A: Cap = 200 (Balanced)
**Pros:**
- ✅ Delivery bonus hits intended cap (+0.4)
- ✅ Difficulty still meaningful (60% remains)
- ✅ Joke potential strong but manageable (+0.909)
- ✅ Chaos still present (±0.06)
- ✅ Good progression room (120 → 200 is meaningful)

**Cons:**
- ⚠️ Might need texto formula adjustment: `texto / 250` instead of `/220` to prevent potential from getting too high

**Formula Adjustments Needed:**
- Joke creation: Change `texto / 220` → `texto / 250`
- Rewrite: Change `texto / 140` → `texto / 160` (keep it stronger than creation)

---

### Option B: Cap = 180 (Conservative)
**Pros:**
- ✅ Difficulty remains higher (64% at max)
- ✅ Delivery bonus close to cap (+0.36)
- ✅ Joke potential manageable (+0.818)
- ✅ More conservative, keeps challenge

**Cons:**
- ⚠️ Less room for late-game progression

---

### Option C: Cap = 150 (Current + 30)
**Pros:**
- ✅ Minimal changes needed
- ✅ Difficulty still strong (70% remains)
- ✅ Delivery bonus reasonable (+0.30)
- ✅ Easy to implement

**Cons:**
- ⚠️ Less dramatic improvement

---

## Detailed Simulation: Cap = 200 (Recommended)

### Early Game (texto=10, entrega=5)
- Difficulty: 99% remains
- Delivery: +0.01
- Joke Potential: +0.045
- Chaos: ±0.099
- **Status**: Same as before ✅

### Mid-Game (texto=50, entrega=100)
- Difficulty: 80% remains
- Delivery: +0.20
- Joke Potential: +0.200 (with `/250` formula)
- Chaos: ±0.08
- **Status**: Same as before ✅

### Late-Game (texto=120, entrega=120)
- Difficulty: 76% remains
- Delivery: +0.24
- Joke Potential: +0.480 (with `/250` formula)
- Chaos: ±0.076
- **Status**: Current max, same as before ✅

### Very Late-Game (texto=150, entrega=150)
- Difficulty: 70% remains
- Delivery: +0.30
- Joke Potential: +0.600 (with `/250` formula)
- Chaos: ±0.07
- **Status**: Meaningful progression ✅

### Max Game (texto=200, entrega=200)
- Difficulty: 60% remains (still challenging!)
- Delivery: +0.40 (hits cap)
- Joke Potential: +0.800 (with `/250` formula)
- Chaos: ±0.06
- **Status**: Strong but not overpowered ✅

---

## Recommendation: **Cap = 200**

### Why 200?
1. **Delivery bonus hits intended cap** (+0.4) - feels like a milestone
2. **Difficulty remains meaningful** (60% at max) - game still challenging
3. **Good progression curve** - 120 → 200 feels like meaningful growth
4. **Joke potential manageable** - with adjusted formula (`/250`), maxes around +0.8
5. **Chaos still present** - ±0.06 keeps some unpredictability

### Required Formula Changes:
```javascript
// Joke Creation
adjustedPotential = clamp(
  basePotential + 
  (texto / 250) +  // Changed from /220
  (motivation - 60) / 400 + 
  mode.textoBonus + 
  flowBonus + 
  perkPotentialBonus, 
  0.2, 0.98
)

// Rewrite (keep stronger than creation)
joke.truePotential = clamp(
  basePotential + 
  (texto / 160) +  // Changed from /140
  flowBonus + 
  rewritePerkBonus, 
  0.2, 0.98
)
```

### Difficulty Progression at Cap=200:
- Entrega=0: 100% difficulty
- Entrega=50: 90% difficulty
- Entrega=100: 80% difficulty
- Entrega=150: 70% difficulty
- Entrega=200: 60% difficulty (still challenging!)

---

## Alternative: Keep Cap at 120, Adjust Formulas

If we want to keep cap at 120 but make progression feel better:

**Option: Adjust divisor in difficulty formula**
- Change from `/500` to `/400`
- At entrega=120: `max(0.2, 1 - 120/400)` = `max(0.2, 0.7)` = **70% remains**
- This makes current max feel better without raising cap

But raising cap to 200 gives more room for progression and feels more rewarding.

---

## Final Recommendation

**Cap = 200** for both texto and entrega, with formula adjustments:
- Joke creation: `texto / 250` (was `/220`)
- Rewrite: `texto / 160` (was `/140`)
- Difficulty: Keep `/500` (works well)
- Delivery: Keep `/500` with cap at 0.4 (hits cap at 200)

This provides:
- ✅ Meaningful late-game progression
- ✅ Difficulty remains challenging (60% at max)
- ✅ Delivery bonus hits intended cap
- ✅ Joke potential scales well
- ✅ Good balance between power and challenge
