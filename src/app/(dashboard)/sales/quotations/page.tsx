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
import { Plus, Search, FileText } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { toast } from "sonner"

export default function QuotationsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { hasPermission } = useRoles()
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    vehicleDetails: "",
    basePrice: "",
    discount: "",
    taxAmount: "",
    totalAmount: "",
    validUntil: ""
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard/sales/quotations")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session?.user) return
    if (!hasPermission('quotations', 'read')) {
      toast.error("You don't have permission to view quotations")
      router.push("/dashboard")
      return
    }
    fetchQuotations()
  }, [session, hasPermission])

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/quotations", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setQuotations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error("Failed to load quotations")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPermission('quotations', 'create')) {
      toast.error("You don't have permission to create quotations")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          vehicle_details: formData.vehicleDetails,
          base_price: parseFloat(formData.basePrice),
          discount: formData.discount ? parseFloat(formData.discount) : 0,
          tax_amount: parseFloat(formData.taxAmount),
          total_amount: parseFloat(formData.totalAmount),
          valid_until: formData.validUntil,
          status: "pending"
        })
      })

      if (response.ok) {
        toast.success("Quotation created successfully")
        setIsCreateOpen(false)
        setFormData({
          customerName: "",
          email: "",
          phone: "",
          vehicleDetails: "",
          basePrice: "",
          discount: "",
          taxAmount: "",
          totalAmount: "",
          validUntil: ""
        })
        fetchQuotations()
      } else {
        toast.error("Failed to create quotation")
      }
    } catch (error) {
      toast.error("Error creating quotation")
    }
  }

  const updateStatus = async (id: number, status: string) => {
    if (!hasPermission('quotations', 'update')) {
      toast.error("You don't have permission to update quotations")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success("Status updated successfully")
        fetchQuotations()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
    }
  }

  const calculateTotal = () => {
    const base = parseFloat(formData.basePrice) || 0
    const disc = parseFloat(formData.discount) || 0
    const tax = parseFloat(formData.taxAmount) || 0
    const total = base - disc + tax
    setFormData({ ...formData, totalAmount: total.toFixed(2) })
  }

  const filteredQuotations = quotations.filter(q =>
    q.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.vehicle_details?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500'
      case 'approved': return 'bg-green-500/10 text-green-500'
      case 'rejected': return 'bg-red-500/10 text-red-500'
      case 'expired': return 'bg-gray-500/10 text-gray-500'
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
          <h1 className="text-3xl font-bold">Quotations</h1>
          <p className="text-muted-foreground">Generate and manage sales quotations</p>
        </div>
        {hasPermission('quotations', 'create') && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                New Quotation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Quotation</DialogTitle>
                <DialogDescription>Generate a new sales quotation</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="vehicleDetails">Vehicle Details *</Label>
                    <Input
                      id="vehicleDetails"
                      required
                      value={formData.vehicleDetails}
                      onChange={(e) => setFormData({ ...formData, vehicleDetails: e.target.value })}
                      placeholder="e.g., Honda City 2024 VX CVT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price (₹) *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      required
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      onBlur={calculateTotal}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (₹)</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      onBlur={calculateTotal}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">Tax Amount (₹) *</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      required
                      value={formData.taxAmount}
                      onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                      onBlur={calculateTotal}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Amount (₹) *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      required
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
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
              placeholder="Search quotations..."
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
              No quotations found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">{quotation.customer_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{quotation.phone}</div>
                        {quotation.email && <div className="text-muted-foreground">{quotation.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{quotation.vehicle_details}</TableCell>
                    <TableCell>₹{parseInt(quotation.total_amount).toLocaleString()}</TableCell>
                    <TableCell>{new Date(quotation.valid_until).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quotation.status)}>
                        {quotation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('quotations', 'update') && quotation.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus(quotation.id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus(quotation.id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm">
                          <FileText className="size-4" />
                        </Button>
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