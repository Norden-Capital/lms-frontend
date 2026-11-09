import { PageHeader } from "@/components/layout/pageHeader"
import { Panel } from "@/components/system/panel"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Channels while they load — added 2026-11-09. The channel list on the left
 * and one channel's links on the right, as on the page.
 */
export default function ChannelsLoading() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3" role="status" aria-label="Loading">
      <PageHeader
        title="Channels"
        description="Where your leads come from. Use these links so each lead gets its channel."
      />

      <div className="grid min-h-0 gap-4 md:grid-cols-[17rem_minmax(0,1fr)]" aria-hidden>
        <Panel title="Channels" bodyClassName="gap-3 p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="size-7" />
          </div>
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-2.5 px-2.5 py-2">
                <Skeleton className="size-7 shrink-0" />
                <Skeleton className="h-3.5 flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Channel"
          action={
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="size-7" />
            </div>
          }
          bodyClassName="gap-4 p-4"
        >
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="flex flex-col divide-y rounded-md border">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap">
                <div className="flex items-center gap-2.5 sm:w-52 sm:shrink-0">
                  <Skeleton className="size-6 shrink-0" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 min-w-0 flex-1" />
                <Skeleton className="h-7 w-20 shrink-0" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
