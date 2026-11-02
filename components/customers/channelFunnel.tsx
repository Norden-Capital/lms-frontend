import { StatCard } from "@/components/stats/statCard"
import { channelLabel, type Funnel, type FunnelSteps } from "@/lib/applicationTypes"
import { count } from "@/lib/format"

const HEAD = "px-3 py-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

/** "95.3%" of step 1, or nothing to divide by. */
function share(part: number, whole: number) {
  return whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`
}

/** One number with its share of step 1 under it. */
function Cell({ value, of, strong }: { value: number; of?: number; strong?: boolean }) {
  return (
    <td className="px-4 py-2 text-right">
      <span className={strong ? "font-semibold" : "font-medium"}>{count(value)}</span>
      {of === undefined ? null : <span className="ml-1.5 text-xs text-muted-foreground">({share(value, of)})</span>}
    </td>
  )
}

function Line({ name, steps, total }: { name: string; steps: FunnelSteps; total?: boolean }) {
  return (
    <tr className={total ? "border-t bg-muted/50" : "border-t"}>
      <td className={total ? "px-4 py-2 font-semibold" : "px-4 py-2"}>{name}</td>
      <Cell value={steps.visitors} strong={total} />
      <Cell value={steps.step1} of={steps.step1} strong={total} />
      <Cell value={steps.step2} of={steps.step1} strong={total} />
      <Cell value={steps.step3} of={steps.step1} strong={total} />
    </tr>
  )
}

/**
 * The apply form's funnel, all channels and per channel — decided 2026-11-02.
 * Each person counts once per step, so a refresh or a second try adds nothing.
 * Shares are of step 1, as on the old system.
 */
function ChannelFunnel({ funnel }: { funnel: Funnel }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Form visitors"
          value={count(funnel.visitors)}
          hint="People who opened the form. Once per person per day."
          detail={`${share(funnel.step1, funnel.visitors)} went on to step 1`}
        />
        <StatCard
          label="Step 1"
          value={count(funnel.step1)}
          hint="People who finished step 1."
          detail="100%"
        />
        <StatCard
          label="Step 2"
          value={count(funnel.step2)}
          hint="People who sent step 2."
          detail={`${share(funnel.step2, funnel.step1)} of step 1`}
        />
        <StatCard
          label="Step 3 - Got the link"
          value={count(funnel.step3)}
          hint="People LeadScout took, who went to the link."
          detail={`${share(funnel.step3, funnel.step1)} of step 1`}
        />
      </div>

      <section className="rounded-lg border bg-muted/40 p-0.5" aria-labelledby="by-channel">
        <h2 id="by-channel" className={HEAD}>
          By channel
        </h2>
        <div className="overflow-auto rounded-md border bg-card">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 text-right font-medium">Visitors</th>
                <th className="px-4 py-2 text-right font-medium">Step 1</th>
                <th className="px-4 py-2 text-right font-medium">Step 2</th>
                <th className="px-4 py-2 text-right font-medium">Step 3</th>
              </tr>
            </thead>
            <tbody>
              {funnel.channels.map((line) => (
                <Line key={line.channel} name={channelLabel(line.channel)} steps={line} />
              ))}
              <Line name="Total" steps={funnel} total />
            </tbody>
          </table>
        </div>
        <p className="px-3 py-1.5 text-[0.7rem] text-muted-foreground">
          No tag means SEO. A person who came from two channels counts in both, but once in Total.
        </p>
      </section>
    </>
  )
}

export { ChannelFunnel }
