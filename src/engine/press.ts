/**
 * Top-level reducer: press(state, key) → state. Pure and deterministic.
 * Handles power and the 2nd prefix, then hands the resolved action to the apps router.
 */
import { onClearReset, powerOn, routeAction } from "./apps";
import { resolveAction, type KeyId } from "./keys";
import type { CalcState } from "./state";

export function press(s: CalcState, key: KeyId): CalcState {
  // off: only on works, and it returns to a blank Home screen with history kept (K §6)
  if (!s.on) return key === "ON" ? powerOn(s) : s;
  if (key === "2ND") return { ...s, second: !s.second };
  const action = resolveAction(key, s.second);
  return routeAction({ ...s, second: false }, action);
}

/**
 * on and clear pressed together: the hardware reset. It works on or off and clears memory at once,
 * with no menu or message (TG p.29, A-5). The UI calls this when both keys are held.
 */
export function pressOnClear(s: CalcState): CalcState {
  return onClearReset(s);
}
