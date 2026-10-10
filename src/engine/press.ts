/**
 * Top-level reducer: press(state, key) → state. Pure and deterministic.
 * Handles power and the 2nd prefix, then hands the resolved action to the apps router.
 */
import { routeAction } from "./apps";
import { resolveAction, type KeyId } from "./keys";
import type { CalcState } from "./state";

export function press(s: CalcState, key: KeyId): CalcState {
  if (!s.on) return key === "ON" ? routeAction({ ...s, on: true }, "ON") : s;
  if (key === "2ND") return { ...s, second: !s.second };
  const action = resolveAction(key, s.second);
  return routeAction({ ...s, second: false }, action);
}
