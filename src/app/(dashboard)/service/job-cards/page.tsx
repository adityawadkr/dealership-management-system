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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function JobCardsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const { hasPermission } = useRoles()
  const [jobCards, setJobCards] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    appointmentId: "",
    vehicleNumber: "",
    customerName: "",
    serviceAdvisor: "",
    technician: "",
    issuesReported: "",
    workPerformed: "",
    partsUsed: ""
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/dashboard/service/job-cards")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!session?.user) return
    if (!hasPermission('jobCards', 'read')) {
      toast.error("You don't have permission to view job cards")
      router.push("/dashboard")
      return
    }
    fetchData()
  }, [session, hasPermission])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const headers = { Authorization: `Bearer ${token}` }
      
      const [jobCardsRes, appointmentsRes] = await Promise.all([
        fetch("/api/job-cards", { headers }),
        fetch("/api/appointments", { headers })
      ])

      if (jobCardsRes.ok) {
        const data = await jobCardsRes.json()
        setJobCards(Array.isArray(data) ? data : [])
      }
      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json()
        setAppointments(Array.isArray(data) ? data.filter((a: any) => a.status === 'in_progress' || a.status === 'scheduled') : [])
      }
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPermission('jobCards', 'create')) {
      toast.error("You don't have permission to create job cards")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/job-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          appointment_id: formData.appointmentId ? parseInt(formData.appointmentId) : null,
          vehicle_number: formData.vehicleNumber,
          customer_name: formData.customerName,
          service_advisor: formData.serviceAdvisor,
          technician: formData.technician,
          issues_reported: formData.issuesReported,
          work_performed: formData.workPerformed,
          parts_used: formData.partsUsed,
          status: "open"
        })
      })

      if (response.ok) {
        toast.success("Job card created successfully")
        setIsCreateOpen(false)
        setFormData({
          appointmentId: "",
          vehicleNumber: "",
          customerName: "",
          serviceAdvisor: "",
          technician: "",
          issuesReported: "",
          workPerformed: "",
          partsUsed: ""
        })
        fetchData()
      } else {
        toast.error("Failed to create job card")
      }
    } catch (error) {
      toast.error("Error creating job card")
    }
  }

  const updateStatus = async (id: number, status: string) => {
    if (!hasPermission('jobCards', 'update')) {
      toast.error("You don't have permission to update job cards")
      return
    }

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success("Status updated successfully")
        fetchData()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
    }
  }

  const filteredJobCards = jobCards.filter(jc =>
    jc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jc.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-500'
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-500'
      case 'completed': return 'bg-green-500/10 text-green-500'
      case 'closed': return 'bg-gray-500/10 text-gray-500'
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
          <h1 className="text-3xl font-bold">Job Cards</h1>
          <p className="text-muted-foreground">Manage service job cards and work orders</p>
        </div>
        {hasPermission('jobCards', 'create') && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                New Job Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Job Card</DialogTitle>
                <DialogDescription>Create a new service job card</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentId">Appointment (Optional)</Label>
                    <Select value={formData.appointmentId} onValueChange={(value) => setFormData({ ...formData, appointmentId: value })}>
                      <SelectTrigger id="appointmentId">
                        <SelectValue placeholder="Select appointment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {appointments.map((apt) => (
                          <SelectItem key={apt.id} value={apt.id.toString()}>
                            {apt.customer_name} - {apt.vehicle_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="serviceAdvisor">Service Advisor *</Label>
                    <Input
                      id="serviceAdvisor"
                      required
                      value={formData.serviceAdvisor}
                      onChange={(e) => setFormData({ ...formData, serviceAdvisor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="technician">Technician *</Label>
                    <Input
                      id="technician"
                      required
                      value={formData.technician}
                      onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuesReported">Issues Reported</Label>
                  <Input
                    id="issuesReported"
                    value={formData.issuesReported}
                    onChange={(e) => setFormData({ ...formData, issuesReported: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workPerformed">Work Performed</Label>
                  <Input
                    id="workPerformed"
                    value={formData.workPerformed}
                    onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partsUsed">Parts Used</Label>
                  <Input
                    id="partsUsed"
                    value={formData.partsUsed}
                    onChange={(e) => setFormData({ ...formData, partsUsed: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Job Card</Button>
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
              placeholder="Search job cards..."
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
          ) : filteredJobCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No job cards found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Advisor</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobCards.map((jc) => (
                  <TableRow key={jc.id}>
                    <TableCell className="font-medium">{jc.vehicle_number}</TableCell>
                    <TableCell>{jc.customer_name}</TableCell>
                    <TableCell>{jc.service_advisor}</TableCell>
                    <TableCell>{jc.technician}</TableCell>
                    <TableCell className="max-w-xs truncate">{jc.issues_reported || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(jc.status)}>
                        {jc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('jobCards', 'update') && jc.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(jc.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        {hasPermission('jobCards', 'update') && jc.status === 'in_progress' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(jc.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        {hasPermission('jobCards', 'update') && jc.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(jc.id, 'closed')}
                          >
                            Close
                          </Button>
                        )}
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