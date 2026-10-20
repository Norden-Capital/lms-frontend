"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { InboxPulse } from "@/lib/mailTypes"

/**
 * Asks the inbox every `everyMs` how many emails are unread and whether a new
 * one arrived — decided 2026-10-20. Skips while the tab is hidden, and asks
 * again as soon as it is shown. `onChange` runs when the answer moves.
 */
function usePulse(everyMs: number, onChange?: (pulse: InboxPulse, before: InboxPulse | null) => void) {
  const [pulse, setPulse] = useState<InboxPulse | null>(null)
  const last = useRef<InboxPulse | null>(null)
  const changed = useRef(onChange)

  useEffect(() => {
    changed.current = onChange
  }, [onChange])

  const check = useCallback(async () => {
    if (document.visibilityState === "hidden") return
    try {
      const response = await fetch("/api/inbox/pulse", { cache: "no-store" })
      if (!response.ok) return
      const next = (await response.json()) as InboxPulse
      const before = last.current
      last.current = next
      setPulse(next)
      if (before && (before.unread !== next.unread || before.latest !== next.latest)) {
        changed.current?.(next, before)
      }
    } catch {
      // Offline for a moment: the next check will try again.
    }
  }, [])

  useEffect(() => {
    // The first check runs straight away, outside this effect's own turn.
    const first = window.setTimeout(check, 0)
    const timer = window.setInterval(check, everyMs)
    const onVisible = () => document.visibilityState === "visible" && check()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [check, everyMs])

  return { pulse, check }
}

export { usePulse }
