"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { ManualAttendanceTable } from "@/components/manual-attendance-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

interface Session {
  id: string
  course_name: string
  course_code: string
  session_date: string
  status: string
}

export default function ManualAttendancePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data } = await supabase
          .from("attendance_sessions")
          .select("id, course_name, course_code, session_date, status")
          .eq("lecturer_id", user.id)
          .order("session_date", { ascending: false })

        setSessions(data || [])
        if (data && data.length > 0) {
          setSelectedSession(data[0].id)
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSessions()
    }
  }, [supabase, user])

  if (isLoading) {
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
        <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manual Attendance Recording</h1>
        <p className="text-muted-foreground mt-2">Manually record or update student attendance</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Select Session</CardTitle>
          <CardDescription>Choose the session to record attendance for</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-muted-foreground">No sessions found</div>
          ) : (
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.course_code} - {session.course_name} ({new Date(session.session_date).toLocaleDateString()}
                    ) - {session.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

          {selectedSession && <ManualAttendanceTable sessionId={selectedSession} />}
        </div>
      </main>
    </div>
  )
}
