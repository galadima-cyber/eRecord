"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Mail, User, GraduationCap } from "lucide-react"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"
import { toast } from "sonner"

interface InvitationData {
  email: string
  name: string
  matricNumber: string
  department: string
  courseName: string
  courseCode: string
  lecturerName: string
  lecturerEmail: string
  expiresAt: string
}

export default function InviteAcceptancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    fullName: "",
    matricNumber: "",
    department: ""
  })

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link")
      setLoading(false)
      return
    }

    fetchInvitation()
  }, [token])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invite-students?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        if (data.accepted) {
          setError("This invitation has already been accepted. You can now log in to your account.")
        } else if (data.expired) {
          setError("This invitation has expired. Please contact your lecturer for a new invitation.")
        } else {
          setError(data.error || "Invalid invitation")
        }
        setLoading(false)
        return
      }

      setInvitation(data.invitation)
      setFormData(prev => ({
        ...prev,
        fullName: data.invitation.name || "",
        matricNumber: data.invitation.matricNumber || "",
        department: data.invitation.department || ""
      }))
    } catch (err) {
      setError("Failed to load invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!invitation) return

    // Validate form
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!formData.fullName.trim()) {
      toast.error("Full name is required")
      return
    }

    setAccepting(true)

    try {
      const supabase = getSupabaseClient()

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            matric_number: formData.matricNumber,
            department: formData.department,
            role: "student"
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Failed to create account")
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: invitation.email,
          full_name: formData.fullName,
          matric_number: formData.matricNumber,
          department: formData.department,
          role: "student"
        })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Continue anyway as the trigger will handle enrollment
      }

      toast.success("Account created successfully! You have been enrolled in the course.")
      
      // Redirect to login or dashboard
      setTimeout(() => {
        router.push("/auth/login?message=Account created successfully. Please log in to continue.")
      }, 2000)

    } catch (err) {
      console.error("Accept invitation error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to accept invitation")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => router.push("/")}>
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No invitation data found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Course Invitation</h1>
          <p className="text-muted-foreground mt-2">Complete your account setup to join the course</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Invitation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Course</Label>
                <p className="font-medium">{invitation.courseCode} - {invitation.courseName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Lecturer</Label>
                <p className="font-medium">{invitation.lecturerName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="font-medium">{invitation.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Expires</Label>
                <p className="font-medium">{new Date(invitation.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Fill in your details to create your account and join the course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="matricNumber">Matric Number</Label>
                <Input
                  id="matricNumber"
                  value={formData.matricNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, matricNumber: e.target.value }))}
                  placeholder="Enter your matric number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Enter your department"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Create a password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                By accepting this invitation, you will be automatically enrolled in the course and can start participating in attendance sessions.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleAcceptInvitation} 
              disabled={accepting}
              className="w-full"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Invitation & Join Course
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
