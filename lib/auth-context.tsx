"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js"
import { getSupabaseClient } from "./supabase/client"

interface AuthContextType {
  user: User | null
  userRole: string | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserRole = async (userId: string) => {
    try {
      const supabase = getSupabaseClient()
      console.log("[Auth] Fetching user role for:", userId)

      const { data: userData, error } = await supabase.from("users").select("role").eq("id", userId).single()

      if (error) {
        console.error("[Auth] Error fetching user role:", error.message, error.code)
        // If user profile doesn't exist yet, default to 'student'
        if (error.code === "PGRST116") {
          console.log("[Auth] User profile not found, defaulting to student role")
          setUserRole("student")
          setIsLoading(false)
          return "student"
        }
        setIsLoading(false)
        return null
      }

      console.log("[Auth] User role fetched:", userData?.role)
      setUserRole(userData?.role ?? "student")
      setIsLoading(false)
      return userData?.role ?? "student"
    } catch (error) {
      console.error("[Auth] Exception fetching user role:", error)
      setIsLoading(false)
      return null
    }
  }

  useEffect(() => {
    const supabase = getSupabaseClient()

    const initializeAuth = async () => {
      try {
        console.log("[Auth] Initializing auth...")
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[Auth] Error getting session:", error)
          setIsLoading(false)
          return
        }

        console.log("[Auth] Session user:", session?.user?.id)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserRole(session.user.id)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("[Auth] Error initializing auth:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log("[Auth] Auth state changed:", event, session?.user?.id)
      
      // Handle different auth events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserRole(session.user.id)
        } else {
          setIsLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole(null)
        setIsLoading(false)
      } else if (event === 'INITIAL_SESSION') {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserRole(session.user.id)
        } else {
          setIsLoading(false)
        }
      } else {
        // For any other events, ensure loading is set to false
        setIsLoading(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
  }

  return <AuthContext.Provider value={{ user, userRole, isLoading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
