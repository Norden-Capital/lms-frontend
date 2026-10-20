"use client"

import { useState, useTransition } from "react"
import { CircleAlert, KeyRound, Send, ShieldAlert, UserCog, UserX } from "lucide-react"
import { toast } from "sonner"

import {
  changeUserRole,
  changeUserStatus,
  resendInvitation,
  resetUserTwoFactor,
  sendPasswordResetLink,
} from "@/app/(app)/users/actions"
import type { ActionState } from "@/lib/actionState"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
import { useAccess } from "@/components/access/accessProvider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ADMIN, OWNER, isAssignable, isPrivileged, roleLabel } from "@/lib/roles"

/**
 * Every dialog a single account can open, behind one switch.
 *
 * <p>Both places that act on a user — the row menu in the table and the quick
 * actions on the detail page — need the same four. Holding four booleans in each
 * of them is four chances for two to be true at once; one nullable action cannot
 * be in two states.
 *
 * <p>Rendered as a sibling of whatever opened it, never inside. Choosing a menu
 * item closes the menu and unmounts its contents, so a dialog nested in there
 * vanishes in the frame it appeared.
 *
 * <p><b>The confirm button does not close the dialog.</b> `AlertDialogAction` is
 * a plain button rather than a close trigger, which is what lets each of these
 * wait for the server and then decide. Closing optimistically would throw away
 * the one thing worth reading when it fails: the backend refuses several of
 * these on purpose — the last active administrator, your own account — and those
 * sentences have nowhere to appear once the dialog is gone.
 */

/** Which dialog is open. `null` is the resting state, and there is only ever one. */
type UserAction = "role" | "twoFactor" | "password" | "deactivate" | null

/** What every dialog here needs to know about the person. */
type ActionTarget = {
  /** Needed by the callers, which link to per-person screens by id. */
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  mfaEnabled: boolean
}

/**
 * The icon-beside-title header the deactivate dialog established, with the
 * account named in the title and its email in the sentence under it — decided
 * 2026-10-19 (see {@link Email}).
 *
 * <p>The person is part of the title, not a card further down: these open from
 * a row menu, and by the time the dialog covers the table the row is behind it.
 * The first thing read should be who this is about, before anything is
 * confirmed against them.
 */
function DialogHead({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  /** The chip's background and the icon's colour, e.g. `bg-warning/10 text-warning`. */
  tone: string
  /** The action, short, like "Log out?" — the email in the sentence says who. */
  title: string
  children: React.ReactNode
}) {
  return (
    // The sign-out dialog's header, exactly — decided 2026-10-19: centred,
    // the icon in its glass chip beside the title, the sentence under both.
    // flex overrides the header's own grid, which would put the chip on its
    // own row.
    <AlertDialogHeader className="flex flex-col items-center gap-1.5 text-center">
      <div className="flex items-center gap-2">
        {/* mb-0: the media slot brings its own bottom margin, which would sit the
            chip 4px above the centre of the title beside it. */}
        <AlertDialogMedia className={cn("relative mb-0 size-8 shrink-0 overflow-hidden", tone)}>
          <LiquidGlassLayers />
          {/* relative so it paints above the glass layers, and sized explicitly
              to opt out of the media slot's size-6 default. */}
          <Icon className="relative size-4" />
        </AlertDialogMedia>
        <AlertDialogTitle>{title}</AlertDialogTitle>
      </div>
      <AlertDialogDescription>{children}</AlertDialogDescription>
    </AlertDialogHeader>
  )
}

/**
 * Whatever the server said when it refused.
 *
 * <p>Passed through unchanged. "This is the last active administrator. Promote
 * somebody else first." is the entire value of the request having failed, and
 * replacing it with "Something went wrong" throws away the only part anybody
 * needed.
 */
function Refusal({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p
      role="alert"
      aria-live="polite"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
    >
      <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

/**
 * Runs one action, keeps whatever it refused with, and closes only on success.
 *
 * <p>Shared by all four so the failure path cannot drift between them — it would
 * be easy for one dialog to close on an error and quietly discard the reason.
 */
function useAction(onDone: () => void) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | undefined>()

  const run = (action: () => Promise<ActionState>) => {
    setError(undefined)
    start(async () => {
      const result = await action()
      if (result?.ok) onDone()
      else setError(result?.message ?? "Something went wrong. Please try again.")
    })
  }

  return { pending, error, setError, run }
}

/**
 * Moving somebody between roles.
 *
 * <p>A choice rather than a confirmation, so the roles are in the dialog instead
 * of a sentence asking "are you sure". The consequence of each is spelled out
 * where the choice is made — by the time you have clicked through to a
 * confirmation screen it is too late to be told what you picked.
 */
function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ActionTarget
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { roles } = useAccess()
  const [role, setRole] = useState(user.role)
  const { pending, error, setError, run } = useAction(() => onOpenChange(false))

  // Reopening after a cancel should not offer the abandoned choice as though it
  // had been made. Watched on `open` rather than reset in the cancel handler,
  // because a dialog also closes by Escape and by a click outside.
  //
  // Adjusted during render rather than in an effect. React's own advice: an
  // effect would paint the stale choice once and then correct it, and this way
  // there is no frame where the dialog shows the wrong role.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setRole(user.role)
      setError(undefined)
    }
  }

  const changed = role !== user.role

  return (
    <AlertDialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <AlertDialogContent size="sm">
        <DialogHead
          icon={UserCog}
          tone="bg-muted text-foreground"
          title="Change role"
        >
          <Email address={user.email} />{" "}will be signed out, and any permission
          set just for them is cleared.
        </DialogHead>

        {/* A dropdown — decided 2026-10-19 — instead of a card per role. */}
        <Select
          value={role}
          onValueChange={(value) => {
            if (value) setRole(value)
          }}
          disabled={pending}
        >
          <SelectTrigger className="w-full" aria-label="Role">
            {/* Without a formatter this renders the raw value, ADMIN. */}
            <SelectValue>
              {(value: string | null) => (value ? roleLabel(value) : "Choose a role")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {roles
              .filter((option) => isAssignable(option.name))
              .map((option) => (
                <SelectItem key={option.name} value={option.name}>
                  {/* One baseline for both: "Current" is smaller, and centred
                      on its own it sits higher than the role beside it. */}
                  <span className="flex items-baseline gap-2">
                    {roleLabel(option.name)}
                    {/* Which one they are on now, so "no change" is visible. */}
                    {option.name === user.role && (
                      <span className="text-xs text-muted-foreground">Current</span>
                    )}
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          {/* Nothing to save when nothing changed — a live button that does
              nothing teaches people the button does nothing. */}
          <AlertDialogAction
            disabled={!changed || pending}
            onClick={() => run(() => changeUserRole(user.id, role))}
          >
            {pending ? "Changing…" : "Change role"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Clearing somebody's second factor so they can enrol again.
 *
 * <p>The copy leads with the lockout rather than the reset, because that is the
 * part people get wrong. Two-factor is mandatory here: clearing it does not put
 * the account back to a password-only state, it puts the account into an
 * enrolment it cannot skip and cannot pass until it reaches a new authenticator.
 * Doing this to somebody who has lost their phone helps; doing it to somebody
 * who has not is an outage for them.
 */
function ResetTwoFactorDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ActionTarget
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { pending, error, run } = useAction(() => onOpenChange(false))

  return (
    <AlertDialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <AlertDialogContent size="sm">
        <DialogHead
          icon={ShieldAlert}
          tone="bg-warning/10 text-warning"
          title="Reset two-factor?"
        >
          {user.mfaEnabled ? (
            <>
              The authenticator app and recovery codes for{" "}
              <Email address={user.email} />{" "}stop working now. They set up a new
              one the next time they sign in.
            </>
          ) : (
            <>
              <Email address={user.email} />{" "}hasn&apos;t set up two-factor yet,
              so there is nothing to reset.
            </>
          )}
        </DialogHead>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!user.mfaEnabled || pending}
            onClick={() => run(() => resetUserTwoFactor(user.id))}
          >
            {pending ? "Resetting…" : "Reset two-factor"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Getting somebody back in by email: a password reset link for an active
 * account, or the invitation again for somebody who has not joined yet.
 *
 * <p>One dialog for both, because they answer the same question — "this person
 * can't get in" — and which one applies is decided by the account, not by the
 * administrator. Either way the administrator never sees a password.
 */
function EmailLinkDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ActionTarget
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const invited = isInvited(user)
  const { pending, error, setError, run } = useAction(() => onOpenChange(false))

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setError(undefined)
  }

  const send = () =>
    run(async () => {
      const result = invited
        ? await resendInvitation(user.id)
        : await sendPasswordResetLink(user.id)
      // The dialog closes on success, so the confirmation goes to a toast —
      // otherwise "sent to sarah@…" would vanish with it.
      if (result.ok && result.message) toast.success(result.message)
      return result
    })

  return (
    <AlertDialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <AlertDialogContent size="sm">
        <DialogHead
          icon={invited ? Send : KeyRound}
          tone="bg-muted text-foreground"
          title={invited ? "Resend invitation?" : "Send reset link?"}
        >
          {invited ? (
            <>
              A new invitation goes to <Email address={user.email} />, and the
              old link stops working.
            </>
          ) : (
            <>
              We&apos;ll send a link to <Email address={user.email} />{" "}to choose
              a new password. It works for 30 minutes.
            </>
          )}
        </DialogHead>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={send}>
            {pending ? "Sending…" : invited ? "Resend invitation" : "Send reset link"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Who may act on whose account — decided 2026-10-19, and enforced by the
 * backend: administrators manage members, only the Owner manages
 * administrators, and nobody but the Owner touches the Owner's account.
 *
 * <p>Covers editing details, reset links, two-factor resets and switching an
 * account off or on. Buttons are left out rather than disabled, so nothing
 * invites a click the backend would refuse.
 */
function canManage(user: { role: string }, viewerIsOwner: boolean) {
  if (user.role === OWNER) return false
  if (user.role === ADMIN) return viewerIsOwner
  return true
}

/**
 * Changing a role always involves the administrator role — promoting to it or
 * demoting from it — so it is the Owner's alone. The Owner's own role never
 * changes.
 */
function canChangeRole(user: { role: string }, viewerIsOwner: boolean) {
  return viewerIsOwner && user.role !== OWNER
}

/**
 * Per-person permission exceptions exist for members only: an administrator or
 * the Owner already holds everything.
 */
function canChangePermissions(user: { role: string }) {
  return !isPrivileged(user.role)
}

/**
 * The address, inside the sentence that says what happens to it. Two people
 * can share a name but never an address, so every dialog says which one —
 * slightly darker than the sentence around it, so it can be found at a glance.
 *
 * <p>break-words, not break-all: the address moves to the next line whole, and
 * is only split if it is longer than a line on its own. Callers put an explicit
 * {" "} after it, so the space survives however the sentence is wrapped.
 */
function Email({ address }: { address: string }) {
  return <span className="font-medium break-words text-foreground">{address}</span>
}

/** Invited and not yet joined — they have no password to reset. */
function isInvited(user: { status: string }) {
  return user.status === "PENDING_VERIFICATION"
}

/**
 * Switching an account off, or back on.
 *
 * <p>One dialog for both directions, because they are the same decision read
 * from opposite ends and a separate "reactivate" dialog would duplicate every
 * sentence in it.
 *
 * <p>The copy is deliberately specific about what deactivation is <em>not</em>.
 * Nothing is deleted: the row stays, the history stays, and the email address
 * stays taken so the same person can be turned back on rather than re-created as
 * a stranger. Someone reaching for this needs to know that before they hesitate
 * over a button labelled with a word that sounds permanent.
 */
function DeactivateUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ActionTarget
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { pending, error, run } = useAction(() => onOpenChange(false))

  // An invited person is not active, but switching them "back on" is not a
  // thing — they become active by accepting. For them this cancels the invite.
  const invited = isInvited(user)
  const reactivating = user.status !== "ACTIVE" && !invited
  const next = reactivating ? "ACTIVE" : "DEACTIVATED"

  return (
    <AlertDialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <AlertDialogContent size="sm">
        <DialogHead
          icon={UserX}
          tone={reactivating ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}
          title={
            invited
              ? "Cancel invitation?"
              : reactivating
                ? "Turn account back on?"
                : "Deactivate account?"
          }
        >
          {invited ? (
            <>
              The invitation sent to <Email address={user.email} />{" "}stops
              working.
            </>
          ) : reactivating ? (
            <>
              <Email address={user.email} />{" "}can sign in again, with the same
              password and two-factor.
            </>
          ) : (
            <>
              <Email address={user.email} />{" "}can&apos;t sign in, and is signed
              out now. Nothing is deleted — you can turn the account back on
              later.
            </>
          )}
        </DialogHead>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={reactivating ? "default" : "destructive"}
            disabled={pending}
            onClick={() => run(() => changeUserStatus(user.id, next))}
          >
            {pending
              ? reactivating
                ? "Turning on…"
                : invited
                  ? "Cancelling…"
                  : "Deactivating…"
              : reactivating
                ? "Turn back on"
                : invited
                  ? "Cancel invitation"
                  : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function UserActionDialogs({
  user,
  action,
  onClose,
}: {
  user: ActionTarget
  action: UserAction
  onClose: () => void
}) {
  // Each dialog gets its own `open`, all driven off the one action. Base UI
  // needs the boolean to go true→false for the close animation to play, which a
  // conditionally-rendered dialog never gets to do.
  const close = (next: boolean) => {
    if (!next) onClose()
  }

  return (
    <>
      <ChangeRoleDialog
        user={user}
        open={action === "role"}
        onOpenChange={close}
      />
      <ResetTwoFactorDialog
        user={user}
        open={action === "twoFactor"}
        onOpenChange={close}
      />
      <EmailLinkDialog
        user={user}
        open={action === "password"}
        onOpenChange={close}
      />
      <DeactivateUserDialog
        user={user}
        open={action === "deactivate"}
        onOpenChange={close}
      />
    </>
  )
}

export {
  UserActionDialogs,
  canChangePermissions,
  canChangeRole,
  canManage,
  isInvited,
  type UserAction,
  type ActionTarget,
}
