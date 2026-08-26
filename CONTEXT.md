# TnFootPulse

A football-discovery agenda answering one question for viewers in Tunisia: which matches are worth watching today? Matches are ranked by a deterministic Pulse Score and grouped into priority categories.

## Language

### Scoring

**Pulse Score**:
The 0–100 priority total of a match, composed of five capped components (competition, team importance, match context, Tunisia viewing time, club pedigree).
_Avoid_: rating, points, importance score

**Club Pedigree Floor**:
A minimum Pulse Score guarantee based on a club's standing — either its UEFA five-year sporting coefficient rank (top 20) or its status as a historically dominant Tunisian club (top 4). The floor is enforced via a "pedigree top-up" fifth component that fills the gap when the other four components sum below the floor. Applies to competitive matches only; never to friendlies.
_Avoid_: prestige bonus, club weight, coefficient bonus

**UEFA Ranked Club**:
A club appearing in the top 20 of the UEFA five-year sporting club coefficient for the current season (sourced from kassiesa.net). The list is curated once per season, not fetched live.
_Avoid_: European club, CL club

**Tunisian Elite Club**:
One of the four historically dominant Tunisian clubs: Espérance Sportive de Tunis, Club Africain de Tunis, Étoile Sportive du Sahel, CS Sfaxien. These clubs receive a Worth Watching floor (70) in any competitive match, and a High Priority floor (80) when two of them face each other.
_Avoid_: Tunisian big club, local giant

**Pedigree Top-Up**:
The fifth scoring component — a non-negative integer that fills the gap between the sum of the first four components and the applicable Club Pedigree Floor. When no floor applies, pedigree is zero and invisible in the Intelligence Report. When it fires, it appears as a labeled row plus a reason line: "UEFA pedigree — <club> (rank N)" or "Tunisian elite pedigree".
_Avoid_: bonus, boost, override

**Priority Category**:
One of five named bands that translate a Pulse Score into plain language: Must Watch (90–100), High Priority (80–89), Worth Watching (70–79), If You Have Time (55–69), Low Priority (0–54).
_Avoid_: tier, level, group

**Intelligence Report**:
The breakdown view showing how a match's Pulse Score was assembled, component by component, with the reasons that actually applied.
_Avoid_: score details, breakdown panel (in user-facing copy)

**Worth Watching Count**:
The number of Must Watch plus High Priority matches on the selected day, shown in the hero as a quick answer to "is tonight worth it?".
_Avoid_: match counter, highlights

### Time

**Tunisia Time rule**:
Every kickoff is presented and grouped by the Africa/Tunis calendar day, regardless of the provider's timezone or the match's local stadium time.
_Avoid_: local time, stadium time

### Identity

**Canonical team**:
The single internal name a club is known by across providers; provider spellings resolve to it through aliases.
_Avoid_: provider name (when referring to the internal identity)

### Sources

**Source Mode**:
Which exclusive data pipeline produces the visible agenda. Exactly one mode is active at a time: Curated Mode (football-data.org primary, API-Football for its exclusive competitions and backup fill) or ESPN Mode (an unofficial, no-SLA ESPN feed under experiment). Both modes render the same UI and score matches with the same Pulse Score.
_Avoid_: data toggle, API switcher, third provider (ESPN is not merged into the Curated pipeline)

**Experimental Source**:
A source kept outside the Curated pipeline because it is unofficial, undocumented, or without availability guarantees. An Experimental Source powers only its own Source Mode, may break without notice, and its failure must never degrade Curated Mode.
_Avoid_: backup provider, fallback API
