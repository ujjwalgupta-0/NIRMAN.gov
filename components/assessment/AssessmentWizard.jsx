"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { assessProject, isLive } from "@/lib/api";
import { ErrorState, FieldLabel } from "@/components/ui";

/** { key, label, type, required, options?, hint }. Hints are the plain-language
 *  explanation shown when the person hovers or focuses the info icon next to
 *  a field - the wizard never asks for a raw ML feature name. */
const STEPS = [
  ["Project identity", [
    { key: "name", label: "Project name", type: "text", required: true,
      hint: "The official name used for this project in monitoring records." },
    { key: "state", label: "State", type: "select", required: true,
      options: ["Punjab", "Maharashtra", "Odisha", "Assam", "Tamil Nadu", "Gujarat", "Bihar", "Karnataka", "Uttarakhand", "Rajasthan"],
      hint: "State or union territory where the project is being executed." },
    { key: "sector", label: "Sector", type: "select", required: true,
      options: ["Roads", "Railways", "Power", "Water Resources", "Urban Transport", "Ports", "Health", "Petroleum"],
      hint: "Infrastructure sector this project belongs to." },
    { key: "agency", label: "Implementing agency", type: "text", required: true,
      hint: "Central or state agency responsible for executing the project." },
    { key: "city_district", label: "City / district", type: "text", required: true,
      hint: "City or district where the project site is located." },
    { key: "cost", label: "Original sanctioned cost (₹ crore)", type: "number", required: true,
      hint: "The project cost sanctioned at approval, before any later revision." }
  ]],
  ["Schedule", [
    { key: "plannedDuration", label: "Planned duration (months)", type: "number", required: true,
      hint: "Total duration planned for the project at sanction." },
    { key: "currentMonth", label: "Current project month", type: "number", required: true,
      hint: "How many months have elapsed since the project started." },
    { key: "completionDate", label: "Original completion date", type: "date", required: false,
      hint: "The completion date originally sanctioned for this project." },
    { key: "revisions", label: "Schedule revisions so far", type: "number", required: false,
      hint: "Number of times the completion schedule has been formally revised." },
    { key: "scheduleDeviation", label: "Schedule deviation (%)", type: "number", required: true,
      hint: "How far behind the sanctioned schedule the project currently is." },
    { key: "revisions", label: "Formal budget or schedule revisions", type: "number", required: false,
      hint: "Cumulative number of approved formal revisions." }
  ]],
  ["Progress", [
    { key: "physical", label: "Physical progress (%)", type: "number", required: true,
      hint: "Share of the physical work actually completed so far." },
    { key: "expectedPhysical", label: "Expected physical progress (%)", type: "number", required: true,
      hint: "Share of physical work that should have been completed by now, per the sanctioned schedule." },
    { key: "financial", label: "Financial progress (%)", type: "number", required: true,
      hint: "Share of the sanctioned cost already spent." },
    { key: "velocity", label: "3-month execution velocity (pp per month)", type: "number", required: false,
      hint: "Average physical progress achieved per month over the last three months." },
    { key: "expenditureChange", label: "Recent expenditure change (%)", type: "number", required: false,
      hint: "How much monthly expenditure has changed recently, against the sanctioned profile." },
    { key: "missed_milestones_count", label: "Missed milestones to date", type: "number", required: false,
      hint: "Cumulative number of key project milestones missed." }
  ]],
  ["Constraints", [
    { key: "landDelay", label: "Land acquisition delay (months)", type: "number", required: true,
      hint: "Months of delay in acquiring the land needed for the remaining work. Enter 0 if none." },
    { key: "clearanceDelay", label: "Clearance delay (months)", type: "number", required: true,
      hint: "Months of delay in obtaining statutory or environmental clearances. Enter 0 if none." },
    { key: "litigation", label: "Litigation pending", type: "select", required: true, options: ["No", "Yes"],
      hint: "Whether any litigation is currently pending that could stall the project." },
    { key: "monsoonExposure", label: "Monsoon exposure (0-10)", type: "number", required: false,
      hint: "How much of the remaining work falls within the monsoon season. 0 means none, 10 means heavily exposed." },
    { key: "weather_delay_factor", label: "Weather delay factor (0.10-0.85)", type: "number", required: false,
      hint: "Seasonal climate risk factor for the project location." },
    { key: "festival_labor_shortage_pct", label: "Festival labor shortage (0-0.30)", type: "number", required: false,
      hint: "Expected migrant labor attrition during regional festival periods." }
  ]],
  ["Contractor and execution", [
    { key: "contractorRecord", label: "Contractor track record", type: "select", required: true, options: ["Strong", "Adequate", "Weak"],
      hint: "The executing contractor's track record on past projects of similar scale." },
    { key: "milestoneSlippages", label: "Milestone slippages", type: "number", required: false,
      hint: "Number of contractual milestones missed so far." },
    { key: "stagnation", label: "Recent progress stagnation", type: "select", required: true, options: ["No", "Yes"],
      hint: "Whether physical progress has stalled in recent reporting periods." },
    { key: "majorIssue", label: "Major execution issue reported", type: "select", required: true, options: ["No", "Yes"],
      hint: "Whether a major execution issue - such as contractor default or force majeure - has been reported." },
    { key: "active_projects_within_30km", label: "Other active projects within 30 km", type: "number", required: false,
      hint: "Nearby projects that may compete for labor, materials, or machinery." },
    { key: "local_supply_competition_score", label: "Local supply competition (0-1)", type: "number", required: false,
      hint: "Competition for raw materials and skilled labor in the local area." },
    { key: "private_funding_share_pct", label: "Private funding share (0-1)", type: "number", required: false,
      hint: "Fraction of total capital funded by private co-financing or PPP investment." },
    { key: "available_surplus_machinery_units", label: "Surplus machinery units", type: "number", required: false,
      hint: "Idle heavy machinery units that may be available for transfer." }
  ]]
];

const ALL_FIELDS = STEPS.flatMap(([, fields]) => fields);
const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const CHECKS = ["Validating project information", "Checking data consistency", "Engineering risk indicators",
  "Running predictive risk engine", "Generating risk explanation"];

function Processing() {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone((d) => Math.min(CHECKS.length, d + 1)), 420);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold mb-4">Processing project</h2>
      <ul className="space-y-3">
        {CHECKS.map((c, i) => (
          <li key={c} className={`flex items-center gap-3 text-sm ${i < done ? "text-ink-900" : "text-ink-500"}`}>
            <Icon name="check" className={`h-4 w-4 ${i < done ? "text-risk-green" : "text-ink-200"}`} />{c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AssessmentWizard({ onResult }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ state: "Punjab", sector: "Roads", litigation: "No", stagnation: "No", majorIssue: "No", contractorRecord: "Adequate" });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({});
  const review = step === STEPS.length;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: false }));
  };

  const missingIn = (fields) => fields.filter((f) => f.required && !isFilled(form[f.key]));

  const next = () => {
    const missing = missingIn(STEPS[step][1]);
    if (missing.length) return setErrors(Object.fromEntries(missing.map((f) => [f.key, true])));
    setStep(step + 1);
  };

  const submit = async () => {
    const missing = missingIn(ALL_FIELDS);
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((f) => [f.key, true])));
      return setStep(STEPS.findIndex(([, fields]) => fields.some((f) => f.key === missing[0].key)));
    }
    if (!isLive()) {
      onResult({ draft: true, input: { ...form } });
      return;
    }
    setState({ loading: true });
    try {
      const [result] = await Promise.all([assessProject(form), new Promise((r) => setTimeout(r, 2200))]);
      onResult(result);
    } catch (e) {
      setState({ error: e.message });
    }
  };

  if (state.loading) return <Processing />;
  if (state.error) return <ErrorState message={state.error} retry={submit} />;

  return (
    <div className="max-w-3xl">
      <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm border-b border-ink-200 pb-4 mb-8">
        {[...STEPS.map(([t]) => t), "Review"].map((t, i) => (
          <li key={t} className={i === step ? "font-semibold text-gov-800" : i < step ? "text-ink-700" : "text-ink-500"}>
            {i < step && <Icon name="check" className="h-3.5 w-3.5 inline mr-1 text-risk-green" />}{t}
          </li>
        ))}
      </ol>

      {!review ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {STEPS[step][1].map(({ key: k, label, type, required, options, hint }) => (
            <div key={k} className={type === "text" && k === "name" ? "sm:col-span-2" : ""}>
              <FieldLabel htmlFor={k} label={label} required={required} hint={hint} />
              {type === "select" ? (
                <select id={k} className="field" value={form[k] || ""} onChange={(e) => set(k, e.target.value)}>
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input id={k} type={type} className={`field ${errors[k] ? "border-risk-red" : ""}`}
                  aria-invalid={errors[k] || undefined} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
              )}
              {errors[k] && <p className="text-xs text-risk-red mt-1">This field is required.</p>}
            </div>
          ))}
        </div>
      ) : (
        <dl className="grid sm:grid-cols-2 gap-x-10">
          {ALL_FIELDS.map(({ key: k, label }) => (
            <div key={k} className="py-2.5 border-b border-ink-200 flex justify-between gap-4 text-sm">
              <dt className="text-ink-500">{label}</dt>
              <dd className="font-medium text-right">{form[k] || "—"}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex gap-3 mt-8">
        {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>{review ? "Edit" : "Back"}</button>}
        {review
          ? <button className="btn-primary" onClick={submit}>{isLive() ? "Assess risk" : "Save input profile"}</button>
          : <button className="btn-primary" onClick={next}>Continue</button>}
      </div>
    </div>
  );
}
