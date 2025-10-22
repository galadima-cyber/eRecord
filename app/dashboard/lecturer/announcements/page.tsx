"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { AnnouncementForm } from "@/components/announcement-form"
import { AnnouncementsList } from "@/components/announcements-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function AnnouncementsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
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
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
            <p className="text-muted-foreground mt-2">Send messages to your students</p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Create Announcement
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                My Announcements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              <AnnouncementForm onSuccess={() => setRefreshKey((k) => k + 1)} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <AnnouncementsList key={refreshKey} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
