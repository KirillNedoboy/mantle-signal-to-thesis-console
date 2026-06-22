# Mantle Signal-to-Thesis Console

Self-hosted research operations console for the Mantle Research Challenge.

The project turns noisy Web3 scanner output into structured research intelligence:

```txt
raw signal -> evidence -> risk flags -> Mantle relevance -> AI thesis -> human decision trail
```

It is built for a hackathon judge or reviewer to inspect the full loop in minutes:

- open the dashboard
- review seeded demo signals
- inspect evidence and risk flags
- read the generated research note
- verify that decisions remain human-confirmed

## What Problem It Solves

Early Web3 signals are fragmented across scanner alerts, DEX feeds, ecosystem news, social context, and private notes. The hard part is not seeing another alert. The hard part is turning a noisy alert into a durable research object that a team can review, challenge, and revisit.

Mantle Signal-to-Thesis Console addresses that workflow gap. It keeps the agent focused on research operations:

- preserve raw signal context
- attach evidence
- identify missing data and risk flags
- classify Mantle relevance
- generate a thesis and next manual checks
- record a human decision trail

## Why It Fits Mantle Research Challenge

This is a Research Agent track submission because the agent does not execute transactions or produce chat-only summaries. It writes validated events into an append-only store, and the dashboard renders the materialized research state.

Mantle alignment:

- ecosystem scouting
- RWA and tokenized asset research workflows
- AI-native finance and prediction-market research
- DeFi liquidity and emerging protocol review
- repeatable open-source agent workflow for judges and operators

The project does not claim every imported signal is Mantle-native. Each signal receives an explicit `mantleRelevance` classification so reviewers can separate direct Mantle signals from broader ecosystem scouting.

## Agent Loop

```txt
Demo fixture / scanner export
        |
        v
Validated AgentEvent
        |
        v
Append-only JSONL event store
        |
        v
Materialized research state
        |
        v
Dashboard: inbox, evidence, risk flags, thesis, decision trail
```

The agent writes events such as:

- `signal_detected`
- `evidence_added`
- `score_updated`
- `research_note_created`
- `decision_recorded`

The dashboard does not edit scanner output directly. It only renders materialized state from the event store.

## Safety Boundaries

This repository is intentionally read-only and watch-only:

- no wallet connection
- no private keys
- no transaction signing
- no buy/sell/trade buttons
- no automated execution
- no Telegram live sender
- no cron jobs
- no mutation of production Hermes or Fast DEX runtime

A signal is not financial advice and not an execution instruction. Missing data is treated as risk, not safety.

## Quick Start

```bash
pnpm install
pnpm demo:seed
pnpm demo:agent-run
pnpm test
pnpm typecheck
pnpm build
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

Open:

```txt
http://127.0.0.1:3100/
http://127.0.0.1:3100/signals
http://127.0.0.1:3100/signals/signal_mantle_spcxx_demo01
```

## Main Commands

```bash
pnpm demo:seed          # writes deterministic demo signals into data/store/events.jsonl
pnpm demo:agent-run     # appends deterministic research notes and suggested decisions
pnpm import:fastdex -- --input ./demo/fixtures/fast-dex-sample.jsonl
pnpm test
pnpm typecheck
pnpm build
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

## Demo Walkthrough

1. Open the homepage and explain the loop: raw signal -> evidence -> risk flags -> thesis -> human decision.
2. Open Signal Inbox and show that four demo signals are materialized from append-only events.
3. Open a signal detail page.
4. Walk through Evidence, Risk Flags, Mantle Relevance, AI Research Note, and Decision Trail.
5. Emphasize that the system is a research console only, not a trading or wallet system.

## Data Model

Core objects:

- `Signal`
- `Evidence`
- `ResearchNote`
- `Decision`
- `AgentEvent`

The data contract is typed with Zod schemas, event persistence is JSONL, and the UI renders materialized state from those events.

## Submission Docs

- [Demo script](docs/demo-script.md)
- [Submission summary](docs/submission-summary.md)
- [X thread draft](docs/x-thread-draft.md)
- [Screenshots checklist](docs/screenshots-checklist.md)
- [Final validation](docs/final-validation.md)
- [Safety and non-goals](docs/safety-and-non-goals.md)
