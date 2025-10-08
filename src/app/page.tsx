import Link from "next/link"
import { Car, LineChart, Wrench, Users, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Car className="size-6 text-primary" />
            <span>Dealership DMS</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Complete Dealership Management
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Streamline your automotive dealership operations with our all-in-one platform. 
            Manage inventory, sales, service, and customer relationships effortlessly.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free Trial <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg">Powerful features to run your dealership efficiently</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Car className="size-10 text-primary mb-2" />
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Track vehicles and spare parts in real-time with automated alerts
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="size-10 text-primary mb-2" />
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>
                Manage leads, test drives, quotations, and bookings seamlessly
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Wrench className="size-10 text-primary mb-2" />
              <CardTitle>Service Management</CardTitle>
              <CardDescription>
                Schedule appointments, create job cards, and track service history
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <LineChart className="size-10 text-primary mb-2" />
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Generate detailed reports and insights to drive business decisions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Why Choose Our DMS?</h2>
              <ul className="space-y-4">
                {[
                  "Real-time inventory tracking across multiple locations",
                  "Automated quotation and invoice generation",
                  "Integrated CRM and customer loyalty programs",
                  "Finance and insurance management",
                  "Mobile-friendly interface for on-the-go access",
                  "Comprehensive analytics and reporting"
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="p-8">
              <CardHeader>
                <CardTitle>Ready to transform your dealership?</CardTitle>
                <CardDescription className="text-base">
                  Join hundreds of dealerships across India managing their operations with our platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Setup Time</span>
                    <span className="font-semibold">Under 30 minutes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Free Trial</span>
                    <span className="font-semibold">14 days, no credit card</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Support</span>
                    <span className="font-semibold">24/7 assistance</span>
                  </div>
                </div>
                <Link href="/register" className="block">
                  <Button size="lg" className="w-full gap-2">
                    Get Started Free <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Dealership DMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}