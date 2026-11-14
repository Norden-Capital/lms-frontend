"use client"

import { useState, useTransition } from "react"
import { CircleAlert, CircleCheck, Info } from "lucide-react"

import { setUserPermissions } from "@/app/(app)/users/actions"
import { useAccess } from "@/components/access/accessProvider"
import { PermissionPicker } from "@/components/users/permissionPicker"
import { TopBanner } from "@/components/ui/topBanner"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { normalGroups } from "@/lib/access"
import { OWNER } from "@/lib/roles"
import type { PermissionGroup, UserDetail } from "@/lib/userTypes"
import { cn } from "@/lib/utils"

/**
 * One person's permissions, as a thing you can change.
 *
 * <p>The same picker the add-user form uses, on the same theory: what gets
 * stored is not a copy of every permission somebody holds, it is the
 * <em>difference</em> from what their role already grants. Ticking a box a
 * Member does not have is a grant; clearing one an Administrator does have is a
 * deny. Sending the whole set instead would freeze their access in place the next
 * time their role changed.
 *
 * <p>The Save button lives up in the page header, so this is a form with an id
 * and no visible submit of its own — a button carrying `form="…"` submits it from
 * anywhere on the page.
 */

/** Lets the Save button live up in the page header beside the title. */
const PERMISSIONS_FORM_ID = "user-permissions-form"

function UserPermissionEditor({ user }: { user: UserDetail }) {
  const access = useAccess()

  // Seeded from what they hold today, so the grid opens showing the truth and
  // "no changes" is the resting state rather than something to restore.
  const [permissions, setPermissions] = useState<Set<string>>(
    () => new Set(user.permissions)
  )

  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const { granted, denied } = access.diffFromRole(user.role, permissions)
  const changed = granted.length + denied.length

  function save(event: React.FormEvent) {
    event.preventDefault()
    setResult(null)

    start(async () => {
      const outcome = await setUserPermissions(user.id, granted, denied)

      setResult({
        ok: Boolean(outcome.ok),
        message: outcome.message ?? "Something went wrong. Please try again.",
      })
    })
  }

  // The Owner has everything and is never edited here.
  if (user.role === OWNER) {
    return <TopBanner message="The Owner has every permission." />
  }

  // An administrator (changed 2026-11-14): every normal page is shown ticked
  // and fixed — nothing can be taken away from them. Below it, the owner pages,
  // which only the Owner may give. Anybody else sees the fixed part only.
  const isAdmin = access.roleGrantsEverything(user.role)
  const canGiveOwnerPages = isAdmin && access.viewerIsOwner
  const groups = isAdmin ? (canGiveOwnerPages ? access.groups : normalGroups(access.groups)) : undefined
  const locked = isAdmin
    ? (group: PermissionGroup) => !group.modules.some((entry) => entry.ownerOnly)
    : undefined

  return (
    <form
      id={PERMISSIONS_FORM_ID}
      onSubmit={(event) => (isAdmin && !canGiveOwnerPages ? event.preventDefault() : save(event))}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2",
        THIN_SCROLLBAR
      )}
    >
      {result && (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "flex shrink-0 items-start gap-2 rounded-md border px-3 py-2 text-sm",
            result.ok
              ? "border-success/30 bg-success/5 text-success"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          )}
        >
          {result.ok ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {result.message}
        </p>
      )}

      {isAdmin && (
        <p className="flex shrink-0 items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" aria-hidden />
          {canGiveOwnerPages
            ? "Admins have every normal page. Pick what they can do on the owner pages."
            : "Admins have every normal page. Only the owner can give owner pages."}
        </p>
      )}

      {/* Said here rather than only on the button, because the button is at the
          top of the page and this is where somebody is looking while deciding. */}
      {changed > 0 && !pending && (
        <p className="shrink-0 text-xs text-muted-foreground">
          {granted.length > 0 && `${granted.length} to add`}
          {granted.length > 0 && denied.length > 0 && ", "}
          {denied.length > 0 && `${denied.length} to remove`}
          {". Not saved yet."}
        </p>
      )}

      <fieldset disabled={pending} className="contents">
        <PermissionPicker
          role={user.role}
          value={permissions}
          onChange={setPermissions}
          groups={groups}
          locked={locked}
        />
      </fieldset>
    </form>
  )
}

export { UserPermissionEditor, PERMISSIONS_FORM_ID }
