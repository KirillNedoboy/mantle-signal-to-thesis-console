# Final Validation

Run these commands from the repository root before recording or submitting the project.

## Install

```bash
pnpm install
```

Expected:

- dependencies install using the pinned package manager
- no application code changes required

## Seed Demo Events

```bash
pnpm demo:seed
```

Expected:

- deterministic demo signal, evidence, and score events are present in `data/store/events.jsonl`
- repeated runs skip duplicate deterministic events

## Run Demo Agent

```bash
pnpm demo:agent-run
```

Expected:

- deterministic research notes and suggested decisions are appended when missing
- repeated runs do not create duplicate demo notes

## Test

```bash
pnpm test
```

Expected:

- Vitest suite passes

## Typecheck

```bash
pnpm typecheck
```

Expected:

- TypeScript completes with no errors

## Production Build

```bash
pnpm build
```

Expected:

- Next.js production build completes
- routes include `/`, `/signals`, and `/signals/[id]`

## Local Demo Server

```bash
pnpm dev -- --hostname 127.0.0.1 --port 3100
```

Open:

```txt
http://127.0.0.1:3100/
http://127.0.0.1:3100/signals
http://127.0.0.1:3100/signals/signal_mantle_spcxx_demo01
```

Expected:

- homepage explains the core loop and safety boundary
- Signal Inbox shows four demo signals
- Signal Detail shows summary, evidence, risk flags, Mantle relevance, AI research note, and decision trail
- no wallet, trade, or execution UI is present

## Safety Verification

Confirm:

- no wallet connection
- no private key handling
- no transaction signing
- no buy/sell/trade controls
- no Telegram live sender
- no cron jobs
- no production Hermes or Fast DEX runtime mutation
