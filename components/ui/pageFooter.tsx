"use client"

import { TablePagination } from "@/components/ui/tablePagination"

/**
 * "Showing 1–10 of 24" and the page buttons, under a table on its grey shell.
 * Added 2026-11-09 for Brands and Channels, the same strip as the lead page.
 */
function PageFooter({
  page,
  pageSize,
  total,
  onPage,
}: {
  /** 1-based. */
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
      <p className="pl-1 tabular-nums">{total === 0 ? "No results" : `Showing ${first}–${last} of ${total}`}</p>
      <TablePagination page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  )
}

/** The rows of one page, and the page kept in range when rows go away. */
function usePage<T>(rows: T[], pageSize: number, wanted: number) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(wanted, pages)
  return { page, rows: rows.slice((page - 1) * pageSize, page * pageSize) }
}

export { PageFooter, usePage }
