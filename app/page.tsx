"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, Mail, User, Fingerprint, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function AuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false) // Start as false, only show loading during actions
  const [isCheckingSession, setIsCheckingSession] = useState(true) // Separate state for session check
  const [activeTab, setActiveTab] = useState("login")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupRole, setSignupRole] = useState<"student" | "lecturer">("student")

  const supabase = getSupabaseClient()
  const { toast } = useToast()

  // Check if user is already logged in
  useEffect(() => {
    let mounted = true
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return // Don't update if component unmounted
        
        if (session?.user) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single()
          
          if (!mounted) return // Don't update if component unmounted
          
          if (!userError && userData?.role) {
            let dashboardPath = "/dashboard/student"
            if (userData.role === "admin") {
              dashboardPath = "/dashboard/admin"
            } else if (userData.role === "lecturer") {
              dashboardPath = "/dashboard/lecturer"
            } else if (userData.role === "student") {
              dashboardPath = "/dashboard/student"
            }
            
            router.replace(dashboardPath) // Use replace instead of push to avoid back button issues
            return
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        if (mounted) {
          setIsCheckingSession(false)
        }
      }
    }
    
    checkSession()
    
    return () => {
      mounted = false // Cleanup flag
    }
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (authError) {
        // console.log("[v0] Login error:", authError.message)
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // console.log("[v0] Login successful, fetching user role")
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single()

        if (userError) {
          // console.log("[v0] Error fetching user role:", userError.message, userError.code)
          if (userError.code === "PGRST116") {
            setError("User profile not found. Please contact administrator.")
          } else {
            setError("Failed to fetch user role: " + userError.message)
          }
          setIsLoading(false)
          return
        }

        // console.log("[v0] User role:", userData?.role)
        
        // Route based on role
        let dashboardPath = "/dashboard/student" // default
        if (userData?.role === "admin") {
          dashboardPath = "/dashboard/admin"
        } else if (userData?.role === "lecturer") {
          dashboardPath = "/dashboard/lecturer"
        } else if (userData?.role === "student") {
          dashboardPath = "/dashboard/student"
        }
        
        // console.log("[v0] Redirecting to:", dashboardPath)
        
        // Show success toast
        toast({
          title: "Login Successful!",
          description: `Welcome back! Redirecting to your dashboard...`,
          variant: "default",
        })
        
        // Small delay to show toast before redirect
        setTimeout(() => {
          router.push(dashboardPath)
        }, 500)
      }
    } catch (err) {
      // console.log("[v0] Login error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const redirectUrl = `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin}/auth/callback`
      // console.log("[v0] Signup redirect URL:", redirectUrl)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
            role: signupRole,
          },
          emailRedirectTo: redirectUrl,
        },
      })

      // console.log("[v0] Signup response:", { authData, authError })

      if (authError) {
        // console.log("[v0] Signup error:", authError.message)
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.user) {
        // console.log("[v0] User created successfully:", authData.user.id)
        
        // Create user profile in public.users
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: signupEmail,
          full_name: signupName,
          role: signupRole,
          department: "General",
          is_active: true,
          student_id: signupRole === "student" ? `STU${Date.now().toString().slice(-6)}` : null,
          staff_id: signupRole === "lecturer" ? `LEC${Date.now().toString().slice(-6)}` : null,
        })
        
        if (profileError) {
          // console.log("[v0] Profile creation error:", profileError.message)
          // Don't fail signup if profile creation fails - can be fixed later
        }
        
        setSuccess("Account created! Please check your email to verify your account.")
        setLoginEmail(signupEmail)
        setLoginPassword("")
        setSignupName("")
        setSignupEmail("")
        setSignupPassword("")
        setActiveTab("login")
      }
    } catch (err) {
      // console.log("[v0] Signup error:", err)
      setError("An unexpected error occurred during signup")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking session (only on initial load)
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-4 animate-pulse">
            <Fingerprint className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-4">
            <Fingerprint className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">eRecord Timeless</h1>
          <p className="text-muted-foreground mt-2">Smart University Attendance System</p>
        </div>

        {/* Auth Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@university.edu"
                        className="pl-10 bg-input border-border"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-input border-border"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-border hover:bg-muted bg-transparent"
                  >
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Biometric Login
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    <a href="#" className="text-primary hover:underline">
                      Forgot password?
                    </a>
                  </p>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10 bg-input border-border"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@university.edu"
                        className="pl-10 bg-input border-border"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-input border-border"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-foreground">
                      I am a
                    </Label>
                    <select
                      id="role"
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value as "student" | "lecturer")}
                      className="w-full px-3 py-2 rounded-md bg-input border border-border text-foreground"
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">© 2025 eRecord Timeless. All rights reserved.</p>
      </div>
      <Toaster />
    </div>
  )
}
