# Adopt a cozy emerald/amber visual identity; reverse the circular-gauge ban

status: accepted

The original MVP identity (SPEC §24–26) was red-dominant ("energetic") and explicitly banned circular score gauges (§37). Real usage showed the near-black + red scheme read harsh for a daily-use "what should I watch tonight" surface, and the mockup-driven redesign calls for a warmer, calmer feel. We adopt a warm stone-black background with an **emerald** pulse accent, **amber** for the High Priority band, and demote **crimson** to the Must Watch band only; we adopt the circular Pulse Score gauge (featured card + detail dialog) with numeric component rows replacing progress bars; and we adopt the product vocabulary "Pulse Score" and "Intelligence Report" (see CONTEXT.md).

Trade-off: we deliberately trade the original "energetic red" brand intent for coziness and at-a-glance band recognition (color = category). The old red-dominant rules in SPEC §24–26 and the §37 gauge ban are superseded by this ADR, not by silent drift. Scoring mathematics, category boundaries, and component caps are untouched — this decision is presentation-only.

## Consequences

- All color decisions flow from one token block (`index.css` theme) plus the per-category badge/accent map in the scoring vocabulary module; re-theming later is a one-file change.
- Red now signals exclusively "Must Watch"; green signals live/positive; amber signals "almost must-watch". No other red/green usage is allowed in the UI.
