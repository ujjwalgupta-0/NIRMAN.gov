"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/ui";
import { getProjects } from "@/lib/api";
import { clearRiskSnapshot, parseRiskSnapshot, saveRiskSnapshot } from "@/lib/snapshot";

const SETTINGS = [
  ["Stable", "Up to 30%"],
  ["Elevated", "Above 30% to 60%"],
  ["Severe", "Above 60%"],
  ["Forecast horizons", "6 months and 12 months"],
  ["Refresh method", "Upload a new risk index CSV"]
];

export default function Settings() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { getProjects().then((projects) => setCount(projects.length)); }, []);

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setError("");
    try {
      const projects = parseRiskSnapshot(await file.text());
      saveRiskSnapshot(projects);
      setCount(projects.length);
      setMessage(`Imported ${projects.length} project forecasts from ${file.name}.`);
      router.refresh();
    } catch (e) {
      setError(e.message);
    }
    event.target.value = "";
  };

  const clear = () => {
    clearRiskSnapshot();
    getProjects().then((projects) => setCount(projects.length));
    setMessage("Custom forecast data removed. The bundled data will be used if available.");
    router.refresh();
  };

  return <>
    <h1 className="text-3xl font-bold">Data settings</h1>
    <p className="text-ink-500 mt-1">Upload a risk snapshot to refresh the project risk index data.</p>
    <Section title="Project risk index data" hint="Use the bundled demo snapshot or upload a compatible risk index CSV.">
      <div className="border border-ink-200 p-5 max-w-3xl">
        <p className="text-sm text-ink-700">The CSV must include project_id, delay_6m, delay_12m, cost_overrun_6m, and cost_overrun_12m. Values may be fractions from 0 to 1 or percentages from 0 to 100. Uploaded data is stored in this browser and replaces the bundled example data.</p>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <label className="btn-primary cursor-pointer">Upload risk index CSV<input className="sr-only" type="file" accept=".csv,text/csv" onChange={importFile} /></label>
          {count > 0 && <button className="btn-ghost" onClick={clear}>Restore bundled data</button>}
          <span className="text-sm text-ink-500">{count ? `${count} projects loaded` : "No forecast data available"}</span>
        </div>
        {message && <p role="status" className="text-sm text-risk-green mt-3">{message}</p>}
        {error && <p role="alert" className="text-sm text-risk-red mt-3">{error}</p>}
      </div>
    </Section>
    <Section title="Risk index levels">
      <dl className="max-w-2xl">
        {SETTINGS.map(([label, value]) => <div key={label} className="flex justify-between gap-6 py-3 border-b border-ink-200"><dt className="text-ink-700">{label}</dt><dd className="font-semibold text-right">{value}</dd></div>)}
      </dl>
    </Section>
  </>;
}
