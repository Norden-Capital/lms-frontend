import type { OverviewDay } from "@/lib/applicationTypes"
import { cn } from "@/lib/utils"

const DAY = new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "short", timeZone: "UTC" })

function dayLabel(date: string): string {
  return DAY.format(new Date(`${date}T00:00:00Z`))
}

/**
 * Leads per day: one series, so one colour and no legend, with the title naming
 * it. Each whole column is the hover target, so a one-lead day is easy to hit, and
 * the table under the chart gives the same numbers without needing to hover.
 */
function LeadsChart({ days }: { days: OverviewDay[] }) {
  const peak = Math.max(...days.map((day) => day.leads), 0)

  return (
    <div>
      <div className="relative flex h-44 items-end gap-0.5 border-b" role="img" aria-label={`Leads per day. Most in one day: ${peak}.`}>
        {peak > 0 ? (
          <span className="absolute top-0 left-0 text-[0.7rem] text-muted-foreground tabular-nums">Most: {peak}</span>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No leads in this period.
          </span>
        )}

        {days.map((day, index) => (
          <div key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end justify-center" tabIndex={0}>
            {day.leads > 0 ? (
              <span
                className="w-full max-w-8 rounded-t-[4px] bg-foreground/80 transition-colors group-hover:bg-foreground group-focus:bg-foreground"
                style={{ height: `${(day.leads / peak) * 90}%` }}
              />
            ) : null}
            {/* Kept inside the chart at both ends. */}
            <span
              className={cn(
                "pointer-events-none invisible absolute bottom-full z-10 mb-1 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover:visible group-focus:visible",
                index < days.length / 3 ? "left-0" : index > (days.length * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2"
              )}
            >
              <span className="font-medium">{dayLabel(day.date)}</span>: {day.leads} {day.leads === 1 ? "lead" : "leads"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between text-[0.7rem] text-muted-foreground tabular-nums">
        <span>{dayLabel(days[0].date)}</span>
        <span>{dayLabel(days[days.length - 1].date)}</span>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground">Show as a table</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-md border">
          <table className="w-full text-xs tabular-nums">
            <thead className="sticky top-0 bg-card text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 font-medium">Day</th>
                <th className="px-3 py-1.5 text-right font-medium">Leads</th>
                <th className="px-3 py-1.5 text-right font-medium">Abandoned</th>
                <th className="px-3 py-1.5 text-right font-medium">Failed</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((day) => (
                <tr key={day.date} className="border-t">
                  <td className="px-3 py-1.5">{dayLabel(day.date)}</td>
                  <td className="px-3 py-1.5 text-right">{day.leads}</td>
                  <td className="px-3 py-1.5 text-right">{day.abandoned}</td>
                  <td className="px-3 py-1.5 text-right">{day.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

export { LeadsChart }
