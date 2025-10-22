"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { IntelligentEnrollment } from "@/components/intelligent-enrollment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseClient } from "@/app/lib/superbase/superbase/client"
import { useAuth } from "@/lib/auth-context"
import { Plus, BookOpen, Users, AlertCircle } from "lucide-react"
import { CreateSessionForm } from "@/components/create-session-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Course {
  id: string
  course_name: string
  course_code: string
  description?: string
  department?: string
  semester?: string
  academic_year?: string
  created_at: string
}

const CreateCourseForm = ({ lecturerId, onCourseCreated }: { lecturerId: string, onCourseCreated: () => void }) => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    department: "",
    description: ""
  });
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false);
  const supabase = getSupabaseClient();
  const formRef = useRef(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSuccess(false); setLoading(true);
    try {
      const { error } = await supabase.from("courses").insert({
        lecturer_id: lecturerId,
        course_code: form.code.trim(),
        course_name: form.name.trim(),
        department: form.department.trim(),
        description: form.description.trim(),
      });
      if (error) { setError("Failed to create course"); return }
      setSuccess(true);
      setForm({...form, name: "", code: "", department: "", description: ""});
      onCourseCreated && onCourseCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 bg-muted p-4 rounded-lg">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Course Code</Label>
          <Input value={form.code} required onChange={e=>setForm(f=>({...f, code: e.target.value}))} placeholder="e.g. CSC101" />
        </div>
        <div className="flex-1">
          <Label>Course Name</Label>
          <Input value={form.name} required onChange={e=>setForm(f=>({...f, name: e.target.value}))} placeholder="Intro to Comp. Science" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Department</Label>
          <Input value={form.department} onChange={e=>setForm(f=>({...f, department: e.target.value}))} placeholder="e.g. Computer Science" />
        </div>
        <div className="flex-1">
          <Label>Description</Label>
          <Input value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} placeholder="Optional details" />
        </div>
      </div>
      {error && (<div className="text-red-500 text-sm">{error}</div>)}
      {success && (<div className="text-green-600 text-sm">Course successfully created!</div>)}
      <Button type="submit" disabled={loading} className="w-full">Create Course</Button>
    </form>
  );
}

export default function UploadStudentsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const supabase = getSupabaseClient()

  const fetchCourses = async (autoSelectLast = false) => {
    try {
      if (!user) return
      const { data } = await supabase
        .from("courses")
        .select("id, course_name, course_code, description, department, semester, academic_year, created_at")
        .eq("lecturer_id", user.id)
        .order("created_at", { ascending: false })
      setCourses(data || [])
      if (data && data.length > 0) {
        setSelectedCourse(autoSelectLast ? data[0].id : selectedCourse || data[0].id)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
    // eslint-disable-next-line
  }, [user])

  const handleSessionCreated = () => {
    setShowCreate(false)
    fetchCourses(true) // reload and auto-select new
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse)

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardNav userRole="lecturer" />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Student Enrollment</h1>
              <p className="text-muted-foreground mt-2">Enroll students into your sessions</p>
            </div>
            {/* Button always available */}
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Session
            </Button>
          </div>

          {/* If no courses, draw create session form inline */}
          {courses.length === 0 ? (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  No Courses Yet
                </CardTitle>
                <CardDescription>
                  You need a course to enroll students. Create one below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateCourseForm lecturerId={user?.id ?? ""} onCourseCreated={() => fetchCourses(true)} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Select Session
                </CardTitle>
                <CardDescription>
                  Choose which session to add students to. Sessions and courses are linked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-2">
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select a session" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{course.course_code}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{course.course_name}</span>
                            {course.academic_year && (<Badge variant="secondary" className="ml-2">{course.academic_year}</Badge>)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowCreate(!showCreate)} variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> New Session
                  </Button>
                </div>
                {showCreate && (
                  <div className="mb-4 border rounded-md p-3 shadow-sm bg-card">
                    <CreateSessionForm lecturerId={user?.id ?? ""} onSessionCreated={handleSessionCreated} />
                  </div>
                )}
                {selectedCourseData && (
                  <div className="p-4 bg-muted rounded-lg mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-medium">{selectedCourseData.course_code} - {selectedCourseData.course_name}</span>
                    </div>
                    {selectedCourseData.description && (<p className="text-sm text-muted-foreground mb-2">{selectedCourseData.description}</p>)}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {selectedCourseData.department && (<span>Department: {selectedCourseData.department}</span>)}
                      {selectedCourseData.semester && (<span>Semester: {selectedCourseData.semester}</span>)}
                      {selectedCourseData.academic_year && (<span>Year: {selectedCourseData.academic_year}</span>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {selectedCourse && selectedCourseData && (
            <IntelligentEnrollment
              courseId={selectedCourse}
              courseName={selectedCourseData.course_name}
              courseCode={selectedCourseData.course_code}
            />
          )}
        </div>
      </main>
    </div>
  )
}
