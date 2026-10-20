import type { Metadata } from "next"
import Link from "next/link"
import { KeyRound, MailX } from "lucide-react"

import { resetPassword } from "@/app/(auth)/reset-password/actions"
import { BackToSignIn, LinkHeader } from "@/components/setPassword/linkHeader"
import { SetPasswordForm } from "@/components/setPassword/setPasswordForm"
import { apiFetch } from "@/lib/api"

export const metadata: Metadata = {
  title: "Choose a new password",
}

type LinkInfo = { email: string; firstName: string; expiresAt: string }

/**
 * Where the reset email lands. Checked before the form is shown, like the
 * invitation page. Public for the same reason: opening a reset link while signed
 * in on this browser should still work.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const token = (await searchParams).token ?? ""

  const result = token
    ? await apiFetch<LinkInfo>("/api/auth/password/reset/check", {
        method: "POST",
        body: JSON.stringify({ token }),
      })
    : null

  if (!result?.ok) {
    return (
      <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
        <LinkHeader icon={MailX} title="This reset link can't be used">
          {result && !result.ok && result.error.status !== 400
            ? "We couldn't check your link. Please try again soon."
            : "It is old or already used. Please ask for a new one."}
        </LinkHeader>
        <Link
          href="/forgot-password"
          className="text-center text-xs text-foreground underline underline-offset-4"
        >
          Send me a new link
        </Link>
        <BackToSignIn />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <LinkHeader icon={KeyRound} title="Choose a new password">
        You will still need your authenticator app to sign in.
      </LinkHeader>

      <SetPasswordForm
        action={resetPassword}
        token={token}
        email={result.data.email}
        submitLabel="Save new password"
        pendingLabel="Saving…"
      />

      <BackToSignIn />
    </div>
  )
}
