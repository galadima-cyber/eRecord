"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { SettingsForm } from "@/components/settings-form"
import { NotificationPreferences } from "@/components/notification-preferences"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    sessionReminders: true,
    attendanceAlerts: true,
  })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    const supabase = getSupabaseClient()

    try {
      const { data } = await supabase.from("users").select("*").eq("id", user?.id).single()

      setUserData({
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        phone: data.phone,
        department: data.department,
      })
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleTogglePreference = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
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
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {userData && <SettingsForm user={userData} onUpdate={loadUserData} />}
            <NotificationPreferences preferences={preferences} onToggle={handleTogglePreference} />
          </div>
        </div>
      </main>
    </div>
  )
}
