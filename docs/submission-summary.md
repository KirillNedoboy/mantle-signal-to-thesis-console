# Submission Summary

## Project Title

Mantle Signal-to-Thesis Console

## One-Liner

A self-hosted research agent console that turns noisy Web3 signals into evidence-backed, risk-aware, human-reviewed research objects for the Mantle ecosystem.

## Problem

Early Web3 signals arrive as fragmented alerts, scanner rows, social context, and private notes. Without structure, they become noisy and hard to audit. A research team needs to know:

- why a signal surfaced
- what evidence supports it
- what data is missing
- how it relates to Mantle
- what the agent concluded
- what a human reviewer decided

## Solution

Mantle Signal-to-Thesis Console packages that workflow into a local research operations dashboard:

- Signal Inbox for triage
- Evidence Trail for source context
- deterministic risk and Mantle relevance scoring
- AI Research Note with thesis, uncertainty, and manual checks
- Decision Trail for durable human review

The result is not a chat answer. It is a structured research object that can be revisited and audited.

## Agent Workflow

```txt
raw scanner/demo input
  -> validated AgentEvent
  -> append-only JSONL event store
  -> materialized research state
  -> dashboard panels for evidence, risk, thesis, and decisions
```

The demo commands show the loop:

```bash
pnpm demo:seed
pnpm demo:agent-run
```

`demo:seed` appends deterministic signal/evidence/score events. `demo:agent-run` appends deterministic research notes and suggested decisions. The dashboard renders only the materialized event state.

## Mantle Relevance

The project is framed for Mantle ecosystem research:

- Mantle-native signal review
- RWA and tokenized asset research
- prediction-market and AI-agent finance scouting
- DeFi liquidity and ecosystem discovery
- repeatable research workflow for grants, hackathon review, and operator triage

Each signal has explicit `mantleRelevance`, so the system can distinguish Mantle-native signals from broader ecosystem scouting.

## Why It Is Not Just an AI Wrapper

The agent output is not a free-form chat response. The repository includes:

- typed Zod schemas
- append-only event persistence
- deterministic materialization
- deterministic risk/relevance scoring
- generated research notes
- durable decision trail
- dashboard views built from event state

The reusable unit is the workflow and data contract, not a prompt pasted into a UI.

## What Is Open-Source and Reusable

Reusable pieces:

- event schema for research agents
- JSONL event store pattern
- materialized research state
- risk-first scoring helpers
- demo agent-run flow
- dashboard panels for signal inbox, evidence, risk flags, research note, and decision trail
- documentation and demo script for reviewers

## Mantle AI Agent Skills (bonus)

The project is wired to the **official Mantle Network MCP server** at
`https://docs.mantle.xyz/network/~gitbook/mcp`, which is the canonical
"AI Agent Skills" surface exposed by Mantle documentation.

`pnpm demo:agent-run` calls the Mantle MCP `searchDocumentation` tool for
every demo signal, picks the best matching docs page, and writes an
`evidence_added` event with `kind="mantle_relevance"`, `confidence="high"`,
and a real `sourceRef` URL like
`https://docs.mantle.xyz/network/for-developers/common-use-cases/moving-assets-and-data`.

The dashboard then surfaces that Mantle-docs citation inside the Evidence
Review section and appends a short reference line to the AI Research Note
thesis. A judge can verify the integration end-to-end by:

1. running `pnpm demo:agent-run`,
2. opening `/signals/signal_mantle_spcxx_demo01`,
3. seeing a new "Mantle docs: …" evidence card and a thesis ending with
   a real `docs.mantle.xyz/network/...` URL.

The Python client that talks to Mantle MCP lives in the Hermes skill
`web3/mantle-agent-skill/scripts/mantle_mcp_client.py` and is included as
a runtime dep of the agent loop (no API keys, no auth, no rate limits).

## Safety and Non-Goals

This repository is research-only:

- no wallet connection
- no private keys
- no transaction signing
- no buy/sell/trade controls
- no automated execution
- no Telegram live sender
- no cron jobs
- no direct mutation of production Hermes or Fast DEX runtime

The console does not provide financial advice. A signal is a research object for manual review, not an execution instruction.
