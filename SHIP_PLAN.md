# Open Mic RPG — Pre-Production Implementation Plan

> **Status: first implementation pass completed 2026-07-28.**
>
> This is the active place to collect the final gameplay, balance, onboarding, and shipping changes before production. Add decisions here, then convert agreed items into implementation phases.

## Goal

Ship a 100-day career run where early learning, meaningful events, gig choices, career paths, and endings feel connected. A new run must have clearer progression; later runs must respect permanent option unlocks without granting free stats.

## Locked product direction

- Predefined characters; no avatar customizer in V2.
- Show-result art is 30 finished result × avatar images, not runtime layers. See `assets/scenes/results/README.md`.
- Ending presentation is a main-panel screen. Ending art uses one finished, avatar-neutral illustration per ending route; no Canvas/layer system.
- Legacy/archive unlocks grant options only, never stats.
- Mentor-owned options (`humor negro`, `storytelling`, `prop`, `oneliner`) must stay mentor-owned and cannot be granted merely by levels, study, or archive completion.

## Intake: progression and onboarding

### First-run writing tutorial

- The first ever `Escrever Piada` interaction must be generic: no tone picker and no content guide.
- A lesson/tutorial then teaches the player how tone/content direction works and unlocks the first writing choices.
- From the second run onward, those first writing choices start unlocked, as they do today.
- Implemented: the first joke is generic, then Carvalho teaches tone/structure; the lesson carries into later runs.

### Crowd work unlock

- Crowd work must not be available from day 1.
- Unlock it later through a Professor Carvalho dialogue or a crowd-related character event/challenge.
- The unlock needs a clear player-facing explanation and archive behavior for subsequent runs.
- Implemented: Carvalho unlocks it after the second performed show; it persists into later runs.

### Permanent option-unlock map

Create one explicit table for what starts unlocked by run number, what unlocks during a run, and what carries to later runs.

Initial known rules:

| Option/system | First run | Later runs | Notes |
|---|---|---|---|
| Base writing choices | gated behind first tutorial lesson | start unlocked after the lesson was learned | no stat carryover |
| Crowd work | locked | unlock policy TBD | requires Carvalho/event design |
| `hack` tone | existing run-count/level logic needs review | TBD | preserve option-only carryover |
| `político` tone | level 8 or Carvalho currently | must become permanently available after its first genuine unlock, not only after a dominant political ending | remove circular progression |
| Mentor-owned tones/structures | Rossini/Gabriel only | Rossini/Gabriel only | never archive/level unlocked |

## Intake: events and decision impact

### Rebalance event outcomes

- Incidental and major events need materially larger, more legible consequences.
- Decisions must create real tradeoffs across `texto`, `entrega`, `network`, `fans`, and `motivação`, and should help steer the final path/ending rather than feel like tiny noise.
- Audit all event effects together; establish a shared effect scale rather than adjusting isolated events.
- Important choices can have delayed outcomes, route flags, gig opportunities, or stronger short-term costs.

### Advertising / gambling event

- Rework the bad-advertising event into **Jogo do Tigrinho**.
- It should present a meaningful decision, for example: follower/network gain or immediate money/visibility versus motivation loss, text damage, reputation/path pressure, or another real career cost.
- Implemented as the random **Jogo do Tigrinho** event: reach/network versus text/motivation; the player can reject it and turn the pitch into material.

## Intake: study and resource economy

### Study tracking

- Surface a player-visible metric for total times studied.
- Implemented: the top stat panel shows total studies and the current weekly count.

### Weekly study cap

- Implemented: maximum 3 study actions per week, reset each Monday. Automated mechanics coverage passes; a full manual balance playtest remains required before shipping.

## Intake: gigs and scheduling

### Portuguese show browser

- `Buscar Show` must show every relevant gig stat and label in Brazilian Portuguese.
- Audit all show cards/options for leftover English labels and inconsistent terminology.

### Important-event fourth gig

- Normal schedule remains capped at 3 gigs.
- An important event may inject a fourth scheduled gig and bypass that normal cap, e.g. `Turnê do Veterano`.
- The UI must clearly mark the exceptional opportunity and preserve it without silently replacing another gig.
- Implemented: event gigs use an explicit overflow flag, are retained in save state, and are marked as `CONVITE ESPECIAL` in the scheduled-show UI. Manual collision playtesting remains required.

## Intake: ending and balance review

- Class endings must be reviewed for a credible minimum amount of real stage experience. The current Roteirista endpoint can be visually previewed with five gigs and needs balance review before shipping.
- Re-test default, almost, failure, class, and pure endings after progression/economy changes.
- Keep ending formatting shared across ending categories; only data, title, prose, and resolved finished illustration vary.

## Required implementation order (after intake is complete)

1. Finalize the permanent unlock table and tutorial triggers.
2. Implement/test first-run tutorial gates, subsequent-run option carryover, and crowd-work unlock.
3. Rebalance events as one system, including the Jogo do Tigrinho event.
4. Validate study tracking and simulate the three-studies-per-week proposal before deciding it.
5. Improve gig-browser copy and exceptional fourth-gig scheduling.
6. Rebalance class/default endpoint thresholds, then run full manual 100-day playthroughs.
7. Resume ending art/gallery/deployment work.

## Verification requirements

- Add mechanics tests for every new unlock/carryover rule, study cap (if adopted), and fourth-gig exception.
- Run `node --test tests/v2-mechanics.test.js` after each mechanics phase.
- Manually playtest a first run and a second run to verify tutorial/carryover differences.
- Manually playtest class, default, almost, and failure paths after balance changes.

## Open decisions — wait for user input

- Exact trigger/copy for the first writing lesson.
- Exact trigger/character/event for crowd-work unlock.
- Final permanent-unlock table for every tone, structure, and perk.
- Exact Jogo do Tigrinho outcomes and whether money/reputation becomes a visible resource.
- Whether the weekly study cap is adopted after simulation.
- Minimum gig/show thresholds for each class ending.
- Any additional final pre-production changes.
