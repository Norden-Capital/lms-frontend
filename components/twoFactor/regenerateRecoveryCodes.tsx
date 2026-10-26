"use client"

import { useActionState, useState } from "react"
import { RefreshCw } from "lucide-react"

import {
  regenerateCodes,
  type RegenerateState,
} from "@/app/(app)/settings/security/actions"
import { RecoveryCodesPanel } from "@/components/twoFactor/recoveryCodesPanel"
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

const initialState: RegenerateState = {}

/**
 * Replaces a user's recovery codes with a fresh set.
 *
 * <p>Three states: a button, then — in a sheet from the right — a password
 * prompt, and the codes.
 * The password step is not skippable — regenerating hands out ten working ways
 * into the account, so it asks for the same proof the backend does.
 */
function RegenerateRecoveryCodes({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  // A new key each time the sheet opens, so a second visit starts at the
  // password again rather than showing the last set of codes.
  const [visit, setVisit] = useState(0)

  return (
    // In a sheet from the right — decided 2026-10-26, was inline on the page.
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) setVisit((v) => v + 1)
        setOpen(next)
      }}
    >
      {/* Icon and words — decided 2026-10-26. */}
      <SheetTrigger
        render={<Button type="button" variant="outline" size="sm" className="rounded-md bg-card" />}
      >
        <RefreshCw data-icon="inline-start" />
        Generate new codes
      </SheetTrigger>

      <SheetContent side="right">
        <SheetHeader className="pr-12">
          <SheetTitle>Generate new codes</SheetTitle>
          <SheetDescription>Your old codes stop working.</SheetDescription>
        </SheetHeader>
        <RegenerateForm key={visit} email={email} onCancel={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

/** The password step, then the new codes. Fresh on every visit (see `visit`). */
function RegenerateForm({ email, onCancel }: { email: string; onCancel: () => void }) {
  const [state, formAction, pending] = useActionState(regenerateCodes, initialState)

  if (state.recoveryCodes) {
    return (
      <div className="flex flex-col gap-3 px-4">
        <p className="text-sm font-medium">Your new codes are ready</p>
        <RecoveryCodesPanel codes={state.recoveryCodes} email={email} />
        <p className="text-sm text-muted-foreground">Your old codes no longer work.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-3 px-4">
      {state.message ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <Field>
        <FieldLabel htmlFor="regenerate-password">Current password</FieldLabel>
        <Input
          id="regenerate-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          autoFocus
          className="bg-card"
          required
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        {state.fieldErrors?.password ? <FieldError>{state.fieldErrors.password}</FieldError> : null}
      </Field>

      {/* Stacked, longest label on top. */}
      <SheetFooter className="px-0">
        <Button type="submit" disabled={pending}>
          {pending ? "Generating…" : "Generate new codes"}
        </Button>
        <Button type="button" variant="outline" className="bg-card" onClick={onCancel}>
          Cancel
        </Button>
      </SheetFooter>
    </form>
  )
}

export { RegenerateRecoveryCodes }
