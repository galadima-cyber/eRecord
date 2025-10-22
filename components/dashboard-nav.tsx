"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Home, CheckCircle, BarChart3, Bell, Settings, Menu, X, Users, FileText, Upload, MessageSquare, ClipboardList, MapPin, Play } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface DashboardNavProps {
  userRole: "student" | "lecturer" | "admin"
}

export function DashboardNav({ userRole }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const navItems =
    userRole === "student"
      ? [
          { icon: Home, label: "Dashboard", href: "/dashboard/student" },
          { icon: CheckCircle, label: "Check-In", href: "/check-in" },
          { icon: BarChart3, label: "Attendance", href: "/dashboard/student/attendance" },
          { icon: Bell, label: "Notifications", href: "/dashboard/student/notifications" },
          { icon: MessageSquare, label: "Feedback", href: "/dashboard/student/feedback" },
          { icon: Settings, label: "Settings", href: "/dashboard/student/settings" },
        ]
      : userRole === "lecturer"
        ? [
            { icon: Home, label: "Dashboard", href: "/dashboard/lecturer" },
            { icon: MapPin, label: "Locations", href: "/location-management" },
            { icon: Play, label: "Session Management", href: "/session-management" },
            { icon: CheckCircle, label: "Sessions", href: "/dashboard/lecturer/sessions" },
            { icon: Upload, label: "Add Students", href: "/dashboard/lecturer/upload-students" },
            { icon: ClipboardList, label: "Manual Attendance", href: "/dashboard/lecturer/manual-attendance" },
            { icon: BarChart3, label: "Reports", href: "/dashboard/lecturer/reports" },
            { icon: MessageSquare, label: "Announcements", href: "/dashboard/lecturer/announcements" },
            { icon: Settings, label: "Settings", href: "/dashboard/lecturer/settings" },
          ]
        : [
            { icon: Home, label: "Dashboard", href: "/dashboard/admin" },
            { icon: Users, label: "User Management", href: "/dashboard/admin/users" },
            { icon: BarChart3, label: "Analytics", href: "/dashboard/admin/analytics" },
            { icon: FileText, label: "Reports", href: "/dashboard/admin/reports" },
            { icon: Settings, label: "Settings", href: "/dashboard/admin/settings" },
          ]

  return (
    <nav className={cn(
      "bg-sidebar border-r border-sidebar-border h-screen flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">eRecord</h2>
            <p className="text-xs text-sidebar-foreground/60 mt-1 capitalize">{userRole}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed ? "justify-center px-2" : "justify-start",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
              )}
              onClick={() => router.push(item.href)}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && item.label}
            </Button>
          )
        })}
      </div>

      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="outline"
          className={cn(
            "w-full text-destructive hover:bg-destructive/10 bg-transparent border-destructive/20",
            isCollapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </nav>
  )
}
