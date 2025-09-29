"use client"

import Link from "next/link"
import { HeartHandshake, Users, Gift, Crown, Mail, PhoneCall } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CrmPage() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <HeartHandshake className="size-5" />
        <h1 className="text-xl font-semibold">CRM & Loyalty</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/sales/leads"><Users className="mr-2 size-4"/>View Leads</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/sales/test-drives">Schedule Test Drive</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="size-4"/> Campaigns</CardTitle>
            <CardDescription>Create and send email campaigns to segments</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Templates, audience filters, performance</div>
            <Button size="sm" variant="outline">Open</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PhoneCall className="size-4"/> Follow-ups</CardTitle>
            <CardDescription>Call tasks and reminders for sales reps</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Today: 6 pending</div>
            <Button size="sm" variant="outline">Review</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="size-4"/> Loyalty Rewards</CardTitle>
            <CardDescription>Points, tiers, and redemption history</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Active members: 1,284</div>
            <Button size="sm" variant="outline">Manage</Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="size-4"/> VIP Customers</CardTitle>
            <CardDescription>Monitor your high-value accounts and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">This is a placeholder. Integrate analytics and lists as needed.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}