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

test("legacy archive grants only non-mentor options and no numeric advantage", () => {
  const { run, storage } = createHarness();
  storage.set("openMicRPG.legacyArchive.v1", JSON.stringify([
    { runId: "1", classId: "roteirista", dominantTone: "humor negro", endTier: "glorioso" },
    { runId: "2", classId: "atorComico", dominantTone: "hack", endTier: "glorioso" },
    { runId: "3", classId: "produtor", dominantTone: "limpo", endTier: "honesto" }
  ]));
  const state = JSON.parse(run("JSON.stringify(loadGameState())"));
  assert.equal(state.onelinerUnlocked, false);
  assert.equal(state.storytellingUnlocked, false);
  assert.equal(state.propUnlocked, false);
  assert.equal(state.hackUnlocked, true);
  assert.equal(state.humorNegroUnlocked, false);
  assert.equal(state.activityPoints, 1);
  assert.equal(state.availablePerkPoints, 0);
  assert.equal("legacyAp2Unlocked" in state, false);
});

test("existing save unlocks survive the mentor-owned migration", () => {
  const { run, storage } = createHarness();
  storage.set("openMicRPG.save.v2", JSON.stringify({
    storytellingUnlocked: true,
    onelinerUnlocked: true,
    humorNegroUnlocked: true,
    propUnlocked: true
  }));
  const state = JSON.parse(run("JSON.stringify(loadGameState())"));
  assert.equal(state.storytellingUnlocked, true);
  assert.equal(state.onelinerUnlocked, true);
  assert.equal(state.humorNegroUnlocked, true);
  assert.equal(state.propUnlocked, true);
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

test("all Event 2 paths contain an exclusive two-way branch", () => {
  const { run } = createHarness();
  assert.equal(run("V2_PROGRESSION.classOrder.every(id => V2_EVENTS.classEvents[`${id}:event2`].choices.length === 2)"), true);
});

test("accepting Event 2 records its branch before assigning the class", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    queueCriticalDialog = () => {}; updateStats = () => {}; checkEmploymentOffer = () => {}; displayNarration = () => {};
    advanceDays = days => { state.currentDay += days; return days; };
    state.currentDay = 40;
    state.careerPathState.event1ByClass.roteirista.status = 'completed';
    const candidate = {classId:'roteirista',phase:2,config:V2_PROGRESSION.classPaths.roteirista.event2};
    const branch = V2_EVENTS.classEvents['roteirista:event2'].choices[0];
    acceptCareerEvent(candidate, branch);
  `);
  assert.equal(run("state.chosenClass"), "roteirista");
  assert.equal(run("state.pathProgressState.choiceGroups['class-event2:roteirista'].choiceId"), "punch-up");
  assert.equal(run("state.pathProgressState.flags['roteirista-punch-up']"), true);
});

test("mentor forks are deterministic, exclusive, and independently available", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    queueCriticalDialog = () => {}; updateStats = () => {}; saveGameState = () => {};
    state.currentDay = 15; state.levelNumber = 3; state.texto = 16;
    state.showHistory = [{nota:3}, {nota:3}];
  `);
  assert.equal(run("getEligiblePathEvents().some(event => event.id === 'rossini-especializacao')"), true);
  assert.equal(run("getEligiblePathEvents().some(event => event.id === 'gabriel-especializacao')"), true);
  run("applyPathEventChoice(V2_EVENTS.pathEvents.find(event => event.id === 'rossini-especializacao'), V2_EVENTS.pathEvents.find(event => event.id === 'rossini-especializacao').choices[0])");
  assert.equal(run("state.humorNegroUnlocked"), true);
  assert.equal(run("state.storytellingUnlocked"), false);
  assert.equal(run("state.pathProgressState.flags['specialization:humor-negro']"), true);
  assert.equal(run("getEligiblePathEvents().some(event => event.id === 'rossini-especializacao')"), false);
  assert.equal(run("getEligiblePathEvents().some(event => event.id === 'gabriel-especializacao')"), true);
});

test("mentor revisit unlocks the unchosen skill without specialization", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    queueCriticalDialog = () => {}; updateStats = () => {}; saveGameState = () => {};
    state.currentDay = 15; state.levelNumber = 3; state.showHistory = [{nota:3}];
    const early = V2_EVENTS.pathEvents.find(event => event.id === 'rossini-especializacao');
    applyPathEventChoice(early, early.choices[0]);
    state.currentDay = 70; state.showHistory = Array.from({length:6}, () => ({nota:3}));
  `);
  assert.equal(run("getEligiblePathEvents().some(event => event.id === 'rossini-revisita')"), true);
  run(`
    const revisit = V2_EVENTS.pathEvents.find(event => event.id === 'rossini-revisita');
    applyPathEventChoice(revisit, getPathEventChoices(revisit)[0]);
  `);
  assert.equal(run("state.storytellingUnlocked"), true);
  assert.equal(run("state.pathProgressState.flags['specialization:storytelling'] || false"), false);
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

test("employment offer blocks generic endings until answered", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    globalThis.employmentDialogMessage = "";
    queueCriticalDialog = (message) => { globalThis.employmentDialogMessage = message; };
    state.currentDay = 90;
    state.chosenClass = 'roteirista';
    state.texto = 50;
    state.showHistory = Array.from({length:8}, () => ({nota:3}));
    state.careerPathState.goodShowsCount = 3;
  `);
  assert.equal(run("maybeResolveRunEnding()"), false);
  assert.equal(run("state.runState.status"), "active");
  assert.equal(run("state.careerPathState.employmentOfferPending"), true);
  assert.match(run("employmentDialogMessage"), /Primeiro Convite Profissional/);
});

test("stale pending employment offer is re-shown without duplicating dialogs", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    globalThis.employmentDialogCount = 0;
    queueCriticalDialog = () => { globalThis.employmentDialogCount += 1; };
    state.chosenClass = 'produtor';
    state.network = 42;
    state.careerPathState.employmentOfferPending = true;
  `);
  assert.equal(run("checkEmploymentOffer()"), true);
  assert.equal(run("checkEmploymentOffer()"), true);
  assert.equal(run("employmentDialogCount"), 1);
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

test("structure usage is persisted by performed minutes", () => {
  const { run } = createHarness();
  run("state = loadGameState(); tallyPerformedStructures([{structure:'storytelling',minutes:3},{structure:'bit',minutes:2}], 2)");
  const tally = JSON.parse(run("JSON.stringify(state.structureTally)"));
  assert.equal(tally.storytelling, 3);
  assert.equal(tally.bit, 2);
  assert.equal(tally.crowdWork, 2);
});

test("pure endings require successful runs, complementary breadth, and early mentor specialization", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.toneTally = {'besteirol':0,'vulgar':0,'limpo':1,'humor negro':7,'hack':0,'político':0};
    state.structureTally = {bit:3,oneliner:2,storytelling:2,prop:0,crowdWork:0};
  `);
  assert.equal(run("resolvePureEnding()"), null);
  run("state.pathProgressState.flags['specialization:humor-negro'] = true");
  assert.equal(run("resolvePureEnding().id"), "pure:tone:humor negro");
  run(`
    state.currentDay = 100;
    state.showHistory = [];
    state.careerPathState.goodShowsCount = 0;
  `);
  assert.equal(run("resolveRunEndingCandidate().id"), "failure");
  assert.equal(run("resolveRunEndingCandidate().pureEnding || null"), null);
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
