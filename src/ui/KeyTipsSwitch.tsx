/** The "Key tips" switch in the page header, next to the theme toggle (and styled like it). */
export function KeyTipsSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="tips-switch" onClick={() => onChange(!on)} data-testid="key-tips-switch">
      Key tips
      <span className="tips-switch-track" aria-hidden="true">
        <span className="tips-switch-thumb" />
      </span>
    </button>
  );
}
