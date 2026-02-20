# Balance Changes Applied

## Changes Made

### 1. ✅ Desk Mode Nerfed
- **Before**: `textoBonus: 0.15` (+15% potential bonus)
- **After**: `textoBonus: 0.10` (+10% potential bonus)
- **Impact**: Makes "day" mode more viable, reduces power gap between writing modes

### 2. ✅ Estudar No Longer Improves Entrega
- **Before**: Estudar gave +6 texto AND +3 entrega
- **After**: Estudar gives only +6 texto
- **Impact**: Entrega now only improves from performing shows, NPC events, and class selection (as intended)

### 3. ✅ Difficulty Penalty Fixed (Critical Balance Fix)
- **Before**: `difficultyPenalty = show.difficulty * (1 - entrega/250)`
  - At entrega=120 (max): difficulty reduced to 52% (48% reduction)
  - Made mid-game too easy
- **After**: `difficultyPenalty = show.difficulty * max(0.2, 1 - entrega/500)`
  - At entrega=0: Full difficulty penalty (100%)
  - At entrega=60: 88% difficulty remains
  - At entrega=120 (max): 76% difficulty remains (only 24% reduction)
  - Note: The 20% floor is theoretical (would require entrega=400+), but since entrega maxes at 120, the actual minimum is 76%
- **Impact**: 
  - Mid-game is harder (shows still challenging)
  - Late-game can still fail (nota 2-3 possible with bad material)
  - Very high entrega (100+) makes bombing almost impossible but doesn't eliminate challenge entirely

### 4. ✅ Delivery Bonus Capped
- **Before**: `deliveryBonus = entrega / 400` (unlimited scaling, +1.0 at entrega=400)
- **After**: `deliveryBonus = min(entrega / 500, 0.4)` (capped at +0.4)
- **Impact**: Prevents exponential power scaling, keeps bonuses meaningful but balanced

### 5. ✅ Chaos Reduced
- **Before**: Open mic ±0.12, Elenco+ ±0.06
- **After**: Open mic ±0.10, Elenco+ ±0.05
- **Impact**: Less frustrating randomness for new players, still meaningful but less swingy

### 6. ✅ Joke Potential Cap Raised
- **Before**: `clamp(..., 0.2, 0.95)` - cap at 0.95
- **After**: `clamp(..., 0.2, 0.98)` - cap at 0.98
- **Impact**: Late-game players can benefit from high texto, allows for better joke scaling

### 7. ✅ Chaos Reduction Slowed
- **Before**: `chaosRange = luckBase * (1 - entrega / 400)`
- **After**: `chaosRange = luckBase * (1 - entrega / 500)`
- **Impact**: Chaos reduces more slowly, keeps some randomness longer

## Expected Balance Impact

### Early Game (texto=10, entrega=5)
- **Difficulty**: Full penalty (100%)
- **Delivery**: +0.01
- **Chaos**: ±0.10 (open mic)
- **Result**: Still challenging, can fail easily

### Mid-Game (texto=50, entrega=60)
- **Difficulty**: 88% penalty remains (was 76% before with old formula)
- **Delivery**: +0.12
- **Chaos**: ±0.088
- **Result**: Harder than before, still meaningful challenge

### Mid-Game (texto=50, entrega=100)
- **Difficulty**: 80% penalty remains (was 60% before)
- **Delivery**: +0.20 (capped)
- **Chaos**: ±0.08
- **Result**: Harder than before, still meaningful challenge

### Late-Game (texto=120, entrega=120 - MAX)
- **Difficulty**: 76% penalty remains (was 52% before)
- **Delivery**: +0.24 (capped at 0.4)
- **Chaos**: ±0.076
- **Result**: Can still get nota 2-3 with bad material, but bombing (nota 1) is very rare
- **Note**: This is the maximum possible entrega in the game (capped at 120)

## Design Philosophy Achieved

✅ **Mid-game is harder**: Difficulty reduction is slower, penalty remains significant longer (76% at max vs 52% before)  
✅ **Late-game can still fail**: Even at max entrega (120), 76% of difficulty remains, ensuring challenge  
✅ **High entrega = consistency**: Very high entrega (100+) makes bombing almost impossible (skill = consistency lesson)  
✅ **No exponential scaling**: Capped bonuses prevent power creep  
✅ **Better joke scaling**: Higher cap allows late-game texto to matter
