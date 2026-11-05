"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import type { ReactNode } from "react"
import { ChevronDown, Ellipsis, FileJson, FileSpreadsheet, FileText, Search } from "lucide-react"

import { ResultPill, TestPill } from "@/components/customers/applicationPills"
import { BrandLogo, SMALL_LOGO } from "@/components/ui/brandLogo"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnPicker, useHiddenColumns } from "@/components/ui/columnPicker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { LoadingCover } from "@/components/ui/loadingCover"
import { PixelLoader } from "@/components/ui/pageLoader"
import { SortButton, ariaSort } from "@/components/ui/sortButton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/tablePagination"
import {
  APPLICATION_PAGE_SIZES,
  INCOME_TYPES,
  applicationPageSize,
  birthDateLabel,
  brandLabel,
  channelLabel,
  money,
  sharedSites,
  siteOf,
  tldOf,
  type ApplicationRow,
  type ApplicationsQuery,
  type BrandOption,
} from "@/lib/applicationTypes"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import type { Page } from "@/lib/userTypes"
import { cn } from "@/lib/utils"
import { canadaStamp } from "@/lib/format"

const HEAD =
  "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const STICKY_HEAD =
  "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

/** What a cell needs beyond its row. */
type CellContext = { href: string; shared: Set<string> }

type Column = {
  id: string
  label: string
  /** The server's name for it. The answers have none: they are encrypted, so the database cannot order them. */
  sort?: string
  className?: string
  /** Only on lists that reached LeadScout. */
  result?: boolean
  /** Off until switched on in the columns menu. */
  hidden?: boolean
  cell: (row: ApplicationRow, context: CellContext) => ReactNode
  cellClassName?: string
}

const dash = (value: string | null) => value ?? "—"

/** Every column, in order. The last one gets the table's side padding. */
const COLUMNS: Column[] = [
  {
    id: "id",
    label: "Lead ID",
    sort: "id",
    cell: (row) => row.id,
    cellClassName: "font-mono text-xs whitespace-nowrap text-muted-foreground",
  },
  {
    id: "name",
    label: "Name",
    cell: (row, { href }) => (
      <span className="flex items-center gap-2">
        {/* A real link too, for the keyboard and for opening in a new tab. */}
        <Link href={href} className="truncate text-sm font-medium hover:underline">
          {row.name ?? "Open client"}
        </Link>
        {row.test ? <TestPill /> : null}
      </span>
    ),
    cellClassName: "max-w-48",
  },
  {
    id: "firstName",
    label: "First name",
    hidden: true,
    cell: (row) => dash(row.firstName),
    cellClassName: "text-sm whitespace-nowrap",
  },
  {
    id: "lastName",
    label: "Last name",
    hidden: true,
    cell: (row) => dash(row.lastName),
    cellClassName: "text-sm whitespace-nowrap",
  },
  { id: "email", label: "Email", sort: "email", cell: (row) => row.email, cellClassName: "max-w-56 truncate text-sm" },
  {
    id: "phone",
    label: "Phone",
    cell: (row) => dash(row.phone),
    cellClassName: "text-sm whitespace-nowrap tabular-nums",
  },
  {
    id: "birthDate",
    label: "Date of birth",
    className: "text-center",
    cell: (row) => (row.birthDate ? birthDateLabel(row.birthDate) : "—"),
    cellClassName: "text-center text-sm whitespace-nowrap tabular-nums",
  },
  {
    id: "province",
    label: "Province",
    className: "text-center",
    cell: (row) => dash(row.province),
    cellClassName: "text-center text-sm whitespace-nowrap",
  },
  {
    id: "brand",
    label: "Brand",
    sort: "brand",
    // The logo alone; the ending only when two brands share a site.
    cell: (row, { shared }) => (
      <span className="flex items-center gap-1.5" title={`${row.brand} · ${row.brandDomain}`}>
        <BrandLogo
          name={row.brand}
          logoUrl={row.brandLogo}
          className={SMALL_LOGO}
        />
        <span className="sr-only">{row.brand}</span>
        {shared.has(siteOf(row.brandDomain)) ? (
          <span className="rounded-sm border px-1 font-mono text-[0.65rem] text-muted-foreground">
            {tldOf(row.brandDomain)}
          </span>
        ) : null}
      </span>
    ),
    cellClassName: "text-sm whitespace-nowrap",
  },
  {
    id: "channel",
    label: "Channel",
    sort: "channel",
    cell: (row) => channelLabel(row.channel),
    cellClassName: "text-sm whitespace-nowrap",
  },
  {
    id: "amount",
    label: "Amount",
    sort: "amount",
    className: "text-center",
    // Centred; the dollar sign still follows the number.
    cell: (row) => money(row.amount),
    cellClassName: "text-center text-sm whitespace-nowrap tabular-nums",
  },
  {
    id: "incomeType",
    label: "Income type",
    cell: (row) => (row.incomeType ? (INCOME_TYPES[row.incomeType] ?? row.incomeType) : "—"),
    cellClassName: "text-sm whitespace-nowrap",
  },
  { id: "employer", label: "Employer", cell: (row) => dash(row.employer), cellClassName: "max-w-48 truncate text-sm" },
  {
    id: "result",
    label: "Result",
    sort: "result",
    result: true,
    cell: (row) => <ResultPill status={row.leadscoutStatus} />,
    cellClassName: "whitespace-nowrap",
  },
  {
    id: "createdAt",
    label: "Created",
    sort: "createdAt",
    cell: (row) => canadaStamp(row.createdAt),
    cellClassName: "text-xs whitespace-nowrap text-muted-foreground tabular-nums",
  },
]

const HIDDEN_BY_DEFAULT = COLUMNS.filter((column) => column.hidden).map((column) => column.id)

/**
 * One list of applications, built like the action log: toolbar on the tinted
 * frame, white panel, count and pages underneath. Everything lives in the
 * address, so a search can be bookmarked, and Back undoes it.
 */
function ApplicationsTable({
  page,
  query,
  brands,
  channels,
  heading,
  empty,
  showResult,
  list,
}: {
  page: Page<ApplicationRow>
  query: ApplicationsQuery
  brands: BrandOption[]
  channels: string[]
  heading: string
  empty: string
  /** Abandoned people never reached LeadScout, so that list has no result to show. */
  showResult: boolean
  /** Which list this is: each remembers its own columns, and the export asks for it. */
  list: "LEAD" | "ABANDONED" | "FAILED"
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [typed, setTyped] = useState(query.search ?? "")
  const [loading, startLoading] = useTransition()
  const pageSize = applicationPageSize(query.size)
  const rows = page.content
  const shared = sharedSites(brands)
  const picked = brands.find((brand) => brand.id === query.brand)
  const brandName = picked ? brandLabel(picked, shared) : undefined
  const available = COLUMNS.filter((column) => showResult || !column.result)
  const { hidden, toggle, reset } = useHiddenColumns(`lms.columns.${list}`, HIDDEN_BY_DEFAULT)
  const columns = available.filter((column) => !hidden.has(column.id))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))
  // No sort in the address means newest first, so Created shows as sorted.
  const [sortKey, sortDir] = (query.sort ?? "createdAt,desc").split(",")

  function go(next: ApplicationsQuery) {
    const params = new URLSearchParams()
    if (next.search) params.set("search", next.search)
    if (next.brand) params.set("brand", next.brand)
    if (next.channel) params.set("channel", next.channel)
    if (next.sort) params.set("sort", next.sort)
    if (next.size) params.set("size", next.size)
    if (next.page && next.page !== "1") params.set("page", next.page)
    const qs = params.toString()
    startLoading(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  /**
   * The export: this list with its filters and order, or only the ticked rows.
   * Paging is left out on purpose — nobody means "export page 2".
   */
  function exportHref(format: "csv" | "json" | "xlsx") {
    const params = new URLSearchParams({ format, status: list })
    for (const key of ["search", "brand", "channel", "sort"] as const) {
      const value = query[key]
      if (value) params.set(key, value)
    }
    if (selected.size > 0) params.set("ids", [...selected].join(","))
    return `/api/export/applications?${params}`
  }

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
    // The same column flips. A new one starts newest first for dates, A or smallest first otherwise.
    const nextDir =
      sortKey === key ? (sortDir === "desc" ? "asc" : "desc") : key === "createdAt" ? "desc" : "asc"
    go({ ...query, sort: `${key},${nextDir}`, page: undefined })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md border bg-muted/40 p-0.5">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
        <p className={cn(HEAD, "mr-auto pl-2")}>{selected.size > 0 ? `${selected.size} selected` : heading}</p>

        <form
          className="relative"
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
            className="h-8 w-56 rounded-md bg-transparent pl-8"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="rounded-md bg-transparent font-normal" />}
          >
            {picked ? <BrandLogo name={picked.name} logoUrl={picked.logoUrl} className={SMALL_LOGO} /> : null}
            {brandName ?? "All brands"}
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
          <DropdownMenuTrigger
            render={<Button variant="outline" className="rounded-md bg-transparent font-normal" />}
          >
            {query.channel ? channelLabel(query.channel) : "All channels"}
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-max max-w-72 min-w-(--anchor-width)">
            <DropdownMenuRadioGroup
              value={query.channel ?? ""}
              onValueChange={(value) => go({ ...query, channel: value || undefined, page: undefined })}
            >
              <DropdownMenuRadioItem value="">All channels</DropdownMenuRadioItem>
              {channels.map((channel) => (
                <DropdownMenuRadioItem key={channel} value={channel}>
                  {channelLabel(channel)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="rounded-md bg-transparent font-normal"
                aria-label={`Rows per page: ${pageSize}`}
              />
            }
          >
            {pageSize} rows
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32">
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(value) => go({ ...query, size: value, page: undefined })}
            >
              {APPLICATION_PAGE_SIZES.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {size} rows
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <ColumnPicker columns={available} hidden={hidden} onToggle={toggle} onReset={reset} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="icon-sm" className="bg-card" aria-label="More options" />}
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          {/* Links: the browser owns the save dialog. */}
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {selected.size > 0
                  ? `Export ${selected.size} selected`
                  : `Export ${page.totalElements} ${page.totalElements === 1 ? "row" : "rows"}`}
              </DropdownMenuLabel>
              <DropdownMenuItem render={<a href={exportHref("csv")} download />}>
                <FileText data-icon="inline-start" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem render={<a href={exportHref("json")} download />}>
                <FileJson data-icon="inline-start" />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem render={<a href={exportHref("xlsx")} download />}>
                <FileSpreadsheet data-icon="inline-start" />
                Excel
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
        <LoadingCover show={loading} className="top-10 flex items-center justify-center bg-card">
          <PixelLoader />
        </LoadingCover>
        <Table
          containerClassName={cn("min-h-0 flex-1 overflow-auto", THIN_SCROLLBAR)}
          className={cn(rows.length === 0 && "h-full")}
        >
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(STICKY_HEAD, "w-10 pl-4")}>
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all on this page" />
              </TableHead>
              {columns.map(({ id, label, sort, className }, index) => {
                const active = sortKey === sort
                const desc = active && sortDir === "desc"
                return (
                  <TableHead
                    key={id}
                    className={cn(HEAD, STICKY_HEAD, index === columns.length - 1 && "pr-4", className)}
                    aria-sort={sort ? ariaSort(active, desc) : undefined}
                  >
                    {sort ? (
                      <SortButton label={label} active={active} desc={desc} onClick={() => toggleSort(sort)} />
                    ) : (
                      label
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + 1} className="text-center align-middle text-sm text-muted-foreground">
                  {query.search || query.brand || query.channel ? "Nothing matches." : empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const context = { href: `/customers/clients/${row.clientId}`, shared }
                return (
                  // The whole line opens the client, except its links and its tick box.
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    data-state={selected.has(row.id) ? "selected" : undefined}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("a, button, [data-slot=checkbox]")) return
                      startLoading(() => router.push(context.href))
                    }}
                  >
                    <TableCell className="w-10 pl-4">
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(checked) => toggleOne(row.id, checked)}
                        aria-label={`Select ${row.name ?? row.email}`}
                      />
                    </TableCell>
                    {columns.map((column, index) => (
                      <TableCell
                        key={column.id}
                        className={cn(column.cellClassName, index === columns.length - 1 && "pr-4")}
                      >
                        {column.cell(row, context)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
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

export { ApplicationsTable }
