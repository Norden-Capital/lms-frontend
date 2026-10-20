"use client"

import { createContext, useContext, useMemo } from "react"

import {
  actionColumns,
  allPermissions,
  diffFromRole,
  permissionsForRole,
  roleGrantsEverything,
} from "@/lib/access"
import type { PermissionGroup, Role } from "@/lib/userTypes"
import { OWNER } from "@/lib/roles"

/**
 * The permission model, fetched once and shared by every screen that draws it.
 *
 * <p>Six components need it — the picker, the add form, the edit-permissions
 * screen, the detail matrix, the role dialog and the list's filter panel — and
 * threading it through six prop chains would mean every page that renders any of
 * them has to know about it too.
 *
 * <p>Fetched in `app/(app)/users/layout.tsx`, which is as narrow as it can be
 * while still covering all six. Putting it in the app-wide layout would fetch it
 * on the dashboard, which has no use for it.
 *
 * <p>Read-only. Nothing in the application changes what a role grants —
 * `role_permissions` is written by migration and never by the app — so there is
 * no refetch, no invalidation and no writing back into this.
 */

type Access = {
  /** Sidebar sections and the modules under them, in menu order. */
  groups: PermissionGroup[]
  roles: Role[]

  /** Every `RESOURCE:ACTION` string that exists. */
  allPermissions: string[]
  /** Every action any module has, read first. */
  actionColumns: string[]

  permissionsForRole: (roleKey: string) => string[]
  roleGrantsEverything: (roleKey: string) => boolean
  /** The person looking is the Owner — the one who may switch administrators off. */
  viewerIsOwner: boolean
  diffFromRole: (
    roleKey: string,
    chosen: Set<string>
  ) => { granted: string[]; denied: string[] }
}

const AccessContext = createContext<Access | null>(null)

function AccessProvider({
  groups,
  roles,
  viewerRole,
  children,
}: {
  groups: PermissionGroup[]
  roles: Role[]
  /** The signed-in person's role. Decides which actions are offered, never what is allowed. */
  viewerRole: string | undefined
  children: React.ReactNode
}) {
  // Bound once so callers pass a role name and nothing else. Without this every
  // component would carry `roles` and `groups` around purely to hand them back
  // to the same three functions.
  const value = useMemo<Access>(
    () => ({
      groups,
      roles,
      allPermissions: allPermissions(groups),
      actionColumns: actionColumns(groups),
      permissionsForRole: (roleKey) => permissionsForRole(roles, roleKey),
      roleGrantsEverything: (roleKey) =>
        roleGrantsEverything(roles, roleKey, groups),
      viewerIsOwner: viewerRole === OWNER,
      diffFromRole: (roleKey, chosen) => diffFromRole(roles, roleKey, chosen),
    }),
    [groups, roles, viewerRole]
  )

  return <AccessContext value={value}>{children}</AccessContext>
}

/**
 * @throws if used outside the provider — deliberately. A silent empty catalogue
 *         would render a permission screen with no checkboxes on it, which looks
 *         like an account with nothing granted rather than a wiring mistake.
 */
function useAccess(): Access {
  const value = useContext(AccessContext)

  if (!value) {
    throw new Error(
      "useAccess must be used inside <AccessProvider> — see app/(app)/users/layout.tsx"
    )
  }

  return value
}

export { AccessProvider, useAccess }
