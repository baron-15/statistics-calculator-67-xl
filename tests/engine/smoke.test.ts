import { describe, expect, it } from "vitest";
import { parseScript } from "../../src/engine";
import { homeText, initialState } from "../helpers/run";

describe("Phase 0 contracts", () => {
  it("parses keystroke scripts", () => {
    expect(parseScript("12 + 3 ENTER")).toEqual(["1", "2", "ADD", "3", "ENTER"]);
    expect(parseScript("2ND QUIT")).toEqual(["2ND", "MODE"]);
    expect(parseScript("SQRT 9")).toEqual(["2ND", "SQUARE", "9"]);
  });
  it("starts on an empty home screen", () => {
    expect(homeText(initialState())).toEqual([""]);
  });
});
