/**
 * How each symbol reads on screen, as glyph text for fonts.ts. Mostly SYMS[s]; the overrides are
 * glyph distinctions that the canonical text does not carry:
 * - the memory variables x, y, z use the MathPrint variable glyphs (`15→ẋ`, `y=ẋ(36-ẋ)`; GS_mem02,
 *   MT_functable01), while stat names (Sx, minX, x′) use plain letters (MF_stats1var05);
 * - ÷ is drawn ÷ (`Ans÷4`, GS_mem09), matching SYMS.div;
 * - the constant e has its own glyph (MF_log04), distinct from the letter e.
 */
import { SYMS, type Node, type Row, type SymId } from "../engine/expr";

const OVERRIDES: Partial<Record<SymId, string>> = {
  x: "ẋ",
  y: "ẏ",
  z: "ż",
  div: "÷",
  e: "ℯ",
  ePow: "ℯ^(",
};

export const symText = (s: SymId): string => OVERRIDES[s] ?? SYMS[s];

/** Symbols that make up a plain number (no parentheses needed around it in Classic form). */
const NUMBER_SYMS = new Set<SymId>(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "neg", "E"]);

const isNumber = (r: Row): boolean => r.every((n) => n.t === "sym" && NUMBER_SYMS.has(n.s));

/** A slot in Classic form: parenthesized unless it is a single node or a plain number. */
const group = (r: Row): string => (r.length <= 1 || isNumber(r) ? classicRowText(r) : `(${classicRowText(r)})`);

/**
 * Classic (linear) form of a node: `3⁄4`, `1⌴7⁄12`, `2^5`, `√(2)`, `3ˣ√64`, `1.2345*10^4`
 * (D §3, GS_modeclass* captures). The Classic editor inserts only symbols; this covers 2-D nodes
 * that reach a Classic screen anyway (results, pasted history).
 */
export function classicText(n: Node): string {
  switch (n.t) {
    case "sym": return symText(n.s);
    case "frac": return `${group(n.num)}⁄${group(n.den)}`;
    case "mixed": return `${classicRowText(n.whole)}⌴${group(n.num)}⁄${group(n.den)}`;
    case "pow": return `^${group(n.exp)}`;
    case "sqrt": return `√(${classicRowText(n.rad)})`;
    case "root": return `${group(n.index)}ˣ√${group(n.rad)}`;
    case "ee": return `*10^${classicRowText(n.exp)}`;
  }
}

export const classicRowText = (r: Row): string => r.map(classicText).join("");
