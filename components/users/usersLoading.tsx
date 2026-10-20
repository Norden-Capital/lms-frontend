"use client"

import { Fragment, createContext, useContext, useTransition } from "react"
import { useRouter } from "next/navigation"

import { useAccess } from "@/components/access/accessProvider"
import { Skeleton } from "@/components/ui/skeleton"
import { grantableGroups } from "@/lib/access"

/**
 * The user screens' loaders — decided 2026-10-20. Grey shapes the size of the
 * real content, so nothing moves when it arrives.
 *
 * <p>On the list, the filter button and the table each change the address
 * (?role=, ?search=, ?page=…), and Next keeps the old list up while the new one
 * loads. They sit in different places on the page, so this tracks that wait for
 * both, and the table lays its grey rows over its own rows while it lasts.
 */

const UsersLoading = createContext<{
  navigate: (url: string) => void
  loading: boolean
}>({
  navigate: () => {},
  loading: false,
})

function UsersLoadingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, start] = useTransition()

  function navigate(url: string) {
    start(() => router.push(url, { scroll: false }))
  }

  return (
    <UsersLoading.Provider value={{ navigate, loading }}>
      {children}
    </UsersLoading.Provider>
  )
}

function useUsersLoading() {
  return useContext(UsersLoading)
}

/**
 * Rows of the user list, the height of real ones: a tick box, ID, names,
 * email, role, two badges, joined, and the row menu.
 */
function UserRowsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex flex-col" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-[2.8125rem] items-center gap-6 border-b pr-4 pl-4">
          <Skeleton className="size-4 shrink-0 rounded-[4px]" />
          <Skeleton className="h-3 w-12 shrink-0" />
          <Skeleton className="h-3.5 w-20 shrink-0" />
          <Skeleton className="h-3.5 w-24 shrink-0" />
          <Skeleton className="h-3.5 min-w-0 flex-1 max-w-56" />
          <Skeleton className="h-3 w-14 shrink-0" />
          <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-20 shrink-0" />
          <Skeleton className="ml-auto size-7 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/**
 * The permission matrix on a user's page: the real modules and action columns
 * from the catalogue, with grey marks where the ticks will be.
 */
function PermissionMatrixSkeleton() {
  const { actionColumns, groups } = useAccess()

  return (
    <table className="w-full min-w-[32rem] border-collapse text-sm" aria-hidden>
      <thead className="sticky top-0 z-10 bg-background">
        <tr className="border-b">
          <th className="py-2 pr-4 text-left font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
            Module
          </th>
          {actionColumns.map((action) => (
            <th
              key={action}
              className="px-2 py-2 text-center font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"
            >
              {action}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <Fragment key={group.key}>
            <tr className="border-b bg-muted/40">
              <td
                colSpan={actionColumns.length + 1}
                className="py-1.5 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"
              >
                {group.label}
              </td>
            </tr>
            {group.modules.map((resource) => (
              <tr key={resource.key} className="border-b last:border-b-0">
                <td className="py-2.5 pr-4 pl-3">
                  <span className="font-medium">{resource.label}</span>
                </td>
                {actionColumns.map((action) => (
                  <td key={action} className="px-2 py-2.5 text-center">
                    <span className="inline-flex align-middle">
                      <Skeleton className="size-4" />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}

/**
 * The permission picker for a member: each section and module from the
 * catalogue, with grey boxes where the ticks will be.
 */
function PermissionPickerSkeleton() {
  const { groups } = useAccess()

  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex h-4 items-center">
        <Skeleton className="h-3 w-28" />
      </div>

      {grantableGroups(groups, false).map((group) => (
        <section key={group.key} className="flex flex-col rounded-md border bg-muted/40 p-0.5">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <h3 className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
              {group.label}
            </h3>
            <Skeleton className="h-6 w-20" />
          </div>

          <div className="flex flex-col gap-0.5">
            {group.modules.map((resource) => (
              <div
                key={resource.key}
                className="flex flex-col gap-2 rounded-sm border bg-card px-3 py-2.5"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{resource.label}</span>
                  <span className="text-xs text-muted-foreground">{resource.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3 lg:grid-cols-5">
                  {resource.actions.map((action) => (
                    <span key={action} className="flex h-8 items-center gap-2.5 px-2">
                      <Skeleton className="size-4 shrink-0 rounded-[4px]" />
                      <Skeleton className="h-3.5 w-14" />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export {
  UsersLoadingProvider,
  useUsersLoading,
  UserRowsSkeleton,
  PermissionMatrixSkeleton,
  PermissionPickerSkeleton,
}
