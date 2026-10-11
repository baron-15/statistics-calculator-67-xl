import { buildView } from "./apps";
import type { View } from "./screen";
import type { CalcState } from "./state";

/** What the display shows for a state. */
export const view = (s: CalcState): View => buildView(s);
