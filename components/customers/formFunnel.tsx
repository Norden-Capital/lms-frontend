"use client"

import { FunnelChart } from "@/components/charts/funnelChart"
import { PatternLines } from "@/components/charts/patterns"
import type { FunnelSteps } from "@/lib/applicationTypes"
import { count } from "@/lib/format"

/**
 * The apply form's funnel as a chart — Bklit's funnel, added 2026-11-09. Each
 * person counts once per step, so a refresh or a second try adds nothing. The
 * percentages are of the form's visitors.
 *
 * 2026-11-10: filled with fine diagonal stripes. It fills its box's height, so
 * the page decides how tall it is (a card and a half, beside the count cards).
 */
function FormFunnel({ funnel }: { funnel: FunnelSteps }) {
  if (funnel.visitors === 0 && funnel.step1 === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No one opened the form in this period.
      </p>
    )
  }

  const stages = [
    { label: "Visitors", value: funnel.visitors },
    { label: "Step 1", value: funnel.step1 },
    { label: "Step 2", value: funnel.step2 },
    { label: "Got the link", value: funnel.step3 },
  ].map((stage, index) => ({
    ...stage,
    displayValue: count(stage.value),
    // One colour per step on the other palettes; one grey on Norden.
    color: `var(--viz-${index + 1}, var(--viz-soft))`,
  }))

  return (
    <FunnelChart
      data={stages}
      color="var(--viz-soft)"
      layers={3}
      renderPattern={(id, color) => (
        <PatternLines
          id={id}
          width={6}
          height={6}
          stroke="color-mix(in oklab, var(--card) 35%, transparent)"
          strokeWidth={1}
          background={color}
          orientation={["diagonal"]}
        />
      )}
      formatPercentage={(percent) => (percent > 0 && percent < 1 ? "<1%" : `${Math.round(percent)}%`)}
      className="w-full"
      style={{ aspectRatio: "auto", height: "100%" }}
    />
  )
}

export { FormFunnel }
