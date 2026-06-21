import { readEvents } from "../store/eventStore";
import { materializeEvents } from "../store/materialize";
import { DEFAULT_EVENT_STORE_PATH } from "../store/paths";

export function loadDashboardState() {
  return materializeEvents(readEvents(DEFAULT_EVENT_STORE_PATH));
}
