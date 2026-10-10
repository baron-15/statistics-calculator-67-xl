import { afterEach, describe, expect, it, vi } from "vitest";
import { initialState, press, type CalcState } from "../../src/engine";
import {
  STORAGE_KEY, bigintReplacer, bigintReviver, deserializeState, loadState, saveState, serializeState,
} from "../../src/ui/persist";

function withExactValues(): CalcState {
  const s = initialState();
  s.ans = { re: 0.5, exact: { n: 1n, d: 2n, root: 1n, pi: false } };
  s.vars.x = { re: 1.4142135623731, exact: { n: -123456789012345678901234567890n, d: 7n, root: 2n, pi: true } };
  return s;
}

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bigint-safe JSON", () => {
  it("tags bigints and revives them, leaving everything else alone", () => {
    const value = { a: 12n, b: [-3n, 4], c: { d: "x", e: null, f: 0n }, g: { $bigint: "not a number" } };
    const text = JSON.stringify(value, bigintReplacer);
    expect(text).toContain('{"$bigint":"12"}');
    expect(JSON.parse(text, bigintReviver)).toEqual(value);
  });

  it("round-trips a calculator state with exact values", () => {
    const s = withExactValues();
    const back = deserializeState(serializeState(s));
    expect(back).toEqual(s);
    expect(typeof back!.vars.x.exact!.n).toBe("bigint");
    expect(back!.vars.x.exact!.n).toBe(-123456789012345678901234567890n);
  });

  it("round-trips a state after key presses", () => {
    let s = initialState();
    for (const k of ["1", "2", "ADD", "3", "2ND"] as const) s = press(s, k);
    expect(deserializeState(serializeState(s))).toEqual(s);
  });

  it("rejects unusable saved text", () => {
    expect(deserializeState(null)).toBeNull();
    expect(deserializeState("")).toBeNull();
    expect(deserializeState("{not json")).toBeNull();
    expect(deserializeState("[]")).toBeNull();
    expect(deserializeState(JSON.stringify({ ...initialState(), version: 2 }, bigintReplacer))).toBeNull();
  });

  it("fills fields missing from an older save with their defaults", () => {
    const { randSeed: _drop, ...partial } = initialState();
    void _drop;
    const back = deserializeState(JSON.stringify(partial, bigintReplacer));
    expect(back?.randSeed).toBe(initialState().randSeed);
  });
});

describe("localStorage", () => {
  it("saves and loads under ti30xs:state:v1", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("localStorage", storage);
    const s = withExactValues();
    saveState(s);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
    expect(STORAGE_KEY).toBe("ti30xs:state:v1");
    expect(loadState()).toEqual(s);
  });

  it("starts fresh when storage is missing, broken or full", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadState()).toEqual(initialState());
    expect(() => saveState(initialState())).not.toThrow();

    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(loadState()).toEqual(initialState());
    expect(() => saveState(initialState())).not.toThrow();

    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "garbage");
    vi.stubGlobal("localStorage", storage);
    expect(loadState()).toEqual(initialState());
  });
});
