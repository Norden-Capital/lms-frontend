"use client"

import { useEffect, useRef, useState } from "react"

import { count } from "@/lib/format"
import type { SeoOverview } from "@/lib/seoTypes"

/**
 * Visits over the period, one bar per hour, day, week or month — decided
 * 2026-10-26 to match oneBase's bar chart, drawn in plain SVG with this app's
 * colours. Hovering a bar shows its date, visits and visitors.
 */

/**
 * The chart is as big as the space it is given — decided 2026-10-26, so it
 * fills its card down to the bottom instead of leaving a gap above it. It
 * measures its box and draws in real pixels, so the text never stretches.
 */
const FALLBACK = { width: 720, height: 320 }

/** Room for the figures on the left and the dates underneath. */
const PAD = { left: 44, right: 8, top: 12, bottom: 28 }

/** No more date labels than this under the bars; the rest are skipped. */
const MAX_TICKS = 12

type Step = SeoOverview["step"]

/**
 * The lines up the side — decided 2026-10-26: round steps (1, 2, 5, 10, 25,
 * 50, 100, 250, 500…), about five of them, up to the first step at or above
 * the highest bar. 2,500 visits reads 0 · 500 · 1000 · 1500 · 2000 · 2500.
 */
function axisFor(highest: number): { top: number; ticks: number[] } {
  const rough = Math.max(highest, 1) / 5
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  let step = magnitude * 10
  for (const nice of [1, 2, 2.5, 5, 10]) {
    const candidate = nice * magnitude
    if (candidate >= rough && Number.isInteger(candidate)) {
      step = candidate
      break
    }
  }
  step = Math.max(1, step)
  const top = Math.max(step, Math.ceil(highest / step) * step)
  const ticks: number[] = []
  for (let value = 0; value <= top; value += step) ticks.push(value)
  return { top, ticks }
}

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" })
const DAY_FULL = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })
const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const LONG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" })
const MONTH_FULL = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })

/** The words under a bar ("Mon", "14:00") and in its hover ("Monday 6 Oct"). Same as oneBase. */
function labelsFor(step: Step, start: string, fewDays: boolean): { label: string; full: string } {
  const date = new Date(start.includes("T") ? `${start.slice(0, 16)}:00Z` : `${start}T00:00:00Z`)
  switch (step) {
    case "HOUR": {
      const label = start.slice(11, 16)
      return { label, full: `${DAY_FULL.format(date)}, ${label}` }
    }
    case "WEEK":
      return { label: SHORT.format(date), full: `Week of ${LONG.format(date)}` }
    case "MONTH":
      return { label: MONTH.format(date), full: MONTH_FULL.format(date) }
    default:
      return { label: fewDays ? WEEKDAY.format(date) : SHORT.format(date), full: DAY_FULL.format(date) }
  }
}

function TrafficChart({
  points,
  step,
}: {
  points: { start: string; sessions: number; users: number }[]
  step: Step
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const frame = useRef<HTMLElement>(null)
  const [BOX, setBox] = useState(FALLBACK)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) setBox({ width: Math.round(width), height: Math.round(height) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const PLOT = {
    width: Math.max(1, BOX.width - PAD.left - PAD.right),
    height: Math.max(1, BOX.height - PAD.top - PAD.bottom),
  }

  if (points.length === 0) {
    return <p className="p-6 text-center text-sm text-muted-foreground">No data for this period.</p>
  }

  const fewDays = points.length <= 7
  const labels = points.map((point) => labelsFor(step, point.start, fewDays))
  const axis = axisFor(Math.max(...points.map((point) => point.sessions)))
  const ceiling = axis.top
  const band = PLOT.width / points.length
  const barWidth = Math.min(40, Math.max(2, band * 0.6))
  const every = Math.ceil(points.length / MAX_TICKS)
  const floor = PAD.top + PLOT.height
  const centre = (index: number) => PAD.left + band * index + band / 2

  const shown = hovered === null ? null : points[hovered]
  // The hover box, kept inside the chart at both ends.
  const left = hovered === null ? 0 : (centre(hovered) / BOX.width) * 100
  const shift = left < 15 ? "translate-x-0" : left > 85 ? "-translate-x-full" : "-translate-x-1/2"

  return (
    <figure ref={frame} className="relative h-full min-h-56 min-w-0" onMouseLeave={() => setHovered(null)}>
      <figcaption className="sr-only">
        Visits from {labels[0].full} to {labels[labels.length - 1].full}.
      </figcaption>

      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="absolute inset-0 block h-full w-full"
        aria-hidden
      >
        {/* A gridline at every step, from nothing to the top. */}
        {axis.ticks.map((value) => {
          const share = value / ceiling
          const y = floor - share * PLOT.height
          return (
            <g key={value}>
              <line
                x1={PAD.left}
                y1={y}
                x2={BOX.width - PAD.right}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
                strokeDasharray={share === 0 ? undefined : "3 3"}
              />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">
                {count(value)}
              </text>
            </g>
          )
        })}

        {points.map((point, index) => {
          const height = (point.sessions / ceiling) * PLOT.height
          const x = centre(index)
          return (
            <g key={point.start}>
              {/* The whole column takes the hover, not only the bar. */}
              <rect
                x={PAD.left + band * index}
                y={PAD.top}
                width={band}
                height={PLOT.height}
                className={hovered === index ? "fill-muted" : "fill-transparent"}
                onMouseEnter={() => setHovered(index)}
              />
              <rect
                x={x - barWidth / 2}
                y={floor - height}
                width={barWidth}
                height={Math.max(0, height)}
                rx={Math.min(3, barWidth / 2)}
                className={
                  hovered === null || hovered === index
                    ? "pointer-events-none fill-info"
                    : "pointer-events-none fill-info/40"
                }
              />
              {index % every === 0 && (
                <text
                  x={x}
                  y={BOX.height - 8}
                  textAnchor="middle"
                  className="pointer-events-none fill-muted-foreground font-mono text-[11px]"
                >
                  {labels[index].label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {shown && hovered !== null && (
        <div
          className={`pointer-events-none absolute top-0 z-10 min-w-36 rounded-md border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md ${shift}`}
          style={{ left: `${left}%` }}
        >
          <p className="font-medium">{labels[hovered].full}</p>
          <p className="mt-1 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden className="size-2 rounded-[2px] bg-info" />
              Visits
            </span>
            <span className="font-mono tabular-nums">{count(shown.sessions)}</span>
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden className="size-2 rounded-[2px] bg-info/40" />
              Visitors
            </span>
            <span className="font-mono tabular-nums">{count(shown.users)}</span>
          </p>
        </div>
      )}
    </figure>
  )
}

export { TrafficChart }
