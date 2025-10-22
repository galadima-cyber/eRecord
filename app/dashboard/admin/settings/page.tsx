"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { SettingsForm } from "@/components/settings-form"
import { useAuth } from "@/lib/auth-context"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: 30,
    locationRadius: 100,
    allowLateCheckIn: true,
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

  const handleSaveSystemSettings = () => {
    console.log("Saving system settings:", systemSettings)
    // TODO: Implement system settings save
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
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account and system settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {userData && <SettingsForm user={userData} onUpdate={loadUserData} />}

            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationRadius">Location Verification Radius (meters)</Label>
                  <Input
                    id="locationRadius"
                    type="number"
                    value={systemSettings.locationRadius}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, locationRadius: parseInt(e.target.value) })
                    }
                  />
                </div>

                <Button onClick={handleSaveSystemSettings} className="w-full">
                  Save System Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
