import Icon from "@/components/Icon";

export default function EarlyWarning({ w }) {
  const icon = w.active ? "shieldAlert" : "shieldCheck";
  return (
    <div className={`border p-6 ${w.active ? "border-risk-red bg-red-50" : "border-ink-200"}`}>
      <p className={`flex items-center gap-2 font-bold ${w.active ? "text-risk-red" : "text-risk-green"}`}>
        <Icon name={icon} className="h-5 w-5" />
        {w.active == null ? "STATUS UNAVAILABLE" : w.active ? "ACTIVE" : "NOT ACTIVE"}
      </p>
      <p className="text-ink-700 mt-2 max-w-2xl">{w.note ?? "The data source did not provide an early warning status or explanation."}</p>
      <dl className="flex flex-wrap gap-10 mt-5">
        <div><dt className="text-xs text-ink-500">Alert threshold</dt><dd className="text-xl font-semibold">{w.threshold == null ? "Unavailable" : `${w.threshold}%`}</dd></div>
        <div><dt className="text-xs text-ink-500">Current risk</dt><dd className="text-xl font-semibold">{w.currentRisk == null ? "Unavailable" : `${w.currentRisk}%`}</dd></div>
        {w.leadMonths != null && (
          <div><dt className="text-xs text-ink-500">Estimated lead time</dt><dd className="text-xl font-semibold">{w.leadMonths} months</dd></div>
        )}
      </dl>
    </div>
  );
}
