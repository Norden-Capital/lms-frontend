"use client"

import { useActionState, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import type { SetPasswordState } from "@/lib/setPasswordState"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

/**
 * Choosing a password from an emailed link — the first one from an invitation,
 * or a new one from a reset. The two differ only in which action they submit to
 * and what the button says.
 *
 * <p>The email is shown read-only so the person can see which account they are
 * setting up, and so a password manager files the new password under it.
 */
function SetPasswordForm({
  action,
  token,
  email,
  submitLabel,
  pendingLabel,
}: {
  action: (state: SetPasswordState, formData: FormData) => Promise<SetPasswordState>
  token: string
  email: string
  submitLabel: string
  pendingLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const [show, setShow] = useState(false)

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />

      <FieldGroup className="gap-3">
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
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="username" type="email" autoComplete="username" value={email} readOnly disabled />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="pr-8"
              minLength={8}
              maxLength={100}
              required
              aria-invalid={Boolean(state.fieldErrors?.password)}
            />
            {/* type="button" is load-bearing — without it this submits the form. */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShow(!show)}
              className="absolute inset-y-0 right-0 h-full w-8 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              <span className="sr-only">{show ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {state.fieldErrors?.password ? (
            <FieldError>{state.fieldErrors.password}</FieldError>
          ) : (
            <FieldDescription>A long phrase is easier to remember and harder to guess.</FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
          <Input
            id="confirm"
            name="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Type it again"
            required
            aria-invalid={Boolean(state.fieldErrors?.confirm)}
          />
          {state.fieldErrors?.confirm ? <FieldError>{state.fieldErrors.confirm}</FieldError> : null}
        </Field>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  )
}

export { SetPasswordForm }
