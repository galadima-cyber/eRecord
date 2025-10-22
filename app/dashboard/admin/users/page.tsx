"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { UsersTable } from "@/components/users-table"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function UsersManagementPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadUsers()
    }
  }, [user])

  const loadUsers = async () => {
    const supabase = getSupabaseClient()

    try {
      const { data: allUsers } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      setUsers(allUsers || [])
    } catch (error) {
      console.error("Error loading users:", error)
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
      loadUsers()
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground mt-2">Manage all system users</p>
            </div>
            <Button onClick={() => console.log("Add user")}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          <UsersTable
            users={users.map((u) => ({
              id: u.id,
              email: u.email,
              fullName: u.full_name,
              role: u.role,
              createdAt: u.created_at,
            }))}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        </div>
      </main>
    </div>
  )
}
