# Open Mic RPG - Game Mechanics Reference

Last verified: 2026-05-24

This is the canonical repo guide for gameplay mechanisms, formulas, and balance-sensitive rules. When changing game balance, verify this file against `script.js` first and update it in the same change.

Older files such as `BALANCE_ANALYSIS.md`, `BALANCE_CHANGES.md`, `CAP_COMPARISON.md`, `CAP_SIMULATION.md`, and `CAP_200_APPLIED.md` are useful history, but they are not the current source of truth.

## Source Map

- Main logic: `script.js`
- State defaults and persistence: `loadGameState()`
- Writing modes: `writingModes`
- Joke creation: `finalizeJokeCreation()`
- Rewrite: `finalizeRewrite()`
- Show scoring: `evaluateShow()`
- Stage-time adjustment: `evaluateStageTime()`
- Show result side effects: `performShow()`
- XP and levels: `XP_TOTAL_BY_LEVEL`, `XP_GAIN`, `applyXp()`
- Flow: `checkFlowState()`, `processFlowState()`
- Event triggering: `maybeTriggerEvent()`, `eventMatchesTrigger()`
- Career/v1 progression: `checkLevelProgression()`, `checkEmploymentOffer()`, `maybeTriggerV1Ending()`

## Core State

New games start with:

```txt
name: Red
level: open
levelNumber: 1
xp: 0
fans: 0
motivation: 60
texto: 10
entrega: 5
network: 10
stageTime: 0
activityPoints: 1
currentDay: 1
currentWeekDay: 1 // Segunda
routeCounters: {
  studyCount: 0,
  writeCount: 0,
  rewriteCount: 0,
  contentCount: 0,
  showsScheduledCount: 0
}
```

Important caps:

- `texto`: normally clamped to `0..200`
- `entrega`: normally clamped to `0..200`
- `motivation`: normally clamped to `0..120`, but event effects currently clamp to `0..150`
- Scheduled shows: max `3`
- Venue reputation: `-20..40`

Activity points:

```js
if (state.madeIt) return 3;
if (state.hasEmployment) return 2;
return 1;
```

Current activity costs:

```js
study: 1
desk: 1
day: 1
content: 1
```

## Career Stages

Career stage can be inferred from `state.level` or `state.levelNumber`.

```js
levelNumber >= 11 => headliner
levelNumber >= 6  => elenco
otherwise         => open
```

Stage gates use the order:

```txt
open < elenco < headliner
```

`contentGates.showEligible()`, `contentGates.eventEligible()`, and `contentGates.dialogEligible()` compare a required stage against the current stage.

## Day Loop

Ending a day:

- Increments `currentDay`
- Advances `currentWeekDay`
- Resets `activityPoints` to `getMaxActivityPoints()`
- Clears expired scheduled shows
- Adds `motivation +5`, clamped to `0..120`
- Processes flow decay
- Offers random new-day events after the first show

Weekly reset happens when `currentWeekDay === 1`:

- Increments `currentWeek`
- Resets `eventsThisWeek`
- Resets current elenco weekly circuit progress

Random new-day events:

- Only after at least one show in `showHistory`
- Max `2` random events per week
- New day calls `maybeTriggerEvent("random")` with `10%` chance
- Each random event candidate still applies its own `Math.random() < 0.25` trigger check

Skipping to a scheduled show advances each skipped day manually:

- Adds `motivation +3` per skipped day
- Processes flow decay each skipped day
- Resets activity points at the end

## Writing System

There are two writing modes.

| Mode id | Label | Activity cost | Motivation cost | Fail chance | `textoBonus` | Time bonus |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `desk` | Sentar e escrever | 1 | 15 | 25% | 0.10 | 50% chance |
| `day` | Anotar durante o dia | 1 | 0 | 50% | 0 | 0% |

`desk` requires at least `15` motivation before writing starts.

On successful joke creation:

```js
state.texto += 1 + Math.round(mode.textoBonus * 20)
```

This means:

- `desk`: `texto +3`
- `day`: `texto +1`

Joke length:

```js
minutes = clamp(idea.baseMinutes + (addMinute ? 1 : 0), 1, 2)
```

Base potential:

```js
basePotential = roundTo2Decimals(0.35 + Math.random() * 0.5)
// Range: 0.35..0.85
```

Final joke potential:

The formula uses the current `state.motivation` after the writing mode motivation cost has already been applied.

```js
adjustedPotential = clamp(
  basePotential +
  (state.texto / 250) +
  ((state.motivation - 60) / 400) +
  mode.textoBonus +
  flowBonus +
  perkPotentialBonus,
  0.2,
  0.98
)
```

Where:

- `flowBonus = 0.1` if flow is active, otherwise `0`
- `perkPotentialBonus = getPerkEffect("jokePotentialBonus") + getPerkEffect("setupBonus")`
- New jokes grant `XP_GAIN.jokeNew = 12`
- New jokes add `1` headliner prep point if the player is currently headliner
- Successful new jokes increment `routeCounters.writeCount`

Open players cannot exceed `10` total minutes of material. They must delete material or progress before writing more.

## Rewrite System

Rewrite does not spend activity points. It requires `motivation >= 4`.

On rewrite:

```js
state.motivation -= 4
state.texto += 1
joke.truePotential = clamp(
  basePotential +
  (state.texto / 160) +
  flowBonus +
  rewritePerkBonus +
  classRewriteBonus,
  0.2,
  0.98
)
```

Where:

- `basePotential` is the same `0.35..0.85` roll used by new jokes
- `flowBonus = 0.1` if flow is active
- `rewritePerkBonus = getPerkEffect("rewriteBonus")`
- `classRewriteBonus = 0.04` if the player has the `betterRewrite` class passive
- Rewritten joke length is `2` minutes with `30%` chance, otherwise `1`
- Rewrite grants `XP_GAIN.jokeRewrite = 6`
- Rewrite adds `2` headliner prep points if the player is currently headliner
- Successful rewrites increment `routeCounters.rewriteCount`

## Show Scoring Formula

Protected formula in `evaluateShow()`.

The show score is calculated per joke, then averaged:

```js
averageScore = sum(jokeScore for each joke) / setList.length
```

Chaos is rolled once per gig and reused for every joke in that set:

```js
luckBase = (state.level === "open") ? 0.10 : 0.05
chaosRange = luckBase * (1 - entrega / 500)
chaosRoll = random(-chaosRange, +chaosRange)
```

Delivery and difficulty:

```js
deliveryBonus = Math.min(entrega / 500, 0.4) + getPerkEffect("deliveryBonus")
remainingDifficultyFactor = Math.max(0.2, 1 - entrega / 500)
difficultyPenalty = show.difficulty * remainingDifficultyFactor
```

At current `entrega` cap 200:

- Delivery reaches `+0.40`
- Difficulty still applies at `60%`
- Open chaos range becomes `+/-0.06`
- Elenco/headliner chaos range becomes `+/-0.03`

Per-joke score:

```js
jokeScore =
  potencyComponent +
  typeComponent +
  chaosRoll -
  difficultyPenalty +
  deliveryBonus +
  flowBonus +
  hecklerDefense +
  bigCrowdBonus +
  classBigRoomBonus +
  longSetBonus +
  lateFatigue +
  crowdWorkBonus
```

Components:

```js
potencyComponent = clamp(joke.truePotential || 0.4, 0, 1) * 0.6
typeComponent = getTypeAffinity(show, joke.tone) * 0.2
```

`getTypeAffinity()` reads `show.typeAffinity[tone]`, then `show.typeAffinity.default`, then `0`, and clamps the map value to `-1..1` before multiplying by `0.2`.

Show scoring bonuses:

- `flowBonus`: `0.08` if flow is active, plus headliner solo prep bonus when applicable
- Headliner solo prep bonus: `min(prepPoints * 0.01, 0.08)` for `headlinerSolo` shows
- `hecklerDefense`: currently added as a flat perk bonus when unlocked
- `bigCrowdBonus`: applied when `show.minMinutes >= 6`
- `classBigRoomBonus`: `+0.04` when class passive `bigRoomDelivery` is active and the show is at least `7` minutes or is an elenco circuit show
- `longSetBonus`: applied when `setList.length >= 3`
- `lateFatigue`: stamina perk bonus applied to jokes at index `3+`
- `crowdWorkBonus`: currently added as a flat perk bonus when unlocked

Known implementation note:

- `economiaDePalavras` defines `jokeEfficiency: 0.15`, but no current scoring or writing formula reads `jokeEfficiency`.

## Stage-Time Adjustment

After `evaluateShow()` returns `averageScore`, the game adjusts for actual set length:

```js
ratio = actualMinutes / expectedMinutes
adjustedScore = averageScore + timeImpact.adjustment
nota = classifyOutcome(adjustedScore)
```

Adjustment table:

| Time ratio | If base score is strong | Otherwise |
| --- | ---: | ---: |
| `< 0.5` | `-0.15` if `baseScore >= 0.35` | `-0.35` |
| `< 0.7` | `-0.05` if `baseScore >= 0.35` | `-0.25` |
| `< 0.9` | `+0.02` if `baseScore >= 0.30` | `-0.12` |
| `0.9..1.2` | `0` | `0` |
| `> 1.2` | `+0.12` if `baseScore >= 0.30` | `-0.15` |
| `> 1.5` | `+0.05` if `baseScore >= 0.35` | `-0.25` |
| `> 2.0` | `-0.10` if `baseScore >= 0.35` | `-0.40` |

The checks are ordered, so `> 2.0` is evaluated before `> 1.5`, and `> 1.5` before `> 1.2`.

## Nota Thresholds

`classifyOutcome()` uses:

| Score threshold | Nota | Label |
| ---: | ---: | --- |
| `>= 0.45` | 5 | Explodiu |
| `>= 0.32` | 4 | Matou |
| `>= 0.18` | 3 | Segurou |
| `>= 0.05` | 2 | Risinhos |
| `< 0.05` | 1 | Deu agua |

Outcome type:

```js
nota >= 4 => kill
nota >= 3 => ok
otherwise => bomb
```

## Show Result Rewards

After a show:

```js
stageTime += flowActive ? 2 : 1
xp += XP_GAIN.show[nota]
fans += max(0, round(totalMinutes * (nota - 1) * 0.8))
motivation += nota >= 4 ? 12 : nota >= 3 ? 2 : nota >= 2 ? -5 : -12
if (nota >= 4) network += 2
entrega += nota >= 4 ? 2 : 1
```

Caps:

- `motivation` is clamped to `0..120`
- `entrega` is clamped to `0..200`

If class passive `stageConsistency` is active and `nota >= 3`:

```js
texto += 1
```

Open-stage consistency:

- Only while career stage is `open`
- Each `nota >= 3` increments `openStageState.consistencyStreak`
- Bad results reset the streak
- At `3` consecutive `nota >= 3`, streak resets and grants `motivation +4`, `texto +2`

Elenco circuit:

- Only for `showType === "elenco15"`
- Each `nota >= 4` increments weekly goal progress
- Weekly target defaults to `2`
- Completing the weekly target grants `network +4`, `texto +3`

Headliner solo:

- Only for `showType === "headlinerSolo"`
- Prestige gain: nota 5 => `+20`, nota 4 => `+12`, nota 3 => `+6`, otherwise `+2`
- Consumes `3` prep points after the solo

Special tape:

```js
quality = clamp(round((nota * 15) + (adjustedScore * 25) + prepPoints * 2), 0, 100)
```

## XP and Levels

XP gains:

```js
show: { 1: 5, 2: 15, 3: 30, 4: 60, 5: 100 }
jokeNew: 12
jokeRewrite: 6
study: 15
content: 10
```

Total XP thresholds:

| Level | Total XP |
| ---: | ---: |
| 1 | 0 |
| 2 | 150 |
| 3 | 330 |
| 4 | 540 |
| 5 | 800 |
| 6 | 1120 |
| 7 | 1500 |
| 8 | 1950 |
| 9 | 2470 |
| 10 | 3050 |
| 11 | 3750 |
| 12 | 4560 |
| 13 | 5480 |
| 14 | 6510 |
| 15 | 7650 |
| 16 | 8900 |
| 17 | 10260 |
| 18 | 11730 |
| 19 | 13310 |
| 20 | 15000 |

Levels above 20 extrapolate from the last increment:

```js
lastTotal + extraLevels * (lastIncrement + 120 * (extraLevels - 1))
```

On level gain:

- `availablePerkPoints += levelsGained`
- Perk selection is offered if any eligible perks exist
- Class selection is offered once the player leaves `open` and has no class
- `levelUp3` events can trigger at level 3+
- Employment/professional opportunity is checked

## Perks

Perk effects are summed by `getPerkEffect(effectKey)` across unlocked perks.

Texto tree:

| Perk | Level | Requires | Effect |
| --- | ---: | --- | --- |
| `premissaSolida` | 2 | none | `jokePotentialBonus +0.05` |
| `economiaDePalavras` | 3 | `premissaSolida` | `jokeEfficiency +0.15` currently unused |
| `tagMachine` | 5 | `economiaDePalavras` | `rewriteBonus +0.10` |
| `callbackMaster` | 7 | none | `longSetBonus +0.10` |
| `setupKiller` | 9 | `tagMachine` | `setupBonus +0.08` |

Entrega tree:

| Perk | Level | Requires | Effect |
| --- | ---: | --- | --- |
| `timingBasico` | 2 | none | `deliveryBonus +0.05` |
| `timingAvancado` | 5 | `timingBasico` | `deliveryBonus +0.10` |
| `presencaDePalco` | 4 | none | `bigCrowdBonus +0.15` |
| `crowdWorkIniciante` | 3 | none | `crowdWorkBonus +0.05` |
| `crowdWorkPro` | 8 | `crowdWorkIniciante` | `crowdWorkBonus +0.12` |
| `lidarComHeckler` | 6 | none | `hecklerDefense +0.10` |
| `energiaAlta` | 10 | `timingAvancado` | `staminaBonus +0.08` |

## Classes and Passives

Class choice appears after leaving `open`. Bonuses apply immediately.

| Class | Immediate bonus | Passive | Professional opportunity requirement |
| --- | --- | --- | --- |
| `comicoClassico` | `texto +6`, `entrega +6` | `stageConsistency` | `texto >= 42`, `entrega >= 42` |
| `roteirista` | `texto +10` | `betterRewrite` | `texto >= 50` |
| `produtor` | `network +12` | `betterShowOffers` | `network >= 42` |
| `atorComico` | `entrega +10` | `bigRoomDelivery` | `entrega >= 50` |
| `influencer` | `fans +25` | `contentBoost` | `fans >= 140` |
| `professor` | `texto +5`, `entrega +5` | `studyBoost` | `texto >= 45`, `entrega >= 35` |

After accepting the professional opportunity:

```js
state.hasEmployment = true
```

This also raises daily activity points to `2`.

Legacy `madeIt` unlocks only at `levelNumber >= 16`, with class-specific requirements:

| Class | Made-it requirement |
| --- | --- |
| `roteirista` | `texto >= 80` |
| `produtor` | `network >= 80` |
| `atorComico` | `entrega >= 80` |
| `influencer` | `fans >= 10000` |
| `professor` | `texto >= 60`, `entrega >= 60` |
| `comicoClassico` | `texto >= 60`, `entrega >= 60` |

`madeIt` raises daily activity points to `3`.

## Flow State

Flow activates when:

```js
consecutiveGoodShows >= 3
texto >= 30
entrega >= 30
flow is not already active
```

Good show means `nota >= 4`.

When active:

```js
state.flowState = { active: true, daysRemaining: 12, endChance: 0.2 }
```

Flow effects:

- Shows add `stageTime +2` instead of `+1`
- Joke creation and rewrite get `flowBonus +0.1`
- Show performance gets `flowBonus +0.08`

Each day while flow is active:

```js
daysRemaining -= 1
endChance = min(1, endChance + 0.066)
```

Flow ends if:

```js
Math.random() < endChance || daysRemaining <= 0
```

When flow ends:

- `flowState = null`
- `consecutiveGoodShows = 0`

## Show Discovery and Scheduling

`generateAvailableShows()` returns up to `3` offers.

Eligibility checks:

- Excludes `isSpecialShow` from regular generation
- Stage gate via `requiresCareerStage` or `requiresLevel`
- Avatar gate via `requiresAvatar`
- Employment/made-it/special-tape gates
- `requiredFans`
- `requiredNetwork`

Special offer insertion:

- Elenco has an `85%` chance to add an elenco circuit gig first
- Post-v1 headliner has an `80%` chance to add a headliner solo gig first
- Unlocked `5a5` can appear for open players with `75%` chance around Sunday
- Unlocked `pague15` can appear around Thursday

Successful scheduled shows increment `routeCounters.showsScheduledCount`, including event-driven scheduling.

Remaining offer count:

```js
remainingSlots = max(0, 3 - specialInsertedCount)
producerExtraOffer = hasClassPassive("betterShowOffers") ? 1 : 0
maxOffersByNetwork = 1 + floor(network / 30) + producerExtraOffer
numShows = min(eligibleShows.length, remainingSlots, maxOffersByNetwork)
```

Open-stage offer weighting:

- Attempts to fill about `70%` of open offers from `isOpenStarter` shows when available

Elenco+ offer weighting:

- Sorts by `Math.random() / getVenueOfferWeight(show.id)`
- Venue offer weight is `clamp(1 + rep * 0.03, 0.35, 2.2)`

Scheduling a show:

- Requires free slot under `MAX_SCHEDULED_SHOWS = 3`
- Adds `network +1`

Canceling today's scheduled show while ending day:

- Removes the show
- Applies `network -5`

## Offered Stage Time

`calculateOfferedTime()`:

```js
5a5 => 3
pague15 => 5
specialTape => max(show.setLengthTarget || 35, 30)
openStarter => clamp(show.minMinutes + 1, 3, 4)
elenco15 => 15
headlinerSolo => max(show.setLengthTarget || 20, show.minMinutes || 10)
show.minMinutes >= 6 => show.minMinutes
```

Otherwise:

```js
maxTime = 3
if stageTime >= 10 => maxTime = 10
else if stageTime >= 4 => maxTime = 5
if careerStage === "elenco" => maxTime = max(maxTime, 15)
if careerStage === "headliner" => maxTime = max(maxTime, 20)

return max(show.minMinutes, min(maxTime, careerStage === "open" ? 5 : 15))
```

## Venue Reputation

Venue reputation is tracked per show id.

Bounds:

```js
VENUE_REPUTATION_MIN = -20
VENUE_REPUTATION_MAX = 40
```

Tiers:

| Reputation | Tier |
| ---: | --- |
| `>= 18` | `casa-favorita` |
| `>= 8` | `quente` |
| `-3..7` | `neutra` |
| `<= -4` | `instavel` |
| `<= -10` | `fria` |

Result delta:

| Nota | Delta |
| ---: | ---: |
| 5 | `+3` |
| 4 | `+2` |
| 3 | `+1` |
| 2 | `-1` |
| 1 | `-2` |

Modifiers:

- `openStarter` positive deltas get `+1` extra
- `headlinerSolo` and `specialTape` negative deltas get `-1` extra

## Content Action

Costs `1` activity point.

```js
reach = max(3, round(stageTime * 1.5 + totalMaterialMinutes * 0.75 + random(0..12)))
baseFanGain = reach + round(texto / 3)
fanGain = contentBoost ? round(baseFanGain * 1.35) : baseFanGain
```

Then:

```js
fans += fanGain
network += 1
motivation -= 4
xp += XP_GAIN.content // 10
```

Motivation is clamped to `0..120`.

Content can trigger random events and fan milestones.
Successful content actions increment `routeCounters.contentCount`.

## Study Action

Costs `1` activity point.

```js
texto += 4
if studyBoost:
  texto += 1
  entrega += 1
motivation += 2
xp += XP_GAIN.study // 15
```

Study adds `1` headliner prep point if the player is currently headliner.
Successful study actions increment `routeCounters.studyCount`.

## Event Engine

Events never trigger before the first show.

`maybeTriggerEvent(trigger, context)` exits if:

- There is already an active event
- There is already a pending event
- No trigger was provided
- `state.showHistory` is empty
- Random weekly cap has been reached

Random weekly cap:

```js
if trigger === "random" && eventsThisWeek >= 2 => no event
```

General event gates:

- `once` events cannot repeat after their id is in `eventsSeen`
- `cooldown` events require enough days since `lastTriggered`
- `requiresCareerStage` or `requiresLevel` must match current stage
- `requiresCopoSujo` only passes at `5a5` or `pague15`
- `requiresGoodPerformance` requires at least `3` historical shows with `nota >= 4`
- `requiredFans`
- `requiredNetwork`

Trigger-specific rules:

| Trigger | Rule |
| --- | --- |
| `showKill` | Always passes after general gates |
| `showBomb` | `(adjustedScore ?? averageScore ?? score ?? 0) <= -0.05` |
| `fans20` | `fans >= 20` |
| `fans30` | `fans >= 30` |
| `fans50` | `fans >= 50` |
| `jokes5` | exactly `5` jokes |
| `pague15Invite` | `shows5a5AtLevel4 >= 3` and `!pague15Unlocked` |
| `random` | `Math.random() < 0.25` per candidate |
| `levelUp3` | `levelNumber >= 3` |

Event effects:

```js
fans += effects.fans, minimum 0
motivation += effects.motivation, clamped 0..150
texto += effects.texto, clamped 0..200
entrega += effects.entrega, clamped 0..200
stageTime += effects.stageTime, minimum 0
network += effects.network, minimum 0
storytellingUnlocked = true if effect is set
```

## V1 Ending

`state.v1Completed` becomes true when all are true:

- Career stage is `elenco`
- A class has been chosen
- Professional opportunity has been accepted (`hasEmployment`)
- Current show is an elenco showcase: `showType === "elenco15"` or `show.isElencoCircuit`
- Current show result is `nota >= 4`

After v1 completion, headliner/solo/special-tape systems are allowed to expand.

## Special Tape

Special tape eligibility requires:

- Career stage is `headliner`
- `levelNumber >= 19`
- `fans >= 3500`
- `network >= 110`
- `headlinerSoloState.solosCompleted >= 3`
- There is a special draft set
- Tape has not already been completed

When offered and accepted:

- Schedules `taping-especial`
- Schedules it `3` days ahead
- Uses `showType = "specialTape"`

## Legacy Score

The post-v1 legacy layer has three score helpers.

Consistency:

```js
recent = last 12 shows
average = average nota
consistency = share of recent shows with nota >= 4
score = clamp(round((average / 5) * 60 + consistency * 40), 0, 100)
```

Craft:

```js
score = clamp(round(
  texto * 0.3 +
  entrega * 0.25 +
  min(40, soloPrestige * 0.6) +
  min(15, specialTapeQualityScore * 0.15)
), 0, 100)
```

Audience:

```js
score = clamp(round(
  min(70, log10(fans + 10) * 20) +
  min(30, network * 0.3)
), 0, 100)
```

Legacy tier:

| Total score | Tier |
| ---: | --- |
| `>= 85` | `LENDARIO` |
| `>= 70` | `CONSAGRADO` |
| `>= 55` | `RESPEITADO` |
| otherwise | `PROMISSOR` |

## Agent Change Checklist

When changing mechanics:

1. Update the relevant formula in `script.js`.
2. Update this file in the same commit/change.
3. If a formula changes score magnitude, re-check `SCORE_EMOJI_SCALE` thresholds.
4. If `texto`, `entrega`, or `motivation` caps change, update all clamps and UI descriptions.
5. If a perk effect key changes, verify `getPerkEffect()` call sites.
6. If show offers change, check `generateAvailableShows()`, `calculateOfferedTime()`, and event unlocks.
7. Treat `BALANCE_*.md` and `CAP_*.md` as historical unless you intentionally refresh them.
