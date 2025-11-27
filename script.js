const showText = (target, message, index, interval) => {
  if (index < message.length) {
    document.querySelector(target).append(message[index++]);
    setTimeout(() => showText(target, message, index, interval), interval);
  }
};

const STORAGE_KEY = "openMicRPG.save.v1";
const LEGEND_TEXT = "🤯 explodiu | 🔥 matou | 🙂 segurou | 😬 estranho | 💧 deu água";

const allowedTones = ["besteirol", "vulgar", "limpo", "humor negro", "hack"];

const toneDescriptions = {
  besteirol: "besteiras descompromissadas",
  vulgar: "piadas pesadas sem filtro",
  limpo: "humor família e bobinho",
  "humor negro": "piadas azedas que dividem a sala",
  hack: "observações batidas porém eficientes"
};

const SCORE_EMOJI_SCALE = [
  { threshold: 0.45, emoji: "🤯", label: "Explodiu a mente" },
  { threshold: 0.3, emoji: "🔥", label: "Matou" },
  { threshold: 0.15, emoji: "🙂", label: "Segurou" },
  { threshold: 0, emoji: "😬", label: "Estranho" },
  { threshold: -Infinity, emoji: "💧", label: "Deu água" }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatSigned = (value) => (value > 0 ? `+${value}` : `${value}`);

const formatIdeaTitle = (idea) => idea.customTitle || `Piada sobre ${idea.seed}`;

const generatePotential = () => parseFloat((0.35 + Math.random() * 0.5).toFixed(2));

const scoreToEmoji = (score) => {
  const normalized = Number.isFinite(score) ? score : 0;
  return SCORE_EMOJI_SCALE.find((tier) => normalized >= tier.threshold) || SCORE_EMOJI_SCALE[SCORE_EMOJI_SCALE.length - 1];
};

const structures = ["oneliner", "storytelling", "bit", "prop"];

const writingModes = {
  desk: {
    id: "desk",
    label: "Sentar e escrever",
    desc: "Gasta motivação mas aumenta a chance de gerar algo sólido.",
    motivationCost: 8,
    theoryBonus: 0.05,
    timeBonus: 0.4
  },
  day: {
    id: "day",
    label: "Anotar durante o dia",
    desc: "Mais leve, rende ideias rápidas e mantém motivação em alta.",
    motivationCost: -5,
    theoryBonus: 0,
    timeBonus: 0
  }
};

const defaultJokes = [];

const ideaPool = [
  {
    seed: "fila de mercado às 23h",
    tone: "besteirol",
    baseMinutes: 1,
    place: "anotar no bloco enquanto espera o caixa",
    mood: "cotidiano"
  },
  {
    seed: "micro-ondas que apita alto",
    tone: "besteirol",
    baseMinutes: 1,
    place: "esquentar comida de madrugada escondido",
    mood: "insônia"
  },
  {
    seed: "motorista de app coach",
    tone: "hack",
    baseMinutes: 1,
    place: "topar uma corrida aleatória no subúrbio",
    mood: "sobrevivência urbana"
  },
  {
    seed: "manual de geladeira com Bluetooth",
    tone: "hack",
    baseMinutes: 1,
    place: "fuçar tralhas tecnológicas do primo",
    mood: "futuro inútil"
  },
  {
    seed: "sobrinho gamer no almoço",
    tone: "limpo",
    baseMinutes: 1,
    place: "visitar a família no domingo",
    mood: "família"
  },
  {
    seed: "grupo da família com fake news",
    tone: "limpo",
    baseMinutes: 2,
    place: "dar uma espiada no WhatsApp coletivo",
    mood: "treta doméstica"
  },
  {
    seed: "aplicativo de meditação que grita",
    tone: "humor negro",
    baseMinutes: 1,
    place: "instalar app suspeito pra controlar ansiedade",
    mood: "autoajuda quebrada"
  },
  {
    seed: "médico que receita férias",
    tone: "humor negro",
    baseMinutes: 2,
    place: "marcar consulta só pra ter atestado",
    mood: "corporativo"
  },
  {
    seed: "banheiro químico em festival",
    tone: "vulgar",
    baseMinutes: 1,
    place: "aceitar fazer show em evento ao ar livre",
    mood: "perrengue"
  },
  {
    seed: "microfone compartilhado gripado",
    tone: "vulgar",
    baseMinutes: 1,
    place: "abrir o show depois de dez comediantes suados",
    mood: "higiene zero"
  },
  {
    seed: "curso online de charuto artesão",
    tone: "hack",
    baseMinutes: 2,
    place: "cair em anúncios estranhos às 3h",
    mood: "internet"
  },
  {
    seed: "coach de paquera em metrô lotado",
    tone: "besteirol",
    baseMinutes: 1,
    place: "voltar pra casa espremido no rush",
    mood: "transporte público"
  },
  {
    seed: "influencer fazendo publi de imposto",
    tone: "hack",
    baseMinutes: 1,
    place: "rolar o feed até perder a noção do tempo",
    mood: "mídia"
  },
  {
    seed: "vizinho que toca sax às 6h",
    tone: "limpo",
    baseMinutes: 1,
    place: "tentar dormir mais um pouco no sábado",
    mood: "condomínio"
  },
  {
    seed: "gente que leva marmita pro rolê",
    tone: "besteirol",
    baseMinutes: 1,
    place: "observar a galera nos botecos baratos",
    mood: "economia criativa"
  },
  {
    seed: "empresa que faz festa sem bebida",
    tone: "humor negro",
    baseMinutes: 2,
    place: "aceitar corporativo às pressas",
    mood: "falta de noção"
  }
];

const showPool = [
  {
    id: "copo-sujo",
    name: "Copo Sujo Comedy Club",
    minMinutes: 4,
    difficulty: 0.15,
    crowd:
      "Plateia mão-de-vaca, cerveja morna e gargalhadas que só aparecem com bobagens ditas com convicção.",
    intro:
      "Você conseguiu uma vaga no Copo Sujo. Pague 15, leve 10. Escolha seu set sem estourar o tempo e prepare o ego.",
    image: "coposujo.jpg",
    vibeHint: "Hoje eles riem de confissões do cotidiano e piadas idiotas que parecem verdade.",
    typeAffinity: {
      default: -0.05,
      besteirol: 0.8,
      vulgar: 0.3,
      "humor negro": 0.1,
      limpo: -0.3,
      hack: -0.2
    }
  },
  {
    id: "bar-do-tony",
    name: "Bar do Tony - Quarta do Riso",
    minMinutes: 5,
    difficulty: 0.25,
    crowd: "Clientes distraídos, olhando pra TV, só param pra ouvir causos pessoais que parecem verdade.",
    intro:
      "Tony te chamou pra completar a noite. Plateia espalhada, TV ligada no jogo. Só sobe quem confia no próprio texto.",
    image: "normal-show.jpg",
    vibeHint: "Narrativas sinceras e paranoias do dia a dia seguram a atenção.",
    typeAffinity: {
      default: -0.1,
      besteirol: 0.3,
      vulgar: -0.2,
      "humor negro": -0.2,
      limpo: 0.6,
      hack: 0.4
    }
  },
  {
    id: "corporativo",
    name: "Coffee Break Corporativo",
    minMinutes: 6,
    difficulty: 0.4,
    crowd: "Executivos que riem só pra aliviar a tensão antes de falar de metas e planilhas.",
    intro:
      "Um RH desesperado quer 'algo leve' antes da palestra sobre metas. Não fale palavrão e tente parecer profissional.",
    image: "killing-it.jpg",
    vibeHint: "Comentários sobre trabalho e situações absurdas salvam sua pele.",
    typeAffinity: {
      default: -0.2,
      besteirol: -0.1,
      vulgar: -0.8,
      "humor negro": -0.5,
      limpo: 0.7,
      hack: 0.6
    }
  },
  {
    id: "boteco-esquina",
    name: "Boteco da Esquina",
    minMinutes: 4,
    difficulty: 0.2,
    crowd: "Galera barulhenta que grita com o jogo e só escuta confidentes que parecem amigos.",
    intro:
      "O dono do boteco libera o microfone durante o intervalo do futebol. Você tem poucos minutos antes da próxima rodada de chope.",
    image: "coposujo.jpg",
    vibeHint: "Piadas toscas e confissões pessoais se destacam.",
    typeAffinity: {
      default: -0.05,
      besteirol: 0.6,
      vulgar: 0.2,
      "humor negro": 0.1,
      limpo: -0.3,
      hack: 0
    }
  },
  {
    id: "festival-praia",
    name: "Festival de Praia",
    minMinutes: 6,
    difficulty: 0.35,
    crowd: "Turistas queimados de sol, crianças correndo e ninguém muito sóbrio.",
    intro:
      "Uma tenda cultural te chama para preencher a programação. O vento leva metade das palavras, então precisa ser direto.",
    image: "bombing-show.jpg",
    vibeHint: "Storytelling curto com finais absurdos prende a atenção.",
    typeAffinity: {
      default: -0.15,
      besteirol: 0.3,
      vulgar: 0.4,
      "humor negro": -0.2,
      limpo: 0.2,
      hack: 0.1
    }
  },
  {
    id: "shopping-familia",
    name: "Noite Família no Shopping",
    minMinutes: 5,
    difficulty: 0.22,
    crowd: "Casais com crianças e seguranças atentos.",
    intro:
      "O shopping resolveu apostar em stand-up 'para toda a família'. Microfone impecável, tolerância a palavrões próxima de zero.",
    image: "normal-show.jpg",
    vibeHint: "Material limpo com observações sobre cotidiano ganha pontos.",
    typeAffinity: {
      default: 0,
      besteirol: 0.2,
      vulgar: -0.6,
      "humor negro": -0.5,
      limpo: 0.7,
      hack: 0.3
    }
  },
  {
    id: "after-hours",
    name: "After Hours Subúrbio",
    minMinutes: 5,
    difficulty: 0.4,
    crowd: "Comediantes cansados e insônia coletiva às 2h da manhã.",
    intro:
      "Você caiu na lista do show secreto após a meia-noite. Só funciona se você ousar testar as coisas mais estranhas.",
    image: "bombing-show.jpg",
    vibeHint: "Humor negro e bits experimentais são esperados.",
    typeAffinity: {
      default: -0.1,
      besteirol: 0,
      vulgar: 0.2,
      "humor negro": 0.7,
      limpo: -0.4,
      hack: -0.2
    }
  },
  {
    id: "teatro-limpo",
    name: "Teatro Municipal - Noite Limpa",
    minMinutes: 7,
    difficulty: 0.5,
    crowd: "Plateia educada, paga e extremamente crítica.",
    intro:
      "A prefeitura convidou novos talentos para um mini-festival. Som perfeito, mas você precisa merecer cada aplauso.",
    image: "killing-it.jpg",
    vibeHint: "Estruturas sólidas e bits inteligentes brilham.",
    typeAffinity: {
      default: -0.05,
      besteirol: -0.2,
      vulgar: -0.5,
      "humor negro": 0.2,
      limpo: 0.6,
      hack: 0.3
    }
  },
  {
    id: "podcast-live",
    name: "Podcast Ao Vivo",
    minMinutes: 4,
    difficulty: 0.3,
    crowd: "Fãs de comédia que conhecem cada referência.",
    intro:
      "Um podcast famoso abre espaço para sets curtos entre entrevistas. Tudo vira clipe em segundos.",
    image: "normal-show.jpg",
    vibeHint: "Piadas autorreferenciais e material sobre bastidores funcionam.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.1,
      vulgar: -0.1,
      "humor negro": 0.2,
      limpo: 0.1,
      hack: 0.5
    }
  },
  {
    id: "barbearia",
    name: "Barbearia Comedy Night",
    minMinutes: 4,
    difficulty: 0.25,
    crowd: "Clientes esperando corte e barbeiros que comentam o set.",
    intro:
      "Uma barbearia hipster decidiu fazer stand-up entre cortes de cabelo. Espaço apertado, vibe íntima.",
    image: "bedroom.jpg",
    vibeHint: "Observações hack e bits sobre aparência conectam.",
    typeAffinity: {
      default: 0,
      besteirol: 0.2,
      vulgar: -0.2,
      "humor negro": -0.1,
      limpo: 0.3,
      hack: 0.4
    }
  },
  {
    id: "sarau-poesia",
    name: "Sarau de Poesia e Riso",
    minMinutes: 3,
    difficulty: 0.18,
    crowd: "Artistas indie que apreciam textos autorais.",
    intro:
      "Você foi convidado para quebrar a seriedade de um sarau. Precisa ser inteligente sem desrespeitar ninguém.",
    image: "agua1.jpg",
    vibeHint: "Storytelling poético e humor reflexivo ganham destaque.",
    typeAffinity: {
      default: 0.05,
      besteirol: -0.2,
      vulgar: -0.4,
      "humor negro": 0.2,
      limpo: 0.4,
      hack: 0.1
    }
  },
  {
    id: "rooftop-tech",
    name: "Rooftop Tech Meetup",
    minMinutes: 5,
    difficulty: 0.32,
    crowd: "Startupeiros ansiosos que só falam de app e rodadas de investimento.",
    intro:
      "Uma startup contratou comediantes para descontrair o happy hour. Cuidado para não ofender futuros contratantes.",
    image: "killing-it.jpg",
    vibeHint: "Piadas sobre tecnologia e trabalho remoto pontuam bem.",
    typeAffinity: {
      default: 0,
      besteirol: -0.1,
      vulgar: -0.5,
      "humor negro": 0.2,
      limpo: 0.3,
      hack: 0.6
    }
  },
  {
    id: "metro-linha-azul",
    name: "Linha Azul After-Work",
    minMinutes: 3,
    difficulty: 0.27,
    crowd: "Passageiros cansados que só querem chegar em casa.",
    intro:
      "Uma ação cultural leva stand-up para o vagão especial. Você tem pouco tempo entre as estações.",
    image: "bombing-show.jpg",
    vibeHint: "One-liners rápidos e humor sobre transporte são essenciais.",
    typeAffinity: {
      default: -0.1,
      besteirol: 0.3,
      vulgar: -0.3,
      "humor negro": 0,
      limpo: 0.2,
      hack: 0.5
    }
  },
  {
    id: "noite-feminina",
    name: "Noite Feminina no Comedy",
    minMinutes: 5,
    difficulty: 0.28,
    crowd: "Plateia engajada que valoriza autenticidade.",
    intro:
      "Você foi convidado para uma noite temática com curadoria cuidadosa. Respeito e vulnerabilidade são chave.",
    image: "normal-show.jpg",
    vibeHint: "Storytelling sincero e observações afiadas funcionam bem.",
    typeAffinity: {
      default: 0.1,
      besteirol: -0.1,
      vulgar: -0.4,
      "humor negro": 0.2,
      limpo: 0.4,
      hack: 0.2
    }
  },
  {
    id: "veterano-turne",
    name: "Turnê do Veterano",
    minMinutes: 7,
    difficulty: 0.45,
    crowd: "Fãs fiéis do headliner, exigentes com quem abre o show.",
    intro:
      "Um veterano te entrega 7 minutos antes do set principal. Não desperdice o palco lotado.",
    image: "killing-it.jpg",
    vibeHint: "Bits bem estruturados e humor profissional impressionam.",
    typeAffinity: {
      default: -0.1,
      besteirol: 0,
      vulgar: -0.3,
      "humor negro": 0.3,
      limpo: 0.4,
      hack: 0.5
    }
  },
  {
    id: "corporativo-surpresa",
    name: "Coffee Break Emergencial",
    minMinutes: 6,
    difficulty: 0.55,
    crowd: "Equipe exausta de vendas que precisa sorrir para continuar.",
    intro:
      "O RH te liga de última hora: o palestrante principal atrasou e você precisa segurar o clima.",
    image: "killing-it.jpg",
    vibeHint: "Piadas limpas sobre trabalho e improvisos corporativos salvam.",
    typeAffinity: {
      default: -0.2,
      besteirol: -0.1,
      vulgar: -0.7,
      "humor negro": -0.3,
      limpo: 0.6,
      hack: 0.7
    }
  }
];

function findShowById(showId) {
  return showPool.find((show) => show.id === showId);
}

const eventPool = [
  {
    id: "veterano",
    trigger: "showKill",
    once: true,
    text:
      "O veterano que fechou a noite te chama para abrir a turnê dele. Quer subir com ele ainda esta semana?",
    image: "killing-it.jpg",
    choices: [
      {
        label: "Partiu estrada",
        startShowId: "veterano-turne",
        narration: "Você aceita o convite e ganha acesso ao palco mais nervoso da carreira."
      },
      {
        label: "Ainda não estou pronto",
        effects: { fans: -5, motivation: 6 },
        narration: "Você recusa com honestidade e ganha tempo para fortalecer o set."
      }
    ]
  },
  {
    id: "corporativoConvite",
    trigger: "random",
    text:
      "Um RH desesperado te liga: o palestrante sumiu e eles precisam de stand-up durante o coffee break. Topa o perrengue?",
    image: "killing-it.jpg",
    choices: [
      {
        label: "Segurar o corporativo",
        startShowId: "corporativo-surpresa",
        narration: "Você aceita a bronca e vai direto montar o set profissional."
      },
      {
        label: "Indicar outra pessoa",
        effects: { theory: 6, motivation: 4 },
        narration: "Você indica um amigo, ganha gratidão e volta para casa estudando referencias."
      }
    ]
  },
  {
    id: "podcast",
    trigger: "fans20",
    once: true,
    text:
      "Um podcast de comédia quer te entrevistar. Você pode focar em piadas prontas ou falar sério sobre o processo.",
    image: "normal-show.jpg",
    choices: [
      {
        label: "Mandar punchline atrás de punchline",
        effects: { fans: 20, motivation: -4 },
        narration: "Você viraliza uns cortes, mas sai sem energia para escrever."
      },
      {
        label: "Falar sobre processo",
        effects: { theory: 10, motivation: 4 },
        narration: "Você inspira novos comediantes e reflete sobre seu método."
      }
    ]
  },
  {
    id: "bombMentor",
    trigger: "showBomb",
    text:
      "Depois de uma água histórica, Professor Carvalho te liga. Ele pode te dar dicas técnicas ou te levar para assistir shows.",
    image: "bedroom.jpg",
    choices: [
      {
        label: "Pedir análise técnica",
        effects: { theory: 12, motivation: -3 },
        narration: "Vocês destrincham cada minuto do set. Dói, mas você aprende."
      },
      {
        label: "Assistir shows juntos",
        effects: { motivation: 12 },
        narration: "Vocês dão risada de outros fracassos e você recupera o moral."
      }
    ]
  }
];

function maybeTriggerEvent(trigger, context = {}) {
  if (activeEvent) {
    return;
  }
  const candidates = eventPool.filter((event) => eventMatchesTrigger(event, trigger, context));
  if (!candidates.length) {
    return;
  }
  const event = candidates[Math.floor(Math.random() * candidates.length)];
  showEvent(event);
}

function eventMatchesTrigger(event, trigger, context = {}) {
  if (event.once && state.eventsSeen.includes(event.id)) {
    return false;
  }
  switch (event.trigger) {
    case "showKill":
      return trigger === "showKill";
    case "showBomb":
      return (
        trigger === "showBomb" &&
        (context.adjustedScore ?? context.averageScore ?? context.score ?? 0) <= -0.05
      );
    case "fans20":
      return trigger === "fans20" && state.fans >= 20;
    case "random":
      return trigger === "random" && Math.random() < 0.35;
    default:
      return false;
  }
}

function showEvent(event) {
  activeEvent = event;
  uiMode = "event";
  setScene("event", "Evento surpresa", event.image);
  const actions = (event.choices || []).map((choice, index) => ({
    label: choice.label,
    handler: () => handleEventChoiceIndex(index)
  }));
  showDialog(event.text, actions);
}

function handleEventChoiceIndex(index) {
  if (!activeEvent) {
    return;
  }
  const eventRef = activeEvent;
  const choice = eventRef.choices[index];
  if (!choice) {
    return;
  }
  if (eventRef.once && !state.eventsSeen.includes(eventRef.id)) {
    state.eventsSeen.push(eventRef.id);
  }
  activeEvent = null;
  uiMode = "idle";
  hideDialog();
  applyEventEffects(choice.effects || {});
  updateStats();
  if (choice.startShowId) {
    showDialog(choice.narration || "Convite aceito! Hora de subir no palco.", [
      {
        label: "Montar set",
        handler: () => {
          startSpecialShow(choice.startShowId);
        }
      }
    ]);
    return;
  }
  if (choice.narration) {
    showDialog(choice.narration);
  }
}

function applyEventEffects(effects) {
  if (!effects) {
    return;
  }
  if (effects.fans) {
    state.fans += effects.fans;
  }
  if (effects.motivation) {
    state.motivation = clamp(state.motivation + effects.motivation, 0, 150);
  }
  if (effects.theory) {
    state.theory = clamp(state.theory + effects.theory, 0, 200);
  }
  if (effects.stageTime) {
    state.stageTime = Math.max(0, state.stageTime + effects.stageTime);
  }
}

const scenes = {
  home: { title: "Apartamentinho", image: "writing-at-home.jpg" },
  writing: { title: "Bloco de notas", image: "writing-at-home.jpg" },
  club: { title: "Clube", image: "coposujo.jpg" },
  bomb: { title: "Deu Água", image: "bombing-show.jpg" },
  ok: { title: "Sobreviveu", image: "normal-show.jpg" },
  kill: { title: "Matou no Palco", image: "killing-it.jpg" },
  content: { title: "Conteúdo em casa", image: "bedroom.jpg" },
  study: { title: "Estudos e referências", image: "agua2.jpg" },
  event: { title: "Convite inesperado", image: "agua1.jpg" },
  intro: { title: "Professor Carvalho", image: "carvalho.png" }
};

const homeText =
  "Você está em casa, à toa. Você tem certeza que será descoberto pelo mercado de comédia, já que se considera naturalmente muito mais engraçado que todo mundo que faz stand up. Apesar disso, talvez fosse uma boa ideia escrever piadas ou buscar show para se apresentar - só enquanto a fama não vem do nada...";

const mentorIntroLines = [
  "Olá! Meu nome é Illan Carvalho, mas no circuito me chamam de Professor Carvalho.",
  "Este mundo é habitado por criaturas perigosas chamadas PIADAS. Algumas brilham, outras explodem na sua cara.",
  "Seu trabalho é escrever, testar, ajustar, repetir... até transformar palco em laboratório.",
  "Antes de te mandar pro ringue, me diz: quem é você nessa busca pela próxima risada?"
];

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `jk-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const sanitizeJoke = (joke) => {
  const tone = allowedTones.includes(joke.tone)
    ? joke.tone
    : allowedTones[Math.floor(Math.random() * allowedTones.length)];
  const structure = structures.includes(joke.structure)
    ? joke.structure
    : structures[Math.floor(Math.random() * structures.length)];
  return {
    ...joke,
    tone,
    structure,
    minutes: clamp(joke.minutes || 1, 1, 2),
    truePotential:
      typeof joke.truePotential === "number"
        ? clamp(joke.truePotential, 0.1, 0.99)
        : generatePotential(),
    history: Array.isArray(joke.history) ? [...joke.history].slice(-7) : [],
    lastResult: joke.lastResult || "⏱️ ainda não testada",
    freshness: joke.freshness || "nova"
  };
};

const cloneJokes = (list) => list.map((joke) => sanitizeJoke(joke));

const describeTone = (tone) => toneDescriptions[tone] || "coisa difícil de rotular";

const formatHistory = (history = []) =>
  history && history.length ? history.join(" ") : "⏱️ nenhuma referência recente";

let state;
let currentShow = null;
let uiMode = "idle";
let introStep = 0;
let activeEvent = null;
let lastLevelLabel = null;
const selectedJokeIds = new Set();
const avatarImages = {
  boy: "avatar.png",
  girl: "normal-show.jpg"
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  hydrateUI();
  attachEvents();
  bootGame();
});

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
  elements.buttons = {
    write: document.querySelector("#button1"),
    show: document.querySelector("#button2"),
    material: document.querySelector("#button3"),
    save: document.querySelector("#button4"),
    content: document.querySelector("#button5"),
    study: document.querySelector("#button6")
  };
  elements.stats = {
    name: document.querySelector("#nameText"),
    level: document.querySelector("#levelText"),
    material: document.querySelector("#xpText"),
    stage: document.querySelector("#stageText"),
    fans: document.querySelector("#fansText"),
    motivation: document.querySelector("#motivationText"),
    theory: document.querySelector("#theoryText")
  };
}

function hydrateUI() {
  elements.text.innerHTML = "";
  elements.subTitle.style.display = "block";
  resetSubtitle();
  elements.jokeList.style.display = "none";
  elements.legend.style.display = "none";
}

function resetSubtitle() {
  elements.subTitle.textContent = "Monte sua vida de palco";
}

function attachEvents() {
  elements.buttons.write.addEventListener("click", handleWriteJoke);
  elements.buttons.show.addEventListener("click", handleSearchShow);
  elements.buttons.material.addEventListener("click", handleViewMaterial);
  elements.buttons.save.addEventListener("click", handleSaveGame);
  elements.buttons.content.addEventListener("click", handleCreateContent);
  elements.buttons.study.addEventListener("click", handleStudy);
  elements.btnContinuar.addEventListener("click", performShow);
  elements.jokeList.addEventListener("click", handleJokeListClick);
  elements.introContinue.addEventListener("click", advanceIntro);
  elements.avatarOptions.forEach((option) =>
    option.addEventListener("click", () => selectAvatar(option.dataset.avatar))
  );
  elements.dialogClose.addEventListener("click", hideDialog);
}

function bootGame() {
  state = loadGameState();
  updateStats();
  if (state.hasStarted && state.avatar) {
    enterGame(true);
    displayNarration(homeText);
  } else {
    startIntro();
  }
}

function startIntro() {
  uiMode = "intro";
  introStep = 0;
  setScene("intro", "Professor Carvalho", "carvalho.png");
  elements.introScreen.classList.remove("hidden");
  elements.screen.classList.add("hidden");
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
  if (!hasMore) {
    elements.avatarSelection.style.display = "flex";
  }
}

function advanceIntro() {
  if (introStep >= mentorIntroLines.length - 1) {
    return;
  }
  introStep += 1;
  playIntroLine();
}

function selectAvatar(key) {
  if (!avatarImages[key]) {
    return;
  }
  state.avatar = key;
  state.hasStarted = true;
  elements.avatarOptions.forEach((option) =>
    option.classList.toggle("selected", option.dataset.avatar === key)
  );
  setAvatarImage(key);
  enterGame();
  displayNarration(homeText);
  saveGameState();
}

function setAvatarImage(key) {
  const src = avatarImages[key] || avatarImages.boy;
  elements.avatarImg.src = src;
}

function enterGame(skipNarration = false) {
  uiMode = "idle";
  elements.introScreen.classList.add("hidden");
  elements.screen.classList.remove("hidden");
  setAvatarImage(state.avatar);
  setScene("home");
  if (!skipNarration) {
    displayNarration(homeText);
  }
}

function showDialog(message, actions = []) {
  elements.dialogText.textContent = message;
  elements.dialogActions.innerHTML = "";
  if (actions.length) {
    elements.dialogClose.classList.add("hidden");
    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.textContent = action.label;
      btn.addEventListener("click", () => {
        action.handler?.();
      });
      elements.dialogActions.appendChild(btn);
    });
  } else {
    elements.dialogClose.classList.remove("hidden");
  }
  elements.dialogBox.classList.remove("hidden");
}

function hideDialog() {
  elements.dialogBox.classList.add("hidden");
  elements.dialogActions.innerHTML = "";
  elements.dialogClose.classList.remove("hidden");
  if (uiMode === "event" && !activeEvent) {
    uiMode = "idle";
  }
}

function loadGameState() {
  const baseState = {
    name: "Red",
    stageTime: 0,
    jokes: [],
    language: "pt",
    avatar: null,
    hasStarted: false,
    fans: 0,
    motivation: 60,
    theory: 10,
    eventsSeen: [],
    lastSave: null
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return baseState;
    }
    const parsed = JSON.parse(raw);
    return {
      ...baseState,
      name: parsed.name || baseState.name,
      stageTime: parsed.stageTime ?? baseState.stageTime,
      jokes:
        Array.isArray(parsed.jokes) && parsed.jokes.length
          ? cloneJokes(parsed.jokes)
          : [],
      language: parsed.language || baseState.language,
      avatar: parsed.avatar || baseState.avatar,
      hasStarted: parsed.hasStarted ?? baseState.hasStarted,
      fans: parsed.fans ?? baseState.fans,
      motivation: parsed.motivation ?? baseState.motivation,
      theory: parsed.theory ?? baseState.theory,
      eventsSeen: Array.isArray(parsed.eventsSeen) ? parsed.eventsSeen : [],
      lastSave: parsed.lastSave || baseState.lastSave
    };
  } catch (error) {
    console.warn("Falha ao carregar save, iniciando novo jogo.", error);
    return baseState;
  }
}

function saveGameState() {
  const payload = {
    name: state.name,
    stageTime: state.stageTime,
    jokes: state.jokes,
    language: state.language,
     avatar: state.avatar,
     hasStarted: state.hasStarted,
     fans: state.fans,
     motivation: state.motivation,
     theory: state.theory,
     eventsSeen: state.eventsSeen,
    lastSave: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  state.lastSave = payload.lastSave;
}

function displayNarration(message) {
  elements.text.innerHTML = "";
  showText("#text", message, 0, 20);
}

function setScene(sceneKey, customTitle, customImage) {
  const scene = scenes[sceneKey] || {};
  elements.title.textContent = customTitle || scene.title || "Na estrada";
  elements.image.src = customImage || scene.image || "writing-at-home.jpg";
}

function updateStats() {
  state.fans = Math.max(0, Math.round(state.fans || 0));
  state.motivation = clamp(state.motivation ?? 60, 0, 120);
  state.theory = clamp(state.theory ?? 10, 0, 120);
  elements.stats.name.textContent = state.name;
  elements.stats.stage.textContent = `${state.stageTime}x`;
  const totalMinutes = getTotalMinutes();
  elements.stats.material.textContent = `${totalMinutes}min`;
  const levelLabel = determineLevel(totalMinutes);
  elements.stats.level.textContent = levelLabel;
  if (lastLevelLabel && levelLabel !== lastLevelLabel) {
    showDialog(`Você evoluiu para o nível ${levelLabel}!`);
  }
  lastLevelLabel = levelLabel;
  elements.stats.fans.textContent = state.fans;
  elements.stats.motivation.textContent = `${state.motivation}`;
  elements.stats.theory.textContent = `${state.theory}`;
}

function determineLevel(minutes) {
  if (minutes >= 20) {
    return "Headliner";
  }
  if (minutes >= 12) {
    return "Elenco";
  }
  if (minutes >= 6) {
    return "Opener";
  }
  return "Novato";
}

function getTotalMinutes() {
  return state.jokes.reduce((acc, joke) => acc + (joke.minutes || 0), 0);
}

function drawUniqueIdea() {
  const usedTitles = new Set((state?.jokes || []).map((joke) => joke.title));
  const unused = ideaPool.filter((idea) => !usedTitles.has(formatIdeaTitle(idea)));
  if (!unused.length) {
    return null;
  }
  return unused[Math.floor(Math.random() * unused.length)];
}

function handleWriteJoke() {
  if (uiMode === "event") {
    return;
  }
  if (uiMode === "chooseWritingMode") {
    exitWritingMode();
    return;
  }
  exitSelectionMode();
  presentWritingModes();
}

function presentWritingModes() {
  uiMode = "chooseWritingMode";
  elements.subTitle.textContent = "Como você quer criar material hoje?";
  elements.btnDivLow.style.display = "flex";
  const buttons = Object.values(writingModes)
    .map(
      (mode) => `
        <button class="writing-mode-btn" data-mode="${mode.id}">
          ${mode.label}<br /><small>${mode.desc}</small>
        </button>
      `
    )
    .join("");
  elements.btnDivLow.innerHTML = `
    <div>Você pode gastar motivação para lapidar o texto ou coletar ideias rápidas.</div>
    ${buttons}
  `;
  elements.btnDivLow
    .querySelectorAll(".writing-mode-btn")
    .forEach((btn) => btn.addEventListener("click", () => createJokeFromMode(btn.dataset.mode)));
}

function exitWritingMode() {
  if (uiMode === "chooseWritingMode") {
    uiMode = "idle";
  }
  elements.btnDivLow.style.display = "none";
  elements.btnDivLow.innerHTML = "";
  resetSubtitle();
}

function createJokeFromMode(modeId) {
  const idea = drawUniqueIdea();
  if (!idea) {
    displayNarration(
      "Seu cérebro reciclou todas as ideias possíveis hoje. Delete algo velho ou viva um pouco para ter material novo."
    );
    exitWritingMode();
    return;
  }
  const mode = writingModes[modeId] || writingModes.desk;
  state.motivation = clamp(state.motivation - mode.motivationCost, 0, 120);
  state.theory = clamp(state.theory + Math.round(mode.theoryBonus * 20), 0, 120);
  const roll = Math.random();
  const addMinute = Math.random() < Math.max(0, mode.timeBonus);
  const minutes = clamp(idea.baseMinutes + (addMinute ? 1 : 0), 1, 2);
  const basePotential = generatePotential();
  const adjustedPotential = clamp(
    basePotential + (state.theory / 220) + (state.motivation - 60) / 400 + mode.theoryBonus,
    0.2,
    0.95
  );
  const label =
    adjustedPotential > 0.75 ? "🔥 perigosa porém promissora" : adjustedPotential > 0.5 ? "🙂 tem caminho" : "😬 parece frágil";
  const structurePool = mode.id === "desk" ? ["storytelling", "bit"] : ["oneliner", "prop"];
  const structure =
    structurePool[Math.floor(Math.random() * structurePool.length)] ||
    structures[Math.floor(Math.random() * structures.length)];
  const newJoke = {
    id: createId(),
    title: formatIdeaTitle(idea),
    tone: idea.tone,
    structure,
    minutes,
    lastResult: "⏱️ ainda não testada",
    freshness: "nova",
    notes: `Nasceu ${idea.mood}`,
    history: [],
    truePotential: adjustedPotential,
    writingMode: mode.id
  };
  state.jokes.push(newJoke);
  exitWritingMode();
  renderJokeList({ selectable: false });
  updateStats();
  setScene("writing");
  displayNarration(
    `Você decide ${mode.label.toLowerCase()}. Sai de lá com uma nova piada sobre ${idea.seed}. Ela tem ${minutes} min e parece ${label}.`
  );
  maybeTriggerEvent("random", { source: "writing" });
}

function handleSearchShow() {
  if (!state.jokes.length) {
    displayNarration("Você ainda não tem material. Escreva alguma coisa antes de encarar a plateia.");
    return;
  }
  const randomShow = showPool[Math.floor(Math.random() * showPool.length)];
  beginShowPreparation(randomShow);
}

function beginShowPreparation(show) {
  currentShow = show;
  uiMode = "showSelection";
  selectedJokeIds.clear();
  elements.subTitle.textContent = `Monte pelo menos ${show.minMinutes} min para ${show.name}`;
  renderJokeList({ selectable: true });
  renderSetSummary();
  setScene("club", show.name, show.image);
  displayNarration(`${show.intro} ${show.crowd}`);
  elements.btnContinuar.style.display = "block";
  elements.btnContinuar.textContent = "Subir no palco";
}

function startSpecialShow(showId) {
  const specialShow = findShowById(showId);
  if (!specialShow) {
    displayNarration("O convite sumiu antes de virar realidade. Melhor voltar a escrever.");
    uiMode = "idle";
    return;
  }
  hideDialog();
  beginShowPreparation(specialShow);
}

function handleViewMaterial() {
  exitSelectionMode();
  uiMode = "viewMaterial";
  elements.subTitle.textContent = "Todo o seu material";
  renderJokeList({ selectable: false });
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `<div>Minutos totais: ${getTotalMinutes()} | Piadas: ${state.jokes.length}</div>`;
  setScene("home");
  displayNarration("Você revisa o caderno e lembra quais piadas ainda valem subir ao palco.");
}

function handleSaveGame() {
  saveGameState();
  displayNarration("Jogo salvo no seu navegador. Pode fechar o bloco e voltar quando quiser.");
}

function handleCreateContent() {
  if (uiMode === "event") {
    return;
  }
  exitSelectionMode();
  const reach = Math.max(3, Math.round(state.stageTime + getTotalMinutes() + Math.random() * 10));
  const fanGain = reach + Math.round(state.theory / 3);
  state.fans += fanGain;
  state.motivation = clamp(state.motivation - 6 + Math.round(Math.random() * 4), 0, 120);
  setScene("content");
  displayNarration(
    `Você grava clipes e posta nas redes. ${fanGain} novas pessoas começam a te seguir e aguardam o próximo set.`
  );
  updateStats();
  maybeTriggerEvent("random", { source: "content" });
  maybeTriggerEvent("fans20");
}

function handleStudy() {
  if (uiMode === "event") {
    return;
  }
  exitSelectionMode();
  state.theory = clamp(state.theory + 12, 0, 150);
  state.motivation = clamp(state.motivation + 4, 0, 120);
  setScene("study");
  displayNarration("Você mergulha em especiais, podcasts e livros de comédia. Novas estruturas aparecem no caderno.");
  updateStats();
}

function renderJokeList({ selectable }) {
  const shouldDisplay = uiMode === "showSelection" || uiMode === "viewMaterial";
  elements.jokeList.dataset.selectable = selectable ? "true" : "false";
  elements.jokeList.innerHTML = "";

  if (!shouldDisplay) {
    elements.jokeList.style.display = "none";
    elements.legend.style.display = "none";
    return;
  }

  elements.legend.textContent = LEGEND_TEXT;
  elements.legend.style.display = "block";

  if (!state.jokes.length) {
    elements.jokeList.innerHTML =
      '<li class="joke-item read-only"><strong>Sem piadas no bloco.</strong> Bora escrever algo.</li>';
    elements.jokeList.style.display = "block";
    return;
  }

  state.jokes.forEach((joke) => {
    const li = document.createElement("li");
    li.classList.add("joke-item");
    if (!selectable) {
      li.classList.add("read-only");
    }
    li.dataset.id = joke.id;
    if (selectedJokeIds.has(joke.id)) {
      li.classList.add("selected");
    }
    const historyLine = formatHistory(joke.history);
    li.innerHTML = `
      <div><strong>${joke.title}</strong> — ${joke.minutes} min | ${joke.structure?.toUpperCase() || "SET"}</div>
      <div class="joke-history">${historyLine}</div>
      <div class="joke-meta">
        <span>${describeTone(joke.tone)}</span>
        <span>${joke.lastResult}</span>
      </div>
    `;
    if (uiMode === "viewMaterial") {
      const actions = document.createElement("div");
      actions.classList.add("actions");
      actions.innerHTML =
        '<button class="rewrite-btn">Reescrever</button><button class="delete-btn">Apagar</button>';
      li.appendChild(actions);
    }
    elements.jokeList.appendChild(li);
  });
  elements.jokeList.style.display = "block";
}

function handleJokeListClick(event) {
  const item = event.target.closest("li");
  if (!item) {
    return;
  }

  const deleteBtn = event.target.closest(".delete-btn");
  if (deleteBtn) {
    if (uiMode === "viewMaterial") {
      deleteJoke(item.dataset.id);
    }
    return;
  }

  const rewriteBtn = event.target.closest(".rewrite-btn");
  if (rewriteBtn) {
    if (uiMode === "viewMaterial") {
      rewriteJoke(item.dataset.id);
    }
    return;
  }

  const isSelectable = elements.jokeList.dataset.selectable === "true";
  if (!isSelectable) {
    return;
  }

  const id = item.dataset.id;
  if (selectedJokeIds.has(id)) {
    selectedJokeIds.delete(id);
  } else {
    selectedJokeIds.add(id);
  }
  renderJokeList({ selectable: true });
  renderSetSummary();
}

function deleteJoke(jokeId) {
  const jokeIndex = state.jokes.findIndex((joke) => joke.id === jokeId);
  if (jokeIndex === -1) {
    return;
  }
  const [removed] = state.jokes.splice(jokeIndex, 1);
  selectedJokeIds.delete(jokeId);
  updateStats();
  renderJokeList({ selectable: false });
  if (uiMode === "viewMaterial") {
    elements.btnDivLow.style.display = "flex";
    elements.btnDivLow.innerHTML = `<div>Minutos totais: ${getTotalMinutes()} | Piadas: ${state.jokes.length}</div>`;
  }
  displayNarration(`${removed.title} foi aposentada. Hora de escrever algo no lugar.`);
}

function rewriteJoke(jokeId) {
  const joke = state.jokes.find((entry) => entry.id === jokeId);
  if (!joke) {
    return;
  }
  state.motivation = clamp(state.motivation - 4, 0, 120);
  const potentialDelta = (Math.random() * 0.2 - 0.05) + state.theory / 500;
  joke.truePotential = clamp((joke.truePotential || 0.4) + potentialDelta, 0.2, 0.99);
  joke.structure = structures[Math.floor(Math.random() * structures.length)];
  joke.minutes = Math.random() > 0.8 ? 2 : 1;
  joke.freshness = "reescrita";
  displayNarration(`${joke.title} ganhou um novo ritmo ${joke.structure.toUpperCase()} e foi atualizado.`);
  renderJokeList({ selectable: false });
  updateStats();
}

function renderSetSummary() {
  if (uiMode !== "showSelection") {
    elements.btnDivLow.style.display = "none";
    return;
  }
  const selectedJokes = state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const minutes = selectedJokes.reduce((sum, joke) => sum + joke.minutes, 0);
  const tones =
    [...new Set(selectedJokes.map((joke) => describeTone(joke.tone)))].join(" / ") || "—";
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div>Set atual: ${selectedJokes.length} piadas | ${minutes} min</div>
    <div>Clima do set: ${tones}</div>
    ${currentShow ? `<div>Dificuldade do show: ${(currentShow.difficulty * 100).toFixed(0)}% caos</div>` : ""}
    ${currentShow?.vibeHint ? `<div>${currentShow.vibeHint}</div>` : ""}
  `;
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

function performShow() {
  if (!currentShow) {
    return;
  }
  const showPlayed = currentShow;
  const setList = state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const totalMinutes = setList.reduce((sum, joke) => sum + joke.minutes, 0);
  if (!setList.length) {
    displayNarration("Você precisa selecionar alguma piada antes de subir.");
    return;
  }
  const evaluation = evaluateShow(setList, currentShow);
  const breakdownWithEmoji = evaluation.breakdown.map((entry) => {
    const mood = scoreToEmoji(entry.score);
    return { ...entry, emoji: mood.emoji, label: mood.label };
  });
  const timeImpact = evaluateStageTime(totalMinutes, currentShow.minMinutes, evaluation.averageScore);
  const adjustedScore = evaluation.averageScore + timeImpact.adjustment;
  const outcome = classifyOutcome(adjustedScore);
  applyOutcome(setList, outcome, breakdownWithEmoji);
  state.stageTime += 1;
  const fanGain =
    outcome === "kill"
      ? Math.max(3, Math.round(totalMinutes * 2))
      : outcome === "ok"
      ? Math.max(1, Math.round(totalMinutes * 0.6))
      : 0;
  state.fans += fanGain;
  const motivationShift = outcome === "kill" ? 12 : outcome === "ok" ? -1 : -10;
  state.motivation = clamp(state.motivation + motivationShift, 0, 120);
  updateStats();
  renderJokeList({ selectable: false });
  exitSelectionMode();
  showResultNarrative(outcome, breakdownWithEmoji, timeImpact, {
    fans: fanGain,
    motivation: motivationShift
  });
  const eventContext = {
    outcome,
    show: showPlayed,
    averageScore: evaluation.averageScore,
    adjustedScore
  };
  if (outcome === "kill") {
    maybeTriggerEvent("showKill", eventContext);
  } else if (outcome === "bomb") {
    maybeTriggerEvent("showBomb", eventContext);
  } else {
    maybeTriggerEvent("random", eventContext);
  }
  if (state.fans >= 20) {
    maybeTriggerEvent("fans20");
  }
}

function evaluateShow(setList, show) {
  let totalScore = 0;
  const breakdown = [];
  setList.forEach((joke) => {
    const potencyComponent = clamp(joke.truePotential || 0.4, 0, 1) * 0.6;
    const typeComponent = getTypeAffinity(show, joke.tone) * 0.2;
    const chaosComponent = (Math.random() * 2 - 1) * 0.2;
    const difficultyPenalty = show.difficulty || 0;
    const jokeScore = potencyComponent + typeComponent + chaosComponent - difficultyPenalty;
    totalScore += jokeScore;
    breakdown.push({
      title: joke.title,
      score: jokeScore
    });
  });
  return {
    averageScore: totalScore / setList.length,
    breakdown
  };
}

function getTypeAffinity(show, tone) {
  const map = show.typeAffinity || {};
  if (typeof map[tone] === "number") {
    return clamp(map[tone], -1, 1);
  }
  if (typeof map.default === "number") {
    return clamp(map.default, -1, 1);
  }
  return 0;
}

function evaluateStageTime(actualMinutes, expectedMinutes, baseScore) {
  const ratio = actualMinutes / expectedMinutes;
  let adjustment = 0;
  let note = "Tempo na medida, produtor sorriu pra você.";

  if (ratio < 0.6) {
    adjustment -= 0.25;
    note = "Você saiu cedo demais e deixou a plateia confusa.";
  } else if (ratio < 0.9) {
    adjustment -= 0.12;
    note = "Você entregou menos tempo que o combinado.";
  } else if (ratio > 1.6) {
    adjustment -= 0.2;
    note = "Passou demais do tempo e o produtor te cortou o microfone.";
  } else if (ratio > 1.2) {
    adjustment -= 0.08;
    note = "Você estourou alguns minutos e o clima ficou tenso.";
  }

  if (ratio < 0.9 && baseScore >= 0.35) {
    adjustment += 0.07;
    note = "Você fez menos tempo, mas foi tão bom que ninguém reclamou.";
  }

  if (ratio > 1.2 && baseScore >= 0.35) {
    adjustment += 0.12;
    note = "Você passou do tempo porque a plateia te segurou no palco.";
  }

  return { adjustment, note, ratio };
}

function classifyOutcome(score) {
  if (score >= 0.35) {
    return "kill";
  }
  if (score >= 0.18) {
    return "ok";
  }
  return "bomb";
}

function applyOutcome(setList, outcome, breakdown = []) {
  setList.forEach((joke, index) => {
    const detail = breakdown[index];
    const mood = detail ? { emoji: detail.emoji, label: detail.label } : fallbackEmojiForOutcome(outcome);
    joke.history = [...(joke.history || []), mood.emoji].slice(-7);
    joke.lastResult = `${mood.emoji} ${mood.label}`;
    if (outcome === "kill") {
      joke.freshness = "rodado";
    } else if (outcome === "bomb") {
      joke.freshness = "precisa reescrever";
    }
  });
}

function showResultNarrative(outcome, breakdown, timeImpact, deltas = {}) {
  let message = "";
  if (outcome === "kill") {
    setScene("kill");
    message =
      "Você matou no palco! A plateia pediu mais uma e você nem acreditou. Algumas piadas renovaram a confiança.";
  } else if (outcome === "ok") {
    setScene("ok");
    message =
      "Foi honesto. Algumas risadas fortes, alguns silêncios constrangedores. Dá pra refinar o set e tentar de novo.";
  } else {
    setScene("bomb");
    message =
      "Silêncio mortal. O garçom falou mais alto que você. Aceite que faz parte do processo e ajuste o texto.";
  }
  const detalhes = breakdown.length
    ? breakdown.map((entry) => `${entry.title} ${entry.emoji}`).join(" | ")
    : "";
  const tempoNota = timeImpact?.note ? ` ${timeImpact.note}` : "";
  const breakdownText = detalhes ? ` (${detalhes})` : "";
  const statFragments = [];
  if (deltas.fans) {
    statFragments.push(`Fãs ${formatSigned(deltas.fans)}`);
  }
  if (deltas.motivation) {
    statFragments.push(`Motivação ${formatSigned(deltas.motivation)}`);
  }
  const statsText = statFragments.length ? ` [${statFragments.join(" | ")}]` : "";
  displayNarration(`${message}${tempoNota}${breakdownText}${statsText}`);
}

function fallbackEmojiForOutcome(outcome) {
  if (outcome === "kill") {
    return scoreToEmoji(0.4);
  }
  if (outcome === "ok") {
    return scoreToEmoji(0.2);
  }
  return scoreToEmoji(-0.2);
}
