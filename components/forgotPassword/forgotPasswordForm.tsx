"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
// FingerprintPattern, not Fingerprint: this lucide version renamed the icon and
// keeps the old name only as a back-compat alias.
import { ArrowLeft, FingerprintPattern, MailCheck } from "lucide-react"

import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/app/(auth)/forgot-password/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

/**
 * Both steps of "request a reset" live in this one component: the email form,
 * and the confirmation that replaces it. The heading and icon change between
 * them, which is why the header sits here rather than on the page.
 */
function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(
    requestPasswordReset,
    {}
  )
  // Back to the form without losing the address, for a typo.
  const [editing, setEditing] = useState(false)

  // A new answer from the server ends editing. Adjusted during render rather
  // than by wrapping the action: a wrapper is a client function, and the form
  // would stop working before JavaScript loads.
  const [answered, setAnswered] = useState(state)
  if (state !== answered) {
    setAnswered(state)
    setEditing(false)
  }

  if (state.sent && !editing) {
    return (
      <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
            <MailCheck className="size-4" aria-hidden />
          </div>
          <h1 className="font-heading text-lg font-bold tracking-tight text-balance">
            Check your email
          </h1>
          {/* "If an account exists" is deliberate. Confirming the address is
              registered would let someone enumerate staff emails — the same
              reason login answers identically for a wrong password and an
              account that does not exist. */}
          <p className="text-xs text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{state.email}</span>, a
            reset link is on its way. It works once, for 30 minutes.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {/* Sending again within a minute quietly does nothing on the
              backend, so a double click cannot flood an inbox. */}
          <form action={formAction}>
            <input type="hidden" name="email" value={state.email ?? ""} />
            <FieldDescription className="text-center">
              Didn&apos;t get it? Check your spam folder, or{" "}
              <button
                type="submit"
                disabled={pending}
                className="text-foreground underline underline-offset-4 hover:text-primary disabled:opacity-50"
              >
                {pending ? "sending…" : "send it again"}
              </button>
              .
            </FieldDescription>
          </form>
          <FieldDescription className="text-center">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Use a different email
            </button>
          </FieldDescription>
        </div>

        <BackToSignIn />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <FingerprintPattern className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight text-balance">
          Reset your password
        </h1>
        <p className="text-xs text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new one.
        </p>
      </div>

      <form action={formAction}>
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
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="m@example.com"
              // Carries the address back after "Use a different email", so a
              // typo is an edit rather than a retype.
              defaultValue={state.email ?? ""}
              required
            />
          </Field>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </FieldGroup>
      </form>

      <BackToSignIn />
    </div>
  )
}

/** Not underlined, unlike the inline links — this is navigation, not prose. */
function BackToSignIn() {
  return (
    <p className="text-center text-xs">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Back to sign in
      </Link>
    </p>
  )
}

export { ForgotPasswordForm }
