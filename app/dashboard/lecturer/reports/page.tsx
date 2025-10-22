"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { AttendanceChart, AttendanceDistribution } from "@/components/attendance-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

export default function LecturerReportsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [chartData, setChartData] = useState([])
  const [distribution, setDistribution] = useState({ present: 0, absent: 0, late: 0 })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadReportData()
    }
  }, [user])

  const loadReportData = async () => {
    const supabase = getSupabaseClient()

    try {
      // Fetch lecturer's sessions
      const { data: sessions } = await supabase.from("attendance_sessions").select("id").eq("lecturer_id", user?.id)

      const sessionIds = sessions?.map((s) => s.id) || []

      // Fetch attendance records for these sessions
      const { data: records } = await supabase.from("attendance_records").select("*").in("session_id", sessionIds)

      // Calculate distribution
      const present = records?.filter((r) => r.status === "present").length || 0
      const absent = records?.filter((r) => r.status === "absent").length || 0
      const late = records?.filter((r) => r.status === "late").length || 0

      setDistribution({ present, absent, late })

      // Prepare chart data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split("T")[0]
      })

      const chartDataPoints = last7Days.map((date) => {
        const dayRecords = records?.filter((r) => r.created_at?.startsWith(date)) || []
        return {
          name: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
          present: dayRecords.filter((r) => r.status === "present").length,
          absent: dayRecords.filter((r) => r.status === "absent").length,
          late: dayRecords.filter((r) => r.status === "late").length,
        }
      })

      setChartData(chartDataPoints)
    } catch (error) {
      console.error("Error loading report data:", error)
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
      <DashboardNav userRole="lecturer" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Session Reports</h1>
            <p className="text-muted-foreground mt-2">Attendance analytics for your sessions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AttendanceChart data={chartData} />
            <AttendanceDistribution {...distribution} />
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Present</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{distribution.present}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Absent</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{distribution.absent}</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Late</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{distribution.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
