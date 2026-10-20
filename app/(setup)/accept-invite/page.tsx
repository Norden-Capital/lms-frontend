import type { Metadata } from "next"
import Link from "next/link"
import { MailX, UserRoundPlus } from "lucide-react"

import { acceptInvitation } from "@/app/(setup)/accept-invite/actions"
import { BackToSignIn, LinkHeader } from "@/components/setPassword/linkHeader"
import { SetPasswordForm } from "@/components/setPassword/setPasswordForm"
import { apiFetch } from "@/lib/api"

export const metadata: Metadata = {
  title: "Set up your account",
}

type LinkInfo = { email: string; firstName: string; expiresAt: string }

/**
 * Where the invitation email lands. The link is checked before the form is
 * shown, so somebody with an old link learns that now — not after typing a
 * password twice.
 *
 * <p>Public rather than signed-out only: an administrator who is signed in and
 * opens a test invitation should see this page, not be bounced to the dashboard.
 */
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const token = (await searchParams).token ?? ""

  const result = token
    ? await apiFetch<LinkInfo>("/api/auth/invitation/check", {
        method: "POST",
        body: JSON.stringify({ token }),
      })
    : null

  if (!result?.ok) {
    return (
      <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
        <LinkHeader icon={MailX} title="This invitation can't be used">
          {result && !result.ok && result.error.status !== 400
            ? "We couldn't check your invitation. Please try again soon."
            : "It is old or already used. Ask an admin for a new one."}
        </LinkHeader>
        <p className="text-center text-xs text-muted-foreground">
          Already set up your account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
        <BackToSignIn />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <LinkHeader icon={UserRoundPlus} title={`Welcome, ${result.data.firstName}`}>
        Choose a password. Next, you will set up two-factor sign-in.
      </LinkHeader>

      <SetPasswordForm
        action={acceptInvitation}
        token={token}
        email={result.data.email}
        submitLabel="Create my account"
        pendingLabel="Setting up…"
      />
    </div>
  )
}
