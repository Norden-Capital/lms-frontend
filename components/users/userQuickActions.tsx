"use client"

import { useState } from "react"
import { Ban, KeyRound, ShieldX, UserCog } from "lucide-react"

import {
  UserActionDialogs,
  canChangeRole,
  canManage,
  isInvited,
  type ActionTarget,
  type UserAction,
} from "@/components/users/userActionDialogs"
import { useAccess } from "@/components/access/accessProvider"
import { Button } from "@/components/ui/button"
import { OWNER } from "@/lib/roles"
import { cn } from "@/lib/utils"

/**
 * The things anyone actually opens this page to do.
 *
 * <p>They live in the left column under the identity rather than behind a `…`
 * menu in the corner. A menu is right in a table, where twelve rows each need
 * their own and space is the scarce thing; on a page about one person the
 * actions are the point, and hiding them behind a click to save a strip of an
 * otherwise empty column is a poor trade.
 *
 * <p>Deactivate is last and separated. It is the only one that takes something
 * away, and a destructive action sitting flush against four routine ones gets
 * clicked by muscle memory.
 *
 * <p>Role, permissions and deactivate are left out where the backend would
 * refuse them: on your own account, and on another administrator — decided
 * 2026-10-19. Absent rather than disabled, so nothing invites a refused click.
 */

/** Full width, text at the left edge, so the list reads as a column of verbs. */
const ACTION = "w-full justify-start rounded-md bg-card"

function UserQuickActions({ user, isSelf }: { user: ActionTarget; isSelf: boolean }) {
  const [action, setAction] = useState<UserAction>(null)
  const { viewerIsOwner } = useAccess()
  // Administrators manage members; only the Owner manages administrators; and
  // on your own account the role, permission and status actions do not apply.
  const manage = isSelf || canManage(user, viewerIsOwner)
  const showRole = !isSelf && canChangeRole(user, viewerIsOwner)
  const showStatus = !isSelf && manage

  // Somebody this person may only look at. Saying why beats an empty box —
  // the backend refuses every one of these actions anyway.
  if (!manage) {
    return (
      <p className="text-xs text-muted-foreground">
        {user.role === OWNER
          ? "This is the Owner's account. Only the Owner can change it."
          : "Only the Owner can manage administrators."}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* First, because it is the least consequential thing here and the one
          people reach for most: a misspelt surname. */}
      {showRole && (
        <Button
          variant="outline"
          size="sm"
          className={ACTION}
          onClick={() => setAction("role")}
        >
          <UserCog data-icon="inline-start" />
          Change role
        </Button>
      )}


      <Button
        variant="outline"
        size="sm"
        className={ACTION}
        onClick={() => setAction("password")}
      >
        <KeyRound data-icon="inline-start" />
        {isInvited(user) ? "Resend invitation" : "Send reset link"}
      </Button>

      {/* Not on your own account: the backend refuses it, because clearing
          your own second factor without proving who you are is exactly what an
          intruder with your session would do. */}
      {!isSelf && (
        <Button
          variant="outline"
          size="sm"
          className={ACTION}
          onClick={() => setAction("twoFactor")}
        >
          <ShieldX data-icon="inline-start" />
          Reset two-factor
        </Button>
      )}

      {/* Divided off, not just placed last. */}
      {showStatus && (
      <div className="mt-0.5 border-t pt-2">
        {/* One button, both directions. An account that is already off needs a
            way back on, and a second button that is only ever live half the time
            is a row of dead controls the rest of the time. */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            ACTION,
            (user.status === "ACTIVE" || isInvited(user)) &&
              "text-destructive hover:bg-destructive/10 hover:text-destructive"
          )}
          onClick={() => setAction("deactivate")}
        >
          <Ban data-icon="inline-start" />
          {user.status === "ACTIVE"
            ? "Deactivate account"
            : isInvited(user)
              ? "Cancel invitation"
              : "Turn back on"}
        </Button>
      </div>
      )}

      <UserActionDialogs
        user={user}
        action={action}
        onClose={() => setAction(null)}
      />
    </div>
  )
}

export { UserQuickActions }
