/** The Probability block: the prb calculation written out with the user's numbers. */
import type { CalcState } from "../../engine";
import { FlashValue, Muted, Row, Rows } from "./PanelCard";
import { probabilityView, type ProbKind } from "./probabilityData";

const MEANING: Record<ProbKind, string> = {
  nPr: "Permutations: the number of ordered arrangements of r items taken from n.",
  nCr: "Combinations: the number of ways to choose r items from n when order does not matter.",
  fact: "Factorial: the number of ways to put n items in order. n is a whole number from 0 to 69.",
  rand: "A random number between 0 and 1, every value equally likely. Store a whole number to rand (5 sto► prb ► 1 enter) to restart the same sequence.",
  randint: "A random integer from A to B, each equally likely. Separate A and B with 2nd , (comma).",
};

const TITLE: Record<ProbKind, string> = { nPr: "nPr", nCr: "nCr", fact: "n!", rand: "rand", randint: "randint" };

export function ProbabilityBlock({ state }: { state: CalcState }) {
  const v = probabilityView(state);
  const c = v.calc;
  if (!c) {
    return (
      <div data-testid="probability-block">
        <Muted>
          Press prb: nPr, nCr and ! on the PRB tab, rand and randint( on RAND (►). For example 8 prb 1 3 enter gives 8 nPr 3. This block writes the
          calculation out with your numbers.
        </Muted>
      </div>
    );
  }
  const chain = [c.expr, c.formula, c.steps, c.result ?? (c.error ? `${c.error} error` : null)].filter((t): t is string => !!t);
  return (
    <div className="space-y-2" data-testid="probability-block">
      <p className="text-xs text-[var(--muted)]">
        {v.source === "entry" ? "Typing" : "Last calculation"}: <span className="num">{v.entry}</span>
      </p>
      <p className="panel-equation" data-testid="probability-equation" aria-label={`${TITLE[c.kind]}: ${chain.join(" = ")}`}>
        {chain.map((t, i) => (
          <span key={i}>
            {i > 0 && <span className="text-[var(--muted)]"> = </span>}
            {i === chain.length - 1 && i > 0 ? <FlashValue value={t} className="font-semibold" /> : <span className="num">{t}</span>}
          </span>
        ))}
      </p>
      <p className="text-sm">{MEANING[c.kind]}</p>
      {(c.chance || c.range) && (
        <Rows>
          {c.range && <Row label="Possible values" value={`${c.range.lo} … ${c.range.hi} (${c.range.count})`} />}
          {c.chance && <Row label={c.kind === "randint" ? "Chance" : "One particular outcome"} value={c.chance} testId="probability-chance" />}
        </Rows>
      )}
    </div>
  );
}
