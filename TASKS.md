# Open Mic RPG — live ship board

Last updated: 2026-07-28
Deadline: **2026-07-23** (12 days to build, ship on day 13)  
Owner: Illan  
Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

## North star

Ship everything DESIGN_V2 specifies. No cuts. Everything in the design doc ships by Jul 23.

## Active pre-production intake

`SHIP_PLAN.md` is the active implementation record for final gameplay, onboarding, balance, and shipping work.

## Done (baseline as of 2026-07-10)

- [x] V2 run schema / save migration path (schema 3)
- [x] Class auto-detection via a Career Crossroads choice (day 32-60, 6+ performed shows) followed by a multi-path Event 2 commitment that can confirm or pivot to another eligible class
- [x] Mentor forks (Rossini / Gabriel early + late)
- [x] Crowd work + político tone
- [x] Generic + pure ending resolution
- [x] Ending copy in `content/endings.js`
- [x] Legacy archive option unlocks
- [x] Mechanics test suite green (`42/42` via `node --test tests/v2-mechanics.test.js`; last verified 2026-08-31)

## Now — ship blockers / highest value

### A. Ending presentation

Implemented as an embedded dedicated ending state inside the normal game panel:

- [x] HTML/CSS ending shell (lock gameplay while active)
- [x] Wire existing ending resolver output into shell (title, prose, summary, unlocks)
- [x] Actions: `Nova corrida`, `Ver arquivo` (or history/archive equivalent)
- [x] Resolve one finished avatar-neutral illustration per ending route
- [x] Accessibility text for ending illustrations
- [x] Persist ending-art ID/path in archive (not bitmap)

### B. Playtest & polish

- [ ] Full 100-day playthrough (class path + employment + elenco)
- [ ] Full 100-day playthrough (no class / almost / failure)
- [ ] Fix any softlocks, blank dialogs, day-skip bugs found
- [ ] Confirm mentor revisits and pure-ending edge cases in real UI
- [ ] Tone/structure dominance UI clarity if confusing

### C. Ship packaging

- [ ] Confirm deploy target (GitHub Pages / standupsim.sitedoillan.com.br)
- [ ] Deploy latest main
- [ ] Smoke test on mobile + desktop
- [ ] Update README for V2 (class auto-detect is implemented; correct feature claims)
- [ ] Optional: link from personal hub / course later

## Remaining DESIGN_V2 ship items

### D. Special endings
- [x] O Bastidor Sombrio (Produtor + Humor Negro)
- [x] O Profeta do Caos (Político + Humor Negro 40–60%)
- [x] O Camaleão (at least 4 tones, none > 30%)
- [x] O Herdeiro (fifth distinct class ending across runs)
- [x] O Silêncio (Day 100 failure)

### E. Hidden paths status
- Deferred by `DESIGN_V2.md`: Eclético mechanics
- Deferred by `DESIGN_V2.md`: secret tone identities + unlock rules
- [x] Final special-ending precedence rules for the enabled special catalog

### F. Art & polish
- [x] Named NPC portraits: Rossini, Bruno, Douglas, Diego (user-supplied; copying into `assets/characters/`)
- [x] Show result art: 30 finished images (`assets/scenes/results/<avatar>/<result>.png`) — no layering
- [x] Finished avatar-neutral ending illustrations: one per class, pure-tone, and special ending
- [ ] Ending gallery in archive UI
- [ ] Shareable ending image export
- [ ] Copy polish pass across all ending tiers
- [x] Ending accessibility text

### G. Onboarding
- [ ] Tutorial/onboarding clarity for V2 systems
- [ ] README fully accurate for shipped state

## Session log (append short notes)

### 2026-07-10
- Created `.hermes.md`, `AGENTS.md`, `TASKS.md` for agent pickup from repo cwd.
- Verified tests: 20/20 pass.
- Confirmed ending presentation still dialog-based; main remaining product polish for ship.
- Replaced ending critical-dialog presentation with full-screen HTML/CSS shell wired to existing resolver/finalized run output.

### 2026-07-23
- Fixed class-path fallback at the default-ending threshold: qualified Event 1/2 paths are now offered on days 90-99 instead of silently expiring, and a started class event blocks the generic ending until it resolves. Added a regression test for the Roteirista path.
- Moved the ending presentation inside the normal `#blackScreen` gameplay panel, replacing the fixed full-viewport dialog treatment. The ending now uses a temporary performance-scene image placeholder.
- Expanded player-avatar customization to six refined avatars. Show results are 30 finished result×avatar images (no layering); ending layers remain a separate system.
- Dropped show-result transparent-layer composition after a failed preview approach.

### 2026-07-24
- Finished the six-avatar roster and generated all 30 avatar-specific show-result scenes at 1024×1024.
- Wired show results to `assets/scenes/results/<avatar>/<result>.png`, with score-to-result lookup covered by the mechanics test suite.
- Restored mobile narration focus: after a new message settles, mobile viewports scroll it into view while respecting reduced-motion preferences.

### 2026-07-28
- Produced the 17 standalone, avatar-neutral ending illustrations: five class scenes, six pure-tone scenes, five special scenes, and a shared neutral fallback under `assets/scenes/endings/`.
- Wired the ending-art resolver, direct image rendering, fallback behavior, accessibility descriptions, and archive `endingArtId` persistence.
- Added João Valio's Black House Comedy route: Se Vira nos 5 in Sorocaba, two-day travel scheduling, and a nota-dependent Black House Show de Elenco invitation.
- Simplified multi-day career challenges: accepting one never advances time or replaces the current scene. The player advances days normally with zero activity points during the challenge; scheduled gigs and all zero-cost actions remain usable.

### 2026-08-17
- Illan reported (forgot to log earlier): multiple playtests done since 2026-07-28; game WORKS and is functionally FINISHED. New remaining work: comedy-theory insertion points, a few adjustments, near-total player-facing text rewrite.

### 2026-08-20
- Agreed the comedy-theory insertion direction (designed, NOT implemented): (1) Study action returns varied PT theory text per press on the same button — stats/XP/counters unchanged, rotating content pool in `content/world.js` consumed at `script.js:4596`; (2) more Carvalho dialog beats added via the existing milestone pattern. Recorded as intake in `SHIP_PLAN.md` "Intake: comedy-theory insertion".

### 2026-08-31
- Wired available character portraits into NPC/path events: Rossini mentor events now use `assets/characters/rossini.png`, and Douglas Ferreira's event uses `assets/characters/douglao.png`. Verified all content image references exist and mechanics tests pass (`39/39`).
- Reworked career class Event 1 into a single **Encruzilhada da carreira** decision: after day 32, at least 6 performed shows, and hidden path evidence, the game shows up to four plausible class doors and the player chooses which one to pursue.
- Reworked Event 2 into a **Virada da carreira** commitment when multiple paths qualify: the player can confirm the first direction or pivot to another eligible class (e.g. Roteirista → Cômico Clássico), with the initial path and pivot recorded. Mechanics tests pass (`42/42`).
- Fixed pure-structure ending art: Forma pura endings now resolve to dedicated `assets/scenes/endings/pure-structure/*.png` illustrations instead of falling back to the class image.

## Next session start here

1. Design the NEW comedy-theory insertion points (with Illan) — where theory content lands in the run
2. Adjustment pass — the few gameplay tweaks Illan has in mind
3. Text rewrite — player-facing Portuguese copy almost entirely rewritten
4. Then the pre-ship items: ending gallery, shareable ending export, first-run onboarding, README, deploy + smoke test

## Explicitly not blocking 1.0

- Eclético mechanics and secret-tone identities remain deferred by `DESIGN_V2.md`.
- Linking the game from the personal hub/course is optional post-release work.
