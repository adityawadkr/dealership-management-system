"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Eye, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function PurchaseOrdersPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    vendorId: "",
    items: "",
    expectedDate: "",
    notes: ""
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session) {
      fetchOrders()
      fetchVendors()
      fetchSpareParts()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/purchase-orders", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      toast.error("Failed to fetch purchase orders")
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/vendors", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setVendors(data)
      }
    } catch (error) {
      console.error("Failed to fetch vendors")
    }
  }

  const fetchSpareParts = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/spare-parts", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSpareParts(data)
      }
    } catch (error) {
      console.error("Failed to fetch spare parts")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: parseInt(formData.vendorId),
          itemsJson: formData.items,
          expectedDate: formData.expectedDate,
          status: "pending"
        })
      })

      if (res.ok) {
        toast.success("Purchase order created")
        setIsDialogOpen(false)
        resetForm()
        fetchOrders()
      } else {
        toast.error("Operation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch(`/api/purchase-orders?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success(`Order ${status}`)
        fetchOrders()
      }
    } catch (error) {
      toast.error("Failed to update order")
    }
  }

  const resetForm = () => {
    setFormData({
      vendorId: "",
      items: "",
      expectedDate: "",
      notes: ""
    })
  }

  const filteredOrders = orders.filter(o =>
    o.poNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusCounts = orders.reduce((acc: any, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  if (isPending || loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <p className="text-muted-foreground">Manage purchase orders and stock replenishment</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.approved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchase Orders List</CardTitle>
              <CardDescription>View and manage all purchase orders</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Create PO
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Purchase Order</DialogTitle>
                  <DialogDescription>Enter purchase order details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Select value={formData.vendorId} onValueChange={(v) => setFormData({ ...formData, vendorId: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Items (JSON format)</Label>
                    <Textarea
                      value={formData.items}
                      onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                      placeholder='[{"partId": 1, "quantity": 10, "price": 500}]'
                      rows={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Delivery Date</Label>
                    <Input
                      type="date"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Order</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by PO number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const vendor = vendors.find(v => v.id === order.vendorId)
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.poNumber}</TableCell>
                        <TableCell>{vendor?.name || "N/A"}</TableCell>
                        <TableCell>{order.orderedDate ? new Date(order.orderedDate).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>₹{order.totalAmount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === "completed" ? "default" :
                            order.status === "approved" ? "secondary" : "outline"
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order.status === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateOrderStatus(order.id, "approved")}
                                >
                                  <CheckCircle className="size-4 text-green-600" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateOrderStatus(order.id, "cancelled")}
                                >
                                  <XCircle className="size-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            {order.status === "approved" && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => updateOrderStatus(order.id, "completed")}
                              >
                                <CheckCircle className="size-4 text-green-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}