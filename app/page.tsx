import { SignalTable } from "../components/SignalTable";
import { loadDashboardState } from "../src/dashboard/loadState";

export default function SignalsPage() {
  const state = loadDashboardState();
  return (
    <div className="stack">
      <div>
        <h1>Signal Inbox</h1>
        <p className="muted">Every row is derived from append-only agent events. The dashboard is not an execution surface.</p>
      </div>
      <SignalTable signals={state.signals} />
    </div>
  );
}
