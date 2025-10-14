"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { toast } from "sonner"

export default function TestDrivesPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { hasPermission } = useRoles()
  const [testDrives, setTestDrives] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    leadId: "",
    customerName: "",
    vehicleId: "",
    scheduledDate: "",
    slot: "morning",
    licenseVerified: false
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard/sales/test-drives")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session?.user) return
    if (!hasPermission('testDrives', 'read')) {
      toast.error("You don't have permission to view test drives")
      router.push("/dashboard")
      return
    }
    fetchData()
  }, [session, hasPermission])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const headers = { Authorization: `Bearer ${token}` }
      
      const [testDrivesRes, leadsRes, vehiclesRes] = await Promise.all([
        fetch("/api/test-drives", { headers }),
        fetch("/api/leads", { headers }),
        fetch("/api/vehicles", { headers })
      ])

      if (testDrivesRes.ok) {
        const data = await testDrivesRes.json()
        setTestDrives(Array.isArray(data) ? data : [])
      }
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(Array.isArray(data) ? data : [])
      }
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json()
        setVehicles(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPermission('testDrives', 'create')) {
      toast.error("You don't have permission to create test drives")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/test-drives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_id: formData.leadId ? parseInt(formData.leadId) : null,
          customer_name: formData.customerName,
          vehicle_id: parseInt(formData.vehicleId),
          scheduled_date: formData.scheduledDate,
          slot: formData.slot,
          license_verified: formData.licenseVerified,
          status: "scheduled"
        })
      })

      if (response.ok) {
        toast.success("Test drive scheduled successfully")
        setIsCreateOpen(false)
        setFormData({
          leadId: "",
          customerName: "",
          vehicleId: "",
          scheduledDate: "",
          slot: "morning",
          licenseVerified: false
        })
        fetchData()
      } else {
        toast.error("Failed to schedule test drive")
      }
    } catch (error) {
      toast.error("Error scheduling test drive")
    }
  }

  const updateStatus = async (id: number, status: string) => {
    if (!hasPermission('testDrives', 'update')) {
      toast.error("You don't have permission to update test drives")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/test-drives/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success("Status updated successfully")
        fetchData()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
    }
  }

  const filteredTestDrives = testDrives.filter(td =>
    td.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-500'
      case 'completed': return 'bg-green-500/10 text-green-500'
      case 'cancelled': return 'bg-red-500/10 text-red-500'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Drives</h1>
          <p className="text-muted-foreground">Manage test drive bookings and schedules</p>
        </div>
        {hasPermission('testDrives', 'create') && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                Schedule Test Drive
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule Test Drive</DialogTitle>
                <DialogDescription>Book a test drive for a customer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leadId">Lead (Optional)</Label>
                  <Select value={formData.leadId} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>
                    <SelectTrigger id="leadId">
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id.toString()}>
                          {lead.customer_name} - {lead.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleId">Vehicle *</Label>
                  <Select required value={formData.vehicleId} onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}>
                    <SelectTrigger id="vehicleId">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.make} {vehicle.model} ({vehicle.vin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot">Time Slot *</Label>
                  <Select required value={formData.slot} onValueChange={(value) => setFormData({ ...formData, slot: value })}>
                    <SelectTrigger id="slot">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                      <SelectItem value="evening">Evening (4 PM - 7 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="licenseVerified"
                    checked={formData.licenseVerified}
                    onChange={(e) => setFormData({ ...formData, licenseVerified: e.target.checked })}
                    className="rounded border-input"
                  />
                  <Label htmlFor="licenseVerified" className="cursor-pointer">
                    License Verified
                  </Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Schedule</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search test drives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredTestDrives.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No test drives scheduled
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTestDrives.map((td) => (
                  <TableRow key={td.id}>
                    <TableCell className="font-medium">{td.customer_name}</TableCell>
                    <TableCell>Vehicle #{td.vehicle_id}</TableCell>
                    <TableCell>{new Date(td.scheduled_date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{td.slot}</TableCell>
                    <TableCell>
                      {td.license_verified ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                      ) : (
                        <XCircle className="size-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(td.status)}>
                        {td.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('testDrives', 'update') && td.status === 'scheduled' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus(td.id, 'completed')}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus(td.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}