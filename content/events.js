(function registerV2EventContent(global) {
  const content = global.OpenMicRpgContent = global.OpenMicRpgContent || {};

  const classEvents = {};
  const names = {
    comicoClassico: "Cômico Clássico",
    roteirista: "Roteirista",
    produtor: "Produtor",
    atorComico: "Ator Cômico",
    influencer: "Influencer"
  };
  const event1 = {
    comicoClassico: ["A Porta — A Escala", "Um produtor precisa preencher um espaço fixo na escala semanal. Seu nome aparece entre os poucos que ele considera confiáveis.", "assets/scenes/performance/great-show-4-out-5.png"],
    roteirista: ["A Porta — O Punch-up", "Outro comediante pede ajuda para cortar gordura e encontrar viradas no texto antes do show.", "assets/scenes/writing/notebook3.png"],
    produtor: ["A Porta — A Lista", "A noite está sem ordem, dois nomes atrasaram e alguém precisa organizar a escala antes que as portas abram.", "assets/venues/copo-sujo-comedy.png"],
    atorComico: ["A Porta — A Plateia", "Uma diretora de casting estava na plateia e quer observar como sua presença funciona fora do formato tradicional de stand-up.", "assets/venues/tv-studio-comedy.png"],
    influencer: ["A Porta — O Corte", "Um trecho do seu show tem potencial para circular muito além daquela sala.", "assets/venues/podcast.png"]
  };
  const event2 = {
    comicoClassico: ["A Virada — Abrindo a Noite", "Um veterano quer você abrindo uma sequência importante de shows. Não é teste de uma noite: é consistência sob pressão.", "assets/characters/stevan-gaipo.png"],
    roteirista: ["A Virada — Sala de Roteiro", "Uma equipe precisa de alguém capaz de transformar premissas soltas em material utilizável dentro de prazo.", "assets/venues/biblioteca.png"],
    produtor: ["A Virada — A Noite Inteira", "Bruno Berg chama você para dividir a responsabilidade por uma noite completa, da escala ao fechamento da casa.", "assets/venues/barzinho.png"],
    atorComico: ["A Virada — O Projeto", "O convite agora é para um projeto de atuação cômica com ensaio, texto e prazo.", "assets/venues/tv-studio-comedy.png"],
    influencer: ["A Virada — A Colaboração", "Uma colaboração maior exige linguagem própria, recorrência e responsabilidade com o público que chegou.", "assets/venues/podcast.png"]
  };
  const event2Choices = {
    comicoClassico: [
      { id: "material-testado", label: "Abrir com material testado", effects: { entrega: 10, texto: 4 }, flag: "classico-consistencia", narration: "Você escolhe repetição, leitura de sala e consistência. A sequência transforma confiança em profissão." },
      { id: "bloco-novo", label: "Arriscar um bloco novo", effects: { texto: 10, entrega: 4 }, flag: "classico-autoral", narration: "Você usa a sequência para construir material novo sob pressão. O risco acelera sua voz autoral." }
    ],
    roteirista: [
      { id: "punch-up", label: "Assumir o punch-up dos textos", effects: { texto: 14 }, flag: "roteirista-punch-up", narration: "Você vira a pessoa chamada quando uma premissa precisa funcionar até o prazo." },
      { id: "estrutura", label: "Organizar a estrutura dos quadros", effects: { texto: 9, network: 7 }, flag: "roteirista-estrutura", narration: "Você aprende a sustentar a sala inteira, conectando vozes, blocos e ritmo." }
    ],
    produtor: [
      { id: "curadoria", label: "Cuidar da curadoria e da escala", effects: { network: 15 }, flag: "produtor-curadoria", narration: "Você escolhe os nomes, monta a ordem e começa a ser lembrado pelo critério." },
      { id: "operacao", label: "Assumir a operação da noite", effects: { network: 10, motivation: 8 }, flag: "produtor-operacao", narration: "Você resolve atrasos, casa e bastidor. A noite acontece porque você sustentou a operação." }
    ],
    atorComico: [
      { id: "personagem", label: "Construir um personagem central", effects: { entrega: 14 }, flag: "ator-personagem", narration: "Você aprofunda corpo, voz e intenção até o personagem sustentar a cena." },
      { id: "conjunto", label: "Trabalhar para o jogo do elenco", effects: { entrega: 9, network: 7 }, flag: "ator-conjunto", narration: "Você aprende a reagir, dividir foco e melhorar a cena inteira, não apenas a própria fala." }
    ],
    influencer: [
      { id: "formato-autoral", label: "Criar um formato autoral", effects: { fans: 35, texto: 7 }, flag: "influencer-formato", narration: "Você troca alcance imediato por uma linguagem que o público reconhece como sua." },
      { id: "recorrencia", label: "Apostar em volume e recorrência", effects: { fans: 55, motivation: -6 }, flag: "influencer-recorrencia", narration: "Você monta uma rotina agressiva de publicação. O crescimento vem rápido e cobra energia." }
    ]
  };

  Object.keys(names).forEach(classId => {
    classEvents[`${classId}:event1`] = {
      id: `${classId}:event1`,
      classId,
      phase: 1,
      title: event1[classId][0],
      text: event1[classId][1],
      image: event1[classId][2],
      kind: "path",
      acceptLabel: "Aceitar a oportunidade",
      declineLabel: "Deixar passar"
    };
    classEvents[`${classId}:event2`] = {
      id: `${classId}:event2`,
      classId,
      phase: 2,
      title: event2[classId][0],
      text: event2[classId][1],
      image: event2[classId][2],
      kind: "path",
      acceptLabel: `Assumir o caminho de ${names[classId]}`,
      declineLabel: "Recusar este caminho",
      choiceGroup: `class-event2:${classId}`,
      choices: event2Choices[classId]
    };
  });

  content.v2Events = {
    classEvents,
    pathEvents: [
      {
        id: "rossini-especializacao",
        kind: "path",
        choiceGroup: "mentor:rossini",
        minDay: 15,
        maxDay: 35,
        requirements: { levelNumber: 3, showsPerformedCount: 1 },
        title: "Rossini Luz — Uma escolha de linguagem",
        text: "Rossini oferece um ciclo intensivo. Há tempo para aprofundar apenas uma linguagem agora; a outra pode voltar depois, quando já não definir esta corrida.",
        image: "assets/scenes/writing/notebook3.png",
        choices: [
          { id: "humor-negro", label: "Aprofundar humor negro", unlock: "humorNegro", specialization: "humor-negro", effects: { texto: 18, entrega: 4 }, narration: "Rossini trabalha tensão, limite e ponto de vista. Você sai com uma linguagem perigosa e uma responsabilidade maior." },
          { id: "storytelling", label: "Aprofundar storytelling", unlock: "storytelling", specialization: "storytelling", effects: { texto: 14, entrega: 8 }, narration: "Rossini desmonta histórias em tensão, viradas e payoff. Você sai sabendo sustentar uma narrativa inteira." }
        ]
      },
      {
        id: "gabriel-especializacao",
        kind: "path",
        choiceGroup: "mentor:gabriel",
        minDay: 15,
        maxDay: 35,
        requirements: { texto: 16, showsPerformedCount: 2 },
        title: "Gabriel Andrade — Forma curta ou presença visual",
        text: "Gabriel se dispõe a acompanhar seu material por algumas semanas. Você precisa escolher onde concentrar o trabalho agora.",
        image: "assets/characters/gabriel-andrade.png",
        choices: [
          { id: "prop", label: "Treinar prop comedy", unlock: "prop", specialization: "prop", effects: { entrega: 14, texto: 8 }, narration: "Você aprende a fazer o objeto carregar premissa, surpresa e ritmo — sem virar uma muleta." },
          { id: "oneliner", label: "Lapidar oneliners", unlock: "oneliner", specialization: "oneliner", effects: { texto: 18, entrega: 4 }, narration: "Gabriel corta cada palavra até setup e punchline parecerem inevitáveis." }
        ]
      },
      {
        id: "rossini-revisita",
        kind: "path",
        choiceGroup: "mentor:rossini:late",
        revisitOf: "mentor:rossini",
        minDay: 70,
        maxDay: 85,
        requirements: { showsPerformedCount: 6 },
        title: "Rossini Luz — O caminho que ficou para depois",
        text: "Rossini retoma a conversa antiga. Ainda dá para aprender a outra linguagem, mas já é tarde para ela definir esta corrida.",
        image: "assets/scenes/writing/notebook3.png"
      },
      {
        id: "gabriel-revisita",
        kind: "path",
        choiceGroup: "mentor:gabriel:late",
        revisitOf: "mentor:gabriel",
        minDay: 70,
        maxDay: 85,
        requirements: { showsPerformedCount: 6 },
        title: "Gabriel Andrade — A técnica que faltou",
        text: "Gabriel volta com a técnica que ficou de fora. Ela amplia seu repertório, mas não apaga a especialização escolhida no começo.",
        image: "assets/characters/gabriel-andrade.png"
      }
    ],
    politicoUnlock: {
      id: "carvalho-politico-unlock",
      title: "Professor Carvalho",
      text: "Carvalho aponta para a sala: 'Política não é só falar de candidato. É entender poder, contradição e quem paga a conta da piada. Se for entrar nisso, entra com ponto de vista.'",
      image: "assets/characters/carvalho.png"
    }
  };
})(window);
(function registerExistingEventContent(global) {
  const content = global.OpenMicRpgContent = global.OpenMicRpgContent || {};
  content.carvalhoDialogs = [
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
  content.events = [
    {
      id: "veterano", trigger: "showKill", once: true,
      requiresGoodPerformance: true, isGoodEvent: true, isCharacterEvent: true,
      text: "Depois do show, Stevan Gaipo te aborda: 'Pô, curti teu set! Cê tem timing bom. To saindo em turnê pelo interior e preciso de alguém pra abrir. Topa vir comigo? São 7 minutos num palco lotado.'",
      image: "assets/characters/stevan-gaipo.png",
      choices: [
        { label: "Aceitar o convite", startShowId: "veterano-turne", allowScheduleOverflow: true, narration: "Você aceita o convite do Stevan! É uma oportunidade extra na agenda: a chance de tocar plateias diferentes e aprender com quem já está há anos na estrada." },
        { label: "Agradecer mas recusar", effects: { fans: -5, motivation: 6 }, narration: "Você agradece o convite mas prefere se preparar mais. Stevan entende e diz que a porta tá aberta." }
      ]
    },
    {
      id: "corporativoConvite", trigger: "random",
      text: "Seu telefone toca: é uma pessoa do RH de uma empresa. 'O palestrante sumiu e precisamos de alguém pra animar o coffee break! Paga bem, mas é pra agora!'",
      image: "assets/venues/corporativo.png",
      choices: [
        { label: "Aceitar o desafio", startShowId: "corporativo-surpresa", narration: "Você aceita e já começa a pensar em piadas sobre trabalho. O cachê vai ajudar nas contas!" },
        { label: "Indicar outro comediante", effects: { texto: 6, motivation: 4, network: 5 }, narration: "Você passa o contato de um amigo. Ele agradece muito e te deve uma. Você usa o tempo livre pra estudar." }
      ]
    },
    {
      id: "podcast", trigger: "fans20", once: true,
      text: "Um podcast de comédia quer te entrevistar. Você pode focar em piadas prontas ou falar sério sobre o processo.",
      image: "assets/venues/podcast.png",
      choices: [
        { label: "Mandar punchline atrás de punchline", effects: { fans: 20, motivation: -4, network: 3 }, narration: "Você viraliza uns cortes, mas sai sem energia para escrever." },
        { label: "Falar sobre processo", effects: { texto: 10, motivation: 4, network: 5 }, narration: "Você inspira novos comediantes e reflete sobre seu método." }
      ]
    },
    {
      id: "clipDaNoite", trigger: "random", requiresCareerStage: "open", cooldown: 5,
      text: "Um trecho curto do seu set começou a circular nos stories. Dá pra tentar transformar isso em alcance rápido ou usar a atenção para fortalecer seu material no palco.",
      image: "assets/venues/podcast.png",
      choices: [
        { label: "Aproveitar o hype em cortes", effects: { fans: 18, motivation: -4 }, narration: "Os números sobem, mas sua energia criativa cai no curto prazo." },
        { label: "Chamar a galera para night de teste", effects: { texto: 8, network: 6, fans: 6 }, narration: "Você usa a atenção para encher uma noite de teste e lapidar melhor o set." }
      ]
    },
    {
      id: "algoritmoPressao", trigger: "random", requiresCareerStage: "elenco", cooldown: 6,
      text: "Seu agente insiste: 'O algoritmo quer frases de impacto, não blocos longos'. Você segue a pressão ou mantém foco em construção de set?",
      image: "assets/venues/rooftop-tech-meetup.png",
      choices: [
        { label: "Seguir a pressão do algoritmo", effects: { fans: 30, motivation: -6, texto: -3 }, narration: "Você cresce rápido, mas sente o repertório menos profundo." },
        { label: "Priorizar construção de set", effects: { texto: 10, entrega: 3, fans: 8 }, narration: "Você cresce mais devagar, mas sobe o nível real de palco." }
      ]
    },
    {
      id: "parceriaMarca", trigger: "random", requiresCareerStage: "headliner", requiredFans: 900, cooldown: 8,
      text: "Uma marca quer te pagar para encaixar publi no set. O cachê é alto, mas pode soar artificial para quem te acompanha há anos.",
      image: "assets/venues/corporativo.png",
      choices: [
        { label: "Aceitar a parceria", effects: { fans: 20, motivation: -5, network: 8 }, narration: "Você fecha contrato e ganha exposição, mas parte do público sente estranheza." },
        { label: "Recusar e fortalecer o solo", effects: { texto: 9, entrega: 4, motivation: 5 }, narration: "Você mantém autonomia criativa e converte o momento em material forte." }
      ]
    },
    {
      id: "comentarioForaContexto", trigger: "random", requiresCareerStage: "elenco", requiredFans: 120, cooldown: 7,
      text: "Um corte fora de contexto gerou discussão online. Você pode responder rápido para controlar narrativa ou focar em um set de resposta no palco.",
      image: "assets/venues/podcast.png",
      choices: [
        { label: "Responder em vídeo agora", effects: { fans: 14, motivation: -8, network: 3 }, narration: "Você reduz o incêndio, mas termina o dia drenado." },
        { label: "Transformar em bit no palco", effects: { texto: 12, entrega: 2, fans: 5 }, narration: "Você converte ruído em material e ganha respeito no circuito." }
      ]
    },
    {
      id: "bombMentor", trigger: "showBomb", cooldown: 5, requiresCopoSujo: true,
      isCharacterEvent: true,
      text: "Depois de uma água absurda no Copo Sujo, Professor Carvalho te liga: 'Quando um set afunda, não adianta sair dizendo que a plateia era ruim. Primeiro revisa o que você fez: abertura, ritmo, excesso de palavra, premissa frouxa, punch previsível. Técnica antes de ego.'",
      image: "assets/characters/carvalho.png",
      choices: [
        { label: "OK", effects: { texto: 10, motivation: 4 } }
      ]
    },
    {
      id: "cincoPiadas", trigger: "jokes5", once: true, isCharacterEvent: true,
      text: "Você já tem 5 piadas no caderno! Paulo Araújo, um comediante que você conheceu num bar, te manda mensagem: 'E aí, vi que tu tá escrevendo! Tenho um slot sobrando no 5 a 5 desse domingo, quer testar esse material?'",
      image: "assets/characters/paulo-araujo.png",
      choices: [
        { label: "Aceitar o convite", effects: { motivation: 8, texto: 3, network: 5 }, scheduleShow: "5a5", narration: "Paulo te inscreveu no 5 a 5 desse domingo! Você tem 3 minutos no palco.", unlock5a5: true },
        { label: "Quero mais material primeiro", effects: { motivation: -2 }, narration: "Você prefere escrever mais antes de encarar a plateia. Paulo entende e diz que é só chamar.", delayRouteInviteDays: 3 }
      ]
    },
    {
      id: "pauloAraujoPague15", trigger: "pague15Invite", once: true, isCharacterEvent: true,
      text: "Paulo Araújo te manda mensagem: 'E aí, vi que você tá mandando bem no 5 a 5! Que tal fazer parte do elenco fixo do Pague 15? É um show mais sério, com plateia pagante. Você topa?'",
      image: "assets/characters/paulo-araujo.png",
      choices: [
        { label: "Aceitar fazer parte do elenco fixo", effects: { motivation: 10, network: 8, texto: 5 }, unlockPague15: true, narration: "Paulo te adiciona ao elenco fixo do Pague 15! Agora você pode participar desse show às quintas-feiras. É um passo importante na sua carreira!" },
        { label: "Ainda não me sinto pronto", effects: { motivation: -3 }, narration: "Você prefere ganhar mais experiência antes. Paulo entende e diz que a porta sempre estará aberta.", delayRouteInviteDays: 4 }
      ]
    },
    {
      id: "stevanEstrada", trigger: "random", requiresGoodPerformance: true,
      isGoodEvent: true, isCharacterEvent: true,
      text: "Stevan Gaipo te manda mensagem: 'E aí, vi teus shows, curti. To indo fazer uns shows no interior semana que vem, quer vir junto?' A viagem é longa. Como você aproveita o tempo?",
      image: "assets/characters/stevan-gaipo.png",
      choices: [
        { label: "Revisar material no trajeto", effects: { texto: 8, motivation: -3 }, narration: "Você passa a viagem revisando piadas e estruturando o set. Chega mais preparado, mas meio cansado." },
        { label: "Fazer amizade com a galera", effects: { motivation: 5, network: 12 }, narration: "Você troca ideia com todo mundo, conta histórias, ouve outras. Sai com vários contatos novos e animado." }
      ]
    },
    {
      id: "criseCriativa", trigger: "random",
      text: "Você olha pro caderno em branco há horas. Nada vem. Tenta escrever, apaga, tenta de novo. Bloqueio criativo bateu forte.",
      image: "assets/scenes/writing/quarto1.png",
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
      image: "assets/scenes/events/comic-stealing-jokes.png",
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
      id: "jogoDoTigrinho", trigger: "random", cooldown: 8,
      text: "Uma casa de aposta quer que você divulgue o Jogo do Tigrinho no palco. O cachê e o alcance são altos, mas a proposta bate torto com parte do público e com o material que você vem construindo.",
      choices: [
        { label: "Aceitar a publi", effects: { fans: 35, network: 10, motivation: -15, texto: -8 }, narration: "O alcance dispara e produtores passam seu contato, mas você sai do palco com menos vontade de escrever e uma conta criativa para pagar." },
        { label: "Recusar e transformar a proposta em bit", effects: { texto: 15, motivation: 8, fans: -8 }, narration: "Você perde o alcance fácil, mas transforma a conversa em material e preserva o eixo do trabalho." }
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
      image: "assets/scenes/writing/quarto2.png",
      choices: [
        { label: "Ir mesmo assim", effects: { motivation: -8, network: 5 }, narration: "Você toma um remédio, vai e faz o set no automático. Não foi seu melhor dia, mas o produtor respeita quem cumpre compromisso." },
        { label: "Avisar que não vai", effects: { motivation: 5, network: -8 }, narration: "Você avisa o produtor que não tem condição. Ele não fica feliz, mas pelo menos você não piorou a doença." }
      ]
    },
    {
      id: "mentorOferece", trigger: "random", isCharacterEvent: true,
      text: "Um comediante mais experiente te oferece mentoria. Mas ele é conhecido por ser duro e exigente.",
      image: "assets/characters/carvalho.png",
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
      id: "douglasFerreiraReading", trigger: "random", isCharacterEvent: true,
      text: "Douglas Ferreira, porteiro do Copo Sujo e comediante secreto, te puxa de lado depois do show: 'Ó, te dou uma dica grátis: antes de subir, lê a plateia. Vê quem tá prestando atenção, quem tá no celular, quem veio de casal. Isso muda tudo.'",
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
      choices: [
        { label: "Aprender sobre produção", effects: { network: 12, texto: 5, motivation: -3 }, narration: "Bruno te mostra os bastidores: contrato com casa, divisão de bilheteria, curadoria de elenco. É cansativo mas revelador. Você entende como o negócio funciona." },
        { label: "Perguntar sobre gestão de carreira", effects: { network: 8, motivation: 5, fans: 5 }, narration: "Bruno te dá conselhos sobre posicionamento: 'Não aceita qualquer show. Escolha onde aparece. Sua marca é o que as pessoas falam quando você sai.' Você sai pensando diferente." },
        { label: "Só bater um papo", effects: { motivation: 6, network: 5 }, narration: "Vocês ficam trocando histórias do circuito. Bruno é uma enciclopédia viva da comédia brasileira." }
      ]
    },
    {
      id: "diegoFerreiraColetivo", trigger: "random", once: true, isCharacterEvent: true,
      text: "Diego Ferreira te manda mensagem num grupo de WhatsApp: 'Opa! Tô montando um coletivo de comédia. A ideia é juntar gente nova, dividir palco, trocar material, fazer shows juntos. Topa entrar?'",
      choices: [
        { label: "Entrar no coletivo", effects: { network: 15, motivation: 10, entrega: 5 }, narration: "Você entra no coletivo! Shows em grupo, ensaios semanais, troca de material. É como ter uma família de comédia. Seu network explode." },
        { label: "Preferir seguir solo", effects: { motivation: 5, texto: 3 }, narration: "Você agradece mas prefere seguir seu próprio caminho. Diego entende: 'Respeito. Se mudar de ideia, a porta tá aberta.'" }
      ]
    },
    {
      id: "hackWarning", trigger: "random", once: true, isCharacterEvent: true,
      text: "Professor Carvalho te liga: 'Parabéns pelas 5 piadas! Agora, um aviso importante sobre CALLBACKS. Callback fraco só menciona algo antigo e repete referência. Callback forte usa o elemento anterior para criar uma piada nova: nova premissa, nova virada ou novo punchline. Se você só repete, vira truque previsível. Use com moderação e intenção.'",
      image: "assets/characters/carvalho.png",
      choices: [
        { label: "✅ Entendido", effects: { texto: 5, motivation: 6, entrega: 2 }, narration: "Você anota no caderno: 'Callback bom cria piada nova; callback fraco só repete.' Carvalho sorri e te manda voltar pro texto original." }
      ]
    }
  ].map(event => ({ ...event, kind: event.kind || "incidental" }));
})(window);
