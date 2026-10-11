/** The Function table block: f(x), the settings, a longer table than the LCD's, and a plot. */
import { useMemo } from "react";
import type { CalcState } from "../../engine";
import { FunctionChart } from "./charts";
import { screenFeature } from "./featureContext";
import { FlashValue, Muted, Row, Rows, Subhead } from "./PanelCard";
import { tableBlockView } from "./tableData";

export function TableBlock({ state }: { state: CalcState }) {
  // The table and its plot evaluate f(x) about 130 times, so they are recomputed only when one of
  // their inputs changes (engine states are immutable, so these references change exactly then).
  const { modes, vars, ans } = state;
  const { table, stat } = state.apps;
  const tableApp = screenFeature(state.app) === "table" ? state.app : null;
  const v = useMemo(() => tableBlockView(state), [table, modes, vars, ans, stat, tableApp]);
  const s = v.settings;

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-1 @2xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]" data-testid="table-block">
      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-medium">y =</span>{" "}
          {v.func ? <FlashValue value={v.func} className="text-[0.9375rem]" /> : <span className="text-[var(--muted)]">no function yet</span>}
          {v.live && <span className="panel-badge ml-2">typing</span>}
        </p>
        {!v.func && <Muted>Press table, enter a function of x (x is on the x yzt abc key), then press enter for Start and Step.</Muted>}

        <Rows className="panel-settings">
          <Row label="Start" value={s.start} current={s.field === 0} testId="table-start" />
          <Row label="Step" value={s.step} current={s.field === 1} testId="table-step" />
          <Row label="x values" value={s.ask ? "Ask-x (typed)" : "Auto"} current={s.field === 2} testId="table-mode" />
        </Rows>
      </div>

      {v.func && (
        <div className="space-y-1">
          <Subhead>Table</Subhead>
          {v.rows.length === 0 ? (
            <Muted>Ask-x: no x values yet. On the table screen, type an x and press enter.</Muted>
          ) : (
            <div className="panel-scroll panel-scroll-tall">
              <table className="panel-table is-compact" data-testid="table-rows">
                <caption className="sr-only">Values of y = {v.func}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="text-right normal-case">
                      x
                    </th>
                    <th scope="col" className="text-right normal-case">
                      y
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {v.rows.map((r) => (
                    <tr
                      key={r.index}
                      className={`${r.selected ? "is-current" : ""}${r.onLcd ? " is-lcd" : ""}`}
                      aria-current={r.selected ? "true" : undefined}
                    >
                      <th scope="row" className="text-right font-normal">
                        <span className="num">{r.xText}</span>
                      </th>
                      <td className="text-right">
                        <FlashValue value={r.yText} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {v.rows.some((r) => r.onLcd) && (
            <p className="text-xs text-[var(--muted)]">The rows with a bar are the three on the calculator's screen.</p>
          )}
        </div>
      )}
      {v.func && v.plot && v.plot.segments.length + v.plot.points.length > 0 && (
        <div className="@2xl:col-span-2">
          <Subhead>Plot</Subhead>
          <FunctionChart plot={v.plot} func={v.func} />
        </div>
      )}
    </div>
  );
}
