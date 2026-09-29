function parseCsv(text) {
  const [headerLine, ...lines] = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [headers[index], value])));
}

export async function getContractorPerformance() {
  const [contractorsResponse, contractsResponse] = await Promise.all([
    fetch("/data/nirman_contractors.csv"),
    fetch("/data/nirman_contract_register.csv")
  ]);
  if (!contractorsResponse.ok || !contractsResponse.ok) throw new Error("Contractor performance data could not be loaded.");
  const [contractorCsv, contractCsv] = await Promise.all([contractorsResponse.text(), contractsResponse.text()]);
  const contractors = parseCsv(contractorCsv);
  const contracts = parseCsv(contractCsv);
  return contractors.map((contractor) => {
    const completed = contracts.filter((contract) => contract.contractor_id === contractor.contractor_id && contract.contract_status === "completed");
    const values = (key) => completed.map((contract) => Number(contract[key])).filter(Number.isFinite);
    const delays = values("delay_months");
    const overruns = values("cost_overrun_pct");
    const paired = completed.filter((contract) => Number.isFinite(Number(contract.delay_months)) && Number.isFinite(Number(contract.cost_overrun_pct)));
    const favorable = paired.filter((contract) => Number(contract.delay_months) <= 0 && Number(contract.cost_overrun_pct) <= 0).length;
    const mean = (items) => items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : null;
    return {
      id: contractor.contractor_id,
      name: contractor.contractor_name,
      completedCount: completed.length,
      pairedCount: paired.length,
      onTimeRate: delays.length ? delays.filter((value) => value <= 0).length / delays.length * 100 : null,
      withinBudgetRate: overruns.length ? overruns.filter((value) => value <= 0).length / overruns.length * 100 : null,
      favorableRate: paired.length ? favorable / paired.length * 100 : null,
      averageDelay: mean(delays),
      averageOverrun: mean(overruns)
    };
  }).sort((a, b) => (b.favorableRate ?? -1) - (a.favorableRate ?? -1) || b.pairedCount - a.pairedCount || a.name.localeCompare(b.name));
}
