import type { Metadata } from "next"
import Link from "next/link"
import { KeyRound, MonitorSmartphone, ShieldCheck, Smartphone } from "lucide-react"

import { ChangePasswordSheet } from "@/components/settings/changePasswordSheet"
import { FaqGroup, FaqItem } from "@/components/settings/faqItem"
import { EndOtherSessionsButton, SessionsList } from "@/components/settings/sessionsList"
import { RegenerateRecoveryCodes } from "@/components/twoFactor/regenerateRecoveryCodes"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { requireUser } from "@/lib/auth"
import { getMySessions } from "@/lib/me"

export const metadata: Metadata = {
  title: "Security",
}

/**
 * Everything about proving who you are and keeping the account yours.
 *
 * Deliberately a page rather than a folder: two-factor, recovery codes, your
 * password and your sessions all live on this one screen. Anything that runs as a
 * multi-step flow — enrolment being the first — gets its own route beneath
 * this one and returns here when it finishes.
 */
export default async function SecurityPage() {
  const [user, sessions] = await Promise.all([requireUser(), getMySessions()])
  const others = sessions.ok ? sessions.data.filter((s) => !s.current).length : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-tight">Security</h2>
        <p className="text-sm text-muted-foreground">Questions about keeping your account safe.</p>
      </div>

      {/* An FAQ — decided 2026-10-26. Every answer shown, one line each.
          Order: password, two-factor, sessions. */}
      <div className="flex w-full flex-col gap-8">
        <FaqGroup title="Password">
          <FaqItem question="How do I change my password?" icon={KeyRound} action={<ChangePasswordSheet />}>
            <p>Use your current password to set a new one. You stay signed in here only.</p>
          </FaqItem>
        </FaqGroup>

        <FaqGroup title="Two-factor">
          <FaqItem
            question="Is my account protected?"
            icon={ShieldCheck}
            action={
              user.mfaEnabled ? (
                // On, and locked — decided 2026-10-26. Two-factor is required,
                // so the switch shows the state and cannot change it. The span
                // holds the tooltip: a disabled switch takes no pointer events.
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Switch checked disabled aria-label="Two-factor is on" />
                  </TooltipTrigger>
                  <TooltipContent>Required for every account. Can&apos;t be turned off.</TooltipContent>
                </Tooltip>
              ) : (
                // Unreachable in practice: two-factor is mandatory, so an account
                // without it is sent to /two-factor before any page here loads.
                <Button size="sm" render={<Link href="/two-factor" />}>
                  Set up two-factor
                </Button>
              )
            }
          >
            {/* Status comes off requireUser(): no second request. */}
            <p>
              {user.mfaEnabled ? (
                <span>
                  Yes. Two-factor is <span className="font-medium text-success">on</span>, so you need a code from your phone to sign in.
                </span>
              ) : (
                <span>
                  No. Two-factor is <span className="font-medium text-warning">off</span>, so only your password protects you.
                </span>
              )}
            </p>
          </FaqItem>

          <FaqItem
            question="I lost my phone. How do I sign in?"
            icon={Smartphone}
            action={user.mfaEnabled && <RegenerateRecoveryCodes email={user.email} />}
          >
            <p>Use a recovery code instead. Each code works once, so make new ones after.</p>
          </FaqItem>
        </FaqGroup>

        <FaqGroup title="Sessions">
          <FaqItem
            question="Where am I signed in?"
            icon={MonitorSmartphone}
            action={<EndOtherSessionsButton disabled={others === 0} />}
          >
            <p>Every device signed in to your account. Don&apos;t know one? Sign it out.</p>
          </FaqItem>
          {/* Under the question, not in its answer column: the whole width,
              with a little room on each side — decided 2026-10-26. */}
          <div className="mx-2">
            {sessions.ok ? (
              <SessionsList sessions={sessions.data} />
            ) : (
              <p className="text-sm text-muted-foreground">Sessions could not be loaded.</p>
            )}
          </div>
        </FaqGroup>
      </div>
    </div>
  )
}
