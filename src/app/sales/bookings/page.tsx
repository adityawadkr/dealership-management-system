"use client"

import * as React from "react"
import { CalendarCheck, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

 type Booking = {
  id: string
  customer: string
  vehicle: string
  quotationNo: string
  date: string
  status: "booked" | "cancelled" | "delivered"
}

const initial: Booking[] = [
  { id: "b1", customer: "Jane Cooper", vehicle: "2023 Toyota RAV4", quotationNo: "Q-1001", date: "2025-10-05", status: "booked" },
]

export default function BookingsPage() {
  const [rows, setRows] = React.useState<Booking[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setError(null)
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
        const res = await fetch("/api/bookings?limit=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load bookings")
        if (!ignore) {
          const mapped: Booking[] = (data?.data || []).map((b: any) => ({
            id: String(b.id),
            customer: b.customer,
            vehicle: b.vehicle,
            quotationNo: b.quotationNo,
            date: b.date,
            status: b.status,
          }))
          setRows(mapped)
        }
      } catch (e: any) {
        if (!ignore) setError(e.message || "Error loading bookings")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [])

  async function onSave(fd: FormData) {
    const payload = {
      customer: String(fd.get("customer") || "").trim(),
      vehicle: String(fd.get("vehicle") || "").trim(),
      quotationNo: String(fd.get("quotationNo") || "").trim(),
      // input type=date already returns YYYY-MM-DD
      date: String(fd.get("date") || ""),
      status: String(fd.get("status") || "booked") as Booking["status"],
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error || "Failed to create booking")
      return
    }
    const b = data.data
    const next: Booking = {
      id: String(b.id),
      customer: b.customer,
      vehicle: b.vehicle,
      quotationNo: b.quotationNo,
      date: b.date,
      status: b.status,
    }
    setRows((p) => [next, ...p])
  }

  return (
    <div className="space-y-4 p-4">
      <div className="text-xl font-semibold flex items-center gap-2"><ClipboardCheck className="size-5"/> Bookings</div>

      <Card>
        <CardHeader>
          <CardTitle>Create Booking</CardTitle>
          <CardDescription>Confirm a quotation and reserve a vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSave} className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label htmlFor="customer">Customer</Label>
              <Input id="customer" name="customer" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input id="vehicle" name="vehicle" required />
            </div>
            <div>
              <Label htmlFor="quotationNo">Quotation No.</Label>
              <Input id="quotationNo" name="quotationNo" required />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue="booked">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6 flex justify-end">
              <Button type="submit"><CalendarCheck className="mr-2 size-4"/> Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>Track status through delivery</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading bookings...</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Quotation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>{r.vehicle}</TableCell>
                  <TableCell className="font-mono text-xs">{r.quotationNo}</TableCell>
                  <TableCell className="font-mono text-xs">{r.date}</TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}