"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseClient } from '@/lib/supabase/client'
import { SimpleMap } from '@/components/simple-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, MapPin, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
  created_at: string
}

export function SetLocation() {
  const { user, userRole } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [locationName, setLocationName] = useState('')
  const [radius, setRadius] = useState(50)
  const [error, setError] = useState<string | null>(null)

  // Check if user is a lecturer
  useEffect(() => {
    if (userRole && userRole !== 'lecturer' && userRole !== 'admin') {
      setError('Only lecturers can manage locations')
      setIsLoading(false)
    }
  }, [userRole])

  // Load existing locations
  useEffect(() => {
    if (userRole === 'lecturer' || userRole === 'admin') {
      loadLocations()
    }
  }, [userRole])

  const loadLocations = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading locations:', error)
        setError('Failed to load locations')
        return
      }

      setLocations(data || [])
    } catch (err) {
      console.error('Error loading locations:', err)
      setError('Failed to load locations')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation([latitude, longitude])
        toast.success('Current location detected')
      },
      (error) => {
        console.error('Error getting location:', error)
        toast.error('Unable to get your current location. Please allow location access.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setCurrentLocation([lat, lng])
  }

  const saveLocation = async () => {
    if (!currentLocation || !locationName.trim()) {
      toast.error('Please provide a location name and select a location on the map')
      return
    }

    if (!user) {
      toast.error('You must be logged in to save locations')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('locations')
        .insert({
          lecturer_id: user.id,
          name: locationName.trim(),
          latitude: currentLocation[0],
          longitude: currentLocation[1],
          radius: radius
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving location:', error)
        toast.error('Failed to save location')
        return
      }

      toast.success('Location saved successfully!')
      setLocationName('')
      setCurrentLocation(null)
      loadLocations() // Refresh the list
    } catch (err) {
      console.error('Error saving location:', err)
      toast.error('Failed to save location')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId)

      if (error) {
        console.error('Error deleting location:', error)
        toast.error('Failed to delete location')
        return
      }

      toast.success('Location deleted successfully!')
      loadLocations() // Refresh the list
    } catch (err) {
      console.error('Error deleting location:', err)
      toast.error('Failed to delete location')
    }
  }

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
        <h2 className="text-2xl font-bold">Manage Class Locations</h2>
        <p className="text-gray-600">Set up locations where students can check in for your classes</p>
      </div>

      {/* Create new location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Create New Location
          </CardTitle>
          <CardDescription>
            Set a location by clicking on the map or using your current GPS coordinates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                placeholder="e.g., Engineering Block 2, Room 101"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Check-in Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                min="10"
                max="500"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value) || 50)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={getCurrentLocation} variant="outline">
                Use Current Location
              </Button>
            </div>

            <SimpleMap
              center={currentLocation || [0, 0]}
              radius={radius}
              onLocationSelect={handleLocationSelect}
              interactive={true}
              showRadius={true}
              height="300px"
            />

            <Button 
              onClick={saveLocation} 
              disabled={!currentLocation || !locationName.trim() || isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Location
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing locations */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Locations</CardTitle>
          <CardDescription>
            Your previously saved locations for quick session creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No locations saved yet</p>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{location.name}</h3>
                    <p className="text-sm text-gray-600">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-500">Radius: {location.radius}m</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentLocation([location.latitude, location.longitude])
                        setLocationName(location.name)
                        setRadius(location.radius)
                      }}
                    >
                      Use
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteLocation(location.id)}
                    >
                      Delete
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
