"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import {
  APPEARANCE_COOKIE,
  applyAppearance,
  parseAppearanceCookie,
  sameAppearance,
  toAppearance,
  writeAppearanceCookie,
} from "@/lib/appearance"

function readCookie(): string | undefined {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${APPEARANCE_COOKIE}=`))
  return match?.slice(APPEARANCE_COOKIE.length + 1)
}

/**
 * Settings → Theme. The first frame uses the cookie; this checks it against
 * the look saved on the account (a new browser, or someone else signed in
 * here before) and fixes the page and the cookie when they differ.
 */
export function AppearanceSync({ saved }: { saved: unknown }) {
  const router = useRouter()
  const look = toAppearance(saved)
  const key = JSON.stringify(look)

  useEffect(() => {
    const wanted = toAppearance(JSON.parse(key))
    if (sameAppearance(parseAppearanceCookie(readCookie()), wanted)) return
    applyAppearance(wanted)
    writeAppearanceCookie(wanted)
    // So the server parts (like the toasts' mode) pick up the new cookie.
    router.refresh()
  }, [key, router])

  return null
}
