/**
 * The account set-up steps, on their own — decided 2026-10-19: choosing a
 * password from an invitation (`/accept-invite`) and enrolling in two-factor
 * (`/two-factor`).
 *
 * <p>Deliberately not the sign-in shell: no brand panel and no footer, just the
 * step, centred in the window. Somebody setting up their account has one thing
 * to do on each screen, and nothing beside it should compete for attention.
 *
 * <p>Width is each page's own business: the password form is narrow, the
 * two-factor steps need room for a QR code. A route group, so the addresses do
 * not change.
 */
export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <div className="flex w-full justify-center">{children}</div>
    </main>
  )
}
