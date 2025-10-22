"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, Users } from "lucide-react"

interface Session {
  id: string
  courseCode: string
  courseName: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string
  status: string
  attendanceCount?: number
}

interface LecturerSessionsProps {
  sessions: Session[]
  onViewDetails: (sessionId: string) => void
  onEndSession: (sessionId: string) => void
}

export function LecturerSessions({ sessions, onViewDetails, onEndSession }: LecturerSessionsProps) {
  if (sessions.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No sessions created yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Your Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-foreground">{session.courseName}</h3>
                <p className="text-sm text-muted-foreground">{session.courseCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    session.status === "active"
                      ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {session.status}
                </span>
              </div>
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
                <span>{session.attendanceCount || 0} present</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => onViewDetails(session.id)}
              >
                View Details
              </Button>
              {session.status === "active" && (
                <Button
                  size="sm"
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  onClick={() => onEndSession(session.id)}
                >
                  End Session
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
