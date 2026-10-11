import { describe, expect, it } from "vitest";
import { initialState, parseScript, press, runScript, type CalcState, type KeyId } from "../../src/engine";
import {
  FEATURES, featureInfo, featureTrigger, featuresInUse, parseFeature, rowFeatures, screenFeature, type FeatureId,
} from "../../src/ui/panels/featureContext";

/**
 * Run `setup`, then press the keys of `keys` one by one and return the trigger of the LAST press
 * (earlier presses of `keys`, such as 2nd, are part of the setup).
 */
function triggerOf(keys: string, setup = ""): FeatureId | null {
  const ks = parseScript(keys);
  let s = setup ? runScript(setup) : initialState();
  for (const k of ks.slice(0, -1)) s = press(s, k);
  const last = ks.at(-1) as KeyId;
  return featureTrigger(s, last, press(s, last));
}

/** The block after a whole keystroke script, starting from `start` (sticky: null keeps it). */
function follow(script: string, start: FeatureId | null = null): FeatureId | null {
  let s: CalcState = initialState();
  let f = start;
  for (const k of parseScript(script)) {
    const next = press(s, k);
    f = featureTrigger(s, k, next) ?? f;
    s = next;
  }
  return f;
}

describe("featureTrigger: screen openers", () => {
  it("data opens the data editor → Statistics", () => {
    expect(triggerOf("DATA")).toBe("stats");
  });

  it("2nd stat opens the STATS menu → Statistics (2nd resolved from the state before the press)", () => {
    expect(triggerOf("2ND DATA")).toBe("stats");
    expect(triggerOf("STAT")).toBe("stats");
  });

  it("table opens y= → Function table", () => {
    expect(triggerOf("TABLE")).toBe("table");
  });

  it("prb opens the PRB menu → Probability", () => {
    expect(triggerOf("PRB")).toBe("probability");
  });

  it("2nd angle opens the angle menu → Angles & trig", () => {
    expect(triggerOf("2ND PRB")).toBe("angles");
  });

  it("openers work from other screens: table from the data editor, data from the mode screen", () => {
    expect(triggerOf("TABLE", "DATA")).toBe("table");
    expect(triggerOf("DATA", "MODE")).toBe("stats");
    expect(triggerOf("PRB", "TABLE")).toBe("probability");
  });

  it("data inside the data editor opens its CLEAR/FORMULA menu: still Statistics", () => {
    expect(triggerOf("DATA", "DATA")).toBe("stats");
  });

  it("an opener that does nothing on its screen switches nothing (prb on the Auto table has no entry)", () => {
    const s = runScript("TABLE ENTER DOWN DOWN DOWN ENTER");
    expect(s.app.kind).toBe("tableView");
    expect(press(s, "PRB").app).toBe(s.app);
    expect(featureTrigger(s, "PRB", press(s, "PRB"))).toBeNull();
    const second = press(s, "2ND"); // 2nd angle
    expect(featureTrigger(second, "PRB", press(second, "PRB"))).toBeNull();
  });

  it("an opener on an error screen switches nothing", () => {
    const s = runScript("1 ÷ 0 ENTER");
    expect(s.app.kind).toBe("error");
    expect(featureTrigger(s, "DATA", press(s, "DATA"))).toBeNull();
  });
});

describe("featureTrigger: Home-only keys", () => {
  it.each([
    ["n/d", "FRAC"],
    ["2nd U n/d", "2ND FRAC"],
    ["2nd n/d◂▸Un/d", "2ND EE"],
    ["2nd f◂▸d", "2ND TABLE"],
    ["◂▸", "TOGGLE"],
    ["2nd %", "2ND LPAREN"],
    ["2nd ▸%", "2ND RPAREN"],
  ])("%s on Home → Fractions", (_name, keys) => {
    expect(triggerOf(keys, "3 ENTER")).toBe("fractions");
  });

  it.each([
    ["sin", "SIN"],
    ["cos", "COS"],
    ["tan", "TAN"],
    ["2nd sin⁻¹", "2ND SIN"],
    ["2nd cos⁻¹", "2ND COS"],
    ["2nd tan⁻¹", "2ND TAN"],
  ])("%s on Home → Angles & trig", (_name, keys) => {
    expect(triggerOf(keys)).toBe("angles");
  });

  it("after 2nd hyp a trig key is hyperbolic: no change", () => {
    expect(triggerOf("2ND PI SIN")).toBeNull();
    expect(triggerOf("2ND PI 2ND COS")).toBeNull();
  });

  it("on the MEMORY CLEARED screen keys act on Home, so they switch", () => {
    const s = runScript("2ND 0 2");
    expect(s.app.kind).toBe("message");
    expect(featureTrigger(s, "FRAC", press(s, "FRAC"))).toBe("fractions");
  });

  it("fraction and trig keys inside the data editor or the table do not switch", () => {
    expect(triggerOf("FRAC", "DATA 1")).toBeNull();
    expect(triggerOf("SIN", "TABLE")).toBeNull();
    expect(triggerOf("TOGGLE", "TABLE")).toBeNull();
    expect(triggerOf("2ND TABLE", "DATA")).toBeNull(); // 2nd f◂▸d in the editor
  });
});

describe("featureTrigger: no change", () => {
  it.each([
    "5", "ADD", "MULTIPLY", "ENTER", "CLEAR", "DELETE", "UP", "DOWN", "LEFT", "RIGHT", "MODE", "STO", "VAR",
    "LOG", "LN", "SQUARE", "RECIP", "POWER", "PI", "EE", "NEG", "LPAREN", "DOT",
  ])("%s on Home", (key) => {
    expect(triggerOf(key, "2 ENTER")).toBeNull();
  });

  it.each([
    ["2nd itself", "2ND"],
    ["2nd quit", "2ND MODE"],
    ["2nd recall", "2ND STO"],
    ["2nd clear var", "2ND VAR"],
    ["2nd K", "2ND DIVIDE"],
    ["2nd reset", "2ND 0"],
    ["2nd √", "2ND SQUARE"],
    ["2nd hyp", "2ND PI"],
    ["2nd ans", "2ND NEG"],
  ])("%s", (_name, keys) => {
    expect(triggerOf(keys, "2 ENTER")).toBeNull();
  });

  it("nothing switches while the calculator is off", () => {
    const off = runScript("2ND ON");
    expect(off.on).toBe(false);
    expect(featureTrigger(off, "DATA", press(off, "DATA"))).toBeNull();
    expect(featureTrigger(off, "ON", press(off, "ON"))).toBeNull();
  });
});

describe("stickiness", () => {
  it("keeps the last feature until another trigger", () => {
    expect(follow("DATA 5 ENTER 6 ENTER 2ND MODE 1 + 2 ENTER")).toBe("stats");
    expect(follow("TABLE CLEAR 2ND MODE PRB 1")).toBe("probability");
    expect(follow("DATA 2ND MODE 1 n/d 2 ENTER")).toBe("fractions");
    expect(follow("1 n/d 2 ENTER TABLE")).toBe("table");
  });

  it("starts from the remembered feature and keeps it on plain arithmetic", () => {
    expect(follow("1 + 2 ENTER", "angles")).toBe("angles");
    expect(follow("1 + 2 ENTER")).toBeNull();
  });

  it("returning from a paste menu to its screen does not switch back", () => {
    // prb from the table's y= editor, then pick nPr: the paste lands in y=, the block stays on Probability
    expect(follow("TABLE CLEAR PRB 1")).toBe("probability");
  });
});

describe("screenFeature and featuresInUse", () => {
  it("maps every feature screen", () => {
    expect(screenFeature(runScript("DATA").app)).toBe("stats");
    expect(screenFeature(runScript("DATA DATA").app)).toBe("stats");
    expect(screenFeature(runScript("2ND STAT").app)).toBe("stats");
    expect(screenFeature(runScript("2ND STAT 1").app)).toBe("stats");
    expect(screenFeature(runScript("TABLE").app)).toBe("table");
    expect(screenFeature(runScript("TABLE ENTER").app)).toBe("table");
    expect(screenFeature(runScript("TABLE ENTER DOWN DOWN DOWN ENTER").app)).toBe("table");
    expect(screenFeature(runScript("PRB").app)).toBe("probability");
    expect(screenFeature(runScript("2ND PRB").app)).toBe("angles");
    expect(screenFeature(runScript("2ND STO").app)).toBeNull(); // recall
    expect(screenFeature(runScript("MODE").app)).toBeNull();
    expect(screenFeature(initialState().app)).toBeNull();
  });

  it("an error screen counts as the screen that raised it", () => {
    // 2-Var stats with no data: STAT error raised by the setup screen
    const s = runScript("2ND STAT 2 DOWN DOWN ENTER");
    expect(s.app.kind).toBe("error");
    expect(screenFeature(s.app)).toBe("stats");
  });

  it("on Home the entry decides", () => {
    expect([...featuresInUse(runScript("1 n/d 2"))]).toEqual(["fractions"]);
    expect([...featuresInUse(runScript("8 PRB 1 3"))]).toEqual(["probability"]);
    expect([...featuresInUse(runScript("SIN 30"))]).toEqual(["angles"]);
    expect([...featuresInUse(runScript("SIN 1 n/d 2"))].sort()).toEqual(["angles", "fractions"]);
    expect([...featuresInUse(runScript("1 + 2"))]).toEqual([]);
    expect([...featuresInUse(runScript("1 n/d 2 ENTER"))]).toEqual([]);
  });

  it("is empty while off", () => {
    expect(featuresInUse(runScript("DATA 2ND ON")).size).toBe(0);
  });

  it("rowFeatures looks inside templates", () => {
    const s = runScript("2ND SQUARE SIN 4 5");
    expect(rowFeatures(s.editor.row).has("angles")).toBe(true);
  });
});

describe("feature ids", () => {
  it("parses stored values strictly", () => {
    for (const f of FEATURES) expect(parseFeature(f.id)).toBe(f.id);
    expect(parseFeature("tvm")).toBeNull();
    expect(parseFeature(null)).toBeNull();
    expect(parseFeature(3)).toBeNull();
  });

  it("has a title for every id", () => {
    expect(featureInfo("fractions").title).toBe("Fractions & answer forms");
  });
});
