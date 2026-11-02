import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { ChannelsPanel } from "@/components/configuration/channelsPanel"
import { PageHeader } from "@/components/layout/pageHeader"
import { requireUser } from "@/lib/auth"
import { listBrands } from "@/lib/brands"
import { listChannels } from "@/lib/channels"

export const metadata: Metadata = {
  title: "Channels",
}

/**
 * Configuration → Channels — decided 2026-11-02. One link per channel and
 * brand, so every link is written the same way. The Owner only, via
 * middleware's `OWNER_ONLY`; the backend refuses anybody else too.
 */
export default async function ChannelsPage() {
  await requireUser()

  const [channels, brands] = await Promise.all([listChannels(), listBrands()])
  if (!channels.ok && channels.error.status === 403) forbidden()

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3">
      <PageHeader
        title="Channels"
        description="Where your leads come from. Use these links so each lead gets its channel."
      />

      {channels.ok ? (
        <ChannelsPanel
          channels={channels.data}
          brands={brands.ok ? brands.data.filter((brand) => brand.active) : []}
        />
      ) : (
        <div className="flex max-w-md flex-col items-center gap-2 self-center rounded-md border bg-card p-8 text-center">
          <ShieldAlert className="size-5 text-warning" aria-hidden />
          <p className="text-sm font-medium">The channels couldn&apos;t be loaded</p>
          <p className="text-xs text-muted-foreground">{channels.error.message}</p>
        </div>
      )}
    </div>
  )
}
