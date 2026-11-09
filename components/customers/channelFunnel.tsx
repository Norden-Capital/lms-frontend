import { ChannelFunnelTable } from "@/components/customers/channelFunnelTable"
import { StatCard } from "@/components/stats/statCard"
import type { Funnel } from "@/lib/applicationTypes"
import { count, share } from "@/lib/format"

const HEAD = "px-3 py-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

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
          <ChannelFunnelTable funnel={funnel} />
        </div>
        <p className="px-3 py-1.5 text-[0.7rem] text-muted-foreground">
          No tag means SEO. A person who came from two channels counts in both, but once in Total.
        </p>
      </section>
    </>
  )
}

export { ChannelFunnel }
