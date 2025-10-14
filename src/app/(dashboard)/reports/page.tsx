"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRoles } from "@/hooks/use-roles"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Car, 
  Wrench,
  Download,
  Calendar,
  PieChart,
  Activity
} from "lucide-react"
import { toast } from "sonner"

interface DashboardMetrics {
  sales: {
    totalLeads: number
    convertedLeads: number
    totalBookings: number
    totalRevenue: number
  }
  service: {
    totalAppointments: number
    completedJobCards: number
    serviceRevenue: number
    avgRepairTime: number
  }
  inventory: {
    totalVehicles: number
    soldVehicles: number
    spareParts: number
    lowStockAlerts: number
  }
  finance: {
    totalInvoices: number
    paidInvoices: number
    pendingPayments: number
    totalPayout: number
  }
  crm: {
    totalCustomers: number
    loyaltyMembers: number
    campaignsActive: number
    interactions: number
  }
  hr: {
    totalEmployees: number
    activeEmployees: number
    presentToday: number
    payrollProcessed: number
  }
}

export default function ReportsPage() {
  const { hasPermission, isLoading: rolesLoading } = useRoles()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  const canView = hasPermission("reports", "read")

  useEffect(() => {
    if (!rolesLoading && canView) {
      fetchMetrics()
    }
  }, [rolesLoading, canView, timeRange])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("bearer_token")
      
      // Fetch all data in parallel
      const [
        leads,
        bookings,
        invoices,
        appointments,
        jobCards,
        vehicles,
        spareParts,
        customers,
        loyalty,
        campaigns,
        interactions,
        employees,
        attendance,
        payroll
      ] = await Promise.all([
        fetch("/api/leads", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/invoices", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/appointments", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/job-cards", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/vehicles", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/spare-parts", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/customers", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/loyalty-programs", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/campaigns", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/customer-interactions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/employees", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/attendance", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch("/api/payroll", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
      ])

      const today = new Date().toISOString().split('T')[0]
      const todayAttendance = Array.isArray(attendance) ? attendance.filter((a: any) => a.date.split('T')[0] === today) : []

      setMetrics({
        sales: {
          totalLeads: Array.isArray(leads) ? leads.length : 0,
          convertedLeads: Array.isArray(leads) ? leads.filter((l: any) => l.status === "converted").length : 0,
          totalBookings: Array.isArray(bookings) ? bookings.length : 0,
          totalRevenue: Array.isArray(invoices) ? invoices.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0) : 0
        },
        service: {
          totalAppointments: Array.isArray(appointments) ? appointments.length : 0,
          completedJobCards: Array.isArray(jobCards) ? jobCards.filter((j: any) => j.status === "completed").length : 0,
          serviceRevenue: Array.isArray(invoices) ? invoices.filter((i: any) => i.type === "service").reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0) : 0,
          avgRepairTime: 3.5
        },
        inventory: {
          totalVehicles: Array.isArray(vehicles) ? vehicles.length : 0,
          soldVehicles: Array.isArray(vehicles) ? vehicles.filter((v: any) => v.status === "sold").length : 0,
          spareParts: Array.isArray(spareParts) ? spareParts.length : 0,
          lowStockAlerts: Array.isArray(spareParts) ? spareParts.filter((p: any) => p.quantity <= p.reorder_point).length : 0
        },
        finance: {
          totalInvoices: Array.isArray(invoices) ? invoices.length : 0,
          paidInvoices: Array.isArray(invoices) ? invoices.filter((i: any) => i.status === "paid").length : 0,
          pendingPayments: Array.isArray(invoices) ? invoices.filter((i: any) => i.status === "pending").reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0) : 0,
          totalPayout: Array.isArray(payroll) ? payroll.reduce((sum: number, p: any) => sum + (p.net_salary || 0), 0) : 0
        },
        crm: {
          totalCustomers: Array.isArray(customers) ? customers.length : 0,
          loyaltyMembers: Array.isArray(loyalty) ? loyalty.length : 0,
          campaignsActive: Array.isArray(campaigns) ? campaigns.filter((c: any) => c.status === "active").length : 0,
          interactions: Array.isArray(interactions) ? interactions.length : 0
        },
        hr: {
          totalEmployees: Array.isArray(employees) ? employees.length : 0,
          activeEmployees: Array.isArray(employees) ? employees.filter((e: any) => e.status === "active").length : 0,
          presentToday: Array.isArray(todayAttendance) ? todayAttendance.filter((a: any) => a.status === "present").length : 0,
          payrollProcessed: Array.isArray(payroll) ? payroll.filter((p: any) => p.status === "processed").length : 0
        }
      })
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
      toast.error("Failed to load report metrics")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (type: string) => {
    toast.success(`Exporting ${type} report...`)
    // In a real implementation, this would generate and download a report file
  }

  if (rolesLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have permission to view reports.</p>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport("comprehensive")}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Sales Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Sales Performance
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sales.totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.sales.convertedLeads} converted
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.sales.totalLeads > 0 
                  ? Math.round((metrics.sales.convertedLeads / metrics.sales.totalLeads) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lead to booking</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sales.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sales Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{metrics.sales.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total sales value</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Service Operations
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.service.totalAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled services</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.service.completedJobCards}</div>
              <p className="text-xs text-muted-foreground mt-1">Finished repairs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Service Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{metrics.service.serviceRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Service income</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Repair Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.service.avgRepairTime} days</div>
              <p className="text-xs text-muted-foreground mt-1">Average turnaround</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inventory & Finance */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Inventory Status
          </h2>
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vehicle Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.inventory.totalVehicles}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.inventory.soldVehicles} sold
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Spare Parts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.inventory.spareParts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.inventory.lowStockAlerts} low stock alerts
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Financial Overview
          </h2>
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.finance.totalInvoices}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.finance.paidInvoices} paid
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{metrics.finance.pendingPayments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding amount</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CRM & HR */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Customer Relations
          </h2>
          <div className="grid gap-4 grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.crm.totalCustomers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Loyalty Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.crm.loyaltyMembers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.crm.campaignsActive}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.crm.interactions}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Human Resources
          </h2>
          <div className="grid gap-4 grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.hr.totalEmployees}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.hr.activeEmployees}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.hr.presentToday}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Payroll Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.hr.payrollProcessed}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" onClick={() => exportReport("sales")}>
              <Download className="h-4 w-4 mr-2" />
              Sales Report
            </Button>
            <Button variant="outline" onClick={() => exportReport("service")}>
              <Download className="h-4 w-4 mr-2" />
              Service Report
            </Button>
            <Button variant="outline" onClick={() => exportReport("financial")}>
              <Download className="h-4 w-4 mr-2" />
              Financial Report
            </Button>
            <Button variant="outline" onClick={() => exportReport("inventory")}>
              <Download className="h-4 w-4 mr-2" />
              Inventory Report
            </Button>
            <Button variant="outline" onClick={() => exportReport("hr")}>
              <Download className="h-4 w-4 mr-2" />
              HR Report
            </Button>
            <Button variant="outline" onClick={() => exportReport("crm")}>
              <Download className="h-4 w-4 mr-2" />
              CRM Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Missing Clock import
import { Clock } from "lucide-react"