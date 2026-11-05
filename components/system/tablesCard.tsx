"use client"

import { Panel } from "@/components/system/panel"
import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import { bytes, count } from "@/lib/format"
import type { SystemHealth } from "@/lib/systemTypes"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * A census of the database: what is in it, and what it weighs.
 *
 * <p>One statement against `pg_stat_user_tables` — row counts and
 * `pg_total_relation_size`, ordered biggest first.
 *
 * <p>Counts are estimates from the statistics collector, not `COUNT(*)`.
 * Postgres keeps no exact total, and asking for one on a large table means
 * reading the whole thing.
 *
 * <p>The useful reading is not any single row, it is which row is growing. At
 * eight megabytes the sizes are almost all index and page overhead; the moment
 * the disk figure starts moving, this is the card that says which table is
 * responsible.
 */

type DatabaseTable = SystemHealth["database"]["tables"][number]

const SORT = {
  name: (table: DatabaseTable) => table.name,
  rows: (table: DatabaseTable) => table.rows,
  bytes: (table: DatabaseTable) => table.bytes,
}

const COLUMNS: { key: keyof typeof SORT; label: string; className: string }[] = [
  { key: "name", label: "Table", className: "pl-4 text-left" },
  { key: "rows", label: "Rows", className: "px-3 text-right" },
  { key: "bytes", label: "Size", className: "pr-4 text-right" },
]

function TablesCard({ tables }: { tables: SystemHealth["database"]["tables"] }) {
  // Biggest first, as the server sends them, until a heading is clicked.
  const { sorted, head } = useSort(tables, SORT)

  return (
    <Panel
      title="Tables"
      hint={
        <>
          Rows and size of each table. Row counts are close, not exact.
        </>
      }
      action={
        <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
          {tables.length} tables
        </span>
      }
      // This card is the shock absorber for the whole Database tab: it is the
      // only thing allowed to shrink, so a shorter window takes rows off it
      // instead of putting a scrollbar on the tab.
      //
      // The floor is where that stops being a kindness. Squeezed past 9rem the
      // table is a header and a sliver, which is worse than admitting the window
      // is too short — below it the tab overflows and scrolls.
      //
      // min-h-36 replaces the min-h-0 that used to be here rather than sitting
      // beside it; two min-heights on one element is a coin toss decided by
      // stylesheet order.
      className="lg:min-h-36 lg:flex-1"
      bodyClassName="p-0"
    >
      {/* Scrolls inside the card rather than growing it. Nine tables fit today;
          a schema three times this size should not push the donut off the page. */}
      {/* Every row on a phone, where the page scrolls anyway. From lg it takes
          the height left over and scrolls inside itself. */}
      <div
        className={cn(
          "lg:min-h-0 lg:flex-1 lg:overflow-y-auto",
          THIN_SCROLLBAR
        )}
      >
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b">
              {COLUMNS.map(({ key, label, className }) => {
                const props = head(key)
                return (
                  <th
                    key={key}
                    className={cn(
                      "py-2 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase",
                      className
                    )}
                    aria-sort={ariaSort(props.active, props.desc)}
                  >
                    <SortButton label={label} {...props} />
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {sorted.map((table) => (
              <tr key={table.name} className="border-b last:border-b-0">
                <td className="py-2 pl-4">
                  <span className="font-mono text-xs">{table.name}</span>
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right text-xs tabular-nums",
                    // An empty table is worth noticing rather than reading as a
                    // zero among numbers — this one is empty because the feature
                    // behind it was never finished.
                    table.rows === 0 ? "text-muted-foreground/50" : "font-medium"
                  )}
                >
                  {count(table.rows)}
                </td>
                <td className="py-2 pr-4 text-right text-xs text-muted-foreground tabular-nums">
                  {bytes(table.bytes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export { TablesCard }
