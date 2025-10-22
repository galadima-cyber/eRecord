"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, AlertCircle, CheckCircle, Loader } from "lucide-react"

interface LocationCheckInProps {
  sessionId: string
  sessionLocation?: string
  onLocationVerified: (lat: number, lon: number) => void
  onLocationFailed: (error: string) => void
}

export function LocationCheckIn({
  sessionId,
  sessionLocation,
  onLocationVerified,
  onLocationFailed,
}: LocationCheckInProps) {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [verified, setVerified] = useState(false)

  const requestLocation = async () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lon: longitude })

        // Verify location with backend
        try {
          const response = await fetch("/api/verify-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              latitude,
              longitude,
            }),
          })

          const result = await response.json()

          if (result.verified) {
            setVerified(true)
            setDistance(result.distance)
            onLocationVerified(latitude, longitude)
          } else {
            setError(result.error || "Location verification failed")
            onLocationFailed(result.error || "Location verification failed")
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Failed to verify location"
          setError(errorMsg)
          onLocationFailed(errorMsg)
        }

        setLoading(false)
      },
      (error) => {
        let errorMsg = "Failed to get location"
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please enable location access."
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable."
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out."
        }
        setError(errorMsg)
        onLocationFailed(errorMsg)
        setLoading(false)
      },
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Location Verification
        </CardTitle>
        <CardDescription>Verify your location to check in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionLocation && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Session Location: {sessionLocation}</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {verified && location && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Location verified successfully
              {distance && <span> ({Math.round(distance)}m away)</span>}
            </AlertDescription>
          </Alert>
        )}

        {location && !verified && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Current Location:</p>
            <p className="text-sm text-muted-foreground">
              Latitude: {location.lat.toFixed(6)}, Longitude: {location.lon.toFixed(6)}
            </p>
            {distance && <p className="text-sm text-muted-foreground mt-2">Distance: {Math.round(distance)}m</p>}
          </div>
        )}

        <Button
          onClick={requestLocation}
          disabled={loading || verified}
          className="w-full"
          variant={verified ? "outline" : "default"}
        >
          {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          {verified ? "Location Verified" : loading ? "Getting Location..." : "Enable Location"}
        </Button>
      </CardContent>
    </Card>
  )
}
