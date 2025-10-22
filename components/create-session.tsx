"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseClient } from '@/lib/supabase/client'
import { SimpleMap } from '@/components/simple-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, MapPin, Play, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
  created_at: string
}

interface Session {
  id: string
  course_code: string
  location_id: string
  session_date: string
  expires_at: string
  created_at: string
  locations: Location
}

export function CreateSession() {
  const { user, userRole } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [courseCode, setCourseCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Check if user is a lecturer
  useEffect(() => {
    if (userRole && userRole !== 'lecturer' && userRole !== 'admin') {
      setError('Only lecturers can create sessions')
      setIsLoading(false)
    }
  }, [userRole])

  // Load data
  useEffect(() => {
    if (userRole === 'lecturer' || userRole === 'admin') {
      loadData()
    }
  }, [userRole])

  const loadData = async () => {
    try {
      const supabase = getSupabaseClient()
      
      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (locationsError) {
        console.error('Error loading locations:', locationsError)
        setError('Failed to load locations')
        return
      }

      setLocations(locationsData || [])

      // Load active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          locations (*)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError)
        setError('Failed to load sessions')
        return
      }

      setSessions(sessionsData || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const createSession = async () => {
    if (!selectedLocationId || !courseCode.trim()) {
      toast.error('Please select a location and enter a course code')
      return
    }

    if (!user) {
      toast.error('You must be logged in to create sessions')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          lecturer_id: user.id,
          course_code: courseCode.trim(),
          location_id: selectedLocationId,
          session_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
        })
        .select(`
          *,
          locations (*)
        `)
        .single()

      if (error) {
        console.error('Error creating session:', error)
        toast.error('Failed to create session')
        return
      }

      toast.success(`Session created for ${courseCode}! Students can now check in.`)
      setCourseCode('')
      setSelectedLocationId('')
      loadData() // Refresh the list
    } catch (err) {
      console.error('Error creating session:', err)
      toast.error('Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }

  const endSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to end this session? Students will no longer be able to check in.')) {
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('sessions')
        .update({ expires_at: new Date().toISOString() })
        .eq('id', sessionId)

      if (error) {
        console.error('Error ending session:', error)
        toast.error('Failed to end session')
        return
      }

      toast.success('Session ended successfully!')
      loadData() // Refresh the list
    } catch (err) {
      console.error('Error ending session:', err)
      toast.error('Failed to end session')
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

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && userRole !== 'lecturer' && userRole !== 'admin') {
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
        <h2 className="text-2xl font-bold">Create Class Session</h2>
        <p className="text-gray-600">Start a new attendance session for your class</p>
      </div>

      {/* Create new session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start New Session
          </CardTitle>
          <CardDescription>
            Create a 15-minute session for students to check in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code</Label>
              <Input
                id="courseCode"
                placeholder="e.g., CS101, MATH201"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location preview */}
          {selectedLocation && (
            <div className="space-y-2">
              <Label>Location Preview</Label>
              <SimpleMap
                center={[selectedLocation.latitude, selectedLocation.longitude]}
                radius={selectedLocation.radius}
                interactive={false}
                showRadius={true}
                height="200px"
              />
            </div>
          )}

          <Button 
            onClick={createSession} 
            disabled={!selectedLocationId || !courseCode.trim() || isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Session...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Session
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Currently running sessions that students can check in to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{session.course_code}</h3>
                    <p className="text-sm text-gray-600">{session.locations.name}</p>
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
                      variant="destructive"
                      size="sm"
                      onClick={() => endSession(session.id)}
                    >
                      End Session
                    </Button>
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
