"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Users, Wrench, TrendingUp, DollarSign, Package, Calendar, AlertCircle } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { hasPermission } = useRoles()
  const [stats, setStats] = useState({
    leads: 0,
    vehicles: 0,
    appointments: 0,
    revenue: 0,
    pendingDeliveries: 0,
    spareParts: 0,
    activeBookings: 0,
    pendingQuotations: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session?.user) return

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("bearer_token")
        const headers = { Authorization: `Bearer ${token}` }

        const [leadsRes, vehiclesRes, appointmentsRes, bookingsRes, quotationsRes, deliveriesRes, partsRes] = await Promise.all([
          hasPermission('leads', 'read') ? fetch("/api/leads", { headers }) : Promise.resolve(null),
          hasPermission('vehicles', 'read') ? fetch("/api/vehicles", { headers }) : Promise.resolve(null),
          hasPermission('appointments', 'read') ? fetch("/api/appointments", { headers }) : Promise.resolve(null),
          hasPermission('bookings', 'read') ? fetch("/api/bookings", { headers }) : Promise.resolve(null),
          hasPermission('quotations', 'read') ? fetch("/api/quotations", { headers }) : Promise.resolve(null),
          hasPermission('deliveries', 'read') ? fetch("/api/deliveries", { headers }) : Promise.resolve(null),
          hasPermission('spareParts', 'read') ? fetch("/api/spare-parts", { headers }) : Promise.resolve(null)
        ])

        const leads = leadsRes ? await leadsRes.json() : []
        const vehicles = vehiclesRes ? await vehiclesRes.json() : []
        const appointments = appointmentsRes ? await appointmentsRes.json() : []
        const bookings = bookingsRes ? await bookingsRes.json() : []
        const quotations = quotationsRes ? await quotationsRes.json() : []
        const deliveries = deliveriesRes ? await deliveriesRes.json() : []
        const parts = partsRes ? await partsRes.json() : []

        const activeBookings = Array.isArray(bookings) ? bookings.filter((b: any) => b.status === 'confirmed' || b.status === 'pending') : []
        const pendingDeliveries = Array.isArray(deliveries) ? deliveries.filter((d: any) => d.status === 'pending' || d.status === 'in_progress') : []
        const revenue = Array.isArray(bookings) ? bookings.reduce((sum: number, b: any) => sum + (parseFloat(b.amount) || 0), 0) : 0

        setStats({
          leads: Array.isArray(leads) ? leads.length : 0,
          vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
          appointments: Array.isArray(appointments) ? appointments.length : 0,
          revenue,
          pendingDeliveries: pendingDeliveries.length,
          spareParts: Array.isArray(parts) ? parts.length : 0,
          activeBookings: activeBookings.length,
          pendingQuotations: Array.isArray(quotations) ? quotations.filter((q: any) => q.status === 'pending').length : 0
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [session, hasPermission])

  if (isPending || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {hasPermission('leads', 'read') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.leads}</div>
                <p className="text-xs text-muted-foreground">Sales pipeline</p>
              </CardContent>
            </Card>
          )}

          {hasPermission('vehicles', 'read') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vehicles}</div>
                <p className="text-xs text-muted-foreground">In inventory</p>
              </CardContent>
            </Card>
          )}

          {hasPermission('appointments', 'read') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.appointments}</div>
                <p className="text-xs text-muted-foreground">Service scheduled</p>
              </CardContent>
            </Card>
          )}

          {hasPermission('bookings', 'read') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total bookings</p>
              </CardContent>
            </Card>
          )}

          {hasPermission('bookings', 'read') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeBookings}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
          )}

          {hasPermission('deliveries', 'read') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
                <p className="text-xs text-muted-foreground">Awaiting handover</p>
              </CardContent>
            </Card>
          )}

          {hasPermission('spareParts', 'read') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spare Parts</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.spareParts}</div>
                <p className="text-xs text-muted-foreground">In stock</p>
              </CardContent>
            </Card>
          )}

          {hasPermission('quotations', 'read') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotations</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingQuotations}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {hasPermission('leads', 'create') && (
              <a href="/dashboard/sales/leads" className="text-sm hover:underline">→ Create New Lead</a>
            )}
            {hasPermission('appointments', 'create') && (
              <a href="/dashboard/service/appointments" className="text-sm hover:underline">→ Schedule Service Appointment</a>
            )}
            {hasPermission('vehicles', 'create') && (
              <a href="/dashboard/inventory/vehicles" className="text-sm hover:underline">→ Add Vehicle to Inventory</a>
            )}
            {hasPermission('quotations', 'create') && (
              <a href="/dashboard/sales/quotations" className="text-sm hover:underline">→ Generate Quotation</a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}