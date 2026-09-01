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

test("show result art resolves by selected avatar and score", () => {
  const { run } = createHarness();
  run("state = loadGameState(); state.avatar = 'avatar6';");
  assert.equal(run("getShowResultImage(1)"), "assets/scenes/results/avatar6/deu-agua.png");
  assert.equal(run("getShowResultImage(5)"), "assets/scenes/results/avatar6/explodiu.png");
  run("state.avatar = 'unknown-avatar';");
  assert.equal(run("getShowResultImage(3)"), "assets/scenes/results/avatar1/segurou.png");
});

test("ending art resolves to pure tone, pure structure, class, Silêncio, or fallback", () => {
  const { run } = createHarness();
  assert.equal(run("getEndingArtwork({id:'class:roteirista', category:'class', classId:'roteirista'}).path"), "assets/scenes/endings/class/roteirista.png");
  assert.equal(run("getEndingArtwork({id:'class:roteirista', category:'class', classId:'roteirista', pureEnding:{axis:'tone', value:'político'}}).path"), "assets/scenes/endings/pure-tone/politico.png");
  assert.equal(run("getEndingArtwork({id:'class:produtor', category:'class', classId:'produtor', pureEnding:{axis:'structure', value:'bit'}}).path"), "assets/scenes/endings/pure-structure/bit.png");
  assert.equal(run("getEndingArtwork({id:'failure', category:'failure'}).id"), "special:silencio");
  assert.equal(run("getEndingArtwork({id:'unknown', category:'default'}).id"), "fallback");
});

test("finalized runs persist their resolved ending art ID", () => {
  const { run } = createHarness();
  run("state = loadGameState(); finalizeRun({id:'failure', category:'failure', classId:null});");
  assert.equal(run("state.runState.endingArtId"), "special:silencio");
  assert.equal(run("loadLegacyArchive()[0].endingArtId"), "special:silencio");
});

test("finalized special endings persist their identity and class for reload", () => {
  const { run } = createHarness();
  run("state = loadGameState(); finalizeRun({id:'special:bastidor-sombrio', category:'special', specialId:'bastidor-sombrio', classId:'produtor'});");
  assert.equal(run("state.runState.specialEndingId"), "bastidor-sombrio");
  assert.equal(run("state.runState.endingClassId"), "produtor");
  assert.equal(run("loadLegacyArchive()[0].specialEndingId"), "bastidor-sombrio");
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

test("hidden class event thresholds trigger only at the career crossroads boundary", () => {
  const { run } = createHarness();
  run("state = loadGameState(); ensureCareerProgressState(); state.currentDay = 32; state.routeCounters.showsScheduledCount = 4; state.showHistory = Array.from({length:6}, () => ({nota:4})); state.careerPathState.goodShowsCount = 1;");
  assert.equal(run("getEligibleCareerEvents().some(item => item.classId === 'comicoClassico' && item.phase === 1)"), false);
  run("state.careerPathState.goodShowsCount = 2");
  assert.equal(run("getEligibleCareerEvents().some(item => item.classId === 'comicoClassico' && item.phase === 1)"), true);
  run("state.currentDay = 61");
  assert.equal(run("getEligibleCareerEvents().some(item => item.classId === 'comicoClassico' && item.phase === 1)"), false);
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

test("qualified class paths remain available ahead of the default ending", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.currentDay = 90;
    state.texto = 50;
    state.routeCounters.writeCount = 10;
    state.routeCounters.rewriteCount = 3;
    state.showHistory = Array.from({length:8}, () => ({nota:3}));
    state.careerPathState.goodShowsCount = 3;
    state.careerPathState.event1ByClass.roteirista.status = 'completed';
  `);
  assert.equal(run("getEligibleCareerEvents().some(item => item.classId === 'roteirista' && item.phase === 2)"), true);
  run("globalThis.careerPathDialog = ''; queueCriticalDialog = message => { globalThis.careerPathDialog = message; }");
  assert.equal(run("maybeCheckProgressionGates()"), true);
  assert.equal(run("state.careerPathState.event2ByClass.roteirista.status"), "pending");
  assert.match(run("careerPathDialog"), /Sala de Roteiro/);
  run("state.careerPathState.event2ByClass.roteirista.status = 'accepted'");
  assert.equal(run("resolveRunEndingCandidate()"), null);
});

test("career crossroads does not appear before enough stage evidence", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.pathProgressState.choiceGroups['mentor:gabriel'] = { eventId: 'gabriel-especializacao', choiceId: 'oneliner', day: 20, specialization: 'oneliner', late: false };
    state.pathProgressState.choiceGroups['mentor:rossini'] = { eventId: 'rossini-especializacao', choiceId: 'storytelling', day: 20, specialization: 'storytelling', late: false };
    queueCriticalDialog = (...args) => { globalThis.careerPathDialog = args[0]; globalThis.careerPathChoices = args[1] || []; };
    updateStats = () => {}; saveGameState = () => {}; maybeResolveRunEnding = () => false;
    state.currentDay = 32;
    state.texto = 42; state.network = 42;
    state.routeCounters.writeCount = 10;
    state.routeCounters.rewriteCount = 3;
    state.routeCounters.showsScheduledCount = 9;
    state.showHistory = Array.from({length:5}, () => ({nota:4}));
  `);
  assert.equal(run("maybeCheckProgressionGates({ resolveEnding: false })"), false);
  assert.equal(run("globalThis.careerPathDialog || null"), null);
});

test("career crossroads consolidates eligible Event 1 paths into one player choice", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.pathProgressState.choiceGroups['mentor:gabriel'] = { eventId: 'gabriel-especializacao', choiceId: 'oneliner', day: 20, specialization: 'oneliner', late: false };
    state.pathProgressState.choiceGroups['mentor:rossini'] = { eventId: 'rossini-especializacao', choiceId: 'storytelling', day: 20, specialization: 'storytelling', late: false };
    queueCriticalDialog = (...args) => { globalThis.careerPathDialog = args[0]; globalThis.careerPathChoices = args[1] || []; };
    updateStats = () => {}; saveGameState = () => {}; displayNarration = () => {};
    refreshRouteInviteAvailability = () => {}; maybeResolveRunEnding = () => false;
    state.currentDay = 32;
    state.texto = 42; state.network = 42;
    state.routeCounters.writeCount = 10;
    state.routeCounters.rewriteCount = 3;
    state.routeCounters.showsScheduledCount = 9;
    state.showHistory = Array.from({length:6}, () => ({nota:4}));
    state.careerPathState.goodShowsCount = 6;
  `);
  assert.equal(run("maybeCheckProgressionGates({ resolveEnding: false })"), true);
  assert.match(run("careerPathDialog"), /Encruzilhada da carreira/);
  assert.equal(run("JSON.stringify(careerPathChoices.map(choice => choice.label).filter(label => /Roteirista|Produtor/.test(label)).sort())"), JSON.stringify(["Seguir como Produtor", "Seguir como Roteirista"]));
  run("careerPathChoices.find(choice => choice.label === 'Seguir como Produtor').handler()");
  assert.equal(run("state.careerPathState.event1ByClass.produtor.status"), "accepted");
  assert.equal(run("state.careerPathState.event1ByClass.roteirista.status"), "unseen");
});


test("all Event 2 paths contain an exclusive two-way branch", () => {
  const { run } = createHarness();
  assert.equal(run("V2_PROGRESSION.classOrder.every(id => V2_EVENTS.classEvents[`${id}:event2`].choices.length === 2)"), true);
});

test("Event 2 records its branch and assigns the class after its manual-day period", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    queueCriticalDialog = () => {}; updateStats = () => {}; checkEmploymentOffer = () => {}; displayNarration = () => {};
    setScene = () => {}; refreshRouteInviteAvailability = () => {}; maybeResolveRunEnding = () => false;
    state.currentDay = 40;
    state.careerPathState.event1ByClass.roteirista.status = 'completed';
    const candidate = {classId:'roteirista',phase:2,config:V2_PROGRESSION.classPaths.roteirista.event2};
    const branch = V2_EVENTS.classEvents['roteirista:event2'].choices[0];
    acceptCareerEvent(candidate, branch);
    globalThis.dayWhenAccepted = state.currentDay;
    globalThis.classWhenAccepted = state.chosenClass;
    advanceDays(candidate.config.durationDays, {recoverMotivation:0, allowEvents:false, allowCareerEvents:false, narration:false});
  `);
  assert.equal(run("dayWhenAccepted"), 40);
  assert.equal(run("classWhenAccepted"), null);
  assert.equal(run("state.chosenClass"), "roteirista");
  assert.equal(run("state.pathProgressState.choiceGroups['class-event2:roteirista'].choiceId"), "punch-up");
  assert.equal(run("state.pathProgressState.flags['roteirista-punch-up']"), true);
});

test("Event 2 lets the player pivot to another eligible path", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    queueCriticalDialog = (...args) => { globalThis.careerPathDialog = args[0]; globalThis.careerPathChoices = args[1] || []; };
    updateStats = () => {}; checkEmploymentOffer = () => {}; displayNarration = () => {};
    setScene = () => {}; refreshRouteInviteAvailability = () => {}; maybeResolveRunEnding = () => false; saveGameState = () => {};
    state.currentDay = 45;
    state.texto = 44;
    state.entrega = 44;
    state.routeCounters.writeCount = 10;
    state.routeCounters.rewriteCount = 3;
    state.routeCounters.showsScheduledCount = 8;
    state.showHistory = Array.from({length:8}, () => ({nota:4}));
    state.consecutiveGoodShows = 3;
    state.careerPathState.goodShowsCount = 6;
    state.careerPathState.initialPathId = 'roteirista';
    state.careerPathState.event1ByClass.roteirista.status = 'completed';
  `);
  assert.equal(run("JSON.stringify(getEligibleCareerEvents().filter(item => item.phase === 2).map(item => item.classId).sort())"), JSON.stringify(["comicoClassico", "roteirista"]));
  assert.equal(run("maybeCheckProgressionGates({ resolveEnding: false })"), true);
  assert.match(run("careerPathDialog"), /Virada da carreira/);
  run("careerPathChoices.find(choice => choice.label === 'Virar Cômico Clássico').handler()");
  assert.match(run("careerPathDialog"), /Abrindo a Noite/);
  run("careerPathChoices.find(choice => choice.label === 'Abrir com material testado').handler()");
  assert.equal(run("state.careerPathState.lockedPathId"), "comicoClassico");
  assert.equal(run("state.careerPathState.initialPathId"), "roteirista");
  assert.equal(run("state.careerPathState.pivotPathId"), "comicoClassico");
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

test("multi-day challenges do not skip time and suppress AP during manually played days", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.currentDay = 15; state.currentWeekDay = 1; state.activityPoints = 1;
    state.scheduledShows = [
      {showId:'barzinho', dayScheduled:16, showType:'normal'},
      {showId:'se-vira-nos-5', dayScheduled:17, showType:'special-invite'}
    ];
    globalThis.challengeNarration = ''; globalThis.challengeSceneChanges = 0;
    updateStats = () => {}; setScene = () => { globalThis.challengeSceneChanges += 1; }; refreshRouteInviteAvailability = () => {};
    queueCriticalDialog = () => {}; displayNarration = (text) => { globalThis.challengeNarration = text; }; saveGameState = () => {};
    maybeResolveRunEnding = () => false; checkEmploymentOffer = () => false;
    maybeTriggerEvent = () => false; maybeTriggerCarvalhoDialog = () => false;
    const candidate = {classId:'roteirista', phase:1, config:V2_PROGRESSION.classPaths.roteirista.event1};
    acceptCareerEvent(candidate);
  `);
  assert.equal(run("state.currentDay"), 15);
  assert.equal(run("state.activityPoints"), 0);
  assert.equal(run("state.scheduledShows[0].showId"), "barzinho");
  assert.equal(run("state.careerPathState.event1ByClass.roteirista.status"), "accepted");
  assert.equal(run("state.careerPathState.activeTimeAdvance.remainingDays"), 3);
  assert.doesNotMatch(run("challengeNarration"), /dias passaram/);
  assert.equal(run("challengeSceneChanges"), 0);

  run("advanceDay()");
  assert.equal(run("state.currentDay"), 16);
  assert.equal(run("state.activityPoints"), 0);
  assert.equal(run("state.scheduledShows[0].showId"), "barzinho");
  assert.equal(run("state.careerPathState.activeTimeAdvance.remainingDays"), 2);

  run("removeScheduledShow(state.scheduledShows[0]); advanceDay()");
  assert.equal(run("state.currentDay"), 17);
  assert.equal(run("state.activityPoints"), 0);
  assert.equal(run("state.scheduledShows[0].showId"), "se-vira-nos-5");
  assert.equal(run("state.careerPathState.activeTimeAdvance.remainingDays"), 1);

  run("removeScheduledShow(state.scheduledShows[0]); advanceDay()");
  assert.equal(run("state.currentDay"), 18);
  assert.equal(run("state.activityPoints"), 1);
  assert.equal(run("state.careerPathState.event1ByClass.roteirista.status"), "completed");
  assert.equal(run("state.careerPathState.activeTimeAdvance"), null);
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
    state.showHistory = Array.from({length:10}, () => ({nota:4}));
  `);
  assert.equal(run("resolveRunEndingCandidate().id"), "class:comicoClassico");
  run("state.chosenClass = null; state.careerPathState.detectedClassId = null; state.hasEmployment = false; state.currentDay = 100; state.showHistory = []; state.careerPathState.goodShowsCount = 0;");
  assert.equal(run("resolveRunEndingCandidate().id"), "failure");
});

test("Bastidor Sombrio resolves from a successful dark producer run", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.currentDay = 70; state.chosenClass = 'produtor'; state.hasEmployment = true;
    state.network = 50; state.routeCounters.showsScheduledCount = 10; state.careerPathState.elencoGoodShowsCount = 2;
    state.showHistory = Array.from({length: 10}, () => ({nota: 4}));
    state.toneTally = {'besteirol':0,'vulgar':0,'limpo':0,'humor negro':8,'hack':0,'político':0};
    state.structureTally = {bit:4,oneliner:2,storytelling:2,prop:0,crowdWork:0};
    state.pathProgressState.flags['specialization:humor-negro'] = true;
  `);
  assert.equal(run("resolveRunEndingCandidate().id"), "special:bastidor-sombrio");
  assert.equal(run("getEndingArtwork(resolveRunEndingCandidate()).id"), "special:bastidor-sombrio");
});

test("Profeta do Caos resolves from an even political and dark successful run", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.currentDay = 90; state.showHistory = Array.from({length: 10}, () => ({nota: 3}));
    state.careerPathState.goodShowsCount = 3;
    state.toneTally = {'besteirol':0,'vulgar':0,'limpo':0,'humor negro':5,'hack':0,'político':5};
    state.structureTally = {bit:4,oneliner:3,storytelling:3,prop:0,crowdWork:0};
  `);
  assert.equal(run("resolveRunEndingCandidate().id"), "special:profeta-do-caos");
  assert.equal(run("getEndingArtwork(resolveRunEndingCandidate()).id"), "special:profeta-do-caos");
});

test("Camaleão resolves from a broad successful run without a dominant tone", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.currentDay = 90; state.showHistory = Array.from({length: 10}, () => ({nota: 3}));
    state.careerPathState.goodShowsCount = 3;
    state.toneTally = {'besteirol':3,'vulgar':3,'limpo':3,'humor negro':3,'hack':0,'político':0};
    state.structureTally = {bit:4,oneliner:3,storytelling:3,prop:0,crowdWork:0};
  `);
  assert.equal(run("resolveRunEndingCandidate().id"), "special:camaleao");
  assert.equal(run("getEndingArtwork(resolveRunEndingCandidate()).id"), "special:camaleao");
});

test("Herdeiro resolves when the fifth distinct class ending is completed", () => {
  const { run, storage } = createHarness();
  storage.set("openMicRPG.legacyArchive.v1", JSON.stringify([
    { runId: "1", classId: "comicoClassico" }, { runId: "2", classId: "roteirista" },
    { runId: "3", classId: "produtor" }, { runId: "4", classId: "atorComico" }
  ]));
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.currentDay = 70; state.chosenClass = 'influencer'; state.hasEmployment = true;
    state.fans = 250; state.routeCounters.contentCount = 6; state.careerPathState.elencoGoodShowsCount = 2;
    state.showHistory = Array.from({length: 10}, () => ({nota: 4}));
  `);
  assert.equal(run("resolveRunEndingCandidate().id"), "special:herdeiro");
  assert.equal(run("getEndingArtwork(resolveRunEndingCandidate()).id"), "special:herdeiro");
});

test("archive writes are idempotent by runId", () => {
  const { run } = createHarness();
  run("archiveFinalizedRun({runId:'same-run', endingId:'default'}); archiveFinalizedRun({runId:'same-run', endingId:'default'});");
  assert.equal(run("loadLegacyArchive().length"), 1);
});

test("archive carries learned writing guidance and political access into the next run", () => {
  const { run, storage } = createHarness();
  storage.set("openMicRPG.legacyArchive.v1", JSON.stringify([
    { runId: "1", writingGuideUnlocked: true, politicoUnlocked: true }
  ]));
  const state = JSON.parse(run("JSON.stringify(loadGameState())"));
  assert.equal(state.writingGuideUnlocked, true);
  assert.equal(state.politicoUnlocked, true);
});

test("two completed runs guarantee political at the next start", () => {
  const { run, storage } = createHarness();
  storage.set("openMicRPG.legacyArchive.v1", JSON.stringify([
    { runId: "1", endingId: "default" },
    { runId: "2", endingId: "almost" }
  ]));
  const state = JSON.parse(run("JSON.stringify(loadGameState())"));
  assert.equal(state.hackUnlocked, true);
  assert.equal(state.politicoUnlocked, true);
});

test("crowd work stays locked until Carvalho unlocks it", () => {
  const { run } = createHarness();
  run("state = loadGameState();");
  assert.equal(run("getMaxCrowdWorkMinutes(3)"), 0);
  run("state.crowdWorkUnlocked = true;");
  assert.equal(run("getMaxCrowdWorkMinutes(3)"), 3);
});

test("study is capped at three actions per week", () => {
  const { run } = createHarness();
  run("state = loadGameState(); state.weeklyStudyCount = 3;");
  assert.equal(run("canStudyThisWeek()"), false);
  run("state.weeklyStudyCount = 2;");
  assert.equal(run("canStudyThisWeek()"), true);
});

test("important event gigs can be scheduled as a fourth show", () => {
  const { run } = createHarness();
  run("state = loadGameState(); state.scheduledShows = [{showId:'a'},{showId:'b'},{showId:'c'}];");
  assert.equal(run("addScheduledShow('veterano-turne', 4, 'event', { allowOverflow: true })"), true);
  assert.equal(run("state.scheduledShows.length"), 4);
  assert.equal(run("canAddScheduledShow({ allowOverflow: true })"), false);
  assert.equal(run("addScheduledShow('corporativo-surpresa', 5, 'event', { allowOverflow: true })"), false);
});

test("class endings require credible stage experience", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.currentDay = 70; state.chosenClass = 'roteirista'; state.hasEmployment = true;
    state.texto = 50; state.routeCounters.rewriteCount = 4;
    state.careerPathState.elencoGoodShowsCount = 1;
    state.showHistory = Array.from({length: 5}, () => ({ nota: 4 }));
  `);
  assert.equal(run("resolveRunEndingCandidate()"), null);
});

test("Jogo do Tigrinho offers a substantial reach-versus-craft tradeoff", () => {
  const { run } = createHarness();
  const event = JSON.parse(run("JSON.stringify(GAME_CONTENT.events.find(event => event.id === 'jogoDoTigrinho'))"));
  assert.ok(event);
  assert.ok(event.choices.some(choice => choice.effects.fans >= 30 && choice.effects.motivation <= -10 && choice.effects.texto < 0));
  assert.ok(event.choices.some(choice => choice.effects.texto >= 12 && choice.effects.fans < 0));
});

test("Se Vira nos 5 is a five-minute Sorocaba invite scheduled two days away", () => {
  const { run } = createHarness();
  assert.equal(run("findShowById('se-vira-nos-5').minMinutes"), 5);
  assert.equal(run("findShowById('se-vira-nos-5').location"), "Sorocaba - SP");

  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.hasStarted = true;
    setScene = () => {}; hideDialog = () => {}; updateStats = () => {}; saveGameState = () => {}; checkEmploymentOffer = () => {}; queueCriticalDialog = () => {};
    state.showHistory = [{showId:'5a5', nota:4, showType:'5a5'}];
    refreshRouteInviteAvailability('show');
  `);
  assert.equal(run("state.routeInviteState.joaoValioSeVira.pending"), true);
  run("activeEvent = GAME_CONTENT.events.find(event => event.id === 'joaoValioSeVira'); handleEventChoiceIndex(0);");
  assert.equal(run("state.seViraNos5Unlocked"), true);
  assert.equal(run("state.scheduledShows[0].showId"), "se-vira-nos-5");
  assert.equal(run("state.scheduledShows[0].dayScheduled - state.currentDay"), 2);
  assert.equal(run("state.scheduledShows[0].showType"), "seViraNos5");
});

test("a strong Se Vira nos 5 result unlocks João Valio's Black House Elenco invite", () => {
  const { run } = createHarness();
  run(`
    state = loadGameState(); ensureCareerProgressState();
    state.hasStarted = true; state.levelNumber = 6; state.level = 'elenco'; state.seViraNos5Unlocked = true;
    setScene = () => {}; hideDialog = () => {}; updateStats = () => {}; saveGameState = () => {}; checkEmploymentOffer = () => {}; queueCriticalDialog = () => {};
    state.showHistory = [{showId:'se-vira-nos-5', nota:3, showType:'seViraNos5'}];
    refreshRouteInviteAvailability('show');
  `);
  assert.equal(run("state.routeInviteState.joaoValioBlackHouseElenco.pending"), false);
  run("state.showHistory[0].nota = 4; refreshRouteInviteAvailability('show');");
  assert.equal(run("state.routeInviteState.joaoValioBlackHouseElenco.pending"), true);
  run("activeEvent = GAME_CONTENT.events.find(event => event.id === 'joaoValioBlackHouseElenco'); handleEventChoiceIndex(0);");
  assert.equal(run("state.blackHouseElencoUnlocked"), true);
  assert.equal(run("state.scheduledShows[0].showId"), "black-house-show-de-elenco");
  assert.equal(run("state.scheduledShows[0].dayScheduled - state.currentDay"), 2);
  assert.equal(run("findShowById('black-house-show-de-elenco').isElencoCircuit"), true);
});
