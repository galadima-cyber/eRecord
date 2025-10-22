import { type NextRequest, NextResponse } from "next/server"
import { verifyCheckInLocation } from "@/lib/geolocation-service"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, latitude, longitude } = await request.json()

    if (!sessionId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const result = await verifyCheckInLocation(sessionId, latitude, longitude)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Location verification error:", error)
    return NextResponse.json({ error: "Location verification failed" }, { status: 500 })
  }
}
