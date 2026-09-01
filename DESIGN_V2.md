# Design V2 — Roguelite Run-Based Restructure

> New decisions from the redesign conversation. Supersedes where it conflicts with the legacy [`CAREER_REWORK_PLAN.md`](docs/legacy/plans/CAREER_REWORK_PLAN.md).

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
| `oneliner` | — | Early Gabriel fork, or late Gabriel revisit |
| `storytelling` | — | Early Rossini fork, or late Rossini revisit |
| `prop` | — | Early Gabriel fork, or late Gabriel revisit |
| `crowd work` | — | **New**: pseudo-structure, not written. 1-3 min allocated in show prep. Scored on `entrega + chaos + crowdWorkPerks`. No `truePotential`. |

---

## Tone Progression (revised)

| Tone | Default | Unlock |
|------|---------|--------|
| `besteirol` | Day 1 | — |
| `vulgar` | Day 1 | — |
| `limpo` | Day 1 | — |
| `humor negro` | — | Early Rossini fork, or late Rossini revisit |
| `hack` | Day 1 (2+ runs completed) | Level 5+ |
| `político` | — | **New**. Level 8+ OR Carvalho event. |

---

## Class Auto-Detection (replaces manual pick)

Classes are assigned based on behavior counters and event outcomes. No menu choice.

| Class | Key Counters | Career Crossroads option (day 32-60, 6+ performed shows) | Event 2 "A Virada" (day 40-55, 7-14 days) |
|-------|-------------|------|------|
| Cômico Clássico | `consecutiveGoodShows`, `showsScheduledCount` | Fill weekly lineup slot | Veteran asks you to open — outcome from show consistency |
| Roteirista | `texto`, `writeCount`, `rewriteCount` | Help a comic punch up a set | Writer room sees your material — outcome from texto |
| Produtor | `network`, `showsScheduledCount` | Organize the night's lineup | Bruno Berg: co-produce a full night — outcome from network |
| Ator Cômico | `entrega`, big room shows | Casting director in audience | Sketch/acting project invite — outcome from entrega |
| Influencer | `fans`, `contentCount` | Viral clip opportunity | Brand collab / podcast circuit — outcome from fans |

- The Career Crossroads appears once the player has enough stage evidence (day 32-60, at least 6 performed shows) and offers up to four eligible class doors based on hidden counters.
- Choosing a Crossroads option starts that path and suppresses other class Event 1 offers for the run.
- Event 2 appears only for the chosen path when its later requirements are met.
- Each Event 2 has two exclusive approaches with different large bonuses and a persistent path flag.
- Choosing an Event 2 approach locks and assigns that class after its multi-day fast-forward.

## Event Taxonomy and Mentor Forks

There are exactly two mechanical event kinds:

- `incidental`: small world events that change stats, schedule shows, or add texture without defining the run.
- `path`: hidden-threshold events with persistent exclusive choices. Class events and mentor forks belong here.

Rossini and Gabriel are independent forks, so a run may receive both:

| Mentor | Early fork (days 15-35) | Late revisit (days 70-85) |
|--------|--------------------------|---------------------------|
| Rossini | `humor negro` or `storytelling`, large bonus, specialization flag | Unlock the unchosen option, +2 only, no specialization |
| Gabriel | `prop` or `oneliner`, large bonus, specialization flag | Unlock the unchosen option, +2 only, no specialization |

The early choice is run-defining. The late revisit broadens the player's toolbox but cannot qualify as an early specialization or manufacture a pure ending. These four skills are mentor-owned: levels, study, bombs, class victories, and legacy archive entries do not unlock them in new runs. Existing save booleans remain valid for migration safety.

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

### Ending Screen Presentation (approved; implementation deferred)

The ending must be a dedicated full-screen game state, never a critical-dialog popup. Gameplay remains locked while this screen is active.

Use a direct-image renderer:

- **One finished PNG** renders the ending illustration.
- **Semantic HTML/CSS** renders the ending title, prose, run summary, unlock reveal, archive status, and actions.
- Do not render the whole interface inside Canvas.

The artwork contract is a square `1024×1024` finished illustration. It is selected by ending route and displayed directly; no visual layers, transparent safe areas, or draw order exist.

The selected ending route determines the final illustration. Class, pure-tone, and special routes each receive one authored scene; prose and summary preserve the remaining route-specific detail without multiplying art assets by avatar or stat combination.

Ending art uses one finished, avatar-neutral illustration per ending route. Do not use a Canvas compositor, art-recipe manifest, or runtime layers. The selected avatar is never shown directly; illustrations use a generic silhouette/shadow, cropped figure, or no performer so one asset works for every avatar. Store a stable ending-art ID/path in the archive, not a bitmap or data URL.

### Show result art (no layering)

Show outcomes are **not** composed from transparent layers. Deliver **30 finished images**: 5 result tiers × 6 avatars.

- Paths: `assets/scenes/results/<avatarId>/<resultId>.png`
- Result ids: `deu-agua`, `risinhos`, `segurou`, `matou`, `explodiu`
- Avatar ids: `avatar1` … `avatar6`
- Keep `assets/scenes/performance/` as fallback until pairs exist
- Details: `assets/scenes/results/README.md`

Ending-run art is stored as finished class, pure-tone, and special-ending illustrations under `assets/scenes/endings/`; it is not mixed with show-result assets.

### Character Scope Decision

V2 does **not** include a player avatar builder, recolorable clothing, or modular face/hair/body layers. Use predefined characters and finished result×avatar images for show outcomes. Character customization may be reconsidered after V2, but it must not block ending art.

The screen should reveal:

- a named ending title
- the selected finished illustration
- the ending prose
- a concise summary of class, dominant tone, dominant structure, important path, days, and shows
- newly unlocked options
- `Nova corrida` and `Ver arquivo` actions

The archive should display discovered ending art and conceal undiscovered endings without exposing their exact requirements. Every illustration must have an equivalent text description for accessibility. A shareable image export can be added after the screen and archive are stable.

Recommended implementation sequence:

1. replace the ending popup with the full-screen HTML shell
2. add direct finished-illustration lookup and a neutral fallback
3. map class, pure-tone, and special ending IDs to finished illustration assets
4. persist the ending-art ID and add the ending gallery
5. test illustration selection, fallback behavior, archive restoration, and responsive rendering

This presentation contract is independent of the final ending thresholds and prose, which are still being revised.

### Template Endings
Layer system:

| Layer | Count | Content |
|-------|-------|---------|
| Class base text | 5 | How clubs call you — flavor per class |
| Tone flavor line | 6 | Carvalho's remark based on dominant tone |
| Structure flavor line | 5 | Whole-run dominant performed structure, counted by minutes |
| Performance tier | 3 | Glorioso / Honesto / Queimado |

Generic successful endings combine class (or default), dominant tone, dominant structure, and performance tier. They use whole-run tallies, never the last show alone.

### Pure Endings

Pure endings upgrade an already successful class/default ending; they never rescue an `almost` or `failure` run.

- Tone-pure: one tone has at least 65%, the second tone has at most 20%, and at least 3 structures were performed.
- Structure-pure: one structure has at least 65% of performed minutes and at least 3 tones were performed.
- Mentor-owned dominant options require their matching early specialization flag. A late revisit does not count.
- If both axes qualify, the larger dominance margin wins; an exact tie prefers tone-pure.

### Deferred Special Endings (not active)

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

These combinations remain design notes only. The active milestone implements generic and pure endings; corruption, Cópia, Camaleão, Eclético, and other hidden routes remain deferred.

---

## Legacy Archive (cross-run, survives wipe)

Stored in `localStorage` key `"openMicRPG.legacyArchive.v1"`. Each run completion also records `dominantStructure` and `pureEndingId`.

| # Runs | Unlocks |
|--------|---------|
| 2 | `hack` from day 1, Ator Cômico + Influencer classes unlocked |
| Dominant `político` in a past run | `político` from day 1 |

The archive never bypasses the Rossini/Gabriel mentor forks for `humor negro`, `storytelling`, `prop`, or `oneliner`.

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
