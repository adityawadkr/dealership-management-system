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
import { Plus, Search, CheckCircle2, XCircle, Clock } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { toast } from "sonner"

export default function DeliveryPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { hasPermission } = useRoles()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    bookingId: "",
    rtoStatus: "pending",
    insuranceStatus: "pending",
    qcStatus: "pending"
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard/sales/delivery")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session?.user) return
    if (!hasPermission('deliveries', 'read')) {
      toast.error("You don't have permission to view deliveries")
      router.push("/dashboard")
      return
    }
    fetchData()
  }, [session, hasPermission])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const headers = { Authorization: `Bearer ${token}` }
      
      const [deliveriesRes, bookingsRes] = await Promise.all([
        fetch("/api/deliveries", { headers }),
        fetch("/api/bookings", { headers })
      ])

      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json()
        setDeliveries(Array.isArray(data) ? data : [])
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(Array.isArray(data) ? data.filter((b: any) => b.status === 'confirmed') : [])
      }
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPermission('deliveries', 'create')) {
      toast.error("You don't have permission to create deliveries")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: parseInt(formData.bookingId),
          rto_status: formData.rtoStatus,
          insurance_status: formData.insuranceStatus,
          qc_status: formData.qcStatus,
          status: "pending"
        })
      })

      if (response.ok) {
        toast.success("Delivery created successfully")
        setIsCreateOpen(false)
        setFormData({
          bookingId: "",
          rtoStatus: "pending",
          insuranceStatus: "pending",
          qcStatus: "pending"
        })
        fetchData()
      } else {
        toast.error("Failed to create delivery")
      }
    } catch (error) {
      toast.error("Error creating delivery")
    }
  }

  const updateField = async (id: number, field: string, value: string) => {
    if (!hasPermission('deliveries', 'update')) {
      toast.error("You don't have permission to update deliveries")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/deliveries/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        toast.success("Updated successfully")
        fetchData()
      } else {
        toast.error("Failed to update")
      }
    } catch (error) {
      toast.error("Error updating")
    }
  }

  const completeDelivery = async (id: number) => {
    const delivery = deliveries.find(d => d.id === id)
    if (delivery?.rto_status !== 'completed' || delivery?.insurance_status !== 'completed' || delivery?.qc_status !== 'completed') {
      toast.error("All statuses must be completed before marking delivery as complete")
      return
    }
    await updateField(id, 'status', 'completed')
  }

  const filteredDeliveries = deliveries.filter(delivery =>
    deliveries.some(d => d.id === delivery.id)
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="size-4 text-green-500" />
      case 'in_progress': return <Clock className="size-4 text-yellow-500" />
      case 'pending': return <XCircle className="size-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500'
      case 'in_progress': return 'bg-blue-500/10 text-blue-500'
      case 'completed': return 'bg-green-500/10 text-green-500'
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
          <h1 className="text-3xl font-bold">Delivery Management</h1>
          <p className="text-muted-foreground">Track RTO, insurance, QC, and vehicle handover</p>
        </div>
        {hasPermission('deliveries', 'create') && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                New Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Delivery</DialogTitle>
                <DialogDescription>Initiate delivery process for a booking</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingId">Booking *</Label>
                  <Select required value={formData.bookingId} onValueChange={(value) => setFormData({ ...formData, bookingId: value })}>
                    <SelectTrigger id="bookingId">
                      <SelectValue placeholder="Select booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id.toString()}>
                          {booking.customer_name} - {booking.vehicle_details}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rtoStatus">RTO Status</Label>
                  <Select value={formData.rtoStatus} onValueChange={(value) => setFormData({ ...formData, rtoStatus: value })}>
                    <SelectTrigger id="rtoStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceStatus">Insurance Status</Label>
                  <Select value={formData.insuranceStatus} onValueChange={(value) => setFormData({ ...formData, insuranceStatus: value })}>
                    <SelectTrigger id="insuranceStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qcStatus">QC Status</Label>
                  <Select value={formData.qcStatus} onValueChange={(value) => setFormData({ ...formData, qcStatus: value })}>
                    <SelectTrigger id="qcStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
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
              placeholder="Search deliveries..."
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
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deliveries found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>RTO</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>QC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">#{delivery.booking_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(delivery.rto_status)}
                        <span className="capitalize">{delivery.rto_status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(delivery.insurance_status)}
                        <span className="capitalize">{delivery.insurance_status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(delivery.qc_status)}
                        <span className="capitalize">{delivery.qc_status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasPermission('deliveries', 'update') && delivery.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => completeDelivery(delivery.id)}
                        >
                          Complete
                        </Button>
                      )}
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