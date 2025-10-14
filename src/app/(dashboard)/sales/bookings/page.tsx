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
import { Plus, Search } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { toast } from "sonner"

export default function BookingsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { hasPermission } = useRoles()
  const [bookings, setBookings] = useState<any[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    quotationId: "",
    customerName: "",
    vehicleDetails: "",
    amount: "",
    bookingDate: "",
    paymentMode: "bank_transfer"
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard/sales/bookings")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session?.user) return
    if (!hasPermission('bookings', 'read')) {
      toast.error("You don't have permission to view bookings")
      router.push("/dashboard")
      return
    }
    fetchData()
  }, [session, hasPermission])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const headers = { Authorization: `Bearer ${token}` }
      
      const [bookingsRes, quotationsRes] = await Promise.all([
        fetch("/api/bookings", { headers }),
        fetch("/api/quotations", { headers })
      ])

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(Array.isArray(data) ? data : [])
      }
      if (quotationsRes.ok) {
        const data = await quotationsRes.json()
        setQuotations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPermission('bookings', 'create')) {
      toast.error("You don't have permission to create bookings")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quotation_id: formData.quotationId ? parseInt(formData.quotationId) : null,
          customer_name: formData.customerName,
          vehicle_details: formData.vehicleDetails,
          amount: parseFloat(formData.amount),
          booking_date: formData.bookingDate,
          payment_mode: formData.paymentMode,
          status: "pending"
        })
      })

      if (response.ok) {
        toast.success("Booking created successfully")
        setIsCreateOpen(false)
        setFormData({
          quotationId: "",
          customerName: "",
          vehicleDetails: "",
          amount: "",
          bookingDate: "",
          paymentMode: "bank_transfer"
        })
        fetchData()
      } else {
        toast.error("Failed to create booking")
      }
    } catch (error) {
      toast.error("Error creating booking")
    }
  }

  const updateStatus = async (id: number, status: string) => {
    if (!hasPermission('bookings', 'update')) {
      toast.error("You don't have permission to update bookings")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/bookings/${id}`, {
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

  const filteredBookings = bookings.filter(booking =>
    booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.vehicle_details?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500'
      case 'confirmed': return 'bg-blue-500/10 text-blue-500'
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
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage vehicle bookings and orders</p>
        </div>
        {hasPermission('bookings', 'create') && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Booking</DialogTitle>
                <DialogDescription>Create a new vehicle booking</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quotationId">Quotation (Optional)</Label>
                  <Select value={formData.quotationId} onValueChange={(value) => setFormData({ ...formData, quotationId: value })}>
                    <SelectTrigger id="quotationId">
                      <SelectValue placeholder="Select quotation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {quotations.map((q) => (
                        <SelectItem key={q.id} value={q.id.toString()}>
                          {q.customer_name} - ₹{parseInt(q.total_amount).toLocaleString()}
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
                  <Label htmlFor="vehicleDetails">Vehicle Details *</Label>
                  <Input
                    id="vehicleDetails"
                    required
                    value={formData.vehicleDetails}
                    onChange={(e) => setFormData({ ...formData, vehicleDetails: e.target.value })}
                    placeholder="e.g., Toyota Camry 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bookingDate">Booking Date *</Label>
                  <Input
                    id="bookingDate"
                    type="date"
                    required
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode *</Label>
                  <Select required value={formData.paymentMode} onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}>
                    <SelectTrigger id="paymentMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Booking</Button>
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
              placeholder="Search bookings..."
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
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.customer_name}</TableCell>
                    <TableCell>{booking.vehicle_details}</TableCell>
                    <TableCell>₹{parseInt(booking.amount).toLocaleString()}</TableCell>
                    <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{booking.payment_mode?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('bookings', 'update') && booking.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(booking.id, 'confirmed')}
                          >
                            Confirm
                          </Button>
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