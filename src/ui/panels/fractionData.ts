/**
 * Data for the Fractions & answer forms block: the last answer (Ans) in every form the calculator can
 * switch it to, with the engine's own formatting and recognition:
 * - as shown: the Home result form in the current modes;
 * - fraction a/b and mixed number U n/d (exact rationals, or a decimal that f◂▸d would convert);
 * - decimal (◂▸ / f◂▸d), percent (▸%), the exact √ or π form when one matches all 13 digits;
 * - the 13-digit value Ans keeps.
 */
import type { CalcState } from "../../engine";
import { isRational } from "../../engine/math/exact";
import { answerRow, decimalRow, exactRow, formatResult, recognize } from "../../engine/math/format";
import type { Exact, Modes, Value } from "../../engine/math";
import { readableRow } from "./text";

export interface AnswerForm {
  id: "shown" | "fraction" | "mixed" | "decimal" | "percent" | "exact" | "stored";
  label: string;
  text: string;
  /** the keys that give this form */
  keys: string;
}

export interface FractionStrip {
  neg: boolean;
  /** whole units */
  whole: number;
  /** the fractional part: num/den when den ≤ 12, else a proportion `part` with den 0 */
  num: number;
  den: number;
  part: number;
}

export interface AnswerFormsView {
  forms: AnswerForm[];
  strip: FractionStrip | null;
  last: { entry: string; result: string; toggled: boolean } | null;
  /** Classic mode shows no √ or π forms */
  classic: boolean;
}

const MP: Modes = { angle: "DEG", notation: "NORM", decimals: "FLOAT", display: "MATHPRINT" };

const text = (fn: () => string): string | null => {
  try {
    return fn();
  } catch {
    return null;
  }
};

/** The exact rational of a value: its own, or the fraction f◂▸d finds for a decimal (d ≤ 1000). */
export function rationalOf(v: Value): Exact | null {
  const e = v.exact;
  if (e) return isRational(e) ? e : null;
  if (Number.isInteger(v.re)) return null;
  const r = recognize(v.re, false);
  return r?.exact && isRational(r.exact) ? r.exact : null;
}

/** The exact √ or π form of a value: its own, or the one ◂▸ finds in MathPrint. */
export function irrationalOf(v: Value): Exact | null {
  const e = v.exact;
  if (e) return e.root !== 1n || e.pi ? e : null;
  if (Number.isInteger(v.re)) return null;
  const r = recognize(v.re, true);
  return r?.exact && (r.exact.root !== 1n || r.exact.pi) ? r.exact : null;
}

export function answerForms(ans: Value, modes: Modes): AnswerForm[] {
  const forms: AnswerForm[] = [];
  const add = (id: AnswerForm["id"], label: string, t: string | null, keys: string) => {
    if (t) forms.push({ id, label, text: t, keys });
  };
  add("shown", "As shown", text(() => readableRow(formatResult(ans, modes))), "enter");
  const q = rationalOf(ans);
  if (q && q.d !== 1n) {
    add("fraction", "Fraction", text(() => readableRow(exactRow(q, MP))), "2nd f◂▸d");
    const a = q.n < 0n ? -q.n : q.n;
    if (a > q.d) add("mixed", "Mixed number", text(() => readableRow(exactRow(q, MP, true))), "2nd n/d◂▸Un/d");
  }
  const irr = irrationalOf(ans);
  if (irr) add("exact", modes.display === "CLASSIC" ? "Exact (MathPrint)" : "Exact", text(() => readableRow(exactRow(irr, MP))), "◂▸");
  add("decimal", "Decimal", text(() => readableRow(decimalRow(ans.re, modes))), q || irr ? "◂▸ or 2nd f◂▸d" : "◂▸");
  add("percent", "Percent", text(() => readableRow(formatResult({ ...ans, form: "percent" }, modes))), "2nd ▸%");
  add("stored", "Ans holds", text(() => readableRow(answerRow({ re: ans.re }, modes))), "2nd ans");
  // an integer's decimal reads exactly like "As shown"
  const shown = forms[0]?.text;
  return forms.filter((f) => f.id !== "decimal" || f.text !== shown);
}

export function fractionStrip(v: Value): FractionStrip | null {
  if (!Number.isFinite(v.re)) return null;
  const neg = v.re < 0;
  const q = rationalOf(v);
  if (q) {
    const a = q.n < 0n ? -q.n : q.n;
    const whole = Number(a / q.d);
    const rem = Number(a % q.d);
    const d = Number(q.d);
    if (d <= 12) return { neg, whole, num: rem, den: rem === 0 ? 1 : d, part: rem / d };
    return { neg, whole, num: rem, den: 0, part: rem / d };
  }
  const x = Math.abs(v.re);
  const whole = Math.floor(x);
  return { neg, whole, num: 0, den: 0, part: x - whole };
}

export function answerFormsView(s: CalcState): AnswerFormsView {
  const lastRec = s.history.at(-1);
  return {
    forms: answerForms(s.ans, s.modes),
    strip: fractionStrip(s.ans),
    last: lastRec ? { entry: readableRow(lastRec.entry), result: readableRow(lastRec.result), toggled: !!lastRec.toggled } : null,
    classic: s.modes.display === "CLASSIC",
  };
}
