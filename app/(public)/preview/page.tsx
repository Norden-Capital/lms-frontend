import type { Metadata } from "next"

import { apiFetch } from "@/lib/api"

export const metadata: Metadata = {
  title: "Email previews",
}

// Asked of the backend on every visit. Prerendered at build time it would show
// whatever the templates said on the day of the build — or an error, if the
// backend was not reachable from the build machine.
export const dynamic = "force-dynamic"

type EmailPreview = {
  key: string
  name: string
  sentWhen: string
  from: string
  subject: string
  html: string
  text: string
}

/**
 * Every email the platform sends, rendered with sample data, for approval.
 *
 * <p>The HTML comes from the backend's own templates — the code that sends the
 * real emails — so what is approved here is exactly what goes out.
 *
 * <p>Public, like the help pages: nothing on it is real.
 */
export default async function EmailPreviewPage() {
  const result = await apiFetch<EmailPreview[]>("/api/email-previews")

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Email previews</h1>
      <p className="text-sm text-muted-foreground">
        Every email the platform sends, with sample names. The buttons in them point at links that
        do not work.
      </p>

      {!result.ok ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Couldn&apos;t load the previews from the backend: {result.error.message}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-10">
          {result.data.map((email) => (
            <section key={email.key} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-lg font-semibold tracking-tight">{email.name}</h2>
                <p className="text-xs text-muted-foreground">Sent when: {email.sentWhen}</p>
              </div>

              {/* What the inbox list shows before anybody opens it. */}
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                <dt className="text-muted-foreground">From</dt>
                <dd className="break-all">{email.from}</dd>
                <dt className="text-muted-foreground">Subject</dt>
                <dd className="font-medium">{email.subject}</dd>
              </dl>

              {/* sandbox with no permissions: the email's HTML cannot run
                  scripts or navigate this page, exactly as in a mail app. */}
              <iframe
                title={`${email.name} email preview`}
                srcDoc={email.html}
                sandbox=""
                className="h-[560px] w-full rounded-md border bg-white"
              />

              <details className="rounded-md border px-3 py-2 text-xs">
                <summary className="cursor-pointer font-medium">
                  Plain-text version (for mail apps that don&apos;t show designs)
                </summary>
                <pre className="mt-2 font-mono text-xs whitespace-pre-wrap text-muted-foreground">
                  {email.text}
                </pre>
              </details>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
