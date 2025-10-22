"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Download, Filter } from "lucide-react"

const courseData = [
  { course: "Data Structures", present: 38, absent: 4, late: 2 },
  { course: "Algorithms", present: 40, absent: 2, late: 2 },
  { course: "Database Design", present: 35, absent: 5, late: 4 },
  { course: "Web Development", present: 42, absent: 1, late: 1 },
  { course: "Mobile Apps", present: 39, absent: 3, late: 2 },
]

const trendData = [
  { week: "Week 1", attendance: 85 },
  { week: "Week 2", attendance: 87 },
  { week: "Week 3", attendance: 82 },
  { week: "Week 4", attendance: 90 },
  { week: "Week 5", attendance: 88 },
  { week: "Week 6", attendance: 91 },
]

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">View attendance statistics and trends</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course" className="text-foreground">
                  Course
                </Label>
                <Input id="course" placeholder="Select course" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-foreground">
                  From Date
                </Label>
                <Input id="date-from" type="date" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-foreground">
                  To Date
                </Label>
                <Input id="date-to" type="date" className="bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">&nbsp;</Label>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Attendance by Course */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Attendance by Course</CardTitle>
              <CardDescription>Present, Absent, and Late students</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="course" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                  <Legend />
                  <Bar dataKey="present" fill="#059669" />
                  <Bar dataKey="absent" fill="#dc2626" />
                  <Bar dataKey="late" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Attendance Trend */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Weekly average attendance rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                  <Line type="monotone" dataKey="attendance" stroke="#2563EB" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Export Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download attendance reports in your preferred format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="outline" className="border-border bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export as Excel
              </Button>
              <Button variant="outline" className="border-border bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
