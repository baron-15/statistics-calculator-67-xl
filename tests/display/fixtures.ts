/**
 * Golden LCD fixtures: tests/fixtures/lcd_dumps.txt holds 182 TI-SmartView captures as 96 × 31
 * "#"/"." grids, each headed `== NAME.bmp  indicators: DEG UP …`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MATRIX_H, MATRIX_W } from "../../src/display/metrics";

export interface Fixture {
  name: string;
  /** 31 strings of 96 "#"/"." characters */
  rows: string[];
  /** indicator labels as captured, e.g. ["DEG", "UP", "[L1]"] */
  indicators: string[];
}

let cache: Map<string, Fixture> | null = null;

function load(): Map<string, Fixture> {
  if (cache) return cache;
  const here = dirname(fileURLToPath(import.meta.url));
  const text = readFileSync(join(here, "../fixtures/lcd_dumps.txt"), "utf8");
  const out = new Map<string, Fixture>();
  for (const block of text.split(/^== /m).slice(1)) {
    const lines = block.split("\n");
    const head = /^(\S+?)\.(?:bmp|png)\s+indicators:(.*)$/.exec(lines[0] ?? "");
    if (!head) throw new Error(`bad fixture header: ${lines[0]}`);
    const name = head[1] ?? "";
    // two header rows of column numbers, then 31 rows "NN  <96 chars>"
    const rows = lines.slice(3, 3 + MATRIX_H).map((l) => l.slice(4, 4 + MATRIX_W));
    if (rows.length !== MATRIX_H || rows.some((r) => r.length !== MATRIX_W)) throw new Error(`bad fixture grid: ${name}`);
    const indicators = (head[2] ?? "").trim().split(/\s+/).filter(Boolean);
    out.set(name, { name, rows, indicators });
  }
  cache = out;
  return out;
}

/** A capture by name, without the .bmp/.png extension (e.g. "GS_order06"). */
export function parseFixture(name: string): Fixture {
  const f = load().get(name);
  if (!f) throw new Error(`no fixture named ${name}`);
  return f;
}

/** All fixture names in file order. */
export const fixtureNames = (): string[] => [...load().keys()];
