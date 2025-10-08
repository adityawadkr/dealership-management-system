"use client"

import * as React from "react"
import { LineChart as LineChartIcon, TrendingUp, Users, Wallet, CircleDollarSign, FileDown, FileSpreadsheet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Area, AreaChart } from "recharts"

const revenueData = [
  { month: "Jan", revenue: 4200000, expenses: 2800000 },
  { month: "Feb", revenue: 4800000, expenses: 3000000 },
  { month: "Mar", revenue: 5100000, expenses: 3200000 },
  { month: "Apr", revenue: 6000000, expenses: 3600000 },
  { month: "May", revenue: 6400000, expenses: 3800000 },
  { month: "Jun", revenue: 7000000, expenses: 4100000 },
]

const salesFunnel = [
  { stage: "Leads", count: 320 },
  { stage: "Test Drives", count: 140 },
  { stage: "Quotes", count: 90 },
  { stage: "Bookings", count: 55 },
  { stage: "Deliveries", count: 48 },
]

const hrData = [
  { month: "Jan", headcount: 32 },
  { month: "Feb", headcount: 33 },
  { month: "Mar", headcount: 34 },
  { month: "Apr", headcount: 35 },
  { month: "May", headcount: 36 },
  { month: "Jun", headcount: 36 },
]

export default function ReportsPage() {
  const kpis = [
    { title: "Monthly Revenue", value: "₹70,00,000", desc: "June", icon: <Wallet className="size-4" /> },
    { title: "Gross Profit", value: "₹29,00,000", desc: "June", icon: <CircleDollarSign className="size-4" /> },
    { title: "Active Leads", value: "320", desc: "CRM", icon: <TrendingUp className="size-4" /> },
    { title: "Headcount", value: "36", desc: "HR", icon: <Users className="size-4" /> },
  ]

  const [resource, setResource] = React.useState<string>("leads")
  const [downloading, setDownloading] = React.useState<boolean>(false)

  const handleExport = async (type: "xlsx" | "pdf") => {
    try {
      setDownloading(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : undefined
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type, resource }),
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${resource}-report.${type}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xl font-semibold"><LineChartIcon className="size-5"/> Reports & Analytics</div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
            aria-label="Select resource"
          >
            <option value="leads">Leads</option>
            <option value="vehicles">Vehicles</option>
            <option value="appointments">Appointments</option>
            <option value="job-cards">Job Cards</option>
            <option value="quotations">Quotations</option>
            <option value="bookings">Bookings</option>
            <option value="service-history">Service History</option>
          </select>
          <Button size="sm" variant="secondary" onClick={() => handleExport("xlsx")} disabled={downloading} className="gap-2">
            <FileSpreadsheet className="size-4" /> Export XLSX
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport("pdf")} disabled={downloading} className="gap-2">
            <FileDown className="size-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.title} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">{k.icon} {k.title}</CardTitle>
              <CardDescription>{k.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "var(--chart-1)" },
                expenses: { label: "Expenses", color: "var(--chart-3)" },
              }}
              className="h-[320px] w-full"
            >
              <AreaChart data={revenueData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis width={36} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.2} />
                <Area dataKey="expenses" stroke="var(--color-expenses)" fill="var(--color-expenses)" fillOpacity={0.15} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Sales Funnel</CardTitle>
            <CardDescription>Lead to delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ count: { label: "Count", color: "var(--chart-4)" } }}
              className="h-[320px] w-full"
            >
              <BarChart data={salesFunnel} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                <YAxis width={36} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>CRM Performance</CardTitle>
            <CardDescription>Leads to sales ratio</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer
              config={{
                leads: { label: "Leads", color: "var(--chart-5)" },
                sales: { label: "Sales", color: "var(--chart-2)" },
              }}
              className="h-[280px] w-full"
            >
              <LineChart data={[
                { month: "Jan", leads: 120, sales: 22 },
                { month: "Feb", leads: 140, sales: 28 },
                { month: "Mar", leads: 110, sales: 18 },
                { month: "Apr", leads: 180, sales: 35 },
                { month: "May", leads: 200, sales: 40 },
                { month: "Jun", leads: 170, sales: 31 },
              ]} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis width={28} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={false} />
                <Line dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>HR Headcount</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer
              config={{ headcount: { label: "Headcount", color: "var(--chart-1)" } }}
              className="h-[280px] w-full"
            >
              <LineChart data={hrData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis width={28} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="headcount" stroke="var(--color-headcount)" strokeWidth={2} dot />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}