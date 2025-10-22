"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { StudentStats } from "@/components/student-stats"
import { ActiveSessions } from "@/components/active-sessions"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

export default function StudentDashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState({ totalSessions: 0, presentCount: 0, absentCount: 0, attendanceRate: 0 })
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
      // Fetch attendance records
      const { data: records } = await supabase.from("attendance_records").select("status").eq("student_id", user?.id)

      const presentCount = records?.filter((r) => r.status === "present").length || 0
      const absentCount = records?.filter((r) => r.status === "absent").length || 0
      const totalSessions = records?.length || 0
      const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

      setStats({ totalSessions, presentCount, absentCount, attendanceRate })

      // Fetch active sessions
      const { data: activeSessions } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("status", "active")
        .order("start_time", { ascending: true })

      setSessions(
        activeSessions?.map((s) => ({
          id: s.id,
          courseCode: s.course_code,
          courseName: s.course_name,
          startTime: s.start_time,
          endTime: s.end_time,
          location: s.location,
          lecturer: "Lecturer Name",
        })) || [],
      )
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleCheckIn = (sessionId: string) => {
    router.push(`/dashboard/student/check-in?sessionId=${sessionId}`)
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
      <DashboardNav userRole="student" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
            <p className="text-muted-foreground mt-2">Here's your attendance overview</p>
          </div>

          <StudentStats {...stats} />

          <ActiveSessions sessions={sessions} onCheckIn={handleCheckIn} />
        </div>
      </main>
    </div>
  )
}
