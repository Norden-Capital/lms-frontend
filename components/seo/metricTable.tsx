import { count, percent } from "@/lib/format"
import type { SeoRow } from "@/lib/seoTypes"
import { cn } from "@/lib/utils"

/**
 * The same four numbers, against whatever they were broken down by.
 *
 * <p>One table for every dimension. Queries, pages, countries, devices and
 * search appearance differ only in what the first column holds, so five tables
 * would be four copies waiting to disagree about how a click-through rate is
 * rounded.
 *
 * <p>Sorted by clicks descending, which is the order the API returns and not a
 * choice made here — worth knowing, because it means the rows with the most
 * <em>impressions</em> are often near the bottom, and those are usually the
 * interesting ones.
 */

const HEAD =
  "py-2 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

function MetricTable({
  rows,
  /** What the first column is called — "Query", "Page", "Country". */
  label,
  /** Rendered above the first column's value, for URLs that want shortening. */
  format,
}: {
  rows: SeoRow[]
  label: string
  format?: (key: string) => React.ReactNode
}) {
  if (rows.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        Nothing in this period.
      </p>
    )
  }

  return (
    // table-fixed for the same reason the backup log needs it: without declared
    // widths a long query in one row decides the column layout for every other,
    // and the table shuffles sideways as you page through it.
    <table className="w-full table-fixed border-collapse text-sm">
      <colgroup>
        <col style={{ width: "46%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "12%" }} />
      </colgroup>

      <thead className="sticky top-0 z-10 bg-card">
        <tr className="border-b">
          <th className={cn(HEAD, "pl-4 text-left")}>{label}</th>
          <th className={cn(HEAD, "px-3 text-right")}>Clicks</th>
          <th className={cn(HEAD, "px-3 text-right")}>Impressions</th>
          <th className={cn(HEAD, "px-3 text-right")}>CTR</th>
          <th className={cn(HEAD, "pr-4 text-right")}>Position</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b last:border-b-0">
            <td className="py-2.5 pl-4">
              <span className="block truncate" title={row.key}>
                {format ? format(row.key) : row.key}
              </span>
            </td>
            <td className="px-3 py-2.5 text-right text-xs tabular-nums">
              {count(row.clicks)}
            </td>
            <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
              {count(row.impressions)}
            </td>
            <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
              {percent(row.ctr * 100, 1)}
            </td>
            {/* One decimal, always. Position is an average, so "4" and "4.0"
                are different claims — the second says it was measured. */}
            <td className="py-2.5 pr-4 text-right text-xs text-muted-foreground tabular-nums">
              {row.position.toFixed(1)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { MetricTable }
