"use client"

import * as React from "react"
import { FilePlus2, ReceiptText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

 type Quote = {
  id: string
  number: string
  customer: string
  vehicle: string
  amount: number
  status: "draft" | "sent" | "accepted"
}

const initial: Quote[] = [
  { id: "q1", number: "Q-1001", customer: "Jane Cooper", vehicle: "2023 Toyota RAV4", amount: 32500, status: "sent" },
]

export default function QuotationsPage() {
  const [rows, setRows] = React.useState(initial)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setError(null)
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
        const res = await fetch("/api/quotations?limit=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load quotations")
        if (!ignore) {
          const mapped: Quote[] = (data?.data || []).map((q: any) => ({
            id: String(q.id),
            number: q.number,
            customer: q.customer,
            vehicle: q.vehicle,
            amount: Number(q.amount),
            status: q.status,
          }))
          setRows(mapped)
        }
      } catch (e: any) {
        if (!ignore) setError(e.message || "Error loading quotations")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  async function onSave(fd: FormData) {
    const payload = {
      number: `Q-${1000 + rows.length + 1}`,
      customer: String(fd.get("customer") || "").trim(),
      vehicle: String(fd.get("vehicle") || "").trim(),
      amount: parseInt(String(fd.get("amount") || "0"), 10),
      status: String(fd.get("status") || "draft") as Quote["status"],
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error || "Failed to create quotation")
      return
    }
    const q = data.data
    const next: Quote = {
      id: String(q.id),
      number: q.number,
      customer: q.customer,
      vehicle: q.vehicle,
      amount: Number(q.amount),
      status: q.status,
    }
    setRows((p) => [next, ...p])
  }

  async function handleStatusChange(id: string, newStatus: Quote["status"]) {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
    } catch (e: any) {
      setError(e.message || "Error updating status")
    }
  }

  async function handleDownloadPDF(id: string, number: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
    try {
      const res = await fetch(`/api/quotations/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error("Failed to generate PDF")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${number}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message || "Error downloading PDF")
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="text-xl font-semibold flex items-center gap-2"><ReceiptText className="size-5"/> Quotations</div>

      <Card>
        <CardHeader>
          <CardTitle>Create Quotation</CardTitle>
          <CardDescription>Turn interest into an offer</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSave} className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <Label htmlFor="customer">Customer</Label>
              <Input id="customer" name="customer" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input id="vehicle" name="vehicle" required />
            </div>
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" name="amount" type="number" step="1000" required />
            </div>
            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue="draft">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5 flex justify-end">
              <Button type="submit"><FilePlus2 className="mr-2 size-4"/> Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>Track status to convert sales</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading quotations...</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.number}</TableCell>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>{r.vehicle}</TableCell>
                  <TableCell className="text-right">₹{r.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(val) => handleStatusChange(r.id, val as Quote["status"])}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(r.id, r.number)}>
                      <Download className="size-4 mr-1" /> PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}