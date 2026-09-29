import { getSavedSnapshot, parseRiskSnapshot } from "./snapshot";

const savedProjects = () => getSavedSnapshot();
let bundledSnapshotPromise;

async function loadProjects() {
  const saved = savedProjects();
  if (typeof window === "undefined") return [];
  bundledSnapshotPromise ??= (async () => {
    try {
      const response = await fetch("/data/nirman_v7_project_risk.csv?v=3", { cache: "no-store" });
      const bundledProjects = response.ok ? parseRiskSnapshot(await response.text()) : [];
      const projects = saved.length ? saved : bundledProjects;
      if (!projects.length) return [];
      // Scenario details enrich project pages, but the risk CSV is sufficient
      // to populate forecasts and should remain usable if this file is absent.
      const scenarioInputs = await fetch("/data/nirman_v7_scenario_inputs.json?v=3", { cache: "no-store" })
        .then((scenarioResponse) => scenarioResponse.ok ? scenarioResponse.json() : [])
        .catch(() => []);
      // The exported JSON may be a plain array or a column-oriented export
      // wrapped in a `value` property. Normalize both before enriching rows.
      const inputs = Array.isArray(scenarioInputs)
        ? scenarioInputs
        : Array.isArray(scenarioInputs?.value)
          ? scenarioInputs.value
          : [];
      const byId = new Map(inputs.map((item) => [String(item.project_id), item]));
      const numeric = (value) => value != null && String(value).trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined;
      return projects.map((project) => {
        const row = byId.get(String(project.id));
        if (!row) return project;
        return {
          ...project,
          scenarioInputs: {
            ...row,
            snapshotDate: row.snapshotDate || row.snapshot_date || project.snapshotDate,
            projectStatus: row.projectStatus || row.project_status,
            season: row.season || "unknown",
            climateRegion: row.climateRegion || row.climate_region || "Unavailable",
            unionTerritory: row.unionTerritory ?? String(row.is_union_territory).toLowerCase() === "true",
            monthsElapsed: numeric(row.monthsElapsed ?? row.months_elapsed),
            monthsToCompletion: numeric(row.monthsToCompletion ?? row.months_to_planned_completion),
            actualProgress: numeric(row.actualProgress ?? row.actual_progress_pct),
            plannedProgress: numeric(row.plannedProgress ?? row.planned_progress_pct),
            scheduleDelay: numeric(row.scheduleDelay ?? row.schedule_delay_months),
            monthsPastDeadline: numeric(row.monthsPastDeadline ?? row.months_past_planned_completion),
            spendPct: numeric(row.spendPct ?? row.spend_pct_of_budget),
            remainingBudget: numeric(row.remainingBudget ?? row.remaining_budget_cr),
            budgetExceeded: numeric(row.budgetExceeded ?? row.budget_exceeded_cr),
            costOverrunToDate: numeric(row.costOverrunToDate ?? row.cost_overrun_to_date_pct),
            plannedCost: numeric(row.plannedCost ?? row.planned_cost_cr),
            plannedMonths: numeric(row.plannedMonths ?? row.planned_months),
            milestoneCompletion: numeric(row.milestoneCompletion ?? row.milestone_completion_pct),
            milestoneOnTime: numeric(row.milestoneOnTime ?? row.milestone_on_time_rate),
            qualityScore: numeric(row.qualityScore ?? row.quality_score),
            materialPass: numeric(row.materialPass ?? row.material_test_pass_pct),
            inspectionScore: numeric(row.inspectionScore ?? row.site_inspection_score),
            reworkPct: numeric(row.reworkPct ?? row.rework_pct),
            contractorId: row.contractorId || row.contractor_id,
            contractorName: row.contractorName || row.contractor_name,
            contractorWorkload: numeric(row.contractorWorkload ?? row.contractor_current_workload),
            contractorHistory: numeric(row.contractorHistory ?? row.contractor_prior_completed_projects),
            contractorDelayRate: numeric(row.contractorDelayRate ?? row.contractor_historical_delay_rate),
            contractorDelayMonths: numeric(row.contractorDelayMonths ?? row.contractor_historical_avg_delay_months),
            contractorCostOverrunRate: numeric(row.contractorCostOverrunRate ?? row.contractor_historical_cost_overrun_rate),
            workingDayLoss: numeric(row.calendar_working_day_loss_pct),
            festivalWindow: numeric(row.festival_impact_window_flag),
            festivalCount: numeric(row.gazetted_festival_count),
            allFestivalCount: numeric(row.festival_count),
            holidayDays: numeric(row.official_holiday_days_in_month),
            daysToFestival: numeric(row.days_to_next_festival),
            daysSinceFestival: numeric(row.days_since_last_festival),
            majorFestival: numeric(row.major_festival),
            compulsoryFestivalCount: numeric(row.compulsory_festival_count),
            stateFestivalCount: numeric(row.state_specific_festival_count),
            unverifiedFestivalCount: numeric(row.unverified_festival_count),
            monsoonDays: numeric(row.sw_monsoon_days_prev_month),
            rainfallPct: numeric(row.rainfall_pct_of_normal_prev_month),
            monsoonFlag: numeric(row.monsoon_flag),
            swMonsoonFlag: numeric(row.sw_monsoon_flag),
            neMonsoonFlag: numeric(row.ne_monsoon_flag),
            monsoonDaysThisMonth: numeric(row.monsoon_days_in_month),
            seasonDays: numeric(row.season_days_in_month),
            swMonsoonDaysThisMonth: numeric(row.sw_monsoon_days_in_month),
            neMonsoonDays: numeric(row.ne_monsoon_days_in_month)
          }
        };
      });
    } catch {
      // Do not keep a failed request cached; useData's Retry action can try again.
      bundledSnapshotPromise = undefined;
      return [];
    }
  })();
  return bundledSnapshotPromise;
}

export const isLive = () => false;
export const isSnapshotLoaded = () => savedProjects().length > 0;

export function normalizeProject(raw = {}) {
  return raw;
}

export async function getProjects() {
  return loadProjects();
}

export async function getProject(id) {
  const requestedId = String(id ?? "").trim().toLocaleUpperCase("en-IN");
  const project = (await loadProjects()).find((item) => String(item.id ?? "").trim().toLocaleUpperCase("en-IN") === requestedId);
  if (!project) throw new Error(`Project ${String(id ?? "").trim()} is not in the currently loaded project data.`);
  return project;
}

export async function getPortfolio() {
  const projects = await loadProjects();
  const count = (band) => projects.filter((project) => project.band === band).length;
  const sectors = [...new Set(projects.map((project) => project.sector))].map((sector) => {
    const rows = projects.filter((project) => project.sector === sector);
    return { sector, count: rows.length, risk: +(rows.reduce((sum, project) => sum + project.risk, 0) / rows.length).toFixed(1) };
  });
  return {
    total: projects.length,
    critical: count("RED"),
    watch: count("AMBER"),
    stable: count("GREEN"),
    emerging: null,
    warnings: projects.filter((project) => project.earlyWarningActive).length,
    exposure: null,
    avgLead: null,
    sectors,
    trend: []
  };
}

export async function getRiskHistory() { return []; }
export async function getExplanations() { return { increasing: [], decreasing: [], change: null }; }

export async function getEarlyWarning(id) {
  const project = await getProject(id);
  return {
    active: project.earlyWarningActive,
    threshold: 30,
    currentRisk: project.risk,
    warningType: project.warningType,
    note: "Warning classification is from the imported notebook snapshot."
  };
}

export async function getInterventions() { return []; }

export async function runWhatIf() {
  throw new Error("The illustrative risk index does not recalculate scores for what-if scenarios.");
}

export async function assessProject() {
  throw new Error("The illustrative risk index does not score new project inputs.");
}
