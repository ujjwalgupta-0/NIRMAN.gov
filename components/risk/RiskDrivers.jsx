"use client";
import { useState } from "react";
import Icon from "@/components/Icon";

const SIG = { HIGH: "text-risk-red", MEDIUM: "text-risk-amber", LOW: "text-ink-500" };

function Driver({ d, max, increasing }) {
  const [open, setOpen] = useState(false);
  const contribution = Number(d.contribution ?? d.signedContribution ?? 0);
  const label = d.significance ?? (d.contribution == null ? "Model supplied" : "Contribution supplied");
  return (
    <div className="border-b border-ink-200">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-4 py-3 text-left hover:bg-ink-100 px-2 -mx-2">
        <span className="font-medium truncate">{d.label}</span>
        <span className="hidden sm:block h-3 bg-ink-100">
          <span className={`block h-full ${increasing ? "bg-risk-red" : "bg-risk-green"}`}
            style={{ width: `${max > 0 ? Math.min(100, Math.abs(contribution) / max * 100) : 0}%` }} />
        </span>
        <span className="flex items-center gap-3">
          <span className={`text-xs font-semibold ${SIG[d.significance] ?? "text-ink-500"}`}>{label}</span>
          <Icon name="chevronDown" className={`h-4 w-4 text-ink-500 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <dl className="grid sm:grid-cols-4 gap-6 px-2 py-4 bg-ink-100 text-sm">
          <div><dt className="text-ink-500">Current value</dt><dd className="font-semibold mt-0.5">{d.value ?? "Not supplied"}</dd></div>
          <div><dt className="text-ink-500">Model contribution</dt><dd className="font-semibold mt-0.5">{d.contribution ?? d.signedContribution ?? "Not supplied"}</dd></div>
          <div>
            <dt className="text-ink-500">Direction</dt>
            <dd className={`font-semibold mt-0.5 flex items-center gap-1 ${increasing ? "text-risk-red" : "text-risk-green"}`}>
              <Icon name={increasing ? "trendUp" : "trendDown"} className="h-4 w-4" />
              {increasing ? "Increasing risk" : "Reducing risk"}
            </dd>
          </div>
          <div className="sm:col-span-4"><dt className="text-ink-500">Interpretation</dt><dd className="mt-0.5 text-ink-700 max-w-3xl">{d.interpretation ?? d.action ?? "No interpretation supplied by the model service."}</dd></div>
        </dl>
      )}
    </div>
  );
}

export default function RiskDrivers({ increasing, decreasing }) {
  const max = Math.max(0, ...[...increasing, ...decreasing].map((d) => Math.abs(Number(d.contribution ?? d.signedContribution ?? 0))));
  return (
    <div className="grid lg:grid-cols-2 gap-x-12">
      <div>
        <h3 className="text-sm font-semibold text-risk-red mb-2">Factors increasing risk</h3>
        {increasing.map((d) => <Driver key={d.key} d={d} max={max} increasing />)}
      </div>
      <div className="mt-8 lg:mt-0">
        <h3 className="text-sm font-semibold text-risk-green mb-2">Factors reducing risk</h3>
        {decreasing.map((d) => <Driver key={d.key} d={d} max={max} increasing={false} />)}
      </div>
    </div>
  );
}
