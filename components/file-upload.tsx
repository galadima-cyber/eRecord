"use client"

import React, { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, AlertCircle, FileUp, X, CheckCircle, Users, Mail, UserPlus } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { toast } from "sonner"

export interface StudentData {
  id: string
  email: string
  name: string
  matricNumber: string
  department: string
  isValid: boolean
  errors: string[]
}

interface FileUploadProps {
  onDataExtracted: (data: StudentData[]) => void
  onUploadProgress?: (progress: number) => void
  maxFileSize?: number // in MB
  acceptedFormats?: string[]
}

export function FileUpload({ 
  onDataExtracted, 
  onUploadProgress,
  maxFileSize = 10,
  acceptedFormats = [".csv", ".xlsx", ".xls", ".pdf"]
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxFileSize * 1024 * 1024
    
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxFileSize}MB`
    }

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!acceptedFormats.includes(fileExtension)) {
      return `File format not supported. Accepted formats: ${acceptedFormats.join(", ")}`
    }

    return null
  }

  const extractEmailFromText = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    return text.match(emailRegex) || []
  }

  const extractMatricNumber = (text: string): string => {
    // Common matric number patterns
    const patterns = [
      /[A-Z]{2,3}\d{6,8}/g, // e.g., CS123456, ENG12345678
      /\d{8,10}/g, // e.g., 12345678, 1234567890
      /[A-Z]\d{7,9}/g, // e.g., A12345678
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return match[0]
    }
    
    return ""
  }

  const parseCSV = async (file: File): Promise<StudentData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const students: StudentData[] = results.data.map((row: any, index: number) => {
              const email = row.email || row.Email || row.EMAIL || ""
              const name = row.name || row.Name || row.NAME || row.full_name || row.Full_Name || ""
              const matricNumber = row.matric || row.Matric || row.MATRIC || row.registration || row.Registration || ""
              const department = row.department || row.Department || row.DEPARTMENT || ""

              const errors: string[] = []
              if (!email) errors.push("Email is required")
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format")

              return {
                id: `csv-${index}`,
                email: email.toLowerCase().trim(),
                name: name.trim(),
                matricNumber: matricNumber.trim(),
                department: department.trim(),
                isValid: errors.length === 0,
                errors
              }
            }).filter((student: StudentData) => student.email) // Remove rows without email

            resolve(students)
          } catch (err) {
            reject(new Error("Failed to parse CSV file"))
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        }
      })
    })
  }

  const parseExcel = async (file: File): Promise<StudentData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (jsonData.length < 2) {
            reject(new Error("Excel file must contain at least a header row and one data row"))
            return
          }

          const headers = jsonData[0] as string[]
          const emailIndex = headers.findIndex(h => 
            h?.toLowerCase().includes('email') || h?.toLowerCase().includes('e-mail')
          )
          const nameIndex = headers.findIndex(h => 
            h?.toLowerCase().includes('name') || h?.toLowerCase().includes('full')
          )
          const matricIndex = headers.findIndex(h => 
            h?.toLowerCase().includes('matric') || h?.toLowerCase().includes('registration') || h?.toLowerCase().includes('reg')
          )
          const deptIndex = headers.findIndex(h => 
            h?.toLowerCase().includes('department') || h?.toLowerCase().includes('dept')
          )

          const students: StudentData[] = jsonData.slice(1).map((row: any[], index: number) => {
            const email = emailIndex >= 0 ? (row[emailIndex] || "").toString() : ""
            const name = nameIndex >= 0 ? (row[nameIndex] || "").toString() : ""
            const matricNumber = matricIndex >= 0 ? (row[matricIndex] || "").toString() : ""
            const department = deptIndex >= 0 ? (row[deptIndex] || "").toString() : ""

            const errors: string[] = []
            if (!email) errors.push("Email is required")
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format")

            return {
              id: `excel-${index}`,
              email: email.toLowerCase().trim(),
              name: name.trim(),
              matricNumber: matricNumber.trim(),
              department: department.trim(),
              isValid: errors.length === 0,
              errors
            }
          }).filter((student: StudentData) => student.email)

          resolve(students)
        } catch (err) {
          reject(new Error("Failed to parse Excel file"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read Excel file"))
      reader.readAsArrayBuffer(file)
    })
  }

  const parsePDF = async (file: File): Promise<StudentData[]> => {
    // For PDF parsing, we'll use a simple text extraction approach
    // In a production environment, you might want to use a more robust PDF parser
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          // This is a simplified approach - in production, use pdf-parse or similar
          const text = e.target?.result as string
          const emails = extractEmailFromText(text)
          
          const students: StudentData[] = emails.map((email, index) => {
            const errors: string[] = []
            if (!email) errors.push("Email is required")
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format")

            return {
              id: `pdf-${index}`,
              email: email.toLowerCase().trim(),
              name: "",
              matricNumber: extractMatricNumber(text),
              department: "",
              isValid: errors.length === 0,
              errors
            }
          })

          resolve(students)
        } catch (err) {
          reject(new Error("Failed to parse PDF file"))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read PDF file"))
      reader.readAsText(file)
    })
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setProgress(0)
    setFileInfo({ name: file.name, size: file.size })

    try {
      onUploadProgress?.(10)
      setProgress(10)

      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      let students: StudentData[] = []

      onUploadProgress?.(30)
      setProgress(30)

      switch (fileExtension) {
        case '.csv':
          students = await parseCSV(file)
          break
        case '.xlsx':
        case '.xls':
          students = await parseExcel(file)
          break
        case '.pdf':
          students = await parsePDF(file)
          break
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`)
      }

      onUploadProgress?.(80)
      setProgress(80)

      // Remove duplicates based on email
      const uniqueStudents = students.reduce((acc, student) => {
        if (!acc.find(s => s.email === student.email)) {
          acc.push(student)
        }
        return acc
      }, [] as StudentData[])

      onUploadProgress?.(100)
      setProgress(100)

      setTimeout(() => {
        onDataExtracted(uniqueStudents)
        setIsProcessing(false)
        toast.success(`Successfully extracted ${uniqueStudents.length} student records`)
      }, 500)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file")
      setIsProcessing(false)
      toast.error("Failed to process file")
    }
  }

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    processFile(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const clearFile = () => {
    setFileInfo(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="w-5 h-5 text-primary" />
          Upload Student Data
        </CardTitle>
        <CardDescription>
          Upload CSV, Excel, or PDF files containing student information. 
          Supported formats: {acceptedFormats.join(", ")} (max {maxFileSize}MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {fileInfo && !isProcessing && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">{fileInfo.name}</span>
              <Badge variant="secondary" className="text-xs">
                {formatFileSize(fileInfo.size)}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing file...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {!fileInfo && !isProcessing && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(",")}
              onChange={handleFileInputChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragOver ? "Drop file here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-muted-foreground">
                CSV, Excel, or PDF files up to {maxFileSize}MB
              </p>
            </label>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Student Data</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Mail className="w-4 h-4" />
            <span>Email Required</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <UserPlus className="w-4 h-4" />
            <span>Auto Extract</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
