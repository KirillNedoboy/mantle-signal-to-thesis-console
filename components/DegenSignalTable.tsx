import { SignalView } from "../src/store/materialize";
import { Badge } from "./Badge";
import Link from "next/link";

type Tone = "default" | "good" | "warn" | "bad";

type DegenSignalTableProps = {
  signals: SignalView[];
};

function findEvidence(item: SignalView, title: string): string | undefined {
  return item.evidence.find((e) => e.title === title)?.value;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/\$([\d,.]+)\s*([kKmM]?)/);
  if (!match) return null;
  const raw = parseFloat(match[1].replace(/,/g, ""));
  const mult = match[2]?.toLowerCase() === "m" ? 1_000_000 : match[2]?.toLowerCase() === "k" ? 1_000 : 1;
  return Number.isFinite(raw) ? raw * mult : null;
}

function parseRatio(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/([\d.]+)\s*x/);
  return match ? parseFloat(match[1]) : null;
}

function degenTone(score: number | undefined, hasBuyBlocker: boolean): Tone {
  if (hasBuyBlocker) return "bad";
  if (score == null) return "default";
  if (score >= 75) return "good";
  if (score >= 50) return "warn";
  return "default";
}

function priorityTone(bucket: string | undefined): Tone {
  if (bucket?.includes("HIGH")) return "good";
  if (bucket?.includes("MEDIUM")) return "warn";
  if (bucket?.includes("SCOUT")) return "default";
  return "default";
}

export function DegenSignalTable({ signals }: DegenSignalTableProps) {
  if (signals.length === 0) {
    return (
      <div className="card">
        <p className="muted">
          Нет деген-сигналов. Запусти <code>pnpm degen:import</code>, чтобы подтянуть
          последние алерты из Fast DEX Radar.
        </p>
      </div>
    );
  }

  return (
    <div className="signal-list">
      {signals.map((item) => {
        const fdv = parseNumber(findEvidence(item, "FDV (USD)"));
        const liq = parseNumber(findEvidence(item, "Liquidity (USD)"));
        const vol = parseNumber(findEvidence(item, "24h volume (USD)"));
        const vl = parseRatio(findEvidence(item, "Volume / Liquidity"));
        const priorityBucket =
          findEvidence(item, "Priority bucket")?.replace(/^Priority:\s*/, "").split(" ")[0] ?? undefined;
        const buyBlocker = (item.latestScore?.riskFlags ?? []).includes("not_a_buy_signal");
        const score = item.latestScore?.score;

        return (
          <Link
            className="signal-row degen-row"
            href={`/degen/${item.signal.id}`}
            key={item.signal.id}
          >
            <div className="signal-primary">
              <div className="row">
                <Badge tone={item.signal.chain === "base" ? "default" : "warn"}>
                  {item.signal.chain}
                </Badge>
                <Badge tone={item.signal.category === "FAST_ALERT" ? "warn" : "default"}>
                  {item.signal.category}
                </Badge>
                {priorityBucket ? (
                  <Badge tone={priorityTone(priorityBucket)}>{priorityBucket}</Badge>
                ) : null}
                {buyBlocker ? <Badge tone="bad">buy-blocker</Badge> : null}
              </div>
              <h3>
                {item.signal.name}{" "}
                <span className="muted degen-symbol">{item.signal.symbol ?? ""}</span>
              </h3>
              <p className="muted">
                detected {new Date(item.signal.detectedAt).toLocaleString()}
              </p>
            </div>

            <div className="signal-meta-grid degen-meta">
              <Meta label="FDV" value={fdv ? `$${abbr(fdv)}` : "—"} tone={degenTone(score, buyBlocker)} />
              <Meta label="Liquidity" value={liq ? `$${abbr(liq)}` : "—"} />
              <Meta label="Vol 24h" value={vol ? `$${abbr(vol)}` : "—"} />
              <Meta
                label="V/L"
                value={vl != null ? `${vl.toFixed(2)}x` : "—"}
                tone={vl != null && vl >= 2 ? "good" : vl != null && vl >= 1.5 ? "warn" : "default"}
              />
              <Meta
                label="Score"
                value={score != null ? `${score}/100` : "—"}
                tone={degenTone(score, buyBlocker)}
              />
              <Meta label="Evidence" value={`${item.evidence.length}`} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Meta({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong className={tone === "default" ? undefined : tone}>{value}</strong>
    </div>
  );
}

function abbr(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}
