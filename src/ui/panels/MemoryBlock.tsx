/** Always visible: the variables x–c, Ans and the constant K. */
import type { CalcState } from "../../engine";
import { memoryView } from "./memoryData";
import { PanelCard, Row, Rows } from "./PanelCard";

export function MemoryBlock({ state }: { state: CalcState }) {
  const v = memoryView(state);
  return (
    <PanelCard id="memory" title="Memory" active={v.activity !== null} meta={v.activity ?? undefined}>
      <Rows className="panel-grid-2">
        {v.vars.map((x) => (
          <Row key={x.name} label={<i className="panel-var">{x.name}</i>} value={x.text} current={v.current === x.name} testId={`mem-${x.name}`} />
        ))}
      </Rows>
      <Rows>
        <Row label="Ans" value={v.ans} hint="2nd ans" testId="mem-ans" />
        <Row
          label="K"
          hint={v.k ? (v.k.editing ? "editing" : v.k.on ? "on" : "off") : "2nd K"}
          value={v.k ? (v.k.text ? `K = ${v.k.text}` : "K =") : "none"}
          current={v.current === "k"}
          testId="mem-k"
        />
      </Rows>
    </PanelCard>
  );
}
