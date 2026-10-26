import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { BrandWarnings } from "@/components/configuration/brandWarnings"
import { BrandsPanel } from "@/components/configuration/brandsPanel"
import { PageHeader } from "@/components/layout/pageHeader"
import { requireUser } from "@/lib/auth"
import { listBrands } from "@/lib/brands"
import { getSeoRobot } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Brands",
}

/**
 * Configuration → Brands — decided 2026-10-20. The Owner only, via
 * middleware's `OWNER_ONLY`; the backend refuses anybody else too.
 */
export default async function BrandsPage() {
  await requireUser()

  const [brands, robotEmail] = await Promise.all([listBrands(), getSeoRobot()])
  if (!brands.ok && brands.error.status === 403) forbidden()

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3">
      <PageHeader
        title="Brands"
        description="Your brand emails. Mail comes in and replies go out from them."
      />

      {brands.ok ? (
        <BrandsPanel brands={brands.data} />
      ) : (
        <div className="flex max-w-md flex-col items-center gap-2 self-center rounded-md border bg-card p-8 text-center">
          <ShieldAlert className="size-5 text-warning" aria-hidden />
          <p className="text-sm font-medium">The brands couldn&apos;t be loaded</p>
          <p className="text-xs text-muted-foreground">{brands.error.message}</p>
        </div>
      )}

      {/* Under the table: what to set up outside this app for a brand to work. */}
      <BrandWarnings robotEmail={robotEmail} />
    </div>
  )
}
