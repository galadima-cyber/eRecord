import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckInRequest {
  sessionId: string
  latitude: number
  longitude: number
  deviceInfo?: any
}

interface CheckInResponse {
  success: boolean
  message: string
  data?: {
    attendanceId: string
    distance: number
    checkedInAt: string
  }
  error?: string
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        } as CheckInResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { sessionId, latitude, longitude, deviceInfo }: CheckInRequest = await req.json()

    if (!sessionId || latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields',
          error: 'sessionId, latitude, and longitude are required'
        } as CheckInResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid coordinates',
          error: 'Latitude must be between -90 and 90, longitude between -180 and 180'
        } as CheckInResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get session details with location
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('sessions')
      .select(`
        id,
        lecturer_id,
        course_code,
        expires_at,
        created_at,
        locations!inner (
          id,
          name,
          latitude,
          longitude,
          radius
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Session not found',
          error: 'Invalid session ID'
        } as CheckInResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if session has expired
    const now = new Date()
    const expiresAt = new Date(sessionData.expires_at)
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Session has expired',
          error: 'This session is no longer active'
        } as CheckInResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if student has already checked in
    const { data: existingAttendance, error: attendanceError } = await supabaseClient
      .from('attendance')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', user.id)
      .single()

    if (attendanceError && attendanceError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Database error',
          error: 'Failed to check existing attendance'
        } as CheckInResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (existingAttendance) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Already checked in',
          error: 'You have already checked in to this session'
        } as CheckInResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate distance from session location
    const location = sessionData.locations
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      latitude,
      longitude
    )

    // Check if student is within the allowed radius
    if (distance > location.radius) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `You are ${Math.round(distance)}m away from the class location. Please move closer (within ${location.radius}m)`,
          error: 'Location not within allowed radius'
        } as CheckInResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Insert attendance record
    const { data: attendanceData, error: insertError } = await supabaseClient
      .from('attendance')
      .insert({
        session_id: sessionId,
        student_id: user.id,
        latitude,
        longitude,
        distance_meters: Math.round(distance),
        device_info: deviceInfo || null
      })
      .select('id, checked_in_at')
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to record attendance',
          error: 'Database error during check-in'
        } as CheckInResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully checked in to ${sessionData.course_code}!`,
        data: {
          attendanceId: attendanceData.id,
          distance: Math.round(distance),
          checkedInAt: attendanceData.checked_in_at
        }
      } as CheckInResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Check-in validation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: 'An unexpected error occurred'
      } as CheckInResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
