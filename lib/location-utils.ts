// Haversine formula to calculate distance between two coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 1000 // Return distance in meters
}

// Verify if student is within geofence
export function isWithinGeofence(
  studentLat: number,
  studentLon: number,
  sessionLat: number,
  sessionLon: number,
  radiusMeters: number,
): boolean {
  const distance = calculateDistance(studentLat, studentLon, sessionLat, sessionLon)
  return distance <= radiusMeters
}

// Get user's IP address from request
export async function getUserIP(request?: Request): Promise<string> {
  if (!request) return "0.0.0.0"

  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "0.0.0.0"
  return ip
}

// Get approximate location from IP (fallback)
export async function getLocationFromIP(ip: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Using ip-api.com free tier (limited requests)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,status`)
    const data = await response.json()

    if (data.status === "success") {
      return {
        latitude: data.lat,
        longitude: data.lon,
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching IP location:", error)
    return null
  }
}
