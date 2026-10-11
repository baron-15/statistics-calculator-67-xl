/** Always visible: the four mode settings, with the mode screen's cursor while it is open. */
import type { CalcState } from "../../engine";
import { modeView } from "./memoryData";
import { PanelCard } from "./PanelCard";

export function ModeBlock({ state }: { state: CalcState }) {
  const v = modeView(state);
  return (
    <PanelCard id="mode" title="Mode" active={v.cursor !== null} meta={v.cursor ? "mode screen open" : undefined}>
      <dl className="space-y-1">
        {v.rows.map((r, ri) => {
          const onRow = v.cursor?.row === ri;
          return (
            <div
              key={r.label}
              className={`panel-row mode-row${onRow ? " is-current" : ""}`}
              data-testid={`mode-${r.label.toLowerCase()}`}
              data-current={onRow ? "true" : undefined}
            >
              <dt className="w-[4.75rem] flex-none font-medium">{r.label}</dt>
              <dd className="flex min-w-0 flex-1 flex-wrap justify-end gap-0.5">
                <span className="sr-only">{r.options[r.selected]}</span>
                {r.options.map((o, oi) => (
                  <span
                    key={o}
                    aria-hidden="true"
                    className={`mode-chip${oi === r.selected ? " is-selected" : ""}${onRow && v.cursor?.col === oi ? " is-cursor" : ""}`}
                    data-selected={oi === r.selected ? "true" : undefined}
                  >
                    {o}
                  </span>
                ))}
              </dd>
            </div>
          );
        })}
      </dl>
    </PanelCard>
  );
}
