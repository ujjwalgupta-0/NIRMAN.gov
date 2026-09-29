import Icon from "@/components/Icon";
import { BAND_STYLE } from "@/lib/risk";

/** Label for a form field, with a required marker and an optional hover/focus
 *  tooltip explaining what the field means in plain language. */
export const FieldLabel = ({ htmlFor, label, required, hint }) => (
  <span className="flex items-center gap-1.5 mb-1">
    <label htmlFor={htmlFor} className="text-sm text-ink-700">
      {label}{required && <span className="text-risk-red" aria-hidden> *</span>}
    </label>
    {hint && (
      <span className="group relative inline-flex">
        <button type="button" aria-label={`What is ${label}?`} aria-describedby={`${htmlFor}-hint`}
          className="text-ink-500 hover:text-gov-800 focus-visible:text-gov-800">
          <Icon name="info" className="h-3.5 w-3.5" />
        </button>
        <span id={`${htmlFor}-hint`} role="tooltip"
          className="pointer-events-none absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-56
            bg-ink-900 text-white text-xs leading-snug p-2.5 group-hover:block group-focus-within:block">
          {hint}
        </span>
      </span>
    )}
  </span>
);

export const Section = ({ title, hint, right, children }) => (
  <section className="border-t border-ink-200 pt-6 mt-10 first:mt-0 first:border-0 first:pt-0">
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {hint && <p className="text-sm text-ink-500 mt-0.5">{hint}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

export const Metric = ({ label, value, sub }) => (
  <div className="py-3 border-b border-ink-200">
    <dt className="text-sm text-ink-500">{label}</dt>
    <dd className="text-xl font-semibold mt-0.5">
      {value}
      {sub && <span className="ml-2 text-sm font-normal text-ink-500">{sub}</span>}
    </dd>
  </div>
);

export const RiskBadge = ({ band, size = "sm" }) => {
  const s = BAND_STYLE[band];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${s.border} ${s.soft} ${s.text} font-semibold ${size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.bg}`} aria-hidden />
      {band}
    </span>
  );
};

export const Bar = ({ value, max, band = "RED" }) => (
  <div className="h-2.5 bg-ink-100 w-full">
    <div className={`h-full ${BAND_STYLE[band].bg}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
  </div>
);

export const Loading = ({ rows = 4 }) => (
  <div className="space-y-3" role="status" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-10 bg-ink-100 animate-pulse" />
    ))}
  </div>
);

export const ErrorState = ({ message, retry }) => (
  <div className="border border-ink-200 p-6">
    <p className="flex items-center gap-2 font-semibold"><Icon name="alert" className="h-4 w-4 text-risk-red" />Unable to load risk data</p>
    <p className="text-sm text-ink-500 mt-1">{message}</p>
    {retry && <button className="btn-ghost mt-4" onClick={retry}>Retry</button>}
  </div>
);

export const Empty = ({ message, action }) => (
  <div className="border border-dashed border-ink-200 p-10 text-center">
    <p className="text-ink-700">{message}</p>
    {action}
  </div>
);
