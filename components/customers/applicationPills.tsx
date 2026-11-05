import { CircleCheck, CircleDot, CircleMinus, CircleX, FlaskConical } from "lucide-react"

import { cn } from "@/lib/utils"

/** Same look as the users table's pills: icon and word, no fill. */
const PILL =
  "inline-flex items-center gap-1 rounded-full border bg-card px-1.5 py-0.5 text-[0.7rem] font-medium whitespace-nowrap"

const STATUS: Record<string, { label: string; icon: typeof CircleCheck; tone: string }> = {
  LEAD: { label: "Lead", icon: CircleCheck, tone: "text-success" },
  ABANDONED: { label: "Abandoned", icon: CircleDot, tone: "text-warning" },
  RETURNED: { label: "Came back later", icon: CircleMinus, tone: "text-muted-foreground" },
  SENDING: { label: "Sending", icon: CircleDot, tone: "text-muted-foreground" },
  FAILED: { label: "Failed", icon: CircleX, tone: "text-destructive" },
}

const RESULT: Record<string, string> = {
  SOLD: "Sold",
  CPF: "CPF",
  NOT_SOLD: "Not sold",
  EXISTS: "Already applied",
  ERROR: "Error",
}

function StatusPill({ status }: { status: string }) {
  const { label, icon: Icon, tone } = STATUS[status] ?? STATUS.SENDING
  return (
    <span className={cn(PILL, tone)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  )
}

/** LeadScout's answer in plain words. Nothing back from LeadScout reads "No answer". */
function resultLabel(status: string | null): string {
  if (!status) return "No answer"
  return RESULT[status] ?? status
}

const RESULT_LOOK: Record<string, { icon: typeof CircleCheck; tone: string }> = {
  SOLD: { icon: CircleCheck, tone: "text-success" },
  CPF: { icon: CircleCheck, tone: "text-success" },
  NOT_SOLD: { icon: CircleMinus, tone: "text-muted-foreground" },
  EXISTS: { icon: CircleDot, tone: "text-warning" },
  ERROR: { icon: CircleX, tone: "text-destructive" },
}

/** LeadScout's answer as a pill, in the same style as the status. */
function ResultPill({ status }: { status: string | null }) {
  const { icon: Icon, tone } = (status && RESULT_LOOK[status]) || { icon: CircleDot, tone: "text-muted-foreground" }
  return (
    <span className={cn(PILL, tone)}>
      <Icon className="size-3" aria-hidden />
      {resultLabel(status)}
    </span>
  )
}

function TestPill() {
  return (
    <span className={cn(PILL, "text-warning")} title="Not a real lead">
      <FlaskConical className="size-3" aria-hidden />
      Test
    </span>
  )
}

export { ResultPill, StatusPill, TestPill, resultLabel }
