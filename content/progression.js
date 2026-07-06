(function registerProgressionContent(global) {
  const content = global.OpenMicRpgContent = global.OpenMicRpgContent || {};

  content.progression = {
    maxLevel: 10,
    classOrder: ["comicoClassico", "roteirista", "produtor", "atorComico", "influencer"],
    classPaths: {
      comicoClassico: {
        availableAfterRuns: 0,
        event1: { minDay: 15, maxDay: 30, durationDays: 3, requirements: { showsScheduledCount: 4, goodShowsCount: 2 } },
        event2: { minDay: 40, maxDay: 55, durationDays: 7, requirements: { showsScheduledCount: 8, goodShowsCount: 5, consecutiveGoodShows: 2 } },
        employmentRequirements: { texto: 42, entrega: 42 },
        endingRequirements: { goodShowsCount: 6, network: 35 }
      },
      roteirista: {
        availableAfterRuns: 0,
        event1: { minDay: 15, maxDay: 30, durationDays: 3, requirements: { texto: 22, writeCount: 6, rewriteCount: 1 } },
        event2: { minDay: 40, maxDay: 55, durationDays: 10, requirements: { texto: 42, writeCount: 10, rewriteCount: 3 } },
        employmentRequirements: { texto: 50 },
        endingRequirements: { texto: 50, rewriteCount: 4 }
      },
      produtor: {
        availableAfterRuns: 0,
        event1: { minDay: 15, maxDay: 30, durationDays: 3, requirements: { network: 18, showsScheduledCount: 4 } },
        event2: { minDay: 40, maxDay: 55, durationDays: 14, requirements: { network: 38, showsScheduledCount: 9 } },
        employmentRequirements: { network: 42 },
        endingRequirements: { network: 50, showsScheduledCount: 10 }
      },
      atorComico: {
        availableAfterRuns: 2,
        event1: { minDay: 15, maxDay: 30, durationDays: 3, requirements: { entrega: 12, bigRoomShowsCount: 1 } },
        event2: { minDay: 40, maxDay: 55, durationDays: 10, requirements: { entrega: 28, bigRoomShowsCount: 3 } },
        employmentRequirements: { entrega: 50 },
        endingRequirements: { entrega: 35, bigRoomShowsCount: 4 }
      },
      influencer: {
        availableAfterRuns: 2,
        event1: { minDay: 15, maxDay: 30, durationDays: 3, requirements: { fans: 40, contentCount: 2 } },
        event2: { minDay: 40, maxDay: 55, durationDays: 7, requirements: { fans: 180, contentCount: 5 } },
        employmentRequirements: { fans: 140 },
        endingRequirements: { fans: 250, contentCount: 6 }
      }
    },
    endingRules: {
      classMinDay: 65,
      default: { minDay: 90, requirements: { showsPerformedCount: 8, goodShowsCount: 3, averageNota: 3 } },
      almost: { minDay: 95, showsPerformedCount: 5, averageNota: 2.4 },
      failureDay: 100,
      tierThresholds: { glorioso: 75, honesto: 50 },
      pure: {
        dominantShare: 0.65,
        maxSecondToneShare: 0.20,
        complementaryVariety: 3
      }
    },
    legacyUnlocks: {
      onelinerRuns: 1,
      hackRuns: 2,
      expandedClassRuns: 2
    },
    politico: {
      levelUnlock: 8,
      carvalhoMinDay: 25,
      categoryAffinity: {
        theater: 0.6,
        "digital-urban": 0.4,
        "young-chaotic": 0.3,
        "mixed-room": 0.1,
        family: -0.5,
        corporate: -0.6
      },
      venueOverrides: {
        "bar-universitario": 0.7,
        "podcast-live": 0.6,
        "teatro-alternativo": 0.7,
        sindicato: 0.6,
        "shopping-familia": -0.7,
        casamento: -0.7,
        corporativo: -0.8
      }
    }
  };
})(window);
(function registerExistingProgressionContent(global) {
  const content = global.OpenMicRpgContent = global.OpenMicRpgContent || {};
  content.progression.perkTrees = {
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
  content.progression.classes = {
    comicoClassico: {
      name: "Cômico Clássico",
      desc: "Palco, texto autoral e consistência de show.",
      bonus: { texto: 6, entrega: 6 },
      passive: "stageConsistency",
      empReq: { texto: 42, entrega: 42 },
      opportunityTitle: "convite para lineups mais fortes do circuito"
    },
    roteirista: {
      name: "Roteirista",
      desc: "Escrita forte, lapidação e material para outros formatos.",
      bonus: { texto: 10 },
      passive: "betterRewrite",
      empReq: { texto: 50 },
      opportunityTitle: "primeiro trabalho escrevendo material profissional"
    },
    produtor: {
      name: "Produtor",
      desc: "Bastidor, agenda, networking e curadoria.",
      bonus: { network: 12 },
      passive: "betterShowOffers",
      empReq: { network: 42 },
      opportunityTitle: "convite para ajudar a produzir uma noite de comédia"
    },
    atorComico: {
      name: "Ator Cômico",
      desc: "Presença, personagem, corpo e performance.",
      bonus: { entrega: 10 },
      passive: "bigRoomDelivery",
      empReq: { entrega: 50 },
      opportunityTitle: "convite para um projeto de atuação cômica"
    },
    influencer: {
      name: "Influencer",
      desc: "Conteúdo, clipes, público e presença digital.",
      bonus: { fans: 25 },
      passive: "contentBoost",
      empReq: { fans: 140 },
      opportunityTitle: "primeira collab/campanha de conteúdo cômico"
    }
  };
})(window);
