import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")

  // console.log("[v0] Auth callback - code:", code ? "present" : "missing")
  // console.log("[v0] Auth callback - error:", error)

  if (error) {
    // console.log("[v0] Auth error:", error_description || error)
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error_description || error)}`, request.url))
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch (error) {
              // console.log("[v0] Cookie error:", error)
            }
          },
        },
      },
    )

    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    // console.log("[v0] Exchange result - error:", exchangeError?.message)
    // console.log("[v0] Exchange result - user:", sessionData?.user?.id)

    if (exchangeError) {
      // console.log("[v0] Exchange error details:", exchangeError)
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(exchangeError.message)}`, request.url))
    }

    if (sessionData?.user) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", sessionData.user.id)
        .single()

      // console.log("[v0] User role fetch - error:", userError?.message)
      // console.log("[v0] User role:", userData?.role)

      if (userError) {
        // console.log("[v0] User fetch error:", userError)
        // Default to student if role fetch fails
        return NextResponse.redirect(new URL("/dashboard/student", request.url))
      }

      // Route based on role
      let dashboardPath = "/dashboard/student" // default
      if (userData?.role === "admin") {
        dashboardPath = "/dashboard/admin"
      } else if (userData?.role === "lecturer") {
        dashboardPath = "/dashboard/lecturer"
      } else if (userData?.role === "student") {
        dashboardPath = "/dashboard/student"
      }
      
      // console.log("[v0] Redirecting to:", dashboardPath)
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }
  }

  // console.log("[v0] No code or user, redirecting to home")
  return NextResponse.redirect(new URL("/", request.url))
}
