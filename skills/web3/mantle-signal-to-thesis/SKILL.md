# Mantle Signal-to-Thesis Skill

## Purpose

Use this skill to turn raw Web3 ecosystem signals into structured research objects:

```txt
source -> evidence -> score -> risk flags -> Mantle relevance -> thesis -> human decision trail
```

## Scope

This skill supports a read-only / watch-only research contour for Mantle ecosystem scouting and Web3 signal review.

It is not a trading system.

## Inputs

- Fast DEX copied JSONL exports
- Hermes copied Markdown/JSON reports
- manual research fixtures
- Mantle ecosystem/news/research examples

## Outputs

- validated `AgentEvent` records
- append-only JSONL journal
- materialized dashboard state
- research notes
- suggested decisions
- human decisions

## Rules

- A FAST_ALERT is not a buy signal.
- SCOUT_PREVIEW is never a live investment signal.
- Missing data is a risk.
- Every escalation requires evidence.
- The dashboard is updated only via structured events.
- The agent must not edit UI components directly.
- Human confirmation is required for final decisions.
- Do not use private keys, wallets or transaction signing.
- Do not add auto-buy or auto-sell.
- Do not mutate existing production Hermes / Fast DEX runtime.

## Agent behavior

For each signal, the agent should:

1. validate the signal object;
2. add evidence records;
3. compute risk flags;
4. classify Mantle relevance;
5. generate a concise research note;
6. suggest `WATCH`, `REJECT`, `ESCALATE`, or `NO_ACTION`;
7. preserve uncertainty and missing data;
8. wait for human confirmation.

## Mantle relevance categories

- `mantle_native`
- `rwa_distribution`
- `tokenized_assets`
- `prediction_markets`
- `ai_agent_finance`
- `defi_liquidity`
- `ecosystem_scouting`
- `not_relevant`

## Default wording

When describing a Fast DEX signal:

> This is not a buy signal. It is an object for urgent manual review.

When describing the dashboard:

> The agent writes structured events into an append-only journal. The dashboard renders research state from that journal.
