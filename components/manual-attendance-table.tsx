"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface Student {
  id: string
  full_name: string
  email: string
  attendance_status?: string
  attendance_id?: string
}

interface ManualAttendanceTableProps {
  sessionId: string
}

export function ManualAttendanceTable({ sessionId }: ManualAttendanceTableProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data: enrollments } = await supabase
          .from("student_enrollments")
          .select(
            `
            student_id,
            users:student_id(id, full_name, email),
            attendance:attendance_records(id, status)
          `,
          )
          .eq("session_id", sessionId)

        if (enrollments) {
          const formattedStudents = enrollments.map((e: any) => ({
            id: e.student_id,
            full_name: e.users?.full_name || "Unknown",
            email: e.users?.email || "",
            attendance_status: e.attendance?.[0]?.status || "absent",
            attendance_id: e.attendance?.[0]?.id,
          }))

          setStudents(formattedStudents)
        }
      } catch (error) {
        console.error("Error fetching students:", error)
        setError("Failed to load students")
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [sessionId, supabase])

  const updateAttendance = async (studentId: string, status: string, reason?: string) => {
    setUpdating(studentId)
    setError(null)
    setSuccess(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        setUpdating(null)
        return
      }

      const student = students.find((s) => s.id === studentId)
      const attendanceId = student?.attendance_id

      if (attendanceId) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("attendance_records")
          .update({
            status,
            updated_by: user.id,
            update_reason: reason,
            update_type: "manual",
            updated_at: new Date().toISOString(),
          })
          .eq("id", attendanceId)

        if (updateError) throw updateError
      } else {
        // Create new record
        const { error: insertError } = await supabase.from("attendance_records").insert({
          session_id: sessionId,
          student_id: studentId,
          status,
          updated_by: user.id,
          update_reason: reason,
          update_type: "manual",
          check_in_time: new Date().toISOString(),
        })

        if (insertError) throw insertError
      }

      // Update local state
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, attendance_status: status } : s)))

      setSuccess(`Attendance updated for ${student?.full_name}`)
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError("Failed to update attendance")
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      case "excused":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "absent":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "late":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "excused":
        return <AlertCircle className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading students...</div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Manual Attendance Recording</CardTitle>
          <CardDescription>Update attendance status for students in this session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input border-border"
          />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(student.attendance_status || "absent")}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(student.attendance_status || "absent")}
                          {student.attendance_status || "absent"}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={student.attendance_status === "present" ? "default" : "outline"}
                          onClick={() => updateAttendance(student.id, "present")}
                          disabled={updating === student.id}
                          className="text-xs"
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={student.attendance_status === "late" ? "default" : "outline"}
                          onClick={() => updateAttendance(student.id, "late")}
                          disabled={updating === student.id}
                          className="text-xs"
                        >
                          Late
                        </Button>
                        <Button
                          size="sm"
                          variant={student.attendance_status === "absent" ? "default" : "outline"}
                          onClick={() => updateAttendance(student.id, "absent")}
                          disabled={updating === student.id}
                          className="text-xs"
                        >
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={student.attendance_status === "excused" ? "default" : "outline"}
                          onClick={() => updateAttendance(student.id, "excused")}
                          disabled={updating === student.id}
                          className="text-xs"
                        >
                          Excused
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? "No students match your search" : "No students enrolled in this session"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
