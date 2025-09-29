"use client"

import * as React from "react"
import { Users, ShieldCheck, Briefcase } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

 type Employee = {
  id: string
  name: string
  department: string
  role: string
  status: "active" | "inactive"
}

const initialEmployees: Employee[] = [
  { id: "e1", name: "Alex Mason", department: "Service", role: "Technician", status: "active" },
  { id: "e2", name: "Sarah Lee", department: "Sales", role: "Sales Exec", status: "active" },
  { id: "e3", name: "John Kim", department: "Accounts", role: "Accountant", status: "inactive" },
]

export default function AdminPage() {
  const [rows, setRows] = React.useState(initialEmployees)
  const [q, setQ] = React.useState("")
  const [dept, setDept] = React.useState("all")

  const filtered = rows.filter((r) => {
    const matchQ = !q || r.name.toLowerCase().includes(q.toLowerCase())
    const matchD = dept === "all" || r.department === dept
    return matchQ && matchD
  })

  function onAdd(fd: FormData) {
    const next: Employee = {
      id: Math.random().toString(36).slice(2),
      name: String(fd.get("name") || ""),
      department: String(fd.get("department") || "Sales"),
      role: String(fd.get("role") || ""),
      status: "active",
    }
    setRows((p) => [next, ...p])
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-5"/> HR & Admin</div>

      <Card>
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
          <CardDescription>Manage headcount and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onAdd} className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="md:col-span-2">
              <Label>Department</Label>
              <Select name="department" defaultValue="Sales">
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Accounts">Accounts</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" required />
            </div>
            <div className="md:col-span-6 flex justify-end">
              <button className="border rounded-md h-9 px-3 text-sm">Save</button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="size-4"/> Employees</CardTitle>
          <CardDescription>Filter by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 pb-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name" className="w-60" />
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Accounts">Accounts</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}