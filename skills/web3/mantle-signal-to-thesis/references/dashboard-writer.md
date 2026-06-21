# Dashboard Writer Reference

The agent must not modify dashboard files directly.

Correct flow:

```txt
agent -> AgentEvent -> append-only JSONL -> materializer -> dashboard
```

Bad flow:

```txt
agent -> direct React component edit
agent -> direct HTML patch
agent -> destructive DB update
```

## Required properties

- append-only
- deterministic event IDs where possible
- duplicate event IDs are idempotent
- invalid event rejected
- errors are explicit
