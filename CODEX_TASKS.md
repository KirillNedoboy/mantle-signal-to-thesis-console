# Codex Execution Plan

## Prime directive

Build the hackathon repository. Do not touch any external Hermes / Fast DEX runtime.

## Current repo goal

Create a self-hosted dashboard and agent event workflow for Mantle Signal-to-Thesis Console.

## Safety constraints

- no auto-buy
- no auto-sell
- no private keys
- no wallet connection
- no transaction signing
- no Telegram live sending
- no cron changes
- no scanner scoring changes outside this repository
- no direct edits to existing `/root/.hermes` production files

## Phase 1 — install and verify

```bash
pnpm install
pnpm demo:seed
pnpm demo:agent-run
pnpm test
pnpm typecheck
pnpm dev
```

Expected:

- dashboard opens at `http://localhost:3000`
- Signal Inbox contains demo signals
- each signal has evidence, score, risk flags and decision trail after `demo:agent-run`

## Phase 2 — polish dashboard

Improve visual clarity only:

- dashboard hero
- signal filters
- risk badge grouping
- Mantle relevance labels
- export card for demo screenshots

Do not add auth/payments/wallets.

## Phase 3 — importer hardening

Add importers for copied outputs only:

- Fast DEX JSONL copy
- Hermes markdown report copy

Rules:

- invalid input fails loudly
- missing fields become explicit risk evidence
- no silent catches
- no direct production path reads by default

## Phase 4 — submission pack

Create:

- `docs/submission-summary.md`
- `docs/x-post.md`
- `docs/demo-recording-checklist.md`
- `docs/README-for-judges.md`

## Phase 5 — optional live adapter later

Only after the hackathon demo works:

- add read-only file watcher for exported/copied JSONL
- keep append-only event store
- do not modify production scanner runtime
