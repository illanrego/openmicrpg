/*
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                     OPEN MIC RPG — script.js                    ║
 * ║                                                                 ║
 * ║  TABLE OF CONTENTS  (search §N to jump to section)              ║
 * ║  ─────────────────────────────────────────────────               ║
 * ║  §1  CONSTANTS & CONFIGURATION                                  ║
 * ║  §2  DATA: IDEA POOL                                            ║
 * ║  §3  DATA: SHOW POOL                                            ║
 * ║  §4  DATA: EVENT POOL                                           ║
 * ║  §5  VISUAL EFFECTS & ANIMATIONS                                ║
 * ║  §6  SOUND SYSTEM                                               ║
 * ║  §7  STATE & GLOBALS                                            ║
 * ║  §8  HELPERS & UTILITIES                                        ║
 * ║  §9  XP & LEVEL SYSTEM                                          ║
 * ║  §10 SCORING ENGINE  ⛔ protected — do not alter formulas       ║
 * ║  §11 PROGRESSION & FLOW STATE                                   ║
 * ║  §12 TIME & DAY SYSTEM                                          ║
 * ║  §13 EVENT ENGINE                                               ║
 * ║  §14 PERSISTENCE (save / load)                                  ║
 * ║  §15 UI: DOM CACHE                                              ║
 * ║  §16 UI: DIALOGS                                                ║
 * ║  §17 UI: RENDERING & SCENES                                     ║
 * ║  §18 UI: JOKE LIST                                              ║
 * ║  §19 UI: INTRO FLOW                                             ║
 * ║  §20 HANDLERS: WRITING                                          ║
 * ║  §21 HANDLERS: SHOWS                                            ║
 * ║  §22 HANDLERS: CONTENT, STUDY & OTHER                           ║
 * ║  §23 HANDLERS: MATERIAL & JOKE MANAGEMENT                       ║
 * ║  §24 BOOT SEQUENCE                                              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
// ═══════════════════════════════════════════════════════════════════
// §1  CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = "openMicRPG.save.v2";
const LEGACY_STORAGE_KEY = "openMicRPG.legacyArchive.v1";
const SAVE_SCHEMA_VERSION = 3;
const GAME_CONTENT = window.OpenMicRpgContent || {};
const V2_PROGRESSION = GAME_CONTENT.progression || { classOrder: [], classPaths: {}, endingRules: {}, politico: {} };
const V2_EVENTS = GAME_CONTENT.v2Events || { classEvents: {} };
const V2_ENDINGS = GAME_CONTENT.endings || { base: {}, tone: {}, tier: {}, enabledSpecials: [] };
const CARVALHO_DIALOGS = GAME_CONTENT.carvalhoDialogs || [];
const eventPool = GAME_CONTENT.events || [];
const LEGEND_TEXT = "🤯 explodiu | 🔥 matou | 🙂 segurou | 😶 risinhos | 💧 deu água";
const MAX_SCHEDULED_SHOWS = 3;

function loadLegacyArchive() {
  try {
    const archive = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
    return Array.isArray(archive)
      ? archive.filter(entry => entry && typeof entry === "object" && (entry.runId || entry.endingId || entry.classId))
      : [];
  } catch (error) {
    console.warn("Falha ao carregar arquivo de legado.", error);
    return [];
  }
}

function computeLegacyBonuses() {
  const archive = loadLegacyArchive();
  const dominantTones = new Set(archive.map(run => run.dominantTone).filter(Boolean));
  return {
    oneliner: false,
    humorNegro: false,
    storytelling: false,
    prop: false,
    hack: archive.length >= 2 || dominantTones.has("hack"),
    politico: archive.length >= 2 || dominantTones.has("político") || archive.some(run => run.politicoUnlocked),
    writingGuide: archive.some(run => run.writingGuideUnlocked),
    crowdWork: archive.some(run => run.crowdWorkUnlocked),
    expandedClasses: archive.length >= 2
  };
}

function saveRunToLegacyArchive(runSummary) {
  try {
    const archive = loadLegacyArchive();
    archive.push(runSummary);
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(archive));
    return true;
  } catch (error) {
    console.warn("Falha ao salvar corrida no arquivo de legado.", error);
    return false;
  }
}

// ─── Time ───
const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
function getMaxActivityPoints() {
  if (state && state.hasEmployment) return 2;
  return 1;
}

const ACTIVITY_COSTS = {
  study: 1,
  desk: 1,           // sentar e escrever
  day: 1,            // anotar durante o dia (both cost 1 now)
  content: 1         // criar conteúdo
};

const createInitialTimeState = () => ({
  currentDay: 1,
  currentWeekDay: 1, // Segunda
  currentWeek: 1,
  activityPoints: getMaxActivityPoints(),
  scheduledShows: [],    // [{ showId, dayScheduled, showType }] — max 3
  performedShowToday: false,
  showHistory: [],
  consecutiveGoodShows: 0,
  flowState: null,       // { active: true, daysRemaining: X, endChance: 0.2 }
  eventsThisWeek: 0
});

// ─── Tones & Structures ───
const allowedTones = ["besteirol", "vulgar", "limpo", "humor negro", "hack", "político"];

function getUnlockedTones() {
  const base = ["besteirol", "limpo", "vulgar"];
  if (state && state.humorNegroUnlocked) base.push("humor negro");
  if (state && (state.hackUnlocked || state.levelNumber >= 5)) base.push("hack");
  if (state && (state.politicoUnlocked || state.levelNumber >= (V2_PROGRESSION.politico?.levelUnlock || 8))) base.push("político");
  return base;
}

function getUnlockedStructures() {
  const base = ["bit"];
  if (state && state.onelinerUnlocked) base.push("oneliner");
  if (state && state.storytellingUnlocked) base.push("storytelling");
  if (state && state.propUnlocked) base.push("prop");
  return base;
}

function getMaxCrowdWorkMinutes(selectedJokeCount) {
  return state?.crowdWorkUnlocked ? Math.min(3, Math.max(0, selectedJokeCount || 0)) : 0;
}

function canStudyThisWeek() {
  return (state?.weeklyStudyCount || 0) < 3;
}

const toneDescriptions = {
  besteirol: "besteiras descompromissadas",
  vulgar: "piadas pesadas sem filtro",
  limpo: "humor família e bobinho",
  "humor negro": "piadas azedas que dividem a sala",
  hack: "observações batidas porém eficientes",
  "político": "poder, sociedade e contradição"
};

const toneDescriptionsLong = {
  besteirol: "Humor bobo e descompromissado. Funciona bem com plateias relaxadas que querem rir sem pensar.",
  vulgar: "Piadas pesadas, linguagem explícita. Pode dividir a sala, mas conecta com quem curte.",
  limpo: "Humor família, sem palavrões. Ideal para corporativos e eventos diversos.",
  "humor negro": "Piadas sobre temas tabu. Pode ser brilhante ou desastroso dependendo da plateia.",
  hack: "Observações batidas mas eficientes. Todo mundo já ouviu, mas ainda funciona.",
  "político": "Humor sobre poder, vida pública e contradições sociais. Depende muito da sala."
};

const structures = ["oneliner", "storytelling", "bit", "prop"];

const STRUCTURE_MINUTE_RANGES = {
  oneliner: [1, 1],
  prop: [1, 1],
  bit: [2, 2],
  storytelling: [3, 3]
};

const structureDescriptions = {
  oneliner: "Piada curta e direta, que não necessita de mais contexto. 1 min.",
  storytelling: "Uma narrativa, uma história com vários punchs. 3 min.",
  bit: "Sequência de piadas conectadas sobre um mesmo tema. 2 min.",
  prop: "Usa objetos ou elementos visuais para complementar a piada. 1 min."
};

const PROFILE_BADGE_LABELS = {
  storytellingUnlocked: { label: "📚 Storytelling", kind: "feature" },
  fiveA5Unlocked: { label: "⭐ 5 a 5", kind: "milestone" },
  seViraNos5Unlocked: { label: "🏠 Se Vira nos 5", kind: "milestone" },
  pague15Unlocked: { label: "🏆 Pague 15", kind: "milestone" },
  timingBasico: { label: "⏱️ Timing", kind: "perk" },
  timingAvancado: { label: "⏱️ Timing Pro", kind: "perk" },
  presencaDePalco: { label: "🎭 Presença", kind: "perk" },
  crowdWorkIniciante: { label: "🗣️ Crowd Work", kind: "perk" },
  crowdWorkPro: { label: "🗣️ Crowd Work Pro", kind: "perk" },
  lidarComHeckler: { label: "🛡️ Hecklers", kind: "perk" },
  energiaAlta: { label: "⚡ Energia Alta", kind: "perk" },
  premissaSolida: { label: "📝 Premissa", kind: "perk" },
  economiaDePalavras: { label: "✂️ Economia", kind: "perk" },
  tagMachine: { label: "🏷️ Tag Machine", kind: "perk" },
  callbackMaster: { label: "🔁 Callback", kind: "perk" },
  setupKiller: { label: "🎯 Setup Killer", kind: "perk" }
};

// ─── Score scale (nota 5 → 1) ───
const SCORE_EMOJI_SCALE = [
  { threshold: 0.45, emoji: "🤯", label: "Explodiu", nota: 5 },
  { threshold: 0.32, emoji: "🔥", label: "Matou", nota: 4 },
  { threshold: 0.18, emoji: "🙂", label: "Segurou", nota: 3 },
  { threshold: 0.05, emoji: "😶", label: "Risinhos", nota: 2 },
  { threshold: -Infinity, emoji: "💧", label: "Deu água", nota: 1 }
];

// ─── Writing modes ───
const writingModes = {
  desk: {
    id: "desk",
    label: "Sentar e escrever",
    desc: "Gasta mais motivação mas gera piadas com potencial muito maior. 10% de chance de não render nada.",
    costLabel: "⚡ 1 ponto",
    motivationCost: 15,
    textoBonus: 0.10,
    failChance: 0.10
  },
  day: {
    id: "day",
    label: "Anotar durante o dia",
    desc: "Não gasta motivação mas o material sai mais cru. 20% de chance de não render nada.",
    costLabel: "⚡ 1 ponto",
    motivationCost: 0,
    textoBonus: 0,
    failChance: 0.20
  }
};

// ─── Scenes (image lookup by key) ───
const scenes = GAME_CONTENT.world?.scenes || {} ;

const avatarImages = GAME_CONTENT.world?.avatarImages || {} ;

const SHOW_RESULT_IDS = Object.freeze({
  1: "deu-agua",
  2: "risinhos",
  3: "segurou",
  4: "matou",
  5: "explodiu"
});

function getShowResultImage(nota) {
  const avatarId = avatarImages[state?.avatar] ? state.avatar : "avatar1";
  const resultId = SHOW_RESULT_IDS[nota] || SHOW_RESULT_IDS[3];
  return `assets/scenes/results/${avatarId}/${resultId}.png`;
}

const confettiColors = ['#d4a84b', '#ffd966', '#f5e6c8', '#a65d4e', '#5a8f5a'];

// ─── Narrative strings ───
const homeText = GAME_CONTENT.world?.homeText || "" ;

const mentorIntroLines = GAME_CONTENT.world?.mentorIntroLines || [] ;


// ─── Perk Trees ───
const PERK_TREES = V2_PROGRESSION.perkTrees || {};

// ─── Classes ───
const CLASSES = V2_PROGRESSION.classes || {};

function hasClassPassive(passiveId) {
  const cls = CLASSES[state.chosenClass];
  return cls?.passive === passiveId;
}




// ═══════════════════════════════════════════════════════════════════
// §2  DATA: IDEA POOL
// ═══════════════════════════════════════════════════════════════════

const ideaPool = [...(GAME_CONTENT.world?.ideaPool || []), ...(GAME_CONTENT.v2World?.politicoIdeas || [])];


// ═══════════════════════════════════════════════════════════════════
// §3  DATA: SHOW POOL
//
//     Special shows (5a5, pague15) live at the end of this array.
//     They are gated by Paulo Araújo events, not regular rotation.
// ═══════════════════════════════════════════════════════════════════

function inferShowAudienceType(show) {
  if (show?.typeAffinity && typeof show.typeAffinity === "object") {
    return inferAudienceTypeFromAffinity(show.typeAffinity);
  }
  const id = show.id || "";
  if (id.includes("corporativo") || id.includes("sindicato")) return "corporate";
  if (id.includes("teatro") || id.includes("show-solo") || id.includes("programa-tv")) return "theater";
  if (id.includes("universitario") || id.includes("republica")) return "young-chaotic";
  if (id.includes("podcast") || id.includes("rooftop-tech") || id.includes("metro")) return "digital-urban";
  if (id.includes("shopping") || id.includes("familia") || id.includes("churrascaria")) return "family";
  return "mixed-room";
}

function inferAudienceTypeFromAffinity(typeAffinity) {
  const safe = typeAffinity || {};
  const fallback = (typeof safe.default === "number") ? safe.default : 0;
  const limpo = (typeof safe.limpo === "number") ? safe.limpo : fallback;
  const hack = (typeof safe.hack === "number") ? safe.hack : fallback;
  const vulgar = (typeof safe.vulgar === "number") ? safe.vulgar : fallback;
  const humorNegro = (typeof safe["humor negro"] === "number") ? safe["humor negro"] : fallback;
  const besteirol = (typeof safe.besteirol === "number") ? safe.besteirol : fallback;

  if (limpo >= 0.55 && vulgar <= -0.6) return "corporate";
  if (limpo >= 0.55 && vulgar <= -0.25 && humorNegro <= -0.15) return "family";
  if (hack >= 0.45 && limpo >= 0.1) return "digital-urban";
  if (besteirol >= 0.45 && vulgar >= 0.2) return "young-chaotic";
  if (humorNegro >= 0.25 && limpo >= 0.25 && vulgar <= 0.2) return "theater";
  return "mixed-room";
}

function inferShowRiskProfile(show) {
  if (show.difficulty >= 0.46) return "high";
  if (show.difficulty >= 0.28) return "medium";
  return "low";
}

function inferShowSocialExposure(show) {
  const id = show.id || "";
  if (id.includes("programa-tv")) return "high";
  if (id.includes("podcast") || id.includes("rooftop-tech")) return "medium";
  return "low";
}

function inferShowCareerStage(show) {
  return show.requiresCareerStage || show.requiresLevel || "open";
}

function inferShowRewardProfile(show, stage) {
  if (stage === "headliner") return "prestige";
  if (stage === "elenco") return "consistency";
  if (show.difficulty >= 0.38) return "high-variance";
  return "learning";
}

function enrichShowWithCareerMetadata(show) {
  const stage = inferShowCareerStage(show);
  const audienceType = show.audienceType || inferShowAudienceType(show);
  const politicoConfig = V2_PROGRESSION.politico || {};
  const politicoAffinity = politicoConfig.venueOverrides?.[show.id]
    ?? politicoConfig.categoryAffinity?.[audienceType]
    ?? 0;
  return {
    ...show,
    typeAffinity: { ...(show.typeAffinity || {}), "político": politicoAffinity },
    careerStage: stage,
    audienceType,
    setLengthTarget: show.setLengthTarget || show.minMinutes,
    riskProfile: show.riskProfile || inferShowRiskProfile(show),
    rewardProfile: show.rewardProfile || inferShowRewardProfile(show, stage),
    socialExposure: show.socialExposure || inferShowSocialExposure(show)
  };
}

const showPool = (GAME_CONTENT.world?.showPool || []).map(show => enrichShowWithCareerMetadata(show));

function findShowById(showId) {
  return showPool.find((show) => show.id === showId);
}

function validateGameContent() {
  const errors = [];
  const classIds = V2_PROGRESSION.classOrder || [];
  const allowedMetrics = new Set([
    "texto", "entrega", "network", "fans", "studyCount", "writeCount", "rewriteCount",
    "contentCount", "showsScheduledCount", "showsPerformedCount", "goodShowsCount",
    "consecutiveGoodShows", "bigRoomShowsCount", "elencoGoodShowsCount", "averageNota", "levelNumber"
  ]);
  const seen = new Set();
  classIds.forEach(classId => {
    if (seen.has(classId)) errors.push(`Classe duplicada: ${classId}`);
    seen.add(classId);
    const path = V2_PROGRESSION.classPaths?.[classId];
    if (!path) errors.push(`Caminho ausente: ${classId}`);
    [1, 2].forEach(phase => {
      const event = V2_EVENTS.classEvents?.[`${classId}:event${phase}`];
      if (!event) errors.push(`Conteúdo de evento ausente: ${classId}:event${phase}`);
      if (event && event.kind !== "path") errors.push(`Evento de classe sem tipo path: ${event.id}`);
      if (phase === 2 && (!event?.choiceGroup || (event.choices || []).length !== 2)) errors.push(`Event 2 sem bifurcação válida: ${classId}`);
      Object.keys(path?.[`event${phase}`]?.requirements || {}).forEach(metric => {
        if (!allowedMetrics.has(metric)) errors.push(`Métrica inválida: ${metric}`);
      });
    });
  });
  (V2_EVENTS.pathEvents || []).forEach(event => {
    if (event.kind !== "path") errors.push(`Evento-chave sem tipo path: ${event.id}`);
    if (!event.choiceGroup) errors.push(`Evento-chave sem choiceGroup: ${event.id}`);
    Object.keys(event.requirements || {}).forEach(metric => {
      if (!allowedMetrics.has(metric)) errors.push(`Métrica inválida: ${metric}`);
    });
  });
  eventPool.forEach(event => {
    if (event.kind !== "incidental" && event.kind !== "path") errors.push(`Tipo de evento inválido: ${event.id}`);
  });
  ["base", "tone", "structure", "pure", "tier"].forEach(key => {
    if (!V2_ENDINGS[key] || typeof V2_ENDINGS[key] !== "object") errors.push(`Catálogo de finais ausente: ${key}`);
  });
  if (!V2_ENDINGS.cliffhanger) errors.push("Cliffhanger final ausente");
  if (errors.length) throw new Error(`Conteúdo V2 inválido:\n- ${errors.join("\n- ")}`);
  deepFreezeContent(GAME_CONTENT);
  return true;
}

function deepFreezeContent(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreezeContent);
  return Object.freeze(value);
}


// ═══════════════════════════════════════════════════════════════════
// §4  DATA: EVENT POOL
// ═══════════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════════
// §5  VISUAL EFFECTS & ANIMATIONS
// ═══════════════════════════════════════════════════════════════════

// Inject CSS keyframes needed by JS-created elements
(function injectFxStyles() {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    .ripple-effect {
      position: absolute; border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      animation: ripple 0.6s ease-out; pointer-events: none;
    }
    @keyframes ripple { from { transform: scale(0); opacity: 1; } to { transform: scale(4); opacity: 0; } }
  `;
  document.head.appendChild(s);
})();

const showText = (target, message, index, interval, callback, token = null) => {
  if (index < message.length) {
    const element = document.querySelector(target);
    if (element) {
      if (token !== null && token !== narrationRenderToken) return;
      element.textContent = message.substring(0, index + 1);
    }
    setTimeout(() => showText(target, message, index + 1, interval, callback, token), interval);
  } else if (callback) {
    callback();
  }
};

const animateElement = (element, animationClass, duration = 500) => {
  element.classList.add(animationClass);
  setTimeout(() => element.classList.remove(animationClass), duration);
};

const createRipple = (event, element) => {
  const ripple = document.createElement('span');
  ripple.classList.add('ripple-effect');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  element.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
};

const spawnConfetti = (count = 30) => {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = `${50 + Math.random() * 30}%`;
      confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      container.appendChild(confetti);
      setTimeout(() => confetti.remove(), 1500);
    }, i * 40);
  }
};

const animateStatChange = (statName, isPositive = true) => {
  const statElement = document.querySelector(`[data-stat="${statName}"]`);
  if (statElement) {
    statElement.classList.add('stat-updated');
    statElement.style.setProperty('--stat-color', isPositive ? 'var(--neon-cyan)' : 'var(--neon-pink)');
    setTimeout(() => statElement.classList.remove('stat-updated'), 500);
  }
};

const animateNumber = (element, start, end, duration = 500) => {
  const startTime = performance.now();
  const diff = end - start;
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(start + diff * easeProgress);
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
};

const shakeScreen = () => {
  const game = document.getElementById('game');
  game.style.animation = 'shake 0.5s ease';
  setTimeout(() => { game.style.animation = ''; }, 500);
};

const flashScreen = (color = 'rgba(212, 168, 75, 0.25)') => {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: ${color}; pointer-events: none; z-index: 9999;
    animation: fadeOut 0.25s ease forwards;
  `;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 250);
};


// ═══════════════════════════════════════════════════════════════════
// §6  SOUND SYSTEM
// ═══════════════════════════════════════════════════════════════════

const sounds = {
  click: new Audio('pokemonsoundeffects/click.wav'),
  save: new Audio('pokemonsoundeffects/save.wav'),
  getSomething: new Audio('pokemonsoundeffects/get something.wav'),
  victory: new Audio('pokemonsoundeffects/victory1.wav'),
  boom: new Audio('pokemonsoundeffects/boom.wav'),
  menu: new Audio('pokemonsoundeffects/menu.wav'),
  pokeball: new Audio('pokemonsoundeffects/pokeball.wav'),
  findSomething: new Audio('pokemonsoundeffects/find something.wav'),
  comeWithMe: new Audio('pokemonsoundeffects/come with me.wav')
};

Object.values(sounds).forEach(sound => { sound.volume = 0.3; sound.load(); });

function playSound(soundName) {
  if (sounds[soundName]) {
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
  }
}


// ═══════════════════════════════════════════════════════════════════
// §7  STATE & GLOBALS
// ═══════════════════════════════════════════════════════════════════

let state;
let currentShow = null;
let uiMode = "idle";
let introStep = 0;
let activeEvent = null;
let pendingEvent = null;
let lastLevelLabel = null;
let dialogTimeout = null;
const selectedJokeIds = new Set();
const criticalDialogQueue = [];
let suspendCriticalDialogs = false;
const deferredCriticalDialogs = [];
let narrationRenderToken = 0;
let sceneRenderToken = 0;

// Stat animation tracking
let previousStats = { fans: 0, motivation: 60, texto: 10, entrega: 5, stageTime: 0, xp: 0 };
let lastLevelNumber = null;

// Joke creation temporaries (kept module-level instead of polluting window)
let _pendingJokeIdea = null;
let _pendingJokeMode = null;
let _selectedTone = null;
let _selectedStructure = null;
let _customJokeTitle = null;
let _rewritingJoke = null;
let _newTone = null;
let _newStructure = null;


// ═══════════════════════════════════════════════════════════════════
// §8  HELPERS & UTILITIES
// ═══════════════════════════════════════════════════════════════════

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatSigned = (value) => (value > 0 ? `+${value}` : `${value}`);
const formatIdeaTitle = (idea) => idea.customTitle || `Piada sobre ${idea.seed}`;
const generatePotential = () => parseFloat((0.35 + Math.random() * 0.5).toFixed(2));
const CAREER_STAGES = ["open", "elenco"];
const VENUE_REPUTATION_MIN = -20;
const VENUE_REPUTATION_MAX = 40;

function resolveCareerStage(level = state?.level, levelNumber = state?.levelNumber) {
  if (level === "elenco" || (typeof levelNumber === "number" && levelNumber >= 6)) return "elenco";
  return "open";
}

function getCareerStage() {
  return resolveCareerStage(state?.level, state?.levelNumber);
}

function getProfileTitle() {
  if (!state) return "Comediante em formação";
  if (state.chosenClass && CLASSES[state.chosenClass]) return CLASSES[state.chosenClass].name;
  const stage = getCareerStage();
  if (stage === "elenco") return "Em circuito";
  if ((state.levelNumber || 1) >= 3) return "Em ascensão";
  return "Comediante em formação";
}

function getProfileBadges() {
  if (!state) return [];
  const badges = [];
  if (state.chosenClass && CLASSES[state.chosenClass]) {
    badges.push({ label: `💼 ${CLASSES[state.chosenClass].name}`, kind: "career" });
  } else {
    const stage = getCareerStage();
    badges.push({
      label: stage === "elenco" ? "🎬 Elenco" : "🌱 Open Mic",
      kind: "career"
    });
  }

  if (state.storytellingUnlocked) badges.push(PROFILE_BADGE_LABELS.storytellingUnlocked);
  if (state.fiveA5Unlocked) badges.push(PROFILE_BADGE_LABELS.fiveA5Unlocked);
  if (state.seViraNos5Unlocked) badges.push(PROFILE_BADGE_LABELS.seViraNos5Unlocked);
  if (state.pague15Unlocked) badges.push(PROFILE_BADGE_LABELS.pague15Unlocked);

  const visiblePerks = Array.isArray(state.unlockedPerks)
    ? state.unlockedPerks
        .map((perkId) => ({ perkId, badge: PROFILE_BADGE_LABELS[perkId] }))
        .filter((entry) => !!entry.badge)
        .map((entry) => entry.badge)
    : [];

  badges.push(...visiblePerks);
  return badges.slice(0, 6);
}

function renderProfileBadges() {
  if (!elements.profile?.title || !elements.profile?.badges) return;

  elements.profile.title.textContent = getProfileTitle();

  const badges = getProfileBadges();
  const visibleBadges = badges.slice(0, 5);
  const overflow = Math.max(0, badges.length - visibleBadges.length);
  const badgeMarkup = visibleBadges.map((badge) => `<span class="profile-badge profile-badge-${badge.kind || "perk"}">${badge.label}</span>`).join("");
  const overflowMarkup = overflow > 0 ? `<span class="profile-badge profile-badge-overflow">+${overflow}</span>` : "";
  elements.profile.badges.innerHTML = `${badgeMarkup}${overflowMarkup}`;
}

function getCareerStageIndex(stage) {
  if (stage === "headliner") return 2;
  const index = CAREER_STAGES.indexOf(stage);
  return index === -1 ? 0 : index;
}

function isCareerStageAtLeast(stage, targetStage) {
  return getCareerStageIndex(stage) >= getCareerStageIndex(targetStage);
}

function createDefaultCareerMilestones() {
  return {
    firstShow: false,
    firstStudy: false,
    firstRewrite: false,
    firstBomb: false,
    firstKill: false,
    jokes10: false,
    firstConsistencyStreak: false,
    firstTexto15: false,
    firstElencoGig: false,
    firstHeadlinerGig: false,
    firstSoloGig: false
  };
}

function createDefaultRouteCounters() {
  return {
    studyCount: 0,
    writeCount: 0,
    rewriteCount: 0,
    contentCount: 0,
    showsScheduledCount: 0
  };
}

function createDefaultRunState(existing = {}) {
  return {
    runId: typeof existing.runId === "string" && existing.runId ? existing.runId : createId(),
    status: existing.status === "ended" ? "ended" : "active",
    ruleset: "v2",
    endingId: existing.endingId || null,
    pureEndingId: existing.pureEndingId || null,
    specialEndingId: existing.specialEndingId || null,
    endingClassId: existing.endingClassId || null,
    endingArtId: existing.endingArtId || null,
    dominantStructure: existing.dominantStructure || null,
    endingTier: existing.endingTier || null,
    endingScore: Number.isFinite(existing.endingScore) ? existing.endingScore : null,
    endedDay: Number.isFinite(existing.endedDay) ? existing.endedDay : null,
    archived: !!existing.archived
  };
}

function createDefaultCareerPathState(existing = {}) {
  const normalizePhaseMap = (source = {}) => Object.fromEntries(
    (V2_PROGRESSION.classOrder || []).map(classId => {
      const value = source[classId] || {};
      const validStatus = ["unseen", "pending", "accepted", "declined", "completed"].includes(value.status) ? value.status : "unseen";
      return [classId, {
        status: validStatus,
        completedDay: Number.isFinite(value.completedDay) ? value.completedDay : null
      }];
    })
  );
  return {
    event1ByClass: normalizePhaseMap(existing.event1ByClass),
    event2ByClass: normalizePhaseMap(existing.event2ByClass),
    lockedPathId: V2_PROGRESSION.classPaths?.[existing.lockedPathId] ? existing.lockedPathId : null,
    detectedClassId: V2_PROGRESSION.classPaths?.[existing.detectedClassId] ? existing.detectedClassId : null,
    classAssignedDay: Number.isFinite(existing.classAssignedDay) ? existing.classAssignedDay : null,
    goodShowsCount: Math.max(0, Math.round(existing.goodShowsCount || 0)),
    bigRoomShowsCount: Math.max(0, Math.round(existing.bigRoomShowsCount || 0)),
    elencoGoodShowsCount: Math.max(0, Math.round(existing.elencoGoodShowsCount || 0)),
    employmentDeclinedUntil: Math.max(0, Math.round(existing.employmentDeclinedUntil || 0)),
    employmentOfferPending: !!existing.employmentOfferPending,
    activeTimeAdvance: normalizeCareerEventTimeAdvance(existing.activeTimeAdvance)
  };
}

function normalizeCareerEventTimeAdvance(existing) {
  if (!existing || typeof existing !== "object") return null;
  const classId = V2_PROGRESSION.classPaths?.[existing.classId] ? existing.classId : null;
  const phase = existing.phase === 2 ? 2 : existing.phase === 1 ? 1 : null;
  if (!classId || !phase) return null;
  return {
    classId,
    phase,
    remainingDays: Math.max(0, Math.round(existing.remainingDays || 0)),
    totalDays: Math.max(0, Math.round(existing.totalDays || 0)),
    branchChoiceId: typeof existing.branchChoiceId === "string" ? existing.branchChoiceId : null
  };
}

function createDefaultPathProgressState(existing = {}) {
  const normalizeChoice = (value) => {
    if (!value || typeof value !== "object" || !value.choiceId) return null;
    return {
      eventId: typeof value.eventId === "string" ? value.eventId : null,
      choiceId: String(value.choiceId),
      day: Number.isFinite(value.day) ? value.day : null,
      specialization: typeof value.specialization === "string" ? value.specialization : null,
      late: !!value.late
    };
  };
  return {
    flags: existing.flags && typeof existing.flags === "object" ? { ...existing.flags } : {},
    choiceGroups: Object.fromEntries(
      Object.entries(existing.choiceGroups || {})
        .map(([groupId, value]) => [groupId, normalizeChoice(value)])
        .filter(([, value]) => !!value)
    ),
    completedEventIds: Array.isArray(existing.completedEventIds)
      ? [...new Set(existing.completedEventIds.filter(Boolean))]
      : [],
    pendingEventId: typeof existing.pendingEventId === "string" ? existing.pendingEventId : null
  };
}

function createDefaultEventRuntime(existing = {}) {
  return {
    seenIds: Array.isArray(existing.seenIds) ? [...new Set(existing.seenIds.filter(Boolean))] : [],
    cooldownUntilById: existing.cooldownUntilById && typeof existing.cooldownUntilById === "object" ? { ...existing.cooldownUntilById } : {},
    pendingIds: Array.isArray(existing.pendingIds) ? existing.pendingIds.filter(Boolean) : [],
    activeEventId: typeof existing.activeEventId === "string" ? existing.activeEventId : null
  };
}

function seedCareerPathCountersFromHistory(pathState, history = []) {
  if (!Array.isArray(history)) return pathState;
  if (!pathState.goodShowsCount) pathState.goodShowsCount = history.filter(entry => entry.nota >= 4).length;
  if (!pathState.bigRoomShowsCount) {
    pathState.bigRoomShowsCount = history.filter(entry => {
      const show = findShowById(entry.showId);
      return (show?.minMinutes || 0) >= 7 || !!show?.isElencoCircuit;
    }).length;
  }
  if (!pathState.elencoGoodShowsCount) {
    pathState.elencoGoodShowsCount = history.filter(entry => findShowById(entry.showId)?.isElencoCircuit && entry.nota >= 4).length;
  }
  return pathState;
}

function createDefaultRouteInviteState() {
  return {
    cincoPiadas: { pending: false, nextOfferDay: 1 },
    joaoValioSeVira: { pending: false, nextOfferDay: 1 },
    pauloAraujoPague15: { pending: false, nextOfferDay: 1 },
    joaoValioBlackHouseElenco: { pending: false, nextOfferDay: 1 }
  };
}

function normalizeRouteInviteState(routeInviteState = {}) {
  return Object.fromEntries(
    Object.entries(createDefaultRouteInviteState()).map(([key, defaults]) => {
      const raw = routeInviteState?.[key] || {};
      return [key, {
        pending: !!raw.pending,
        nextOfferDay: Math.max(1, Math.round(raw.nextOfferDay || defaults.nextOfferDay || 1))
      }];
    })
  );
}

function normalizeRouteCounters(counters = {}) {
  return Object.fromEntries(
    Object.entries(createDefaultRouteCounters()).map(([key, defaultValue]) => {
      const value = Number(counters[key] ?? defaultValue);
      return [key, Number.isFinite(value) ? Math.max(0, Math.round(value)) : defaultValue];
    })
  );
}

function incrementRouteCounter(counterKey, amount = 1) {
  state.routeCounters = normalizeRouteCounters(state.routeCounters);
  if (!(counterKey in state.routeCounters)) return;
  state.routeCounters[counterKey] += Math.max(0, Math.round(amount || 0));
}

function createDefaultToneTally() {
  return { besteirol: 0, vulgar: 0, limpo: 0, "humor negro": 0, hack: 0, "político": 0 };
}

function createDefaultStructureTally() {
  return { bit: 0, oneliner: 0, storytelling: 0, prop: 0, crowdWork: 0 };
}

function normalizeStructureTally(tally = {}) {
  return Object.fromEntries(
    Object.entries(createDefaultStructureTally()).map(([structure, defaultValue]) => {
      const value = Number(tally?.[structure] ?? defaultValue);
      return [structure, Number.isFinite(value) ? Math.max(0, Math.round(value)) : defaultValue];
    })
  );
}

function normalizeToneTally(tally = {}) {
  return Object.fromEntries(
    Object.entries(createDefaultToneTally()).map(([tone, defaultValue]) => {
      const value = Number(tally?.[tone] ?? defaultValue);
      return [tone, Number.isFinite(value) ? Math.max(0, Math.round(value)) : defaultValue];
    })
  );
}

function tallyPerformedTones(setList = []) {
  state.toneTally = normalizeToneTally(state.toneTally);
  setList.forEach(joke => {
    if (joke?.tone in state.toneTally) state.toneTally[joke.tone] += 1;
  });
}

function tallyPerformedStructures(setList = [], crowdWorkMinutes = 0) {
  state.structureTally = normalizeStructureTally(state.structureTally);
  setList.forEach(joke => {
    if (joke?.structure in state.structureTally) {
      state.structureTally[joke.structure] += Math.max(1, Math.round(joke.minutes || 1));
    }
  });
  state.structureTally.crowdWork += Math.max(0, Math.round(crowdWorkMinutes || 0));
}

function ensureCareerProgressState() {
  if (!state) return;
  if (state.chosenClass === "professor") state.chosenClass = "comicoClassico";
  state.careerMilestones = { ...createDefaultCareerMilestones(), ...(state.careerMilestones || {}) };
  state.routeCounters = normalizeRouteCounters(state.routeCounters);
  state.runState = createDefaultRunState(state.runState);
  state.careerPathState = seedCareerPathCountersFromHistory(createDefaultCareerPathState(state.careerPathState), state.showHistory);
  state.pathProgressState = createDefaultPathProgressState(state.pathProgressState);
  state.eventRuntime = createDefaultEventRuntime(state.eventRuntime);
  state.eventRuntime.seenIds = [...new Set([...(state.eventRuntime.seenIds || []), ...(state.eventsSeen || [])])];
  state.routeInviteState = normalizeRouteInviteState(state.routeInviteState);
  state.careerChoices = state.careerChoices || [];
  state.carvalhoDialogState = {
    shownIds: Array.isArray(state.carvalhoDialogState?.shownIds) ? state.carvalhoDialogState.shownIds : [],
    triggerCooldowns: state.carvalhoDialogState?.triggerCooldowns || {}
  };
  state.elencoCircuitState = {
    weeklyGoalTarget: Math.max(2, state.elencoCircuitState?.weeklyGoalTarget || 2),
    weeklyGoalProgress: Math.max(0, state.elencoCircuitState?.weeklyGoalProgress || 0),
    completedWeek: state.elencoCircuitState?.completedWeek || null,
    weeklySuccessStreak: Math.max(0, state.elencoCircuitState?.weeklySuccessStreak || 0),
    bestWeeklyStreak: Math.max(0, state.elencoCircuitState?.bestWeeklyStreak || 0)
  };
  state.openStageState = {
    consistencyStreak: Math.max(0, state.openStageState?.consistencyStreak || 0),
    breakthroughs: Math.max(0, state.openStageState?.breakthroughs || 0)
  };
  state.onelinerUnlocked = !!state.onelinerUnlocked;
  state.humorNegroUnlocked = !!state.humorNegroUnlocked;
  state.hackUnlocked = !!state.hackUnlocked;
  state.propUnlocked = !!state.propUnlocked;
  state.politicoUnlocked = !!state.politicoUnlocked;
  state.toneTally = normalizeToneTally(state.toneTally);
  state.structureTally = normalizeStructureTally(state.structureTally);
  state.venueReputation = normalizeVenueReputationMap(state.venueReputation);
}

function isRouteInviteEvent(eventOrId) {
  const eventId = typeof eventOrId === "string" ? eventOrId : eventOrId?.id;
  return eventId === "cincoPiadas" || eventId === "joaoValioSeVira" || eventId === "pauloAraujoPague15" || eventId === "joaoValioBlackHouseElenco";
}

function canRouteInviteAppearNow(eventId) {
  if (!state) return false;
  const inviteState = state.routeInviteState?.[eventId];
  if (!inviteState?.pending) return false;
  if ((state.currentDay || 1) < (inviteState.nextOfferDay || 1)) return false;
  if (!Array.isArray(state.showHistory) || state.showHistory.length === 0) return false;
  return true;
}

function refreshRouteInviteAvailability(source = "system") {
  if (!state || !Array.isArray(eventPool)) return;
  ensureCareerProgressState();

  if (!state.fiveA5Unlocked && !state.eventsSeen.includes("cincoPiadas") && Array.isArray(state.jokes) && state.jokes.length >= 5) {
    state.routeInviteState.cincoPiadas.pending = true;
  }
  const bestFiveA5 = Math.max(0, ...(state.showHistory || []).filter(entry => entry.showId === "5a5").map(entry => entry.nota || 0));
  if (!state.seViraNos5Unlocked && !state.eventsSeen.includes("joaoValioSeVira") && bestFiveA5 >= 3) {
    state.routeInviteState.joaoValioSeVira.pending = true;
  }
  if (!state.pague15Unlocked && !state.eventsSeen.includes("pauloAraujoPague15") && (state.shows5a5AtLevel4 || 0) >= 3) {
    state.routeInviteState.pauloAraujoPague15.pending = true;
  }
  const bestSeViraNos5 = Math.max(0, ...(state.showHistory || []).filter(entry => entry.showId === "se-vira-nos-5").map(entry => entry.nota || 0));
  if (getCareerStage() === "elenco" && !state.blackHouseElencoUnlocked && !state.eventsSeen.includes("joaoValioBlackHouseElenco") && bestSeViraNos5 >= 4) {
    state.routeInviteState.joaoValioBlackHouseElenco.pending = true;
  }

  if (activeEvent || pendingEvent) return;

  const routeInviteOrder = ["cincoPiadas", "joaoValioSeVira", "pauloAraujoPague15", "joaoValioBlackHouseElenco"];
  for (const eventId of routeInviteOrder) {
    if (!canRouteInviteAppearNow(eventId)) continue;
    const event = eventPool.find((entry) => entry.id === eventId);
    if (!event) continue;
    if (source === "newDay") {
      showEvent(event);
    } else {
      pendingEvent = event;
    }
    break;
  }
}

function hasCareerMilestone(milestoneId) {
  return !!(state?.careerMilestones && state.careerMilestones[milestoneId]);
}

function markCareerMilestone(milestoneId) {
  ensureCareerProgressState();
  if (!state.careerMilestones[milestoneId]) {
    state.careerMilestones[milestoneId] = true;
    return true;
  }
  return false;
}

const contentGates = {
  showEligible(show, stage = getCareerStage()) {
    if (!show) return false;
    const requiredStage = show.requiresCareerStage || show.requiresLevel || "open";
    return isCareerStageAtLeast(stage, requiredStage);
  },
  eventEligible(event, stage = getCareerStage()) {
    if (!event) return false;
    const requiredStage = event.requiresCareerStage || event.requiresLevel || "open";
    return isCareerStageAtLeast(stage, requiredStage);
  },
  dialogEligible(dialog, stage = getCareerStage()) {
    if (!dialog) return false;
    const requiredStage = dialog.requiresCareerStage || "open";
    return isCareerStageAtLeast(stage, requiredStage);
  }
};

function isShowUnlockedForCareer(show) {
  if (!show || !state) return false;
  if (show.isHeadlinerSoloPipeline || show.isSpecialTapeShow || show.requiresCareerStage === "headliner") return false;
  if (show.requiresAvatar && !show.requiresAvatar.includes(state.avatar)) return false;
  if (show.requiresEmployment && !state.hasEmployment) return false;
  if (show.requiresBlackHouseElenco && !state.blackHouseElencoUnlocked) return false;
  if (show.requiresMadeIt || show.requiresSpecialTapeBooked) return false;
  if (show.requiredFans && (state.fans || 0) < show.requiredFans) return false;
  if (show.requiredNetwork && (state.network || 0) < show.requiredNetwork) return false;
  return true;
}

function canTriggerCarvalhoDialog(dialog, trigger, context = {}) {
  if (!dialog || dialog.trigger !== trigger) return false;
  if (!contentGates.dialogEligible(dialog)) return false;
  ensureCareerProgressState();
  const shownIds = state.carvalhoDialogState.shownIds || [];
  if (dialog.once && shownIds.includes(dialog.id)) return false;
  if (dialog.cooldown) {
    const cooldowns = state.carvalhoDialogState.triggerCooldowns || {};
    const lastDay = cooldowns[dialog.id];
    if (typeof lastDay === "number" && state.currentDay - lastDay < dialog.cooldown) return false;
  }
  if (dialog.condition && typeof dialog.condition === "function") {
    return !!dialog.condition(state, context);
  }
  return true;
}

function applyCarvalhoDialogChoice(choice) {
  if (!choice) return;
  applyEventEffects(choice.effects || {});
  updateStats();
  if (choice.narration) queueCriticalDialog(choice.narration, [{ label: "Continuar", handler: () => {} }]);
}

function showCarvalhoDialog(dialog) {
  ensureCareerProgressState();
  if (!dialog) return;
  if (!state.carvalhoDialogState.shownIds.includes(dialog.id)) state.carvalhoDialogState.shownIds.push(dialog.id);
  state.carvalhoDialogState.triggerCooldowns[dialog.id] = state.currentDay;
  const options = (dialog.choices || []).map((choice) => ({
    label: choice.label,
    handler: () => applyCarvalhoDialogChoice(choice)
  }));
  if (!options.length) options.push({ label: "Entendido", handler: () => {} });
  queueCriticalDialog(`🎓 Professor Carvalho\n\n${dialog.text}`, options);
}

function maybeTriggerCarvalhoDialog(trigger, context = {}) {
  if (!state?.hasStarted) return;
  const candidates = CARVALHO_DIALOGS
    .filter((dialog) => canTriggerCarvalhoDialog(dialog, trigger, context))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  if (!candidates.length) return;
  showCarvalhoDialog(candidates[0]);
}

function getElencoCircuitShows() {
  return showPool.filter((show) => show.isElencoCircuit && isShowUnlockedForCareer(show));
}

function maybeAddElencoCircuitGig(shows, alreadyScheduledIds, weekDay) {
  const circuitShows = getElencoCircuitShows().filter((show) => !alreadyScheduledIds.includes(show.id));
  if (!circuitShows.length) return;
  const targetByWeekDay = { 1: "elenco-porao-segunda", 3: "elenco-comedy-quarta", 0: "elenco-coletivo-domingo" };
  const preferredId = targetByWeekDay[weekDay];
  const preferred = circuitShows.find((show) => show.id === preferredId);
  const selected = preferred || circuitShows[Math.floor(Math.random() * circuitShows.length)];
  const daysAhead = preferred ? 0 : (Math.random() < 0.5 ? 1 : 2);
  shows.unshift({ show: selected, daysAhead, showType: "elenco15" });
}

function processElencoCircuitOutcome(showType, nota) {
  if (showType !== "elenco15") return;
  ensureCareerProgressState();
  const circuit = state.elencoCircuitState;
  if (nota >= 4) {
    circuit.weeklyGoalProgress += 1;
  }
  const target = circuit.weeklyGoalTarget || 2;
  if (circuit.weeklyGoalProgress >= target && circuit.completedWeek !== state.currentWeek) {
    circuit.completedWeek = state.currentWeek;
    circuit.weeklySuccessStreak += 1;
    circuit.bestWeeklyStreak = Math.max(circuit.bestWeeklyStreak || 0, circuit.weeklySuccessStreak || 0);
    state.network = (state.network || 10) + 4;
    state.texto = clamp((state.texto || 0) + 3, 0, 200);
    queueCriticalDialog(
      `📈 Objetivo do circuito concluído!\n\nVocê bateu ${target} sets fortes de elenco nesta semana. Bônus: network +4, texto +3.`,
      [{ label: "Continuar", handler: () => {} }]
    );
  }
}


function normalizeVenueReputationMap(mapLike) {
  const normalized = {};
  if (!mapLike || typeof mapLike !== "object") return normalized;
  Object.entries(mapLike).forEach(([showId, value]) => {
    if (!showId) return;
    const safeValue = Number.isFinite(value) ? value : Number(value);
    if (!Number.isFinite(safeValue)) return;
    normalized[showId] = clamp(Math.round(safeValue), VENUE_REPUTATION_MIN, VENUE_REPUTATION_MAX);
  });
  return normalized;
}

function getVenueReputation(showId) {
  if (!showId) return 0;
  ensureCareerProgressState();
  return state.venueReputation[showId] || 0;
}

function getVenueReputationTier(repValue) {
  if (repValue >= 18) return "casa-favorita";
  if (repValue >= 8) return "quente";
  if (repValue <= -10) return "fria";
  if (repValue <= -4) return "instável";
  return "neutra";
}

function getVenueOfferWeight(showId) {
  const rep = getVenueReputation(showId);
  return clamp(1 + rep * 0.03, 0.35, 2.2);
}

function adjustVenueReputation(showId, delta) {
  if (!showId || !delta) return { delta: 0, value: getVenueReputation(showId), tier: getVenueReputationTier(getVenueReputation(showId)) };
  ensureCareerProgressState();
  const current = getVenueReputation(showId);
  const next = clamp(current + delta, VENUE_REPUTATION_MIN, VENUE_REPUTATION_MAX);
  state.venueReputation[showId] = next;
  return { delta: next - current, value: next, tier: getVenueReputationTier(next) };
}

function applyVenueReputationOutcome(showId, nota, showType) {
  let delta = 0;
  if (nota >= 5) delta = 3;
  else if (nota === 4) delta = 2;
  else if (nota === 3) delta = 1;
  else if (nota === 2) delta = -1;
  else delta = -2;
  if (showType === "openStarter" && delta > 0) delta += 1;
  if ((showType === "headlinerSolo" || showType === "specialTape") && delta < 0) delta -= 1;
  return adjustVenueReputation(showId, delta);
}


function pickOpenWeightedShows(eligibleShows, maxCount) {
  if (!eligibleShows.length || maxCount <= 0) return [];
  const starter = eligibleShows.filter((show) => show.isOpenStarter);
  const regular = eligibleShows.filter((show) => !show.isOpenStarter);
  const pickCount = Math.min(maxCount, eligibleShows.length);
  const picks = [];

  const shuffledStarter = [...starter].sort(() => Math.random() - 0.5);
  const shuffledRegular = [...regular].sort(() => Math.random() - 0.5);
  const starterQuota = Math.min(shuffledStarter.length, Math.max(1, Math.ceil(pickCount * 0.7)));

  for (let i = 0; i < starterQuota && picks.length < pickCount; i += 1) {
    picks.push(shuffledStarter[i]);
  }
  for (let i = 0; i < shuffledRegular.length && picks.length < pickCount; i += 1) {
    picks.push(shuffledRegular[i]);
  }
  for (let i = starterQuota; i < shuffledStarter.length && picks.length < pickCount; i += 1) {
    picks.push(shuffledStarter[i]);
  }

  return picks.slice(0, pickCount);
}

function processOpenStageConsistencyOutcome(nota) {
  if (getCareerStage() !== "open") return;
  ensureCareerProgressState();
  const openState = state.openStageState;
  if (nota >= 3) {
    openState.consistencyStreak += 1;
  } else {
    openState.consistencyStreak = 0;
  }

  if (openState.consistencyStreak >= 3) {
    openState.consistencyStreak = 0;
    openState.breakthroughs += 1;
    state.motivation = clamp((state.motivation || 0) + 4, 0, 120);
    state.texto = clamp((state.texto || 0) + 2, 0, 200);
    if (markCareerMilestone("firstConsistencyStreak")) {
      maybeTriggerCarvalhoDialog("consistencyStreak", { streaks: openState.breakthroughs });
    }
    queueCriticalDialog(
      "📌 Virada de Open!\n\nVocê manteve consistência em 3 shows seguidos. Bônus: motivação +4, texto +2.",
      [{ label: "Continuar", handler: () => {} }]
    );
  }
}

function registerCareerChoice(choiceId, details = {}) {
  ensureCareerProgressState();
  state.careerChoices.push({
    id: choiceId,
    day: state.currentDay || 1,
    week: state.currentWeek || 1,
    ...details
  });
  state.careerChoices = state.careerChoices.slice(-40);
}


function getToneProfile() {
  const tally = normalizeToneTally(state.toneTally);
  const entries = Object.entries(tally).filter(([, count]) => count > 0);
  const totalUses = entries.reduce((sum, [, count]) => sum + count, 0);
  if (!totalUses) return { totalUses: 0, sharesByTone: {}, dominantTone: null, tiedDominantTones: [], isCamaleaoCandidate: false, hybridPair: null };
  const sharesByTone = Object.fromEntries(entries.map(([tone, count]) => [tone, count / totalUses]));
  const maxShare = Math.max(...Object.values(sharesByTone));
  const tiedDominantTones = Object.keys(sharesByTone).filter(tone => Math.abs(sharesByTone[tone] - maxShare) < 0.000001);
  const dominantTone = tiedDominantTones.length === 1 ? tiedDominantTones[0] : null;
  const hybridCandidates = Object.entries(sharesByTone).filter(([, share]) => share >= 0.4 && share <= 0.6).map(([tone]) => tone);
  const otherSharesLow = Object.entries(sharesByTone).filter(([tone]) => !hybridCandidates.includes(tone)).every(([, share]) => share < 0.15);
  return {
    totalUses,
    sharesByTone,
    dominantTone,
    tiedDominantTones,
    isCamaleaoCandidate: maxShare <= 0.3,
    hybridPair: hybridCandidates.length === 2 && otherSharesLow ? hybridCandidates : null
  };
}

function getStructureProfile() {
  const tally = normalizeStructureTally(state.structureTally);
  const entries = Object.entries(tally).filter(([, minutes]) => minutes > 0);
  const totalMinutes = entries.reduce((sum, [, minutes]) => sum + minutes, 0);
  if (!totalMinutes) return { totalMinutes: 0, sharesByStructure: {}, dominantStructure: null, tiedDominantStructures: [] };
  const sharesByStructure = Object.fromEntries(entries.map(([structure, minutes]) => [structure, minutes / totalMinutes]));
  const maxShare = Math.max(...Object.values(sharesByStructure));
  const tiedDominantStructures = Object.keys(sharesByStructure).filter(structure => Math.abs(sharesByStructure[structure] - maxShare) < 0.000001);
  return {
    totalMinutes,
    sharesByStructure,
    dominantStructure: tiedDominantStructures.length === 1 ? tiedDominantStructures[0] : null,
    tiedDominantStructures
  };
}

function hasRunSpecialization(specializationId) {
  return !!state.pathProgressState?.flags?.[`specialization:${specializationId}`];
}

function resolvePureEnding(toneProfile = getToneProfile(), structureProfile = getStructureProfile()) {
  const rules = V2_PROGRESSION.endingRules?.pure || {};
  const dominantShare = rules.dominantShare || 0.65;
  const maxSecondToneShare = rules.maxSecondToneShare || 0.20;
  const complementaryVariety = rules.complementaryVariety || 3;
  const toneEntries = Object.entries(toneProfile.sharesByTone || {}).sort((a, b) => b[1] - a[1]);
  const structureEntries = Object.entries(structureProfile.sharesByStructure || {}).sort((a, b) => b[1] - a[1]);
  const toneSpecialization = { "humor negro": "humor-negro" }[toneProfile.dominantTone];
  const structureSpecialization = { oneliner: "oneliner", storytelling: "storytelling", prop: "prop" }[structureProfile.dominantStructure];
  const toneCandidate = toneProfile.dominantTone
    && (toneEntries[0]?.[1] || 0) >= dominantShare
    && (toneEntries[1]?.[1] || 0) <= maxSecondToneShare
    && structureEntries.length >= complementaryVariety
    && (!toneSpecialization || hasRunSpecialization(toneSpecialization));
  const structureCandidate = structureProfile.dominantStructure
    && (structureEntries[0]?.[1] || 0) >= dominantShare
    && toneEntries.length >= complementaryVariety
    && (!structureSpecialization || hasRunSpecialization(structureSpecialization));
  if (!toneCandidate && !structureCandidate) return null;
  const toneMargin = (toneEntries[0]?.[1] || 0) - (toneEntries[1]?.[1] || 0);
  const structureMargin = (structureEntries[0]?.[1] || 0) - (structureEntries[1]?.[1] || 0);
  if (toneCandidate && (!structureCandidate || toneMargin >= structureMargin)) {
    return { id: `pure:tone:${toneProfile.dominantTone}`, axis: "tone", value: toneProfile.dominantTone };
  }
  return { id: `pure:structure:${structureProfile.dominantStructure}`, axis: "structure", value: structureProfile.dominantStructure };
}

function decorateSuccessfulEndingCandidate(candidate) {
  const pureEnding = resolvePureEnding();
  return pureEnding ? { ...candidate, pureEnding } : candidate;
}

function getStrongestClassReadiness(metrics = getCareerMetrics()) {
  return Math.max(0, ...(V2_PROGRESSION.classOrder || []).map(classId => {
    const requirements = V2_PROGRESSION.classPaths?.[classId]?.event2?.requirements || {};
    const entries = Object.entries(requirements);
    if (!entries.length) return 0;
    return entries.reduce((sum, [metric, required]) => sum + Math.min(1, (metrics[metric] || 0) / Math.max(1, required)), 0) / entries.length;
  }));
}

function calculateRunEndingScore(metrics = getCareerMetrics()) {
  const notaScore = clamp(metrics.averageNota / 5, 0, 1) * 50;
  const goodRatioScore = (metrics.showsPerformedCount ? metrics.goodShowsCount / metrics.showsPerformedCount : 0) * 20;
  const readinessScore = getStrongestClassReadiness(metrics) * 15;
  const speedScore = clamp((101 - (state.currentDay || 100)) / 36, 0, 1) * 15;
  return Math.round(notaScore + goodRatioScore + readinessScore + speedScore);
}

function getRunEndingTier(score) {
  const thresholds = V2_PROGRESSION.endingRules?.tierThresholds || { glorioso: 75, honesto: 50 };
  if (score >= thresholds.glorioso) return "glorioso";
  if (score >= thresholds.honesto) return "honesto";
  return "queimado";
}

function resolveSpecialEndingCandidate(successfulCandidate, toneProfile = getToneProfile(), structureProfile = getStructureProfile()) {
  if (!successfulCandidate) return null;
  const rules = V2_PROGRESSION.endingRules?.special || {};
  const toneShares = toneProfile.sharesByTone || {};
  const toneCount = Object.keys(toneShares).length;
  const structureCount = Object.keys(structureProfile.sharesByStructure || {}).length;
  const archiveClassIds = new Set(loadLegacyArchive().map(run => run.classId).filter(Boolean));
  if (successfulCandidate.classId) archiveClassIds.add(successfulCandidate.classId);

  if (successfulCandidate.classId && archiveClassIds.size >= (rules.herdeiro?.requiredClassEndings || 5)) {
    return { id: "special:herdeiro", category: "special", specialId: "herdeiro", classId: successfulCandidate.classId };
  }
  if (successfulCandidate.classId === rules.bastidorSombrio?.classId
    && toneProfile.dominantTone === rules.bastidorSombrio?.tone
    && hasRunSpecialization(rules.bastidorSombrio?.specialization)) {
    return { id: "special:bastidor-sombrio", category: "special", specialId: "bastidor-sombrio", classId: successfulCandidate.classId };
  }
  const [politico, humorNegro] = rules.profetaDoCaos?.tones || [];
  if (politico && humorNegro
    && toneShares[politico] >= rules.profetaDoCaos.minShare
    && toneShares[politico] <= rules.profetaDoCaos.maxShare
    && toneShares[humorNegro] >= rules.profetaDoCaos.minShare
    && toneShares[humorNegro] <= rules.profetaDoCaos.maxShare
    && structureCount >= rules.profetaDoCaos.minStructures) {
    return { id: "special:profeta-do-caos", category: "special", specialId: "profeta-do-caos", classId: successfulCandidate.classId || null };
  }
  if (toneProfile.isCamaleaoCandidate
    && toneCount >= rules.camaleao?.minTones
    && structureCount >= rules.camaleao?.minStructures) {
    return { id: "special:camaleao", category: "special", specialId: "camaleao", classId: successfulCandidate.classId || null };
  }
  return null;
}

function resolveRunEndingCandidate() {
  if (state.runState?.status !== "active") return null;
  const rules = V2_PROGRESSION.endingRules || {};
  const metrics = getCareerMetrics();
  const day = state.currentDay || 1;
  const classId = state.careerPathState?.detectedClassId || state.chosenClass;
  const classRequirements = V2_PROGRESSION.classPaths?.[classId]?.endingRequirements;
  let successfulCandidate = null;
  if (day >= (rules.classMinDay || 65) && classId && state.hasEmployment && metrics.showsPerformedCount >= (rules.classMinShows || 10) && metrics.elencoGoodShowsCount >= 1 && meetsHiddenRequirements(classRequirements, metrics)) {
    successfulCandidate = { id: `class:${classId}`, category: "class", classId };
  }
  if (successfulCandidate) return resolveSpecialEndingCandidate(successfulCandidate) || decorateSuccessfulEndingCandidate(successfulCandidate);
  if (hasInProgressCareerPath()) return null;
  if (day >= (rules.default?.minDay || 90) && meetsHiddenRequirements(rules.default?.requirements, metrics)) {
    successfulCandidate = { id: "default", category: "default", classId: null };
    return resolveSpecialEndingCandidate(successfulCandidate) || decorateSuccessfulEndingCandidate(successfulCandidate);
  }
  const completedEvent1 = Object.values(state.careerPathState?.event1ByClass || {}).some(entry => entry.status === "completed");
  if (day >= (rules.almost?.minDay || 95)
    && metrics.showsPerformedCount >= (rules.almost?.showsPerformedCount || 5)
    && (metrics.averageNota >= (rules.almost?.averageNota || 2.4) || completedEvent1)) {
    return { id: "almost", category: "almost", classId: classId || null };
  }
  if (day >= (rules.failureDay || 100)) return { id: "failure", category: "failure", specialId: "silencio", classId: null };
  return null;
}

function archiveFinalizedRun(summary) {
  const archive = loadLegacyArchive();
  if (archive.some(entry => entry.runId === summary.runId)) return true;
  archive.push(summary);
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(archive));
    return true;
  } catch (error) {
    console.warn("Falha ao arquivar corrida concluída.", error);
    return false;
  }
}

function buildEndingMessage(candidate, tier, toneProfile, structureProfile = getStructureProfile()) {
  const baseKey = candidate.category === "class" ? candidate.classId : candidate.category;
  const base = V2_ENDINGS.base?.[baseKey] || V2_ENDINGS.base?.default || "";
  const toneKey = toneProfile.dominantTone || "none";
  const tone = V2_ENDINGS.tone?.[toneKey] || "";
  const structure = V2_ENDINGS.structure?.[structureProfile.dominantStructure || "none"] || "";
  const pure = candidate.pureEnding?.axis ? V2_ENDINGS.pure?.[candidate.pureEnding.axis] || "" : "";
  const tierText = V2_ENDINGS.tier?.[tier] || "";
  return `🏁 FIM DA CORRIDA\n\n${base}\n\n${tone}\n\n${structure}${pure ? `\n\n🏆 ${pure}` : ""}\n\n${tierText}\n\n${V2_ENDINGS.cliffhanger || ""}`;
}

function getEndingTitle(candidate, tier) {
  const specialId = String(candidate.specialId || candidate.id || "").replace(/^special:/, "");
  if (V2_ENDINGS.special?.[specialId]?.title) return V2_ENDINGS.special[specialId].title;
  if (candidate.pureEnding?.axis === "tone") return `Voz pura: ${candidate.pureEnding.value}`;
  if (candidate.pureEnding?.axis === "structure") return `Forma pura: ${candidate.pureEnding.value}`;
  if (candidate.category === "class" && candidate.classId && CLASSES[candidate.classId]) {
    return `O solo de ${CLASSES[candidate.classId].name}`;
  }
  if (candidate.category === "almost") return "Quase solo";
  if (candidate.category === "failure") return "O silêncio";
  if (tier === "glorioso") return "O convite inevitável";
  return "O circuito reconhece";
}

function getEndingArtwork(candidate = {}) {
  const artwork = V2_ENDINGS.artwork || {};
  const fallback = artwork.fallback || { id: "fallback", path: "assets/scenes/endings/fallback.png", alt: "Palco vazio de um clube de comédia." };
  const specialId = String(candidate.specialId || candidate.id || "").replace(/^special:/, "");
  if (candidate.category === "special" && artwork.special?.[specialId]) return artwork.special[specialId];
  const pureTone = candidate.pureEnding?.axis === "tone" ? candidate.pureEnding.value : null;
  if (pureTone && artwork.pureTone?.[pureTone]) return artwork.pureTone[pureTone];
  if (candidate.category === "class" && candidate.classId && artwork.class?.[candidate.classId]) return artwork.class[candidate.classId];
  if (candidate.category === "failure" && artwork.special?.silencio) return artwork.special.silencio;
  return artwork.special?.[specialId] || fallback;
}

function getEndingCategoryLabel(candidate) {
  if (candidate.category === "special") return "final especial";
  if (candidate.pureEnding?.axis) return candidate.pureEnding.axis === "tone" ? "puro de tom" : "puro de estrutura";
  if (candidate.category === "class") return "classe formada";
  if (candidate.category === "default") return "final de circuito";
  if (candidate.category === "almost") return "quase";
  if (candidate.category === "failure") return "falha";
  return candidate.category || "corrida";
}

function getEndingLabel(value, fallback = "indefinido") {
  if (!value) return fallback;
  if (CLASSES[value]) return CLASSES[value].name;
  if (value === "crowdWork") return "Crowd work";
  return String(value);
}

function getLegacyOptionUnlocksFromArchive(archive = []) {
  const dominantTones = new Set(archive.map(run => run.dominantTone).filter(Boolean));
  return {
    hack: archive.length >= 2 || dominantTones.has("hack"),
    politico: archive.length >= 2 || dominantTones.has("político"),
    expandedClasses: archive.length >= 2
  };
}

function getEndingUnlockText() {
  const archive = loadLegacyArchive();
  const currentRunId = state.runState?.runId;
  const previousArchive = currentRunId ? archive.filter(run => run.runId !== currentRunId) : archive.slice(0, -1);
  const before = getLegacyOptionUnlocksFromArchive(previousArchive);
  const after = getLegacyOptionUnlocksFromArchive(archive);
  const labels = [];
  if (after.hack && !before.hack) labels.push("tom hack");
  if (after.politico && !before.politico) labels.push("tom político");
  if (after.expandedClasses && !before.expandedClasses) labels.push("classes Ator Cômico e Influencer");
  if (labels.length) return `Novas opções no próximo run: ${labels.join(", ")}.`;
  return state.runState?.archived
    ? "Final registrado no arquivo de corridas."
    : "O arquivo não pôde ser atualizado neste navegador.";
}

function buildEndingViewData(candidate, tier, toneProfile, structureProfile = getStructureProfile()) {
  const metrics = getCareerMetrics();
  const baseKey = candidate.category === "class" ? candidate.classId : candidate.category;
  const specialId = String(candidate.specialId || candidate.id || "").replace(/^special:/, "");
  const base = V2_ENDINGS.special?.[specialId]?.text || V2_ENDINGS.base?.[baseKey] || V2_ENDINGS.base?.default || "";
  const toneKey = toneProfile.dominantTone || "none";
  const structureKey = structureProfile.dominantStructure || "none";
  const pure = candidate.pureEnding?.axis ? V2_ENDINGS.pure?.[candidate.pureEnding.axis] || "" : "";
  const paragraphs = [
    base,
    V2_ENDINGS.tone?.[toneKey] || "",
    V2_ENDINGS.structure?.[structureKey] || "",
    pure ? `🏆 ${pure}` : "",
    V2_ENDINGS.tier?.[tier] || "",
    V2_ENDINGS.cliffhanger || ""
  ].filter(Boolean);

  return {
    title: getEndingTitle(candidate, tier),
    categoryLabel: getEndingCategoryLabel(candidate),
    artwork: getEndingArtwork(candidate),
    paragraphs,
    summary: [
      ["Classe", getEndingLabel(candidate.classId || state.careerPathState?.detectedClassId || state.chosenClass, "Sem classe definida")],
      ["Tom dominante", getEndingLabel(toneProfile.dominantTone)],
      ["Estrutura", getEndingLabel(structureProfile.dominantStructure)],
      ["Caminho", getEndingCategoryLabel(candidate)],
      ["Dia", state.runState?.endedDay || state.currentDay || "?"],
      ["Shows", metrics.showsPerformedCount || 0]
    ],
    unlocks: getEndingUnlockText()
  };
}

function setGameplayLocked(locked) {
  Object.values(elements.buttons || {}).forEach(button => { if (button) button.disabled = !!locked; });
  [elements.btnEndDay, elements.btnGoToShow, elements.btnContinuar].forEach(button => { if (button) button.disabled = !!locked; });
}

function renderEndingSummary(summary = []) {
  if (!elements.ending?.summary) return;
  elements.ending.summary.innerHTML = "";
  summary.forEach(([label, value]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = String(value);
    item.appendChild(term);
    item.appendChild(detail);
    elements.ending.summary.appendChild(item);
  });
}

function renderEndingArtwork(artwork) {
  const image = elements.ending?.art;
  if (!image) return;
  const fallback = V2_ENDINGS.artwork?.fallback;
  image.alt = artwork?.alt || fallback?.alt || "Ilustração do final da corrida.";
  image.onerror = () => {
    if (!fallback || image.src.endsWith(fallback.path)) return;
    image.onerror = null;
    image.src = fallback.path;
    image.alt = fallback.alt || image.alt;
  };
  image.src = artwork?.path || fallback?.path || "assets/scenes/endings/fallback.png";
}

function showEndingScreen(candidate, tier, toneProfile, structureProfile = getStructureProfile()) {
  const ending = elements.ending;
  if (!ending?.screen || !elements.mainPanel) return false;
  const view = buildEndingViewData(candidate, tier, toneProfile, structureProfile);
  if (ending.eyebrow) ending.eyebrow.textContent = `Fim da corrida · ${view.categoryLabel}`;
  if (ending.title) ending.title.textContent = view.title;
  if (ending.prose) {
    ending.prose.innerHTML = "";
    view.paragraphs.forEach(paragraph => {
      const node = document.createElement("p");
      node.textContent = paragraph;
      ending.prose.appendChild(node);
    });
  }
  renderEndingSummary(view.summary);
  if (ending.unlocks) ending.unlocks.textContent = view.unlocks;
  renderEndingArtwork(view.artwork);
  uiMode = "ending";
  setGameplayLocked(true);
  elements.mainPanel.classList.add("ending-active");
  ending.screen.classList.remove("hidden");
  if (ending.newRun && typeof ending.newRun.focus === "function") ending.newRun.focus();
  return true;
}

function hideEndingScreen() {
  if (elements.ending?.screen) elements.ending.screen.classList.add("hidden");
  elements.mainPanel?.classList.remove("ending-active");
}

function renderFinalizedRun() {
  if (state.runState?.status !== "ended") return;
  setGameplayLocked(true);
  const toneProfile = getToneProfile();
  const structureProfile = getStructureProfile();
  const candidate = {
    id: state.runState.endingId,
    category: state.runState.specialEndingId ? "special" : (state.runState.endingId?.startsWith("class:") ? "class" : state.runState.endingId),
    specialId: state.runState.specialEndingId || null,
    classId: state.runState.endingClassId || (state.runState.endingId?.startsWith("class:") ? state.runState.endingId.split(":")[1] : null),
    pureEnding: state.runState.pureEndingId ? {
      id: state.runState.pureEndingId,
      axis: state.runState.pureEndingId.split(":")[1],
      value: state.runState.pureEndingId.split(":").slice(2).join(":")
    } : null,
    endingArtId: state.runState.endingArtId
  };
  showEndingScreen(candidate, state.runState.endingTier, toneProfile, structureProfile);
}

function finalizeRun(candidate) {
  if (!candidate || state.runState?.status !== "active") return false;
  const toneProfile = getToneProfile();
  const structureProfile = getStructureProfile();
  const score = calculateRunEndingScore();
  const tier = getRunEndingTier(score);
  const artwork = getEndingArtwork(candidate);
  state.runState.status = "ended";
  state.runState.endingId = candidate.id;
  state.runState.pureEndingId = candidate.pureEnding?.id || null;
  state.runState.specialEndingId = candidate.specialId || null;
  state.runState.endingClassId = candidate.classId || null;
  state.runState.endingArtId = artwork.id;
  state.runState.dominantStructure = structureProfile.dominantStructure;
  state.runState.endingTier = tier;
  state.runState.endingScore = score;
  state.runState.endedDay = state.currentDay;
  saveGameState();
  const archive = loadLegacyArchive();
  const archived = archiveFinalizedRun({
    runId: state.runState.runId,
    runNumber: archive.length + 1,
    endingId: candidate.id,
    classId: candidate.classId || null,
    dominantTone: toneProfile.dominantTone,
    dominantStructure: structureProfile.dominantStructure,
    pureEndingId: candidate.pureEnding?.id || null,
    specialEndingId: candidate.specialId || null,
    endingArtId: artwork.id,
    politicoUnlocked: !!state.politicoUnlocked,
    writingGuideUnlocked: !!state.writingGuideUnlocked,
    crowdWorkUnlocked: !!state.crowdWorkUnlocked,
    endTier: tier,
    score,
    day: state.currentDay
  });
  state.runState.archived = archived;
  saveGameState();
  renderFinalizedRun();
  return true;
}

function maybeResolveRunEnding() {
  if (checkEmploymentOffer()) return false;
  const candidate = resolveRunEndingCandidate();
  return candidate ? finalizeRun(candidate) : false;
}

function maybeCheckProgressionGates(options = {}) {
  if (state.runState?.status !== "active") return false;
  if (checkEmploymentOffer()) return true;
  if (options.allowCareerEvents !== false && maybeOfferCareerEvent()) return true;
  if (options.resolveEnding !== false) return maybeResolveRunEnding();
  return false;
}

function startNewRunAfterEnding() {
  if (state.runState?.status !== "ended" || !state.runState.archived) return;
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function viewArchiveFromEnding() {
  hideEndingScreen();
  handleViewHistory();
  setGameplayLocked(true);
  if (elements.btnDivLow) {
    const newRunButton = document.createElement("button");
    newRunButton.type = "button";
    newRunButton.className = "ending-archive-new-run";
    newRunButton.textContent = "🎤 Nova corrida";
    newRunButton.addEventListener("click", startNewRunAfterEnding);
    elements.btnDivLow.appendChild(newRunButton);
  }
}

function getScheduledShowsForToday() {
  return (state.scheduledShows || []).filter(s => s.dayScheduled === state.currentDay);
}
function getNearestScheduledShow() {
  const shows = (state.scheduledShows || []).filter(s => s.dayScheduled >= state.currentDay);
  if (!shows.length) return null;
  shows.sort((a, b) => a.dayScheduled - b.dayScheduled);
  return shows[0];
}
function removeScheduledShow(entry) {
  state.scheduledShows = (state.scheduledShows || []).filter(s => s !== entry);
}
function canAddScheduledShow(options = {}) {
  const scheduleLimit = MAX_SCHEDULED_SHOWS + (options.allowOverflow ? 1 : 0);
  return (state?.scheduledShows || []).length < scheduleLimit;
}
function addScheduledShow(showId, dayScheduled, showType = "normal", options = {}) {
  if (!state.scheduledShows) state.scheduledShows = [];
  if (!canAddScheduledShow(options)) return false;
  state.scheduledShows.push({ showId, dayScheduled, showType, isEventGig: !!options.allowOverflow });
  incrementRouteCounter("showsScheduledCount");
  if (state.runState?.status === "active") setTimeout(() => maybeCheckProgressionGates({ resolveEnding: false }), 0);
  return true;
}

const scoreToEmoji = (score) => {
  const normalized = Number.isFinite(score) ? score : 0;
  const tier = SCORE_EMOJI_SCALE.find((t) => normalized >= t.threshold) || SCORE_EMOJI_SCALE[SCORE_EMOJI_SCALE.length - 1];
  return { emoji: tier.emoji, label: tier.label, nota: tier.nota };
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `jk-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function getStructureMinuteRange(structure) {
  return STRUCTURE_MINUTE_RANGES[structure] || STRUCTURE_MINUTE_RANGES.oneliner;
}

function getRandomMinutesForStructure(structure) {
  const [min, max] = getStructureMinuteRange(structure);
  return min + Math.floor(Math.random() * (max - min + 1));
}

function normalizeMinutesForStructure(minutes, structure) {
  const [min, max] = getStructureMinuteRange(structure);
  const numericMinutes = Number(minutes);
  const fallbackMinutes = getRandomMinutesForStructure(structure);
  const safeMinutes = Number.isFinite(numericMinutes) ? Math.round(numericMinutes) : fallbackMinutes;
  return clamp(safeMinutes, min, max);
}

const sanitizeJoke = (joke) => {
  const tone = allowedTones.includes(joke.tone) ? joke.tone : allowedTones[Math.floor(Math.random() * allowedTones.length)];
  const structure = structures.includes(joke.structure) ? joke.structure : structures[Math.floor(Math.random() * structures.length)];
  return {
    ...joke, tone, structure,
    minutes: normalizeMinutesForStructure(joke.minutes, structure),
    truePotential: typeof joke.truePotential === "number" ? clamp(joke.truePotential, 0.1, 0.99) : generatePotential(),
    history: Array.isArray(joke.history) ? [...joke.history].slice(-7) : [],
    lastResult: joke.lastResult || "⏱️ ainda não testada",
    freshness: joke.freshness || "nova"
  };
};

const cloneJokes = (list) => list.map((joke) => sanitizeJoke(joke));
const describeTone = (tone) => toneDescriptions[tone] || "coisa difícil de rotular";
const formatHistory = (history = []) => history && history.length ? history.join(" ") : "⏱️ nenhuma referência recente";

function getQuartoForWeekday(weekday) {
  const quartos = ['assets/scenes/writing/quarto1.png', 'assets/scenes/writing/quarto2.png', 'assets/scenes/writing/quarto3.png', 'assets/scenes/writing/quarto4.png', 'assets/scenes/writing/quarto5.png'];
  if (weekday === 0) return quartos[1]; // Domingo
  if (weekday === 6) return quartos[0]; // Sábado
  return quartos[weekday - 1];          // Segunda–Sexta
}

function getNotebookImageForTexto(texto) {
  if (texto >= 200) return "assets/scenes/writing/notebook5.png";  // Max tier
  if (texto >= 150) return "assets/scenes/writing/notebook4.png";  // Very high
  if (texto >= 90) return "assets/scenes/writing/notebook3.png";   // High
  if (texto >= 30) return "assets/scenes/writing/notebook2.png";   // Mid
  return "assets/scenes/writing/notebook1.png";                     // Low
}

function findDaysToWeekday(targetWeekday) {
  if (state.currentWeekDay === targetWeekday) return 0;
  let days = 0;
  let check = state.currentWeekDay;
  while (check !== targetWeekday && days < 7) { check = (check + 1) % 7; days++; }
  return days;
}

function getDayName(dayNumber) {
  return DAYS_OF_WEEK[dayNumber % 7] || "???";
}

function getTotalMinutes() {
  return state.jokes.reduce((acc, joke) => acc + (joke.minutes || 0), 0);
}

function canAffordActivity(cost) {
  return state.activityPoints >= cost;
}

function spendActivityPoints(cost, activityName) {
  if (!canAffordActivity(cost)) {
    shakeScreen();
    showDialog(`⚠️ Você não tem pontos de atividade suficientes!\n\nPrecisa de ${cost} ponto(s), mas só tem ${state.activityPoints}.`, [
      { label: "🌙 Encerrar Dia", handler: () => { hideDialog(); handleEndDay(); } },
      { label: "Voltar", handler: hideDialog }
    ]);
    return false;
  }
  state.activityPoints = Math.max(0, state.activityPoints - cost);
  updateStats();
  return true;
}

function checkStatRequirements(requirements) {
  const warnings = [];
  if (requirements.motivation && state.motivation < requirements.motivation) {
    warnings.push({ stat: "motivação", required: requirements.motivation, current: state.motivation, tip: "Descanse, faça shows bem-sucedidos ou crie conteúdo para recuperar motivação." });
  }
  if (requirements.texto && state.texto < requirements.texto) {
    warnings.push({ stat: "texto", required: requirements.texto, current: state.texto, tip: "Estude comédia para aumentar seu texto." });
  }
  return warnings;
}

function formatEffectsSummary(effects) {
  if (!effects || Object.keys(effects).length === 0) return "";
  const changes = [];
  if (effects.fans) changes.push(`Fãs ${formatSigned(effects.fans)}`);
  if (effects.motivation) changes.push(`Motivação ${formatSigned(effects.motivation)}`);
  if (effects.texto) changes.push(`Texto ${formatSigned(effects.texto)}`);
  if (effects.entrega) changes.push(`Entrega ${formatSigned(effects.entrega)}`);
  if (effects.network) changes.push(`Network ${formatSigned(effects.network)}`);
  if (effects.stageTime) changes.push(`Tempo de Palco ${formatSigned(effects.stageTime)}`);
  return changes.length > 0 ? `\n\n📊 [${changes.join(" | ")}]` : "";
}

function drawUniqueIdea() {
  const usedTitles = new Set((state?.jokes || []).map((joke) => joke.title));
  const unused = ideaPool.filter((idea) => !usedTitles.has(formatIdeaTitle(idea)));
  return unused.length ? unused[Math.floor(Math.random() * unused.length)] : null;
}

// ─── Perk Helpers ───
function hasPerk(perkId) {
  return state && Array.isArray(state.unlockedPerks) && state.unlockedPerks.includes(perkId);
}

function getPerkEffect(effectKey) {
  if (!state || !Array.isArray(state.unlockedPerks)) return 0;
  let total = 0;
  const allPerks = [...PERK_TREES.texto, ...PERK_TREES.entrega];
  for (const perk of allPerks) {
    if (state.unlockedPerks.includes(perk.id) && perk.effect[effectKey]) {
      total += perk.effect[effectKey];
    }
  }
  return total;
}

function getAvailablePerks() {
  if (!state) return [];
  const unlocked = state.unlockedPerks || [];
  const allPerks = [...PERK_TREES.texto.map(p => ({ ...p, tree: "texto" })), ...PERK_TREES.entrega.map(p => ({ ...p, tree: "entrega" }))];
  return allPerks.filter(perk => {
    if (unlocked.includes(perk.id)) return false;
    if (perk.level > state.levelNumber) return false;
    if (perk.requires && !unlocked.includes(perk.requires)) return false;
    return true;
  });
}

function showPerkSelectionDialog() {
  const available = getAvailablePerks();
  if (!available.length || (state.availablePerkPoints || 0) <= 0) return;

  const options = available.map(perk => ({
    label: `${perk.tree === "texto" ? "📝" : "🎭"} ${perk.name} — ${perk.desc}${perk.warning ? " ⚠️" : ""}`,
    handler: () => {
      state.unlockedPerks = state.unlockedPerks || [];
      state.unlockedPerks.push(perk.id);
      state.availablePerkPoints = Math.max(0, (state.availablePerkPoints || 0) - 1);
      playSound('getSomething');
      spawnConfetti(20);
      flashScreen('rgba(212, 168, 75, 0.3)');
      queueCriticalDialog(`✨ Vantagem desbloqueada: ${perk.name}!\n\n${perk.desc}${perk.warning ? "\n\n⚠️ Professor Carvalho avisa: 'Callback fraco só repete referência. Callback forte reaproveita o elemento e gera piada nova. Use com moderação.'" : ""}`);
      saveGameState();
    }
  }));
  options.push({ label: "Guardar para depois", handler: () => {} });

  queueCriticalDialog(`🌟 Você tem ${state.availablePerkPoints} ponto(s) de vantagem!\n\nEscolha uma vantagem para desbloquear:`, options);
}


// ─── Class & Employment Helpers ───
let careerEventDialogPending = false;
let pathEventDialogPending = false;
let employmentOfferDialogPending = false;

function isSkillUnlocked(unlockId) {
  const stateKeyByUnlock = {
    humorNegro: "humorNegroUnlocked",
    storytelling: "storytellingUnlocked",
    prop: "propUnlocked",
    oneliner: "onelinerUnlocked"
  };
  const stateKey = stateKeyByUnlock[unlockId];
  return stateKey ? !!state[stateKey] : false;
}

function unlockMentorSkill(unlockId) {
  const stateKeyByUnlock = {
    humorNegro: "humorNegroUnlocked",
    storytelling: "storytellingUnlocked",
    prop: "propUnlocked",
    oneliner: "onelinerUnlocked"
  };
  const stateKey = stateKeyByUnlock[unlockId];
  if (!stateKey) return false;
  const wasUnlocked = !!state[stateKey];
  state[stateKey] = true;
  return !wasUnlocked;
}

function getPathEventChoices(event) {
  if (!event?.revisitOf) return event?.choices || [];
  const original = (V2_EVENTS.pathEvents || []).find(candidate => candidate.choiceGroup === event.revisitOf);
  const earlyChoice = state.pathProgressState?.choiceGroups?.[event.revisitOf]?.choiceId;
  if (!original || !earlyChoice) return [];
  return (original.choices || [])
    .filter(choice => choice.id !== earlyChoice && !isSkillUnlocked(choice.unlock))
    .map(choice => ({
      ...choice,
      specialization: null,
      effects: choice.unlock === "humorNegro" || choice.unlock === "oneliner" ? { texto: 2 } : { entrega: 2 },
      narration: `${choice.narration} A técnica amplia seu repertório, mas chegou tarde demais para definir esta corrida.`
    }));
}

function getEligiblePathEvents() {
  ensureCareerProgressState();
  if (state.runState?.status !== "active") return [];
  const metrics = getCareerMetrics();
  const day = state.currentDay || 1;
  return (V2_EVENTS.pathEvents || []).filter(event => {
    if (!event || state.pathProgressState.completedEventIds.includes(event.id)) return false;
    const isPending = state.pathProgressState.pendingEventId === event.id;
    if (!isPending && (day < event.minDay || day > event.maxDay)) return false;
    if (state.pathProgressState.choiceGroups[event.choiceGroup]) return false;
    if (event.revisitOf && !state.pathProgressState.choiceGroups[event.revisitOf]) return false;
    if (!meetsHiddenRequirements(event.requirements || {}, metrics)) return false;
    return getPathEventChoices(event).length > 0;
  });
}

function maybeOfferPathEvent() {
  if (pathEventDialogPending || careerEventDialogPending || activeEvent || pendingEvent || state.runState?.status !== "active") return false;
  const event = getEligiblePathEvents()[0];
  if (!event) return false;
  const choices = getPathEventChoices(event);
  if (!choices.length) return false;
  state.pathProgressState.pendingEventId = event.id;
  pathEventDialogPending = true;
  saveGameState();
  queueCriticalDialog(`${event.title}\n\n${event.text}`, choices.map(choice => ({
    label: choice.label,
    handler: () => {
      pathEventDialogPending = false;
      applyPathEventChoice(event, choice);
    }
  })), { imageSrc: event.image || "", imageAlt: event.title, imageIsCharacter: (event.image || "").includes("/characters/") });
  return true;
}

function applyPathEventChoice(event, choice) {
  ensureCareerProgressState();
  const late = !!event.revisitOf;
  applyEventEffects(choice.effects || {});
  const newlyUnlocked = unlockMentorSkill(choice.unlock);
  state.pathProgressState.choiceGroups[event.choiceGroup] = {
    eventId: event.id,
    choiceId: choice.id,
    day: state.currentDay || 1,
    specialization: late ? null : (choice.specialization || null),
    late
  };
  if (!late && choice.specialization) state.pathProgressState.flags[`specialization:${choice.specialization}`] = true;
  state.pathProgressState.completedEventIds.push(event.id);
  state.pathProgressState.completedEventIds = [...new Set(state.pathProgressState.completedEventIds)];
  state.pathProgressState.pendingEventId = null;
  registerCareerChoice("mentor-path-choice", {
    eventId: event.id,
    choiceGroup: event.choiceGroup,
    choiceId: choice.id,
    specialization: late ? null : (choice.specialization || null),
    late
  });
  const unlockText = newlyUnlocked ? `\n\n🔓 ${choice.unlock.toUpperCase()} desbloqueado.` : "";
  queueCriticalDialog(`${choice.narration || "A escolha começa a alterar sua corrida."}${formatEffectsSummary(choice.effects || {})}${unlockText}`);
  updateStats();
  saveGameState();
}

function getCareerMetrics() {
  const history = state.showHistory || [];
  const counters = normalizeRouteCounters(state.routeCounters);
  const totalNota = history.reduce((sum, entry) => sum + (Number(entry.nota) || 0), 0);
  return {
    texto: state.texto || 0,
    entrega: state.entrega || 0,
    network: state.network || 0,
    fans: state.fans || 0,
    levelNumber: state.levelNumber || 1,
    studyCount: counters.studyCount,
    writeCount: counters.writeCount,
    rewriteCount: counters.rewriteCount,
    contentCount: counters.contentCount,
    showsScheduledCount: counters.showsScheduledCount,
    showsPerformedCount: history.length,
    goodShowsCount: state.careerPathState?.goodShowsCount || 0,
    consecutiveGoodShows: state.consecutiveGoodShows || 0,
    bigRoomShowsCount: state.careerPathState?.bigRoomShowsCount || 0,
    elencoGoodShowsCount: state.careerPathState?.elencoGoodShowsCount || 0,
    averageNota: history.length ? totalNota / history.length : 0
  };
}

function meetsHiddenRequirements(requirements = {}, metrics = getCareerMetrics()) {
  return Object.entries(requirements).every(([metric, required]) => (metrics[metric] || 0) >= required);
}

function getRequirementReadiness(requirements = {}, metrics = getCareerMetrics()) {
  const entries = Object.entries(requirements);
  if (!entries.length) return 0;
  return entries.reduce((sum, [metric, required]) => sum + ((metrics[metric] || 0) / Math.max(1, required)), 0) / entries.length;
}

function isClassPathAvailable(classId) {
  const path = V2_PROGRESSION.classPaths?.[classId];
  return !!path && loadLegacyArchive().length >= (path.availableAfterRuns || 0);
}

function getEligibleCareerEvents() {
  ensureCareerProgressState();
  if (state.runState.status !== "active" || state.careerPathState.lockedPathId) return [];
  const day = state.currentDay || 1;
  const metrics = getCareerMetrics();
  const candidates = [];
  (V2_PROGRESSION.classOrder || []).forEach((classId, order) => {
    if (!isClassPathAvailable(classId)) return;
    const path = V2_PROGRESSION.classPaths[classId];
    const first = state.careerPathState.event1ByClass[classId];
    const second = state.careerPathState.event2ByClass[classId];
    if (first?.status === "completed" && ["unseen", "pending"].includes(second?.status)) {
      const config = path.event2;
      const isInOfferWindow = day >= config.minDay && day <= config.maxDay;
      const isLateQualifiedPath = day >= (V2_PROGRESSION.endingRules?.default?.minDay || 90)
        && day < (V2_PROGRESSION.endingRules?.failureDay || 100);
      if (second.status === "pending" || ((isInOfferWindow || isLateQualifiedPath) && meetsHiddenRequirements(config.requirements, metrics))) {
        candidates.push({ classId, phase: 2, config, order, readiness: getRequirementReadiness(config.requirements, metrics) });
      }
      return;
    }
    if (["unseen", "pending"].includes(first?.status)) {
      const config = path.event1;
      const isInOfferWindow = day >= config.minDay && day <= config.maxDay;
      const isLateQualifiedPath = day >= (V2_PROGRESSION.endingRules?.default?.minDay || 90)
        && day < (V2_PROGRESSION.endingRules?.failureDay || 100);
      if (first.status === "pending" || ((isInOfferWindow || isLateQualifiedPath) && meetsHiddenRequirements(config.requirements, metrics))) {
        candidates.push({ classId, phase: 1, config, order, readiness: getRequirementReadiness(config.requirements, metrics) });
      }
    }
  });
  return candidates.sort((a, b) => b.phase - a.phase || b.readiness - a.readiness || a.order - b.order);
}

function hasInProgressCareerPath() {
  const pathState = state.careerPathState;
  return [pathState?.event1ByClass, pathState?.event2ByClass]
    .flatMap(phaseMap => Object.values(phaseMap || {}))
    .some(event => ["pending", "accepted"].includes(event?.status));
}

function maybeOfferCareerEvent() {
  if (careerEventDialogPending || pathEventDialogPending || activeEvent || pendingEvent || state.runState?.status !== "active") return false;
  if (maybeOfferPathEvent()) return true;
  const candidate = getEligibleCareerEvents()[0];
  if (!candidate) return false;
  const phaseMap = candidate.phase === 1 ? state.careerPathState.event1ByClass : state.careerPathState.event2ByClass;
  phaseMap[candidate.classId].status = "pending";
  const content = V2_EVENTS.classEvents?.[`${candidate.classId}:event${candidate.phase}`];
  if (!content) return false;
  careerEventDialogPending = true;
  saveGameState();
  const pathChoices = candidate.phase === 2 && Array.isArray(content.choices)
    ? content.choices.map(choice => ({
        label: choice.label,
        handler: () => {
          careerEventDialogPending = false;
          acceptCareerEvent(candidate, choice);
        }
      }))
    : [{
        label: content.acceptLabel,
        handler: () => {
          careerEventDialogPending = false;
          acceptCareerEvent(candidate);
        }
      }];
  pathChoices.push({
      label: content.declineLabel,
      handler: () => {
        careerEventDialogPending = false;
        phaseMap[candidate.classId].status = "declined";
        saveGameState();
        maybeCheckProgressionGates({ resolveEnding: false });
      }
    });
  queueCriticalDialog(`${content.title}\n\n${content.text}\n\nEssa oportunidade ocupa ${candidate.config.durationDays} dia(s).`, pathChoices, { imageSrc: content.image || "", imageAlt: content.title, imageIsCharacter: candidate.phase === 2 });
  return true;
}

function acceptCareerEvent(candidate, branchChoice = null) {
  const phaseMap = candidate.phase === 1 ? state.careerPathState.event1ByClass : state.careerPathState.event2ByClass;
  phaseMap[candidate.classId].status = "accepted";
  if (candidate.phase === 2) state.careerPathState.lockedPathId = candidate.classId;
  state.careerPathState.activeTimeAdvance = {
    classId: candidate.classId,
    phase: candidate.phase,
    remainingDays: candidate.config.durationDays,
    totalDays: candidate.config.durationDays,
    branchChoiceId: branchChoice?.id || null
  };
  state.activityPoints = 0;
  updateStats();
  displayNarration(`📌 Este desafio ocupa ${candidate.config.durationDays} dia(s). Nesse período, você não recebe pontos de atividade, mas shows e ações sem custo continuam disponíveis normalmente.`);
  saveGameState();
}

function completeCareerEventTimeAdvance(activeAdvance) {
  const active = normalizeCareerEventTimeAdvance(activeAdvance);
  if (!active) return false;
  const phaseMap = active.phase === 1 ? state.careerPathState.event1ByClass : state.careerPathState.event2ByClass;
  phaseMap[active.classId].status = "completed";
  phaseMap[active.classId].completedDay = state.currentDay;
  let branchChoice = null;
  if (active.phase === 2) {
    const content = V2_EVENTS.classEvents?.[`${active.classId}:event2`];
    branchChoice = (content?.choices || []).find(choice => choice.id === active.branchChoiceId) || null;
    if (branchChoice) {
      applyEventEffects(branchChoice.effects || {});
      state.pathProgressState.choiceGroups[content.choiceGroup] = {
        eventId: content.id,
        choiceId: branchChoice.id,
        day: state.currentDay || 1,
        specialization: null,
        late: false
      };
      if (branchChoice.flag) state.pathProgressState.flags[branchChoice.flag] = true;
      registerCareerChoice("class-event2-branch", { classId: active.classId, choiceId: branchChoice.id, flag: branchChoice.flag || null });
    }
    assignDetectedClass(active.classId);
  }
  state.careerPathState.activeTimeAdvance = null;
  displayNarration(`✅ Desafio concluído.${branchChoice?.narration ? ` ${branchChoice.narration}` : ""}`);
  saveGameState();
  maybeCheckProgressionGates({ resolveEnding: false });
  return true;
}

function passCareerEventChallengeDay() {
  ensureCareerProgressState();
  const active = normalizeCareerEventTimeAdvance(state.careerPathState.activeTimeAdvance);
  if (!active || state.runState?.status === "ended") return false;
  active.remainingDays = Math.max(0, active.remainingDays - 1);
  state.careerPathState.activeTimeAdvance = active;
  if (active.remainingDays === 0) {
    completeCareerEventTimeAdvance(active);
    return false;
  }
  return true;
}

function assignDetectedClass(classId) {
  if (state.careerPathState.detectedClassId || !CLASSES[classId]) return false;
  state.careerPathState.detectedClassId = classId;
  state.careerPathState.classAssignedDay = state.currentDay;
  state.chosenClass = classId;
  const cls = CLASSES[classId];
  Object.entries(cls.bonus || {}).forEach(([stat, amount]) => {
    if (stat === "texto" || stat === "entrega") state[stat] = clamp((state[stat] || 0) + amount, 0, 200);
    else state[stat] = Math.max(0, (state[stat] || 0) + amount);
  });
  registerCareerChoice("class-auto-detected", { classId });
  queueCriticalDialog(`🎭 Seu caminho ficou claro: ${cls.name}.\n\n${cls.desc}`);
  checkEmploymentOffer();
  updateStats();
  return true;
}


function queueEmploymentOfferDialog(cls) {
  if (employmentOfferDialogPending) return true;
  employmentOfferDialogPending = true;
  queueCriticalDialog(`💼 Primeiro Convite Profissional!\n\nSeu caminho como ${cls.name} começou a ficar claro.\n\nConvite: ${cls.opportunityTitle}\n\nNão é fama.\nNão é contrato milionário.\nÉ o primeiro sinal de que alguém no circuito consegue imaginar você fazendo isso de verdade.`, [
    { label: "✅ Aceitar convite", handler: () => {
      employmentOfferDialogPending = false;
      state.careerPathState.employmentOfferPending = false;
      state.hasEmployment = true;
      registerCareerChoice("opportunity-accepted", { classId: state.chosenClass });
      playSound('victory');
      spawnConfetti(40);
      flashScreen('rgba(90, 143, 90, 0.3)');
      queueCriticalDialog(`🎉 Convite aceito!\n\n${V2_ENDINGS.base?.[state.chosenClass] || "Seu caminho profissional começou."}`);
      saveGameState();
      maybeCheckProgressionGates({ allowCareerEvents: false });
    }},
    { label: "Ainda não", handler: () => {
      employmentOfferDialogPending = false;
      state.careerPathState.employmentOfferPending = false;
      state.careerPathState.employmentDeclinedUntil = (state.currentDay || 1) + 7;
      saveGameState();
      maybeCheckProgressionGates({ allowCareerEvents: false });
    } }
  ]);
  return true;
}

function checkEmploymentOffer() {
  if (!state.chosenClass || state.hasEmployment) return false;
  ensureCareerProgressState();
  const cls = CLASSES[state.chosenClass];
  if (!cls || !cls.empReq) return false;
  if (state.careerPathState.employmentOfferPending) return queueEmploymentOfferDialog(cls);
  if ((state.currentDay || 1) < (state.careerPathState.employmentDeclinedUntil || 0)) return false;

  let meetsRequirements = true;
  for (const [stat, required] of Object.entries(cls.empReq)) {
    const current = state[stat] || 0;
    if (current < required) { meetsRequirements = false; break; }
  }

  if (meetsRequirements) {
    state.careerPathState.employmentOfferPending = true;
    saveGameState();
    return queueEmploymentOfferDialog(cls);
  }
  return false;
}

// §9  XP & LEVEL SYSTEM
// ═══════════════════════════════════════════════════════════════════

const XP_TOTAL_BY_LEVEL = [
  0,      // index 0 (unused)
  0,      // level 1
  150,    // level 2
  330,    // level 3
  540,    // level 4
  800,    // level 5
  1120,   // level 6
  1500,   // level 7
  1950,   // level 8
  2470,   // level 9
  3050,   // level 10
  3750,   // level 11
  4560,   // level 12
  5480,   // level 13
  6510,   // level 14
  7650,   // level 15
  8900,   // level 16
  10260,  // level 17
  11730,  // level 18
  13310,  // level 19
  15000   // level 20
];

const SHOW_XP_VALUES = {
  open: { consolidated: 40, newMaterial: 48 },
  fiveA5: { consolidated: 50, newMaterial: 60 },
  pague15: { consolidated: 60, newMaterial: 72 },
  elenco: { consolidated: 68, newMaterial: 82 },
  headliner: { consolidated: 84, newMaterial: 100 },
  specialTape: { consolidated: 120, newMaterial: 120 }
};

const XP_GAIN = {
  jokeNew: 12,
  jokeRewrite: 6,
  study: 15,
  content: 10
};

const HECKLER_EVENT_CHANCE = 0.15;

function getTotalXpForLevel(level) {
  if (level <= 1) return 0;
  if (level < XP_TOTAL_BY_LEVEL.length) return XP_TOTAL_BY_LEVEL[level];
  const lastLevel = XP_TOTAL_BY_LEVEL.length - 1;
  const lastTotal = XP_TOTAL_BY_LEVEL[lastLevel];
  const lastIncrement = XP_TOTAL_BY_LEVEL[lastLevel] - XP_TOTAL_BY_LEVEL[lastLevel - 1];
  const extraLevels = level - lastLevel;
  return lastTotal + extraLevels * (lastIncrement + 120 * (extraLevels - 1));
}

function getLevelFromXp(xp) {
  const safeXp = Math.max(0, Math.round(xp || 0));
  const lastTableLevel = Math.min(V2_PROGRESSION.maxLevel || 10, XP_TOTAL_BY_LEVEL.length - 1);
  for (let level = lastTableLevel; level >= 1; level -= 1) {
    if (safeXp >= XP_TOTAL_BY_LEVEL[level]) {
      let computedLevel = level;
      while (computedLevel < lastTableLevel && safeXp >= getTotalXpForLevel(computedLevel + 1)) computedLevel += 1;
      return computedLevel;
    }
  }
  return 1;
}

function getLevelTier(levelNumber) {
  if (levelNumber >= 6) return "elenco";
  return "open";
}

function getXpForNextLevel(levelNumber) {
  if (levelNumber >= (V2_PROGRESSION.maxLevel || 10)) return null;
  return getTotalXpForLevel(levelNumber + 1);
}

function applyXp(amount) {
  const gain = Math.max(0, Math.round(amount || 0));
  if (gain <= 0) return 0;
  state.xp = Math.max(0, Math.round((state.xp || 0) + gain));
  state.levelNumber = getLevelFromXp(state.xp);
  state.level = getLevelTier(state.levelNumber);
  maybeUnlockPolitico();
  return gain;
}

function maybeUnlockPolitico(show = null, nota = 0) {
  if (state.politicoUnlocked) return false;
  const config = V2_PROGRESSION.politico || {};
  const byLevel = (state.levelNumber || 1) >= (config.levelUnlock || 8);
  const byVenue = (state.currentDay || 1) >= (config.carvalhoMinDay || 25)
    && nota >= 4
    && show
    && getTypeAffinity(show, "político") >= 0.5;
  if (!byLevel && !byVenue) return false;
  state.politicoUnlocked = true;
  const dialog = byVenue ? V2_EVENTS.politicoUnlock : null;
  queueCriticalDialog(
    dialog ? `${dialog.title}\n\n${dialog.text}\n\n🔓 TOM POLÍTICO DESBLOQUEADO!` : "🗳️ Seu repertório ganhou ponto de vista.\n\n🔓 TOM POLÍTICO DESBLOQUEADO!",
    [],
    dialog ? { imageSrc: dialog.image, imageAlt: dialog.title, imageIsCharacter: true } : {}
  );
  return true;
}

function getLevelLabel(level, levelNumber) {
  const labels = { open: "Open", elenco: "Elenco", headliner: "Headliner" };
  const baseLabel = labels[level] || "Open";
  return levelNumber ? `${baseLabel} · Nv ${levelNumber}` : baseLabel;
}


// ═══════════════════════════════════════════════════════════════════
// §10  SCORING ENGINE
//
//   ⛔  PROTECTED — do not alter the formulas below.
//   These define the core game-feel for show outcomes.
// ═══════════════════════════════════════════════════════════════════

/**
 * Evaluate a set of jokes against a venue.
 * Returns { averageScore, breakdown[] } where each entry has { title, score }.
 */
function evaluateShow(setList, show, flowBonus = 0) {
  let totalScore = 0;
  const breakdown = [];
  const entrega = state.entrega || 0;
  const level = state.level || "open";

  // Chaos: rolled ONCE per gig, not per joke. Reduced at higher levels
  const luckBase = (level === "open") ? 0.10 : 0.05;
  const chaosRange = luckBase * (1 - entrega / 500);
  const chaosRoll = (Math.random() * 2 - 1) * chaosRange;

  // Delivery bonus capped to prevent exponential scaling
  const deliveryBonus = Math.min(entrega / 500, 0.4) + getPerkEffect('deliveryBonus');
  // Difficulty penalty: slower scaling with minimum floor (20% theoretical floor)
  // At entrega=0: full penalty (1.0 = 100%), at entrega=200 (max): 60% penalty remains
  const remainingDifficultyFactor = Math.max(0.2, 1 - entrega / 500);
  const hecklerDefense = getPerkEffect('hecklerDefense');
  const bigCrowdBonus = (show.minMinutes >= 6) ? getPerkEffect('bigCrowdBonus') : 0;
  const classBigRoomBonus = hasClassPassive("bigRoomDelivery") && ((show.minMinutes || 0) >= 7 || !!show.isElencoCircuit) ? 0.04 : 0;
  const longSetBonus = (setList.length >= 3) ? getPerkEffect('longSetBonus') : 0;
  const staminaBonus = getPerkEffect('staminaBonus');
  const crowdWorkBonus = getPerkEffect('crowdWorkBonus');
  setList.forEach((joke, idx) => {
    const potencyComponent = clamp(joke.truePotential || 0.4, 0, 1) * 0.6;
    const typeComponent = getTypeAffinity(show, joke.tone) * 0.2;
    const difficultyPenalty = (show.difficulty || 0) * remainingDifficultyFactor;
    const lateFatigue = (idx >= 3 && staminaBonus > 0) ? staminaBonus : 0;
    const jokeScore = potencyComponent + typeComponent + chaosRoll - difficultyPenalty + deliveryBonus + flowBonus + hecklerDefense + bigCrowdBonus + classBigRoomBonus + longSetBonus + lateFatigue + crowdWorkBonus;
    totalScore += jokeScore;
    breakdown.push({ title: joke.title, score: jokeScore });
  });
  return { averageScore: totalScore / setList.length, breakdown, chaosRoll, deliveryBonus };
}

function applyCrowdWorkToEvaluation(jokeEvaluation, baseEvaluation, crowdMinutes = 0) {
  const minutes = clamp(Math.round(crowdMinutes || 0), 0, 3);
  if (!minutes) return jokeEvaluation;
  const crowdScore = 0.18
    + (baseEvaluation.deliveryBonus || 0)
    + (baseEvaluation.chaosRoll || 0)
    + getPerkEffect("crowdWorkBonus");
  const jokeTotal = jokeEvaluation.breakdown.reduce((sum, entry) => sum + entry.score, 0);
  return {
    averageScore: (jokeTotal + crowdScore * minutes) / (jokeEvaluation.breakdown.length + minutes),
    breakdown: [
      ...jokeEvaluation.breakdown,
      { title: `Crowd work (${minutes} min)`, score: crowdScore, isCrowdWork: true, minutes }
    ]
  };
}

function getTypeAffinity(show, tone) {
  const map = show.typeAffinity || {};
  if (typeof map[tone] === "number") return clamp(map[tone], -1, 1);
  if (typeof map.default === "number") return clamp(map.default, -1, 1);
  return 0;
}

/**
 * Adjust score based on how actual stage time compares to expected time.
 * Returns { adjustment, note, ratio }.
 */
function evaluateStageTime(actualMinutes, expectedMinutes, baseScore) {
  const ratio = actualMinutes / expectedMinutes;
  let adjustment = 0;
  let note = "Tempo na medida, produtor sorriu pra você.";

  if (ratio < 0.5) {
    if (baseScore >= 0.35) {
      adjustment -= 0.15;
      note = "Você fez muito pouco tempo, mas o material era tão bom que compensou.";
    } else {
      adjustment -= 0.35;
      note = "Você entregou muito menos que o esperado E o material não foi bom. Péssima impressão.";
    }
  } else if (ratio < 0.7) {
    if (baseScore >= 0.35) {
      adjustment -= 0.05;
      note = "Você fez menos tempo, mas estava matando então tá perdoado.";
    } else {
      adjustment -= 0.25;
      note = "Pouco tempo e qualidade duvidosa. O produtor não gostou.";
    }
  } else if (ratio < 0.9) {
    if (baseScore >= 0.3) {
      adjustment += 0.02;
      note = "Você entregou um pouco menos, mas com qualidade. Deixa o público querendo mais.";
    } else {
      adjustment -= 0.12;
      note = "Você entregou menos tempo que o combinado.";
    }
  } else if (ratio > 2.0) {
    if (baseScore >= 0.35) {
      adjustment -= 0.1;
      note = "Você passou MUITO do tempo. Mesmo sendo bom, o produtor ficou puto.";
    } else {
      adjustment -= 0.4;
      note = "Material fraco E tempo estourado. Você foi cortado no microfone. Desastre total.";
    }
  } else if (ratio > 1.5) {
    if (baseScore >= 0.35) {
      adjustment += 0.05;
      note = "Você passou do tempo, mas a plateia te segurou no palco. O produtor relevou.";
    } else {
      adjustment -= 0.25;
      note = "Passou demais do tempo e o material não justificava. Constrangedor.";
    }
  } else if (ratio > 1.2) {
    if (baseScore >= 0.3) {
      adjustment += 0.12;
      note = "Você estourou, mas estava matando então valeu cada segundo extra.";
    } else {
      adjustment -= 0.15;
      note = "Você estourou alguns minutos e o clima ficou tenso.";
    }
  }

  return { adjustment, note, ratio };
}

function pickHecklerAffectedIndices(jokeCount) {
  const count = Math.max(1, Math.ceil(jokeCount / 2));
  const indices = Array.from({ length: jokeCount }, (_, idx) => idx);
  indices.sort(() => Math.random() - 0.5);
  return indices.slice(0, count);
}

function resolveHecklerResponse(affectedIndices) {
  const entrega = state.entrega || 0;
  const crowdWorkBonus = getPerkEffect('crowdWorkBonus');
  const hecklerDefense = getPerkEffect('hecklerDefense');
  const perkBoost = (crowdWorkBonus * 1.8) + (hecklerDefense * 1.4);
  const perkText = [];
  if (crowdWorkBonus > 0) perkText.push("seu crowd work ajudou a retomar a sala");
  if (hecklerDefense > 0) perkText.push("sua defesa contra heckler segurou a pressão");
  const perkSuffix = perkText.length ? ` ${perkText.join(" e ")}.` : "";
  const responsePower = (entrega / 55) + (Math.random() * 0.55) + perkBoost;
  if (responsePower >= 0.95) {
    return {
      type: "respondWin",
      affectedIndices,
      scoreDelta: 0.1,
      text: `Você respondeu firme, a sala comprou e o barulho virou energia a seu favor.${perkSuffix}`
    };
  }
  if (responsePower >= 0.55) {
    return {
      type: "respondHold",
      affectedIndices,
      scoreDelta: 0.02,
      text: `Você respondeu sem dominar totalmente a situação, mas conseguiu retomar a atenção da sala.${perkSuffix}`
    };
  }
  return {
    type: "respondFail",
    affectedIndices,
    scoreDelta: -0.16,
    text: perkText.length
      ? `Você tentou responder, mas nem com ajuda das vantagens o confronto encaixou. Metade do set sentiu o golpe.${perkSuffix}`
      : "Você tentou responder, mas o confronto te tirou do eixo e metade do set sentiu o golpe."
  };
}

function maybeInterruptShowWithHeckler(setList) {
  if (!currentShow || currentShow.hecklerChecked) return false;
  currentShow.hecklerChecked = true;
  if (!setList.length || Math.random() >= HECKLER_EVENT_CHANCE) {
    currentShow.hecklerOutcome = { type: "none", affectedIndices: [], scoreDelta: 0, text: "" };
    return false;
  }

  const affectedIndices = pickHecklerAffectedIndices(setList.length);
  queueCriticalDialog(
    "🗣️ Um heckler te interrompe no meio da preparação mental para subir. Você pode ignorar e seguir o set, ou responder na hora e tentar tomar a sala de volta.",
    [
      {
        label: "Ignorar",
        handler: () => {
          currentShow.hecklerOutcome = {
            type: "ignore",
            affectedIndices,
            scoreDelta: -0.12,
            text: "Você ignorou o heckler e seguiu. A interrupção contaminou metade do set antes da sala voltar para você."
          };
          performShow();
        }
      },
      {
        label: "Responder",
        handler: () => {
          currentShow.hecklerOutcome = resolveHecklerResponse(affectedIndices);
          performShow();
        }
      }
    ]
  );
  return true;
}

function applyHecklerOutcomeToEvaluation(evaluation, hecklerOutcome) {
  if (!hecklerOutcome || hecklerOutcome.type === "none" || !Array.isArray(hecklerOutcome.affectedIndices) || !hecklerOutcome.affectedIndices.length) {
    return evaluation;
  }

  const delta = hecklerOutcome.scoreDelta || 0;
  const affectedSet = new Set(hecklerOutcome.affectedIndices);
  let totalScore = 0;
  const breakdown = evaluation.breakdown.map((entry, idx) => {
    const nextScore = affectedSet.has(idx) ? entry.score + delta : entry.score;
    totalScore += nextScore;
    return { ...entry, score: nextScore };
  });

  return { averageScore: totalScore / breakdown.length, breakdown };
}

function classifyOutcome(score) {
  const tier = SCORE_EMOJI_SCALE.find(t => score >= t.threshold) || SCORE_EMOJI_SCALE[SCORE_EMOJI_SCALE.length - 1];
  return tier.nota;
}

function getOutcomeType(nota) {
  if (nota >= 4) return "kill";
  if (nota >= 3) return "ok";
  return "bomb";
}


// ═══════════════════════════════════════════════════════════════════
// §11  PROGRESSION & FLOW STATE
// ═══════════════════════════════════════════════════════════════════

function checkLevelProgression(nota, showType, prevLevelNumber) {
  const previousCareerStage = resolveCareerStage(null, prevLevelNumber);
  if (nota >= 4) {
    state.showsAtLevel4 = (state.showsAtLevel4 || 0) + 1;
    if (showType === "5a5") state.shows5a5AtLevel4 = (state.shows5a5AtLevel4 || 0) + 1;
  }
  state.levelNumber = getLevelFromXp(state.xp);
  state.level = getLevelTier(state.levelNumber);
  const currentCareerStage = getCareerStage();

  if (state.levelNumber > prevLevelNumber) {
    const levelsGained = state.levelNumber - prevLevelNumber;
    state.availablePerkPoints = (state.availablePerkPoints || 0) + levelsGained;
    showPerkSelectionDialog();

    if (previousCareerStage === "open" && currentCareerStage === "elenco") {
      maybeTriggerCarvalhoDialog("enterElenco", { previousCareerStage, currentCareerStage });
    }

    maybeCheckProgressionGates({ resolveEnding: false });
  }
}

function checkFlowState(nota) {
  if (nota >= 4) {
    state.consecutiveGoodShows = (state.consecutiveGoodShows || 0) + 1;
  } else {
    state.consecutiveGoodShows = 0;
  }

  // Activate after 3 consecutive nota 4+ shows with texto >= 30 && entrega >= 30
  if (!state.flowState?.active && state.consecutiveGoodShows >= 3 && state.texto >= 30 && state.entrega >= 30) {
    state.flowState = { active: true, daysRemaining: 12, endChance: 0.2 };
    spawnConfetti(60);
    flashScreen('rgba(255, 100, 0, 0.4)');
    showDialog("🔥 ESTADO DE FLOW ATIVADO!\n\nVocê está em sintonia total. Cada tempo de palco conta como 2x, suas piadas ganham boost na escrita e performance. Aproveite enquanto dura!");
    document.body.classList.add('flow-active');
  }
}

function processFlowState() {
  if (!state.flowState?.active) return;
  state.flowState.daysRemaining -= 1;
  state.flowState.endChance = Math.min(1, (state.flowState.endChance || 0.2) + 0.066);

  if (Math.random() < state.flowState.endChance || state.flowState.daysRemaining <= 0) {
    state.flowState = null;
    state.consecutiveGoodShows = 0;
    document.body.classList.remove('flow-active');
    flashScreen('rgba(100, 100, 100, 0.3)');
    showDialog("😔 O estado de flow acabou. O momento mágico passou, mas o aprendizado fica.");
  }
}


// ═══════════════════════════════════════════════════════════════════
// §12  TIME & DAY SYSTEM
// ═══════════════════════════════════════════════════════════════════

function handleEndDay() {
  if (uiMode === "event" || uiMode === "showSelection") return;

  // Warn if show is scheduled today
  const todayShows = getScheduledShowsForToday();
  if (todayShows.length > 0) {
    const entry = todayShows[0];
    const showName = findShowById(entry.showId)?.name || 'Show';
    showDialog(`⚠️ Você tem um show marcado para hoje (${showName})! Vá para o show ou cancele antes de encerrar o dia.`, [
      { label: "Ir para o Show", handler: () => { hideDialog(); handleGoToScheduledShow(); } },
      { label: "Cancelar Show", handler: () => {
        removeScheduledShow(entry);
        hideDialog();
        displayNarration("❌ Show cancelado. Sua reputação pode sofrer...");
        state.network = Math.max(0, (state.network || 10) - 5);
        updateStats();
        saveGameState();
      }},
      { label: "Voltar", handler: hideDialog }
    ]);
    return;
  }

  advanceDay();
}


function advanceDay() {
  advanceDays(1, { source: "manual", recoverMotivation: 5, allowEvents: true, narration: true });
}

function advanceDays(count, options = {}) {
  const total = Math.max(0, Math.round(count || 0));
  const recoverMotivation = Number.isFinite(options.recoverMotivation) ? options.recoverMotivation : 5;
  let advanced = 0;
  for (let index = 0; index < total; index += 1) {
    if (state.runState?.status === "ended") break;
    state.currentDay += 1;
    advanced += 1;
    state.performedShowToday = false;
    state.currentWeekDay = (state.currentWeekDay + 1) % 7;
    const challengeStillActive = passCareerEventChallengeDay();
    state.activityPoints = options.grantActivityPoints === false || challengeStillActive ? 0 : getMaxActivityPoints();
    state.scheduledShows = (state.scheduledShows || []).filter(entry => entry.dayScheduled >= state.currentDay);
    if (state.currentWeekDay === 1) {
      state.currentWeek = (state.currentWeek || 1) + 1;
      state.eventsThisWeek = 0;
      state.weeklyStudyCount = 0;
      ensureCareerProgressState();
      state.elencoCircuitState.weeklyGoalProgress = 0;
      state.elencoCircuitState.completedWeek = null;
    }
    if (recoverMotivation) state.motivation = clamp(state.motivation + recoverMotivation, 0, 120);
    processFlowState();
    if (typeof maybeCheckProgressionGates === "function" && maybeCheckProgressionGates({ allowCareerEvents: false })) break;
  }

  updateStats();
  setScene("home");
  if (options.narration !== false && advanced > 0 && state.runState?.status !== "ended") {
    const prefix = advanced > 1 ? `⏩ ${advanced} dias passaram.` : `🌅 Novo dia: ${DAYS_OF_WEEK[state.currentWeekDay]}, Dia ${state.currentDay}.`;
    const activityMessage = state.activityPoints > 0
      ? `Você tem ${state.activityPoints} ponto(s) de atividade.`
      : "O desafio ocupa este dia: sem pontos de atividade, mas shows e ações sem custo continuam disponíveis.";
    displayNarration(`${prefix} ${activityMessage}`);
  }
  if (state.runState?.status !== "ended") {
    refreshRouteInviteAvailability("newDay");
    if (options.allowEvents && advanced === 1) {
      const hasHadFirstShow = (state.showHistory || []).length > 0;
      if (hasHadFirstShow && (state.eventsThisWeek || 0) < 2 && Math.random() < 0.1) {
        maybeTriggerEvent("random", { source: "newDay" });
      }
      if (state.motivation <= 25) maybeTriggerCarvalhoDialog("lowMotivation", { source: "newDay" });
    }
    if (options.allowCareerEvents !== false && typeof maybeCheckProgressionGates === "function") maybeCheckProgressionGates({ resolveEnding: false });
  }
  saveGameState();
  return advanced;
}


// ═══════════════════════════════════════════════════════════════════
// §13  EVENT ENGINE
// ═══════════════════════════════════════════════════════════════════

function maybeTriggerEvent(trigger, context = {}) {
  if (activeEvent || pendingEvent || !trigger || typeof trigger !== "string") return;
  if (!state || !Array.isArray(eventPool)) return;

  // No events until first show
  if (!state.showHistory || state.showHistory.length === 0) return;

  // Weekly cap for random events
  if (trigger === "random" && (state.eventsThisWeek || 0) >= 2) return;

  const candidates = eventPool.filter((event) => event && eventMatchesTrigger(event, trigger, context));
  if (!candidates.length) return;

  const event = candidates[Math.floor(Math.random() * candidates.length)];
  if (!event || !event.text) return;

  if (trigger === "random") state.eventsThisWeek = (state.eventsThisWeek || 0) + 1;

  // newDay events show immediately; others are queued to avoid conflicting with show outcomes
  if (context.source === "newDay") {
    showEvent(event);
  } else {
    pendingEvent = event;
  }
}

function eventMatchesTrigger(event, trigger, context = {}) {
  if (!event || !event.trigger || !trigger) return false;
  ensureCareerProgressState();
  if (event.once && state.eventRuntime.seenIds.includes(event.id)) return false;
  const cooldownUntil = state.eventRuntime.cooldownUntilById[event.id] || 0;
  if ((state.currentDay || 1) < cooldownUntil) return false;
  if (event.trigger !== trigger) return false;
  if (!contentGates.eventEligible(event)) return false;

  // Only at Copo Sujo shows
  if (event.requiresCopoSujo && context.show) {
    if (context.show.id !== "5a5" && context.show.id !== "pague15") return false;
  }

  // Needs 3+ shows at nota 4+
  if (event.requiresGoodPerformance) {
    if ((state.showHistory || []).filter(s => s.nota >= 4).length < 3) return false;
  }
  if (event.requiredFans && (state.fans || 0) < event.requiredFans) return false;
  if (event.requiredNetwork && (state.network || 0) < event.requiredNetwork) return false;

  switch (event.trigger) {
    case "showKill":   return true;
    case "showBomb":   return (context.adjustedScore ?? context.averageScore ?? context.score ?? 0) <= -0.05;
    case "fans20":     return state.fans >= 20;
    case "fans30":     return state.fans >= 30;
    case "fans50":     return state.fans >= 50;
    case "jokes5":     return false;
    case "pague15Invite": return false;
    case "random":     return Math.random() < 0.25;
    default:           return false;
  }
}

function showPendingEvent() {
  if (!pendingEvent || activeEvent) return;
  const event = pendingEvent;
  pendingEvent = null;
  activeEvent = event;
  uiMode = "event";

  if (event.isCharacterEvent && event.image) {
    setScene("event", "", event.image, true);
  } else if (event.image) {
    setScene("event", "", event.image, false);
  } else {
    setScene("home");
  }

  if (event.isGoodEvent) playSound('findSomething');

  const actions = (event.choices || []).map((choice, index) => ({
    label: choice.label, handler: () => handleEventChoiceIndex(index)
  }));
  queueCriticalDialog(event.text, actions, {
    imageSrc: event.image || "",
    imageAlt: event.id ? `Evento: ${event.id}` : "Evento",
    imageIsCharacter: !!event.isCharacterEvent
  });
}

function showEvent(event) {
  if (activeEvent) return;
  activeEvent = event;
  uiMode = "event";

  if (event.isCharacterEvent && event.image) setScene("event", "", event.image, true);
  if (event.isGoodEvent) playSound('findSomething');

  const actions = (event.choices || []).map((choice, index) => ({
    label: choice.label, handler: () => handleEventChoiceIndex(index)
  }));
  queueCriticalDialog(event.text, actions, {
    imageSrc: event.image || "",
    imageAlt: event.id ? `Evento: ${event.id}` : "Evento",
    imageIsCharacter: !!event.isCharacterEvent
  });
}

function handleEventChoiceIndex(index) {
  if (!activeEvent) { hideDialog(); return; }

  const eventRef = activeEvent;
  const choice = eventRef.choices && eventRef.choices[index];
  if (!choice) { hideDialog(); activeEvent = null; uiMode = "idle"; return; }
  const createsGig = !!choice.startShowId || !!choice.scheduleShow;
  if (createsGig && !canAddScheduledShow({ allowOverflow: true })) {
    hideDialog();
    activeEvent = null;
    uiMode = "idle";
    setScene("home");
    queueCriticalDialog("📅 Você já tem 4 shows marcados. Esse convite não pode entrar sem substituir uma data — então ele não foi aceito.", [], {
      imageSrc: eventRef.image || "",
      imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
      imageIsCharacter: !!eventRef.isCharacterEvent
    });
    return;
  }
  const isRouteInvite = isRouteInviteEvent(eventRef);
  const routeInviteAccepted = isRouteInvite ? (choice.unlock5a5 || choice.unlockSeViraNos5 || choice.unlockPague15 || choice.unlockBlackHouseElenco || choice.startShowId || choice.scheduleShow) : false;
  ensureCareerProgressState();
  if (eventRef.once && !isRouteInvite && !state.eventsSeen.includes(eventRef.id)) {
    state.eventsSeen.push(eventRef.id);
    state.eventRuntime.seenIds.push(eventRef.id);
  }
  if (isRouteInvite) {
    ensureCareerProgressState();
    const inviteState = state.routeInviteState[eventRef.id];
    if (inviteState) {
      inviteState.pending = !routeInviteAccepted;
      if (choice.delayRouteInviteDays) {
        inviteState.nextOfferDay = (state.currentDay || 1) + Math.max(1, Math.round(choice.delayRouteInviteDays));
      }
    }
    if (routeInviteAccepted && !state.eventsSeen.includes(eventRef.id)) {
      state.eventsSeen.push(eventRef.id);
      state.eventRuntime.seenIds.push(eventRef.id);
    }
  }
  if (eventRef.cooldown) state.eventRuntime.cooldownUntilById[eventRef.id] = (state.currentDay || 1) + eventRef.cooldown;

  const hasStartShow = !!choice.startShowId;
  const hasScheduleShow = !!choice.scheduleShow;
  const hasNarration = !!choice.narration;

  hideDialog();
  activeEvent = null;
  uiMode = "idle";
  setScene("home");

  const effectsSummary = formatEffectsSummary(choice.effects || {});
  applyEventEffects(choice.effects || {});
  if (choice.unlock5a5) state.fiveA5Unlocked = true;
  if (choice.unlockSeViraNos5) state.seViraNos5Unlocked = true;
  if (choice.unlockPague15) state.pague15Unlocked = true;
  if (choice.unlockBlackHouseElenco) state.blackHouseElencoUnlocked = true;
  updateStats();
  saveGameState();

  // ─── Start-show choice: schedule and narrate ───
  if (hasStartShow) {
    const show = findShowById(choice.startShowId);
    if (show) {
      const daysAhead = Math.random() < 0.5 ? 1 : 2;
      const scheduled = addScheduledShow(show.id, state.currentDay + daysAhead, "event", { allowOverflow: true });
      updateStats();
      saveGameState();
      if (!scheduled) {
        queueCriticalDialog("📅 Sua agenda já está cheia. Resolva um show marcado antes de aceitar outro convite.", [], {
          imageSrc: eventRef.image || "",
          imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
          imageIsCharacter: !!eventRef.isCharacterEvent
        });
        checkEmploymentOffer();
        return;
      }
      queueCriticalDialog(`${choice.narration || "Convite aceito!"}${effectsSummary}\n\n📅 Show marcado para ${getDayName(state.currentDay + daysAhead)} (${daysAhead} dia(s)).`, [], {
        imageSrc: eventRef.image || "",
        imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
        imageIsCharacter: !!eventRef.isCharacterEvent
      });
      checkEmploymentOffer();
    }
    return;
  }

  // ─── Schedule-show choice (5a5 / pague15) ───
  if (hasScheduleShow) {
    const show = findShowById(choice.scheduleShow);
    if (show) {
      let daysAhead = 1;
      let showType = choice.showType || "normal";
      if (Number.isFinite(choice.scheduleDelayDays)) daysAhead = Math.max(1, Math.round(choice.scheduleDelayDays));
      if (choice.scheduleShow === "5a5") { daysAhead = findDaysToWeekday(0) || 7; showType = "5a5"; }
      else if (choice.scheduleShow === "pague15") { daysAhead = findDaysToWeekday(4) || 7; showType = "pague15"; }
      const scheduled = addScheduledShow(show.id, state.currentDay + daysAhead, showType, { allowOverflow: true });
      updateStats();
      saveGameState();
      if (!scheduled) {
        queueCriticalDialog("📅 Sua agenda já está cheia. Resolva um show marcado antes de aceitar outro convite.", [], {
          imageSrc: eventRef.image || "",
          imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
          imageIsCharacter: !!eventRef.isCharacterEvent
        });
        checkEmploymentOffer();
        return;
      }
      queueCriticalDialog(`${choice.narration || "Show agendado!"}${effectsSummary}\n\n📅 ${show.name} marcado para ${getDayName(state.currentDay + daysAhead)} (${daysAhead} dia(s)).`, [], {
        imageSrc: eventRef.image || "",
        imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
        imageIsCharacter: !!eventRef.isCharacterEvent
      });
      checkEmploymentOffer();
    }
    return;
  }

  if (hasNarration) {
    queueCriticalDialog(`${choice.narration}${effectsSummary}`, [], {
      imageSrc: eventRef.image || "",
      imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
      imageIsCharacter: !!eventRef.isCharacterEvent
    });
  }
  checkEmploymentOffer();
}

function applyEventEffects(effects) {
  if (!effects) return;
  if (effects.fans) state.fans = Math.max(0, state.fans + effects.fans);
  if (effects.motivation) state.motivation = clamp(state.motivation + effects.motivation, 0, 150);
  if (effects.texto) state.texto = clamp(state.texto + effects.texto, 0, 200);
  if (effects.entrega) state.entrega = clamp(state.entrega + effects.entrega, 0, 200);
  if (effects.stageTime) state.stageTime = Math.max(0, state.stageTime + effects.stageTime);
  if (effects.network) state.network = Math.max(0, (state.network || 10) + effects.network);
  if (effects.storytellingUnlocked) state.storytellingUnlocked = true;
  if (effects.fans) checkFanMilestones();
}


// ═══════════════════════════════════════════════════════════════════
// §14  PERSISTENCE (save / load)
// ═══════════════════════════════════════════════════════════════════

function loadGameState() {
  const baseState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    name: "Red", stageTime: 0, jokes: [], language: "pt",
    theme: "classic",
    avatar: null, hasStarted: false, fans: 0, motivation: 60, texto: 10, entrega: 5,
    eventsSeen: [], lastSave: null, xp: 0, levelNumber: 1,
    ...createInitialTimeState(),
    level: "open", showsAtLevel4: 0, shows5a5AtLevel4: 0,
    fiveA5Unlocked: false, seViraNos5Unlocked: false, blackHouseElencoUnlocked: false, pague15Unlocked: false, network: 10,
    storytellingUnlocked: false,
    onelinerUnlocked: false,
    humorNegroUnlocked: false,
    hackUnlocked: false,
    propUnlocked: false,
    politicoUnlocked: false,
    writingGuideUnlocked: false,
    crowdWorkUnlocked: false,
    weeklyStudyCount: 0,
    toneTally: createDefaultToneTally(),
    structureTally: createDefaultStructureTally(),
    chosenClass: null, hasEmployment: false,
    unlockedPerks: [], availablePerkPoints: 0,
    careerMilestones: createDefaultCareerMilestones(),
    routeCounters: createDefaultRouteCounters(),
    routeInviteState: createDefaultRouteInviteState(),
    runState: createDefaultRunState(),
    careerPathState: createDefaultCareerPathState(),
    pathProgressState: createDefaultPathProgressState(),
    eventRuntime: createDefaultEventRuntime(),
    careerChoices: [],
    carvalhoDialogState: { shownIds: [], triggerCooldowns: {} },
    elencoCircuitState: { weeklyGoalTarget: 2, weeklyGoalProgress: 0, completedWeek: null, weeklySuccessStreak: 0, bestWeeklyStreak: 0 },
    openStageState: { consistencyStreak: 0, breakthroughs: 0 },
    venueReputation: {}
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const bonuses = computeLegacyBonuses();
      if (bonuses.oneliner) baseState.onelinerUnlocked = true;
      if (bonuses.humorNegro) baseState.humorNegroUnlocked = true;
      if (bonuses.storytelling) baseState.storytellingUnlocked = true;
      if (bonuses.hack) baseState.hackUnlocked = true;
      if (bonuses.prop) baseState.propUnlocked = true;
      if (bonuses.politico) baseState.politicoUnlocked = true;
      if (bonuses.writingGuide) baseState.writingGuideUnlocked = true;
      if (bonuses.crowdWork) baseState.crowdWorkUnlocked = true;
      return baseState;
    }
    const bonuses = computeLegacyBonuses();
    const parsed = JSON.parse(raw);
    const legacyLevelNumber = parsed.level === "headliner" ? 11 : parsed.level === "elenco" ? 6 : 1;
    const resolvedLevelNumber = (typeof parsed.levelNumber === "number" && parsed.levelNumber > 0) ? parsed.levelNumber : legacyLevelNumber;
    const resolvedXp = (typeof parsed.xp === "number" && parsed.xp >= 0) ? parsed.xp : getTotalXpForLevel(resolvedLevelNumber);
    return {
      ...baseState,
      name: parsed.name || baseState.name,
      stageTime: parsed.stageTime ?? baseState.stageTime,
      jokes: Array.isArray(parsed.jokes) && parsed.jokes.length ? cloneJokes(parsed.jokes) : [],
      language: parsed.language || baseState.language,
      theme: parsed.theme || baseState.theme,
      avatar: parsed.avatar || baseState.avatar,
      hasStarted: parsed.hasStarted ?? baseState.hasStarted,
      fans: parsed.fans ?? baseState.fans,
      motivation: parsed.motivation ?? baseState.motivation,
      texto: parsed.texto ?? parsed.theory ?? baseState.texto,
      entrega: parsed.entrega ?? baseState.entrega,
      eventsSeen: Array.isArray(parsed.eventsSeen) ? parsed.eventsSeen : [],
      lastSave: parsed.lastSave || baseState.lastSave,
      xp: resolvedXp,
      levelNumber: resolvedLevelNumber,
      currentDay: parsed.currentDay ?? baseState.currentDay,
      currentWeekDay: parsed.currentWeekDay ?? baseState.currentWeekDay,
      currentWeek: parsed.currentWeek ?? baseState.currentWeek,
      activityPoints: parsed.activityPoints ?? baseState.activityPoints,
      scheduledShows: Array.isArray(parsed.scheduledShows) ? parsed.scheduledShows : (parsed.scheduledShow ? [parsed.scheduledShow] : []),
      performedShowToday: parsed.performedShowToday ?? false,
      showHistory: Array.isArray(parsed.showHistory) ? parsed.showHistory : [],
      consecutiveGoodShows: parsed.consecutiveGoodShows ?? 0,
      flowState: parsed.flowState || null,
      eventsThisWeek: parsed.eventsThisWeek ?? 0,
      storytellingUnlocked: !!parsed.storytellingUnlocked || bonuses.storytelling,
      onelinerUnlocked: !!parsed.onelinerUnlocked || bonuses.oneliner,
      humorNegroUnlocked: !!parsed.humorNegroUnlocked || bonuses.humorNegro,
      hackUnlocked: !!parsed.hackUnlocked || bonuses.hack,
      propUnlocked: !!parsed.propUnlocked || bonuses.prop,
      politicoUnlocked: !!parsed.politicoUnlocked || bonuses.politico,
      writingGuideUnlocked: !!parsed.writingGuideUnlocked || bonuses.writingGuide,
      crowdWorkUnlocked: !!parsed.crowdWorkUnlocked || bonuses.crowdWork,
      weeklyStudyCount: Math.max(0, parsed.weeklyStudyCount || 0),
      toneTally: normalizeToneTally(parsed.toneTally),
      structureTally: normalizeStructureTally(parsed.structureTally),
      level: getLevelTier(resolvedLevelNumber),
      showsAtLevel4: parsed.showsAtLevel4 ?? 0,
      shows5a5AtLevel4: parsed.shows5a5AtLevel4 ?? 0,
      fiveA5Unlocked: parsed.fiveA5Unlocked ?? false,
      seViraNos5Unlocked: parsed.seViraNos5Unlocked ?? false,
      blackHouseElencoUnlocked: parsed.blackHouseElencoUnlocked ?? false,
      pague15Unlocked: parsed.pague15Unlocked ?? false,
      network: parsed.network ?? baseState.network,
      chosenClass: parsed.chosenClass === "professor" ? "comicoClassico" : (parsed.chosenClass || null),
      hasEmployment: parsed.hasEmployment ?? false,
      unlockedPerks: Array.isArray(parsed.unlockedPerks) ? parsed.unlockedPerks : [],
      availablePerkPoints: parsed.availablePerkPoints ?? 0,
      careerMilestones: { ...createDefaultCareerMilestones(), ...(parsed.careerMilestones || {}) },
      routeCounters: normalizeRouteCounters(parsed.routeCounters),
      routeInviteState: normalizeRouteInviteState(parsed.routeInviteState),
      runState: createDefaultRunState(parsed.runState),
      careerPathState: seedCareerPathCountersFromHistory(createDefaultCareerPathState(parsed.careerPathState), parsed.showHistory),
      pathProgressState: createDefaultPathProgressState(parsed.pathProgressState),
      eventRuntime: createDefaultEventRuntime(parsed.eventRuntime),
      careerChoices: Array.isArray(parsed.careerChoices) ? parsed.careerChoices : [],
      carvalhoDialogState: {
        shownIds: Array.isArray(parsed.carvalhoDialogState?.shownIds) ? parsed.carvalhoDialogState.shownIds : [],
        triggerCooldowns: parsed.carvalhoDialogState?.triggerCooldowns || {}
      },
      elencoCircuitState: {
        weeklyGoalTarget: Math.max(2, parsed.elencoCircuitState?.weeklyGoalTarget || 2),
        weeklyGoalProgress: Math.max(0, parsed.elencoCircuitState?.weeklyGoalProgress || 0),
        completedWeek: parsed.elencoCircuitState?.completedWeek || null,
        weeklySuccessStreak: Math.max(0, parsed.elencoCircuitState?.weeklySuccessStreak || 0),
        bestWeeklyStreak: Math.max(0, parsed.elencoCircuitState?.bestWeeklyStreak || 0)
      },
      openStageState: {
        consistencyStreak: Math.max(0, parsed.openStageState?.consistencyStreak || 0),
        breakthroughs: Math.max(0, parsed.openStageState?.breakthroughs || 0)
      },
      venueReputation: normalizeVenueReputationMap(parsed.venueReputation)
    };
  } catch (error) {
    console.warn("Falha ao carregar save, iniciando novo jogo.", error);
    return baseState;
  }
}

function saveGameState() {
  ensureCareerProgressState();
  const payload = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    name: state.name, stageTime: state.stageTime, jokes: state.jokes,
    language: state.language, theme: state.theme || "classic", avatar: state.avatar, hasStarted: state.hasStarted,
    fans: state.fans, motivation: state.motivation, texto: state.texto, entrega: state.entrega,
    eventsSeen: state.eventsSeen, xp: state.xp, levelNumber: state.levelNumber,
    currentDay: state.currentDay, currentWeekDay: state.currentWeekDay,
    currentWeek: state.currentWeek, activityPoints: state.activityPoints,
    scheduledShows: state.scheduledShows, performedShowToday: state.performedShowToday,
    showHistory: state.showHistory,
    consecutiveGoodShows: state.consecutiveGoodShows, flowState: state.flowState,
    eventsThisWeek: state.eventsThisWeek,
    level: state.level, showsAtLevel4: state.showsAtLevel4,
    shows5a5AtLevel4: state.shows5a5AtLevel4, fiveA5Unlocked: state.fiveA5Unlocked,
    seViraNos5Unlocked: state.seViraNos5Unlocked, blackHouseElencoUnlocked: state.blackHouseElencoUnlocked,
    pague15Unlocked: state.pague15Unlocked, network: state.network, storytellingUnlocked: state.storytellingUnlocked,
    onelinerUnlocked: state.onelinerUnlocked, humorNegroUnlocked: state.humorNegroUnlocked,
    hackUnlocked: state.hackUnlocked, propUnlocked: state.propUnlocked,
    politicoUnlocked: state.politicoUnlocked,
    writingGuideUnlocked: state.writingGuideUnlocked,
    crowdWorkUnlocked: state.crowdWorkUnlocked,
    weeklyStudyCount: state.weeklyStudyCount,
    toneTally: state.toneTally,
    structureTally: state.structureTally,
    chosenClass: state.chosenClass, hasEmployment: state.hasEmployment,
    unlockedPerks: state.unlockedPerks, availablePerkPoints: state.availablePerkPoints,
    careerMilestones: state.careerMilestones, routeCounters: state.routeCounters,
    routeInviteState: state.routeInviteState,
    runState: state.runState, careerPathState: state.careerPathState,
    pathProgressState: state.pathProgressState,
    eventRuntime: state.eventRuntime,
    careerChoices: state.careerChoices,
    carvalhoDialogState: state.carvalhoDialogState,
    elencoCircuitState: state.elencoCircuitState,
    openStageState: state.openStageState,
    venueReputation: state.venueReputation,
    lastSave: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  state.lastSave = payload.lastSave;
}


// ═══════════════════════════════════════════════════════════════════
// §15  UI: DOM CACHE
// ═══════════════════════════════════════════════════════════════════

const elements = {};
const THEME_PRESETS = {
  classic: { label: "🎭 Clássico (Jazz Club)", bodyClass: "theme-classic" },
  crystal: { label: "💎 Crystal Blue", bodyClass: "theme-crystal" },
  forest: { label: "🌿 Forest Quest", bodyClass: "theme-forest" }
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyTheme(themeId) {
  const validThemeId = THEME_PRESETS[themeId] ? themeId : "classic";
  document.body.classList.remove("theme-classic", "theme-crystal", "theme-forest");
  document.body.classList.add(THEME_PRESETS[validThemeId].bodyClass);
  state.theme = validThemeId;
}

function cacheElements() {
  elements.text = document.querySelector("#text");
  elements.title = document.querySelector("#title");
  elements.subTitle = document.querySelector("#subTitle");
  elements.image = document.querySelector("#locationImg");
  elements.jokeList = document.querySelector("#jokeList");
  elements.legend = document.querySelector("#legend");
  elements.mainPanel = document.querySelector("#blackScreen");
  elements.btnDivLow = document.querySelector("#btnDivLow");
  elements.btnContinuar = document.querySelector("#btnContinuar");
  elements.introScreen = document.querySelector("#introScreen");
  elements.introText = document.querySelector("#introText");
  elements.introContinue = document.querySelector("#introContinue");
  elements.avatarSelection = document.querySelector("#avatarSelection");
  elements.avatarOptions = document.querySelectorAll(".avatar-option");
  elements.screen = document.querySelector("#screen1");
  elements.avatarImg = document.querySelector("#avatar");
  elements.dialogBox = document.querySelector("#dialogBox");
  elements.dialogText = document.querySelector("#dialogText");
  elements.dialogActions = document.querySelector("#dialogActions");
  elements.dialogClose = document.querySelector("#dialogClose");
  elements.mainTitle = document.querySelector("h1");
  elements.btnEndDay = document.querySelector("#btnEndDay");
  elements.btnGoToShow = document.querySelector("#btnGoToShow");
  elements.scheduledShowInfo = document.querySelector("#scheduledShowInfo");
  elements.scheduledShowText = document.querySelector("#scheduledShowText");
  elements.flowIndicator = document.querySelector("#flowIndicator");
  elements.nameInput = document.querySelector("#nameInput");
  elements.playerNameInput = document.querySelector("#playerNameInput");
  elements.confirmNameBtn = document.querySelector("#confirmNameBtn");
  elements.buttons = {
    write: document.querySelector("#button1"),
    show: document.querySelector("#button2"),
    material: document.querySelector("#button3"),
    save: document.querySelector("#button4"),
    content: document.querySelector("#button5"),
    study: document.querySelector("#button6"),
    history: document.querySelector("#button7"),
    credits: document.querySelector("#button8"),
    newGame: document.querySelector("#button9"),
    settings: document.querySelector("#button10")
  };
  elements.stats = {
    name: document.querySelector("#nameText"),
    level: document.querySelector("#levelText"),
    material: document.querySelector("#xpText"),
    stage: document.querySelector("#stageText"),
    fans: document.querySelector("#fansText"),
    network: document.querySelector("#networkText"),
    motivation: document.querySelector("#motivationText"),
    texto: document.querySelector("#textoText"),
    entrega: document.querySelector("#entregaText"),
    study: document.querySelector("#studyText"),
    day: document.querySelector("#dayText"),
    points: document.querySelector("#pointsText"),
    flow: document.querySelector("#flowText")
  };
  elements.profile = {
    title: document.querySelector("#profileTitleText"),
    badges: document.querySelector("#profileBadges")
  };
  elements.ending = {
    screen: document.querySelector("#endingScreen"),
    art: document.querySelector("#endingArt"),
    eyebrow: document.querySelector("#endingEyebrow"),
    title: document.querySelector("#endingTitle"),
    prose: document.querySelector("#endingProse"),
    summary: document.querySelector("#endingSummary"),
    unlocks: document.querySelector("#endingUnlocks"),
    newRun: document.querySelector("#endingNewRunBtn"),
    archive: document.querySelector("#endingArchiveBtn")
  };
}


// ═══════════════════════════════════════════════════════════════════
// §16  UI: DIALOGS
// ═══════════════════════════════════════════════════════════════════

function showDialog(message, actions = []) {
  if (!elements.dialogBox || !elements.dialogText) { console.warn("Dialog elements not found"); return; }
  hideDialog();
  if (dialogTimeout) { clearTimeout(dialogTimeout); dialogTimeout = null; }

  playSound('menu');
  elements.dialogText.textContent = message || "";
  elements.dialogActions.innerHTML = "";

  if (actions && actions.length > 0) {
    if (elements.dialogClose) elements.dialogClose.classList.add("hidden");
    actions.forEach((action, index) => {
      if (!action || !action.label) return;
      const btn = document.createElement("button");
      btn.textContent = action.label;
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(10px)';
      btn.addEventListener("click", (e) => {
        createRipple(e, btn);
        e.preventDefault(); e.stopPropagation();
        if (action.handler && typeof action.handler === "function") setTimeout(() => action.handler(), 150);
      });
      elements.dialogActions.appendChild(btn);
      setTimeout(() => { btn.style.transition = 'all 0.3s ease'; btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }, 100 + index * 80);
    });
  } else {
    if (elements.dialogClose) elements.dialogClose.classList.remove("hidden");
  }

  elements.dialogBox.style.opacity = '0';
  elements.dialogBox.style.transform = 'scale(0.9) translateY(20px)';
  elements.dialogBox.classList.remove("hidden");
  setTimeout(() => { elements.dialogBox.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'; elements.dialogBox.style.opacity = '1'; elements.dialogBox.style.transform = 'scale(1) translateY(0)'; }, 10);
  setTimeout(() => { elements.dialogBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
}

function hideDialog() {
  if (!elements.dialogBox) return;
  if (dialogTimeout) { clearTimeout(dialogTimeout); dialogTimeout = null; }

  elements.dialogBox.style.transition = 'all 0.25s ease';
  elements.dialogBox.style.opacity = '0';
  elements.dialogBox.style.transform = 'scale(0.95) translateY(-10px)';

  dialogTimeout = setTimeout(() => {
    elements.dialogBox.classList.add("hidden");
    elements.dialogBox.style.opacity = '';
    elements.dialogBox.style.transform = '';
    if (elements.dialogActions) elements.dialogActions.innerHTML = "";
    if (elements.dialogClose) elements.dialogClose.classList.remove("hidden");
    if (uiMode === "event" && !activeEvent) uiMode = "idle";
    dialogTimeout = null;
  }, 250);
}


// ─── Critical Dialog Queue (never conflicts, shown sequentially) ───

function queueCriticalDialog(message, actions = [], options = {}) {
  if (suspendCriticalDialogs) {
    deferredCriticalDialogs.push({ message, actions, options });
    return;
  }
  criticalDialogQueue.push({ message, actions, options });
  if (criticalDialogQueue.length === 1) showNextCriticalDialog();
}

function flushDeferredCriticalDialogs() {
  if (!deferredCriticalDialogs.length) return;
  const shouldShowImmediately = criticalDialogQueue.length === 0;
  criticalDialogQueue.push(...deferredCriticalDialogs.splice(0));
  if (shouldShowImmediately) {
    setTimeout(() => {
      if (criticalDialogQueue.length > 0) showNextCriticalDialog();
    }, 250);
  }
}

function showNextCriticalDialog() {
  if (!criticalDialogQueue.length) return;
  const { message, actions, options } = criticalDialogQueue[0];

  const overlay = document.getElementById('criticalOverlay');
  const textEl = document.getElementById('criticalDialogText');
  const actionsEl = document.getElementById('criticalDialogActions');
  const contentEl = document.getElementById('criticalDialogContent');
  const imageEl = document.getElementById('criticalDialogImage');
  if (!overlay || !textEl || !actionsEl || !contentEl || !imageEl) {
    criticalDialogQueue.shift();
    return;
  }

  playSound('menu');
  textEl.textContent = message || "";
  actionsEl.innerHTML = "";
  const imageSrc = options?.imageSrc ? String(options.imageSrc).trim() : "";
  const hasImage = !!imageSrc;
  contentEl.classList.toggle("no-image", !hasImage);
  if (hasImage) {
    imageEl.src = imageSrc;
    imageEl.alt = options?.imageAlt || "Imagem do evento";
    imageEl.classList.remove("hidden");
    imageEl.classList.toggle("character-image", !!options?.imageIsCharacter);
  } else {
    imageEl.src = "";
    imageEl.alt = "";
    imageEl.classList.add("hidden");
    imageEl.classList.remove("character-image");
  }

  if (actions && actions.length > 0) {
    actions.forEach((action, index) => {
      if (!action || !action.label) return;
      const btn = document.createElement("button");
      btn.textContent = action.label;
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(10px)';
      btn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        if (action.handler && typeof action.handler === "function") {
          setTimeout(() => action.handler(), 100);
        }
        dismissCriticalDialog();
      });
      actionsEl.appendChild(btn);
      setTimeout(() => { btn.style.transition = 'all 0.3s ease'; btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }, 100 + index * 80);
    });
  } else {
    const btn = document.createElement("button");
    btn.textContent = "OK";
    btn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      dismissCriticalDialog();
    });
    actionsEl.appendChild(btn);
    setTimeout(() => { btn.style.transition = 'all 0.3s ease'; btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }, 100);
  }

  overlay.classList.remove("hidden");
}

function dismissCriticalDialog() {
  const overlay = document.getElementById('criticalOverlay');
  const contentEl = document.getElementById('criticalDialogContent');
  const imageEl = document.getElementById('criticalDialogImage');
  if (overlay) overlay.classList.add("hidden");
  if (contentEl) contentEl.classList.remove("no-image");
  if (imageEl) {
    imageEl.src = "";
    imageEl.alt = "";
    imageEl.classList.add("hidden");
    imageEl.classList.remove("character-image");
  }
  criticalDialogQueue.shift();
  if (criticalDialogQueue.length > 0) {
    setTimeout(() => showNextCriticalDialog(), 300);
  }
}


// ═══════════════════════════════════════════════════════════════════
// §17  UI: RENDERING & SCENES
// ═══════════════════════════════════════════════════════════════════

function hydrateUI() {
  elements.text.innerHTML = "";
  elements.subTitle.style.display = "block";
  resetSubtitle();
  elements.jokeList.style.display = "none";
  elements.legend.style.display = "none";
}

function resetSubtitle() {
  elements.subTitle.textContent = "Construa sua jornada de Comic";
}

function focusNarrationOnMobile(token) {
  if (token !== narrationRenderToken || !elements.text || typeof window.matchMedia !== "function") return;
  if (!window.matchMedia("(max-width: 767px)").matches) return;

  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  elements.text.scrollIntoView?.({ behavior, block: "center", inline: "nearest" });
}

function displayNarration(message) {
  narrationRenderToken += 1;
  const token = narrationRenderToken;
  elements.text.innerHTML = "";
  elements.text.style.opacity = '0';
  elements.text.style.transform = 'translateY(10px)';
  setTimeout(() => {
    if (token !== narrationRenderToken) return;
    elements.text.style.transition = 'all 0.3s ease';
    elements.text.style.opacity = '1';
    elements.text.style.transform = 'translateY(0)';
    showText("#text", message, 0, 18, null, token);
  }, 100);
  // The scene image updates just before narration in most actions. Wait until its
  // layout transition has settled, then bring the new message into the mobile viewport.
  setTimeout(() => focusNarrationOnMobile(token), 450);
}

function setScene(sceneKey, customTitle, customImage, isCharacter = false) {
  const scene = scenes[sceneKey] || {};
  sceneRenderToken += 1;
  const token = sceneRenderToken;

  elements.title.style.opacity = '0';
  elements.title.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    if (token !== sceneRenderToken) return;
    const titleText = customTitle !== undefined ? customTitle : (scene.title || "Na estrada");
    elements.title.textContent = titleText;
    elements.title.style.opacity = titleText ? '1' : '0';
    elements.title.style.transform = 'translateY(0)';
  }, 150);

  elements.image.style.opacity = '0';
  elements.image.style.transform = 'scale(0.95)';
  setTimeout(() => {
    if (token !== sceneRenderToken) return;
    let imageToUse = customImage || scene.image;
    if (!customImage && !scene.image && state && typeof state.currentWeekDay !== 'undefined') {
      imageToUse = getQuartoForWeekday(state.currentWeekDay);
    }
    elements.image.classList.toggle('character-image', !!isCharacter);
    elements.image.onload = () => {
      if (token !== sceneRenderToken) return;
      elements.image.style.opacity = '1';
      elements.image.style.transform = 'scale(1)';
    };
    elements.image.onerror = customImage && scene.image
      ? () => {
          if (token !== sceneRenderToken) return;
          elements.image.onerror = null;
          elements.image.src = scene.image;
        }
      : null;
    elements.image.src = imageToUse || "assets/scenes/writing/quarto1.png";
    if (elements.image.complete) elements.image.onload();
  }, 200);

  elements.title.style.transition = 'all 0.3s ease';
  elements.image.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
}

function updateStats(animate = true) {
  const old = { ...previousStats };

  state.fans = Math.max(0, Math.round(state.fans || 0));
  state.motivation = clamp(state.motivation ?? 60, 0, 120);
  state.texto = clamp(state.texto ?? 10, 0, 200);
  state.entrega = clamp(state.entrega ?? 5, 0, 200);
  state.xp = Math.max(0, Math.round(state.xp || 0));
  state.levelNumber = getLevelFromXp(state.xp);
  state.level = getLevelTier(state.levelNumber);

  elements.stats.name.textContent = state.name;
  elements.stats.day.textContent = `${DAYS_OF_WEEK[state.currentWeekDay] || "???"}, Dia ${state.currentDay}`;
  elements.stats.points.textContent = `${state.activityPoints}/${getMaxActivityPoints()} pontos`;

  // Color activity points by remaining
  const pointsStat = elements.stats.points.closest('.stat');
  if (pointsStat) {
    pointsStat.style.color = state.activityPoints <= 0 ? 'var(--neon-pink)' : state.activityPoints < 1 ? 'var(--accent-gold)' : '';
  }

  updateScheduledShowUI();
  updateFlowUI();

  // Stage time
  if (animate && state.stageTime !== old.stageTime) animateStatChange('stage', state.stageTime > old.stageTime);
  elements.stats.stage.textContent = `${state.stageTime}x`;

  // XP
  const xpForNext = getXpForNextLevel(state.levelNumber);
  if (animate && state.xp !== old.xp) animateStatChange('material', state.xp > old.xp);
  elements.stats.material.textContent = xpForNext ? `${state.xp}/${xpForNext} XP` : `${state.xp} XP · MAX`;

  // Level label + level-up popup
  const levelLabel = getLevelLabel(state.level, state.levelNumber);
  elements.stats.level.textContent = levelLabel;
  if (lastLevelNumber && state.levelNumber > lastLevelNumber) {
    queueCriticalDialog(`🎉 Você evoluiu para o nível ${state.levelNumber} (${getLevelLabel(state.level)})!`);
    spawnConfetti(30);
    animateStatChange('level', true);
  }
  lastLevelLabel = levelLabel;
  lastLevelNumber = state.levelNumber;

  // Fans
  if (animate && state.fans !== old.fans) { animateNumber(elements.stats.fans, old.fans, state.fans, 600); animateStatChange('fans', state.fans > old.fans); }
  else elements.stats.fans.textContent = state.fans;

  // Network
  if (elements.stats.network) elements.stats.network.textContent = `${Math.max(0, Math.round(state.network || 0))}`;

  // Motivation
  if (animate && state.motivation !== old.motivation) { animateNumber(elements.stats.motivation, old.motivation, state.motivation, 400); animateStatChange('motivation', state.motivation > old.motivation); }
  else elements.stats.motivation.textContent = `${state.motivation}`;

  // Texto
  if (animate && state.texto !== old.texto) { animateNumber(elements.stats.texto, old.texto, state.texto, 400); animateStatChange('texto', state.texto > old.texto); }
  else elements.stats.texto.textContent = `${state.texto}`;

  // Entrega
  if (animate && state.entrega !== old.entrega) { animateNumber(elements.stats.entrega, old.entrega, state.entrega, 400); animateStatChange('entrega', state.entrega > old.entrega); }
  else elements.stats.entrega.textContent = `${state.entrega}`;

  if (elements.stats.study) {
    const studyCount = normalizeRouteCounters(state.routeCounters).studyCount;
    elements.stats.study.textContent = `${studyCount} total · ${state.weeklyStudyCount || 0}/3 semana`;
  }

  const stage = getCareerStage();
  if (elements.buttons.write) {
    elements.buttons.write.textContent = stage === "open" ? "✏️ Escrever Piada" : "🧱 Trabalhar Texto";
  }
  if (elements.buttons.material) {
    elements.buttons.material.textContent = stage === "open" ? "📋 Material" : "📚 Textos";
  }

  renderProfileBadges();

  previousStats = { fans: state.fans, motivation: state.motivation, texto: state.texto, entrega: state.entrega, stageTime: state.stageTime, xp: state.xp };
}

function updateScheduledShowUI() {
  if (!elements.scheduledShowInfo || !elements.btnGoToShow) return;

  const todayShows = getScheduledShowsForToday();
  const nearest = getNearestScheduledShow();

  if (elements.buttons.show) {
    if (state.performedShowToday) {
      elements.buttons.show.textContent = "🎤 (Já fez show hoje)";
      elements.buttons.show.classList.remove('show-today');
    } else if (todayShows.length > 0) {
      elements.buttons.show.textContent = "🎤 Ir para Show!";
      elements.buttons.show.classList.add('show-today');
    } else {
      elements.buttons.show.textContent = "🎭 Buscar Show";
      elements.buttons.show.classList.remove('show-today');
    }
  }

  if (nearest) {
    const show = findShowById(nearest.showId);
    const daysUntil = nearest.dayScheduled - state.currentDay;

    if (daysUntil === 0) {
      elements.btnGoToShow.classList.remove('hidden');
      elements.btnGoToShow.textContent = `🎤 Ir para ${show?.name || 'o Show'}!`;
    } else if (daysUntil > 0) {
      elements.btnGoToShow.classList.remove('hidden');
      elements.btnGoToShow.textContent = `⏩ Pular para ${show?.name || 'o Show'} (${daysUntil}d)`;
    } else {
      elements.btnGoToShow.classList.add('hidden');
    }

    const allShows = (state.scheduledShows || []).filter(s => s.dayScheduled >= state.currentDay);
    if (allShows.length > 0) {
      const lines = allShows.map(s => {
        const sShow = findShowById(s.showId);
        const d = s.dayScheduled - state.currentDay;
        const eventTag = s.isEventGig ? ' · CONVITE ESPECIAL' : '';
        return `📅 ${sShow?.name || 'Show'}${eventTag} ${d === 0 ? 'HOJE' : `em ${d}d (${getDayName(s.dayScheduled)})`}`;
      });
      elements.scheduledShowInfo.classList.remove('hidden');
      elements.scheduledShowText.textContent = lines.join(' | ');
    } else {
      elements.scheduledShowInfo.classList.add('hidden');
    }
  } else {
    elements.btnGoToShow.classList.add('hidden');
    elements.scheduledShowInfo.classList.add('hidden');
  }
}

function updateFlowUI() {
  if (!elements.flowIndicator) return;
  if (state.flowState?.active) {
    elements.flowIndicator.classList.remove('hidden');
    elements.flowIndicator.classList.add('flow-active');
    if (elements.stats.flow) elements.stats.flow.textContent = `FLOW! (${state.flowState.daysRemaining}d)`;
  } else {
    elements.flowIndicator.classList.add('hidden');
    elements.flowIndicator.classList.remove('flow-active');
  }
}


// ═══════════════════════════════════════════════════════════════════
// §18  UI: JOKE LIST
// ═══════════════════════════════════════════════════════════════════

function renderJokeList({ selectable }) {
  const shouldDisplay = uiMode === "showSelection" || uiMode === "viewMaterial";
  elements.jokeList.dataset.selectable = selectable ? "true" : "false";
  elements.jokeList.innerHTML = "";

  if (!shouldDisplay) {
    elements.jokeList.style.display = "none";
    elements.legend.style.display = "none";
    elements.subTitle.style.display = "block";
    return;
  }

  if (uiMode === "showSelection") {
    elements.subTitle.textContent = "📝 Material";
    elements.subTitle.style.display = "block";
  }

  elements.legend.textContent = LEGEND_TEXT;
  elements.legend.style.display = "block";
  elements.legend.style.opacity = '0';
  setTimeout(() => { elements.legend.style.transition = 'opacity 0.3s ease'; elements.legend.style.opacity = '1'; }, 100);

  const listToRender = state.jokes;

  if (!listToRender.length) {
    elements.jokeList.innerHTML = '<li class="joke-item read-only"><strong>📝 Sem piadas no bloco.</strong> Bora escrever algo.</li>';
    elements.jokeList.style.display = "block";
    return;
  }

  listToRender.forEach((joke, index) => {
    const li = document.createElement("li");
    li.classList.add("joke-item");
    if (!selectable) li.classList.add("read-only");
    li.dataset.id = joke.id;
    if (selectedJokeIds.has(joke.id)) li.classList.add("selected");
    li.style.opacity = '0';
    li.style.transform = 'translateX(-20px)';

    li.innerHTML = `
      <div><strong>${escapeHtml(joke.title)}</strong> — ${joke.minutes} min | ${joke.structure?.toUpperCase() || "SET"}</div>
      <div class="joke-history">${formatHistory(joke.history)}</div>
      <div class="joke-meta"><span>${describeTone(joke.tone)}</span><span>${joke.lastResult}</span></div>
    `;
    if (uiMode === "viewMaterial") {
      const actions = document.createElement("div");
      actions.classList.add("actions");
      actions.innerHTML = '<button class="rewrite-btn">✏️ Reescrever</button><button class="delete-btn">🗑️ Apagar</button>';
      li.appendChild(actions);
    }
    elements.jokeList.appendChild(li);
    setTimeout(() => { li.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'; li.style.opacity = '1'; li.style.transform = 'translateX(0)'; }, 50 + index * 60);
  });
  elements.jokeList.style.display = "block";
}


function handleJokeListClick(event) {
  const item = event.target.closest("li");
  if (!item) return;

  if (event.target.closest(".delete-btn")) { if (uiMode === "viewMaterial") deleteJoke(item.dataset.id); return; }
  if (event.target.closest(".rewrite-btn")) { if (uiMode === "viewMaterial") rewriteJoke(item.dataset.id); return; }

  if (elements.jokeList.dataset.selectable !== "true") return;

  const id = item.dataset.id;
  if (selectedJokeIds.has(id)) selectedJokeIds.delete(id); else selectedJokeIds.add(id);
  renderJokeList({ selectable: true });
  if (uiMode === "showSelection") renderSetSummary();
}

function renderSetSummary() {
  if (uiMode !== "showSelection") { elements.btnDivLow.style.display = "none"; return; }

  const selectedJokes = state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const jokeMinutes = selectedJokes.reduce((sum, joke) => sum + joke.minutes, 0);
  const tones = [...new Set(selectedJokes.map((joke) => describeTone(joke.tone)))].join(" / ") || "—";
  const offeredMinutes = currentShow?.offeredMinutes || currentShow?.minMinutes || 5;
  const maxCrowdMinutes = getMaxCrowdWorkMinutes(selectedJokes.length);
  currentShow.crowdWorkMinutes = clamp(currentShow.crowdWorkMinutes || 0, 0, maxCrowdMinutes);
  const crowdMinutes = currentShow.crowdWorkMinutes;
  const minutes = jokeMinutes + crowdMinutes;

  let minuteColor = 'var(--neon-cyan)';
  let timeWarning = '';
  if (minutes < offeredMinutes * 0.7) { minuteColor = 'var(--neon-pink)'; timeWarning = ' ⚠️ MUITO POUCO'; }
  else if (minutes < offeredMinutes * 0.9) { minuteColor = 'var(--accent-gold)'; timeWarning = ' ⚡ Pouco'; }
  else if (minutes > offeredMinutes * 1.5) { minuteColor = 'var(--neon-pink)'; timeWarning = ' ⚠️ MUITO LONGO'; }
  else if (minutes > offeredMinutes * 1.2) { minuteColor = 'var(--accent-gold)'; timeWarning = ' ⚡ Estourando'; }

  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div>🎭 Set atual: <strong>${selectedJokes.length}</strong> piadas | <span style="color: ${minuteColor}"><strong>${jokeMinutes}min</strong>${crowdMinutes ? ` + <strong>${crowdMinutes}min</strong> crowd` : ''} / ${offeredMinutes}min oferecidos${timeWarning}</span></div>
    <div class="crowd-work-control">🗣️ Crowd work: ${[0, 1, 2, 3].map(value => `<button type="button" class="crowd-work-minute-btn${value === crowdMinutes ? " selected" : ""}" data-crowd-minutes="${value}" ${value > maxCrowdMinutes ? "disabled" : ""}>${value} min</button>`).join(" ")}</div>
    <div>🎨 Clima do set: ${tones}</div>
    ${currentShow ? `<div>⚡ Dificuldade: ${(currentShow.difficulty * 100).toFixed(0)}% caos</div>` : ""}
    ${currentShow?.vibeHint ? `<div>💡 ${currentShow.vibeHint}</div>` : ""}
    <div style="font-size: 0.95rem; color: var(--cream-dark);">💬 Você pode escolher fazer menos ou mais tempo que o oferecido. Há consequências.</div>
  `;
  elements.btnDivLow.querySelectorAll(".crowd-work-minute-btn").forEach(button => {
    button.addEventListener("click", () => {
      currentShow.crowdWorkMinutes = clamp(Number(button.dataset.crowdMinutes) || 0, 0, maxCrowdMinutes);
      renderSetSummary();
    });
  });
}


// ═══════════════════════════════════════════════════════════════════
// §19  UI: INTRO FLOW
// ═══════════════════════════════════════════════════════════════════

function startIntro() {
  uiMode = "intro";
  introStep = 0;
  setScene("intro", "Professor Carvalho", "assets/characters/carvalho.png", true);
  elements.introScreen.classList.remove("hidden");
  elements.screen.classList.add("hidden");
  if (elements.mainTitle) elements.mainTitle.style.display = "block";
  elements.avatarSelection.style.display = "none";
  elements.avatarOptions.forEach((option) => option.classList.remove("selected"));
  playIntroLine();
}

function playIntroLine() {
  const line = mentorIntroLines[introStep] || mentorIntroLines[mentorIntroLines.length - 1];
  elements.introText.innerHTML = "";
  showText("#introText", line, 0, 30);
  const hasMore = introStep < mentorIntroLines.length - 1;
  elements.introContinue.style.display = hasMore ? "inline-block" : "none";
  if (!hasMore) { elements.nameInput.style.display = "block"; elements.playerNameInput.focus(); }
}

function advanceIntro() {
  if (introStep >= mentorIntroLines.length - 1) return;
  introStep += 1;
  playIntroLine();
}

function confirmPlayerName() {
  const name = elements.playerNameInput.value.trim();
  if (!name || name.length < 2) { shakeScreen(); return; }
  state.name = name;
  elements.nameInput.style.display = "none";
  elements.avatarSelection.style.display = "flex";
}

function selectAvatar(key) {
  if (!avatarImages[key]) return;
  playSound('getSomething');
  state.avatar = key;
  state.hasStarted = true;
  elements.avatarOptions.forEach((option) => option.classList.toggle("selected", option.dataset.avatar === key));
  flashScreen('rgba(212, 168, 75, 0.25)');
  spawnConfetti(20);
  setTimeout(() => { setAvatarImage(key); enterGame(); displayNarration(homeText); saveGameState(); }, 400);
}

function setAvatarImage(key) {
  elements.avatarImg.src = avatarImages[key] || avatarImages.avatar1;
}

function enterGame(skipNarration = false) {
  uiMode = "idle";
  elements.introScreen.style.transition = 'opacity 0.4s ease';
  elements.introScreen.style.opacity = '0';
  setTimeout(() => {
    elements.introScreen.classList.add("hidden");
    elements.introScreen.style.opacity = '';
    elements.screen.style.opacity = '0';
    elements.screen.style.transform = 'translateY(20px)';
    elements.screen.classList.remove("hidden");
    if (elements.mainTitle) elements.mainTitle.style.display = "none";
    setAvatarImage(state.avatar);
    setScene("home");
    setTimeout(() => {
      elements.screen.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      elements.screen.style.opacity = '1';
      elements.screen.style.transform = 'translateY(0)';
      if (!skipNarration) displayNarration(homeText);
    }, 50);
  }, 400);
}


// ═══════════════════════════════════════════════════════════════════
// §20  HANDLERS: WRITING
// ═══════════════════════════════════════════════════════════════════

function handleWriteJoke() {
  if (uiMode === "event") return;
  if (uiMode === "chooseWritingMode") { exitWritingMode(); return; }
  exitSelectionMode();
  setScene("home");
  presentWritingModes();
}

function presentWritingModes() {
  uiMode = "chooseWritingMode";
  elements.subTitle.textContent = "✏️ Como você quer criar material hoje?";
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.style.opacity = '0';

  const buttons = Object.values(writingModes).map((mode) => `
    <button class="writing-mode-btn" data-mode="${mode.id}">
      ${mode.id === 'desk' ? '🪑' : '📝'} ${mode.label} <span class="cost-badge">${mode.costLabel}</span><br /><small>${mode.desc}</small>
    </button>
  `).join("");

  elements.btnDivLow.innerHTML = `<div>💡 Você tem <strong>${state.activityPoints}</strong> ponto(s) de atividade disponíveis.</div>${buttons}`;

  setTimeout(() => { elements.btnDivLow.style.transition = 'opacity 0.4s ease'; elements.btnDivLow.style.opacity = '1'; }, 50);

  elements.btnDivLow.querySelectorAll(".writing-mode-btn").forEach((btn, index) => {
    btn.style.opacity = '0'; btn.style.transform = 'translateY(10px)';
    setTimeout(() => { btn.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'; btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }, 150 + index * 100);
    btn.addEventListener("click", (e) => { createRipple(e, btn); setTimeout(() => createJokeFromMode(btn.dataset.mode), 150); });
  });

  setTimeout(() => { elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

function exitWritingMode() {
  if (uiMode === "chooseWritingMode") uiMode = "idle";
  elements.btnDivLow.style.display = "none";
  elements.btnDivLow.innerHTML = "";
  resetSubtitle();
}

function clearPendingJokeCreation() {
  _pendingJokeIdea = null;
  _pendingJokeMode = null;
  _selectedTone = null;
  _selectedStructure = null;
  _customJokeTitle = null;
}

function clearPendingRewrite() {
  _rewritingJoke = null;
  _newTone = null;
  _newStructure = null;
}

function createJokeFromMode(modeId) {
  const mode = writingModes[modeId] || writingModes.desk;
  const activityCost = mode.id === "desk" ? ACTIVITY_COSTS.desk : ACTIVITY_COSTS.day;

  if (!canAffordActivity(activityCost)) {
    shakeScreen();
    displayNarration(`⚠️ Você não tem pontos de atividade suficientes para ${mode.label.toLowerCase()}! Encerre o dia para recuperar.`);
    exitWritingMode(); return;
  }

  const motivationReq = mode.id === "desk" ? 15 : 0;
  const warnings = (motivationReq > 0) ? checkStatRequirements({ motivation: motivationReq }) : [];
  if (warnings.length > 0) {
    const warn = warnings[0];
    shakeScreen();
    displayNarration(`⚠️ Você precisa de pelo menos ${warn.required} de ${warn.stat} para ${mode.label.toLowerCase()}, mas só tem ${warn.current}. ${warn.tip}`);
    exitWritingMode(); return;
  }

  // Material limit for opens
  if (state.level === "open" && getTotalMinutes() >= 10) {
    showDialog("📝 Você atingiu o limite de 10 minutos de material como Open. Precisa apagar alguma piada para escrever outra, ou evoluir para Elenco fazendo shows!", [
      { label: "Ver Material", handler: () => { hideDialog(); handleViewMaterial(); } },
      { label: "Fechar", handler: hideDialog }
    ]);
    exitWritingMode(); return;
  }

  const idea = drawUniqueIdea();
  if (!idea) {
    displayNarration("Seu cérebro reciclou todas as ideias possíveis hoje. Delete algo velho ou viva um pouco para ter material novo.");
    exitWritingMode(); return;
  }

  exitWritingMode();
  if (!state.writingGuideUnlocked) {
    state.writingGuideUnlocked = true;
    _pendingJokeIdea = idea;
    _pendingJokeMode = mode;
    _selectedTone = "besteirol";
    _selectedStructure = "bit";
    _customJokeTitle = formatIdeaTitle(idea);
    finalizeJokeCreation();
    queueCriticalDialog("🎓 Professor Carvalho\n\nSua primeira piada nasceu sem receita. Agora você vai aprender a escolher tom e estrutura para escrever com intenção.", [{ label: "Aprender", handler: () => {} }]);
    return;
  }
  showJokeCustomization(idea, mode);
}

function showJokeCustomization(idea, mode) {
  uiMode = "jokeCustomization";
  _pendingJokeIdea = idea;
  _pendingJokeMode = mode;
  const defaultTitle = formatIdeaTitle(idea);

  const availTones = getUnlockedTones();
  const availStructures = getUnlockedStructures();
  const toneOptions = availTones.map(tone => `<button class="tone-btn ${idea.tone === tone ? 'suggested' : ''}" data-tone="${tone}" title="${toneDescriptionsLong[tone] || ''}">${tone}</button>`).join('');
  const structureOptions = availStructures.map(struct => `<button class="structure-btn" data-structure="${struct}" title="${structureDescriptions[struct] || ''}">${struct.toUpperCase()}</button>`).join('');
  const toneLegend = availTones.map(tone => `<div class="legend-item"><strong>${tone}:</strong> ${toneDescriptionsLong[tone] || ''}</div>`).join('');
  const structureLegend = availStructures.map(struct => `<div class="legend-item"><strong>${struct.toUpperCase()}:</strong> ${structureDescriptions[struct] || ''}</div>`).join('');

  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div class="joke-customization">
      <h4>📝 Título da piada:</h4>
      <input type="text" id="jokeTitleInput" class="joke-title-input" value="${escapeHtml(defaultTitle)}" maxlength="50" placeholder="Ex: Piada sobre..." />
      <h4>🎨 Escolha o tom da piada:</h4>
      <div class="tone-buttons">${toneOptions}</div>
      <details class="legend-details"><summary>📖 O que significa cada tom?</summary><div class="legend-content">${toneLegend}</div></details>
      <h4>🏗️ Escolha a estrutura:</h4>
      <div class="structure-buttons">${structureOptions}</div>
      <details class="legend-details"><summary>📖 O que significa cada estrutura?</summary><div class="legend-content">${structureLegend}</div></details>
      <div class="customization-hint">💡 Ideia original: "${escapeHtml(idea.seed)}" (${describeTone(idea.tone)})</div>
    </div>
  `;

  _selectedTone = idea.tone;
  _selectedStructure = getUnlockedStructures()[0];
  _customJokeTitle = defaultTitle;

  const titleInput = elements.btnDivLow.querySelector('#jokeTitleInput');
  if (titleInput) titleInput.addEventListener('input', (e) => { _customJokeTitle = e.target.value.trim() || defaultTitle; });

  elements.btnDivLow.querySelectorAll('.tone-btn').forEach(btn => {
    btn.addEventListener('click', () => { elements.btnDivLow.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); _selectedTone = btn.dataset.tone; });
    if (btn.dataset.tone === idea.tone) btn.classList.add('selected');
  });
  elements.btnDivLow.querySelectorAll('.structure-btn').forEach(btn => {
    btn.addEventListener('click', () => { elements.btnDivLow.querySelectorAll('.structure-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); _selectedStructure = btn.dataset.structure; });
  });
  elements.btnDivLow.querySelector('.structure-btn').classList.add('selected');

  showDialog("Personalize sua nova piada e confirme:", [
    { label: "✅ Criar Piada", handler: () => { hideDialog(); finalizeJokeCreation(); } },
    { label: "❌ Cancelar", handler: () => { hideDialog(); exitWritingMode(); clearPendingJokeCreation(); } }
  ]);

  setTimeout(() => { elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

function finalizeJokeCreation() {
  const idea = _pendingJokeIdea;
  const mode = _pendingJokeMode;
  if (!idea || !mode) { exitWritingMode(); return; }

  const chosenTone = _selectedTone || idea.tone;
  const chosenStructure = _selectedStructure || getUnlockedStructures()[0];
  const chosenTitle = _customJokeTitle || formatIdeaTitle(idea);
  const minutes = getRandomMinutesForStructure(chosenStructure);

  if (state.level === "open" && getTotalMinutes() + minutes > 10) {
    shakeScreen();
    showDialog(`📝 Essa estrutura deixaria seu caderno com ${getTotalMinutes() + minutes} minutos.\n\nComo Open, o limite é 10 minutos de material. Apague algo ou escolha uma estrutura mais curta.`, [
      { label: "Ver Material", handler: () => { hideDialog(); clearPendingJokeCreation(); exitWritingMode(); handleViewMaterial(); } },
      { label: "Fechar", handler: () => { hideDialog(); clearPendingJokeCreation(); exitWritingMode(); } }
    ]);
    return;
  }

  const activityCost = mode.id === "desk" ? ACTIVITY_COSTS.desk : ACTIVITY_COSTS.day;
  spendActivityPoints(activityCost, mode.label);

  state.motivation = clamp(state.motivation - mode.motivationCost, 0, 120);

  // Fail check: chance of nothing getting written
  if (Math.random() < (mode.failChance || 0)) {
    clearPendingJokeCreation();
    exitWritingMode();
    renderJokeList({ selectable: false });
    setScene("home");
    const failMsg = mode.id === "desk"
      ? "😤 Você sentou e tentou, mas nada saiu. A tela em branco venceu hoje."
      : "🤷 Anotou umas coisas durante o dia, mas nada que prestasse.";
    displayNarration(`${failMsg} (-1 ponto de atividade)`);
    updateStats();
    saveGameState();
    return;
  }

  state.texto = clamp((state.texto || 0) + 1 + Math.round(mode.textoBonus * 20), 0, 200);

  const basePotential = generatePotential();
  const flowBonus = state.flowState?.active ? 0.1 : 0;
  const perkPotentialBonus = getPerkEffect('jokePotentialBonus') + getPerkEffect('setupBonus');
  const skillFactor = clamp(((state.texto || 0) - 10) / 140, 0, 1);
  const badChance = 0.78 - (0.18 * skillFactor);
  const mediumChance = 0.18 + (0.12 * skillFactor);
  const qualityRoll = Math.random();
  let qualityTier = "bad";
  if (qualityRoll >= badChance + mediumChance) qualityTier = "good";
  else if (qualityRoll >= badChance) qualityTier = "medium";

  const baseScore = basePotential + (state.texto / 250) + (state.motivation - 60) / 400 + mode.textoBonus + flowBonus + perkPotentialBonus;
  let qualityOffset = 0;
  if (qualityTier === "bad") {
    qualityOffset = (-0.16 + (0.10 * skillFactor)) + ((Math.random() * 0.06) - 0.03);
  } else if (qualityTier === "medium") {
    qualityOffset = (-0.02 + (0.07 * skillFactor)) + ((Math.random() * 0.04) - 0.02);
  } else {
    qualityOffset = (0.06 + (0.08 * skillFactor)) + ((Math.random() * 0.04) - 0.02);
  }

  const adjustedPotential = clamp(baseScore + qualityOffset, 0.2, 0.98);
  const label = qualityTier === "good"
    ? "🔥 encaixou forte"
    : qualityTier === "medium"
      ? "🙂 tem caminho"
      : "😶 veio crua";

  state.jokes.push({
    id: createId(), title: chosenTitle, tone: chosenTone, structure: chosenStructure,
    minutes, lastResult: "⏱️ ainda não testada", freshness: "nova",
    notes: `Nasceu ${idea.mood}`, history: [], truePotential: adjustedPotential, writingMode: mode.id
  });
  incrementRouteCounter("writeCount");
  maybeCheckProgressionGates();
  if ((state.jokes.length || 0) >= 10 && markCareerMilestone("jokes10")) {
    maybeTriggerCarvalhoDialog("jokes10", { jokeCount: state.jokes.length });
  }
  const xpGain = applyXp(XP_GAIN.jokeNew);

  clearPendingJokeCreation();

  exitWritingMode();
  renderJokeList({ selectable: false });
  updateStats();
  setScene("home");
  playSound('pokeball');
  flashScreen('rgba(212, 168, 75, 0.2)');
  if (adjustedPotential > 0.7) spawnConfetti(15);

  if (getCareerStage() === "open") {
    displayNarration(`✏️ Você decide ${mode.label.toLowerCase()}. Sai de lá com uma nova piada: "${chosenTitle}". Tom: ${chosenTone}, estrutura: ${chosenStructure.toUpperCase()}. ${minutes} min, parece ${label}. (-1 ponto) (+${xpGain} XP)`);
  } else {
    displayNarration(`🧱 Você trabalha seu texto. Na prática, ainda é piada: premissa, punchline, corte, ordem. Mas agora você pensa em bloco de 15 minutos. Entrou: "${chosenTitle}" (${minutes} min, ${chosenStructure.toUpperCase()}, ${chosenTone}). Parece ${label}. (-1 ponto) (+${xpGain} XP)`);
  }

  refreshRouteInviteAvailability("writing");
  maybeTriggerEvent("random", { source: "writing" });
  checkAndShowPendingEvent();
  saveGameState();
}


// ═══════════════════════════════════════════════════════════════════
// §21  HANDLERS: SHOWS
// ═══════════════════════════════════════════════════════════════════

function handleSearchShow() {
  if (!state.jokes.length) { shakeScreen(); displayNarration("⚠️ Você ainda não tem material. Escreva alguma coisa antes de encarar a plateia."); return; }
  if (state.performedShowToday) { shakeScreen(); displayNarration("🎤 Você já fez um show hoje. Descanse e tente novamente amanhã."); return; }

  const todayShows = getScheduledShowsForToday();
  if (todayShows.length > 0) { handleGoToScheduledShow(); return; }

  if ((state.scheduledShows || []).length >= MAX_SCHEDULED_SHOWS) { shakeScreen(); displayNarration("📅 Você já tem 3 shows agendados. Faça ou cancele algum antes de buscar outro."); return; }

  searchForNewShow();
}

function searchForNewShow() {
  flashScreen('rgba(139, 115, 85, 0.2)');
  const availableShows = generateAvailableShows();
  if (availableShows.length === 0) { displayNarration("😔 Não há shows disponíveis no momento. Tente novamente amanhã ou aumente seu network."); return; }
  presentShowOptions(availableShows);
}

function generateAvailableShows() {
  const shows = [];
  const careerStage = getCareerStage();
  const network = state.network || 10;
  const weekDay = state.currentWeekDay;

  // Filter eligible regular shows (exclude specials — they have dedicated unlock paths)
  let eligibleShows = showPool.filter(show => {
    if (show.isSpecialShow) return false;
    if (!contentGates.showEligible(show, careerStage)) return false;
    if (!isShowUnlockedForCareer(show)) return false;
    return true;
  });

  const alreadyScheduledIds = (state.scheduledShows || []).map(s => s.showId);

  if (careerStage === "elenco" && Math.random() < 0.85) {
    maybeAddElencoCircuitGig(shows, alreadyScheduledIds, weekDay);
  }
  // 5 a 5 (Sundays, unlocked via Paulo Araújo)
  if (careerStage === "open" && state.fiveA5Unlocked && !alreadyScheduledIds.includes("5a5")) {
    const daysTo5a5 = findDaysToWeekday(0);
    const show5a5 = findShowById("5a5");
    if (show5a5 && Math.random() < 0.75) {
      if (weekDay === 0) shows.unshift({ show: show5a5, daysAhead: 0, showType: "5a5" });
      else if (daysTo5a5 > 0 && daysTo5a5 <= 6) shows.unshift({ show: show5a5, daysAhead: daysTo5a5, showType: "5a5" });
    }
  }

  // Se Vira nos 5 (Sorocaba, unlocked via João Valio; the trip takes two days)
  if (state.seViraNos5Unlocked && !alreadyScheduledIds.includes("se-vira-nos-5")) {
    const seViraNos5 = findShowById("se-vira-nos-5");
    if (seViraNos5 && Math.random() < 0.65) shows.unshift({ show: seViraNos5, daysAhead: 2, showType: "seViraNos5" });
  }

  // Pague 15 (Thursdays, unlocked via Paulo Araújo)
  if (state.pague15Unlocked && !alreadyScheduledIds.includes("pague15")) {
    const daysToPague15 = findDaysToWeekday(4);
    const showPague15 = findShowById("pague15");
    if (showPague15) {
      if (weekDay === 4) shows.unshift({ show: showPague15, daysAhead: 0, showType: "pague15" });
      else if (daysToPague15 > 0 && daysToPague15 <= 6) shows.unshift({ show: showPague15, daysAhead: daysToPague15, showType: "pague15" });
    }
  }

  // Fill remaining slots with random regular shows
  const offeredIds = new Set(shows.map((item) => item.show.id));
  eligibleShows = eligibleShows.filter((show) => !offeredIds.has(show.id));
  const remainingSlots = Math.max(0, 3 - shows.length);
  const producerExtraOffer = hasClassPassive("betterShowOffers") ? 1 : 0;
  const maxOffersByNetwork = 1 + Math.floor(network / 30) + producerExtraOffer;
  const numShows = Math.min(eligibleShows.length, remainingSlots, maxOffersByNetwork);
  const selectedShows = careerStage === "open"
    ? pickOpenWeightedShows(eligibleShows, numShows)
    : [...eligibleShows]
      .sort((a, b) => (Math.random() / getVenueOfferWeight(a.id)) - (Math.random() / getVenueOfferWeight(b.id)))
      .slice(0, numShows);
  for (let i = 0; i < selectedShows.length; i++) {
    const daysAhead = Math.random() < 0.3 ? 1 : (Math.random() < 0.6 ? 2 : 3);
    const selectedShow = selectedShows[i];
    const showType = careerStage === "open" && selectedShow.isOpenStarter ? "openStarter" : "normal";
    shows.push({ show: selectedShow, daysAhead, showType });
  }

  return shows.slice(0, 3);
}

function presentShowOptions(availableShows) {
  uiMode = "showBrowse";
  const options = availableShows.map((item) => {
    const { show, daysAhead, showType } = item;
    const scheduledDay = state.currentDay + daysAhead;
    const dayName = getDayName(scheduledDay);
    const offeredTime = calculateOfferedTime(show, { showType });
    let label = `🎭 ${show.name}`;
    if (showType === "5a5") label = `⭐ ${show.name} (especial iniciantes)`;
    if (showType === "seViraNos5") label = `🏠 ${show.name} (convite de João Valio)`;
    if (showType === "pague15") label = `🏆 ${show.name} (desbloqueado!)`;
    if (showType === "openStarter") label = `🌱 ${show.name} (open iniciante)`;
    if (showType === "elenco15") label = `🎬 ${show.name} (circuito 15min)`;
    if (showType === "specialTape") label = `🎥 ${show.name} (gravação final)`;
    const stageTag = show.careerStage ? ` · ${show.careerStage.toUpperCase()}` : "";
    const riskTag = show.riskProfile ? ` · risco ${show.riskProfile}` : "";
    const crowdTag = show.audienceType ? ` · público ${show.audienceType}` : "";
    const difficultyTag = ` · dificuldade ${(show.difficulty * 100).toFixed(0)}%`;
    const venueRep = getVenueReputation(show.id);
    const repTag = ` · casa ${getVenueReputationTier(venueRep)} (${venueRep >= 0 ? "+" : ""}${venueRep})`;
    const locationTag = show.location ? `\n📍 ${show.location}` : "";
    return {
      label: `${label}${stageTag}${riskTag}${crowdTag}${difficultyTag}${repTag}${locationTag}\n📅 ${dayName} (${daysAhead === 0 ? 'HOJE' : daysAhead + 'd'}) | ⏱️ ${offeredTime} min oferecidos`,
      handler: () => { hideDialog(); scheduleShow(show, scheduledDay, showType); }
    };
  });
  options.push({ label: "❌ Cancelar busca", handler: hideDialog });
  showDialog("🔍 Shows disponíveis para você:", options);
}

function scheduleShow(show, scheduledDay, showType = "normal") {
  if (!addScheduledShow(show.id, scheduledDay, showType)) {
    shakeScreen();
    displayNarration("📅 Você já tem 3 shows agendados! Faça ou cancele algum antes.");
    return;
  }
  playSound('getSomething');
  state.network = (state.network || 10) + 1;
  updateStats();
  displayNarration(`✅ Show marcado! ${show.name} em ${scheduledDay - state.currentDay} dia(s) (${getDayName(scheduledDay)}). Prepare seu material!`);
  setScene("home");
  saveGameState();
}

function handleGoToScheduledShow() {
  const todayShows = getScheduledShowsForToday();
  if (todayShows.length === 0) {
    const nearest = getNearestScheduledShow();
    if (!nearest) { displayNarration("📅 Você não tem nenhum show marcado."); return; }
    skipToShowDay(); return;
  }

  const entry = todayShows[0];
  const show = findShowById(entry.showId);
  if (!show) { removeScheduledShow(entry); displayNarration("❌ O show foi cancelado de última hora."); return; }

  playSound('comeWithMe');
  removeScheduledShow(entry);
  const offeredMinutes = calculateOfferedTime(show, entry);
  beginShowPreparation(show, offeredMinutes, entry.showType);
}

function skipToShowDay() {
  const nearest = getNearestScheduledShow();
  if (!nearest) return;
  const daysUntil = nearest.dayScheduled - state.currentDay;
  if (daysUntil <= 0) { handleGoToScheduledShow(); return; }

  const show = findShowById(nearest.showId);
  const showName = show?.name || 'o Show';

  showDialog(`⏩ Pular ${daysUntil} dia(s) até ${showName}?\n\nVocê perderá a chance de escrever, estudar ou criar conteúdo nesses dias.`, [
    { label: `✅ Pular para ${showName}`, handler: () => {
      hideDialog();
      advanceDays(daysUntil, { source: "show-skip", recoverMotivation: 3, allowEvents: false, narration: false });
      if (state.runState?.status === "ended") return;
      playSound('comeWithMe');
      displayNarration(`⏩ ${daysUntil} dia(s) passaram... É hora do show!`);
      setTimeout(() => handleGoToScheduledShow(), 1000);
    }},
    { label: "❌ Cancelar", handler: hideDialog }
  ]);
}

function calculateOfferedTime(show, scheduledShow) {
  const showCount = state.stageTime || 0;
  const careerStage = getCareerStage();

  if (scheduledShow?.showType === "5a5") return 3;
  if (scheduledShow?.showType === "pague15") return 5;
  if (scheduledShow?.showType === "specialTape" || show?.isSpecialTapeShow) return Math.max(show.setLengthTarget || 35, 30);
  if (scheduledShow?.showType === "openStarter" || show?.isOpenStarter) return clamp(show.minMinutes + 1, 3, 4);
  if (scheduledShow?.showType === "elenco15" || show?.isElencoCircuit) return 15;
  if (show.minMinutes >= 6) return show.minMinutes; // special-invite shows give their full time

  let maxTime = 3;
  if (showCount >= 10) maxTime = 10;
  else if (showCount >= 4) maxTime = 5;
  if (careerStage === "elenco") maxTime = Math.max(maxTime, 15);

  return Math.max(show.minMinutes, Math.min(maxTime, careerStage === "open" ? 5 : 15));
}

function getShowXpCategory(show, showType = "normal") {
  if (showType === "specialTape" || show?.isSpecialTapeShow) return "specialTape";
  if (showType === "elenco15" || show?.isElencoCircuit) return "elenco";
  if (showType === "pague15" || show?.id === "pague15") return "pague15";
  if (showType === "5a5" || show?.id === "5a5") return "fiveA5";
  return "open";
}

function resolveShowXpReward(show, showType, setList = []) {
  const hasNewMaterial = setList.some((joke) => ((joke.history || []).length < 3));
  const category = getShowXpCategory(show, showType);
  const xpTable = SHOW_XP_VALUES[category] || SHOW_XP_VALUES.open;
  return {
    category,
    hasNewMaterial,
    mode: hasNewMaterial ? "new material" : "consolidated",
    xp: hasNewMaterial ? xpTable.newMaterial : xpTable.consolidated
  };
}

function beginShowPreparation(show, offeredMinutes, showType) {
  if (offeredMinutes === undefined) offeredMinutes = calculateOfferedTime(show, { showType: showType || "normal" });
  const activeShowType = showType || show.special || "normal";
  currentShow = { ...show, offeredMinutes, activeShowType, crowdWorkMinutes: 0 };
  uiMode = "showSelection";
  selectedJokeIds.clear();
  let subTitle = `⏱️ Tempo oferecido: ${offeredMinutes} minutos`;
  elements.subTitle.textContent = subTitle;
  elements.subTitle.style.display = "block";
  renderJokeList({ selectable: true });
  renderSetSummary();
  setScene("club", show.name, show.image);
  displayNarration(`🎤 ${show.intro} ${show.crowd}`);

  elements.btnContinuar.style.opacity = '0';
  elements.btnContinuar.style.transform = 'translateY(20px)';
  elements.btnContinuar.style.display = "block";
  elements.btnContinuar.textContent = "🚀 Subir no palco";
  setTimeout(() => { elements.btnContinuar.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; elements.btnContinuar.style.opacity = '1'; elements.btnContinuar.style.transform = 'translateY(0)'; }, 400);
  setTimeout(() => { elements.jokeList.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
}

function performShow() {
  if (!currentShow) return;
  const showPlayed = currentShow;
  const showType = currentShow.activeShowType || currentShow.special || "normal";
  const forcedSet = null;
  const setList = state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const crowdWorkMinutes = clamp(Math.round(currentShow.crowdWorkMinutes || 0), 0, 3);
  const totalMinutes = setList.reduce((sum, joke) => sum + joke.minutes, 0) + crowdWorkMinutes;
  if (!setList.length) { shakeScreen(); displayNarration("⚠️ Você precisa selecionar alguma piada antes de subir."); return; }
  if (forcedSet) {
    const validation = validateSetForShow(forcedSet, showPlayed);
    if (!validation.ok) { shakeScreen(); displayNarration(`⚠️ ${validation.reason}`); return; }
  }
  if (maybeInterruptShowWithHeckler(setList)) return;

  flashScreen('rgba(255, 248, 220, 0.3)');
  suspendCriticalDialogs = true;
  try {
    const showXpReward = resolveShowXpReward(showPlayed, showType, setList);
    const flowBonus = state.flowState?.active ? 0.08 : 0;
    const baseEvaluation = evaluateShow(setList, showPlayed, flowBonus);
    const jokeEvaluation = applyHecklerOutcomeToEvaluation(baseEvaluation, showPlayed.hecklerOutcome);
    const evaluation = applyCrowdWorkToEvaluation(jokeEvaluation, baseEvaluation, crowdWorkMinutes);
    const breakdownWithEmoji = evaluation.breakdown.map((entry) => {
      const mood = scoreToEmoji(entry.score);
      return { ...entry, emoji: mood.emoji, label: mood.label, nota: mood.nota };
    });

    const timeImpact = evaluateStageTime(totalMinutes, showPlayed.minMinutes, evaluation.averageScore);
    const adjustedScore = evaluation.averageScore + timeImpact.adjustment;
    const nota = classifyOutcome(adjustedScore);
    const outcomeType = getOutcomeType(nota);
    const careerStage = getCareerStage();
    const venueRepChange = applyVenueReputationOutcome(showPlayed.id, nota, showType);
    const hadPreviousShows = (state.showHistory || []).length > 0;

    applyOutcome(setList, outcomeType, breakdownWithEmoji);

    if (markCareerMilestone("firstShow")) {
      maybeTriggerCarvalhoDialog("firstShow", { nota, show: showPlayed, showType });
    }

    if (hadPreviousShows && outcomeType === "bomb" && markCareerMilestone("firstBomb")) {
      maybeTriggerCarvalhoDialog("firstBomb", { nota, show: showPlayed, showType });
    }
    if (hadPreviousShows && outcomeType === "kill" && markCareerMilestone("firstKill")) {
      maybeTriggerCarvalhoDialog("firstKill", { nota, show: showPlayed, showType });
    }
    if (careerStage === "elenco") markCareerMilestone("firstElencoGig");

    const stageTimeGain = state.flowState?.active ? 2 : 1;
    state.stageTime += stageTimeGain;

    state.showHistory = state.showHistory || [];
    state.showHistory.push({
      showId: showPlayed.id,
      day: state.currentDay,
      nota,
      showType,
      jokeResults: breakdownWithEmoji.map((j, index) => {
        const sourceJoke = j.isCrowdWork ? null : setList[index];
        return {
          title: j.title,
          emoji: j.emoji,
          nota: j.nota,
          tone: sourceJoke?.tone || null,
          structure: sourceJoke?.structure || (j.isCrowdWork ? "crowdWork" : null),
          minutes: Math.max(1, Math.round(sourceJoke?.minutes || j.minutes || 1))
        };
      })
    });
    tallyPerformedTones(setList);
    tallyPerformedStructures(setList, crowdWorkMinutes);
    if (!state.crowdWorkUnlocked && (state.showHistory?.length || 0) >= 2) {
      state.crowdWorkUnlocked = true;
      queueCriticalDialog("🎓 Professor Carvalho\n\nDepois de duas noites, Carvalho libera crowd work: leia a sala e use até 3 minutos do set para conversar com o público sem abandonar o material.", [{ label: "Treinar leitura de sala", handler: () => {} }]);
    }
    ensureCareerProgressState();
    if (nota >= 4) state.careerPathState.goodShowsCount += 1;
    if ((showPlayed.minMinutes || 0) >= 7 || showPlayed.isElencoCircuit) state.careerPathState.bigRoomShowsCount += 1;
    if (showPlayed.isElencoCircuit && nota >= 4) state.careerPathState.elencoGoodShowsCount += 1;
    maybeUnlockPolitico(showPlayed, nota);
    if (forcedSet) {
      forcedSet.history = [...(forcedSet.history || []), { day: state.currentDay, showId: showPlayed.id, nota }].slice(-20);
    }
    state.performedShowToday = true;

    const prevLevelNumber = state.levelNumber;
    const xpGain = applyXp(showXpReward.xp);
    checkLevelProgression(nota, showType, prevLevelNumber);
    checkFlowState(nota);

    const fanGain = Math.max(0, Math.round(totalMinutes * (nota - 1) * 0.8));
    state.fans += fanGain;
    const motivationShift = nota >= 4 ? 12 : nota >= 3 ? 2 : nota >= 2 ? -5 : -12;
    state.motivation = clamp(state.motivation + motivationShift, 0, 120);
    if (nota >= 4) state.network = (state.network || 10) + 2;
    const entregaGain = nota >= 4 ? 2 : 1;
    state.entrega = clamp((state.entrega || 0) + entregaGain, 0, 200);
    if (nota >= 3 && hasClassPassive("stageConsistency")) {
      state.texto = clamp((state.texto || 0) + 1, 0, 200);
    }
    processOpenStageConsistencyOutcome(nota);
    processElencoCircuitOutcome(showType, nota);
    maybeCheckProgressionGates();

    updateStats();
    renderJokeList({ selectable: false });
    exitSelectionMode();

    const venueRepText = venueRepChange.delta
      ? `Casa ${venueRepChange.tier} (${formatSigned(venueRepChange.delta)})`
      : "";
    showResultNarrative(nota, breakdownWithEmoji, timeImpact, {
      fans: fanGain,
      motivation: motivationShift,
      stageTimeGain,
      xp: xpGain,
      xpMode: showXpReward.mode,
      entrega: entregaGain,
      venueRepText,
      hecklerText: showPlayed.hecklerOutcome?.text || ""
    });

    const eventContext = { outcome: outcomeType, nota, show: showPlayed, averageScore: evaluation.averageScore, adjustedScore, showType };
    if (outcomeType === "kill") maybeTriggerEvent("showKill", eventContext);
    else if (outcomeType === "bomb") maybeTriggerEvent("showBomb", eventContext);
    else maybeTriggerEvent("random", eventContext);

    refreshRouteInviteAvailability("show");
    checkFanMilestones();
    saveGameState();
  } finally {
    suspendCriticalDialogs = false;
    flushDeferredCriticalDialogs();
  }
}

function applyOutcome(setList, outcome, breakdown = []) {
  setList.forEach((joke, index) => {
    const detail = breakdown[index];
    const mood = detail ? { emoji: detail.emoji, label: detail.label } : fallbackEmojiForOutcome(outcome);
    joke.history = [...(joke.history || []), mood.emoji].slice(-7);
    joke.lastResult = `${mood.emoji} ${mood.label}`;
    if (outcome === "kill") joke.freshness = "rodado";
    else if (outcome === "bomb") joke.freshness = "precisa reescrever";
  });
}

function showResultNarrative(nota, breakdown, timeImpact, deltas = {}) {
  const messages = {
    5: "🤯 EXPLODIU! A plateia em pé, gritos de 'mais uma!'. Uma noite histórica que todos vão lembrar.",
    4: "🔥 Você matou no palco! Risadas constantes, aplausos calorosos. O produtor já te quer de volta.",
    3: "🙂 Segurou bem. Algumas risadas fortes, o público ficou com você. Dá pra crescer em cima disso.",
    2: "😶 Risinhos nervosos. Alguns momentos funcionaram, outros caíram no vazio. Hora de ajustar.",
    1: "💧 Silêncio constrangedor. O garçom falou mais alto que você. Aceite que faz parte e reescreva."
  };

  const resultImage = getShowResultImage(nota);
  if (nota === 5) { setScene("explode", undefined, resultImage); playSound('victory'); setTimeout(() => { spawnConfetti(70); flashScreen('rgba(212, 168, 75, 0.4)'); }, 300); }
  else if (nota === 4) { setScene("kill", undefined, resultImage); playSound('victory'); setTimeout(() => { spawnConfetti(40); flashScreen('rgba(212, 168, 75, 0.3)'); }, 300); }
  else if (nota === 3) { setScene("ok", undefined, resultImage); playSound('getSomething'); flashScreen('rgba(245, 230, 200, 0.15)'); }
  else if (nota === 2) { setScene("risinhos", undefined, resultImage); playSound('click'); flashScreen('rgba(200, 180, 150, 0.15)'); }
  else { setScene("bomb", undefined, resultImage); playSound('boom'); shakeScreen(); flashScreen('rgba(166, 68, 68, 0.25)'); }

  const detalhes = breakdown.length ? breakdown.map((entry) => `${entry.title} ${entry.emoji}`).join(" | ") : "";
  const statFragments = [`Nota ${nota}/5`];
  if (deltas.xp) statFragments.push(`XP +${deltas.xp}${deltas.xpMode ? ` (${deltas.xpMode})` : ""}`);
  if (deltas.fans) statFragments.push(`Fãs ${formatSigned(deltas.fans)}`);
  if (deltas.motivation) statFragments.push(`Motivação ${formatSigned(deltas.motivation)}`);
  if (deltas.stageTimeGain && deltas.stageTimeGain > 1) statFragments.push(`Tempo de Palco +${deltas.stageTimeGain} (FLOW!)`);
  if (deltas.entrega) statFragments.push(`Entrega +${deltas.entrega}`);
  if (deltas.xp) statFragments.push(`XP +${deltas.xp}`);
  if (deltas.venueRepText) statFragments.push(deltas.venueRepText);

  displayNarration(`${messages[nota] || messages[3]}${deltas.hecklerText ? ` ${deltas.hecklerText}` : ""}${timeImpact?.note ? ` ${timeImpact.note}` : ""}${detalhes ? ` (${detalhes})` : ""} [${statFragments.join(" | ")}]`);
  checkAndShowPendingEvent();
}

function checkAndShowPendingEvent() {
  if (pendingEvent) {
    setTimeout(() => {
      const queuedEvent = pendingEvent;
      queueCriticalDialog("🎲 Algo aconteceu...", [
        { label: "Ver Evento Surpresa", handler: () => showPendingEvent() },
        { label: "Depois", handler: () => { pendingEvent = null; } }
      ], {
        imageSrc: queuedEvent?.image || "",
        imageAlt: queuedEvent?.id ? `Evento: ${queuedEvent.id}` : "Evento surpresa",
        imageIsCharacter: !!queuedEvent?.isCharacterEvent
      });
    }, 1000);
  }
}

function checkFanMilestones() {
  if ((state.fans || 0) >= 20) maybeTriggerEvent("fans20");
  if ((state.fans || 0) >= 30) maybeTriggerEvent("fans30");
  if ((state.fans || 0) >= 50) maybeTriggerEvent("fans50");
}

function fallbackEmojiForOutcome(outcome) {
  if (outcome === "kill") return scoreToEmoji(0.4);
  if (outcome === "ok") return scoreToEmoji(0.2);
  return scoreToEmoji(-0.2);
}

function exitSelectionMode() {
  uiMode = "idle";
  currentShow = null;
  selectedJokeIds.clear();
  elements.btnContinuar.style.display = "none";
  elements.btnDivLow.style.display = "none";
  elements.jokeList.dataset.selectable = "false";
  elements.jokeList.style.display = "none";
  elements.legend.style.display = "none";
  resetSubtitle();
}


// ═══════════════════════════════════════════════════════════════════
// §22  HANDLERS: CONTENT, STUDY & OTHER
// ═══════════════════════════════════════════════════════════════════

function handleCreateContent() {
  if (uiMode === "event") return;
  exitSelectionMode();
  setScene("home");
  createContent();
}

function createContent() {
  if (!spendActivityPoints(ACTIVITY_COSTS.content, "criar conteúdo")) return;
  const reach = Math.max(3, Math.round(state.stageTime * 1.5 + getTotalMinutes() * 0.75 + Math.random() * 12));
  const baseFanGain = reach + Math.round(state.texto / 3);
  const fanGain = hasClassPassive("contentBoost") ? Math.round(baseFanGain * 1.35) : baseFanGain;
  state.fans += fanGain;
  state.network = (state.network || 10) + 1;
  state.motivation = clamp(state.motivation - 4, 0, 120);
  incrementRouteCounter("contentCount");
  maybeCheckProgressionGates();
  const xpGain = applyXp(XP_GAIN.content);
  setScene("home");
  flashScreen('rgba(245, 230, 200, 0.15)');
  if (fanGain > 20) spawnConfetti(15);
  displayNarration(`📱 Você cria conteúdo e posta. ${fanGain} novas pessoas começam a te seguir. (-1 ponto de atividade, +${xpGain} XP)`);
  updateStats();
  maybeTriggerEvent("random", { source: "content" });
  checkFanMilestones();
  checkAndShowPendingEvent();
  saveGameState();
}

function handleStudy() {
  if (uiMode === "event") return;
  exitSelectionMode();
  if (!canStudyThisWeek()) {
    shakeScreen();
    displayNarration("📚 Você já estudou 3 vezes nesta semana. Teste, escreva ou descanse até a próxima semana.");
    return;
  }
  if (!spendActivityPoints(ACTIVITY_COSTS.study, "estudar")) return;
  if (markCareerMilestone("firstStudy")) {
    maybeTriggerCarvalhoDialog("firstStudy", { source: "study" });
  }
  state.texto = clamp((state.texto || 0) + 4, 0, 200);
  state.motivation = clamp(state.motivation + 2, 0, 120);
  incrementRouteCounter("studyCount");
  state.weeklyStudyCount = (state.weeklyStudyCount || 0) + 1;
  maybeCheckProgressionGates();
  const xpGain = applyXp(XP_GAIN.study);
  setScene("home");
  flashScreen('rgba(245, 230, 200, 0.2)');
  displayNarration(`📚 Você mergulha em especiais, podcasts e livros de comédia. Novas estruturas aparecem no caderno. (-1 ponto de atividade, +${xpGain} XP)`);
  updateStats();
  saveGameState();
}

function handleShowCredits() {
  const contributors = [
    "Andre Foster,", "Bruno Henrique,", "Dhesme Gabriel,", "Douglao,",
    "Gabriel Andrade,", "Iago Maia,", "Júnior Rasec,", "Luis Maia,",
    "Paulo Araújo,", "Rossini Luz,", "Stevan Gaipo,", "Thiago Grinberg,"
  ];
  showDialog(`⭐ CRÉDITOS ⭐\n\nDesenvolvedor: Illan Carvalho\n\nAgradecimentos especiais aos nossos apoiadores:\n\n${contributors.join("\n")}\n\nObrigado por tornar este jogo possível! Essa é a versão beta então teoricamente se você está jogando seu nome tá na lista hahaha \n\nContribua: carvalhoillan@gmail.com (pix)`);
}

function handleViewHistory() {
  if (uiMode === "event") return;
  exitSelectionMode();
  uiMode = "viewHistory";
  setScene("home");
  elements.subTitle.textContent = "📊 Histórico de Shows";

  const history = state.showHistory || [];
  const runArchive = loadLegacyArchive().slice().reverse();
  const runArchiveHtml = runArchive.map(run => {
    const classLabel = run.classId && CLASSES[run.classId] ? CLASSES[run.classId].name : "Sem classe definida";
    const pureLabel = run.pureEndingId ? ` · 🏆 ${run.pureEndingId.replaceAll(":", " / ")}` : "";
    return `<div class="history-item history-good"><div class="history-info"><strong>Corrida ${run.runNumber || "?"} · ${escapeHtml(classLabel)}</strong><span class="history-date">Tom: ${escapeHtml(run.dominantTone || "indefinido")} · Estrutura: ${escapeHtml(run.dominantStructure || "indefinida")} · Dia ${run.day || "?"}${escapeHtml(pureLabel)}</span></div></div>`;
  }).join("");
  if (history.length === 0 && runArchive.length === 0) {
    displayNarration("📊 Você ainda não fez nenhum show. Busque um show e suba no palco!");
    elements.btnDivLow.style.display = "flex";
    elements.btnDivLow.innerHTML = `<div>Nenhum show registrado ainda.</div>`;
    return;
  }

  if (history.length === 0) {
    displayNarration("🏁 Suas corridas concluídas ficam registradas no arquivo.");
    elements.btnDivLow.style.display = "flex";
    elements.btnDivLow.innerHTML = `<h4>🏁 Arquivo de corridas:</h4><div class="history-list">${runArchiveHtml}</div>`;
    return;
  }

  const totalShows = history.length;
  const avgNota = (history.reduce((sum, s) => sum + (s.nota || 0), 0) / totalShows).toFixed(1);
  const showsNota4Plus = history.filter(s => s.nota >= 4).length;
  const showsNota5 = history.filter(s => s.nota >= 5).length;
  const notaCounts = [0, 0, 0, 0, 0, 0];
  history.forEach(s => { notaCounts[s.nota || 0]++; });

  const recentShows = history.slice(-10).reverse();
  const historyHtml = recentShows.map(entry => {
    const show = findShowById(entry.showId);
    const showName = show?.name || entry.showId || "Show desconhecido";
    const tier = SCORE_EMOJI_SCALE.find(t => t.nota === entry.nota) || SCORE_EMOJI_SCALE[SCORE_EMOJI_SCALE.length - 1];
    let jokePerf = "";
    if (entry.jokeResults && entry.jokeResults.length > 0) {
      jokePerf = `<div class="history-jokes">${entry.jokeResults.map(j => `${j.emoji}`).join(' ')}</div>`;
    }
    return `
      <div class="history-item ${entry.nota >= 4 ? 'history-good' : entry.nota <= 2 ? 'history-bad' : ''}">
        <div class="history-main">
          <span class="history-emoji">${tier.emoji}</span>
          <div class="history-info"><strong>${showName}</strong><span class="history-date">${getDayName(entry.day)}, Dia ${entry.day}</span></div>
          <span class="history-nota">Nota ${entry.nota}/5</span>
        </div>
        ${jokePerf}
      </div>`;
  }).join('');

  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div class="history-stats">
      <div class="stat-box"><strong>${totalShows}</strong><span>Shows</span></div>
      <div class="stat-box"><strong>${avgNota}</strong><span>Média</span></div>
      <div class="stat-box"><strong>${showsNota4Plus}</strong><span>Nota 4+</span></div>
      <div class="stat-box"><strong>${showsNota5}</strong><span>Nota 5</span></div>
    </div>
    <div class="history-distribution">💧 ${notaCounts[1]} | 😶 ${notaCounts[2]} | 🙂 ${notaCounts[3]} | 🔥 ${notaCounts[4]} | 🤯 ${notaCounts[5]}</div>
    ${runArchiveHtml ? `<h4>🏁 Arquivo de corridas:</h4><div class="history-list">${runArchiveHtml}</div>` : ""}
    <h4>📜 Últimos 10 shows:</h4>
    <div class="history-list">${historyHtml || '<div>Nenhum show ainda.</div>'}</div>
  `;

  displayNarration(`📊 Seu histórico de shows: ${totalShows} apresentações com média ${avgNota}. Você matou em ${showsNota4Plus} deles!`);
  setTimeout(() => { elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}


// ═══════════════════════════════════════════════════════════════════
// §23  HANDLERS: MATERIAL & JOKE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════


function showMaterialNotebookView() {
  uiMode = "viewMaterial";
  elements.subTitle.textContent = "📋 Todo o seu material";
  renderJokeList({ selectable: false });
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `<div>📊 Minutos totais: ${getTotalMinutes()} | Piadas: ${state.jokes.length}</div>`;
  setScene("event", "", getNotebookImageForTexto(state.texto || 10), false);
  displayNarration("📓 Você revisa o caderno e lembra quais piadas ainda valem subir ao palco.");
  setTimeout(() => { elements.jokeList.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

function handleViewMaterial() {
  exitSelectionMode();
  showMaterialNotebookView();
}

function handleSaveGame() {
  saveGameState();
  playSound('save');
  flashScreen('rgba(90, 143, 90, 0.25)');
  displayNarration("💾 Jogo salvo no seu navegador. Pode fechar o bloco e voltar quando quiser.");
}

function handleNewGameReset() {
  const confirmed = window.confirm("Tem certeza que deseja começar um Novo Jogo? Seu progresso salvo será apagado.");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function openSettingsMenu() {
  const options = Object.entries(THEME_PRESETS).map(([themeId, theme]) => {
    const selectedMark = state.theme === themeId ? " ✅" : "";
    return {
      label: `${theme.label}${selectedMark}`,
      handler: () => {
        applyTheme(themeId);
        saveGameState();
        updateStats(false);
        hideDialog();
        displayNarration(`🎨 Tema aplicado: ${theme.label}`);
      }
    };
  });
  options.push({ label: "Fechar", handler: hideDialog });
  showDialog("⚙️ Configurações\n\nEscolha um tema de cores:", options);
}

function deleteJoke(jokeId) {
  const jokeIndex = state.jokes.findIndex((joke) => joke.id === jokeId);
  if (jokeIndex === -1) return;

  const jokeElement = elements.jokeList.querySelector(`[data-id="${jokeId}"]`);
  if (jokeElement) { jokeElement.style.transition = 'all 0.3s ease'; jokeElement.style.opacity = '0'; jokeElement.style.transform = 'translateX(50px) scale(0.9)'; }

  setTimeout(() => {
    const [removed] = state.jokes.splice(jokeIndex, 1);
    selectedJokeIds.delete(jokeId);
    updateStats();
    renderJokeList({ selectable: false });
    if (uiMode === "viewMaterial") {
      elements.btnDivLow.style.display = "flex";
      elements.btnDivLow.innerHTML = `<div>📊 Minutos totais: ${getTotalMinutes()} | Piadas: ${state.jokes.length}</div>`;
    }
    displayNarration(`🗑️ ${removed.title} foi aposentada. Hora de escrever algo no lugar.`);
    saveGameState();
  }, 300);
}

function rewriteJoke(jokeId) {
  const joke = state.jokes.find((entry) => entry.id === jokeId);
  if (!joke) return;
  _rewritingJoke = joke;
  uiMode = "rewriting";

  const availTonesRw = getUnlockedTones();
  const availStructuresRw = getUnlockedStructures();
  const toneOptions = availTonesRw.map(tone => `<button class="tone-btn ${joke.tone === tone ? 'selected current' : ''}" data-tone="${tone}">${tone === joke.tone ? '📍 ' : ''}${tone}</button>`).join('');
  const structureOptions = availStructuresRw.map(struct => `<button class="structure-btn ${joke.structure === struct ? 'selected current' : ''}" data-structure="${struct}">${struct === joke.structure ? '📍 ' : ''}${struct.toUpperCase()}</button>`).join('');

  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div class="joke-customization">
      <h4>🎨 Novo tom (atual: ${joke.tone}):</h4>
      <div class="tone-buttons">${toneOptions}</div>
      <h4>🏗️ Nova estrutura (atual: ${joke.structure?.toUpperCase()}):</h4>
      <div class="structure-buttons">${structureOptions}</div>
      <div class="customization-hint">💡 Reescrever gasta 4 de motivação e gera novo potencial base aleatório</div>
    </div>
  `;

  _newTone = joke.tone;
  _newStructure = joke.structure;

  elements.btnDivLow.querySelectorAll('.tone-btn').forEach(btn => {
    btn.addEventListener('click', () => { elements.btnDivLow.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); _newTone = btn.dataset.tone; });
  });
  elements.btnDivLow.querySelectorAll('.structure-btn').forEach(btn => {
    btn.addEventListener('click', () => { elements.btnDivLow.querySelectorAll('.structure-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); _newStructure = btn.dataset.structure; });
  });

  showDialog(`Reescrever "${joke.title}"?`, [
    { label: "✅ Reescrever", handler: () => { hideDialog(); finalizeRewrite(); } },
    { label: "❌ Cancelar", handler: () => { hideDialog(); exitWritingMode(); clearPendingRewrite(); handleViewMaterial(); } }
  ]);

  setTimeout(() => { elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

function finalizeRewrite() {
  const joke = _rewritingJoke;
  if (!joke) { exitWritingMode(); return; }

  if (state.motivation < 4) {
    shakeScreen();
    displayNarration("⚠️ Você precisa de pelo menos 4 de motivação para reescrever. Descanse ou faça shows bem-sucedidos.");
    exitWritingMode(); handleViewMaterial(); return;
  }

  const nextStructure = _newStructure || joke.structure;
  const nextMinutes = getRandomMinutesForStructure(nextStructure);
  const currentTotalMinutes = getTotalMinutes();
  if (state.level === "open" && currentTotalMinutes - (joke.minutes || 0) + nextMinutes > 10) {
    shakeScreen();
    displayNarration("📝 Essa reescrita ficaria longa demais para seu caderno de Open. Apague material ou escolha uma estrutura mais curta.");
    clearPendingRewrite();
    exitWritingMode(); handleViewMaterial(); return;
  }

  state.motivation = clamp(state.motivation - 4, 0, 120);
  if (markCareerMilestone("firstRewrite")) {
    maybeTriggerCarvalhoDialog("firstRewrite", { jokeId: joke.id });
  }
  state.texto = clamp((state.texto || 0) + 1, 0, 200);
  const basePotential = generatePotential();
  const flowBonus = state.flowState?.active ? 0.1 : 0;
  const rewritePerkBonus = getPerkEffect('rewriteBonus');
  const classRewriteBonus = hasClassPassive("betterRewrite") ? 0.04 : 0;
  joke.truePotential = clamp(basePotential + (state.texto / 160) + flowBonus + rewritePerkBonus + classRewriteBonus, 0.2, 0.98);
  joke.tone = _newTone || joke.tone;
  joke.structure = nextStructure;
  joke.minutes = nextMinutes;
  joke.freshness = "reescrita";
  joke.history = [];
  joke.lastResult = "⏱️ reescrita, ainda não testada";
  incrementRouteCounter("rewriteCount");
  maybeCheckProgressionGates();

  const label = joke.truePotential > 0.7 ? "promissora" : joke.truePotential > 0.5 ? "com potencial" : "incerta";
  const xpGain = applyXp(XP_GAIN.jokeRewrite);

  clearPendingRewrite();
  exitWritingMode();
  flashScreen('rgba(212, 168, 75, 0.15)');
  displayNarration(`✏️ "${joke.title}" foi completamente reescrita! Tom: ${joke.tone}, estrutura: ${joke.structure.toUpperCase()}. ${joke.minutes} min. Parece ${label}. (+${xpGain} XP)`);
  handleViewMaterial();
  updateStats();
  saveGameState();
}


// ═══════════════════════════════════════════════════════════════════
// §24  BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  hydrateUI();
  attachEvents();
  bootGame();
});

function bootGame() {
  validateGameContent();
  state = loadGameState();
  applyTheme(state.theme || "classic");
  ensureCareerProgressState();
  updateStats();
  if (state.hasStarted && state.avatar) {
    enterGame(true);
    displayNarration(homeText);
    if (state.runState.status === "ended") {
      setTimeout(renderFinalizedRun, 300);
      return;
    }
    refreshRouteInviteAvailability("load");
    if (pendingEvent) {
      setTimeout(() => checkAndShowPendingEvent(), 1400);
    }

    // Catch-up: if player has unspent perk points
    if ((state.availablePerkPoints || 0) > 0) {
      setTimeout(() => showPerkSelectionDialog(), 1000);
    }
    setTimeout(() => maybeCheckProgressionGates(), 500);
  } else {
    startIntro();
  }
}

function attachEvents() {
  const addButtonEffects = (button, handler) => {
    button.addEventListener("click", (e) => {
      playSound('click');
      createRipple(e, button);
      button.style.transform = 'scale(0.95)';
      setTimeout(() => { button.style.transform = ''; }, 150);
      handler(e);
    });
  };

  addButtonEffects(elements.buttons.write, handleWriteJoke);
  addButtonEffects(elements.buttons.show, handleSearchShow);
  addButtonEffects(elements.buttons.material, handleViewMaterial);
  addButtonEffects(elements.buttons.save, handleSaveGame);
  addButtonEffects(elements.buttons.content, handleCreateContent);
  addButtonEffects(elements.buttons.study, handleStudy);
  addButtonEffects(elements.buttons.history, handleViewHistory);
  if (elements.buttons.credits) addButtonEffects(elements.buttons.credits, handleShowCredits);
  if (elements.buttons.newGame) addButtonEffects(elements.buttons.newGame, handleNewGameReset);
  if (elements.buttons.settings) addButtonEffects(elements.buttons.settings, openSettingsMenu);
  addButtonEffects(elements.btnContinuar, performShow);
  addButtonEffects(elements.btnEndDay, handleEndDay);
  addButtonEffects(elements.btnGoToShow, handleGoToScheduledShow);

  elements.jokeList.addEventListener("click", handleJokeListClick);
  elements.introContinue.addEventListener("click", (e) => { createRipple(e, elements.introContinue); advanceIntro(); });
  elements.avatarOptions.forEach((option) => option.addEventListener("click", (e) => { createRipple(e, option); selectAvatar(option.dataset.avatar); }));
  elements.dialogClose.addEventListener("click", hideDialog);

  if (elements.confirmNameBtn) elements.confirmNameBtn.addEventListener("click", confirmPlayerName);
  if (elements.playerNameInput) elements.playerNameInput.addEventListener("keypress", (e) => { if (e.key === "Enter") confirmPlayerName(); });
  if (elements.ending?.newRun) elements.ending.newRun.addEventListener("click", startNewRunAfterEnding);
  if (elements.ending?.archive) elements.ending.archive.addEventListener("click", viewArchiveFromEnding);
}
