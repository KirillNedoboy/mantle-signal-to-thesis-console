# Safety and Non-goals

## Non-goals

The MVP does not include:

- auto-buy
- auto-sell
- wallet connection
- private key handling
- transaction signing
- MEV / frontrunning / sandwich logic
- Telegram live sending
- production scanner mutation
- hardcoded secrets

## Safety defaults

- Fast alerts are not buy signals.
- Missing data is risk.
- Human confirmation is required for final decisions.
- AI notes must include uncertainty.
- Evidence is required for escalation.
- The dashboard is not an execution surface.

## Runtime isolation

This repo imports copied fixture/export data only. It must not directly modify external crons, Telegram bots, or production scanner files.
