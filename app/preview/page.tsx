"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { SetLocation } from '@/components/set-location'
import { CreateSession } from '@/components/create-session'
import { CheckIn } from '@/components/check-in'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, MapPin, Play, CheckCircle, AlertCircle } from 'lucide-react'

type ViewMode = 'lecturer' | 'student'

export default function PreviewPage() {
  const { user, userRole } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('lecturer')

  const toggleViewMode = () => {
    setViewMode(viewMode === 'lecturer' ? 'student' : 'lecturer')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Check-In System Preview</h1>
          <p className="text-gray-600">Test the role-based location check-in functionality</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            Current Role: {userRole || 'Not logged in'}
          </Badge>
          <Button onClick={toggleViewMode} variant="outline">
            Switch to {viewMode === 'lecturer' ? 'Student' : 'Lecturer'} View
          </Button>
        </div>
      </div>

      {!user && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to test the location check-in system. You can create test users with different roles.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="lecturer" value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lecturer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lecturer View
          </TabsTrigger>
          <TabsTrigger value="student" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Student View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lecturer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lecturer Features
              </CardTitle>
              <CardDescription>
                As a lecturer, you can manage class locations and create attendance sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-4 w-4" />
                      Location Management
                    </CardTitle>
                    <CardDescription>
                      Set up class locations with GPS coordinates and check-in radius
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Capture GPS coordinates</li>
                      <li>• Set location name and radius</li>
                      <li>• Preview on interactive map</li>
                      <li>• Save and reuse locations</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Play className="h-4 w-4" />
                      Session Management
                    </CardTitle>
                    <CardDescription>
                      Create 15-minute attendance sessions for students to check in
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Select saved location</li>
                      <li>• Set course code</li>
                      <li>• Start timed session</li>
                      <li>• Monitor active sessions</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Management</CardTitle>
                <CardDescription>Test location creation and management</CardDescription>
              </CardHeader>
              <CardContent>
                <SetLocation />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>Test session creation and monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateSession />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="student" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Student Features
              </CardTitle>
              <CardDescription>
                As a student, you can view active sessions and check in using your location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-4 w-4" />
                      Check-In Process
                    </CardTitle>
                    <CardDescription>
                      Check in to active class sessions using GPS location
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• View active sessions</li>
                      <li>• Get GPS coordinates</li>
                      <li>• Validate location proximity</li>
                      <li>• Record attendance</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-4 w-4" />
                      Location Validation
                    </CardTitle>
                    <CardDescription>
                      System validates you're within the allowed radius
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Real-time distance calculation</li>
                      <li>• Radius validation</li>
                      <li>• Session time validation</li>
                      <li>• Duplicate check-in prevention</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Check-In</CardTitle>
              <CardDescription>Test the student check-in process</CardDescription>
            </CardHeader>
            <CardContent>
              <CheckIn />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
          <CardDescription>
            Follow these steps to test the complete user flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">As a Lecturer:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Switch to Lecturer View</li>
                <li>Go to Location Management</li>
                <li>Click "Use Current Location" or click on map</li>
                <li>Enter location name and radius</li>
                <li>Save the location</li>
                <li>Go to Session Management</li>
                <li>Select saved location and enter course code</li>
                <li>Start the session</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">As a Student:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Switch to Student View</li>
                <li>Go to Check-In page</li>
                <li>View available sessions</li>
                <li>Click "Check In" on a session</li>
                <li>Allow location access when prompted</li>
                <li>Verify successful check-in</li>
                <li>Check attendance history</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
