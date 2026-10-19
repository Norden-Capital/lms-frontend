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
import { cn } from "@/lib/utils"

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
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  mfaEnabled: boolean
}

/**
 * The account named inside the dialog, not only in the sentence above it.
 *
 * <p>These open from a row menu, and by the time the dialog covers the table the
 * row it came from is behind it. Without this you are confirming something
 * irreversible against a name you last read a second ago.
 */
function TargetCard({ user }: { user: ActionTarget }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border bg-muted/40 px-3 py-2 text-center">
      <span className="text-sm font-medium">
        {user.firstName} {user.lastName}
      </span>
      <span className="text-xs break-all text-muted-foreground">
        {user.email}
      </span>
    </div>
  )
}

/** The icon-beside-title header the deactivate dialog established. */
function DialogHead({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  /** Background and text for the media chip, e.g. `bg-warning/10 text-warning`. */
  tone: string
  title: string
  children: React.ReactNode
}) {
  return (
    <AlertDialogHeader className="flex flex-col items-center gap-1.5 text-center">
      <div className="flex items-center gap-2">
        <AlertDialogMedia
          className={cn("relative size-8 overflow-hidden", tone)}
        >
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
  const { roles, permissionsForRole } = useAccess()
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
  const leavingAdmin = user.role === "ADMIN" && changed

  return (
    <AlertDialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <AlertDialogContent>
        <DialogHead
          icon={UserCog}
          tone="bg-muted text-foreground"
          title="Change role"
        >
          A role sets what this account can do before any per-person exception.
        </DialogHead>

        <TargetCard user={user} />

        <div className="flex flex-col gap-2">
          {roles.map((option) => {
            const selected = option.name === role
            const count = permissionsForRole(option.name).length

            return (
              <label
                key={option.name}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors",
                  "bg-card hover:bg-muted/40",
                  selected && "border-foreground/40",
                  pending && "pointer-events-none opacity-60"
                )}
              >
                <input
                  type="radio"
                  name="role-change"
                  value={option.name}
                  checked={selected}
                  disabled={pending}
                  onChange={() => setRole(option.name)}
                  className="sr-only"
                />

                <span className="flex items-center justify-between gap-2 text-sm font-medium">
                  {option.name === "ADMIN" ? "Administrator" : "Member"}
                  {/* Says which one they are on now, so "no change" is visible
                      rather than something you work out by remembering. */}
                  {option.name === user.role && (
                    <span className="font-mono text-[0.6rem] tracking-wide text-muted-foreground uppercase">
                      Current
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
                <span className="font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                  {count === 0
                    ? "Nothing by default"
                    : `All ${count} permissions`}
                </span>
              </label>
            )
          })}
        </div>

        {/* Both consequences, said before the button rather than after. The
            second one is the surprise: changing a role signs the person out, so
            they will be asked for their password again. */}
        {changed && (
          <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
            {leavingAdmin
              ? "They lose every permission that came with being an administrator, and any exception set for them personally is cleared. They will be signed out."
              : "Any permission set for this person individually is cleared, since it was a difference from the role they are leaving. They will be signed out."}
          </p>
        )}

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
          {user.mfaEnabled
            ? "Their authenticator app stops working immediately, and they set up a new one the next time they sign in."
            : "This account has not set up two-factor yet, so there is nothing to reset."}
        </DialogHead>

        <TargetCard user={user} />

        {/* The consequence, separated from the description so it is not read as
            more reassurance.

            An account that never enrolled is already sitting in the enrolment
            screen — resetting it would change nothing, so the dialog says so
            rather than letting somebody press a button and wonder what it did. */}
        <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
          {user.mfaEnabled
            ? "Two-factor is required for everyone here, so until they finish setting it up again they cannot do anything at all — not even sign in and wait. Their old recovery codes stop working too."
            : "They are already being asked to enrol every time they sign in, and cannot do anything until they finish. If they are stuck, the problem is not their two-factor."}
        </p>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
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
          title={invited ? "Resend invitation" : "Send password reset link"}
        >
          {invited
            ? "They haven't set up their account yet. A new invitation email goes out, and the old link stops working."
            : "They get an email with a link to choose a new password. The link works once, for 30 minutes. Their two-factor stays the same."}
        </DialogHead>

        <TargetCard user={user} />

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

  const name = `${user.firstName} ${user.lastName}`
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
          tone={
            reactivating
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }
          title={
            invited
              ? "Cancel this invitation?"
              : reactivating
                ? "Turn this account back on?"
                : "Deactivate this account?"
          }
        >
          {invited
            ? `The link in ${name}'s invitation email stops working, and they won't be able to join.`
            : reactivating
              ? `${name} will be able to sign in again, with the same password and the same two-factor as before.`
              : `${name} will not be able to sign in, and any session they have open ends now. Nothing is deleted — their history stays, and the account can be switched back on later.`}
        </DialogHead>

        <TargetCard user={user} />

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

export { UserActionDialogs, isInvited, type UserAction, type ActionTarget }
