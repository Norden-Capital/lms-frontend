"use client"

import { useState } from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CalendarDays } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SEO_RANGES, type SeoRange } from "@/lib/seoTypes"
import { cn } from "@/lib/utils"

/**
 * The period switch — oneBase's, decided 2026-10-21: Today, Yesterday,
 * 7 days, This month, This year, and Custom, which opens a two-month calendar.
 */

const BUTTON =
  "inline-flex h-6 items-center rounded-md border border-transparent px-2.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
const ON = "border-border bg-background text-foreground shadow-sm"
const OFF = "text-muted-foreground hover:text-foreground"

/** "13 Oct – 19 Oct 2026", or one day. */
function custom(start: string, end: string) {
  const from = new Date(`${start}T00:00:00`)
  const to = new Date(`${end}T00:00:00`)
  return start === end ? format(from, "d MMM yyyy") : `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`
}

function RangeFilter({
  value,
  start,
  end,
  onChange,
  onCustom,
}: {
  value: SeoRange
  /** The dates on screen, to open the calendar on. */
  start: string
  end: string
  onChange: (next: SeoRange) => void
  onCustom: (from: string, to: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<DateRange | undefined>(() => ({
    from: new Date(`${start}T00:00:00`),
    to: new Date(`${end}T00:00:00`),
  }))
  const today = new Date()

  return (
    <div
      role="group"
      aria-label="Period"
      className="inline-flex shrink-0 flex-wrap rounded-lg border border-border/60 bg-muted p-0.5"
    >
      {SEO_RANGES.filter((entry) => entry.id !== "custom").map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onChange(entry.id)}
          aria-pressed={value === entry.id}
          className={cn(BUTTON, value === entry.id ? ON : OFF)}
        >
          {entry.label}
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-pressed={value === "custom"}
              className={cn(BUTTON, "gap-1", value === "custom" ? ON : OFF)}
            />
          }
        >
          <CalendarDays aria-hidden className="size-3" />
          {value === "custom" ? custom(start, end) : "Custom"}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-max max-w-[calc(100vw-2rem)] p-0">
          <Calendar
            mode="range"
            selected={picked}
            onSelect={setPicked}
            numberOfMonths={2}
            defaultMonth={picked?.from}
            disabled={{ after: today }}
            fixedWeeks
          />
          <div className="flex items-center justify-end gap-2 px-3 pb-3">
            <span className="mr-auto text-[0.65rem] text-muted-foreground">
              {picked?.from ? format(picked.from, "d MMM yyyy") : "Pick a start"}
              {" – "}
              {picked?.to ? format(picked.to, "d MMM yyyy") : "and an end"}
            </span>
            <button
              type="button"
              disabled={!picked?.from}
              onClick={() => {
                if (!picked?.from) return
                const to = picked.to ?? picked.from
                setOpen(false)
                onCustom(format(picked.from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"))
              }}
              className="h-7 rounded-md border bg-foreground px-3 text-[0.7rem] font-medium text-background disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { RangeFilter }
