/**
 * The feature block's compact segmented selector: an ARIA radio group of buttons with a roving
 * tab stop. ◄ ► ▲ ▼ move and select, Home / End jump; the arrow keys are kept from the calculator's
 * keyboard map (preventDefault), while digits typed with a segment focused still reach the
 * calculator. A dot marks features the calculator is inside right now.
 */
import { useRef, type KeyboardEvent } from "react";
import { FEATURES, type FeatureId } from "./featureContext";

export interface FeatureSelectorProps {
  value: FeatureId | null;
  inUse: ReadonlySet<FeatureId>;
  onChange: (f: FeatureId) => void;
}

export function FeatureSelector({ value, inUse, onChange }: FeatureSelectorProps) {
  const refs = useRef<Partial<Record<FeatureId, HTMLButtonElement | null>>>({});
  const focusIndex = Math.max(
    0,
    FEATURES.findIndex((f) => f.id === value),
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = FEATURES.findIndex((f) => f.id === (e.target as HTMLElement).dataset.feature);
    if (i < 0) return;
    let j: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        j = (i + 1) % FEATURES.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        j = (i - 1 + FEATURES.length) % FEATURES.length;
        break;
      case "Home":
        j = 0;
        break;
      case "End":
        j = FEATURES.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const next = FEATURES[j]!.id;
    onChange(next);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Feature shown" className="seg" onKeyDown={onKeyDown} data-testid="feature-selector">
      {FEATURES.map((f, i) => {
        const checked = f.id === value;
        return (
          <button
            key={f.id}
            ref={(el) => {
              refs.current[f.id] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={i === focusIndex ? 0 : -1}
            className="seg-item"
            data-feature={f.id}
            data-testid={`feature-${f.id}`}
            onClick={() => onChange(f.id)}
          >
            {f.label}
            {inUse.has(f.id) && (
              <>
                <span className="seg-dot" aria-hidden="true" />
                <span className="sr-only"> (in use)</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
