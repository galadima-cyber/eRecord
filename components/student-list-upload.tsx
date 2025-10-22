"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, AlertCircle, FileUp } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface UploadResult {
  name: string
  email: string
  status: "success" | "error" | "pending"
  message: string
}

export function StudentListUpload({ sessionId }: { sessionId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<UploadResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        setError("Please upload a CSV or Excel file")
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const parseCSV = (text: string): Array<{ name: string; email: string }> => {
    const lines = text.split("\n").filter((line) => line.trim())
    const students: Array<{ name: string; email: string }> = []

    for (let i = 1; i < lines.length; i++) {
      const [name, email] = lines[i].split(",").map((field) => field.trim())
      if (name && email) {
        students.push({ name, email })
      }
    }

    return students
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const text = await file.text()
      const students = parseCSV(text)

      if (students.length === 0) {
        setError("No valid student records found in file")
        setLoading(false)
        return
      }

      const uploadResults: UploadResult[] = []

      for (const student of students) {
        try {
          // Check if user exists
          const { data: existingUser } = await supabase.from("users").select("id").eq("email", student.email).single()

          if (existingUser) {
            // Link existing user to session
            const { error: enrollError } = await supabase.from("student_enrollments").insert({
              student_id: existingUser.id,
              session_id: sessionId,
            })

            if (enrollError && !enrollError.message.includes("duplicate")) {
              uploadResults.push({
                name: student.name,
                email: student.email,
                status: "error",
                message: "Failed to enroll student",
              })
            } else {
              uploadResults.push({
                name: student.name,
                email: student.email,
                status: "success",
                message: "Student enrolled successfully",
              })
            }
          } else {
            // Create pending account
            const tempPassword = Math.random().toString(36).slice(-8)

            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: student.email,
              password: tempPassword,
              options: {
                emailRedirectTo: window.location.origin,
              },
            })

            if (authError) {
              uploadResults.push({
                name: student.name,
                email: student.email,
                status: "error",
                message: "Failed to create account",
              })
            } else if (authData.user) {
              // Create user profile
              await supabase.from("users").insert({
                id: authData.user.id,
                email: student.email,
                full_name: student.name,
                role: "student",
              })

              // Enroll in session
              await supabase.from("student_enrollments").insert({
                student_id: authData.user.id,
                session_id: sessionId,
              })

              uploadResults.push({
                name: student.name,
                email: student.email,
                status: "success",
                message: "Account created and enrolled",
              })
            }
          }
        } catch (err) {
          uploadResults.push({
            name: student.name,
            email: student.email,
            status: "error",
            message: "Processing error",
          })
        }
      }

      setResults(uploadResults)
    } catch (err) {
      setError("Failed to process file")
    } finally {
      setLoading(false)
    }
  }

  const successCount = results.filter((r) => r.status === "success").length
  const errorCount = results.filter((r) => r.status === "error").length

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            Upload Student List
          </CardTitle>
          <CardDescription>Import students from CSV or Excel file (Name, Email)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{file ? file.name : "Click to select file"}</p>
              <p className="text-xs text-muted-foreground">CSV or Excel format</p>
            </label>
          </div>

          <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
            {loading ? "Processing..." : "Upload Students"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Upload Results</CardTitle>
            <div className="flex gap-4 mt-2">
              <Badge className="bg-green-100 text-green-800">{successCount} Success</Badge>
              <Badge className="bg-red-100 text-red-800">{errorCount} Failed</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{result.name}</TableCell>
                      <TableCell>{result.email}</TableCell>
                      <TableCell>
                        {result.status === "success" ? (
                          <Badge className="bg-green-100 text-green-800">Success</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Error</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{result.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
