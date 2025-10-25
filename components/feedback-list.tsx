"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare } from "lucide-react"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

interface Feedback {
  id: string
  student_id: string
  subject: string
  message: string
  rating: number | null
  status: string
  created_at: string
  student_name?: string
}

export function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const { data, error } = await supabase
          .from("feedbacks")
          .select(
            `
            id,
            student_id,
            subject,
            message,
            rating,
            status,
            created_at,
            users:student_id(full_name)
          `,
          )
          .order("created_at", { ascending: false })

        if (error) throw error

        const formattedData = data?.map((item: any) => ({
          ...item,
          student_name: item.users?.full_name || "Unknown",
        }))

        setFeedbacks(formattedData || [])
      } catch (error) {
        console.error("Error fetching feedbacks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedbacks()
  }, [supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "reviewed":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading feedbacks...</div>
  }

  if (feedbacks.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No feedbacks yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <Card key={feedback.id} className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                <CardDescription>From {feedback.student_name}</CardDescription>
              </div>
              <Badge className={getStatusColor(feedback.status)}>{feedback.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">{feedback.message}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {feedback.rating && (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (feedback.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(feedback.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
