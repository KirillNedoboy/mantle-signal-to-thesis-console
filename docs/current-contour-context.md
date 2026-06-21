# Existing Contour Context

This repository is a clean hackathon repo. It is informed by an existing working system, but it must not modify that system.

## Existing system summary

### Daily Hermes / Alpha Radar

Purpose:

- slow research layer
- trust / thesis / product reality
- holder / liquidity / contract risk
- verdicts such as `NO_ACTION`, `NO BUY`, `AVOID`, `WATCH`

Question answered:

> Is this worthy of trust or deeper attention?

### Fast DEX Radar

Purpose:

- fast 5-minute discovery layer
- early object detection
- FAST_ALERT / SCOUT_PREVIEW categories
- urgent manual review only

Question answered:

> Is this worth opening manually right now?

### Hard distinction

Fast DEX is not a buy signal. Hermes is not an execution engine. Neither should be mixed with auto-trading.

## Product layer in this repo

This repo unifies both systems only at the data contract level:

```txt
Fast DEX / Hermes export copy -> AgentEvent -> JSONL journal -> dashboard
```

It does not:

- change Fast DEX cadence
- change Fast DEX scoring math
- change Daily Hermes cron
- change Telegram UX
- send live alerts
- handle private keys
- execute trades

## Future adapters

Allowed later:

- import copied Fast DEX JSONL
- import copied Hermes Markdown reports
- import manual Mantle research fixtures

Not allowed in MVP:

- direct mutation of `/root/.hermes`
- new watchdog
- new cron
- new Telegram bot
- execution logic
