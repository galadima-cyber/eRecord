"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, AlertCircle, CheckCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface AnnouncementFormProps {
  sessionId?: string
  onSuccess?: () => void
}

export function AnnouncementForm({ sessionId, onSuccess }: AnnouncementFormProps) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [broadcastType, setBroadcastType] = useState<"course" | "all">("course")
  const [selectedSession, setSelectedSession] = useState(sessionId || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = getSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        setLoading(false)
        return
      }

      if (broadcastType === "course" && !selectedSession) {
        setError("Please select a session for course-specific announcement")
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from("announcements").insert({
        lecturer_id: user.id,
        session_id: broadcastType === "course" ? selectedSession : null,
        title,
        message,
        broadcast_type: broadcastType,
      })

      if (insertError) {
        setError("Failed to create announcement")
        setLoading(false)
        return
      }

      // Create notifications for students
      if (broadcastType === "course" && selectedSession) {
        const { data: enrollments } = await supabase
          .from("student_enrollments")
          .select("student_id")
          .eq("session_id", selectedSession)

        if (enrollments) {
          const notifications = enrollments.map((e: any) => ({
            user_id: e.student_id,
            title,
            message,
            type: "info",
          }))

          await supabase.from("notifications").insert(notifications)
        }
      }

      setSuccess(true)
      setTitle("")
      setMessage("")
      setBroadcastType("course")
      setSelectedSession(sessionId || "")
      setTimeout(() => setSuccess(false), 3000)
      onSuccess?.()
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Create Announcement</CardTitle>
        <CardDescription>Send messages to your students</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Announcement sent successfully!</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broadcast-type">Broadcast Type</Label>
            <Select value={broadcastType} onValueChange={(value: any) => setBroadcastType(value)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Course Specific</SelectItem>
                <SelectItem value="all">All Students</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {broadcastType === "course" && (
            <div className="space-y-2">
              <Label htmlFor="session">Select Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defaultSession">All Sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Your announcement message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="bg-input border-border resize-none"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Announcement"}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
