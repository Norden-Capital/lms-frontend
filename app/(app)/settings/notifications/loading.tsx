import { Skeleton } from "@/components/ui/skeleton"

/** Notifications while it loads: its title, then two groups of grey lines. */
export default function NotificationsLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground">Choose what we email you about. All coming soon.</p>
      </div>
      <div className="flex w-full flex-col gap-8" aria-hidden>
        {[4, 2].map((count, group) => (
          <section key={group} className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <div className="flex flex-col">
              {Array.from({ length: count }, (_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 border-b py-4 first:pt-0 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                  <Skeleton className="h-5 w-36 shrink-0" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
