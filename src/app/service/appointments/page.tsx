"use client"

import * as React from "react"
import { CalendarPlus, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

 type Appointment = {
  id: string
  customer: string
  vehicle: string
  date: string
  serviceType: string
  status: "scheduled" | "in_progress" | "completed"
}

const initial: Appointment[] = [
  { id: "a1", customer: "Amit Patel", vehicle: "Maruti Suzuki Baleno", date: "2025-10-03 09:30", serviceType: "Periodic Service", status: "scheduled" },
]

export default function ServiceAppointmentsPage() {
  const [rows, setRows] = React.useState<Appointment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setError(null)
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
        const res = await fetch("/api/appointments?limit=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load appointments")
        if (!ignore) {
          const mapped: Appointment[] = (data?.data || []).map((a: any) => ({
            id: String(a.id),
            customer: a.customer,
            vehicle: a.vehicle,
            date: a.date,
            serviceType: a.serviceType,
            status: a.status,
          }))
          setRows(mapped)
        }
      } catch (e: any) {
        if (!ignore) setError(e.message || "Error loading appointments")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  async function onSave(fd: FormData) {
    const localDate = String(fd.get("date") || "") // from datetime-local
    const iso = localDate ? new Date(localDate).toISOString() : ""
    const payload = {
      customer: String(fd.get("customer") || "").trim(),
      vehicle: String(fd.get("vehicle") || "").trim(),
      date: iso,
      serviceType: String(fd.get("serviceType") || "").trim(),
      status: String(fd.get("status") || "scheduled") as Appointment["status"],
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error || "Failed to create appointment")
      return
    }
    const a = data.data
    const next: Appointment = {
      id: String(a.id),
      customer: a.customer,
      vehicle: a.vehicle,
      date: a.date,
      serviceType: a.serviceType,
      status: a.status,
    }
    setRows((p) => [next, ...p])
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <div className="text-xl font-semibold flex items-center gap-2"><CalendarClock className="size-5"/> Service Appointments</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Appointment</CardTitle>
          <CardDescription>Create a new service booking</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSave} className="grid gap-3 md:grid-cols-5">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Input id="customer" name="customer" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input id="vehicle" name="vehicle" placeholder="e.g., Tata Nexon, Hyundai Creta" required />
            </div>
            <div>
              <Label htmlFor="date">Date & Time</Label>
              <Input id="date" name="date" type="datetime-local" required />
            </div>
            <div>
              <Label>Service Type</Label>
              <Select name="serviceType" defaultValue="Periodic Service">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Periodic Service">Periodic Service</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Diagnostics">Diagnostics</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue="scheduled">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5 flex justify-end">
              <Button type="submit"><CalendarPlus className="mr-2 size-4"/> Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>Today's and upcoming schedule</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading appointments...</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>{r.vehicle}</TableCell>
                  <TableCell className="font-mono text-xs">{r.date}</TableCell>
                  <TableCell>{r.serviceType}</TableCell>
                  <TableCell className="capitalize">{r.status.replace("_", " ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}