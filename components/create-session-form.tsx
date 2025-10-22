"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateSessionFormProps {
  lecturerId: string
  onSessionCreated: () => void
}

export function CreateSessionForm({ lecturerId, onSessionCreated }: CreateSessionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    sessionDate: "",
    startTime: "",
    endTime: "",
    locationId: "",
  })

  // Fetch locations for this lecturer
  useEffect(() => {
    async function fetchLocations() {
      if (!lecturerId) return
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("locations").select("id, name, latitude, longitude, radius").eq("lecturer_id", lecturerId).order("created_at", { ascending: false });
      setLocations(data || []);
    };
    fetchLocations();
  }, [lecturerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus("idle")

    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.from("attendance_sessions").insert({
        lecturer_id: lecturerId,
        course_code: formData.courseCode,
        course_name: formData.courseName,
        session_date: formData.sessionDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location_id: formData.locationId,
        status: "active",
      })

      if (error) {
        setStatus("error")
        setMessage("Failed to create session")
      } else {
        setStatus("success")
        setMessage("Session created successfully!")
        setFormData({
          courseCode: "",
          courseName: "",
          sessionDate: "",
          startTime: "",
          endTime: "",
          locationId: "",
        })
        setTimeout(() => {
          setIsOpen(false)
          onSessionCreated()
        }, 1500)
      }
    } catch (error) {
      setStatus("error")
      setMessage("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsOpen(true)}>
        Create New Session
      </Button>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Create Attendance Session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code</Label>
              <Input
                id="courseCode"
                placeholder="CS101"
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name</Label>
              <Input
                id="courseName"
                placeholder="Introduction to Computer Science"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionDate">Date</Label>
              <Input
                id="sessionDate"
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Location</Label>
              <Select
                value={formData.locationId}
                onValueChange={value => setFormData(f => ({ ...f, locationId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={locations.length === 0 ? "No locations, create one first" : "Select location"}/>
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem value={loc.id} key={loc.id}>
                      {loc.name} ({loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {locations.length === 0 && (<div className="text-muted-foreground text-xs mt-2">No locations found. You must add one before you can create sessions.</div>)}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {status !== "idle" && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                status === "success"
                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
              }`}
            >
              {status === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Session"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
