"use client"

import { useId } from "react"
import { Info } from "lucide-react"

import { Bar } from "@/components/charts/bar"
import { BarChart } from "@/components/charts/barChart"
import { BarXAxis } from "@/components/charts/barXAxis"
import { Grid } from "@/components/charts/grid"
import { PatternLines } from "@/components/charts/patterns"
import { AreaSparkline } from "@/components/charts/sparkline"
import { ChartTooltip } from "@/components/charts/tooltip"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { OverviewDay } from "@/lib/applicationTypes"
import { count } from "@/lib/format"

/**
 * Leads Overview's charts — Bklit, redone 2026-11-10 calm and minimal: grey
 * ink, with leads as the one dark series and the rest in lighter greys, like
 * the rest of the LMS.
 */

const SERIES = {
  leads: { label: "Leads", color: "var(--viz-1, var(--viz-ink))" },
  failed: { label: "Failed", color: "var(--viz-2, color-mix(in oklab, var(--viz-ink) 45%, transparent))" },
  abandoned: { label: "Abandoned", color: "var(--viz-3, color-mix(in oklab, var(--viz-ink) 18%, transparent))" },
} as const

type SeriesKey = keyof typeof SERIES

const ORDER: SeriesKey[] = ["leads", "failed", "abandoned"]

/** The funnel's stripe colour: the card showing through, faintly. */
const STRIPE = "color-mix(in oklab, var(--card) 35%, transparent)"

/** Space between the parts of a day's bar, like the gaps between the LeadScout answers. Each Bar needs it too. */
const GAP = 2

const DAY = new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "short", timeZone: "UTC" })
const dayLabel = (date: string) => DAY.format(new Date(`${date}T00:00:00Z`))

/** A count and its days as a quiet grey line under it. */
function TrendCard({
  label,
  value,
  dataKey,
  days,
  note,
  info,
}: {
  label: string
  value: string
  /** Which count to draw under the figure. None leaves the space empty, so cards stay the same height. */
  dataKey?: SeriesKey
  days: OverviewDay[]
  note: string
  /** What the number counts, shown on the (i). */
  info: string
}) {
  return (
    // A set height on wide screens (10rem), so Leads Overview can make the funnel a card and a half.
    <section className="flex min-w-0 flex-col card-shell rounded-lg border bg-muted/40 p-0.5 xl:h-40">
      <div className="flex flex-1 flex-col rounded-md border bg-card">
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
          <h2 className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </h2>
          <Tooltip>
            <TooltipTrigger
              render={<button type="button" className="text-muted-foreground hover:text-foreground" />}
              aria-label={`What ${label} means`}
            >
              <Info className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{info}</TooltipContent>
          </Tooltip>
        </div>
        <p className="px-4 pt-1 font-heading text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        <div className="mt-auto h-12 px-1 pt-2">
          {dataKey ? (
            <AreaSparkline
              data={days}
              dataKey={dataKey}
              height={40}
              color="var(--muted-foreground)"
              fillOpacity={0.18}
            />
          ) : null}
        </div>
      </div>
      <p className="px-3 py-1.5 text-right text-[0.7rem] text-muted-foreground tabular-nums">{note}</p>
    </section>
  )
}

/** The one big chart: each day as a bar, leads at the bottom in dark ink. */
function DailyBars({ days }: { days: OverviewDay[] }) {
  const data = days.map((day) => ({ ...day, day: dayLabel(day.date) }))
  const totals = Object.fromEntries(ORDER.map((key) => [key, days.reduce((sum, day) => sum + day[key], 0)]))
  const empty = ORDER.every((key) => totals[key] === 0)
  // The funnel's diagonal stripes on every bar part. useId keeps two charts' patterns apart.
  const patternId = useId().replace(/:/g, "")

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        {ORDER.map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: SERIES[key].color }} aria-hidden />
            <span className="text-muted-foreground">{SERIES[key].label}</span>
            <span className="font-medium tabular-nums">{count(totals[key])}</span>
          </span>
        ))}
      </div>
      {empty ? (
        <p className="flex min-h-48 flex-1 items-center justify-center text-sm text-muted-foreground">
          No applications in this period.
        </p>
      ) : (
        // Fills the card's height, so it ends level with the cards beside it.
        <div className="relative min-h-48 flex-1">
          <BarChart
            data={data}
            xDataKey="day"
            stacked
            stackGap={GAP}
            aspectRatio="auto"
            className="absolute inset-0 h-full"
            barGap={0.35}
          >
            <Grid horizontal />
            {ORDER.map((key) => (
              <PatternLines
                key={`pattern-${key}`}
                id={`${patternId}-${key}`}
                width={6}
                height={6}
                stroke={STRIPE}
                strokeWidth={1}
                background={SERIES[key].color}
                orientation={["diagonal"]}
              />
            ))}
            {ORDER.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`url(#${patternId}-${key})`}
                stroke={SERIES[key].color}
                lineCap={2}
                stackGap={GAP}
              />
            ))}
            <BarXAxis maxLabels={8} />
            <ChartTooltip
              rows={(point) =>
                ORDER.map((key) => ({
                  color: SERIES[key].color,
                  label: SERIES[key].label,
                  value: Number(point[key] ?? 0),
                }))
              }
            />
          </BarChart>
        </div>
      )}
    </div>
  )
}

export { DailyBars, TrendCard }
