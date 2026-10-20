import { PageHeader } from "@/components/layout/pageHeader"
import { PermissionMatrixSkeleton } from "@/components/users/usersLoading"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * One person's page while it loads — decided 2026-10-20. The same header, the
 * column of facts on the left and the two panels on the right, at the same
 * sizes, with grey shapes for the values, so nothing moves when they arrive.
 * The permission grid uses the real modules, which are already loaded by the
 * users layout.
 */

/** A titled group of facts, as on the real page. */
function FactGroupSkeleton({
  title,
  facts,
  divided = false,
}: {
  title: string
  facts: number
  divided?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t pt-3",
        !divided && "first:border-t-0 first:pt-0"
      )}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: facts }, (_, index) => (
          <div key={index} className="flex h-5 items-center gap-2">
            <Skeleton className="size-3.5 shrink-0" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** A titled block in the right-hand column. */
function PanelSkeleton({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function UserDetailLoading() {
  return (
    <div
      className="flex h-full min-h-0 flex-col gap-5 overflow-hidden p-6 pb-3"
      role="status"
      aria-label="Loading"
    >
      <PageHeader
        title="User details"
        backHref="/users"
        backLabel="Back to users"
        actions={
          <div className="flex items-center gap-2" aria-hidden>
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-8 w-28" />
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-8 lg:flex-row lg:gap-0" aria-hidden>
        <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-70 lg:min-h-0 lg:overflow-hidden lg:border-r lg:pr-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4.5 w-36" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <FactGroupSkeleton title="Contact" facts={2} />
          </div>

          <div className="flex flex-col gap-3">
            <FactGroupSkeleton title="Access" facts={3} divided />
            <FactGroupSkeleton title="Account" facts={3} />
            <div className="flex flex-col gap-2 border-t pt-3">
              <h2 className="text-sm font-semibold">Quick actions</h2>
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-7 w-full" />
                ))}
                <div className="mt-0.5 border-t pt-2">
                  <Skeleton className="h-7 w-full" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:pl-6">
          <PanelSkeleton title="Permissions" className="min-h-0 flex-[1.2]">
            <div className="min-h-0 flex-1 overflow-hidden pr-2">
              <PermissionMatrixSkeleton />
            </div>
          </PanelSkeleton>

          <PanelSkeleton title="Activity" className="min-h-0 flex-[1.8]">
            <Skeleton className="h-[4.375rem] w-full" />
          </PanelSkeleton>
        </div>
      </div>
    </div>
  )
}
