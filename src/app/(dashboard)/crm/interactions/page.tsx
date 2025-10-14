"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRoles } from "@/hooks/use-roles"
import { MessageSquare, Plus, Search, Phone, Mail, Calendar, User } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  id: number
  name: string
  email: string
  phone: string
}

interface Interaction {
  id: number
  customer_id: number
  interaction_type: string
  notes: string
  contacted_by: string
  created_at: string
  customer?: Customer
}

export default function InteractionsPage() {
  const { hasPermission, isLoading: rolesLoading } = useRoles()
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: "",
    interaction_type: "",
    notes: "",
    contacted_by: ""
  })

  const canView = hasPermission("crm", "read")
  const canCreate = hasPermission("crm", "create")

  useEffect(() => {
    if (!rolesLoading && canView) {
      fetchInteractions()
      fetchCustomers()
    }
  }, [rolesLoading, canView])

  const fetchInteractions = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/customer-interactions", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch interactions")
      const data = await res.json()
      setInteractions(data)
    } catch (error) {
      toast.error("Failed to load interactions")
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
      if (!res.ok) throw new Error("Failed to fetch customers")
      const data = await res.json()
      setCustomers(data)
    } catch (error) {
      console.error("Failed to load customers")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/customer-interactions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          customer_id: parseInt(formData.customer_id)
        })
      })

      if (!res.ok) throw new Error("Failed to create interaction")

      toast.success("Interaction logged successfully")
      setIsDialogOpen(false)
      resetForm()
      fetchInteractions()
    } catch (error) {
      toast.error("Failed to log interaction")
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: "",
      interaction_type: "",
      notes: "",
      contacted_by: ""
    })
  }

  const getInteractionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      "call": "bg-blue-500/10 text-blue-500",
      "email": "bg-green-500/10 text-green-500",
      "meeting": "bg-purple-500/10 text-purple-500",
      "whatsapp": "bg-green-600/10 text-green-600",
      "visit": "bg-orange-500/10 text-orange-500",
      "follow-up": "bg-yellow-500/10 text-yellow-500"
    }
    return colors[type.toLowerCase()] || "bg-gray-500/10 text-gray-500"
  }

  const filteredInteractions = interactions.filter(interaction =>
    interaction.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    interaction.interaction_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    interaction.contacted_by.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <p className="text-muted-foreground">You don't have permission to view interactions.</p>
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
            <MessageSquare className="h-8 w-8 text-primary" />
            Customer Interactions
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage all customer communications</p>
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Interaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log New Interaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer *</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interaction_type">Interaction Type *</Label>
                  <Select value={formData.interaction_type} onValueChange={(value) => setFormData({ ...formData, interaction_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="visit">Showroom Visit</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contacted_by">Contacted By *</Label>
                  <Input
                    id="contacted_by"
                    value={formData.contacted_by}
                    onChange={(e) => setFormData({ ...formData, contacted_by: e.target.value })}
                    placeholder="Sales representative name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes *</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Conversation summary, follow-up actions, customer feedback..."
                    rows={5}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Log Interaction</Button>
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
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interactions.filter(i => {
                const date = new Date(i.created_at)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return date >= weekAgo
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interactions.filter(i => i.interaction_type.toLowerCase() === "call").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interactions.filter(i => i.interaction_type.toLowerCase() === "email").length}
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
                placeholder="Search interactions by notes, type, or contact..."
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
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contacted By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInteractions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No interactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInteractions.map((interaction) => (
                  <TableRow key={interaction.id}>
                    <TableCell className="text-sm">
                      {new Date(interaction.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Customer #{interaction.customer_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getInteractionTypeBadge(interaction.interaction_type)}>
                        {interaction.interaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{interaction.contacted_by}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-muted-foreground line-clamp-2">{interaction.notes}</p>
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