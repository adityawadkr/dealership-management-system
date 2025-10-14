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
import { CalendarCheck, Plus, Search, Clock, UserCheck, UserX, Edit } from "lucide-react"
import { toast } from "sonner"

interface Employee {
  id: number
  employee_code: string
  designation: string
  department: string
}

interface Attendance {
  id: number
  employee_id: number
  date: string
  check_in: string
  check_out: string | null
  status: string
  created_at: string
  employee?: Employee
}

export default function AttendancePage() {
  const { hasPermission, isLoading: rolesLoading } = useRoles()
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [formData, setFormData] = useState({
    employee_id: "",
    date: new Date().toISOString().split('T')[0],
    check_in: "",
    check_out: "",
    status: "present"
  })

  const canView = hasPermission("hr", "read")
  const canCreate = hasPermission("hr", "create")
  const canEdit = hasPermission("hr", "update")

  useEffect(() => {
    if (!rolesLoading && canView) {
      fetchAttendances()
      fetchEmployees()
    }
  }, [rolesLoading, canView])

  const fetchAttendances = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/attendance", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch attendances")
      const data = await res.json()
      setAttendances(data)
    } catch (error) {
      toast.error("Failed to load attendances")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      const url = editingAttendance ? `/api/attendance?id=${editingAttendance.id}` : "/api/attendance"
      const method = editingAttendance ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: parseInt(formData.employee_id),
          date: formData.date,
          check_in: formData.check_in,
          check_out: formData.check_out || null,
          status: formData.status
        })
      })

      if (!res.ok) throw new Error("Failed to save attendance")

      toast.success(editingAttendance ? "Attendance updated successfully" : "Attendance marked successfully")
      setIsDialogOpen(false)
      resetForm()
      fetchAttendances()
    } catch (error) {
      toast.error("Failed to save attendance")
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: "",
      date: new Date().toISOString().split('T')[0],
      check_in: "",
      check_out: "",
      status: "present"
    })
    setEditingAttendance(null)
  }

  const openEditDialog = (attendance: Attendance) => {
    setEditingAttendance(attendance)
    setFormData({
      employee_id: attendance.employee_id.toString(),
      date: attendance.date.split('T')[0],
      check_in: attendance.check_in,
      check_out: attendance.check_out || "",
      status: attendance.status
    })
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "present": "bg-green-500/10 text-green-500",
      "absent": "bg-red-500/10 text-red-500",
      "half-day": "bg-yellow-500/10 text-yellow-500",
      "leave": "bg-blue-500/10 text-blue-500"
    }
    return colors[status.toLowerCase()] || "bg-gray-500/10 text-gray-500"
  }

  const calculateWorkingHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "In Progress"
    
    const inTime = new Date(`1970-01-01T${checkIn}`)
    const outTime = new Date(`1970-01-01T${checkOut}`)
    const diff = outTime.getTime() - inTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  const filteredAttendances = attendances.filter(attendance =>
    attendance.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendance.date.includes(searchQuery)
  )

  const todayAttendances = attendances.filter(a => 
    a.date.split('T')[0] === new Date().toISOString().split('T')[0]
  )
  const presentToday = todayAttendances.filter(a => a.status === "present").length
  const absentToday = todayAttendances.filter(a => a.status === "absent").length

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
          <p className="text-muted-foreground">You don't have permission to view attendance.</p>
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
            <CalendarCheck className="h-8 w-8 text-primary" />
            Attendance Management
          </h1>
          <p className="text-muted-foreground mt-1">Track employee attendance and working hours</p>
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAttendance ? "Edit Attendance" : "Mark New Attendance"}</DialogTitle>
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
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="check_in">Check In Time *</Label>
                    <Input
                      id="check_in"
                      type="time"
                      value={formData.check_in}
                      onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_out">Check Out Time</Label>
                    <Input
                      id="check_out"
                      type="time"
                      value={formData.check_out}
                      onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                      <SelectItem value="leave">On Leave</SelectItem>
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
                    {editingAttendance ? "Update" : "Mark"} Attendance
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
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayAttendances.length > 0 
                ? Math.round((presentToday / todayAttendances.length) * 100)
                : 0}%
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
                placeholder="Search attendance by date or status..."
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
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendances.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell className="font-medium">Employee #{attendance.employee_id}</TableCell>
                    <TableCell>
                      {new Date(attendance.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {attendance.check_in}
                      </div>
                    </TableCell>
                    <TableCell>
                      {attendance.check_out ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {attendance.check_out}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not checked out</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {calculateWorkingHours(attendance.check_in, attendance.check_out)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(attendance.status)}>
                        {attendance.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(attendance)}>
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