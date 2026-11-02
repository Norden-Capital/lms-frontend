import type { Metadata } from "next"
import { ShieldAlert } from "lucide-react"

import { ChannelFunnel } from "@/components/customers/channelFunnel"
import { LeadsChart } from "@/components/customers/leadsChart"
import { OverviewFilters } from "@/components/customers/overviewFilters"
import { PageHeader } from "@/components/layout/pageHeader"
import { StatCard } from "@/components/stats/statCard"
import { getApplicationsOverview, listApplicationBrands } from "@/lib/applications"
import type { ApplicationsOverview, OverviewQuery } from "@/lib/applicationTypes"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Leads overview",
}

const ANSWERS: [string, string][] = [
  ["SOLD", "Sold"],
  ["CPF", "CPF"],
  ["NOT_SOLD", "Not sold"],
  ["EXISTS", "Already applied"],
]

/**
 * The numbers for leads. This is also the page everyone lands on after signing
 * in, so someone without the permission gets a short message here rather than
 * the refused page.
 */
export default async function LeadsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<OverviewQuery>
}) {
  await requireUser()

  const query = await searchParams
  const [result, brands] = await Promise.all([getApplicationsOverview(query), listApplicationBrands()])

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Leads Overview"
        description="How many people applied, and how far they got."
        actions={result.ok ? <OverviewFilters query={query} brands={brands.ok ? brands.data : []} /> : undefined}
      />

      {result.ok ? (
        <Numbers overview={result.data} />
      ) : (
        <div className="flex justify-center">
          <div className="flex max-w-md flex-col items-center gap-2 rounded-md border bg-card p-8 text-center">
            <ShieldAlert className="size-5 text-warning" aria-hidden />
            <p className="text-sm font-medium">
              {result.error.status === 403 ? "You don't have access to leads" : "Could not load the numbers"}
            </p>
            <p className="text-xs text-muted-foreground">
              {result.error.status === 403 ? "Ask an administrator to give you access." : result.error.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Numbers({ overview }: { overview: ApplicationsOverview }) {
  const started = overview.leads + overview.abandoned + overview.failed
  const finishRate = started === 0 ? "—" : `${Math.round((overview.leads / started) * 100)}%`

  return (
    <>
      <ChannelFunnel funnel={overview.funnel} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads" value={overview.leads} hint="Finished step 2 and LeadScout took them." />
        <StatCard label="Abandoned" value={overview.abandoned} hint="Finished step 1, but not step 2." />
        <StatCard label="Failed" value={overview.failed} hint="Finished step 2, but LeadScout did not take them." />
        <StatCard label="Finish rate" value={finishRate} hint="Leads out of everyone who finished step 1." />
      </div>

      <section className="rounded-lg border bg-muted/40 p-0.5" aria-labelledby="leads-per-day">
        <h2 id="leads-per-day" className="px-3 py-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
          Leads per day
        </h2>
        <div className="rounded-md border bg-card p-4 pt-6">
          <LeadsChart days={overview.daily} />
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border bg-muted/40 p-0.5" aria-labelledby="by-brand">
          <h2 id="by-brand" className="px-3 py-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
            By brand
          </h2>
          <div className="overflow-auto rounded-md border bg-card">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Brand</th>
                  <th className="px-4 py-2 text-right font-medium">Leads</th>
                  <th className="px-4 py-2 text-right font-medium">Abandoned</th>
                  <th className="px-4 py-2 text-right font-medium">Failed</th>
                </tr>
              </thead>
              <tbody>
                {overview.brands.length === 0 ? (
                  <tr className="border-t">
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No brands yet.
                    </td>
                  </tr>
                ) : (
                  overview.brands.map((brand) => (
                    <tr key={brand.id} className="border-t">
                      <td className="px-4 py-2">{brand.name}</td>
                      <td className="px-4 py-2 text-right">{brand.leads}</td>
                      <td className="px-4 py-2 text-right">{brand.abandoned}</td>
                      <td className="px-4 py-2 text-right">{brand.failed}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border bg-muted/40 p-0.5" aria-labelledby="leadscout-answers">
          <h2 id="leadscout-answers" className="px-3 py-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
            LeadScout answers
          </h2>
          <dl className="flex flex-col rounded-md border bg-card text-sm tabular-nums">
            {ANSWERS.map(([key, label], index) => (
              <div key={key} className={index === 0 ? "flex justify-between px-4 py-2" : "flex justify-between border-t px-4 py-2"}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{overview.leadscout[key] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  )
}
