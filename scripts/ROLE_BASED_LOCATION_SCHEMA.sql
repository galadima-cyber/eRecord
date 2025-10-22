-- ============================================================================
-- Role-Based Location Check-In System Schema Extension
-- Extends existing eRecord Timeless schema for location-based attendance
-- ============================================================================

-- ============================================================================
-- ROLES TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL
);

-- Insert default roles if they don't exist
INSERT INTO roles (name) VALUES ('admin'), ('lecturer'), ('student')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- USER_ROLES TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id int REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- LOCATIONS TABLE
-- Stores lecturer-defined locations for classes
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius integer DEFAULT 50, -- in meters
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SESSIONS TABLE (New simplified sessions for location check-in)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_code text NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  session_date timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ATTENDANCE TABLE (New simplified attendance for location check-in)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at timestamptz DEFAULT now(),
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  device_info jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, student_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_lecturer ON locations(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_locations_created ON locations(created_at DESC);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_lecturer ON sessions(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_location ON sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_code);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_checked_in ON attendance(checked_in_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - ROLES TABLE
-- ============================================================================

-- Everyone can read roles
CREATE POLICY "roles_select_all" ON roles
  FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES - USER_ROLES TABLE
-- ============================================================================

-- Users can view their own roles
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all user roles
CREATE POLICY "user_roles_admin_all" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - LOCATIONS TABLE
-- ============================================================================

-- Lecturers can manage their own locations
CREATE POLICY "lecturer_owns_location" ON locations
  FOR ALL USING (lecturer_id = auth.uid())
  WITH CHECK (lecturer_id = auth.uid());

-- Admins can view all locations
CREATE POLICY "admin_view_locations" ON locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - SESSIONS TABLE
-- ============================================================================

-- Lecturers can manage their own sessions
CREATE POLICY "lecturer_owns_session" ON sessions
  FOR ALL USING (lecturer_id = auth.uid())
  WITH CHECK (lecturer_id = auth.uid());

-- Students can view active sessions (for check-in)
CREATE POLICY "students_view_active_sessions" ON sessions
  FOR SELECT USING (
    expires_at > now() AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Admins can view all sessions
CREATE POLICY "admin_view_sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - ATTENDANCE TABLE
-- ============================================================================

-- Students can check in to sessions
CREATE POLICY "student_checkin_self" ON attendance
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can view their own attendance
CREATE POLICY "student_view_own_attendance" ON attendance
  FOR SELECT USING (student_id = auth.uid());

-- Lecturers can view attendance for their sessions
CREATE POLICY "lecturer_view_attendance" ON attendance
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE lecturer_id = auth.uid())
  );

-- Admins can view all attendance
CREATE POLICY "admin_view_attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) RETURNS double precision AS $$
DECLARE
  R double precision := 6371000; -- Earth radius in meters
  dLat double precision;
  dLon double precision;
  a double precision;
  c double precision;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to verify if location is within radius
CREATE OR REPLACE FUNCTION is_within_radius(
  center_lat double precision,
  center_lon double precision,
  check_lat double precision,
  check_lon double precision,
  radius_meters integer
) RETURNS boolean AS $$
BEGIN
  RETURN calculate_distance_meters(center_lat, center_lon, check_lat, check_lon) <= radius_meters;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get active sessions for a student
CREATE OR REPLACE FUNCTION get_active_sessions_for_student(student_uuid uuid)
RETURNS TABLE(
  session_id uuid,
  course_code text,
  lecturer_name text,
  location_name text,
  latitude double precision,
  longitude double precision,
  radius integer,
  expires_at timestamptz,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as session_id,
    s.course_code,
    u.full_name as lecturer_name,
    l.name as location_name,
    l.latitude,
    l.longitude,
    l.radius,
    s.expires_at,
    s.created_at
  FROM sessions s
  JOIN locations l ON s.location_id = l.id
  JOIN users u ON s.lecturer_id = u.id
  WHERE s.expires_at > now()
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if student has already checked in
CREATE OR REPLACE FUNCTION has_student_checked_in(
  session_uuid uuid,
  student_uuid uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM attendance 
    WHERE session_id = session_uuid AND student_id = student_uuid
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Role-Based Location Check-In System schema created successfully!';
  RAISE NOTICE '📊 New tables: roles, user_roles, locations, sessions, attendance';
  RAISE NOTICE '🔒 Row Level Security enabled on all new tables';
  RAISE NOTICE '🎯 Ready for location-based attendance!';
END $$;
