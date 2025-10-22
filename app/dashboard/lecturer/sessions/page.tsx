"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { LecturerSessions } from "@/components/lecturer-sessions"
import { CreateSessionForm } from "@/components/create-session-form"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SessionsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [sessions, setSessions] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    const supabase = getSupabaseClient()

    try {
      const { data: lecturerSessions } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("lecturer_id", user?.id)
        .order("session_date", { ascending: false })

      setSessions(
        lecturerSessions?.map((s) => ({
          id: s.id,
          courseCode: s.course_code,
          courseName: s.course_name,
          sessionDate: s.session_date,
          startTime: s.start_time,
          endTime: s.end_time,
          location: s.location,
          status: s.status,
        })) || []
      )
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleViewDetails = (sessionId: string) => {
    router.push(`/dashboard/lecturer/sessions/${sessionId}`)
  }

  const handleEndSession = async (sessionId: string) => {
    const supabase = getSupabaseClient()

    try {
      await supabase.from("attendance_sessions").update({ status: "completed" }).eq("id", sessionId)
      loadSessions()
    } catch (error) {
      console.error("Error ending session:", error)
    }
  }

  if (isLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardNav userRole="lecturer" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Sessions</h1>
            <p className="text-muted-foreground mt-2">Create and manage your attendance sessions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <CreateSessionForm lecturerId={user?.id || ""} onSessionCreated={loadSessions} />
            </div>
            <div className="lg:col-span-2">
              <LecturerSessions sessions={sessions} onViewDetails={handleViewDetails} onEndSession={handleEndSession} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
