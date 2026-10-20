import { PermissionPickerSkeleton } from "@/components/users/usersLoading"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Changing one person's permissions, while it loads — decided 2026-10-20. The
 * same header and the same picker, with the real sections and modules (already
 * loaded by the users layout) and grey boxes for the ticks, so nothing moves
 * when the person's permissions arrive.
 *
 * <p>The header is drawn here rather than with PageHeader: its back button
 * needs the person's id, which a loader is not given. A grey square of the
 * same size stands in for it.
 */
export default function UserPermissionsLoading() {
  return (
    <div
      className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-6 pb-3"
      role="status"
      aria-label="Loading"
    >
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5" />
            <h1 className="font-heading text-lg font-semibold tracking-tight">
              Change permissions
            </h1>
          </div>
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pr-2">
        <PermissionPickerSkeleton />
      </div>
    </div>
  )
}
