export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "bad" }) {
  const cls = tone === "default" ? "badge" : `badge ${tone}`;
  return <span className={cls}>{children}</span>;
}
