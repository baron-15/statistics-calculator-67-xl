/**
 * The smart feature block: one card that shows the feature the calculator is being used for
 * (featureContext.ts decides), with a selector to switch by hand and an "In use" badge while the
 * calculator is inside that feature.
 */
import type { CalcState } from "../../engine";
import { AnglesBlock } from "./AnglesBlock";
import { featureInfo, featuresInUse, type FeatureId } from "./featureContext";
import { FeatureSelector } from "./FeatureSelector";
import { FractionsBlock } from "./FractionsBlock";
import { PanelCard } from "./PanelCard";
import { ProbabilityBlock } from "./ProbabilityBlock";
import { StatsBlock } from "./StatsBlock";
import { TableBlock } from "./TableBlock";

export interface FeatureBlockProps {
  state: CalcState;
  feature: FeatureId | null;
  onSelect: (f: FeatureId) => void;
}

export function FeatureBlock({ state, feature, onSelect }: FeatureBlockProps) {
  const inUse = featuresInUse(state);
  return (
    <div data-feature={feature ?? "none"} data-testid="feature-block">
      <PanelCard
        id="feature"
        title={feature ? featureInfo(feature).title : "Feature"}
        active={feature !== null && inUse.has(feature)}
        actions={<FeatureSelector value={feature} inUse={inUse} onChange={onSelect} />}
      >
        {feature === "stats" && <StatsBlock state={state} />}
        {feature === "table" && <TableBlock state={state} />}
        {feature === "fractions" && <FractionsBlock state={state} />}
        {feature === "probability" && <ProbabilityBlock state={state} />}
        {feature === "angles" && <AnglesBlock state={state} />}
        {feature === null && (
          <p className="text-sm text-[var(--muted)]" data-testid="feature-placeholder">
            This block follows what you do on the calculator: press <kbd>data</kbd> or <kbd>2nd</kbd> <kbd>stat</kbd> for statistics, <kbd>table</kbd>{" "}
            for a function table, <kbd>prb</kbd> for probability, <kbd>2nd</kbd> <kbd>angle</kbd> or <kbd>sin</kbd> for angles, and <kbd>n/d</kbd> or{" "}
            <kbd>◄►</kbd> for fractions. Or pick one above.
          </p>
        )}
      </PanelCard>
    </div>
  );
}
