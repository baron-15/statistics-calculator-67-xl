import { useCallback, useMemo, useState } from "react";
import type { KeyId } from "./engine";
import { Calculator, DEVICE_NAME } from "./ui/Calculator";
import { screenText } from "./ui/lcdSpeech";
import { useCalculator } from "./ui/useCalculator";
import { useKeyboard } from "./ui/useKeyboard";
import { useTheme } from "./ui/useTheme";

export function App() {
  const { view, frame, pressKey } = useCalculator();
  const { theme, toggle } = useTheme();
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
      <header className="flex items-center justify-between gap-3 px-4 pt-3 pb-1 sm:px-6">
        <h1 className="text-sm font-semibold tracking-tight">{DEVICE_NAME} Online</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
        </button>
      </header>
      <main className="flex-1 px-2 py-3 sm:px-6">
        <Calculator frame={frame} text={text} onPress={pressKey} flash={flash} />
        <p className="mx-auto mt-4 max-w-md text-center text-xs leading-relaxed text-[var(--muted)]">
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
