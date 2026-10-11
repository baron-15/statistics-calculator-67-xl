/** The Fractions & answer forms block: Ans in every form the calculator can switch it to. */
import { useMemo } from "react";
import type { CalcState } from "../../engine";
import { FractionStripChart } from "./charts";
import { answerFormsView } from "./fractionData";
import { FlashValue, Muted, Row, Rows, Subhead } from "./PanelCard";

export function FractionsBlock({ state }: { state: CalcState }) {
  const { ans, modes, history } = state;
  const v = useMemo(() => answerFormsView(state), [ans, modes, history]);
  return (
    <div className="space-y-1" data-testid="fractions-block">
      {v.last ? (
        <p className="text-sm" data-testid="fractions-last">
          <span className="text-[var(--muted)]">Last entry</span>{" "}
          <span className="num">
            {v.last.entry}
            {v.last.toggled ? " ◄►" : ""}
          </span>{" "}
          = <FlashValue value={v.last.result} />
        </p>
      ) : (
        <Muted>Type a fraction with n/d (▼ moves to the denominator, ► leaves it) and press enter.</Muted>
      )}
      <Subhead>Ans in every form</Subhead>
      <Rows>
        {v.forms.map((f) => (
          <Row key={f.id} label={f.label} hint={f.keys} value={f.text} current={f.id === "shown"} testId={`form-${f.id}`} />
        ))}
      </Rows>
      {v.classic && <p className="text-xs text-[var(--muted)]">Classic mode keeps fractions but shows √ and π results as decimals.</p>}
      {v.strip && (v.strip.part > 0 || v.strip.whole > 0) && (
        <>
          <Subhead>Picture</Subhead>
          <FractionStripChart strip={v.strip} label={v.forms[0]?.text ?? "Ans"} />
        </>
      )}
    </div>
  );
}
