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
  if (state && state.levelNumber >= 6) base.push("storytelling");
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

const structureDescriptions = {
  oneliner: "Piada curta e direta, que não necessita de mais contexto.",
  storytelling: "Uma narrativa, uma história com vários punchs.",
  bit: "Sequência de piadas conectadas sobre um mesmo tema.",
  prop: "Usa objetos ou elementos visuais para complementar a piada."
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
    desc: "Gasta mais motivação mas gera piadas com potencial muito maior. 25% de chance de não render nada.",
    costLabel: "⚡ 1 ponto",
    motivationCost: 15,
    textoBonus: 0.10,
    timeBonus: 0.5,
    failChance: 0.25
  },
  day: {
    id: "day",
    label: "Anotar durante o dia",
    desc: "Não gasta motivação mas o material sai mais cru. 50% de chance de não render nada.",
    costLabel: "⚡ 1 ponto",
    motivationCost: 0,
    textoBonus: 0,
    timeBonus: 0,
    failChance: 0.50
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
  "Este mundo é habitado por criaturas perigosas chamadas PIADAS. Algumas brilham, outras explodem na sua cara.",
  "Seu trabalho é escrever, testar, ajustar, repetir... até transformar palco em laboratório.",
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
  comicoClassico: { name: "Cômico Clássico", desc: "Stand-up puro, turnês, shows próprios", bonus: { texto: 10, entrega: 10 }, empReq: { texto: 45, entrega: 45 }, madeIt: "Turnê nacional ou especial gravado" },
  roteirista: { name: "Roteirista", desc: "Escrita para outros, programas", bonus: { texto: 10 }, empReq: { texto: 60 }, writeSpeed: 0.75, madeIt: "Credenciado em programa famoso" },
  produtor: { name: "Produtor", desc: "Shows e gestão", bonus: { network: 15 }, empReq: { network: 50 }, seeSchedule: true, madeIt: "Casa própria com shows semanais" },
  atorComico: { name: "Ator Cômico", desc: "Performance, TV, cinema", bonus: { entrega: 10 }, empReq: { entrega: 60 }, actingEvents: true, madeIt: "Papel fixo em série/filme" },
  influencer: { name: "Influencer", desc: "Conteúdo digital, virais", bonus: { fansMultiplier: 1.5 }, empReq: { fans: 200 }, viralEvents: true, madeIt: "10k+ fãs, viral" },
  professor: { name: "Professor", desc: "Ensino e teoria da comédia", bonus: { texto: 5, entrega: 5 }, empReq: { texto: 50, entrega: 50 }, workshopEvents: true, xpMultiplier: 2, madeIt: "Curso estabelecido" }
};

const CARVALHO_DIALOGS = [
  {
    id: "carvalho-first-bomb",
    trigger: "firstBomb",
    stage: "open",
    priority: 100,
    once: true,
    text: "Professor Carvalho aparece no camarim: 'Todo mundo toma água no começo. Seu trabalho agora é transformar vergonha em material.'",
    choices: [
      { label: "📝 Revisar o set com ele", effects: { texto: 4, motivation: 3 }, narration: "Vocês destrincham seu set linha por linha. Dói, mas clareia." },
      { label: "😮‍💨 Respirar e voltar amanhã", effects: { motivation: 8 }, narration: "Você aceita o golpe sem dramatizar. Amanhã você sobe de novo." }
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
      { label: "🔁 Repetir e testar em outro contexto", effects: { texto: 3, network: 2 }, narration: "Você anota ajustes para testar em salas diferentes." },
      { label: "📓 Organizar caderno com disciplina", effects: { motivation: 4, texto: 2 }, narration: "Você organiza estrutura, transições e próximas hipóteses." }
    ]
  },
  {
    id: "carvalho-enter-elenco",
    trigger: "enterElenco",
    stage: "elenco",
    priority: 110,
    once: true,
    text: "Professor Carvalho: 'Bem-vindo ao elenco. Agora o jogo é consistência: 15 minutos sólidos, sem depender de sorte.'",
    choices: [
      { label: "🎯 Focar em consistência semanal", effects: { texto: 4, entrega: 2 }, narration: "Você assume rotina de lapidação com metas semanais." },
      { label: "🤝 Focar em presença no circuito", effects: { network: 6, motivation: 3 }, narration: "Você circula mais no meio, vira rosto conhecido e ganha confiança." }
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
      { label: "🎭 Priorizar profundidade de material", effects: { texto: 6, motivation: 2 }, narration: "Você entra em modo oficina para fortalecer blocos longos." },
      { label: "📣 Priorizar presença e público", effects: { fans: 25, network: 6, motivation: -2 }, narration: "Você acelera agenda e presença. A pressão aumenta junto." }
    ]
  },
  {
    id: "carvalho-low-motivation",
    trigger: "lowMotivation",
    stage: "open",
    priority: 80,
    cooldown: 4,
    text: "Carvalho percebe seu cansaço: 'Disciplina sem recuperação vira burnout. Escolhe uma ação curta e volta com foco.'",
    choices: [
      { label: "🧠 Fazer revisão leve", effects: { texto: 2, motivation: 5 }, narration: "Você revisa só o essencial e guarda energia para amanhã." },
      { label: "🛌 Descansar de verdade", effects: { motivation: 10 }, narration: "Você respeita o limite e evita transformar rotina em desgaste." }
    ]
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
  const id = show.id || "";
  if (id.includes("corporativo") || id.includes("sindicato")) return "corporate";
  if (id.includes("teatro") || id.includes("show-solo") || id.includes("programa-tv")) return "theater";
  if (id.includes("universitario") || id.includes("republica")) return "young-chaotic";
  if (id.includes("podcast") || id.includes("rooftop-tech") || id.includes("metro")) return "digital-urban";
  if (id.includes("shopping") || id.includes("familia") || id.includes("churrascaria")) return "family";
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
    image: "barzinho.png", vibeHint: "One-liners rápidos e humor sobre transporte são essenciais.",
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
    image: "bar-do-tony.png", vibeHint: "Material limpo e observações sobre comida ganham a mesa.",
    typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.4, "humor negro": -0.3, limpo: 0.6, hack: 0.4 }
  },
  {
    id: "teatro-alternativo", name: "Teatro do Porão", minMinutes: 6, difficulty: 0.38,
    crowd: "Plateia cult que curte o underground e detesta o mainstream.",
    intro: "Um teatro de porão te convida para a noite experimental. Vale tudo.",
    image: "teatro-legal.png", vibeHint: "Ousadia e originalidade são mais importantes que punchlines perfeitas.",
    typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: 0.3, "humor negro": 0.6, limpo: -0.3, hack: -0.2 }
  },
  {
    id: "stand-up-sertanejo", name: "Riso & Viola", minMinutes: 5, difficulty: 0.25,
    crowd: "Fãs de sertanejo entre uma música e outra do show principal.",
    intro: "Uma casa de shows sertaneja quer esquentar a plateia antes da banda.",
    image: "bar-do-tony.png", vibeHint: "Piadas sobre interior, família e relacionamento agradam.",
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
    image: "bar-do-tony.png", vibeHint: "Piadas sobre trabalho e patrão funcionam. Evite política direta.",
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
    image: "teatro-legal.png", vibeHint: "Autenticidade e humor sobre experiências pessoais conectam.",
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
    image: "outdoor-gig.png", vibeHint: "Material limpo e energia alta para segurar atenção.",
    typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.6, "humor negro": -0.4, limpo: 0.6, hack: 0.3 }
  },
  {
    id: "navio-cruzeiro", name: "Comedy no Cruzeiro", minMinutes: 7, difficulty: 0.4, requiresLevel: "elenco",
    crowd: "Passageiros de cruzeiro de todas as idades e origens.",
    intro: "Um cruzeiro te contrata para a temporada. Público cativo e variado.",
    image: "teatro-legal.png", vibeHint: "Humor universal, nada muito local ou nichado.",
    typeAffinity: { default: 0.05, besteirol: 0.3, vulgar: -0.3, "humor negro": -0.1, limpo: 0.5, hack: 0.5 }
  },
  {
    id: "programa-tv", name: "Participação em TV", minMinutes: 4, difficulty: 0.5, requiresLevel: "elenco",
    crowd: "Plateia de programa de TV, câmeras ligadas.",
    intro: "Você foi chamado para um quadro de comédia na TV. É sua chance de aparecer.",
    image: "teatro-legal.png", vibeHint: "Material polido e timing perfeito. Cada segundo conta.",
    typeAffinity: { default: 0, besteirol: 0.2, vulgar: -0.6, "humor negro": -0.3, limpo: 0.6, hack: 0.5 }
  },
  {
    id: "elenco-porao-segunda", name: "Circuito Elenco - Porão da Segunda", minMinutes: 8, difficulty: 0.42,
    requiresCareerStage: "elenco", isElencoCircuit: true, setLengthTarget: 15,
    crowd: "Público que acompanha comédia de perto e cobra material consistente.",
    intro: "Noite de elenco no porão. Você tem 15 minutos para segurar a sala sem muleta.",
    image: "teatro-legal.png", vibeHint: "Consistência e ritmo importam mais que explosões isoladas.",
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
    id: "bombMentor", trigger: "showBomb", cooldown: 5, requiresCopoSujo: true,
    isCharacterEvent: true,
    text: "Depois de uma água absurda no Copo Sujo, Professor Carvalho te liga. Ele pode te dar dicas técnicas ou te levar para assistir shows.",
    image: "carvalho.png",
    choices: [
      { label: "Pedir análise técnica", effects: { texto: 15, motivation: -5 }, narration: "Vocês destrincham cada minuto do set. Dói muito, mas você aprende bastante." },
      { label: "Assistir shows juntos", effects: { motivation: 15, network: 3 }, narration: "Vocês dão risada de outros fracassos e você recupera o moral." }
    ]
  },
  {
    id: "cincoPiadas", trigger: "jokes5", once: true, isCharacterEvent: true,
    text: "Você já tem 5 piadas no caderno! Paulo Araújo, um comediante que você conheceu num bar, te manda mensagem: 'E aí, vi que tu tá escrevendo! Tenho um slot sobrando no 5 a 5 desse domingo, quer testar esse material?'",
    image: "paulo-araujo.png",
    choices: [
      { label: "Aceitar o convite", effects: { motivation: 8, texto: 3, network: 5 }, scheduleShow: "5a5", narration: "Paulo te inscreveu no 5 a 5 desse domingo! Você tem 3 minutos no palco.", unlock5a5: true },
      { label: "Quero mais material primeiro", effects: { motivation: -2 }, narration: "Você prefere escrever mais antes de encarar a plateia. Paulo entende e diz que é só chamar." }
    ]
  },
  {
    id: "pauloAraujoPague15", trigger: "pague15Invite", once: true, isCharacterEvent: true,
    text: "Paulo Araújo te manda mensagem: 'E aí, vi que você tá mandando bem no 5 a 5! Que tal fazer parte do elenco fixo do Pague 15? É um show mais sério, com plateia pagante. Você topa?'",
    image: "paulo-araujo.png",
    choices: [
      { label: "Aceitar fazer parte do elenco fixo", effects: { motivation: 10, network: 8, texto: 5 }, unlockPague15: true, narration: "Paulo te adiciona ao elenco fixo do Pague 15! Agora você pode participar desse show às quintas-feiras. É um passo importante na sua carreira!" },
      { label: "Ainda não me sinto pronto", effects: { motivation: -3 }, narration: "Você prefere ganhar mais experiência antes. Paulo entende e diz que a porta sempre estará aberta." }
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
    id: "festaPosShow", trigger: "showKill",
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
      { label: "Aceitar o workshop de storytelling", effects: { texto: 15, motivation: 5, entrega: 3 }, narration: "Rossini te ensina a construir narrativas com setup, desenvolvimento e payoff. Você desbloqueia STORYTELLING como estrutura! Um mundo novo de possibilidades se abre." },
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
    text: "Professor Carvalho te liga: 'Parabéns pelas 5 piadas! Agora, um aviso importante sobre CALLBACKS. Callback é quando você repete algo que deu certo. É fácil, eficiente, mas é muleta. Se você só faz callback, seu show vira um truque previsível. Use com moderação.'",
    image: "carvalho.png",
    choices: [
      { label: "Anotar o conselho", effects: { texto: 5, motivation: 5 }, narration: "Você anota no caderno: 'Callback = muleta. Usar com moderação.' Professor Carvalho sorri: 'Isso. Agora vai lá e escreve material original.'" },
      { label: "Discordar educadamente", effects: { motivation: 8, entrega: 3 }, narration: "Você argumenta que callbacks são uma ferramenta legítima. Carvalho ri: 'Tá certo, vai descobrir por conta própria. Faz parte.'" }
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

const showText = (target, message, index, interval, callback) => {
  if (index < message.length) {
    const element = document.querySelector(target);
    if (element) {
      element.textContent = message.substring(0, index + 1);
    }
    setTimeout(() => showText(target, message, index + 1, interval, callback), interval);
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
const CAREER_STAGES = ["open", "elenco", "headliner"];

function resolveCareerStage(level = state?.level, levelNumber = state?.levelNumber) {
  if (level === "headliner" || (typeof levelNumber === "number" && levelNumber >= 11)) return "headliner";
  if (level === "elenco" || (typeof levelNumber === "number" && levelNumber >= 6)) return "elenco";
  return "open";
}

function getCareerStage() {
  return resolveCareerStage(state?.level, state?.levelNumber);
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
    firstBomb: false,
    firstKill: false,
    firstElencoGig: false,
    firstHeadlinerGig: false,
    firstSoloGig: false
  };
}

function ensureCareerProgressState() {
  if (!state) return;
  state.careerMilestones = { ...createDefaultCareerMilestones(), ...(state.careerMilestones || {}) };
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
  return showPool.filter((show) => show.isHeadlinerSoloPipeline);
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

const sanitizeJoke = (joke) => {
  const tone = allowedTones.includes(joke.tone) ? joke.tone : allowedTones[Math.floor(Math.random() * allowedTones.length)];
  const structure = structures.includes(joke.structure) ? joke.structure : structures[Math.floor(Math.random() * structures.length)];
  return {
    ...joke, tone, structure,
    minutes: clamp(joke.minutes || 1, 1, 2),
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
  if (state.activityPoints <= 0) {
    setTimeout(() => displayNarration("💤 Seus pontos de atividade acabaram. Considere encerrar o dia."), 500);
  }
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
      queueCriticalDialog(`✨ Vantagem desbloqueada: ${perk.name}!\n\n${perk.desc}${perk.warning ? "\n\n⚠️ Professor Carvalho avisa: 'Callback é eficiente, mas é muleta. Use com moderação.'" : ""}`);
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
      if (cls.bonus) {
        if (cls.bonus.texto) state.texto = clamp((state.texto || 0) + cls.bonus.texto, 0, 200);
        if (cls.bonus.entrega) state.entrega = clamp((state.entrega || 0) + cls.bonus.entrega, 0, 200);
        if (cls.bonus.network) state.network = (state.network || 10) + cls.bonus.network;
      }
      playSound('victory');
      spawnConfetti(50);
      flashScreen('rgba(212, 168, 75, 0.4)');
      const bonusText = cls.bonus ? Object.entries(cls.bonus).filter(([k]) => k !== 'fansMultiplier' && k !== 'xpMultiplier').map(([k, v]) => `${k} +${v}`).join(', ') : '';
      queueCriticalDialog(`🎭 Você escolheu: ${cls.name}!\n\n${cls.desc}\n\n${bonusText ? `Bônus aplicados: ${bonusText}` : ''}${cls.madeIt ? `\n\nObjetivo final: ${cls.madeIt}` : ''}`);
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
    queueCriticalDialog(`💼 Oferta de Emprego!\n\nComo ${cls.name}, você atingiu os requisitos para trabalhar na área.\n\nAceitar significa mais tempo para comédia (2 pontos de atividade por dia).`, [
      { label: "✅ Aceitar emprego!", handler: () => {
        state.hasEmployment = true;
        playSound('victory');
        spawnConfetti(40);
        flashScreen('rgba(90, 143, 90, 0.3)');
        queueCriticalDialog(`🎉 Você agora trabalha como ${cls.name}!\n\nVocê tem 2 pontos de atividade por dia.`);
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

const XP_GAIN = {
  show: { 1: 5, 2: 15, 3: 30, 4: 60, 5: 100 },
  jokeNew: 10,
  jokeRewrite: 5,
  study: 20
};

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
  const xpMultiplier = (state.chosenClass === 'professor' && CLASSES.professor.xpMultiplier) ? CLASSES.professor.xpMultiplier : 1;
  const gain = Math.max(0, Math.round((amount || 0) * xpMultiplier));
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
  const longSetBonus = (setList.length >= 3) ? getPerkEffect('longSetBonus') : 0;
  const staminaBonus = getPerkEffect('staminaBonus');
  const crowdWorkBonus = getPerkEffect('crowdWorkBonus');
  setList.forEach((joke, idx) => {
    const potencyComponent = clamp(joke.truePotential || 0.4, 0, 1) * 0.6;
    const typeComponent = getTypeAffinity(show, joke.tone) * 0.2;
    const difficultyPenalty = (show.difficulty || 0) * remainingDifficultyFactor;
    const lateFatigue = (idx >= 3 && staminaBonus > 0) ? staminaBonus : 0;
    const jokeScore = potencyComponent + typeComponent + chaosRoll - difficultyPenalty + deliveryBonus + flowBonus + hecklerDefense + bigCrowdBonus + longSetBonus + lateFatigue + crowdWorkBonus;
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
    } else if (previousCareerStage !== "headliner" && currentCareerStage === "headliner") {
      maybeTriggerCarvalhoDialog("enterHeadliner", { previousCareerStage, currentCareerStage });
    }

    checkEmploymentOffer();
    checkMadeIt();
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

  if (state.motivation <= 25) {
    maybeTriggerCarvalhoDialog("lowMotivation", { source: "newDay" });
  }

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

  switch (event.trigger) {
    case "showKill":   return true;
    case "showBomb":   return (context.adjustedScore ?? context.averageScore ?? context.score ?? 0) <= -0.05;
    case "fans20":     return state.fans >= 20;
    case "fans30":     return state.fans >= 30;
    case "fans50":     return state.fans >= 50;
    case "jokes5":     return Array.isArray(state.jokes) && state.jokes.length === 5;
    case "pague15Invite": return (state.shows5a5AtLevel4 || 0) >= 3 && !state.pague15Unlocked;
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
  showDialog(event.text, actions);
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
  showDialog(event.text, actions);
}

function handleEventChoiceIndex(index) {
  if (!activeEvent) { hideDialog(); return; }

  const eventRef = activeEvent;
  const choice = eventRef.choices && eventRef.choices[index];
  if (!choice) { hideDialog(); activeEvent = null; uiMode = "idle"; return; }

  if (eventRef.once && !state.eventsSeen.includes(eventRef.id)) state.eventsSeen.push(eventRef.id);
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

  // ─── Start-show choice: schedule and narrate ───
  if (hasStartShow) {
    const show = findShowById(choice.startShowId);
    if (show) {
      const daysAhead = Math.random() < 0.5 ? 1 : 2;
      addScheduledShow(show.id, state.currentDay + daysAhead, "normal");
      updateStats();
      showDialog(`${choice.narration || "Convite aceito!"}${effectsSummary}\n\n📅 Show marcado para ${getDayName(state.currentDay + daysAhead)} (${daysAhead} dia(s)).`);
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
      addScheduledShow(show.id, state.currentDay + daysAhead, showType);
      updateStats();
      showDialog(`${choice.narration || "Show agendado!"}${effectsSummary}\n\n📅 ${show.name} marcado para ${getDayName(state.currentDay + daysAhead)} (${daysAhead} dia(s)).`);
    }
    return;
  }

  if (hasNarration) showDialog(`${choice.narration}${effectsSummary}`);
}

function applyEventEffects(effects) {
  if (!effects) return;
  if (effects.fans) state.fans = Math.max(0, state.fans + effects.fans);
  if (effects.motivation) state.motivation = clamp(state.motivation + effects.motivation, 0, 150);
  if (effects.texto) state.texto = clamp(state.texto + effects.texto, 0, 200);
  if (effects.entrega) state.entrega = clamp(state.entrega + effects.entrega, 0, 200);
  if (effects.stageTime) state.stageTime = Math.max(0, state.stageTime + effects.stageTime);
  if (effects.network) state.network = Math.max(0, (state.network || 10) + effects.network);
}


// ═══════════════════════════════════════════════════════════════════
// §14  PERSISTENCE (save / load)
// ═══════════════════════════════════════════════════════════════════

function loadGameState() {
  const baseState = {
    name: "Red", stageTime: 0, jokes: [], language: "pt",
    avatar: null, hasStarted: false, fans: 0, motivation: 60, texto: 10, entrega: 5,
    eventsSeen: [], lastSave: null, xp: 0, levelNumber: 1,
    ...createInitialTimeState(),
    level: "open", showsAtLevel4: 0, shows5a5AtLevel4: 0,
    fiveA5Unlocked: false, pague15Unlocked: false, network: 10,
    chosenClass: null, hasEmployment: false, madeIt: false,
    unlockedPerks: [], availablePerkPoints: 0,
    careerMilestones: createDefaultCareerMilestones(),
    careerChoices: [],
    carvalhoDialogState: { shownIds: [], triggerCooldowns: {} },
    elencoCircuitState: { weeklyGoalTarget: 2, weeklyGoalProgress: 0, completedWeek: null, weeklySuccessStreak: 0, bestWeeklyStreak: 0 },
    headlinerSoloState: { prepPoints: 0, solosCompleted: 0, prestige: 0, bestSoloNota: 0 }
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
      level: getLevelTier(resolvedLevelNumber),
      showsAtLevel4: parsed.showsAtLevel4 ?? 0,
      shows5a5AtLevel4: parsed.shows5a5AtLevel4 ?? 0,
      fiveA5Unlocked: parsed.fiveA5Unlocked ?? false,
      pague15Unlocked: parsed.pague15Unlocked ?? false,
      network: parsed.network ?? baseState.network,
      chosenClass: parsed.chosenClass || null,
      hasEmployment: parsed.hasEmployment ?? false,
      madeIt: parsed.madeIt ?? false,
      unlockedPerks: Array.isArray(parsed.unlockedPerks) ? parsed.unlockedPerks : [],
      availablePerkPoints: parsed.availablePerkPoints ?? 0,
      careerMilestones: { ...createDefaultCareerMilestones(), ...(parsed.careerMilestones || {}) },
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
      }
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
    language: state.language, avatar: state.avatar, hasStarted: state.hasStarted,
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
    pague15Unlocked: state.pague15Unlocked, network: state.network,
    chosenClass: state.chosenClass, hasEmployment: state.hasEmployment, madeIt: state.madeIt,
    unlockedPerks: state.unlockedPerks, availablePerkPoints: state.availablePerkPoints,
    careerMilestones: state.careerMilestones, careerChoices: state.careerChoices,
    carvalhoDialogState: state.carvalhoDialogState,
    elencoCircuitState: state.elencoCircuitState,
    headlinerSoloState: state.headlinerSoloState,
    lastSave: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  state.lastSave = payload.lastSave;
}


// ═══════════════════════════════════════════════════════════════════
// §15  UI: DOM CACHE
// ═══════════════════════════════════════════════════════════════════

const elements = {};

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
    credits: document.querySelector("#button8")
  };
  elements.stats = {
    name: document.querySelector("#nameText"),
    level: document.querySelector("#levelText"),
    material: document.querySelector("#xpText"),
    stage: document.querySelector("#stageText"),
    fans: document.querySelector("#fansText"),
    motivation: document.querySelector("#motivationText"),
    texto: document.querySelector("#textoText"),
    entrega: document.querySelector("#entregaText"),
    day: document.querySelector("#dayText"),
    points: document.querySelector("#pointsText"),
    flow: document.querySelector("#flowText")
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

function queueCriticalDialog(message, actions = []) {
  criticalDialogQueue.push({ message, actions });
  if (criticalDialogQueue.length === 1) showNextCriticalDialog();
}

function showNextCriticalDialog() {
  if (!criticalDialogQueue.length) return;
  const { message, actions } = criticalDialogQueue[0];

  const overlay = document.getElementById('criticalOverlay');
  const textEl = document.getElementById('criticalDialogText');
  const actionsEl = document.getElementById('criticalDialogActions');
  if (!overlay || !textEl || !actionsEl) {
    criticalDialogQueue.shift();
    return;
  }

  playSound('menu');
  textEl.textContent = message || "";
  actionsEl.innerHTML = "";

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
  if (overlay) overlay.classList.add("hidden");
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
  elements.text.innerHTML = "";
  elements.text.style.opacity = '0';
  elements.text.style.transform = 'translateY(10px)';
  setTimeout(() => {
    elements.text.style.transition = 'all 0.3s ease';
    elements.text.style.opacity = '1';
    elements.text.style.transform = 'translateY(0)';
    showText("#text", message, 0, 18);
  }, 100);
}

function setScene(sceneKey, customTitle, customImage, isCharacter = false) {
  const scene = scenes[sceneKey] || {};

  elements.title.style.opacity = '0';
  elements.title.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    const titleText = customTitle !== undefined ? customTitle : (scene.title || "Na estrada");
    elements.title.textContent = titleText;
    elements.title.style.opacity = titleText ? '1' : '0';
    elements.title.style.transform = 'translateY(0)';
  }, 150);

  elements.image.style.opacity = '0';
  elements.image.style.transform = 'scale(0.95)';
  setTimeout(() => {
    let imageToUse = customImage || scene.image;
    if (!customImage && !scene.image && state && typeof state.currentWeekDay !== 'undefined') {
      imageToUse = getQuartoForWeekday(state.currentWeekDay);
    }
    elements.image.classList.toggle('character-image', !!isCharacter);
    elements.image.src = imageToUse || "quarto1.png";
    elements.image.onload = () => { elements.image.style.opacity = '1'; elements.image.style.transform = 'scale(1)'; };
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

  // Motivation
  if (animate && state.motivation !== old.motivation) { animateNumber(elements.stats.motivation, old.motivation, state.motivation, 400); animateStatChange('motivation', state.motivation > old.motivation); }
  else elements.stats.motivation.textContent = `${state.motivation}`;

  // Texto
  if (animate && state.texto !== old.texto) { animateNumber(elements.stats.texto, old.texto, state.texto, 400); animateStatChange('texto', state.texto > old.texto); }
  else elements.stats.texto.textContent = `${state.texto}`;

  // Entrega
  if (animate && state.entrega !== old.entrega) { animateNumber(elements.stats.entrega, old.entrega, state.entrega, 400); animateStatChange('entrega', state.entrega > old.entrega); }
  else elements.stats.entrega.textContent = `${state.entrega}`;

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

  if (!state.jokes.length) {
    elements.jokeList.innerHTML = '<li class="joke-item read-only"><strong>📝 Sem piadas no bloco.</strong> Bora escrever algo.</li>';
    elements.jokeList.style.display = "block";
    return;
  }

  state.jokes.forEach((joke, index) => {
    const li = document.createElement("li");
    li.classList.add("joke-item");
    if (!selectable) li.classList.add("read-only");
    li.dataset.id = joke.id;
    if (selectedJokeIds.has(joke.id)) li.classList.add("selected");
    li.style.opacity = '0';
    li.style.transform = 'translateX(-20px)';

    li.innerHTML = `
      <div><strong>${joke.title}</strong> — ${joke.minutes} min | ${joke.structure?.toUpperCase() || "SET"}</div>
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
  renderSetSummary();
}

function renderSetSummary() {
  if (uiMode !== "showSelection") { elements.btnDivLow.style.display = "none"; return; }

  const selectedJokes = state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const minutes = selectedJokes.reduce((sum, joke) => sum + joke.minutes, 0);
  const tones = [...new Set(selectedJokes.map((joke) => describeTone(joke.tone)))].join(" / ") || "—";
  const offeredMinutes = currentShow?.offeredMinutes || currentShow?.minMinutes || 5;

  let minuteColor = 'var(--neon-cyan)';
  let timeWarning = '';
  if (minutes < offeredMinutes * 0.7) { minuteColor = 'var(--neon-pink)'; timeWarning = ' ⚠️ MUITO POUCO'; }
  else if (minutes < offeredMinutes * 0.9) { minuteColor = 'var(--accent-gold)'; timeWarning = ' ⚡ Pouco'; }
  else if (minutes > offeredMinutes * 1.5) { minuteColor = 'var(--neon-pink)'; timeWarning = ' ⚠️ MUITO LONGO'; }
  else if (minutes > offeredMinutes * 1.2) { minuteColor = 'var(--accent-gold)'; timeWarning = ' ⚡ Estourando'; }

  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div>🎭 Set atual: <strong>${selectedJokes.length}</strong> piadas | <span style="color: ${minuteColor}"><strong>${minutes}min</strong> / ${offeredMinutes}min oferecidos${timeWarning}</span></div>
    <div>🎨 Clima do set: ${tones}</div>
    ${currentShow ? `<div>⚡ Dificuldade: ${(currentShow.difficulty * 100).toFixed(0)}% caos</div>` : ""}
    ${currentShow?.vibeHint ? `<div>💡 ${currentShow.vibeHint}</div>` : ""}
    <div style="font-size: 0.95rem; color: var(--cream-dark);">💬 Você pode escolher fazer menos ou mais tempo que o oferecido. Há consequências.</div>
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
      <input type="text" id="jokeTitleInput" class="joke-title-input" value="${defaultTitle}" maxlength="50" placeholder="Ex: Piada sobre..." />
      <h4>🎨 Escolha o tom da piada:</h4>
      <div class="tone-buttons">${toneOptions}</div>
      <details class="legend-details"><summary>📖 O que significa cada tom?</summary><div class="legend-content">${toneLegend}</div></details>
      <h4>🏗️ Escolha a estrutura:</h4>
      <div class="structure-buttons">${structureOptions}</div>
      <details class="legend-details"><summary>📖 O que significa cada estrutura?</summary><div class="legend-content">${structureLegend}</div></details>
      <div class="customization-hint">💡 Ideia original: "${idea.seed}" (${describeTone(idea.tone)})</div>
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
    { label: "❌ Cancelar", handler: () => { hideDialog(); exitWritingMode(); _pendingJokeIdea = null; _pendingJokeMode = null; _customJokeTitle = null; } }
  ]);

  setTimeout(() => { elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

function finalizeJokeCreation() {
  const idea = _pendingJokeIdea;
  const mode = _pendingJokeMode;
  if (!idea || !mode) { exitWritingMode(); return; }

  const activityCost = mode.id === "desk" ? ACTIVITY_COSTS.desk : ACTIVITY_COSTS.day;
  spendActivityPoints(activityCost, mode.label);

  state.motivation = clamp(state.motivation - mode.motivationCost, 0, 120);

  // Fail check: chance of nothing getting written
  if (Math.random() < (mode.failChance || 0)) {
    _pendingJokeIdea = null; _pendingJokeMode = null; _selectedTone = null; _selectedStructure = null; _customJokeTitle = null;
    exitWritingMode();
    renderJokeList({ selectable: false });
    setScene("home");
    const failMsg = mode.id === "desk"
      ? "😤 Você sentou e tentou, mas nada saiu. A tela em branco venceu hoje."
      : "🤷 Anotou umas coisas durante o dia, mas nada que prestasse.";
    displayNarration(`${failMsg} (-1 ponto de atividade)`);
    updateStats();
    return;
  }

  state.texto = clamp((state.texto || 0) + 1 + Math.round(mode.textoBonus * 20), 0, 200);

  const addMinute = Math.random() < Math.max(0, mode.timeBonus);
  const minutes = clamp(idea.baseMinutes + (addMinute ? 1 : 0), 1, 2);
  const basePotential = generatePotential();
  const flowBonus = state.flowState?.active ? 0.1 : 0;
  const perkPotentialBonus = getPerkEffect('jokePotentialBonus') + getPerkEffect('setupBonus');
  const adjustedPotential = clamp(basePotential + (state.texto / 250) + (state.motivation - 60) / 400 + mode.textoBonus + flowBonus + perkPotentialBonus, 0.2, 0.98);
  const label = adjustedPotential > 0.75 ? "🔥 perigosa porém promissora" : adjustedPotential > 0.5 ? "🙂 tem caminho" : "😶 parece frágil";

  const chosenTone = _selectedTone || idea.tone;
  const chosenStructure = _selectedStructure || getUnlockedStructures()[0];
  const chosenTitle = _customJokeTitle || formatIdeaTitle(idea);

  state.jokes.push({
    id: createId(), title: chosenTitle, tone: chosenTone, structure: chosenStructure,
    minutes, lastResult: "⏱️ ainda não testada", freshness: "nova",
    notes: `Nasceu ${idea.mood}`, history: [], truePotential: adjustedPotential, writingMode: mode.id
  });
  const xpGain = applyXp(XP_GAIN.jokeNew);
  addHeadlinerPrep(1, "novo bloco escrito");

  _pendingJokeIdea = null; _pendingJokeMode = null; _selectedTone = null; _selectedStructure = null; _customJokeTitle = null;

  exitWritingMode();
  renderJokeList({ selectable: false });
  updateStats();
  setScene("home");
  playSound('pokeball');
  flashScreen('rgba(212, 168, 75, 0.2)');
  if (adjustedPotential > 0.7) spawnConfetti(15);

  displayNarration(`✏️ Você decide ${mode.label.toLowerCase()}. Sai de lá com uma nova piada: "${chosenTitle}". Tom: ${chosenTone}, estrutura: ${chosenStructure.toUpperCase()}. ${minutes} min, parece ${label}. (-1 ponto) (+${xpGain} XP)`);

  if (state.jokes.length === 5) maybeTriggerEvent("jokes5", { source: "writing" });
  maybeTriggerEvent("random", { source: "writing" });
  checkAndShowPendingEvent();
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
  if (careerStage === "headliner" && Math.random() < 0.8) {
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
  const numShows = Math.min(eligibleShows.length, remainingSlots, 1 + Math.floor(network / 30));
  const shuffled = [...eligibleShows].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numShows && i < shuffled.length; i++) {
    const daysAhead = Math.random() < 0.3 ? 1 : (Math.random() < 0.6 ? 2 : 3);
    shows.push({ show: shuffled[i], daysAhead, showType: "normal" });
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
    if (showType === "elenco15") label = `🎬 ${show.name} (circuito 15min)`;
    if (showType === "headlinerSolo") label = `🎤 ${show.name} (pipeline solo)`;
    const stageTag = show.careerStage ? ` · ${show.careerStage.toUpperCase()}` : "";
    const riskTag = show.riskProfile ? ` · risco ${show.riskProfile}` : "";
    const crowdTag = show.audienceType ? ` · público ${show.audienceType}` : "";
    return {
      label: `${label}${stageTag}${riskTag}${crowdTag}\n📅 ${dayName} (${daysAhead === 0 ? 'HOJE' : daysAhead + 'd'}) | ⏱️ ${offeredTime}min oferecidos`,
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

function beginShowPreparation(show, offeredMinutes, showType) {
  if (offeredMinutes === undefined) offeredMinutes = calculateOfferedTime(show, { showType: showType || "normal" });
  currentShow = { ...show, offeredMinutes, activeShowType: showType || show.special || "normal" };
  uiMode = "showSelection";
  selectedJokeIds.clear();

  let subTitle = `⏱️ Tempo oferecido: ${offeredMinutes} minutos`;
  if ((showType || show.special) === "headlinerSolo") {
    ensureCareerProgressState();
    subTitle += ` | 🧱 Preparo: ${state.headlinerSoloState.prepPoints || 0}/12`;
  }
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
  const setList = state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const totalMinutes = setList.reduce((sum, joke) => sum + joke.minutes, 0);
  if (!setList.length) { shakeScreen(); displayNarration("⚠️ Você precisa selecionar alguma piada antes de subir."); return; }

  flashScreen('rgba(255, 248, 220, 0.3)');
  const flowBonus = (state.flowState?.active ? 0.08 : 0) + getHeadlinerSoloPrepBonus(showType);
  const evaluation = evaluateShow(setList, currentShow, flowBonus);
  const breakdownWithEmoji = evaluation.breakdown.map((entry) => {
    const mood = scoreToEmoji(entry.score);
    return { ...entry, emoji: mood.emoji, label: mood.label, nota: mood.nota };
  });

  const timeImpact = evaluateStageTime(totalMinutes, currentShow.minMinutes, evaluation.averageScore);
  const adjustedScore = evaluation.averageScore + timeImpact.adjustment;
  const nota = classifyOutcome(adjustedScore);
  const outcomeType = getOutcomeType(nota);
  const careerStage = getCareerStage();

  applyOutcome(setList, outcomeType, breakdownWithEmoji);

  if (outcomeType === "bomb" && markCareerMilestone("firstBomb")) {
    maybeTriggerCarvalhoDialog("firstBomb", { nota, show: showPlayed, showType });
  }
  if (outcomeType === "kill" && markCareerMilestone("firstKill")) {
    maybeTriggerCarvalhoDialog("firstKill", { nota, show: showPlayed, showType });
  }
  if (careerStage === "elenco") markCareerMilestone("firstElencoGig");
  if (careerStage === "headliner") markCareerMilestone("firstHeadlinerGig");
  if (showType === "headlinerSolo" || showPlayed.id === "show-solo") markCareerMilestone("firstSoloGig");

  const stageTimeGain = state.flowState?.active ? 2 : 1;
  state.stageTime += stageTimeGain;

  state.showHistory = state.showHistory || [];
  state.showHistory.push({ showId: showPlayed.id, day: state.currentDay, nota, showType, jokeResults: breakdownWithEmoji.map(j => ({ title: j.title, emoji: j.emoji, nota: j.nota })) });
  state.performedShowToday = true;

  const prevLevelNumber = state.levelNumber;
  const xpGain = applyXp(XP_GAIN.show[nota] || 0);
  checkLevelProgression(nota, showType, prevLevelNumber);
  checkFlowState(nota);

  const fanMultiplier = (state.chosenClass === 'influencer' && CLASSES.influencer.bonus.fansMultiplier) ? CLASSES.influencer.bonus.fansMultiplier : 1;
  const fanGain = Math.max(0, Math.round(totalMinutes * (nota - 1) * 0.8 * fanMultiplier));
  state.fans += fanGain;
  const motivationShift = nota >= 4 ? 12 : nota >= 3 ? 2 : nota >= 2 ? -5 : -12;
  state.motivation = clamp(state.motivation + motivationShift, 0, 120);
  if (nota >= 4) state.network = (state.network || 10) + 2;
  const entregaGain = nota >= 4 ? 2 : 1;
  state.entrega = clamp((state.entrega || 0) + entregaGain, 0, 200);
  processElencoCircuitOutcome(showType, nota);
  processHeadlinerSoloOutcome(showPlayed, showType, nota);

  updateStats();
  renderJokeList({ selectable: false });
  exitSelectionMode();

  showResultNarrative(nota, breakdownWithEmoji, timeImpact, { fans: fanGain, motivation: motivationShift, stageTimeGain, xp: xpGain, entrega: entregaGain });

  const eventContext = { outcome: outcomeType, nota, show: showPlayed, averageScore: evaluation.averageScore, adjustedScore, showType };
  if (outcomeType === "kill") maybeTriggerEvent("showKill", eventContext);
  else if (outcomeType === "bomb") maybeTriggerEvent("showBomb", eventContext);
  else maybeTriggerEvent("random", eventContext);

  if (showType === "5a5" && nota >= 4) maybeTriggerEvent("pague15Invite", eventContext);
  if (state.fans >= 20) maybeTriggerEvent("fans20");
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
  if (deltas.fans) statFragments.push(`Fãs ${formatSigned(deltas.fans)}`);
  if (deltas.motivation) statFragments.push(`Motivação ${formatSigned(deltas.motivation)}`);
  if (deltas.stageTimeGain && deltas.stageTimeGain > 1) statFragments.push(`Tempo de Palco +${deltas.stageTimeGain} (FLOW!)`);
  if (deltas.entrega) statFragments.push(`Entrega +${deltas.entrega}`);
  if (deltas.xp) statFragments.push(`XP +${deltas.xp}`);

  displayNarration(`${messages[nota] || messages[3]}${timeImpact?.note ? ` ${timeImpact.note}` : ""}${detalhes ? ` (${detalhes})` : ""} [${statFragments.join(" | ")}]`);
  checkAndShowPendingEvent();
}

function checkAndShowPendingEvent() {
  if (pendingEvent) {
    setTimeout(() => {
      showDialog("🎲 Algo aconteceu...", [
        { label: "Ver Evento Surpresa", handler: () => { hideDialog(); showPendingEvent(); } },
        { label: "Depois", handler: () => { pendingEvent = null; hideDialog(); } }
      ]);
    }, 1000);
  }
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
  const fanGain = reach + Math.round(state.texto / 3);
  state.fans += fanGain;
  state.network = (state.network || 10) + 1;
  state.motivation = clamp(state.motivation - 4, 0, 120);
  setScene("home");
  flashScreen('rgba(245, 230, 200, 0.15)');
  if (fanGain > 20) spawnConfetti(15);
  displayNarration(`📱 Você cria conteúdo e posta. ${fanGain} novas pessoas começam a te seguir. (-1 ponto de atividade)`);
  updateStats();
  maybeTriggerEvent("random", { source: "content" });
  maybeTriggerEvent("fans20");
  checkAndShowPendingEvent();
}

function handleStudy() {
  if (uiMode === "event") return;
  exitSelectionMode();
  if (!spendActivityPoints(ACTIVITY_COSTS.study, "estudar")) return;
  state.texto = clamp((state.texto || 0) + 6, 0, 200);
  state.motivation = clamp(state.motivation + 4, 0, 120);
  const xpGain = applyXp(XP_GAIN.study);
  addHeadlinerPrep(1, "estudo de estrutura");
  setScene("home");
  flashScreen('rgba(245, 230, 200, 0.2)');
  displayNarration(`📚 Você mergulha em especiais, podcasts e livros de comédia. Novas estruturas aparecem no caderno. (-1 ponto de atividade, +${xpGain} XP)`);
  updateStats();
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

function handleViewMaterial() {
  exitSelectionMode();
  uiMode = "viewMaterial";
  elements.subTitle.textContent = "📋 Todo o seu material";
  renderJokeList({ selectable: false });
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `<div>📊 Minutos totais: ${getTotalMinutes()} | Piadas: ${state.jokes.length}</div>`;
  setScene("event", "", getNotebookImageForTexto(state.texto || 10), false);
  displayNarration("📓 Você revisa o caderno e lembra quais piadas ainda valem subir ao palco.");
  setTimeout(() => { elements.jokeList.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

function handleSaveGame() {
  saveGameState();
  playSound('save');
  flashScreen('rgba(90, 143, 90, 0.25)');
  displayNarration("💾 Jogo salvo no seu navegador. Pode fechar o bloco e voltar quando quiser.");
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
    { label: "❌ Cancelar", handler: () => { hideDialog(); exitWritingMode(); _rewritingJoke = null; handleViewMaterial(); } }
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

  state.motivation = clamp(state.motivation - 4, 0, 120);
  state.texto = clamp((state.texto || 0) + 1, 0, 200);
  const basePotential = generatePotential();
  const flowBonus = state.flowState?.active ? 0.1 : 0;
  const rewritePerkBonus = getPerkEffect('rewriteBonus');
  joke.truePotential = clamp(basePotential + (state.texto / 160) + flowBonus + rewritePerkBonus, 0.2, 0.98);
  joke.tone = _newTone || joke.tone;
  joke.structure = _newStructure || joke.structure;
  joke.minutes = Math.random() > 0.7 ? 2 : 1;
  joke.freshness = "reescrita";
  joke.history = [];
  joke.lastResult = "⏱️ reescrita, ainda não testada";

  const label = joke.truePotential > 0.7 ? "promissora" : joke.truePotential > 0.5 ? "com potencial" : "incerta";
  const xpGain = applyXp(XP_GAIN.jokeRewrite);
  addHeadlinerPrep(2, "reescrita profunda");

  _rewritingJoke = null; _newTone = null; _newStructure = null;
  exitWritingMode();
  flashScreen('rgba(212, 168, 75, 0.15)');
  displayNarration(`✏️ "${joke.title}" foi completamente reescrita! Tom: ${joke.tone}, estrutura: ${joke.structure.toUpperCase()}. ${joke.minutes} min. Parece ${label}. (+${xpGain} XP)`);
  handleViewMaterial();
  updateStats();
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
  ensureCareerProgressState();
  updateStats();
  if (state.hasStarted && state.avatar) {
    enterGame(true);
    displayNarration(homeText);

    // Catch-up: if player is elenco+ but never chose a class
    if (state.level !== "open" && !state.chosenClass) {
      setTimeout(() => showClassSelectionDialog(), 500);
    }

    // Catch-up: if player has unspent perk points
    if ((state.availablePerkPoints || 0) > 0) {
      setTimeout(() => showPerkSelectionDialog(), 1000);
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
