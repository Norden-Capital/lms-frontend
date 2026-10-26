"use client"

import { useActionState, useEffect, useState } from "react"
import { KeyRound } from "lucide-react"
import { toast } from "sonner"

import { changePassword, type ChangePasswordState } from "@/app/(app)/settings/security/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/**
 * Changing your own password, in a sheet from the right — added 2026-10-26,
 * built like Generate new codes.
 */
function ChangePasswordSheet() {
  const [open, setOpen] = useState(false)
  // A new key each time it opens, so the boxes start empty.
  const [visit, setVisit] = useState(0)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) setVisit((v) => v + 1)
        setOpen(next)
      }}
    >
      <SheetTrigger
        render={<Button type="button" variant="outline" size="sm" className="rounded-md bg-card" />}
      >
        <KeyRound data-icon="inline-start" />
        Change password
      </SheetTrigger>

      <SheetContent side="right">
        <SheetHeader className="pr-12">
          <SheetTitle>Change password</SheetTitle>
          <SheetDescription>You stay signed in here only.</SheetDescription>
        </SheetHeader>
        <ChangePasswordForm key={visit} onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

const initialState: ChangePasswordState = {}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(changePassword, initialState)

  // Done: say so, and close.
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Password changed.")
      onDone()
    }
  }, [state, onDone])

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-3 px-4">
      {state.message && !state.ok ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      {[
        // Placeholders in the login page's words.
        { name: "currentPassword", label: "Current password", autoComplete: "current-password", placeholder: "Enter your password" },
        { name: "newPassword", label: "New password", autoComplete: "new-password", placeholder: "Enter your new password" },
        { name: "repeat", label: "New password again", autoComplete: "new-password", placeholder: "Enter your new password again" },
      ].map((field, index) => (
        <Field key={field.name}>
          <FieldLabel htmlFor={`password-${field.name}`}>{field.label}</FieldLabel>
          <Input
            id={`password-${field.name}`}
            name={field.name}
            type="password"
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            autoFocus={index === 0}
            className="bg-card"
            required
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.[field.name])}
          />
          {state.fieldErrors?.[field.name] ? <FieldError>{state.fieldErrors[field.name]}</FieldError> : null}
        </Field>
      ))}
      <p className="text-xs text-muted-foreground">At least 8 characters.</p>

      {/* Stacked, longest label on top. */}
      <SheetFooter className="px-0">
        <Button type="submit" disabled={pending}>
          {pending ? "Changing…" : "Change password"}
        </Button>
        <Button type="button" variant="outline" className="bg-card" onClick={onDone}>
          Cancel
        </Button>
      </SheetFooter>
    </form>
  )
}

export { ChangePasswordSheet }
