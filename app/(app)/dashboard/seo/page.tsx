import type { Metadata } from "next"

import { StatCard } from "@/components/stats/statCard"
import { TrendChart } from "@/components/seo/trendChart"
import { Panel } from "@/components/system/panel"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { getSeoOverview } from "@/lib/seo"
import type { SeoMetrics } from "@/lib/seoTypes"
import { count, percent } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "SEO overview",
}

/**
 * The four headline figures and the trend behind them.
 *
 * <p>Clicks, impressions, click-through rate and average position — the only
 * four numbers Search Console reports, so the only four there can be. Each shows
 * how it moved against the window immediately before, which is what turns a
 * figure into a direction.
 *
 * <p>⚠️ Every number is invented — see `lib/seoSample.ts`, and the banner is on
 * its way when there is a real connection to be absent. Nothing here has ever
 * spoken to Google.
 */
export default async function SeoOverviewPage() {
  // Decided once, on the server, and passed down. Anything that reads the clock
  // itself renders one answer here and a different one after hydration.
  const now = new Date()
  const overview = await getSeoOverview(now)

  const unfinished = overview.days.filter((day) => !day.complete).length

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-1",
        THIN_SCROLLBAR
      )}
    >
      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clicks"
          value={count(overview.totals.clicks)}
          change={movement(overview.totals, overview.previous, "clicks")}
        />
        <StatCard
          label="Impressions"
          value={count(overview.totals.impressions)}
          change={movement(overview.totals, overview.previous, "impressions")}
        />
        <StatCard
          label="Click-through rate"
          value={percent(overview.totals.ctr * 100, 1)}
          change={movement(overview.totals, overview.previous, "ctr")}
        />
        <StatCard
          label="Average position"
          value={overview.totals.position.toFixed(1)}
          change={movement(overview.totals, overview.previous, "position")}
        />
      </div>

      <Panel
        title="Clicks"
        hint={
          <>
            One point a day. The dashed tail is the part Google has not finished
            counting — those figures rise for a day or two after they appear.
          </>
        }
        action={
          unfinished > 0 ? (
            <span className="font-mono text-[0.7rem] text-muted-foreground">
              last {unfinished} days still counting
            </span>
          ) : null
        }
        className="shrink-0"
        bodyClassName="p-3"
      >
        <TrendChart days={overview.days} />
      </Panel>
    </div>
  )
}

/**
 * How a figure moved against the previous window.
 *
 * <p>⚠️ <b>Position is inverted and it is the only one.</b> Going from 18th to
 * 14th is an improvement, and the arithmetic makes it -22% — so the sign is
 * flipped for that metric alone. Without this the one metric people most want to
 * see improve is the one drawn in red when it does.
 */
function movement(
  now: SeoMetrics,
  before: SeoMetrics,
  key: keyof SeoMetrics
): { percent: number; period: string } {
  const previous = before[key]
  const change = previous === 0 ? 0 : ((now[key] - previous) / previous) * 100
  const lowerIsBetter = key === "position"

  return {
    percent: Number(((lowerIsBetter ? -change : change)).toFixed(1)),
    period: "vs previous 28 days",
  }
}
