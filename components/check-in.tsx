"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseClient } from '@/app/lib/superbase/superbase/client'
import { SimpleMap } from '@/components/simple-map'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, CheckCircle, AlertCircle, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Session {
  session_id: string
  course_code: string
  lecturer_name: string
  location_name: string
  latitude: number
  longitude: number
  radius: number
  expires_at: string
  created_at: string
}

interface AttendanceRecord {
  id: string
  session_id: string
  checked_in_at: string
  distance_meters: number
  sessions: {
    course_code: string
    locations: {
      name: string
    }
  }
}

export function CheckIn() {
  const { user, userRole } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if user is a student
  useEffect(() => {
    if (userRole && userRole !== 'student') {
      setError('Only students can check in to sessions')
      setIsLoading(false)
    }
  }, [userRole])

  // Load data
  useEffect(() => {
    if (userRole === 'student') {
      loadData()
    }
  }, [userRole])

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient()
      
      // Load active sessions using the function
      const { data: sessionsData, error: sessionsError } = await supabase
        .rpc('get_active_sessions_for_student', { student_uuid: user?.id })

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError)
        setError('Failed to load sessions')
        return
      }

      setSessions(sessionsData || [])

      // Load attendance history
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          session_id,
          checked_in_at,
          distance_meters,
          sessions!inner (
            course_code,
            locations!inner (
              name
            )
          )
        `)
        .eq('student_id', user?.id)
        .order('checked_in_at', { ascending: false })
        .limit(10)

      if (attendanceError) {
        console.error('Error loading attendance:', attendanceError)
        setError('Failed to load attendance history')
        return
      }

      setAttendanceHistory(attendanceData || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          resolve([latitude, longitude])
        },
        (error) => {
          console.error('Error getting location:', error)
          reject(new Error('Unable to get your current location'))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  const checkInToSession = async (sessionId: string) => {
    if (!user) {
      toast.error('You must be logged in to check in')
      return
    }

    setIsCheckingIn(sessionId)
    setLocationError(null)

    try {
      // Get current location
      const [latitude, longitude] = await getCurrentLocation()
      setCurrentLocation([latitude, longitude])

      // Call the edge function to validate check-in
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.functions.invoke('validate-checkin', {
        body: {
          sessionId,
          latitude,
          longitude,
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      })

      if (error) {
        console.error('Error calling validate-checkin:', error)
        toast.error('Failed to check in. Please try again.')
        return
      }

      if (data.success) {
        toast.success(data.message)
        loadData() // Refresh the data
      } else {
        toast.error(data.message)
        setLocationError(data.message)
      }
    } catch (err) {
      console.error('Error checking in:', err)
      if (err instanceof Error) {
        toast.error(err.message)
        setLocationError(err.message)
      } else {
        toast.error('Failed to check in. Please try again.')
      }
    } finally {
      setIsCheckingIn(null)
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && userRole !== 'student') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Check In to Class</h2>
        <p className="text-gray-600">Select an active session to check in</p>
      </div>

      {/* Location error */}
      {locationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {/* Current location display */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Your Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleMap
              center={currentLocation}
              interactive={false}
              showRadius={false}
              height="200px"
            />
            <p className="text-sm text-gray-600 mt-2">
              {currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Sessions
          </CardTitle>
          <CardDescription>
            Click "Check In" to join a class session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active sessions available</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.session_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{session.course_code}</h3>
                      <Badge variant="secondary">{session.location_name}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Lecturer: {session.lecturer_name}</p>
                    <p className="text-sm text-gray-500">
                      Started: {new Date(session.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {getTimeRemaining(session.expires_at)}
                      </p>
                      <p className="text-xs text-gray-500">remaining</p>
                    </div>
                    <Button
                      onClick={() => checkInToSession(session.session_id)}
                      disabled={isCheckingIn === session.session_id}
                      className="min-w-[100px]"
                    >
                      {isCheckingIn === session.session_id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Check In
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Check-ins
          </CardTitle>
          <CardDescription>
            Your recent attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No check-ins yet</p>
          ) : (
            <div className="space-y-3">
              {attendanceHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{record.sessions.course_code}</h3>
                    <p className="text-sm text-gray-600">{record.sessions.locations.name}</p>
                    <p className="text-sm text-gray-500">
                      Checked in: {new Date(record.checked_in_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDistance(record.distance_meters)} away
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
