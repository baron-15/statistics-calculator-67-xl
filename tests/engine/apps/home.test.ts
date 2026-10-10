import { describe, expect, it } from "vitest";
import { view } from "../../../src/engine";
import { MAX_HISTORY, pushRecord } from "../../../src/engine/apps/home";
import { homeText } from "../../helpers/run";
import { canvas, entryText, gbHistory, indicators, initialState, rec, row, run, sym, textAt, withHistory } from "./helpers";

const homeScreen = (s: ReturnType<typeof run>) => {
  const v = view(s).screen;
  if (v.kind !== "home") throw new Error(`not home: ${v.kind}`);
  return v;
};

describe("entry editing through the router", () => {
  it("typing builds the entry; the cursor follows", () => {
    const s = run("1 + 2");
    expect(entryText(s)).toBe("1+2");
    expect(homeScreen(s).cursor).toEqual({ path: [], index: 3 });
    expect(homeScreen(s).cursorStyle).toBe("block");
  });

  it("2nd insert shows the insert cursor", () => {
    expect(homeScreen(run("12 LEFT INSERT")).cursorStyle).toBe("insert");
  });

  it("an operator first inserts Ans (K §4.4)", () => {
    expect(entryText(run("* 3"))).toBe("Ans*3");
  });
});

describe("history browsing (K §4.5)", () => {
  it("▲×4 on 1+1 … 4+4 lands on the entry 3+3 and enter pastes it (GB-016e)", () => {
    const s = run("UP×4", gbHistory());
    expect(homeScreen(s).selected).toEqual({ line: 2, part: "entry" });
    expect(homeScreen(s).cursor).toBeNull();
    const pasted = run("ENTER", s);
    expect(entryText(pasted)).toBe("3+3");
    expect(homeScreen(pasted).selected).toBeNull();
    expect(homeScreen(pasted).cursor).toEqual({ path: [], index: 3 });
  });

  it("▲ alternates result and entry, newest first", () => {
    const steps = [1, 2, 3, 4, 5].map((n) => homeScreen(run(`UP×${n}`, gbHistory())).selected);
    expect(steps).toEqual([
      { line: 3, part: "result" },
      { line: 3, part: "entry" },
      { line: 2, part: "result" },
      { line: 2, part: "entry" },
      { line: 1, part: "result" },
    ]);
  });

  it("▲ stops at the oldest entry; ▼ walks back down to the entry line", () => {
    expect(homeScreen(run("UP×20", gbHistory())).selected).toEqual({ line: 0, part: "entry" });
    expect(homeScreen(run("UP UP DOWN", gbHistory())).selected).toEqual({ line: 3, part: "result" });
    expect(homeScreen(run("UP DOWN", gbHistory())).selected).toBeNull();
  });

  it("2nd ▲ jumps to the newest entry, then to the oldest; 2nd ▼ returns to the entry line", () => {
    expect(homeScreen(run("TOP", gbHistory())).selected).toEqual({ line: 3, part: "entry" });
    expect(homeScreen(run("TOP TOP", gbHistory())).selected).toEqual({ line: 0, part: "entry" });
    expect(homeScreen(run("UP UP BOTTOM", gbHistory())).selected).toBeNull();
  });

  it("enter on a result pastes the result at the cursor of a pending entry", () => {
    expect(entryText(run("5 + UP ENTER", gbHistory()))).toBe("5+8");
  });

  it("pasting into a fraction slot after reaching history with 2nd ▲ (GB p.13)", () => {
    const s = run("FRAC 1 DOWN TOP ENTER", gbHistory());
    expect(s.editor.row).toEqual([{ t: "frac", num: row("1"), den: row("4", "add", "4") }]);
  });

  it("clear leaves the history without deleting anything", () => {
    const s = run("UP UP CLEAR", gbHistory());
    expect(homeScreen(s).selected).toBeNull();
    expect(s.history).toHaveLength(4);
  });

  it("another key leaves the history and acts on the entry", () => {
    const s = run("UP 7", gbHistory());
    expect(homeScreen(s).selected).toBeNull();
    expect(entryText(s)).toBe("7");
  });

  it("▲ with no history does nothing", () => {
    expect(homeScreen(run("UP")).selected).toBeNull();
  });

  it("a toggle line pastes its entry with the ◂▸ marker", () => {
    const s = { ...initialState(), history: [{ ...rec(row("2"), row("2")), toggled: true }] };
    expect(entryText(run("UP UP ENTER", s))).toBe("2◂▸");
  });

  it("browsing above the blanked part scrolls the line back into view", () => {
    const blank = run("CLEAR", gbHistory());
    expect(homeScreen(blank).firstShown).toBe(4);
    expect(homeScreen(run("UP×3", blank)).firstShown).toBe(2);
  });

  it("↑ while history exists above, ↓ while browsing", () => {
    expect(indicators(initialState())).toEqual(["deg"]);
    expect(indicators(gbHistory())).toEqual(["deg", "up"]);
    expect(indicators(run("UP", gbHistory()))).toEqual(["deg", "up", "down"]);
    expect(indicators(run("UP×8", gbHistory()))).toEqual(["deg", "down"]);
  });
});

describe("clear (K §4.3)", () => {
  it("inside the entry clears to the right: 21595 ◄◄ clear → 215 (TG p.43)", () => {
    expect(entryText(run("21595 LEFT LEFT CLEAR"))).toBe("215");
  });

  it("at the end empties the entry; the history stays on screen", () => {
    const s = run("123 CLEAR", gbHistory());
    expect(entryText(s)).toBe("");
    expect(s.firstShown).toBe(0);
  });

  it("on an empty entry blanks the screen; ▲ still reaches history", () => {
    const s = run("123 CLEAR CLEAR", gbHistory());
    expect(s.firstShown).toBe(4);
    expect(homeText(s)).toHaveLength(5);
    expect(homeScreen(run("UP", s)).selected).toEqual({ line: 3, part: "result" });
    expect(indicators(s)).toContain("up");
  });
});

describe("2nd quit, off and on", () => {
  it("2nd quit on Home drops the entry and blanks the screen", () => {
    const s = run("12 + QUIT", gbHistory());
    expect(entryText(s)).toBe("");
    expect(s.firstShown).toBe(4);
    expect(s.app).toEqual({ kind: "home", selected: null });
  });

  it("2nd off blanks the display; on returns to a blank Home screen with history kept", () => {
    const off = run("12 OFF", gbHistory());
    expect(off.on).toBe(false);
    expect(view(off).screen).toEqual({ kind: "blank" });
    expect(view(off).indicators).toEqual([]);
    expect(run("5", off)).toEqual(off);
    const on = run("ON", off);
    expect(on.on).toBe(true);
    expect(entryText(on)).toBe("");
    expect(on.history).toHaveLength(4);
    expect(on.firstShown).toBe(4);
    expect(indicators(on)).toEqual(["deg", "up"]);
  });

  it("on while on does nothing", () => {
    const s = run("12");
    expect(run("ON", s)).toEqual(s);
  });
});

describe("2nd hyp", () => {
  it("lights HYP until the next key; a trig key becomes hyperbolic", () => {
    const pending = run("HYP");
    expect(pending.hyp).toBe(true);
    expect(indicators(pending)).toContain("hyp");
    const s = run("SIN 5", pending);
    expect(entryText(s)).toBe("sinh(5");
    expect(s.hyp).toBe(false);
  });

  it("hyp then 2nd sin⁻¹ gives sinh⁻¹( (K §4.14)", () => {
    expect(entryText(run("HYP ASIN"))).toBe("sinh⁻¹(");
  });

  it("any other key cancels it", () => {
    const s = run("HYP 5 SIN");
    expect(entryText(s)).toBe("5sin(");
    expect(s.hyp).toBe(false);
  });

  it("2nd hyp twice cancels", () => {
    expect(run("HYP HYP").hyp).toBe(false);
  });
});

describe("sto▸ and the variable key (K §3.8, §1.3)", () => {
  it("15 sto▸ x builds 15→x", () => {
    expect(entryText(run("15 STO VAR"))).toBe("15→x");
  });

  it("sto▸ x x on an empty line gives Ans→y (GB-030a)", () => {
    expect(entryText(run("STO VAR VAR"))).toBe("Ans→y");
  });

  it("the variable key cycles x y z t a b c and wraps", () => {
    expect(entryText(run("VAR×4"))).toBe("t");
    expect(entryText(run("VAR×8"))).toBe("x");
  });

  it("a key handled by the router breaks the cycle", () => {
    const s = run("VAR PRB CLEAR VAR");
    expect(entryText(s)).toBe("xx");
  });
});

describe("contrast (2nd + darkens, 2nd − lightens, 0–15)", () => {
  it("steps and clamps", () => {
    expect(run("CONTRAST_DARKER").contrast).toBe(9);
    expect(run("CONTRAST_LIGHTER").contrast).toBe(7);
    expect(run("CONTRAST_DARKER×20").contrast).toBe(15);
    expect(run("CONTRAST_LIGHTER×20").contrast).toBe(0);
    expect(view(run("CONTRAST_DARKER×3")).contrast).toBe(11);
  });

  it("works on any screen without leaving it", () => {
    const s = run("MODE CONTRAST_DARKER");
    expect(s.app.kind).toBe("mode");
    expect(s.contrast).toBe(9);
  });
});

describe("the ◂▸ toggle after a result (K §4.16)", () => {
  const fresh = (ans: number) => ({
    ...withHistory([[row("2", "add", "3"), row("5")]]),
    ans: { re: ans, exact: { n: BigInt(ans), d: 1n, root: 1n, pi: false } },
  });

  it("right after a result it adds a history line `<answer>◂▸` without enter", () => {
    const s = run("TOGGLE", fresh(5));
    expect(s.history).toHaveLength(2);
    expect(s.history[1]).toMatchObject({ entry: row("5"), toggled: true });
    expect(homeText(s)[1]).toBe("5◂▸ = 5");
    expect(entryText(s)).toBe("");
  });

  it("each further press adds another line", () => {
    expect(run("TOGGLE TOGGLE", fresh(5)).history).toHaveLength(3);
  });

  it("on an empty entry it acts on the last result even after other keys (TG-43b: mode … clear ◂▸)", () => {
    const s = run("1 CLEAR TOGGLE", fresh(5));
    expect(s.history).toHaveLength(2);
    expect(homeText(s)[1]).toBe("5◂▸ = 5");
  });

  it("inside an entry it is typed, for enter to evaluate (GB-044)", () => {
    const s = run("1 + TOGGLE", fresh(5));
    expect(s.history).toHaveLength(1);
    expect(entryText(s)).toBe("1+◂▸");
  });
});

describe("errors", () => {
  it("an error opens the error screen; clear returns to the entry with the cursor at its end", () => {
    // "1+" is a syntax error for the real engine; the Phase 0 stub reports SYNTAX for everything
    const err = run("1 + LEFT ENTER");
    expect(err.app).toMatchObject({ kind: "error", error: "SYNTAX" });
    expect(textAt(err)).toEqual(["30,8:SYNTAX"]);
    expect(canvas(err).cursor).toBeUndefined();
    expect(run("5", err)).toEqual(err);
    const back = run("CLEAR", err);
    expect(back.app.kind).toBe("home");
    expect(entryText(back)).toBe("1+");
    expect(back.editor.cursor).toEqual({ path: [], index: 2 });
  });

  it("2nd quit leaves the error screen for a blank Home", () => {
    const s = run("1 + ENTER QUIT");
    expect(s.app.kind).toBe("home");
    expect(entryText(s)).toBe("");
  });
});

describe("history depth", () => {
  it(`keeps the newest ${MAX_HISTORY} records (SPEC: assumption) and shifts firstShown`, () => {
    let s = { ...initialState(), firstShown: 0 };
    for (let i = 0; i < MAX_HISTORY; i++) s = pushRecord(s, rec([sym("1")], [sym("1")]));
    s = { ...s, firstShown: MAX_HISTORY };
    s = pushRecord(s, rec(row("2"), row("2")));
    expect(s.history).toHaveLength(MAX_HISTORY);
    expect(s.history.at(-1)?.entry).toEqual(row("2"));
    expect(s.firstShown).toBe(MAX_HISTORY - 1);
  });
});
