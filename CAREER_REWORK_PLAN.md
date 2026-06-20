# Career Rework Plan

## Goal

Rework the game so that:

- a first full run lasts around `80-100 in-game days`
- the player can finish the run in `one real-life session/day`
- different playstyles produce meaningfully different routes
- routes are `never permanently lost`
- the run has `one clear structural ending` with `multiple route-specific endings`

## Core Run Shape

- `Days 1-30`: open mic phase, learning the loop, early route flavor events
- `Days 35-55`: second route events, stronger specialization pressure
- `Days 55-70`: class/career path consolidates automatically
- `Days 75-85`: employment/pro opportunity appears as a late-game event
- `Days 95-100`: final showcase / ending trigger

## Clear Ending Structure

One structural ending for the first run:

- `Final Showcase` around day `95-100`

Multiple narrative outcomes based on class:

- `Roteirista`: writing room / paid writing work
- `Ator Cômico`: cast/sketch/audiovisual route
- `Produtor`: running a night / building a circuit
- `Influencer`: collab/campaign/digital breakout
- `Cômico Clássico`: reliable complete performer entering the stronger circuit

Systems like `Headliner`, `Special Tape`, `Legacy`, and `Made It` should become:

- post-game
- future chapter
- or explicitly non-main-run content

## Classes

Keep these classes:

- `Roteirista`
- `Ator Cômico`
- `Produtor`
- `Influencer`
- `Cômico Clássico`

Remove this class:

- `Professor`

Notes:

- `Professor Carvalho` stays as an NPC/mentor
- `Cômico Clássico` becomes the generalist class
- `Cômico Clássico` ending should include aspects of the other paths: craft, stage presence, consistency, professionalism

## Class Acquisition

Classes should not be chosen directly.

New rule:

- classes are assigned automatically from player behavior
- only `one class` can be locked in
- class lock should not happen before roughly `day 60`

Class lock should depend on:

- route events already accepted
- behavioral counters
- route-specific stats

Important:

- `Roteirista` cannot be based on `texto` alone
- `Professor` is gone, so `study` becomes support, not a profession
- `Influencer` cannot be blocked from progression just because content is not stage-based

## Route Events

Each class gets `2 events`.

### Event 1

- appears between `day 15 and day 30`
- acts as flavor / teaser / exposure to a route
- no heavy gate

### Event 2

- appears between `day 40 and day 55`
- requires route-aligned progress
- accepting it gives a meaningful boost
- accepting it should cost `1 activity point` or equivalent day pressure
- player may accept multiple Event 2s before class lock
- after class lock, only the chosen path matters

These events should not be random enough to disappear forever.

## No Lost Routes

No route should be permanently missable.

Rules:

- replace exact triggers like `jokes.length === 5` with `>=`
- if a route trigger happens before its event can legally appear, store it as pending
- show it at the next valid moment
- refusing a route event must `delay` it, not kill it
- re-check route opportunities after:
  - writing
  - show
  - end of day
  - load game

Example:

- if player writes `5 jokes` before the first show, `Paulo` should appear right after the first show

## Study Rebalance

Current problem:

- `study` is too strong relative to writing
- it gives too much `texto`
- it can overshadow route identity

Target rebalance:

- study should help technique
- writing should remain the main route to `Roteirista`

Suggested new values:

- `study`: `texto +4`, `motivation +2`, `XP +15`

Add counter:

- `studyCount += 1`

## Writing / Route Counters

Add persistent counters to state/save/load:

- `studyCount`
- `writeCount`
- `rewriteCount`
- `contentCount`
- `showsScheduledCount`

These should feed route logic.

## Joke Structures and Duration

Joke structure should mechanically change duration.

Use this mapping:

- `oneliner`: `1 min`
- `prop`: `1 min`
- `bit`: `2-3 min`
- `storytelling`: `3-5 min`

Implications:

- oneliner/prop are efficient for testing new material
- bit/storytelling create bigger set chunks but need more commitment
- routes can differ by how they build runtime

This must affect:

- joke creation
- rewrite
- saved joke minutes validation

## Show XP Philosophy

Show XP should not depend on show quality (`nota`).

Reason:

- good/bad performance is already rewarded by `fans`, `network`, `motivation`, venue rep, and events
- XP should represent stage experience, not applause volume

## Two Show XP Types

Each show gives one of two XP values:

- `consolidated set XP`
- `new material XP`

Rule:

- if the set contains at least `1 joke tested less than 3 times`, the show gives the `new material` XP value

This is intentional and should be considered a good stand-up work ethic, not an exploit.

Difference target:

- meaningful but not overwhelming
- around `+20% XP`

Suggested examples:

- `Open`: `40 XP` consolidated / `48 XP` new material
- `5a5`: `50 XP` consolidated / `60 XP` new material
- `Elenco`: `65-70 XP` consolidated / `78-84 XP` new material
- `Final Showcase`: `120 XP` or fixed one-time final reward

## General XP Rebalance

Suggested non-show XP:

- `new joke`: `12 XP`
- `rewrite`: `6 XP`
- `study`: `15 XP`
- `content`: `8-10 XP`

Important:

- `content` must give XP so the influencer route is not mechanically punished

## Level Progression Direction

XP curve should support a `~100 day` first run.

High-level direction:

- slower than current early pacing
- levels should feel like broad career progression, not route identity
- route identity should come from behavior/events/counters, not just level

Suggested curve direction:

- `level 2`: around `180-220`
- `level 6`: much later than current, around mid-run
- `level 10-11`: around the end of the first run

Exact values should be tuned after implementing the new show XP model.

## Employment Offer Rework

Current employment offer should stop being a mid-stat gate.

New role:

- employment becomes a `late-game route event`
- appears around `day 75-85`
- requires class already defined
- accepting it increases the player's daily capacity

Suggested effect:

- accepting employment gives `2 activity points per day`

This should be the moment where the run opens up a little before the final push.

## Final Showcase

The first run should culminate in a final showcase.

Requirements:

- class locked
- employment accepted
- day near `95-100`

Outcome:

- final narrative depends on route/class
- this is the canonical end of the first run

## Systems That Should Be De-Prioritized in Main Run

These systems conflict with the intended shorter replayable first run if treated as mandatory:

- `Headliner`
- `Special Tape`
- `Legacy Choice`
- `Made It`

Recommendation:

- keep them for post-run / future expansion
- do not make them the main target of the first run

## Contradictions This Plan Resolves

This plan is intended to fix these contradictions:

- game is supposed to be replayable, but classes currently come too late and matter too little
- study can dominate texto progression too easily
- route identity is too cosmetic
- content route risks lagging behind progression
- some routes can be lost permanently
- there are too many competing endings for a first run
- current long-tail systems are closer to campaign mode than to a first-run structure

## Implementation Modules

The work should be done one module at a time:

1. remove `Professor` as a class [done]
2. nerf `study` and rebalance general XP [done]
3. add route counters to state/save/load [done]
4. implement structure-based joke duration [done]
5. refactor show XP into `consolidated` vs `new material` [done]
6. make route invites non-missable (`Paulo`, `Pague15`, etc.)
7. add route events (phase 1 and phase 2)
8. implement automatic class lock
9. turn employment into a late-game event
10. make final showcase the main ending
11. move headliner/legacy/special systems out of the core first-run expectation

## Final Design Principle

The run should feel like this:

- quick to play in real life
- long enough in in-game days to create a career arc
- impossible to see everything in one run
- always finishable
- clearly shaped by what the player spent time doing
