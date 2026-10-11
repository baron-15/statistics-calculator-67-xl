/**
 * The side area: the smart feature block first (full width), then Memory and Mode (side by side on
 * extra-large screens), then History.
 */
import type { CalcState } from "../../engine";
import { FeatureBlock } from "./FeatureBlock";
import type { FeatureId } from "./featureContext";
import { HistoryBlock } from "./HistoryBlock";
import { MemoryBlock } from "./MemoryBlock";
import { ModeBlock } from "./ModeBlock";

export interface PanelBoardProps {
  state: CalcState;
  feature: FeatureId | null;
  onSelectFeature: (f: FeatureId) => void;
}

export function PanelBoard({ state, feature, onSelectFeature }: PanelBoardProps) {
  return (
    <section className="min-w-0 space-y-4" aria-label="Calculator panels" data-testid="panels">
      <FeatureBlock state={state} feature={feature} onSelect={onSelectFeature} />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <MemoryBlock state={state} />
        <ModeBlock state={state} />
      </div>
      <HistoryBlock state={state} />
    </section>
  );
}
