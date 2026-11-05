"use client"

import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import type { OverviewBrand } from "@/lib/applicationTypes"
import { cn } from "@/lib/utils"

const SORT = {
  name: (brand: OverviewBrand) => brand.name,
  leads: (brand: OverviewBrand) => brand.leads,
  abandoned: (brand: OverviewBrand) => brand.abandoned,
  failed: (brand: OverviewBrand) => brand.failed,
}

const COLUMNS: { key: keyof typeof SORT; label: string; right?: boolean }[] = [
  { key: "name", label: "Brand" },
  { key: "leads", label: "Leads", right: true },
  { key: "abandoned", label: "Abandoned", right: true },
  { key: "failed", label: "Failed", right: true },
]

/** Leads Overview's "By brand" table, sortable. */
function BrandCountsTable({ brands }: { brands: OverviewBrand[] }) {
  const { sorted, head } = useSort(brands, SORT)

  return (
    <table className="w-full text-sm tabular-nums">
      <thead className="text-left text-xs text-muted-foreground">
        <tr>
          {COLUMNS.map(({ key, label, right }) => {
            const props = head(key)
            return (
              <th
                key={key}
                className={cn("px-4 py-2 font-medium", right && "text-right")}
                aria-sort={ariaSort(props.active, props.desc)}
              >
                <SortButton label={label} {...props} />
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 ? (
          <tr className="border-t">
            <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-muted-foreground">
              No brands yet.
            </td>
          </tr>
        ) : (
          sorted.map((brand) => (
            <tr key={brand.id} className="border-t">
              <td className="px-4 py-2">{brand.name}</td>
              <td className="px-4 py-2 text-right">{brand.leads}</td>
              <td className="px-4 py-2 text-right">{brand.abandoned}</td>
              <td className="px-4 py-2 text-right">{brand.failed}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

export { BrandCountsTable }
