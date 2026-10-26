import { cn } from "@/lib/utils"

/**
 * One question and its answer, always shown — the Security page as an FAQ,
 * decided 2026-10-26. Nothing opens or closes: a line between questions. The
 * icon sits in the question's row, the answer lines up under the words, and
 * any button sits at the far right, level with the question.
 */
function FaqItem({
  question,
  icon: Icon,
  action,
  children,
}: {
  question: string
  icon?: React.ComponentType<{ className?: string }>
  /** At the far right — a button, or whatever it turns into once clicked. */
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-b py-4 first:pt-0 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
          {question}
        </h3>
        <div className={cn("flex flex-col gap-3 text-sm text-muted-foreground", Icon && "pl-6")}>
          {children}
        </div>
      </div>
      {action && <div className="flex shrink-0 justify-end sm:max-w-sm">{action}</div>}
    </section>
  )
}

/**
 * A titled set of questions — decided 2026-10-26: Two-factor, Password,
 * Sessions. The title is small and grey, like the column headings in tables.
 */
function FaqGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

export { FaqItem, FaqGroup }
