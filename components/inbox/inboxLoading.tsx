"use client"

import { createContext, useContext, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { LoadingCover } from "@/components/ui/loadingCover"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The inbox's loader — decided 2026-10-20. Grey shapes the size of the real
 * content, laid over the pane that is loading, so nothing moves.
 *
 * <p>Every move on the page is a change of address (?mail=, ?folder=…), and
 * Next keeps the old screen up while the new one loads. This tracks that wait
 * and says which pane it is for: opening an email loads the right pane;
 * everything else — folder, filter, search, page — loads the list.
 */

type Pane = "list" | "mail"

const InboxLoading = createContext<{
  navigate: (url: string, pane: Pane) => void
  loading: Pane | null
}>({
  navigate: () => {},
  loading: null,
})

function InboxLoadingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [pane, setPane] = useState<Pane | null>(null)

  function navigate(url: string, which: Pane) {
    setPane(which)
    start(() => router.push(url, { scroll: false }))
  }

  return (
    <InboxLoading.Provider value={{ navigate, loading: pending ? pane : null }}>
      {children}
    </InboxLoading.Provider>
  )
}

function useInboxLoading() {
  return useContext(InboxLoading)
}

/** Message rows, the same size as the real ones. */
function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex flex-col gap-1 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
          <Skeleton className="mt-1 h-3 w-3/4" />
          <Skeleton className="mt-1 h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

/** An open email: the toolbar, the sender, and the body. */
function MailSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col" aria-hidden>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="size-7" />
        ))}
        <div className="ml-auto flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="size-7" />
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-4 border-b p-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
        <Skeleton className="h-3 w-3/6" />
      </div>
    </div>
  )
}

/** The reading pane, with its own loader over it when an email is opening. */
function ReadingPane({ children }: { children: React.ReactNode }) {
  const { loading } = useInboxLoading()
  return (
    <div className="relative h-full min-h-0">
      {children}
      <LoadingCover show={loading === "mail"}>
        <MailSkeleton />
      </LoadingCover>
    </div>
  )
}

export {
  InboxLoadingProvider,
  useInboxLoading,
  ListSkeleton,
  MailSkeleton,
  ReadingPane,
}
