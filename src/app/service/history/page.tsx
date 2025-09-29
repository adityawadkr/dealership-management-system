"use client"

import * as React from "react"
import { History } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

 type ServiceRecord = {
  id: string
  customer: string
  vehicle: string
  jobNo: string
  date: string
  amount: number
}

const initial: ServiceRecord[] = [
  { id: "s1", customer: "Jane Cooper", vehicle: "2023 Toyota RAV4", jobNo: "JC-0001", date: "2025-09-21", amount: 185.5 },
]

export default function ServiceHistoryPage() {
  const [rows, setRows] = React.useState<ServiceRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setError(null)
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
        const res = await fetch("/api/service-history?limit=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load service history")
        if (!ignore) {
          const mapped: ServiceRecord[] = (data?.data || []).map((r: any) => ({
            id: String(r.id),
            customer: r.customer,
            vehicle: r.vehicle,
            jobNo: r.jobNo,
            date: r.date,
            amount: Number(r.amount),
          }))
          setRows(mapped)
        }
      } catch (e: any) {
        if (!ignore) setError(e.message || "Error loading service history")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  return (
    <div className="space-y-4 p-4">
      <div className="text-xl font-semibold flex items-center gap-2"><History className="size-5"/> Service History</div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
          <CardDescription>Completed services and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading service history...</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Job No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>{r.vehicle}</TableCell>
                  <TableCell className="font-mono text-xs">{r.jobNo}</TableCell>
                  <TableCell className="font-mono text-xs">{r.date}</TableCell>
                  <TableCell className="text-right">${r.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}