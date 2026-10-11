import { describe, expect, it } from "vitest";
import { initialState, press, view, type CalcState, type KeyId } from "../../src/engine";
import { inkFor } from "../../src/ui/Lcd";
import { SEGMENTS, segmentLit } from "../../src/ui/lcdIndicators";
import { screenText } from "../../src/ui/lcdSpeech";

const run = (...keys: KeyId[]) => keys.reduce<CalcState>((s, key) => press(s, key), initialState());

describe("LCD", () => {
  it("darkens the dots monotonically over the 16 contrast levels", () => {
    let prev = -1;
    for (let c = 0; c <= 15; c++) {
      const { rgb, alpha } = inkFor(c);
      const darkness = alpha * (255 * 3 - rgb[0] - rgb[1] - rgb[2]);
      expect(darkness).toBeGreaterThan(prev);
      prev = darkness;
    }
    expect(inkFor(8).rgb).toEqual([0x4b, 0x52, 0x72]);
    expect(inkFor(-3)).toEqual(inkFor(0));
    expect(inkFor(99)).toEqual(inkFor(15));
  });

  it("has a segment for every indicator, and GRAD shares DEG's G", () => {
    const all = new Set(SEGMENTS.flatMap((s) => s.lit));
    for (const i of ["2nd", "hyp", "fix", "sci", "eng", "k", "deg", "rad", "grad", "up", "down", "busy", "l1", "l2", "l3"] as const) {
      expect(all.has(i), i).toBe(true);
    }
    const lit = (ind: "deg" | "rad" | "grad") => SEGMENTS.filter((s) => segmentLit(s, new Set([ind]))).map((s) => s.id);
    expect(lit("deg")).toEqual(["deg-de", "deg-g"]);
    expect(lit("rad")).toEqual(["rad"]);
    expect(lit("grad")).toEqual(["deg-g", "rad"]);
    // segments never overlap
    const spans = [...SEGMENTS].sort((a, b) => a.x0 - b.x0);
    for (let i = 1; i < spans.length; i++) expect(spans[i]!.x0, spans[i]!.id).toBeGreaterThanOrEqual(spans[i - 1]!.x1);
  });

  it("reads the screen as text", () => {
    expect(screenText(view(initialState()))).toBe("");
    expect(screenText(view(run("1", "2", "ADD", "3")))).toBe("12+3");
    expect(screenText(view(run("2ND")))).toBe("2nd");
    expect(screenText({ ...view(initialState()), on: false })).toBe("Off");
  });
});
