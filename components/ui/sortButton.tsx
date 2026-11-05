"use client"

import { useState } from "react"
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A column heading that sorts, built like the users table's: a real button, so it
 * is reachable by keyboard, and the sorted column in full-strength text. Put
 * {@link ariaSort} on the header cell, since a button has no sort state to report.
 */
function SortButton({
  label,
  active,
  desc,
  onClick,
  className,
}: {
  label: string
  active: boolean
  desc: boolean
  onClick: () => void
  className?: string
}) {
  const Icon = !active ? ChevronsUpDown : desc ? ChevronDown : ChevronUp
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active && "text-foreground",
        className
      )}
    >
      {label}
      <Icon className={cn("size-3", active ? "opacity-100" : "opacity-40")} aria-hidden />
    </button>
  )
}

function ariaSort(active: boolean, desc: boolean): "ascending" | "descending" | "none" {
  return active ? (desc ? "descending" : "ascending") : "none"
}

type SortValue = string | number | null | undefined

/**
 * Sorting for a list that is all on screen. `values` says what each column sorts
 * by. A new column starts from A or the smallest; clicking it again flips it.
 * Empty values go last either way.
 */
function useSort<Row, Key extends string>(
  rows: Row[],
  values: Record<Key, (row: Row) => SortValue>,
  initial: { key: Key; desc: boolean } | null = null
) {
  const [sort, setSort] = useState(initial)

  const sorted = !sort
    ? rows
    : [...rows].sort((a, b) => {
        const x = values[sort.key](a)
        const y = values[sort.key](b)
        if (x == null || x === "") return y == null || y === "" ? 0 : 1
        if (y == null || y === "") return -1
        const order =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" })
        return sort.desc ? -order : order
      })

  function toggle(key: Key) {
    setSort((now) => (now?.key === key ? { key, desc: !now.desc } : { key, desc: false }))
  }

  /** The props for one column's heading. */
  function head(key: Key) {
    const active = sort?.key === key
    const desc = active && sort.desc
    return { active, desc, onClick: () => toggle(key) }
  }

  return { sorted, head }
}

export { SortButton, ariaSort, useSort }
