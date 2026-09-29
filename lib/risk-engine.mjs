const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const number = (value, fallback = 0) => value != null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : fallback;
const positive = (value) => Math.max(0, number(value));
const riskIndex = (value) => clamp(value, 8, 92);

/** Shared illustrative scoring rules for the bundled data and what-if reports. */
export function calculateRiskIndices(input = {}) {
  const actual = number(input.actualProgress, 0);
  const planned = number(input.plannedProgress, actual);
  const quality = number(input.qualityScore, 82);
  const milestoneOnTime = number(input.milestoneOnTime, 100);
  const milestoneCompletion = number(input.milestoneCompletion, 100);
  const materialPass = number(input.materialPass, 90);
  const inspection = number(input.inspectionScore, 80);
  const rework = number(input.reworkPct, 5);
  const workload = positive(input.contractorWorkload);
  const contractorHistory = number(input.contractorHistory, 10);
  const remainingBudget = number(input.remainingBudget, 1);
  const spendPct = number(input.spendPct, 100);
  const monthsToCompletion = number(input.monthsToCompletion, 12);
  const rainfall = number(input.rainfallPct, 100);

  const schedulePressure = clamp(
    2 + positive(input.scheduleDelay) * 2 + Math.max(0, planned - actual) * 0.36 +
    positive(input.monthsPastDeadline) * 2.4 + Math.max(0, 6 - monthsToCompletion) * 0.2 +
    (100 - milestoneOnTime) * 0.11 + Math.max(0, 70 - milestoneCompletion) * 0.1 +
    positive(input.contractorDelayRate) * 0.08 + positive(input.contractorDelayMonths) * 0.5 +
    Math.max(0, 10 - contractorHistory) * 0.15 + workload * 0.6 +
    Math.max(0, 100 - quality) * 0.2 + Math.max(0, 90 - materialPass) * 0.06 +
    Math.max(0, 80 - inspection) * 0.05 + Math.max(0, rework - 5) * 0.08 +
    positive(input.workingDayLoss) * 0.12 + positive(input.festivalCount) * 0.15 +
    positive(input.monsoonDaysThisMonth) * 0.08 + Math.max(0, rainfall - 100) * 0.015
  , 0, 100);
  const budgetPressure = Math.max(positive(input.budgetExceeded), positive(-remainingBudget));
  const costPressure = clamp(
    2 + positive(input.costOverrunToDate) * 1.35 + Math.max(0, spendPct - 100) * 0.55 +
    budgetPressure * 0.12 + positive(input.contractorCostOverrunRate) * 0.1 +
    Math.max(0, 82 - quality) * 0.25 + workload * 0.5 +
    Math.max(0, 90 - materialPass) * 0.1 + Math.max(0, 80 - inspection) * 0.06 +
    Math.max(0, rework - 5) * 0.2 + Math.max(0, 10 - contractorHistory) * 0.1
  , 0, 100);

  const delay6 = riskIndex(schedulePressure);
  const delay12 = riskIndex(schedulePressure + 5 + schedulePressure * 0.08);
  const cost6 = riskIndex(costPressure);
  const cost12 = riskIndex(costPressure + 4 + costPressure * 0.07);
  return {
    delay6, delay12, cost6, cost12,
    headline: (delay6 + delay12 + cost6 + cost12) / 4
  };
}
