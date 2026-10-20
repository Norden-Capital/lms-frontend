"use client"

import { useRouter } from "next/navigation"

import { usePulse } from "@/components/inbox/usePulse"

/**
 * Brings new mail in without a reload — decided 2026-10-20. Every 20 seconds
 * it asks whether anything changed in the Inbox; only when it did does the
 * page fetch the list again. Renders nothing.
 */
function InboxAutoRefresh() {
  const router = useRouter()
  usePulse(20_000, () => router.refresh())
  return null
}

export { InboxAutoRefresh }
