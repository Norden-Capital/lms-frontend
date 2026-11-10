"use client"

import { Copy } from "lucide-react"
import { toast } from "sonner"

import { WarningBox } from "@/components/ui/warningBox"

/**
 * Two things that make a brand silently fail, in one box under the table —
 * decided 2026-10-26. Neither is something this app can check.
 */
/**
 * The Google robot's email, for when the server cannot say it (not yet
 * deployed, or Google not connected). It is not a secret — it is an address.
 */
const ROBOT_EMAIL = "lms-analytics@norden-capital-lms.iam.gserviceaccount.com"

function BrandWarnings({ robotEmail: fromServer }: { robotEmail: string | null }) {
  const robotEmail = fromServer ?? ROBOT_EMAIL

  function copy() {
    if (!robotEmail) return
    navigator.clipboard
      .writeText(robotEmail)
      .then(() => toast.success("Email copied."))
      .catch(() => toast.error("Could not copy. Select it instead."))
  }

  return (
    <WarningBox storageKey="brand-warning" title="Before a brand works">
      <ul className="mt-1 flex list-disc flex-col gap-1.5 pl-4">
        <li>
          <b>Google Analytics:</b> add this email as a <b>Viewer</b>{" "}in
          each brand&apos;s Google Analytics.
          If not, the SEO page shows nothing, even with the ID filled in.
          <button
            type="button"
            onClick={copy}
            className="mt-1.5 flex max-w-full items-center gap-1.5 rounded-sm border border-warning/30 bg-card px-2 py-1 font-mono text-[0.7rem] text-foreground transition-colors hover:bg-foreground/5"
            title="Copy"
          >
            <span className="truncate">{robotEmail}</span>
            <Copy className="size-3 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </li>
        <li>
          <b>Gmail:</b> add each brand&apos;s email in the inbox Gmail, under{" "}
          <b>Settings → Accounts → Send mail as</b>. If not, replies are sent from the Gmail address
          instead.
        </li>
      </ul>
    </WarningBox>
  )
}

export { BrandWarnings }
