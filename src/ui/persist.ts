/**
 * Continuous memory: the calculator state survives reloads in localStorage, like the real unit's
 * memory survives power-off. CalcState is JSON-like except for bigints (exact values, n/d/root),
 * which JSON cannot carry: they are written as {"$bigint": "123"} and revived on load.
 * Every storage access is guarded: private windows, blocked storage and quota errors fall back to a
 * fresh state, never an exception.
 */
import { initialState, press, view, type CalcState } from "../engine";
import { renderView } from "../display/render";

export const STORAGE_KEY = "ti30xs:state:v1";

const TAG = "$bigint";

/** JSON.stringify replacer: bigint → {"$bigint": "<decimal>"}. */
export function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? { [TAG]: value.toString() } : value;
}

/** JSON.parse reviver: {"$bigint": "<decimal>"} → bigint. */
export function bigintReviver(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value);
    const tagged = (value as Record<string, unknown>)[TAG];
    if (keys.length === 1 && typeof tagged === "string" && /^-?\d+$/.test(tagged)) return BigInt(tagged);
  }
  return value;
}

export function serializeState(s: CalcState): string {
  return JSON.stringify(s, bigintReplacer);
}

/**
 * Parse a saved state. Returns null when the text is not a usable v1 state: unparsable, the wrong
 * version, or a shape the current engine cannot run (it is smoke-tested by rendering it and pressing
 * a harmless key, so a state saved by an older build can never crash the page).
 */
export function deserializeState(text: string | null | undefined): CalcState | null {
  if (!text) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text, bigintReviver);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || (parsed as { version?: unknown }).version !== 1) return null;
  // Fields added since the state was saved take their defaults.
  const s = { ...initialState(), ...(parsed as Partial<CalcState>) } as CalcState;
  try {
    renderView(view(s), { blinkOn: true });
    press(s, "2ND");
  } catch {
    return null;
  }
  return s;
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadState(): CalcState {
  try {
    return deserializeState(storage()?.getItem(STORAGE_KEY)) ?? initialState();
  } catch {
    return initialState();
  }
}

export function saveState(s: CalcState): void {
  try {
    storage()?.setItem(STORAGE_KEY, serializeState(s));
  } catch {
    /* storage full or unavailable: memory lasts for this page view */
  }
}
