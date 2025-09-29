"use client"

import * as React from "react"
import { ClipboardPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

 type JobCard = {
  id: string
  jobNo: string
  appointmentId: string
  technician: string
  partsUsed: string
  notes: string
  status: "open" | "closed"
}

const initial: JobCard[] = [
  { id: "j1", jobNo: "JC-0001", appointmentId: "a1", technician: "Alex Mason", partsUsed: "Oil Filter, Engine Oil", notes: "Change oil & filter", status: "open" },
]

export default function JobCardsPage() {
  const [rows, setRows] = React.useState<JobCard[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setError(null)
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
        const res = await fetch("/api/job-cards?limit=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load job cards")
        if (!ignore) {
          const mapped: JobCard[] = (data?.data || []).map((r: any) => ({
            id: String(r.id),
            jobNo: r.jobNo,
            appointmentId: r.appointmentId == null ? "" : String(r.appointmentId),
            technician: r.technician,
            partsUsed: r.partsUsed || "",
            notes: r.notes || "",
            status: r.status,
          }))
          setRows(mapped)
        }
      } catch (e: any) {
        if (!ignore) setError(e.message || "Error loading job cards")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  async function onSave(fd: FormData) {
    const appointmentIdRaw = String(fd.get("appointmentId") || "").trim()
    const appointmentId = appointmentIdRaw ? parseInt(appointmentIdRaw, 10) : null

    const payload = {
      jobNo: `JOB-${Date.now()}`,
      appointmentId,
      technician: String(fd.get("technician") || "").trim(),
      partsUsed: String(fd.get("partsUsed") || "").trim() || null,
      notes: String(fd.get("notes") || "").trim() || null,
      status: String(fd.get("status") || "open") as JobCard["status"],
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null
    const res = await fetch("/api/job-cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error || "Failed to create job card")
      return
    }
    const r = data.data
    const next: JobCard = {
      id: String(r.id),
      jobNo: r.jobNo,
      appointmentId: r.appointmentId == null ? "" : String(r.appointmentId),
      technician: r.technician,
      partsUsed: r.partsUsed || "",
      notes: r.notes || "",
      status: r.status,
    }
    setRows((p) => [next, ...p])
  }

  return (
    <div className="space-y-4 p-4">
      <div className="text-xl font-semibold flex items-center gap-2"><ClipboardPlus className="size-5"/> Job Cards</div>

      <Card>
        <CardHeader>
          <CardTitle>Create Job Card</CardTitle>
          <CardDescription>Associate with an appointment and track work</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSave} className="grid gap-3 md:grid-cols-6">
            <div>
              <Label htmlFor="appointmentId">Appointment ID</Label>
              <Input id="appointmentId" name="appointmentId" placeholder="1" />
            </div>
            <div>
              <Label htmlFor="technician">Technician</Label>
              <Input id="technician" name="technician" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="partsUsed">Parts Used</Label>
              <Input id="partsUsed" name="partsUsed" placeholder="Comma separated" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue="open">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6 flex justify-end">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Job Cards</CardTitle>
          <CardDescription>Parts usage and work status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading job cards...</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Parts</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.jobNo}</TableCell>
                  <TableCell className="font-mono text-xs">{r.appointmentId}</TableCell>
                  <TableCell>{r.technician}</TableCell>
                  <TableCell>{r.partsUsed}</TableCell>
                  <TableCell>{r.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}