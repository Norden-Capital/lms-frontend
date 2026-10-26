import { Panel } from "@/components/system/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { GAP } from "@/lib/backupChart"
import { cn } from "@/lib/utils"

/**
 * The sign-in year while it loads — on a user's page and in Settings. Drawn as
 * the Backups page draws its own year, so nothing moves when it arrives.
 */

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""]

const KEYS = [
  { tone: "bg-foreground", label: "Signed in" },
  { tone: "bg-destructive", label: "Only failed tries" },
  { tone: "bg-foreground/[0.07]", label: "No sign-in" },
]

/** The sign-in year: weekdays, a grey calendar, the months, and the key. */
function SignInYearSkeleton() {
  return (
    <Panel
      title="Sign-ins"
      action={
        <span className="flex items-center gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-21" />
        </span>
      }
      className="shrink-0"
      bodyClassName="gap-0 p-3"
    >
      <div className="min-w-0 overflow-hidden py-1.5">
        <div className="mx-auto grid w-fit grid-cols-[auto_minmax(0,1fr)] gap-x-1.5">
          <div
            className={cn(
              "flex flex-col font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase",
              GAP
            )}
          >
            {WEEKDAYS.map((day, row) => (
              <span key={row} className="flex flex-1 items-center leading-none">
                {day}
              </span>
            ))}
          </div>

          {/* 53 weeks of seven squares, with the gaps between them. */}
          <Skeleton className="h-[88px] w-[686px] rounded-sm min-[1740px]:h-[91.5px] min-[1740px]:w-[712.5px]" />

          <div />

          <div className="mt-2 border-t pt-1.5">
            <Skeleton className="h-3 w-full" />
          </div>

          <div />

          <div className="mt-2 flex items-center justify-end gap-3 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
            {KEYS.map((key) => (
              <span key={key.label} className="flex items-center gap-1">
                <span className={cn("size-2 rounded-[2px] ring-1 ring-border", key.tone)} />
                {key.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

export { SignInYearSkeleton }
