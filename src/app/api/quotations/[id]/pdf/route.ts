import { NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"

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

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" })
    const chunks: Buffer[] = []

    doc.on("data", (chunk) => chunks.push(chunk))

    await new Promise<void>((resolve, reject) => {
      doc.on("end", resolve)
      doc.on("error", reject)

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("QUOTATION", { align: "center" })
        .moveDown()

      // Company Info (placeholder)
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Dealership DMS", { align: "right" })
        .text("Mumbai, Maharashtra", { align: "right" })
        .text("India", { align: "right" })
        .text("Phone: +91 98765 43210", { align: "right" })
        .text("Email: info@dealership.in", { align: "right" })
        .moveDown()

      // Quotation Details
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Quotation No: ${data.number}`)
        .font("Helvetica")
        .text(`Date: ${new Date(data.created_at).toLocaleDateString("en-IN")}`)
        .text(`Status: ${data.status.toUpperCase()}`)
        .moveDown()

      // Customer Details
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Bill To:")
        .font("Helvetica")
        .text(data.customer)
        .moveDown()

      // Line separator
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown()

      // Table Header
      const tableTop = doc.y
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Description", 50, tableTop)
        .text("Amount", 400, tableTop, { width: 100, align: "right" })

      // Line under header
      doc
        .moveTo(50, tableTop + 20)
        .lineTo(550, tableTop + 20)
        .stroke()

      // Table Row
      const rowY = tableTop + 30
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(data.vehicle, 50, rowY, { width: 300 })
        .text(`₹${Number(data.amount).toLocaleString("en-IN")}`, 400, rowY, {
          width: 100,
          align: "right",
        })

      // Subtotal area
      const subtotalY = rowY + 60
      doc
        .moveTo(350, subtotalY - 10)
        .lineTo(550, subtotalY - 10)
        .stroke()

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Subtotal:", 350, subtotalY)
        .text(`₹${Number(data.amount).toLocaleString("en-IN")}`, 400, subtotalY, {
          width: 100,
          align: "right",
        })

      const taxY = subtotalY + 20
      const taxAmount = Math.round(Number(data.amount) * 0.18) // 18% GST
      doc
        .text("GST (18%):", 350, taxY)
        .text(`₹${taxAmount.toLocaleString("en-IN")}`, 400, taxY, {
          width: 100,
          align: "right",
        })

      const totalY = taxY + 20
      const totalAmount = Number(data.amount) + taxAmount
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total:", 350, totalY)
        .text(`₹${totalAmount.toLocaleString("en-IN")}`, 400, totalY, {
          width: 100,
          align: "right",
        })

      doc
        .moveTo(350, totalY + 20)
        .lineTo(550, totalY + 20)
        .stroke()

      // Terms and Conditions
      doc
        .moveDown(3)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Terms & Conditions:")
        .font("Helvetica")
        .fontSize(9)
        .text("1. This quotation is valid for 30 days from the date of issue.")
        .text("2. Prices are subject to change without notice.")
        .text("3. Payment terms: 50% advance, 50% on delivery.")
        .text("4. Delivery within 15-30 days of booking confirmation.")

      // Footer
      doc
        .moveDown(2)
        .fontSize(8)
        .text(
          "Thank you for your business!",
          50,
          doc.page.height - 100,
          { align: "center" }
        )

      doc.end()
    })

    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
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