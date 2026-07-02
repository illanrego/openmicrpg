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
    tier: {
      glorioso: "Você chega cedo, forte e com a sensação perigosa de que tudo estava destinado a acontecer.",
      honesto: "Não foi uma ascensão perfeita. Foi trabalho suficiente para que as portas parassem de fechar.",
      queimado: "A reputação tem rachaduras, mas ainda existe uma carreira onde antes havia apenas expectativa."
    },
    enabledSpecials: []
  };
})(window);
