/** The Home history, newest first: more than the 4-line screen can show. */
import type { CalcState } from "../../engine";
import { MAX_HISTORY } from "../../engine/apps/home";
import { historyView } from "./memoryData";
import { Muted, PanelCard } from "./PanelCard";

export function HistoryBlock({ state }: { state: CalcState }) {
  const items = historyView(state);
  return (
    <PanelCard id="history" title="History" meta={items.length ? `${items.length} of ${MAX_HISTORY} kept · newest first` : undefined}>
      {items.length === 0 ? (
        <Muted>Your calculations appear here. ▲ on the calculator scrolls back through them; enter pastes the highlighted one.</Muted>
      ) : (
        <ol className="history" data-testid="history-list">
          {items.map((h) => (
            <li key={h.line} className={`history-item${h.selected ? " is-current" : ""}`} aria-current={h.selected ? "true" : undefined}>
              <span className="history-entry num">
                {h.entry}
                {h.toggled ? " ◄►" : ""}
              </span>
              <span className="history-result num">= {h.result}</span>
            </li>
          ))}
        </ol>
      )}
    </PanelCard>
  );
}
