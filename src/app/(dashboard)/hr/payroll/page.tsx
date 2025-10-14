"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRoles } from "@/hooks/use-roles"
import { Wallet, Plus, Search, DollarSign, Calendar, TrendingUp, Edit } from "lucide-react"
import { toast } from "sonner"

interface Employee {
  id: number
  employee_code: string
  designation: string
  department: string
}

interface Payroll {
  id: number
  employee_id: number
  month: number
  year: number
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: string
  created_at: string
  employee?: Employee
}

export default function PayrollPage() {
  const { hasPermission, isLoading: rolesLoading } = useRoles()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [formData, setFormData] = useState({
    employee_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basic_salary: "",
    allowances: "",
    deductions: "",
    status: "pending"
  })

  const canView = hasPermission("hr", "read")
  const canCreate = hasPermission("hr", "create")
  const canEdit = hasPermission("hr", "update")

  useEffect(() => {
    if (!rolesLoading && canView) {
      fetchPayrolls()
      fetchEmployees()
    }
  }, [rolesLoading, canView])

  const fetchPayrolls = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/payroll", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch payrolls")
      const data = await res.json()
      setPayrolls(data)
    } catch (error) {
      toast.error("Failed to load payrolls")
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch employees")
      const data = await res.json()
      setEmployees(data)
    } catch (error) {
      console.error("Failed to load employees")
    }
  }

  const calculateNetSalary = () => {
    const basic = parseFloat(formData.basic_salary) || 0
    const allowances = parseFloat(formData.allowances) || 0
    const deductions = parseFloat(formData.deductions) || 0
    return basic + allowances - deductions
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      const netSalary = calculateNetSalary()
      const url = editingPayroll ? `/api/payroll?id=${editingPayroll.id}` : "/api/payroll"
      const method = editingPayroll ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: parseInt(formData.employee_id),
          month: formData.month,
          year: formData.year,
          basic_salary: parseFloat(formData.basic_salary),
          allowances: parseFloat(formData.allowances),
          deductions: parseFloat(formData.deductions),
          net_salary: netSalary,
          status: formData.status
        })
      })

      if (!res.ok) throw new Error("Failed to save payroll")

      toast.success(editingPayroll ? "Payroll updated successfully" : "Payroll created successfully")
      setIsDialogOpen(false)
      resetForm()
      fetchPayrolls()
    } catch (error) {
      toast.error("Failed to save payroll")
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basic_salary: "",
      allowances: "",
      deductions: "",
      status: "pending"
    })
    setEditingPayroll(null)
  }

  const openEditDialog = (payroll: Payroll) => {
    setEditingPayroll(payroll)
    setFormData({
      employee_id: payroll.employee_id.toString(),
      month: payroll.month,
      year: payroll.year,
      basic_salary: payroll.basic_salary.toString(),
      allowances: payroll.allowances.toString(),
      deductions: payroll.deductions.toString(),
      status: payroll.status
    })
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "pending": "bg-yellow-500/10 text-yellow-500",
      "processed": "bg-green-500/10 text-green-500",
      "failed": "bg-red-500/10 text-red-500"
    }
    return colors[status.toLowerCase()] || "bg-gray-500/10 text-gray-500"
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const filteredPayrolls = payrolls.filter(payroll =>
    payroll.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPayout = payrolls.reduce((sum, p) => sum + p.net_salary, 0)
  const currentMonthPayout = payrolls.filter(p => 
    p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear()
  ).reduce((sum, p) => sum + p.net_salary, 0)

  if (rolesLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have permission to view payroll.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            Payroll Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage employee salaries and payments</p>
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPayroll ? "Edit Payroll" : "Process New Payroll"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee *</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.employee_code} - {employee.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month *</Label>
                    <Select value={formData.month.toString()} onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basic_salary">Basic Salary *</Label>
                  <Input
                    id="basic_salary"
                    type="number"
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                    placeholder="50000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowances">Allowances</Label>
                  <Input
                    id="allowances"
                    type="number"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Deductions</Label>
                  <Input
                    id="deductions"
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Net Salary</Label>
                  <div className="text-2xl font-bold text-primary">
                    ₹{calculateNetSalary().toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPayroll ? "Update" : "Process"} Payroll
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payrolls</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPayout.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentMonthPayout.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrolls.filter(p => p.status === "processed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payrolls by status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No payroll records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">Employee #{payroll.employee_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{months[payroll.month - 1]} {payroll.year}</span>
                      </div>
                    </TableCell>
                    <TableCell>₹{payroll.basic_salary.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">+₹{payroll.allowances.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">-₹{payroll.deductions.toLocaleString()}</TableCell>
                    <TableCell className="font-bold">₹{payroll.net_salary.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(payroll.status)}>
                        {payroll.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(payroll)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}