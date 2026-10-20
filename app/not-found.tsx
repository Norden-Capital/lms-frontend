import Link from "next/link"
import { FileQuestion, Headset } from "lucide-react"

import { ErrorState } from "@/components/error/errorState"
import { Button } from "@/components/ui/button"

/**
 * Serves both unmatched URLs and any `notFound()` call. The app has a single
 * root layout, so this composes cleanly — no need for `globalNotFound`.
 */
export default function NotFound() {
  return (
    <ErrorState
      code="404"
      icon={FileQuestion}
      title="We can't find that page"
      description="The link may be wrong, or the page was removed."
    >
      <Button variant="outline" size="sm" render={<Link href="/help-center" />}>
        <Headset data-icon="inline-start" />
        Contact IT support
      </Button>
      <Button size="sm" render={<Link href="/dashboard" />}>
        Go to dashboard
      </Button>
    </ErrorState>
  )
}
