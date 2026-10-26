import { Panel } from "@/components/system/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { SignInYearSkeleton } from "@/components/users/signInYearSkeleton"

/**
 * My dashboard while it loads. Your account column is the layout and stays;
 * this is the sign-in year and the two boxes under it, in grey.
 */
export default function SettingsLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6" role="status" aria-label="Loading">
      <SignInYearSkeleton />

      {/* The two boxes: details (two thirds) and account facts (one third). */}
      <div className="grid shrink-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-hidden>
        <Panel title="Your details" className="shrink-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Account" className="shrink-0" bodyClassName="gap-2.5">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex h-4 items-center justify-between gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
