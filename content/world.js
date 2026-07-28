(function registerV2WorldContent(global) {
  const content = global.OpenMicRpgContent = global.OpenMicRpgContent || {};

  content.v2World = {
    politicoIdeas: [
      { seed: "reunião de condomínio como microditadura", tone: "político", baseMinutes: 1, place: "ler o grupo do prédio", mood: "poder cotidiano" },
      { seed: "promessa eleitoral em grupo de família", tone: "político", baseMinutes: 1, place: "almoço de domingo", mood: "contradição" },
      { seed: "aplicativo público que só funciona em horário comercial", tone: "político", baseMinutes: 1, place: "fila de atendimento", mood: "burocracia" },
      { seed: "coach explicando meritocracia para herdeiro", tone: "político", baseMinutes: 1, place: "corte de podcast", mood: "classe social" },
      { seed: "debate político tratado como final de campeonato", tone: "político", baseMinutes: 1, place: "bar lotado", mood: "polarização" },
      { seed: "vereador inaugurando placa da própria placa", tone: "político", baseMinutes: 1, place: "praça do bairro", mood: "vaidade pública" }
    ]
  };
})(window);
(function registerNarrativeWorldContent(global) {
  const content = global.OpenMicRpgContent = global.OpenMicRpgContent || {};
  content.world = content.world || {};
  content.world.scenes = {
    home: { title: "Apartamentinho", image: null },       // dynamic based on day
    writing: { title: "Bloco de notas", image: null },     // dynamic
    club: { title: "Clube", image: "assets/venues/copo-sujo-comedy.png" },
    bomb: { title: "Deu Água", image: "assets/scenes/performance/awful-show-1-out-5.png" },
    risinhos: { title: "Risinhos", image: "assets/scenes/performance/bad-show-2-out-5.png" },
    ok: { title: "Segurou", image: "assets/scenes/performance/good-show-3-out-5.png" },
    kill: { title: "Matou no Palco", image: "assets/scenes/performance/great-show-4-out-5.png" },
    explode: { title: "Explodiu!", image: "assets/scenes/performance/excellent-show-5-out-5.png" },
    content: { title: "Conteúdo em casa", image: null },   // dynamic
    study: { title: "Estudos e referências", image: null }, // dynamic
    event: { title: "", image: null },
    intro: { title: "Professor Carvalho", image: "assets/characters/carvalho.png" }
  };
  content.world.avatarImages = {
    avatar1: "assets/avatars/avatar1-refined.png",
    avatar2: "assets/avatars/avatar2-refined.png",
    avatar3: "assets/avatars/avatar3-refined.png",
    avatar4: "assets/avatars/avatar4-refined.png",
    avatar5: "assets/avatars/avatar5-refined.png",
    avatar6: "assets/avatars/avatar6-refined.png"
  };
content.world.homeText =
    "Você está em casa, à toa. Você tem certeza que será descoberto pelo mercado de comédia, já que se considera naturalmente muito mais engraçado que todo mundo que faz stand up. Apesar disso, talvez fosse uma boa ideia escrever piadas ou buscar show para se apresentar - só enquanto a fama não vem do nada...";
  content.world.mentorIntroLines = [
    "Olá! Meu nome é Illan Carvalho, mas no circuito me chamam de Professor Carvalho.",
    "Você vai ouvir muito conselho por aí. Na maior parte do tempo, é só outro comediante explicando como ele funciona.",
    "Estudar não é copiar especial. É entender como o comediante pensa, corta, acelera, constrói e reescreve.",
    "Seu trabalho é escrever, testar, ajustar e repetir até transformar palco em laboratório.",
    "Antes de te mandar pro ringue, me diz: quem é você nessa busca pela próxima risada?"
  ];
})(window);
(function registerExistingWorldContent(global) {
  const content = global.OpenMicRpgContent = global.OpenMicRpgContent || {};
  content.world = content.world || {};
  content.world.ideaPool = [
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
  content.world.showPool = [
    // ─── Regular venues ───
    {
      id: "bar-do-tony", name: "Bar do Tony - Quarta do Riso", minMinutes: 5, difficulty: 0.25,
      crowd: "Clientes distraídos, olhando pra TV, só param pra ouvir causos pessoais que parecem verdade.",
      intro: "Tony te chamou pra completar a noite. Plateia espalhada, TV ligada no jogo. Só sobe quem confia no próprio texto.",
      image: "assets/venues/bar-do-tony.png", vibeHint: "Narrativas sinceras e paranoias do dia a dia seguram a atenção.",
      typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.2, "humor negro": -0.2, limpo: 0.6, hack: 0.4 }
    },
    {
      id: "corporativo", name: "Coffee Break Corporativo", minMinutes: 6, difficulty: 0.4,
      crowd: "Executivos que riem só pra aliviar a tensão antes de falar de metas e planilhas.",
      intro: "Um RH desesperado quer 'algo leve' antes da palestra sobre metas. Não fale palavrão e tente parecer profissional.",
      image: "assets/venues/corporativo.png", vibeHint: "Comentários sobre trabalho e situações absurdas salvam sua pele.",
      typeAffinity: { default: -0.2, besteirol: -0.1, vulgar: -0.8, "humor negro": -0.5, limpo: 0.7, hack: 0.6 }
    },
    {
      id: "boteco-esquina", name: "Boteco da Esquina", minMinutes: 4, difficulty: 0.2,
      crowd: "Galera barulhenta que grita com o jogo e só escuta confidentes que parecem amigos.",
      intro: "O dono do boteco libera o microfone durante o intervalo do futebol. Você tem poucos minutos antes da próxima rodada de chope.",
      image: "assets/venues/barzinho.png", vibeHint: "Piadas toscas e confissões pessoais se destacam.",
      typeAffinity: { default: -0.05, besteirol: 0.6, vulgar: 0.2, "humor negro": 0.1, limpo: -0.3, hack: 0 }
    },
    {
      id: "festival-praia", name: "Festival de Praia", minMinutes: 6, difficulty: 0.35,
      crowd: "Turistas queimados de sol, crianças correndo e ninguém muito sóbrio.",
      intro: "Uma tenda cultural te chama para preencher a programação. O vento leva metade das palavras, então precisa ser direto.",
      image: "assets/venues/outdoor-gig.png", vibeHint: "Storytelling curto com finais absurdos prende a atenção.",
      typeAffinity: { default: -0.15, besteirol: 0.3, vulgar: 0.4, "humor negro": -0.2, limpo: 0.2, hack: 0.1 }
    },
    {
      id: "shopping-familia", name: "Noite Família no Shopping", minMinutes: 5, difficulty: 0.22,
      crowd: "Casais com crianças e seguranças atentos.",
      intro: "O shopping resolveu apostar em stand-up 'para toda a família'. Microfone impecável, tolerância a palavrões próxima de zero.",
      image: "assets/venues/mall.png", vibeHint: "Material limpo com observações sobre cotidiano ganha pontos.",
      typeAffinity: { default: 0, besteirol: 0.2, vulgar: -0.6, "humor negro": -0.5, limpo: 0.7, hack: 0.3 }
    },
    {
      id: "after-hours", name: "After Hours Subúrbio", minMinutes: 5, difficulty: 0.4,
      crowd: "Comediantes cansados e insônia coletiva às 2h da manhã.",
      intro: "Você caiu na lista do show secreto após a meia-noite. Só funciona se você ousar testar as coisas mais estranhas.",
      image: "assets/venues/motorcycle-club.png", vibeHint: "Humor negro e bits experimentais são esperados.",
      typeAffinity: { default: -0.1, besteirol: 0, vulgar: 0.2, "humor negro": 0.7, limpo: -0.4, hack: -0.2 }
    },
    {
      id: "casa-de-swing", name: "Casa de Swing", minMinutes: 5, difficulty: 0.42,
      crowd: "Adultos em mesas baixas, clima de flerte e risadas desconfortáveis esperando alguém quebrar o gelo.",
      intro: "Uma casa noturna adulta quer stand-up antes da pista esquentar. O ambiente é estranho, íntimo e zero família.",
      image: "assets/venues/casa-de-swing.png", vibeHint: "Ousadia, vulgaridade controlada e leitura de sala fazem a diferença.",
      typeAffinity: { default: -0.05, besteirol: 0.2, vulgar: 0.7, "humor negro": 0.3, limpo: -0.7, hack: 0.1 }
    },
    {
      id: "bem-bolado", name: "Bem Bolado", minMinutes: 5, difficulty: 0.3,
      crowd: "Plateia relaxada demais, rindo atrasado e perdendo o fio se a piada demora muito.",
      intro: "Um lounge temático de cannabis abriu espaço para comédia. O clima é lento, verde e cheio de gente filosofando no sofá.",
      image: "assets/venues/bem-bolado.png", vibeHint: "Besteirol, observações absurdas e ritmo simples funcionam melhor.",
      typeAffinity: { default: 0.05, besteirol: 0.7, vulgar: 0.2, "humor negro": 0.1, limpo: 0, hack: 0.3 }
    },
    {
      id: "teatro-limpo", name: "Teatro Municipal - Noite Limpa", minMinutes: 7, difficulty: 0.5,
      crowd: "Plateia educada, paga e extremamente crítica.",
      intro: "A prefeitura convidou novos talentos para um mini-festival. Som perfeito, mas você precisa merecer cada aplauso.",
      image: "assets/venues/teatro-municipal.png", vibeHint: "Estruturas sólidas e bits inteligentes brilham.",
      typeAffinity: { default: -0.05, besteirol: -0.2, vulgar: -0.5, "humor negro": 0.2, limpo: 0.6, hack: 0.3 }
    },
    {
      id: "podcast-live", name: "Podcast Ao Vivo", minMinutes: 4, difficulty: 0.3,
      crowd: "Fãs de comédia que conhecem cada referência.",
      intro: "Um podcast famoso abre espaço para sets curtos entre entrevistas. Tudo vira clipe em segundos.",
      image: "assets/venues/podcast.png", vibeHint: "Piadas autorreferenciais e material sobre bastidores funcionam.",
      typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: -0.1, "humor negro": 0.2, limpo: 0.1, hack: 0.5 }
    },
    {
      id: "barbearia", name: "Barbearia Comedy Night", minMinutes: 4, difficulty: 0.25,
      crowd: "Clientes esperando corte e barbeiros que comentam o set.",
      intro: "Uma barbearia hipster decidiu fazer stand-up entre cortes de cabelo. Espaço apertado, vibe íntima.",
      image: "assets/venues/barber-shop.png", vibeHint: "Observações hack e bits sobre aparência conectam.",
      typeAffinity: { default: 0, besteirol: 0.2, vulgar: -0.2, "humor negro": -0.1, limpo: 0.3, hack: 0.4 }
    },
    {
      id: "sarau-poesia", name: "Sarau de Poesia e Riso", minMinutes: 3, difficulty: 0.18,
      crowd: "Artistas indie que apreciam textos autorais.",
      intro: "Você foi convidado para quebrar a seriedade de um sarau. Precisa ser inteligente sem desrespeitar ninguém.",
      image: "assets/venues/art-gallery.png", vibeHint: "Storytelling poético e humor reflexivo ganham destaque.",
      typeAffinity: { default: 0.05, besteirol: -0.2, vulgar: -0.4, "humor negro": 0.2, limpo: 0.4, hack: 0.1 }
    },
    {
      id: "rooftop-tech", name: "Rooftop Tech Meetup", minMinutes: 5, difficulty: 0.32,
      crowd: "Startupeiros ansiosos que só falam de app e rodadas de investimento.",
      intro: "Uma startup contratou comediantes para descontrair o happy hour. Cuidado para não ofender futuros contratantes.",
      image: "assets/venues/rooftop-tech-meetup.png", vibeHint: "Piadas sobre tecnologia e trabalho remoto pontuam bem.",
      typeAffinity: { default: 0, besteirol: -0.1, vulgar: -0.5, "humor negro": 0.2, limpo: 0.3, hack: 0.6 }
    },
    {
      id: "metro-linha-azul", name: "Linha Azul After-Work", minMinutes: 3, difficulty: 0.27,
      crowd: "Passageiros cansados que só querem chegar em casa.",
      intro: "Uma ação cultural leva stand-up para o vagão especial. Você tem pouco tempo entre as estações.",
      image: "assets/venues/metro-comedy.png", vibeHint: "One-liners rápidos e humor sobre transporte são essenciais.",
      typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.3, "humor negro": 0, limpo: 0.2, hack: 0.5 }
    },
    {
      id: "noite-feminina", name: "Noite Feminina no Comedy", minMinutes: 5, difficulty: 0.28,
      crowd: "Plateia engajada que valoriza autenticidade.",
      intro: "Você foi convidado para uma noite temática com curadoria cuidadosa. Respeito e vulnerabilidade são chave.",
      image: "assets/venues/bar-do-tony.png", vibeHint: "Storytelling sincero e observações afiadas funcionam bem.",
      typeAffinity: { default: 0.1, besteirol: -0.1, vulgar: -0.4, "humor negro": 0.2, limpo: 0.4, hack: 0.2 }
    },
    {
      id: "veterano-turne", name: "Turnê do Veterano", minMinutes: 7, difficulty: 0.45,
      crowd: "Fãs fiéis do headliner, exigentes com quem abre o show.",
      intro: "Um veterano te entrega 7 minutos antes do set principal. Não desperdice o palco lotado.",
      image: "assets/venues/comedy-turne-veterano.png", vibeHint: "Bits bem estruturados e humor profissional impressionam.",
      typeAffinity: { default: -0.1, besteirol: 0, vulgar: -0.3, "humor negro": 0.3, limpo: 0.4, hack: 0.5 }
    },
    {
      id: "corporativo-surpresa", name: "Coffee Break Emergencial", minMinutes: 6, difficulty: 0.55,
      crowd: "Equipe exausta de vendas que precisa sorrir para continuar.",
      intro: "O RH te liga de última hora: o palestrante principal atrasou e você precisa segurar o clima.",
      image: "assets/venues/coffee-break.png", vibeHint: "Piadas limpas sobre trabalho e improvisos corporativos salvam.",
      typeAffinity: { default: -0.2, besteirol: -0.1, vulgar: -0.7, "humor negro": -0.3, limpo: 0.6, hack: 0.7 }
    },
    {
      id: "bar-universitario", name: "Open Mic Universitário", minMinutes: 4, difficulty: 0.18,
      crowd: "Estudantes bêbados que riem de qualquer coisa depois das 23h.",
      intro: "Um bar perto da faculdade abre espaço para novatos. Público jovem e barulhento.",
      image: "assets/venues/open-universitario.png", vibeHint: "Besteirol e vulgaridade funcionam bem com essa galera.",
      typeAffinity: { default: 0, besteirol: 0.7, vulgar: 0.5, "humor negro": 0.2, limpo: -0.2, hack: 0.2 }
    },
    {
      id: "livraria-cultural", name: "Livraria & Riso", minMinutes: 5, difficulty: 0.3,
      crowd: "Intelectuais com café na mão, buscando humor sofisticado.",
      intro: "Uma livraria cult quer animar as noites de sábado com stand-up entre as estantes.",
      image: "assets/venues/biblioteca.png", vibeHint: "Referências culturais e humor inteligente impressionam.",
      typeAffinity: { default: 0, besteirol: -0.2, vulgar: -0.5, "humor negro": 0.4, limpo: 0.5, hack: 0.3 }
    },
    {
      id: "pub-irlandes", name: "Pub O'Laughs", minMinutes: 5, difficulty: 0.28,
      crowd: "Gringos expatriados e brasileiros que fingem entender inglês.",
      intro: "Um pub irlandês faz noite de comédia bilíngue. Sotaque não é problema.",
      image: "assets/venues/pub.png", vibeHint: "Piadas universais sobre comportamento funcionam em qualquer língua.",
      typeAffinity: { default: 0.1, besteirol: 0.4, vulgar: 0.1, "humor negro": 0.2, limpo: 0.3, hack: 0.4 }
    },
    {
      id: "churrascaria", name: "Comedy & Carne", minMinutes: 4, difficulty: 0.22,
      crowd: "Famílias em rodízio que não vieram pra prestar atenção.",
      intro: "Uma churrascaria resolveu colocar entretenimento. Concorra com a picanha.",
      image: "assets/venues/churrascaria-comedy.png", vibeHint: "Material limpo e observações sobre comida ganham a mesa.",
      typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.4, "humor negro": -0.3, limpo: 0.6, hack: 0.4 }
    },
    {
      id: "teatro-alternativo", name: "Teatro do Porão", minMinutes: 6, difficulty: 0.38,
      crowd: "Plateia cult que curte o underground e detesta o mainstream.",
      intro: "Um teatro de porão te convida para a noite experimental. Vale tudo.",
      image: "assets/venues/basement-theater.png", vibeHint: "Ousadia e originalidade são mais importantes que punchlines perfeitas.",
      typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: 0.3, "humor negro": 0.6, limpo: -0.3, hack: -0.2 }
    },
    {
      id: "stand-up-sertanejo", name: "Riso & Viola", minMinutes: 5, difficulty: 0.25,
      crowd: "Fãs de sertanejo entre uma música e outra do show principal.",
      intro: "Uma casa de shows sertaneja quer esquentar a plateia antes da banda.",
      image: "assets/venues/sertanejo-house.png", vibeHint: "Piadas sobre interior, família e relacionamento agradam.",
      typeAffinity: { default: 0, besteirol: 0.4, vulgar: 0.2, "humor negro": -0.2, limpo: 0.5, hack: 0.3 }
    },
    {
      id: "hostel-mochileiro", name: "Backpacker Comedy", minMinutes: 4, difficulty: 0.2,
      crowd: "Mochileiros de todas as idades compartilhando histórias de viagem.",
      intro: "Um hostel faz noite de talentos. Qualquer um pode subir.",
      image: "assets/venues/copo-sujo-comedy.png", vibeHint: "Histórias de perrengue e observações culturais conectam.",
      typeAffinity: { default: 0.1, besteirol: 0.5, vulgar: 0.2, "humor negro": 0.1, limpo: 0.3, hack: 0.3 }
    },
    {
      id: "casamento", name: "Festa de Casamento", minMinutes: 6, difficulty: 0.45,
      crowd: "Parentes que não se veem há anos e amigos bêbados dos noivos.",
      intro: "Os noivos te contrataram para o brinde. Não estrague o dia mais importante deles.",
      image: "assets/venues/wedding.png", vibeHint: "Piadas sobre relacionamento e família, mas sem ser ofensivo.",
      typeAffinity: { default: -0.1, besteirol: 0.2, vulgar: -0.6, "humor negro": -0.4, limpo: 0.7, hack: 0.4 }
    },
    {
      id: "show-beneficente", name: "Stand-Up Solidário", minMinutes: 5, difficulty: 0.3,
      crowd: "Pessoas generosas que pagaram ingresso caro por uma boa causa.",
      intro: "Um evento beneficente te convida. A causa é nobre, a pressão também.",
      image: "assets/venues/bar-do-tony.png", vibeHint: "Humor leve e positivo. Nada que estrague o clima de caridade.",
      typeAffinity: { default: 0.1, besteirol: 0.2, vulgar: -0.5, "humor negro": -0.2, limpo: 0.6, hack: 0.3 }
    },
    {
      id: "cervejaria-artesanal", name: "Cervejaria & Comédia", minMinutes: 5, difficulty: 0.24,
      crowd: "Hipsters com barba provando IPAs e falando de lúpulo.",
      intro: "Uma cervejaria artesanal faz noite de stand-up entre as torneiras.",
      image: "assets/venues/cervejaria.png", vibeHint: "Observações sobre comportamento urbano e tendências funcionam.",
      typeAffinity: { default: 0.1, besteirol: 0.3, vulgar: 0.1, "humor negro": 0.3, limpo: 0.2, hack: 0.5 }
    },
    {
      id: "sindicato", name: "Show do Sindicato", minMinutes: 6, difficulty: 0.35,
      crowd: "Trabalhadores em assembleia que querem descontrair.",
      intro: "O sindicato te chamou para a confraternização anual. Público exigente.",
      image: "assets/venues/sindicato-hall.png", vibeHint: "Piadas sobre trabalho e patrão funcionam. Evite política direta.",
      typeAffinity: { default: 0, besteirol: 0.2, vulgar: 0.1, "humor negro": 0.3, limpo: 0.3, hack: 0.5 }
    },
    {
      id: "festa-junina", name: "Arraiá do Riso", minMinutes: 4, difficulty: 0.2,
      crowd: "Famílias em festa com quentão na mão e chapéu de palha.",
      intro: "Uma festa junina de bairro te convida para animar entre as quadrilhas.",
      image: "assets/venues/arraia.png", vibeHint: "Humor família e piadas sobre tradições caem bem.",
      typeAffinity: { default: 0.1, besteirol: 0.5, vulgar: -0.3, "humor negro": -0.2, limpo: 0.6, hack: 0.3 }
    },
    {
      id: "show-lgbtq", name: "Rainbow Comedy", minMinutes: 5, difficulty: 0.28,
      crowd: "Comunidade LGBTQ+ que valoriza autenticidade e ousadia.",
      intro: "Uma casa noturna LGBTQ+ faz noite de stand-up. Seja você mesmo.",
      image: "assets/venues/rainbow-nightclub.png", vibeHint: "Autenticidade e humor sobre experiências pessoais conectam.",
      typeAffinity: { default: 0.15, besteirol: 0.3, vulgar: 0.4, "humor negro": 0.3, limpo: 0.1, hack: 0.2 }
    },
    {
      id: "republica", name: "Comedy na República", minMinutes: 4, difficulty: 0.15,
      crowd: "Universitários em festa que só querem rir e beber.",
      intro: "Uma república estudantil abriu as portas para um show informal.",
      image: "assets/venues/republica.png", vibeHint: "Qualquer coisa que seja escandalosa ou boba funciona.",
      typeAffinity: { default: 0.1, besteirol: 0.6, vulgar: 0.6, "humor negro": 0.3, limpo: -0.2, hack: 0.2 }
    },
    {
      id: "restaurante-japones", name: "Sushi & Stand-Up", minMinutes: 5, difficulty: 0.32,
      crowd: "Clientes de restaurante japonês sofisticado.",
      intro: "Um restaurante japonês chique quer inovar com entretenimento.",
      image: "assets/venues/sushi-restaurant.png", vibeHint: "Humor sutil e observações refinadas agradam.",
      typeAffinity: { default: 0, besteirol: -0.1, vulgar: -0.5, "humor negro": 0.2, limpo: 0.5, hack: 0.4 }
    },
    {
      id: "stand-up-feminino", name: "Ladies' Night Comedy", minMinutes: 5, difficulty: 0.26,
      crowd: "Mulheres em noite só delas, celebrando juntas.",
      intro: "Uma noite de comédia só para mulheres. Ambiente acolhedor e empoderado.",
      image: "assets/venues/bar-do-tony.png", requiresAvatar: ["avatar3", "avatar4"],
      vibeHint: "Experiências genuínas e observações sobre o dia a dia conectam.",
      typeAffinity: { default: 0.1, besteirol: 0.3, vulgar: 0.2, "humor negro": 0.2, limpo: 0.4, hack: 0.3 }
    },
    {
      id: "parque-ao-ar-livre", name: "Comedy no Parque", minMinutes: 5, difficulty: 0.35,
      crowd: "Famílias passeando no domingo, crianças correndo.",
      intro: "Um evento cultural no parque te chama. Som ao ar livre, público disperso.",
      image: "assets/venues/park-comedy.png", vibeHint: "Material limpo e energia alta para segurar atenção.",
      typeAffinity: { default: -0.1, besteirol: 0.3, vulgar: -0.6, "humor negro": -0.4, limpo: 0.6, hack: 0.3 }
    },
    {
      id: "microfone-aberto-padaria", name: "Microfone Aberto da Padaria", minMinutes: 3, difficulty: 0.12,
      requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 4,
      crowd: "Clientes do bairro esperando pão na chapa e café.",
      intro: "A padaria liberou um cantinho para talentos locais. Público simpático, mas impaciente.",
      image: "assets/venues/padaria-open-mic.png", vibeHint: "Observações cotidianas simples e diretas funcionam melhor.",
      typeAffinity: { default: 0.1, besteirol: 0.5, vulgar: -0.2, "humor negro": 0, limpo: 0.6, hack: 0.2 }
    },
    {
      id: "quinta-do-calouro", name: "Quinta do Calouro", minMinutes: 3, difficulty: 0.16,
      requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 4,
      crowd: "Comediantes iniciantes torcendo uns pelos outros.",
      intro: "Noite de estreia para quem está começando. Ambiente acolhedor, porém caótico.",
      image: "assets/venues/open-universitario.png", vibeHint: "Texto curto com punchline clara e energia alta ajuda muito.",
      typeAffinity: { default: 0.1, besteirol: 0.6, vulgar: 0.2, "humor negro": 0.1, limpo: 0.2, hack: 0.2 }
    },
    {
      id: "rodada-trabalho", name: "Rodada do Pós-Trampo", minMinutes: 4, difficulty: 0.2,
      requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 5,
      crowd: "Gente cansada do trabalho querendo rir sem pensar muito.",
      intro: "Você pegou o último slot do pós-trampo. Plateia cansada, mas aberta a bons causos.",
      image: "assets/venues/coffee-break.png", vibeHint: "Piadas sobre rotina e trabalho conectam rápido.",
      typeAffinity: { default: 0.05, besteirol: 0.3, vulgar: -0.3, "humor negro": 0.1, limpo: 0.5, hack: 0.4 }
    },
    {
      id: "sarjeta-comedy", name: "Sarjeta Comedy 23h", minMinutes: 3, difficulty: 0.24,
      requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 4,
      crowd: "Mesa pequena, barulhenta e sem filtro no fim da noite.",
      intro: "Último bloco da noite. Se você não ganhar a sala em 30 segundos, já era.",
      image: "assets/venues/motorcycle-club.png", vibeHint: "Entrada forte e ritmo acelerado salvam o set.",
      typeAffinity: { default: -0.05, besteirol: 0.4, vulgar: 0.4, "humor negro": 0.4, limpo: -0.4, hack: 0.2 }
    },
    {
      id: "teste-domingo-praca", name: "Teste de Domingo na Praça", minMinutes: 4, difficulty: 0.18,
      requiresCareerStage: "open", isOpenStarter: true, setLengthTarget: 5,
      crowd: "Público variado, de família a curiosos de passagem.",
      intro: "Evento comunitário de domingo. Ótimo para testar material sem tanta pressão.",
      image: "assets/venues/park-comedy.png", vibeHint: "Material limpo e observações universais vão melhor aqui.",
      typeAffinity: { default: 0.1, besteirol: 0.4, vulgar: -0.4, "humor negro": -0.1, limpo: 0.6, hack: 0.3 }
    },
    {
      id: "navio-cruzeiro", name: "Comedy no Cruzeiro", minMinutes: 7, difficulty: 0.4, requiresLevel: "elenco",
      crowd: "Passageiros de cruzeiro de todas as idades e origens.",
      intro: "Um cruzeiro te contrata para a temporada. Público cativo e variado.",
      image: "assets/venues/cruise-lounge-comedy.png", vibeHint: "Humor universal, nada muito local ou nichado.",
      typeAffinity: { default: 0.05, besteirol: 0.3, vulgar: -0.3, "humor negro": -0.1, limpo: 0.5, hack: 0.5 }
    },
    {
      id: "programa-tv", name: "Participação em TV", minMinutes: 4, difficulty: 0.5, requiresLevel: "elenco",
      crowd: "Plateia de programa de TV, câmeras ligadas.",
      intro: "Você foi chamado para um quadro de comédia na TV. É sua chance de aparecer.",
      image: "assets/venues/tv-studio-comedy.png", vibeHint: "Material polido e timing perfeito. Cada segundo conta.",
      typeAffinity: { default: 0, besteirol: 0.2, vulgar: -0.6, "humor negro": -0.3, limpo: 0.6, hack: 0.5 }
    },
    {
      id: "elenco-porao-segunda", name: "Circuito Elenco - Porão da Segunda", minMinutes: 8, difficulty: 0.42,
      requiresCareerStage: "elenco", isElencoCircuit: true, setLengthTarget: 15,
      crowd: "Público que acompanha comédia de perto e cobra material consistente.",
      intro: "Noite de elenco no porão. Você tem 15 minutos para segurar a sala sem muleta.",
      image: "assets/venues/basement-theater.png", vibeHint: "Consistência e ritmo importam mais que explosões isoladas.",
      typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: -0.2, "humor negro": 0.3, limpo: 0.4, hack: 0.4 }
    },
    {
      id: "elenco-comedy-quarta", name: "Circuito Elenco - Quarta de Casa Cheia", minMinutes: 8, difficulty: 0.45,
      requiresCareerStage: "elenco", isElencoCircuit: true, setLengthTarget: 15,
      crowd: "Plateia pagante acostumada com lineups fortes e comparações cruéis.",
      intro: "A produção te deu 15 minutos no meio da grade. Sem ritmo, o público te engole.",
      image: "assets/venues/bar-do-tony.png", vibeHint: "Transições sólidas e fechamento forte definem a noite.",
      typeAffinity: { default: 0.05, besteirol: 0.2, vulgar: -0.3, "humor negro": 0.3, limpo: 0.4, hack: 0.4 }
    },
    {
      id: "elenco-coletivo-domingo", name: "Circuito Elenco - Coletivo de Domingo", minMinutes: 7, difficulty: 0.38,
      requiresCareerStage: "elenco", isElencoCircuit: true, setLengthTarget: 15,
      crowd: "Comediantes e fãs fiéis analisando cada escolha de set.",
      intro: "Domingo de coletivo: 15 minutos para provar que seu material aguenta repetição semanal.",
      image: "assets/venues/copo-sujo-comedy.png", vibeHint: "Material autoral e controle de energia fazem diferença.",
      typeAffinity: { default: 0.1, besteirol: 0.1, vulgar: -0.2, "humor negro": 0.4, limpo: 0.3, hack: 0.4 }
    },
    {
      id: "black-house-show-de-elenco", name: "Show de Elenco - Black House Comedy", minMinutes: 10, difficulty: 0.44,
      requiresCareerStage: "elenco", requiresBlackHouseElenco: true, isElencoCircuit: true, setLengthTarget: 15,
      location: "Sorocaba - SP", travelDays: 2,
      crowd: "Plateia pagante da Black House, perto do palco e acostumada com comediantes experientes da casa.",
      intro: "João Valio te coloca no Show de Elenco da Black House Comedy. Você volta a Sorocaba para sustentar um bloco de 15 minutos.",
      image: "assets/venues/black-house-comedy.png", vibeHint: "Texto sólido ajuda, mas profissionalismo e capacidade de vender a noite também pesam.",
      typeAffinity: { default: 0.15, besteirol: 0.25, vulgar: 0, "humor negro": 0.3, limpo: 0.35, hack: 0.25 }
    },
    {
      id: "solo-lab-preview", name: "Solo Lab - Preview de 25", minMinutes: 12, difficulty: 0.5,
      requiresCareerStage: "headliner", isHeadlinerSoloPipeline: true, headlinerSoloTier: "preview", setLengthTarget: 25,
      crowd: "Público fiel e crítico que repara em cada transição.",
      intro: "Você ganhou 25 minutos para testar o solo. Aqui, set ruim vira rumor na cidade inteira.",
      image: "assets/venues/teatro-municipal.png", vibeHint: "Ritmo, narrativa e consistência valem mais que punchline isolada.",
      typeAffinity: { default: 0.15, besteirol: 0.1, vulgar: -0.2, "humor negro": 0.4, limpo: 0.3, hack: 0.4 }
    },
    {
      id: "solo-noite-principal", name: "Noite Principal - Solo Completo", minMinutes: 15, difficulty: 0.58,
      requiresCareerStage: "headliner", isHeadlinerSoloPipeline: true, headlinerSoloTier: "main", setLengthTarget: 30,
      requiredNetwork: 90, requiredFans: 2500,
      crowd: "Casa cheia para te ver como atração principal. Expectativa máxima.",
      intro: "A noite é sua. Você carrega a casa inteira com seu texto e presença.",
      image: "assets/venues/pedestal.png", vibeHint: "Fechar forte e manter narrativa contínua são obrigatórios.",
      typeAffinity: { default: 0.2, besteirol: 0.2, vulgar: 0, "humor negro": 0.3, limpo: 0.3, hack: 0.3 }
    },
    {
      id: "taping-especial", name: "Gravação de Especial", minMinutes: 20, difficulty: 0.62,
      requiresCareerStage: "headliner", requiresSpecialTapeBooked: true,
      isHeadlinerSoloPipeline: true, isSpecialTapeShow: true, headlinerSoloTier: "special", setLengthTarget: 35,
      crowd: "Público lotado, câmeras rodando e pressão máxima para entregar seu melhor texto.",
      intro: "Hoje é a gravação do seu especial. Cada minuto vai virar registro da sua carreira.",
      image: "assets/venues/teatro-municipal.png", vibeHint: "Consistência, ritmo e fechamento forte definem o legado do especial.",
      typeAffinity: { default: 0.25, besteirol: 0.2, vulgar: 0.1, "humor negro": 0.3, limpo: 0.3, hack: 0.2 }
    },
    {
      id: "show-solo", name: "Seu Próprio Show", minMinutes: 10, difficulty: 0.45, requiresLevel: "headliner",
      isHeadlinerSoloPipeline: true, headlinerSoloTier: "club",
      crowd: "Seus fãs que pagaram ingresso para te ver.",
      intro: "O teatro é seu. A plateia veio por você. Não decepcione.",
      image: "assets/venues/pedestal.png", vibeHint: "É hora de mostrar quem você é. Autenticidade máxima.",
      typeAffinity: { default: 0.15, besteirol: 0.3, vulgar: 0.2, "humor negro": 0.3, limpo: 0.3, hack: 0.2 }
    },
  
    // ─── Special recurring shows (unlocked via events) ───
    {
      id: "5a5", name: "5 a 5 - Copo Sujo", minMinutes: 3, difficulty: 0.15, isSpecialShow: true,
      crowd: "Plateia escassa, parte dela de opens como você. Ambiente de teste.",
      intro: "Domingo à tarde no Copo Sujo. Um palco tranquilo para testar material novo.",
      image: "assets/venues/copo-sujo-comedy.png", vibeHint: "Material conciso e punchlines claras. Ótimo para testar piadas novas.",
      typeAffinity: { default: 0, besteirol: 0.5, vulgar: 0.1, "humor negro": 0.2, limpo: 0.3, hack: 0.2 }
    },
    {
      id: "se-vira-nos-5", name: "Se Vira nos 5 - Black House Comedy", minMinutes: 5, difficulty: 0.28, isSpecialShow: true,
      location: "Sorocaba - SP", travelDays: 2,
      crowd: "Plateia próxima do palco, acostumada com a programação da casa e pronta para julgar cinco minutos sem gordura.",
      intro: "Você viaja até Sorocaba para o Se Vira nos 5 da Black House Comedy. São 5 minutos no palco da casa.",
      image: "assets/venues/black-house-comedy.png", vibeHint: "Cinco minutos diretos: venda bem sua persona, seja profissional e mande bem no palco.",
      typeAffinity: { default: 0.15, besteirol: 0.3, vulgar: 0.1, "humor negro": 0.25, limpo: 0.35, hack: 0.25 }
    },
    {
      id: "pague15", name: "Pague 15 Leve 10 - Copo Sujo", minMinutes: 5, difficulty: 0.35, isSpecialShow: true,
      crowd: "Plateia pagante que espera profissionalismo. O produtor cronometra.",
      intro: "Quinta-feira no Copo Sujo. Show de iniciantes com plateia pagante. O produtor é rígido com tempo.",
      image: "assets/venues/copo-sujo-comedy.png", vibeHint: "Tempo é sagrado aqui. Não estoure os 5 minutos ou vai ser cortado.",
      typeAffinity: { default: 0.1, besteirol: 0.3, vulgar: 0, "humor negro": 0.2, limpo: 0.4, hack: 0.3 }
    }
  ];
})(window);
