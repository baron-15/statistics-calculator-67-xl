/**
 * Small inline-SVG charts for the side panels. Each chart is drawn in pixels at its container's
 * measured width (so text stays at one size), themed only through CSS classes and variables
 * (.chart-* in index.css), and has a text alternative: role="img" with a <title> and a <desc>
 * summary, plus per-mark <title> tooltips. The numbers they draw come from the engine (statsData,
 * tableData, angleData, fractionData).
 */
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { linear, niceDomain, niceTicks, tickLabel, type Scale } from "./chartScale";
import type { BoxSummary, HistogramBin } from "./statsData";
import type { PlotData } from "./tableData";
import type { FractionStrip as Strip } from "./fractionData";

/** The width of an element, kept up to date (falls back to `initial` before the first measure). */
function useWidth(initial = 360): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

interface FrameProps {
  title: string;
  desc: string;
  height: number;
  /** a visible caption under the chart */
  caption?: ReactNode;
  testId?: string;
  children: (width: number) => ReactNode;
}

/** The figure, the measured SVG and its text alternative. */
function ChartFrame({ title, desc, height, caption, testId, children }: FrameProps) {
  const [ref, width] = useWidth();
  const id = useId();
  return (
    <figure className="chart" data-testid={testId}>
      <div ref={ref} className="chart-box">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}>
          <title id={`${id}-t`}>{title}</title>
          <desc id={`${id}-d`}>{desc}</desc>
          {children(width)}
        </svg>
      </div>
      {caption && <figcaption className="chart-caption">{caption}</figcaption>}
    </figure>
  );
}

const M = { top: 10, right: 14, bottom: 24, left: 40 };
/** Air between the plot frame and data drawn on its edge (points on the first or last tick). */
const INSET = 8;

function XAxis({ x, y0, ticks, span }: { x: Scale; y0: number; ticks: number[]; span?: [number, number] }) {
  const [x0, x1] = span ?? x.range;
  return (
    <g className="chart-axis" aria-hidden="true">
      <line className="chart-rule" x1={x0} x2={x1} y1={y0 + 0.5} y2={y0 + 0.5} />
      {ticks.map((t) => (
        <text key={t} x={x(t)} y={y0 + 15} textAnchor="middle">
          {tickLabel(t)}
        </text>
      ))}
    </g>
  );
}

function YGrid({ y, x0, x1, ticks }: { y: Scale; x0: number; x1: number; ticks: number[] }) {
  return (
    <g className="chart-axis" aria-hidden="true">
      {ticks.map((t) => (
        <g key={t}>
          <line className="chart-grid" x1={x0} x2={x1} y1={Math.round(y(t)) + 0.5} y2={Math.round(y(t)) + 0.5} />
          <text x={x0 - 6} y={y(t) + 3.5} textAnchor="end">
            {tickLabel(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

const fmt = (v: number): string => tickLabel(Number(v.toPrecision(10)));

// ------------------------------------------------------------------------------------------------
// 1-Var: box plot + histogram on one x axis

export function OneVarCharts({ list, box, bins }: { list: string; box: BoxSummary; bins: HistogramBin[] }) {
  const lo = Math.min(box.min, bins[0]?.lo ?? box.min);
  const hi = Math.max(box.max, bins.at(-1)?.hi ?? box.max);
  const domain = niceDomain(lo, hi, 6);
  const five = `minimum ${fmt(box.min)}, Q1 ${fmt(box.q1)}, median ${fmt(box.med)}, Q3 ${fmt(box.q3)}, maximum ${fmt(box.max)}, mean ${fmt(box.mean)}`;
  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const binText = bins.map((b) => `${fmt(b.lo)} to ${fmt(b.hi)}: ${fmt(b.count)}`).join("; ");
  return (
    <div className="space-y-2">
      <ChartFrame
        title={`Box plot of ${list}`}
        desc={`Five-number summary: ${five}.`}
        height={62}
        testId="chart-box"
        caption={<>Box plot of {list}: the box spans Q1–Q3, the line is the median, ◆ the mean.</>}
      >
        {(w) => {
          const x = linear(domain, [M.left, w - M.right]);
          const mid = 20;
          return (
            <>
              <XAxis x={x} y0={40} ticks={niceTicks(domain[0], domain[1], 6)} />
              <g className="chart-box-plot">
                <line className="chart-whisker" x1={x(box.min)} x2={x(box.q1)} y1={mid} y2={mid} />
                <line className="chart-whisker" x1={x(box.q3)} x2={x(box.max)} y1={mid} y2={mid} />
                <line className="chart-whisker" x1={x(box.min)} x2={x(box.min)} y1={mid - 7} y2={mid + 7} />
                <line className="chart-whisker" x1={x(box.max)} x2={x(box.max)} y1={mid - 7} y2={mid + 7} />
                <rect className="chart-fill-1" x={x(box.q1)} y={mid - 11} width={Math.max(1, x(box.q3) - x(box.q1))} height={22} rx={4}>
                  <title>{`Q1 ${fmt(box.q1)} to Q3 ${fmt(box.q3)}`}</title>
                </rect>
                <line className="chart-median" x1={x(box.med)} x2={x(box.med)} y1={mid - 11} y2={mid + 11}>
                  <title>{`Median ${fmt(box.med)}`}</title>
                </line>
                <path className="chart-mean" d={`M${x(box.mean)} ${mid - 5}l5 5l-5 5l-5 -5z`}>
                  <title>{`Mean ${fmt(box.mean)}`}</title>
                </path>
              </g>
            </>
          );
        }}
      </ChartFrame>
      <ChartFrame
        title={`Histogram of ${list}`}
        desc={`Frequencies by interval: ${binText}.`}
        height={150}
        testId="chart-histogram"
        caption={
          <>
            Histogram of {list}
            {bins.length ? `, ${bins.length} intervals of width ${fmt(bins[0]!.hi - bins[0]!.lo)}` : ""}.
          </>
        }
      >
        {(w) => {
          const x = linear(domain, [M.left, w - M.right]);
          const yTicks = niceTicks(0, maxCount, 4).filter((t) => Number.isInteger(t));
          const top = Math.max(maxCount, yTicks.at(-1) ?? maxCount);
          const y = linear([0, top], [150 - M.bottom, M.top]);
          return (
            <>
              <YGrid y={y} x0={M.left} x1={w - M.right} ticks={yTicks} />
              <XAxis x={x} y0={150 - M.bottom} ticks={niceTicks(domain[0], domain[1], 6)} />
              {bins.map((b) => {
                // a histogram's bars span their interval, separated by a 2px surface gap
                const slot = x(b.hi) - x(b.lo);
                const bw = Math.max(1, slot - 2);
                const bx = x(b.lo) + 1;
                const h = y(0) - y(b.count);
                return (
                  <g key={b.lo}>
                    {b.count > 0 && <path className="chart-fill-1" d={barPath(bx, y(0), bw, h)} />}
                    <rect className="chart-hit" x={x(b.lo)} y={M.top} width={Math.max(1, slot)} height={y(0) - M.top}>
                      <title>{`${fmt(b.lo)} to ${fmt(b.hi)}: ${fmt(b.count)}`}</title>
                    </rect>
                  </g>
                );
              })}
            </>
          );
        }}
      </ChartFrame>
    </div>
  );
}

/** A bar growing up from the baseline with a 4px rounded top (square at the baseline). */
function barPath(x: number, base: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x} ${base}V${base - h + r}Q${x} ${base - h} ${x + r} ${base - h}H${x + w - r}Q${x + w} ${base - h} ${x + w} ${base - h + r}V${base}Z`;
}

// ------------------------------------------------------------------------------------------------
// 2-Var: scatter + regression line

export function ScatterChart({
  points,
  line,
  xList,
  yList,
  lineText,
}: {
  points: { x: number; y: number }[];
  line: { a: number; b: number } | null;
  xList: string;
  yList: string;
  lineText: string | null;
}) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xd = niceDomain(Math.min(...xs), Math.max(...xs), 5);
  const yd = niceDomain(Math.min(...ys), Math.max(...ys), 4);
  const H = 190;
  const clip = useId().replace(/:/g, "");
  const desc = `${points.length} points (${xList}, ${yList})${line ? `; regression line ${lineText ?? ""}` : ""}.`;
  return (
    <ChartFrame
      title={`Scatter plot of ${yList} against ${xList}`}
      desc={desc}
      height={H}
      testId="chart-scatter"
      caption={
        <span className="chart-legend">
          <span>
            <span className="chart-key-dot" aria-hidden="true" /> data ({xList}, {yList})
          </span>
          {line && (
            <span>
              <span className="chart-key-line" aria-hidden="true" /> {lineText}
            </span>
          )}
        </span>
      }
    >
      {(w) => {
        const x = linear(xd, [M.left + INSET, w - M.right - INSET]);
        const y = linear(yd, [H - M.bottom - INSET, M.top + INSET]);
        return (
          <>
            <YGrid y={y} x0={M.left} x1={w - M.right} ticks={niceTicks(yd[0], yd[1], 4)} />
            <XAxis x={x} y0={H - M.bottom} ticks={niceTicks(xd[0], xd[1], 5)} span={[M.left, w - M.right]} />
            <defs>
              <clipPath id={clip}>
                <rect x={M.left} y={M.top} width={Math.max(1, w - M.left - M.right)} height={H - M.top - M.bottom} />
              </clipPath>
            </defs>
            {line && (
              <g clipPath={`url(#${clip})`}>
                <line className="chart-line-2" x1={x(xd[0])} x2={x(xd[1])} y1={y(line.a * xd[0] + line.b)} y2={y(line.a * xd[1] + line.b)} />
              </g>
            )}
            {points.map((p, i) => (
              <g key={i}>
                <circle className="chart-dot-1" cx={x(p.x)} cy={y(p.y)} r={4} />
                <circle className="chart-hit" cx={x(p.x)} cy={y(p.y)} r={12}>
                  <title>{`(${fmt(p.x)}, ${fmt(p.y)})`}</title>
                </circle>
              </g>
            ))}
          </>
        );
      }}
    </ChartFrame>
  );
}

// ------------------------------------------------------------------------------------------------
// Function table: f(x) over the table's range

export function FunctionChart({ plot, func }: { plot: PlotData; func: string }) {
  const H = 190;
  const xd: [number, number] = [plot.xMin, plot.xMax];
  const yd = niceDomain(plot.yMin, plot.yMax, 4);
  const clip = useId().replace(/:/g, "");
  const desc = `y = ${func} for x from ${fmt(plot.xMin)} to ${fmt(plot.xMax)}; the table rows are marked: ${plot.points.map((p) => `(${fmt(p.x)}, ${fmt(p.y)})`).join(", ")}.`;
  return (
    <ChartFrame
      title={`Plot of y = ${func}`}
      desc={desc}
      height={H}
      testId="chart-function"
      caption={<>y = {func} over the table's x values; dots are the table rows.</>}
    >
      {(w) => {
        const x = linear(xd, [M.left + INSET, w - M.right - INSET]);
        const y = linear(yd, [H - M.bottom, M.top]);
        const path = plot.segments.map((seg) => seg.map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)} ${y(p.y).toFixed(1)}`).join("")).join("");
        return (
          <>
            <defs>
              <clipPath id={clip}>
                <rect x={M.left} y={M.top} width={Math.max(1, w - M.left - M.right)} height={H - M.top - M.bottom} />
              </clipPath>
            </defs>
            <YGrid y={y} x0={M.left} x1={w - M.right} ticks={niceTicks(yd[0], yd[1], 4)} />
            <XAxis x={x} y0={H - M.bottom} ticks={niceTicks(xd[0], xd[1], 6)} span={[M.left, w - M.right]} />
            {yd[0] < 0 && yd[1] > 0 && (
              <line className="chart-zero" x1={M.left} x2={w - M.right} y1={Math.round(y(0)) + 0.5} y2={Math.round(y(0)) + 0.5} />
            )}
            {xd[0] < 0 && xd[1] > 0 && <line className="chart-zero" x1={x(0)} x2={x(0)} y1={M.top} y2={H - M.bottom} />}
            <g clipPath={`url(#${clip})`}>
              <path className="chart-line-1" d={path} />
              {plot.points.map((p, i) => (
                <g key={i}>
                  <circle className="chart-dot-1" cx={x(p.x)} cy={y(p.y)} r={4} />
                  <circle className="chart-hit" cx={x(p.x)} cy={y(p.y)} r={12}>
                    <title>{`x = ${fmt(p.x)}, y = ${fmt(p.y)}`}</title>
                  </circle>
                </g>
              ))}
            </g>
          </>
        );
      }}
    </ChartFrame>
  );
}

// ------------------------------------------------------------------------------------------------
// Angles: the unit circle (or the polar point)

export function UnitCircle({ degrees, label, point }: { degrees: number; label: string; point: { x: number; y: number; rText: string } | null }) {
  const size = 200;
  const c = size / 2;
  const R = 70;
  const t = (degrees * Math.PI) / 180;
  const px = c + R * Math.cos(t);
  const py = c - R * Math.sin(t);
  // the angle's arc, wound as many times as needed is too busy: draw it modulo one turn, in its direction
  const turn = ((degrees % 360) + 360) % 360;
  const sweep = degrees >= 0 ? turn : turn - 360;
  const ar = 22;
  const end = (sweep * Math.PI) / 180;
  const large = Math.abs(sweep) > 180 ? 1 : 0;
  const arc =
    Math.abs(sweep) < 0.01 ? "" : `M${c + ar} ${c}A${ar} ${ar} 0 ${large} ${sweep >= 0 ? 0 : 1} ${c + ar * Math.cos(end)} ${c - ar * Math.sin(end)}`;
  const what = point
    ? `the point (${fmt(point.x)}, ${fmt(point.y)}) at distance ${point.rText}`
    : `the point (cos θ, sin θ) = (${fmt(Math.cos(t))}, ${fmt(Math.sin(t))})`;
  return (
    <ChartFrame
      title={point ? "Polar and rectangular coordinates" : "Unit circle"}
      desc={`Angle θ = ${label} (${fmt(degrees)}°) and ${what}.`}
      height={size}
      testId="chart-circle"
    >
      {(w) => {
        const dx = (w - size) / 2;
        return (
          <g transform={`translate(${dx} 0)`}>
            <line className="chart-grid" x1={c - R - 16} x2={c + R + 16} y1={c} y2={c} />
            <line className="chart-grid" x1={c} x2={c} y1={c - R - 16} y2={c + R + 16} />
            <circle className="chart-circle" cx={c} cy={c} r={R} />
            <line className="chart-proj" x1={px} x2={px} y1={c} y2={py}>
              <title>{point ? `y = ${fmt(point.y)}` : `sin θ = ${fmt(Math.sin(t))}`}</title>
            </line>
            <line className="chart-proj" x1={c} x2={px} y1={c} y2={c}>
              <title>{point ? `x = ${fmt(point.x)}` : `cos θ = ${fmt(Math.cos(t))}`}</title>
            </line>
            {arc && <path className="chart-arc" d={arc} />}
            <line className="chart-line-1" x1={c} y1={c} x2={px} y2={py} />
            <circle className="chart-dot-1" cx={px} cy={py} r={4.5}>
              <title>{point ? `(${fmt(point.x)}, ${fmt(point.y)})` : `(cos θ, sin θ) = (${fmt(Math.cos(t))}, ${fmt(Math.sin(t))})`}</title>
            </circle>
            <g className="chart-axis" aria-hidden="true">
              <text x={c + ar + 6} y={c - 6}>
                θ
              </text>
              <text x={(c + px) / 2} y={c + (py > c ? -6 : 14)} textAnchor="middle">
                {point ? "x" : "cos"}
              </text>
              <text x={px + (px >= c ? 6 : -6)} y={(c + py) / 2 + 4} textAnchor={px >= c ? "start" : "end"}>
                {point ? "y" : "sin"}
              </text>
              <text x={c + R + 4} y={c + 14}>
                {point ? point.rText : "1"}
              </text>
            </g>
          </g>
        );
      }}
    </ChartFrame>
  );
}

// ------------------------------------------------------------------------------------------------
// Fractions: whole bars + the fractional part

const MAX_BARS = 5;

export function FractionStripChart({ strip, label }: { strip: Strip; label: string }) {
  const shown = Math.min(strip.whole, MAX_BARS);
  const bars = shown + (strip.part > 0 || strip.whole === 0 ? 1 : 0);
  const H = 22 + 18;
  const pieces = strip.den > 0 ? `${strip.num} of ${strip.den} equal parts` : `${fmt(strip.part * 100)}% of a whole`;
  const desc = `${strip.neg ? "Negative: " : ""}${strip.whole} whole${strip.whole === 1 ? "" : "s"} and ${pieces}.`;
  return (
    <ChartFrame
      title={`${label} as parts of a whole`}
      desc={desc}
      height={H}
      testId="chart-strip"
      caption={
        <>
          {desc}
          {strip.whole > MAX_BARS ? ` (${MAX_BARS} of the ${strip.whole} wholes drawn)` : ""}
        </>
      }
    >
      {(w) => {
        const gap = 6;
        const bw = Math.max(20, (w - (bars - 1) * gap) / Math.max(1, bars));
        const out: ReactNode[] = [];
        for (let i = 0; i < bars; i++) {
          const x0 = i * (bw + gap);
          const whole = i < shown;
          out.push(<rect key={`t${i}`} className="chart-track" x={x0} y={0} width={bw} height={22} rx={4} />);
          if (whole) out.push(<rect key={`w${i}`} className="chart-fill-1" x={x0} y={0} width={bw} height={22} rx={4} />);
          else if (strip.den > 0) {
            const sw = (bw - (strip.den - 1) * 2) / strip.den;
            for (let k = 0; k < strip.den; k++) {
              out.push(
                <rect
                  key={`p${k}`}
                  className={k < strip.num ? "chart-fill-1" : "chart-track-piece"}
                  x={x0 + k * (sw + 2)}
                  y={0}
                  width={Math.max(1, sw)}
                  height={22}
                  rx={2}
                />,
              );
            }
          } else out.push(<rect key="part" className="chart-fill-1" x={x0} y={0} width={Math.max(0, bw * strip.part)} height={22} rx={4} />);
          out.push(
            <text key={`l${i}`} className="chart-axis-text" x={x0 + bw / 2} y={36} textAnchor="middle">
              {whole ? "1" : strip.den > 0 ? `${strip.num}/${strip.den}` : fmt(strip.part)}
            </text>,
          );
        }
        return <g>{out}</g>;
      }}
    </ChartFrame>
  );
}
