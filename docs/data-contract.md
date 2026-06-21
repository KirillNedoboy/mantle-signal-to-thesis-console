# Data Contract

## Core rule

Everything in the dashboard is derived from `AgentEvent` records.

## Event types

- `signal_detected`
- `evidence_added`
- `score_updated`
- `research_note_created`
- `decision_recorded`

## Object lifecycle

```txt
signal_detected
  -> evidence_added
  -> score_updated
  -> research_note_created
  -> decision_recorded
```

A signal can exist without a research note. A research note cannot exist without a signal.

## Human confirmation

Agent decisions are suggestions. Human decisions are explicit records with `actor = "human"`.

## Missing data

Missing liquidity, holder, LP, authority or social data must be represented as explicit evidence or risk flags. It must not be silently ignored.
