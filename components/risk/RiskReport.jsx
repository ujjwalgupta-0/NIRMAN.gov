import { Section, RiskBadge } from "@/components/ui";
import { stamp } from "@/lib/risk";
import RiskMeter from "./RiskMeter";
import RiskMovement from "./RiskMovement";
import ProjectSnapshot from "./ProjectSnapshot";
import RiskDrivers from "./RiskDrivers";
import WhyRiskChanged from "./WhyRiskChanged";
import RiskTrajectory from "./RiskTrajectory";
import EarlyWarning from "./EarlyWarning";

/**
 * Zones 1-7 of the risk page. Existing projects pass history and change data;
 * a newly assessed project simply passes fewer props and those zones drop out.
 */
export default function RiskReport({ project: p, explanations, history, earlyWarning, live }) {
  return (
    <>
      <header className="pb-6 border-b border-ink-200">
        <p className="text-sm text-ink-500">Project risk intelligence</p>
        <h1 className="text-3xl font-bold mt-1">{p.name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-ink-700">
          <span>{p.state}</span><span className="text-ink-200">|</span>
          <span>{p.sector}</span><span className="text-ink-200">|</span>
          <span>{p.agency}</span>
          <RiskBadge band={p.band} />
          {live && p.assessedAt && (
            <span className="flex items-center gap-2 ml-auto text-xs">
              <span className="h-2 w-2 rounded-full bg-risk-green" aria-hidden />
              Live monitoring · latest assessment {stamp(p.assessedAt)}
            </span>
          )}
        </div>
      </header>

      <div className="mt-8">
        <RiskMeter risk={p.risk} band={p.band} change={p.change30} />
      </div>

      {p.previousRisk != null && (
        <Section title="Is the risk getting better or worse?">
          <RiskMovement previous={p.previousRisk} current={p.risk} change30={p.change30} change90={p.change90} />
        </Section>
      )}

      <Section title="Project status" hint="Latest reported position against the sanctioned programme.">
        <ProjectSnapshot p={p} />
      </Section>

      <Section title="Why is this project risky?" hint="Model contribution by factor. Select a factor for its interpretation.">
        {explanations.increasing?.length || explanations.decreasing?.length
          ? <RiskDrivers increasing={explanations.increasing || []} decreasing={explanations.decreasing || []} />
          : <p className="text-sm text-ink-600 border border-dashed border-ink-200 p-4">Model driver contributions are unavailable. They will appear when the connected risk service returns feature attributions.</p>}
      </Section>

      {explanations.change && (
        <Section title="Why risk changed this period" hint="Movement in factor contribution since the previous assessment.">
          <WhyRiskChanged change={explanations.change} />
        </Section>
      )}

      {history?.length > 0 && (
        <Section title="Risk trajectory" hint="When the deterioration began.">
          <RiskTrajectory history={history} />
        </Section>
      )}

      <Section title="Early warning">
        <EarlyWarning w={earlyWarning} />
      </Section>
    </>
  );
}
