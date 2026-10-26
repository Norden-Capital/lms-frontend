"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/tablePagination"
import { ACTION_TYPES, actionLabel, type ActionLogEntry } from "@/lib/actionLogTypes"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * A person's activity on Users — decided 2026-10-26: the action log's table,
 * simpler. When, what, and with whom; sortable, ten lines a page. The lines
 * are this person's latest, as the page fetched them.
 */

const HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"
const STICKY_HEAD = "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

const TONE: Record<string, string> = {
  neutral: "bg-muted-foreground/50",
  good: "bg-success",
  warn: "bg-warning",
  bad: "bg-destructive",
}

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const PAGE_SIZE = 10

type SortKey = "at" | "action" | "with"

/** The other person on a line, from this person's side. */
type Other = { word: "by" | "to"; label: string; publicId: string | null } | null

function otherOf(entry: ActionLogEntry, userId: string): Other {
  const byThem = entry.actor?.publicId === userId
  const toThem = entry.target?.publicId === userId
  if (byThem && entry.target?.label && !toThem) {
    return { word: "to", label: entry.target.label, publicId: entry.target.publicId }
  }
  if (toThem && entry.actor?.label && !byThem) {
    return { word: "by", label: entry.actor.label, publicId: entry.actor.publicId }
  }
  return null
}

/** "Sara Ali <sara@x.com>" → "Sara Ali". */
function nameOf(label: string) {
  return label.replace(/\s*<[^>]*>\s*$/, "").trim() || label
}

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "at", label: "When", className: "pl-4" },
  { key: "action", label: "What" },
  { key: "with", label: "With whom", className: "pr-4" },
]

function UserActivityTable({ entries, userId }: { entries: ActionLogEntry[]; userId: string }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "at", desc: true })
  const [page, setPage] = useState(1)

  const rows = entries.map((entry) => ({ entry, other: otherOf(entry, userId) }))
  const value = (row: (typeof rows)[number]) =>
    sort.key === "at"
      ? row.entry.at
      : sort.key === "action"
        ? actionLabel(row.entry.action)
        : row.other
          ? nameOf(row.other.label)
          : ""
  const sorted = [...rows].sort((a, b) => {
    const order = value(a).localeCompare(value(b))
    return sort.desc ? -order : order
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const shown = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function toggle(key: SortKey) {
    // A new column starts newest/A first; the same column flips.
    setSort((now) => (now.key === key ? { key, desc: !now.desc } : { key, desc: key === "at" }))
    setPage(1)
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        Nothing recorded for this account yet.
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Table containerClassName={cn("min-h-0 flex-1 overflow-auto", THIN_SCROLLBAR)}>
        <TableHeader className="[&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map(({ key, label, className }) => {
              const active = sort.key === key
              const Icon = !active ? ChevronsUpDown : sort.desc ? ChevronDown : ChevronUp
              return (
                <TableHead
                  key={key}
                  className={cn(HEAD, STICKY_HEAD, className)}
                  aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => toggle(key)}
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
          {shown.map(({ entry, other }) => (
            <TableRow key={entry.id}>
              <TableCell className="pl-4 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {WHEN.format(new Date(entry.at))}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className={cn("size-1.5 shrink-0 rounded-full", TONE[ACTION_TYPES[entry.action]?.tone ?? "neutral"])}
                  />
                  {actionLabel(entry.action)}
                </span>
              </TableCell>
              <TableCell className="max-w-56 pr-4">
                {other ? (
                  <span className="flex min-w-0 items-center gap-1 text-sm">
                    <span className="shrink-0 text-xs text-muted-foreground">{other.word}</span>
                    {other.publicId ? (
                      <Link href={`/users/${other.publicId}`} className="truncate hover:underline" title={other.label}>
                        {nameOf(other.label)}
                      </Link>
                    ) : (
                      <span className="truncate" title={other.label}>
                        {nameOf(other.label)}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pt-2 text-[0.7rem] text-muted-foreground">
        <p className="tabular-nums">
          {`Showing ${(current - 1) * PAGE_SIZE + 1}–${(current - 1) * PAGE_SIZE + shown.length} of ${sorted.length}`}
        </p>
        <TablePagination page={current} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  )
}

export { UserActivityTable }
