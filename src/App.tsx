import { useCallback, useMemo, useState } from "react";
import type { KeyId } from "./engine";
import { Calculator, DEVICE_NAME } from "./ui/Calculator";
import { KeyTipsSwitch } from "./ui/KeyTipsSwitch";
import { screenText } from "./ui/lcdSpeech";
import { useCalculator } from "./ui/useCalculator";
import { useKeyboard } from "./ui/useKeyboard";
import { useKeyTips } from "./ui/useKeyTips";
import { useTheme } from "./ui/useTheme";

export function App() {
  const { view, frame, pressKey } = useCalculator();
  const { theme, toggle } = useTheme();
  const [tipsOn, setTipsOn] = useKeyTips();
  const [flash, setFlash] = useState<{ id: KeyId; n: number } | null>(null);

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

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 sm:gap-3 sm:px-6">
        <h1 className="min-w-0 text-sm font-semibold tracking-tight">{DEVICE_NAME} Online</h1>
        <div className="flex flex-none items-center gap-2">
          <KeyTipsSwitch on={tipsOn} onChange={setTipsOn} />
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
        <Calculator frame={frame} text={text} onPress={pressKey} flash={flash} tipsEnabled={tipsOn} />
        <p className="mx-auto mt-4 max-w-md text-center text-xs leading-relaxed text-[var(--muted)]">
          <span data-testid="tips-hint">
            {tipsOn ? (
              "Hover a key (or long-press on a phone) to see what it does."
            ) : (
              <>
                Turn on <strong className="font-semibold text-[var(--page-fg)]">Key tips</strong> at the top of the page to see what each key does.
              </>
            )}
          </span>{" "}
          Your keyboard works too: digits, <kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd> <kbd>^</kbd> <kbd>(</kbd> <kbd>)</kbd>,{" "}
          <kbd>Enter</kbd>, the arrows, <kbd>Backspace</kbd> (delete) and <kbd>Esc</kbd> (clear), plus TI-SmartView's letters such as{" "}
          <kbd>Q</kbd> 2nd, <kbd>W</kbd> mode, <kbd>D</kbd> π and <kbd>Z</kbd> x.
        </p>
      </main>
      <footer className="border-t border-[var(--panel-border)] px-4 py-3 text-xs text-[var(--muted)] sm:px-6">
        {DEVICE_NAME} is an independent emulator of the TI-30XS MultiView™ scientific calculator. It is not affiliated with or endorsed by
        Texas Instruments; TI-30XS MultiView is a trademark of Texas Instruments. For educational use: verify results before relying on them.
      </footer>
    </div>
  );
}
