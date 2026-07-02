# Open Mic RPG — Panoramic Reference

> Full data dump of all game systems. Line references point to `script.js`.

> V2 implemented: schema-V3 runs, hidden deterministic class events, automatic class assignment, crowd work, `político`, baseline ending resolution, archive finalization, and option-only legacy unlocks. Special routes such as Eclético remain deferred.

---

## 1. TONES (5 implemented, 1 planned)

| # | Tone | Description | Long Description | Unlock |
|---|------|------------|------------------|--------|
| 1 | `besteirol` | Besteiras descompromissadas | Humor bobo e descompromissado. Funciona bem com plateias relaxadas. | Day 1 |
| 2 | `vulgar` | Piadas pesadas sem filtro | Piadas pesadas, linguagem explícita. Pode dividir a sala. | Day 1 |
| 3 | `limpo` | Humor família e bobinho | Humor família, sem palavrões. Ideal para corporativos. | Day 1 |
| 4 | `humor negro` | Piadas azedas que dividem a sala | Piadas sobre temas tabu. Brilhante ou desastroso. | First nota-1 bomb at level 5+, or dominant in a past run |
| 5 | `hack` | Observações batidas porém eficientes | Observações batidas mas eficientes. Todo mundo já ouviu. | Level 5+, two completed runs, or dominant in a past run |
| 6 | `político` | Poder, sociedade e contradição | Political and social material. | Level 8+ or Carvalho event |

---

## 2. STRUCTURES (4 implemented, 1 planned)

| # | Structure | Minutes | Description | Unlock |
|---|-----------|---------|-------------|--------|
| 1 | `bit` | 2-3 min | Sequência de piadas conectadas sobre um mesmo tema. | Day 1 |
| 2 | `oneliner` | 1 min | Piada curta e direta. | First study action, or one completed run |
| 3 | `storytelling` | 3-5 min | Narrativa com vários punchs. | Rossini Luz event, Level 6+, or Roteirista victory |
| 4 | `prop` | 1 min | Usa objetos visuais para complementar a piada. | Level 10+, or Ator Cômico victory |
| 5 | `crowd work` | 1-3 min | Pseudo-structure allocated during show preparation. | Always available in show preparation |

---

## 3. WRITING MODES (2)

| # | Mode | Motivation Cost | Texto Bonus | Fail Chance |
|---|------|----------------|-------------|-------------|
| 1 | `desk` — Sentar e escrever | -15 | +0.10 | 10% |
| 2 | `day` — Anotar durante o dia | 0 | 0 | 25% |

---

## 4. JOKE CREATION FORMULA (§20, L4174-4241)

```
basePotential = random(0.35, 0.85)
adjustedPotential = basePotential + (texto/250) + ((motivation-60)/400) + modeBonus + flowBonus + perkBonus
finalPotential = clamp(adjustedPotential, 0.2, 0.98)
```

Joke properties: `id, title, tone, structure, minutes, truePotential, history (last 7 results), lastResult, freshness`

---

## 5. SCORING ENGINE (§10, protected)

### Per-Joke Formula

```
potency  = joke.truePotential × 0.6        (60% weight)
type     = typeAffinity[venue][tone] × 0.2  (20% weight)
chaos    = single roll per gig: ±luckBase × (1 - entrega/500)
diff     = show.difficulty × max(0.2, 1 - entrega/500)
delivery = min(entrega/500, 0.4) + perk bonuses
flow     = +0.08 if flow state active
perks    = hecklerDefense + bigCrowdBonus + longSetBonus + staminaBonus + crowdWorkBonus
classBigRoomBonus = +0.04 if Ator Cômico and show ≥ 7 min or elenco circuit

score = potency + type + chaos - diff + delivery + flow + perks + classBigRoomBonus
```

### Stage Time Adjustment

| Ratio (actual / expected) | BaseScore ≥ 0.35 | BaseScore < 0.35 |
|--------------------------|-------------------|-------------------|
| < 0.5  | -0.15 | -0.35 |
| < 0.7  | -0.05 | -0.25 |
| < 0.9  | +0.02 | -0.12 |
| > 2.0  | -0.10 | -0.40 |
| > 1.5  | +0.05 | -0.25 |
| > 1.2  | +0.12 | -0.15 |

### Score → Nota Scale

| Nota | Threshold | Emoji | Label |
|------|-----------|-------|-------|
| 5 | ≥ 0.45 | 🤯 | Explodiu |
| 4 | ≥ 0.32 | 🔥 | Matou |
| 3 | ≥ 0.18 | 🙂 | Segurou |
| 2 | ≥ 0.05 | 😶 | Risinhos |
| 1 | -∞ | 💧 | Deu água |

---

## 6. HECKLER SYSTEM

- **15% chance** every show
- Affects half of jokes (at least 1)
- Player choice: Ignore (-0.12 to affected jokes) or Respond
- Response outcome depends on: `entrega/55 + random(0, 0.55) + crowdWorkBonus×1.8 + hecklerDefense×1.4`

| Response Power | Result | Score Delta |
|---------------|--------|-------------|
| ≥ 0.95 | Dominate (+0.10) | +0.10 |
| ≥ 0.55 | Hold (+0.02) | +0.02 |
| < 0.55 | Fail | -0.16 |

---

## 7. SHOW REWARDS (per performance)

| Result | Fans | Motivation | Network | Entrega |
|--------|------|------------|---------|---------|
| Nota 5 | `totalMinutes × 4 × 0.8` | +12 | +2 | +2 |
| Nota 4 | `totalMinutes × 3 × 0.8` | +12 | +2 | +2 |
| Nota 3 | `totalMinutes × 2 × 0.8` | +2 | 0 | +1 |
| Nota 2 | `totalMinutes × 1 × 0.8` | -5 | 0 | +1 |
| Nota 1 | `totalMinutes × 0 × 0.8` = 0 | -12 | 0 | +1 |

Formula: `fanGain = totalMinutes × (nota - 1) × 0.8`

- **Cômico Clássico passive**: if nota ≥ 3 → +1 texto
- **Flow state**: ×2 stage time gain
- **Network**: +2 per nota ≥ 4 show

---

## 8. XP & LEVEL SYSTEM (V2 cap: 10)

### Level Curve

| Level | XP Required | Career Stage |
|-------|------------|--------------|
| 1 | 0 | Open |
| 2 | 150 | Open |
| 3 | 330 | Open |
| 4 | 540 | Open |
| 5 | 800 | Open |
| 6 | 1.120 | **Elenco** |
| 7 | 1.500 | Elenco |
| 8 | 1.950 | Elenco |
| 9 | 2.470 | Elenco |
| 10 | 3.050 | Elenco |

### Show XP by Category

| Category | Consolidated Set (`consolidated`) | New Material (`newMaterial`) |
|----------|-----------------------------------|------------------------------|
| Open | 40 XP | 48 XP |
| 5a5 | 50 XP | 60 XP |
| Pague 15 | 60 XP | 72 XP |
| Elenco Circuit | 68 XP | 82 XP |
| Headliner | 84 XP | 100 XP |
| Special Tape | 120 XP | 120 XP |

- **Consolidated**: all jokes tested ≥ 3 times
- **New Material**: at least 1 joke tested < 3 times
- **Rule**: if the set contains at least 1 joke tested less than 3 times, use `newMaterial` value

### Non-Show XP

| Action | XP |
|--------|----|
| New joke written | 12 |
| Joke rewritten | 6 |
| Study | 15 |
| Create content | 10 |

---

## 9. CLASSES (5)

| # | Class | Stat Bonus | Passive | Employment Req | Ending Req |
|---|-------|-----------|---------|---------------|------------|
| 1 | **Cômico Clássico** | texto +6, entrega +6 | `stageConsistency` | texto 42, entrega 42 | 6 good shows, network 35 |
| 2 | **Roteirista** | texto +10 | `betterRewrite` | texto 50 | texto 50, 4 rewrites |
| 3 | **Produtor** | network +12 | `betterShowOffers` | network 42 | network 50, 10 scheduled |
| 4 | **Ator Cômico** | entrega +10 | `bigRoomDelivery` | entrega 50 | entrega 35, 4 big rooms |
| 5 | **Influencer** | fans +25 | `contentBoost` | fans 140 | fans 250, 6 content actions |

### Provisional Class Ending Text

All ending copy is sourced from `content/endings.js`.

1. **Cômico Clássico**: "Você vira um nome confiável: alguém que pode entrar numa noite difícil e entregar 15 minutos de verdade."
2. **Roteirista**: "Seu texto começa a circular fora da sua própria boca: quadros, vídeos, projetos e ideias que precisam de escrita cômica."
3. **Produtor**: "Você entende que carreira não é só palco: é escala, bastidor, curadoria, horário, público e responsabilidade."
4. **Ator Cômico**: "Sua presença começa a abrir portas além do microfone: personagem, cena, corpo e timing visual."
5. **Influencer**: "Você percebe que público também é construção: clipe, recorrência, linguagem e gente esperando o próximo post."

---

## 10. PERKS (12 across 2 trees)

### Texto Tree (5)

| # | Perk | Level Req | Requires | Effect |
|---|------|----------|----------|--------|
| 1 | **Premissa Sólida** | 2 | — | +0.05 joke potential |
| 2 | **Economia de Palavras** | 3 | Premissa Sólida | +15% joke efficiency (0.15) |
| 3 | **Tag Machine** | 5 | Economia de Palavras | +0.10 rewrite bonus |
| 4 | **Callback Master** ⚠️ "hacky" | 7 | — | +0.10 on sets ≥ 3 jokes |
| 5 | **Setup Killer** | 9 | Tag Machine | +0.08 setup bonus |

### Entrega Tree (7)

| # | Perk | Level Req | Requires | Effect |
|---|------|----------|----------|--------|
| 1 | **Timing Básico** | 2 | — | +0.05 delivery bonus |
| 2 | **Timing Avançado** | 5 | Timing Básico | +0.10 delivery bonus |
| 3 | **Presença de Palco** | 4 | — | +0.15 on shows ≥ 6 min |
| 4 | **Crowd Work Iniciante** | 3 | — | +0.05 crowd work |
| 5 | **Crowd Work Pro** | 8 | Crowd Work Iniciante | +0.12 crowd work |
| 6 | **Lidar com Heckler** | 6 | — | +0.10 heckler defense |
| 7 | **Energia Alta** | 10 | Timing Avançado | +0.08 stamina on sets ≥ 4 jokes |

**Perk Points**: 1 per level-up, spent immediately via dialog.

---

## 11. FLOW STATE

- **Trigger**: 3 consecutive nota 4+ shows, with texto ≥ 30 AND entrega ≥ 30
- **Duration**: starts at 12 days
- **Decay**: each day, `endChance += 0.066` (starts at 0.2), rolls against it
- **Ends when**: endChance rolls true, or daysRemaining reaches 0
- **Bonuses**:
  - +0.10 joke potential during writing
  - +0.08 show score during performance
  - ×2 stage time gain
- **On end**: consecutiveGoodShows resets to 0

---

## 12. TIME SYSTEM

- **Activity points per day**: 1 default, 2 when employed. Legacy does not increase AP.
- **Motivation recovery**: +5 per day (capped at 120)
- **Actions costing 1 AP**: study, desk write, day write, create content, perform scheduled show
- **Weekly event cap**: max 2 random events per week
- **Random event chance**: 10% per day (after first show)
- **Days of week**: Segunda → Sábado → Domingo

### V2 Cross-Run Archive

- Stored separately from the active save under `openMicRPG.legacyArchive.v1`.
- Starting a new game removes `openMicRPG.save.v2` but preserves this archive.
- Implemented option unlocks: oneliner after one run, hack and expanded class paths after two, storytelling after a Roteirista victory, prop after an Ator Cômico victory, and previously dominant supported tones.
- Finalization appends one archive entry per `runId`.

---

## 13. REMOVED LEGACY ENDGAME

The old Headliner legacy choice, special tape, Made It, and headliner-set systems are removed from the V2 runtime. Their venue data remains archived for possible expansion use.

---

## 14. SHOW POOL — COMPLETE VENUE LIST (42 venues)

### Open Mic Starters (7)

| # | Venue | ID | Min | Difficulty | Audience | Risk | Career Stage |
|---|-------|----|----|-----------|----------|------|-------------|
| 1 | Microfone Aberto da Padaria | `microfone-aberto-padaria` | 3 (.12) | Low | Family | Low | open |
| 2 | Quinta do Calouro | `quinta-do-calouro` | 3 (.16) | Low | Young-Chaotic | Low | open |
| 3 | Rodada do Pós-Trampo | `rodada-trabalho` | 4 (.20) | Low | Family | Low | open |
| 4 | Sarjeta Comedy 23h | `sarjeta-comedy` | 3 (.24) | Low | Young-Chaotic | Low | open |
| 5 | Teste de Domingo na Praça | `teste-domingo-praca` | 4 (.18) | Low | Family | Low | open |
| 6 | Sarau de Poesia e Riso | `sarau-poesia` | 3 (.18) | Low | Theater | Low | open |
| 7 | Bar Universitário | `bar-universitario` | 4 (.18) | Low | Young-Chaotic | Low | open |

### General Venues (21)

| # | Venue | ID | Min | Difficulty | Audience | Risk | Career Stage |
|---|-------|----|----|-----------|----------|------|-------------|
| 8 | Bar do Tony | `bar-do-tony` | 5 | .25 | Mixed-Room | Low | open+ |
| 9 | Boteco da Esquina | `boteco-esquina` | 4 | .20 | Young-Chaotic | Low | open+ |
| 10 | Barbearia Comedy Night | `barbearia` | 4 | .25 | Digital-Urban | Low | open+ |
| 11 | Linha Azul After-Work | `metro-linha-azul` | 3 | .27 | Digital-Urban | Medium | open+ |
| 12 | Backpacker Comedy | `hostel-mochileiro` | 4 | .20 | Mixed-Room | Low | open+ |
| 13 | Pub O'Laughs | `pub-irlandes` | 5 | .28 | Digital-Urban | Medium | open+ |
| 14 | Arraiá do Riso | `festa-junina` | 4 | .20 | Family | Low | open+ |
| 15 | República | `republica` | 4 | .15 | Young-Chaotic | Low | open+ |
| 16 | Noite Feminina | `noite-feminina` | 5 | .28 | Theater | Medium | open+ |
| 17 | Cervejaria & Comédia | `cervejaria-artesanal` | 5 | .24 | Digital-Urban | Low | open+ |
| 18 | Stand-Up Solidário | `show-beneficente` | 5 | .30 | Family | Medium | open+ |
| 19 | Rainbow Comedy | `show-lgbtq` | 5 | .28 | Mixed-Room | Medium | open+ |
| 20 | Sushi & Stand-Up | `restaurante-japones` | 5 | .32 | Theater | Medium | open+ |
| 21 | Ladies' Night Comedy | `stand-up-feminino` | 5 | .26 | Mixed-Room | Low | open+ |
| 22 | Comedy & Carne | `churrascaria` | 4 | .22 | Family | Low | open+ |
| 23 | Shopping Família | `shopping-familia` | 5 | .22 | Family | Low | open+ |
| 24 | Riso & Viola | `stand-up-sertanejo` | 5 | .25 | Family | Low | open+ |
| 25 | Livraria & Riso | `livraria-cultural` | 5 | .30 | Theater | Medium | open+ |
| 26 | Bem Bolado | `bem-bolado` | 5 | .30 | Young-Chaotic | Medium | open+ |
| 27 | Comedy no Parque | `parque-ao-ar-livre` | 5 | .35 | Family | Medium | open+ |
| 28 | Festival de Praia | `festival-praia` | 6 | .35 | Young-Chaotic | Medium | open+ |

### Intermediate / Gated (6)

| # | Venue | ID | Min | Difficulty | Audience | Risk | Gate |
|---|-------|----|----|-----------|----------|------|------|
| 29 | After Hours Subúrbio | `after-hours` | 5 | .40 | Theater | Medium | Lvl 3+ |
| 30 | Casa de Swing | `casa-de-swing` | 5 | .42 | Mixed-Room | High | Lvl 3+ |
| 31 | Coffee Break Corporativo | `corporativo` | 6 | .40 | Corporate | Medium | Lvl 3+ |
| 32 | Coffee Break Emergencial | `corporativo-surpresa` | 6 | .55 | Corporate | High | Lvl 3+ |
| 33 | Teatro do Porão | `teatro-alternativo` | 6 | .38 | Theater | Medium | Lvl 3+ |
| 34 | Casamento | `casamento` | 6 | .45 | Family | Medium | Lvl 5+ |

### High Tier Venues (4)

| # | Venue | ID | Min | Difficulty | Audience | Risk | Gate |
|---|-------|----|----|-----------|----------|------|------|
| 35 | Turnê do Veterano | `veterano-turne` | 7 | .45 | Theater | High | Stevan Gaipo event |
| 36 | Teatro Municipal | `teatro-limpo` | 7 | .50 | Theater | High | Lvl 6+ |
| 37 | Rooftop Tech Meetup | `rooftop-tech` | 5 | .32 | Digital-Urban | Medium | Lvl 3+ |
| 38 | Podcast Ao Vivo | `podcast-live` | 4 | .30 | Digital-Urban | Medium | Lvl 3+ |
| 39 | Show do Sindicato | `sindicato` | 6 | .35 | Corporate | Medium | Lvl 3+ |

### Elenco Circuits (3)

| # | Venue | ID | Min | Target | Difficulty | Audience | Risk |
|---|-------|----|----|--------|-----------|----------|------|
| 40 | Porão da Segunda | `elenco-porao-segunda` | 8 | 15 | .42 | Theater | High |
| 41 | Quarta de Casa Cheia | `elenco-comedy-quarta` | 8 | 15 | .45 | Theater | High |
| 42 | Coletivo de Domingo | `elenco-coletivo-domingo` | 7 | 15 | .38 | Theater | Medium |

### Headliner Solos (3)

| # | Venue | ID | Min | Target | Difficulty | Audience | Special Gate |
|---|-------|----|----|--------|-----------|----------|-------------|
| 43 | Solo Lab Preview | `solo-lab-preview` | 12 | 25 | .50 | Theater | Headliner, no gate |
| 44 | Noite Principal | `solo-noite-principal` | 15 | 30 | .58 | Theater | Network 90, Fans 2500 |
| 45 | Seu Próprio Show | `show-solo` | 10 | 15 | .45 | Mixed-Room | Headliner |
| 46 | Gravação de Especial | `taping-especial` | 20 | 35 | .62 | Theater | Special Tape booked |

### Special Recurring Shows (2)

| # | Venue | ID | Min | Difficulty | Audience | Risk | Unlock |
|---|-------|----|----|-----------|----------|------|--------|
| 47 | 5 a 5 — Copo Sujo | `5a5` | 3 | .15 | Mixed-Room | Low | 5 jokes event |
| 48 | Pague 15 Leve 10 | `pague15` | 5 | .35 | Mixed-Room | Medium | 3× 5a5 at nota 4+ |

---

## 15. TONE AFFINITY MATRIX (all venues vs all tones)

Affinity values are added at 20% weight to the joke score: `typeAffinity[tone] × 0.2`

| # | Venue ID | besteirol | vulgar | limpo | humor negro | hack | default |
|---|----------|-----------|--------|-------|-------------|------|---------|
| 1 | bar-do-tony | +0.3 | -0.2 | +0.6 | -0.2 | +0.4 | -0.1 |
| 2 | corporativo | -0.1 | **-0.8** | +0.7 | -0.5 | +0.6 | -0.2 |
| 3 | boteco-esquina | **+0.6** | +0.2 | -0.3 | +0.1 | 0 | -0.05 |
| 4 | festival-praia | +0.3 | +0.4 | +0.2 | -0.2 | +0.1 | -0.15 |
| 5 | shopping-familia | +0.2 | **-0.6** | +0.7 | -0.5 | +0.3 | 0 |
| 6 | after-hours | 0 | +0.2 | -0.4 | **+0.7** | -0.2 | -0.1 |
| 7 | casa-de-swing | +0.2 | **+0.7** | **-0.7** | +0.3 | +0.1 | -0.05 |
| 8 | bem-bolado | **+0.7** | +0.2 | 0 | +0.1 | +0.3 | +0.05 |
| 9 | teatro-limpo | -0.2 | **-0.5** | +0.6 | +0.2 | +0.3 | -0.05 |
| 10 | podcast-live | +0.1 | -0.1 | +0.1 | +0.2 | **+0.5** | +0.1 |
| 11 | barbearia | +0.2 | -0.2 | +0.3 | -0.1 | +0.4 | 0 |
| 12 | sarau-poesia | -0.2 | -0.4 | +0.4 | +0.2 | +0.1 | +0.05 |
| 13 | rooftop-tech | -0.1 | **-0.5** | +0.3 | +0.2 | **+0.6** | 0 |
| 14 | metro-linha-azul | +0.3 | -0.3 | +0.2 | 0 | **+0.5** | -0.1 |
| 15 | noite-feminina | -0.1 | -0.4 | +0.4 | +0.2 | +0.2 | +0.1 |
| 16 | veterano-turne | 0 | -0.3 | +0.4 | +0.3 | **+0.5** | -0.1 |
| 17 | corporativo-surpresa | -0.1 | **-0.7** | +0.6 | -0.3 | **+0.7** | -0.2 |
| 18 | bar-universitario | **+0.7** | **+0.5** | -0.2 | +0.2 | +0.2 | 0 |
| 19 | livraria-cultural | -0.2 | **-0.5** | +0.5 | +0.4 | +0.3 | 0 |
| 20 | pub-irlandes | +0.4 | +0.1 | +0.3 | +0.2 | +0.4 | +0.1 |
| 21 | churrascaria | +0.3 | -0.4 | +0.6 | -0.3 | +0.4 | -0.1 |
| 22 | teatro-alternativo | +0.1 | +0.3 | -0.3 | **+0.6** | -0.2 | +0.1 |
| 23 | stand-up-sertanejo | +0.4 | +0.2 | **+0.5** | -0.2 | +0.3 | 0 |
| 24 | hostel-mochileiro | **+0.5** | +0.2 | +0.3 | +0.1 | +0.3 | +0.1 |
| 25 | casamento | +0.2 | **-0.6** | **+0.7** | -0.4 | +0.4 | -0.1 |
| 26 | show-beneficente | +0.2 | **-0.5** | +0.6 | -0.2 | +0.3 | +0.1 |
| 27 | cervejaria-artesanal | +0.3 | +0.1 | +0.2 | +0.3 | **+0.5** | +0.1 |
| 28 | sindicato | +0.2 | +0.1 | +0.3 | +0.3 | **+0.5** | 0 |
| 29 | festa-junina | **+0.5** | -0.3 | +0.6 | -0.2 | +0.3 | +0.1 |
| 30 | show-lgbtq | +0.3 | +0.4 | +0.1 | +0.3 | +0.2 | +0.15 |
| 31 | republica | **+0.6** | **+0.6** | -0.2 | +0.3 | +0.2 | +0.1 |
| 32 | restaurante-japones | -0.1 | **-0.5** | **+0.5** | +0.2 | +0.4 | 0 |
| 33 | stand-up-feminino | +0.3 | +0.2 | +0.4 | +0.2 | +0.3 | +0.1 |
| 34 | parque-ao-ar-livre | +0.3 | **-0.6** | +0.6 | -0.4 | +0.3 | -0.1 |
| 35 | microfone-aberto-padaria | **+0.5** | -0.2 | **+0.6** | 0 | +0.2 | +0.1 |
| 36 | quinta-do-calouro | **+0.6** | +0.2 | +0.2 | +0.1 | +0.2 | +0.1 |
| 37 | rodada-trabalho | +0.3 | -0.3 | **+0.5** | +0.1 | +0.4 | +0.05 |
| 38 | sarjeta-comedy | +0.4 | +0.4 | **-0.4** | +0.4 | +0.2 | -0.05 |
| 39 | teste-domingo-praca | +0.4 | -0.4 | **+0.6** | -0.1 | +0.3 | +0.1 |
| 40 | navio-cruzeiro | +0.3 | -0.3 | **+0.5** | -0.1 | **+0.5** | +0.05 |
| 41 | programa-tv | +0.2 | **-0.6** | **+0.6** | -0.3 | **+0.5** | 0 |
| 42 | elenco-porao-segunda | +0.1 | -0.2 | +0.4 | +0.3 | +0.4 | +0.1 |
| 43 | elenco-comedy-quarta | +0.2 | -0.3 | +0.4 | +0.3 | +0.4 | +0.05 |
| 44 | elenco-coletivo-domingo | +0.1 | -0.2 | +0.3 | +0.4 | +0.4 | +0.1 |
| 45 | solo-lab-preview | +0.1 | -0.2 | +0.3 | +0.4 | +0.4 | +0.15 |
| 46 | solo-noite-principal | +0.2 | 0 | +0.3 | +0.3 | +0.3 | +0.2 |
| 47 | taping-especial | +0.2 | +0.1 | +0.3 | +0.3 | +0.2 | +0.25 |
| 48 | show-solo | +0.3 | +0.2 | +0.3 | +0.3 | +0.2 | +0.15 |
| 49 | 5a5 | **+0.5** | +0.1 | +0.3 | +0.2 | +0.2 | 0 |
| 50 | pague15 | +0.3 | 0 | +0.4 | +0.2 | +0.3 | +0.1 |

> **Best venues per tone**: besteirol → Bar Universitário (+0.7), Bem Bolado (+0.7); vulgar → Casa de Swing (+0.7), República (+0.6); limpo → Shopping (+0.7), Corporativo (+0.7), Casamento (+0.7); humor negro → After Hours (+0.7), Teatro do Porão (+0.6); hack → Corporativo Surpresa (+0.7), Rooftop Tech (+0.6)

---

## 16. AUDIENCE TYPES (inferred from affinity)

| Type | Key Signal | Example Venues |
|------|-----------|----------------|
| **corporate** | limpo ≥ +0.55, vulgar ≤ -0.60 | corporativo, corporativo-surpresa, sindicato |
| **family** | limpo ≥ +0.55, vulgar ≤ -0.25, humor negro ≤ -0.15 | shopping-familia, casamento, churrascaria, parque |
| **digital-urban** | hack ≥ +0.45, limpo ≥ +0.10 | podcast-live, rooftop-tech, metro-linha-azul |
| **young-chaotic** | besteirol ≥ +0.45, vulgar ≥ +0.20 | bar-universitario, republica, bem-bolado |
| **theater** | humor negro ≥ +0.25, limpo ≥ +0.25, vulgar ≤ +0.20 | teatro-limpo, teatro-alternativo, livraria |
| **mixed-room** | none of the above match | bar-do-tony, hostel-mochileiro, show-lgbtq |

---

## 17. EVENT POOL (28 events)

### Character Events (NPC interactions)

| # | Event ID | NPC | Trigger | Effect Summary |
|---|----------|-----|---------|---------------|
| 1 | `veterano` | Stevan Gaipo | showKill | Schedule "Turnê do Veterano" or -5 fans +6 motivation |
| 2 | `cincoPiadas` | Paulo Araújo | jokes5 | Unlock "5 a 5" show +8 motivation, or delay |
| 3 | `pauloAraujoPague15` | Paulo Araújo | pague15Invite | Unlock "Pague 15" show +10 motivation, or delay |
| 4 | `stevanEstrada` | Stevan Gaipo | random | +8 texto, or +12 network |
| 5 | `gabrielAndradeDicas` | Gabriel Andrade | random | +12 texto (oneliners) or +8 texto +8 motivation (prop), or +8 network |
| 6 | `bombMentor` | Carvalho | showBomb (Copo Sujo) | +10 texto, +4 motivation |
| 7 | `mentorOferece` | Veteran comic | random | +20 texto -10 motivation, or +5 motivation |
| 8 | `rossiniLuzWorkshop` | Rossini Luz | levelUp3 | Unlock STORYTELLING +15 texto, or +5 texto |
| 9 | `douglasFerreiraReading` | Douglas Ferreira | random | +8 entrega, or +6 entrega +4 texto, or +5 motivation |
| 10 | `brunoBergProducao` | Bruno Berg | random (elenco+) | +12 network, or +8 network +5 fans, or +6 motivation |
| 11 | `diegoFerreiraColetivo` | Diego Ferreira | random | +15 network +10 motivation, or +5 motivation |
| 12 | `hackWarning` | Carvalho | random | +5 texto +6 motivation +2 entrega |

### Story / Generic Events

| # | Event ID | Trigger | Gist |
|---|----------|---------|------|
| 13 | `corporativoConvite` | random | Emergency corporate gig or refer a friend (+6 texto +5 network) |
| 14 | `podcast` | fans20 | Podcast invite: go for viral (+20 fans) or talk process (+10 texto +5 network) |
| 15 | `clipDaNoite` | random (open) | Viral clip: chase hype (+18 fans) or use for testing (+8 texto +6 network) |
| 16 | `algoritmoPressao` | random (elenco) | Algorithm pressure: chase virality (+30 fans) or build sets (+10 texto) |
| 17 | `parceriaMarca` | random (headliner, 900+ fans) | Brand deal: accept (+20 fans +8 network) or refuse (+9 texto) |
| 18 | `comentarioForaContexto` | random (elenco, 120+ fans) | Out of context clip: respond (+14 fans) or turn into bit (+12 texto) |
| 19 | `criseCriativa` | random | Writer's block: force through (-10 motivation +5 texto) or rest (+12 motivation) |
| 20 | `conviteTV` | fans50 | TV invite: accept (+30 fans +10 network) or delay (+5 motivation) |
| 21 | `amigoCopiaSet` | random | Friend stealing jokes: confront (+3 texto) or write better (+10 texto) |
| 22 | `viralNegativo` | random | Cancel attempt: explain (-15 fans) or stay silent (-8 fans) |
| 23 | `ofertaDinheiro` | random | Shady sponsorship: accept (-10 fans) or refuse (+8 fans) |
| 24 | `festaPosShow` | showKill | After-show party: party (+8 motivation +10 network) or write (+12 texto) |
| 25 | `doencaDiaShow` | random | Sick on show day: go anyway (-8 motivation +5 network) or cancel (+5 motivation -8 network) |
| 26 | `competicaoComica` | random | Comedy competition: enter (-5 motivation +15 fans) or wait (+3 motivation) |
| 27 | `piratearamSeuShow` | fans30 | Show pirated: demand removal (-5 fans) or use as promo (+20 fans) |

---

## 18. CARVALHO MENTOR DIALOGS (14)

| # | ID | Trigger | Stage | Effect |
|---|----|---------|-------|--------|
| 1 | `carvalho-first-show` | First show ever | open | +3 motivation, +1 texto |
| 2 | `carvalho-first-study` | First study action | open | +3 texto, +2 motivation |
| 3 | `carvalho-first-rewrite` | First rewrite | open | +4 texto |
| 4 | `carvalho-first-bomb` | First bomb (nota 1) | open | +4 texto, +4 motivation |
| 5 | `carvalho-first-kill` | First nota 4+ | open | +3 texto, +2 motivation, +1 network |
| 6 | `carvalho-jokes10` | 10th joke written | open | +4 texto, +2 motivation |
| 7 | `carvalho-consistency-streak` | 3 consecutive good shows | open | +4 motivation, +2 texto |
| 8 | `carvalho-enter-elenco` | Reach Elenco | elenco | +5 texto, +3 entrega, +2 network |
| 9 | `carvalho-first-texto15` | First 15-min set | elenco | +4 texto, +2 entrega, +3 motivation |
| 10 | `carvalho-enter-headliner` | Reach Headliner | headliner | +6 texto, +3 entrega, +8 fans, +2 motivation |
| 11 | `carvalho-low-motivation` | Motivation ≤ 25 | any (cooldown 4) | +1 texto, +8 motivation |

---

## 19. IDEA POOL (50 joke seeds)

| Tone | Count | Example Seeds |
|------|-------|--------------|
| `besteirol` | 12 | fila de mercado às 23h, micro-ondas que apita alto, áudio de WhatsApp de 7 minutos |
| `vulgar` | 8 | banheiro químico em festival, motel com tema de castelo, depilação pela primeira vez |
| `limpo` | 10 | sobrinho gamer no almoço, avó que não entende celular, dentista tentando conversar |
| `humor negro` | 10 | aplicativo de meditação que grita, velório com wifi, ansiedade de domingo às 18h |
| `hack` | 10 | motorista de app coach, manual de geladeira com Bluetooth, reunião que podia ser email |

---

## 20. STAT CAPS & INITIAL VALUES

| Stat | Initial | Max | Notes |
|------|---------|-----|-------|
| texto | 10 | 200 | Writing skill |
| entrega | 5 | 200 | Delivery skill |
| motivation | 60 (after init) | 120 | Spent on writing, recovers +5/day |
| network | 10 | ∞ | Industry connections |
| fans | 0 | ∞ | Popularity |
| stageTime | 0 | ∞ | Total shows performed |

---

## 21. CAREER PROGRESSION SUMMARY

```
Day 1        → Open Mic (level 1)
First study  → "oneliner" structure unlocked
Level 2+     → Perk points available (1 per level)
Level 3      → Rossini Luz event (Storytelling unlock)
Level 5      → "hack" unlocked; "humor negro" unlocks after a nota-1 bomb
Days 15-30  → Hidden-threshold class Event 1 window
Days 40-55  → Hidden-threshold class Event 2 window
Level 6      → ELENCO stage; class assignment remains event-driven
Level 10     → "prop" structure unlocked
Day 65+     → Earliest class ending
Day 90+     → Default ending eligibility
Day 95+     → Almost ending eligibility
Day 100     → Failure if no higher-priority ending resolves

Special unlocks:
  Past runs   → V2 legacy unlocks are copied into each fresh run
  5 jokes     → Paulo Araújo: 5 a 5 show
  3× 5a5 @ nota 4+ → Paulo Araújo: Pague 15 show
  Class assigned + stats met → Employment offer (2 AP/day)
```

---

## 22. STATE STRUCTURE (principal keys)

```javascript
state = {
  // Identity
  name, avatar, hasStarted,

  // Core stats
  fans, motivation, texto, entrega, xp, levelNumber, level, stageTime, network,

  // Time
  currentDay, currentWeekDay, currentWeek, activityPoints,

  // Inventory
  jokes[], scheduledShows[], showHistory[],

  // Flags
  eventsSeen[], fiveA5Unlocked, pague15Unlocked,
  onelinerUnlocked, storytellingUnlocked, propUnlocked,
  humorNegroUnlocked, hackUnlocked, politicoUnlocked,
  chosenClass, hasEmployment,

  // Progression
  unlockedPerks[], availablePerkPoints,
  careerMilestones{}, routeCounters{}, routeInviteState{}, toneTally{},
  runState{}, careerPathState{}, eventRuntime{},

  // Subsystems
  flowState, elencoCircuitState, openStageState, venueReputation,
  carvalhoDialogState, careerChoices[]
}
```

Cross-run summaries are not stored in `state`; they live only in the separate `openMicRPG.legacyArchive.v1` local-storage entry.

---

## 23. KEY ACTIVITY COSTS

| Action | AP Cost | Other Cost |
|--------|---------|------------|
| Study | 1 | — |
| Write (desk) | 1 | -15 motivation |
| Write (day) | 1 | 0 motivation |
| Create content | 1 | — |
| Perform scheduled show | 0 | Limited to one show per day |
| Day pass | auto | +5 motivation, expire old scheduled shows |

---

## 24. VENUE REPUTATION SYSTEM

- **Range**: -20 to +40 per venue
- **Changes per show**: delta based on nota and show type
- **Effect**: modifies show availability and search results
- **Tracked in**: `state.venueReputation[id]`

---

*End of reference. Generated from script.js v2 — lines 1–5340.*
