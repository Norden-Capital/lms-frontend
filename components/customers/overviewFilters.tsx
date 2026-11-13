"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CalendarDays, ChevronDown, RotateCw } from "lucide-react"

import { BrandLogo, SMALL_LOGO } from "@/components/ui/brandLogo"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  OVERVIEW_PERIODS,
  brandLabel,
  overviewDays,
  sharedSites,
  type BrandOption,
  type OverviewQuery,
} from "@/lib/applicationTypes"
import { cn } from "@/lib/utils"

/** One row above the numbers: period and brand. All of it lives in the address. Test data never shows. */
function OverviewFilters({ query, brands }: { query: OverviewQuery; brands: BrandOption[] }) {
  const shared = sharedSites(brands)
  const router = useRouter()
  const pathname = usePathname()
  const [, startLoading] = useTransition()
  const [refreshing, startRefresh] = useTransition()
  const custom = Boolean(query.from && query.to)
  const days = custom ? null : overviewDays(query.days)
  const picked = brands.find((brand) => brand.id === query.brand)
  const brandName = picked ? brandLabel(picked, shared) : undefined

  function go(next: OverviewQuery) {
    const params = new URLSearchParams()
    if (next.from && next.to) {
      params.set("from", next.from)
      params.set("to", next.to)
    } else if (next.days && next.days !== "30") params.set("days", next.days)
    if (next.brand) params.set("brand", next.brand)
    const qs = params.toString()
    startLoading(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    // On a phone: the periods fill one row, then brand and refresh share the
    // next. From sm up they all sit in one row as before.
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <div className="flex w-full rounded-md border bg-card p-0.5 sm:w-auto" role="group" aria-label="Period">
        {OVERVIEW_PERIODS.map((period) => (
          <Button
            key={period}
            size="sm"
            className="flex-1 sm:flex-none"
            variant={period === days ? "secondary" : "ghost"}
            aria-pressed={period === days}
            onClick={() => go({ ...query, days: String(period), from: undefined, to: undefined })}
          >
            {period} days
          </Button>
        ))}
        <CustomDates
          from={query.from}
          to={query.to}
          onPick={(from, to) => go({ ...query, days: undefined, from, to })}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" className="min-w-0 flex-1 rounded-md bg-card font-normal sm:flex-none" />}
        >
          {picked ? <BrandLogo name={picked.name} logoUrl={picked.logoUrl} className={SMALL_LOGO} /> : null}
          <span className="truncate">{brandName ?? "All brands"}</span>
          <ChevronDown data-icon="inline-end" className="ml-auto opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max max-w-72 min-w-(--anchor-width)">
          <DropdownMenuRadioGroup
            value={query.brand ?? ""}
            onValueChange={(value) => go({ ...query, brand: value || undefined })}
          >
            <DropdownMenuRadioItem value="">All brands</DropdownMenuRadioItem>
            {brands.map((brand) => (
              <DropdownMenuRadioItem key={brand.id} value={brand.id}>
                {/* The brand's logo beside its name. */}
                <BrandLogo name={brand.name} logoUrl={brand.logoUrl} className={SMALL_LOGO} />
                <span className="truncate">{brandLabel(brand, shared)}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Gets the numbers again without leaving the page. Icon only. */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-sm"
              variant="outline"
              className="bg-card"
              disabled={refreshing}
              onClick={() => startRefresh(() => router.refresh())}
              aria-label="Refresh"
            />
          }
        >
          <RotateCw className={cn(refreshing && "animate-spin")} />
        </TooltipTrigger>
        <TooltipContent>Refresh</TooltipContent>
      </Tooltip>
    </div>
  )
}

/** "13 Oct – 19 Oct 2026", or one day. */
function datesLabel(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  return from === to ? format(start, "d MMM yyyy") : `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`
}

/** The last period button: pick your own start and end on a two-month calendar. */
function CustomDates({ from, to, onPick }: { from?: string; to?: string; onPick: (from: string, to: string) => void }) {
  const on = Boolean(from && to)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<DateRange | undefined>(() =>
    from && to ? { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T00:00:00`) } : undefined
  )
  const today = new Date()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button size="sm" className="flex-1 sm:flex-none" variant={on ? "secondary" : "ghost"} aria-pressed={on} />
        }
      >
        <CalendarDays data-icon="inline-start" />
        {on ? datesLabel(from!, to!) : "Custom"}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-max max-w-[calc(100vw-2rem)] p-0">
        <Calendar
          mode="range"
          selected={picked}
          onSelect={setPicked}
          numberOfMonths={2}
          defaultMonth={picked?.from ?? new Date(today.getFullYear(), today.getMonth() - 1, 1)}
          disabled={{ after: today }}
          fixedWeeks
        />
        <div className="flex items-center justify-end gap-2 px-3 pb-3">
          <span className="mr-auto text-xs text-muted-foreground">
            {picked?.from ? format(picked.from, "d MMM yyyy") : "Pick a start"}
            {" – "}
            {picked?.to ? format(picked.to, "d MMM yyyy") : "and an end"}
          </span>
          <Button
            size="sm"
            disabled={!picked?.from}
            onClick={() => {
              if (!picked?.from) return
              setOpen(false)
              onPick(format(picked.from, "yyyy-MM-dd"), format(picked.to ?? picked.from, "yyyy-MM-dd"))
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { OverviewFilters }
