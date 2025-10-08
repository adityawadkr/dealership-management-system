"use client"

import * as React from "react"
import { DollarSign, Receipt, Banknote, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

const cashflow = [
  { month: "Jan", inflow: 520000, outflow: 360000 },
  { month: "Feb", inflow: 560000, outflow: 380000 },
  { month: "Mar", inflow: 590000, outflow: 400000 },
  { month: "Apr", inflow: 640000, outflow: 420000 },
  { month: "May", inflow: 690000, outflow: 460000 },
  { month: "Jun", inflow: 720000, outflow: 480000 },
]

export default function FinancePage() {
  const invoices = [
    { number: "INV-2001", customer: "Rajesh Kumar", amount: 2650000, status: "Paid" },
    { number: "INV-2002", customer: "Priya Sharma", amount: 1890000, status: "Pending" },
    { number: "INV-2003", customer: "Amit Patel", amount: 3250000, status: "Overdue" },
  ]

  const summaries = [
    { title: "AR (Open)", value: "₹45,80,000" },
    { title: "AP (Open)", value: "₹18,50,000" },
    { title: "Cash on Hand", value: "₹1,45,60,000" },
  ]

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-xl font-semibold"><DollarSign className="size-5"/> Finance & Accounting</div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaries.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
              <CardDescription>Summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              inflow: { label: "Inflow", color: "var(--chart-2)" },
              outflow: { label: "Outflow", color: "var(--chart-3)" },
            }}
            className="h-[300px]"
          >
            <AreaChart data={cashflow} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis width={36} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="inflow" stroke="var(--color-inflow)" fill="var(--color-inflow)" fillOpacity={0.2} />
              <Area dataKey="outflow" stroke="var(--color-outflow)" fill="var(--color-outflow)" fillOpacity={0.15} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Quotation → Invoice tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.number}>
                  <TableCell className="font-mono text-xs">{inv.number}</TableCell>
                  <TableCell>{inv.customer}</TableCell>
                  <TableCell className="text-right">₹{inv.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{inv.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}