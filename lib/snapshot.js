export const SNAPSHOT_KEY = "nirman_demo_risk_index_snapshot_v3";

const splitCsvLine = (line) => {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
};

export function parseRiskSnapshot(csv) {
  const lines = String(csv).replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("The CSV must contain a header and at least one project row.");
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const required = ["project_id", "delay_6m", "delay_12m", "cost_overrun_6m", "cost_overrun_12m"];
  const missing = required.filter((field) => !headers.includes(field));
  if (missing.length) throw new Error(`This does not look like a NIRMAN risk snapshot. Missing columns: ${missing.join(", ")}.`);
  const records = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ""]));
  });
  const projects = records.map((raw) => {
    const riskScore = (key) => {
      if (raw[key] == null || String(raw[key]).trim() === "") return null;
      const value = Number(raw[key]);
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value > 1 ? value : value * 100)) : null;
    };
    const delay6m = riskScore("delay_6m");
    const delay12m = riskScore("delay_12m");
    const cost6m = riskScore("cost_overrun_6m");
    const cost12m = riskScore("cost_overrun_12m");
    // Average the four available risk indices so one outcome does not hide
    // the rest. The detail view still shows every outcome and horizon.
    const forecasts = [delay6m, delay12m, cost6m, cost12m].filter(Number.isFinite);
    const risk = forecasts.reduce((sum, value) => sum + value, 0) / forecasts.length;
    if (!Number.isFinite(risk)) throw new Error("A project row has no valid risk index values.");
    const band = risk > 60 ? "RED" : risk > 30 ? "AMBER" : "GREEN";
    const warningType = raw.warning_type || "";
    const numeric = (key) => raw[key] != null && String(raw[key]).trim() !== "" && Number.isFinite(Number(raw[key])) ? Number(raw[key]) : undefined;
    const sector = raw.sector_name || raw.sector || "";
    const agency = raw.executing_agency || raw.agency || "";
    const geography = [raw.district, raw.state_name || raw.state].filter((value) => value && value !== "Unavailable").join(", ");
    const descriptiveName = [sector, agency].filter((value) => value && value !== "Unavailable").join(" · ");
    const suppliedName = raw.project_name || raw.name;
    const isProjectId = suppliedName && (String(suppliedName).trim() === String(raw.project_id).trim() || /^P\d{4,}$/i.test(String(suppliedName).trim()));
    const displayName = suppliedName && !isProjectId ? suppliedName : [descriptiveName, geography].filter(Boolean).join(" — ") || "Infrastructure project";
    return {
      ...raw,
      id: String(raw.project_id).trim(),
      project_id: String(raw.project_id).trim(),
      name: displayName,
      state: raw.state_name || raw.state || "Unavailable",
      sector: raw.sector_name || raw.sector || "Unavailable",
      agency: raw.executing_agency || raw.agency || "Unavailable",
      risk,
      band,
      risk_band: ({ GREEN: "Stable", AMBER: "Elevated", RED: "Severe" })[band],
      risk6m: [delay6m, cost6m].filter(Number.isFinite).reduce((sum, value, _, rows) => sum + value / rows.length, 0),
      risk12m: [delay12m, cost12m].filter(Number.isFinite).reduce((sum, value, _, rows) => sum + value / rows.length, 0),
      delayRisk6m: delay6m,
      delayRisk12m: delay12m,
      costRisk6m: cost6m,
      costRisk12m: cost12m,
      earlyWarningActive: band !== "GREEN" && warningType !== "already overdue" && !warningType.includes("completed"),
      warningType,
      physical: numeric("actual_progress_pct"),
      expectedPhysical: numeric("planned_progress_pct"),
      financial: numeric("spend_pct_of_budget"),
      snapshotDate: raw.snapshot_date || raw.assessed_at || null,
      latitude: undefined,
      longitude: undefined
    };
  });
  const labels = new Map();
  projects.forEach((project) => labels.set(project.name, [...(labels.get(project.name) ?? []), project]));
  for (const group of labels.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => String(a.id).localeCompare(String(b.id))).forEach((project, index) => {
      project.name = `${project.name} · Project ${index + 1}`;
    });
  }
  return projects;
}

export function getSavedSnapshot() {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(SNAPSHOT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveRiskSnapshot(projects) {
  window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(projects));
}

export function clearRiskSnapshot() {
  window.localStorage.removeItem(SNAPSHOT_KEY);
}
