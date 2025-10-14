"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { toast } from "sonner"

export default function ServiceQuotationsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { hasPermission } = useRoles()
  const [serviceQuotations, setServiceQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    customerName: "",
    serviceDetails: "",
    laborCost: "",
    partsCost: "",
    totalCost: "",
    validUntil: ""
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard/service/service-quotations")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session?.user) return
    if (!hasPermission('serviceQuotations', 'read')) {
      toast.error("You don't have permission to view service quotations")
      router.push("/dashboard")
      return
    }
    fetchServiceQuotations()
  }, [session, hasPermission])

  const fetchServiceQuotations = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/service-quotations", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setServiceQuotations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error("Failed to load service quotations")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPermission('serviceQuotations', 'create')) {
      toast.error("You don't have permission to create service quotations")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/service-quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_number: formData.vehicleNumber,
          customer_name: formData.customerName,
          service_details: formData.serviceDetails,
          labor_cost: parseFloat(formData.laborCost),
          parts_cost: parseFloat(formData.partsCost),
          total_cost: parseFloat(formData.totalCost),
          valid_until: formData.validUntil,
          status: "pending"
        })
      })

      if (response.ok) {
        toast.success("Service quotation created successfully")
        setIsCreateOpen(false)
        setFormData({
          vehicleNumber: "",
          customerName: "",
          serviceDetails: "",
          laborCost: "",
          partsCost: "",
          totalCost: "",
          validUntil: ""
        })
        fetchServiceQuotations()
      } else {
        toast.error("Failed to create service quotation")
      }
    } catch (error) {
      toast.error("Error creating service quotation")
    }
  }

  const updateStatus = async (id: number, status: string) => {
    if (!hasPermission('serviceQuotations', 'update')) {
      toast.error("You don't have permission to update service quotations")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/service-quotations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success("Status updated successfully")
        fetchServiceQuotations()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
    }
  }

  const calculateTotal = () => {
    const labor = parseFloat(formData.laborCost) || 0
    const parts = parseFloat(formData.partsCost) || 0
    const total = labor + parts
    setFormData({ ...formData, totalCost: total.toFixed(2) })
  }

  const filteredQuotations = serviceQuotations.filter(sq =>
    sq.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sq.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500'
      case 'approved': return 'bg-green-500/10 text-green-500'
      case 'rejected': return 'bg-red-500/10 text-red-500'
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
          <h1 className="text-3xl font-bold">Service Quotations</h1>
          <p className="text-muted-foreground">Generate and manage service estimates</p>
        </div>
        {hasPermission('serviceQuotations', 'create') && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                New Quotation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Service Quotation</DialogTitle>
                <DialogDescription>Generate a service estimate</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                    <Input
                      id="vehicleNumber"
                      required
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    />
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
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="serviceDetails">Service Details *</Label>
                    <Input
                      id="serviceDetails"
                      required
                      value={formData.serviceDetails}
                      onChange={(e) => setFormData({ ...formData, serviceDetails: e.target.value })}
                      placeholder="Describe the service work..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="laborCost">Labor Cost (₹) *</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      required
                      value={formData.laborCost}
                      onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                      onBlur={calculateTotal}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partsCost">Parts Cost (₹) *</Label>
                    <Input
                      id="partsCost"
                      type="number"
                      required
                      value={formData.partsCost}
                      onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
                      onBlur={calculateTotal}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalCost">Total Cost (₹) *</Label>
                    <Input
                      id="totalCost"
                      type="number"
                      required
                      value={formData.totalCost}
                      onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until *</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      required
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Quotation</Button>
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
              placeholder="Search service quotations..."
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
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No service quotations found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Details</TableHead>
                  <TableHead>Labor</TableHead>
                  <TableHead>Parts</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((sq) => (
                  <TableRow key={sq.id}>
                    <TableCell className="font-medium">{sq.vehicle_number}</TableCell>
                    <TableCell>{sq.customer_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{sq.service_details}</TableCell>
                    <TableCell>₹{parseInt(sq.labor_cost).toLocaleString()}</TableCell>
                    <TableCell>₹{parseInt(sq.parts_cost).toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">₹{parseInt(sq.total_cost).toLocaleString()}</TableCell>
                    <TableCell>{new Date(sq.valid_until).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(sq.status)}>
                        {sq.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasPermission('serviceQuotations', 'update') && sq.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(sq.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(sq.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
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