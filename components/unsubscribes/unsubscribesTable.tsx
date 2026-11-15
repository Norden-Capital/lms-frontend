"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { ArrowUpRight, CalendarDays, ChevronDown, Download, MailX, Search } from "lucide-react"

import { useHolds } from "@/components/access/heldPermissions"
import { BrandLogo, SMALL_LOGO } from "@/components/ui/brandLogo"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { LoadingCover } from "@/components/ui/loadingCover"
import { PixelLoader } from "@/components/ui/pageLoader"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { SortButton, ariaSort } from "@/components/ui/sortButton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/ui/tablePagination"
import { TruncatedText } from "@/components/ui/truncatedText"
import { brandLabel, sharedSites, type BrandOption } from "@/lib/applicationTypes"
import { canadaStamp } from "@/lib/format"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import {
  DATE_PERIODS,
  DEFAULT_PERIOD,
  REASONS,
  UNSUBSCRIBE_PAGE_SIZES,
  reasonLabel,
  unsubscribePageSize,
  type UnsubscribeRow,
  type UnsubscribesQuery,
} from "@/lib/unsubscribeTypes"
import type { Page } from "@/lib/userTypes"
import { cn } from "@/lib/utils"

const HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const STICKY_HEAD = "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

/** The columns the server can order by, with their header. */
const SORTABLE = [
  { key: "date", label: "Date" },
  { key: "email", label: "Email" },
  { key: "brand", label: "Brand" },
  { key: "reason", label: "Reason" },
] as const

const FILTER_BUTTON = "flex-1 rounded-md bg-transparent font-normal sm:flex-none"

/** "13 Oct – 19 Oct 2026", or one day. */
function datesLabel(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  return from === to ? format(start, "d MMM yyyy") : `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`
}

/**
 * The reason, always on one line. "Other" carries the person's own words after
 * it, cut to fit; the whole text is a hover away.
 */
function ReasonCell({ row }: { row: UnsubscribeRow }) {
  if (!row.reason) return <span className="text-muted-foreground">{reasonLabel(null)}</span>
  if (row.reason !== "OTHER" || !row.otherText) return <span>{reasonLabel(row.reason)}</span>
  return (
    <span className="flex max-w-80 min-w-0 items-center gap-1">
      <span className="shrink-0">Other ·</span>
      <TruncatedText className="text-muted-foreground">{`“${row.otherText}”`}</TruncatedText>
    </span>
  )
}

/**
 * Everyone who asked a brand to stop emailing them. Built like the Leads list:
 * toolbar on the tinted frame, white panel, count and pages underneath. Every
 * row stays on one line; on a phone the table scrolls sideways.
 */
function UnsubscribesTable({
  page,
  query,
  brands,
}: {
  page: Page<UnsubscribeRow>
  query: UnsubscribesQuery
  brands: BrandOption[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const canExport = useHolds("UNSUBSCRIBE:EXPORT")
  const [typed, setTyped] = useState(query.search ?? "")
  const [loading, startLoading] = useTransition()
  const pageSize = unsubscribePageSize(query.size)
  const rows = page.content
  const shared = sharedSites(brands)
  const picked = brands.find((brand) => brand.id === query.brand)
  const custom = Boolean(query.from && query.to)
  const period = query.period ?? DEFAULT_PERIOD
  const filtered = Boolean(query.search || query.brand || query.reason || custom || query.period)

  const dateButton = useRef<HTMLButtonElement>(null)
  const [pickOpen, setPickOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>(() =>
    custom ? { from: new Date(`${query.from}T00:00:00`), to: new Date(`${query.to}T00:00:00`) } : undefined
  )
  const today = new Date()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))
  // No sort in the address means newest first, so Date shows as sorted.
  const [sortKey, sortDir] = (query.sort ?? "date,desc").split(",")

  function toggleAll(checked: boolean) {
    // Only the rows on screen, so "select all" never picks people nobody saw.
    const next = new Set(selected)
    rows.forEach((row) => (checked ? next.add(row.id) : next.delete(row.id)))
    setSelected(next)
  }

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    setSelected(next)
  }

  function toggleSort(key: string) {
    // The same column flips. A new one starts newest first for the date, A first otherwise.
    const nextDir = sortKey === key ? (sortDir === "desc" ? "asc" : "desc") : key === "date" ? "desc" : "asc"
    const sort = `${key},${nextDir}`
    go({ ...query, sort: sort === "date,desc" ? undefined : sort, page: undefined })
  }

  /** Filters only, no paging: shared by the address and the export. */
  function filterParams(next: UnsubscribesQuery) {
    const params = new URLSearchParams()
    if (next.search) params.set("search", next.search)
    if (next.brand) params.set("brand", next.brand)
    if (next.reason) params.set("reason", next.reason)
    if (next.from && next.to) {
      params.set("from", next.from)
      params.set("to", next.to)
    } else if (next.period && next.period !== DEFAULT_PERIOD) {
      params.set("period", next.period)
    }
    return params
  }

  function go(next: UnsubscribesQuery) {
    const params = filterParams(next)
    if (next.sort) params.set("sort", next.sort)
    if (next.size) params.set("size", next.size)
    if (next.page && next.page !== "1") params.set("page", next.page)
    const qs = params.toString()
    startLoading(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  // The ticked rows, or else everything the filters show. In the order on screen.
  const exportParams = selected.size > 0 ? new URLSearchParams({ ids: [...selected].join(",") }) : filterParams(query)
  if (query.sort) exportParams.set("sort", query.sort)
  const exportQuery = exportParams.toString()
  const exportHref = `/api/export/unsubscribes${exportQuery ? `?${exportQuery}` : ""}`

  return (
    <div className="flex min-h-0 flex-1 flex-col card-shell rounded-md border bg-muted/40 p-0.5">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
        <p className={cn(HEAD, "mr-auto pl-2")}>{selected.size > 0 ? `${selected.size} selected` : "All unsubscribes"}</p>

        {/* On a phone: search on its own row, then the filters share the width. */}
        <form
          className="relative w-full sm:w-auto"
          onSubmit={(event) => {
            event.preventDefault()
            go({ ...query, search: typed.trim() || undefined, page: undefined })
          }}
        >
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Search by email..."
            aria-label="Search by email"
            className="h-8 w-full rounded-md bg-transparent pl-8 sm:w-56"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className={FILTER_BUTTON} />}>
            {picked ? <BrandLogo name={picked.name} logoUrl={picked.logoUrl} className={SMALL_LOGO} /> : null}
            {picked ? brandLabel(picked, shared) : "All brands"}
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-max max-w-72 min-w-(--anchor-width)">
            <DropdownMenuRadioGroup
              value={query.brand ?? ""}
              onValueChange={(value) => go({ ...query, brand: value || undefined, page: undefined })}
            >
              <DropdownMenuRadioItem value="">All brands</DropdownMenuRadioItem>
              {brands.map((brand) => (
                <DropdownMenuRadioItem key={brand.id} value={brand.id}>
                  <BrandLogo name={brand.name} logoUrl={brand.logoUrl} className={SMALL_LOGO} />
                  <span className="truncate">{brandLabel(brand, shared)}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className={FILTER_BUTTON} />}>
            {query.reason ? reasonLabel(query.reason) : "All reasons"}
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-max max-w-72 min-w-(--anchor-width)">
            <DropdownMenuRadioGroup
              value={query.reason ?? ""}
              onValueChange={(value) => go({ ...query, reason: value || undefined, page: undefined })}
            >
              <DropdownMenuRadioItem value="">All reasons</DropdownMenuRadioItem>
              {Object.entries(REASONS).map(([code, label]) => (
                <DropdownMenuRadioItem key={code} value={code}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button ref={dateButton} variant="outline" className={FILTER_BUTTON} />}
          >
            <CalendarDays data-icon="inline-start" />
            {custom ? datesLabel(query.from!, query.to!) : (DATE_PERIODS[period] ?? DATE_PERIODS[DEFAULT_PERIOD])}
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-max min-w-(--anchor-width)">
            <DropdownMenuRadioGroup
              value={custom ? "" : period}
              onValueChange={(value) =>
                go({ ...query, period: value, from: undefined, to: undefined, page: undefined })
              }
            >
              {Object.entries(DATE_PERIODS).map(([key, label]) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPickOpen(true)}>
              <CalendarDays data-icon="inline-start" />
              Pick dates...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* The calendar opens under the date button, once "Pick dates..." is chosen. */}
        <Popover open={pickOpen} onOpenChange={setPickOpen}>
          <PopoverContent anchor={dateButton} align="end" className="w-max max-w-[calc(100vw-2rem)] p-0">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              defaultMonth={range?.from ?? new Date(today.getFullYear(), today.getMonth() - 1, 1)}
              disabled={{ after: today }}
              fixedWeeks
            />
            <div className="flex items-center justify-end gap-2 px-3 pb-3">
              <span className="mr-auto text-xs text-muted-foreground">
                {range?.from ? format(range.from, "d MMM yyyy") : "Pick a start"}
                {" – "}
                {range?.to ? format(range.to, "d MMM yyyy") : "and an end"}
              </span>
              <Button
                size="sm"
                disabled={!range?.from}
                onClick={() => {
                  if (!range?.from) return
                  setPickOpen(false)
                  go({
                    ...query,
                    period: undefined,
                    from: format(range.from, "yyyy-MM-dd"),
                    to: format(range.to ?? range.from, "yyyy-MM-dd"),
                    page: undefined,
                  })
                }}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className={FILTER_BUTTON} aria-label={`Rows per page: ${pageSize}`} />}
          >
            {pageSize} rows
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32">
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(value) => go({ ...query, size: value, page: undefined })}
            >
              {UNSUBSCRIBE_PAGE_SIZES.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {size} rows
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* A plain link: the browser owns the save dialog. Only for people allowed to export. */}
        {canExport ? (
          <Button
            variant="outline"
            className={FILTER_BUTTON}
            nativeButton={false}
            render={<a href={exportHref} download />}
          >
            <Download data-icon="inline-start" />
            {selected.size > 0 ? `Export ${selected.size} selected` : "Export CSV"}
          </Button>
        ) : null}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
        <LoadingCover show={loading} className="top-10 flex items-center justify-center bg-card">
          <PixelLoader />
        </LoadingCover>
        <Table
          containerClassName={cn("min-h-0 flex-1 overflow-auto", THIN_SCROLLBAR)}
          className={cn("whitespace-nowrap", rows.length === 0 && "h-full")}
        >
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(STICKY_HEAD, "w-10 pl-4")}>
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all on this page" />
              </TableHead>
              {SORTABLE.map(({ key, label }) => {
                const active = sortKey === key
                const desc = active && sortDir === "desc"
                return (
                  <TableHead key={key} className={cn(HEAD, STICKY_HEAD)} aria-sort={ariaSort(active, desc)}>
                    <SortButton label={label} active={active} desc={desc} onClick={() => toggleSort(key)} />
                  </TableHead>
                )
              })}
              <TableHead className={cn(HEAD, STICKY_HEAD, "pr-4")}>Lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="text-center align-middle">
                  <div className="flex flex-col items-center gap-1.5 py-10">
                    <MailX className="size-5 text-muted-foreground" aria-hidden />
                    {filtered ? (
                      <>
                        <p className="text-sm font-medium">Nothing matches.</p>
                        <p className="text-xs text-muted-foreground">Try another email or clear the filters.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setTyped("")
                            go({ size: query.size })
                          }}
                        >
                          Clear filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">No unsubscribes yet.</p>
                        <p className="text-xs text-muted-foreground">
                          When someone unsubscribes on a brand site, they show here.
                        </p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} data-state={selected.has(row.id) ? "selected" : undefined}>
                  <TableCell className="w-10 pl-4">
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={(checked) => toggleOne(row.id, checked)}
                      aria-label={`Select ${row.email}`}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {canadaStamp(row.updatedAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex max-w-64 min-w-0">
                      <TruncatedText>{row.email}</TruncatedText>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-1.5" title={row.brandDomain}>
                      <BrandLogo name={row.brand} logoUrl={row.brandLogo} className={SMALL_LOGO} />
                      {row.brand}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <ReasonCell row={row} />
                  </TableCell>
                  <TableCell className="pr-4 text-sm">
                    {row.clientId ? (
                      <Link
                        href={`/customers/clients/${row.clientId}`}
                        className="flex max-w-48 min-w-0 items-center gap-1 font-medium hover:underline"
                        title={row.leadName ?? undefined}
                      >
                        <span className="truncate">{row.leadName ?? "Open lead"}</span>
                        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Not a lead</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
        <p className="pl-1 tabular-nums">
          {page.totalElements === 0
            ? "No results"
            : `Showing ${page.page * pageSize + 1}–${page.page * pageSize + rows.length} of ${page.totalElements}`}
        </p>

        <TablePagination
          page={page.page + 1}
          totalPages={Math.max(1, page.totalPages)}
          onPage={(next) => go({ ...query, page: String(next) })}
        />
      </div>
    </div>
  )
}

export { UnsubscribesTable }
