import Link from "next/link";
import { DegenSignalTable } from "../../components/DegenSignalTable";
import { loadDashboardState } from "../../src/dashboard/loadState";

type SearchParams = Promise<{
  chain?: string;
  category?: string;
  bucket?: string;
  minScore?: string;
  blocker?: string;
}>;

const CHAIN_OPTIONS = ["base", "solana", "mantle", "ethereum", "other"] as const;
const CATEGORY_OPTIONS = ["FAST_ALERT", "SCOUT_PREVIEW"] as const;
const BUCKET_OPTIONS = ["HIGH", "MEDIUM", "LOW", "SCOUT"] as const;

export default async function DegenPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const state = loadDashboardState();
  const filters = await searchParams;

  const all = state.signals.filter((item) => item.signal.source === "fast_dex");

  // Stats
  const total = all.length;
  const fastAlerts = all.filter((item) => item.signal.category === "FAST_ALERT").length;
  const highPriority = all.filter(
    (item) =>
      (item.evidence.find((e) => e.title === "Priority bucket")?.value ?? "").includes("HIGH"),
  ).length;
  const buyBlockers = all.filter((item) =>
    (item.latestScore?.riskFlags ?? []).includes("not_a_buy_signal"),
  ).length;

  // Filtering
  const filtered = all.filter((item) => {
    if (filters.chain && filters.chain !== "all" && item.signal.chain !== filters.chain) {
      return false;
    }
    if (filters.category && filters.category !== "all" && item.signal.category !== filters.category) {
      return false;
    }
    if (filters.bucket && filters.bucket !== "all") {
      const bucket =
        item.evidence
          .find((e) => e.title === "Priority bucket")
          ?.value?.replace(/^Priority:\s*/, "")
          .split(" ")[0] ?? "";
      if (bucket !== filters.bucket) return false;
    }
    if (filters.minScore) {
      const min = Number(filters.minScore);
      if (Number.isFinite(min) && (item.latestScore?.score ?? 0) < min) return false;
    }
    if (filters.blocker === "yes") {
      if (!(item.latestScore?.riskFlags ?? []).includes("not_a_buy_signal")) return false;
    }
    if (filters.blocker === "no") {
      if ((item.latestScore?.riskFlags ?? []).includes("not_a_buy_signal")) return false;
    }
    return true;
  });

  return (
    <div className="operator-layout">
      <aside className="sidebar-panel">
        <div>
          <span className="eyebrow">Degen radar</span>
          <h1>Fast DEX Radar</h1>
          <p className="muted">
            Только research-only. Скоринг по V3-фильтрам + Fast DEX Radar priority.
            Решения принимаешь ты — дашборд только фиксирует факты.
          </p>
        </div>
        <div className="sidebar-stat">
          <span>Всего сигналов</span>
          <strong>{total}</strong>
        </div>
        <div className="sidebar-stat">
          <span>FAST_ALERT</span>
          <strong>{fastAlerts}</strong>
        </div>
        <div className="sidebar-stat">
          <span>HIGH priority</span>
          <strong>{highPriority}</strong>
        </div>
        <div className="sidebar-stat">
          <span>Buy-blocker</span>
          <strong>{buyBlockers}</strong>
        </div>
        <div className="safety-callout">
          <strong>Не сигнал на покупку</strong>
          <span>Этот дашборд фиксирует то, что нашёл cron. Сделку ты решаешь сам.</span>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <Link className="text-link" href="/">
            ← Mantle Console
          </Link>
          <Link className="text-link" href="/signals">
            Signal Inbox
          </Link>
        </div>
      </aside>

      <section className="stack">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Degen console</span>
            <h2>Сигналы из Fast DEX Radar ({filtered.length} из {total})</h2>
          </div>
        </div>

        <form className="card degen-filters" method="get">
          <div className="degen-filters-grid">
            <FilterField label="Chain">
              <select name="chain" defaultValue={filters.chain ?? "all"}>
                <option value="all">Все</option>
                {CHAIN_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Category">
              <select name="category" defaultValue={filters.category ?? "all"}>
                <option value="all">Все</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Priority bucket">
              <select name="bucket" defaultValue={filters.bucket ?? "all"}>
                <option value="all">Все</option>
                {BUCKET_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Min score">
              <select name="minScore" defaultValue={filters.minScore ?? ""}>
                <option value="">Любой</option>
                <option value="50">≥ 50</option>
                <option value="65">≥ 65</option>
                <option value="80">≥ 80</option>
              </select>
            </FilterField>
            <FilterField label="Buy-blocker">
              <select name="blocker" defaultValue={filters.blocker ?? "all"}>
                <option value="all">Любой</option>
                <option value="yes">Только blocker</option>
                <option value="no">Без blocker</option>
              </select>
            </FilterField>
            <div className="degen-filters-actions">
              <button type="submit" className="button">
                Применить
              </button>
              <Link className="text-link" href="/degen">
                Сбросить
              </Link>
            </div>
          </div>
        </form>

        <DegenSignalTable signals={filtered} />
      </section>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="degen-filter-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
