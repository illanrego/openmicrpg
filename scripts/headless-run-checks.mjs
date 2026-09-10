#!/usr/bin/env node
// Headless launch-critical run checks for Open Mic RPG.
// Exercises the pre-launch matrix + acceptance criteria without a browser.
// Run from repo root:  node scripts/headless-run-checks.mjs
//
// Docs: docs/pre-launch/02-headless-run-checks.md
// Acceptance:
// - No blank dialogs, impossible choices, or stuck pending events.
// - Every scheduled gig resolves to a valid show and image.
// - Ending state locks gameplay until a valid ending action is chosen.
// - A new run does not inherit active-run stats or mentor-owned unlocks.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..");

// ─── Minimal browser harness (same shape as tests/v2-mechanics.test.js) ───
function createHarness() {
  const storage = new Map();
  class AudioMock {
    load() {}
    play() { return Promise.resolve(); }
  }
  const inertElement = () => ({
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {},
    remove() {},
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; }
  });
  const sandbox = {
    console,
    crypto: webcrypto,
    Audio: AudioMock,
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key)
    },
    document: {
      addEventListener() {},
      createElement: inertElement,
      querySelector() { return null; },
      querySelectorAll() { return []; },
      getElementById() { return null; },
      head: { appendChild() {} },
      body: inertElement()
    },
    setTimeout() {},
    clearTimeout() {},
    requestAnimationFrame() {},
    performance: { now: () => 0 }
  };
  sandbox.window = sandbox;
  sandbox.window.location = { reload() {} };
  sandbox.window.confirm = () => true;
  const context = vm.createContext(sandbox);
  ["content/progression.js", "content/world.js", "content/events.js", "content/endings.js", "script.js"]
    .forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file }));
  const run = (expression) => vm.runInContext(expression, context);
  return { run, storage };
}

const { run } = createHarness();

// ─── Tiny assertion + reporter ───
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// ─── 1. Fresh run ───
run(`
  state = loadGameState(); state.hasStarted = true; state.currentDay = 1;
`);
check("fresh run starts active", run("state.runState.status") === "active");
const study = run("getNextStudyResult()");
check("first study result is non-blank", !!(study && study.text && study.text.trim().length));
const firstOrdered = run("GAME_CONTENT.world.studyResults.ordered[0]");
check(
  "first ordered study result exposes a real destination + label",
  !!(firstOrdered && firstOrdered.externalUrl && firstOrdered.externalLabel) &&
    /^https?:\/\//.test(firstOrdered.externalUrl)
);
// Two offer slots (network >= 30) make the freshness guarantee pick the spots cleanly.
run("state.network = 30; state.stageTime = 0; state.hasStarted = true;");
const offers = run("generateAvailableShows()");
check("a fresh open search can surface a regular venue", Array.isArray(offers) && offers.some((o) => !o.show.isOpenStarter));
const everyShowNamed = Array.isArray(offers) && offers.every((o) => {
  const show = run(`findShowById(${JSON.stringify(o.show.id)})`);
  return !!(show && show.name && show.name.trim().length);
});
check("every offered gig maps to a valid, non-blank show", everyShowNamed);

// ─── 2. Open → Elenco bridge ───
run("state = loadGameState(); state.hasStarted = true; state.stageTime = 0;");
check("6-min venue locked before 4 stage-time", run("contentGates.showEligible(findShowById('corporativo'), 'open')") === false);
run("state.stageTime = 4;");
check("6-min venue opens at 4 stage-time", run("contentGates.showEligible(findShowById('corporativo'), 'open')") === true);
run("state.stageTime = 6;");
check("7-min venue still locked before 7 stage-time", run("contentGates.showEligible(findShowById('teatro-limpo'), 'open')") === false);
run("state.stageTime = 7;");
check("7-min venue opens at 7 stage-time", run("contentGates.showEligible(findShowById('teatro-limpo'), 'open')") === true);
run("state.levelNumber = 6;");
check("level 6 reaches Elenco stage", run("getCareerStage()") === "elenco");
check("Elenco circuit show is eligible in elenco", run("contentGates.showEligible(findShowById('elenco-porao-segunda'), 'elenco')") === true);
check(
  "Elenco circuit gig is scheduled for 15 minutes",
  run("calculateOfferedTime(findShowById('elenco-porao-segunda'), { showType: 'elenco15' })") === 15
);

// ─── 3. Class run → ending (valid candidate + lock) ───
// NOTE: functions read the GLOBAL `state`, so the scenario must reassign it.
const classOutcome = run(`
  (() => {
    state = loadGameState();
    state.hasStarted = true; state.currentDay = 90; state.levelNumber = 6;
    state.hasEmployment = true; state.network = 60; state.texto = 70; state.entrega = 70; state.fans = 300;
    ensureCareerProgressState();
    state.careerPathState.detectedClassId = 'comicoClassico';
    state.chosenClass = 'comicoClassico';
    state.showHistory = Array.from({ length: 15 }, (_, i) => ({ showId: 'elenco-porao-segunda', nota: 5, day: 50 + i }));
    state.careerPathState.goodShowsCount = 15;
    state.careerPathState.elencoGoodShowsCount = 15;
    state.careerPathState.bigRoomShowsCount = 15;
    state.routeCounters = normalizeRouteCounters({}); state.routeCounters.showsScheduledCount = 12;
    const cand = resolveRunEndingCandidate();
    if (!cand) return { ok: false, reason: 'no candidate', metrics: JSON.stringify(getCareerMetrics()) };
    const art = getEndingArtwork(cand);
    return {
      ok: true,
      category: cand.category,
      classId: cand.classId,
      finalized: finalizeRun(cand),
      statusAfter: state.runState.status,
      tier: state.runState.endingTier,
      archived: !!state.runState.archived,
      artId: art.id,
      artPath: art.path
    };
  })()
`);
check("class run resolves a class ending candidate", classOutcome.ok && classOutcome.category === "class" && classOutcome.classId === "comicoClassico", classOutcome.reason || classOutcome.metrics || "");
check("finalizeRun ends and archives the run (locks gameplay)", classOutcome.finalized === true && classOutcome.statusAfter === "ended" && classOutcome.archived === true, JSON.stringify(classOutcome));
check("class ending has a resolved artwork on disk", !!classOutcome.artPath && exists(classOutcome.artPath), classOutcome.artPath || "");

// ─── 4. No-class run (generic / almost / failure) ───
function noClassEnding(cfg) {
  return run(`(() => {
    state = loadGameState();
    state.hasStarted = true; state.currentDay = ${cfg.day}; state.levelNumber = 1; state.hasEmployment = false;
    state.runState.status = 'active';
    ensureCareerProgressState();
    state.careerPathState.detectedClassId = null; state.chosenClass = null;
    state.careerPathState.event1ByClass = {};
    state.careerPathState.event2ByClass = {};
    state.showHistory = Array.from({ length: ${cfg.shows} }, () => ({ showId: 'bar-do-tony', nota: ${cfg.nota} }));
    state.careerPathState.goodShowsCount = ${cfg.shows};
    state.routeCounters = normalizeRouteCounters({}); state.routeCounters.showsScheduledCount = ${cfg.shows};
    const cand = resolveRunEndingCandidate();
    if (!cand) return { ok: false, day: state.currentDay, inProgress: hasInProgressCareerPath(), status: state.runState.status, metrics: JSON.stringify(getCareerMetrics()) };
    return { ok: true, category: cand.category, id: cand.id, specialId: cand.specialId || null };
  })()`);
}
const generic = noClassEnding({ day: 90, shows: 10, nota: 4 });
check("no-class run resolves the generic circuit ending", generic.ok && generic.category === "default", JSON.stringify(generic));
const almost = noClassEnding({ day: 96, shows: 6, nota: 3 });
check("no-class run resolves the 'almost' ending", almost.ok && almost.category === "almost", JSON.stringify(almost));
const failure = noClassEnding({ day: 100, shows: 2, nota: 1 });
check("no-class run resolves the failure/Silêncio ending", failure.ok && failure.category === "failure" && failure.specialId === "silencio", JSON.stringify(failure));

// ─── 5. Persistence run ───
run(`
  state = loadGameState(); state.hasStarted = true;
  state.currentDay = 7; state.network = 12; state.stageTime = 2;
  addScheduledShow('bar-do-tony', 10, 'normal');
  saveGameState();
`);
const persisted = run(`
  (() => {
    const reloaded = loadGameState();
    const next = getNearestScheduledShow();
    return {
      day: reloaded.currentDay,
      network: reloaded.network,
      scheduled: reloaded.scheduledShows.length,
      nextShowId: next ? next.showId : null,
      reachableToday: reloaded.scheduledShows.some((s) => s.dayScheduled === reloaded.currentDay)
    };
  })()
`);
check("save → reload preserves active-run day/network", persisted.day === 7 && persisted.network === 12, JSON.stringify(persisted));
check("a scheduled show survives reload and is continuable", persisted.scheduled === 1 && persisted.nextShowId === "bar-do-tony");

// Advance onto the scheduled day and confirm the gig still resolves to a show + result images.
run("state = loadGameState(); state.hasStarted = true; state.currentDay = 10; addScheduledShow('bar-do-tony', 10, 'normal');");
const repeated = run(`
  (() => {
    const entry = getScheduledShowsForToday()[0] || getNearestScheduledShow();
    if (!entry) return { ok: false, entry: null };
    return { ok: true, showExists: !!findShowById(entry.showId), result4: getShowResultImage(4), result5: getShowResultImage(5) };
  })()
`);
const hasResultArt =
  repeated.ok &&
  repeated.showExists &&
  /^assets\/scenes\/results\/.+\..+$/.test(repeated.result4) &&
  /^assets\/scenes\/results\/.+\..+$/.test(repeated.result5) &&
  exists(repeated.result4) &&
  exists(repeated.result5);
check("continuing a scheduled gig yields a show + result images on disk", hasResultArt, JSON.stringify(repeated));

// A finished run's "Nova corrida" clears storage; the next run inherits nothing.
run(`
  (() => {
    state = loadGameState();
    state.runState.status = 'ended';
    state.runState.archived = true;
    state.runState.endingId = 'failure';
    state.careerPathState.detectedClassId = 'comicoClassico';
    state.onelinerUnlocked = true; state.storytellingUnlocked = true; state.humorNegroUnlocked = true; state.propUnlocked = true;
    saveGameState();
    startNewRunAfterEnding();
  })()
`);
const fresh = run(`
  (() => {
    const s = loadGameState();
    return {
      detectedClass: s.careerPathState ? s.careerPathState.detectedClassId || null : null,
      oneliner: !!s.onelinerUnlocked,
      storytelling: !!s.storytellingUnlocked,
      humorNegro: !!s.humorNegroUnlocked,
      prop: !!s.propUnlocked,
      status: s.runState.status
    };
  })()
`);
check(
  "new run does not inherit class or mentor-owned unlocks",
  fresh.detectedClass === null && !fresh.oneliner && !fresh.storytelling && !fresh.humorNegro && !fresh.prop,
  JSON.stringify(fresh)
);
check("new run starts active again", fresh.status === "active", fresh.status);

// ─── Report ───
console.log("");
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} headless checks passed`);
process.exit(failed.length ? 1 : 0);