import { PageHeader } from "@/components/layout/pageHeader"
import { SettingsAside } from "@/components/settings/settingsAside"
import { requireUser } from "@/lib/auth"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * Settings, shaped like a user's details page — decided 2026-10-26. Your
 * account and the menu on the left, the page you picked on the right. The left stays
 * put while you move between pages.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden p-6 pb-3">
      <PageHeader title="Settings" />

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto lg:flex-row lg:gap-0 lg:overflow-hidden">
        {/* On the left — decided 2026-10-26 (it sat on the right for a while). */}
        <SettingsAside user={user} />

        <div
          className={cn(
            // overflow-x-hidden: scrolling one way makes the browser allow the
            // other, and a control touching the right edge showed a sideways
            // bar. These pages only ever scroll down. pr-4: room between the
            // content and the scrollbar.
            "flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:overflow-x-hidden lg:overflow-y-auto lg:pr-4 lg:pl-6",
            THIN_SCROLLBAR
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
