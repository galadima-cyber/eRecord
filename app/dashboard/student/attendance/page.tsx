"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { AttendanceChart, AttendanceDistribution } from "@/components/attendance-chart"
import { AttendanceReport } from "@/components/attendance-report"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

export default function StudentAttendancePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [chartData, setChartData] = useState([])
  const [distribution, setDistribution] = useState({ present: 0, absent: 0, late: 0 })
  const [records, setRecords] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadAttendanceData()
    }
  }, [user])

  const loadAttendanceData = async () => {
    const supabase = getSupabaseClient()

    try {
      // Fetch attendance records
      const { data: attendanceRecords } = await supabase
        .from("attendance_records")
        .select("*, attendance_sessions(*)")
        .eq("student_id", user?.id)
        .order("created_at", { ascending: false })

      // Calculate distribution
      const present = attendanceRecords?.filter((r) => r.status === "present").length || 0
      const absent = attendanceRecords?.filter((r) => r.status === "absent").length || 0
      const late = attendanceRecords?.filter((r) => r.status === "late").length || 0

      setDistribution({ present, absent, late })

      // Prepare chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split("T")[0]
      })

      const chartDataPoints = last7Days.map((date) => {
        const dayRecords = attendanceRecords?.filter((r) => r.created_at?.startsWith(date)) || []
        return {
          name: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
          present: dayRecords.filter((r) => r.status === "present").length,
          absent: dayRecords.filter((r) => r.status === "absent").length,
          late: dayRecords.filter((r) => r.status === "late").length,
        }
      })

      setChartData(chartDataPoints)

      // Prepare records for table
      setRecords(
        attendanceRecords?.map((r) => ({
          id: r.id,
          courseName: r.attendance_sessions?.course_name || "Unknown",
          courseCode: r.attendance_sessions?.course_code || "N/A",
          date: new Date(r.created_at).toLocaleDateString(),
          status: r.status,
          checkInTime: r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : undefined,
        })) || [],
      )
    } catch (error) {
      console.error("Error loading attendance data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ["Course", "Course Code", "Date", "Check-In Time", "Status"]
    const csvContent = [
      headers.join(","),
      ...records.map((r) => [r.courseName, r.courseCode, r.date, r.checkInTime || "-", r.status].join(",")),
    ].join("\n")

    // Download CSV
    const element = document.createElement("a")
    element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`)
    element.setAttribute("download", `attendance-report-${new Date().toISOString().split("T")[0]}.csv`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
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
            <h1 className="text-3xl font-bold text-foreground">Attendance Report</h1>
            <p className="text-muted-foreground mt-2">Your attendance analytics and history</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AttendanceChart data={chartData} />
            <AttendanceDistribution {...distribution} />
          </div>

          <AttendanceReport records={records} onExport={handleExport} />
        </div>
      </main>
    </div>
  )
}
