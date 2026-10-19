import type { Metadata } from "next"

import { DimensionTabs } from "@/components/seo/dimensionTabs"
import { MetricTable } from "@/components/seo/metricTable"
import { Panel } from "@/components/system/panel"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { getSeoRows } from "@/lib/seo"
import type { SeoDimension } from "@/lib/seoTypes"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Performance",
}

/** What the first column is called, per dimension. */
const LABELS: Record<SeoDimension, string> = {
  query: "Query",
  page: "Page",
  country: "Country",
  device: "Device",
  searchAppearance: "Appearance",
}

const DIMENSIONS = Object.keys(LABELS) as SeoDimension[]

/**
 * The same four numbers, sliced five ways.
 *
 * <p>Every one of these is the identical Search Console call with a different
 * `dimensions` array, which is why the screen is one table and a switch rather
 * than five screens.
 *
 * <p>⚠️ Every number is invented — see `lib/seoSample.ts`.
 */
export default async function SeoPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ by?: string }>
}) {
  const { by } = await searchParams

  // An unrecognised dimension in the address bar falls back rather than
  // rendering an empty table — a stale link should land somewhere useful.
  const dimension = DIMENSIONS.includes(by as SeoDimension)
    ? (by as SeoDimension)
    : "query"

  const rows = await getSeoRows(dimension)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <DimensionTabs dimensions={DIMENSIONS} labels={LABELS} active={dimension} />

      <Panel
        title={LABELS[dimension]}
        hint={
          dimension === "query" ? (
            <>
              ⚠️ These will not add up to the totals on the Overview. Google
              leaves out rare and anonymised searches, so the terms it shows you
              always account for less traffic than the site actually had.
            </>
          ) : (
            <>Clicks, impressions, click-through rate and average position.</>
          )
        }
        action={
          <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
            {rows.length} rows
          </span>
        }
        className="min-h-0 flex-1"
        bodyClassName="p-0"
      >
        <div className={cn("min-h-0 flex-1 overflow-y-auto", THIN_SCROLLBAR)}>
          <MetricTable rows={rows} label={LABELS[dimension]} />
        </div>
      </Panel>
    </div>
  )
}
