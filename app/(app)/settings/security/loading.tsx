import { Skeleton } from "@/components/ui/skeleton"

/** The groups and how many questions each holds — as on the real page. */
const GROUPS = [
  { title: "Password", questions: 1 },
  { title: "Two-factor", questions: 2 },
  { title: "Sessions", questions: 1 },
]

/** Security while it loads: its title, then each group's questions in grey. */
export default function SecurityLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-tight">Security</h2>
        <p className="text-sm text-muted-foreground">Questions about keeping your account safe.</p>
      </div>
      <div className="flex w-full flex-col gap-8" aria-hidden>
        {GROUPS.map((group, groupIndex) => (
          <section key={group.title} className="flex flex-col gap-3">
            <h3 className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
              {group.title}
            </h3>
            <div className="flex flex-col">
              {Array.from({ length: group.questions }, (_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 border-b py-4 first:pt-0 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                  {/* The two-factor switch, else a button with words. */}
                  <Skeleton
                    className={
                      groupIndex === 1 && index === 0 ? "h-5 w-9 shrink-0 rounded-full" : "h-7 w-40 shrink-0"
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
