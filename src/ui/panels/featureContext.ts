/**
 * The smart feature block: which feature a key press switches the block to, and which features the
 * calculator is inside right now (the "In use" badge). Pure functions over engine states, unit
 * tested in tests/ui/featureContext.test.ts. The rules are worked out in
 * docs/research/feature-blocks.md (trigger table).
 *
 * - Screen openers switch from any screen, but only when the press really opened the feature's
 *   screen: data and 2nd stat → Statistics; table → Function table; prb → Probability; 2nd angle →
 *   Angles & trig. (prb on a screen without an entry does nothing, so it switches nothing.)
 * - Inline keys switch only on the Home screen: the fraction keys (n/d, U n/d, n/d◂▸Un/d, f◂▸d, ◂▸,
 *   %, ▸%) → Fractions; sin cos tan and their inverses → Angles, except after 2nd hyp (hyperbolic
 *   functions ignore the angle mode). In the data editor or the table those keys are part of the
 *   work in progress (`1/4` as a data value, `y=sin(x)`), so the block stays where it is.
 * - Every other key (digits, operators, arrows, enter, 2nd itself, mode, sto▸, …) is "no change":
 *   the block is sticky.
 */
import type { CalcState, KeyId, Node, Row } from "../../engine";
import type { AppState } from "../../engine/apps";
import type { SymId } from "../../engine/expr";
import { resolveAction, type Action } from "../../engine/keys";

export type FeatureId = "stats" | "table" | "fractions" | "probability" | "angles";

export interface FeatureInfo {
  id: FeatureId;
  /** the block title */
  title: string;
  /** the selector label */
  label: string;
}

export const FEATURES: readonly FeatureInfo[] = [
  { id: "stats", title: "Statistics & data", label: "Statistics" },
  { id: "table", title: "Function table", label: "Table" },
  { id: "fractions", title: "Fractions & answer forms", label: "Fractions" },
  { id: "probability", title: "Probability", label: "Probability" },
  { id: "angles", title: "Angles & trig", label: "Angles" },
];

const IDS: ReadonlySet<string> = new Set(FEATURES.map((f) => f.id));

/** A stored or untrusted string as a feature id, or null. */
export function parseFeature(value: unknown): FeatureId | null {
  return typeof value === "string" && IDS.has(value) ? (value as FeatureId) : null;
}

export function featureInfo(id: FeatureId): FeatureInfo {
  return FEATURES.find((f) => f.id === id) ?? FEATURES[0]!;
}

/** The feature a screen belongs to. An error screen counts as the screen that raised it. */
export function screenFeature(app: AppState): FeatureId | null {
  const a = app.kind === "error" ? app.back : app;
  switch (a.kind) {
    case "data":
    case "statWizard":
      return "stats";
    case "tableFunc":
    case "tableSetup":
    case "tableView":
      return "table";
    case "menu":
      switch (a.id) {
        case "stats":
        case "statVars":
        case "dataMenu":
        case "listNames":
          return "stats";
        case "prb":
          return "probability";
        case "angle":
          return "angles";
        default:
          return null;
      }
    default:
      return null;
  }
}

/** Keys (2nd resolved) that open a feature's screen. */
const OPENERS: Partial<Record<Action, FeatureId>> = {
  DATA: "stats",
  STAT: "stats",
  TABLE: "table",
  PRB: "probability",
  ANGLE: "angles",
};

/** Keys that switch only when pressed on the Home screen. */
const HOME_KEYS: Partial<Record<Action, FeatureId>> = {
  FRAC: "fractions",
  MIXED: "fractions",
  FRAC_CONV: "fractions",
  F_D: "fractions",
  TOGGLE: "fractions",
  PERCENT: "fractions",
  TO_PERCENT: "fractions",
  SIN: "angles",
  COS: "angles",
  TAN: "angles",
  ASIN: "angles",
  ACOS: "angles",
  ATAN: "angles",
};

/** Home, or the MEMORY CLEARED message (whose keys act on Home). */
const onHome = (s: CalcState): boolean => s.app.kind === "home" || s.app.kind === "message";

/**
 * The feature this press switches the block to, or null for "no change". `before` and `after` are
 * the states around `press(before, key)`.
 */
export function featureTrigger(before: CalcState, key: KeyId, after: CalcState): FeatureId | null {
  if (!before.on || !after.on || key === "2ND") return null;
  const action = resolveAction(key, before.second);
  const opens = OPENERS[action];
  if (opens) return after.app !== before.app && screenFeature(after.app) === opens ? opens : null;
  const inline = HOME_KEYS[action];
  if (!inline || !onHome(before)) return null;
  if (inline === "angles" && before.hyp) return null;
  return inline;
}

// ------------------------------------------------------------------------------------------------
// "In use"

const FRACTION_SYMS: ReadonlySet<SymId> = new Set<SymId>(["fracbar", "mixsep", "toFD", "toFracMixed", "percent", "toPercent", "toggle"]);
const PROBABILITY_SYMS: ReadonlySet<SymId> = new Set<SymId>(["nPr", "nCr", "fact", "rand", "randint"]);
const ANGLE_SYMS: ReadonlySet<SymId> = new Set<SymId>([
  "sin", "cos", "tan", "asin", "acos", "atan", "deg", "min", "sec", "radian", "grad", "toDMS", "RPr", "RPth", "PRx", "PRy",
]);

function visit(row: Row, fn: (n: Node) => void): void {
  for (const n of row) {
    fn(n);
    for (const child of Object.values(n)) if (Array.isArray(child)) visit(child as Row, fn);
  }
}

/** The features an entry row uses: fractions, prb functions, trig and angle units. */
export function rowFeatures(row: Row): Set<FeatureId> {
  const out = new Set<FeatureId>();
  visit(row, (n) => {
    if (n.t === "frac" || n.t === "mixed") out.add("fractions");
    if (n.t !== "sym") return;
    if (FRACTION_SYMS.has(n.s)) out.add("fractions");
    if (PROBABILITY_SYMS.has(n.s)) out.add("probability");
    if (ANGLE_SYMS.has(n.s)) out.add("angles");
  });
  return out;
}

/** The features the calculator is inside right now: its screen's, or on Home those of the entry. */
export function featuresInUse(s: CalcState): Set<FeatureId> {
  if (!s.on) return new Set();
  const f = screenFeature(s.app);
  if (f) return new Set([f]);
  return s.app.kind === "home" ? rowFeatures(s.editor.row) : new Set();
}
