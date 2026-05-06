# Open Mic RPG - V1.0 Wrap Implementation

Last updated: 2026-05-06
Scope: finish v1.0 only (Open Mic -> Elenco -> first professional opportunity -> v1 ending)

## Rules
- Do not expand v2/v3 systems now.
- Keep headliner/solo/special/tour code present but gated or future-labeled.
- Preserve current game vibe and architecture. Prefer surgical changes in `script.js` and minimal HTML changes.

## Phase 1 - Data + Persistence Foundation
Status: TODO

1. Refactor `CLASSES` to:
   - `name`, `desc`, `bonus`, `passive`, `empReq`, `opportunityTitle`, `endingFlavor`
2. Add helper:
   - `hasClassPassive(passiveId)`
3. Add state flag:
   - `state.v1Completed` (default `false`)
   - Persist in `loadGameState()` + `saveGameState()`
4. Add helper:
   - `escapeHtml(value)` and use it in all `innerHTML` render points for user-generated strings.

Main touchpoints:
- `script.js`: `CLASSES`, helpers section, `loadGameState`, `saveGameState`, renderers using `innerHTML`.

## Phase 2 - HUD + Stage Language Shift
Status: TODO

1. Show network in HUD:
   - Add stat slot in `index.html`
   - Wire cache + update in `script.js`
2. Stage labels:
   - Open: `✏️ Escrever Piada`, `📋 Material`
   - Elenco+: `🧱 Trabalhar Texto`, `📚 Textos`
3. Writing narration:
   - Open keeps "piada" framing
   - Elenco changes to "trabalhar texto" framing
4. Elenco transition dialog update:
   - Replace current Carvalho text with new "piadas -> texto de 15 min" message.

Main touchpoints:
- `index.html`: stats block
- `script.js`: `cacheElements`, `updateStats`, writing action, Carvalho dialogs

## Phase 3 - Elenco Material Flow
Status: TODO

1. `handleViewMaterial` routing:
   - Open -> notebook view
   - Elenco -> text builder
   - Headliner -> future-content notice (v2/v3)
2. Update builder visible copy by stage:
   - Elenco: "Textos de 15 minutos"
   - Headliner: "futuro v2/v3"
3. New text defaults:
   - Elenco text `targetMinutes = 15` (not 25)
4. Ensure active text can be used for `elenco15` shows.

Main touchpoints:
- `script.js`: `handleViewMaterial`, `openHeadlinerSetBuilder`, set creation flow, set validation/usage in show flow

## Phase 4 - Class Passives (Small Effects)
Status: TODO

Implement passives with minimal deltas:

1. `stageConsistency`:
   - After show with `nota >= 3`, gain `texto +1`
2. `betterRewrite`:
   - Small extra rewrite bonus to `truePotential`
3. `betterShowOffers`:
   - Add one extra eligible show option in generation, when possible
4. `bigRoomDelivery`:
   - Small show score bonus for `minMinutes >= 7` or `showType === "elenco15"`
5. `contentBoost`:
   - `~35%` more fans from content actions
6. `studyBoost`:
   - `+1 texto` and `+1 entrega` extra in study action

Main touchpoints:
- `script.js`: rewrite flow, show list generation, show evaluation, content action, study action

## Phase 5 - Professional Opportunity + Fan Milestones
Status: TODO

1. Replace "Oferta de Emprego" framing with "Primeiro Convite Profissional"
2. New opportunity dialog copy includes:
   - class name
   - `opportunityTitle`
   - v1 arc message
3. Acceptance behavior:
   - `state.hasEmployment = true`
   - `registerCareerChoice("opportunity-accepted", { classId })`
   - show `endingFlavor`
   - save
4. Add helper:
   - `checkFanMilestones()`
   - calls `maybeTriggerEvent("fans20"|"fans30"|"fans50")` by threshold
5. Call milestone helper after all fan-gain sources:
   - shows, content, and events that increase fans

Main touchpoints:
- `script.js`: employment check/offer function, fan gain paths

## Phase 6 - V1 Ending + Gate Future Content
Status: TODO

1. Trigger v1 ending when all are true:
   - stage `elenco`
   - class chosen
   - first professional opportunity accepted
   - performed `elenco15/showcase` gig
   - `nota >= 4`
2. Ending dialog:
   - fixed v1 text
   - append class `endingFlavor`
   - buttons: `Continuar jogando`, `Ver histórico`, `Créditos`
3. Set and persist:
   - `state.v1Completed = true`
4. Do not force restart.
5. Gate v2/v3 mainline:
   - no headliner solo pipeline trigger
   - no special taping trigger
   - no legacy ending trigger
   - no headliner onboarding as primary flow
   - if headliner reached: show future-content notice

Main touchpoints:
- `script.js`: show-resolution path, progression/ending checks, headliner gating branches

## Phase 7 - Autosave + Reset/New Game + QA
Status: TODO

1. Autosave after key state mutations:
   - write/rewrite/delete joke
   - schedule/perform show
   - content action
   - study action
   - end day
   - class choice
   - opportunity accepted
   - text created/updated/deleted/activated
   - v1 completion
2. Add `Novo Jogo` button:
   - label `🗑️ Novo Jogo`
   - `window.confirm`
   - `localStorage.removeItem(STORAGE_KEY)`
   - `window.location.reload()`
3. Manual acceptance run:
   - complete full v1 flow from new game to ending
   - reload checks for persistence
   - continue-after-ending sanity check

Main touchpoints:
- `script.js`: mutation handlers + save calls + reset action
- `index.html`: add/reset button placement if needed

## Manual Acceptance Checklist
- [ ] New game starts clean (name/avatar)
- [ ] Open stage writing/shows progression works
- [ ] Reach Elenco and class choice appears
- [ ] Buttons switch to Trabalhar Texto / Textos
- [ ] Material opens builder at Elenco
- [ ] Create and activate 15-min text
- [ ] Perform elenco15/showcase gig
- [ ] Professional opportunity appears after reqs
- [ ] Accept opportunity
- [ ] Good elenco15 show triggers v1 ending
- [ ] Save/load preserves `chosenClass`, `hasEmployment`, `v1Completed`, texts
- [ ] Continue after ending works
- [ ] Headliner content remains future-gated

