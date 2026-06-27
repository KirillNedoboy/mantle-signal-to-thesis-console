# Mantle Signal-to-Thesis Console

Self-hosted `Signal-to-Thesis Console`: a research operations workspace for turning noisy Web3 scanner output into structured, reviewable research objects.

The current repo exposes two operator surfaces on the same event/materialization engine:

- **Mantle research inbox** — docs-backed, thesis-oriented signals for the Mantle challenge narrative
- **Degen radar** — faster triage for imported Fast DEX Radar alerts and early-stage setups

Core loop:

```txt
raw signal -> evidence -> risk flags -> thesis -> human decision trail
```

The console is built so a judge, operator, or reviewer can inspect the full loop in minutes:

- open the dashboard
- review materialized signals
- inspect evidence and risk flags
- read the generated research note or score breakdown
- verify that decisions remain human-confirmed

## Live Demo

- **Live URL**: http://138.124.108.146:3100/
- **Demo video (50s, 16:9)**: https://raw.githubusercontent.com/KirillNedoboy/mantle-signal-to-thesis-console/main/assets/video/mantle-demo.mp4
- **Sample signal**: http://138.124.108.146:3100/signals/signal_mantle_spcxx_demo01
- **Screenshots**: see `assets/screenshots/{home,inbox,detail,decision-trail}.png`

The 50-second desktop walkthrough: title card → terminal agent run → dashboard (4 signals) → signal detail (Mantle evidence + optional Mantle docs citation when the optional `mantle-agent-skill` is present) → decision trail → final end-card "Research only. No wallet. No execution."

> **Reproducibility:** see [docs/README-for-judges.md](docs/README-for-judges.md) for a 60-second local run, exact validation commands, and an honest list of limitations (JSONL store = single-process, Mantle docs = optional skill, no cross-process locking).

## What Problem It Solves

Early Web3 signals are fragmented across scanner alerts, DEX feeds, ecosystem news, social context, and private notes. The hard part is not seeing another alert. The hard part is turning noisy alerts into durable research objects that a team can review, challenge, and revisit.

Signal-to-Thesis Console addresses that workflow gap. It keeps the agent focused on research operations:

- preserve raw signal context
- attach evidence
- identify missing data and risk flags
- classify relevance for the current surface
- generate a thesis or score rationale with next manual checks
- record a human decision trail

## Why Mantle Is Still a First-Class Surface

This repo started as a Mantle Research Challenge submission and still keeps Mantle as a first-class operator surface.

Mantle alignment:

- ecosystem scouting
- RWA and tokenized asset research workflows
- AI-native finance and prediction-market research
- DeFi liquidity and emerging protocol review
- repeatable open-source agent workflow for judges and operators

The project does not claim every imported signal is Mantle-native. Each signal on the Mantle surface receives an explicit `mantleRelevance` classification so reviewers can separate direct Mantle signals from broader ecosystem scouting.

At the same time, the same event engine can drive other surfaces — currently including Degen Radar for Fast DEX imports.

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

### Mantle docs integration

Citations from `docs.mantle.xyz` are produced by the optional `mantle-agent-skill` Hermes skill (`src/skills/mantleDocsSkill.ts`). When the skill is not installed on the host, the agent loop returns `status: "MCP_UNAVAILABLE"` and continues without citations. The demo, tests, and build do not require the skill. See the [judges' quickstart](docs/README-for-judges.md#mcp-unavailable) for details.

### JSONL store

`src/store/eventStore.ts` is optimized for the single-process demo. It reads the existing file at most once per batch and dedups eventIds in memory. **There is no cross-process file locking.** Running multiple `pnpm demo:*` processes in parallel against the same store can race. This is documented in the code and in the judges' quickstart.

## Quick Start

```bash
pnpm install --frozen-lockfile
pnpm demo:seed
pnpm demo:agent-run
pnpm test
pnpm typecheck
pnpm build
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

`pnpm install --frozen-lockfile` is the exact CI command and guarantees a reproducible install against the committed lockfile. See [docs/README-for-judges.md](docs/README-for-judges.md) for the full judge-friendly quickstart.

Open:

```txt
http://127.0.0.1:3100/
http://127.0.0.1:3100/signals
http://127.0.0.1:3100/signals/signal_mantle_spcxx_demo01
http://127.0.0.1:3100/degen
```

## Main Commands

```bash
pnpm install --frozen-lockfile   # reproducible install (matches CI)
pnpm demo:seed                   # writes deterministic Mantle-oriented demo signals into data/store/events.jsonl
pnpm demo:agent-run              # appends deterministic research notes and suggested decisions
pnpm import:fastdex -- --input ./demo/fixtures/fast-dex-sample.jsonl
pnpm degen:import                # imports the latest Fast DEX Radar alerts into the shared event store
pnpm test
pnpm typecheck
pnpm build
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

## Demo Walkthrough

1. Open the homepage and explain the shared loop: raw signal -> evidence -> risk flags -> thesis -> human decision.
2. Open `/signals` and show the Mantle-facing inbox materialized from append-only events.
3. Open a Mantle signal detail page.
4. Walk through Evidence, Risk Flags, Mantle Relevance, AI Research Note, and Decision Trail.
5. Optionally open `/degen` to show that the same engine can support a faster radar surface for Fast DEX imports.
6. Emphasize that every surface is research-only, not a trading or wallet system.

## Data Model

Core objects:

- `Signal`
- `Evidence`
- `ResearchNote`
- `Decision`
- `AgentEvent`

The data contract is typed with Zod schemas, event persistence is JSONL, and the UI renders materialized state from those events.

## Submission Docs

- **[Judges' quickstart](docs/README-for-judges.md)** — 60-second local run, validation commands, mock-vs-real breakdown, MCP fallback.
- [Demo script](docs/demo-script.md)
- [Submission summary](docs/submission-summary.md)
- [X thread draft](docs/x-thread-draft.md)
- [Screenshots checklist](docs/screenshots-checklist.md)
- [Final validation](docs/final-validation.md)
- [Safety and non-goals](docs/safety-and-non-goals.md)
