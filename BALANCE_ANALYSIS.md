# Balance Analysis: Joke Creation & Performance Mechanics

## 📝 JOKE CREATION FORMULA

### Base Components:
```javascript
basePotential = random(0.35, 0.85)  // 50% range, centered at 0.60
```

### Writing Mode Modifiers:
- **"Sentar e escrever" (desk)**:
  - `textoBonus: +0.15` (direct addition)
  - `motivationCost: -15`
  - `failChance: 25%`
  - `timeBonus: 50%` chance of +1 minute

- **"Anotar durante o dia" (day)**:
  - `textoBonus: +0.0`
  - `motivationCost: 0`
  - `failChance: 50%`
  - `timeBonus: 0%`

### Final Potential Formula:
```javascript
adjustedPotential = clamp(
  basePotential +                    // 0.35-0.85
  (texto / 220) +                    // Max: +0.545 at texto=120
  (motivation - 60) / 400 +          // Range: -0.15 to +0.15
  mode.textoBonus +                  // +0.15 (desk) or 0 (day)
  flowBonus +                        // +0.1 if in flow
  perkPotentialBonus,                // From perks
  0.2, 0.95                          // Clamped range
)
```

### Example Calculations:

**Early Game (texto=10, motivation=60, no perks, "day" mode):**
- Base: 0.60 (average)
- texto: +0.045
- motivation: 0
- mode: 0
- **Result: ~0.645** (decent joke)

**Early Game ("desk" mode):**
- Base: 0.60
- texto: +0.045
- motivation: 0
- mode: +0.15
- **Result: ~0.795** (very strong joke!)

**Mid Game (texto=50, motivation=80, "desk" mode):**
- Base: 0.60
- texto: +0.227
- motivation: +0.05
- mode: +0.15
- **Result: ~1.027 → clamped to 0.95** (maxed out)

**Late Game (texto=120, motivation=100, "desk" mode, flow, perks):**
- Base: 0.60
- texto: +0.545
- motivation: +0.10
- mode: +0.15
- flow: +0.10
- perks: ~+0.10 (estimated)
- **Result: ~1.605 → clamped to 0.95** (hard cap reached)

### Issues Identified:
1. **Hard cap at 0.95 is reached too easily** - Mid-game players can already max out joke potential
2. **"Desk" mode is overpowered** - +0.15 bonus is massive compared to base range
3. **Texto scaling is weak** - At texto=120, only adds +0.545, but this is often wasted due to clamp

---

## 🎭 SHOW PERFORMANCE FORMULA

### Score Breakdown (per joke):
```javascript
jokeScore = 
  potencyComponent +              // joke.truePotential * 0.6
  typeComponent +                 // getTypeAffinity(show, tone) * 0.2
  chaosRoll +                     // ±(luckBase * (1 - entrega/400))
  (-difficultyPenalty) +          // show.difficulty * (1 - entrega/250)
  deliveryBonus +                 // entrega / 400 + perks
  flowBonus +                     // +0.08 if in flow
  perkBonuses                     // hecklerDefense, bigCrowdBonus, etc.
```

### Component Analysis:

#### 1. Potency Component (60% weight)
- Range: 0.2 * 0.6 = **0.12** (worst joke) to 0.95 * 0.6 = **0.57** (best joke)
- **This is the dominant factor** - joke quality matters most

#### 2. Type Affinity (20% weight)
- Range: -0.2 (mismatch) to +0.2 (perfect match)
- Can swing score significantly but is situational

#### 3. Chaos Roll (LUCK)
- **Open mic**: ±0.12 max (reduced by entrega)
  - At entrega=0: ±0.12 (can swing ±1 nota!)
  - At entrega=100: ±0.09
  - At entrega=200: ±0.06
  - At entrega=400: ±0.0 (luck eliminated)
- **Elenco+**: ±0.06 max
  - At entrega=0: ±0.06
  - At entrega=200: ±0.03
  - At entrega=400: ±0.0

#### 4. Difficulty Penalty
```javascript
difficultyPenalty = show.difficulty * (1 - entrega / 250)
```

**Examples:**
- Show difficulty: 0.5 (hardest shows)
- At entrega=0: penalty = 0.5 * 1.0 = **-0.5** (massive!)
- At entrega=50: penalty = 0.5 * 0.8 = **-0.4**
- At entrega=100: penalty = 0.5 * 0.6 = **-0.3**
- At entrega=200: penalty = 0.5 * 0.2 = **-0.1**
- At entrega=250: penalty = 0.5 * 0.0 = **0.0** (difficulty eliminated!)

**🚨 CRITICAL BALANCE ISSUE:**
- At entrega=250, **ALL difficulty is eliminated**
- Hardest shows (difficulty 0.55) become trivial
- This makes the game too easy at mid-high levels

#### 5. Delivery Bonus
```javascript
deliveryBonus = entrega / 400 + perkBonus
```

**Examples:**
- At entrega=0: +0.0
- At entrega=100: +0.25
- At entrega=200: +0.5
- At entrega=400: +1.0 (massive bonus!)

**Combined with difficulty elimination:**
- At entrega=250: difficulty eliminated + delivery bonus +0.625
- This is a **+1.125 swing** compared to entrega=0!

#### 6. Flow Bonus
- +0.08 flat bonus (applied per joke)
- Significant but temporary

### Final Score Calculation:
```javascript
averageScore = sum(jokeScores) / jokeCount
adjustedScore = averageScore + timeImpact.adjustment
nota = classifyOutcome(adjustedScore)
```

### Score Thresholds (nota mapping):
- **Nota 5**: score >= 0.45
- **Nota 4**: score >= 0.32
- **Nota 3**: score >= 0.18
- **Nota 2**: score >= 0.05
- **Nota 1**: score < 0.05

**Gap analysis:**
- Nota 5→4: 0.13 gap
- Nota 4→3: 0.14 gap
- Nota 3→2: 0.13 gap
- Nota 2→1: 0.05 gap (smallest)

---

## 🔍 BALANCE ISSUES IDENTIFIED

### 1. **Entrega Makes Difficulty Trivial** ⚠️ CRITICAL
- At entrega=250, difficulty is **completely eliminated**
- Hardest shows (difficulty 0.55) become easier than easy shows
- **Recommendation**: Change formula to `(1 - entrega / 500)` or add a minimum difficulty floor

### 2. **Joke Potential Hard Cap Too Low**
- 0.95 cap is reached too easily (mid-game)
- Late-game players get no benefit from high texto
- **Recommendation**: Raise cap to 0.98 or remove clamp entirely

### 3. **"Desk" Mode Too Powerful**
- +0.15 bonus is massive (15% of score range)
- Makes "day" mode feel weak even with 50% fail chance
- **Recommendation**: Reduce to +0.08-0.10, or make it scale with texto

### 4. **Texto Contribution Weak in Creation**
- texto/220 means max +0.545 at texto=120
- But this is often wasted due to clamp
- **Recommendation**: Make texto more impactful, or raise clamp ceiling

### 5. **Rewrite Formula Inconsistent**
- Uses texto/140 (stronger) vs creation's texto/220
- This is intentional but creates confusion
- **Recommendation**: Document why, or make consistent

### 6. **Delivery Bonus + Difficulty Elimination = Double Win**
- High entrega both removes penalty AND adds bonus
- Creates exponential power scaling
- **Recommendation**: Consider making delivery bonus smaller or difficulty reduction weaker

### 7. **Chaos Still Too High at Low Entrega**
- ±0.12 at open mic with entrega=0 can swing ±1 nota
- This is frustrating for new players
- **Recommendation**: Reduce base chaos or cap max swing

### 8. **Time Impact Can Override Quality**
- `evaluateStageTime` can add/subtract up to ±0.4
- This can turn a nota 4 into nota 2 or vice versa
- **Recommendation**: Reduce time impact range or make it proportional to quality

---

## 📊 EXAMPLE SCENARIOS

### Scenario 1: New Player (texto=10, entrega=5)
**Writing:**
- Creates joke with potential ~0.65 (day mode) or ~0.80 (desk mode)

**Performing on hard show (difficulty 0.5):**
- Potency: 0.65 * 0.6 = 0.39
- Type: +0.1 (assume good match)
- Chaos: ±0.12 (unlucky: -0.12)
- Difficulty: -0.5
- Delivery: +0.0125
- **Score: ~-0.08 → Nota 1** 💧

**Same joke, lucky chaos (+0.12):**
- **Score: ~0.04 → Nota 2** 😶

**Verdict**: New players struggle even with decent jokes on hard shows.

### Scenario 2: Mid-Game Player (texto=50, entrega=100)
**Writing:**
- Creates joke with potential ~0.85 (desk mode, clamped)

**Performing on hard show (difficulty 0.5):**
- Potency: 0.85 * 0.6 = 0.51
- Type: +0.1
- Chaos: ±0.09 (reduced)
- Difficulty: -0.3 (reduced from -0.5)
- Delivery: +0.25
- **Score: ~0.47 → Nota 5** 🤯

**Verdict**: Mid-game players can easily get nota 5 on hard shows.

### Scenario 3: Late-Game Player (texto=120, entrega=250)
**Writing:**
- Creates joke with potential 0.95 (maxed, clamped)

**Performing on hardest show (difficulty 0.55):**
- Potency: 0.95 * 0.6 = 0.57
- Type: +0.1
- Chaos: ±0.0 (eliminated)
- Difficulty: **0.0** (eliminated!)
- Delivery: +0.625
- **Score: ~1.295 → Nota 5** 🤯

**Verdict**: Late-game players can't fail. Game becomes trivial.

---

## 🎯 RECOMMENDATIONS

### Priority 1: Fix Difficulty Elimination
```javascript
// Current (BROKEN):
difficultyPenalty = show.difficulty * (1 - entrega / 250)

// Recommended:
difficultyPenalty = show.difficulty * (1 - entrega / 500)
// OR add minimum floor:
difficultyPenalty = show.difficulty * Math.max(0.3, (1 - entrega / 400))
```

### Priority 2: Raise Joke Potential Cap
```javascript
// Current:
clamp(..., 0.2, 0.95)

// Recommended:
clamp(..., 0.2, 0.98)
// OR remove upper clamp entirely for late-game scaling
```

### Priority 3: Reduce "Desk" Mode Bonus
```javascript
// Current:
textoBonus: 0.15

// Recommended:
textoBonus: 0.08  // Still meaningful but not overpowered
```

### Priority 4: Reduce Base Chaos
```javascript
// Current:
luckBase = (level === "open") ? 0.12 : 0.06

// Recommended:
luckBase = (level === "open") ? 0.08 : 0.04
```

### Priority 5: Make Delivery Bonus Scale Better
```javascript
// Current:
deliveryBonus = entrega / 400

// Recommended:
deliveryBonus = Math.sqrt(entrega) / 20  // Diminishing returns
// OR cap it:
deliveryBonus = Math.min(entrega / 400, 0.5)  // Max +0.5
```

---

## 📈 PROPOSED NEW FORMULA (Balanced)

### Joke Creation:
```javascript
adjustedPotential = clamp(
  basePotential +                    // 0.35-0.85
  (texto / 200) +                    // Slightly stronger
  (motivation - 60) / 400 +
  mode.textoBonus +                   // Reduced to 0.08
  flowBonus +
  perkPotentialBonus,
  0.2, 0.98                           // Higher cap
)
```

### Show Performance:
```javascript
difficultyPenalty = show.difficulty * Math.max(0.2, (1 - entrega / 500))
deliveryBonus = Math.min(entrega / 500, 0.4)  // Capped
chaosRange = luckBase * (1 - entrega / 500)   // Weaker reduction
```

This would:
- Keep difficulty relevant even at high entrega
- Prevent exponential power scaling
- Make texto more impactful
- Reduce randomness frustration
- Maintain meaningful progression
