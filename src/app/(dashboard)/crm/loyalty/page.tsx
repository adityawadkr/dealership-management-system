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
import { Award, Plus, Search, TrendingUp, Users, Gift, Edit } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  id: number
  name: string
  email: string
  phone: string
}

interface LoyaltyProgram {
  id: number
  customer_id: number
  points: number
  tier: string
  created_at: string
  updated_at: string
  customer?: Customer
}

export default function LoyaltyPage() {
  const { hasPermission, isLoading: rolesLoading } = useRoles()
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null)
  const [formData, setFormData] = useState({
    customer_id: "",
    points: "0",
    tier: "bronze"
  })
  const [editFormData, setEditFormData] = useState({
    points: "0",
    tier: "bronze"
  })

  const canView = hasPermission("crm", "read")
  const canCreate = hasPermission("crm", "create")
  const canEdit = hasPermission("crm", "update")

  useEffect(() => {
    if (!rolesLoading && canView) {
      fetchLoyaltyPrograms()
      fetchCustomers()
    }
  }, [rolesLoading, canView])

  const fetchLoyaltyPrograms = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/loyalty-programs", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch loyalty programs")
      const data = await res.json()
      setLoyaltyPrograms(data)
    } catch (error) {
      toast.error("Failed to load loyalty programs")
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
      const res = await fetch("/api/loyalty-programs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          points: parseInt(formData.points),
          tier: formData.tier
        })
      })

      if (!res.ok) throw new Error("Failed to enroll customer")

      toast.success("Customer enrolled in loyalty program")
      setIsDialogOpen(false)
      resetForm()
      fetchLoyaltyPrograms()
    } catch (error) {
      toast.error("Failed to enroll customer")
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProgram) return

    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch(`/api/loyalty-programs?id=${editingProgram.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          points: parseInt(editFormData.points),
          tier: editFormData.tier
        })
      })

      if (!res.ok) throw new Error("Failed to update loyalty program")

      toast.success("Loyalty program updated successfully")
      setIsEditDialogOpen(false)
      setEditingProgram(null)
      fetchLoyaltyPrograms()
    } catch (error) {
      toast.error("Failed to update loyalty program")
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: "",
      points: "0",
      tier: "bronze"
    })
  }

  const openEditDialog = (program: LoyaltyProgram) => {
    setEditingProgram(program)
    setEditFormData({
      points: program.points.toString(),
      tier: program.tier
    })
    setIsEditDialogOpen(true)
  }

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      "bronze": "bg-orange-500/10 text-orange-600",
      "silver": "bg-gray-500/10 text-gray-600",
      "gold": "bg-yellow-500/10 text-yellow-600",
      "platinum": "bg-purple-500/10 text-purple-600"
    }
    return colors[tier.toLowerCase()] || "bg-gray-500/10 text-gray-600"
  }

  const filteredPrograms = loyaltyPrograms.filter(program =>
    program.tier.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPoints = loyaltyPrograms.reduce((sum, p) => sum + p.points, 0)
  const avgPoints = loyaltyPrograms.length > 0 ? Math.round(totalPoints / loyaltyPrograms.length) : 0

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
          <p className="text-muted-foreground">You don't have permission to view loyalty programs.</p>
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
            <Award className="h-8 w-8 text-primary" />
            Loyalty Programs
          </h1>
          <p className="text-muted-foreground mt-1">Manage customer loyalty points and tiers</p>
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Enroll Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enroll Customer in Loyalty Program</DialogTitle>
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
                  <Label htmlFor="tier">Initial Tier *</Label>
                  <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Initial Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Enroll Customer</Button>
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
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyaltyPrograms.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPoints.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platinum Members</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loyaltyPrograms.filter(p => p.tier === "platinum").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {["bronze", "silver", "gold", "platinum"].map((tier) => {
              const count = loyaltyPrograms.filter(p => p.tier === tier).length
              const percentage = loyaltyPrograms.length > 0 ? Math.round((count / loyaltyPrograms.length) * 100) : 0
              return (
                <div key={tier} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getTierBadge(tier)}>{tier.toUpperCase()}</Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tier..."
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
                <TableHead>Customer ID</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No loyalty program members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">Customer #{program.customer_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{program.points.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierBadge(program.tier)}>
                        {program.tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(program.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(program.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(program)}>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Loyalty Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_points">Points</Label>
              <Input
                id="edit_points"
                type="number"
                value={editFormData.points}
                onChange={(e) => setEditFormData({ ...editFormData, points: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_tier">Tier</Label>
              <Select value={editFormData.tier} onValueChange={(value) => setEditFormData({ ...editFormData, tier: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Program</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}