import type { Metadata } from "next"

import { AccountBoxes } from "@/components/settings/accountBoxes"
import { SignInYear } from "@/components/users/signInYear"
import { requireUser } from "@/lib/auth"
import { getMySignIns } from "@/lib/me"

export const metadata: Metadata = {
  title: "My dashboard",
}

/**
 * My dashboard — your sign-in year, then two boxes: what you can change and
 * what you can't. Only ever your own: the server takes who you are from the
 * session. (Eight fact cards sat above it on 2026-10-26 and were dropped.)
 */
export default async function MyDashboardPage() {
  const user = await requireUser()
  const signIns = await getMySignIns()

  return (
    <>
      {signIns.ok ? (
        <SignInYear
          days={signIns.data}
          thisYear={Number(
            new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric" }).format(new Date())
          )}
        />
      ) : (
        <p className="shrink-0 rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          Sign-ins could not be loaded.
        </p>
      )}
      <AccountBoxes user={user} />
    </>
  )
}
