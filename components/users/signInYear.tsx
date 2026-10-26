"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Panel } from "@/components/system/panel"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SignInDay } from "@/lib/actionLogTypes"
import { CELL, GAP } from "@/lib/backupChart"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * A year of somebody's sign-ins, one square a day — decided 2026-10-26, in
 * place of the permission grid. The same calendar as the Backups page: a
 * column is a week, Sunday on top, so where a square sits is its date.
 *
 * <p>Dark: signed in. Red: only wrong tries that day — worth a look. Faint:
 * nothing. The year is picked here, not in the address bar: this page has no
 * other state in its URL to keep it company.
 */

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""]

/** Where the year sits on the grid: blanks before 1 January, days, columns. */
function gridFor(year: number) {
  const offset = new Date(Date.UTC(year, 0, 1)).getUTCDay()
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const days = leap ? 366 : 365
  return { offset, days, columns: Math.ceil((offset + days) / 7) }
}

/** "2026-10-26" for the square at this place, or null for a blank at either end. */
function dateAt(year: number, offset: number, days: number, column: number, row: number) {
  const day = column * 7 + row - offset
  if (day < 0 || day >= days) return null
  return new Date(Date.UTC(year, 0, 1 + day)).toISOString().slice(0, 10)
}

/** "Mon 26 Oct 2026", fixed to UTC and en-GB so server and browser agree. */
function dayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** "Jan" on the first column of each month. */
function monthAt(column: number, year: number, offset: number, days: number) {
  const first = column * 7 - offset
  if (first >= days) return null
  const at = new Date(Date.UTC(year, 0, 1 + Math.max(0, first)))
  if (column > 0) {
    const before = new Date(Date.UTC(year, 0, 1 + Math.max(0, first - 7)))
    if (before.getUTCMonth() === at.getUTCMonth()) return null
  }
  return at.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })
}

function times(n: number, one: string) {
  return `${n} ${one}${n === 1 ? "" : "s"}`
}

const KEYS = [
  { tone: "bg-foreground", label: "Signed in" },
  { tone: "bg-destructive", label: "Only failed tries" },
  { tone: "bg-foreground/[0.07]", label: "No sign-in" },
]

const STEP =
  "flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"

function DaySquare({ date, day }: { date: string; day?: SignInDay }) {
  const ok = day?.ok ?? 0
  const failed = day?.failed ?? 0
  const tone = ok > 0 ? "bg-foreground" : failed > 0 ? "bg-destructive" : "bg-foreground/[0.07]"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              CELL,
              "relative rounded-[2px] transition-transform duration-150 ease-out hover:z-10 hover:scale-[1.75]",
              tone
            )}
          />
        }
      />
      <TooltipContent className="block max-w-none text-left leading-snug">
        <p className="font-medium">{dayLabel(date)}</p>
        <p className="mt-0.5 text-background/70">
          {ok > 0 ? `Signed in ${times(ok, "time")}` : "No sign-in"}
        </p>
        {failed > 0 && (
          <p className="text-background/70">{times(failed, "failed try")}</p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function SignInYear({
  days,
  thisYear,
}: {
  days: SignInDay[]
  /** Today's year, from the server, for a person with no sign-ins yet. */
  thisYear: number
}) {
  const years = [...new Set([...days.map((d) => Number(d.date.slice(0, 4))), thisYear])].sort(
    (a, b) => a - b
  )
  const [year, setYear] = useState(() => years.at(-1) ?? thisYear)
  const at = years.indexOf(year)

  const byDate = new Map(days.map((d) => [d.date, d]))
  const { offset, days: inYear, columns } = gridFor(year)

  const counts = days.reduce(
    (all, d) => {
      if (Number(d.date.slice(0, 4)) !== year) return all
      if (d.ok > 0) all.days += 1
      all.failed += d.failed
      return all
    },
    { days: 0, failed: 0 }
  )

  return (
    <Panel
      title="Sign-ins"
      hint={<>One square per day. Dark: signed in. Red: only wrong tries. Hover a square to see more.</>}
      action={
        <span className="flex items-center gap-3">
          <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
            {times(counts.days, "day")} · {times(counts.failed, "failed try")}
          </span>
          <span className="flex items-center gap-0.5">
            <button
              type="button"
              className={STEP}
              disabled={at <= 0}
              onClick={() => setYear(years[at - 1])}
              aria-label="Year before"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="min-w-10 text-center font-mono text-[0.7rem] font-medium tabular-nums">
              {year}
            </span>
            <button
              type="button"
              className={STEP}
              disabled={at >= years.length - 1}
              onClick={() => setYear(years[at + 1])}
              aria-label="Year after"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </span>
        </span>
      }
      className="shrink-0"
      bodyClassName="gap-0 p-3"
    >
      {/* py-1.5: room for a square that grows on hover, since overflow-x clips
          the other axis too. Scrolls sideways on a narrow screen. */}
      <div className={cn("min-w-0 overflow-x-auto py-1.5", THIN_SCROLLBAR)}>
        <div className="mx-auto grid w-fit grid-cols-[auto_minmax(0,1fr)] gap-x-1.5">
          <div
            className={cn(
              "flex flex-col font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase",
              GAP
            )}
          >
            {WEEKDAYS.map((name, row) => (
              <span key={row} className="flex flex-1 items-center leading-none">
                {name}
              </span>
            ))}
          </div>

          <div
            role="img"
            aria-label={`${year}: signed in on ${times(counts.days, "day")}, ${times(counts.failed, "failed try")}.`}
            className={cn("flex", GAP)}
          >
            {Array.from({ length: columns }, (_, column) => (
              <div key={column} className="group relative shrink-0">
                <span
                  className="absolute inset-x-0 -inset-y-1 rounded-sm transition-colors group-hover:bg-muted"
                  aria-hidden
                />
                <span className={cn("relative flex flex-col", GAP)}>
                  {Array.from({ length: 7 }, (_, row) => {
                    const date = dateAt(year, offset, inYear, column, row)
                    return date ? (
                      <DaySquare key={row} date={date} day={byDate.get(date)} />
                    ) : (
                      <span key={row} className={CELL} aria-hidden />
                    )
                  })}
                </span>
              </div>
            ))}
          </div>

          <div />

          <div className={cn("mt-2 flex border-t pt-1.5", GAP)}>
            {Array.from({ length: columns }, (_, column) => {
              const month = monthAt(column, year, offset, inYear)
              return (
                <div key={column} className={cn("relative h-3", CELL)}>
                  {month && (
                    <span className="absolute left-0 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
                      {month}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div />

          <div className="mt-2 flex items-center justify-end gap-3 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
            {KEYS.map((key) => (
              <span key={key.label} className="flex items-center gap-1">
                <span className={cn("size-2 rounded-[2px] ring-1 ring-border", key.tone)} aria-hidden />
                {key.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

export { SignInYear }
