# Open Mic RPG — live ship board

Last updated: 2026-07-10  
Deadline: **2026-07-23** (12 days to build, ship on day 13)  
Owner: Illan  
Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

## North star

Ship everything DESIGN_V2 specifies. No cuts. Everything in the design doc ships by Jul 23.

## Done (baseline as of 2026-07-10)

- [x] V2 run schema / save migration path (schema 3)
- [x] Class auto-detection via hidden Event 1/2 paths
- [x] Mentor forks (Rossini / Gabriel early + late)
- [x] Crowd work + político tone
- [x] Generic + pure ending resolution
- [x] Ending copy in `content/endings.js`
- [x] Legacy archive option unlocks
- [x] Mechanics test suite green (`20/20` via `node --test tests/v2-mechanics.test.js`)

## Now — ship blockers / highest value

### A. Ending presentation (approved design, not fully built)

Today: ending still uses critical-dialog popup (`finalizeRun` → dialog with Nova corrida / Ver histórico).

Target: dedicated full-screen state (DESIGN_V2):

- [x] HTML/CSS ending shell (lock gameplay while active)
- [x] Wire existing ending resolver output into shell (title, prose, summary, unlocks)
- [x] Actions: `Nova corrida`, `Ver arquivo` (or history/archive equivalent)
- [ ] Canvas compositor + art-recipe manifest (can start with base fallback only)
- [ ] Progressive layer reveal if assets exist; skip missing layers safely
- [ ] Accessibility text equivalent for canvas
- [ ] Persist art recipe in archive (not bitmap)

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

## Remaining DESIGN_V2 items (all in scope)

### D. Special endings (DESIGN_V2 § Deferred Special Endings)
- [ ] O Bastidor Sombrio (Produtor + Humor Negro)
- [ ] O Profeta do Caos (Político + Humor Negro 50/50)
- [ ] O Camaleão (no tone > 30%)
- [ ] O Herdeiro (all 5 classes across runs + secret 6th class)
- [ ] O Silêncio (day 100 failure — prose may already exist)

### E. Hidden paths polish
- [ ] Eclético mechanics
- [ ] Secret tone identities + unlock rules
- [ ] Final special-ending precedence rules

### F. Art & polish
- [ ] Ending art layers (class / tone / structure / path / lighting)
- [ ] Ending gallery in archive UI
- [ ] Shareable ending image export
- [ ] Copy polish pass across all ending tiers
- [ ] Ending accessibility text

### G. Onboarding
- [ ] Tutorial/onboarding clarity for V2 systems
- [ ] README fully accurate for shipped state

## Session log (append short notes)

### 2026-07-10
- Created `.hermes.md`, `AGENTS.md`, `TASKS.md` for agent pickup from repo cwd.
- Verified tests: 20/20 pass.
- Confirmed ending presentation still dialog-based; main remaining product polish for ship.
- Replaced ending critical-dialog presentation with full-screen HTML/CSS shell wired to existing resolver/finalized run output.

## Next session start here

1. Implement ending HTML shell + plug resolver output (A first 3 boxes)
2. Manual playtest one successful class run
3. Canvas compositor + art layers
4. Then special endings, hidden paths, gallery — full DESIGN_V2 scope
