import { PageHeader } from "@/components/layout/pageHeader"
import { Panel } from "@/components/system/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { WarningSkeleton } from "@/components/ui/warningBox"

/**
 * Channels while they load — redone 2026-11-09 with the page: one card, the
 * channel tabs and the add box in its heading, then the links table.
 */

const HEAD = "py-2 text-left font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

export default function ChannelsLoading() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3" role="status" aria-label="Loading">
      <PageHeader
        title="Channels"
        description="Where your leads come from. Use these links so each lead gets its channel."
      />

      <Panel
        title="Channels"
        action={
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3" aria-hidden>
            <Skeleton className="h-8 w-56 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="size-7" />
            </div>
          </div>
        }
        className="flex-1"
        bodyClassName="p-0"
      >
        <table className="w-full border-collapse text-sm" aria-hidden>
          <thead>
            <tr className="border-b">
              <th className={`${HEAD} w-64 pl-4`}>Brand</th>
              <th className={HEAD}>Link</th>
              <th className={`${HEAD} pr-4 text-right`}>Copy</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }, (_, index) => (
              <tr key={index} className="border-b last:border-b-0">
                <td className="py-2.5 pl-4">
                  <span className="flex items-center gap-2.5">
                    <Skeleton className="size-6 shrink-0" />
                    <span className="flex flex-col gap-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </span>
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <Skeleton className="h-6 w-full" />
                </td>
                <td className="py-2.5 pr-4">
                  <Skeleton className="ml-auto size-7" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* The warning box under the channels, at its real height, or the bubble if it was closed. */}
      <WarningSkeleton storageKey="channel-warning" className="h-24" />
    </div>
  )
}
