"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface NotificationPreferencesProps {
  preferences: {
    emailNotifications: boolean
    sessionReminders: boolean
    attendanceAlerts: boolean
  }
  onToggle: (key: keyof NotificationPreferencesProps['preferences']) => void
}

export function NotificationPreferences({ preferences, onToggle }: NotificationPreferencesProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <Label className="text-foreground font-medium">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive email updates about your attendance</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={() => onToggle("emailNotifications")}
            className="w-5 h-5 rounded border-border"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <Label className="text-foreground font-medium">Session Reminders</Label>
            <p className="text-sm text-muted-foreground">Get reminded before your sessions start</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.sessionReminders}
            onChange={() => onToggle("sessionReminders")}
            className="w-5 h-5 rounded border-border"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <Label className="text-foreground font-medium">Attendance Alerts</Label>
            <p className="text-sm text-muted-foreground">Alert me about low attendance rates</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.attendanceAlerts}
            onChange={() => onToggle("attendanceAlerts")}
            className="w-5 h-5 rounded border-border"
          />
        </div>
      </CardContent>
    </Card>
  )
}
