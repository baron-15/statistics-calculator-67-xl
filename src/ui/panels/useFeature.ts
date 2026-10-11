/**
 * The feature shown in the smart block: the last one a key press switched to (useCalculator's
 * trigger) or the user picked in the block's selector. Sticky, and remembered in this browser as
 * `ti30xs:feature`; null (a short placeholder) until the first trigger.
 */
import { useCallback, useEffect, useState } from "react";
import type { FeatureTrigger } from "../useCalculator";
import { parseFeature, type FeatureId } from "./featureContext";

export const FEATURE_STORAGE_KEY = "ti30xs:feature";

function readFeature(): FeatureId | null {
  try {
    return parseFeature(globalThis.localStorage?.getItem(FEATURE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeFeature(f: FeatureId): void {
  try {
    globalThis.localStorage?.setItem(FEATURE_STORAGE_KEY, f);
  } catch {
    /* storage unavailable: the block still follows the calculator for this visit */
  }
}

export function useFeature(trigger: FeatureTrigger | null): [FeatureId | null, (f: FeatureId) => void] {
  const [feature, setFeature] = useState<FeatureId | null>(readFeature);
  const select = useCallback((f: FeatureId) => {
    setFeature(f);
    writeFeature(f);
  }, []);
  // A new trigger (a new object, even for the same feature) switches the block.
  useEffect(() => {
    if (trigger) select(trigger.feature);
  }, [trigger, select]);
  return [feature, select];
}
