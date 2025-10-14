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
import { Plus, Search, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function LoansPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [loans, setLoans] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerId: "",
    bookingId: "",
    loanAmount: "",
    interestRate: "",
    tenure: "",
    bankName: "",
    loanAccountNumber: "",
    approvalDate: "",
    disbursementDate: "",
    emiAmount: ""
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session) {
      fetchLoans()
      fetchCustomers()
      fetchBookings()
    }
  }, [session])

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/loans", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setLoans(data)
      }
    } catch (error) {
      toast.error("Failed to fetch loans")
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
      
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: parseInt(formData.customerId),
          bookingId: formData.bookingId ? parseInt(formData.bookingId) : null,
          loanAmount: parseFloat(formData.loanAmount),
          interestRate: parseFloat(formData.interestRate),
          tenure: parseInt(formData.tenure),
          bankName: formData.bankName,
          loanAccountNumber: formData.loanAccountNumber,
          approvalDate: formData.approvalDate || null,
          disbursementDate: formData.disbursementDate || null,
          emiAmount: formData.emiAmount ? parseFloat(formData.emiAmount) : null,
          status: "pending"
        })
      })

      if (res.ok) {
        toast.success("Loan application recorded")
        setIsDialogOpen(false)
        resetForm()
        fetchLoans()
      } else {
        toast.error("Operation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const updateLoanStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch(`/api/loans?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success(`Loan ${status}`)
        fetchLoans()
      }
    } catch (error) {
      toast.error("Failed to update loan")
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: "",
      bookingId: "",
      loanAmount: "",
      interestRate: "",
      tenure: "",
      bankName: "",
      loanAccountNumber: "",
      approvalDate: "",
      disbursementDate: "",
      emiAmount: ""
    })
  }

  const filteredLoans = loans.filter(loan =>
    loan.loanAccountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.bankName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalLoanAmount = loans
    .filter(l => l.status === "approved" || l.status === "disbursed")
    .reduce((sum, l) => sum + (l.loanAmount || 0), 0)

  const statusCounts = loans.reduce((acc: any, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {})

  if (isPending || loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Loans & Financing</h1>
        <p className="text-muted-foreground">Manage customer loan applications and financing</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Financed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalLoanAmount.toLocaleString()}</div>
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
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Loan Applications</CardTitle>
              <CardDescription>View and manage all loan applications</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  New Loan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Loan Application</DialogTitle>
                  <DialogDescription>Enter loan details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label>Loan Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.loanAmount}
                        onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interest Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.interestRate}
                        onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tenure (months)</Label>
                      <Input
                        type="number"
                        value={formData.tenure}
                        onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Loan Account Number</Label>
                      <Input
                        value={formData.loanAccountNumber}
                        onChange={(e) => setFormData({ ...formData, loanAccountNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>EMI Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.emiAmount}
                        onChange={(e) => setFormData({ ...formData, emiAmount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Approval Date</Label>
                      <Input
                        type="date"
                        value={formData.approvalDate}
                        onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disbursement Date</Label>
                      <Input
                        type="date"
                        value={formData.disbursementDate}
                        onChange={(e) => setFormData({ ...formData, disbursementDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Loan</Button>
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
                placeholder="Search by account number or bank..."
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Tenure</TableHead>
                  <TableHead>EMI</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No loans found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoans.map((loan) => {
                    const customer = customers.find(c => c.id === loan.customerId)
                    return (
                      <TableRow key={loan.id}>
                        <TableCell>{customer?.name || "N/A"}</TableCell>
                        <TableCell>{loan.bankName}</TableCell>
                        <TableCell className="font-semibold">₹{loan.loanAmount?.toLocaleString()}</TableCell>
                        <TableCell>{loan.interestRate}%</TableCell>
                        <TableCell>{loan.tenure} months</TableCell>
                        <TableCell>₹{loan.emiAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            loan.status === "disbursed" ? "default" :
                            loan.status === "approved" ? "secondary" :
                            loan.status === "rejected" ? "destructive" : "outline"
                          }>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {loan.status === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateLoanStatus(loan.id, "approved")}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateLoanStatus(loan.id, "rejected")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {loan.status === "approved" && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => updateLoanStatus(loan.id, "disbursed")}
                              >
                                Mark Disbursed
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