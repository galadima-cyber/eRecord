"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Users, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  BookOpen,
  UserPlus
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Course {
  id: string
  course_name: string
  course_code: string
  enrolled_students: number
}

interface StudentGroup {
  id: string
  name: string
  description: string
  student_count: number
  course_id: string
  course_name: string
  course_code: string
}

interface StudentGroupMember {
  id: string
  student_id: string
  full_name: string
  email: string
  matric_number: string
  department: string
}

interface ReuseStudentGroupsProps {
  currentCourseId: string
  onStudentsCopied: (count: number) => void
}

export function ReuseStudentGroups({ 
  currentCourseId, 
  onStudentsCopied 
}: ReuseStudentGroupsProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [groupMembers, setGroupMembers] = useState<StudentGroupMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourseId) {
      fetchStudentGroups(selectedCourseId)
    }
  }, [selectedCourseId])

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMembers(selectedGroupId)
    }
  }, [selectedGroupId])

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("courses")
        .select(`
          id,
          course_name,
          course_code,
          course_enrollments(count)
        `)
        .eq("lecturer_id", user.id)
        .neq("id", currentCourseId)
        .order("created_at", { ascending: false })

      const coursesWithCount = data?.map(course => ({
        id: course.id,
        course_name: course.course_name,
        course_code: course.course_code,
        enrolled_students: course.course_enrollments?.[0]?.count || 0
      })) || []

      setCourses(coursesWithCount)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to fetch courses")
    }
  }

  const fetchStudentGroups = async (courseId: string) => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("student_groups")
        .select(`
          id,
          name,
          description,
          student_count,
          courses!inner(
            course_name,
            course_code
          )
        `)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })

      const groups = data?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description || "",
        student_count: group.student_count,
        course_id: courseId,
        course_name: group.courses.course_name,
        course_code: group.courses.course_code
      })) || []

      setStudentGroups(groups)
    } catch (error) {
      console.error("Error fetching student groups:", error)
      toast.error("Failed to fetch student groups")
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupMembers = async (groupId: string) => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("group_members")
        .select(`
          id,
          student_id,
          users!inner(
            full_name,
            email,
            matric_number,
            department
          )
        `)
        .eq("group_id", groupId)

      const members = data?.map(member => ({
        id: member.id,
        student_id: member.student_id,
        full_name: member.users.full_name || "",
        email: member.users.email,
        matric_number: member.users.matric_number || "",
        department: member.users.department || ""
      })) || []

      setGroupMembers(members)
      setSelectedMembers(new Set(members.map(m => m.student_id)))
    } catch (error) {
      console.error("Error fetching group members:", error)
      toast.error("Failed to fetch group members")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(new Set(groupMembers.map(m => m.student_id)))
    } else {
      setSelectedMembers(new Set())
    }
  }

  const handleSelectMember = (studentId: string, checked: boolean) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(studentId)
      } else {
        newSet.delete(studentId)
      }
      return newSet
    })
  }

  const handleCopyStudents = async () => {
    if (selectedMembers.size === 0) {
      toast.error("Please select at least one student")
      return
    }

    setCopying(true)
    try {
      const selectedStudents = groupMembers.filter(m => selectedMembers.has(m.student_id))
      
      // Enroll selected students in the current course
      const enrollments = selectedStudents.map(student => ({
        course_id: currentCourseId,
        student_id: student.student_id,
        approved: true
      }))

      const { error } = await supabase
        .from("course_enrollments")
        .insert(enrollments)

      if (error && !error.message.includes("duplicate")) {
        throw new Error(error.message)
      }

      toast.success(`Successfully copied ${selectedStudents.length} students to the current course`)
      onStudentsCopied(selectedStudents.length)
      
      // Reset selections
      setSelectedMembers(new Set())
      
    } catch (error) {
      console.error("Error copying students:", error)
      toast.error(error instanceof Error ? error.message : "Failed to copy students")
    } finally {
      setCopying(false)
    }
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId)
  const selectedGroup = studentGroups.find(g => g.id === selectedGroupId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="w-5 h-5 text-primary" />
          Reuse Students from Previous Courses
        </CardTitle>
        <CardDescription>
          Copy enrolled students from your previous courses to quickly populate the current course
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Course Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Previous Course</label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course to copy students from" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{course.course_code}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{course.course_name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {course.enrolled_students} students
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCourse && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Selected: <strong>{selectedCourse.course_code} - {selectedCourse.course_name}</strong> 
              with {selectedCourse.enrolled_students} enrolled students
            </AlertDescription>
          </Alert>
        )}

        {/* Group Selection */}
        {selectedCourseId && (
          <div>
            <label className="text-sm font-medium mb-2 block">Select Student Group (Optional)</label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a specific group or select all students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>All enrolled students</span>
                    <Badge variant="secondary" className="ml-2">
                      {selectedCourse?.enrolled_students || 0} students
                    </Badge>
                  </div>
                </SelectItem>
                {studentGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{group.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {group.student_count} students
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Student List */}
        {selectedGroupId && groupMembers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMembers.size === groupMembers.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  Select all ({groupMembers.length} students)
                </span>
              </div>
              <Button 
                onClick={handleCopyStudents} 
                disabled={selectedMembers.size === 0 || copying}
                className="bg-green-600 hover:bg-green-700"
              >
                {copying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Copy Selected ({selectedMembers.size})
                  </>
                )}
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Matric Number</TableHead>
                    <TableHead>Department</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMembers.has(member.student_id)}
                          onCheckedChange={(checked) => handleSelectMember(member.student_id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{member.full_name || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{member.email}</TableCell>
                      <TableCell>{member.matric_number || "-"}</TableCell>
                      <TableCell>{member.department || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Quick Copy All Students */}
        {selectedCourseId && !selectedGroupId && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">
              Copy all {selectedCourse?.enrolled_students || 0} students from {selectedCourse?.course_code}?
            </p>
            <Button 
              onClick={async () => {
                setCopying(true)
                try {
                  // Get all enrolled students from the selected course
                  const { data: enrollments } = await supabase
                    .from("course_enrollments")
                    .select("student_id")
                    .eq("course_id", selectedCourseId)

                  if (enrollments && enrollments.length > 0) {
                    const newEnrollments = enrollments.map(enrollment => ({
                      course_id: currentCourseId,
                      student_id: enrollment.student_id,
                      approved: true
                    }))

                    const { error } = await supabase
                      .from("course_enrollments")
                      .insert(newEnrollments)

                    if (error && !error.message.includes("duplicate")) {
                      throw new Error(error.message)
                    }

                    toast.success(`Successfully copied ${enrollments.length} students`)
                    onStudentsCopied(enrollments.length)
                  }
                } catch (error) {
                  console.error("Error copying all students:", error)
                  toast.error(error instanceof Error ? error.message : "Failed to copy students")
                } finally {
                  setCopying(false)
                }
              }}
              disabled={copying}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {copying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Copying All Students...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All Students
                </>
              )}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
