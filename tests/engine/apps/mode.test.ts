import { describe, expect, it } from "vitest";
import { canvas, entryText, gbHistory, indicators, initialState, run } from "./helpers";

const cursor = (script: string) => canvas(run(script)).cursor;

describe("mode screen navigation (K §2.2)", () => {
  it("opens with the cursor on DEG, whatever the angle mode (GB-055)", () => {
    expect(cursor("MODE")).toEqual({ x: 0, y: 0, w: 16, h: 6, style: "block" });
    expect(run("MODE RIGHT ENTER CLEAR MODE ENTER").modes.angle).toBe("DEG");
  });

  it("▼ keeps the column; ►► … land on the FIX digits (eG:MF_Angles)", () => {
    expect(cursor("MODE DOWN")).toEqual({ x: 0, y: 6, w: 21, h: 6, style: "block" });
    expect(cursor("MODE DOWN DOWN RIGHT RIGHT RIGHT")).toEqual({ x: 42, y: 12, w: 6, h: 6, style: "block" });
    expect(cursor("MODE RIGHT RIGHT DOWN")).toEqual({ x: 45, y: 6, w: 16, h: 6, style: "block" });
  });

  it("does not wrap: ◄ at the start, ► at the end, ▲ on the first row, ▼ on the last", () => {
    expect(cursor("MODE LEFT UP")).toEqual(cursor("MODE"));
    expect(cursor("MODE RIGHT×9")).toEqual({ x: 40, y: 0, w: 21, h: 6, style: "block" });
    expect(cursor("MODE DOWN×9 RIGHT×3")).toEqual({ x: 40, y: 18, w: 46, h: 6, style: "block" });
  });

  it("moving alone changes nothing; enter selects", () => {
    expect(run("MODE RIGHT CLEAR").modes.angle).toBe("DEG");
    expect(run("MODE RIGHT ENTER").modes.angle).toBe("RAD");
    expect(run("MODE RIGHT RIGHT ENTER").modes.angle).toBe("GRAD");
    expect(run("MODE DOWN RIGHT RIGHT ENTER").modes.notation).toBe("ENG");
    expect(run("MODE DOWN DOWN RIGHT×10 ENTER").modes.decimals).toBe(9);
    expect(run("MODE DOWN DOWN RIGHT ENTER LEFT ENTER").modes.decimals).toBe("FLOAT");
  });

  it("lights FIX, SCI, ENG and the angle unit", () => {
    expect(indicators(run("MODE DOWN DOWN RIGHT ENTER"))).toEqual(["fix", "deg"]);
    expect(indicators(run("MODE DOWN RIGHT ENTER"))).toEqual(["sci", "deg"]);
    expect(indicators(run("MODE DOWN RIGHT RIGHT ENTER RIGHT RIGHT UP ENTER"))).toEqual(["eng", "grad"]);
  });

  it("clear returns to Home with the history on screen; 2nd quit blanks it", () => {
    const s = run("MODE RIGHT ENTER CLEAR", gbHistory());
    expect(s.app).toEqual({ kind: "home", selected: null });
    expect(s.firstShown).toBe(0);
    expect(run("MODE QUIT", gbHistory()).firstShown).toBe(4);
  });

  it("CLASSIC ↔ MATHPRINT clears history, the pending entry and K; reselecting does nothing", () => {
    const from = { ...run("12 +", gbHistory()), apps: { ...initialState().apps, constant: { row: [], on: true } } };
    const s = run("MODE DOWN×3 LEFT ENTER", from);
    expect(s.modes.display).toBe("CLASSIC");
    expect(s.history).toEqual([]);
    expect(entryText(s)).toBe("");
    expect(s.apps.constant).toBeNull();
    const same = run("MODE DOWN×3 RIGHT ENTER", from);
    expect(same.history).toHaveLength(4);
    expect(entryText(same)).toBe("12+");
  });

  it("other app keys open their screens from the mode screen", () => {
    expect(run("MODE DATA").app.kind).toBe("data");
    expect(run("MODE STAT").app).toMatchObject({ kind: "menu", id: "stats" });
  });
});
