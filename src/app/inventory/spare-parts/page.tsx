"use client"

import * as React from "react"
import { PackagePlus, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

 type Part = {
  id: string
  sku: string
  name: string
  category: string
  stock: number
  reorderPoint: number
}

const initialParts: Part[] = [
  { id: "p1", sku: "OIL-FLTR-001", name: "Oil Filter", category: "Engine", stock: 12, reorderPoint: 8 },
  { id: "p2", sku: "BRK-PAD-SET02", name: "Brake Pads Set", category: "Brakes", stock: 5, reorderPoint: 10 },
  { id: "p3", sku: "BAT-12V-AGM", name: "12V AGM Battery", category: "Electrical", stock: 3, reorderPoint: 5 },
]

export default function SparePartsInventoryPage() {
  const [parts, setParts] = React.useState(initialParts)
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const low = (p: Part) => p.stock <= p.reorderPoint
  const filtered = parts.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))

  function onSave(fd: FormData) {
    const next: Part = {
      id: Math.random().toString(36).slice(2),
      sku: String(fd.get("sku") || ""),
      name: String(fd.get("name") || ""),
      category: String(fd.get("category") || ""),
      stock: Number(fd.get("stock") || 0),
      reorderPoint: Number(fd.get("reorderPoint") || 0),
    }
    setParts((prev) => [next, ...prev])
    setOpen(false)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <div className="text-xl font-semibold flex items-center gap-2"><Wrench className="size-5"/> Spare Parts Inventory</div>
        <div className="ml-auto flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search part name or SKU" className="w-72" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PackagePlus className="mr-2 size-4"/> Add Part
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Part</DialogTitle>
              </DialogHeader>
              <form action={onSave} className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" name="sku" required />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" required />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" name="stock" type="number" />
                </div>
                <div>
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input id="reorderPoint" name="reorderPoint" type="number" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock</CardTitle>
          <CardDescription>Monitor levels and re-order in time</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Reorder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className={low(p) ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-center">{p.stock}</TableCell>
                  <TableCell className="text-center">{low(p) ? <Badge variant="destructive">Reorder</Badge> : <Badge variant="secondary">OK</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}