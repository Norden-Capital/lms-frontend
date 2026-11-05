"use client"

import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import { channelLabel, type ChannelCount, type Funnel, type FunnelSteps } from "@/lib/applicationTypes"
import { count } from "@/lib/format"
import { cn } from "@/lib/utils"

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

/** The funnel per channel, sortable. Total stays last whatever the order. */
function ChannelFunnelTable({ funnel }: { funnel: Funnel }) {
  const { sorted, head } = useSort(funnel.channels, SORT)

  return (
    <table className="w-full text-sm tabular-nums">
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
        <Line name="Total" steps={funnel} total />
      </tbody>
    </table>
  )
}

export { ChannelFunnelTable, share }
