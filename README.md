# Mantle Signal-to-Thesis Console

Self-hosted AI research console for the Mantle Research Challenge.

It turns autonomous Web3 scanner outputs into structured research objects:

```txt
raw signal -> evidence -> risk flags -> Mantle relevance -> research note -> human decision trail
```

This repository is intentionally **read-only / watch-only**:

- no auto-buy
- no private keys
- no wallet connection
- no trade execution
- no Telegram live sending
- no mutation of existing Hermes / Fast DEX production runtime

## Why this exists

Early Web3 signals are fragmented across DEX feeds, on-chain activity, social posts, ecosystem news, and private research notes. The hard part is not seeing one more token; the hard part is turning noisy signals into a durable research trail.

This project packages an existing AI scanner contour into a clean hackathon-ready product layer:

- append-only agent event journal
- typed data contract
- deterministic risk / relevance scoring
- research note generation
- dashboard for judges and operators

## Mantle alignment

The console is framed for Mantle ecosystem research:

- ecosystem scouting
- research workflow automation
- RWA / tokenized assets / AI-native finance / DeFi liquidity narratives
- repeatable agent workflow for Track 2-style submissions

It does **not** claim that every imported signal is Mantle-native. Instead, each signal receives an explicit `mantleRelevance` classification.

## Architecture

```txt
Scanner output / demo fixture
        |
        v
Validated AgentEvent
        |
        v
Append-only JSONL journal
        |
        v
Materialized research state
        |
        v
Dashboard + Research Notes + Decision Trail
```

## Quick start

```bash
pnpm install
pnpm demo:seed
pnpm demo:agent-run
pnpm test
pnpm typecheck
pnpm dev
```

Then open:

```txt
http://localhost:3000
```

## Main commands

```bash
pnpm demo:seed          # writes deterministic demo signals into data/store/events.jsonl
pnpm demo:agent-run     # appends deterministic AI research notes and suggested decisions
pnpm import:fastdex -- --input ./demo/fixtures/fast-dex-sample.jsonl
pnpm test
pnpm typecheck
pnpm build
pnpm dev
```

## Data model

Core objects:

- `Signal`
- `Evidence`
- `ResearchNote`
- `Decision`
- `AgentEvent`

Every dashboard update comes from an append-only event. The dashboard does not edit scanner output directly.

## Demo story

1. Seed demo signals.
2. Run the agent note generator.
3. Open the dashboard.
4. Show Signal Inbox.
5. Open a signal detail page.
6. Explain evidence, risk flags, Mantle relevance, generated thesis and decision trail.
7. Emphasize: this is not a buy signal; it is a research workflow.

## Safety position

A Fast DEX alert is not a buy signal. It is only an object for urgent manual review.

The project does not give execution instructions and does not automate trades. Missing data is treated as risk, not as safety.
