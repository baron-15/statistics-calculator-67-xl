/**
 * A labelled on/off switch in the page header ("Key tips", "Calculator only"), styled like the
 * theme toggle next to it.
 */
export interface HeaderSwitchProps {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
  testId: string;
  /** a longer explanation (tooltip and accessible description) */
  title?: string;
}

export function HeaderSwitch({ label, on, onChange, testId, title }: HeaderSwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={on} className="tips-switch" onClick={() => onChange(!on)} data-testid={testId} title={title}>
      {label}
      <span className="tips-switch-track" aria-hidden="true">
        <span className="tips-switch-thumb" />
      </span>
    </button>
  );
}
