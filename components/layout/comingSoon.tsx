import Link from "next/link"
import { LayoutDashboard } from "lucide-react"

import { ErrorState } from "@/components/error/errorState"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * A page that is planned but not built yet — decided 2026-10-20.
 *
 * <p>The error pages' layout, with "Coming soon" where the code goes, so an
 * empty screen says what it is rather than looking broken. Fills whatever area
 * it is put in, not the whole window, so it sits inside the app's frame.
 */
function ComingSoon({
  icon,
  title,
  description,
  showDashboardLink = true,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  /** What this page will be — "Email overview". */
  title: string
  description?: string
  /** Off on the dashboard itself, where the link would go nowhere. */
  showDashboardLink?: boolean
  className?: string
}) {
  return (
    <ErrorState
      code="COMING SOON"
      icon={icon}
      title={title}
      description={description ?? "This page is on its way. Check back soon."}
      className={cn("min-h-0 flex-1", className)}
    >
      {showDashboardLink ? (
        <Button size="sm" variant="outline" render={<Link href="/dashboard" />}>
          <LayoutDashboard data-icon="inline-start" />
          Go to dashboard
        </Button>
      ) : null}
    </ErrorState>
  )
}

export { ComingSoon }
