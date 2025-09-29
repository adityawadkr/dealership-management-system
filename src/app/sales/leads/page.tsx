"use client"

import * as React from "react"
import { Plus, Phone, Mail, UserPlus, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

 type Lead = {
  id: number
  name: string
  phone: string
  email: string
  source: string
  status: "new" | "contacted" | "qualified"
}

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const filtered = leads.filter((l) => !q || l.name.toLowerCase().includes(q.toLowerCase()) || l.phone.includes(q))

  React.useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (q.trim()) params.set("q", q.trim())
        const res = await fetch(`/api/leads?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token") || ""}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Failed to load leads")
        if (!ignore) setLeads(json.data || [])
      } catch (e: any) {
        if (!ignore) setError(e.message || "Error loading leads")
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [q])

  async function onSave(fd: FormData) {
    const next = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      source: String(fd.get("source") || "Website"),
      status: String(fd.get("status") || "new") as Lead["status"],
    }

    try {
      setError(null)
      const token = localStorage.getItem("bearer_token") || ""
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Failed to create lead")
      setLeads((prev) => [j.data as Lead, ...prev])
      setOpen(false)
    } catch (e: any) {
      setError(e.message || "Save failed")
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <div className="text-xl font-semibold flex items-center gap-2"><UserPlus className="size-5"/> Leads</div>
        <div className="ml-auto flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" className="w-72" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4"/> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Lead</DialogTitle>
              </DialogHeader>
              <form action={onSave} className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div>
                  <Label>Source</Label>
                  <Select name="source" defaultValue="Website">
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Ads">Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue="new">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Loading leads…</CardTitle>
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
          <CardTitle>Lead List</CardTitle>
          <CardDescription>Track progress to test drives → quotations → booking → delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="font-mono text-xs">{l.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{l.email}</TableCell>
                  <TableCell>{l.source}</TableCell>
                  <TableCell>
                    {l.status === "new" && <Badge variant="destructive" className="gap-1"><Flag className="size-3"/> New</Badge>}
                    {l.status === "contacted" && <Badge variant="secondary">Contacted</Badge>}
                    {l.status === "qualified" && <Badge>Qualified</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Phone className="size-4"/> Call Prospects</CardTitle>
            <CardDescription>Keep conversations active</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">Open Dialer</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="size-4"/> Send Email</CardTitle>
            <CardDescription>Follow-up templates</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm">Open Templates</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}