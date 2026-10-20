import { PageHeader } from "@/components/layout/pageHeader"
import { Panel } from "@/components/system/panel"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * System health while it first loads — decided 2026-10-20. The same header,
 * tabs and Server tab panels as the real page, at the same sizes, with grey
 * shapes for the figures, so nothing moves when they arrive.
 *
 * <p>Only here, on opening the page. The page then re-reads every five seconds
 * and keeps the last numbers on screen, so a poll never shows a loader.
 */

/** A labelled fact in the Server panel: icon, label, value. */
function FactSkeleton() {
  return (
    <div className="flex h-5 items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <Skeleton className="size-3.5 shrink-0" />
        <Skeleton className="h-3 w-16" />
      </span>
      <Skeleton className="h-3.5 w-24" />
    </div>
  )
}

/** A graph panel: the reading, then the line with its scale beside it. */
function UsageSkeleton({ title }: { title: string }) {
  return (
    <Panel title={title} bodyClassName="gap-3 p-3">
      <div className="flex h-7 items-center justify-between gap-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="flex flex-1 items-stretch gap-2">
        <Skeleton className="h-16 flex-1" />
        <div className="flex w-8 shrink-0 flex-col justify-between py-0.5">
          <Skeleton className="h-2.5 w-6" />
          <Skeleton className="h-2.5 w-4" />
        </div>
      </div>
    </Panel>
  )
}

export default function SystemHealthLoading() {
  return (
    <div
      className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-4 pb-3 sm:p-6 lg:overflow-hidden"
      role="status"
      aria-label="Loading"
    >
      <PageHeader
        title="System health"
        description="How the app and the server are doing."
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4" aria-hidden>
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* The four tabs, as one bar the height of the real one. */}
          <Skeleton className="h-8 w-80 shrink-0 rounded-lg" />

          <div className="min-h-0 flex-1 lg:overflow-y-auto">
            <div className="grid gap-4 lg:min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div className="flex flex-col gap-4">
                <Panel
                  title="Server"
                  action={<Skeleton className="h-3 w-12" />}
                  bodyClassName="gap-2.5"
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <FactSkeleton key={index} />
                  ))}
                  <div className="mt-1 flex flex-col gap-1 border-t pt-3">
                    {Array.from({ length: 2 }, (_, index) => (
                      <span key={index} className="flex h-4 items-center justify-between gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </span>
                    ))}
                  </div>
                </Panel>

                <Panel
                  title="Disk"
                  className="lg:flex-1"
                  bodyClassName="items-center justify-center gap-3"
                >
                  <Skeleton className="size-32 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </Panel>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <UsageSkeleton title="CPU usage" />
                  <UsageSkeleton title="RAM usage" />
                </div>

                <Panel title="Bandwidth" className="lg:flex-1" bodyClassName="gap-2 p-3">
                  <div className="flex h-4 items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="min-h-14 flex-1" />
                  <div className="flex h-[1.5625rem] items-center justify-between border-t pt-2">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="min-h-14 flex-1" />
                </Panel>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
