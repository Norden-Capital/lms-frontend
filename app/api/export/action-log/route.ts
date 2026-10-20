import ExcelJS from "exceljs"
import { NextResponse, type NextRequest } from "next/server"

import { listActionLog } from "@/lib/actionLog"
import { actionLabel, type ActionLogEntry, type ActionLogQuery } from "@/lib/actionLogTypes"

/**
 * Downloading the action log as a file — built like the users export: the
 * search and sort on screen are passed through, ticked rows narrow it, and the
 * browser saves the file from a plain link. The backend refuses anybody but
 * the Owner, so this does too.
 */

// exceljs is a Node library — it will not run on the edge runtime.
export const runtime = "nodejs"

/** The backend caps a page at 100, so a full export is a loop. */
const FETCH_SIZE = 100

/** A run-away guard: 20,000 lines. */
const MAX_PAGES = 200

type Format = "csv" | "json" | "xlsx"

const COLUMNS: { key: string; header: string; width: number }[] = [
  { key: "at", header: "When", width: 20 },
  { key: "action", header: "What", width: 24 },
  { key: "actor", header: "Who", width: 40 },
  { key: "target", header: "To whom", width: 40 },
  { key: "details", header: "Details", width: 50 },
  { key: "ip", header: "Address", width: 18 },
]

/** What a cell reads as, for a person in a spreadsheet. */
function cell(entry: ActionLogEntry, key: string): string {
  switch (key) {
    case "at":
      return entry.at.replace("T", " ").slice(0, 19)
    case "action":
      return actionLabel(entry.action)
    case "actor":
      return entry.actor?.label ?? ""
    case "target":
      return entry.target?.label ?? ""
    case "details":
      return entry.details ?? ""
    case "ip":
      return entry.ip ?? ""
    default:
      return ""
  }
}

class ExportError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

async function fetchAll(query: ActionLogQuery): Promise<ActionLogEntry[]> {
  const rows: ActionLogEntry[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await listActionLog({ ...query, page: String(page + 1), size: String(FETCH_SIZE) })
    if (!result.ok) throw new ExportError(result.error.status, result.error.message)
    rows.push(...result.data.content)
    if (rows.length >= result.data.totalElements || result.data.content.length === 0) break
  }
  return rows
}

/** Quoted when it holds a comma, a quote or a newline, inner quotes doubled — RFC 4180. */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toCsv(rows: ActionLogEntry[]): string {
  const lines = [COLUMNS.map((c) => csvField(c.header)).join(",")]
  for (const entry of rows) lines.push(COLUMNS.map((c) => csvField(cell(entry, c.key))).join(","))
  // CRLF and a BOM, so Excel reads it as UTF-8.
  return "﻿" + lines.join("\r\n") + "\r\n"
}

async function toXlsx(rows: ActionLogEntry[]): Promise<Buffer> {
  const book = new ExcelJS.Workbook()
  book.creator = "Norden Capital"
  const sheet = book.addWorksheet("Action log")
  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }))
  sheet.getRow(1).font = { bold: true }
  sheet.views = [{ state: "frozen", ySplit: 1 }]
  for (const entry of rows) {
    sheet.addRow(Object.fromEntries(COLUMNS.map((c) => [c.key, cell(entry, c.key)])))
  }
  return Buffer.from(await book.xlsx.writeBuffer())
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const format = (params.get("format") ?? "csv") as Format
  if (!["csv", "json", "xlsx"].includes(format)) {
    return NextResponse.json({ message: `Unknown format "${format}".` }, { status: 400 })
  }

  const query: ActionLogQuery = {
    search: params.get("search") ?? undefined,
    sort: params.get("sort") ?? undefined,
  }

  let rows: ActionLogEntry[]
  try {
    rows = await fetchAll(query)
  } catch (error) {
    if (error instanceof ExportError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    throw error
  }

  const ids = params.get("ids")
  if (ids) {
    const wanted = new Set(ids.split(",").map((id) => Number(id)).filter(Number.isFinite))
    rows = rows.filter((entry) => wanted.has(entry.id))
  }

  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `action-log-${stamp}.${format}`

  // JSON keeps the raw values, for a program rather than a person.
  const body =
    format === "xlsx" ? await toXlsx(rows) : format === "json" ? JSON.stringify(rows, null, 2) : toCsv(rows)

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
