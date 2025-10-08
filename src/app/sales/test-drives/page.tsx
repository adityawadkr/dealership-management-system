"use client"

import * as React from "react"
import { CalendarPlus, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

 type TestDrive = {
  id: string
  lead: string
  vehicle: string
  date: string
  status: "scheduled" | "completed" | "no_show"
}

const initial: TestDrive[] = [
  { id: "td1", lead: "Priya Sharma", vehicle: "Maruti Suzuki Swift", date: "2025-10-02 10:00", status: "scheduled" },
]

export default function TestDrivesPage() {
  const [rows, setRows] = React.useState(initial)
  function onSave(fd: FormData) {
    const next: TestDrive = {
      id: Math.random().toString(36).slice(2),
      lead: String(fd.get("lead") || ""),
      vehicle: String(fd.get("vehicle") || ""),
      date: String(fd.get("date") || ""),
      status: String(fd.get("status") || "scheduled") as TestDrive["status"],
    }
    setRows((p) => [next, ...p])
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <div className="text-xl font-semibold flex items-center gap-2"><Car className="size-5"/> Test Drives</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Book a test drive</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSave} className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-1">
              <Label htmlFor="lead">Lead</Label>
              <Input id="lead" name="lead" required />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input id="vehicle" name="vehicle" required placeholder="e.g., Tata Nexon, Hyundai Creta" />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="date">Date & Time</Label>
              <Input id="date" name="date" type="datetime-local" required />
            </div>
            <div className="md:col-span-1">
              <Label>Status</Label>
              <Select name="status" defaultValue="scheduled">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit"><CalendarPlus className="mr-2 size-4"/> Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming & History</CardTitle>
          <CardDescription>Manage schedules and outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.lead}</TableCell>
                  <TableCell>{r.vehicle}</TableCell>
                  <TableCell className="font-mono text-xs">{r.date}</TableCell>
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