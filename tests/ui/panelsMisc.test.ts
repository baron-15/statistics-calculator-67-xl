import { afterEach, describe, expect, it, vi } from "vitest";
import { initialState, parseScript, runScript } from "../../src/engine";
import { linear, niceDomain, niceTicks, tickLabel } from "../../src/ui/panels/chartScale";
import { historyView, memoryView, modeView, storeTarget } from "../../src/ui/panels/memoryData";
import { reducer } from "../../src/ui/useCalculator";
import { readSwitch, writeSwitch } from "../../src/ui/useStoredSwitch";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chart scales", () => {
  it("maps linearly, and a zero-width domain to the middle", () => {
    const x = linear([0, 10], [100, 200]);
    expect(x(0)).toBe(100);
    expect(x(5)).toBe(150);
    expect(linear([3, 3], [0, 50])(3)).toBe(25);
  });

  it("makes round ticks on a 1-2-5 step", () => {
    expect(niceTicks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(53, 97, 6)).toEqual([55, 60, 65, 70, 75, 80, 85, 90, 95]);
    expect(niceTicks(53, 97, 4)).toEqual([60, 70, 80, 90]);
    expect(niceTicks(0.1, 0.5, 4)).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(niceTicks(-576, 324, 4)).toEqual([-400, -200, 0, 200]);
    expect(niceTicks(5, 5)).toEqual([5]);
    expect(niceTicks(Number.NaN, 1)).toEqual([]);
  });

  it("widens a domain to whole ticks", () => {
    expect(niceDomain(53, 97, 6)).toEqual([50, 100]);
    expect(niceDomain(1, 6, 5)).toEqual([1, 6]);
    expect(niceDomain(0, 0)).toEqual([-1, 1]);
    expect(niceDomain(-0.35, 0.3, 4)).toEqual([-0.4, 0.4]);
  });

  it("labels ticks briefly with a true minus", () => {
    expect(tickLabel(-200)).toBe("−200");
    expect(tickLabel(20000)).toBe("20k");
    expect(tickLabel(0.30000000000000004)).toBe("0.3");
    expect(tickLabel(2e7)).toBe("2e7");
  });
});

describe("Memory block data", () => {
  it("shows the variables, Ans and K as the Home screen would", () => {
    const s = runScript("1 n/d 2 RIGHT STO VAR ENTER 2ND DIVIDE MULTIPLY 2 + 3 ENTER");
    const v = memoryView(s);
    expect(v.vars.find((x) => x.name === "x")?.text).toBe("1/2");
    expect(v.vars.find((x) => x.name === "y")?.text).toBe("0");
    expect(v.ans).toBe("1/2");
    expect(v.k).toEqual({ text: "×2+3", on: true, editing: false });
  });

  it("highlights the variable after sto▸, in 2nd recall, and K while it is edited", () => {
    expect(storeTarget(runScript("5 STO"))).toBe("");
    expect(storeTarget(runScript("5 STO VAR VAR"))).toBe("y");
    expect(storeTarget(runScript("5"))).toBeNull();
    expect(memoryView(runScript("5 STO VAR"))).toMatchObject({ current: "x", activity: "sto► x" });
    expect(memoryView(runScript("5 STO"))).toMatchObject({ current: null, activity: "sto►: press x yzt abc for the variable" });
    expect(memoryView(runScript("2ND STO DOWN DOWN"))).toMatchObject({ current: "z", activity: "recall: pick a variable" });
    expect(memoryView(runScript("2ND VAR")).activity).toBe("clear var: Yes sets x–c to 0");
    expect(memoryView(runScript("2ND DIVIDE SQUARE"))).toMatchObject({ current: "k", k: { text: "²", editing: true } });
    expect(memoryView(initialState())).toMatchObject({ current: null, activity: null, k: null });
  });
});

describe("Mode block data", () => {
  it("marks the current settings and the mode screen's cursor", () => {
    expect(modeView(initialState())).toEqual({
      rows: [
        { label: "Angle", options: ["DEG", "RAD", "GRAD"], selected: 0 },
        { label: "Notation", options: ["NORM", "SCI", "ENG"], selected: 0 },
        { label: "Decimals", options: ["FLOAT", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], selected: 0 },
        { label: "Display", options: ["CLASSIC", "MATHPRINT"], selected: 1 },
      ],
      cursor: null,
    });
    const s = runScript("MODE DOWN DOWN RIGHT RIGHT RIGHT ENTER");
    const v = modeView(s);
    expect(v.rows[2]!.selected).toBe(3); // FIX 2
    expect(v.cursor).toEqual({ row: 2, col: 3 });
  });
});

describe("History block data", () => {
  it("lists newest first, with ◂▸ lines and the line being browsed", () => {
    const s = runScript("1 n/d 8 ENTER TOGGLE 2 MULTIPLY 3 ENTER UP UP UP");
    const h = historyView(s);
    expect(h.map((x) => `${x.entry}${x.toggled ? " ◄►" : ""} = ${x.result}`)).toEqual(["2×3 = 6", "1/8 ◄► = 0.125", "1/8 = 1/8"]);
    expect(h.find((x) => x.selected)?.line).toBe(1);
    expect(historyView(initialState())).toEqual([]);
  });
});

describe("the calculator reducer notes feature triggers", () => {
  const run = (script: string) =>
    parseScript(script).reduce((st, key) => reducer(st, { type: "press", key }), {
      state: initialState(),
      trigger: null as ReturnType<typeof reducer>["trigger"],
    });

  it("keeps the latest trigger and counts every one", () => {
    const a = run("DATA 5 ENTER");
    expect(a.trigger).toEqual({ feature: "stats", seq: 1 });
    const b = run("DATA 2ND MODE TABLE CLEAR CLEAR DATA");
    expect(b.trigger).toEqual({ feature: "stats", seq: 3 });
    expect(run("1 + 2 ENTER").trigger).toBeNull();
  });

  it("returns the same store for a press that changes nothing", () => {
    const off = run("2ND ON");
    expect(reducer(off, { type: "press", key: "5" })).toBe(off);
  });
});

describe("stored switches", () => {
  it("reads and writes on / off with a fallback", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) });
    expect(readSwitch("ti30xs:calcOnly")).toBe(false);
    writeSwitch("ti30xs:calcOnly", true);
    expect(data.get("ti30xs:calcOnly")).toBe("on");
    expect(readSwitch("ti30xs:calcOnly")).toBe(true);
    data.set("ti30xs:calcOnly", "garbage");
    expect(readSwitch("ti30xs:calcOnly", true)).toBe(true);
  });

  it("never throws when storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readSwitch("ti30xs:calcOnly")).toBe(false);
    expect(() => writeSwitch("ti30xs:calcOnly", true)).not.toThrow();
  });
});
