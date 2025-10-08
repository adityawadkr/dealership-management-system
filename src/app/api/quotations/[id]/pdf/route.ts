import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export const runtime = "nodejs"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const token = req.headers.get("authorization")?.replace("Bearer ", "")

    // Fetch quotation data
    const baseUrl = req.nextUrl.origin
    const res = await fetch(`${baseUrl}/api/quotations/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    const { data } = await res.json()

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = height - 50

    // Header
    page.drawText("QUOTATION", {
      x: width / 2 - 60,
      y,
      size: 24,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    y -= 40

    // Company Info
    page.drawText("Dealership DMS", { x: width - 200, y, size: 10, font })
    y -= 15
    page.drawText("Mumbai, Maharashtra", { x: width - 200, y, size: 10, font })
    y -= 15
    page.drawText("India", { x: width - 200, y, size: 10, font })
    y -= 15
    page.drawText("Phone: +91 98765 43210", { x: width - 200, y, size: 10, font })
    y -= 15
    page.drawText("Email: info@dealership.in", { x: width - 200, y, size: 10, font })
    y -= 30

    // Quotation Details
    page.drawText(`Quotation No: ${data.number}`, { x: 50, y, size: 12, font: fontBold })
    y -= 15
    page.drawText(`Date: ${new Date(data.created_at).toLocaleDateString("en-IN")}`, { x: 50, y, size: 10, font })
    y -= 15
    page.drawText(`Status: ${data.status.toUpperCase()}`, { x: 50, y, size: 10, font })
    y -= 25

    // Customer Details
    page.drawText("Bill To:", { x: 50, y, size: 12, font: fontBold })
    y -= 15
    page.drawText(data.customer, { x: 50, y, size: 10, font })
    y -= 25

    // Line separator
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    })
    y -= 20

    // Table Header
    page.drawText("Description", { x: 50, y, size: 11, font: fontBold })
    page.drawText("Amount", { x: width - 150, y, size: 11, font: fontBold })
    y -= 5
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    })
    y -= 20

    // Table Row
    page.drawText(data.vehicle, { x: 50, y, size: 10, font })
    page.drawText(`Rs. ${Number(data.amount).toLocaleString("en-IN")}`, {
      x: width - 150,
      y,
      size: 10,
      font,
    })
    y -= 60

    // Subtotal area
    page.drawLine({
      start: { x: width - 200, y },
      end: { x: width - 50, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    y -= 15

    page.drawText("Subtotal:", { x: width - 200, y, size: 10, font })
    page.drawText(`Rs. ${Number(data.amount).toLocaleString("en-IN")}`, {
      x: width - 150,
      y,
      size: 10,
      font,
    })
    y -= 15

    const taxAmount = Math.round(Number(data.amount) * 0.18) // 18% GST
    page.drawText("GST (18%):", { x: width - 200, y, size: 10, font })
    page.drawText(`Rs. ${taxAmount.toLocaleString("en-IN")}`, {
      x: width - 150,
      y,
      size: 10,
      font,
    })
    y -= 15

    const totalAmount = Number(data.amount) + taxAmount
    page.drawText("Total:", { x: width - 200, y, size: 12, font: fontBold })
    page.drawText(`Rs. ${totalAmount.toLocaleString("en-IN")}`, {
      x: width - 150,
      y,
      size: 12,
      font: fontBold,
    })
    y -= 5
    page.drawLine({
      start: { x: width - 200, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    })
    y -= 30

    // Terms and Conditions
    page.drawText("Terms & Conditions:", { x: 50, y, size: 10, font: fontBold })
    y -= 15
    page.drawText("1. This quotation is valid for 30 days from the date of issue.", {
      x: 50,
      y,
      size: 9,
      font,
    })
    y -= 12
    page.drawText("2. Prices are subject to change without notice.", { x: 50, y, size: 9, font })
    y -= 12
    page.drawText("3. Payment terms: 50% advance, 50% on delivery.", { x: 50, y, size: 9, font })
    y -= 12
    page.drawText("4. Delivery within 15-30 days of booking confirmation.", {
      x: 50,
      y,
      size: 9,
      font,
    })

    // Footer
    page.drawText("Thank you for your business!", {
      x: width / 2 - 70,
      y: 50,
      size: 8,
      font,
    })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.number}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    )
  }
}