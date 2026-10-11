/** The Angles & trig block: one angle in every unit, its sin/cos/tan, and a unit-circle picture. */
import type { CalcState } from "../../engine";
import { angleView } from "./angleData";
import { UnitCircle } from "./charts";
import { Row, Rows, Subhead } from "./PanelCard";

export function AnglesBlock({ state }: { state: CalcState }) {
  const v = angleView(state);
  return (
    <div className="space-y-1" data-testid="angles-block">
      <p className="text-sm" data-testid="angles-source">
        <span className="font-medium">θ = {v.angle}</span>
        <span className="text-[var(--muted)]">
          {` (${v.mode})`} · {v.what}
          {v.entry ? (
            <>
              {" "}
              in <span className="num">{v.entry}</span>
            </>
          ) : null}
        </span>
      </p>
      <div className="grid grid-cols-1 items-start gap-x-6 @xl:grid-cols-2 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_13rem]">
        <div>
          <Subhead>Units</Subhead>
          <Rows>
            <Row label="Degrees" value={`${v.units.deg}°`} current={v.mode === "DEG"} testId="angle-deg" />
            <Row
              label="Radians"
              value={v.units.radPi && v.units.radPi !== v.units.rad ? `${v.units.radPi} ≈ ${v.units.rad}` : v.units.rad}
              current={v.mode === "RAD"}
              testId="angle-rad"
            />
            <Row label="Gradians" value={`${v.units.grad}ᵍ`} current={v.mode === "GRAD"} testId="angle-grad" />
            <Row label="D°M′S″" value={v.units.dms} hint="►DMS" testId="angle-dms" />
          </Rows>
        </div>
        <div>
          <Subhead>Trig ({v.mode})</Subhead>
          <Rows>
            <Row label="sin θ" value={v.trig.sin} testId="angle-sin" />
            <Row label="cos θ" value={v.trig.cos} testId="angle-cos" />
            <Row label="tan θ" value={v.trig.tan} testId="angle-tan" />
          </Rows>
          {v.point && (
            <>
              <Subhead>Point</Subhead>
              <Rows>
                <Row label="x, y" value={`${v.point.xText}, ${v.point.yText}`} />
                <Row label="r, θ" value={`${v.point.rText}, ${v.point.thetaText}`} />
              </Rows>
            </>
          )}
        </div>
        <div className="@xl:col-span-2 @4xl:col-span-1">
          <UnitCircle degrees={v.degrees} label={v.angle} point={v.point} />
        </div>
      </div>
    </div>
  );
}
