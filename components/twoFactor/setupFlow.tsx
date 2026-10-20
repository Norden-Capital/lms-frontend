"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import {
  Check,
  Copy,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react"

import { logout } from "@/app/(app)/actions"
import {
  confirmSetup,
  startSetup,
  type ConfirmState,
  type SetupState,
} from "@/app/(setup)/two-factor/actions"
import { RecoveryCodesPanel } from "@/components/twoFactor/recoveryCodesPanel"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/inputOtp"

const initialSetupState: SetupState = {}
const initialConfirmState: ConfirmState = {}

const SLOT_CLASS = "size-10 rounded-lg border text-base"

/**
 * Enrolment, start to finish, in one component.
 *
 * <p>One component rather than a route per step, because the secret must be
 * fetched exactly once: `/2fa/setup` issues a new one on every call, so a step
 * that lived at its own URL would hand out a fresh secret on every refresh and
 * quietly break the entry the user had already scanned. Holding it in memory
 * makes that impossible.
 *
 * <p>Both actions' hooks live here so the step is derived in one place, from
 * what has actually come back, rather than tracked in a counter that can fall
 * out of step with reality.
 *
 * <p>Deliberately free of app chrome. When 2FA becomes mandatory, a user who
 * has not enrolled cannot use the sidebar (every link is forbidden until they
 * do), so this same component gets mounted on a bare `(auth)` route.
 */
function TwoFactorSetupFlow({
  email,
  alreadyEnrolled,
}: {
  email: string
  alreadyEnrolled: boolean
}) {
  const [setupState, startAction, startPending] = useActionState(
    startSetup,
    initialSetupState
  )
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmSetup,
    initialConfirmState
  )
  const [scanned, setScanned] = useState(false)

  // Checked before anything else, and that ordering is the whole point.
  // Succeeding at enrolment re-renders the page with `alreadyEnrolled` true; if
  // that were tested first, the codes would vanish at the exact moment they were
  // produced — and they exist nowhere else, ever.
  if (confirmState.recoveryCodes) {
    return <RecoveryCodesStep codes={confirmState.recoveryCodes} email={email} />
  }

  // Arrived here with 2FA already on, without going through the flow. Nothing to
  // do: /2fa/setup answers 409, so offering the button would only produce an
  // error. A dead end deserves a door, not a bounce.
  if (alreadyEnrolled) {
    return <AlreadyEnrolled />
  }

  // The code screen comes after the scan screen, not beside it — decided
  // 2026-10-19. Both live in this one component so the secret stays in memory
  // between them: going back shows the same QR code, not a new one.
  if (scanned && setupState.secret) {
    return (
      <ConfirmStep
        formAction={confirmAction}
        pending={confirmPending}
        state={confirmState}
        email={email}
        onBack={() => setScanned(false)}
      />
    )
  }

  return (
    <SetupStep
      setup={setupState}
      startSetup={startAction}
      setupPending={startPending}
      onContinue={() => setScanned(true)}
      email={email}
    />
  )
}

/** Reached only by navigating here directly with 2FA already switched on. */
function AlreadyEnrolled() {
  return (
    <Shell>
      <header className="flex flex-col gap-1">
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <ShieldCheck className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Two-factor authentication is already on
        </h1>
        <p className="text-sm text-muted-foreground">
          Nothing to set up. Signing in already asks for a code from your
          authenticator app.
        </p>
      </header>

      <div>
        <Button render={<Link href="/dashboard" />}>Continue to the app</Button>
      </div>
    </Shell>
  )
}

/* ── Setup: explanation and code entry on the left, the code to scan on the right ── */

/**
 * The first screen — decided 2026-10-19: the explanation on the left, the QR
 * code and its written-out key on the right, shown from the moment the page
 * opens. The 6-digit code is the next screen ({@link ConfirmStep}).
 *
 * <p>The secret is requested once, on arrival. A refresh asks for a new one —
 * which is fine: nothing is switched on until a code from the app is accepted,
 * and the screen always shows the secret the backend currently holds.
 */
function SetupStep({
  setup,
  startSetup,
  setupPending,
  onContinue,
  email,
}: {
  setup: SetupState
  startSetup: () => void
  setupPending: boolean
  onContinue: () => void
  email: string
}) {
  const [, startTransition] = useTransition()

  // Once per visit. The ref, not the state, is the guard: in development React
  // runs effects twice, and two requests would issue two secrets.
  const requested = useRef(false)
  useEffect(() => {
    if (requested.current) return
    requested.current = true
    startTransition(() => startSetup())
  }, [startSetup])

  const ready = Boolean(setup.secret && setup.qrCodeImage)

  // Two halves: the QR code first (left, or top when stacked), then the
  // explanation and the button — decided 2026-10-19. Grid areas rather than
  // two plain columns, so the line under everything can span both halves.
  return (
    <div className="grid w-full max-w-4xl gap-8 p-6 [grid-template-areas:'qr'_'intro'_'next'_'foot'] md:grid-cols-2 md:gap-x-12 md:[grid-template-areas:'qr_intro'_'qr_next'_'foot_foot']">
      <div className="flex flex-col gap-5 [grid-area:intro]">
        {/* States the rule before anything else. There is no Cancel on this
            screen and nothing behind it — saying so plainly is kinder than
            letting someone hunt for a way past it. */}
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <p className="text-sm text-destructive">
            <strong className="font-medium">
              Two-factor authentication is required.
            </strong>{" "}
            No action is permitted on this account until it is switched on.
          </p>
        </div>

        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Set up two-factor authentication
          </h1>
          <p className="text-sm text-muted-foreground">
            A second step when you sign in: a 6-digit code from your phone, on top
            of your password. If someone learns your password, it still is not
            enough on its own.
          </p>
        </header>

        <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">You will need an authenticator app</p>
            <p className="text-sm text-muted-foreground">
              Google Authenticator, 1Password, Authy or similar. Open it, add a
              new account, and scan the code.
            </p>
          </div>
        </div>

        {/* A recommendation for whoever has none yet, so the choice above is
            not a research project. Store links rather than a search, because
            look-alike "authenticator" apps are common. */}
        <p className="text-xs text-muted-foreground">
          Don&apos;t have one yet? We recommend{" "}
          <span className="font-medium text-foreground">Google Authenticator</span>,
          free on the{" "}
          <a
            href="https://apps.apple.com/app/google-authenticator/id388497605"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            App Store
          </a>{" "}
          and{" "}
          <a
            href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Google Play
          </a>
          .
        </p>
      </div>

      {/* self-stretch: the panel spans both rows of the right half, so it is
          exactly as tall as the text and button beside it, with the QR code
          centred inside. min-h only matters while stacked and loading. */}
      <div className="flex min-h-72 flex-col items-center justify-center gap-5 self-stretch rounded-xl border bg-muted/30 p-6 [grid-area:qr]">
        {ready ? (
          <>
            {/* White regardless of theme: a QR code needs light quiet space
                around the pattern to stay scannable, and the PNG has none. */}
            <div className="flex w-fit items-center justify-center rounded-xl border bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- a data:
                  URL from the backend. next/image cannot optimise one, and would
                  demand explicit dimensions in exchange for nothing. */}
              <img
                src={setup.qrCodeImage}
                alt="QR code containing your two-factor setup key. The same key is written out below it."
                className="size-44"
              />
            </div>

            {/* Full width of the panel: the panel centres the QR code, and left
                to that the key's box would shrink to its text. */}
            <div className="w-full">
              <SecretBlock secret={setup.secret ?? ""} />
            </div>
          </>
        ) : setup.message && !setupPending ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <ErrorBanner>{setup.message}</ErrorBanner>
            <Button
              type="button"
              variant="outline"
              onClick={() => startTransition(() => startSetup())}
            >
              Try again
            </Button>
          </div>
        ) : (
          // The shape of what is coming — the QR card, the line above the key,
          // the key's box — so nothing jumps when the real code arrives. The
          // words are for screen readers; the pulse says it to everyone else.
          <div className="flex w-full flex-col items-center gap-5" role="status">
            <span className="sr-only">Preparing your code…</span>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <Skeleton className="size-44 rounded-md" />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-4 w-3/4 bg-foreground/10" />
              <Skeleton className="h-11 w-full bg-foreground/10" />
            </div>
          </div>
        )}
      </div>

      <div className="self-start [grid-area:next]">
        <Button type="button" onClick={onContinue} disabled={!ready}>
          I&apos;ve scanned it — next
        </Button>
      </div>

      {/* Across both halves, under everything: it is about the whole screen,
          not the left column. The escape hatch, and not optional — the
          commonest reason to be stuck here is being signed in as the wrong
          account, on a shared machine or with the browser filling in the
          other address. */}
      <div className="[grid-area:foot]">
        <SignedInAs email={email} />
      </div>
    </div>
  )
}

/* ── Next: prove the scan worked ──────────────────────────────────────────── */

/**
 * The 6-digit code, on its own screen after the QR code. Back returns to the
 * same QR code — the secret is held by the flow, not fetched again.
 */
function ConfirmStep({
  formAction,
  pending,
  state,
  email,
  onBack,
}: {
  formAction: (formData: FormData) => void
  pending: boolean
  state: ConfirmState
  email: string
  onBack: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    // Narrower than the other steps: a title, six boxes and two buttons need
    // no more room than the invitation's password form.
    <div className="flex w-full max-w-sm flex-col gap-5 p-6">
      {/* Centred, decided 2026-10-19: one short task on its own screen. */}
      <header className="flex flex-col items-center gap-1 text-center">
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <Smartphone className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Enter the 6-digit code from the app
        </h1>
        <p className="text-sm text-muted-foreground">
          This is what proves the scan worked. Two-factor is switched on once it
          is accepted.
        </p>
      </header>

      <form ref={formRef} action={formAction} className="flex flex-col items-center gap-3">
        {state.message ? <ErrorBanner>{state.message}</ErrorBanner> : null}

        {/* Submits itself on the sixth digit. A TOTP code lives about 30
            seconds, so making someone reach for a button after typing it is a
            real chance of it expiring between the typing and the clicking.
            Guarded on `pending` so a stray re-fire cannot double-submit. */}
        <InputOTP
          name="code"
          maxLength={6}
          disabled={pending}
          autoFocus
          onComplete={() => {
            if (!pending) formRef.current?.requestSubmit()
          }}
          aria-invalid={Boolean(state.fieldErrors?.code)}
          containerClassName="justify-center gap-2"
        >
          <InputOTPGroup className="gap-2">
            <InputOTPSlot index={0} className={SLOT_CLASS} />
            <InputOTPSlot index={1} className={SLOT_CLASS} />
            <InputOTPSlot index={2} className={SLOT_CLASS} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup className="gap-2">
            <InputOTPSlot index={3} className={SLOT_CLASS} />
            <InputOTPSlot index={4} className={SLOT_CLASS} />
            <InputOTPSlot index={5} className={SLOT_CLASS} />
          </InputOTPGroup>
        </InputOTP>

        {state.fieldErrors?.code ? (
          <FieldError>{state.fieldErrors.code}</FieldError>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Back first, then forward — the order they read in. */}
          <Button type="button" variant="ghost" onClick={onBack} disabled={pending}>
            Back to the QR code
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Checking…" : "Turn on two-factor"}
          </Button>
        </div>
      </form>

      <SignedInAs email={email} />
    </div>
  )
}

/** Who is signed in, and the one genuine way off these screens. */
function SignedInAs({ email }: { email: string }) {
  return (
    <form action={logout} className="border-t pt-4 text-center text-xs">
      <span className="text-muted-foreground">
        Signed in as <span className="text-foreground">{email}</span>.{" "}
      </span>
      <button
        type="submit"
        className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  )
}

/**
 * The seed in text, always visible rather than tucked behind a "can't scan?"
 * toggle — it is the only route in for anyone without a working camera, and
 * the only part of this screen a screen reader can convey.
 */
function SecretBlock({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused outright; the text is selectable, so
      // there is still a way through.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Can&apos;t scan it? In your app choose{" "}
        <strong className="font-medium text-foreground">
          &ldquo;Enter a setup key&rdquo;
        </strong>{" "}
        and type this:
      </p>

      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
        <code className="min-w-0 flex-1 font-mono text-sm break-all select-all">
          {secret}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          className="shrink-0 bg-card"
        >
          {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  )
}

/* ── Step 3: the one screen that cannot be shown twice ──────────────────── */

/**
 * Recovery codes, in the only moment they exist as plaintext.
 *
 * <p>The database holds bcrypt hashes, so nothing — not this app, not an
 * administrator, not someone with the database — can produce these again. A
 * refresh loses them for good, which is why leaving is gated behind an explicit
 * acknowledgement rather than a link someone can click past.
 */
function RecoveryCodesStep({
  codes,
  email,
}: {
  codes: string[]
  email: string
}) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  // Required, not just suggested — decided 2026-10-19. A ticked box proves
  // nothing; a downloaded file is at least a copy that exists somewhere.
  const [downloaded, setDownloaded] = useState(false)

  function finish() {
    // The app, not the security settings page. Enrolment used to live inside
    // Settings, so finishing returned you to where you had come from. It is a
    // mandatory gate now — this person has never seen Settings and did not
    // choose to be here. What they wanted was the app, and this is the first
    // moment they are allowed into it.
    //
    // refresh() first so the destination re-reads the user with the new token
    // rather than painting from a payload fetched while 2FA was still off.
    router.refresh()
    router.push("/dashboard")
  }

  return (
    // Narrow, like the code step before it — decided 2026-10-19.
    <div className="flex w-full max-w-sm flex-col gap-4 p-6">
      {/* Centred; the codes, checkbox and Finish below keep their left edge. */}
      <header className="flex flex-col items-center gap-1 text-center">
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
          <KeyRound className="size-4" aria-hidden />
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Save your recovery codes
        </h1>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is now on. These codes are how you get back
          in if you lose your phone.
        </p>
      </header>

      <RecoveryCodesPanel
        codes={codes}
        email={email}
        onDownload={() => setDownloaded(true)}
        actionsAtEnd
      />

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span>I have saved these codes somewhere safe</span>
      </label>

      <div className="flex flex-col items-start gap-2">
        <Button type="button" onClick={finish} disabled={!saved || !downloaded}>
          Finish
        </Button>
        {!downloaded ? (
          <p className="text-xs text-muted-foreground">
            Download your codes to continue.
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* ── Shared bits ────────────────────────────────────────────────────────── */

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      aria-live="polite"
      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  )
}

/** Shared column so every step sits on the same measure. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-5 p-6">{children}</div>
  )
}

export { TwoFactorSetupFlow }
