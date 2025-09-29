import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import PDFDocument from "pdfkit"

export const runtime = "nodejs"

// Map report resource -> existing API route
const RESOURCE_MAP: Record<string, string> = {
  leads: "/api/leads",
  vehicles: "/api/vehicles",
  appointments: "/api/appointments",
  "job-cards": "/api/job-cards",
  quotations: "/api/quotations",
  bookings: "/api/bookings",
  "service-history": "/api/service-history",
}

async function fetchData(baseUrl: string, resource: string, bearer?: string) {
  const path = RESOURCE_MAP[resource]
  if (!path) return []
  const url = baseUrl + path
  const res = await fetch(url, {
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
    // Revalidate on each export
    cache: "no-store",
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => [])
  // Normalize: many of our routes return { data: [...] }
  if (Array.isArray(data)) return data
  if (Array.isArray((data as any).data)) return (data as any).data
  return data ?? []
}

function toXlsxBuffer(rows: any[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Report")
  const array = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
  return array
}

async function toPdfBuffer(rows: any[]): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 32, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (c) => chunks.push(Buffer.from(c)))
    doc.on("end", () => resolve(Buffer.concat(chunks)))

    doc.fontSize(16).text("DMS Report", { align: "center" })
    doc.moveDown(1)

    if (!rows.length) {
      doc.fontSize(12).text("No data available.")
      doc.end()
      return
    }

    const columns = Object.keys(rows[0])

    // Header
    doc.fontSize(11).font("Helvetica-Bold")
    columns.forEach((col) => {
      doc.text(col, { continued: true, width: 140 })
    })
    doc.text("")
    doc.moveDown(0.5)
    doc.font("Helvetica").fontSize(10)

    // Rows (basic table layout)
    rows.forEach((row) => {
      columns.forEach((col) => {
        const val = row[col]
        const cell = typeof val === "object" ? JSON.stringify(val) : String(val ?? "")
        doc.text(cell, { continued: true, width: 140 })
      })
      doc.text("")
    })

    doc.end()
  })
}

export async function POST(req: NextRequest) {
  try {
    const { type, resource, filename } = (await req.json().catch(() => ({}))) as {
      type?: "xlsx" | "pdf"
      resource?: string
      filename?: string
    }

    if (!type || !resource) {
      return NextResponse.json({ error: "Missing type or resource" }, { status: 400 })
    }

    // Derive base URL from request for internal fetches
    const url = new URL(req.url)
    const baseUrl = `${url.protocol}//${url.host}`

    // Optional bearer token from header
    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

    const rows = await fetchData(baseUrl, resource, bearer)

    let buffer: Buffer
    let contentType: string
    let defaultName = `${resource}-report.${type}`

    if (type === "xlsx") {
      buffer = toXlsxBuffer(rows)
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    } else {
      buffer = await toPdfBuffer(rows)
      contentType = "application/pdf"
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename || defaultName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}