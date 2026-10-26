"use client"

import { useActionState, useState } from "react"
import { Lock, Mail, Phone, Save, SquarePen, UserRound } from "lucide-react"
import { toast } from "sonner"

import { updateMyDetails } from "@/app/(app)/settings/dashboard/actions"
import { Panel } from "@/components/system/panel"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { HintedLabel } from "@/components/ui/hint"
import { Input } from "@/components/ui/input"
import { IDLE, type ActionState } from "@/lib/actionState"
import type { SessionUser } from "@/lib/auth"
import { OWNER, roleLabel } from "@/lib/roles"
import { STATUS_TEXT } from "@/lib/userStatusText"

/**
 * The two boxes under the sign-in year on My dashboard — decided 2026-10-26.
 * The bigger one holds what you can change; the smaller one what you cannot.
 */

const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Toronto",
})
const DAY_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Toronto",
})

/**
 * Your name and phone. Plain text until you press Edit — decided 2026-10-26 —
 * then boxes, with Cancel and Save where Edit was. The email is shown, never
 * editable.
 */
function MyDetailsForm({ user }: { user: SessionUser }) {
  const [editing, setEditing] = useState(false)
  // Saved: say so and go back to plain text. Refused: say why, keep editing.
  // Done in the action itself rather than an effect, so it happens once.
  const [state, formAction, pending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const result = await updateMyDetails(previous, formData)
      if (result.ok) {
        toast.success(result.message ?? "Details saved.")
        setEditing(false)
      } else if (result.message) {
        toast.error(result.message)
      }
      return result
    },
    IDLE
  )

  // The Owner was made at setup and its details are fixed — decided
  // 2026-10-26. The server refuses it too; this only hides the button.
  const fixed = user.role === OWNER

  const fields = [
    { name: "firstName", label: "First name", icon: UserRound, value: user.firstName, placeholder: "Enter your first name", required: true },
    { name: "lastName", label: "Last name", icon: UserRound, value: user.lastName, placeholder: "Enter your last name", required: true },
    { name: "phone", label: "Phone", icon: Phone, value: user.phone ?? "", placeholder: "Enter your phone (optional)", required: false },
  ]

  return (
    <Panel
      title="Your details"
      hint={
        fixed ? (
          <>This account was made when the app was set up. Its details can&apos;t be changed.</>
        ) : (
          <>What you can change. Your email can&apos;t be changed.</>
        )
      }
      action={
        fixed ? (
          <span className="flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
            <Lock className="size-3 shrink-0" aria-hidden />
            Fixed
          </span>
        ) : editing ? (
          <span className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md bg-card"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" form="my-details" size="sm" className="rounded-md" disabled={pending}>
              <Save data-icon="inline-start" />
              {pending ? "Saving…" : "Save"}
            </Button>
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-md bg-card"
            onClick={() => setEditing(true)}
          >
            <SquarePen data-icon="inline-start" />
            Edit
          </Button>
        )
      }
      className="shrink-0"
    >
      {editing ? (
        <form id="my-details" action={formAction} className="grid gap-3 sm:grid-cols-2">
          {fields.map((field, index) => (
            <Field key={field.name}>
              <FieldLabel htmlFor={`me-${field.name}`} className="items-center">
                <field.icon className="size-3.5 text-muted-foreground" aria-hidden />
                {field.label}
              </FieldLabel>
              <Input
                id={`me-${field.name}`}
                name={field.name}
                type={field.name === "phone" ? "tel" : "text"}
                defaultValue={field.value}
                placeholder={field.placeholder}
                required={field.required}
                maxLength={field.name === "phone" ? 20 : 100}
                autoFocus={index === 0}
                disabled={pending}
                aria-invalid={Boolean(state.fieldErrors?.[field.name])}
              />
              {state.fieldErrors?.[field.name] ? <FieldError>{state.fieldErrors[field.name]}</FieldError> : null}
            </Field>
          ))}
          <Field>
            <FieldLabel htmlFor="me-email" className="items-center">
              <Mail className="size-3.5 text-muted-foreground" aria-hidden />
              Email
            </FieldLabel>
            <Input id="me-email" value={user.email} readOnly disabled title="Your email can't be changed." />
          </Field>
        </form>
      ) : (
        // Plain text in the edit view's exact shape — decided 2026-10-26: the
        // same label, and each value in an invisible box the size of an input
        // (h-8, px-2.5, a clear border), so Edit and Cancel move nothing.
        <div className="grid gap-3 sm:grid-cols-2">
          {[...fields, { name: "email", label: "Email", icon: Mail, value: user.email }].map((field) => (
            <Field key={field.name}>
              <FieldLabel className="items-center">
                <field.icon className="size-3.5 text-muted-foreground" aria-hidden />
                {field.label}
              </FieldLabel>
              <span className="flex h-8 min-w-0 items-center rounded-lg border border-transparent px-2.5 text-sm font-medium">
                <span className="truncate">
                  {field.value || <span className="font-normal text-muted-foreground">Not given</span>}
                </span>
              </span>
            </Field>
          ))}
        </div>
      )}
    </Panel>
  )
}

/** What you cannot change here: who you are to the app. */
function AccountFacts({ user }: { user: SessionUser }) {
  const status = STATUS_TEXT[user.status] ?? { label: user.status, tone: "text-muted-foreground" }
  const rows = [
    { label: "ID", hint: "Your account's number in the app.", value: <span className="font-mono">{user.id}</span> },
    { label: "Role", hint: "What you can do. Only an admin can change it.", value: roleLabel(user.role) },
    { label: "Status", hint: "Only active accounts can sign in.", value: <span className={status.tone}>{status.label}</span> },
    {
      label: "Two-factor",
      hint: "Required for every account.",
      value: (
        <span className={user.mfaEnabled ? "text-success" : "text-warning"}>{user.mfaEnabled ? "On" : "Off"}</span>
      ),
    },
    { label: "Created", hint: "When your account was made.", value: user.createdAt ? DAY.format(new Date(user.createdAt)) : "—" },
    {
      label: "Last sign-in",
      hint: "Toronto time.",
      value: user.lastLoginAt ? DAY_TIME.format(new Date(user.lastLoginAt)) : "Never",
    },
  ]

  return (
    <Panel title="Account" hint={<>What you can&apos;t change here.</>} className="shrink-0" bodyClassName="gap-2.5">
      {rows.map((row) => (
        <span key={row.label} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <HintedLabel label={row.label}>{row.hint}</HintedLabel>
          <span className="truncate font-medium text-foreground tabular-nums">{row.value}</span>
        </span>
      ))}
    </Panel>
  )
}

/** Side by side on a wide screen: the details take two thirds, the facts one. */
function AccountBoxes({ user }: { user: SessionUser }) {
  return (
    <div className="grid shrink-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <MyDetailsForm user={user} />
      <AccountFacts user={user} />
    </div>
  )
}

export { AccountBoxes }
