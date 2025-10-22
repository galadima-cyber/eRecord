"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Star, Send, AlertCircle, CheckCircle } from "lucide-react"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"

export function FeedbackForm() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState(0)
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
        setError("You must be logged in to submit feedback")
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from("feedbacks").insert({
        student_id: user.id,
        subject,
        message,
        rating: rating > 0 ? rating : null,
      })

      if (insertError) {
        setError("Failed to submit feedback")
        setLoading(false)
        return
      }

      setSuccess(true)
      setSubject("")
      setMessage("")
      setRating(0)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError("An error occurred while submitting feedback")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Send Feedback</CardTitle>
        <CardDescription>Help us improve by sharing your thoughts and suggestions</CardDescription>
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
            <AlertDescription className="text-green-800">Feedback submitted successfully!</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief subject of your feedback"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Detailed feedback message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="bg-input border-border resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Rating (Optional)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? 0 : star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Feedback"}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
