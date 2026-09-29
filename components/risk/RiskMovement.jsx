import { pp } from "@/lib/risk";

const Cell = ({ label, value, tone }) => (
  <div className="px-5 py-4 border-r border-ink-200 last:border-0 flex-1 min-w-[140px]">
    <p className="text-xs text-ink-500">{label}</p>
    <p className={`text-2xl font-semibold mt-1 ${tone || ""}`}>{value}</p>
  </div>
);

const tone = (n) => (n > 0 ? "text-risk-red" : n < 0 ? "text-risk-green" : "text-ink-700");

export default function RiskMovement({ previous, current, change30, change90 }) {
  return (
    <div className="flex flex-wrap border border-ink-200">
      <Cell label="Previous assessment" value={previous + "%"} />
      <Cell label="Current assessment" value={current + "%"} />
      <Cell label="Change" value={pp(current - previous)} tone={tone(current - previous)} />
      <Cell label="30-day change" value={pp(change30)} tone={tone(change30)} />
      <Cell label="90-day change" value={pp(change90)} tone={tone(change90)} />
    </div>
  );
}
