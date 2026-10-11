/** The Statistics & data block: the lists, the setup, the last results and their charts. */
import { useMemo } from "react";
import type { CalcState } from "../../engine";
import { OneVarCharts, ScatterChart } from "./charts";
import { FlashValue, Muted, Row, Rows, Subhead } from "./PanelCard";
import { chartData, chartSetup, listsView, regressionText, resultsView, setupText } from "./statsData";
import { numberText } from "./text";

export function StatsBlock({ state }: { state: CalcState }) {
  const lists = useMemo(() => listsView(state), [state]);
  const results = useMemo(() => resultsView(state), [state]);
  const setup = chartSetup(state);
  const chart = useMemo(() => chartData(state, chartSetup(state)), [state]);
  const wizardOpen = (state.app.kind === "error" ? state.app.back : state.app).kind === "statWizard";
  const shownRows = Math.max(lists.rows, lists.cursor ? lists.cursor.row + 1 : 0);

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-1 @3xl:grid-cols-[auto_minmax(0,1fr)]" data-testid="stats-block">
      <div className="min-w-0 space-y-1">
        <Subhead>Lists</Subhead>
        {shownRows === 0 ? (
          <Muted>The lists are empty. Press data, type a value and press enter; ► moves to the next list.</Muted>
        ) : (
          <div className="panel-scroll" data-testid="stats-lists">
            <table className="panel-table is-compact">
              <caption className="sr-only">Data lists L1, L2 and L3</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-right">
                    #
                  </th>
                  {lists.columns.map((c) => (
                    <th key={c.name} scope="col" className="text-right">
                      {c.name}
                      {c.formula && (
                        <span className="block font-normal normal-case tracking-normal" data-testid={`formula-${c.name}`}>
                          = {c.formula}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: shownRows }, (_, r) => (
                  <tr key={r}>
                    <th scope="row" className="text-right text-[var(--muted)]">
                      {r + 1}
                    </th>
                    {lists.columns.map((c, ci) => {
                      const cur = lists.cursor?.col === ci && lists.cursor.row === r;
                      return (
                        <td key={c.name} className={`text-right${cur ? " is-cell-current" : ""}`} aria-current={cur ? "true" : undefined}>
                          {c.values[r] !== undefined ? <FlashValue value={c.values[r]!} /> : cur ? <span className="num">&nbsp;</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <Subhead>Setup</Subhead>
        <p className={`text-sm${wizardOpen ? " panel-note-current" : ""}`} data-testid="stats-setup">
          {setupText(setup)}
          {!results && !wizardOpen && <span className="text-[var(--muted)]"> · 2nd stat to calculate</span>}
        </p>

        {results && (
          <>
            <Subhead>
              Results <span className="normal-case tracking-normal">· {results.title}</span>
            </Subhead>
            {results.stale && (
              <p className="panel-warning" data-testid="stats-stale">
                The lists changed after this calculation. Run 2nd stat again to update these results.
              </p>
            )}
            {results.regression && (
              <p className="text-sm" data-testid="stats-regression">
                <span className="font-medium">Line</span> <FlashValue value={results.regression.text} />
                {results.regression.r !== null && (
                  <>
                    {" "}
                    · <span className="font-medium">r</span> <FlashValue value={numberText(results.regression.r, state.modes)} />
                  </>
                )}
              </p>
            )}
            <Rows className="panel-results">
              {results.items.map((it) => (
                <Row key={it.key} label={it.label} value={it.text} current={results.selected === it.index} testId={`stat-${it.key}`} />
              ))}
            </Rows>
          </>
        )}
      </div>
      <div className="min-w-0 space-y-1 @3xl:col-span-2">
        <Subhead>{chart.kind === "2-Var" ? "Scatter plot" : "Distribution"}</Subhead>
        {chart.kind === "message" ? (
          <Muted>{chart.text}</Muted>
        ) : chart.kind === "1-Var" ? (
          <OneVarCharts list={chart.list} box={chart.box} bins={chart.bins} />
        ) : (
          <ScatterChart
            points={chart.points}
            line={chart.line}
            xList={chart.xList}
            yList={chart.yList}
            lineText={chart.line ? regressionText(chart.line.a, chart.line.b, state.modes) : null}
          />
        )}
      </div>
    </div>
  );
}
