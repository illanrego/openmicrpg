#!/usr/bin/env node
// Verify the scene-focus rule against a locally-served game: after every action the main
// section (scene image + narration) must come back into view, while the control an action
// just opened (writing form, joke picker, dialog) keeps the viewport for as long as it is up.
//
//   python3 -m http.server 8099 --bind 127.0.0.1 --directory /home/illan/Documents/coding/openmicrpg1 &
//   google-chrome --headless=new --user-data-dir=/tmp/omrpg-verify --remote-debugging-port=9222 \
//     --no-first-run --no-default-browser-check about:blank &
//   node scripts/verify-scene-focus.js [baseUrl] [WxH] [--touch]
//
// PASS = a read beat always lands on the image + narration, an opened control is never yanked
// away, closing a dialog returns to the scene, and already-visible sections are left alone.
const http = require('http');
const BASE = process.argv[2] || 'http://127.0.0.1:8099/';
const VIEWPORT = process.argv[3] || '1366x768';
const TOUCH = process.argv.includes('--touch');
const [VW, VH] = VIEWPORT.split('x').map(Number);
const httpGet = (u) => new Promise((res, rej) => http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const list = JSON.parse(await httpGet('http://127.0.0.1:9222/json/list'));
  const host = BASE.replace(/^https?:\/\//, '').split('/')[0];
  const page = list.find(t => t.type === 'page' && t.url.includes(host)) || list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map(); let id = 0;
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } });
  const evalJS = async (e) => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };

  const MEASURE = `JSON.stringify((() => {
    const vh = window.innerHeight;
    const r = (sel) => { const el = document.querySelector(sel); if (!el) return null;
      const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
      const shown = cs.display !== 'none' && cs.visibility !== 'hidden' && b.height > 0;
      return { t: Math.round(b.top), b: Math.round(b.bottom), shown, inView: shown && b.top >= -1 && b.bottom <= vh + 1 }; };
    return {
      vh: Math.round(vh), y: Math.round(window.scrollY),
      docH: Math.round(document.documentElement.scrollHeight),
      maxScroll: Math.round(Math.max(0, document.documentElement.scrollHeight - vh)),
      img: r('#locationImg'), text: r('#text'), low: r('#btnDivLow'), joke: r('#jokeList'),
      dlg: r('#dialogBox'), cont: r('#btnContinuar'), ending: r('#endingScreen'),
      innerScrollers: [...document.querySelectorAll('*')].filter(el => el.scrollTop > 0 && el !== document.documentElement && el !== document.body).map(el => (el.id || el.className || el.tagName) + ':' + el.scrollTop)
    };
  })())`;
  const measure = async () => JSON.parse(await evalJS(MEASURE));
  const waitFor = async (expr, timeout = 8000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) { if (await evalJS(`!!(${expr})`)) return true; await sleep(150); }
    return false;
  };
  const clickFirst = async (expr) => (await evalJS(`(() => { const b = ${expr}; if (!b) return false; b.click(); return true; })()`));

  const fail = [];
  const check = (ok, message) => { if (!ok) fail.push(message); return ok; };
  const label = (m) => m ? `y=${m.y} img=${m.img?.shown ? m.img.t + '..' + m.img.b : '-'} text=${m.text?.shown ? m.text.t + '..' + m.text.b : '-'}` : 'not measured';
  // The narration types itself out, so wait until the message stops growing before judging the
  // layout. A pair taller than the viewport can end a few pixels below the fold — that is fine.
  const settleText = async (sel = '#text', quiet = 500, timeout = 8000) => {
    let last = -1, stableSince = Date.now();
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const len = await evalJS(`(document.querySelector(${JSON.stringify(sel)}).textContent || '').length`);
      if (len !== last) { last = len; stableSince = Date.now(); }
      else if (Date.now() - stableSince >= quiet) break;
      await sleep(200);
    }
    await sleep(600);   // let the scene focus timer (450ms) land afterwards
  };
  // Acceptance: the scene image fully in view with the message starting on screen. When the pair is
  // taller than the viewport (560px image on a 768px desktop window) the message may end just below the
  // fold — the focus top-aligns the section in that case, which is the best a single scroll can do.
  const sectionInView = (m) => {
    if (!m.img?.inView || !m.text?.shown || m.text.t < -1) return false;
    const pairTallerThanRoom = (m.text.b - m.img.t) > (m.vh - 24);
    return pairTallerThanRoom || m.text.b <= m.vh + 1;
  };
  // Enough state to explain a failure without re-running the take by hand.
  const diagnose = async () => JSON.parse(await evalJS(`JSON.stringify({
    uiMode, jokes: state.jokes.length, activityPoints: state.activityPoints, motivation: state.motivation,
    scheduledShows: (state.scheduledShows || []).length,
    dialogOpen: !document.querySelector('#dialogBox').classList.contains('hidden'),
    dialogActions: [...document.querySelectorAll('#dialogActions button')].map(b => b.textContent.slice(0, 24)),
    dialogText: (document.querySelector('#dialogText').textContent || '').slice(0, 90),
    overlayOpen: !document.querySelector('#criticalOverlay').classList.contains('hidden')
  })`));

  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });   // never verify a cached script.js
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: TOUCH });
  if (TOUCH) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  // Boot straight into an active run: persist a started save, then load the game.
  await send('Page.navigate', { url: BASE });
  await sleep(1500);
  await evalJS(`(() => {
    localStorage.clear();
    writingModes.day.failChance = 0;             // deterministic joke creation
    state = loadGameState(); state.hasStarted = true; state.avatar = 'avatar1'; state.name = 'Verificador';
    saveGameState(); return 1;
  })()`);
  await send('Page.navigate', { url: BASE + (BASE.includes('?') ? '&' : '?') + 'cb=' + Date.now() });
  await sleep(3000);
  await evalJS(`Object.values(writingModes).forEach(m => { m.failChance = 0; }); maybeTriggerEvent = () => {}; checkAndShowPendingEvent = () => {}; 1`);
  // Wait for the scene image to land and the app's own focus to settle (live hosting is slower).
  await waitFor(`(() => { const img = document.querySelector('#locationImg'); return img.complete && img.getBoundingClientRect().height > 0; })()`, 15000);
  await settleText();

  let boot = null, down = null, beat = null, writing = null, afterJoke = null, dialog = null, afterBook = null, prep = null, performed = null, settled = null;

  try {
  boot = await measure();
  check(sectionInView(boot), `boot: scene should be in view (${label(boot)})`);
  check(boot.innerScrollers.length === 0, `boot: the page should be the only scroller, found ${JSON.stringify(boot.innerScrollers)}`);

  // 1. The reported bug: park the viewport as far from the scene as the document allows, then
  // fire a narration beat. Position-independent: on a tall desktop page the scene is above and we
  // scroll to the bottom; on a short mobile page the scene is below and we scroll to the top.
  const sceneTop = await evalJS(`(() => { const img = document.querySelector('#locationImg');
    return Math.round(img.getBoundingClientRect().top + scrollY); })()`);
  const limits = JSON.parse(await evalJS(`JSON.stringify({ maxScroll: Math.round(Math.max(0, document.documentElement.scrollHeight - innerHeight)) })`));
  const away = sceneTop >= limits.maxScroll ? 0 : limits.maxScroll;
  await evalJS(`window.scrollTo({ top: ${away} }); 1`);
  await sleep(500);
  down = await measure();
  check(!down.img?.inView, `setup: expected the scene off screen before the beat (${label(down)})`);
  await evalJS(`displayNarration('🎤 Beat de verificação: a plateia está olhando para você.')`);
  await settleText();
  beat = await measure();
  check(sectionInView(beat), `read beat must bring image + text back into view (got ${label(beat)})`);
  check(beat.y !== down.y, `read beat must move the viewport (stuck at y=${down.y})`);
  check(beat.innerScrollers.length === 0, `read beat: no inner scroller should move (${JSON.stringify(beat.innerScrollers)})`);

  // 2. No jank: a beat fired while the section is already visible must not move the page.
  // (A clamp at the very bottom of a shorter document is the browser, not the focus code.)
  const beforeNoop = await measure();
  await evalJS(`displayNarration('🎤 Beat de verificação 2.')`);
  await settleText();
  const afterNoop = await measure();
  const shifted = Math.abs(afterNoop.y - beforeNoop.y);
  const bottomClamp = afterNoop.y <= beforeNoop.y && afterNoop.y >= afterNoop.maxScroll - 1 && afterNoop.docH <= beforeNoop.docH;
  check(shifted < 4 || bottomClamp, `visible section must be left alone (y ${beforeNoop.y} -> ${afterNoop.y}, docH ${beforeNoop.docH} -> ${afterNoop.docH})`);

  // 3. The writing form owns the viewport while it is open...
  await evalJS(`handleWriteJoke(); 1`);
  await waitFor(`getComputedStyle(document.querySelector('#btnDivLow')).display !== 'none'`);
  await sleep(900);
  writing = await measure();
  check(!!writing.low?.inView, `writing mode must keep its form on screen (${label(writing)})`);

  // ...and the beat that closes it brings the scene back. Retry once if the first mode
  // bounced off a rule (activity points, material limit) the way a player would.
  let jokeCreated = false;
  for (let attempt = 0; attempt < 2 && !jokeCreated; attempt++) {
    await clickFirst(`document.querySelector('.writing-mode-btn')`);
    const jokePrompt = await waitFor(`[...document.querySelectorAll('#dialogActions button')].some(x => /Criar/i.test(x.textContent)) || state.jokes.length > 0`);
    check(jokePrompt, `writing: never got a joke or its confirmation dialog (${JSON.stringify(await diagnose())})`);
    await clickFirst(`[...document.querySelectorAll('#dialogActions button')].find(x => /Criar/i.test(x.textContent))`);
    jokeCreated = await waitFor(`state.jokes.length > 0`, 4000);
    if (!jokeCreated) {
      check(false, `writing: the joke was never created (${JSON.stringify(await diagnose())})`);
      await evalJS(`(() => { if (typeof hideDialog === 'function') hideDialog(); if (typeof dismissCriticalDialog === 'function') dismissCriticalDialog(); exitWritingMode(); return 1; })()`);
      await sleep(700);
      await evalJS(`handleWriteJoke(); 1`);
      await sleep(900);
    }
  }
  await settleText();
  afterJoke = await measure();
  check(sectionInView(afterJoke), `finishing a joke must re-center the scene (got ${label(afterJoke)})`);

  // 4. Dialog open keeps the dialog; closing it returns to the scene.
  await evalJS(`window.scrollTo({ top: 700 }); 1`);
  await sleep(300);
  await evalJS(`handleSearchShow(); 1`);
  check(await waitFor(`!!document.querySelector('#dialogActions button')`), `show search: no offers surfaced (${JSON.stringify(await diagnose())})`);
  await sleep(600);
  dialog = await measure();
  check(!!dialog.dlg?.inView, `the show list dialog must be readable where it opens (${label(dialog)})`);
  await clickFirst(`document.querySelector('#dialogActions button')`);
  check(await waitFor(`(state.scheduledShows || []).length > 0`), `booking a show failed (${JSON.stringify(await diagnose())})`);
  await settleText();
  afterBook = await measure();
  check(sectionInView(afterBook), `booking a show must re-center the scene (got ${label(afterBook)})`);

  // 5. Show prep keeps the joke picker; the result beat re-centers the scene.
  const scheduled = await evalJS(`(state.scheduledShows || []).length > 0`);
  if (!scheduled) {
    check(false, 'show prep: nothing was scheduled, skipping the show scenario');
  } else {
    await evalJS(`(() => { state.scheduledShows = [{ showId: state.scheduledShows[0].showId, dayScheduled: state.currentDay, showType: 'normal' }]; handleGoToScheduledShow(); return 1; })()`);
    check(await waitFor(`document.querySelector('#jokeList').children.length > 0`), 'show prep: no joke picker');
    await sleep(1200);
    prep = await measure();
    check(!!prep.joke?.inView, `show prep must keep the joke picker on screen (${label(prep)})`);
    await evalJS(`(() => { document.querySelector('#btnContinuar').click(); return 1; })()`);
    await sleep(2600);
    await settleText();
    performed = await measure();
    check(sectionInView(performed), `the show result beat must land on the image + narration (got ${label(performed)})`);
    await clickFirst(`[...document.querySelectorAll('#criticalDialogActions button')][0]`);
    await sleep(1600);
    await settleText();
    settled = await measure();
    check(sectionInView(settled), `after dismissing the result dialog the scene must be in view (got ${label(settled)})`);
  }
  } catch (e) {
    check(false, `scenario crashed: ${e.message}`);
  }

  console.log(`viewport ${VIEWPORT}${TOUCH ? ' (touch/mobile emulation)' : ''}`);
  console.log(`  boot        ${label(boot)}`);
  console.log(`  scrolled    ${label(down)}`);
  console.log(`  read beat   ${label(beat)}`);
  console.log(`  writing     ${label(writing)}`);
  console.log(`  after joke  ${label(afterJoke)}`);
  console.log(`  dialog      ${label(dialog)}`);
  console.log(`  after book  ${label(afterBook)}`);
  console.log(`  show prep   ${label(prep)}`);
  console.log(`  performed   ${label(performed)}`);
  console.log(`  settled     ${label(settled)}`);
  console.log(fail.length ? 'FAIL:\n - ' + fail.join('\n - ') : 'PASS: scene focus holds (read beats re-center, controls keep the viewport, dialogs hand it back)');
  ws.close();
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error('ERR:', e.message); process.exit(2); });
