"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Edit2, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Users, 
  Mail, 
  UserPlus,
  Search,
  Filter,
  Download
} from "lucide-react"
import { StudentData } from "./file-upload"
import { toast } from "sonner"

interface StudentPreviewTableProps {
  students: StudentData[]
  onStudentsChange: (students: StudentData[]) => void
  onInviteStudents: (students: StudentData[]) => Promise<void>
  isLoading?: boolean
}

interface ManualStudentForm {
  email: string
  name: string
  matricNumber: string
  department: string
}

const departments = [
  "Computer Science",
  "Information Technology",
  "Software Engineering",
  "Cybersecurity",
  "Data Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Engineering",
  "Business Administration",
  "Economics",
  "Psychology",
  "Sociology",
  "English",
  "History",
  "Other"
]

export function StudentPreviewTable({ 
  students, 
  onStudentsChange, 
  onInviteStudents,
  isLoading = false 
}: StudentPreviewTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<StudentData | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterValid, setFilterValid] = useState<"all" | "valid" | "invalid">("all")
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState<ManualStudentForm>({
    email: "",
    name: "",
    matricNumber: "",
    department: ""
  })

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = 
      filterValid === "all" || 
      (filterValid === "valid" && student.isValid) ||
      (filterValid === "invalid" && !student.isValid)

    return matchesSearch && matchesFilter
  })

  const validStudents = students.filter(s => s.isValid)
  const invalidStudents = students.filter(s => !s.isValid)

  useEffect(() => {
    // Auto-select all valid students
    const validIds = new Set(validStudents.map(s => s.id))
    setSelectedStudents(validIds)
  }, [students])

  const handleEdit = (student: StudentData) => {
    setEditingId(student.id)
    setEditingData({ ...student })
  }

  const handleSaveEdit = () => {
    if (!editingData) return

    // Validate the edited data
    const errors: string[] = []
    if (!editingData.email) errors.push("Email is required")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingData.email)) errors.push("Invalid email format")

    const updatedStudent = {
      ...editingData,
      isValid: errors.length === 0,
      errors
    }

    const updatedStudents = students.map(s => 
      s.id === editingData.id ? updatedStudent : s
    )

    onStudentsChange(updatedStudents)
    setEditingId(null)
    setEditingData(null)
    toast.success("Student data updated")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const handleDelete = (studentId: string) => {
    const updatedStudents = students.filter(s => s.id !== studentId)
    onStudentsChange(updatedStudents)
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      newSet.delete(studentId)
      return newSet
    })
    toast.success("Student removed")
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const validIds = new Set(validStudents.map(s => s.id))
      setSelectedStudents(validIds)
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(studentId)
      } else {
        newSet.delete(studentId)
      }
      return newSet
    })
  }

  const handleAddManual = () => {
    if (!manualForm.email) {
      toast.error("Email is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualForm.email)) {
      toast.error("Invalid email format")
      return
    }

    // Check for duplicate email
    if (students.some(s => s.email === manualForm.email.toLowerCase())) {
      toast.error("Student with this email already exists")
      return
    }

    const newStudent: StudentData = {
      id: `manual-${Date.now()}`,
      email: manualForm.email.toLowerCase().trim(),
      name: manualForm.name.trim(),
      matricNumber: manualForm.matricNumber.trim(),
      department: manualForm.department.trim(),
      isValid: true,
      errors: []
    }

    onStudentsChange([...students, newStudent])
    setManualForm({ email: "", name: "", matricNumber: "", department: "" })
    setShowManualForm(false)
    toast.success("Student added successfully")
  }

  const handleInviteSelected = async () => {
    const selectedStudentData = students.filter(s => selectedStudents.has(s.id))
    if (selectedStudentData.length === 0) {
      toast.error("Please select at least one student")
      return
    }

    await onInviteStudents(selectedStudentData)
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Email", "Name", "Matric Number", "Department", "Status"],
      ...students.map(s => [
        s.email,
        s.name,
        s.matricNumber,
        s.department,
        s.isValid ? "Valid" : "Invalid"
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "student-data-preview.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Student Preview ({students.length} total)
              </CardTitle>
              <CardDescription>
                Review and edit student data before sending invitations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={showManualForm} onOpenChange={setShowManualForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manually
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Student Manually</DialogTitle>
                    <DialogDescription>
                      Enter student information manually
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        value={manualForm.email}
                        onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="student@university.edu"
                        type="email"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <Input
                        value={manualForm.name}
                        onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Matric Number</label>
                      <Input
                        value={manualForm.matricNumber}
                        onChange={(e) => setManualForm(prev => ({ ...prev, matricNumber: e.target.value }))}
                        placeholder="CS123456"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Department</label>
                      <Select value={manualForm.department} onValueChange={(value) => setManualForm(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowManualForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddManual}>
                        Add Student
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{students.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validStudents.length}</div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{invalidStudents.length}</div>
              <div className="text-sm text-muted-foreground">Invalid</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{selectedStudents.size}</div>
              <div className="text-sm text-muted-foreground">Selected</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterValid} onValueChange={(value: "all" | "valid" | "invalid") => setFilterValid(value)}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="valid">Valid Only</SelectItem>
                <SelectItem value="invalid">Invalid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedStudents.size === validStudents.length && validStudents.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all valid students ({validStudents.length})
              </span>
            </div>
            <Button 
              onClick={handleInviteSelected} 
              disabled={selectedStudents.size === 0 || isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Invite Selected ({selectedStudents.size})
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Matric Number</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                        disabled={!student.isValid}
                      />
                    </TableCell>
                    <TableCell>
                      {editingId === student.id ? (
                        <Input
                          value={editingData?.email || ""}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, email: e.target.value } : null)}
                          className="w-full"
                        />
                      ) : (
                        <span className="font-mono text-sm">{student.email}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === student.id ? (
                        <Input
                          value={editingData?.name || ""}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full"
                        />
                      ) : (
                        <span>{student.name || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === student.id ? (
                        <Input
                          value={editingData?.matricNumber || ""}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, matricNumber: e.target.value } : null)}
                          className="w-full"
                        />
                      ) : (
                        <span>{student.matricNumber || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === student.id ? (
                        <Select 
                          value={editingData?.department || ""} 
                          onValueChange={(value) => setEditingData(prev => prev ? { ...prev, department: value } : null)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span>{student.department || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.isValid ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Invalid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingId === student.id ? (
                          <>
                            <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(student.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No students found matching your criteria</p>
            </div>
          )}

          {/* Error Summary */}
          {invalidStudents.length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{invalidStudents.length} students have validation errors:</strong>
                <ul className="mt-2 space-y-1">
                  {invalidStudents.slice(0, 3).map(student => (
                    <li key={student.id} className="text-sm">
                      {student.email}: {student.errors.join(", ")}
                    </li>
                  ))}
                  {invalidStudents.length > 3 && (
                    <li className="text-sm">... and {invalidStudents.length - 3} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
