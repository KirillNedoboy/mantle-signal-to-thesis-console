# Architecture

## Runtime boundary

This repository is a new hackathon repository. It does not modify any production Hermes or Fast DEX runtime.

Existing scanners may export JSONL / Markdown / copied reports. This project imports those copies only.

## Components

```txt
CLI seed/import tools
        |
        v
AgentEvent validator
        |
        v
Append-only JSONL event store
        |
        v
Materializer
        |
        v
Next.js dashboard
```

## Why JSONL first

JSONL is enough for the hackathon MVP:

- simple
- auditable
- git-friendly
- easy to inspect
- no native DB dependency
- no hidden schema migrations

SQLite can be added later when the event volume requires indexed queries.

## Event store rules

- append-only
- every event has `eventId`
- duplicate `eventId` is idempotently ignored
- invalid events are rejected
- write errors are explicit
- no silent catches

## Dashboard rules

The dashboard never lets the agent mutate React components or raw UI files.

The agent writes structured events. The UI renders materialized state from those events.

## AI layer

MVP AI behavior is deterministic and local:

- creates research notes from validated signal/evidence state
- includes uncertainty
- includes missing data
- includes safety language
- suggests a decision, but does not finalize a human decision

A hosted LLM provider can be added later behind the same `ResearchNoteGenerator` interface.
