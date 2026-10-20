"use client"

import { useId } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * A small line of this year's four quarters, with the total beside it —
 * oneBase's chart, decided 2026-10-20 for the Replies column on Brands.
 * Hovering a point shows its quarter and value.
 */

const PERIODS = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"]

function QuarterSparkline({
  values,
  unit,
}: {
  /** Q1 to Q4 of this year. */
  values: number[]
  unit: { one: string; many: string }
}) {
  const gradientId = useId()
  const year = new Date().getUTCFullYear()
  const total = values.reduce((sum, value) => sum + value, 0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const coordinates = values.map((value, index) => ({
    x: 2 + (index * 68) / (values.length - 1),
    y: 20 - ((value - min) / range) * 16,
    value,
  }))
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(" ")
  const word = (n: number) => (n === 1 ? unit.one : unit.many)

  return (
    <div className="inline-flex items-center gap-2" aria-label={`${total} ${word(total)} in ${year}`}>
      <div className="relative h-6 w-[4.5rem]">
        <svg viewBox="0 0 72 24" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--info)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--info)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`${points} 70,22 2,22`} fill={`url(#${gradientId})`} />
          <polyline
            points={points}
            fill="none"
            stroke="var(--info)"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {coordinates.map(({ x, y, value }, index) => (
          <Tooltip key={index}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="group absolute z-10 flex size-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-info"
                  style={{ left: `${(x / 72) * 100}%`, top: `${(y / 24) * 100}%` }}
                  aria-label={`Q${index + 1} ${year}: ${value} ${word(value)}`}
                />
              }
            >
              <span className="size-1.5 rounded-full border border-white bg-info opacity-0 transition-opacity group-hover:opacity-100" />
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-medium">Q{index + 1} {year}</span> {PERIODS[index]} · {value}{" "}
              {word(value)}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <span className="min-w-5 font-medium text-foreground tabular-nums">{total}</span>
    </div>
  )
}

export { QuarterSparkline }
