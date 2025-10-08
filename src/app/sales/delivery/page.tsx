"use client"

import * as React from "react"
import { Truck, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

 type Delivery = {
  id: string
  bookingId: string
  customer: string
  vehicle: string
  date: string
  paymentStatus: "pending" | "paid"
}

const initial: Delivery[] = [
  { id: "d1", bookingId: "b1", customer: "Rajesh Kumar", vehicle: "Tata Nexon EV", date: "2025-10-10", paymentStatus: "paid" },
]

export default function DeliveryPage() {
  const [rows, setRows] = React.useState(initial)

  function onSave(fd: FormData) {
    const next: Delivery = {
      id: Math.random().toString(36).slice(2),
      bookingId: String(fd.get("bookingId") || ""),
      customer: String(fd.get("customer") || ""),
      vehicle: String(fd.get("vehicle") || ""),
      date: String(fd.get("date") || ""),
      paymentStatus: String(fd.get("paymentStatus") || "pending") as Delivery["paymentStatus"],
    }
    setRows((p) => [next, ...p])
  }

  return (
    <div className="space-y-4 p-4">
      <div className="text-xl font-semibold flex items-center gap-2"><Truck className="size-5"/> Delivery</div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Delivery</CardTitle>
          <CardDescription>Finalize paperwork and handover</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSave} className="grid gap-3 md:grid-cols-6">
            <div>
              <Label htmlFor="bookingId">Booking ID</Label>
              <Input id="bookingId" name="bookingId" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="customer">Customer</Label>
              <Input id="customer" name="customer" required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input id="vehicle" name="vehicle" required placeholder="e.g., Maruti Swift, Mahindra XUV700" />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div>
              <Label htmlFor="paymentStatus">Payment</Label>
              <select id="paymentStatus" name="paymentStatus" className="border rounded-md h-9 px-3 text-sm bg-transparent">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="md:col-span-6 flex justify-end">
              <Button type="submit"><BadgeCheck className="mr-2 size-4"/> Mark</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery List</CardTitle>
          <CardDescription>Handover schedule and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.bookingId}</TableCell>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>{r.vehicle}</TableCell>
                  <TableCell className="font-mono text-xs">{r.date}</TableCell>
                  <TableCell className="capitalize">{r.paymentStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}