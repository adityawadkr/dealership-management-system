"use client"

import * as React from "react"
import { Plus, Pencil, Search, AlertTriangle, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock vehicle type
type Vehicle = {
  id: number
  vin: string
  make: string
  model: string
  year: number
  category: string
  color: string
  price: number
  stock: number
  reorderPoint: number
  status: "in_stock" | "reserved" | "sold"
}

export default function VehicleInventoryPage() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState<string>("all")
  const [status, setStatus] = React.useState<string>("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Vehicle | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (query.trim()) params.set("q", query.trim())
        if (category !== "all") params.set("category", category)
        if (status !== "all") params.set("status", status)
        const res = await fetch(`/api/vehicles?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bearer_token") || ""}`,
          },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Failed to load vehicles")
        if (!ignore) setVehicles(json.data || [])
      } catch (e: any) {
        if (!ignore) setError(e.message || "Error loading vehicles")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [query, category, status])

  // server-side filtering; keep local reference
  const filtered = vehicles

  function onSave(formData: FormData) {
    const body = {
      vin: String(formData.get("vin") || ""),
      make: String(formData.get("make") || ""),
      model: String(formData.get("model") || ""),
      year: Number(formData.get("year") || 2024),
      category: String(formData.get("category") || "SUV"),
      color: String(formData.get("color") || "-"),
      price: Number(formData.get("price") || 0),
      stock: Number(formData.get("stock") || 0),
      reorderPoint: Number(formData.get("reorderPoint") || 0),
      status: String(formData.get("status") || "in_stock") as Vehicle["status"],
    }

    const token = localStorage.getItem("bearer_token") || ""

    const run = async () => {
      try {
        setError(null)
        if (editing) {
          // optimistic update
          const prev = vehicles
          const optimistic = prev.map((p) => (p.id === editing.id ? { ...p, ...body } as any : p))
          setVehicles(optimistic)
          const res = await fetch(`/api/vehicles/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          })
          if (!res.ok) {
            setVehicles(prev) // revert
            const j = await res.json().catch(() => ({}))
            throw new Error(j.error || "Failed to update vehicle")
          }
        } else {
          const res = await fetch(`/api/vehicles`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          })
          const j = await res.json()
          if (!res.ok) throw new Error(j.error || "Failed to create vehicle")
          setVehicles((prev) => [j.data, ...prev])
        }
        setEditing(null)
        setDialogOpen(false)
      } catch (e: any) {
        setError(e.message || "Save failed")
      }
    }
    void run()
  }

  const lowStock = (v: Vehicle) => v.stock <= v.reorderPoint

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xl font-semibold">Vehicle Inventory</div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 opacity-60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search VIN, make, model, year"
              className="pl-8 w-64"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="Category Filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
              <SelectItem value="Sedan">Sedan</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="EV">EV</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Status Filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null) }}>
                <Plus className="mr-2 size-4" /> Add Vehicle
              </Button>
            </DialogTrigger>
            <VehicleFormDialog
              vehicle={editing}
              onSubmit={onSave}
            />
          </Dialog>
        </div>
      </div>

      {loading && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Loading vehicles…</CardTitle>
            <CardDescription>Please wait while we fetch data.</CardDescription>
          </CardHeader>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-4" />
            Results
          </CardTitle>
          <CardDescription>Showing {filtered.length} of {vehicles.length} vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VIN</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id} className={lowStock(v) ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                  <TableCell className="font-mono text-xs">{v.vin}</TableCell>
                  <TableCell>{v.year} {v.make} {v.model}</TableCell>
                  <TableCell>{v.category}</TableCell>
                  <TableCell className="text-right">${v.price.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {v.stock}
                      {lowStock(v) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="size-3" /> Reorder
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {v.status === "in_stock" && <Badge>In Stock</Badge>}
                    {v.status === "reserved" && <Badge variant="secondary">Reserved</Badge>}
                    {v.status === "sold" && <Badge variant="outline">Sold</Badge>}
                  </TableCell>
                  <TableCell>
                    <Dialog open={dialogOpen && editing?.id === v.id} onOpenChange={setDialogOpen}>
                      <Button variant="outline" size="sm" onClick={() => { setEditing(v); setDialogOpen(true) }}>
                        <Pencil className="mr-2 size-4" /> Edit
                      </Button>
                      <VehicleFormDialog
                        vehicle={editing?.id === v.id ? v : null}
                        onSubmit={onSave}
                      />
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function VehicleFormDialog({ vehicle, onSubmit }: { vehicle: Vehicle | null; onSubmit: (fd: FormData) => void }) {
  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{vehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
      </DialogHeader>
      <form
        action={(fd) => {
          onSubmit(fd)
        }}
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        <div>
          <Label htmlFor="vin">VIN</Label>
          <Input name="vin" id="vin" required defaultValue={vehicle?.vin} />
        </div>
        <div>
          <Label htmlFor="make">Make</Label>
          <Input name="make" id="make" required defaultValue={vehicle?.make} />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input name="model" id="model" required defaultValue={vehicle?.model} />
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Input name="year" id="year" type="number" required defaultValue={vehicle?.year ?? 2024} />
        </div>
        <div>
          <Label>Category</Label>
          <Select name="category" defaultValue={vehicle?.category ?? "SUV"}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUV">SUV</SelectItem>
              <SelectItem value="Sedan">Sedan</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="EV">EV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="color">Color</Label>
          <Input name="color" id="color" defaultValue={vehicle?.color} />
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input name="price" id="price" type="number" step="100" defaultValue={vehicle?.price ?? 0} />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input name="stock" id="stock" type="number" defaultValue={vehicle?.stock ?? 0} />
        </div>
        <div>
          <Label htmlFor="reorderPoint">Reorder Point</Label>
          <Input name="reorderPoint" id="reorderPoint" type="number" defaultValue={vehicle?.reorderPoint ?? 0} />
        </div>
        <div>
          <Label>Status</Label>
          <Select name="status" defaultValue={vehicle?.status ?? "in_stock"}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 mt-2 flex justify-end gap-2">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </DialogContent>
  )
}