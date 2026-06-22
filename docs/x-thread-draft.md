# X Thread Draft

1/8

Built Mantle Signal-to-Thesis Console for the @Mantle_Official Research Challenge.

It is a self-hosted research operations console that turns noisy Web3 scanner output into structured research objects.

No wallet. No execution. Research only.

2/8

The core loop:

raw signal -> evidence -> risk flags -> Mantle relevance -> AI thesis -> human decision trail

The goal is to help reviewers understand why a signal surfaced, what is missing, and what a human decided.

3/8

The Signal Inbox shows materialized demo signals with:

- source
- chain
- category
- status
- Mantle relevance
- risk severity
- latest decision

It is designed for research triage, not trading.

4/8

Each Signal Detail page includes:

- evidence panel
- risk flags
- Mantle relevance
- AI research note
- decision trail

The agent writes a thesis and manual checks, but does not produce execution instructions.

5/8

Why Mantle?

The workflow supports ecosystem scouting across Mantle-native signals, RWA and tokenized asset research, prediction markets, AI-agent finance, and DeFi liquidity review.

Each signal has explicit Mantle relevance classification.

6/8

Why it is not just an AI wrapper:

- typed schemas
- append-only JSONL events
- deterministic materialized state
- scoring helpers
- generated research notes
- durable human decision trail

The reusable artifact is the workflow and data contract.

7/8

Safety boundaries:

- no wallet connection
- no private keys
- no transaction signing
- no buy/sell/trade controls
- no Telegram sender
- no production runtime mutation

Signals are research objects, not financial advice.

8/8

Demo flow:

1. Seed demo signals
2. Run the demo research agent
3. Open the dashboard
4. Review Inbox -> Detail -> Evidence -> Risk -> Thesis -> Decision

Submission for @Mantle_Official Research Challenge: Mantle Signal-to-Thesis Console.
