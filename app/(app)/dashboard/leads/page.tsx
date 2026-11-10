import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ShieldAlert } from "lucide-react"

import { FormFunnel } from "@/components/customers/formFunnel"
import { DailyBars, TrendCard } from "@/components/customers/overviewCharts"
import { OverviewBreakdown } from "@/components/customers/overviewBreakdown"
import { OverviewFilters } from "@/components/customers/overviewFilters"
import { PageHeader } from "@/components/layout/pageHeader"
import { getApplicationsOverview, listApplicationBrands } from "@/lib/applications"
import type { ApplicationsOverview, BrandOption, OverviewQuery } from "@/lib/applicationTypes"
import { requireUser } from "@/lib/auth"
import { count, share } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Leads overview",
}

const HEAD = "px-3 py-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

/**
 * The numbers for leads. This is also the page everyone lands on after signing
 * in, so someone without the permission gets a short message here rather than
 * the refused page.
 */
export default async function LeadsOverviewPage({ searchParams }: { searchParams: Promise<OverviewQuery> }) {
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
        <Numbers overview={result.data} brands={brands.ok ? brands.data : []} />
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

/** A daily average, with one decimal under 10 so small numbers don't round to 0. */
function perDay(total: number, days: number): string {
  const average = days > 0 ? total / days : 0
  return average < 10 ? average.toFixed(1) : Math.round(average).toLocaleString("en-CA")
}

/** A titled card, like every other card in the LMS. */
function Card({
  id,
  title,
  note,
  className,
  children,
}: {
  id: string
  title: string
  note?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn("flex min-w-0 flex-col card-shell rounded-lg border bg-muted/40 p-0.5", className)}
      aria-labelledby={id}
    >
      <h2 id={id} className={HEAD}>
        {title}
      </h2>
      <div className="flex flex-1 flex-col overflow-hidden rounded-md border bg-card">{children}</div>
      {note ? <div className="px-3 py-1.5 text-[0.7rem] text-muted-foreground">{note}</div> : null}
    </section>
  )
}

/** The funnel's diagonal stripes, for the LeadScout bars. */
const STRIPES =
  "repeating-linear-gradient(135deg, color-mix(in oklab, var(--card) 35%, transparent) 0 1px, transparent 1px 4.25px)"

const ANSWERS: [string, string][] = [
  ["SOLD", "Sold"],
  ["CPF", "CPF"],
  ["NOT_SOLD", "Not sold"],
  ["EXISTS", "Already applied"],
  ["ERROR", "Error"],
  ["NONE", "No answer"],
]

/**
 * The page, redone 2026-11-10 calm and minimal: the funnel beside the four
 * counts, the days beside every LeadScout answer, then the two tables.
 */
function Numbers({ overview, brands }: { overview: ApplicationsOverview; brands: BrandOption[] }) {
  const started = overview.leads + overview.abandoned + overview.failed
  const answered = ANSWERS.reduce((sum, [key]) => sum + (overview.leadscout[key] ?? 0), 0)

  return (
    <>
      {/* Two columns, 6/10 and 4/10 of the width. Left: the funnel, then the
          days under it. Right: the four counts two by two, then LeadScout's
          answers. The cards have a set height, so the funnel can be exactly a
          card and a half tall. */}
      <div className="grid gap-3 xl:grid-cols-[6fr_4fr]">
        {/* Below xl the two columns melt into one list, ordered: the four counts,
            the funnel, the days, then LeadScout's answers. */}
        <div className="flex min-w-0 flex-col gap-3 max-xl:contents">
          <Card
            id="form-funnel"
            title="Form funnel"
            note="Each person counts once per step. Shares are of the form's visitors."
            className="h-72 max-xl:order-2 xl:h-[calc(15rem+6px)]"
          >
            <div className="relative h-full">
              <div className="absolute inset-0 px-4 py-3">
                <FormFunnel funnel={overview.funnel} />
              </div>
            </div>
          </Card>

          {/* Grows to end level with LeadScout answers on the right. */}
          <Card id="per-day" title="Applications per day" className="max-xl:order-3 xl:flex-1">
            <DailyBars days={overview.daily} />
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-3 max-xl:contents">
          <div className="grid grid-cols-2 gap-3 max-xl:order-1">
            <TrendCard
              label="Leads"
              value={count(overview.leads)}
              dataKey="leads"
              info="Sent to LeadScout and taken: Sold, CPF, Not sold, or Already applied. Each person counts once."
              days={overview.daily}
              note={`About ${perDay(overview.leads, overview.days)} a day`}
            />
            <TrendCard
              label="Abandoned"
              value={count(overview.abandoned)}
              dataKey="abandoned"
              info="Did step 1 but never sent step 2."
              days={overview.daily}
              note={`${share(overview.abandoned, started)} of people who started`}
            />
            <TrendCard
              label="Failed"
              value={count(overview.failed)}
              dataKey="failed"
              info="Sent step 2, but LeadScout refused it, gave an error, or gave no link."
              days={overview.daily}
              note={`${share(overview.failed, started)} of people who started`}
            />
            <TrendCard
              label="Finish rate"
              info="Leads out of everyone who started the form."
              value={started === 0 ? "—" : `${Math.round((overview.leads / started) * 100)}%`}
              days={overview.daily}
              note={`${count(overview.leads)} of ${count(started)} finished`}
            />
          </div>

          <Card
            id="leadscout-answers"
            className="max-xl:order-4"
            title="LeadScout answers"
            note="What LeadScout said about each person sent to it."
          >
            <dl className="flex flex-col divide-y">
              {ANSWERS.map(([key, label], index) => {
                const value = overview.leadscout[key] ?? 0
                return (
                  <div key={key} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium tabular-nums">
                        {count(value)}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          {share(value, answered)}
                        </span>
                      </dd>
                    </div>
                    {/* The dark part is this answer's share, the grey part the rest, with a
                        small gap between them like the bars in Applications per day. */}
                    <div className="flex h-2 gap-0.5" aria-hidden>
                      {value > 0 ? (
                        <div
                          className="h-full shrink-0 rounded-[2px]"
                          style={{
                            width: `${(value / answered) * 100}%`,
                            // One colour per answer on the other palettes; black on Norden.
                            backgroundColor: `var(--viz-${(index % 5) + 1}, var(--viz-ink))`,
                            backgroundImage: STRIPES,
                          }}
                        />
                      ) : null}
                      {value < answered || answered === 0 ? (
                        <div
                          className="h-full min-w-0 flex-1 rounded-[2px] bg-muted"
                          style={{ backgroundImage: STRIPES }}
                        />
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </dl>
          </Card>
        </div>
      </div>

      <OverviewBreakdown funnel={overview.funnel} brands={overview.brands} logos={brands} />
    </>
  )
}
