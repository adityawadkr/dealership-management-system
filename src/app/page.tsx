"use client"

import Link from "next/link"
import { Car, ClipboardList, Gauge, LineChart as LineChartIcon, Package, Receipt, Settings2, Users, HandCoins, HeartHandshake, CalendarCheck, Wrench, Search, Bell, Sun, MoreHorizontal } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { useEffect, useMemo, useState } from "react"

const kpis = [
  { title: "Leads", value: 736, desc: "+11.01%", trend: "up" as const },
  { title: "Test Drive Schedules", value: 36, desc: "-0.03%", trend: "down" as const },
  { title: "Inventory", value: 156, desc: "+15.03%", trend: "up" as const },
  { title: "Service Requests", value: 231, desc: "+6.08%", trend: "up" as const },
]

const salesData = [
  { month: "Jan", leads: 12000, sales: 8000 },
  { month: "Feb", leads: 15000, sales: 9000 },
  { month: "Mar", leads: 11000, sales: 7000 },
  { month: "Apr", leads: 20000, sales: 12000 },
  { month: "May", leads: 24000, sales: 16000 },
  { month: "Jun", leads: 21000, sales: 15000 },
]

const inventoryData = [
  { label: "SUV", count: 48 },
  { label: "Sedan", count: 36 },
  { label: "Truck", count: 22 },
  { label: "EV", count: 18 },
]

const serviceActivity = [
  { label: "Mon", a: 12, b: 6, c: 10 },
  { label: "Tue", a: 20, b: 10, c: 15 },
  { label: "Wed", a: 15, b: 8, c: 22 },
  { label: "Thu", a: 28, b: 12, c: 9 },
  { label: "Fri", a: 18, b: 7, c: 19 },
]

const salesPerformance = [
  { month: "Jan", a: 12, b: 6, c: 10 },
  { month: "Feb", a: 20, b: 10, c: 15 },
  { month: "Mar", a: 15, b: 8, c: 22 },
  { month: "Apr", a: 28, b: 12, c: 9 },
  { month: "May", a: 18, b: 7, c: 19 },
  { month: "Jun", a: 22, b: 9, c: 14 },
]

const salesByLocation = [
  { name: "Mumbai", value: 52.1, color: "var(--chart-2)" },
  { name: "Pune", value: 22.8, color: "var(--chart-1)" },
  { name: "Baramati", value: 13.9, color: "var(--chart-4)" },
  { name: "Other", value: 11.2, color: "var(--chart-5)" },
]

const socialVisibility = [
  { name: "Google" },
  { name: "YouTube" },
  { name: "Instagram" },
  { name: "Pinterest" },
  { name: "Facebook" },
  { name: "Twitter" },
]

const notifications = [
  { title: "You fixed a bug.", time: "1h" },
  { title: "New user registered.", time: "59m" },
  { title: "You fixed a bug.", time: "12h" },
  { title: "Vansh Scheduled a Test drive.", time: "Today, 11:59 AM" },
]

export default function Dashboard() {
  const [showRightRail, setShowRightRail] = useState(false)
  const [theme, setTheme] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'Today' | 'This Week'>('Today')

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    if (stored) {
      setTheme(stored)
      document.documentElement.classList.toggle('dark', stored === 'dark')
    } else {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    }
  }, [])

  const gridClass = useMemo(() => `grid gap-4 p-4 ${showRightRail ? 'lg:grid-cols-[1fr_320px]' : ''}`,[showRightRail])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Car className="size-5" />
            <span className="font-semibold">Dealership DMS</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive>
                    <Link href="/">
                      <Gauge />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/inventory/vehicles">
                      <Package />
                      <span>Vehicle Inventory</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/inventory/spare-parts">
                      <Package />
                      <span>Spare Parts</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarGroup>
                    <SidebarGroupLabel>Sales</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link href="/sales/leads">
                              <Users />
                              <span>Leads</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link href="/sales/test-drives">
                              <Car />
                              <span>Test Drives</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link href="/sales/quotations">
                              <Receipt />
                              <span>Quotations</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link href="/sales/bookings">
                              <ClipboardList />
                              <span>Bookings</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link href="/sales/delivery">
                              <ClipboardList />
                              <span>Delivery</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarGroup>
                    <SidebarGroupLabel>Service</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link href="/service/appointments">
                              <CalendarCheck />
                              <span>Appointments</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link href="/service/job-cards">
                              <Wrench />
                              <span>Job Cards</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link href="/service/history">
                              <ClipboardList />
                              <span>History</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Business</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/reports">
                      <LineChartIcon />
                      <span>Reports & Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/finance">
                      <Receipt />
                      <span>Finance & Accounting</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/fi">
                      <HandCoins />
                      <span>Finance & Insurance</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/crm">
                      <HeartHandshake />
                      <span>CRM & Loyalty</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/admin">
                  <Settings2 />
                  <span>HR & Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="text-sm text-muted-foreground">Dashboards</div>
          <div className="mx-2 text-muted-foreground">/</div>
          <div className="font-semibold">Default</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="size-4" />
              </span>
              <input
                className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/70"
                placeholder="Search"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // basic search hook-up placeholder
                    console.info('Search:', (e.target as HTMLInputElement).value)
                  }
                }}
              />
            </div>
            <Button size="sm" variant="ghost" className="px-2" onClick={toggleTheme} aria-label="Toggle theme">
              <Sun className="size-4" />
            </Button>
            <Button size="sm" variant="ghost" className="px-2" onClick={() => setShowRightRail((s) => !s)} aria-expanded={showRightRail} aria-controls="right-rail" aria-label="Toggle notifications">
              <Bell className="size-4" />
            </Button>
          </div>
        </div>

        <div className={gridClass}>
          {/* Main content */}
          <div className="space-y-4">
            {/* Overview KPI cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis.map((k) => (
                <Card key={k.title} className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{k.title}</CardTitle>
                    <CardDescription className={`${k.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>{k.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold tabular-nums">{k.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total Sales + Social Visibility */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Total Sales</CardTitle>
                      <CardDescription>• This year • Last year</CardDescription>
                    </div>
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => setDateRange((r) => r === 'Today' ? 'This Week' : 'Today')}>
                      {dateRange}
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  <ChartContainer
                    config={{
                      leads: { label: "Leads", color: "var(--chart-4)" },
                      sales: { label: "Sales", color: "var(--chart-1)" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <LineChart data={salesData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis width={40} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line dataKey="leads" type="monotone" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
                      <Line dataKey="sales" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>Social Media Visibility</CardTitle>
                  <CardDescription>Today</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {socialVisibility.map((s) => (
                      <li key={s.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{s.name}</span>
                        <span className="h-1.5 w-24 rounded-full bg-muted" />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Service Activity + Sales by Location + Performance */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>Service Activity</CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  <ChartContainer
                    config={{ a: { label: "Engine", color: "var(--chart-2)" }, b: { label: "Body", color: "#111" }, c: { label: "EV", color: "var(--chart-4)" }}}
                    className="h-[260px] w-full"
                  >
                    <BarChart data={serviceActivity} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis width={36} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                      <Bar dataKey="a" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="b" fill="#111" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="c" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>Sales by Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-6">
                    <ChartContainer config={{}} className="h-[220px] w-[220px] shrink-0">
                      <PieChart margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                        <Pie data={salesByLocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                          {salesByLocation.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <ul className="space-y-2 text-sm">
                      {salesByLocation.map((s) => (
                        <li key={s.name} className="flex items-center gap-2">
                          <span className="inline-block size-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-muted-foreground">{s.name}</span>
                          <span className="ml-2 tabular-nums">{s.value}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-start-1 lg:col-end-4 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>Sales Performance</CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  <ChartContainer
                    config={{ a: { label: "New", color: "var(--chart-2)" }, b: { label: "Used", color: "#111" }, c: { label: "EV", color: "var(--chart-4)" }}}
                    className="h-[260px] w-full"
                  >
                    <BarChart data={salesPerformance} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis width={36} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                      <Bar dataKey="a" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="b" fill="#111" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="c" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right rail - toggled by bell */}
          {showRightRail ? (
            <aside id="right-rail" className="space-y-4" aria-label="Notifications and activities">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {notifications.map((n, i) => (
                      <li key={i} className="text-sm">
                        <div className="font-medium">{n.title}</div>
                        <div className="text-muted-foreground">{n.time}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>Changed the style. • just now</li>
                    <li>Requested Quotation. • 59 minutes ago</li>
                    <li>Raised Service request. • 12 hours ago</li>
                    <li>Requested Report for XUV700 • Today, 11:59 AM</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Recent Interactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Natali Craig",
                      "Drew Cano",
                      "Andi Lane",
                      "Koray Okumus",
                      "Kate Morrison",
                      "Melody Macy",
                    ].map((name) => (
                      <li key={name} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="h-2 w-2 rounded-full bg-muted" />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </aside>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}