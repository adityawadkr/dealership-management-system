"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const rememberMe = formData.get("rememberMe") === "on"

    const { data, error } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
      callbackURL: "/dashboard"
    })

    if (error?.code) {
      toast.error("Invalid email or password. Please make sure you have already registered an account and try again.")
      setLoading(false)
      return
    }

    toast.success("Login successful!")
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2">
            <Car className="size-8 text-primary" />
            <span className="text-2xl font-bold">Dealership DMS</span>
          </div>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                className="size-4 rounded border-input"
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}