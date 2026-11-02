"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { OVERVIEW_PERIODS, overviewDays, type BrandOption, type OverviewQuery } from "@/lib/applicationTypes"

/** One row above the numbers: period, brand, test data. All of it lives in the address. */
function OverviewFilters({ query, brands }: { query: OverviewQuery; brands: BrandOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startLoading] = useTransition()
  const days = overviewDays(query.days)
  const brandName = brands.find((brand) => brand.id === query.brand)?.name

  function go(next: OverviewQuery) {
    const params = new URLSearchParams()
    if (next.days && next.days !== "30") params.set("days", next.days)
    if (next.brand) params.set("brand", next.brand)
    if (next.test === "1") params.set("test", "1")
    const qs = params.toString()
    startLoading(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border bg-card p-0.5" role="group" aria-label="Period">
        {OVERVIEW_PERIODS.map((period) => (
          <Button
            key={period}
            size="sm"
            variant={period === days ? "secondary" : "ghost"}
            aria-pressed={period === days}
            onClick={() => go({ ...query, days: String(period) })}
          >
            {period} days
          </Button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="rounded-md bg-card font-normal" />}>
          {brandName ?? "All brands"}
          <ChevronDown data-icon="inline-end" className="opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuRadioGroup
            value={query.brand ?? ""}
            onValueChange={(value) => go({ ...query, brand: value || undefined })}
          >
            <DropdownMenuRadioItem value="">All brands</DropdownMenuRadioItem>
            {brands.map((brand) => (
              <DropdownMenuRadioItem key={brand.id} value={brand.id}>
                {brand.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <label className="ml-1 flex items-center gap-2 text-sm">
        <Switch
          checked={query.test === "1"}
          onCheckedChange={(checked) => go({ ...query, test: checked ? "1" : undefined })}
        />
        Show test data
      </label>
    </div>
  )
}

export { OverviewFilters }
