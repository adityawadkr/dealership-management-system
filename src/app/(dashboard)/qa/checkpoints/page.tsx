"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle2, AlertCircle, Clock, Plus, Filter, Search } from "lucide-react"
import { toast } from "sonner"

type Checkpoint = {
  id: number
  checkpoint_name: string
  module: string
  description: string | null
  status: "pending" | "in_progress" | "completed" | "failed"
  assigned_to: number | null
  assigned_to_name?: string
  created_at: string
  updated_at: string
}

export default function QACheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    checkpoint_name: "",
    module: "",
    description: "",
    status: "pending" as const,
  })

  useEffect(() => {
    fetchCheckpoints()
  }, [])

  const fetchCheckpoints = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/qa-checkpoints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error("Failed to fetch checkpoints")
      
      const data = await response.json()
      setCheckpoints(data.checkpoints || [])
    } catch (error) {
      toast.error("Failed to load QA checkpoints")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCheckpoint = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/qa-checkpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create checkpoint")

      toast.success("QA checkpoint created successfully")
      setIsDialogOpen(false)
      setFormData({
        checkpoint_name: "",
        module: "",
        description: "",
        status: "pending",
      })
      fetchCheckpoints()
    } catch (error) {
      toast.error("Failed to create checkpoint")
      console.error(error)
    }
  }

  const handleUpdateStatus = async (id: number, status: Checkpoint["status"]) => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/qa-checkpoints", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      })

      if (!response.ok) throw new Error("Failed to update checkpoint")

      toast.success("Checkpoint status updated")
      fetchCheckpoints()
    } catch (error) {
      toast.error("Failed to update checkpoint")
      console.error(error)
    }
  }

  const filteredCheckpoints = checkpoints.filter((checkpoint) => {
    const matchesSearch = checkpoint.checkpoint_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checkpoint.module.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || checkpoint.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Checkpoint["status"]) => {
    switch (status) {
      case "completed": return "bg-green-500"
      case "in_progress": return "bg-blue-500"
      case "failed": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: Checkpoint["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="size-4" />
      case "failed": return <AlertCircle className="size-4" />
      default: return <Clock className="size-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QA Checkpoints</h1>
          <p className="text-muted-foreground">Manage quality assurance checkpoints and tracking</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Create Checkpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create QA Checkpoint</DialogTitle>
              <DialogDescription>Add a new quality assurance checkpoint</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkpoint_name">Checkpoint Name</Label>
                <Input
                  id="checkpoint_name"
                  value={formData.checkpoint_name}
                  onChange={(e) => setFormData({ ...formData, checkpoint_name: e.target.value })}
                  placeholder="e.g., Pre-Delivery Inspection"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module">Module</Label>
                <Select
                  value={formData.module}
                  onValueChange={(value) => setFormData({ ...formData, module: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter checkpoint details..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Checkpoint["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateCheckpoint} className="w-full">
                Create Checkpoint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Search checkpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Checkpoints List */}
      <div className="grid gap-4">
        {filteredCheckpoints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No checkpoints found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCheckpoints.map((checkpoint) => (
            <Card key={checkpoint.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{checkpoint.checkpoint_name}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {checkpoint.module}
                      </Badge>
                    </div>
                    <CardDescription>{checkpoint.description || "No description"}</CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(checkpoint.status)} text-white gap-1`}>
                    {getStatusIcon(checkpoint.status)}
                    {checkpoint.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(checkpoint.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={checkpoint.status}
                      onValueChange={(value: Checkpoint["status"]) => handleUpdateStatus(checkpoint.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}