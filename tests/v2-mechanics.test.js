const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");

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
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    document: {
      addEventListener() {},
      createElement: inertElement,
      querySelector() { return null; },
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
  [
    "content/progression.js",
    "content/world.js",
    "content/events.js",
    "content/endings.js",
    "script.js"
  ].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file }));
  const run = expression => vm.runInContext(expression, context);
  return { run, storage };
}

test("content registry validates", () => {
  const { run } = createHarness();
  assert.equal(run("validateGameContent()"), true);
});

test("legacy archive grants options but no numeric AP or perk advantage", () => {
  const { run, storage } = createHarness();
  storage.set("openMicRPG.legacyArchive.v1", JSON.stringify([
    { runId: "1", classId: "roteirista", dominantTone: "humor negro", endTier: "glorioso" },
    { runId: "2", classId: "atorComico", dominantTone: "hack", endTier: "glorioso" },
    { runId: "3", classId: "produtor", dominantTone: "limpo", endTier: "honesto" }
  ]));
  const state = JSON.parse(run("JSON.stringify(loadGameState())"));
  assert.equal(state.onelinerUnlocked, true);
  assert.equal(state.storytellingUnlocked, true);
  assert.equal(state.propUnlocked, true);
  assert.equal(state.hackUnlocked, true);
  assert.equal(state.humorNegroUnlocked, true);
  assert.equal(state.activityPoints, 1);
  assert.equal(state.availablePerkPoints, 0);
  assert.equal("legacyAp2Unlocked" in state, false);
});

test("Professor saves migrate without losing the run", () => {
  const { run, storage } = createHarness();
  storage.set("openMicRPG.save.v2", JSON.stringify({ chosenClass: "professor", currentDay: 22, jokes: [] }));
  const state = JSON.parse(run("JSON.stringify(loadGameState())"));
  assert.equal(state.schemaVersion, 3);
  assert.equal(state.chosenClass, "comicoClassico");
  assert.equal(state.currentDay, 22);
  assert.equal(state.runState.status, "active");
});

test("hidden class event thresholds trigger only at the boundary", () => {
  const { run } = createHarness();
  run("state = loadGameState(); ensureCareerProgressState(); state.currentDay = 15; state.routeCounters.showsScheduledCount = 4; state.careerPathState.goodShowsCount = 1;");
  assert.equal(run("getEligibleCareerEvents().some(item => item.classId === 'comicoClassico' && item.phase === 1)"), false);
  run("state.careerPathState.goodShowsCount = 2");
  assert.equal(run("getEligibleCareerEvents()[0].classId"), "comicoClassico");
  run("state.currentDay = 31");
  assert.equal(run("getEligibleCareerEvents().length"), 0);
});

test("Event 2 is deterministic and requires Event 1 completion", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState(); state.currentDay = 40;
    state.texto = 42;
    state.routeCounters.writeCount = 10;
    state.routeCounters.rewriteCount = 3;
  `);
  assert.equal(run("getEligibleCareerEvents().some(item => item.classId === 'roteirista' && item.phase === 2)"), false);
  run("state.careerPathState.event1ByClass.roteirista.status = 'completed'");
  assert.equal(run("getEligibleCareerEvents().some(item => item.classId === 'roteirista' && item.phase === 2)"), true);
});

test("multi-day career events advance the clock without changing AP costs", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    updateStats = () => {};
    setScene = () => {};
    refreshRouteInviteAvailability = () => {};
    maybeResolveRunEnding = () => false;
    state.currentDay = 1;
    state.currentWeekDay = 1;
    state.motivation = 60;
    advanceDays(3, { recoverMotivation: 0, allowEvents: false, allowCareerEvents: false, narration: false });
  `);
  assert.equal(run("state.currentDay"), 4);
  assert.equal(run("state.motivation"), 60);
  assert.equal(run("state.activityPoints"), 1);
  run("state.hasEmployment = true; state.activityPoints = getMaxActivityPoints()");
  assert.equal(run("state.activityPoints"), 2);
});

test("automatic class assignment applies its bonus only once", () => {
  const { run } = createHarness();
  run("state = loadGameState(); ensureCareerProgressState(); updateStats = () => {}; checkEmploymentOffer = () => {}; queueCriticalDialog = () => {}; state.texto = 20; assignDetectedClass('roteirista'); assignDetectedClass('roteirista');");
  assert.equal(run("state.chosenClass"), "roteirista");
  assert.equal(run("state.texto"), 30);
});

test("político affinities use category defaults and venue overrides", () => {
  const { run } = createHarness();
  assert.equal(run("getTypeAffinity(findShowById('bar-universitario'), 'político')"), 0.7);
  assert.equal(run("getTypeAffinity(findShowById('corporativo'), 'político')"), -0.8);
});

test("crowd work is minute weighted and leaves zero-allocation scoring unchanged", () => {
  const { run } = createHarness();
  run("state = loadGameState(); state.entrega = 50; state.unlockedPerks = [];");
  const unchanged = JSON.parse(run("JSON.stringify(applyCrowdWorkToEvaluation({averageScore:0.3,breakdown:[{title:'a',score:0.3}]},{deliveryBonus:0.1,chaosRoll:0},0))"));
  assert.equal(unchanged.averageScore, 0.3);
  const weighted = JSON.parse(run("JSON.stringify(applyCrowdWorkToEvaluation({averageScore:0.3,breakdown:[{title:'a',score:0.3}]},{deliveryBonus:0.1,chaosRoll:0},3))"));
  assert.equal(weighted.breakdown.at(-1).isCrowdWork, true);
  assert.equal(weighted.breakdown.at(-1).minutes, 3);
  assert.equal(weighted.averageScore, (0.3 + 0.28 * 3) / 4);
});

test("ending resolver respects class, default, almost, then failure priority", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.currentDay = 65;
    state.chosenClass = 'comicoClassico';
    state.careerPathState.detectedClassId = 'comicoClassico';
    state.hasEmployment = true;
    state.network = 35;
    state.careerPathState.goodShowsCount = 6;
    state.careerPathState.elencoGoodShowsCount = 1;
  `);
  assert.equal(run("resolveRunEndingCandidate().id"), "class:comicoClassico");
  run("state.chosenClass = null; state.careerPathState.detectedClassId = null; state.hasEmployment = false; state.currentDay = 100; state.showHistory = []; state.careerPathState.goodShowsCount = 0;");
  assert.equal(run("resolveRunEndingCandidate().id"), "failure");
});

test("archive writes are idempotent by runId", () => {
  const { run } = createHarness();
  run("archiveFinalizedRun({runId:'same-run', endingId:'default'}); archiveFinalizedRun({runId:'same-run', endingId:'default'});");
  assert.equal(run("loadLegacyArchive().length"), 1);
});
