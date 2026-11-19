"use client"

import type { ReactNode } from "react"

import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import type { BreakdownCounts } from "@/lib/applicationTypes"
import { count, share } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Leads Overview's "By channel" and "By brand" tables — one table since
 * 2026-11-19 (owner): the funnel's steps, then the cards' Leads, Abandoned and
 * Failed, for every row and the Total.
 */

/** One row: what it is, how to sort it by name, and its counts. */
export type BreakdownRow = BreakdownCounts & { key: string; name: ReactNode; sortName: string }

const SORT = {
  name: (row: BreakdownRow) => row.sortName,
  visitors: (row: BreakdownRow) => row.visitors,
  step1: (row: BreakdownRow) => row.step1,
  step2: (row: BreakdownRow) => row.step2,
  step3: (row: BreakdownRow) => row.step3,
  leads: (row: BreakdownRow) => row.leads,
  abandoned: (row: BreakdownRow) => row.abandoned,
  failed: (row: BreakdownRow) => row.failed,
}

type Key = keyof typeof SORT

const COLUMNS: { key: Exclude<Key, "name">; label: string }[] = [
  { key: "visitors", label: "Visitors" },
  { key: "step1", label: "Step 1" },
  { key: "step2", label: "Step 2" },
  { key: "step3", label: "Step 3" },
  { key: "leads", label: "Leads" },
  { key: "abandoned", label: "Abandoned" },
  { key: "failed", label: "Failed" },
]

/** One number. Steps 1–3 show their share of step 1 beside it. */
function Cell({ value, of, strong }: { value: number; of?: number; strong?: boolean }) {
  return (
    <td className="px-4 py-2 text-right whitespace-nowrap">
      <span className={strong ? "font-semibold" : "font-medium"}>{count(value)}</span>
      {of === undefined ? null : <span className="ml-1.5 text-xs text-muted-foreground">({share(value, of)})</span>}
    </td>
  )
}

function Line({ name, counts, total }: { name: ReactNode; counts: BreakdownCounts; total?: boolean }) {
  return (
    // Total stays stuck to the bottom while the rows scroll.
    <tr
      className={
        total
          ? "[&>td]:sticky [&>td]:bottom-0 [&>td]:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] [&>td]:shadow-[inset_0_1px_0_var(--border)]"
          : // No top line on the first row: the titles above already draw one.
            "border-t first:border-t-0"
      }
    >
      <td className={cn("px-4 py-2 whitespace-nowrap", total && "font-semibold")}>{name}</td>
      <Cell value={counts.visitors} strong={total} />
      <Cell value={counts.step1} of={counts.step1} strong={total} />
      <Cell value={counts.step2} of={counts.step1} strong={total} />
      <Cell value={counts.step3} of={counts.step1} strong={total} />
      <Cell value={counts.leads} strong={total} />
      <Cell value={counts.abandoned} strong={total} />
      <Cell value={counts.failed} strong={total} />
    </tr>
  )
}

/**
 * Sortable. Total stays last whatever the order, and at the bottom: when the
 * table is given more room, an empty row above it takes it. Wide enough for
 * every column; scrolls sideways on a small screen.
 */
function BreakdownTable({
  title,
  rows,
  total,
  empty,
}: {
  /** The first column's title: "Source" or "Brand". */
  title: string
  rows: BreakdownRow[]
  total: BreakdownCounts
  empty: string
}) {
  const { sorted, head } = useSort(rows, SORT)
  const nameHead = head("name")

  return (
    <table className="h-full w-full min-w-[60rem] text-sm tabular-nums">
      <thead className="text-left text-xs text-muted-foreground">
        <tr>
          <th className="px-4 py-2 font-medium" aria-sort={ariaSort(nameHead.active, nameHead.desc)}>
            <SortButton label={title} {...nameHead} />
          </th>
          {COLUMNS.map(({ key, label }) => {
            const props = head(key)
            return (
              <th key={key} className="px-4 py-2 text-right font-medium" aria-sort={ariaSort(props.active, props.desc)}>
                <SortButton label={label} {...props} />
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 ? (
          <tr className="border-t first:border-t-0">
            <td colSpan={COLUMNS.length + 1} className="px-4 py-6 text-center text-muted-foreground">
              {empty}
            </td>
          </tr>
        ) : (
          sorted.map((row) => <Line key={row.key} name={row.name} counts={row} />)
        )}
        <tr className="h-full" aria-hidden>
          <td colSpan={COLUMNS.length + 1} className="p-0" />
        </tr>
        <Line name="Total" counts={total} total />
      </tbody>
    </table>
  )
}

export { BreakdownTable }
