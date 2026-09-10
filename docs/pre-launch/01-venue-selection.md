# Pre-launch recommendation: venue selection

## Finding

The Open-stage offer picker can fill every available slot with `isOpenStarter` gigs. With one offer at low Network, the starter quota is always at least one, so regular venues such as Sushi & Stand-Up and the newly staged 6–7 minute venues may never appear in practice.

Relevant code:

- `script.js:1313` — `pickOpenWeightedShows`
- `script.js:4473` — offer count based on Network

## Recommendation

Replace the hard starter quota with a weighted selection that keeps starter gigs common while guaranteeing regular venue variety over a run. Preserve the current staged minute gates and the Elenco circuit offers.

## Acceptance checks

- A fresh Open run can receive a regular venue offer.
- Starter gigs remain common in the first few searches.
- 6-minute and 7-minute venues still respect their `stageTime` gates.
- Elenco circuit scheduling remains unchanged.
