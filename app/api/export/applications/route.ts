import ExcelJS from "exceljs"
import { NextResponse, type NextRequest } from "next/server"

import { resultLabel } from "@/components/customers/applicationPills"
import { listApplications } from "@/lib/applications"
import {
  INCOME_TYPES,
  birthDateLabel,
  channelLabel,
  type ApplicationRow,
  type ApplicationsQuery,
} from "@/lib/applicationTypes"
import { canadaStamp } from "@/lib/format"

/**
 * Downloading Leads, Abandoned or Failed as a file — built like the users export
 * (see app/api/export/users/route.ts for why it is a Route Handler and a plain
 * link). It exports the list as filtered and sorted on screen, or only the ticked
 * rows. Every column, whatever the table is showing.
 */

// exceljs is a Node library — it will not run on the edge runtime.
export const runtime = "nodejs"

/** The backend caps a page at 100, so a full export is a loop. */
const FETCH_SIZE = 100

/** A run-away guard, not a limit anybody should meet. */
const MAX_PAGES = 200

const LISTS = ["LEAD", "ABANDONED", "FAILED"] as const
type List = (typeof LISTS)[number]

const FILE_NAMES: Record<List, string> = { LEAD: "leads", ABANDONED: "abandoned", FAILED: "failed" }

type Format = "csv" | "json" | "xlsx"

/** The columns, in the table's order. */
const COLUMNS: { header: string; width: number; value: (row: ApplicationRow) => string | number; leadsOnly?: boolean }[] = [
  { header: "Lead ID", width: 18, value: (row) => row.id },
  { header: "First name", width: 16, value: (row) => row.firstName ?? "" },
  { header: "Last name", width: 16, value: (row) => row.lastName ?? "" },
  { header: "Email", width: 32, value: (row) => row.email },
  { header: "Phone", width: 16, value: (row) => row.phone ?? "" },
  { header: "Date of birth", width: 14, value: (row) => (row.birthDate ? birthDateLabel(row.birthDate) : "") },
  { header: "Province", width: 10, value: (row) => row.province ?? "" },
  { header: "Brand", width: 18, value: (row) => row.brand },
  { header: "Website", width: 24, value: (row) => row.brandDomain },
  { header: "Channel", width: 12, value: (row) => channelLabel(row.channel) },
  { header: "Amount", width: 10, value: (row) => row.amount },
  { header: "Income type", width: 20, value: (row) => (row.incomeType ? (INCOME_TYPES[row.incomeType] ?? row.incomeType) : "") },
  { header: "Employer", width: 24, value: (row) => row.employer ?? "" },
  { header: "Result", width: 16, value: (row) => resultLabel(row.leadscoutStatus), leadsOnly: true },
  { header: "Test", width: 8, value: (row) => (row.test ? "Yes" : "No") },
  { header: "Created", width: 20, value: (row) => canadaStamp(row.createdAt) },
]

class ExportError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

/** Every row matching the filters, one page at a time. */
async function fetchAll(list: List, query: ApplicationsQuery): Promise<ApplicationRow[]> {
  const rows: ApplicationRow[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    // listApplications counts pages from 1, as the URL does.
    const result = await listApplications(list, { ...query, page: String(page + 1), size: String(FETCH_SIZE) })
    if (!result.ok) throw new ExportError(result.error.status, result.error.message)
    rows.push(...result.data.content)
    if (rows.length >= result.data.totalElements || result.data.content.length === 0) break
  }
  return rows
}

/** One CSV field, quoted when it holds a comma, a quote or a newline (RFC 4180). */
function csvField(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(rows: ApplicationRow[], columns: typeof COLUMNS): string {
  const lines = [columns.map((c) => csvField(c.header)).join(",")]
  for (const row of rows) lines.push(columns.map((c) => csvField(c.value(row))).join(","))
  // CRLF and a BOM, so Excel reads accents right.
  return "﻿" + lines.join("\r\n") + "\r\n"
}

async function toXlsx(rows: ApplicationRow[], columns: typeof COLUMNS, title: string): Promise<Buffer> {
  const book = new ExcelJS.Workbook()
  book.creator = "Norden Capital"
  const sheet = book.addWorksheet(title)
  sheet.columns = columns.map((c, index) => ({ header: c.header, key: String(index), width: c.width }))
  sheet.getRow(1).font = { bold: true }
  sheet.views = [{ state: "frozen", ySplit: 1 }]
  for (const row of rows) sheet.addRow(Object.fromEntries(columns.map((c, index) => [String(index), c.value(row)])))
  return Buffer.from(await book.xlsx.writeBuffer())
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const format = (params.get("format") ?? "csv") as Format
  if (!["csv", "json", "xlsx"].includes(format)) {
    return NextResponse.json({ message: `Unknown format "${format}".` }, { status: 400 })
  }
  const list = params.get("status") as List
  if (!LISTS.includes(list)) {
    return NextResponse.json({ message: "There is no such list." }, { status: 400 })
  }

  const query: ApplicationsQuery = {
    search: params.get("search") ?? undefined,
    brand: params.get("brand") ?? undefined,
    channel: params.get("channel") ?? undefined,
    sort: params.get("sort") ?? undefined,
  }

  let rows: ApplicationRow[]
  try {
    rows = await fetchAll(list, query)
  } catch (error) {
    if (error instanceof ExportError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    throw error
  }

  // Narrowed to the ticked rows, if any.
  const ids = params.get("ids")
  if (ids) {
    const wanted = new Set(ids.split(",").map((id) => id.trim()).filter(Boolean))
    rows = rows.filter((row) => wanted.has(row.id))
  }

  // Abandoned people never reached LeadScout, so that file has no result.
  const columns = COLUMNS.filter((c) => list !== "ABANDONED" || !c.leadsOnly)
  const name = FILE_NAMES[list]
  const filename = `${name}-${new Date().toISOString().slice(0, 10)}.${format}`

  const body =
    format === "xlsx"
      ? await toXlsx(rows, columns, name)
      : format === "json"
        ? JSON.stringify(rows, null, 2)
        : toCsv(rows, columns)

  const type =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : format === "json"
        ? "application/json; charset=utf-8"
        : "text/csv; charset=utf-8"

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
