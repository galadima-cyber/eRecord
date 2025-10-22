"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Fingerprint, MapPin, CheckCircle, AlertCircle } from "lucide-react"

export default function CheckInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const sessionId = searchParams.get("sessionId")

  const [session, setSession] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [checkInStatus, setCheckInStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (sessionId && user) {
      loadSessionData()
    }
  }, [sessionId, user])

  const loadSessionData = async () => {
    const supabase = getSupabaseClient()

    try {
      const { data } = await supabase.from("attendance_sessions").select("*").eq("id", sessionId).single()

      setSession(data)
    } catch (error) {
      console.error("Error loading session:", error)
    }
  }

  const handleBiometricVerification = async () => {
    setIsVerifying(true)
    setCheckInStatus("idle")

    try {
      // Simulate biometric verification
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const supabase = getSupabaseClient()

      // Check if already checked in
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("session_id", sessionId)
        .eq("student_id", user?.id)
        .single()

      if (existing) {
        setCheckInStatus("error")
        setStatusMessage("You have already checked in for this session")
        setIsVerifying(false)
        return
      }

      // Create attendance record
      const { error } = await supabase.from("attendance_records").insert({
        session_id: sessionId,
        student_id: user?.id,
        check_in_time: new Date().toISOString(),
        biometric_verified: true,
        status: "present",
      })

      if (error) {
        setCheckInStatus("error")
        setStatusMessage("Failed to record check-in")
      } else {
        setCheckInStatus("success")
        setStatusMessage("Check-in successful! Your attendance has been recorded.")
        setTimeout(() => {
          router.push("/dashboard/student")
        }, 2000)
      }
    } catch (error) {
      setCheckInStatus("error")
      setStatusMessage("Biometric verification failed. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardNav userRole="student" />

      <main className="flex-1 overflow-auto flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Check In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {session && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="font-semibold text-foreground">{session.course_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{session.location}</span>
                  </div>
                </div>
              </div>
            )}

            {checkInStatus === "idle" && (
              <>
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Fingerprint className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Place your finger on the scanner to verify your identity</p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleBiometricVerification}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Start Biometric Verification"}
                </Button>
              </>
            )}

            {checkInStatus === "success" && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Check-in Successful!</p>
                  <p className="text-sm text-muted-foreground mt-1">{statusMessage}</p>
                </div>
              </div>
            )}

            {checkInStatus === "error" && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Check-in Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{statusMessage}</p>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setCheckInStatus("idle")}
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
