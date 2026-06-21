import { buildDemoEvents } from "../demo/demoEvents";
import { appendEvents } from "../store/eventStore";
import { DEFAULT_EVENT_STORE_PATH } from "../store/paths";

const results = appendEvents(DEFAULT_EVENT_STORE_PATH, buildDemoEvents());
const appended = results.filter((item) => item.appended).length;
const skipped = results.length - appended;

console.log(`Demo seed complete: appended=${appended}, skipped_duplicates=${skipped}`);
console.log(`Event store: ${DEFAULT_EVENT_STORE_PATH}`);
