# Design V2 — Roguelite Run-Based Restructure

> New decisions from the redesign conversation. Supersedes where it conflicts with `CAREER_REWORK_PLAN.md`.

> Implementation: content is split across `content/`, active saves use schema V3, class paths use hidden deterministic thresholds, and ending copy is centralized in `content/endings.js`.

---

## Run Philosophy

- **Hard reset** each run — no stats carry over.
- Cross-run legacy unlocks widen options, not numbers.
- Run ends when the comic is "formed" and asks: **"E como eu monto meu solo?"** — cliffhanger.
- Solo itself is next year's game.

---

## Structure Progression (revised)

| Structure | Default | Unlock |
|-----------|---------|--------|
| `bit` | Day 1 | — |
| `oneliner` | Day 1 (with legacy) | First study action |
| `storytelling` | Day 1 (Roteirista beaten) | Rossini Luz event (L3) or auto at L6 |
| `prop` | Day 1 (Ator Cômico beaten) | Level 10+ |
| `crowd work` | — | **New**: pseudo-structure, not written. 1-3 min allocated in show prep. Scored on `entrega + chaos + crowdWorkPerks`. No `truePotential`. |

---

## Tone Progression (revised)

| Tone | Default | Unlock |
|------|---------|--------|
| `besteirol` | Day 1 | — |
| `vulgar` | Day 1 | — |
| `limpo` | Day 1 | — |
| `humor negro` | Day 1 (if dominant in past run) | First bomb at nota 1 AND level 5+ |
| `hack` | Day 1 (2+ runs completed) | Level 5+ |
| `político` | — | **New**. Level 8+ OR Carvalho event. |

---

## Class Auto-Detection (replaces manual pick)

Classes are assigned based on behavior counters and event outcomes. No menu choice.

| Class | Key Counters | Event 1 "A Porta" (day 15-30, 3 days) | Event 2 "A Virada" (day 40-55, 7-14 days) |
|-------|-------------|------|------|
| Cômico Clássico | `consecutiveGoodShows`, `showsScheduledCount` | Fill weekly lineup slot | Veteran asks you to open — outcome from show consistency |
| Roteirista | `texto`, `writeCount`, `rewriteCount` | Help a comic punch up a set | Writer room sees your material — outcome from texto |
| Produtor | `network`, `showsScheduledCount` | Organize the night's lineup | Bruno Berg: co-produce a full night — outcome from network |
| Ator Cômico | `entrega`, big room shows | Casting director in audience | Sketch/acting project invite — outcome from entrega |
| Influencer | `fans`, `contentCount` | Viral clip opportunity | Brand collab / podcast circuit — outcome from fans |

- Event 1s can be accepted freely (3 days each). They start the path.
- Event 2s cost 7-14 days, no AP during that period, image + fast-forward text.
- Event 2 appears only when its hidden deterministic thresholds are met.
- Accepting Event 2 locks and assigns that class after its multi-day fast-forward.

---

## Days as Resource

- Each action costs days. Events cost multiple days.
- Spreading across many events = nothing completed by day 100 = failure.
- Focused player: picks 1 path, gets class ending early.

---

## New Content

### Crowd Work (pseudo-structure)
- Appears in show prep screen only. Player allocates minutes alongside jokes.
- Scored: `entrega + chaos + crowdWorkPerks + deliveryBonus` only.
- No joke object, no potential.

### Político (6th tone)
- Unlock: Level 8+ or Carvalho event.
- Venue affinity: strong in universitário, podcast, teatro alternativo.
- Penalty: corporativo, shopping, casamento.

### Professor Carvalho Expansion
- Existing mentor dialogs stay.
- New dialogs: class assertion (unique line per class), Event 2 success/failure, político unlock.
- Carvalho's final line always in ending — template per tone, unique for special endings.

---

## Endings

### Run Endpoint
The run ends when the comic reaches a point where clubs ask about a solo. Cut at: **"E como eu monto meu solo?"**

### Template Endings
Layer system:

| Layer | Count | Content |
|-------|-------|---------|
| Class base text | 5 | How clubs call you — flavor per class |
| Tone flavor line | 6 | Carvalho's remark based on dominant tone |
| Performance tier | 3 | Glorioso / Honesto / Queimado |

Produces ~90 combinations from ~14 authored strings.

### 5 Special Endings (full unique text + image)

| # | Ending | Trigger |
|---|--------|---------|
| 1 | *O Bastidor Sombrio* | Produtor + Humor Negro dominant |
| 2 | *O Profeta do Caos* | Político + Humor Negro 50/50 |
| 3 | *O Camaleão* | No tone exceeds 30% |
| 4 | *O Herdeiro* | All 5 classes beaten across runs, secret 6th class |
| 5 | *O Silêncio* | Day 100 failure |

### Ending Triggers

| Ending | When |
|--------|------|
| Class ending | Class auto-detected + employed + elenco circuit nota 4+ + network/fans threshold. Early (~day 65-80). |
| Default | Consistent but no class lock. ~day 85-95. |
| Almost didn't make it | Barely met criteria, class weak. ~day 95-100. |
| Failure | Day 100, nothing met. "Talvez na próxima." |

---

## Hidden Paths

Tone combos flagged via `toneTally` ratios:

| Combo | Trigger |
|-------|---------|
| 50/50 político + humor negro | Special flavor |
| 50/50 limpo + besteirol | Special flavor |
| Any two tones 40-60%, rest <15% | Hybrid flavor |

Hidden paths override tone flavor line in template endings. Not full new endings — just a distinct Carvalho remark.

---

## Legacy Archive (cross-run, survives wipe)

Stored in `localStorage` key `"openMicRPG.legacyArchive.v1"`. Each run completion appends: `{ classId, dominantTone, endTier, score, day, runNumber }`.

| # Runs | Unlocks |
|--------|---------|
| 1 | `oneliner` from day 1 |
| 2 | `hack` from day 1, Ator Cômico + Influencer classes unlocked |
| Beat with Roteirista | `storytelling` from day 1 |
| Beat with Ator Cômico | `prop` from day 1 |
| Dominant tone in any run | That tone starts unlocked |

Legacy rewards unlock options only. Eclético, secret tones, and their unlock rules remain disabled until their mechanics are revised.

---

## Systems De-Prioritized (post-1.0 / next year)

- Headliner solo shows
- Special tape recording
- Legacy choice (multidimensional score)
- "Made It" as endgame state
- Sets/headlinerSets system

These may return in the expansion.

---

## Still Deferred

1. Final special-ending routes and precedence details
2. Eclético mechanics
3. Secret tone identities and unlock rules
4. Final ending prose and special-ending images
