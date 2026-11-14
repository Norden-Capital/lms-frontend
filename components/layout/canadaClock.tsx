"use client"

import { useSyncExternalStore } from "react"
import { Clock } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Canada's time in the header, before the bell. Toronto's clock, the same one
 * backups and records use (see canadaDate in lib/format.ts), never the
 * reader's own zone. Hidden on phones — decided 2026-11-14.
 */
const TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Toronto",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})
const DAY = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Toronto",
  weekday: "short",
  day: "numeric",
  month: "short",
})
/** "EST" in winter, "EDT" in summer. */
const ZONE = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", timeZoneName: "short" })

/** Ticks once a second. */
function everySecond(tick: () => void) {
  const timer = setInterval(tick, 1000)
  return () => clearInterval(timer)
}
const currentSecond = () => Math.floor(Date.now() / 1000)
// The server has no clock to show: it draws dashes, and the browser fills the
// time in once the page loads, so both draw the same first frame.
const noSecond = () => null

function CanadaClock() {
  const second = useSyncExternalStore(everySecond, currentSecond, noSecond)
  const now = second === null ? null : new Date(second * 1000)

  const zone = now ? ZONE.formatToParts(now).find((part) => part.type === "timeZoneName")?.value : null

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="hidden h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm whitespace-nowrap md:flex" />
        }
      >
        <Clock className="size-4 text-muted-foreground" aria-hidden />
        <time className="font-mono font-medium tabular-nums" dateTime={now?.toISOString()}>
          {now ? TIME.format(now) : "--:--:--"}
        </time>
        <span className="h-4 w-px bg-border" aria-hidden />
        <span className="text-[13px] text-muted-foreground">
          {now ? `${DAY.format(now)} · ${zone}` : ""}
        </span>
      </TooltipTrigger>
      <TooltipContent>Canada time (Toronto)</TooltipContent>
    </Tooltip>
  )
}

export { CanadaClock }
