"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { AdminStats } from "@/components/admin-stats"
import { UsersTable } from "@/components/users-table"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

interface User {
  id: string
  email: string
  fullName: string
  role: string
  createdAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalSessions: 0,
  })
  const [users, setUsers] = useState<User[]>([])
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
      // Fetch all users
      const { data: allUsers } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      const totalUsers = allUsers?.length || 0
      const totalStudents = allUsers?.filter((u: User) => u.role === "student").length || 0
      const totalLecturers = allUsers?.filter((u: User) => u.role === "lecturer").length || 0

      // Fetch all sessions
      const { data: allSessions } = await supabase.from("attendance_sessions").select("id")

      const totalSessions = allSessions?.length || 0

      setStats({
        totalUsers,
        totalStudents,
        totalLecturers,
        totalSessions,
      })

      setUsers(allUsers || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    // TODO: Implement edit user modal
    console.log("Edit user:", user)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    const supabase = getSupabaseClient()

    try {
      await supabase.from("users").delete().eq("id", userId)
      loadDashboardData()
    } catch (error) {
      console.error("Error deleting user:", error)
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
            <h1 className="text-3xl font-bold text-foreground">Admin Control Panel</h1>
            <p className="text-muted-foreground mt-2">System overview and user management</p>
          </div>

          <AdminStats {...stats} />

          <UsersTable
            users={users.map((u) => ({
              id: u.id,
              email: u.email,
              fullName: u.fullName,
              role: u.role,
              createdAt: u.createdAt,
            }))}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        </div>
      </main>
    </div>
  )
}
