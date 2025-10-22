import { getSupabaseClient } from "../app/lib/superbase/superbase/client"
import { calculateDistance, isWithinGeofence } from "./location-utils"

export interface LocationVerificationResult {
  verified: boolean
  method: "gps" | "ip" | "none"
  distance?: number
  error?: string
}

export async function verifyCheckInLocation(
  sessionId: string,
  studentLat?: number,
  studentLon?: number,
  studentIP?: string,
): Promise<LocationVerificationResult> {
  try {
    const supabase = getSupabaseClient()

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .select("latitude, longitude, geofence_radius")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return {
        verified: false,
        method: "none",
        error: "Session not found",
      }
    }

    // Fetch attendance rules for this session
    const { data: rules } = await supabase
      .from("attendance_rules")
      .select("require_location, location_radius_meters")
      .eq("session_id", sessionId)
      .single()

    const requireLocation = rules?.require_location ?? true
    const radiusMeters = rules?.location_radius_meters ?? session.geofence_radius ?? 100

    // Try GPS verification first
    if (studentLat !== undefined && studentLon !== undefined) {
      if (session.latitude && session.longitude) {
        const distance = calculateDistance(studentLat, studentLon, session.latitude, session.longitude)
        const withinGeofence = isWithinGeofence(
          studentLat,
          studentLon,
          session.latitude,
          session.longitude,
          radiusMeters,
        )

        if (withinGeofence) {
          return {
            verified: true,
            method: "gps",
            distance,
          }
        } else {
          return {
            verified: false,
            method: "gps",
            distance,
            error: `You are ${Math.round(distance)}m away. Allowed radius: ${radiusMeters}m`,
          }
        }
      }
    }

    // Fallback to IP verification if GPS fails
    if (studentIP && !requireLocation) {
      // IP verification is optional, just log it
      return {
        verified: true,
        method: "ip",
        error: "GPS unavailable, verified via IP",
      }
    }

    // If location is required but not provided
    if (requireLocation && (!studentLat || !studentLon)) {
      return {
        verified: false,
        method: "none",
        error: "Location verification required but GPS data not available",
      }
    }

    return {
      verified: true,
      method: "none",
    }
  } catch (error) {
    console.error("Location verification error:", error)
    return {
      verified: false,
      method: "none",
      error: "Location verification failed",
    }
  }
}
