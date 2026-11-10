"use client"

import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import { channelLabel, type ChannelCount, type Funnel, type FunnelSteps } from "@/lib/applicationTypes"
import { count, share } from "@/lib/format"
import { cn } from "@/lib/utils"

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
    // Total stays stuck to the bottom while the channels scroll.
    <tr
      className={
        total
          ? "[&>td]:sticky [&>td]:bottom-0 [&>td]:bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] [&>td]:shadow-[inset_0_1px_0_var(--border)]"
          : // No top line on the first row: the titles above already draw one.
            "border-t first:border-t-0"
      }
    >
      <td className={total ? "px-4 py-2 font-semibold" : "px-4 py-2"}>{name}</td>
      <Cell value={steps.visitors} strong={total} />
      <Cell value={steps.step1} of={steps.step1} strong={total} />
      <Cell value={steps.step2} of={steps.step1} strong={total} />
      <Cell value={steps.step3} of={steps.step1} strong={total} />
    </tr>
  )
}

const SORT = {
  channel: (line: ChannelCount) => channelLabel(line.channel),
  visitors: (line: ChannelCount) => line.visitors,
  step1: (line: ChannelCount) => line.step1,
  step2: (line: ChannelCount) => line.step2,
  step3: (line: ChannelCount) => line.step3,
}

const COLUMNS: { key: keyof typeof SORT; label: string; right?: boolean }[] = [
  { key: "channel", label: "Source" },
  { key: "visitors", label: "Visitors", right: true },
  { key: "step1", label: "Step 1", right: true },
  { key: "step2", label: "Step 2", right: true },
  { key: "step3", label: "Step 3", right: true },
]

/**
 * The funnel per channel, sortable. Total stays last whatever the order, and at
 * the bottom: when the table is given more room, an empty row above it takes it.
 */
function ChannelFunnelTable({ funnel }: { funnel: Funnel }) {
  const { sorted, head } = useSort(funnel.channels, SORT)

  return (
    <table className="h-full w-full text-sm tabular-nums">
      <thead className="text-left text-xs text-muted-foreground">
        <tr>
          {COLUMNS.map(({ key, label, right }) => {
            const props = head(key)
            return (
              <th
                key={key}
                className={cn("px-4 py-2 font-medium", right && "text-right")}
                aria-sort={ariaSort(props.active, props.desc)}
              >
                <SortButton label={label} {...props} />
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map((line) => (
          <Line key={line.channel} name={channelLabel(line.channel)} steps={line} />
        ))}
        <tr className="h-full" aria-hidden>
          <td colSpan={COLUMNS.length} className="p-0" />
        </tr>
        <Line name="Total" steps={funnel} total />
      </tbody>
    </table>
  )
}

export { ChannelFunnelTable }
