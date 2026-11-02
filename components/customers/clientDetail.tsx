import { StatusPill, TestPill, resultLabel } from "@/components/customers/applicationPills"
import { money, type ApplicationDetail, type ApplicationSend, type ClientDetail } from "@/lib/applicationTypes"
import { canadaStamp } from "@/lib/format"


/** The answers, in the order the form asks them, under LeadScout's field names. */
const SECTIONS: { title: string; fields: [string, string][] }[] = [
  {
    title: "About",
    fields: [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["phone", "Phone"],
      ["birthDate", "Date of birth"],
    ],
  },
  {
    title: "Address",
    fields: [
      ["address", "Street"],
      ["province", "Province"],
      ["city", "City"],
      ["postalCode", "Postal code"],
      ["timeAtAddress", "Months at address"],
      ["ownHome", "Owns home"],
      ["rentMortgagePayment", "Rent or mortgage"],
      ["propertyValue", "Home value"],
      ["propertyMortgage", "Mortgage left"],
    ],
  },
  {
    title: "Income",
    fields: [
      ["incomeType", "Income type"],
      ["monthlyIncome", "Monthly income"],
      ["directDeposit", "Direct deposit"],
      ["employerName", "Employer"],
      ["jobTitle", "Job title"],
      ["employedMonths", "Months at job"],
      ["payFrequency", "Paid"],
      ["payDate1", "Next pay date"],
    ],
  },
  {
    title: "Loan and credit",
    fields: [
      ["purpose", "Loan for"],
      ["creditScore", "Credit score"],
      ["unsecuredDebtAmount", "Debt"],
      ["financialSituation", "Bankruptcy or proposal"],
      ["optIn", "Email offers"],
      ["optInPhone", "Text offers"],
    ],
  },
]

const MONEY_FIELDS = new Set([
  "rentMortgagePayment",
  "propertyValue",
  "propertyMortgage",
  "monthlyIncome",
  "unsecuredDebtAmount",
])

const WORDS: Record<string, string> = {
  full_time: "Full-time job",
  part_time: "Part-time job",
  self_employed: "Self-employed",
  gig_worker: "Gig work",
  retired: "Retired",
  disability: "Disability",
  social_security: "Government benefits",
  unemployed: "Unemployed",
  WEEKLY: "Every week",
  BIWEEKLY: "Every 2 weeks",
  TWICEMONTHLY: "Twice a month",
  MONTHLY: "Once a month",
  none: "None",
  inBankruptcy: "Bankruptcy",
  inConsumerProposal: "Consumer proposal",
  inDMP: "Debt management plan",
  good: "Good",
  fair: "Fair",
  low: "Low",
  unknown: "Not sure",
  yes: "Yes",
  no: "No",
}

function show(field: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (MONEY_FIELDS.has(field) && typeof value === "number") return money(value)
  return WORDS[String(value)] ?? String(value)
}

function pretty(text: string | null): string {
  if (!text) return "—"
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

/** A client and every time they applied, newest first. */
function ClientApplications({ client }: { client: ClientDetail }) {
  return (
    <div className="flex flex-col gap-4">
      {client.applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  )
}

function ApplicationCard({ application }: { application: ApplicationDetail }) {
  const tracking = Object.entries(application.tracking)

  return (
    <section className="rounded-lg border bg-muted/40 p-0.5" aria-label={`Application ${application.id}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
        <StatusPill status={application.status} />
        {application.test ? <TestPill /> : null}
        <p className="text-sm font-medium">
          {money(application.amount)} · {application.brand}
        </p>
        <p className="ml-auto text-xs text-muted-foreground tabular-nums">
          {canadaStamp(application.createdAt)} · {application.id}
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-md border bg-card p-4">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {SECTIONS.map((section) => {
            const lines = section.fields.filter(([field]) => application.answers[field] !== undefined)
            if (lines.length === 0) return null
            return (
              <div key={section.title}>
                <h3 className="mb-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
                  {section.title}
                </h3>
                <dl className="flex flex-col gap-1.5">
                  {lines.map(([field, label]) => (
                    <div key={field} className="flex justify-between gap-3 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium break-words">{show(field, application.answers[field])}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )
          })}
        </div>

        <dl className="grid gap-x-6 gap-y-1.5 border-t pt-4 text-xs md:grid-cols-2">
          <Fact label="Language" value={application.language === "fr" ? "French" : "English"} />
          <Fact label="Agreed to terms" value={canadaStamp(application.consentAt)} />
          <Fact label="IP address" value={application.ip ?? "—"} />
          <Fact label="Browser" value={application.userAgent || "—"} />
          {tracking.map(([key, value]) => (
            <Fact key={key} label={key} value={String(value)} />
          ))}
        </dl>

        {application.sends.length > 0 ? (
          <div className="border-t pt-4">
            <h3 className="mb-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
              Sent to LeadScout
            </h3>
            <ul className="flex flex-col gap-2">
              {application.sends.map((send, index) => (
                <SendLine key={index} send={send} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="truncate text-right" title={value}>
        {value}
      </dd>
    </div>
  )
}

function SendLine({ send }: { send: ApplicationSend }) {
  return (
    <li className="rounded-md border text-sm">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
          <span className="font-medium">{resultLabel(send.leadscoutStatus)}</span>
          {send.problem ? <span className="text-xs text-destructive">{send.problem}</span> : null}
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {canadaStamp(send.at)}
            {send.durationMs ? ` · ${send.durationMs} ms` : ""}
            {send.mode !== "live" ? ` · ${send.mode} mode` : ""}
          </span>
        </summary>
        <div className="grid gap-3 border-t p-3 lg:grid-cols-2">
          <Payload title="What we sent" text={send.request} />
          <Payload title={`What came back${send.httpStatus ? ` (HTTP ${send.httpStatus})` : ""}`} text={send.response} />
        </div>
      </details>
    </li>
  )
}

function Payload({ title, text }: { title: string; text: string | null }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs text-muted-foreground">{title}</p>
      <pre className="max-h-72 overflow-auto rounded-sm bg-muted/60 p-2 text-[0.7rem] leading-relaxed">{pretty(text)}</pre>
    </div>
  )
}

export { ClientApplications }
