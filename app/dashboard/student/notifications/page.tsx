"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { NotificationsList } from "@/components/notifications-list"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    const supabase = getSupabaseClient()

    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      setNotifications(
        data?.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.created_at,
        })) || [],
      )
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const supabase = getSupabaseClient()

    try {
      await supabase.from("notifications").update({ read: true }).eq("id", notificationId)
      loadNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    const supabase = getSupabaseClient()

    try {
      await supabase.from("notifications").delete().eq("id", notificationId)
      loadNotifications()
    } catch (error) {
      console.error("Error deleting notification:", error)
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
      <DashboardNav userRole="student" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-2">Stay updated with your attendance system</p>
          </div>

          <NotificationsList notifications={notifications} onMarkAsRead={handleMarkAsRead} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  )
}
