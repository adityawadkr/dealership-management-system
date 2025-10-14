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
import { Plus, Search, Edit, Trash2, Car, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { hasPermission } from "@/lib/rbac"

export default function VehiclesPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<any>(null)
  const [formData, setFormData] = useState({
    vin: "",
    make: "",
    model: "",
    year: "",
    color: "",
    price: "",
    status: "available",
    mileage: "",
    fuelType: "petrol",
    transmission: "manual",
    location: ""
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session) {
      fetchVehicles()
    }
  }, [session])

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch("/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setVehicles(data)
      }
    } catch (error) {
      toast.error("Failed to fetch vehicles")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("bearer_token")
      const method = editingVehicle ? "PUT" : "POST"
      const url = editingVehicle ? `/api/vehicles?id=${editingVehicle.id}` : "/api/vehicles"
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year),
          price: parseFloat(formData.price),
          mileage: parseInt(formData.mileage)
        })
      })

      if (res.ok) {
        toast.success(editingVehicle ? "Vehicle updated" : "Vehicle added")
        setIsDialogOpen(false)
        resetForm()
        fetchVehicles()
      } else {
        toast.error("Operation failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this vehicle?")) return
    try {
      const token = localStorage.getItem("bearer_token")
      const res = await fetch(`/api/vehicles?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success("Vehicle deleted")
        fetchVehicles()
      }
    } catch (error) {
      toast.error("Failed to delete")
    }
  }

  const resetForm = () => {
    setFormData({
      vin: "",
      make: "",
      model: "",
      year: "",
      color: "",
      price: "",
      status: "available",
      mileage: "",
      fuelType: "petrol",
      transmission: "manual",
      location: ""
    })
    setEditingVehicle(null)
  }

  const openEditDialog = (vehicle: any) => {
    setEditingVehicle(vehicle)
    setFormData({
      vin: vehicle.vin || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year?.toString() || "",
      color: vehicle.color || "",
      price: vehicle.price?.toString() || "",
      status: vehicle.status || "available",
      mileage: vehicle.mileage?.toString() || "",
      fuelType: vehicle.fuelType || "petrol",
      transmission: vehicle.transmission || "manual",
      location: vehicle.location || ""
    })
    setIsDialogOpen(true)
  }

  const filteredVehicles = vehicles.filter(v =>
    v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vin?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusCounts = vehicles.reduce((acc: any, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1
    return acc
  }, {})

  if (isPending || loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vehicle Inventory</h1>
        <p className="text-muted-foreground">Manage vehicle stock and availability</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.available || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.sold || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.reserved || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vehicle List</CardTitle>
              <CardDescription>View and manage all vehicles</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
                  <DialogDescription>Enter vehicle details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>VIN</Label>
                      <Input
                        value={formData.vin}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Make</Label>
                      <Input
                        value={formData.make}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mileage</Label>
                      <Input
                        type="number"
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="in_service">In Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fuel Type</Label>
                      <Select value={formData.fuelType} onValueChange={(v) => setFormData({ ...formData, fuelType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="petrol">Petrol</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Transmission</Label>
                      <Select value={formData.transmission} onValueChange={(v) => setFormData({ ...formData, transmission: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="automatic">Automatic</SelectItem>
                          <SelectItem value="cvt">CVT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Location</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingVehicle ? "Update" : "Add"} Vehicle
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
                placeholder="Search by make, model, or VIN..."
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
                  <TableHead>VIN</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No vehicles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-mono text-sm">{vehicle.vin}</TableCell>
                      <TableCell>{vehicle.make}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>₹{vehicle.price?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          vehicle.status === "available" ? "default" :
                          vehicle.status === "sold" ? "secondary" : "outline"
                        }>
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(vehicle)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(vehicle.id)}>
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