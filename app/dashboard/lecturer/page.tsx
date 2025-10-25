"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

interface Session {
  id: string
  status: string
  [key: string]: any  // For other properties we might need
}
import { LecturerStats } from "@/components/lecturer-stats"
import { CreateSessionForm } from "@/components/create-session-form"
import { LecturerSessions } from "@/components/lecturer-sessions"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

export default function LecturerDashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalStudents: 0,
    averageAttendance: 0,
  })
  const [sessions, setSessions] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    const supabase = getSupabaseClient()

    try {
      // Fetch lecturer's sessions
      const { data: lecturerSessions } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("lecturer_id", user?.id)
        .order("session_date", { ascending: false })

      const totalSessions = lecturerSessions?.length || 0
      const activeSessions = lecturerSessions?.filter((s: Session) => s.status === "active").length || 0

      // Fetch attendance records for average calculation
      const { data: records } = await supabase
        .from("attendance_records")
        .select("status, session_id")
        .in("session_id", lecturerSessions?.map((s: Session) => s.id) || [])

      interface AttendanceRecord {
        status: string;
        session_id: string;
        [key: string]: any; // For any additional fields that might exist
      }
      
      const presentCount = records?.filter((r: AttendanceRecord) => r.status === "present").length || 0
      const totalRecords = records?.length || 0
      const averageAttendance = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

      setStats({
        totalSessions,
        activeSessions,
        totalStudents: 0, // Would need to fetch from enrollment data
        averageAttendance,
      })

      setSessions(
        lecturerSessions?.map((s: {
          id: string;
          course_code: string;
          course_name: string;
          session_date: string;
          start_time: string;
          end_time: string;
          location: string;
          status: string;
        }) => ({
          id: s.id,
          courseCode: s.course_code,
          courseName: s.course_name,
          sessionDate: s.session_date,
          startTime: s.start_time,
          endTime: s.end_time,
          location: s.location,
          status: s.status,
        })) || [],
      )
    } catch (error) {
      console.error("Error loading dashboard data:", error)
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

      loadDashboardData()
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
            <h1 className="text-3xl font-bold text-foreground">Lecturer Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your attendance sessions</p>
          </div>

          <LecturerStats {...stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <CreateSessionForm lecturerId={user?.id || ""} onSessionCreated={loadDashboardData} />
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
