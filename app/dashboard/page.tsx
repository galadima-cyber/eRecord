"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Bell, Settings, LogOut, Menu, X, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

const attendanceData = [
  { month: "Jan", attendance: 85, target: 90 },
  { month: "Feb", attendance: 88, target: 90 },
  { month: "Mar", attendance: 92, target: 90 },
  { month: "Apr", attendance: 87, target: 90 },
  { month: "May", attendance: 91, target: 90 },
  { month: "Jun", attendance: 89, target: 90 },
]

const sessionData = [
  { name: "Present", value: 42, color: "#059669" },
  { name: "Absent", value: 8, color: "#dc2626" },
]

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userRole] = useState("student") // Can be 'student', 'lecturer', 'admin'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-muted rounded-lg">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-bold text-foreground">eRecord Timeless</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-lg relative">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-muted rounded-lg">
              <Settings className="w-5 h-5 text-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg">
              <LogOut className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } hidden md:block border-r border-border bg-sidebar transition-all duration-300`}
        >
          <nav className="p-6 space-y-2">
            <Link
              href="/dashboard"
              className="block px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
            >
              Dashboard
            </Link>
            {userRole === "student" && (
              <>
                <Link href="/check-in" className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground">
                  Check In
                </Link>
                <Link href="/my-attendance" className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground">
                  My Attendance
                </Link>
              </>
            )}
            {userRole === "lecturer" && (
              <>
                <Link href="/sessions" className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground">
                  Sessions
                </Link>
                <Link href="/reports" className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground">
                  Reports
                </Link>
              </>
            )}
            {userRole === "admin" && (
              <>
                <Link href="/users" className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground">
                  Users
                </Link>
                <Link href="/analytics" className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground">
                  Analytics
                </Link>
              </>
            )}
            <Link href="/notifications" className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground">
              Notifications
            </Link>
            <Link href="/settings" className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground">
              Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Dr. Bello!</h2>
            <p className="text-muted-foreground">Ready to take attendance today?</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">89%</div>
                <p className="text-xs text-muted-foreground mt-1">+2% from last month</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">3</div>
                <p className="text-xs text-muted-foreground mt-1">Today</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">142</div>
                <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">2:00 PM</div>
                <p className="text-xs text-muted-foreground mt-1">Data Structures</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Attendance Trend */}
            <Card className="lg:col-span-2 border-border">
              <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>Monthly attendance rate vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" stroke="#2563EB" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Session Status */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Today's Session</CardTitle>
                <CardDescription>Check-in status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sessionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sessionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>42 Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span>8 Absent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-12">Create Session</Button>
                <Button variant="outline" className="border-border h-12 bg-transparent">
                  View Reports
                </Button>
                <Button variant="outline" className="border-border h-12 bg-transparent">
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
