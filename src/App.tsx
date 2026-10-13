import { useCallback, useMemo, useRef, useState } from "react";
import type { KeyId } from "./engine";
import { Calculator, DEVICE_NAME } from "./ui/Calculator";
import { HeaderSwitch } from "./ui/HeaderSwitch";
import { screenText } from "./ui/lcdSpeech";
import { PanelBoard } from "./ui/panels/PanelBoard";
import { useFeature } from "./ui/panels/useFeature";
import { useCalcOnly } from "./ui/useCalcOnly";
import { useCalculator } from "./ui/useCalculator";
import { useKeyboard } from "./ui/useKeyboard";
import { useKeyTips } from "./ui/useKeyTips";
import { useScrollPastHeader } from "./ui/useScrollPastHeader";
import { useTheme } from "./ui/useTheme";

export function App() {
  const { state, view, frame, pressKey, trigger } = useCalculator();
  const { theme, toggle } = useTheme();
  const [tipsOn, setTipsOn] = useKeyTips();
  const [calcOnly, setCalcOnly] = useCalcOnly();
  const [feature, setFeature] = useFeature(trigger);
  const [flash, setFlash] = useState<{ id: KeyId; n: number } | null>(null);
  const header = useRef<HTMLElement>(null);
  useScrollPastHeader(header);

  // Keys typed on the computer keyboard press the calculator key and animate it.
  const onKeyboard = useCallback(
    (id: KeyId) => {
      pressKey(id);
      setFlash((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    },
    [pressKey],
  );
  useKeyboard(onKeyboard);
  const text = useMemo(() => screenText(view), [view]);

  const calculator = <Calculator frame={frame} text={text} onPress={pressKey} flash={flash} tipsEnabled={tipsOn} />;
  const hint = (
    <p className={`mx-auto max-w-md text-center text-xs leading-relaxed text-[var(--muted)]${calcOnly ? "" : " lg:mx-0 lg:max-w-2xl lg:text-left"}`}>
      <span data-testid="tips-hint">
        {tipsOn ? (
          "Hover a key (or long-press on a phone) to see what it does."
        ) : (
          <>
            Turn on <strong className="font-semibold text-[var(--page-fg)]">Key tips</strong> at the top of the page to see what each key does.
          </>
        )}
      </span>{" "}
      Your keyboard works too: digits, <kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd> <kbd>^</kbd> <kbd>(</kbd> <kbd>)</kbd>, <kbd>Enter</kbd>,
      the arrows, <kbd>Backspace</kbd> (delete) and <kbd>Esc</kbd> (clear), plus TI-SmartView's letters such as <kbd>Q</kbd> 2nd, <kbd>W</kbd> mode,{" "}
      <kbd>D</kbd> π and <kbd>Z</kbd> x.
    </p>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header ref={header} className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-1 sm:gap-3 sm:px-6">
        <h1 className="min-w-0 text-sm font-semibold tracking-tight">{DEVICE_NAME} Online</h1>
        <div className="ml-auto flex flex-none items-center gap-2">
          <HeaderSwitch label="Key tips" on={tipsOn} onChange={setTipsOn} testId="key-tips-switch" />
          <HeaderSwitch label="Calculator only" on={calcOnly} onChange={setCalcOnly} testId="calc-only-switch" title="Hide the side panels" />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
        </div>
      </header>
      <main className="flex-1 px-2 py-3 sm:px-6">
        {calcOnly ? (
          <>
            {calculator}
            <div className="mt-4">{hint}</div>
          </>
        ) : (
          // Desktop: the calculator stays in view on the left while the panels scroll on the right;
          // the keyboard hint sits under the panels there. Phones: calculator, hint, then the panels.
          <div className="layout-split" data-testid="layout-split">
            <div className="layout-calc lg:sticky lg:top-4">{calculator}</div>
            <div className="layout-hint">{hint}</div>
            <div className="layout-panels">
              <PanelBoard state={state} feature={feature} onSelectFeature={setFeature} />
            </div>
          </div>
        )}
      </main>
      <footer className="border-t border-[var(--panel-border)] px-4 py-3 text-xs text-[var(--muted)] sm:px-6">
        {DEVICE_NAME} is an independent emulator of the TI-30XS MultiView™ scientific calculator. It is not affiliated with or endorsed by Texas
        Instruments; TI-30XS MultiView is a trademark of Texas Instruments. For educational use: verify results before relying on them.
      </footer>
    </div>
  );
}
