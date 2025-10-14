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
import { Plus, Search, TrendingUp, TrendingDown, Book } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function LedgerPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    accountType: "revenue",
    entryType: "credit",
    amount: "",
    description: "",
    reference: "",
    category: ""
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session) {
      fetchEntries()
    }
  }, [session])

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/ledger-entries", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
    } catch (error) {
      toast.error("Failed to fetch ledger entries")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      
      const res = await fetch("/api/ledger-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          entryDate: formData.entryDate,
          accountType: formData.accountType,
          entryType: formData.entryType,
          amount: parseFloat(formData.amount),
          description: formData.description,
          reference: formData.reference || null,
          category: formData.category || null
        })
      })

      if (res.ok) {
        toast.success("Ledger entry created")
        setIsDialogOpen(false)
        resetForm()
        fetchEntries()
      } else {
        toast.error("Operation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const resetForm = () => {
    setFormData({
      entryDate: new Date().toISOString().split('T')[0],
      accountType: "revenue",
      entryType: "credit",
      amount: "",
      description: "",
      reference: "",
      category: ""
    })
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === "all" || entry.entryType === filterType
    
    return matchesSearch && matchesFilter
  })

  const totalCredits = entries
    .filter(e => e.entryType === "credit")
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  const totalDebits = entries
    .filter(e => e.entryType === "debit")
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  const balance = totalCredits - totalDebits

  const accountTypeBreakdown = entries.reduce((acc: any, e) => {
    if (!acc[e.accountType]) {
      acc[e.accountType] = { credit: 0, debit: 0 }
    }
    if (e.entryType === "credit") {
      acc[e.accountType].credit += e.amount || 0
    } else {
      acc[e.accountType].debit += e.amount || 0
    }
    return acc
  }, {})

  if (isPending || loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">General Ledger</h1>
        <p className="text-muted-foreground">Track all financial transactions and account balances</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                ₹{totalCredits.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <div className="flex items-center gap-2">
                <TrendingDown className="size-5" />
                ₹{totalDebits.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{balance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(accountTypeBreakdown).map(([type, values]: [string, any]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">{type}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits:</span>
                  <span className="text-green-600 font-semibold">₹{values.credit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debits:</span>
                  <span className="text-red-600 font-semibold">₹{values.debit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">Net:</span>
                  <span className={`font-semibold ${(values.credit - values.debit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(values.credit - values.debit).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ledger Entries</CardTitle>
              <CardDescription>View all financial transactions</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Ledger Entry</DialogTitle>
                  <DialogDescription>Record a financial transaction</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Entry Date</Label>
                      <Input
                        type="date"
                        value={formData.entryDate}
                        onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Select value={formData.accountType} onValueChange={(v) => setFormData({ ...formData, accountType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="liability">Liability</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Entry Type</Label>
                      <Select value={formData.entryType} onValueChange={(v) => setFormData({ ...formData, entryType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">Credit (+)</SelectItem>
                          <SelectItem value="debit">Debit (-)</SelectItem>
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
                    <div className="space-y-2 col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reference (Optional)</Label>
                      <Input
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        placeholder="Invoice #, PO #, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category (Optional)</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Sales, Payroll, etc."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Entry</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by description, reference, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credits Only</SelectItem>
                <SelectItem value="debit">Debits Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No ledger entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.entryDate ? new Date(entry.entryDate).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell className="capitalize">{entry.accountType}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.reference || "—"}</TableCell>
                      <TableCell>
                        {entry.category && (
                          <Badge variant="outline">{entry.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.entryType === "credit" ? "default" : "destructive"}>
                          {entry.entryType === "credit" ? (
                            <TrendingUp className="size-3 mr-1" />
                          ) : (
                            <TrendingDown className="size-3 mr-1" />
                          )}
                          {entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${entry.entryType === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {entry.entryType === "credit" ? "+" : "-"}₹{entry.amount?.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}