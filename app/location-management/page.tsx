"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { SetLocation } from '@/components/set-location'
import { useAuth } from "@/lib/auth-context"

export default function LocationManagementPage() {
  const router = useRouter()
  const { user, isLoading, userRole } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardNav userRole={userRole || "lecturer"} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <SetLocation />
        </div>
      </main>
    </div>
  )
}
