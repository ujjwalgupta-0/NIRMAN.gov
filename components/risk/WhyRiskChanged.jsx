import { pp } from "@/lib/risk";

export default function WhyRiskChanged({ change }) {
  const max = Math.max(...change.drivers.map((d) => Math.abs(d.delta)));
  return (
    <div>
      <div className="flex flex-wrap gap-10 mb-5">
        <div><p className="text-xs text-ink-500">Previous risk</p><p className="text-2xl font-semibold">{change.previous}%</p></div>
        <div><p className="text-xs text-ink-500">Current risk</p><p className="text-2xl font-semibold">{change.current}%</p></div>
        <div><p className="text-xs text-ink-500">Difference</p>
          <p className={`text-2xl font-semibold ${change.delta > 0 ? "text-risk-red" : "text-risk-green"}`}>{pp(change.delta)}</p></div>
      </div>
      <ul className="border-t border-ink-200">
        {change.drivers.map((d, i) => (
          <li key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-4 py-3 border-b border-ink-200">
            <span className="font-medium truncate">
              {d.label}
              {i === 0 && <span className="ml-2 text-xs text-ink-500">primary driver</span>}
            </span>
            <span className="hidden sm:flex h-3 bg-ink-100">
              <span className={`block h-full ${d.delta > 0 ? "bg-risk-red" : "bg-risk-green ml-auto"}`}
                style={{ width: `${(Math.abs(d.delta) / max) * 100}%` }} />
            </span>
            <span className={`text-sm font-semibold ${d.delta > 0 ? "text-risk-red" : "text-risk-green"}`}>{pp(d.delta)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
