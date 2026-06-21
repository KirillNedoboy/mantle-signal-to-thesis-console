import { importFastDexJsonl } from "../importers/fastDexJsonlImporter";
import { appendEvents } from "../store/eventStore";
import { DEFAULT_EVENT_STORE_PATH } from "../store/paths";

const inputIndex = process.argv.indexOf("--input");
const input = inputIndex >= 0 ? process.argv[inputIndex + 1] : undefined;

if (!input) {
  console.error("Usage: pnpm import:fastdex -- --input ./path/to/file.jsonl");
  process.exit(1);
}

const events = importFastDexJsonl(input);
const results = appendEvents(DEFAULT_EVENT_STORE_PATH, events);
console.log(`Fast DEX import complete: events=${events.length}, appended=${results.filter((item) => item.appended).length}, skipped_duplicates=${results.filter((item) => !item.appended).length}`);
