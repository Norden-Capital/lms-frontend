"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Ellipsis,
  FileJson,
  FileSpreadsheet,
  FileText,
  Info,
  Search,
} from "lucide-react"

import {
  ACTION_TYPES,
  LOG_PAGE_SIZES,
  actionLabel,
  logPageSize,
  type ActionLogEntry,
  type ActionLogQuery,
  type LogParty,
} from "@/lib/actionLogTypes"
import type { Page } from "@/lib/userTypes"
import { ActionLogRowsSkeleton } from "@/components/actionLog/actionLogLoading"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/tablePagination"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/** Column headings: the users table's letter-spaced mono. */
const HEAD =
  "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

/** Headings stay put while the rows scroll — the users table's technique. */
const STICKY_HEAD =
  "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

/** The columns, and what each sorts by — the backend's names. */
const COLUMNS: { key: string; label: string; className?: string }[] = [
  { key: "at", label: "When" },
  { key: "action", label: "What" },
  { key: "actor", label: "Who" },
  { key: "target", label: "To whom" },
  { key: "details", label: "Details" },
  { key: "ip", label: "Address", className: "pr-4" },
]

const TONE: Record<string, string> = {
  neutral: "bg-muted-foreground/50",
  good: "bg-success",
  warn: "bg-warning",
  bad: "bg-destructive",
}

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

/**
 * The action log as a table, built like the users table — decided 2026-10-19:
 * the same tinted frame with the toolbar on it, the same white panel, sticky
 * mono headings, rows-per-page beside the search, and the count and pages
 * underneath. No filter by kind (dropped 2026-10-19) — search covers it.
 * Everything lives in the address, so a search can be bookmarked, and Back
 * undoes it.
 */
function ActionLogTable({ page, query }: { page: Page<ActionLogEntry>; query: ActionLogQuery }) {
  const router = useRouter()
  const pathname = usePathname()
  const [typed, setTyped] = useState(query.search ?? "")
  // A search, sort or page waits on the server. This says so, over the rows
  // only — decided 2026-10-20.
  const [loading, startLoading] = useTransition()
  const pageSize = logPageSize(query.size)
  const rows = page.content

  // Ticked lines, for exporting just those — as on the users table. Only the
  // lines on screen can be ticked, so "all" never picks up lines unseen.
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const allVisibleSelected = rows.length > 0 && rows.every((entry) => selected.has(entry.id))

  function toggleAll(checked: boolean) {
    const next = new Set(selected)
    rows.forEach((entry) => (checked ? next.add(entry.id) : next.delete(entry.id)))
    setSelected(next)
  }

  function toggleOne(id: number, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    setSelected(next)
  }

  /** The search and sort on screen, or just the ticked lines. */
  function exportHref(format: "csv" | "json" | "xlsx") {
    const next = new URLSearchParams()
    next.set("format", format)
    if (query.search) next.set("search", query.search)
    if (query.sort) next.set("sort", query.sort)
    if (selected.size > 0) next.set("ids", [...selected].join(","))
    return `/api/export/action-log?${next.toString()}`
  }

  // Newest first when nothing is chosen, and the When column shows it.
  const [sortKey, sortDir] = (query.sort ?? "at,desc").split(",")

  function toggleSort(key: string) {
    // The same column flips; a new one starts ascending — as the users table.
    const nextDir = sortKey === key && sortDir !== "desc" ? "desc" : "asc"
    go({ ...query, sort: `${key},${nextDir}`, page: undefined })
  }

  function go(next: ActionLogQuery) {
    const params = new URLSearchParams()
    if (next.action) params.set("action", next.action)
    if (next.search) params.set("search", next.search)
    if (next.size) params.set("size", next.size)
    if (next.sort) params.set("sort", next.sort)
    if (next.page && next.page !== "1") params.set("page", next.page)
    const qs = params.toString()
    startLoading(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md border bg-muted/40 p-0.5">
      {/* ── Toolbar, on the tinted frame ──────────────────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
        <p className={cn(HEAD, "mr-auto flex items-center gap-1.5 pl-2")}>
          {selected.size > 0 ? `${selected.size} selected` : "All activity"}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="About this log"
                />
              }
            >
              <Info className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              Who did what, and when. Tick lines to export only those.
            </TooltipContent>
          </Tooltip>
        </p>

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
            placeholder="Search the log..."
            aria-label="Search the log"
            className="h-8 w-56 rounded-md bg-transparent pl-8"
          />
        </form>

        {/* How many rows fit on a page, as on the users table. */}
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
              {LOG_PAGE_SIZES.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {size} rows
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Exports — the users table's round menu, same three formats. Links,
            not buttons: the browser owns the download. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full bg-card"
                aria-label="More options"
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {selected.size > 0
                  ? `Export ${selected.size} selected`
                  : `Export ${page.totalElements} ${page.totalElements === 1 ? "line" : "lines"}`}
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

      {/* ── The white panel ──────────────────────────────────────────────── */}
      {/* relative: the loader covers the rows only, under the headings. */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
        <LoadingCover show={loading} className="top-10 bg-card">
          <ActionLogRowsSkeleton />
        </LoadingCover>
        <Table
          containerClassName={cn("min-h-0 flex-1 overflow-auto", THIN_SCROLLBAR)}
          className={cn(rows.length === 0 && "h-full")}
        >
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(STICKY_HEAD, "w-10 pl-4")}>
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all lines on this page"
                />
              </TableHead>
              {COLUMNS.map(({ key, label, className }) => {
                const active = sortKey === key
                const Icon = !active ? ChevronsUpDown : sortDir === "desc" ? ChevronDown : ChevronUp
                return (
                  <TableHead
                    key={key}
                    className={cn(HEAD, STICKY_HEAD, className)}
                    aria-sort={active ? (sortDir === "desc" ? "descending" : "ascending") : "none"}
                  >
                    {/* A real button, so the column is sortable by keyboard. */}
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                        active && "text-foreground"
                      )}
                    >
                      {label}
                      <Icon className={cn("size-3", active ? "opacity-100" : "opacity-40")} aria-hidden />
                    </button>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="text-center align-middle text-sm text-muted-foreground">
                  {query.search
                    ? `Nothing matches "${query.search}".`
                    : "Nothing has happened yet."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((entry) => (
                <TableRow key={entry.id} data-state={selected.has(entry.id) ? "selected" : undefined}>
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selected.has(entry.id)}
                      onCheckedChange={(checked) => toggleOne(entry.id, checked)}
                      aria-label="Select this line"
                    />
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {WHEN.format(new Date(entry.at))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          TONE[ACTION_TYPES[entry.action]?.tone ?? "neutral"]
                        )}
                      />
                      {actionLabel(entry.action)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-56">
                    <Person party={entry.actor} fallback="Not signed in" />
                  </TableCell>
                  <TableCell className="max-w-56">
                    <Person party={entry.target} fallback="—" />
                  </TableCell>
                  <TableCell className="max-w-72 text-xs text-muted-foreground">
                    <span className="line-clamp-2" title={entry.details ?? undefined}>
                      {entry.details ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 font-mono text-xs whitespace-nowrap text-muted-foreground">
                    {entry.ip ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Count and pages, on the tinted frame under the panel ───────────── */}
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

/**
 * A name from the log, linked to the account when it still exists. The label is
 * the one frozen at the time, so it reads as it did when the thing happened.
 */
function Person({ party, fallback }: { party: LogParty | null; fallback: string }) {
  if (!party?.label) {
    return <span className="text-xs text-muted-foreground">{fallback}</span>
  }
  const text = (
    <span className="block truncate text-sm" title={party.label}>
      {party.label}
    </span>
  )
  return party.publicId ? (
    <Link href={`/users/${party.publicId}`} className="hover:underline">
      {text}
    </Link>
  ) : (
    text
  )
}

export { ActionLogTable }
