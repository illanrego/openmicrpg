(function registerEndingContent(global) {
  const content = global.OpenMicRpgContent = global.OpenMicRpgContent || {};

  content.endings = {
    cliffhanger: "O convite chega sem cerimônia: as casas querem saber quando você vai apresentar um trabalho só seu.\n\nE como eu monto meu solo?",
    base: {
      comicoClassico: "Seu nome passa a circular como garantia de palco: alguém capaz de entrar numa noite difícil e sustentar material de verdade.",
      roteirista: "Seu texto começa a circular fora da sua própria boca: quadros, vídeos e projetos passam a pedir sua escrita.",
      produtor: "As casas percebem que você entende a noite inteira: escala, bastidor, público, horário e responsabilidade.",
      atorComico: "Sua presença abre portas além do microfone: personagem, cena, corpo e timing visual.",
      influencer: "Você constrói um público que não depende de estar por acaso na mesma sala.",
      default: "Sem um rótulo definitivo, você ainda assim se torna parte real do circuito.",
      almost: "Foi por pouco, tarde e sem qualquer elegância, mas alguma coisa finalmente começou a tomar forma.",
      failure: "O centésimo dia chega antes da carreira. Talvez na próxima."
    },
    tone: {
      besteirol: "Carvalho reconhece que sua leveza virou linguagem, não fuga.",
      vulgar: "Carvalho diz que o choque finalmente ganhou intenção e ritmo.",
      limpo: "Carvalho observa que você aprendeu a ser acessível sem ficar inofensivo.",
      "humor negro": "Carvalho avisa que caminhar no limite exige saber exatamente onde ele está.",
      hack: "Carvalho admite que até uma ideia familiar pode funcionar quando a execução é sua.",
      "político": "Carvalho diz que seu ponto de vista agora provoca antes mesmo do punchline.",
      hybrid: "Carvalho percebe que sua voz nasceu justamente da tensão entre dois caminhos.",
      camaleao: "Carvalho ainda não consegue prever que versão sua vai entrar no palco — e isso começou a parecer uma qualidade.",
      none: "Carvalho diz que a voz ainda está se formando, mas o trabalho já existe."
    },
    structure: {
      bit: "Seu repertório se organiza em blocos que desenvolvem uma ideia antes de abandoná-la.",
      oneliner: "A precisão vira assinatura: cada palavra precisa justificar o espaço que ocupa.",
      storytelling: "As histórias passam a sustentar tensão, personagem e payoff por vários minutos.",
      prop: "O palco ganha uma linguagem visual em que objetos também carregam punchlines.",
      crowdWork: "Sua leitura de sala transforma o público em parte ativa do material.",
      none: "A forma do seu material ainda muda de uma noite para outra."
    },
    pure: {
      tone: "Você não apenas repetiu um tom: construiu uma voz reconhecível sem depender de uma única forma.",
      structure: "Você dominou uma forma até ela virar linguagem, sem reduzir seu repertório a um único tom."
    },
    special: {
      "bastidor-sombrio": { title: "O Bastidor Sombrio", text: "Você aprende a conduzir a noite por trás da cortina: escala, tensão, risco e uma linguagem escura que o circuito passa a respeitar." },
      "profeta-do-caos": { title: "O Profeta do Caos", text: "Você transforma contradição política e humor negro em sátira de atrito. A sala ri, se incomoda e continua falando do set depois." },
      camaleao: { title: "O Camaleão", text: "Você nunca se fecha em uma única voz. Em vez disso, aprende a mudar de registro sem perder a leitura da sala." },
      herdeiro: { title: "O Herdeiro", text: "Depois de atravessar todos os cinco caminhos do circuito, você deixa de perseguir uma vaga e passa a carregar a história inteira dele." },
      silencio: { title: "O Silêncio", text: "O centésimo dia chega antes da carreira. O palco apaga, mas ainda existe uma próxima corrida." }
    },
    tier: {
      glorioso: "Você chega cedo, forte e com a sensação perigosa de que tudo estava destinado a acontecer.",
      honesto: "Não foi uma ascensão perfeita. Foi trabalho suficiente para que as portas parassem de fechar.",
      queimado: "A reputação tem rachaduras, mas ainda existe uma carreira onde antes havia apenas expectativa."
    },
    artwork: {
      fallback: {
        id: "fallback",
        path: "assets/scenes/endings/fallback.png",
        alt: "Palco vazio de um clube de comédia entre apresentações, com microfone, caderno e luz do amanhecer."
      },
      class: {
        comicoClassico: { id: "class:comicoClassico", path: "assets/scenes/endings/class/comicoClassico.png", alt: "Clube de comédia lotado aplaudindo uma silhueta sob um holofote dourado." },
        roteirista: { id: "class:roteirista", path: "assets/scenes/endings/class/roteirista.png", alt: "Mesa de roteirista cheia de páginas, canetas e rascunhos diante de um palco iluminado." },
        produtor: { id: "class:produtor", path: "assets/scenes/endings/class/produtor.png", alt: "Bastidor organizado com agenda, equipamentos e o palco de comédia brilhando ao fundo." },
        atorComico: { id: "class:atorComico", path: "assets/scenes/endings/class/atorComico.png", alt: "Camarim teatral com espelho iluminado, adereços e palco pronto para a comédia." },
        influencer: { id: "class:influencer", path: "assets/scenes/endings/class/influencer.png", alt: "Tripé com celular e ring light registrando um clube cheio e vibrante." }
      },
      pureTone: {
        besteirol: { id: "pure-tone:besteirol", path: "assets/scenes/endings/pure-tone/besteirol.png", alt: "Palco de comédia tomado por objetos absurdos e uma plateia em gargalhada." },
        vulgar: { id: "pure-tone:vulgar", path: "assets/scenes/endings/pure-tone/vulgar.png", alt: "Clube de madrugada em luz magenta, com plateia rindo em uma noite irreverente." },
        limpo: { id: "pure-tone:limpo", path: "assets/scenes/endings/pure-tone/limpo.png", alt: "Teatro de comédia claro e acolhedor, com público de todas as idades sorrindo." },
        "humor negro": { id: "pure-tone:humor-negro", path: "assets/scenes/endings/pure-tone/humor-negro.png", alt: "Cabaret sombrio e elegante, com palco vazio, rosas pretas e público de sorrisos cúmplices." },
        hack: { id: "pure-tone:hack", path: "assets/scenes/endings/pure-tone/hack.png", alt: "Objetos do cotidiano transformados em adereços de comédia sob um microfone iluminado." },
        "político": { id: "pure-tone:político", path: "assets/scenes/endings/pure-tone/politico.png", alt: "Teatro urbano de sátira cívica, com palco, cidade noturna e plateia atenta." }
      },
      pureStructure: {
        bit: { id: "pure-structure:bit", path: "assets/scenes/endings/pure-structure/bit.png", alt: "Palco de comédia com microfone, caderno e blocos de ideias conectados sob um holofote quente." },
        oneliner: { id: "pure-structure:oneliner", path: "assets/scenes/endings/pure-structure/oneliner.png", alt: "Palco minimalista com microfone em luz precisa e cartões de punchline espalhados como pequenas lâminas." },
        storytelling: { id: "pure-structure:storytelling", path: "assets/scenes/endings/pure-structure/storytelling.png", alt: "Clube acolhedor onde páginas de caderno formam uma trilha narrativa até o microfone." },
        prop: { id: "pure-structure:prop", path: "assets/scenes/endings/pure-structure/prop.png", alt: "Palco de comédia cercado por objetos cênicos prontos para carregar punchlines visuais." },
        crowdWork: { id: "pure-structure:crowdWork", path: "assets/scenes/endings/pure-structure/crowdWork.png", alt: "Microfone apontado para uma plateia viva, com feixes de luz ligando palco e público." }
      },
      special: {
        "bastidor-sombrio": { id: "special:bastidor-sombrio", path: "assets/scenes/endings/special/bastidor-sombrio.png", alt: "Central de controle escondida nos bastidores de um clube de comédia, iluminada por um palco dourado." },
        "profeta-do-caos": { id: "special:profeta-do-caos", path: "assets/scenes/endings/special/profeta-do-caos.png", alt: "Palco de sátira sob tempestade, com cidade torta, relâmpagos e plateia reagindo." },
        camaleao: { id: "special:camaleao", path: "assets/scenes/endings/special/camaleao.png", alt: "Microfone cercado por espelhos, adereços e holofotes de várias cores em um palco mutável." },
        herdeiro: { id: "special:herdeiro", path: "assets/scenes/endings/special/herdeiro.png", alt: "Arquivo mítico de comédia com cinco relíquias de carreira ao redor de um sexto pedestal vazio." },
        silencio: { id: "special:silencio", path: "assets/scenes/endings/special/silencio.png", alt: "Clube de comédia vazio após o fechamento, com microfone solitário, cadeiras empilhadas e chuva noturna." }
      }
    },
    enabledSpecials: ["bastidor-sombrio", "profeta-do-caos", "camaleao", "herdeiro", "silencio"]
  };
})(window);
