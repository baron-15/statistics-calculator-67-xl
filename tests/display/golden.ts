/** Shared runner for the golden test files: one test per capture, minority captures as it.fails. */
import { describe, expect, it } from "vitest";
import type { View } from "../../src/engine/screen";
import { compareWithCapture } from "./build";

export interface Case {
  name: string;
  /** what the capture shows */
  what: string;
  view: (ind: View["indicators"]) => View;
  /** capture is a minority / older-firmware variant: expected to differ, with the reason */
  fails?: string;
  blinkOn?: boolean;
}

function check(c: Case): void {
  const d = compareWithCapture(c.name, c.view, c.blinkOn ?? true);
  expect(d.indicatorsOk, "indicators pass through").toBe(true);
  expect(d.count, `${c.name}: ${c.what}\n${d.text}`).toBe(0);
}

export function suite(title: string, cases: Case[]): void {
  describe(title, () => {
    for (const c of cases) {
      if (c.fails) it.fails(`${c.name} (minority capture: ${c.fails})`, () => check(c));
      else it(`${c.name}: ${c.what}`, () => check(c));
    }
  });
}

