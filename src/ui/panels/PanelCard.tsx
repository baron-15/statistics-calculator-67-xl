/**
 * The side blocks' building blocks, shared with the BA II Plus sibling site's look: a card with a
 * heading, an "In use" badge and header actions; label/value rows; values that flash when they
 * change.
 */
import { useRef, type ReactNode } from "react";

export interface PanelCardProps {
  id: string;
  title: string;
  /** the calculator is inside this block's feature right now */
  active?: boolean;
  /** small text next to the title */
  meta?: ReactNode;
  /** controls at the right of the header (they wrap under the title on narrow cards) */
  actions?: ReactNode;
  children: ReactNode;
}

export function PanelCard({ id, title, active = false, meta, actions, children }: PanelCardProps) {
  return (
    <section
      className={`panel-card${active ? " is-active" : ""}`}
      aria-labelledby={`${id}-title`}
      data-testid={`panel-${id}`}
      data-active={active ? "true" : "false"}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-[var(--panel-border)] px-4 py-2.5">
        <h2 id={`${id}-title`} className="text-sm font-semibold tracking-tight">
          {title}
        </h2>
        {active && (
          <span className="panel-badge" data-testid={`panel-${id}-in-use`}>
            In use
          </span>
        )}
        {meta && <span className="text-xs text-[var(--muted)]">{meta}</span>}
        {actions && <div className="ml-auto flex min-w-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="@container px-4 py-3">{children}</div>
    </section>
  );
}

/** How many times `value` has changed since mount (0 on the first render): replays a flash without flashing on load. */
export function useChangeCount<T>(value: T): number {
  const ref = useRef({ value, n: 0 });
  if (!Object.is(ref.current.value, value)) ref.current = { value, n: ref.current.n + 1 };
  return ref.current.n;
}

/** A value that briefly highlights whenever it changes. */
export function FlashValue({ value, className = "" }: { value: string; className?: string }) {
  const n = useChangeCount(value);
  return (
    <span key={n} className={`num${n ? " val-flash" : ""}${className ? ` ${className}` : ""}`}>
      {value}
    </span>
  );
}

export interface RowProps {
  label: ReactNode;
  value: string;
  /** the item under the calculator's cursor */
  current?: boolean;
  hint?: ReactNode;
  testId?: string;
}

/** One label/value line in a definition list. */
export function Row({ label, value, current = false, hint, testId }: RowProps) {
  return (
    <div className={`panel-row${current ? " is-current" : ""}`} data-current={current ? "true" : undefined} data-testid={testId}>
      <dt className="min-w-0">
        <span className="font-medium">{label}</span>
        {hint && <span className="ml-1.5 text-xs text-[var(--muted)]">{hint}</span>}
      </dt>
      <dd className="min-w-0 text-right">
        <FlashValue value={value} />
      </dd>
    </div>
  );
}

export function Rows({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <dl className={`panel-rows${className ? ` ${className}` : ""}`}>{children}</dl>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--muted)]">{children}</p>;
}

export function Subhead({ children }: { children: ReactNode }) {
  return <h3 className="panel-subhead">{children}</h3>;
}
