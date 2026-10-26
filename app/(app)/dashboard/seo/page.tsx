import type { Metadata } from "next"
import Link from "next/link"
import { ChartLine, PlugZap } from "lucide-react"

import { ErrorState } from "@/components/error/errorState"
import { SeoWorkspace } from "@/components/seo/seoWorkspace"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { OWNER } from "@/lib/roles"
import { getSeoBrands, getSeoOverview } from "@/lib/seo"
import type { SeoQuery } from "@/lib/seoTypes"

export const metadata: Metadata = {
  title: "SEO overview",
}

/**
 * The SEO Overview — decided 2026-10-20: each brand's Google Analytics, read
 * live by the backend (oneBase's data), drawn with this app's own cards.
 * The brand and the period are in the address bar.
 */
export default async function SeoOverviewPage({ searchParams }: { searchParams: Promise<SeoQuery> }) {
  const user = await requireUser()
  const query = await searchParams
  const brands = await getSeoBrands()

  if (!brands.ok) {
    const notConnected = brands.error.status === 503
    return (
      <ErrorState
        code="SEO"
        icon={notConnected ? PlugZap : ChartLine}
        title={notConnected ? "Google Analytics is not connected yet" : "Could not load the SEO overview"}
        description={notConnected ? "The Google key goes in the server settings." : brands.error.message}
        className="min-h-0 flex-1"
        size="sm"
      />
    )
  }

  if (brands.data.length === 0) {
    return (
      <ErrorState
        code="SEO"
        icon={ChartLine}
        title="No brand has Google Analytics yet"
        description="Add a Google Analytics ID to a brand to see its visitors here."
        className="min-h-0 flex-1"
        size="sm"
      >
        {user.role === OWNER && (
          <Button size="sm" variant="outline" render={<Link href="/configuration/brands" />}>
            Go to Brands
          </Button>
        )}
      </ErrorState>
    )
  }

  const brand = brands.data.find((entry) => entry.id === query.brand) ?? brands.data[0]
  const overview = await getSeoOverview(brand.id, query.range ?? "7d", query.from, query.to)

  return (
    <SeoWorkspace
      key={brand.id}
      brands={brands.data}
      query={{ ...query, brand: brand.id }}
      overview={overview.ok ? overview.data : null}
      error={overview.ok ? null : overview.error.message}
    />
  )
}
