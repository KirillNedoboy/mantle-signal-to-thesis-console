import { notFound } from "next/navigation";
import Link from "next/link";
import { loadDashboardState } from "../../../src/dashboard/loadState";
import { Badge } from "../../../components/Badge";
import { RiskFlags } from "../../../components/RiskFlags";

export default async function DegenSignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = loadDashboardState();
  const item = state.signals.find((signal) => signal.signal.id === id);
  if (!item) return notFound();

  const score = item.latestScore;
  const ev = (title: string) =>
    item.evidence.find((e) => e.title === title)?.value;
  const obsidianPaths = ev("Obsidian paths");
  const dedupeKey = ev("Dedupe key");
  const blockReason = ev("Live block reason");
  const liveEligible = !blockReason;

  const ageValue = ev("Pair age");
  const priorityValue = ev("Priority bucket");
  const fdv = ev("FDV (USD)");
  const liq = ev("Liquidity (USD)");
  const vol = ev("24h volume (USD)");
  const vl = ev("Volume / Liquidity");
  const reasons = ev("Alert reasons");

  return (
    <div className="stack page-stack">
      <Link className="text-link" href="/degen">
        ← К списку деген-сигналов
      </Link>

      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="row">
            <Badge>{item.signal.chain}</Badge>
            <Badge tone={item.signal.category === "FAST_ALERT" ? "warn" : "default"}>
              {item.signal.category}
            </Badge>
            {priorityValue ? (
              <Badge tone={priorityValue.includes("HIGH") ? "good" : "default"}>
                {priorityValue.replace(/^Priority:\s*/, "")}
              </Badge>
            ) : null}
            {!liveEligible ? <Badge tone="bad">live-blocked</Badge> : null}
          </div>
          <h1>
            {item.signal.name}{" "}
            <span className="muted degen-symbol">{item.signal.symbol ?? ""}</span>
          </h1>
          <p className="muted">
            detected {new Date(item.signal.detectedAt).toLocaleString()} · source:{" "}
            {item.signal.source}
          </p>
        </div>
        <div className="detail-hero-side">
          <span className="eyebrow">Degen-режим</span>
          <strong>Research only</strong>
          <p className="muted">
            Это алерт из Fast DEX Radar. Решения по сделкам принимаешь ты сам — дашборд
            не сигнал на покупку.
          </p>
        </div>
      </section>

      <section className="summary-grid">
        <Metric label="Score" value={score ? `${score.score}/100` : "—"} />
        <Metric
          label="Priority"
          value={priorityValue?.replace(/^Priority:\s*/, "") ?? "—"}
        />
        <Metric label="FDV" value={fdv?.replace(/^FDV:\s*/, "") ?? "—"} />
        <Metric label="Liquidity" value={liq?.replace(/^Liquidity:\s*/, "") ?? "—"} />
        <Metric label="24h Volume" value={vol?.replace(/^Volume 24h:\s*/, "") ?? "—"} />
        <Metric label="V/L" value={vl?.replace(/^V\/L:\s*/, "") ?? "—"} />
        <Metric label="Age" value={ageValue?.replace(/^Age:\s*/, "") ?? "—"} />
        <Metric
          label="Confidence"
          value={score ? `${Math.round(score.confidence * 100)}%` : "—"}
        />
      </section>

      <section className="detail-grid">
        <div className="stack">
          <Panel eyebrow="Сырые цифры" title="Evidence">
            <div className="evidence-list">
              {item.evidence.map((e) => (
                <div key={e.id} className="evidence-item">
                  <span className="eyebrow">{e.title}</span>
                  <p>{e.value}</p>
                  <small className="muted">confidence: {e.confidence}</small>
                </div>
              ))}
            </div>
          </Panel>

          {reasons ? (
            <Panel eyebrow="Fast DEX Radar" title="Почему в алерте">
              <p className="note">{reasons}</p>
              {blockReason ? (
                <p className="muted">
                  <strong>Live-block reason:</strong> {blockReason}
                </p>
              ) : null}
            </Panel>
          ) : null}

          {obsidianPaths ? (
            <Panel eyebrow="Obsidian" title="Связанные файлы">
              <ul className="muted" style={{ paddingLeft: 18 }}>
                {obsidianPaths.split(" | ").map((line, idx) => (
                  <li key={idx}>
                    <code>{line}</code>
                  </li>
                ))}
              </ul>
              <p className="muted">
                Эти файлы уже лежат в твоём Obsidian-хранилище. Открой их через{" "}
                <code>obsidian://</code> или через Syncthing.
              </p>
            </Panel>
          ) : null}
        </div>

        <div className="stack">
          <Panel eyebrow="Скоринг" title="Score breakdown">
            <p>
              <strong>{score?.score ?? "—"}</strong> / 100
            </p>
            {score ? (
              <ul className="muted" style={{ paddingLeft: 18 }}>
                {score.reasons.slice(0, 8).map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            ) : null}
          </Panel>

          <Panel eyebrow="V3-фильтры" title="Risk flags">
            <RiskFlags score={item.latestScore} />
          </Panel>

          {dedupeKey ? (
            <Panel eyebrow="Stable ID" title="Dedupe key">
              <code style={{ wordBreak: "break-all" }}>{dedupeKey}</code>
              <p className="muted">
                Используется Fast DEX Radar, чтобы один и тот же токен не сыпался
                повторно в стрим алертов.
              </p>
            </Panel>
          ) : null}

          <Panel eyebrow="Что делать" title="Next step">
            <p className="muted">
              Открой DexScreener-пару, проверь top-10 холдеров, ликвидность, и
              сравни с замечаниями из Obsidian-отчёта. Никаких авто-ордеров.
            </p>
            {item.signal.contractAddress ? (
              <p>
                Contract: <code>{item.signal.contractAddress}</code>
              </p>
            ) : null}
            {item.signal.pairAddress ? (
              <p>
                Pair: <code>{item.signal.pairAddress}</code>
              </p>
            ) : null}
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card panel-card">
      <div className="panel-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
