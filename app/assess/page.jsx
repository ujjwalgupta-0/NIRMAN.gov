import Link from "next/link";
import { Section } from "@/components/ui";

export default function AssessPage() {
  return <>
    <h1 className="text-3xl font-bold">Forecast data workflow</h1>
    <p className="text-ink-500 mt-1">Review the illustrative risk index used across the portfolio.</p>
    <Section title="Update project forecasts">
      <p className="text-sm text-ink-700 max-w-3xl">The demonstration dataset provides schedule and cost risk index scores at 6- and 12-month horizons. Upload a compatible risk snapshot to replace the bundled example data.</p>
      <Link href="/settings" className="btn-primary inline-flex mt-5">Manage forecast data</Link>
    </Section>
  </>;
}
