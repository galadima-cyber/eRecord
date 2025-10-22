"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle, Settings } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface AttendanceRulesFormProps {
  sessionId: string
}

export function AttendanceRulesForm({ sessionId }: AttendanceRulesFormProps) {
  const [latenessThreshold, setLatenessThreshold] = useState(15)
  const [locationRadius, setLocationRadius] = useState(100)
  const [autoCloseMinutes, setAutoCloseMinutes] = useState(60)
  const [requireBiometric, setRequireBiometric] = useState(true)
  const [requireLocation, setRequireLocation] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const { data } = await supabase.from("attendance_rules").select("*").eq("session_id", sessionId).single()

        if (data) {
          setLatenessThreshold(data.lateness_threshold_minutes)
          setLocationRadius(data.location_radius_meters)
          setAutoCloseMinutes(data.auto_close_minutes)
          setRequireBiometric(data.require_biometric)
          setRequireLocation(data.require_location)
        }
      } catch (error) {
        console.error("Error fetching rules:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRules()
  }, [sessionId, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const { error: upsertError } = await supabase.from("attendance_rules").upsert({
        session_id: sessionId,
        lateness_threshold_minutes: latenessThreshold,
        location_radius_meters: locationRadius,
        auto_close_minutes: autoCloseMinutes,
        require_biometric: requireBiometric,
        require_location: requireLocation,
      })

      if (upsertError) {
        setError("Failed to save rules")
        setSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading rules...</div>
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Attendance Rules
        </CardTitle>
        <CardDescription>Configure attendance verification requirements for this session</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Rules saved successfully!</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Verification Requirements</h3>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label className="text-foreground">Require Biometric Verification</Label>
                <p className="text-xs text-muted-foreground">Students must verify with fingerprint or face</p>
              </div>
              <Switch checked={requireBiometric} onCheckedChange={setRequireBiometric} />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label className="text-foreground">Require Location Verification</Label>
                <p className="text-xs text-muted-foreground">Students must be within geofence</p>
              </div>
              <Switch checked={requireLocation} onCheckedChange={setRequireLocation} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Timing & Distance</h3>

            <div className="space-y-2">
              <Label htmlFor="lateness">Lateness Threshold (minutes)</Label>
              <Input
                id="lateness"
                type="number"
                min="0"
                max="120"
                value={latenessThreshold}
                onChange={(e) => setLatenessThreshold(Number(e.target.value))}
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">
                Students checking in after this time will be marked as late
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Location Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                min="10"
                max="1000"
                value={locationRadius}
                onChange={(e) => setLocationRadius(Number(e.target.value))}
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">Maximum distance from session location for check-in</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autoclose">Auto-Close Session (minutes)</Label>
              <Input
                id="autoclose"
                type="number"
                min="15"
                max="480"
                value={autoCloseMinutes}
                onChange={(e) => setAutoCloseMinutes(Number(e.target.value))}
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">Session will automatically close after this duration</p>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Rules"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
