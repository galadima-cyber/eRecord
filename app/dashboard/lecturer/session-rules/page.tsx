"use client"

import { useState, useEffect } from "react"
import { AttendanceRulesForm } from "@/components/attendance-rules-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseClient } from "@/lib/supabase/client"

interface Session {
  id: string
  course_name: string
  course_code: string
  session_date: string
}

export default function SessionRulesPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data } = await supabase
          .from("attendance_sessions")
          .select("id, course_name, course_code, session_date")
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

    fetchSessions()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Session Rules</h1>
        <p className="text-muted-foreground mt-2">Configure attendance verification rules for each session</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Select Session</CardTitle>
          <CardDescription>Choose the session to configure rules for</CardDescription>
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
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedSession && <AttendanceRulesForm sessionId={selectedSession} />}
    </div>
  )
}
