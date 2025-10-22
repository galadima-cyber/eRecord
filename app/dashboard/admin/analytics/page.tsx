"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { AdminStats } from "@/components/admin-stats"
import { AttendanceChart } from "@/components/attendance-chart"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalSessions: 0,
  })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  const loadAnalytics = async () => {
    const supabase = getSupabaseClient()

    try {
      const { data: allUsers } = await supabase.from("users").select("*")
      const { data: allSessions } = await supabase.from("attendance_sessions").select("id")

      const totalUsers = allUsers?.length || 0
      const totalStudents = allUsers?.filter((u) => u.role === "student").length || 0
      const totalLecturers = allUsers?.filter((u) => u.role === "lecturer").length || 0
      const totalSessions = allSessions?.length || 0

      setStats({
        totalUsers,
        totalStudents,
        totalLecturers,
        totalSessions,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setDataLoading(false)
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
      <DashboardNav userRole="admin" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-2">System-wide analytics and insights</p>
          </div>

          <AdminStats {...stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Overall attendance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>Recent system activity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Activity data will be displayed here</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
