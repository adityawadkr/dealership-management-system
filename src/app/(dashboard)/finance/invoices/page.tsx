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
import { Plus, Search, Eye, Download, FileText } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function InvoicesPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerId: "",
    bookingId: "",
    amount: "",
    taxAmount: "",
    taxRate: "18"
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session) {
      fetchInvoices()
      fetchCustomers()
      fetchBookings()
    }
  }, [session])

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/invoices", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch (error) {
      toast.error("Failed to fetch invoices")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/customers", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Failed to fetch customers")
    }
  }

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch (error) {
      console.error("Failed to fetch bookings")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      const amount = parseFloat(formData.amount)
      const taxRate = parseFloat(formData.taxRate)
      const taxAmount = (amount * taxRate) / 100
      const totalAmount = amount + taxAmount
      
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: parseInt(formData.customerId),
          bookingId: formData.bookingId ? parseInt(formData.bookingId) : null,
          amount,
          taxAmount,
          totalAmount,
          status: "pending"
        })
      })

      if (res.ok) {
        toast.success("Invoice created")
        setIsDialogOpen(false)
        resetForm()
        fetchInvoices()
      } else {
        toast.error("Operation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const updateInvoiceStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch(`/api/invoices?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success(`Invoice ${status}`)
        fetchInvoices()
      }
    } catch (error) {
      toast.error("Failed to update invoice")
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: "",
      bookingId: "",
      amount: "",
      taxAmount: "",
      taxRate: "18"
    })
  }

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = invoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

  const pendingAmount = invoices
    .filter(inv => inv.status === "pending")
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)

  const statusCounts = invoices.reduce((acc: any, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1
    return acc
  }, {})

  if (isPending || loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">Manage billing and invoices</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{pendingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.paid || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices List</CardTitle>
              <CardDescription>View and manage all invoices</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invoice</DialogTitle>
                  <DialogDescription>Enter invoice details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Booking (Optional)</Label>
                    <Select value={formData.bookingId} onValueChange={(v) => setFormData({ ...formData, bookingId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookings.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id.toString()}>
                            Booking #{booking.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (excluding tax)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      required
                    />
                  </div>
                  {formData.amount && formData.taxRate && (
                    <div className="text-sm text-muted-foreground">
                      <div>Tax Amount: ₹{((parseFloat(formData.amount) * parseFloat(formData.taxRate)) / 100).toFixed(2)}</div>
                      <div className="font-semibold">Total: ₹{(parseFloat(formData.amount) + (parseFloat(formData.amount) * parseFloat(formData.taxRate)) / 100).toFixed(2)}</div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="submit">Create Invoice</Button>
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
                placeholder="Search by invoice number..."
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
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const customer = customers.find(c => c.id === invoice.customerId)
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{customer?.name || "N/A"}</TableCell>
                        <TableCell>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>₹{invoice.amount?.toLocaleString()}</TableCell>
                        <TableCell>₹{invoice.taxAmount?.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">₹{invoice.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            invoice.status === "paid" ? "default" :
                            invoice.status === "cancelled" ? "destructive" : "outline"
                          }>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {invoice.status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                              >
                                Mark Paid
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Download className="size-4" />
                            </Button>
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