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

// Animation utilities
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

// Warm jazz/retro color palette for effects
const confettiColors = ['#d4a84b', '#ffd966', '#f5e6c8', '#a65d4e', '#5a8f5a'];

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
    if (isPositive) {
      statElement.style.setProperty('--stat-color', 'var(--neon-cyan)');
    } else {
      statElement.style.setProperty('--stat-color', 'var(--neon-pink)');
    }
    setTimeout(() => {
      statElement.classList.remove('stat-updated');
    }, 500);
  }
};

const animateNumber = (element, start, end, duration = 500) => {
  const startTime = performance.now();
  const diff = end - start;
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + diff * easeProgress);
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

const shakeScreen = () => {
  const game = document.getElementById('game');
  game.style.animation = 'shake 0.5s ease';
  setTimeout(() => {
    game.style.animation = '';
  }, 500);
};

const flashScreen = (color = 'rgba(212, 168, 75, 0.25)') => {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${color};
    pointer-events: none;
    z-index: 9999;
    animation: fadeOut 0.25s ease forwards;
  `;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 250);
};

// Add CSS for flash animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  .ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  }
  @keyframes ripple {
    from { transform: scale(0); opacity: 1; }
    to { transform: scale(4); opacity: 0; }
  }
`;
document.head.appendChild(style);

const STORAGE_KEY = "openMicRPG.save.v2";
const LEGEND_TEXT = "🤯 explodiu | 🔥 matou | 🙂 segurou | 😶 risinhos | 💧 deu água";

// ========== SOUND SYSTEM ==========
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

// Preload sounds
Object.values(sounds).forEach(sound => {
  sound.volume = 0.3; // 30% volume
  sound.load();
});

function playSound(soundName) {
  if (sounds[soundName]) {
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
  }
}

// ========== TIME SYSTEM ==========
const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MAX_ACTIVITY_POINTS = 1;

const ACTIVITY_COSTS = {
  study: 1,
  desk: 1,           // sentar e escrever
  day: 0.5,          // anotar durante o dia
  contentLong: 1,    // criar conteúdo longo
  contentQuick: 0.5  // criar conteúdo rápido
};

// Note: With MAX_ACTIVITY_POINTS = 1, player can do:
// - 1 major activity (study, desk write, content long) per day
// - OR 2 minor activities (day notes, quick content) per day

const createInitialTimeState = () => ({
  currentDay: 1,
  currentWeekDay: 1, // Segunda
  currentWeek: 1,
  activityPoints: MAX_ACTIVITY_POINTS,
  scheduledShow: null, // { showId, dayScheduled }
  showHistory: [],     // track shows done for progression
  consecutiveGoodShows: 0, // for flow state
  flowState: null,     // { active: true, daysRemaining: X, endChance: 0.2 }
  eventsThisWeek: 0,   // track events per week (max 1-3)
  showsThisWeek: 0     // track shows per week (max 3)
});

const allowedTones = ["besteirol", "vulgar", "limpo", "humor negro", "hack"];

const toneDescriptions = {
  besteirol: "besteiras descompromissadas",
  vulgar: "piadas pesadas sem filtro",
  limpo: "humor família e bobinho",
  "humor negro": "piadas azedas que dividem a sala",
  hack: "observações batidas porém eficientes"
};

// 5 níveis de resultado: nota 5 (explodiu) até nota 1 (deu água)
const SCORE_EMOJI_SCALE = [
  { threshold: 0.45, emoji: "🤯", label: "Explodiu", nota: 5 },
  { threshold: 0.32, emoji: "🔥", label: "Matou", nota: 4 },
  { threshold: 0.18, emoji: "🙂", label: "Segurou", nota: 3 },
  { threshold: 0.05, emoji: "😶", label: "Risinhos", nota: 2 },
  { threshold: -Infinity, emoji: "💧", label: "Deu água", nota: 1 }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatSigned = (value) => (value > 0 ? `+${value}` : `${value}`);

const formatIdeaTitle = (idea) => idea.customTitle || `Piada sobre ${idea.seed}`;

const generatePotential = () => parseFloat((0.35 + Math.random() * 0.5).toFixed(2));

const scoreToEmoji = (score) => {
  const normalized = Number.isFinite(score) ? score : 0;
  const tier = SCORE_EMOJI_SCALE.find((t) => normalized >= t.threshold) || SCORE_EMOJI_SCALE[SCORE_EMOJI_SCALE.length - 1];
  return { emoji: tier.emoji, label: tier.label, nota: tier.nota };
};

const structures = ["oneliner", "storytelling", "bit", "prop"];

const structureDescriptions = {
  oneliner: "Piada curta e direta, que não necessita de mais contexto.",
  storytelling: "Uma narrativa, uma história com vários punchs.",
  bit: "Sequência de piadas conectadas sobre um mesmo tema.",
  prop: "Usa objetos ou elementos visuais para complementar a piada."
};

const toneDescriptionsLong = {
  besteirol: "Humor bobo e descompromissado. Funciona bem com plateias relaxadas que querem rir sem pensar.",
  vulgar: "Piadas pesadas, linguagem explícita. Pode dividir a sala, mas conecta com quem curte.",
  limpo: "Humor família, sem palavrões. Ideal para corporativos e eventos diversos.",
  "humor negro": "Piadas sobre temas tabu. Pode ser brilhante ou desastroso dependendo da plateia.",
  hack: "Observações batidas mas eficientes. Todo mundo já ouviu, mas ainda funciona."
};

const writingModes = {
  desk: {
    id: "desk",
    label: "Sentar e escrever",
    desc: "Gasta motivação mas aumenta a chance de gerar algo sólido.",
    costLabel: "⚡ 1 ponto",
    motivationCost: 8,
    theoryBonus: 0.05,
    timeBonus: 0.4
  },
  day: {
    id: "day",
    label: "Anotar durante o dia",
    desc: "Mais leve, rende ideias rápidas e mantém motivação em alta.",
    costLabel: "⚡ 0.5 ponto",
    motivationCost: -5,
    theoryBonus: 0,
    timeBonus: 0
  }
};

const defaultJokes = [];

const ideaPool = [
  // BESTEIROL (12 piadas)
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
    seed: "coach de paquera em metrô lotado",
    tone: "besteirol",
    baseMinutes: 1,
    place: "voltar pra casa espremido no rush",
    mood: "transporte público"
  },
  {
    seed: "gente que leva marmita pro rolê",
    tone: "besteirol",
    baseMinutes: 1,
    place: "observar a galera nos botecos baratos",
    mood: "economia criativa"
  },
  {
    seed: "amigo que faz trilha sonora da própria vida",
    tone: "besteirol",
    baseMinutes: 1,
    place: "sair com amigos no fim de semana",
    mood: "comportamento"
  },
  {
    seed: "porteiro que sabe tudo da sua vida",
    tone: "besteirol",
    baseMinutes: 1,
    place: "conversa rápida no prédio",
    mood: "condomínio"
  },
  {
    seed: "pessoa que conta o sonho inteiro",
    tone: "besteirol",
    baseMinutes: 1,
    place: "café da manhã com colegas",
    mood: "social"
  },
  {
    seed: "cardápio de restaurante em inglês errado",
    tone: "besteirol",
    baseMinutes: 1,
    place: "almoçar fora no bairro",
    mood: "cotidiano"
  },
  {
    seed: "casal que faz tudo combinando roupa",
    tone: "besteirol",
    baseMinutes: 1,
    place: "passeio no shopping",
    mood: "relacionamentos"
  },
  {
    seed: "tio que manda bom dia no grupo às 5h",
    tone: "besteirol",
    baseMinutes: 1,
    place: "olhar celular ao acordar",
    mood: "família"
  },
  {
    seed: "áudio de WhatsApp de 7 minutos",
    tone: "besteirol",
    baseMinutes: 2,
    place: "receber mensagem do amigo prolixo",
    mood: "tecnologia"
  },
  {
    seed: "pessoa que fala 'com certeza absoluta'",
    tone: "besteirol",
    baseMinutes: 1,
    place: "reunião de trabalho",
    mood: "corporativo"
  },

  // VULGAR (8 piadas)
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
    seed: "academia às 6h da manhã",
    tone: "vulgar",
    baseMinutes: 1,
    place: "tentar entrar em forma",
    mood: "saúde"
  },
  {
    seed: "match que some após o encontro",
    tone: "vulgar",
    baseMinutes: 1,
    place: "usar app de relacionamento",
    mood: "dating"
  },
  {
    seed: "vizinho barulhento de madrugada",
    tone: "vulgar",
    baseMinutes: 2,
    place: "tentar dormir numa sexta",
    mood: "condomínio"
  },
  {
    seed: "motel com tema de castelo",
    tone: "vulgar",
    baseMinutes: 1,
    place: "passeio com a pessoa",
    mood: "relacionamentos"
  },
  {
    seed: "praia lotada no verão",
    tone: "vulgar",
    baseMinutes: 1,
    place: "férias no litoral",
    mood: "perrengue"
  },
  {
    seed: "depilação pela primeira vez",
    tone: "vulgar",
    baseMinutes: 1,
    place: "se preparar pra ocasião",
    mood: "autocuidado"
  },

  // LIMPO (10 piadas)
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
    seed: "vizinho que toca sax às 6h",
    tone: "limpo",
    baseMinutes: 1,
    place: "tentar dormir mais um pouco no sábado",
    mood: "condomínio"
  },
  {
    seed: "avó que não entende celular",
    tone: "limpo",
    baseMinutes: 1,
    place: "visitar os avós",
    mood: "família"
  },
  {
    seed: "criança perguntando 'por quê' infinitamente",
    tone: "limpo",
    baseMinutes: 1,
    place: "cuidar do filho do amigo",
    mood: "crianças"
  },
  {
    seed: "cachorro que late pra própria sombra",
    tone: "limpo",
    baseMinutes: 1,
    place: "passear com o pet",
    mood: "animais"
  },
  {
    seed: "pai que não pede informação",
    tone: "limpo",
    baseMinutes: 1,
    place: "viagem de carro em família",
    mood: "família"
  },
  {
    seed: "mãe no supermercado encontrando conhecida",
    tone: "limpo",
    baseMinutes: 2,
    place: "fazer compras com a mãe",
    mood: "família"
  },
  {
    seed: "dentista tentando conversar durante procedimento",
    tone: "limpo",
    baseMinutes: 1,
    place: "ir ao dentista",
    mood: "cotidiano"
  },
  {
    seed: "professor de autoescola nervoso",
    tone: "limpo",
    baseMinutes: 1,
    place: "tentar tirar carteira",
    mood: "aprendizado"
  },

  // HUMOR NEGRO (10 piadas)
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
    seed: "empresa que faz festa sem bebida",
    tone: "humor negro",
    baseMinutes: 2,
    place: "aceitar corporativo às pressas",
    mood: "falta de noção"
  },
  {
    seed: "terapeuta que precisa de terapia",
    tone: "humor negro",
    baseMinutes: 1,
    place: "sessão semanal",
    mood: "saúde mental"
  },
  {
    seed: "consulta de 5 minutos após 2h de espera",
    tone: "humor negro",
    baseMinutes: 1,
    place: "ir ao posto de saúde",
    mood: "sistema público"
  },
  {
    seed: "férias que cansam mais que trabalho",
    tone: "humor negro",
    baseMinutes: 1,
    place: "voltar de viagem",
    mood: "cansaço"
  },
  {
    seed: "amigo MLM que some e reaparece vendendo",
    tone: "humor negro",
    baseMinutes: 1,
    place: "receber mensagem suspeita",
    mood: "social"
  },
  {
    seed: "velório com wifi",
    tone: "humor negro",
    baseMinutes: 1,
    place: "situação delicada",
    mood: "morte"
  },
  {
    seed: "ansiedade de domingo às 18h",
    tone: "humor negro",
    baseMinutes: 1,
    place: "fim de semana acabando",
    mood: "trabalho"
  },
  {
    seed: "remédio com lista de efeitos colaterais",
    tone: "humor negro",
    baseMinutes: 1,
    place: "ler bula na farmácia",
    mood: "saúde"
  },

  // HACK (10 piadas)
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
    seed: "curso online de charuto artesão",
    tone: "hack",
    baseMinutes: 2,
    place: "cair em anúncios estranhos às 3h",
    mood: "internet"
  },
  {
    seed: "influencer fazendo publi de imposto",
    tone: "hack",
    baseMinutes: 1,
    place: "rolar o feed até perder a noção do tempo",
    mood: "mídia"
  },
  {
    seed: "comida de avião",
    tone: "hack",
    baseMinutes: 1,
    place: "voo longo",
    mood: "viagem"
  },
  {
    seed: "diferença de supermercado caro e barato",
    tone: "hack",
    baseMinutes: 1,
    place: "fazer compras do mês",
    mood: "economia"
  },
  {
    seed: "wifi de hotel que não funciona",
    tone: "hack",
    baseMinutes: 1,
    place: "viagem a trabalho",
    mood: "tecnologia"
  },
  {
    seed: "atendimento robotizado que não entende",
    tone: "hack",
    baseMinutes: 1,
    place: "ligar pro banco",
    mood: "burocracia"
  },
  {
    seed: "reunião que podia ser email",
    tone: "hack",
    baseMinutes: 1,
    place: "rotina de escritório",
    mood: "corporativo"
  },
  {
    seed: "GPS que manda por caminho absurdo",
    tone: "hack",
    baseMinutes: 1,
    place: "dirigir na cidade",
    mood: "tecnologia"
  }
];

const showPool = [
  // NOTE: "Copo Sujo" shows (5a5, pague15) are special and defined at the end of this pool
  // They are unlocked via Paulo Araújo eventos surpresa, not available in regular rotation
  {
    id: "bar-do-tony",
    name: "Bar do Tony - Quarta do Riso",
    minMinutes: 5,
    difficulty: 0.25,
    crowd: "Clientes distraídos, olhando pra TV, só param pra ouvir causos pessoais que parecem verdade.",
    intro:
      "Tony te chamou pra completar a noite. Plateia espalhada, TV ligada no jogo. Só sobe quem confia no próprio texto.",
    image: "bar-do-tony.png",
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
    image: "corporativo.png",
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
    image: "barzinho.png",
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
    image: "outdoor-gig.png",
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
    image: "mall.png",
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
    image: "motorcycle-club.png",
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
    image: "teatro-municipal.png",
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
    image: "podcast.png",
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
    image: "barber-shop.png",
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
    image: "art-gallery.png",
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
    image: "rooftop-tech-meetup.png",
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
    image: "barzinho.png",
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
    image: "bar-do-tony.png",
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
    image: "comedy-turne-veterano.png",
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
    image: "coffee-break.png",
    vibeHint: "Piadas limpas sobre trabalho e improvisos corporativos salvam.",
    typeAffinity: {
      default: -0.2,
      besteirol: -0.1,
      vulgar: -0.7,
      "humor negro": -0.3,
      limpo: 0.6,
      hack: 0.7
    }
  },
  // ========== NEW SHOWS ==========
  {
    id: "bar-universitario",
    name: "Open Mic Universitário",
    minMinutes: 4,
    difficulty: 0.18,
    crowd: "Estudantes bêbados que riem de qualquer coisa depois das 23h.",
    intro: "Um bar perto da faculdade abre espaço para novatos. Público jovem e barulhento.",
    image: "open-universitario.png",
    vibeHint: "Besteirol e vulgaridade funcionam bem com essa galera.",
    typeAffinity: {
      default: 0,
      besteirol: 0.7,
      vulgar: 0.5,
      "humor negro": 0.2,
      limpo: -0.2,
      hack: 0.2
    }
  },
  {
    id: "livraria-cultural",
    name: "Livraria & Riso",
    minMinutes: 5,
    difficulty: 0.3,
    crowd: "Intelectuais com café na mão, buscando humor sofisticado.",
    intro: "Uma livraria cult quer animar as noites de sábado com stand-up entre as estantes.",
    image: "biblioteca.png",
    vibeHint: "Referências culturais e humor inteligente impressionam.",
    typeAffinity: {
      default: 0,
      besteirol: -0.2,
      vulgar: -0.5,
      "humor negro": 0.4,
      limpo: 0.5,
      hack: 0.3
    }
  },
  {
    id: "pub-irlandes",
    name: "Pub O'Laughs",
    minMinutes: 5,
    difficulty: 0.28,
    crowd: "Gringos expatriados e brasileiros que fingem entender inglês.",
    intro: "Um pub irlandês faz noite de comédia bilíngue. Sotaque não é problema.",
    image: "pub.png",
    vibeHint: "Piadas universais sobre comportamento funcionam em qualquer língua.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.4,
      vulgar: 0.1,
      "humor negro": 0.2,
      limpo: 0.3,
      hack: 0.4
    }
  },
  {
    id: "churrascaria",
    name: "Comedy & Carne",
    minMinutes: 4,
    difficulty: 0.22,
    crowd: "Famílias em rodízio que não vieram pra prestar atenção.",
    intro: "Uma churrascaria resolveu colocar entretenimento. Concorra com a picanha.",
    image: "bar-do-tony.png",
    vibeHint: "Material limpo e observações sobre comida ganham a mesa.",
    typeAffinity: {
      default: -0.1,
      besteirol: 0.3,
      vulgar: -0.4,
      "humor negro": -0.3,
      limpo: 0.6,
      hack: 0.4
    }
  },
  {
    id: "teatro-alternativo",
    name: "Teatro do Porão",
    minMinutes: 6,
    difficulty: 0.38,
    crowd: "Plateia cult que curte o underground e detesta o mainstream.",
    intro: "Um teatro de porão te convida para a noite experimental. Vale tudo.",
    image: "teatro-legal.png",
    vibeHint: "Ousadia e originalidade são mais importantes que punchlines perfeitas.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.1,
      vulgar: 0.3,
      "humor negro": 0.6,
      limpo: -0.3,
      hack: -0.2
    }
  },
  {
    id: "stand-up-sertanejo",
    name: "Riso & Viola",
    minMinutes: 5,
    difficulty: 0.25,
    crowd: "Fãs de sertanejo entre uma música e outra do show principal.",
    intro: "Uma casa de shows sertaneja quer esquentar a plateia antes da banda.",
    image: "bar-do-tony.png",
    vibeHint: "Piadas sobre interior, família e relacionamento agradam.",
    typeAffinity: {
      default: 0,
      besteirol: 0.4,
      vulgar: 0.2,
      "humor negro": -0.2,
      limpo: 0.5,
      hack: 0.3
    }
  },
  {
    id: "hostel-mochileiro",
    name: "Backpacker Comedy",
    minMinutes: 4,
    difficulty: 0.2,
    crowd: "Mochileiros de todas as idades compartilhando histórias de viagem.",
    intro: "Um hostel faz noite de talentos. Qualquer um pode subir.",
    image: "copo-sujo-comedy.png",
    vibeHint: "Histórias de perrengue e observações culturais conectam.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.5,
      vulgar: 0.2,
      "humor negro": 0.1,
      limpo: 0.3,
      hack: 0.3
    }
  },
  {
    id: "casamento",
    name: "Festa de Casamento",
    minMinutes: 6,
    difficulty: 0.45,
    crowd: "Parentes que não se veem há anos e amigos bêbados dos noivos.",
    intro: "Os noivos te contrataram para o brinde. Não estrague o dia mais importante deles.",
    image: "wedding.png",
    vibeHint: "Piadas sobre relacionamento e família, mas sem ser ofensivo.",
    typeAffinity: {
      default: -0.1,
      besteirol: 0.2,
      vulgar: -0.6,
      "humor negro": -0.4,
      limpo: 0.7,
      hack: 0.4
    }
  },
  {
    id: "show-beneficente",
    name: "Stand-Up Solidário",
    minMinutes: 5,
    difficulty: 0.3,
    crowd: "Pessoas generosas que pagaram ingresso caro por uma boa causa.",
    intro: "Um evento beneficente te convida. A causa é nobre, a pressão também.",
    image: "bar-do-tony.png",
    vibeHint: "Humor leve e positivo. Nada que estrague o clima de caridade.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.2,
      vulgar: -0.5,
      "humor negro": -0.2,
      limpo: 0.6,
      hack: 0.3
    }
  },
  {
    id: "cervejaria-artesanal",
    name: "Cervejaria & Comédia",
    minMinutes: 5,
    difficulty: 0.24,
    crowd: "Hipsters com barba provando IPAs e falando de lúpulo.",
    intro: "Uma cervejaria artesanal faz noite de stand-up entre as torneiras.",
    image: "cervejaria.png",
    vibeHint: "Observações sobre comportamento urbano e tendências funcionam.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.3,
      vulgar: 0.1,
      "humor negro": 0.3,
      limpo: 0.2,
      hack: 0.5
    }
  },
  {
    id: "sindicato",
    name: "Show do Sindicato",
    minMinutes: 6,
    difficulty: 0.35,
    crowd: "Trabalhadores em assembleia que querem descontrair.",
    intro: "O sindicato te chamou para a confraternização anual. Público exigente.",
    image: "bar-do-tony.png",
    vibeHint: "Piadas sobre trabalho e patrão funcionam. Evite política direta.",
    typeAffinity: {
      default: 0,
      besteirol: 0.2,
      vulgar: 0.1,
      "humor negro": 0.3,
      limpo: 0.3,
      hack: 0.5
    }
  },
  {
    id: "festa-junina",
    name: "Arraiá do Riso",
    minMinutes: 4,
    difficulty: 0.2,
    crowd: "Famílias em festa com quentão na mão e chapéu de palha.",
    intro: "Uma festa junina de bairro te convida para animar entre as quadrilhas.",
    image: "arraia.png",
    vibeHint: "Humor família e piadas sobre tradições caem bem.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.5,
      vulgar: -0.3,
      "humor negro": -0.2,
      limpo: 0.6,
      hack: 0.3
    }
  },
  {
    id: "show-lgbtq",
    name: "Rainbow Comedy",
    minMinutes: 5,
    difficulty: 0.28,
    crowd: "Comunidade LGBTQ+ que valoriza autenticidade e ousadia.",
    intro: "Uma casa noturna LGBTQ+ faz noite de stand-up. Seja você mesmo.",
    image: "teatro-legal.png",
    vibeHint: "Autenticidade e humor sobre experiências pessoais conectam.",
    typeAffinity: {
      default: 0.15,
      besteirol: 0.3,
      vulgar: 0.4,
      "humor negro": 0.3,
      limpo: 0.1,
      hack: 0.2
    }
  },
  {
    id: "republica",
    name: "Comedy na República",
    minMinutes: 4,
    difficulty: 0.15,
    crowd: "Universitários em festa que só querem rir e beber.",
    intro: "Uma república estudantil abriu as portas para um show informal.",
    image: "republica.png",
    vibeHint: "Qualquer coisa que seja escandalosa ou boba funciona.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.6,
      vulgar: 0.6,
      "humor negro": 0.3,
      limpo: -0.2,
      hack: 0.2
    }
  },
  {
    id: "restaurante-japones",
    name: "Sushi & Stand-Up",
    minMinutes: 5,
    difficulty: 0.32,
    crowd: "Clientes de restaurante japonês sofisticado.",
    intro: "Um restaurante japonês chique quer inovar com entretenimento.",
    image: "sushi-restaurant.png",
    vibeHint: "Humor sutil e observações refinadas agradam.",
    typeAffinity: {
      default: 0,
      besteirol: -0.1,
      vulgar: -0.5,
      "humor negro": 0.2,
      limpo: 0.5,
      hack: 0.4
    }
  },
  {
    id: "stand-up-feminino",
    name: "Ladies' Night Comedy",
    minMinutes: 5,
    difficulty: 0.26,
    crowd: "Mulheres em noite só delas, celebrando juntas.",
    intro: "Uma noite de comédia só para mulheres. Ambiente acolhedor e empoderado.",
    image: "bar-do-tony.png",
    requiresAvatar: ["avatar3", "avatar4"],
    vibeHint: "Experiências genuínas e observações sobre o dia a dia conectam.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.3,
      vulgar: 0.2,
      "humor negro": 0.2,
      limpo: 0.4,
      hack: 0.3
    }
  },
  {
    id: "parque-ao-ar-livre",
    name: "Comedy no Parque",
    minMinutes: 5,
    difficulty: 0.35,
    crowd: "Famílias passeando no domingo, crianças correndo.",
    intro: "Um evento cultural no parque te chama. Som ao ar livre, público disperso.",
    image: "outdoor-gig.png",
    vibeHint: "Material limpo e energia alta para segurar atenção.",
    typeAffinity: {
      default: -0.1,
      besteirol: 0.3,
      vulgar: -0.6,
      "humor negro": -0.4,
      limpo: 0.6,
      hack: 0.3
    }
  },
  {
    id: "navio-cruzeiro",
    name: "Comedy no Cruzeiro",
    minMinutes: 7,
    difficulty: 0.4,
    requiresLevel: "elenco",
    crowd: "Passageiros de cruzeiro de todas as idades e origens.",
    intro: "Um cruzeiro te contrata para a temporada. Público cativo e variado.",
    image: "teatro-legal.png",
    vibeHint: "Humor universal, nada muito local ou nichado.",
    typeAffinity: {
      default: 0.05,
      besteirol: 0.3,
      vulgar: -0.3,
      "humor negro": -0.1,
      limpo: 0.5,
      hack: 0.5
    }
  },
  {
    id: "programa-tv",
    name: "Participação em TV",
    minMinutes: 4,
    difficulty: 0.5,
    requiresLevel: "elenco",
    crowd: "Plateia de programa de TV, câmeras ligadas.",
    intro: "Você foi chamado para um quadro de comédia na TV. É sua chance de aparecer.",
    image: "teatro-legal.png",
    vibeHint: "Material polido e timing perfeito. Cada segundo conta.",
    typeAffinity: {
      default: 0,
      besteirol: 0.2,
      vulgar: -0.6,
      "humor negro": -0.3,
      limpo: 0.6,
      hack: 0.5
    }
  },
  {
    id: "show-solo",
    name: "Seu Próprio Show",
    minMinutes: 10,
    difficulty: 0.45,
    requiresLevel: "headliner",
    crowd: "Seus fãs que pagaram ingresso para te ver.",
    intro: "O teatro é seu. A plateia veio por você. Não decepcione.",
    image: "pedestal.png",
    vibeHint: "É hora de mostrar quem você é. Autenticidade máxima.",
    typeAffinity: {
      default: 0.15,
      besteirol: 0.3,
      vulgar: 0.2,
      "humor negro": 0.3,
      limpo: 0.3,
      hack: 0.2
    }
  },
  // ========== SPECIAL RECURRING SHOWS ==========
  {
    id: "5a5",
    name: "5 a 5 - Copo Sujo",
    minMinutes: 3,
    difficulty: 0.15,
    isSpecialShow: true,
    crowd: "Plateia escassa, parte dela de opens como você. Ambiente de teste.",
    intro: "Domingo à tarde no Copo Sujo. Um palco tranquilo para testar material novo.",
    image: "copo-sujo-comedy.png",
    vibeHint: "Material conciso e punchlines claras. Ótimo para testar piadas novas.",
    typeAffinity: {
      default: 0,
      besteirol: 0.5,
      vulgar: 0.1,
      "humor negro": 0.2,
      limpo: 0.3,
      hack: 0.2
    }
  },
  {
    id: "pague15",
    name: "Pague 15 Leve 10 - Copo Sujo",
    minMinutes: 5,
    difficulty: 0.35,
    isSpecialShow: true,
    crowd: "Plateia pagante que espera profissionalismo. O produtor cronometra.",
    intro: "Quinta-feira no Copo Sujo. Show de iniciantes com plateia pagante. O produtor é rígido com tempo.",
    image: "copo-sujo-comedy.png",
    vibeHint: "Tempo é sagrado aqui. Não estoure os 5 minutos ou vai ser cortado.",
    typeAffinity: {
      default: 0.1,
      besteirol: 0.3,
      vulgar: 0,
      "humor negro": 0.2,
      limpo: 0.4,
      hack: 0.3
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
    requiresGoodPerformance: true,
    isGoodEvent: true,
    isCharacterEvent: true,
    text:
      "Depois do show, Stevan Gaipo te aborda: 'Pô, curti teu set! Cê tem timing bom. To saindo em turnê pelo interior e preciso de alguém pra abrir. Topa vir comigo? São 7 minutos num palco lotado.'",
    image: "stevan-gaipo.png",
    choices: [
      {
        label: "Aceitar o convite",
        startShowId: "veterano-turne",
        narration: "Você aceita o convite do Stevan! É a chance de tocar plateias diferentes e aprender com quem já está há anos na estrada."
      },
      {
        label: "Agradecer mas recusar",
        effects: { fans: -5, motivation: 6 },
        narration: "Você agradece o convite mas prefere se preparar mais. Stevan entende e diz que a porta tá aberta."
      }
    ]
  },
  {
    id: "corporativoConvite",
    trigger: "random",
    text:
      "Seu telefone toca: é uma pessoa do RH de uma empresa. 'O palestrante sumiu e precisamos de alguém pra animar o coffee break! Paga bem, mas é pra agora!'",
    image: "corporativo.png",
    choices: [
      {
        label: "Aceitar o desafio",
        startShowId: "corporativo-surpresa",
        narration: "Você aceita e já começa a pensar em piadas sobre trabalho. O cachê vai ajudar nas contas!"
      },
      {
        label: "Indicar outro comediante",
        effects: { theory: 6, motivation: 4, network: 5 },
        narration: "Você passa o contato de um amigo. Ele agradece muito e te deve uma. Você usa o tempo livre pra estudar."
      }
    ]
  },
  {
    id: "podcast",
    trigger: "fans20",
    once: true,
    text:
      "Um podcast de comédia quer te entrevistar. Você pode focar em piadas prontas ou falar sério sobre o processo.",
    image: "podcast.png",
    choices: [
      {
        label: "Mandar punchline atrás de punchline",
        effects: { fans: 20, motivation: -4, network: 3 },
        narration: "Você viraliza uns cortes, mas sai sem energia para escrever."
      },
      {
        label: "Falar sobre processo",
        effects: { theory: 10, motivation: 4, network: 5 },
        narration: "Você inspira novos comediantes e reflete sobre seu método."
      }
    ]
  },
  {
    id: "bombMentor",
    trigger: "showBomb",
    cooldown: 5, // só acontece a cada 5 dias no mínimo
    requiresCopoSujo: true, // only after bombing at Copo Sujo
    isCharacterEvent: true,
    text:
      "Depois de uma água absurda no Copo Sujo, Professor Carvalho te liga. Ele pode te dar dicas técnicas ou te levar para assistir shows.",
    image: "carvalho.png",
    choices: [
      {
        label: "Pedir análise técnica",
        effects: { theory: 15, motivation: -5 },
        narration: "Vocês destrincham cada minuto do set. Dói muito, mas você aprende bastante."
      },
      {
        label: "Assistir shows juntos",
        effects: { motivation: 15, network: 3 },
        narration: "Vocês dão risada de outros fracassos e você recupera o moral."
      }
    ]
  },
  {
    id: "cincoPiadas",
    trigger: "jokes5",
    once: true,
    isCharacterEvent: true,
    text:
      "Você já tem 5 piadas no caderno! Paulo Araújo, um comediante que você conheceu num bar, te manda mensagem: 'E aí, vi que tu tá escrevendo! Tenho um slot sobrando no 5 a 5 desse domingo, quer testar esse material?'",
    image: "paulo-araujo.png",
    choices: [
      {
        label: "Aceitar o convite",
        effects: { motivation: 8, theory: 3, network: 5 },
        scheduleShow: "5a5", // This will schedule the 5a5 show
        narration: "Paulo te inscreveu no 5 a 5 desse domingo! Você tem 3 minutos no palco.",
        unlock5a5: true // Unlock 5a5 show availability
      },
      {
        label: "Quero mais material primeiro",
        effects: { motivation: -2 },
        narration: "Você prefere escrever mais antes de encarar a plateia. Paulo entende e diz que é só chamar."
      }
    ]
  },
  {
    id: "pauloAraujoPague15",
    trigger: "pague15Invite",
    once: true,
    isCharacterEvent: true,
    text:
      "Paulo Araújo te manda mensagem: 'E aí, vi que você tá mandando bem no 5 a 5! Que tal fazer parte do elenco fixo do Pague 15? É um show mais sério, com plateia pagante. Você topa?'",
    image: "paulo-araujo.png",
    choices: [
      {
        label: "Aceitar fazer parte do elenco fixo",
        effects: { motivation: 10, network: 8, theory: 5 },
        unlockPague15: true,
        narration: "Paulo te adiciona ao elenco fixo do Pague 15! Agora você pode participar desse show às quintas-feiras. É um passo importante na sua carreira!"
      },
      {
        label: "Ainda não me sinto pronto",
        effects: { motivation: -3 },
        narration: "Você prefere ganhar mais experiência antes. Paulo entende e diz que a porta sempre estará aberta."
      }
    ]
  },
  // ========== NEW EVENTS ==========
  {
    id: "stevanEstrada",
    trigger: "random",
    requiresGoodPerformance: true,
    isGoodEvent: true,
    isCharacterEvent: true,
    text:
      "Stevan Gaipo te manda mensagem: 'E aí, vi teus shows, curti. To indo fazer uns shows no interior semana que vem, quer vir junto?' A viagem é longa. Como você aproveita o tempo?",
    image: "stevan-gaipo.png",
    choices: [
      {
        label: "Revisar material no trajeto",
        effects: { theory: 8, motivation: -3 },
        narration: "Você passa a viagem revisando piadas e estruturando o set. Chega mais preparado, mas meio cansado."
      },
      {
        label: "Fazer amizade com a galera",
        effects: { motivation: 5, network: 12 },
        narration: "Você troca ideia com todo mundo, conta histórias, ouve outras. Sai com vários contatos novos e animado."
      }
    ]
  },
  {
    id: "gabrielAndradeDicas",
    trigger: "random",
    isGoodEvent: true,
    isCharacterEvent: true,
    text:
      "Gabriel Andrade, conhecido pelo humor de oneliners afiados e prop comedy maluca, te manda uma DM: 'Ei, vi seu material. Teus oneliners têm potencial mas falta punch! E já pensou em usar objetos no palco? Te ensino uns truques se quiser.'",
    image: "gabriel-andrade.png",
    choices: [
      {
        label: "Aprender técnica de oneliners",
        effects: { theory: 12, motivation: 5 },
        narration: "Gabriel te explica a estrutura perfeita do oneliner: setup curto, punch inesperado. 'A graça tá na economia de palavras', ele diz. Você anota tudo."
      },
      {
        label: "Aprender prop comedy",
        effects: { theory: 8, motivation: 8, fans: 3 },
        narration: "Gabriel te mostra como um objeto simples pode virar 5 minutos de material. 'O prop não é muleta, é amplificador!' Você já começa a ter ideias."
      },
      {
        label: "Só trocar ideia mesmo",
        effects: { motivation: 6, network: 8 },
        narration: "Vocês ficam trocando ideia sobre comédia por horas. Gabriel é gente boa demais e promete te indicar pra alguns shows."
      }
    ]
  },
  {
    id: "criseCriativa",
    trigger: "random",
    text:
      "Você olha pro caderno em branco há horas. Nada vem. Tenta escrever, apaga, tenta de novo. Bloqueio criativo bateu forte.",
    image: "quarto1.png",
    choices: [
      {
        label: "Forçar até sair algo",
        effects: { motivation: -10, theory: 5 },
        narration: "Você se obriga a escrever, mesmo que seja lixo. Depois de muito sofrimento, algumas ideias começam a aparecer."
      },
      {
        label: "Sair e fazer outra coisa",
        effects: { motivation: 12, fans: 3 },
        narration: "Você fecha o caderno e vai viver. Encontra um amigo, passeia, observa as pessoas. Amanhã você volta com a cabeça fresca."
      }
    ]
  },
  {
    id: "conviteTV",
    trigger: "fans50",
    once: true,
    text:
      "Um produtor de TV te viu num show e quer te chamar para um quadro. É uma oportunidade única, mas exige compromisso.",
    choices: [
      {
        label: "Aceitar imediatamente",
        effects: { fans: 30, motivation: -8, network: 10 },
        narration: "Você entra na TV! Fãs novos aparecem, mas a pressão é intensa."
      },
      {
        label: "Pedir tempo para pensar",
        effects: { motivation: 5, network: -3 },
        narration: "Você quer ter certeza. O produtor respeita, mas fica um pouco frustrado."
      }
    ]
  },
  {
    id: "amigoCopiaSet",
    trigger: "random",
    text:
      "Você descobre que um 'amigo' comediante está usando piadas muito parecidas com as suas no set dele. Confronta?",
    image: "comic-stealing-jokes.png",
    choices: [
      {
        label: "Confrontar diretamente",
        effects: { motivation: -5, network: -8, theory: 3 },
        narration: "A treta é inevitável. Você perde um contato, mas defende seu trabalho."
      },
      {
        label: "Ignorar e escrever material melhor",
        effects: { motivation: 8, theory: 10 },
        narration: "A melhor vingança é sucesso. Você canaliza a raiva em criatividade."
      }
    ]
  },
  {
    id: "viralNegativo",
    trigger: "random",
    text:
      "Um vídeo seu bombou na internet... por motivos ruins. Uma piada foi tirada de contexto e você está sendo cancelado.",
    choices: [
      {
        label: "Se explicar publicamente",
        effects: { fans: -15, motivation: -10, network: 5 },
        narration: "Você tenta se defender. Alguns entendem, outros não. A poeira vai baixar."
      },
      {
        label: "Ficar em silêncio e esperar passar",
        effects: { fans: -8, motivation: -5 },
        narration: "O tempo cura tudo. Em algumas semanas, ninguém mais lembra."
      }
    ]
  },
  {
    id: "ofertaDinheiro",
    trigger: "random",
    text:
      "Uma empresa te oferece um bom dinheiro para fazer uma publi no palco. O produto é... questionável.",
    choices: [
      {
        label: "Aceitar o dinheiro",
        effects: { fans: -10, motivation: 5, network: -5 },
        narration: "Você faz a publi. O dinheiro ajuda, mas alguns fãs ficam decepcionados."
      },
      {
        label: "Recusar com educação",
        effects: { fans: 8, motivation: 3 },
        narration: "Você mantém sua integridade. Os fãs verdadeiros respeitam isso."
      }
    ]
  },
  {
    id: "festaPosShow",
    trigger: "showKill",
    text:
      "Depois do show incrível, a galera te convida para uma festa. Você pode ir e fazer network ou ir pra casa escrever enquanto a inspiração está fresca.",
    choices: [
      {
        label: "Ir para a festa",
        effects: { motivation: 8, network: 10, theory: -3 },
        narration: "Você faz amigos e conexões importantes. A noite foi épica."
      },
      {
        label: "Ir pra casa escrever",
        effects: { theory: 12, motivation: -2 },
        narration: "Sozinho em casa, você anota tudo que funcionou. Material precioso."
      }
    ]
  },
  {
    id: "doencaDiaShow",
    trigger: "random",
    text:
      "Você acorda se sentindo péssimo. Garganta arranhando, corpo mole, febre baixa. Tem um show marcado pra hoje...",
    image: "quarto2.png",
    choices: [
      {
        label: "Ir mesmo assim",
        effects: { motivation: -8, network: 5 },
        narration: "Você toma um remédio, vai e faz o set no automático. Não foi seu melhor dia, mas o produtor respeita quem cumpre compromisso."
      },
      {
        label: "Avisar que não vai",
        effects: { motivation: 5, network: -8 },
        narration: "Você avisa o produtor que não tem condição. Ele não fica feliz, mas pelo menos você não piorou a doença."
      }
    ]
  },
  {
    id: "mentorOferece",
    trigger: "random",
    isCharacterEvent: true,
    text:
      "Um comediante mais experiente te oferece mentoria. Mas ele é conhecido por ser duro e exigente.",
    image: "carvalho.png",
    choices: [
      {
        label: "Aceitar a mentoria",
        effects: { theory: 20, motivation: -10 },
        narration: "A jornada é brutal, mas você evolui muito como artista."
      },
      {
        label: "Recusar educadamente",
        effects: { motivation: 5, network: 3 },
        narration: "Você agradece, mas prefere seguir seu próprio caminho."
      }
    ]
  },
  {
    id: "competicaoComica",
    trigger: "random",
    once: true,
    text:
      "Uma competição de comédia está aceitando inscrições. O prêmio é visibilidade, mas a competição é acirrada.",
    choices: [
      {
        label: "Se inscrever",
        effects: { motivation: -5, fans: 15, network: 8 },
        narration: "Você participa e, independente do resultado, ganha visibilidade."
      },
      {
        label: "Esperar a próxima edição",
        effects: { motivation: 3 },
        narration: "Você decide se preparar melhor para a próxima. Sem pressa."
      }
    ]
  },
  {
    id: "piratearamSeuShow",
    trigger: "fans30",
    once: true,
    text:
      "Alguém gravou seu set inteiro e postou na internet sem permissão. Suas piadas estão expostas.",
    choices: [
      {
        label: "Pedir para remover",
        effects: { motivation: -5, fans: -5 },
        narration: "Você consegue tirar, mas o estrago já foi feito. Hora de escrever material novo."
      },
      {
        label: "Deixar e usar como divulgação",
        effects: { fans: 20, motivation: 5 },
        narration: "Você transforma o limão em limonada. O vídeo vira seu cartão de visitas."
      }
    ]
  }
];

function maybeTriggerEvent(trigger, context = {}) {
  if (activeEvent || pendingEvent || !trigger || typeof trigger !== "string") {
    return;
  }
  if (!state || !Array.isArray(eventPool)) {
    return;
  }
  
  // Events only happen after first show
  if (!state.showHistory || state.showHistory.length === 0) {
    return; // No events until first show is done
  }
  
  // Check weekly event limit for random events (max 1-2 per week)
  if (trigger === "random") {
    const maxEventsPerWeek = 2;
    if ((state.eventsThisWeek || 0) >= maxEventsPerWeek) {
      return; // Already had max events this week
    }
  }
  
  const candidates = eventPool.filter((event) => {
    return event && eventMatchesTrigger(event, trigger, context);
  });
  if (!candidates.length) {
    return;
  }
  const event = candidates[Math.floor(Math.random() * candidates.length)];
  if (event && event.text) {
    // Increment weekly event counter for random events
    if (trigger === "random") {
      state.eventsThisWeek = (state.eventsThisWeek || 0) + 1;
    }
    // Store as pending to avoid conflicting with current activity outcomes
    // Only show immediately for newDay events (no conflicting outcome)
    if (context.source === "newDay") {
      showEvent(event);
    } else {
      pendingEvent = event;
    }
  }
}

function eventMatchesTrigger(event, trigger, context = {}) {
  if (!event || !event.trigger || !trigger) {
    return false;
  }
  if (event.once && Array.isArray(state.eventsSeen) && state.eventsSeen.includes(event.id)) {
    return false;
  }
  // Check cooldown
  if (event.cooldown && event.lastTriggered) {
    const daysSince = state.currentDay - event.lastTriggered;
    if (daysSince < event.cooldown) {
      return false;
    }
  }
  if (event.trigger !== trigger) {
    return false;
  }
  
  // Special requirement: only trigger at Copo Sujo shows (5a5 or Pague 15)
  if (event.requiresCopoSujo && context.show) {
    const isCopoSujo = context.show.id === "5a5" || context.show.id === "pague15";
    if (!isCopoSujo) {
      return false;
    }
  }
  
  // Requires good performance: at least 3 shows with nota 4+
  if (event.requiresGoodPerformance) {
    const goodShows = (state.showHistory || []).filter(s => s.nota >= 4).length;
    if (goodShows < 3) {
      return false;
    }
  }
  
  switch (event.trigger) {
    case "showKill":
      return true;
    case "showBomb":
      const score = context.adjustedScore ?? context.averageScore ?? context.score ?? 0;
      return typeof score === "number" && score <= -0.05;
    case "fans20":
      return typeof state.fans === "number" && state.fans >= 20;
    case "fans30":
      return typeof state.fans === "number" && state.fans >= 30;
    case "fans50":
      return typeof state.fans === "number" && state.fans >= 50;
    case "jokes5":
      return Array.isArray(state.jokes) && state.jokes.length === 5;
    case "pague15Invite":
      // Trigger after 3 successful 5a5 shows (nota 4+)
      return (state.shows5a5AtLevel4 || 0) >= 3 && !state.pague15Unlocked;
    case "random":
      return Math.random() < 0.25; // Reduced from 0.35 since we have more events
    default:
      return false;
  }
}

function showPendingEvent() {
  if (!pendingEvent || activeEvent) {
    return;
  }
  
  const event = pendingEvent;
  pendingEvent = null;
  activeEvent = event;
  uiMode = "event";
  
  // Set scene to event's own image/scene, not the show outcome
  if (event.isCharacterEvent && event.image) {
    setScene("event", "", event.image, true); // true = isCharacter
  } else if (event.image) {
    setScene("event", "", event.image, false);
  } else {
    // Default to home scene if no event image
    setScene("home");
  }
  
  // Play special sound for good events
  if (event.isGoodEvent) {
    playSound('findSomething');
  }
  
  const actions = (event.choices || []).map((choice, index) => ({
    label: choice.label,
    handler: () => handleEventChoiceIndex(index)
  }));
  showDialog(event.text, actions);
}

function showEvent(event) {
  if (activeEvent) {
    return;
  }
  activeEvent = event;
  uiMode = "event";
  
  // Character events show the character image (smaller)
  if (event.isCharacterEvent && event.image) {
    setScene("event", "", event.image, true); // true = isCharacter
  }
  // For non-character events after a show, keep the outcome image visible
  // (don't change to quarto - the outcome image is more relevant context)
  // Only change scene if we're not showing a show outcome
  
  // Play special sound for good events
  if (event.isGoodEvent) {
    playSound('findSomething');
  }
  
  const actions = (event.choices || []).map((choice, index) => ({
    label: choice.label,
    handler: () => handleEventChoiceIndex(index)
  }));
  showDialog(event.text, actions);
}

function handleEventChoiceIndex(index) {
  if (!activeEvent) {
    hideDialog();
    return;
  }
  const eventRef = activeEvent;
  const choice = eventRef.choices && eventRef.choices[index];
  if (!choice) {
    hideDialog();
    activeEvent = null;
    uiMode = "idle";
    return;
  }
  if (eventRef.once && !state.eventsSeen.includes(eventRef.id)) {
    state.eventsSeen.push(eventRef.id);
  }
  
  // Track last triggered for cooldown events
  if (eventRef.cooldown) {
    eventRef.lastTriggered = state.currentDay;
  }
  
  const hasStartShow = !!choice.startShowId;
  const hasScheduleShow = !!choice.scheduleShow;
  const hasNarration = !!choice.narration;
  const unlock5a5 = !!choice.unlock5a5;
  const unlockPague15 = !!choice.unlockPague15;
  
  hideDialog();
  activeEvent = null;
  uiMode = "idle";
  
  // Return to home scene after event
  setScene("home");
  
  // Apply effects and show what changed
  const effectsSummary = formatEffectsSummary(choice.effects || {});
  applyEventEffects(choice.effects || {});
  
  // Handle unlocks
  if (unlock5a5) {
    state.fiveA5Unlocked = true;
  }
  if (unlockPague15) {
    state.pague15Unlocked = true;
  }
  
  updateStats();
  
  if (hasStartShow) {
    // Schedule the show instead of playing immediately
    const show = findShowById(choice.startShowId);
    if (show) {
      const daysAhead = Math.random() < 0.5 ? 1 : 2; // 1-2 days ahead
      const scheduledDay = state.currentDay + daysAhead;
      state.scheduledShow = {
        showId: show.id,
        dayScheduled: scheduledDay,
        showType: "normal"
      };
      updateStats();
      
      const dayName = getDayName(scheduledDay);
      const fullNarration = `${choice.narration || "Convite aceito!"}${effectsSummary}\n\n📅 Show marcado para ${dayName} (${daysAhead} dia(s)).`;
      showDialog(fullNarration);
    }
    return;
  }
  
  if (hasScheduleShow) {
    // Schedule a specific special show (like 5a5)
    const show = findShowById(choice.scheduleShow);
    if (show) {
      let daysAhead = 1;
      let showType = "normal";
      
      // For 5a5, find next Sunday
      if (choice.scheduleShow === "5a5") {
        daysAhead = findDaysToWeekday(0); // Sunday
        if (daysAhead === 0) daysAhead = 7; // If today is Sunday, next Sunday
        showType = "5a5";
      }
      // For pague15, find next Thursday
      else if (choice.scheduleShow === "pague15") {
        daysAhead = findDaysToWeekday(4); // Thursday
        if (daysAhead === 0) daysAhead = 7;
        showType = "pague15";
      }
      
      const scheduledDay = state.currentDay + daysAhead;
      state.scheduledShow = {
        showId: show.id,
        dayScheduled: scheduledDay,
        showType: showType
      };
      updateStats();
      
      const dayName = getDayName(scheduledDay);
      const fullNarration = `${choice.narration || "Show agendado!"}${effectsSummary}\n\n📅 ${show.name} marcado para ${dayName} (${daysAhead} dia(s)).`;
      showDialog(fullNarration);
    }
    return;
  }
  
  if (hasNarration) {
    showDialog(`${choice.narration}${effectsSummary}`);
  }
}

function formatEffectsSummary(effects) {
  if (!effects || Object.keys(effects).length === 0) {
    return "";
  }
  
  const changes = [];
  if (effects.fans) {
    changes.push(`Fãs ${formatSigned(effects.fans)}`);
  }
  if (effects.motivation) {
    changes.push(`Motivação ${formatSigned(effects.motivation)}`);
  }
  if (effects.theory) {
    changes.push(`Teoria ${formatSigned(effects.theory)}`);
  }
  if (effects.network) {
    changes.push(`Network ${formatSigned(effects.network)}`);
  }
  if (effects.stageTime) {
    changes.push(`Stage Time ${formatSigned(effects.stageTime)}`);
  }
  
  return changes.length > 0 ? `\n\n📊 [${changes.join(" | ")}]` : "";
}

function applyEventEffects(effects) {
  if (!effects) {
    return;
  }
  if (effects.fans) {
    state.fans = Math.max(0, state.fans + effects.fans);
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
  if (effects.network) {
    state.network = Math.max(0, (state.network || 10) + effects.network);
  }
}

// Map weekdays to room images (1-5 cycle through quartos)
function getQuartoForWeekday(weekday) {
  const quartos = ['quarto1.png', 'quarto2.png', 'quarto3.png', 'quarto4.png', 'quarto5.png'];
  // Cycle through: Segunda=1, Terça=2, Quarta=3, Quinta=4, Sexta=5, Sábado=1, Domingo=2
  if (weekday === 0) return quartos[1]; // Domingo = quarto2
  if (weekday === 6) return quartos[0]; // Sábado = quarto1
  return quartos[weekday - 1]; // Segunda-Sexta = quarto1-5
}

const scenes = {
  home: { title: "Apartamentinho", image: null }, // Dynamic based on day
  writing: { title: "Bloco de notas", image: null }, // Dynamic
  club: { title: "Clube", image: "copo-sujo-comedy.png" },
  bomb: { title: "Deu Água", image: "awful-show-1-out-5.png" },      // Nota 1
  risinhos: { title: "Risinhos", image: "bad-show-2-out-5.png" },     // Nota 2
  ok: { title: "Segurou", image: "good-show-3-out-5.png" },           // Nota 3
  kill: { title: "Matou no Palco", image: "great-show-4-out-5.png" }, // Nota 4
  explode: { title: "Explodiu!", image: "excellent-show-5-out-5.png" }, // Nota 5
  content: { title: "Conteúdo em casa", image: null }, // Dynamic
  study: { title: "Estudos e referências", image: null }, // Dynamic
  event: { title: "", image: null }, // No title for events, use quarto
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
let pendingEvent = null;
let lastLevelLabel = null;
let dialogTimeout = null;
const selectedJokeIds = new Set();
const avatarImages = {
  avatar1: "avatar.png",
  avatar2: "avatar2.png",
  avatar3: "avatar3.png",
  avatar4: "avatar4.png"
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
  elements.mainTitle = document.querySelector("h1");
  // Day controls
  elements.btnEndDay = document.querySelector("#btnEndDay");
  elements.btnGoToShow = document.querySelector("#btnGoToShow");
  elements.scheduledShowInfo = document.querySelector("#scheduledShowInfo");
  elements.scheduledShowText = document.querySelector("#scheduledShowText");
  elements.flowIndicator = document.querySelector("#flowIndicator");
  // Name input
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
    theory: document.querySelector("#theoryText"),
    day: document.querySelector("#dayText"),
    points: document.querySelector("#pointsText"),
    flow: document.querySelector("#flowText")
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
  elements.subTitle.textContent = "Construa sua jornada de Comic";
}

function attachEvents() {
  // Add ripple effects to all buttons
  const addButtonEffects = (button, handler) => {
    button.addEventListener("click", (e) => {
      playSound('click');
      createRipple(e, button);
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
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
  if (elements.buttons.credits) {
    addButtonEffects(elements.buttons.credits, handleShowCredits);
  }
  addButtonEffects(elements.btnContinuar, performShow);
  
  elements.jokeList.addEventListener("click", handleJokeListClick);
  
  // Day control buttons
  addButtonEffects(elements.btnEndDay, handleEndDay);
  addButtonEffects(elements.btnGoToShow, handleGoToScheduledShow);
  
  elements.introContinue.addEventListener("click", (e) => {
    createRipple(e, elements.introContinue);
    advanceIntro();
  });
  
  elements.avatarOptions.forEach((option) =>
    option.addEventListener("click", (e) => {
      createRipple(e, option);
      selectAvatar(option.dataset.avatar);
    })
  );
  
  elements.dialogClose.addEventListener("click", hideDialog);
  
  // Name input events
  if (elements.confirmNameBtn) {
    elements.confirmNameBtn.addEventListener("click", confirmPlayerName);
  }
  if (elements.playerNameInput) {
    elements.playerNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        confirmPlayerName();
      }
    });
  }
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
  setScene("intro", "Professor Carvalho", "carvalho.png", true); // true = isCharacter
  elements.introScreen.classList.remove("hidden");
  elements.screen.classList.add("hidden");
  if (elements.mainTitle) {
    elements.mainTitle.style.display = "block";
  }
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
    // Show name input first
    elements.nameInput.style.display = "block";
    elements.playerNameInput.focus();
  }
}

function confirmPlayerName() {
  const name = elements.playerNameInput.value.trim();
  if (!name || name.length < 2) {
    shakeScreen();
    return;
  }
  
  playSound('getSomething');
  state.name = name;
  
  // Hide name input, show avatar selection
  elements.nameInput.style.display = "none";
  elements.avatarSelection.style.display = "flex";
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
  
  // Celebration effect on selection
  flashScreen('rgba(212, 168, 75, 0.25)');
  spawnConfetti(20);
  
  // Delay transition for effect
  setTimeout(() => {
    setAvatarImage(key);
    enterGame();
    displayNarration(homeText);
    saveGameState();
  }, 400);
}

function setAvatarImage(key) {
  const src = avatarImages[key] || avatarImages.avatar1;
  elements.avatarImg.src = src;
}

function enterGame(skipNarration = false) {
  uiMode = "idle";
  
  // Fade out intro
  elements.introScreen.style.transition = 'opacity 0.4s ease';
  elements.introScreen.style.opacity = '0';
  
  setTimeout(() => {
    elements.introScreen.classList.add("hidden");
    elements.introScreen.style.opacity = '';
    
    // Prepare screen for animation
    elements.screen.style.opacity = '0';
    elements.screen.style.transform = 'translateY(20px)';
    elements.screen.classList.remove("hidden");
    
    if (elements.mainTitle) {
      elements.mainTitle.style.display = "none";
    }
    
    setAvatarImage(state.avatar);
    setScene("home");
    
    // Animate in
    setTimeout(() => {
      elements.screen.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      elements.screen.style.opacity = '1';
      elements.screen.style.transform = 'translateY(0)';
      
      if (!skipNarration) {
        displayNarration(homeText);
      }
    }, 50);
  }, 400);
}

function showDialog(message, actions = []) {
  if (!elements.dialogBox || !elements.dialogText) {
    console.warn("Dialog elements not found");
    return;
  }
  hideDialog();
  if (dialogTimeout) {
    clearTimeout(dialogTimeout);
    dialogTimeout = null;
  }
  
  playSound('menu'); // Menu sound when opening dialog
  
  elements.dialogText.textContent = message || "";
  elements.dialogActions.innerHTML = "";
  
  if (actions && actions.length > 0) {
    if (elements.dialogClose) {
      elements.dialogClose.classList.add("hidden");
    }
    actions.forEach((action, index) => {
      if (!action || !action.label) {
        return;
      }
      const btn = document.createElement("button");
      btn.textContent = action.label;
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(10px)';
      btn.addEventListener("click", (e) => {
        createRipple(e, btn);
        e.preventDefault();
        e.stopPropagation();
        if (action.handler && typeof action.handler === "function") {
          setTimeout(() => action.handler(), 150);
        }
      });
      elements.dialogActions.appendChild(btn);
      
      // Animate buttons in with delay
      setTimeout(() => {
        btn.style.transition = 'all 0.3s ease';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, 100 + index * 80);
    });
  } else {
    if (elements.dialogClose) {
      elements.dialogClose.classList.remove("hidden");
    }
  }
  
  // Animate dialog appearance
  elements.dialogBox.style.opacity = '0';
  elements.dialogBox.style.transform = 'scale(0.9) translateY(20px)';
  elements.dialogBox.classList.remove("hidden");
  
  setTimeout(() => {
    elements.dialogBox.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    elements.dialogBox.style.opacity = '1';
    elements.dialogBox.style.transform = 'scale(1) translateY(0)';
  }, 10);
  
  // Scroll to dialog
  setTimeout(() => {
    elements.dialogBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
}

function hideDialog() {
  if (!elements.dialogBox) {
    return;
  }
  
  if (dialogTimeout) {
    clearTimeout(dialogTimeout);
    dialogTimeout = null;
  }

  // Animate out
  elements.dialogBox.style.transition = 'all 0.25s ease';
  elements.dialogBox.style.opacity = '0';
  elements.dialogBox.style.transform = 'scale(0.95) translateY(-10px)';
  
  dialogTimeout = setTimeout(() => {
    elements.dialogBox.classList.add("hidden");
    elements.dialogBox.style.opacity = '';
    elements.dialogBox.style.transform = '';
    if (elements.dialogActions) {
      elements.dialogActions.innerHTML = "";
    }
    if (elements.dialogClose) {
      elements.dialogClose.classList.remove("hidden");
    }
    if (uiMode === "event" && !activeEvent) {
      uiMode = "idle";
    }
    dialogTimeout = null;
  }, 250);
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
    lastSave: null,
    // Time system
    ...createInitialTimeState(),
    // Level progression
    level: "open",
    showsAtLevel4: 0,       // contagem de shows nota 4+ no nível atual
    shows5a5AtLevel4: 0,    // contagem de shows 5a5 nota 4+
    fiveA5Unlocked: false,  // unlocked after paulo araujo evento surpresa
    pague15Unlocked: false,
    // Network (hidden metric)
    network: 10
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
      lastSave: parsed.lastSave || baseState.lastSave,
      // Time system
      currentDay: parsed.currentDay ?? baseState.currentDay,
      currentWeekDay: parsed.currentWeekDay ?? baseState.currentWeekDay,
      currentWeek: parsed.currentWeek ?? baseState.currentWeek,
      activityPoints: parsed.activityPoints ?? baseState.activityPoints,
      scheduledShow: parsed.scheduledShow || baseState.scheduledShow,
      showHistory: Array.isArray(parsed.showHistory) ? parsed.showHistory : [],
      consecutiveGoodShows: parsed.consecutiveGoodShows ?? 0,
      flowState: parsed.flowState || null,
      eventsThisWeek: parsed.eventsThisWeek ?? 0,
      showsThisWeek: parsed.showsThisWeek ?? 0,
      // Level progression
      level: parsed.level || baseState.level,
      showsAtLevel4: parsed.showsAtLevel4 ?? 0,
      shows5a5AtLevel4: parsed.shows5a5AtLevel4 ?? 0,
      fiveA5Unlocked: parsed.fiveA5Unlocked ?? false,
      pague15Unlocked: parsed.pague15Unlocked ?? false,
      // Network
      network: parsed.network ?? baseState.network
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
    // Time system
    currentDay: state.currentDay,
    currentWeekDay: state.currentWeekDay,
    currentWeek: state.currentWeek,
    activityPoints: state.activityPoints,
    scheduledShow: state.scheduledShow,
    showHistory: state.showHistory,
    consecutiveGoodShows: state.consecutiveGoodShows,
    flowState: state.flowState,
    eventsThisWeek: state.eventsThisWeek,
    showsThisWeek: state.showsThisWeek,
    // Level progression
    level: state.level,
    showsAtLevel4: state.showsAtLevel4,
    shows5a5AtLevel4: state.shows5a5AtLevel4,
    fiveA5Unlocked: state.fiveA5Unlocked,
    pague15Unlocked: state.pague15Unlocked,
    // Network
    network: state.network,
    lastSave: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  state.lastSave = payload.lastSave;
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
  
  // Animate title change
  elements.title.style.opacity = '0';
  elements.title.style.transform = 'translateY(-10px)';
  
  setTimeout(() => {
    const titleText = customTitle !== undefined ? customTitle : (scene.title || "Na estrada");
    elements.title.textContent = titleText;
    elements.title.style.opacity = titleText ? '1' : '0';
    elements.title.style.transform = 'translateY(0)';
  }, 150);
  
  // Animate image change with fade
  elements.image.style.opacity = '0';
  elements.image.style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    let imageToUse = customImage || scene.image;
    
    // Use dynamic quarto image for home scenes based on weekday
    if (!customImage && !scene.image && state && typeof state.currentWeekDay !== 'undefined') {
      imageToUse = getQuartoForWeekday(state.currentWeekDay);
    }
    
    // Handle character class for NPC images
    if (isCharacter) {
      elements.image.classList.add('character-image');
    } else {
      elements.image.classList.remove('character-image');
    }
    
    elements.image.src = imageToUse || "quarto1.png";
    elements.image.onload = () => {
      elements.image.style.opacity = '1';
      elements.image.style.transform = 'scale(1)';
    };
  }, 200);
  
  // Add transition styles
  elements.title.style.transition = 'all 0.3s ease';
  elements.image.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
}

let previousStats = { fans: 0, motivation: 60, theory: 10, stageTime: 0 };

function updateStats(animate = true) {
  const oldFans = previousStats.fans;
  const oldMotivation = previousStats.motivation;
  const oldTheory = previousStats.theory;
  const oldStageTime = previousStats.stageTime;
  
  state.fans = Math.max(0, Math.round(state.fans || 0));
  state.motivation = clamp(state.motivation ?? 60, 0, 120);
  state.theory = clamp(state.theory ?? 10, 0, 120);
  
  elements.stats.name.textContent = state.name;
  
  // Day and activity points
  const weekDayName = DAYS_OF_WEEK[state.currentWeekDay] || "???";
  elements.stats.day.textContent = `${weekDayName}, Dia ${state.currentDay}`;
  elements.stats.points.textContent = `${state.activityPoints}/${MAX_ACTIVITY_POINTS} pontos`;
  
  // Update points color based on remaining
  const pointsStat = elements.stats.points.closest('.stat');
  if (pointsStat) {
    if (state.activityPoints <= 0) {
      pointsStat.style.color = 'var(--neon-pink)';
    } else if (state.activityPoints < 1) {
      pointsStat.style.color = 'var(--accent-gold)';
    } else {
      pointsStat.style.color = '';
    }
  }
  
  // Update scheduled show visibility
  updateScheduledShowUI();
  
  // Update flow state indicator
  updateFlowUI();
  
  // Animate stage time
  if (animate && state.stageTime !== oldStageTime) {
    animateStatChange('stage', state.stageTime > oldStageTime);
  }
  elements.stats.stage.textContent = `${state.stageTime}x`;
  
  const totalMinutes = getTotalMinutes();
  elements.stats.material.textContent = `${totalMinutes}min`;
  
  // Level is now based on progression, not just material
  const levelLabel = getLevelLabel(state.level);
  elements.stats.level.textContent = levelLabel;
  
  if (lastLevelLabel && levelLabel !== lastLevelLabel) {
    showDialog(`🎉 Você evoluiu para o nível ${levelLabel}!`);
    spawnConfetti(30);
    animateStatChange('level', true);
  }
  lastLevelLabel = levelLabel;
  
  // Animate fans
  if (animate && state.fans !== oldFans) {
    animateNumber(elements.stats.fans, oldFans, state.fans, 600);
    animateStatChange('fans', state.fans > oldFans);
  } else {
    elements.stats.fans.textContent = state.fans;
  }
  
  // Animate motivation
  if (animate && state.motivation !== oldMotivation) {
    animateNumber(elements.stats.motivation, oldMotivation, state.motivation, 400);
    animateStatChange('motivation', state.motivation > oldMotivation);
  } else {
    elements.stats.motivation.textContent = `${state.motivation}`;
  }
  
  // Animate theory
  if (animate && state.theory !== oldTheory) {
    animateNumber(elements.stats.theory, oldTheory, state.theory, 400);
    animateStatChange('theory', state.theory > oldTheory);
  } else {
    elements.stats.theory.textContent = `${state.theory}`;
  }
  
  // Update previous stats
  previousStats = {
    fans: state.fans,
    motivation: state.motivation,
    theory: state.theory,
    stageTime: state.stageTime
  };
}

// ========== TIME SYSTEM FUNCTIONS ==========

function getLevelLabel(level) {
  const labels = {
    open: "Open",
    elenco: "Elenco",
    headliner: "Headliner"
  };
  return labels[level] || "Open";
}

function updateScheduledShowUI() {
  if (!elements.scheduledShowInfo || !elements.btnGoToShow) return;
  
  // Update the main show button text based on scheduled show
  if (elements.buttons.show) {
    if (state.scheduledShow) {
      const daysUntil = state.scheduledShow.dayScheduled - state.currentDay;
      if (daysUntil === 0) {
        elements.buttons.show.textContent = "🎤 Ir para Show!";
        elements.buttons.show.classList.add('show-today');
      } else {
        elements.buttons.show.textContent = "🎭 Buscar Show";
        elements.buttons.show.classList.remove('show-today');
      }
    } else {
      elements.buttons.show.textContent = "🎭 Buscar Show";
      elements.buttons.show.classList.remove('show-today');
    }
  }
  
  if (state.scheduledShow) {
    const show = findShowById(state.scheduledShow.showId);
    const daysUntil = state.scheduledShow.dayScheduled - state.currentDay;
    
    if (daysUntil === 0) {
      // Show is today!
      elements.btnGoToShow.classList.remove('hidden');
      elements.btnGoToShow.textContent = `🎤 Ir para ${show?.name || 'o Show'}!`;
      elements.scheduledShowInfo.classList.add('hidden');
    } else if (daysUntil > 0) {
      // Show is in the future - still show button to skip days
      elements.btnGoToShow.classList.remove('hidden');
      elements.btnGoToShow.textContent = `⏩ Pular para ${show?.name || 'o Show'} (${daysUntil}d)`;
      elements.scheduledShowInfo.classList.remove('hidden');
      const showName = show?.name || 'Show';
      const dayName = getDayName(state.scheduledShow.dayScheduled);
      elements.scheduledShowText.textContent = `📅 ${showName} em ${daysUntil} dia(s) (${dayName})`;
    } else {
      // Show passed, clear it
      state.scheduledShow = null;
      elements.btnGoToShow.classList.add('hidden');
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
    if (elements.stats.flow) {
      elements.stats.flow.textContent = `FLOW! (${state.flowState.daysRemaining}d)`;
    }
  } else {
    elements.flowIndicator.classList.add('hidden');
    elements.flowIndicator.classList.remove('flow-active');
  }
}

function getDayName(dayNumber) {
  const weekDay = dayNumber % 7;
  return DAYS_OF_WEEK[weekDay] || "???";
}

function handleEndDay() {
  if (uiMode === "event" || uiMode === "showSelection") return;
  
  // Check if game has ended (day 30)
  if (state.currentDay >= 30) {
    showBetaEndMessage();
    return;
  }
  
  // Check if there's a show scheduled for today
  if (state.scheduledShow && state.scheduledShow.dayScheduled === state.currentDay) {
    showDialog("⚠️ Você tem um show marcado para hoje! Vá para o show ou cancele antes de encerrar o dia.", [
      { label: "Ir para o Show", handler: () => { hideDialog(); handleGoToScheduledShow(); }},
      { label: "Cancelar Show", handler: () => { 
        state.scheduledShow = null; 
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
  
  // Check if game should end on day 30 (beta version)
  if (state.currentDay > 30) {
    showBetaEndMessage();
    return;
  }
  
  state.currentWeekDay = (state.currentWeekDay + 1) % 7;
  state.activityPoints = MAX_ACTIVITY_POINTS;
  
  // Check if new week started (when returning to Monday/weekday 1)
  if (state.currentWeekDay === 1) {
    state.currentWeek = (state.currentWeek || 1) + 1;
    state.eventsThisWeek = 0; // Reset weekly event counter
    state.showsThisWeek = 0;  // Reset weekly show counter
  }
  
  // Motivation recovery
  state.motivation = clamp(state.motivation + 5, 0, 120);
  
  // Process flow state
  processFlowState();
  
  updateStats();
  setScene("home");
  
  playSound('click'); // Simple sound for new day
  
  // Check if this is day 30 - show beta end message
  if (state.currentDay === 30) {
    showBetaEndMessage();
    return;
  }
  
  const weekDayName = DAYS_OF_WEEK[state.currentWeekDay];
  displayNarration(`🌅 Novo dia: ${weekDayName}, Dia ${state.currentDay}. Você tem ${MAX_ACTIVITY_POINTS} pontos de atividade.`);
  
  // Reduced chance for random events (max 1-2 per week)
  const maxEventsPerWeek = 2;
  const hasHadFirstShow = state.showHistory && state.showHistory.length > 0;
  const canTriggerEvent = hasHadFirstShow && (state.eventsThisWeek || 0) < maxEventsPerWeek;
  
  if (canTriggerEvent && Math.random() < 0.1) { // Reduced to 10% chance
    maybeTriggerEvent("random", { source: "newDay" });
  }
  
  saveGameState();
}

function showBetaEndMessage() {
  const betaMessage = `🎮 FIM DA VERSÃO BETA

Você chegou ao dia 30! O jogo ainda está em versão beta.

Se você gostou e quer apoiar o desenvolvimento, considere fazer uma doação!

💳 Chave PIX: carvalhoillan@gmail.com

💰 A partir de R$ 10,00 você já ganha seu nome nos créditos!
🎁 Acima de R$ 50,00 tem prêmios exclusivos!

Obrigado por jogar! 🎭`;

  showDialog(betaMessage, [
    { 
      label: "🔄 Reiniciar Jogo", 
      handler: () => {
        if (confirm("Tem certeza que deseja reiniciar o jogo? Todo o progresso será perdido.")) {
          localStorage.removeItem(STORAGE_KEY);
          location.reload();
        } else {
          hideDialog();
        }
      }
    },
    { 
      label: "✅ Entendi", 
      handler: () => {
        hideDialog();
      }
    }
  ]);
  
  // Prevent further day progression
  state.currentDay = 30;
  saveGameState();
}

function handleGoToScheduledShow() {
  if (!state.scheduledShow) {
    displayNarration("📅 Você não tem nenhum show marcado.");
    return;
  }
  
  const daysUntil = state.scheduledShow.dayScheduled - state.currentDay;
  
  // If show is in the future, skip days to get there
  if (daysUntil > 0) {
    skipToShowDay();
    return;
  }
  
  const show = findShowById(state.scheduledShow.showId);
  if (!show) {
    state.scheduledShow = null;
    displayNarration("❌ O show foi cancelado de última hora.");
    return;
  }
  
  playSound('comeWithMe'); // Going to show sound
  
  // Clear the scheduled show and start show preparation
  const scheduledShow = state.scheduledShow;
  state.scheduledShow = null;
  
  // Calculate offered time based on experience
  const offeredMinutes = calculateOfferedTime(show, scheduledShow);
  
  beginShowPreparationWithTime(show, offeredMinutes);
}

function skipToShowDay() {
  if (!state.scheduledShow) return;
  
  const daysUntil = state.scheduledShow.dayScheduled - state.currentDay;
  if (daysUntil <= 0) {
    handleGoToScheduledShow();
    return;
  }
  
  const show = findShowById(state.scheduledShow.showId);
  const showName = show?.name || 'o Show';
  
  showDialog(`⏩ Pular ${daysUntil} dia(s) até ${showName}?\n\nVocê perderá a chance de escrever, estudar ou criar conteúdo nesses dias.`, [
    { 
      label: `✅ Pular para ${showName}`, 
      handler: () => {
        hideDialog();
        // Skip days
        for (let i = 0; i < daysUntil; i++) {
          state.currentDay += 1;
          
          // Check if we've reached day 30 (beta end)
          if (state.currentDay > 30) {
            showBetaEndMessage();
            return;
          }
          
          state.currentWeekDay = (state.currentWeekDay + 1) % 7;
          
          // Check if new week
          if (state.currentWeekDay === 1) {
            state.currentWeek = (state.currentWeek || 1) + 1;
            state.eventsThisWeek = 0;
            state.showsThisWeek = 0;
          }
          
          // Small motivation recovery per skipped day
          state.motivation = clamp(state.motivation + 3, 0, 120);
          
          // Process flow state
          processFlowState();
          
          // Check if this is exactly day 30
          if (state.currentDay === 30) {
            showBetaEndMessage();
            return;
          }
        }
        
        state.activityPoints = MAX_ACTIVITY_POINTS;
        updateStats();
        
        playSound('comeWithMe');
        displayNarration(`⏩ ${daysUntil} dia(s) passaram... É hora do show!`);
        
        // Now go to the show
        setTimeout(() => {
          handleGoToScheduledShow();
        }, 1000);
      }
    },
    { label: "❌ Cancelar", handler: hideDialog }
  ]);
}

function calculateOfferedTime(show, scheduledShow) {
  const showCount = state.stageTime || 0;
  const level = state.level || "open";
  
  // Special shows have fixed times
  if (scheduledShow?.showType === "5a5") {
    return 3; // 5a5 is always 3 minutes
  }
  if (scheduledShow?.showType === "pague15") {
    return 5; // pague15 is always 5 minutes
  }
  
  // Special event shows (like veteran tour) give their full time - it's a special invite!
  if (show.minMinutes >= 6) {
    return show.minMinutes; // Special shows give what they promise
  }
  
  // Standard time calculation based on experience
  let maxTime = 3; // Default for new comics
  
  if (showCount >= 10) {
    maxTime = 10;
  } else if (showCount >= 4) {
    maxTime = 5;
  }
  
  if (level === "elenco") {
    maxTime = Math.max(maxTime, 15);
  } else if (level === "headliner") {
    maxTime = Math.max(maxTime, 20);
  }
  
  // For regular shows, offer what they require or what you've earned, whichever is higher
  return Math.max(show.minMinutes, Math.min(maxTime, 5));
}

function canAffordActivity(cost) {
  return state.activityPoints >= cost;
}

function spendActivityPoints(cost, activityName) {
  if (!canAffordActivity(cost)) {
    const deficit = cost - state.activityPoints;
    shakeScreen();
    showDialog(`⚠️ Você não tem pontos de atividade suficientes!\n\nPrecisa de ${cost} ponto(s), mas só tem ${state.activityPoints}.`, [
      { label: "🌙 Encerrar Dia", handler: () => { hideDialog(); handleEndDay(); }},
      { label: "Voltar", handler: hideDialog }
    ]);
    return false;
  }
  
  state.activityPoints = Math.max(0, state.activityPoints - cost);
  
  // Suggest ending day when points are very low
  if (state.activityPoints <= 0) {
    setTimeout(() => {
      displayNarration("💤 Seus pontos de atividade acabaram. Considere encerrar o dia.");
    }, 500);
  }
  
  updateStats();
  return true;
}

function checkStatRequirements(requirements) {
  const warnings = [];
  
  if (requirements.motivation && state.motivation < requirements.motivation) {
    const deficit = requirements.motivation - state.motivation;
    warnings.push({
      stat: "motivação",
      required: requirements.motivation,
      current: state.motivation,
      tip: "Descanse, faça shows bem-sucedidos ou crie conteúdo para recuperar motivação."
    });
  }
  
  if (requirements.theory && state.theory < requirements.theory) {
    warnings.push({
      stat: "teoria",
      required: requirements.theory,
      current: state.theory,
      tip: "Estude comédia para aumentar sua teoria."
    });
  }
  
  return warnings;
}

function processFlowState() {
  if (!state.flowState?.active) return;
  
  state.flowState.daysRemaining -= 1;
  state.flowState.endChance = Math.min(1, (state.flowState.endChance || 0.2) + 0.066); // ~12 days to 100%
  
  // Roll to end flow
  if (Math.random() < state.flowState.endChance || state.flowState.daysRemaining <= 0) {
    state.flowState = null;
    state.consecutiveGoodShows = 0;
    document.body.classList.remove('flow-active');
    flashScreen('rgba(100, 100, 100, 0.3)');
    showDialog("😔 O estado de flow acabou. O momento mágico passou, mas o aprendizado fica.");
  }
}

// Level is now based on progression from shows, not material minutes
// See checkLevelProgression() for advancement logic

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
  setScene("home"); // Always use quarto for writing
  presentWritingModes();
}

function presentWritingModes() {
  uiMode = "chooseWritingMode";
  elements.subTitle.textContent = "✏️ Como você quer criar material hoje?";
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.style.opacity = '0';
  
  const buttons = Object.values(writingModes)
    .map(
      (mode) => `
        <button class="writing-mode-btn" data-mode="${mode.id}">
          ${mode.id === 'desk' ? '🪑' : '📝'} ${mode.label} <span class="cost-badge">${mode.costLabel}</span><br /><small>${mode.desc}</small>
        </button>
      `
    )
    .join("");
  elements.btnDivLow.innerHTML = `
    <div>💡 Você tem <strong>${state.activityPoints}</strong> ponto(s) de atividade disponíveis.</div>
    ${buttons}
  `;
  
  // Animate in
  setTimeout(() => {
    elements.btnDivLow.style.transition = 'opacity 0.4s ease';
    elements.btnDivLow.style.opacity = '1';
  }, 50);
  
  elements.btnDivLow
    .querySelectorAll(".writing-mode-btn")
    .forEach((btn, index) => {
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        btn.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, 150 + index * 100);
      
      btn.addEventListener("click", (e) => {
        createRipple(e, btn);
        setTimeout(() => createJokeFromMode(btn.dataset.mode), 150);
      });
    });
  
  // Scroll to the options
  setTimeout(() => {
    elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
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
  const mode = writingModes[modeId] || writingModes.desk;
  const activityCost = mode.id === "desk" ? ACTIVITY_COSTS.desk : ACTIVITY_COSTS.day;
  
  // Check activity points first
  if (!canAffordActivity(activityCost)) {
    shakeScreen();
    displayNarration(`⚠️ Você não tem pontos de atividade suficientes para ${mode.label.toLowerCase()}! Encerre o dia para recuperar.`);
    exitWritingMode();
    return;
  }
  
  // Check motivation requirements
  const motivationReq = mode.id === "desk" ? 15 : 5;
  const warnings = checkStatRequirements({ motivation: motivationReq });
  if (warnings.length > 0) {
    const warn = warnings[0];
    shakeScreen();
    displayNarration(`⚠️ Você precisa de pelo menos ${warn.required} de ${warn.stat} para ${mode.label.toLowerCase()}, mas só tem ${warn.current}. ${warn.tip}`);
    exitWritingMode();
    return;
  }
  
  // Check material limit for opens (10 min max)
  const currentMinutes = getTotalMinutes();
  if (state.level === "open" && currentMinutes >= 10) {
    showDialog("📝 Você atingiu o limite de 10 minutos de material como Open. Precisa apagar alguma piada para escrever outra, ou evoluir para Elenco fazendo shows!", [
      { label: "Ver Material", handler: () => { hideDialog(); handleViewMaterial(); }},
      { label: "Fechar", handler: hideDialog }
    ]);
    exitWritingMode();
    return;
  }
  
  const idea = drawUniqueIdea();
  if (!idea) {
    displayNarration(
      "Seu cérebro reciclou todas as ideias possíveis hoje. Delete algo velho ou viva um pouco para ter material novo."
    );
    exitWritingMode();
    return;
  }
  
  // Now show tone/structure selection
  exitWritingMode();
  showJokeCustomization(idea, mode);
}

function showJokeCustomization(idea, mode) {
  uiMode = "jokeCustomization";
  
  // Store for later use
  window.pendingJokeIdea = idea;
  window.pendingJokeMode = mode;
  
  const defaultTitle = formatIdeaTitle(idea);
  
  const toneOptions = allowedTones.map(tone => 
    `<button class="tone-btn ${idea.tone === tone ? 'suggested' : ''}" data-tone="${tone}" title="${toneDescriptionsLong[tone] || ''}">${tone}</button>`
  ).join('');
  
  const structureOptions = structures.map(struct =>
    `<button class="structure-btn" data-structure="${struct}" title="${structureDescriptions[struct] || ''}">${struct.toUpperCase()}</button>`
  ).join('');
  
  // Create legends
  const toneLegend = allowedTones.map(tone => 
    `<div class="legend-item"><strong>${tone}:</strong> ${toneDescriptionsLong[tone] || ''}</div>`
  ).join('');
  
  const structureLegend = structures.map(struct =>
    `<div class="legend-item"><strong>${struct.toUpperCase()}:</strong> ${structureDescriptions[struct] || ''}</div>`
  ).join('');
  
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div class="joke-customization">
      <h4>📝 Título da piada:</h4>
      <input type="text" id="jokeTitleInput" class="joke-title-input" value="${defaultTitle}" maxlength="50" placeholder="Ex: Piada sobre..." />
      
      <h4>🎨 Escolha o tom da piada:</h4>
      <div class="tone-buttons">${toneOptions}</div>
      <details class="legend-details">
        <summary>📖 O que significa cada tom?</summary>
        <div class="legend-content">${toneLegend}</div>
      </details>
      
      <h4>🏗️ Escolha a estrutura:</h4>
      <div class="structure-buttons">${structureOptions}</div>
      <details class="legend-details">
        <summary>📖 O que significa cada estrutura?</summary>
        <div class="legend-content">${structureLegend}</div>
      </details>
      
      <div class="customization-hint">💡 Ideia original: "${idea.seed}" (${describeTone(idea.tone)})</div>
    </div>
  `;
  
  // Set default selections
  window.selectedTone = idea.tone;
  window.selectedStructure = structures[0];
  window.customJokeTitle = defaultTitle;
  
  // Title input listener
  const titleInput = elements.btnDivLow.querySelector('#jokeTitleInput');
  if (titleInput) {
    titleInput.addEventListener('input', (e) => {
      window.customJokeTitle = e.target.value.trim() || defaultTitle;
    });
  }
  
  elements.btnDivLow.querySelectorAll('.tone-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      elements.btnDivLow.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      window.selectedTone = btn.dataset.tone;
    });
    if (btn.dataset.tone === idea.tone) btn.classList.add('selected');
  });
  
  elements.btnDivLow.querySelectorAll('.structure-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      elements.btnDivLow.querySelectorAll('.structure-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      window.selectedStructure = btn.dataset.structure;
    });
  });
  elements.btnDivLow.querySelector('.structure-btn').classList.add('selected');
  
  showDialog("Personalize sua nova piada e confirme:", [
    { label: "✅ Criar Piada", handler: () => { hideDialog(); finalizeJokeCreation(); }},
    { label: "❌ Cancelar", handler: () => { 
      hideDialog(); 
      exitWritingMode();
      window.pendingJokeIdea = null;
      window.pendingJokeMode = null;
      window.customJokeTitle = null;
    }}
  ]);
  
  // Scroll to customization area
  setTimeout(() => {
    elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function finalizeJokeCreation() {
  const idea = window.pendingJokeIdea;
  const mode = window.pendingJokeMode;
  
  if (!idea || !mode) {
    exitWritingMode();
    return;
  }
  
  const activityCost = mode.id === "desk" ? ACTIVITY_COSTS.desk : ACTIVITY_COSTS.day;
  spendActivityPoints(activityCost, mode.label);
  
  state.motivation = clamp(state.motivation - mode.motivationCost, 0, 120);
  state.theory = clamp(state.theory + Math.round(mode.theoryBonus * 20), 0, 120);
  
  const addMinute = Math.random() < Math.max(0, mode.timeBonus);
  const minutes = clamp(idea.baseMinutes + (addMinute ? 1 : 0), 1, 2);
  const basePotential = generatePotential();
  
  // Flow state bonus
  const flowBonus = state.flowState?.active ? 0.1 : 0;
  
  const adjustedPotential = clamp(
    basePotential + (state.theory / 220) + (state.motivation - 60) / 400 + mode.theoryBonus + flowBonus,
    0.2,
    0.95
  );
  
  const label =
    adjustedPotential > 0.75 ? "🔥 perigosa porém promissora" : 
    adjustedPotential > 0.5 ? "🙂 tem caminho" : 
    "😶 parece frágil";
  
  const chosenTone = window.selectedTone || idea.tone;
  const chosenStructure = window.selectedStructure || structures[0];
  const chosenTitle = window.customJokeTitle || formatIdeaTitle(idea);
  
  const newJoke = {
    id: createId(),
    title: chosenTitle,
    tone: chosenTone,
    structure: chosenStructure,
    minutes,
    lastResult: "⏱️ ainda não testada",
    freshness: "nova",
    notes: `Nasceu ${idea.mood}`,
    history: [],
    truePotential: adjustedPotential,
    writingMode: mode.id
  };
  
  state.jokes.push(newJoke);
  
  // Clean up
  window.pendingJokeIdea = null;
  window.pendingJokeMode = null;
  window.selectedTone = null;
  window.selectedStructure = null;
  window.customJokeTitle = null;
  
  exitWritingMode();
  renderJokeList({ selectable: false });
  updateStats();
  setScene("home"); // Use quarto after creating joke
  
  playSound('pokeball'); // Sound for creating joke
  flashScreen('rgba(212, 168, 75, 0.2)');
  if (adjustedPotential > 0.7) {
    spawnConfetti(15);
  }
  
  const costText = mode.id === "desk" ? "(-1 ponto)" : "(-0.5 ponto)";
  displayNarration(
    `✏️ Você decide ${mode.label.toLowerCase()}. Sai de lá com uma nova piada: "${chosenTitle}". Tom: ${chosenTone}, estrutura: ${chosenStructure.toUpperCase()}. ${minutes} min, parece ${label}. ${costText}`
  );
  
  if (state.jokes.length === 5) {
    maybeTriggerEvent("jokes5", { source: "writing" });
  }
  maybeTriggerEvent("random", { source: "writing" });
  
  // Check for pending event and show button to access it
  checkAndShowPendingEvent();
}

const MAX_SHOWS_PER_WEEK = 3;

function handleSearchShow() {
  if (!state.jokes.length) {
    shakeScreen();
    displayNarration("⚠️ Você ainda não tem material. Escreva alguma coisa antes de encarar a plateia.");
    return;
  }
  
  // If show is scheduled for today, go directly to it
  if (state.scheduledShow && state.scheduledShow.dayScheduled === state.currentDay) {
    handleGoToScheduledShow();
    return;
  }
  
  // Check weekly show limit
  if ((state.showsThisWeek || 0) >= MAX_SHOWS_PER_WEEK && !state.scheduledShow) {
    shakeScreen();
    displayNarration("📅 Você já fez 3 shows essa semana. Descanse um pouco e espere a próxima semana para mais apresentações.");
    return;
  }
  
  // Check if already has a scheduled show for another day
  if (state.scheduledShow) {
    const existingShow = findShowById(state.scheduledShow.showId);
    const daysUntil = state.scheduledShow.dayScheduled - state.currentDay;
    showDialog(`📅 Você já tem um show marcado: ${existingShow?.name || 'Show'} em ${daysUntil} dia(s). Quer cancelar para buscar outro?`, [
      { label: "Cancelar e buscar outro", handler: () => {
        state.scheduledShow = null;
        state.network = Math.max(0, (state.network || 10) - 3);
        hideDialog();
        searchForNewShow();
      }},
      { label: "Manter show atual", handler: hideDialog }
    ]);
    return;
  }
  
  searchForNewShow();
}

function searchForNewShow() {
  playSound('findSomething'); // Sound when finding shows
  flashScreen('rgba(139, 115, 85, 0.2)');
  
  // Generate available shows based on day of week and level
  const availableShows = generateAvailableShows();
  
  if (availableShows.length === 0) {
    displayNarration("😔 Não há shows disponíveis no momento. Tente novamente amanhã ou aumente seu network.");
    return;
  }
  
  // Show options to the player
  presentShowOptions(availableShows);
}

function generateAvailableShows() {
  const shows = [];
  const level = state.level || "open";
  const network = state.network || 10;
  const weekDay = state.currentWeekDay;
  
  // Filter shows by level and avatar
  // IMPORTANT: Exclude special shows (5a5, pague15) from regular pool
  // They are ONLY available via their special unlock mechanism (Paulo Araújo eventos surpresa)
  let eligibleShows = showPool.filter(show => {
    // Exclude special shows - they have their own unlock/scheduling logic below
    if (show.isSpecialShow) {
      return false;
    }
    // Some shows require certain levels
    if (show.requiresLevel && show.requiresLevel !== level && 
        (show.requiresLevel === "headliner" || (show.requiresLevel === "elenco" && level === "open"))) {
      return false;
    }
    // Some shows require certain avatars
    if (show.requiresAvatar && !show.requiresAvatar.includes(state.avatar)) {
      return false;
    }
    return true;
  });
  
  // Check for 5 a 5 (always Sunday, weekday 0) - only if unlocked via evento surpresa
  if (level === "open" && state.fiveA5Unlocked) {
    const daysTo5a5 = findDaysToWeekday(0); // Sunday
    const show5a5 = findShowById("5a5");
    
    // 75% chance show happens (25% cancelled)
    if (show5a5 && Math.random() < 0.75) {
      if (weekDay === 0 && !state.scheduledShow) {
        shows.unshift({
          show: show5a5,
          daysAhead: 0,
          showType: "5a5"
        });
      } else if (daysTo5a5 > 0 && daysTo5a5 <= 6) {
        shows.unshift({
          show: show5a5,
          daysAhead: daysTo5a5,
          showType: "5a5"
        });
      }
    }
  }
  
  // Check for Pague 15 (always Thursday, weekday 4) - only if unlocked
  if (state.pague15Unlocked) {
    const daysToPague15 = findDaysToWeekday(4); // Thursday
    const showPague15 = findShowById("pague15");
    
    if (showPague15) {
      if (weekDay === 4 && !state.scheduledShow) {
        shows.unshift({
          show: showPague15,
          daysAhead: 0,
          showType: "pague15"
        });
      } else if (daysToPague15 > 0 && daysToPague15 <= 6) {
        shows.unshift({
          show: showPague15,
          daysAhead: daysToPague15,
          showType: "pague15"
        });
      }
    }
  }
  
  // Calculate how many regular shows to add (max 3 total including special shows)
  const maxTotalShows = 3;
  const currentShowCount = shows.length;
  const remainingSlots = Math.max(0, maxTotalShows - currentShowCount);
  
  // Randomly select regular shows based on network, but cap at remaining slots
  const numShows = Math.min(eligibleShows.length, remainingSlots, 1 + Math.floor(network / 30));
  
  // Shuffle and pick
  const shuffled = [...eligibleShows].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numShows && i < shuffled.length; i++) {
    const daysAhead = Math.random() < 0.3 ? 1 : (Math.random() < 0.6 ? 2 : 3);
    shows.push({
      show: shuffled[i],
      daysAhead,
      showType: "normal"
    });
  }
  
  // Ensure max 3 shows total
  return shows.slice(0, maxTotalShows);
}

function findDaysToWeekday(targetWeekday) {
  let days = 0;
  let checkDay = state.currentWeekDay;
  
  // If today is the target day, return 0 (today)
  if (checkDay === targetWeekday) {
    return 0;
  }
  
  // Find next occurrence
  while (checkDay !== targetWeekday && days < 7) {
    checkDay = (checkDay + 1) % 7;
    days++;
  }
  
  return days;
}

// 5a5 is now a fixed show in showPool - this function returns the reference
function get5a5Show() {
  return findShowById("5a5");
}

// Pague15 is now a fixed show in showPool - this function returns the reference
function getPague15Show() {
  return findShowById("pague15");
}

// Legacy function - no longer used
function presentShowOptions(availableShows) {
  uiMode = "showBrowse";
  
  const options = availableShows.map((item, index) => {
    const { show, daysAhead, showType } = item;
    const scheduledDay = state.currentDay + daysAhead;
    const dayName = getDayName(scheduledDay);
    const offeredTime = calculateOfferedTime(show, { showType });
    
    let label = `🎭 ${show.name}`;
    if (showType === "5a5") label = `⭐ ${show.name} (especial iniciantes)`;
    if (showType === "pague15") label = `🏆 ${show.name} (desbloqueado!)`;
    
    return {
      label: `${label}\n📅 ${dayName} (${daysAhead === 0 ? 'HOJE' : daysAhead + 'd'}) | ⏱️ ${offeredTime}min oferecidos`,
      handler: () => {
        hideDialog();
        scheduleShow(show, scheduledDay, showType);
      }
    };
  });
  
  options.push({ label: "❌ Cancelar busca", handler: hideDialog });
  
  showDialog("🔍 Shows disponíveis para você:", options);
}

function scheduleShow(show, scheduledDay, showType = "normal") {
  state.scheduledShow = {
    showId: show.id,
    dayScheduled: scheduledDay,
    showType
  };
  
  playSound('getSomething'); // Got something sound
  state.network = (state.network || 10) + 1; // Booking shows increases network
  updateStats();
  
  const dayName = getDayName(scheduledDay);
  const daysUntil = scheduledDay - state.currentDay;
  
  displayNarration(`✅ Show marcado! ${show.name} em ${daysUntil} dia(s) (${dayName}). Prepare seu material!`);
  setScene("home");
}

function beginShowPreparationWithTime(show, offeredMinutes) {
  currentShow = { ...show, offeredMinutes };
  uiMode = "showSelection";
  selectedJokeIds.clear();
  
  // Set subtitle to show offered time
  elements.subTitle.textContent = `⏱️ Tempo oferecido: ${offeredMinutes} minutos`;
  elements.subTitle.style.display = "block";
  
  renderJokeList({ selectable: true });
  renderSetSummary();
  setScene("club", show.name, show.image);
  
  let introText = `🎤 ${show.intro} ${show.crowd}`;
  
  displayNarration(introText);
  
  elements.btnContinuar.style.opacity = '0';
  elements.btnContinuar.style.transform = 'translateY(20px)';
  elements.btnContinuar.style.display = "block";
  elements.btnContinuar.textContent = "🚀 Subir no palco";
  
  setTimeout(() => {
    elements.btnContinuar.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    elements.btnContinuar.style.opacity = '1';
    elements.btnContinuar.style.transform = 'translateY(0)';
  }, 400);
  
  // Scroll to joke selection area
  setTimeout(() => {
    elements.jokeList.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 150);
}

function beginShowPreparation(show) {
  // Calculate offered time for legacy calls
  const offeredMinutes = calculateOfferedTime(show, { showType: "normal" });
  beginShowPreparationWithTime(show, offeredMinutes);
}

function startSpecialShow(showId) {
  const specialShow = findShowById(showId);
  if (!specialShow) {
    displayNarration("O convite sumiu antes de virar realidade. Melhor voltar a escrever.");
    uiMode = "idle";
    return;
  }
  hideDialog();
  
  // If this is from an event, schedule it instead of playing immediately
  // (This function is now mainly used for backward compatibility)
  beginShowPreparation(specialShow);
}

function getNotebookImageForTheory(theory) {
  if (theory >= 120) {
    return "notebook5.png";
  } else if (theory >= 90) {
    return "notebook4.png";
  } else if (theory >= 60) {
    return "notebook3.png";
  } else if (theory >= 30) {
    return "notebook2.png";
  } else {
    return "notebook1.png";
  }
}

function handleViewMaterial() {
  exitSelectionMode();
  uiMode = "viewMaterial";
  elements.subTitle.textContent = "📋 Todo o seu material";
  renderJokeList({ selectable: false });
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `<div>📊 Minutos totais: ${getTotalMinutes()} | Piadas: ${state.jokes.length}</div>`;
  const theory = state.theory || 10;
  const notebookImage = getNotebookImageForTheory(theory);
  setScene("event", "", notebookImage, false);
  displayNarration("📓 Você revisa o caderno e lembra quais piadas ainda valem subir ao palco.");
  
  // Scroll to joke list
  setTimeout(() => {
    elements.jokeList.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function handleSaveGame() {
  saveGameState();
  playSound('save');
  flashScreen('rgba(90, 143, 90, 0.25)');
  displayNarration("💾 Jogo salvo no seu navegador. Pode fechar o bloco e voltar quando quiser.");
}

function handleCreateContent() {
  if (uiMode === "event") {
    return;
  }
  exitSelectionMode();
  setScene("home"); // Always use quarto
  
  // Show content type options
  showDialog("📱 Que tipo de conteúdo você quer criar?", [
    { 
      label: "📹 Conteúdo longo (1 ponto)", 
      handler: () => { hideDialog(); createContentLong(); }
    },
    { 
      label: "⚡ Conteúdo rápido (0.5 ponto)", 
      handler: () => { hideDialog(); createContentQuick(); }
    },
    { label: "Voltar", handler: hideDialog }
  ]);
}

function createContentLong() {
  if (!spendActivityPoints(ACTIVITY_COSTS.contentLong, "criar conteúdo longo")) {
    return;
  }
  
  const reach = Math.max(5, Math.round(state.stageTime * 2 + getTotalMinutes() + Math.random() * 15));
  const fanGain = reach + Math.round(state.theory / 2);
  state.fans += fanGain;
  state.network = (state.network || 10) + 2;
  state.motivation = clamp(state.motivation - 8 + Math.round(Math.random() * 4), 0, 120);
  setScene("home"); // Always use quarto
  
  flashScreen('rgba(245, 230, 200, 0.15)');
  if (fanGain > 20) {
    spawnConfetti(15);
  }
  
  displayNarration(
    `📹 Você grava um vídeo elaborado. ${fanGain} novas pessoas começam a te seguir. (-1 ponto de atividade)`
  );
  updateStats();
  maybeTriggerEvent("random", { source: "content" });
  maybeTriggerEvent("fans20");
  
  // Check for pending event and show button to access it
  checkAndShowPendingEvent();
}

function createContentQuick() {
  if (!spendActivityPoints(ACTIVITY_COSTS.contentQuick, "criar conteúdo rápido")) {
    return;
  }
  
  const reach = Math.max(2, Math.round(state.stageTime + getTotalMinutes() / 2 + Math.random() * 8));
  const fanGain = reach + Math.round(state.theory / 4);
  state.fans += fanGain;
  state.motivation = clamp(state.motivation - 2, 0, 120);
  setScene("home"); // Always use quarto
  
  flashScreen('rgba(245, 230, 200, 0.1)');
  
  displayNarration(
    `⚡ Um story rápido e uma foto. ${fanGain} novas pessoas te seguem. (-0.5 ponto de atividade)`
  );
  updateStats();
}

function handleStudy() {
  if (uiMode === "event") {
    return;
  }
  exitSelectionMode();
  
  // Check activity points
  if (!spendActivityPoints(ACTIVITY_COSTS.study, "estudar")) {
    return;
  }
  
  state.theory = clamp(state.theory + 12, 0, 150);
  state.motivation = clamp(state.motivation + 4, 0, 120);
  setScene("home"); // Always use quarto for studying
  
  // Study effect - warm glow
  flashScreen('rgba(245, 230, 200, 0.2)');
  
  displayNarration("📚 Você mergulha em especiais, podcasts e livros de comédia. Novas estruturas aparecem no caderno. (-1 ponto de atividade)");
  updateStats();
}

function handleShowCredits() {
  const contributors = [
    "Andre Foster,",
    "Bruno Henrique,",
    "Dhesme Gabriel,",
    "Douglao,",
    "Gabriel Andrade,",
    "Iago Maia,",
    "Júnior Rasec,",
    "Luis Maia,",
    "Paulo Araújo,",
    "Rossini Luz,",
    "Stevan Gaipo,",
    "Thiago Grinberg,"
  ];
  
  const creditsText = `⭐ CRÉDITOS ⭐\n\nDesenvolvedor: Illan Carvalho\n\n
Agradecimentos especiais aos nossos apoiadores:\n\n${contributors.join("\n")}\n\nObrigado por tornar este jogo possível! Essa é a versão beta então teoricamente se você está jogando seu nome tá na lista hahaha \n
Contribua: carvalhoillan@gmail.com (pix)`;
  
  showDialog(creditsText);
}

function handleViewHistory() {
  if (uiMode === "event") {
    return;
  }
  exitSelectionMode();
  uiMode = "viewHistory";
  
  setScene("home"); // Always use quarto
  elements.subTitle.textContent = "📊 Histórico de Shows";
  
  const history = state.showHistory || [];
  
  if (history.length === 0) {
    displayNarration("📊 Você ainda não fez nenhum show. Busque um show e suba no palco!");
    elements.btnDivLow.style.display = "flex";
    elements.btnDivLow.innerHTML = `<div>Nenhum show registrado ainda.</div>`;
    return;
  }
  
  // Calculate stats
  const totalShows = history.length;
  const avgNota = (history.reduce((sum, s) => sum + (s.nota || 0), 0) / totalShows).toFixed(1);
  const showsNota4Plus = history.filter(s => s.nota >= 4).length;
  const showsNota5 = history.filter(s => s.nota >= 5).length;
  
  // Group by nota
  const notaCounts = [0, 0, 0, 0, 0, 0]; // nota 0-5
  history.forEach(s => {
    notaCounts[s.nota || 0]++;
  });
  
  // Build history HTML (last 10 shows)
  const recentShows = history.slice(-10).reverse();
  const historyHtml = recentShows.map(entry => {
    const show = findShowById(entry.showId);
    const showName = show?.name || entry.showId || "Show desconhecido";
    const tier = SCORE_EMOJI_SCALE.find(t => t.nota === entry.nota) || SCORE_EMOJI_SCALE[SCORE_EMOJI_SCALE.length - 1];
    const dayName = getDayName(entry.day);
    
    // Show joke performances if available
    let jokePerf = "";
    if (entry.jokeResults && entry.jokeResults.length > 0) {
      jokePerf = `<div class="history-jokes">${entry.jokeResults.map(j => `${j.emoji}`).join(' ')}</div>`;
    }
    
    return `
      <div class="history-item ${entry.nota >= 4 ? 'history-good' : entry.nota <= 2 ? 'history-bad' : ''}">
        <div class="history-main">
          <span class="history-emoji">${tier.emoji}</span>
          <div class="history-info">
            <strong>${showName}</strong>
            <span class="history-date">${dayName}, Dia ${entry.day}</span>
          </div>
          <span class="history-nota">Nota ${entry.nota}/5</span>
        </div>
        ${jokePerf}
      </div>
    `;
  }).join('');
  
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div class="history-stats">
      <div class="stat-box"><strong>${totalShows}</strong><span>Shows</span></div>
      <div class="stat-box"><strong>${avgNota}</strong><span>Média</span></div>
      <div class="stat-box"><strong>${showsNota4Plus}</strong><span>Nota 4+</span></div>
      <div class="stat-box"><strong>${showsNota5}</strong><span>Nota 5</span></div>
    </div>
    <div class="history-distribution">
      💧 ${notaCounts[1]} | 😶 ${notaCounts[2]} | 🙂 ${notaCounts[3]} | 🔥 ${notaCounts[4]} | 🤯 ${notaCounts[5]}
    </div>
    <h4>📜 Últimos 10 shows:</h4>
    <div class="history-list">
      ${historyHtml || '<div>Nenhum show ainda.</div>'}
    </div>
  `;
  
  displayNarration(`📊 Seu histórico de shows: ${totalShows} apresentações com média ${avgNota}. Você matou em ${showsNota4Plus} deles!`);
  
  // Scroll to history section
  setTimeout(() => {
    elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

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

  // Show "Material" title
  if (uiMode === "showSelection") {
    elements.subTitle.textContent = "📝 Material";
    elements.subTitle.style.display = "block";
  }

  elements.legend.textContent = LEGEND_TEXT;
  elements.legend.style.display = "block";
  elements.legend.style.opacity = '0';
  setTimeout(() => {
    elements.legend.style.transition = 'opacity 0.3s ease';
    elements.legend.style.opacity = '1';
  }, 100);

  if (!state.jokes.length) {
    elements.jokeList.innerHTML =
      '<li class="joke-item read-only"><strong>📝 Sem piadas no bloco.</strong> Bora escrever algo.</li>';
    elements.jokeList.style.display = "block";
    return;
  }

  state.jokes.forEach((joke, index) => {
    const li = document.createElement("li");
    li.classList.add("joke-item");
    if (!selectable) {
      li.classList.add("read-only");
    }
    li.dataset.id = joke.id;
    if (selectedJokeIds.has(joke.id)) {
      li.classList.add("selected");
    }
    
    // Add staggered animation
    li.style.opacity = '0';
    li.style.transform = 'translateX(-20px)';
    
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
        '<button class="rewrite-btn">✏️ Reescrever</button><button class="delete-btn">🗑️ Apagar</button>';
      li.appendChild(actions);
    }
    elements.jokeList.appendChild(li);
    
    // Animate in with stagger
    setTimeout(() => {
      li.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      li.style.opacity = '1';
      li.style.transform = 'translateX(0)';
    }, 50 + index * 60);
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
  
  // Find and animate out the joke item
  const jokeElement = elements.jokeList.querySelector(`[data-id="${jokeId}"]`);
  if (jokeElement) {
    jokeElement.style.transition = 'all 0.3s ease';
    jokeElement.style.opacity = '0';
    jokeElement.style.transform = 'translateX(50px) scale(0.9)';
  }
  
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
  if (!joke) {
    return;
  }
  
  // Show rewrite options dialog
  window.rewritingJoke = joke;
  uiMode = "rewriting";
  
  const toneOptions = allowedTones.map(tone => 
    `<button class="tone-btn ${joke.tone === tone ? 'selected current' : ''}" data-tone="${tone}">${tone === joke.tone ? '📍 ' : ''}${tone}</button>`
  ).join('');
  
  const structureOptions = structures.map(struct =>
    `<button class="structure-btn ${joke.structure === struct ? 'selected current' : ''}" data-structure="${struct}">${struct === joke.structure ? '📍 ' : ''}${struct.toUpperCase()}</button>`
  ).join('');
  
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
  
  window.newTone = joke.tone;
  window.newStructure = joke.structure;
  
  elements.btnDivLow.querySelectorAll('.tone-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      elements.btnDivLow.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      window.newTone = btn.dataset.tone;
    });
  });
  
  elements.btnDivLow.querySelectorAll('.structure-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      elements.btnDivLow.querySelectorAll('.structure-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      window.newStructure = btn.dataset.structure;
    });
  });
  
  showDialog(`Reescrever "${joke.title}"?`, [
    { label: "✅ Reescrever", handler: () => { hideDialog(); finalizeRewrite(); }},
    { label: "❌ Cancelar", handler: () => { 
      hideDialog(); 
      exitWritingMode();
      window.rewritingJoke = null;
      handleViewMaterial();
    }}
  ]);
  
  // Scroll to customization area
  setTimeout(() => {
    elements.btnDivLow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function finalizeRewrite() {
  const joke = window.rewritingJoke;
  if (!joke) {
    exitWritingMode();
    return;
  }
  
  // Check motivation
  if (state.motivation < 4) {
    shakeScreen();
    displayNarration("⚠️ Você precisa de pelo menos 4 de motivação para reescrever. Descanse ou faça shows bem-sucedidos.");
    exitWritingMode();
    handleViewMaterial();
    return;
  }
  
  state.motivation = clamp(state.motivation - 4, 0, 120);
  
  // Generate completely new potential (random, but influenced by theory)
  const basePotential = generatePotential();
  const flowBonus = state.flowState?.active ? 0.1 : 0;
  joke.truePotential = clamp(
    basePotential + (state.theory / 250) + flowBonus,
    0.2,
    0.95
  );
  
  joke.tone = window.newTone || joke.tone;
  joke.structure = window.newStructure || joke.structure;
  joke.minutes = Math.random() > 0.7 ? 2 : 1;
  joke.freshness = "reescrita";
  joke.history = []; // Reset history
  joke.lastResult = "⏱️ reescrita, ainda não testada";
  
  const label = joke.truePotential > 0.7 ? "promissora" : joke.truePotential > 0.5 ? "com potencial" : "incerta";
  
  // Cleanup
  window.rewritingJoke = null;
  window.newTone = null;
  window.newStructure = null;
  
  exitWritingMode();
  flashScreen('rgba(212, 168, 75, 0.15)');
  
  displayNarration(`✏️ "${joke.title}" foi completamente reescrita! Tom: ${joke.tone}, estrutura: ${joke.structure.toUpperCase()}. ${joke.minutes} min. Parece ${label}.`);
  
  handleViewMaterial();
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
  
  const offeredMinutes = currentShow?.offeredMinutes || currentShow?.minMinutes || 5;
  
  // Color code based on how close to offered time
  let minuteColor = 'var(--neon-cyan)';
  let timeWarning = '';
  
  if (minutes < offeredMinutes * 0.7) {
    minuteColor = 'var(--neon-pink)';
    timeWarning = ' ⚠️ MUITO POUCO';
  } else if (minutes < offeredMinutes * 0.9) {
    minuteColor = 'var(--accent-gold)';
    timeWarning = ' ⚡ Pouco';
  } else if (minutes > offeredMinutes * 1.5) {
    minuteColor = 'var(--neon-pink)';
    timeWarning = ' ⚠️ MUITO LONGO';
  } else if (minutes > offeredMinutes * 1.2) {
    minuteColor = 'var(--accent-gold)';
    timeWarning = ' ⚡ Estourando';
  }
  
  elements.btnDivLow.style.display = "flex";
  elements.btnDivLow.innerHTML = `
    <div>🎭 Set atual: <strong>${selectedJokes.length}</strong> piadas | <span style="color: ${minuteColor}"><strong>${minutes}min</strong> / ${offeredMinutes}min oferecidos${timeWarning}</span></div>
    <div>🎨 Clima do set: ${tones}</div>
    ${currentShow ? `<div>⚡ Dificuldade: ${(currentShow.difficulty * 100).toFixed(0)}% caos</div>` : ""}
    ${currentShow?.vibeHint ? `<div>💡 ${currentShow.vibeHint}</div>` : ""}
    <div style="font-size: 0.95rem; color: var(--cream-dark);">💬 Você pode escolher fazer menos ou mais tempo que o oferecido. Há consequências.</div>
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
  const showType = state.scheduledShow?.showType || currentShow.special || "normal";
  const setList = state.jokes.filter((joke) => selectedJokeIds.has(joke.id));
  const totalMinutes = setList.reduce((sum, joke) => sum + joke.minutes, 0);
  
  if (!setList.length) {
    shakeScreen();
    displayNarration("⚠️ Você precisa selecionar alguma piada antes de subir.");
    return;
  }
  
  // Time validation - allow going over or under, but with consequences
  const offeredMinutes = currentShow.offeredMinutes || currentShow.minMinutes;
  // No hard limit, player can choose freely
  
  // Stage entrance effect
  flashScreen('rgba(255, 248, 220, 0.3)');
  
  // Flow state bonus
  const flowBonus = state.flowState?.active ? 0.08 : 0;
  
  const evaluation = evaluateShow(setList, currentShow, flowBonus);
  const breakdownWithEmoji = evaluation.breakdown.map((entry) => {
    const mood = scoreToEmoji(entry.score);
    return { ...entry, emoji: mood.emoji, label: mood.label, nota: mood.nota };
  });
  
  const timeImpact = evaluateStageTime(totalMinutes, currentShow.minMinutes, evaluation.averageScore);
  const adjustedScore = evaluation.averageScore + timeImpact.adjustment;
  const nota = classifyOutcome(adjustedScore);
  const outcomeType = getOutcomeType(nota);
  
  applyOutcome(setList, outcomeType, breakdownWithEmoji);
  
  // Stage time counting (flow state = 2x)
  const stageTimeGain = state.flowState?.active ? 2 : 1;
  state.stageTime += stageTimeGain;
  
  // Track show in history with joke results
  state.showHistory = state.showHistory || [];
  state.showHistory.push({
    showId: showPlayed.id,
    day: state.currentDay,
    nota,
    showType,
    jokeResults: breakdownWithEmoji.map(j => ({
      title: j.title,
      emoji: j.emoji,
      nota: j.nota
    }))
  });
  
  // Increment weekly show counter
  state.showsThisWeek = (state.showsThisWeek || 0) + 1;
  
  // Check level progression and flow state
  checkLevelProgression(nota, showType);
  checkFlowState(nota);
  
  // Fan and motivation gains based on nota (1-5)
  const fanGain = Math.max(0, Math.round(totalMinutes * (nota - 1) * 0.8));
  state.fans += fanGain;
  
  const motivationShift = nota >= 4 ? 12 : nota >= 3 ? 2 : nota >= 2 ? -5 : -12;
  state.motivation = clamp(state.motivation + motivationShift, 0, 120);
  
  // Network bonus for good shows
  if (nota >= 4) {
    state.network = (state.network || 10) + 2;
  }
  
  updateStats();
  renderJokeList({ selectable: false });
  exitSelectionMode();
  
  showResultNarrative(nota, breakdownWithEmoji, timeImpact, {
    fans: fanGain,
    motivation: motivationShift,
    stageTimeGain
  });
  
  const eventContext = {
    outcome: outcomeType,
    nota,
    show: showPlayed,
    averageScore: evaluation.averageScore,
    adjustedScore,
    showType
  };
  
  if (outcomeType === "kill") {
    maybeTriggerEvent("showKill", eventContext);
  } else if (outcomeType === "bomb") {
    maybeTriggerEvent("showBomb", eventContext);
  } else {
    maybeTriggerEvent("random", eventContext);
  }
  
  // Check for Pague15 invite after successful 5a5 shows
  if (showType === "5a5" && nota >= 4) {
    maybeTriggerEvent("pague15Invite", eventContext);
  }
  
  if (state.fans >= 20) {
    maybeTriggerEvent("fans20");
  }
}

function evaluateShow(setList, show, flowBonus = 0) {
  let totalScore = 0;
  const breakdown = [];
  setList.forEach((joke) => {
    const potencyComponent = clamp(joke.truePotential || 0.4, 0, 1) * 0.6;
    const typeComponent = getTypeAffinity(show, joke.tone) * 0.2;
    const chaosComponent = (Math.random() * 2 - 1) * 0.2;
    const difficultyPenalty = show.difficulty || 0;
    const jokeScore = potencyComponent + typeComponent + chaosComponent - difficultyPenalty + flowBonus;
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

  // More severe penalties/bonuses based on performance
  if (ratio < 0.5) {
    // Way too short
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
    // Way too long
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
  // Returns nota 1-5 based on score
  const tier = SCORE_EMOJI_SCALE.find(t => score >= t.threshold) || SCORE_EMOJI_SCALE[SCORE_EMOJI_SCALE.length - 1];
  return tier.nota;
}

function getOutcomeType(nota) {
  if (nota >= 4) return "kill";
  if (nota >= 3) return "ok";
  return "bomb";
}

function checkLevelProgression(nota, showType) {
  // Open -> Elenco: 5 shows com nota 4+ 
  if (state.level === "open" && nota >= 4) {
    state.showsAtLevel4 = (state.showsAtLevel4 || 0) + 1;
    
    // Track 5a5 shows for Pague15 invite event
    if (showType === "5a5") {
      state.shows5a5AtLevel4 = (state.shows5a5AtLevel4 || 0) + 1;
    }
    
    if (state.showsAtLevel4 >= 5) {
      state.level = "elenco";
      state.showsAtLevel4 = 0;
      spawnConfetti(50);
      flashScreen('rgba(212, 168, 75, 0.4)');
      showDialog("🎊 VOCÊ EVOLUIU PARA ELENCO!\n\nParabéns! Agora você pode fazer shows de até 15 minutos e tem acesso a novas oportunidades.");
    }
  }
  
  // Elenco -> Headliner: 5 shows com nota 5
  if (state.level === "elenco" && nota >= 5) {
    state.showsAtLevel4 = (state.showsAtLevel4 || 0) + 1;
    
    if (state.showsAtLevel4 >= 5) {
      state.level = "headliner";
      state.showsAtLevel4 = 0;
      spawnConfetti(100);
      flashScreen('rgba(255, 215, 0, 0.5)');
      showDialog("👑 VOCÊ É UM HEADLINER!\n\nO circuito te reconhece como um artista de destaque. Shows de até 20 minutos e convites especiais te esperam.");
    }
  }
}

function checkFlowState(nota) {
  // Track consecutive good shows
  if (nota >= 4) {  // Changed from 5 to 4
    state.consecutiveGoodShows = (state.consecutiveGoodShows || 0) + 1;
  } else {
    state.consecutiveGoodShows = 0;
  }
  
  // Activate flow state after 4 consecutive nota 4+ shows AND high theory
  if (!state.flowState?.active && 
      state.consecutiveGoodShows >= 3 &&  // Changed from 5 to 4
      state.theory >= 50) {
    state.flowState = {
      active: true,
      daysRemaining: 12,
      endChance: 0.2
    };
    
    spawnConfetti(60);
    flashScreen('rgba(255, 100, 0, 0.4)');
    showDialog("🔥 ESTADO DE FLOW ATIVADO!\n\nVocê está em sintonia total. Cada stage time conta como 2x, suas piadas ganham boost na escrita e performance. Aproveite enquanto dura!");
    
    // Add flow animation class to body
    document.body.classList.add('flow-active');
  }
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

function showResultNarrative(nota, breakdown, timeImpact, deltas = {}) {
  let message = "";
  const outcomeType = getOutcomeType(nota);
  
  // Messages based on nota 1-5
  const messages = {
    5: "🤯 EXPLODIU! A plateia em pé, gritos de 'mais uma!'. Uma noite histórica que todos vão lembrar.",
    4: "🔥 Você matou no palco! Risadas constantes, aplausos calorosos. O produtor já te quer de volta.",
    3: "🙂 Segurou bem. Algumas risadas fortes, o público ficou com você. Dá pra crescer em cima disso.",
    2: "😶 Risinhos nervosos. Alguns momentos funcionaram, outros caíram no vazio. Hora de ajustar.",
    1: "💧 Silêncio constrangedor. O garçom falou mais alto que você. Aceite que faz parte e reescreva."
  };
  
  message = messages[nota] || messages[3];
  
  // Set scene based on nota (1-5)
  if (nota === 5) {
    setScene("explode");
    playSound('victory');
    setTimeout(() => {
      spawnConfetti(70);
      flashScreen('rgba(212, 168, 75, 0.4)');
    }, 300);
  } else if (nota === 4) {
    setScene("kill");
    playSound('victory');
    setTimeout(() => {
      spawnConfetti(40);
      flashScreen('rgba(212, 168, 75, 0.3)');
    }, 300);
  } else if (nota === 3) {
    setScene("ok");
    playSound('getSomething');
    flashScreen('rgba(245, 230, 200, 0.15)');
  } else if (nota === 2) {
    setScene("risinhos");
    playSound('click');
    flashScreen('rgba(200, 180, 150, 0.15)');
  } else {
    setScene("bomb");
    playSound('boom');
    shakeScreen();
    flashScreen('rgba(166, 68, 68, 0.25)');
  }
  
  const detalhes = breakdown.length
    ? breakdown.map((entry) => `${entry.title} ${entry.emoji}`).join(" | ")
    : "";
  const tempoNota = timeImpact?.note ? ` ${timeImpact.note}` : "";
  const breakdownText = detalhes ? ` (${detalhes})` : "";
  
  const statFragments = [];
  statFragments.push(`Nota ${nota}/5`);
  if (deltas.fans) {
    statFragments.push(`Fãs ${formatSigned(deltas.fans)}`);
  }
  if (deltas.motivation) {
    statFragments.push(`Motivação ${formatSigned(deltas.motivation)}`);
  }
  if (deltas.stageTimeGain && deltas.stageTimeGain > 1) {
    statFragments.push(`Stage Time +${deltas.stageTimeGain} (FLOW!)`);
  }
  
  const statsText = statFragments.length ? ` [${statFragments.join(" | ")}]` : "";
  displayNarration(`${message}${tempoNota}${breakdownText}${statsText}`);
  
  // Check for pending event and show button to access it
  checkAndShowPendingEvent();
}

function checkAndShowPendingEvent() {
  if (pendingEvent) {
    setTimeout(() => {
      showDialog("🎲 Algo aconteceu...", [
        { 
          label: "Ver Evento Surpresa", 
          handler: () => {
            hideDialog();
            showPendingEvent();
          }
        },
        { 
          label: "Depois", 
          handler: () => {
            hideDialog();
          }
        }
      ]);
    }, 1000);
  }
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
