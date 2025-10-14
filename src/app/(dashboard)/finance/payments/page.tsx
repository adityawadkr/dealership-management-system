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
import { Plus, Search, CreditCard, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function PaymentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: "",
    paymentMode: "cash",
    transactionId: "",
    paymentDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session) {
      fetchPayments()
      fetchInvoices()
    }
  }, [session])

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/payments", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (error) {
      toast.error("Failed to fetch payments")
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/invoices", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.filter((inv: any) => inv.status === "pending"))
      }
    } catch (error) {
      console.error("Failed to fetch invoices")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceId: parseInt(formData.invoiceId),
          amount: parseFloat(formData.amount),
          paymentMode: formData.paymentMode,
          transactionId: formData.transactionId || null,
          paymentDate: formData.paymentDate,
          status: "completed"
        })
      })

      if (res.ok) {
        toast.success("Payment recorded")
        setIsDialogOpen(false)
        resetForm()
        fetchPayments()
        fetchInvoices()
      } else {
        toast.error("Operation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const resetForm = () => {
    setFormData({
      invoiceId: "",
      amount: "",
      paymentMode: "cash",
      transactionId: "",
      paymentDate: new Date().toISOString().split('T')[0]
    })
  }

  const filteredPayments = payments.filter(p =>
    p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCollected = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const paymentModeBreakdown = payments.reduce((acc: any, p) => {
    if (p.status === "completed") {
      acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.amount
    }
    return acc
  }, {})

  if (isPending || loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Track and manage payment transactions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalCollected.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(paymentModeBreakdown.cash || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(paymentModeBreakdown.card || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">UPI/Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{((paymentModeBreakdown.upi || 0) + (paymentModeBreakdown.bank_transfer || 0)).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>View and record all payments</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>Enter payment details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Invoice</Label>
                    <Select value={formData.invoiceId} onValueChange={(v) => setFormData({ ...formData, invoiceId: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select invoice" />
                      </SelectTrigger>
                      <SelectContent>
                        {invoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id.toString()}>
                            {invoice.invoiceNumber} - ₹{invoice.totalAmount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={formData.paymentMode} onValueChange={(v) => setFormData({ ...formData, paymentMode: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Transaction ID (Optional)</Label>
                    <Input
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      placeholder="TXN123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Date</Label>
                    <Input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Record Payment</Button>
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
                placeholder="Search by transaction ID..."
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
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                    const invoice = invoices.find(inv => inv.id === payment.invoiceId) || 
                                  { invoiceNumber: `INV-${payment.invoiceId}` }
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">{payment.transactionId || "N/A"}</TableCell>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell className="font-semibold">₹{payment.amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            <CreditCard className="size-3 mr-1" />
                            {payment.paymentMode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {payment.status}
                          </Badge>
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