"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Megaphone } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface Announcement {
  id: string
  title: string
  message: string
  broadcast_type: string
  created_at: string
  course_name?: string
}

export function AnnouncementsList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data } = await supabase
          .from("announcements")
          .select(
            `
            id,
            title,
            message,
            broadcast_type,
            created_at,
            session:session_id(course_name)
          `,
          )
          .eq("lecturer_id", user.id)
          .order("created_at", { ascending: false })

        const formattedData = data?.map((item: any) => ({
          ...item,
          course_name: item.session?.course_name || "All Students",
        }))

        setAnnouncements(formattedData || [])
      } catch (error) {
        console.error("Error fetching announcements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [supabase])

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading announcements...</div>
  }

  if (announcements.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No announcements yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{announcement.title}</CardTitle>
                <CardDescription>{announcement.course_name}</CardDescription>
              </div>
              <Badge variant={announcement.broadcast_type === "all" ? "default" : "secondary"}>
                {announcement.broadcast_type === "all" ? "All Students" : "Course"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">{announcement.message}</p>
            <span className="text-xs text-muted-foreground">{new Date(announcement.created_at).toLocaleString()}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
