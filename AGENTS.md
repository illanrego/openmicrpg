# Open Mic RPG — agent instructions

Portable project rules for Hermes, Codex, Claude Code, etc.

## Mission

Finish and ship V2 by **2026-07-23**. Playable 100-day roguelite stand-up career sim.
Cliffhanger ending: clubs ask about a solo — "E como eu monto meu solo?"

## Source of truth

| File | Use |
|------|-----|
| `TASKS.md` | Live ship checklist / current status |
| `.hermes.md` | Hermes-oriented project context |
| `DESIGN_V2.md` | Product design decisions (canonical for V2) |
| `OPEN_MIC_RPG_REFERENCE.md` | Implemented systems reference |
| `docs/legacy/` | Historical only |

## Architecture

- No framework/build. Vanilla JS.
- `script.js` = runtime / systems
- `content/*.js` = data + copy registries on `window.OpenMicRpgContent`
- Saves: `openMicRPG.save.v2` (schema 3), archive `openMicRPG.legacyArchive.v1`

## Commands

```bash
node --test tests/v2-mechanics.test.js
```

## Do

- Prefer content modules for copy and catalogs
- Keep mentor-owned skills mentor-only
- Preserve option-only legacy unlocks
- Add/adjust tests when changing V2 mechanics
- Update `TASKS.md` after meaningful progress

## Don't

- Don't revive headliner/special-tape Made It (deprecated — not a cut, these systems are dead)
- Don't put temporary progress into agent memory; use `TASKS.md`

## Current top engineering target

Replace ending popup with full-screen ending shell (see DESIGN_V2 ending presentation sequence). Mechanics for generic/pure endings already exist and are tested.
