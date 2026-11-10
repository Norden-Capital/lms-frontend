"use client"

import { BrandLogo, SMALL_LOGO } from "@/components/ui/brandLogo"
import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import { sharedSites, siteOf, tldOf, type BrandOption, type OverviewBrand } from "@/lib/applicationTypes"
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

/** Leads Overview's "By brand" table, sortable. The brand shows as its logo, its name on hover, like the leads table. */
function BrandCountsTable({ brands, logos }: { brands: OverviewBrand[]; logos: BrandOption[] }) {
  const byId = new Map(logos.map((brand) => [brand.id, brand]))
  // Two brands on one site (365loan.ca and .com) look the same, so they show their ending.
  const shared = sharedSites(logos)
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
          <tr className="border-t first:border-t-0">
            <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-muted-foreground">
              No brands yet.
            </td>
          </tr>
        ) : (
          sorted.map((brand) => (
            <tr key={brand.id} className="border-t first:border-t-0">
              <td className="px-4 py-2">
                <span
                  className="relative flex items-center gap-1.5"
                  title={byId.has(brand.id) ? `${brand.name} · ${byId.get(brand.id)!.domain}` : brand.name}
                >
                  <BrandLogo name={brand.name} logoUrl={byId.get(brand.id)?.logoUrl ?? null} className={SMALL_LOGO} />
                  <span className="sr-only">{brand.name}</span>
                  {byId.has(brand.id) && shared.has(siteOf(byId.get(brand.id)!.domain)) ? (
                    <span className="rounded-sm border px-1 font-mono text-[0.65rem] text-muted-foreground">
                      {tldOf(byId.get(brand.id)!.domain)}
                    </span>
                  ) : null}
                </span>
              </td>
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
