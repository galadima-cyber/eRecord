"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileUpload, 
  StudentData 
} from "@/components/file-upload"
import { 
  StudentPreviewTable 
} from "@/components/student-preview-table"
import { 
  ReuseStudentGroups 
} from "@/components/reuse-student-groups"
import { 
  Users, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface InvitationResult {
  email: string
  status: "enrolled" | "invited" | "error"
  message: string
  userId?: string
}

interface InvitationSummary {
  total: number
  enrolled: number
  invited: number
  errors: number
}

interface IntelligentEnrollmentProps {
  courseId: string
  courseName: string
  courseCode: string
}

export function IntelligentEnrollment({ 
  courseId, 
  courseName, 
  courseCode 
}: IntelligentEnrollmentProps) {
  const [students, setStudents] = useState<StudentData[]>([])
  const [invitationResults, setInvitationResults] = useState<InvitationResult[]>([])
  const [invitationSummary, setInvitationSummary] = useState<InvitationSummary | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")

  const handleDataExtracted = (data: StudentData[]) => {
    setStudents(data)
    setActiveTab("preview")
    toast.success(`Extracted ${data.length} student records`)
  }

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress)
  }

  const handleInviteStudents = async (selectedStudents: StudentData[]) => {
    setIsInviting(true)
    setInvitationResults([])
    setInvitationSummary(null)

    try {
      const response = await fetch("/api/invite-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          students: selectedStudents
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitations")
      }

      setInvitationResults(data.results)
      setInvitationSummary(data.summary)
      setActiveTab("results")

      // Show success message
      const { enrolled, invited, errors } = data.summary
      if (errors === 0) {
        toast.success(`Successfully processed ${enrolled + invited} students!`)
      } else {
        toast.warning(`Processed ${enrolled + invited} students with ${errors} errors`)
      }

    } catch (error) {
      console.error("Invitation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send invitations")
    } finally {
      setIsInviting(false)
    }
  }

  const handleReset = () => {
    setStudents([])
    setInvitationResults([])
    setInvitationSummary(null)
    setActiveTab("upload")
    setUploadProgress(0)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enrolled":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "invited":
        return <Mail className="w-4 h-4 text-blue-600" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled":
        return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>
      case "invited":
        return <Badge className="bg-blue-100 text-blue-800">Invited</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Intelligent Student Enrollment
          </CardTitle>
          <CardDescription>
            Upload student data, review and edit information, then send invitations to enroll students in{" "}
            <strong>{courseCode} - {courseName}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileUpload 
  className="w-4 h-4" 
  onDataExtracted={handleDataExtracted}
  onUploadProgress={handleUploadProgress}
/>
            Upload Data
          </TabsTrigger>
          <TabsTrigger value="reuse" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Reuse Students
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2" disabled={students.length === 0}>
            <Users className="w-4 h-4" />
            Review & Edit
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={invitationResults.length === 0}>
            <CheckCircle className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <FileUpload
            onDataExtracted={handleDataExtracted}
            onUploadProgress={handleUploadProgress}
            maxFileSize={10}
            acceptedFormats={[".csv", ".xlsx", ".xls", ".pdf"]}
          />

          {uploadProgress > 0 && uploadProgress < 100 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reuse" className="space-y-4">
          <ReuseStudentGroups
            currentCourseId={courseId}
            onStudentsCopied={(count) => {
              toast.success(`Successfully copied ${count} students from previous course`)
            }}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <StudentPreviewTable
            students={students}
            onStudentsChange={setStudents}
            onInviteStudents={handleInviteStudents}
            isLoading={isInviting}
          />

          {isInviting && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="font-medium">Sending invitations...</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {invitationSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Invitation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{invitationSummary.total}</div>
                    <div className="text-sm text-muted-foreground">Total Processed</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{invitationSummary.enrolled}</div>
                    <div className="text-sm text-muted-foreground">Enrolled</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{invitationSummary.invited}</div>
                    <div className="text-sm text-muted-foreground">Invited</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{invitationSummary.errors}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>

                {invitationSummary.errors > 0 && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {invitationSummary.errors} students could not be processed. 
                      Check the detailed results below for more information.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>
                Individual results for each student invitation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitationResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="font-medium">{result.email}</p>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button onClick={() => setActiveTab("upload")}>
              Add More Students
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
