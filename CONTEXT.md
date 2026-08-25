# TnFootPulse

A football-discovery agenda answering one question for viewers in Tunisia: which matches are worth watching today? Matches are ranked by a deterministic Pulse Score and grouped into priority categories.

## Language

### Scoring

**Pulse Score**:
The 0–100 priority total of a match, composed of four capped components (competition, team importance, match context, Tunisia viewing time).
_Avoid_: rating, points, importance score

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
