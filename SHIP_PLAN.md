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

### Permanent option-unlock map — implemented progression table

**Purpose:** each finished run should make the next run more expressive, not numerically easier. Archive rewards grant access, context, and a clearer route toward endings; they never grant stats, XP, free jokes, or automatic career success.

| Player state at the start of a run | Starts available | What the player can earn during that run | What carries into the next run |
|---|---|---|---|
| **Run 1** (no completed archive run) | First `Escrever Piada` is generic. After it, the starter writing choices (`besteirol`, `vulgar`, `limpo` + `bit`) are taught. No crowd work. | Carvalho unlocks crowd work after two performed shows. Political can be discovered through Carvalho/level 8. Rossini/Gabriel provide mentor-only options. | Writing guide always; crowd work if learned; political if genuinely discovered. No stats carry over. |
| **Run 2** (1 completed run) | Writing guide and first writing choices from day 1. Crowd work and political start available only if learned in Run 1. | The player can deliberately pursue a better class/default or pure ending with the tutorial friction removed. Mentor options still require the mentor path again. | Same option unlocks, plus completion credit toward the expansion gate. |
| **Run 3+** (2 completed runs) | `hack` starts unlocked. Ator Cômico and Influencer routes are available. `político` starts unlocked as a guaranteed New Game+ option, even if it was not discovered earlier. | A full run can now deliberately target a pure political ending from day 1; advanced class routes can be attempted. | Finishing any pure ending records its mastery in the archive and unlocks that ending's clue/preview in the gallery, never a stat bonus. |
| **After a pure ending** | All prior options remain. The archive/gallery shows the achieved pure ending and its related special-ending clue where relevant. | Special endings remain earned by their actual in-run/cross-run conditions, not by a menu toggle. | Completion flags contribute to special-ending eligibility only. |
| **After all 5 class endings** | All ordinary class routes and earned tone options remain. | Completing the fifth distinct class ending resolves **Herdeiro**. | No numeric reward; this is the final long-term meta-progression gate. |

#### Non-negotiable rules

- **Mentor-owned options never become archive unlocks:** `humor negro`, `storytelling`, `prop`, and `oneliner` must be earned through Rossini/Gabriel in each run.
- **Political is the deliberate exception:** Carvalho/level 8 can reveal it early; completing two runs guarantees it at the next start so a player gets a clean, intentional pure-political attempt.
- **Crowd work is a learned craft, not a run-number prize:** it persists only after Carvalho has taught it through real stage experience.
- **Special endings are goals, not collectibles:** their conditions are shown as clues after relevant achievements, but their actual resolution still needs the required behavior.
- **No archive stat carryover:** no `texto`, `entrega`, `network`, `fans`, motivation, XP, activity points, or free career assignment crosses runs.

#### Implementation status

The table is now active. Two archived completed runs guarantee `hack`, Ator Cômico, Influencer, and `político` on the next start; mentor-owned options remain per-run only.

## Intake: events and decision impact

### Rebalance event outcomes

- Implemented event-impact policy: normal non-gig choices now have a clearly meaningful primary change (typically 8+), while career Event 1/2 decisions remain stronger.
- Decisions use explicit tradeoffs across `texto`, `entrega`, `network`, `fans`, and `motivação`; no generic option-only reward is a negligible +2/+3 outcome.
- A gig created by an event/challenge is scheduled as a real event gig. It can occupy the fourth slot, is marked `CONVITE ESPECIAL`, and cannot create a fifth scheduled show or grant its choice effects if the agenda is already full.

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
- Accepting a multi-day career challenge never advances the calendar automatically. The player advances days normally; challenge days grant zero activity points, while scheduled gigs and every action that normally costs no activity points remain available. The challenge resolves after its stated number of player-advanced days.

### Black House Comedy route

- Implemented **Se Vira nos 5** as a João Valio invite after a nota 3+ performance at Paulo Araújo's 5 a 5.
- The Black House gig gives the player 5 minutes, is located in Sorocaba - SP, and is always scheduled two days ahead for the trip.
- A nota 4+ result at Se Vira nos 5 unlocks João's conditional **Show de Elenco - Black House Comedy** invitation once the player reaches Elenco.
- Both invitations create real scheduled gigs, use João's portrait and advice, persist their unlocks, and use the finished Black House venue scene based on the supplied stage references.

## Intake: ending and balance review

- Implemented class-path flow: instead of showing multiple separate Event 1 popups, the game now waits until day 32-60 with at least 6 performed shows, then presents a single **Encruzilhada da carreira** with up to four eligible doors. Event 2 can confirm that first direction or pivot to another class whose later criteria are met; the final class locks only after choosing an Event 2 branch.
- Implemented special endings, all using their finished avatar-neutral scene art:
  - **Bastidor Sombrio:** successful Produtor ending, dominant `humor negro`, and Rossini's early humor-negro specialization.
  - **Profeta do Caos:** a successful ending with `político` and `humor negro` each at 40–60%, plus three structures.
  - **Camaleão:** a successful ending with at least four tones, no tone above 30%, and three structures.
  - **Herdeiro:** the successful fifth distinct class ending across the archive.
  - **Silêncio:** the Day 100 failure ending.
- Class endings must be reviewed for a credible minimum amount of real stage experience. The current Roteirista endpoint can be visually previewed with five gigs and needs balance review before shipping.
- Re-test default, almost, failure, class, and pure endings after progression/economy changes.
- Keep ending formatting shared across ending categories; only data, title, prose, and resolved finished illustration vary.

## Intake: comedy-theory insertion (agreed 2026-08-20, design only — implementation deferred)

Direction chosen by Illan. Two pieces, both meant to put real comedy-theory text into the run. No new UI/systems required. Keep all player-facing prose in `content/*.js`, not hardcoded in `script.js`.

### Study — varied text outcomes, same button

- **Current:** `handleStudy()` at `script.js:4576`. One button; a fixed single narration line at `script.js:4596` ("Você mergulha em especiais, podcasts e livros de comédia…"). Stats identical every press: -1 AP, +4 texto, +2 motivation, +15 XP (`XP_GAIN.study`), `studyCount++` and `weeklyStudyCount++` (capped 3/week via `canStudyThisWeek`, `script.js:139`).
- **Change:** keep the one button and all stat/XP/counter behavior. Each Study press returns a **different** theory/lesson line, drawn from a rotating PT content pool (tone×venue craft, structure, delivery, crowd work, stage energy). Avoid immediate repeats; allow reuse once the pool has cycled. Only the narration text (line 4596) varies.
- **Where:** new `studyLines` (or equivalent) pool on `OpenMicRpgContent` in `content/world.js`; consumed in `handleStudy`. Match the existing Brazilian comedy-circuit voice.

### More Carvalho dialog beats

- **Current:** 12 Carvalho dialogs, ids `carvalho-*` at `content/events.js:135-256`, fired via `maybeTriggerCarvalhoDialog` + career milestones.
- **Change:** add more, deliberate craft-lesson beats — additional stage transitions and craft milestones (candidates to design later: a "consolidated set" beat, a follow-up after N studies, a mentor-fork follow-up, deep-elenco milestone, etc.). Follow the existing milestone/dialog pattern.
- **Where:** content in `content/events.js`; trigger wiring in the same `maybeTriggerCarvalhoDialog`/milestone path used today. Add mechanics tests for any purely mechanical new trigger.

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

## Remaining ship sequence after mechanics implementation

1. Complete the two representative full-run playtests and fix any progression or balance defects they reveal.
2. Complete the player-facing Portuguese copy and terminology pass.
3. Build the archive ending gallery from persisted `endingArtId` data, showing discovered art while concealing undiscovered endings and their exact conditions.
4. Add shareable ending-image export after the gallery behavior is stable.
5. Polish first-run onboarding for writing, crowd work, hidden class discovery, and cross-run legacy progression.
6. Update README so its V2 feature claims, class auto-detection status, avatar count, persistence, and local-play instructions match the shipped game.
7. Confirm the production URL, deploy the current main branch, and smoke-test the deployed build on mobile and desktop.

Eclético mechanics and secret-tone identities remain deferred by `DESIGN_V2.md`; they are not 1.0 blockers. Linking the game from the personal hub or course remains optional post-release work.

## Closed intake decisions

- The first writing interaction is generic; Carvalho then teaches tone and structure choices.
- Carvalho unlocks crowd work after two performed shows.
- The permanent option-unlock table is implemented without numeric-stat carryover.
- Jogo do Tigrinho uses reach/network versus text/motivation; no new visible money resource was added.
- The weekly study cap is three and is covered by mechanics tests.
- Class endings require at least ten performed gigs.
- Any new pre-production requirements should be added to `TASKS.md` before implementation.
