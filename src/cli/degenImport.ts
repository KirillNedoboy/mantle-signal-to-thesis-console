import fs from "node:fs";
import path from "node:path";
import { importFastDexJsonl } from "../importers/fastDexJsonlImporter";
import { appendEvents } from "../store/eventStore";
import { DEFAULT_EVENT_STORE_PATH } from "../store/paths";

/**
 * `pnpm degen:import` — ingest the latest Fast DEX Radar alerts.
 *
 *   pnpm degen:import                                  # latest alerts/YYYY-MM-DD.jsonl
 *   pnpm degen:import -- --input <path>                # explicit JSONL file
 *   pnpm degen:import -- --input <path> --append        # append to existing store
 *
 * By default the store is reset (Mantle demo + degen) so the demo signal list
 * for hackathon judges is preserved, and the new import is written after.
 * Use --append to add to the existing store instead.
 */

type Args = {
  input?: string;
  append: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { append: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--input" && argv[i + 1]) {
      args.input = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--append") {
      args.append = true;
    }
  }
  return args;
}

function findLatestAlertsFile(): string | null {
  const alertsDir = "/root/obsidian-vault/Projects/Degen/fast-dex-radar/alerts";
  if (!fs.existsSync(alertsDir)) return null;
  const files = fs
    .readdirSync(alertsDir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(name))
    .map((name) => ({ name, path: path.join(alertsDir, name) }))
    .sort((a, b) => b.name.localeCompare(a.name));
  return files[0]?.path ?? null;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const input = args.input ?? findLatestAlertsFile();

  if (!input) {
    console.error(
      "Usage: pnpm degen:import -- --input <path>\nNo file provided and no default alerts file found.",
    );
    process.exit(1);
  }
  if (!fs.existsSync(input)) {
    console.error(`Input file not found: ${input}`);
    process.exit(1);
  }

  const events = importFastDexJsonl(input);

  if (!args.append) {
    fs.mkdirSync(path.dirname(DEFAULT_EVENT_STORE_PATH), { recursive: true });
    // Backup the existing store once before overwriting so the demo can be re-seeded.
    if (fs.existsSync(DEFAULT_EVENT_STORE_PATH)) {
      const backup =
        DEFAULT_EVENT_STORE_PATH + `.bak.${new Date().toISOString().replace(/[:.]/g, "-")}`;
      fs.copyFileSync(DEFAULT_EVENT_STORE_PATH, backup);
      console.log(`Backed up existing store -> ${backup}`);
    }
    fs.writeFileSync(DEFAULT_EVENT_STORE_PATH, "", "utf8");
  }

  const results = appendEvents(DEFAULT_EVENT_STORE_PATH, events);
  const appended = results.filter((item) => item.appended).length;
  const skipped = results.length - appended;
  console.log(
    `Degen import complete: events=${results.length}, appended=${appended}, skipped_duplicates=${skipped}, source=${input}`,
  );
}

main();
