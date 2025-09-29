"use client"

import Link from "next/link"
import { HandCoins, ShieldCheck, FileCheck, Percent, ClipboardList } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FinanceInsurancePage() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <HandCoins className="size-5" />
        <h1 className="text-xl font-semibold">Finance & Insurance</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/sales/quotations"><ClipboardList className="mr-2 size-4"/>Create Quotation</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/sales/delivery">Proceed to Delivery</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Percent className="size-4"/> Rate Matrix</CardTitle>
            <CardDescription>APR, tenure, down payment scenarios</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Configure lenders and plans</div>
            <Button size="sm" variant="outline">Open</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileCheck className="size-4"/> Applications</CardTitle>
            <CardDescription>Capture buyer details and KYC</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Pending: 4 reviews</div>
            <Button size="sm" variant="outline">Review</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4"/> Insurance Policies</CardTitle>
            <CardDescription>Plans, add-ons, renewals</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Preferred partner: AutoShield</div>
            <Button size="sm" variant="outline">Manage</Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HandCoins className="size-4"/> F&I Pipeline</CardTitle>
            <CardDescription>Monitor submissions → underwriting → approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">This is a placeholder. Integrate with lenders and insurers via APIs when ready.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}