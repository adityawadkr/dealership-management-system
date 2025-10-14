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
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function SparePartsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<any>(null)
  const [formData, setFormData] = useState({
    partNumber: "",
    name: "",
    category: "",
    quantity: "",
    unitPrice: "",
    reorderPoint: "",
    vendorId: "",
    status: "available"
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session) {
      fetchSpareParts()
      fetchVendors()
    }
  }, [session])

  const fetchSpareParts = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/spare-parts", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSpareParts(data)
      }
    } catch (error) {
      toast.error("Failed to fetch spare parts")
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/vendors", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setVendors(data)
      }
    } catch (error) {
      console.error("Failed to fetch vendors")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      const method = editingPart ? "PUT" : "POST"
      const url = editingPart ? `/api/spare-parts?id=${editingPart.id}` : "/api/spare-parts"
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          reorderPoint: parseInt(formData.reorderPoint),
          vendorId: formData.vendorId ? parseInt(formData.vendorId) : null
        })
      })

      if (res.ok) {
        toast.success(editingPart ? "Part updated" : "Part added")
        setIsDialogOpen(false)
        resetForm()
        fetchSpareParts()
      } else {
        toast.error("Operation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this spare part?")) return
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch(`/api/spare-parts?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success("Part deleted")
        fetchSpareParts()
      }
    } catch (error) {
      toast.error("Failed to delete")
    }
  }

  const resetForm = () => {
    setFormData({
      partNumber: "",
      name: "",
      category: "",
      quantity: "",
      unitPrice: "",
      reorderPoint: "",
      vendorId: "",
      status: "available"
    })
    setEditingPart(null)
  }

  const openEditDialog = (part: any) => {
    setEditingPart(part)
    setFormData({
      partNumber: part.partNumber || "",
      name: part.name || "",
      category: part.category || "",
      quantity: part.quantity?.toString() || "",
      unitPrice: part.unitPrice?.toString() || "",
      reorderPoint: part.reorderPoint?.toString() || "",
      vendorId: part.vendorId?.toString() || "",
      status: part.status || "available"
    })
    setIsDialogOpen(true)
  }

  const filteredParts = spareParts.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockParts = spareParts.filter(p => p.quantity <= p.reorderPoint)
  const totalValue = spareParts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0)

  if (isPending || loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Spare Parts Inventory</h1>
        <p className="text-muted-foreground">Manage spare parts stock and suppliers</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spareParts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockParts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spareParts.reduce((sum, p) => sum + p.quantity, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {lowStockParts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              <CardTitle className="text-red-900">Low Stock Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockParts.slice(0, 5).map((part) => (
                <div key={part.id} className="flex items-center justify-between text-sm">
                  <span className="text-red-900">{part.name} ({part.partNumber})</span>
                  <Badge variant="destructive">{part.quantity} left</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parts List</CardTitle>
              <CardDescription>View and manage all spare parts</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add Part
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPart ? "Edit Part" : "Add New Part"}</DialogTitle>
                  <DialogDescription>Enter spare part details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Part Number</Label>
                      <Input
                        value={formData.partNumber}
                        onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reorder Point</Label>
                      <Input
                        type="number"
                        value={formData.reorderPoint}
                        onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Select value={formData.vendorId} onValueChange={(v) => setFormData({ ...formData, vendorId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id.toString()}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          <SelectItem value="discontinued">Discontinued</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingPart ? "Update" : "Add"} Part
                    </Button>
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
                placeholder="Search by name, part number, or category..."
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
                  <TableHead>Part Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No spare parts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-mono text-sm">{part.partNumber}</TableCell>
                      <TableCell>{part.name}</TableCell>
                      <TableCell>{part.category}</TableCell>
                      <TableCell>
                        <span className={part.quantity <= part.reorderPoint ? "text-red-600 font-semibold" : ""}>
                          {part.quantity}
                        </span>
                      </TableCell>
                      <TableCell>₹{part.unitPrice?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          part.status === "available" ? "default" :
                          part.status === "out_of_stock" ? "destructive" : "secondary"
                        }>
                          {part.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(part)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(part.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
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