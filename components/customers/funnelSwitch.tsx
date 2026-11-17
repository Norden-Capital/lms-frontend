"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { Switch } from "@/components/ui/switch"
import { FUNNEL_TRIES } from "@/lib/applicationTypes"
import { cn } from "@/lib/utils"

/**
 * "Count every try" at the end of the funnel's note (design: LMS/design/funnel-switch/v2).
 * Off: each person once per step. On: every try. Kept in the address like the other filters.
 */
function FunnelSwitch({ tries }: { tries: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startLoading] = useTransition()

  function set(on: boolean) {
    const next = new URLSearchParams(params.toString())
    if (on) next.set("view", FUNNEL_TRIES)
    else next.delete("view")
    const qs = next.toString()
    startLoading(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <label className={cn("flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap", tries && "text-foreground")}>
      Count every try
      <Switch size="sm" checked={tries} disabled={pending} onCheckedChange={set} />
    </label>
  )
}

export { FunnelSwitch }
