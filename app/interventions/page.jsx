import Link from "next/link";
import { Section } from "@/components/ui";

export default function Interventions() {
  return <>
    <h1 className="text-3xl font-bold">Intervention planning</h1>
    <p className="text-ink-500 mt-1">Use forecast signals to prioritize project reviews and coordinate follow-up.</p>
    <Section title="Review guidance">
      <p className="text-sm text-ink-700 max-w-3xl">Forecasts highlight projects that may need attention. Intervention recommendations are not generated automatically, so review project context before deciding on an action.</p>
      <Link href="/risk-radar" className="btn-primary inline-flex mt-5">Open risk radar</Link>
    </Section>
  </>;
}
