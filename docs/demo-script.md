# Demo Script

Target length: 2-3 minutes.

## Opening Line

"This is Mantle Signal-to-Thesis Console, a research operations dashboard that turns noisy Web3 scanner output into an auditable signal-to-thesis workflow. It is not a trading bot, not a wallet app, and not an execution system."

## 0:00-0:35 - Homepage Walkthrough

Open:

```txt
http://127.0.0.1:3100/
```

Say:

"The core loop is raw signal, evidence, risk flags, thesis, and human decision. The purpose is to help a research team understand why a signal surfaced, what evidence exists, what is missing, and what a human reviewer decided."

Point out:

- the core loop
- the "Open Signal Inbox" call to action
- the safety label: "Research console only. Not a buy/sell/execution system."
- the four value cards: Signal Inbox, Evidence Trail, Risk-First Thesis, Human Decision Log

## 0:35-1:10 - Signal Inbox Walkthrough

Open:

```txt
http://127.0.0.1:3100/signals
```

Say:

"The inbox is the operator queue. These demo signals are materialized from append-only events. The UI shows source, chain, category, status, Mantle relevance, risk severity, latest decision, and evidence count."

Point out:

- four demo signals
- source and chain
- category badges such as `MANTLE_RESEARCH_SIGNAL`, `SCOUT_PREVIEW`, and `RESEARCH_FINDING`
- status badges such as `WATCH`, `NO_ACTION`, or `REJECTED`
- `not_a_buy_signal` risk badge
- latest decision field

## 1:10-2:15 - Signal Detail Walkthrough

Open:

```txt
http://127.0.0.1:3100/signals/signal_mantle_spcxx_demo01
```

Say:

"This page is the research object. The top summary shows the signal name, chain, source, category, status, detected time, score, Mantle relevance, evidence count, and latest decision."

Walk through:

1. Evidence panel
   - "Evidence explains why the signal exists in the research queue."
2. Risk Flags panel
   - "The system leads with risk. Missing liquidity, holder, volume, LP lock, or contract authority data is treated as risk."
3. Mantle Relevance panel
   - "The project does not assume every signal is Mantle-native. Relevance is explicitly classified."
4. AI Research Note
   - "The agent writes a thesis, why it surfaced, risk summary, and next manual checks."
5. Decision Trail
   - "The final decision remains a recorded review artifact. It is not an execution instruction."

## 2:15-2:45 - Architecture and Safety Close

Say:

"Under the hood, the agent writes validated append-only JSONL events. The dashboard only renders materialized state. There is no wallet connection, no private key handling, no buy or sell flow, no Telegram sender, and no production Hermes or Fast DEX mutation."

## Closing Line

"Mantle Signal-to-Thesis Console is open-source research infrastructure for turning early ecosystem signals into evidence-backed, risk-aware, human-reviewed research objects."
