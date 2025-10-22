"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { FeedbackForm } from "@/components/feedback-form"
import { FeedbackList } from "@/components/feedback-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function FeedbackPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

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
      <DashboardNav userRole="student" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
            <p className="text-muted-foreground mt-2">Share your thoughts and suggestions with us</p>
          </div>

          <Tabs defaultValue="submit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="submit" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Submit Feedback
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                My Feedbacks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submit" className="mt-6">
              <FeedbackForm />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <FeedbackList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
