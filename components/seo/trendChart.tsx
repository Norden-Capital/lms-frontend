import { count } from "@/lib/format"
import type { SeoDay } from "@/lib/seoTypes"

/**
 * Clicks over the window, with the unfinished days drawn as unfinished.
 *
 * <p><b>This is the whole reason the chart is hand-written.</b> Google has not
 * finished counting the last two or three days — their figures rise after you
 * look at them — so a line drawn straight from the data falls off a cliff at its
 * right-hand edge. Everybody who sees that asks what went wrong on Thursday, and
 * nothing did.
 *
 * <p>So the line is drawn twice: solid through the settled days, dashed and pale
 * through the tail, with the join shared so there is no gap. The dashes are not
 * decoration — they are the difference between a chart that reports a collapse
 * and one that reports arithmetic still in progress.
 *
 * <p>Plain SVG on the server. No dependency, nothing measured in the browser —
 * the same approach as the backups calendar, and for the same reason: this is
 * one line and some gridlines, which is less code than the wiring a chart
 * library would need.
 */

/**
 * The drawing grid.
 *
 * <p>A `viewBox` rather than pixels, so the chart scales to whatever column it
 * is given and the text scales with it. `preserveAspectRatio="none"` is
 * deliberately <em>not</em> used — it would stretch the strokes and the labels
 * unevenly.
 */
const BOX = { width: 720, height: 220 }

/** Room for the y-axis figures on the left and the dates underneath. */
const PAD = { left: 48, right: 12, top: 16, bottom: 26 }

const PLOT = {
  width: BOX.width - PAD.left - PAD.right,
  height: BOX.height - PAD.top - PAD.bottom,
}

/**
 * A round number at or above the highest point.
 *
 * <p>Axes that stop exactly at the maximum put the peak on the frame, where it
 * reads as clipped. Rounding up to something a person would say out loud — 400,
 * not 383 — also makes the middle gridline a number worth printing.
 */
function ceilingFor(highest: number): number {
  if (highest <= 0) return 1

  const magnitude = 10 ** Math.floor(Math.log10(highest))
  const steps = [1, 2, 2.5, 5, 10]

  for (const step of steps) {
    const candidate = magnitude * step
    if (candidate >= highest) return candidate
  }

  return magnitude * 10
}

/** "3 Aug" — short, because there is one of these every few pixels. */
function shortDate(iso: string): string {
  const at = new Date(`${iso}T00:00:00Z`)
  const month = at.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })

  return `${at.getUTCDate()} ${month}`
}

function TrendChart({ days }: { days: SeoDay[] }) {
  if (days.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        No data for this period.
      </p>
    )
  }

  const ceiling = ceilingFor(Math.max(...days.map((day) => day.clicks)))

  const pointAt = (index: number, clicks: number) => ({
    x:
      PAD.left +
      (days.length === 1 ? PLOT.width / 2 : (index / (days.length - 1)) * PLOT.width),
    y: PAD.top + PLOT.height - (clicks / ceiling) * PLOT.height,
  })

  const points = days.map((day, index) => pointAt(index, day.clicks))

  /**
   * Where the settled part ends.
   *
   * <p>The last complete day is included in <em>both</em> paths, which is what
   * makes them meet: two paths that merely stop and start beside each other
   * leave a one-segment hole exactly where the eye is looking for the handover.
   */
  const lastComplete = days.reduce(
    (last, day, index) => (day.complete ? index : last),
    -1
  )

  const line = (from: number, to: number) =>
    points
      .slice(from, to + 1)
      .map((point, i) => `${i === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join(" ")

  const hasTail = lastComplete >= 0 && lastComplete < days.length - 1

  return (
    <svg
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Clicks per day from ${shortDate(days[0].date)} to ${shortDate(
        days[days.length - 1].date
      )}. The last ${days.filter((day) => !day.complete).length} days are still being counted by Google.`}
    >
      {/* Three gridlines: nothing, half, and the ceiling. More than that turns a
          trend into a spreadsheet. */}
      {[0, 0.5, 1].map((share) => {
        const y = PAD.top + PLOT.height - share * PLOT.height

        return (
          <g key={share}>
            <line
              x1={PAD.left}
              y1={y}
              x2={BOX.width - PAD.right}
              y2={y}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground font-mono text-[11px]"
            >
              {count(ceiling * share)}
            </text>
          </g>
        )
      })}

      {/* The settled days. */}
      {lastComplete > 0 && (
        <path
          d={line(0, lastComplete)}
          className="fill-none stroke-foreground"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* The tail Google is still counting. Dashed and faded — two signals
          rather than one, because a dashed line at full strength still reads as
          a measurement, and a pale solid one reads as a measurement in a colour. */}
      {hasTail && (
        <path
          d={line(lastComplete, days.length - 1)}
          className="fill-none stroke-foreground/40"
          strokeWidth={2}
          strokeDasharray="4 4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Where the counting stops being finished. A mark on the axis rather than
          a note underneath: the reader is looking at the line, not the caption. */}
      {hasTail && (
        <line
          x1={points[lastComplete].x}
          y1={PAD.top}
          x2={points[lastComplete].x}
          y2={PAD.top + PLOT.height}
          className="stroke-border"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      )}

      {/* First and last date only. A label under every day is unreadable at this
          width and tells you nothing the two ends do not. */}
      <text
        x={PAD.left}
        y={BOX.height - 6}
        className="fill-muted-foreground font-mono text-[11px]"
      >
        {shortDate(days[0].date)}
      </text>
      <text
        x={BOX.width - PAD.right}
        y={BOX.height - 6}
        textAnchor="end"
        className="fill-muted-foreground font-mono text-[11px]"
      >
        {shortDate(days[days.length - 1].date)}
      </text>
    </svg>
  )
}

export { TrendChart }
