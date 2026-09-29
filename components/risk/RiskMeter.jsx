"use client";

import { BAND_STYLE, HEADLINE, HEX, THRESHOLDS } from "@/lib/risk";

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const point = (value, radius = 92) => {
  const angle = Math.PI * (1 - value / 100);
  return { x: 120 + radius * Math.cos(angle), y: 108 - radius * Math.sin(angle) };
};

function arc(start, end, radius = 92) {
  const from = point(start, radius);
  const to = point(end, radius);
  const large = end - start > 50 ? 1 : 0;
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} 1 ${to.x} ${to.y}`;
}

export default function RiskMeter({ risk, band, change, label = "Current project risk" }) {
  const value = clamp(risk);
  const style = BAND_STYLE[band] ?? BAND_STYLE.GREEN;
  const color = HEX[band] ?? HEX.GREEN;

  return (
    <section className="mx-auto grid w-full max-w-[520px] gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-md shadow-slate-900/10 sm:px-6" aria-label={label}>
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wide text-slate-600">{label}</p>
        <p className="mt-1 text-4xl font-black leading-none tracking-tight tabular-nums text-slate-950 sm:text-5xl">{value.toFixed(1)}<span className="ml-1 text-xl font-bold text-slate-500">%</span></p>
        <span className={`mt-2 inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${style.text} ${style.soft}`}>
          {style.label} outlook
        </span>
        <div role="img" aria-label={`Risk dial: ${value.toFixed(1)} percent; stable through ${THRESHOLDS.amber} percent, elevated through ${THRESHOLDS.red} percent, severe above ${THRESHOLDS.red} percent`} className="mx-auto max-w-[330px]">
          <svg viewBox="0 0 240 142" className="w-full overflow-visible" aria-hidden="true">
            <path d={arc(0, 100)} fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round" />
            <path d={arc(0, THRESHOLDS.amber)} fill="none" stroke="#22c55e" strokeOpacity=".72" strokeWidth="16" />
            <path d={arc(THRESHOLDS.amber, THRESHOLDS.red)} fill="none" stroke="#f59e0b" strokeOpacity=".82" strokeWidth="16" />
            <path d={arc(THRESHOLDS.red, 100)} fill="none" stroke="#ef4444" strokeOpacity=".88" strokeWidth="16" />
            {[0, THRESHOLDS.amber, THRESHOLDS.red, 100].map((tick) => {
              const p = point(tick, 112);
              return <text key={tick} x={p.x} y={p.y + 4} textAnchor="middle" className="fill-slate-600 text-[9px] font-semibold">{tick}%</text>;
            })}
            {(() => {
              const tip = point(value, 73);
              return <><line x1="120" y1="108" x2={tip.x} y2={tip.y} stroke={color} strokeWidth="5" strokeLinecap="round" /><circle cx="120" cy="108" r="8" fill={color} stroke="#fff" strokeWidth="2.5" /></>;
            })()}
          </svg>
        </div>
        <p className="-mt-2 text-center text-xs font-medium text-slate-600">Stable ≤ {THRESHOLDS.amber}% · Elevated &gt; {THRESHOLDS.amber}%–{THRESHOLDS.red}% · Severe &gt; {THRESHOLDS.red}%</p>
      </div>

      <div className="mx-auto max-w-xl border-t border-slate-200 pt-3 text-center">
        <p className={`text-sm font-bold ${style.text}`}>{style.label} risk</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{HEADLINE[band] ?? HEADLINE.GREEN}</p>
        {Number.isFinite(change) && <p className="mt-2 text-xs text-slate-500">Change: <span className="font-bold tabular-nums text-slate-900">{change > 0 ? "+" : change < 0 ? "−" : ""}{Math.abs(change).toFixed(1)} pp</span></p>}
      </div>
    </section>
  );
}
