"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Mail, CheckCircle, Clock, AlertCircle } from "lucide-react"

const notifications = [
  {
    id: 1,
    type: "success",
    title: "Check-In Successful",
    message: "Your attendance for Data Structures has been recorded",
    time: "2 hours ago",
    icon: CheckCircle,
  },
  {
    id: 2,
    type: "info",
    title: "New Session Created",
    message: "Dr. Bello created a new session for Algorithms",
    time: "4 hours ago",
    icon: Bell,
  },
  {
    id: 3,
    type: "warning",
    title: "Low Attendance Alert",
    message: "Your attendance rate is below 80% for this month",
    time: "1 day ago",
    icon: AlertCircle,
  },
  {
    id: 4,
    type: "info",
    title: "Report Generated",
    message: "Your monthly attendance report is ready for download",
    time: "2 days ago",
    icon: Mail,
  },
]

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your attendance system</p>
        </div>

        {/* Notification List */}
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const Icon = notification.icon
              return (
                <Card key={notification.id} className="border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          notification.type === "success"
                            ? "bg-accent/20"
                            : notification.type === "warning"
                              ? "bg-destructive/20"
                              : "bg-primary/20"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            notification.type === "success"
                              ? "text-accent"
                              : notification.type === "warning"
                                ? "text-destructive"
                                : "text-primary"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notification.time}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        ×
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="border-border">
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">You're all caught up — no new alerts.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mark All as Read */}
        {notifications.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="border-border bg-transparent">
              Mark All as Read
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
