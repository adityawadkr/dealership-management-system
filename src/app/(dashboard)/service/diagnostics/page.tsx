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

export default function DiagnosticsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { hasPermission } = useRoles()
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    customerName: "",
    symptoms: "",
    findings: "",
    recommendations: "",
    technicianName: ""
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard/service/diagnostics")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session?.user) return
    if (!hasPermission('diagnostics', 'read')) {
      toast.error("You don't have permission to view diagnostics")
      router.push("/dashboard")
      return
    }
    fetchDiagnostics()
  }, [session, hasPermission])

  const fetchDiagnostics = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/diagnostics", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setDiagnostics(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error("Failed to load diagnostics")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPermission('diagnostics', 'create')) {
      toast.error("You don't have permission to create diagnostics")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle_number: formData.vehicleNumber,
          customer_name: formData.customerName,
          symptoms: formData.symptoms,
          findings: formData.findings,
          recommendations: formData.recommendations,
          technician_name: formData.technicianName
        })
      })

      if (response.ok) {
        toast.success("Diagnostic record created successfully")
        setIsCreateOpen(false)
        setFormData({
          vehicleNumber: "",
          customerName: "",
          symptoms: "",
          findings: "",
          recommendations: "",
          technicianName: ""
        })
        fetchDiagnostics()
      } else {
        toast.error("Failed to create diagnostic record")
      }
    } catch (error) {
      toast.error("Error creating diagnostic record")
    }
  }

  const filteredDiagnostics = diagnostics.filter(d =>
    d.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold">Vehicle Diagnostics</h1>
          <p className="text-muted-foreground">Record and track diagnostic assessments</p>
        </div>
        {hasPermission('diagnostics', 'create') && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                New Diagnostic
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Diagnostic Record</DialogTitle>
                <DialogDescription>Record vehicle diagnostic assessment</DialogDescription>
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
                    <Label htmlFor="symptoms">Symptoms Reported *</Label>
                    <Input
                      id="symptoms"
                      required
                      value={formData.symptoms}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      placeholder="Customer-reported issues..."
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="findings">Diagnostic Findings *</Label>
                    <Input
                      id="findings"
                      required
                      value={formData.findings}
                      onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                      placeholder="Technical assessment results..."
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="recommendations">Recommendations *</Label>
                    <Input
                      id="recommendations"
                      required
                      value={formData.recommendations}
                      onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                      placeholder="Recommended actions and repairs..."
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="technicianName">Technician Name *</Label>
                    <Input
                      id="technicianName"
                      required
                      value={formData.technicianName}
                      onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Record</Button>
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
              placeholder="Search diagnostics..."
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
          ) : filteredDiagnostics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No diagnostic records found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Recommendations</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiagnostics.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.vehicle_number}</TableCell>
                    <TableCell>{d.customer_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{d.symptoms}</TableCell>
                    <TableCell className="max-w-xs truncate">{d.findings}</TableCell>
                    <TableCell className="max-w-xs truncate">{d.recommendations}</TableCell>
                    <TableCell>{d.technician_name}</TableCell>
                    <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
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