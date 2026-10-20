import Link from "next/link"
import { LogIn } from "lucide-react"

import { ErrorState } from "@/components/error/errorState"
import { Button } from "@/components/ui/button"

/**
 * Rendered when a Server Component calls `unauthorized()` — no valid session.
 * The fix is a sign-in, which is why this is the one error screen whose primary
 * action leaves the app shell.
 */
export default function Unauthorized() {
  return (
    <ErrorState
      code="401"
      icon={LogIn}
      title="Your session has ended"
      description="You were signed out. Please sign in again."
    >
      <Button size="sm" render={<Link href="/login" />}>
        Sign in again
      </Button>
    </ErrorState>
  )
}
