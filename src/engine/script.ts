/**
 * Keystroke scripts for tests: "1 n/d 2 RIGHT + 1 n/d 3 ENTER", "2ND QUIT", "MODE DOWN RIGHT ENTER".
 * Tokens: key ids, SCRIPT_ALIASES, multi-digit numbers (expanded to digit keys), and 2nd functions by
 * name (QUIT, INSERT, ANS, SQRT, …), with or without a leading 2ND.
 */
import { ALL_KEYS, SCRIPT_ALIASES, type KeyId } from "./keys";
import { press } from "./press";
import { initialState, type CalcState } from "./state";

const KEY_IDS = new Set<string>(ALL_KEYS.map((k) => k.id));
const SECOND: Record<string, KeyId> = {};
for (const k of ALL_KEYS) if (k.second) SECOND[k.second.fn] = k.id;

export function parseScript(script: string): KeyId[] {
  const out: KeyId[] = [];
  for (const tok of script.trim().split(/\s+/).filter(Boolean)) {
    if (/^\d+$/.test(tok) || /^\d*\.\d+$/.test(tok)) {
      for (const ch of tok) out.push(ch === "." ? "DOT" : (ch as KeyId));
      continue;
    }
    if (KEY_IDS.has(tok)) { out.push(tok as KeyId); continue; }
    const alias = SCRIPT_ALIASES[tok];
    if (alias) { out.push(alias); continue; }
    const second = SECOND[tok];
    if (second) {
      if (out.at(-1) !== "2ND") out.push("2ND");
      out.push(second);
      continue;
    }
    throw new Error(`Unknown keystroke token: ${tok}`);
  }
  return out;
}

export function runScript(script: string, from: CalcState = initialState()): CalcState {
  return parseScript(script).reduce(press, from);
}
