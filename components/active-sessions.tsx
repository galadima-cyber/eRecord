"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Clock, Users } from "lucide-react"

interface Session {
  id: string
  courseCode: string
  courseName: string
  startTime: string
  endTime: string
  location: string
  lecturer: string
}

interface ActiveSessionsProps {
  sessions: Session[]
  onCheckIn: (sessionId: string) => void
}

export function ActiveSessions({ sessions, onCheckIn }: ActiveSessionsProps) {
  if (sessions.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No active sessions at the moment</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-foreground">{session.courseName}</h3>
                <p className="text-sm text-muted-foreground">{session.courseCode}</p>
              </div>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => onCheckIn(session.id)}
              >
                Check In
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {session.startTime} - {session.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{session.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{session.lecturer}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
