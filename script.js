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
const LEGEND_TEXT = "🤯 explodiu | 🔥 matou | 🙂 segurou | 😶 risinhos | 💧 deu água";
const MAX_SCHEDULED_SHOWS = 3;

// ─── Time ───
const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
function getMaxActivityPoints() {
  if (state && state.madeIt) return 3;
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
const allowedTones = ["besteirol", "vulgar", "limpo", "humor negro", "hack"];

function getUnlockedTones() {
  const base = ["besteirol", "limpo", "vulgar", "humor negro"];
  if (state && state.levelNumber >= 5) base.push("hack");
  return base;
}

function getUnlockedStructures() {
  const base = ["oneliner", "bit"];
  if (state && (state.storytellingUnlocked || state.levelNumber >= 6)) base.push("storytelling");
  if (state && state.levelNumber >= 10) base.push("prop");
  return base;
}

const toneDescriptions = {
  besteirol: "besteiras descompromissadas",
  vulgar: "piadas pesadas sem filtro",
  limpo: "humor família e bobinho",
  "humor negro": "piadas azedas que dividem a sala",
  hack: "observações batidas porém eficientes"
};

const toneDescriptionsLong = {
  besteirol: "Humor bobo e descompromissado. Funciona bem com plateias relaxadas que querem rir sem pensar.",
  vulgar: "Piadas pesadas, linguagem explícita. Pode dividir a sala, mas conecta com quem curte.",
  limpo: "Humor família, sem palavrões. Ideal para corporativos e eventos diversos.",
  "humor negro": "Piadas sobre temas tabu. Pode ser brilhante ou desastroso dependendo da plateia.",
  hack: "Observações batidas mas eficientes. Todo mundo já ouviu, mas ainda funciona."
};

const structures = ["oneliner", "storytelling", "bit", "prop"];

const STRUCTURE_MINUTE_RANGES = {
  oneliner: [1, 1],
  prop: [1, 1],
  bit: [2, 3],
  storytelling: [3, 5]
};

const structureDescriptions = {
  oneliner: "Piada curta e direta, que não necessita de mais contexto. 1 min.",
  storytelling: "Uma narrativa, uma história com vários punchs. 3-5 min.",
  bit: "Sequência de piadas conectadas sobre um mesmo tema. 2-3 min.",
  prop: "Usa objetos ou elementos visuais para complementar a piada. 1 min."
};

const PROFILE_BADGE_LABELS = {
  storytellingUnlocked: { label: "📚 Storytelling", kind: "feature" },
  fiveA5Unlocked: { label: "⭐ 5 a 5", kind: "milestone" },
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
const scenes = {
  home: { title: "Apartamentinho", image: null },       // dynamic based on day
  writing: { title: "Bloco de notas", image: null },     // dynamic
  club: { title: "Clube", image: "copo-sujo-comedy.png" },
  bomb: { title: "Deu Água", image: "awful-show-1-out-5.png" },
  risinhos: { title: "Risinhos", image: "bad-show-2-out-5.png" },
  ok: { title: "Segurou", image: "good-show-3-out-5.png" },
  kill: { title: "Matou no Palco", image: "great-show-4-out-5.png" },
  explode: { title: "Explodiu!", image: "excellent-show-5-out-5.png" },
  content: { title: "Conteúdo em casa", image: null },   // dynamic
  study: { title: "Estudos e referências", image: null }, // dynamic
  event: { title: "", image: null },
  intro: { title: "Professor Carvalho", image: "carvalho.png" }
};

const avatarImages = {
  avatar1: "avatar.png",
  avatar2: "avatar2.png",
  avatar3: "avatar3.png",
  avatar4: "avatar4.png"
};

const confettiColors = ['#d4a84b', '#ffd966', '#f5e6c8', '#a65d4e', '#5a8f5a'];

// ─── Narrative strings ───
const homeText =
  "Você está em casa, à toa. Você tem certeza que será descoberto pelo mercado de comédia, já que se considera naturalmente muito mais engraçado que todo mundo que faz stand up. Apesar disso, talvez fosse uma boa ideia escrever piadas ou buscar show para se apresentar - só enquanto a fama não vem do nada...";

const mentorIntroLines = [
  "Olá! Meu nome é Illan Carvalho, mas no circuito me chamam de Professor Carvalho.",
  "Você vai ouvir muito conselho por aí. Na maior parte do tempo, é só outro comediante explicando como ele funciona.",
  "Estudar não é copiar especial. É entender como o comediante pensa, corta, acelera, constrói e reescreve.",
  "Seu trabalho é escrever, testar, ajustar e repetir até transformar palco em laboratório.",
  "Antes de te mandar pro ringue, me diz: quem é você nessa busca pela próxima risada?"
];


// ─── Perk Trees ───
const PERK_TREES = {
  texto: [
    { id: "premissaSolida", name: "Premissa Sólida", desc: "+10% potencial de piadas", level: 2, requires: null, effect: { jokePotentialBonus: 0.05 } },
    { id: "economiaDePalavras", name: "Economia de Palavras", desc: "+15% eficiência", level: 3, requires: "premissaSolida", effect: { jokeEfficiency: 0.15 } },
    { id: "tagMachine", name: "Tag Machine", desc: "Melhores rewrites", level: 5, requires: "economiaDePalavras", effect: { rewriteBonus: 0.1 } },
    { id: "callbackMaster", name: "Callback Master", desc: "+10% em sets longos (hacky)", level: 7, requires: null, effect: { longSetBonus: 0.1 }, warning: "hacky" },
    { id: "setupKiller", name: "Setup Killer", desc: "Setups mais fortes", level: 9, requires: "tagMachine", effect: { setupBonus: 0.08 } }
  ],
  entrega: [
    { id: "timingBasico", name: "Timing Básico", desc: "+10% delivery", level: 2, requires: null, effect: { deliveryBonus: 0.05 } },
    { id: "timingAvancado", name: "Timing Avançado", desc: "+20% delivery", level: 5, requires: "timingBasico", effect: { deliveryBonus: 0.1 } },
    { id: "presencaDePalco", name: "Presença de Palco", desc: "+15% em grandes plateias", level: 4, requires: null, effect: { bigCrowdBonus: 0.15 } },
    { id: "crowdWorkIniciante", name: "Crowd Work Iniciante", desc: "Bônus em interação", level: 3, requires: null, effect: { crowdWorkBonus: 0.05 } },
    { id: "crowdWorkPro", name: "Crowd Work Pro", desc: "Bônus forte em interação", level: 8, requires: "crowdWorkIniciante", effect: { crowdWorkBonus: 0.12 } },
    { id: "lidarComHeckler", name: "Lidar com Heckler", desc: "Defesa contra bombar", level: 6, requires: null, effect: { hecklerDefense: 0.1 } },
    { id: "energiaAlta", name: "Energia Alta", desc: "Mantém qualidade em sets longos", level: 10, requires: "timingAvancado", effect: { staminaBonus: 0.08 } }
  ]
};

// ─── Classes ───
const CLASSES = {
  comicoClassico: {
    name: "Cômico Clássico",
    desc: "Palco, texto autoral e consistência de show.",
    bonus: { texto: 6, entrega: 6 },
    passive: "stageConsistency",
    empReq: { texto: 42, entrega: 42 },
    opportunityTitle: "convite para lineups mais fortes do circuito",
    endingFlavor: "Você vira um nome confiável: alguém que pode entrar numa noite difícil e entregar 15 minutos de verdade."
  },
  roteirista: {
    name: "Roteirista",
    desc: "Escrita forte, lapidação e material para outros formatos.",
    bonus: { texto: 10 },
    passive: "betterRewrite",
    empReq: { texto: 50 },
    opportunityTitle: "primeiro trabalho escrevendo material profissional",
    endingFlavor: "Seu texto começa a circular fora da sua própria boca: quadros, vídeos, projetos e ideias que precisam de escrita cômica."
  },
  produtor: {
    name: "Produtor",
    desc: "Bastidor, agenda, networking e curadoria.",
    bonus: { network: 12 },
    passive: "betterShowOffers",
    empReq: { network: 42 },
    opportunityTitle: "convite para ajudar a produzir uma noite de comédia",
    endingFlavor: "Você entende que carreira não é só palco: é escala, bastidor, curadoria, horário, público e responsabilidade."
  },
  atorComico: {
    name: "Ator Cômico",
    desc: "Presença, personagem, corpo e performance.",
    bonus: { entrega: 10 },
    passive: "bigRoomDelivery",
    empReq: { entrega: 50 },
    opportunityTitle: "convite para um projeto de atuação cômica",
    endingFlavor: "Sua presença começa a abrir portas além do microfone: personagem, cena, corpo e timing visual."
  },
  influencer: {
    name: "Influencer",
    desc: "Conteúdo, clipes, público e presença digital.",
    bonus: { fans: 25 },
    passive: "contentBoost",
    empReq: { fans: 140 },
    opportunityTitle: "primeira collab/campanha de conteúdo cômico",
    endingFlavor: "Você percebe que público também é construção: clipe, recorrência, linguagem e gente esperando o próximo post."
  },
  professor: {
    name: "Professor",
    desc: "Técnica, estudo, método e formação.",
    bonus: { texto: 5, entrega: 5 },
    passive: "studyBoost",
    empReq: { texto: 45, entrega: 35 },
    opportunityTitle: "convite para auxiliar em uma oficina de comédia",
    endingFlavor: "Você transforma processo em método: aquilo que você sofreu para aprender começa a virar caminho para outros."
  }
};

function hasClassPassive(passiveId) {
  const cls = CLASSES[state.chosenClass];
  return cls?.passive === passiveId;
}

const CARVALHO_DIALOGS = [
  {
    id: "carvalho-first-show",
    trigger: "firstShow",
    stage: "open",
    priority: 110,
    once: true,
    text: "Professor Carvalho te segura por um minuto: 'É isso aqui. Você escolhe as piadas, testa no palco, presta atenção no que realmente aconteceu e volta pro caderno. As fortes ficam. As fracas você reescreve ou mata. Depois escreve material novo e repete. Set bom é repetição, não revelação.'",
    choices: [
      { label: "OK", effects: { motivation: 3, texto: 1 } }
    ]
  },
  {
    id: "carvalho-first-study",
    trigger: "firstStudy",
    stage: "open",
    priority: 105,
    once: true,
    text: "Carvalho aponta para a tela: 'Estudar não é sair falando igual ao comediante que você admira. É observar como ele pensa. Onde entra a premissa, onde corta gordura, como sustenta a tensão e onde vira a chave da piada. Rouba processo, não personalidade.'",
    choices: [
      { label: "OK", effects: { texto: 3, motivation: 2 } }
    ]
  },
  {
    id: "carvalho-first-rewrite",
    trigger: "firstRewrite",
    stage: "open",
    priority: 102,
    once: true,
    text: "Carvalho bate no caderno: 'Agora começou a parte séria. Escrever qualquer um escreve uma vez. Evoluir é voltar, cortar, trocar ordem, mexer no setup e insistir até a piada ficar mais honesta e mais forte.'",
    choices: [
      { label: "OK", effects: { texto: 4 } }
    ]
  },
  {
    id: "carvalho-first-bomb",
    trigger: "firstBomb",
    stage: "open",
    priority: 100,
    once: true,
    text: "Professor Carvalho aparece no camarim: 'Todo mundo toma água no começo. O erro agora é achar que o problema foi só coragem. Volta no set e transforma o constrangimento em informação: onde perdeu a sala, onde alongou demais, onde a ideia não se sustentou.'",
    choices: [
      { label: "OK", effects: { texto: 4, motivation: 4 } }
    ]
  },
  {
    id: "carvalho-first-kill",
    trigger: "firstKill",
    stage: "open",
    priority: 95,
    once: true,
    text: "Carvalho sorri: 'Boa noite. Agora esquece ego. A piada que matou hoje precisa matar de novo em outro público.'",
    choices: [
      { label: "OK", effects: { texto: 3, motivation: 2, network: 1 } }
    ]
  },
  {
    id: "carvalho-jokes10",
    trigger: "jokes10",
    stage: "open",
    priority: 93,
    once: true,
    text: "Carvalho folheia seu caderno: 'Agora para de colecionar fragmento como se quantidade fosse set. Dez piadas já te deixam ver padrão, voz e repetição de vício. Começa a pensar em bloco, contraste, ordem e no que realmente merece continuar vivo.'",
    choices: [
      { label: "OK", effects: { texto: 4, motivation: 2 } }
    ]
  },
  {
    id: "carvalho-consistency-streak",
    trigger: "consistencyStreak",
    stage: "open",
    priority: 92,
    once: true,
    text: "Carvalho cruza os braços: 'Uma noite boa anima. Três noites boas começam a dizer alguma coisa. Carreira não é pico, é consistência. O jogo agora é repetir nível, não caçar sensação.'",
    choices: [
      { label: "OK", effects: { motivation: 4, texto: 2 } }
    ]
  },
  {
    id: "carvalho-enter-elenco",
    trigger: "enterElenco",
    stage: "elenco",
    priority: 110,
    once: true,
    text: "Professor Carvalho: 'Bem-vindo ao Elenco.\n\nAté agora você escrevia piadas soltas.\nAgora você trabalha texto.\n\nA piada ainda é a unidade: premissa, virada, punchline, tag.\nMas o jogo mudou. Você precisa juntar várias piadas em blocos, testar ordem, ritmo, transição e consistência.\n\nCinco minutos bons chamam atenção.\nQuinze minutos sólidos começam uma carreira.'",
    choices: [
      { label: "OK", effects: { texto: 5, entrega: 3, network: 2 } }
    ]
  },
  {
    id: "carvalho-first-texto15",
    trigger: "firstTexto15",
    stage: "elenco",
    priority: 108,
    once: true,
    text: "Carvalho olha o texto montado: 'Quinze minutos não é juntar qualquer coisa até fechar a conta. É ritmo, ordem, respiro, entrada, saída. Agora você começa a sentir a diferença entre ter material e ter um texto de verdade.'",
    choices: [
      { label: "OK", effects: { texto: 4, entrega: 2, motivation: 3 } }
    ]
  },
  {
    id: "carvalho-enter-headliner",
    trigger: "enterHeadliner",
    stage: "headliner",
    priority: 120,
    once: true,
    text: "Carvalho ajeita o microfone e diz: 'Headliner não é status, é responsabilidade. Você sustenta uma noite inteira com assinatura autoral.'",
    choices: [
      { label: "OK", effects: { texto: 6, entrega: 3, fans: 8, motivation: 2 } }
    ]
  },
  {
    id: "carvalho-low-motivation",
    trigger: "lowMotivation",
    stage: "open",
    priority: 80,
    cooldown: 4,
    text: "Carvalho percebe seu cansaço: 'Disciplina sem recuperação vira burnout. Descansar também faz parte da carreira. Recupera o eixo antes de começar a repetir gesto vazio.'",
    choices: [
      { label: "OK", effects: { texto: 1, motivation: 8 } }
    ]
  }
];

const LEGACY_PATHS = [
  {
    id: "touring-purist",
    label: "Estrada e palco",
    description: "Priorizar consistência de palco e evolução de texto na rotina de turnês.",
    weights: { craft: 0.45, audience: 0.25, consistency: 0.3 }
  },
  {
    id: "studio-author",
    label: "Autor de referência",
    description: "Construir legado de escrita e formação de novos comediantes.",
    weights: { craft: 0.5, audience: 0.15, consistency: 0.35 }
  },
  {
    id: "media-hybrid",
    label: "Palco + mídia",
    description: "Equilibrar presença digital com credibilidade no circuito de comédia.",
    weights: { craft: 0.3, audience: 0.4, consistency: 0.3 }
  }
];


// ═══════════════════════════════════════════════════════════════════
// §2  DATA: IDEA POOL
// ═══════════════════════════════════════════════════════════════════

const ideaPool = [
  // ─── BESTEIROL (12) ───
  { seed: "fila de mercado às 23h", tone: "besteirol", baseMinutes: 1, place: "anotar no bloco enquanto espera o caixa", mood: "cotidiano" },
  { seed: "micro-ondas que apita alto", tone: "besteirol", baseMinutes: 1, place: "esquentar comida de madrugada escondido", mood: "insônia" },
  { seed: "coach de paquera em metrô lotado", tone: "besteirol", baseMinutes: 1, place: "voltar pra casa espremido no rush", mood: "transporte público" },
  { seed: "gente que leva marmita pro rolê", tone: "besteirol", baseMinutes: 1, place: "observar a galera nos botecos baratos", mood: "economia criativa" },
  { seed: "amigo que faz trilha sonora da própria vida", tone: "besteirol", baseMinutes: 1, place: "sair com amigos no fim de semana", mood: "comportamento" },
  { seed: "porteiro que sabe tudo da sua vida", tone: "besteirol", baseMinutes: 1, place: "conversa rápida no prédio", mood: "condomínio" },
  { seed: "pessoa que conta o sonho inteiro", tone: "besteirol", baseMinutes: 1, place: "café da manhã com colegas", mood: "social" },
  { seed: "cardápio de restaurante em inglês errado", tone: "besteirol", baseMinutes: 1, place: "almoçar fora no bairro", mood: "cotidiano" },
  { seed: "casal que faz tudo combinando roupa", tone: "besteirol", baseMinutes: 1, place: "passeio no shopping", mood: "relacionamentos" },
  { seed: "tio que manda bom dia no grupo às 5h", tone: "besteirol", baseMinutes: 1, place: "olhar celular ao acordar", mood: "família" },
  { seed: "áudio de WhatsApp de 7 minutos", tone: "besteirol", baseMinutes: 2, place: "receber mensagem do amigo prolixo", mood: "tecnologia" },
  { seed: "pessoa que fala 'com certeza absoluta'", tone: "besteirol", baseMinutes: 1, place: "reunião de trabalho", mood: "corporativo" },

  // ─── VULGAR (8) ───
  { seed: "banheiro químico em festival", tone: "vulgar", baseMinutes: 1, place: "aceitar fazer show em evento ao ar livre", mood: "perrengue" },
  { seed: "microfone compartilhado gripado", tone: "vulgar", baseMinutes: 1, place: "abrir o show depois de dez comediantes suados", mood: "higiene zero" },
  { seed: "academia às 6h da manhã", tone: "vulgar", baseMinutes: 1, place: "tentar entrar em forma", mood: "saúde" },
  { seed: "match que some após o encontro", tone: "vulgar", baseMinutes: 1, place: "usar app de relacionamento", mood: "dating" },
  { seed: "vizinho barulhento de madrugada", tone: "vulgar", baseMinutes: 2, place: "tentar dormir numa sexta", mood: "condomínio" },
  { seed: "motel com tema de castelo", tone: "vulgar", baseMinutes: 1, place: "passeio com a pessoa", mood: "relacionamentos" },
  { seed: "praia lotada no verão", tone: "vulgar", baseMinutes: 1, place: "férias no litoral", mood: "perrengue" },
  { seed: "depilação pela primeira vez", tone: "vulgar", baseMinutes: 1, place: "se preparar pra ocasião", mood: "autocuidado" },

  // ─── LIMPO (10) ───
  { seed: "sobrinho gamer no almoço", tone: "limpo", baseMinutes: 1, place: "visitar a família no domingo", mood: "família" },
  { seed: "grupo da família com fake news", tone: "limpo", baseMinutes: 2, place: "dar uma espiada no WhatsApp coletivo", mood: "treta doméstica" },
  { seed: "vizinho que toca sax às 6h", tone: "limpo", baseMinutes: 1, place: "tentar dormir mais um pouco no sábado", mood: "condomínio" },
  { seed: "avó que não entende celular", tone: "limpo", baseMinutes: 1, place: "visitar os avós", mood: "família" },
  { seed: "criança perguntando 'por quê' infinitamente", tone: "limpo", baseMinutes: 1, place: "cuidar do filho do amigo", mood: "crianças" },
  { seed: "cachorro que late pra própria sombra", tone: "limpo", baseMinutes: 1, place: "passear com o pet", mood: "animais" },
  { seed: "pai que não pede informação", tone: "limpo", baseMinutes: 1, place: "viagem de carro em família", mood: "família" },
  { seed: "mãe no supermercado encontrando conhecida", tone: "limpo", baseMinutes: 2, place: "fazer compras com a mãe", mood: "família" },
  { seed: "dentista tentando conversar durante procedimento", tone: "limpo", baseMinutes: 1, place: "ir ao dentista", mood: "cotidiano" },
  { seed: "professor de autoescola nervoso", tone: "limpo", baseMinutes: 1, place: "tentar tirar carteira", mood: "aprendizado" },

  // ─── HUMOR NEGRO (10) ───
  { seed: "aplicativo de meditação que grita", tone: "humor negro", baseMinutes: 1, place: "instalar app suspeito pra controlar ansiedade", mood: "autoajuda quebrada" },
  { seed: "médico que receita férias", tone: "humor negro", baseMinutes: 2, place: "marcar consulta só pra ter atestado", mood: "corporativo" },
  { seed: "empresa que faz festa sem bebida", tone: "humor negro", baseMinutes: 2, place: "aceitar corporativo às pressas", mood: "falta de noção" },
  { seed: "terapeuta que precisa de terapia", tone: "humor negro", baseMinutes: 1, place: "sessão semanal", mood: "saúde mental" },
  { seed: "consulta de 5 minutos após 2h de espera", tone: "humor negro", baseMinutes: 1, place: "ir ao posto de saúde", mood: "sistema público" },
  { seed: "férias que cansam mais que trabalho", tone: "humor negro", baseMinutes: 1, place: "voltar de viagem", mood: "cansaço" },
  { seed: "amigo MLM que some e reaparece vendendo", tone: "humor negro", baseMinutes: 1, place: "receber mensagem suspeita", mood: "social" },
  { seed: "velório com wifi", tone: "humor negro", baseMinutes: 1, place: "situação delicada", mood: "morte" },
  { seed: "ansiedade de domingo às 18h", tone: "humor negro", baseMinutes: 1, place: "fim de semana acabando", mood: "trabalho" },
  { seed: "remédio com lista de efeitos colaterais", tone: "humor negro", baseMinutes: 1, place: "ler bula na farmácia", mood: "saúde" },

  // ─── HACK (10) ───
  { seed: "motorista de app coach", tone: "hack", baseMinutes: 1, place: "topar uma corrida aleatória no subúrbio", mood: "sobrevivência urbana" },
  { seed: "manual de geladeira com Bluetooth", tone: "hack", baseMinutes: 1, place: "fuçar tralhas tecnológicas do primo", mood: "futuro inútil" },
  { seed: "curso online de charuto artesão", tone: "hack", baseMinutes: 2, place: "cair em anúncios estranhos às 3h", mood: "internet" },
  { seed: "influencer fazendo publi de imposto", tone: "hack", baseMinutes: 1, place: "rolar o feed até perder a noção do tempo", mood: "mídia" },
  { seed: "comida de avião", tone: "hack", baseMinutes: 1, place: "voo longo", mood: "viagem" },
  { seed: "diferença de supermercado caro e barato", tone: "hack", baseMinutes: 1, place: "fazer compras do mês", mood: "economia" },
  { seed: "wifi de hotel que não funciona", tone: "hack", baseMinutes: 1, place: "viagem a trabalho", mood: "tecnologia" },
  { seed: "atendimento robotizado que não entende", tone: "hack", baseMinutes: 1, place: "ligar pro banco", mood: "burocracia" },
  { seed: "reunião que podia ser email", tone: "hack", baseMinutes: 1, place: "rotina de escritório", mood: "corporativo" },
  { seed: "GPS que manda por caminho absurdo", tone: "hack", baseMinutes: 1, place: "dirigir na cidade", mood: "tecnologia" }
];


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
  return {
    ...show,
    careerStage: stage,
    audienceType: show.audienceType || inferShowAudienceType(show),
    setLengthTarget: show.setLengthTarget || show.minMinutes,
    riskProfile: show.riskProfile || inferShowRiskProfile(show),
    rewardProfile: show.rewardProfile || inferShowRewardProfile(show, stage),
    socialExposure: show.socialExposure || inferShowSocialExposure(show)
  };
}

const showPool = [
  // ─── Regular venues ───
  {
    id: "bar-do-tony", name: "Bar do Tony - Quarta do Riso", minMinutes: 5, difficulty: 0.25,
    crowd: "Clientes distraídos, olhando pra TV, só param pra ouvir causos pessoais que parecem verdade.",
    intro: "Tony te chamou pra completar a noite. Plateia espalhada, TV ligada no jogo. Só sobe quem confia no próprio texto.",
    image: "bar-do-tony.png", vibeHint: "Narrativas sinceras e paranoias do dia a dia seguram a atenção.",
    typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.2, "humor negro": -0.2, limpo: 0.6, hack: 0.4 }
  },
  {
    id: "corporativo", name: "Coffee Break Corporativo", minMinutes: 6, difficulty: 0.4,
    crowd: "Executivos que riem só pra aliviar a tensão antes de falar de metas e planilhas.",
    intro: "Um RH desesperado quer 'algo leve' antes da palestra sobre metas. Não fale palavrão e tente parecer profissional.",
    image: "corporativo.png", vibeHint: "Comentários sobre trabalho e situações absurdas salvam sua pele.",
    typeAffinity: { default: -0.2, besteirol: -0.1, vulgar: -0.8, "humor negro": -0.5, limpo: 0.7, hack: 0.6 }
  },
  {
    id: "boteco-esquina", name: "Boteco da Esquina", minMinutes: 4, difficulty: 0.2,
    crowd: "Galera barulhenta que grita com o jogo e só escuta confidentes que parecem amigos.",
    intro: "O dono do boteco libera o microfone durante o intervalo do futebol. Você tem poucos minutos antes da próxima rodada de chope.",
    image: "barzinho.png", vibeHint: "Piadas toscas e confissões pessoais se destacam.",
    typeAffinity: { default: -0.05, besteirol: 0.6, vulgar: 0.2, "humor negro": 0.1, limpo: -0.3, hack: 0 }
  },
  {
    id: "festival-praia", name: "Festival de Praia", minMinutes: 6, difficulty: 0.35,
    crowd: "Turistas queimados de sol, crianças correndo e ninguém muito sóbrio.",
    intro: "Uma tenda cultural te chama para preencher a programação. O vento leva metade das palavras, então precisa ser direto.",
    image: "outdoor-gig.png", vibeHint: "Storytelling curto com finais absurdos prende a atenção.",
    typeAffinity: { default: -0.15, besteirol: 0.3, vulgar: 0.4, "humor negro": -0.2, limpo: 0.2, hack: 0.1 }
  },
  {
    id: "shopping-familia", name: "Noite Família no Shopping", minMinutes: 5, difficulty: 0.22,
    crowd: "Casais com crianças e seguranças atentos.",
    intro: "O shopping resolveu apostar em stand-up 'para toda a família'. Microfone impecável, tolerância a palavrões próxima de zero.",
    image: "mall.png", vibeHint: "Material limpo com observações sobre cotidiano ganha pontos.",
    typeAffinity: { default: 0, besteirol: 0.2, vulgar: -0.6, "humor negro": -0.5, limpo: 0.7, hack: 0.3 }
  },
  {
    id: "after-hours", name: "After Hours Subúrbio", minMinutes: 5, difficulty: 0.4,
    crowd: "Comediantes cansados e insônia coletiva às 2h da manhã.",
    intro: "Você caiu na lista do show secreto após a meia-noite. Só funciona se você ousar testar as coisas mais estranhas.",
    image: "motorcycle-club.png", vibeHint: "Humor negro e bits experimentais são esperados.",
    typeAffinity: { default: -0.1, besteirol: 0, vulgar: 0.2, "humor negro": 0.7, limpo: -0.4, hack: -0.2 }
  },
  {
    id: "casa-de-swing", name: "Casa de Swing", minMinutes: 5, difficulty: 0.42,
    crowd: "Adultos em mesas baixas, clima de flerte e risadas desconfortáveis esperando alguém quebrar o gelo.",
    intro: "Uma casa noturna adulta quer stand-up antes da pista esquentar. O ambiente é estranho, íntimo e zero família.",
    image: "casa-de-swing.png", vibeHint: "Ousadia, vulgaridade controlada e leitura de sala fazem a diferença.",
    typeAffinity: { default: -0.05, besteirol: 0.2, vulgar: 0.7, "humor negro": 0.3, limpo: -0.7, hack: 0.1 }
  },
  {
    id: "bem-bolado", name: "Bem Bolado", minMinutes: 5, difficulty: 0.3,
    crowd: "Plateia relaxada demais, rindo atrasado e perdendo o fio se a piada demora muito.",
    intro: "Um lounge temático de cannabis abriu espaço para comédia. O clima é lento, verde e cheio de gente filosofando no sofá.",
    image: "bem-bolado.png", vibeHint: "Besteirol, observações absurdas e ritmo simples funcionam melhor.",
    typeAffinity: { default: 0.05, besteirol: 0.7, vulgar: 0.2, "humor negro": 0.1, limpo: 0, hack: 0.3 }
  },
  {
    id: "teatro-limpo", name: "Teatro Municipal - Noite Limpa", minMinutes: 7, difficulty: 0.5,
    crowd: "Plateia educada, paga e extremamente crítica.",
    intro: "A prefeitura convidou novos talentos para um mini-festival. Som perfeito, mas você precisa merecer cada aplauso.",
    image: "teatro-municipal.png", vibeHint: "Estruturas sólidas e bits inteligentes brilham.",
    typeAffinity: { default: -0.05, besteirol: -0.2, vulgar: -0.5, "humor negro": 0.2, limpo: 0.6, hack: 0.3 }
  },
  {
    id: "podcast-live", name: "Podcast Ao Vivo", minMinutes: 4, difficulty: 0.3,
    crowd: "Fãs de comédia que conhecem cada referência.",
    intro: "Um podcast famoso abre espaço para sets curtos entre entrevistas. Tudo vira clipe em segundos.",
    image: "podcast.png", vibeHint: "Piadas autorreferenciais e material sobre bastidores funcionam.",
    typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: -0.1, "humor negro": 0.2, limpo: 0.1, hack: 0.5 }
  },
  {
    id: "barbearia", name: "Barbearia Comedy Night", minMinutes: 4, difficulty: 0.25,
    crowd: "Clientes esperando corte e barbeiros que comentam o set.",
    intro: "Uma barbearia hipster decidiu fazer stand-up entre cortes de cabelo. Espaço apertado, vibe íntima.",
    image: "barber-shop.png", vibeHint: "Observações hack e bits sobre aparência conectam.",
    typeAffinity: { default: 0, besteirol: 0.2, vulgar: -0.2, "humor negro": -0.1, limpo: 0.3, hack: 0.4 }
  },
  {
    id: "sarau-poesia", name: "Sarau de Poesia e Riso", minMinutes: 3, difficulty: 0.18,
    crowd: "Artistas indie que apreciam textos autorais.",
    intro: "Você foi convidado para quebrar a seriedade de um sarau. Precisa ser inteligente sem desrespeitar ninguém.",
    image: "art-gallery.png", vibeHint: "Storytelling poético e humor reflexivo ganham destaque.",
    typeAffinity: { default: 0.05, besteirol: -0.2, vulgar: -0.4, "humor negro": 0.2, limpo: 0.4, hack: 0.1 }
  },
  {
    id: "rooftop-tech", name: "Rooftop Tech Meetup", minMinutes: 5, difficulty: 0.32,
    crowd: "Startupeiros ansiosos que só falam de app e rodadas de investimento.",
    intro: "Uma startup contratou comediantes para descontrair o happy hour. Cuidado para não ofender futuros contratantes.",
    image: "rooftop-tech-meetup.png", vibeHint: "Piadas sobre tecnologia e trabalho remoto pontuam bem.",
    typeAffinity: { default: 0, besteirol: -0.1, vulgar: -0.5, "humor negro": 0.2, limpo: 0.3, hack: 0.6 }
  },
  {
    id: "metro-linha-azul", name: "Linha Azul After-Work", minMinutes: 3, difficulty: 0.27,
    crowd: "Passageiros cansados que só querem chegar em casa.",
    intro: "Uma ação cultural leva stand-up para o vagão especial. Você tem pouco tempo entre as estações.",
    image: "metro-comedy.png", vibeHint: "One-liners rápidos e humor sobre transporte são essenciais.",
    typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.3, "humor negro": 0, limpo: 0.2, hack: 0.5 }
  },
  {
    id: "noite-feminina", name: "Noite Feminina no Comedy", minMinutes: 5, difficulty: 0.28,
    crowd: "Plateia engajada que valoriza autenticidade.",
    intro: "Você foi convidado para uma noite temática com curadoria cuidadosa. Respeito e vulnerabilidade são chave.",
    image: "bar-do-tony.png", vibeHint: "Storytelling sincero e observações afiadas funcionam bem.",
    typeAffinity: { default: 0.1, besteirol: -0.1, vulgar: -0.4, "humor negro": 0.2, limpo: 0.4, hack: 0.2 }
  },
  {
    id: "veterano-turne", name: "Turnê do Veterano", minMinutes: 7, difficulty: 0.45,
    crowd: "Fãs fiéis do headliner, exigentes com quem abre o show.",
    intro: "Um veterano te entrega 7 minutos antes do set principal. Não desperdice o palco lotado.",
    image: "comedy-turne-veterano.png", vibeHint: "Bits bem estruturados e humor profissional impressionam.",
    typeAffinity: { default: -0.1, besteirol: 0, vulgar: -0.3, "humor negro": 0.3, limpo: 0.4, hack: 0.5 }
  },
  {
    id: "corporativo-surpresa", name: "Coffee Break Emergencial", minMinutes: 6, difficulty: 0.55,
    crowd: "Equipe exausta de vendas que precisa sorrir para continuar.",
    intro: "O RH te liga de última hora: o palestrante principal atrasou e você precisa segurar o clima.",
    image: "coffee-break.png", vibeHint: "Piadas limpas sobre trabalho e improvisos corporativos salvam.",
    typeAffinity: { default: -0.2, besteirol: -0.1, vulgar: -0.7, "humor negro": -0.3, limpo: 0.6, hack: 0.7 }
  },
  {
    id: "bar-universitario", name: "Open Mic Universitário", minMinutes: 4, difficulty: 0.18,
    crowd: "Estudantes bêbados que riem de qualquer coisa depois das 23h.",
    intro: "Um bar perto da faculdade abre espaço para novatos. Público jovem e barulhento.",
    image: "open-universitario.png", vibeHint: "Besteirol e vulgaridade funcionam bem com essa galera.",
    typeAffinity: { default: 0, besteirol: 0.7, vulgar: 0.5, "humor negro": 0.2, limpo: -0.2, hack: 0.2 }
  },
  {
    id: "livraria-cultural", name: "Livraria & Riso", minMinutes: 5, difficulty: 0.3,
    crowd: "Intelectuais com café na mão, buscando humor sofisticado.",
    intro: "Uma livraria cult quer animar as noites de sábado com stand-up entre as estantes.",
    image: "biblioteca.png", vibeHint: "Referências culturais e humor inteligente impressionam.",
    typeAffinity: { default: 0, besteirol: -0.2, vulgar: -0.5, "humor negro": 0.4, limpo: 0.5, hack: 0.3 }
  },
  {
    id: "pub-irlandes", name: "Pub O'Laughs", minMinutes: 5, difficulty: 0.28,
    crowd: "Gringos expatriados e brasileiros que fingem entender inglês.",
    intro: "Um pub irlandês faz noite de comédia bilíngue. Sotaque não é problema.",
    image: "pub.png", vibeHint: "Piadas universais sobre comportamento funcionam em qualquer língua.",
    typeAffinity: { default: 0.1, besteirol: 0.4, vulgar: 0.1, "humor negro": 0.2, limpo: 0.3, hack: 0.4 }
  },
  {
    id: "churrascaria", name: "Comedy & Carne", minMinutes: 4, difficulty: 0.22,
    crowd: "Famílias em rodízio que não vieram pra prestar atenção.",
    intro: "Uma churrascaria resolveu colocar entretenimento. Concorra com a picanha.",
    image: "churrascaria-comedy.png", vibeHint: "Material limpo e observações sobre comida ganham a mesa.",
    typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.4, "humor negro": -0.3, limpo: 0.6, hack: 0.4 }
  },
  {
    id: "teatro-alternativo", name: "Teatro do Porão", minMinutes: 6, difficulty: 0.38,
    crowd: "Plateia cult que curte o underground e detesta o mainstream.",
    intro: "Um teatro de porão te convida para a noite experimental. Vale tudo.",
    image: "basement-theater.png", vibeHint: "Ousadia e originalidade são mais importantes que punchlines perfeitas.",
    typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: 0.3, "humor negro": 0.6, limpo: -0.3, hack: -0.2 }
  },
  {
    id: "stand-up-sertanejo", name: "Riso & Viola", minMinutes: 5, difficulty: 0.25,
    crowd: "Fãs de sertanejo entre uma música e outra do show principal.",
    intro: "Uma casa de shows sertaneja quer esquentar a plateia antes da banda.",
    image: "sertanejo-house.png", vibeHint: "Piadas sobre interior, família e relacionamento agradam.",
    typeAffinity: { default: 0, besteirol: 0.4, vulgar: 0.2, "humor negro": -0.2, limpo: 0.5, hack: 0.3 }
  },
  {
    id: "hostel-mochileiro", name: "Backpacker Comedy", minMinutes: 4, difficulty: 0.2,
    crowd: "Mochileiros de todas as idades compartilhando histórias de viagem.",
    intro: "Um hostel faz noite de talentos. Qualquer um pode subir.",
    image: "copo-sujo-comedy.png", vibeHint: "Histórias de perrengue e observações culturais conectam.",
    typeAffinity: { default: 0.1, besteirol: 0.5, vulgar: 0.2, "humor negro": 0.1, limpo: 0.3, hack: 0.3 }
  },
  {
    id: "casamento", name: "Festa de Casamento", minMinutes: 6, difficulty: 0.45,
    crowd: "Parentes que não se veem há anos e amigos bêbados dos noivos.",
    intro: "Os noivos te contrataram para o brinde. Não estrague o dia mais importante deles.",
    image: "wedding.png", vibeHint: "Piadas sobre relacionamento e família, mas sem ser ofensivo.",
    typeAffinity: { default: -0.1, besteirol: 0.2, vulgar: -0.6, "humor negro": -0.4, limpo: 0.7, hack: 0.4 }
  },
  {
    id: "show-beneficente", name: "Stand-Up Solidário", minMinutes: 5, difficulty: 0.3,
    crowd: "Pessoas generosas que pagaram ingresso caro por uma boa causa.",
    intro: "Um evento beneficente te convida. A causa é nobre, a pressão também.",
    image: "bar-do-tony.png", vibeHint: "Humor leve e positivo. Nada que estrague o clima de caridade.",
    typeAffinity: { default: 0.1, besteirol: 0.2, vulgar: -0.5, "humor negro": -0.2, limpo: 0.6, hack: 0.3 }
  },
  {
    id: "cervejaria-artesanal", name: "Cervejaria & Comédia", minMinutes: 5, difficulty: 0.24,
    crowd: "Hipsters com barba provando IPAs e falando de lúpulo.",
    intro: "Uma cervejaria artesanal faz noite de stand-up entre as torneiras.",
    image: "cervejaria.png", vibeHint: "Observações sobre comportamento urbano e tendências funcionam.",
    typeAffinity: { default: 0.1, besteirol: 0.3, vulgar: 0.1, "humor negro": 0.3, limpo: 0.2, hack: 0.5 }
  },
  {
    id: "sindicato", name: "Show do Sindicato", minMinutes: 6, difficulty: 0.35,
    crowd: "Trabalhadores em assembleia que querem descontrair.",
    intro: "O sindicato te chamou para a confraternização anual. Público exigente.",
    image: "sindicato-hall.png", vibeHint: "Piadas sobre trabalho e patrão funcionam. Evite política direta.",
    typeAffinity: { default: 0, besteirol: 0.2, vulgar: 0.1, "humor negro": 0.3, limpo: 0.3, hack: 0.5 }
  },
  {
    id: "festa-junina", name: "Arraiá do Riso", minMinutes: 4, difficulty: 0.2,
    crowd: "Famílias em festa com quentão na mão e chapéu de palha.",
    intro: "Uma festa junina de bairro te convida para animar entre as quadrilhas.",
    image: "arraia.png", vibeHint: "Humor família e piadas sobre tradições caem bem.",
    typeAffinity: { default: 0.1, besteirol: 0.5, vulgar: -0.3, "humor negro": -0.2, limpo: 0.6, hack: 0.3 }
  },
  {
    id: "show-lgbtq", name: "Rainbow Comedy", minMinutes: 5, difficulty: 0.28,
    crowd: "Comunidade LGBTQ+ que valoriza autenticidade e ousadia.",
    intro: "Uma casa noturna LGBTQ+ faz noite de stand-up. Seja você mesmo.",
    image: "rainbow-nightclub.png", vibeHint: "Autenticidade e humor sobre experiências pessoais conectam.",
    typeAffinity: { default: 0.15, besteirol: 0.3, vulgar: 0.4, "humor negro": 0.3, limpo: 0.1, hack: 0.2 }
  },
  {
    id: "republica", name: "Comedy na República", minMinutes: 4, difficulty: 0.15,
    crowd: "Universitários em festa que só querem rir e beber.",
    intro: "Uma república estudantil abriu as portas para um show informal.",
    image: "republica.png", vibeHint: "Qualquer coisa que seja escandalosa ou boba funciona.",
    typeAffinity: { default: 0.1, besteirol: 0.6, vulgar: 0.6, "humor negro": 0.3, limpo: -0.2, hack: 0.2 }
  },
  {
    id: "restaurante-japones", name: "Sushi & Stand-Up", minMinutes: 5, difficulty: 0.32,
    crowd: "Clientes de restaurante japonês sofisticado.",
    intro: "Um restaurante japonês chique quer inovar com entretenimento.",
    image: "sushi-restaurant.png", vibeHint: "Humor sutil e observações refinadas agradam.",
    typeAffinity: { default: 0, besteirol: -0.1, vulgar: -0.5, "humor negro": 0.2, limpo: 0.5, hack: 0.4 }
  },
  {
    id: "stand-up-feminino", name: "Ladies' Night Comedy", minMinutes: 5, difficulty: 0.26,
    crowd: "Mulheres em noite só delas, celebrando juntas.",
    intro: "Uma noite de comédia só para mulheres. Ambiente acolhedor e empoderado.",
    image: "bar-do-tony.png", requiresAvatar: ["avatar3", "avatar4"],
    vibeHint: "Experiências genuínas e observações sobre o dia a dia conectam.",
    typeAffinity: { default: 0.1, besteirol: 0.3, vulgar: 0.2, "humor negro": 0.2, limpo: 0.4, hack: 0.3 }
  },
  {
    id: "parque-ao-ar-livre", name: "Comedy no Parque", minMinutes: 5, difficulty: 0.35,
    crowd: "Famílias passeando no domingo, crianças correndo.",
    intro: "Um evento cultural no parque te chama. Som ao ar livre, público disperso.",
    image: "park-comedy.png", vibeHint: "Material limpo e energia alta para segurar atenção.",
    typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.6, "humor negro": -0.4, limpo: 0.6, hack: 0.3 }
  },
  {
    id: "microfone-aberto-padaria", name: "Microfone Aberto da Padaria", minMinutes: 3, difficulty: 0.12,
    requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 4,
    crowd: "Clientes do bairro esperando pão na chapa e café.",
    intro: "A padaria liberou um cantinho para talentos locais. Público simpático, mas impaciente.",
    image: "padaria-open-mic.png", vibeHint: "Observações cotidianas simples e diretas funcionam melhor.",
    typeAffinity: { default: 0.1, besteirol: 0.5, vulgar: -0.2, "humor negro": 0, limpo: 0.6, hack: 0.2 }
  },
  {
    id: "quinta-do-calouro", name: "Quinta do Calouro", minMinutes: 3, difficulty: 0.16,
    requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 4,
    crowd: "Comediantes iniciantes torcendo uns pelos outros.",
    intro: "Noite de estreia para quem está começando. Ambiente acolhedor, porém caótico.",
    image: "open-universitario.png", vibeHint: "Texto curto com punchline clara e energia alta ajuda muito.",
    typeAffinity: { default: 0.1, besteirol: 0.6, vulgar: 0.2, "humor negro": 0.1, limpo: 0.2, hack: 0.2 }
  },
  {
    id: "rodada-trabalho", name: "Rodada do Pós-Trampo", minMinutes: 4, difficulty: 0.2,
    requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 5,
    crowd: "Gente cansada do trabalho querendo rir sem pensar muito.",
    intro: "Você pegou o último slot do pós-trampo. Plateia cansada, mas aberta a bons causos.",
    image: "coffee-break.png", vibeHint: "Piadas sobre rotina e trabalho conectam rápido.",
    typeAffinity: { default: 0.05, besteirol: 0.3, vulgar: -0.3, "humor negro": 0.1, limpo: 0.5, hack: 0.4 }
  },
  {
    id: "sarjeta-comedy", name: "Sarjeta Comedy 23h", minMinutes: 3, difficulty: 0.24,
    requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 4,
    crowd: "Mesa pequena, barulhenta e sem filtro no fim da noite.",
    intro: "Último bloco da noite. Se você não ganhar a sala em 30 segundos, já era.",
    image: "motorcycle-club.png", vibeHint: "Entrada forte e ritmo acelerado salvam o set.",
    typeAffinity: { default: -0.05, besteirol: 0.4, vulgar: 0.4, "humor negro": 0.4, limpo: -0.4, hack: 0.2 }
  },
  {
    id: "teste-domingo-praca", name: "Teste de Domingo na Praça", minMinutes: 4, difficulty: 0.18,
    requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 5,
    crowd: "Público variado, de família a curiosos de passagem.",
    intro: "Evento comunitário de domingo. Ótimo para testar material sem tanta pressão.",
    image: "park-comedy.png", vibeHint: "Material limpo e observações universais vão melhor aqui.",
    typeAffinity: { default: 0.1, besteirol: 0.4, vulgar: -0.4, "humor negro": -0.1, limpo: 0.6, hack: 0.3 }
  },
  {
    id: "navio-cruzeiro", name: "Comedy no Cruzeiro", minMinutes: 7, difficulty: 0.4, requiresLevel: "elenco",
    crowd: "Passageiros de cruzeiro de todas as idades e origens.",
    intro: "Um cruzeiro te contrata para a temporada. Público cativo e variado.",
    image: "cruise-lounge-comedy.png", vibeHint: "Humor universal, nada muito local ou nichado.",
    typeAffinity: { default: 0.05, besteirol: 0.3, vulgar: -0.3, "humor negro": -0.1, limpo: 0.5, hack: 0.5 }
  },
  {
    id: "programa-tv", name: "Participação em TV", minMinutes: 4, difficulty: 0.5, requiresLevel: "elenco",
    crowd: "Plateia de programa de TV, câmeras ligadas.",
    intro: "Você foi chamado para um quadro de comédia na TV. É sua chance de aparecer.",
    image: "tv-studio-comedy.png", vibeHint: "Material polido e timing perfeito. Cada segundo conta.",
    typeAffinity: { default: 0, besteirol: 0.2, vulgar: -0.6, "humor negro": -0.3, limpo: 0.6, hack: 0.5 }
  },
  {
    id: "elenco-porao-segunda", name: "Circuito Elenco - Porão da Segunda", minMinutes: 8, difficulty: 0.42,
    requiresCareerStage: "elenco", isElencoCircuit: true, setLengthTarget: 15,
    crowd: "Público que acompanha comédia de perto e cobra material consistente.",
    intro: "Noite de elenco no porão. Você tem 15 minutos para segurar a sala sem muleta.",
    image: "basement-theater.png", vibeHint: "Consistência e ritmo importam mais que explosões isoladas.",
    typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: -0.2, "humor negro": 0.3, limpo: 0.4, hack: 0.4 }
  },
  {
    id: "elenco-comedy-quarta", name: "Circuito Elenco - Quarta de Casa Cheia", minMinutes: 8, difficulty: 0.45,
    requiresCareerStage: "elenco", isElencoCircuit: true, setLengthTarget: 15,
    crowd: "Plateia pagante acostumada com lineups fortes e comparações cruéis.",
    intro: "A produção te deu 15 minutos no meio da grade. Sem ritmo, o público te engole.",
    image: "bar-do-tony.png", vibeHint: "Transições sólidas e fechamento forte definem a noite.",
    typeAffinity: { default: 0.05, besteirol: 0.2, vulgar: -0.3, "humor negro": 0.3, limpo: 0.4, hack: 0.4 }
  },
  {
    id: "elenco-coletivo-domingo", name: "Circuito Elenco - Coletivo de Domingo", minMinutes: 7, difficulty: 0.38,
    requiresCareerStage: "elenco", isElencoCircuit: true, setLengthTarget: 15,
    crowd: "Comediantes e fãs fiéis analisando cada escolha de set.",
    intro: "Domingo de coletivo: 15 minutos para provar que seu material aguenta repetição semanal.",
    image: "copo-sujo-comedy.png", vibeHint: "Material autoral e controle de energia fazem diferença.",
    typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: -0.2, "humor negro": 0.4, limpo: 0.3, hack: 0.4 }
  },
  {
    id: "solo-lab-preview", name: "Solo Lab - Preview de 25", minMinutes: 12, difficulty: 0.5,
    requiresCareerStage: "headliner", isHeadlinerSoloPipeline: true, headlinerSoloTier: "preview", setLengthTarget: 25,
    crowd: "Público fiel e crítico que repara em cada transição.",
    intro: "Você ganhou 25 minutos para testar o solo. Aqui, set ruim vira rumor na cidade inteira.",
    image: "teatro-municipal.png", vibeHint: "Ritmo, narrativa e consistência valem mais que punchline isolada.",
    typeAffinity: { default: 0.15, besteirol: 0.1, vulgar: -0.2, "humor negro": 0.4, limpo: 0.3, hack: 0.4 }
  },
  {
    id: "solo-noite-principal", name: "Noite Principal - Solo Completo", minMinutes: 15, difficulty: 0.58,
    requiresCareerStage: "headliner", isHeadlinerSoloPipeline: true, headlinerSoloTier: "main", setLengthTarget: 30,
    requiredNetwork: 90, requiredFans: 2500,
    crowd: "Casa cheia para te ver como atração principal. Expectativa máxima.",
    intro: "A noite é sua. Você carrega a casa inteira com seu texto e presença.",
    image: "pedestal.png", vibeHint: "Fechar forte e manter narrativa contínua são obrigatórios.",
    typeAffinity: { default: 0.2, besteirol: 0.2, vulgar: 0, "humor negro": 0.3, limpo: 0.3, hack: 0.3 }
  },
  {
    id: "taping-especial", name: "Gravação de Especial", minMinutes: 20, difficulty: 0.62,
    requiresCareerStage: "headliner", requiresSpecialTapeBooked: true,
    isHeadlinerSoloPipeline: true, isSpecialTapeShow: true, headlinerSoloTier: "special", setLengthTarget: 35,
    crowd: "Público lotado, câmeras rodando e pressão máxima para entregar seu melhor texto.",
    intro: "Hoje é a gravação do seu especial. Cada minuto vai virar registro da sua carreira.",
    image: "teatro-municipal.png", vibeHint: "Consistência, ritmo e fechamento forte definem o legado do especial.",
    typeAffinity: { default: 0.25, besteirol: 0.2, vulgar: 0.1, "humor negro": 0.3, limpo: 0.3, hack: 0.2 }
  },
  {
    id: "show-solo", name: "Seu Próprio Show", minMinutes: 10, difficulty: 0.45, requiresLevel: "headliner",
    isHeadlinerSoloPipeline: true, headlinerSoloTier: "club",
    crowd: "Seus fãs que pagaram ingresso para te ver.",
    intro: "O teatro é seu. A plateia veio por você. Não decepcione.",
    image: "pedestal.png", vibeHint: "É hora de mostrar quem você é. Autenticidade máxima.",
    typeAffinity: { default: 0.15, besteirol: 0.3, vulgar: 0.2, "humor negro": 0.3, limpo: 0.3, hack: 0.2 }
  },

  // ─── Special recurring shows (unlocked via events) ───
  {
    id: "5a5", name: "5 a 5 - Copo Sujo", minMinutes: 3, difficulty: 0.15, isSpecialShow: true,
    crowd: "Plateia escassa, parte dela de opens como você. Ambiente de teste.",
    intro: "Domingo à tarde no Copo Sujo. Um palco tranquilo para testar material novo.",
    image: "copo-sujo-comedy.png", vibeHint: "Material conciso e punchlines claras. Ótimo para testar piadas novas.",
    typeAffinity: { default: 0, besteirol: 0.5, vulgar: 0.1, "humor negro": 0.2, limpo: 0.3, hack: 0.2 }
  },
  {
    id: "pague15", name: "Pague 15 Leve 10 - Copo Sujo", minMinutes: 5, difficulty: 0.35, isSpecialShow: true,
    crowd: "Plateia pagante que espera profissionalismo. O produtor cronometra.",
    intro: "Quinta-feira no Copo Sujo. Show de iniciantes com plateia pagante. O produtor é rígido com tempo.",
    image: "copo-sujo-comedy.png", vibeHint: "Tempo é sagrado aqui. Não estoure os 5 minutos ou vai ser cortado.",
    typeAffinity: { default: 0.1, besteirol: 0.3, vulgar: 0, "humor negro": 0.2, limpo: 0.4, hack: 0.3 }
  }
];
showPool.forEach((show, index) => {
  showPool[index] = enrichShowWithCareerMetadata(show);
});

function findShowById(showId) {
  return showPool.find((show) => show.id === showId);
}


// ═══════════════════════════════════════════════════════════════════
// §4  DATA: EVENT POOL
// ═══════════════════════════════════════════════════════════════════

const eventPool = [
  {
    id: "veterano", trigger: "showKill", once: true,
    requiresGoodPerformance: true, isGoodEvent: true, isCharacterEvent: true,
    text: "Depois do show, Stevan Gaipo te aborda: 'Pô, curti teu set! Cê tem timing bom. To saindo em turnê pelo interior e preciso de alguém pra abrir. Topa vir comigo? São 7 minutos num palco lotado.'",
    image: "stevan-gaipo.png",
    choices: [
      { label: "Aceitar o convite", startShowId: "veterano-turne", narration: "Você aceita o convite do Stevan! É a chance de tocar plateias diferentes e aprender com quem já está há anos na estrada." },
      { label: "Agradecer mas recusar", effects: { fans: -5, motivation: 6 }, narration: "Você agradece o convite mas prefere se preparar mais. Stevan entende e diz que a porta tá aberta." }
    ]
  },
  {
    id: "corporativoConvite", trigger: "random",
    text: "Seu telefone toca: é uma pessoa do RH de uma empresa. 'O palestrante sumiu e precisamos de alguém pra animar o coffee break! Paga bem, mas é pra agora!'",
    image: "corporativo.png",
    choices: [
      { label: "Aceitar o desafio", startShowId: "corporativo-surpresa", narration: "Você aceita e já começa a pensar em piadas sobre trabalho. O cachê vai ajudar nas contas!" },
      { label: "Indicar outro comediante", effects: { texto: 6, motivation: 4, network: 5 }, narration: "Você passa o contato de um amigo. Ele agradece muito e te deve uma. Você usa o tempo livre pra estudar." }
    ]
  },
  {
    id: "podcast", trigger: "fans20", once: true,
    text: "Um podcast de comédia quer te entrevistar. Você pode focar em piadas prontas ou falar sério sobre o processo.",
    image: "podcast.png",
    choices: [
      { label: "Mandar punchline atrás de punchline", effects: { fans: 20, motivation: -4, network: 3 }, narration: "Você viraliza uns cortes, mas sai sem energia para escrever." },
      { label: "Falar sobre processo", effects: { texto: 10, motivation: 4, network: 5 }, narration: "Você inspira novos comediantes e reflete sobre seu método." }
    ]
  },
  {
    id: "clipDaNoite", trigger: "random", requiresCareerStage: "open", cooldown: 5,
    text: "Um trecho curto do seu set começou a circular nos stories. Dá pra tentar transformar isso em alcance rápido ou usar a atenção para fortalecer seu material no palco.",
    image: "podcast.png",
    choices: [
      { label: "Aproveitar o hype em cortes", effects: { fans: 18, motivation: -4 }, narration: "Os números sobem, mas sua energia criativa cai no curto prazo." },
      { label: "Chamar a galera para night de teste", effects: { texto: 8, network: 6, fans: 6 }, narration: "Você usa a atenção para encher uma noite de teste e lapidar melhor o set." }
    ]
  },
  {
    id: "algoritmoPressao", trigger: "random", requiresCareerStage: "elenco", cooldown: 6,
    text: "Seu agente insiste: 'O algoritmo quer frases de impacto, não blocos longos'. Você segue a pressão ou mantém foco em construção de set?",
    image: "rooftop-tech-meetup.png",
    choices: [
      { label: "Seguir a pressão do algoritmo", effects: { fans: 30, motivation: -6, texto: -3 }, narration: "Você cresce rápido, mas sente o repertório menos profundo." },
      { label: "Priorizar construção de set", effects: { texto: 10, entrega: 3, fans: 8 }, narration: "Você cresce mais devagar, mas sobe o nível real de palco." }
    ]
  },
  {
    id: "parceriaMarca", trigger: "random", requiresCareerStage: "headliner", requiredFans: 900, cooldown: 8,
    text: "Uma marca quer te pagar para encaixar publi no set. O cachê é alto, mas pode soar artificial para quem te acompanha há anos.",
    image: "corporativo.png",
    choices: [
      { label: "Aceitar a parceria", effects: { fans: 20, motivation: -5, network: 8 }, narration: "Você fecha contrato e ganha exposição, mas parte do público sente estranheza." },
      { label: "Recusar e fortalecer o solo", effects: { texto: 9, entrega: 4, motivation: 5 }, narration: "Você mantém autonomia criativa e converte o momento em material forte." }
    ]
  },
  {
    id: "comentarioForaContexto", trigger: "random", requiresCareerStage: "elenco", requiredFans: 120, cooldown: 7,
    text: "Um corte fora de contexto gerou discussão online. Você pode responder rápido para controlar narrativa ou focar em um set de resposta no palco.",
    image: "podcast.png",
    choices: [
      { label: "Responder em vídeo agora", effects: { fans: 14, motivation: -8, network: 3 }, narration: "Você reduz o incêndio, mas termina o dia drenado." },
      { label: "Transformar em bit no palco", effects: { texto: 12, entrega: 2, fans: 5 }, narration: "Você converte ruído em material e ganha respeito no circuito." }
    ]
  },
  {
    id: "bombMentor", trigger: "showBomb", cooldown: 5, requiresCopoSujo: true,
    isCharacterEvent: true,
    text: "Depois de uma água absurda no Copo Sujo, Professor Carvalho te liga: 'Quando um set afunda, não adianta sair dizendo que a plateia era ruim. Primeiro revisa o que você fez: abertura, ritmo, excesso de palavra, premissa frouxa, punch previsível. Técnica antes de ego.'",
    image: "carvalho.png",
    choices: [
      { label: "OK", effects: { texto: 10, motivation: 4 } }
    ]
  },
  {
    id: "cincoPiadas", trigger: "jokes5", once: true, isCharacterEvent: true,
    text: "Você já tem 5 piadas no caderno! Paulo Araújo, um comediante que você conheceu num bar, te manda mensagem: 'E aí, vi que tu tá escrevendo! Tenho um slot sobrando no 5 a 5 desse domingo, quer testar esse material?'",
    image: "paulo-araujo.png",
    choices: [
      { label: "Aceitar o convite", effects: { motivation: 8, texto: 3, network: 5 }, scheduleShow: "5a5", narration: "Paulo te inscreveu no 5 a 5 desse domingo! Você tem 3 minutos no palco.", unlock5a5: true },
      { label: "Quero mais material primeiro", effects: { motivation: -2 }, narration: "Você prefere escrever mais antes de encarar a plateia. Paulo entende e diz que é só chamar.", delayRouteInviteDays: 3 }
    ]
  },
  {
    id: "pauloAraujoPague15", trigger: "pague15Invite", once: true, isCharacterEvent: true,
    text: "Paulo Araújo te manda mensagem: 'E aí, vi que você tá mandando bem no 5 a 5! Que tal fazer parte do elenco fixo do Pague 15? É um show mais sério, com plateia pagante. Você topa?'",
    image: "paulo-araujo.png",
    choices: [
      { label: "Aceitar fazer parte do elenco fixo", effects: { motivation: 10, network: 8, texto: 5 }, unlockPague15: true, narration: "Paulo te adiciona ao elenco fixo do Pague 15! Agora você pode participar desse show às quintas-feiras. É um passo importante na sua carreira!" },
      { label: "Ainda não me sinto pronto", effects: { motivation: -3 }, narration: "Você prefere ganhar mais experiência antes. Paulo entende e diz que a porta sempre estará aberta.", delayRouteInviteDays: 4 }
    ]
  },
  {
    id: "stevanEstrada", trigger: "random", requiresGoodPerformance: true,
    isGoodEvent: true, isCharacterEvent: true,
    text: "Stevan Gaipo te manda mensagem: 'E aí, vi teus shows, curti. To indo fazer uns shows no interior semana que vem, quer vir junto?' A viagem é longa. Como você aproveita o tempo?",
    image: "stevan-gaipo.png",
    choices: [
      { label: "Revisar material no trajeto", effects: { texto: 8, motivation: -3 }, narration: "Você passa a viagem revisando piadas e estruturando o set. Chega mais preparado, mas meio cansado." },
      { label: "Fazer amizade com a galera", effects: { motivation: 5, network: 12 }, narration: "Você troca ideia com todo mundo, conta histórias, ouve outras. Sai com vários contatos novos e animado." }
    ]
  },
  {
    id: "gabrielAndradeDicas", trigger: "random", isGoodEvent: true, isCharacterEvent: true,
    text: "Gabriel Andrade, conhecido pelo humor de oneliners afiados e prop comedy maluca, te manda uma DM: 'Ei, vi seu material. Teus oneliners têm potencial mas falta punch! E já pensou em usar objetos no palco? Te ensino uns truques se quiser.'",
    image: "gabriel-andrade.png",
    choices: [
      { label: "Aprender técnica de oneliners", effects: { texto: 12, motivation: 5 }, narration: "Gabriel te explica a estrutura perfeita do oneliner: setup curto, punch inesperado. 'A graça tá na economia de palavras', ele diz. Você anota tudo." },
      { label: "Aprender prop comedy", effects: { texto: 8, motivation: 8, fans: 3 }, narration: "Gabriel te mostra como um objeto simples pode virar 5 minutos de material. 'O prop não é muleta, é amplificador!' Você já começa a ter ideias." },
      { label: "Só trocar ideia mesmo", effects: { motivation: 6, network: 8 }, narration: "Vocês ficam trocando ideia sobre comédia por horas. Gabriel é gente boa demais e promete te indicar pra alguns shows." }
    ]
  },
  {
    id: "criseCriativa", trigger: "random",
    text: "Você olha pro caderno em branco há horas. Nada vem. Tenta escrever, apaga, tenta de novo. Bloqueio criativo bateu forte.",
    image: "quarto1.png",
    choices: [
      { label: "Forçar até sair algo", effects: { motivation: -10, texto: 5 }, narration: "Você se obriga a escrever, mesmo que seja lixo. Depois de muito sofrimento, algumas ideias começam a aparecer." },
      { label: "Sair e fazer outra coisa", effects: { motivation: 12, fans: 3 }, narration: "Você fecha o caderno e vai viver. Encontra um amigo, passeia, observa as pessoas. Amanhã você volta com a cabeça fresca." }
    ]
  },
  {
    id: "conviteTV", trigger: "fans50", once: true,
    text: "Um produtor de TV te viu num show e quer te chamar para um quadro. É uma oportunidade única, mas exige compromisso.",
    choices: [
      { label: "Aceitar imediatamente", effects: { fans: 30, motivation: -8, network: 10 }, narration: "Você entra na TV! Fãs novos aparecem, mas a pressão é intensa." },
      { label: "Pedir tempo para pensar", effects: { motivation: 5, network: -3 }, narration: "Você quer ter certeza. O produtor respeita, mas fica um pouco frustrado." }
    ]
  },
  {
    id: "amigoCopiaSet", trigger: "random",
    text: "Você descobre que um 'amigo' comediante está usando piadas muito parecidas com as suas no set dele. Confronta?",
    image: "comic-stealing-jokes.png",
    choices: [
      { label: "Confrontar diretamente", effects: { motivation: -5, network: -8, texto: 3 }, narration: "A treta é inevitável. Você perde um contato, mas defende seu trabalho." },
      { label: "Ignorar e escrever material melhor", effects: { motivation: 8, texto: 10 }, narration: "A melhor vingança é sucesso. Você canaliza a raiva em criatividade." }
    ]
  },
  {
    id: "viralNegativo", trigger: "random",
    text: "Um vídeo seu bombou na internet... por motivos ruins. Uma piada foi tirada de contexto e você está sendo cancelado.",
    choices: [
      { label: "Se explicar publicamente", effects: { fans: -15, motivation: -10, network: 5 }, narration: "Você tenta se defender. Alguns entendem, outros não. A poeira vai baixar." },
      { label: "Ficar em silêncio e esperar passar", effects: { fans: -8, motivation: -5 }, narration: "O tempo cura tudo. Em algumas semanas, ninguém mais lembra." }
    ]
  },
  {
    id: "ofertaDinheiro", trigger: "random",
    text: "Uma empresa te oferece um bom dinheiro para fazer uma publi no palco. O produto é... questionável.",
    choices: [
      { label: "Aceitar o dinheiro", effects: { fans: -10, motivation: 5, network: -5 }, narration: "Você faz a publi. O dinheiro ajuda, mas alguns fãs ficam decepcionados." },
      { label: "Recusar com educação", effects: { fans: 8, motivation: 3 }, narration: "Você mantém sua integridade. Os fãs verdadeiros respeitam isso." }
    ]
  },
  {
    id: "festaPosShow", trigger: "showKill", once: true,
    text: "Depois do show incrível, a galera te convida para uma festa. Você pode ir e fazer network ou ir pra casa escrever enquanto a inspiração está fresca.",
    choices: [
      { label: "Ir para a festa", effects: { motivation: 8, network: 10, texto: -3 }, narration: "Você faz amigos e conexões importantes. A noite foi épica." },
      { label: "Ir pra casa escrever", effects: { texto: 12, motivation: -2 }, narration: "Sozinho em casa, você anota tudo que funcionou. Material precioso." }
    ]
  },
  {
    id: "doencaDiaShow", trigger: "random",
    text: "Você acorda se sentindo péssimo. Garganta arranhando, corpo mole, febre baixa. Tem um show marcado pra hoje...",
    image: "quarto2.png",
    choices: [
      { label: "Ir mesmo assim", effects: { motivation: -8, network: 5 }, narration: "Você toma um remédio, vai e faz o set no automático. Não foi seu melhor dia, mas o produtor respeita quem cumpre compromisso." },
      { label: "Avisar que não vai", effects: { motivation: 5, network: -8 }, narration: "Você avisa o produtor que não tem condição. Ele não fica feliz, mas pelo menos você não piorou a doença." }
    ]
  },
  {
    id: "mentorOferece", trigger: "random", isCharacterEvent: true,
    text: "Um comediante mais experiente te oferece mentoria. Mas ele é conhecido por ser duro e exigente.",
    image: "carvalho.png",
    choices: [
      { label: "Aceitar a mentoria", effects: { texto: 20, motivation: -10 }, narration: "A jornada é brutal, mas você evolui muito como artista." },
      { label: "Recusar educadamente", effects: { motivation: 5, network: 3 }, narration: "Você agradece, mas prefere seguir seu próprio caminho." }
    ]
  },
  {
    id: "competicaoComica", trigger: "random", once: true,
    text: "Uma competição de comédia está aceitando inscrições. O prêmio é visibilidade, mas a competição é acirrada.",
    choices: [
      { label: "Se inscrever", effects: { motivation: -5, fans: 15, network: 8 }, narration: "Você participa e, independente do resultado, ganha visibilidade." },
      { label: "Esperar a próxima edição", effects: { motivation: 3 }, narration: "Você decide se preparar melhor para a próxima. Sem pressa." }
    ]
  },
  {
    id: "piratearamSeuShow", trigger: "fans30", once: true,
    text: "Alguém gravou seu set inteiro e postou na internet sem permissão. Suas piadas estão expostas.",
    choices: [
      { label: "Pedir para remover", effects: { motivation: -5, fans: -5 }, narration: "Você consegue tirar, mas o estrago já foi feito. Hora de escrever material novo." },
      { label: "Deixar e usar como divulgação", effects: { fans: 20, motivation: 5 }, narration: "Você transforma o limão em limonada. O vídeo vira seu cartão de visitas." }
    ]
  },
  // ─── New NPCs ───
  {
    id: "rossiniLuzWorkshop", trigger: "levelUp3", once: true, isCharacterEvent: true,
    text: "Rossini Luz, mestre da escrita de comédia, te manda mensagem: 'Ei, vi que você tá evoluindo! Quero te convidar pro meu workshop de texto. Vou te ensinar storytelling — a arte de contar uma história que prende, diverte e explode no final.'",
    image: "rossini-luz.png",
    choices: [
      { label: "Aceitar o workshop de storytelling", effects: { texto: 15, motivation: 5, entrega: 3, storytellingUnlocked: true }, narration: "Rossini te ensina a construir narrativas com setup, desenvolvimento e payoff. Você desbloqueia STORYTELLING como estrutura! Um mundo novo de possibilidades se abre." },
      { label: "Focar em oneliners por enquanto", effects: { texto: 5, motivation: 3 }, narration: "Você agradece mas prefere dominar o que já sabe. Rossini entende e diz: 'Quando estiver pronto, me procura.'" }
    ]
  },
  {
    id: "douglasFerreiraReading", trigger: "random", isCharacterEvent: true,
    text: "Douglas Ferreira, porteiro do Copo Sujo e comediante secreto, te puxa de lado depois do show: 'Ó, te dou uma dica grátis: antes de subir, lê a plateia. Vê quem tá prestando atenção, quem tá no celular, quem veio de casal. Isso muda tudo.'",
    image: "douglas-ferreira.png",
    choices: [
      { label: "Pedir mais dicas de crowd reading", effects: { entrega: 8, motivation: 3 }, narration: "Douglas te explica como ler a energia da sala nos primeiros 30 segundos. 'Se o cara da frente cruzou os braços, muda o tom. Se a galera tá rindo antes de você falar, acelera.' Você absorve cada palavra." },
      { label: "Pedir dicas de presença de palco", effects: { entrega: 6, texto: 4 }, narration: "Douglas te mostra como usar o espaço do palco. 'Não fica parado no mic. Anda, ocupa, faz a plateia te seguir com os olhos.' Simples mas poderoso." },
      { label: "Agradecer e ir embora", effects: { motivation: 5, network: 3 }, narration: "Você agradece a dica rápida. Douglas sorri e volta pro portão. 'Qualquer coisa, tô ali.'" }
    ]
  },
  {
    id: "brunoBergProducao", trigger: "random", isCharacterEvent: true,
    requiresLevel: "elenco",
    text: "Bruno Berg, produtor veterano de shows de comédia, te procura no bar: 'Ei, eu vejo potencial em você. Já pensou em produzir seus próprios shows? Te ensino o básico: como montar lineup, negociar com casas, divulgar. É outro jogo, mas abre portas enormes.'",
    image: "bruno-berg.png",
    choices: [
      { label: "Aprender sobre produção", effects: { network: 12, texto: 5, motivation: -3 }, narration: "Bruno te mostra os bastidores: contrato com casa, divisão de bilheteria, curadoria de elenco. É cansativo mas revelador. Você entende como o negócio funciona." },
      { label: "Perguntar sobre gestão de carreira", effects: { network: 8, motivation: 5, fans: 5 }, narration: "Bruno te dá conselhos sobre posicionamento: 'Não aceita qualquer show. Escolha onde aparece. Sua marca é o que as pessoas falam quando você sai.' Você sai pensando diferente." },
      { label: "Só bater um papo", effects: { motivation: 6, network: 5 }, narration: "Vocês ficam trocando histórias do circuito. Bruno é uma enciclopédia viva da comédia brasileira." }
    ]
  },
  {
    id: "diegoFerreiraColetivo", trigger: "random", once: true, isCharacterEvent: true,
    text: "Diego Ferreira te manda mensagem num grupo de WhatsApp: 'Opa! Tô montando um coletivo de comédia. A ideia é juntar gente nova, dividir palco, trocar material, fazer shows juntos. Topa entrar?'",
    image: "diego-ferreira.png",
    choices: [
      { label: "Entrar no coletivo", effects: { network: 15, motivation: 10, entrega: 5 }, narration: "Você entra no coletivo! Shows em grupo, ensaios semanais, troca de material. É como ter uma família de comédia. Seu network explode." },
      { label: "Preferir seguir solo", effects: { motivation: 5, texto: 3 }, narration: "Você agradece mas prefere seguir seu próprio caminho. Diego entende: 'Respeito. Se mudar de ideia, a porta tá aberta.'" }
    ]
  },
  {
    id: "hackWarning", trigger: "random", once: true, isCharacterEvent: true,
    text: "Professor Carvalho te liga: 'Parabéns pelas 5 piadas! Agora, um aviso importante sobre CALLBACKS. Callback fraco só menciona algo antigo e repete referência. Callback forte usa o elemento anterior para criar uma piada nova: nova premissa, nova virada ou novo punchline. Se você só repete, vira truque previsível. Use com moderação e intenção.'",
    image: "carvalho.png",
    choices: [
      { label: "✅ Entendido", effects: { texto: 5, motivation: 6, entrega: 2 }, narration: "Você anota no caderno: 'Callback bom cria piada nova; callback fraco só repete.' Carvalho sorri e te manda voltar pro texto original." }
    ]
  }
];


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
let _focusedMaterialSetId = null;
let _materialJokeScope = "set";


// ═══════════════════════════════════════════════════════════════════
// §8  HELPERS & UTILITIES
// ═══════════════════════════════════════════════════════════════════

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatSigned = (value) => (value > 0 ? `+${value}` : `${value}`);
const formatIdeaTitle = (idea) => idea.customTitle || `Piada sobre ${idea.seed}`;
const generatePotential = () => parseFloat((0.35 + Math.random() * 0.5).toFixed(2));
const CAREER_STAGES = ["open", "elenco", "headliner"];
const VENUE_REPUTATION_MIN = -20;
const VENUE_REPUTATION_MAX = 40;

function resolveCareerStage(level = state?.level, levelNumber = state?.levelNumber) {
  if (level === "headliner" || (typeof levelNumber === "number" && levelNumber >= 11)) return "headliner";
  if (level === "elenco" || (typeof levelNumber === "number" && levelNumber >= 6)) return "elenco";
  return "open";
}

function getCareerStage() {
  return resolveCareerStage(state?.level, state?.levelNumber);
}

function getProfileTitle() {
  if (!state) return "Comediante em formação";
  if (state.chosenClass && CLASSES[state.chosenClass]) return CLASSES[state.chosenClass].name;
  if (state.madeIt) return "Headliner";
  const stage = getCareerStage();
  if (stage === "elenco") return "Em circuito";
  if (stage === "headliner") return "Headliner";
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
      label: stage === "headliner" ? "🎤 Headliner" : stage === "elenco" ? "🎬 Elenco" : "🌱 Open Mic",
      kind: "career"
    });
  }

  if (state.storytellingUnlocked) badges.push(PROFILE_BADGE_LABELS.storytellingUnlocked);
  if (state.fiveA5Unlocked) badges.push(PROFILE_BADGE_LABELS.fiveA5Unlocked);
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

function createDefaultRouteInviteState() {
  return {
    cincoPiadas: { pending: false, nextOfferDay: 1 },
    pauloAraujoPague15: { pending: false, nextOfferDay: 1 }
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

function ensureCareerProgressState() {
  if (!state) return;
  state.careerMilestones = { ...createDefaultCareerMilestones(), ...(state.careerMilestones || {}) };
  state.routeCounters = normalizeRouteCounters(state.routeCounters);
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
  state.headlinerSoloState = {
    prepPoints: Math.max(0, state.headlinerSoloState?.prepPoints || 0),
    solosCompleted: Math.max(0, state.headlinerSoloState?.solosCompleted || 0),
    prestige: Math.max(0, state.headlinerSoloState?.prestige || 0),
    bestSoloNota: Math.max(0, state.headlinerSoloState?.bestSoloNota || 0)
  };
  state.headlinerSets = Array.isArray(state.headlinerSets) ? state.headlinerSets : [];
  state.headlinerSets = state.headlinerSets.map((setEntry) => sanitizeHeadlinerSet(setEntry));
  state.activeSetId = state.activeSetId || null;
  state.specialTapeState = {
    eligible: !!state.specialTapeState?.eligible,
    offered: !!state.specialTapeState?.offered,
    booked: !!state.specialTapeState?.booked,
    completed: !!state.specialTapeState?.completed,
    qualityScore: Math.max(0, Math.round(state.specialTapeState?.qualityScore || 0))
  };
  if (state.activeSetId && !state.headlinerSets.some((setEntry) => setEntry.id === state.activeSetId)) {
    state.activeSetId = state.headlinerSets[0]?.id || null;
  }
  let specialMarked = false;
  state.headlinerSets.forEach((setEntry) => {
    if (setEntry.isSpecialDraft && !specialMarked) specialMarked = true;
    else if (setEntry.isSpecialDraft && specialMarked) setEntry.isSpecialDraft = false;
  });
  state.openStageState = {
    consistencyStreak: Math.max(0, state.openStageState?.consistencyStreak || 0),
    breakthroughs: Math.max(0, state.openStageState?.breakthroughs || 0)
  };
  state.venueReputation = normalizeVenueReputationMap(state.venueReputation);
  state.legacyArchive = Array.isArray(state.legacyArchive) ? state.legacyArchive : [];
  state.legacyEnding = state.legacyEnding || null;
  state.postLegacyMode = !!state.postLegacyMode;
  state.legacyChoicePrompted = !!state.legacyChoicePrompted;
}

function isRouteInviteEvent(eventOrId) {
  const eventId = typeof eventOrId === "string" ? eventOrId : eventOrId?.id;
  return eventId === "cincoPiadas" || eventId === "pauloAraujoPague15";
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
  if (!state.pague15Unlocked && !state.eventsSeen.includes("pauloAraujoPague15") && (state.shows5a5AtLevel4 || 0) >= 3) {
    state.routeInviteState.pauloAraujoPague15.pending = true;
  }

  if (activeEvent || pendingEvent) return;

  const routeInviteOrder = ["cincoPiadas", "pauloAraujoPague15"];
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
  if (show.requiresAvatar && !show.requiresAvatar.includes(state.avatar)) return false;
  if (show.requiresEmployment && !state.hasEmployment) return false;
  if (show.requiresMadeIt && !state.madeIt) return false;
  if (show.requiresSpecialTapeBooked && !state.specialTapeState?.booked) return false;
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
  return showPool.filter((show) => show.isElencoCircuit);
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

function getHeadlinerPipelineShows() {
  return showPool.filter((show) => show.isHeadlinerSoloPipeline && !show.isSpecialTapeShow);
}

function maybeAddHeadlinerSoloGig(shows, alreadyScheduledIds, weekDay) {
  const pipeline = getHeadlinerPipelineShows().filter((show) => !alreadyScheduledIds.includes(show.id) && isShowUnlockedForCareer(show));
  if (!pipeline.length) return;
  const preferredId = weekDay === 5 ? "solo-noite-principal" : weekDay === 2 ? "solo-lab-preview" : "show-solo";
  const preferred = pipeline.find((show) => show.id === preferredId);
  const selected = preferred || pipeline[Math.floor(Math.random() * pipeline.length)];
  const daysAhead = preferred ? 0 : (Math.random() < 0.5 ? 1 : 2);
  shows.unshift({ show: selected, daysAhead, showType: "headlinerSolo" });
}

function getHeadlinerSoloPrepBonus(showType) {
  if (showType !== "headlinerSolo") return 0;
  ensureCareerProgressState();
  return Math.min((state.headlinerSoloState.prepPoints || 0) * 0.01, 0.08);
}

function processHeadlinerSoloOutcome(show, showType, nota) {
  if (showType !== "headlinerSolo") return;
  ensureCareerProgressState();
  const solo = state.headlinerSoloState;
  solo.solosCompleted += 1;
  solo.bestSoloNota = Math.max(solo.bestSoloNota || 0, nota);
  const prestigeGain = nota >= 5 ? 20 : nota === 4 ? 12 : nota === 3 ? 6 : 2;
  solo.prestige = Math.max(0, (solo.prestige || 0) + prestigeGain);
  solo.prepPoints = Math.max(0, (solo.prepPoints || 0) - 3);
  queueCriticalDialog(
    `🎟️ Balanço do solo\n\n${show.name}\nPrestígio +${prestigeGain} (total ${solo.prestige}).`,
    [{ label: "Seguir", handler: () => {} }]
  );
}

function addHeadlinerPrep(points) {
  if (getCareerStage() !== "headliner") return;
  ensureCareerProgressState();
  const gained = Math.max(0, Math.round(points || 0));
  if (gained <= 0) return;
  state.headlinerSoloState.prepPoints = Math.min(12, (state.headlinerSoloState.prepPoints || 0) + gained);
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

function getHeadlinerSetById(setId) {
  ensureCareerProgressState();
  if (!setId) return null;
  return (state.headlinerSets || []).find((set) => set.id === setId) || null;
}

function getSetRuntimeByIds(jokeIds = []) {
  if (!Array.isArray(jokeIds) || !jokeIds.length) return 0;
  return jokeIds.reduce((sum, jokeId) => {
    const joke = (state.jokes || []).find((entry) => entry.id === jokeId);
    return sum + (joke?.minutes || 0);
  }, 0);
}

function getHeadlinerSetRuntime(setEntry) {
  if (!setEntry) return 0;
  return getSetRuntimeByIds(setEntry.jokeIds || []);
}

function getHeadlinerSetJokes(setEntry) {
  if (!setEntry || !Array.isArray(setEntry.jokeIds)) return [];
  return setEntry.jokeIds
    .map((jokeId) => (state.jokes || []).find((entry) => entry.id === jokeId))
    .filter(Boolean);
}

function sanitizeHeadlinerSet(setEntry) {
  const jokeIds = Array.isArray(setEntry?.jokeIds) ? [...new Set(setEntry.jokeIds)] : [];
  return {
    id: setEntry?.id || createId(),
    title: (setEntry?.title || "Texto sem título").trim(),
    jokeIds,
    targetMinutes: Math.max(10, Math.round(setEntry?.targetMinutes || 20)),
    isSpecialDraft: !!setEntry?.isSpecialDraft,
    history: Array.isArray(setEntry?.history) ? setEntry.history : []
  };
}

function createHeadlinerSet(title, jokeIds, options = {}) {
  ensureCareerProgressState();
  const safeTitle = (title || "").trim() || `Texto ${state.headlinerSets.length + 1}`;
  const newSet = sanitizeHeadlinerSet({
    title: safeTitle,
    jokeIds,
    targetMinutes: options.targetMinutes || 20,
    isSpecialDraft: !!options.isSpecialDraft
  });
  if (newSet.isSpecialDraft) {
    state.headlinerSets.forEach((setEntry) => { setEntry.isSpecialDraft = false; });
  }
  state.headlinerSets.push(newSet);
  if (!state.activeSetId) state.activeSetId = newSet.id;
  if (getCareerStage() === "elenco" && getHeadlinerSetRuntime(newSet) >= 15 && markCareerMilestone("firstTexto15")) {
    maybeTriggerCarvalhoDialog("firstTexto15", { setId: newSet.id, runtime: getHeadlinerSetRuntime(newSet) });
  }
  saveGameState();
  return newSet;
}

function updateHeadlinerSet(setId, updates = {}) {
  ensureCareerProgressState();
  const setEntry = getHeadlinerSetById(setId);
  if (!setEntry) return null;
  if (typeof updates.title === "string") setEntry.title = updates.title.trim() || setEntry.title;
  if (Array.isArray(updates.jokeIds)) setEntry.jokeIds = [...new Set(updates.jokeIds)];
  if (typeof updates.targetMinutes === "number") setEntry.targetMinutes = Math.max(10, Math.round(updates.targetMinutes));
  if (typeof updates.isSpecialDraft === "boolean") {
    if (updates.isSpecialDraft) state.headlinerSets.forEach((entry) => { entry.isSpecialDraft = false; });
    setEntry.isSpecialDraft = updates.isSpecialDraft;
  }
  if (getCareerStage() === "elenco" && getHeadlinerSetRuntime(setEntry) >= 15 && markCareerMilestone("firstTexto15")) {
    maybeTriggerCarvalhoDialog("firstTexto15", { setId: setEntry.id, runtime: getHeadlinerSetRuntime(setEntry) });
  }
  saveGameState();
  return setEntry;
}

function deleteHeadlinerSet(setId) {
  ensureCareerProgressState();
  const idx = state.headlinerSets.findIndex((entry) => entry.id === setId);
  if (idx === -1) return false;
  const [removed] = state.headlinerSets.splice(idx, 1);
  if (state.activeSetId === removed.id) {
    state.activeSetId = state.headlinerSets[0]?.id || null;
  }
  saveGameState();
  return true;
}

function getActiveHeadlinerSet() {
  ensureCareerProgressState();
  return getHeadlinerSetById(state.activeSetId) || null;
}

function setActiveHeadlinerSet(setId) {
  if (!getHeadlinerSetById(setId)) return false;
  state.activeSetId = setId;
  saveGameState();
  return true;
}

function validateSetForShow(setEntry, show) {
  if (!setEntry) return { ok: false, reason: "Você precisa selecionar um texto para este show." };
  const runtime = getHeadlinerSetRuntime(setEntry);
  if (runtime <= 0) return { ok: false, reason: "O texto selecionado não possui piadas válidas." };
  const minMinutes = Math.max(show?.minMinutes || 0, 8);
  if (runtime < minMinutes) return { ok: false, reason: `Seu texto está curto demais (${runtime}min). Mínimo recomendado: ${minMinutes}min.` };
  return { ok: true, runtime };
}

function getSpecialDraftSet() {
  ensureCareerProgressState();
  return (state.headlinerSets || []).find((setEntry) => setEntry.isSpecialDraft) || null;
}

function getHeadlinerSetForShow(showType) {
  if (showType === "specialTape") return getSpecialDraftSet() || getActiveHeadlinerSet();
  return getActiveHeadlinerSet();
}

function updateSpecialTapeEligibility() {
  ensureCareerProgressState();
  const tape = state.specialTapeState;
  const stageOk = getCareerStage() === "headliner";
  const levelOk = (state.levelNumber || 1) >= 19;
  const audienceOk = (state.fans || 0) >= 3500;
  const networkOk = (state.network || 0) >= 110;
  const solosOk = (state.headlinerSoloState?.solosCompleted || 0) >= 3;
  const hasDraft = !!getSpecialDraftSet();
  tape.eligible = stageOk && levelOk && audienceOk && networkOk && solosOk && hasDraft && !tape.completed;
  return tape.eligible;
}

function maybeOfferSpecialTaping() {
  ensureCareerProgressState();
  if (!state.v1Completed) return;
  const tape = state.specialTapeState;
  if (!updateSpecialTapeEligibility()) return;
  if (tape.offered || tape.booked || tape.completed) return;
  tape.offered = true;
  queueCriticalDialog(
    "🎬 Convite de gravação!\n\nVocê está pronto para gravar seu especial. Quer agendar a gravação?",
    [
      {
        label: "Agendar gravação",
        handler: () => {
          const show = findShowById("taping-especial");
          if (!show) return;
          const daysAhead = 3;
          const scheduled = addScheduledShow(show.id, (state.currentDay || 1) + daysAhead, "specialTape");
          if (scheduled) {
            tape.booked = true;
            tape.offered = true;
            displayNarration(`🎥 Especial agendado para ${getDayName(state.currentDay + daysAhead)}. Prepare seu texto especial.`);
            updateStats();
          }
        }
      },
      { label: "Ainda não", handler: () => { tape.offered = false; } }
    ]
  );
}

function processSpecialTapeOutcome(nota, adjustedScore) {
  ensureCareerProgressState();
  const tape = state.specialTapeState;
  const prep = state.headlinerSoloState?.prepPoints || 0;
  const quality = clamp(Math.round((nota * 15) + (adjustedScore * 25) + prep * 2), 0, 100);
  tape.qualityScore = quality;
  tape.completed = true;
  tape.booked = false;
  tape.offered = true;
  queueCriticalDialog(
    `🎞️ Especial gravado!\n\nQualidade final: ${quality}/100.`,
    [{ label: "Continuar", handler: () => {} }]
  );
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

function getLegacyConsistencyScore() {
  const history = state.showHistory || [];
  if (!history.length) return 0;
  const recent = history.slice(-12);
  const average = recent.reduce((sum, item) => sum + (item.nota || 0), 0) / recent.length;
  const consistency = recent.filter((item) => (item.nota || 0) >= 4).length / recent.length;
  return clamp(Math.round((average / 5) * 60 + consistency * 40), 0, 100);
}

function getLegacyCraftScore() {
  const soloPrestige = state.headlinerSoloState?.prestige || 0;
  const textoPart = (state.texto || 0) * 0.3;
  const entregaPart = (state.entrega || 0) * 0.25;
  const prestigePart = Math.min(40, soloPrestige * 0.6);
  const tapeBonus = Math.min(15, (state.specialTapeState?.qualityScore || 0) * 0.15);
  return clamp(Math.round(textoPart + entregaPart + prestigePart + tapeBonus), 0, 100);
}

function getLegacyAudienceScore() {
  const fansPart = Math.min(70, Math.log10((state.fans || 0) + 10) * 20);
  const networkPart = Math.min(30, (state.network || 0) * 0.3);
  return clamp(Math.round(fansPart + networkPart), 0, 100);
}

function getLegacyTier(totalScore) {
  if (totalScore >= 85) return "LENDÁRIO";
  if (totalScore >= 70) return "CONSAGRADO";
  if (totalScore >= 55) return "RESPEITADO";
  return "PROMISSOR";
}

function getClassLegacyFlavor() {
  const classId = state.chosenClass || "comicoClassico";
  const flavors = {
    comicoClassico: "Você se torna referência de palco para a nova geração.",
    roteirista: "Seu material vira referência para escritores e elencos do circuito.",
    produtor: "Você consolida um ecossistema de shows e revela novos nomes.",
    atorComico: "Sua presença atravessa palco e audiovisual sem perder identidade.",
    influencer: "Você prova que alcance e credibilidade podem coexistir.",
    professor: "Seu método forma comediantes que continuam sua escola."
  };
  return flavors[classId] || flavors.comicoClassico;
}

function finalizeLegacyEnding(pathId) {
  const path = LEGACY_PATHS.find((item) => item.id === pathId) || LEGACY_PATHS[0];
  const craft = getLegacyCraftScore();
  const audience = getLegacyAudienceScore();
  const consistency = getLegacyConsistencyScore();
  const score = Math.round(
    craft * (path.weights.craft || 0.33) +
    audience * (path.weights.audience || 0.33) +
    consistency * (path.weights.consistency || 0.34)
  );
  const tier = getLegacyTier(score);
  const summary = {
    pathId: path.id,
    pathLabel: path.label,
    tier,
    score,
    craft,
    audience,
    consistency,
    day: state.currentDay || 1
  };
  state.legacyEnding = summary;
  state.postLegacyMode = true;
  state.legacyArchive.push(summary);
  registerCareerChoice("legacy-choice", { pathId: path.id, score, tier });
  queueCriticalDialog(
    `🏁 LEGADO DEFINIDO\n\nCaminho: ${path.label}\nResultado: ${tier} (${score}/100)\n` +
      `Craft ${craft} | Público ${audience} | Consistência ${consistency}\n\n${getClassLegacyFlavor()}`,
    [{ label: "Continuar no pós-carreira", handler: () => {} }]
  );
  saveGameState();
}

function maybeTriggerLegacyChoice() {
  ensureCareerProgressState();
  if (!state.v1Completed) return;
  if (state.legacyEnding) return;
  if (state.legacyChoicePrompted) return;
  if (getCareerStage() !== "headliner") return;
  if ((state.levelNumber || 1) < 18) return;
  if (!state.specialTapeState?.completed) return;
  state.legacyChoicePrompted = true;
  const options = LEGACY_PATHS.map((path) => ({
    label: `${path.label} — ${path.description}`,
    handler: () => finalizeLegacyEnding(path.id)
  }));
  queueCriticalDialog(
    "📚 Você chegou ao arco final da carreira.\n\nEscolha como quer consolidar seu legado:",
    options
  );
}

function maybeShowHeadlinerFutureNotice() {
  ensureCareerProgressState();
  const noticeId = "v1-headliner-future";
  if ((state.carvalhoDialogState?.shownIds || []).includes(noticeId)) return;
  state.carvalhoDialogState.shownIds.push(noticeId);
  queueCriticalDialog(
    "🚧 Conteúdo Headliner será expandido na v2/v3. A v1.0 termina no começo do Elenco.",
    [{ label: "Continuar jogando", handler: () => {} }]
  );
}

function maybeTriggerV1Ending(nota, showType, showPlayed) {
  ensureCareerProgressState();
  if (state.v1Completed) return;
  const isElencoStage = getCareerStage() === "elenco";
  const hasClass = !!state.chosenClass;
  const hasOpportunityAccepted = !!state.hasEmployment;
  const isElencoShowcase = showType === "elenco15" || !!showPlayed?.isElencoCircuit;
  const goodShow = nota >= 4;
  if (!(isElencoStage && hasClass && hasOpportunityAccepted && isElencoShowcase && goodShow)) return;

  state.v1Completed = true;
  const cls = CLASSES[state.chosenClass];
  const classFlavor = cls?.endingFlavor ? `\n\n${cls.endingFlavor}` : "";
  queueCriticalDialog(
    "🏁 FIM DA V1.0 — VOCÊ ENTROU PRO ELENCO\n\nVocê chegou achando que seria descoberto.\n\nNão foi.\n\nVocê escreveu, bombou, reescreveu, testou, insistiu, fez 5 minutos virarem 15 e agora tem uma cadeira no circuito.\n\nA fama não veio.\nVeio coisa pior: responsabilidade semanal.\n\nSua carreira começou." + classFlavor,
    [
      { label: "Continuar jogando", handler: () => {} },
      { label: "Ver histórico", handler: () => handleViewHistory() },
      { label: "Créditos", handler: () => handleShowCredits() }
    ]
  );
  saveGameState();
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
function addScheduledShow(showId, dayScheduled, showType = "normal") {
  if (!state.scheduledShows) state.scheduledShows = [];
  if (state.scheduledShows.length >= MAX_SCHEDULED_SHOWS) return false;
  state.scheduledShows.push({ showId, dayScheduled, showType });
  incrementRouteCounter("showsScheduledCount");
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
  const quartos = ['quarto1.png', 'quarto2.png', 'quarto3.png', 'quarto4.png', 'quarto5.png'];
  if (weekday === 0) return quartos[1]; // Domingo
  if (weekday === 6) return quartos[0]; // Sábado
  return quartos[weekday - 1];          // Segunda–Sexta
}

function getNotebookImageForTexto(texto) {
  if (texto >= 200) return "notebook5.png";  // Max tier
  if (texto >= 150) return "notebook4.png";  // Very high
  if (texto >= 90) return "notebook3.png";   // High
  if (texto >= 30) return "notebook2.png";   // Mid
  return "notebook1.png";                     // Low
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
function showClassSelectionDialog() {
  if (state.chosenClass) return;

  const classOptions = Object.entries(CLASSES).map(([key, cls]) => ({
    label: `${cls.name} — ${cls.desc}`,
    handler: () => {
      state.chosenClass = key;
      registerCareerChoice("class-selected", { classId: key });
      if (cls.bonus) {
        if (cls.bonus.texto) state.texto = clamp((state.texto || 0) + cls.bonus.texto, 0, 200);
        if (cls.bonus.entrega) state.entrega = clamp((state.entrega || 0) + cls.bonus.entrega, 0, 200);
        if (cls.bonus.network) state.network = (state.network || 10) + cls.bonus.network;
      }
      playSound('victory');
      spawnConfetti(50);
      flashScreen('rgba(212, 168, 75, 0.4)');
      const bonusText = cls.bonus ? Object.entries(cls.bonus).map(([k, v]) => `${k} +${v}`).join(', ') : '';
      queueCriticalDialog(`🎭 Você escolheu: ${cls.name}!\n\n${cls.desc}\n\n${bonusText ? `Bônus aplicados: ${bonusText}` : ''}`);
      updateStats();
      saveGameState();
    }
  }));

  queueCriticalDialog("🎓 Parabéns! Você deixou de ser Open. Agora é hora de pensar em carreira.\n\nQual caminho você escolhe?", classOptions);
}

function checkEmploymentOffer() {
  if (!state.chosenClass || state.hasEmployment) return;
  const cls = CLASSES[state.chosenClass];
  if (!cls || !cls.empReq) return;

  let meetsRequirements = true;
  for (const [stat, required] of Object.entries(cls.empReq)) {
    const current = state[stat] || 0;
    if (current < required) { meetsRequirements = false; break; }
  }

  if (meetsRequirements) {
    queueCriticalDialog(`💼 Primeiro Convite Profissional!\n\nSeu caminho como ${cls.name} começou a ficar claro.\n\nConvite: ${cls.opportunityTitle}\n\nNão é fama.\nNão é contrato milionário.\nÉ o primeiro sinal de que alguém no circuito consegue imaginar você fazendo isso de verdade.\n\nAceitar conclui seu arco inicial da v1.0.`, [
      { label: "✅ Aceitar convite", handler: () => {
        state.hasEmployment = true;
        registerCareerChoice("opportunity-accepted", { classId: state.chosenClass });
        playSound('victory');
        spawnConfetti(40);
        flashScreen('rgba(90, 143, 90, 0.3)');
        queueCriticalDialog(`🎉 Convite aceito!\n\n${cls.endingFlavor}`);
        saveGameState();
      }},
      { label: "Ainda não", handler: () => {} }
    ]);
  }
}

function checkMadeIt() {
  if (!state.chosenClass || state.madeIt || state.levelNumber < 16) return;
  const cls = CLASSES[state.chosenClass];
  if (!cls) return;

  let qualifies = false;
  switch (state.chosenClass) {
    case 'roteirista': qualifies = state.texto >= 80; break;
    case 'produtor': qualifies = state.network >= 80; break;
    case 'atorComico': qualifies = state.entrega >= 80; break;
    case 'influencer': qualifies = state.fans >= 10000; break;
    case 'professor': qualifies = state.texto >= 60 && state.entrega >= 60; break;
    case 'comicoClassico': qualifies = state.texto >= 60 && state.entrega >= 60; break;
    default: qualifies = false;
  }

  if (qualifies) {
    state.madeIt = true;
    registerCareerChoice("made-it", { classId: state.chosenClass });
    playSound('victory');
    spawnConfetti(80);
    flashScreen('rgba(212, 168, 75, 0.5)');
    queueCriticalDialog(`🏆 MADE IT!\n\n${cls.madeIt}\n\nVocê chegou ao topo como ${cls.name}. 3 pontos de atividade por dia. A lenda continua...`);
    saveGameState();
  }
}


// ═══════════════════════════════════════════════════════════════════
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
  const lastTableLevel = XP_TOTAL_BY_LEVEL.length - 1;
  for (let level = lastTableLevel; level >= 1; level -= 1) {
    if (safeXp >= XP_TOTAL_BY_LEVEL[level]) {
      let computedLevel = level;
      while (safeXp >= getTotalXpForLevel(computedLevel + 1)) computedLevel += 1;
      return computedLevel;
    }
  }
  return 1;
}

function getLevelTier(levelNumber) {
  if (levelNumber >= 11) return "headliner";
  if (levelNumber >= 6) return "elenco";
  return "open";
}

function getXpForNextLevel(levelNumber) {
  return getTotalXpForLevel(levelNumber + 1);
}

function applyXp(amount) {
  const gain = Math.max(0, Math.round(amount || 0));
  if (gain <= 0) return 0;
  state.xp = Math.max(0, Math.round((state.xp || 0) + gain));
  state.levelNumber = getLevelFromXp(state.xp);
  state.level = getLevelTier(state.levelNumber);
  return gain;
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
  return { averageScore: totalScore / setList.length, breakdown };
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

    if (state.level !== "open" && !state.chosenClass) {
      showClassSelectionDialog();
    }

    if (state.levelNumber >= 3) maybeTriggerEvent("levelUp3", { source: "levelUp" });

    if (previousCareerStage === "open" && currentCareerStage === "elenco") {
      maybeTriggerCarvalhoDialog("enterElenco", { previousCareerStage, currentCareerStage });
    } else if (state.v1Completed && previousCareerStage !== "headliner" && currentCareerStage === "headliner") {
      maybeTriggerCarvalhoDialog("enterHeadliner", { previousCareerStage, currentCareerStage });
    } else if (!state.v1Completed && previousCareerStage !== "headliner" && currentCareerStage === "headliner") {
      maybeShowHeadlinerFutureNotice();
    }

    checkEmploymentOffer();
    checkMadeIt();
    if (state.v1Completed) {
      updateSpecialTapeEligibility();
      maybeOfferSpecialTaping();
      maybeTriggerLegacyChoice();
    }
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
        if (entry.showType === "specialTape" && state.specialTapeState) {
          state.specialTapeState.booked = false;
          state.specialTapeState.offered = false;
        }
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
  state.currentDay += 1;
  state.performedShowToday = false;

  state.currentWeekDay = (state.currentWeekDay + 1) % 7;
  state.activityPoints = getMaxActivityPoints();

  // Clean up expired scheduled shows
  state.scheduledShows = (state.scheduledShows || []).filter(s => s.dayScheduled >= state.currentDay);

  // New week? Reset weekly counters
  if (state.currentWeekDay === 1) {
    state.currentWeek = (state.currentWeek || 1) + 1;
    state.eventsThisWeek = 0;
    ensureCareerProgressState();
    if (state.elencoCircuitState.completedWeek !== state.currentWeek - 1) {
      state.elencoCircuitState.weeklySuccessStreak = 0;
    }
    state.elencoCircuitState.weeklyGoalProgress = 0;
    state.elencoCircuitState.completedWeek = null;
  }

  state.motivation = clamp(state.motivation + 5, 0, 120);
  processFlowState();
  updateStats();
  setScene("home");
  playSound('click');

  const weekDayName = DAYS_OF_WEEK[state.currentWeekDay];
  displayNarration(`🌅 Novo dia: ${weekDayName}, Dia ${state.currentDay}. Você tem ${getMaxActivityPoints()} pontos de atividade.`);

  // Random event chance (max 2 per week, 10% per day, only after first show)
  const hasHadFirstShow = state.showHistory && state.showHistory.length > 0;
  if (hasHadFirstShow && (state.eventsThisWeek || 0) < 2 && Math.random() < 0.1) {
    maybeTriggerEvent("random", { source: "newDay" });
  }
  refreshRouteInviteAvailability("newDay");

  if (state.motivation <= 25) {
    maybeTriggerCarvalhoDialog("lowMotivation", { source: "newDay" });
  }
  updateSpecialTapeEligibility();
  maybeOfferSpecialTaping();

  const nearestShow = getNearestScheduledShow();
  if (nearestShow && nearestShow.showType === "headlinerSolo") {
    ensureCareerProgressState();
    const daysUntilSolo = nearestShow.dayScheduled - state.currentDay;
    if (daysUntilSolo >= 0 && daysUntilSolo <= 2 && (state.headlinerSoloState.prepPoints || 0) < 3) {
      queueCriticalDialog(
        "🎤 Seu solo está chegando e sua preparação está baixa.\n\nConsidere estudar ou reescrever antes do show para aumentar consistência.",
        [{ label: "Entendido", handler: () => {} }]
      );
    }
  }

  saveGameState();
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
  if (event.once && Array.isArray(state.eventsSeen) && state.eventsSeen.includes(event.id)) return false;
  if (event.cooldown && event.lastTriggered) {
    if (state.currentDay - event.lastTriggered < event.cooldown) return false;
  }
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
    case "levelUp3":   return state.levelNumber >= 3;
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
  const isRouteInvite = isRouteInviteEvent(eventRef);
  const routeInviteAccepted = isRouteInvite ? (choice.unlock5a5 || choice.unlockPague15 || choice.startShowId || choice.scheduleShow) : false;
  if (eventRef.once && !isRouteInvite && !state.eventsSeen.includes(eventRef.id)) state.eventsSeen.push(eventRef.id);
  if (isRouteInvite) {
    ensureCareerProgressState();
    const inviteState = state.routeInviteState[eventRef.id];
    if (inviteState) {
      inviteState.pending = !routeInviteAccepted;
      if (choice.delayRouteInviteDays) {
        inviteState.nextOfferDay = (state.currentDay || 1) + Math.max(1, Math.round(choice.delayRouteInviteDays));
      }
    }
    if (routeInviteAccepted && !state.eventsSeen.includes(eventRef.id)) state.eventsSeen.push(eventRef.id);
  }
  if (eventRef.cooldown) eventRef.lastTriggered = state.currentDay;

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
  if (choice.unlockPague15) state.pague15Unlocked = true;
  updateStats();
  saveGameState();

  // ─── Start-show choice: schedule and narrate ───
  if (hasStartShow) {
    const show = findShowById(choice.startShowId);
    if (show) {
      const daysAhead = Math.random() < 0.5 ? 1 : 2;
      const scheduled = addScheduledShow(show.id, state.currentDay + daysAhead, "normal");
      updateStats();
      saveGameState();
      if (!scheduled) {
        queueCriticalDialog("📅 Sua agenda já está cheia. Resolva um show marcado antes de aceitar outro convite.", [], {
          imageSrc: eventRef.image || "",
          imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
          imageIsCharacter: !!eventRef.isCharacterEvent
        });
        return;
      }
      queueCriticalDialog(`${choice.narration || "Convite aceito!"}${effectsSummary}\n\n📅 Show marcado para ${getDayName(state.currentDay + daysAhead)} (${daysAhead} dia(s)).`, [], {
        imageSrc: eventRef.image || "",
        imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
        imageIsCharacter: !!eventRef.isCharacterEvent
      });
    }
    return;
  }

  // ─── Schedule-show choice (5a5 / pague15) ───
  if (hasScheduleShow) {
    const show = findShowById(choice.scheduleShow);
    if (show) {
      let daysAhead = 1;
      let showType = "normal";
      if (choice.scheduleShow === "5a5") { daysAhead = findDaysToWeekday(0) || 7; showType = "5a5"; }
      else if (choice.scheduleShow === "pague15") { daysAhead = findDaysToWeekday(4) || 7; showType = "pague15"; }
      const scheduled = addScheduledShow(show.id, state.currentDay + daysAhead, showType);
      updateStats();
      saveGameState();
      if (!scheduled) {
        queueCriticalDialog("📅 Sua agenda já está cheia. Resolva um show marcado antes de aceitar outro convite.", [], {
          imageSrc: eventRef.image || "",
          imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
          imageIsCharacter: !!eventRef.isCharacterEvent
        });
        return;
      }
      queueCriticalDialog(`${choice.narration || "Show agendado!"}${effectsSummary}\n\n📅 ${show.name} marcado para ${getDayName(state.currentDay + daysAhead)} (${daysAhead} dia(s)).`, [], {
        imageSrc: eventRef.image || "",
        imageAlt: eventRef.id ? `Evento: ${eventRef.id}` : "Evento",
        imageIsCharacter: !!eventRef.isCharacterEvent
      });
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
    name: "Red", stageTime: 0, jokes: [], language: "pt",
    theme: "classic",
    avatar: null, hasStarted: false, fans: 0, motivation: 60, texto: 10, entrega: 5,
    eventsSeen: [], lastSave: null, xp: 0, levelNumber: 1,
    ...createInitialTimeState(),
    level: "open", showsAtLevel4: 0, shows5a5AtLevel4: 0,
    fiveA5Unlocked: false, pague15Unlocked: false, network: 10,
    storytellingUnlocked: false,
    chosenClass: null, hasEmployment: false, madeIt: false,
    v1Completed: false,
    unlockedPerks: [], availablePerkPoints: 0,
    careerMilestones: createDefaultCareerMilestones(),
    routeCounters: createDefaultRouteCounters(),
    routeInviteState: createDefaultRouteInviteState(),
    careerChoices: [],
    carvalhoDialogState: { shownIds: [], triggerCooldowns: {} },
    elencoCircuitState: { weeklyGoalTarget: 2, weeklyGoalProgress: 0, completedWeek: null, weeklySuccessStreak: 0, bestWeeklyStreak: 0 },
    headlinerSoloState: { prepPoints: 0, solosCompleted: 0, prestige: 0, bestSoloNota: 0 },
    headlinerSets: [], activeSetId: null,
    specialTapeState: { eligible: false, offered: false, booked: false, completed: false, qualityScore: 0 },
    openStageState: { consistencyStreak: 0, breakthroughs: 0 },
    venueReputation: {},
    legacyEnding: null, legacyArchive: [], postLegacyMode: false, legacyChoicePrompted: false
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseState;
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
      storytellingUnlocked: parsed.storytellingUnlocked ?? false,
      level: getLevelTier(resolvedLevelNumber),
      showsAtLevel4: parsed.showsAtLevel4 ?? 0,
      shows5a5AtLevel4: parsed.shows5a5AtLevel4 ?? 0,
      fiveA5Unlocked: parsed.fiveA5Unlocked ?? false,
      pague15Unlocked: parsed.pague15Unlocked ?? false,
      network: parsed.network ?? baseState.network,
      chosenClass: parsed.chosenClass || null,
      hasEmployment: parsed.hasEmployment ?? false,
      madeIt: parsed.madeIt ?? false,
      v1Completed: parsed.v1Completed ?? false,
      unlockedPerks: Array.isArray(parsed.unlockedPerks) ? parsed.unlockedPerks : [],
      availablePerkPoints: parsed.availablePerkPoints ?? 0,
      careerMilestones: { ...createDefaultCareerMilestones(), ...(parsed.careerMilestones || {}) },
      routeCounters: normalizeRouteCounters(parsed.routeCounters),
      routeInviteState: normalizeRouteInviteState(parsed.routeInviteState),
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
      headlinerSoloState: {
        prepPoints: Math.max(0, parsed.headlinerSoloState?.prepPoints || 0),
        solosCompleted: Math.max(0, parsed.headlinerSoloState?.solosCompleted || 0),
        prestige: Math.max(0, parsed.headlinerSoloState?.prestige || 0),
        bestSoloNota: Math.max(0, parsed.headlinerSoloState?.bestSoloNota || 0)
      },
      headlinerSets: Array.isArray(parsed.headlinerSets) ? parsed.headlinerSets.map((setEntry) => sanitizeHeadlinerSet(setEntry)) : [],
      activeSetId: parsed.activeSetId || null,
      specialTapeState: {
        eligible: !!parsed.specialTapeState?.eligible,
        offered: !!parsed.specialTapeState?.offered,
        booked: !!parsed.specialTapeState?.booked,
        completed: !!parsed.specialTapeState?.completed,
        qualityScore: Math.max(0, Math.round(parsed.specialTapeState?.qualityScore || 0))
      },
      openStageState: {
        consistencyStreak: Math.max(0, parsed.openStageState?.consistencyStreak || 0),
        breakthroughs: Math.max(0, parsed.openStageState?.breakthroughs || 0)
      },
      venueReputation: normalizeVenueReputationMap(parsed.venueReputation),
      legacyEnding: parsed.legacyEnding || null,
      legacyArchive: Array.isArray(parsed.legacyArchive) ? parsed.legacyArchive : [],
      postLegacyMode: !!parsed.postLegacyMode,
      legacyChoicePrompted: !!parsed.legacyChoicePrompted
    };
  } catch (error) {
    console.warn("Falha ao carregar save, iniciando novo jogo.", error);
    return baseState;
  }
}

function saveGameState() {
  ensureCareerProgressState();
  const payload = {
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
    pague15Unlocked: state.pague15Unlocked, network: state.network, storytellingUnlocked: state.storytellingUnlocked,
    chosenClass: state.chosenClass, hasEmployment: state.hasEmployment, madeIt: state.madeIt,
    v1Completed: !!state.v1Completed,
    unlockedPerks: state.unlockedPerks, availablePerkPoints: state.availablePerkPoints,
    careerMilestones: state.careerMilestones, routeCounters: state.routeCounters,
    routeInviteState: state.routeInviteState,
    careerChoices: state.careerChoices,
    carvalhoDialogState: state.carvalhoDialogState,
    elencoCircuitState: state.elencoCircuitState,
    headlinerSoloState: state.headlinerSoloState,
    headlinerSets: state.headlinerSets, activeSetId: state.activeSetId,
    specialTapeState: state.specialTapeState,
    openStageState: state.openStageState,
    venueReputation: state.venueReputation,
    legacyEnding: state.legacyEnding, legacyArchive: state.legacyArchive,
    postLegacyMode: state.postLegacyMode, legacyChoicePrompted: state.legacyChoicePrompted,
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
    day: document.querySelector("#dayText"),
    points: document.querySelector("#pointsText"),
    flow: document.querySelector("#flowText")
  };
  elements.profile = {
    title: document.querySelector("#profileTitleText"),
    badges: document.querySelector("#profileBadges")
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
    elements.image.src = imageToUse || "quarto1.png";
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
  elements.stats.material.textContent = `${state.xp}/${xpForNext} XP`;

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
        return `📅 ${sShow?.name || 'Show'} ${d === 0 ? 'HOJE' : `em ${d}d (${getDayName(s.dayScheduled)})`}`;
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
  const shouldDisplay = uiMode === "showSelection" || uiMode === "viewMaterial" || uiMode === "headlinerSetBuilder";
  setMaterialLayoutOrder(uiMode === "headlinerSetBuilder");
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
  } else if (uiMode === "headlinerSetBuilder") {
    elements.subTitle.textContent = "📚 Textos e Piadas Avulsas";
    elements.subTitle.style.display = "block";
  }

  elements.legend.textContent = LEGEND_TEXT;
  elements.legend.style.display = "block";
  elements.legend.style.opacity = '0';
  setTimeout(() => { elements.legend.style.transition = 'opacity 0.3s ease'; elements.legend.style.opacity = '1'; }, 100);

  const listToRender = uiMode === "headlinerSetBuilder" ? getHeadlinerBuilderVisibleJokes() : state.jokes;

  if (!listToRender.length) {
    if (uiMode === "headlinerSetBuilder") {
      const builderEmptyMessage = _materialJokeScope === "unassigned"
        ? "📝 Sem piadas avulsas fora de texto no momento."
        : "📝 Este texto ainda não tem piadas.";
      elements.jokeList.innerHTML = `<li class="joke-item read-only"><strong>${builderEmptyMessage}</strong></li>`;
    } else {
      elements.jokeList.innerHTML = '<li class="joke-item read-only"><strong>📝 Sem piadas no bloco.</strong> Bora escrever algo.</li>';
    }
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

function getAssignedJokeIdsInSets() {
  const assignedIds = new Set();
  (state.headlinerSets || []).forEach((setEntry) => {
    (setEntry.jokeIds || []).forEach((jokeId) => assignedIds.add(jokeId));
  });
  return assignedIds;
}

function getUnassignedJokes() {
  const assignedIds = getAssignedJokeIdsInSets();
  return (state.jokes || []).filter((joke) => !assignedIds.has(joke.id));
}

function getHeadlinerBuilderVisibleJokes() {
  const focusedSet = getHeadlinerSetById(_focusedMaterialSetId);
  if (_materialJokeScope === "set" && focusedSet) {
    const byId = new Map((state.jokes || []).map((joke) => [joke.id, joke]));
    return (focusedSet.jokeIds || []).map((jokeId) => byId.get(jokeId)).filter(Boolean);
  }
  return getUnassignedJokes();
}

function setMaterialLayoutOrder(textosFirst = false) {
  const container = elements.jokeList?.parentElement;
  if (!container || !elements.btnDivLow || !elements.jokeList || !elements.btnContinuar) return;
  if (textosFirst) {
    if (elements.btnDivLow.nextElementSibling !== elements.jokeList) {
      container.insertBefore(elements.btnDivLow, elements.jokeList);
    }
    return;
  }
  if (elements.btnDivLow.nextElementSibling !== elements.btnContinuar) {
    container.insertBefore(elements.btnDivLow, elements.btnContinuar);
  }
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
  if (uiMode === "headlinerSetBuilder") openHeadlinerSetBuilder();
}

function renderSetSummary() {
  if (uiMode !== "showSelection") { elements.btnDivLow.style.display = "none"; return; }

  const selectedJokes = state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const minutes = selectedJokes.reduce((sum, joke) => sum + joke.minutes, 0);
  const tones = [...new Set(selectedJokes.map((joke) => describeTone(joke.tone)))].join(" / ") || "—";
  const offeredMinutes = currentShow?.offeredMinutes || currentShow?.minMinutes || 5;
  const lockedSet = currentShow?.lockedSetId ? getHeadlinerSetById(currentShow.lockedSetId) : null;

  let minuteColor = 'var(--neon-cyan)';
  let timeWarning = '';
  if (minutes < offeredMinutes * 0.7) { minuteColor = 'var(--neon-pink)'; timeWarning = ' ⚠️ MUITO POUCO'; }
  else if (minutes < offeredMinutes * 0.9) { minuteColor = 'var(--accent-gold)'; timeWarning = ' ⚡ Pouco'; }
  else if (minutes > offeredMinutes * 1.5) { minuteColor = 'var(--neon-pink)'; timeWarning = ' ⚠️ MUITO LONGO'; }
  else if (minutes > offeredMinutes * 1.2) { minuteColor = 'var(--accent-gold)'; timeWarning = ' ⚡ Estourando'; }

  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    ${lockedSet ? `<div>📚 Texto selecionado: <strong>${escapeHtml(lockedSet.title)}</strong> (${getHeadlinerSetRuntime(lockedSet)}min)</div>` : ""}
    <div>🎭 Set atual: <strong>${selectedJokes.length}</strong> piadas | <span style="color: ${minuteColor}"><strong>${minutes}min</strong> / ${offeredMinutes}min oferecidos${timeWarning}</span></div>
    <div>🎨 Clima do set: ${tones}</div>
    ${currentShow ? `<div>⚡ Dificuldade: ${(currentShow.difficulty * 100).toFixed(0)}% caos</div>` : ""}
    ${currentShow?.vibeHint ? `<div>💡 ${currentShow.vibeHint}</div>` : ""}
    <div style="font-size: 0.95rem; color: var(--cream-dark);">${lockedSet ? "💬 No headliner, o texto organiza o set automaticamente." : "💬 Você pode escolher fazer menos ou mais tempo que o oferecido. Há consequências."}</div>
  `;
}


// ═══════════════════════════════════════════════════════════════════
// §19  UI: INTRO FLOW
// ═══════════════════════════════════════════════════════════════════

function startIntro() {
  uiMode = "intro";
  introStep = 0;
  setScene("intro", "Professor Carvalho", "carvalho.png", true);
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
  if ((state.jokes.length || 0) >= 10 && markCareerMilestone("jokes10")) {
    maybeTriggerCarvalhoDialog("jokes10", { jokeCount: state.jokes.length });
  }
  const xpGain = applyXp(XP_GAIN.jokeNew);
  addHeadlinerPrep(1);

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
  if (state.v1Completed && careerStage === "headliner" && Math.random() < 0.8) {
    maybeAddHeadlinerSoloGig(shows, alreadyScheduledIds, weekDay);
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
    if (showType === "pague15") label = `🏆 ${show.name} (desbloqueado!)`;
    if (showType === "openStarter") label = `🌱 ${show.name} (open iniciante)`;
    if (showType === "elenco15") label = `🎬 ${show.name} (circuito 15min)`;
    if (showType === "headlinerSolo") label = `🎤 ${show.name} (pipeline solo)`;
    if (showType === "specialTape") label = `🎥 ${show.name} (gravação final)`;
    const stageTag = show.careerStage ? ` · ${show.careerStage.toUpperCase()}` : "";
    const riskTag = show.riskProfile ? ` · risco ${show.riskProfile}` : "";
    const crowdTag = show.audienceType ? ` · público ${show.audienceType}` : "";
    const venueRep = getVenueReputation(show.id);
    const repTag = ` · casa ${getVenueReputationTier(venueRep)} (${venueRep >= 0 ? "+" : ""}${venueRep})`;
    return {
      label: `${label}${stageTag}${riskTag}${crowdTag}${repTag}\n📅 ${dayName} (${daysAhead === 0 ? 'HOJE' : daysAhead + 'd'}) | ⏱️ ${offeredTime}min oferecidos`,
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
      for (let i = 0; i < daysUntil; i++) {
        state.currentDay += 1;
        state.currentWeekDay = (state.currentWeekDay + 1) % 7;
        if (state.currentWeekDay === 1) { state.currentWeek = (state.currentWeek || 1) + 1; state.eventsThisWeek = 0; }
        state.motivation = clamp(state.motivation + 3, 0, 120);
        state.performedShowToday = false;
        processFlowState();
      }
      state.activityPoints = getMaxActivityPoints();
      updateStats();
      playSound('comeWithMe');
      displayNarration(`⏩ ${daysUntil} dia(s) passaram... É hora do show!`);
      saveGameState();
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
  if (scheduledShow?.showType === "headlinerSolo" || show?.isHeadlinerSoloPipeline) return Math.max(show.setLengthTarget || 20, show.minMinutes || 10);
  if (show.minMinutes >= 6) return show.minMinutes; // special-invite shows give their full time

  let maxTime = 3;
  if (showCount >= 10) maxTime = 10;
  else if (showCount >= 4) maxTime = 5;
  if (careerStage === "elenco") maxTime = Math.max(maxTime, 15);
  else if (careerStage === "headliner") maxTime = Math.max(maxTime, 20);

  return Math.max(show.minMinutes, Math.min(maxTime, careerStage === "open" ? 5 : 15));
}

function getShowXpCategory(show, showType = "normal") {
  if (showType === "specialTape" || show?.isSpecialTapeShow) return "specialTape";
  if (showType === "headlinerSolo" || show?.isHeadlinerSoloPipeline) return "headliner";
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
  currentShow = { ...show, offeredMinutes, activeShowType };
  uiMode = "showSelection";
  selectedJokeIds.clear();
  let lockedSet = null;
  if (activeShowType === "headlinerSolo" || activeShowType === "specialTape" || activeShowType === "elenco15") {
    lockedSet = getHeadlinerSetForShow(activeShowType);
    if (lockedSet) {
      const setValidation = validateSetForShow(lockedSet, show);
      if (!setValidation.ok) {
        currentShow = null;
        uiMode = "idle";
        displayNarration(`⚠️ ${setValidation.reason}`);
        handleViewMaterial();
        return;
      }
      (lockedSet.jokeIds || []).forEach((jokeId) => selectedJokeIds.add(jokeId));
      currentShow.lockedSetId = lockedSet.id;
    } else if (activeShowType !== "elenco15") {
      const setValidation = validateSetForShow(lockedSet, show);
      if (!setValidation.ok) {
        currentShow = null;
        uiMode = "idle";
        displayNarration(`⚠️ ${setValidation.reason}`);
        handleViewMaterial();
        return;
      }
    }
  }

  let subTitle = `⏱️ Tempo oferecido: ${offeredMinutes} minutos`;
  if ((showType || show.special) === "headlinerSolo") {
    ensureCareerProgressState();
    subTitle += ` | 🧱 Preparo: ${state.headlinerSoloState.prepPoints || 0}/12`;
  }
  elements.subTitle.textContent = subTitle;
  elements.subTitle.style.display = "block";
  const isSetLocked = !!currentShow.lockedSetId;
  renderJokeList({ selectable: !isSetLocked });
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
  const forcedSet = currentShow.lockedSetId ? getHeadlinerSetById(currentShow.lockedSetId) : null;
  const setList = forcedSet ? getHeadlinerSetJokes(forcedSet) : state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const totalMinutes = setList.reduce((sum, joke) => sum + joke.minutes, 0);
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
    const flowBonus = (state.flowState?.active ? 0.08 : 0) + getHeadlinerSoloPrepBonus(showType);
    const baseEvaluation = evaluateShow(setList, showPlayed, flowBonus);
    const evaluation = applyHecklerOutcomeToEvaluation(baseEvaluation, showPlayed.hecklerOutcome);
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
    if (careerStage === "headliner") markCareerMilestone("firstHeadlinerGig");
    if (showType === "headlinerSolo" || showPlayed.id === "show-solo") markCareerMilestone("firstSoloGig");

    const stageTimeGain = state.flowState?.active ? 2 : 1;
    state.stageTime += stageTimeGain;

    state.showHistory = state.showHistory || [];
    state.showHistory.push({ showId: showPlayed.id, day: state.currentDay, nota, showType, jokeResults: breakdownWithEmoji.map(j => ({ title: j.title, emoji: j.emoji, nota: j.nota })) });
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
    processHeadlinerSoloOutcome(showPlayed, showType, nota);
    if (state.v1Completed && showType === "specialTape") {
      processSpecialTapeOutcome(nota, adjustedScore);
      maybeTriggerLegacyChoice();
    }
    maybeTriggerV1Ending(nota, showType, showPlayed);

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

  if (nota === 5) { setScene("explode"); playSound('victory'); setTimeout(() => { spawnConfetti(70); flashScreen('rgba(212, 168, 75, 0.4)'); }, 300); }
  else if (nota === 4) { setScene("kill"); playSound('victory'); setTimeout(() => { spawnConfetti(40); flashScreen('rgba(212, 168, 75, 0.3)'); }, 300); }
  else if (nota === 3) { setScene("ok"); playSound('getSomething'); flashScreen('rgba(245, 230, 200, 0.15)'); }
  else if (nota === 2) { setScene("risinhos"); playSound('click'); flashScreen('rgba(200, 180, 150, 0.15)'); }
  else { setScene("bomb"); playSound('boom'); shakeScreen(); flashScreen('rgba(166, 68, 68, 0.25)'); }

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
  if (!spendActivityPoints(ACTIVITY_COSTS.study, "estudar")) return;
  if (markCareerMilestone("firstStudy")) {
    maybeTriggerCarvalhoDialog("firstStudy", { source: "study" });
  }
  state.texto = clamp((state.texto || 0) + 4, 0, 200);
  if (hasClassPassive("studyBoost")) state.texto = clamp((state.texto || 0) + 1, 0, 200);
  if (hasClassPassive("studyBoost")) state.entrega = clamp((state.entrega || 0) + 1, 0, 200);
  state.motivation = clamp(state.motivation + 2, 0, 120);
  incrementRouteCounter("studyCount");
  const xpGain = applyXp(XP_GAIN.study);
  addHeadlinerPrep(1);
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
  if (history.length === 0) {
    displayNarration("📊 Você ainda não fez nenhum show. Busque um show e suba no palco!");
    elements.btnDivLow.style.display = "flex";
    elements.btnDivLow.innerHTML = `<div>Nenhum show registrado ainda.</div>`;
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
    <h4>📜 Últimos 10 shows:</h4>
    <div class="history-list">${historyHtml || '<div>Nenhum show ainda.</div>'}</div>
  `;

  displayNarration(`📊 Seu histórico de shows: ${totalShows} apresentações com média ${avgNota}. Você matou em ${showsNota4Plus} deles!`);
  setTimeout(() => { elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}


// ═══════════════════════════════════════════════════════════════════
// §23  HANDLERS: MATERIAL & JOKE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

function renderHeadlinerSetEditor(setId) {
  const setEntry = getHeadlinerSetById(setId);
  if (!setEntry) return;
  _focusedMaterialSetId = setEntry.id;
  uiMode = "headlinerSetEditor";
  renderJokeList({ selectable: false });
  const jokes = getHeadlinerSetJokes(setEntry);
  const listHtml = jokes.length
    ? jokes.map((joke, index) => `
      <li class="joke-item read-only">
        <div><strong>${escapeHtml(joke.title)}</strong> — ${joke.minutes} min</div>
        <div class="actions">
          <button class="set-joke-up" data-set-id="${setEntry.id}" data-index="${index}">⬆️</button>
          <button class="set-joke-down" data-set-id="${setEntry.id}" data-index="${index}">⬇️</button>
          <button class="set-joke-remove" data-set-id="${setEntry.id}" data-index="${index}">🗑️</button>
        </div>
      </li>
    `).join("")
    : '<li class="joke-item read-only"><strong>Sem piadas neste texto.</strong></li>';

  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div>
      <h4>🧩 Editando texto: ${escapeHtml(setEntry.title)}</h4>
      <div>⏱️ ${getHeadlinerSetRuntime(setEntry)} min | 🎯 alvo ${setEntry.targetMinutes} min</div>
      <ul class="joke-list">${listHtml}</ul>
      <button class="headliner-editor-back">⬅️ Voltar para organização</button>
    </div>
  `;

  elements.btnDivLow.querySelector(".headliner-editor-back")?.addEventListener("click", () => openHeadlinerSetBuilder());
  elements.btnDivLow.querySelectorAll(".set-joke-up").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      if (idx <= 0) return;
      const ids = [...setEntry.jokeIds];
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      updateHeadlinerSet(setEntry.id, { jokeIds: ids });
      renderHeadlinerSetEditor(setEntry.id);
    });
  });
  elements.btnDivLow.querySelectorAll(".set-joke-down").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      if (idx >= setEntry.jokeIds.length - 1) return;
      const ids = [...setEntry.jokeIds];
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
      updateHeadlinerSet(setEntry.id, { jokeIds: ids });
      renderHeadlinerSetEditor(setEntry.id);
    });
  });
  elements.btnDivLow.querySelectorAll(".set-joke-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      const ids = [...setEntry.jokeIds];
      ids.splice(idx, 1);
      updateHeadlinerSet(setEntry.id, { jokeIds: ids });
      renderHeadlinerSetEditor(setEntry.id);
    });
  });
}

function openHeadlinerSetBuilder(setId = null, resetSelection = false) {
  ensureCareerProgressState();
  uiMode = "headlinerSetBuilder";
  const careerStage = getCareerStage();
  const isElencoStage = careerStage === "elenco";
  if (setId && getHeadlinerSetById(setId)) {
    _materialJokeScope = "set";
    _focusedMaterialSetId = setId;
    selectedJokeIds.clear();
    getHeadlinerSetById(setId).jokeIds.forEach((jokeId) => selectedJokeIds.add(jokeId));
  } else if (resetSelection) {
    selectedJokeIds.clear();
    _focusedMaterialSetId = null;
    _materialJokeScope = "unassigned";
  }
  const activeSet = getActiveHeadlinerSet();
  if (_focusedMaterialSetId && !getHeadlinerSetById(_focusedMaterialSetId)) _focusedMaterialSetId = null;
  const focusedSet = getHeadlinerSetById(_focusedMaterialSetId) || activeSet || state.headlinerSets?.[0] || null;
  if (focusedSet) _focusedMaterialSetId = focusedSet.id;
  if (_materialJokeScope === "set" && !focusedSet) _materialJokeScope = "unassigned";
  const unassignedJokes = getUnassignedJokes();
  renderJokeList({ selectable: true });
  const showingSetScope = _materialJokeScope === "set" && !!focusedSet;
  const listScopeLabel = showingSetScope
    ? `🧾 Lista abaixo: piadas do texto "${escapeHtml(focusedSet.title)}".`
    : "🧾 Lista abaixo: piadas avulsas (fora de qualquer texto).";
  const scopeToggleLabel = showingSetScope
    ? "🧩 Ver piadas avulsas"
    : focusedSet
      ? `🎯 Voltar para "${escapeHtml(focusedSet.title)}"`
      : "🧩 Ver piadas avulsas";
  const setsHtml = (state.headlinerSets || []).length
    ? state.headlinerSets.map((setEntry) => {
      const runtime = getHeadlinerSetRuntime(setEntry);
      const activeMark = state.activeSetId === setEntry.id ? "✅ " : "";
      const focusMark = focusedSet?.id === setEntry.id ? " 👀" : "";
      const specialMark = setEntry.isSpecialDraft ? " 🎬 Especial" : "";
      return `
        <div class="joke-item read-only ${focusedSet?.id === setEntry.id ? "set-focused" : ""}">
          <div><strong>${activeMark}${escapeHtml(setEntry.title)}</strong>${focusMark} — ${runtime}min${specialMark}</div>
          <div class="actions">
            <button class="set-activate-btn" data-set-id="${setEntry.id}">Ativar</button>
            <button class="set-load-btn" data-set-id="${setEntry.id}">Selecionar piadas</button>
            <button class="set-special-btn" data-set-id="${setEntry.id}">Marcar especial</button>
            <button class="set-edit-btn" data-set-id="${setEntry.id}">Editar</button>
            <button class="set-delete-btn" data-set-id="${setEntry.id}">Apagar</button>
          </div>
        </div>
      `;
    }).join("")
    : "<div>Nenhum texto criado ainda.</div>";

  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div class="material-sets-panel">
      <div>${isElencoStage ? "🎬 Elenco trabalha com textos de 15 minutos. Selecione piadas e salve um texto." : "🎤 Headliner/solo é conteúdo futuro. V1.0 termina antes disso."}</div>
      <div>Selecionadas agora: <strong>${selectedJokeIds.size}</strong> piadas</div>
      <div style="margin-top: 8px;">
        <button class="set-create-btn">➕ Salvar novo texto</button>
        <button class="set-update-active-btn">💾 Atualizar texto ativo</button>
        <button class="set-clear-selection-btn">🧹 Limpar seleção</button>
        <button class="set-toggle-scope-btn" ${(focusedSet || showingSetScope) ? "" : "disabled"}>${scopeToggleLabel}</button>
        <button class="set-view-material-btn">📓 Ver material tradicional</button>
      </div>
      <h4>${isElencoStage ? "📚 Textos de 15 minutos" : "📚 Seus textos"}</h4>
      <div>${setsHtml}</div>
      ${activeSet ? `<div>Texto ativo: <strong>${escapeHtml(activeSet.title)}</strong></div>` : "<div>Nenhum texto ativo.</div>"}
      <div><strong>Texto selecionado:</strong> ${focusedSet ? escapeHtml(focusedSet.title) : "Nenhum"}</div>
      <div>${listScopeLabel}</div>
      <div>Piadas avulsas disponíveis: <strong>${unassignedJokes.length}</strong></div>
      <div>Clique na lista abaixo para selecionar/deselecionar e montar o texto.</div>
    </div>
  `;

  elements.btnDivLow.querySelector(".set-create-btn")?.addEventListener("click", () => {
    if (!selectedJokeIds.size) { displayNarration("Selecione pelo menos uma piada para criar um texto."); return; }
    const title = window.prompt("Nome do novo texto:", `Texto ${state.headlinerSets.length + 1}`) || "";
    const created = createHeadlinerSet(title, [...selectedJokeIds], { targetMinutes: isElencoStage ? 15 : 25 });
    setActiveHeadlinerSet(created.id);
    displayNarration(`📚 Novo texto criado: ${created.title}.`);
    openHeadlinerSetBuilder(created.id);
  });
  elements.btnDivLow.querySelector(".set-update-active-btn")?.addEventListener("click", () => {
    const active = getActiveHeadlinerSet();
    if (!active) { displayNarration("Defina um texto ativo antes de atualizar."); return; }
    if (!selectedJokeIds.size) { displayNarration("Selecione piadas para atualizar o texto ativo."); return; }
    updateHeadlinerSet(active.id, { jokeIds: [...selectedJokeIds] });
    displayNarration(`💾 Texto ativo atualizado: ${active.title}.`);
    openHeadlinerSetBuilder(active.id);
  });
  elements.btnDivLow.querySelector(".set-clear-selection-btn")?.addEventListener("click", () => {
    selectedJokeIds.clear();
    openHeadlinerSetBuilder(null, false);
  });
  elements.btnDivLow.querySelector(".set-toggle-scope-btn")?.addEventListener("click", () => {
    if (showingSetScope) {
      _materialJokeScope = "unassigned";
    } else if (focusedSet) {
      _materialJokeScope = "set";
      _focusedMaterialSetId = focusedSet.id;
    }
    openHeadlinerSetBuilder(null, false);
  });
  elements.btnDivLow.querySelector(".set-view-material-btn")?.addEventListener("click", () => showMaterialNotebookView());

  elements.btnDivLow.querySelectorAll(".set-activate-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveHeadlinerSet(btn.dataset.setId);
      openHeadlinerSetBuilder(btn.dataset.setId);
    });
  });
  elements.btnDivLow.querySelectorAll(".set-load-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedSet = getHeadlinerSetById(btn.dataset.setId);
      if (!selectedSet) return;
      _materialJokeScope = "set";
      _focusedMaterialSetId = selectedSet.id;
      openHeadlinerSetBuilder(selectedSet.id);
    });
  });
  elements.btnDivLow.querySelectorAll(".set-special-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateHeadlinerSet(btn.dataset.setId, { isSpecialDraft: true });
      displayNarration("🎬 Texto marcado como draft de especial.");
      openHeadlinerSetBuilder(btn.dataset.setId);
    });
  });
  elements.btnDivLow.querySelectorAll(".set-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => renderHeadlinerSetEditor(btn.dataset.setId));
  });
  elements.btnDivLow.querySelectorAll(".set-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteHeadlinerSet(btn.dataset.setId);
      openHeadlinerSetBuilder(null, false);
    });
  });
}

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
  const careerStage = getCareerStage();
  if (careerStage === "open") {
    showMaterialNotebookView();
    return;
  }
  if (careerStage === "elenco") {
    setScene("event", "", getNotebookImageForTexto(state.texto || 10), false);
    openHeadlinerSetBuilder(null, true);
    displayNarration("🎬 Elenco trabalha com textos de 15 minutos. Selecione piadas, organize e ative um texto.");
    return;
  }
  if (careerStage === "headliner") {
    setScene("event", "", getNotebookImageForTexto(state.texto || 10), false);
    openHeadlinerSetBuilder(null, true);
    displayNarration("🚧 Conteúdo Headliner será expandido na v2/v3. A v1.0 termina no começo do Elenco.");
    return;
  }
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

  const label = joke.truePotential > 0.7 ? "promissora" : joke.truePotential > 0.5 ? "com potencial" : "incerta";
  const xpGain = applyXp(XP_GAIN.jokeRewrite);
  addHeadlinerPrep(2);

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
  state = loadGameState();
  applyTheme(state.theme || "classic");
  ensureCareerProgressState();
  updateStats();
  if (state.hasStarted && state.avatar) {
    enterGame(true);
    displayNarration(homeText);
    refreshRouteInviteAvailability("load");
    if (pendingEvent) {
      setTimeout(() => checkAndShowPendingEvent(), 1400);
    }

    // Catch-up: if player is elenco+ but never chose a class
    if (state.level !== "open" && !state.chosenClass) {
      setTimeout(() => showClassSelectionDialog(), 500);
    }

    // Catch-up: if player has unspent perk points
    if ((state.availablePerkPoints || 0) > 0) {
      setTimeout(() => showPerkSelectionDialog(), 1000);
    }
    if (state.v1Completed && getCareerStage() === "headliner" && (!state.headlinerSets || state.headlinerSets.length === 0)) {
      setTimeout(() => {
        queueCriticalDialog(
          "📚 Você chegou ao headliner.\n\nAgora organize seus textos no menu Material para preparar solos e especial.",
          [{ label: "Abrir Material", handler: () => handleViewMaterial() }]
        );
      }, 850);
    } else if (!state.v1Completed && getCareerStage() === "headliner") {
      setTimeout(() => maybeShowHeadlinerFutureNotice(), 850);
    }
    if (state.v1Completed) {
      setTimeout(() => {
        updateSpecialTapeEligibility();
        maybeOfferSpecialTaping();
      }, 900);
    }
    if (state.v1Completed && !state.legacyEnding && getCareerStage() === "headliner" && (state.levelNumber || 1) >= 18) {
      setTimeout(() => maybeTriggerLegacyChoice(), 1200);
    }
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
}
