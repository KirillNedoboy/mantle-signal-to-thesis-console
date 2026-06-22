import { SignalTable } from "../components/SignalTable";
import { loadDashboardState } from "../src/dashboard/loadState";
import Link from "next/link";

export default function SignalsPage() {
  const state = loadDashboardState();
  const reviewed = state.signals.filter((item) => item.decisions.length > 0).length;
  const riskFlags = new Set(state.signals.flatMap((item) => item.latestScore?.riskFlags ?? []));

  return (
    <div className="stack page-stack">
      <section className="hero console-hero">
        <div className="eyebrow">Mantle research operations console</div>
        <h1>Turn noisy Web3 signals into a reviewable thesis trail.</h1>
        <p>
          A watch-only intelligence workspace for judging raw scanner output,
          collecting evidence, surfacing risk flags, drafting research notes,
          and preserving human decisions.
        </p>
        <div className="flow" aria-label="Research workflow">
          <span>raw signal</span>
          <span>evidence</span>
          <span>risk flags</span>
          <span>thesis</span>
          <span>human decision</span>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/signals">Open Signal Inbox</Link>
          <span className="safety-label">Research console only. Not a buy/sell/execution system.</span>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Console status">
        <div className="metric-card">
          <span>Total signals</span>
          <strong>{state.counts.totalSignals}</strong>
          <small>Materialized from append-only events</small>
        </div>
        <div className="metric-card">
          <span>Human decisions</span>
          <strong>{reviewed}</strong>
          <small>Review trail retained per signal</small>
        </div>
        <div className="metric-card">
          <span>Risk flags</span>
          <strong>{riskFlags.size}</strong>
          <small>Missing data is treated as risk</small>
        </div>
        <div className="metric-card">
          <span>Escalated</span>
          <strong>{state.counts.escalated}</strong>
          <small>Still research, never execution</small>
        </div>
      </section>

      <section className="value-grid">
        <div className="card value-card">
          <span className="card-kicker">01</span>
          <h3>Signal Inbox</h3>
          <p className="muted">Operator-first triage for scanner, scout, and research findings.</p>
        </div>
        <div className="card value-card">
          <span className="card-kicker">02</span>
          <h3>Evidence Trail</h3>
          <p className="muted">Each signal keeps the evidence that explains why it surfaced.</p>
        </div>
        <div className="card value-card">
          <span className="card-kicker">03</span>
          <h3>Risk-First Thesis</h3>
          <p className="muted">Agent notes lead with uncertainty, missing data, and Mantle relevance.</p>
        </div>
        <div className="card value-card">
          <span className="card-kicker">04</span>
          <h3>Human Decision Log</h3>
          <p className="muted">Final calls remain human-confirmed and audit-friendly.</p>
        </div>
      </section>

      <section className="console-preview card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Latest materialized state</span>
            <h2>Signal Inbox</h2>
          </div>
          <Link className="text-link" href="/signals">View full console</Link>
        </div>
        <SignalTable signals={state.signals.slice(0, 3)} />
      </section>
    </div>
  );
}
