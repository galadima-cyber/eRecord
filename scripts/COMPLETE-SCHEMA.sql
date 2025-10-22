-- ============================================================================
-- eRecord Timeless - Complete Database Schema
-- Production-Ready Schema for Attendance Management System
-- ============================================================================

-- Drop existing tables if they exist (for fresh install)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- USERS TABLE
-- Stores all user information (students, lecturers, admins)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
  student_id TEXT UNIQUE,
  staff_id TEXT UNIQUE,
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COURSES TABLE
-- Stores course information
-- ============================================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  credits INTEGER,
  semester TEXT,
  academic_year TEXT,
  lecturer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ATTENDANCE SESSIONS TABLE
-- Stores individual class sessions
-- ============================================================================
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  venue_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geofence_radius INTEGER DEFAULT 100, -- in meters
  allow_late_checkin BOOLEAN DEFAULT TRUE,
  late_threshold_minutes INTEGER DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  qr_code TEXT, -- For QR code check-in
  session_code TEXT UNIQUE, -- Unique code for session
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COURSE ENROLLMENTS TABLE
-- Links students to courses
-- ============================================================================
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id),
  UNIQUE(student_id, session_id)
);

-- ============================================================================
-- ATTENDANCE RECORDS TABLE
-- Stores individual student check-ins
-- ============================================================================
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_in_ip_address INET,
  distance_from_venue DECIMAL(10, 2), -- in meters
  is_location_verified BOOLEAN DEFAULT FALSE,
  biometric_verified BOOLEAN DEFAULT FALSE,
  biometric_data JSONB, -- Store biometric verification data
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused', 'unverified')),
  marked_by UUID REFERENCES users(id), -- Lecturer who manually marked
  is_manual BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Stores system notifications for users
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'reminder', 'announcement')),
  category TEXT CHECK (category IN ('session', 'attendance', 'system', 'announcement', 'feedback')),
  related_session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  related_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_label TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANNOUNCEMENTS TABLE
-- Stores announcements from lecturers to students
-- ============================================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'reminder', 'cancellation')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'course', 'session')),
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB, -- Store file URLs/metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FEEDBACK TABLE
-- Stores student feedback and suggestions
-- ============================================================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT CHECK (category IN ('technical', 'session', 'lecturer', 'system', 'suggestion', 'complaint')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'closed')),
  admin_response TEXT,
  responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOGS TABLE
-- Tracks all important system activities
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'user', 'session', 'attendance', etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id) WHERE staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);

-- Attendance sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_course ON attendance_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_lecturer ON attendance_sessions(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON attendance_sessions(session_code);

-- Course enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON course_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON course_enrollments(status);

-- Attendance records indexes
CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_records_checkin_time ON attendance_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_records_manual ON attendance_records(is_manual);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_lecturer ON announcements(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_announcements_course ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_session ON announcements(session_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_student ON feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - USERS TABLE
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;
DROP POLICY IF EXISTS "users_select_lecturer_students" ON users;

-- Users can view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert users
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update users
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete users
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lecturers can view students in their courses
CREATE POLICY "users_select_lecturer_students" ON users
  FOR SELECT USING (
    role = 'student' AND EXISTS (
      SELECT 1 FROM course_enrollments ce
      JOIN attendance_sessions s ON ce.session_id = s.id
      WHERE ce.student_id = users.id AND s.lecturer_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - COURSES TABLE
-- ============================================================================

-- Everyone can view active courses
CREATE POLICY "courses_select_all" ON courses
  FOR SELECT USING (is_active = TRUE);

-- Lecturers can create courses
CREATE POLICY "courses_insert_lecturer" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('lecturer', 'admin')
    )
  );

-- Lecturers can update their own courses
CREATE POLICY "courses_update_own" ON courses
  FOR UPDATE USING (
    lecturer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - ATTENDANCE SESSIONS TABLE
-- ============================================================================

-- Lecturers can view their own sessions
CREATE POLICY "sessions_select_lecturer" ON attendance_sessions
  FOR SELECT USING (lecturer_id = auth.uid());

-- Students can view active sessions they're enrolled in
CREATE POLICY "sessions_select_student" ON attendance_sessions
  FOR SELECT USING (
    status IN ('active', 'scheduled') AND EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE session_id = attendance_sessions.id AND student_id = auth.uid()
    )
  );

-- Admins can view all sessions
CREATE POLICY "sessions_select_admin" ON attendance_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lecturers can create sessions
CREATE POLICY "sessions_insert_lecturer" ON attendance_sessions
  FOR INSERT WITH CHECK (
    lecturer_id = auth.uid() AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'lecturer'
    )
  );

-- Lecturers can update their own sessions
CREATE POLICY "sessions_update_own" ON attendance_sessions
  FOR UPDATE USING (lecturer_id = auth.uid());

-- Lecturers can delete their own sessions
CREATE POLICY "sessions_delete_own" ON attendance_sessions
  FOR DELETE USING (lecturer_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - COURSE ENROLLMENTS TABLE
-- ============================================================================

-- Students can view their own enrollments
CREATE POLICY "enrollments_select_student" ON course_enrollments
  FOR SELECT USING (student_id = auth.uid());

-- Lecturers can view enrollments for their sessions
CREATE POLICY "enrollments_select_lecturer" ON course_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = course_enrollments.session_id AND lecturer_id = auth.uid()
    )
  );

-- Lecturers can insert enrollments for their sessions
CREATE POLICY "enrollments_insert_lecturer" ON course_enrollments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = session_id AND lecturer_id = auth.uid()
    )
  );

-- Lecturers can update enrollments for their sessions
CREATE POLICY "enrollments_update_lecturer" ON course_enrollments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = course_enrollments.session_id AND lecturer_id = auth.uid()
    )
  );

-- Lecturers can delete enrollments for their sessions
CREATE POLICY "enrollments_delete_lecturer" ON course_enrollments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = course_enrollments.session_id AND lecturer_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - ATTENDANCE RECORDS TABLE
-- ============================================================================

-- Students can view their own records
CREATE POLICY "records_select_student" ON attendance_records
  FOR SELECT USING (student_id = auth.uid());

-- Lecturers can view records for their sessions
CREATE POLICY "records_select_lecturer" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = attendance_records.session_id AND lecturer_id = auth.uid()
    )
  );

-- Admins can view all records
CREATE POLICY "records_select_admin" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can create their own check-in records
CREATE POLICY "records_insert_student" ON attendance_records
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own records (for check-out)
CREATE POLICY "records_update_student" ON attendance_records
  FOR UPDATE USING (student_id = auth.uid());

-- Lecturers can insert/update records for their sessions
CREATE POLICY "records_insert_lecturer" ON attendance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = session_id AND lecturer_id = auth.uid()
    )
  );

CREATE POLICY "records_update_lecturer" ON attendance_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = attendance_records.session_id AND lecturer_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES - NOTIFICATIONS TABLE
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- System can insert notifications (via service role)
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES - ANNOUNCEMENTS TABLE
-- ============================================================================

-- Students can view published announcements for their courses/sessions
CREATE POLICY "announcements_select_student" ON announcements
  FOR SELECT USING (
    is_published = TRUE AND (
      target_audience = 'all' OR
      (target_audience = 'course' AND EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE course_id = announcements.course_id AND student_id = auth.uid()
      )) OR
      (target_audience = 'session' AND EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE session_id = announcements.session_id AND student_id = auth.uid()
      ))
    )
  );

-- Lecturers can view their own announcements
CREATE POLICY "announcements_select_lecturer" ON announcements
  FOR SELECT USING (lecturer_id = auth.uid());

-- Lecturers can create announcements
CREATE POLICY "announcements_insert_lecturer" ON announcements
  FOR INSERT WITH CHECK (
    lecturer_id = auth.uid() AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'lecturer'
    )
  );

-- Lecturers can update their own announcements
CREATE POLICY "announcements_update_own" ON announcements
  FOR UPDATE USING (lecturer_id = auth.uid());

-- Lecturers can delete their own announcements
CREATE POLICY "announcements_delete_own" ON announcements
  FOR DELETE USING (lecturer_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - FEEDBACK TABLE
-- ============================================================================

-- Students can view their own feedback
CREATE POLICY "feedback_select_student" ON feedback
  FOR SELECT USING (student_id = auth.uid());

-- Admins can view all feedback
CREATE POLICY "feedback_select_admin" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lecturers can view feedback for their sessions/courses
CREATE POLICY "feedback_select_lecturer" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = feedback.session_id AND lecturer_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM courses
      WHERE id = feedback.course_id AND lecturer_id = auth.uid()
    )
  );

-- Students can create feedback
CREATE POLICY "feedback_insert_student" ON feedback
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Students can update their own pending feedback
CREATE POLICY "feedback_update_student" ON feedback
  FOR UPDATE USING (student_id = auth.uid() AND status = 'pending');

-- Admins can update feedback (respond)
CREATE POLICY "feedback_update_admin" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES - AUDIT LOGS TABLE
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "audit_select_admin" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert audit logs (via service role)
CREATE POLICY "audit_insert_system" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371000; -- Earth radius in meters
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
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

-- Function to verify location is within geofence
CREATE OR REPLACE FUNCTION verify_location(
  session_uuid UUID,
  check_lat DECIMAL,
  check_lon DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  session_lat DECIMAL;
  session_lon DECIMAL;
  radius INTEGER;
  distance DECIMAL;
BEGIN
  SELECT latitude, longitude, geofence_radius
  INTO session_lat, session_lon, radius
  FROM attendance_sessions
  WHERE id = session_uuid;
  
  IF session_lat IS NULL OR session_lon IS NULL THEN
    RETURN FALSE;
  END IF;
  
  distance := calculate_distance(session_lat, session_lon, check_lat, check_lon);
  
  RETURN distance <= radius;
END;
$$ LANGUAGE plpgsql;

-- Function to get attendance statistics for a student
CREATE OR REPLACE FUNCTION get_student_stats(student_uuid UUID)
RETURNS TABLE(
  total_sessions BIGINT,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  attendance_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE status = 'present') as present_count,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE status = 'late') as late_count,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0
    END as attendance_rate
  FROM attendance_records
  WHERE student_id = student_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- This section is commented out - uncomment to insert sample data

/*
-- Insert sample admin
INSERT INTO users (id, email, full_name, role, department)
SELECT
  id, email, 'System Admin', 'admin', 'Administration'
FROM auth.users
WHERE email = 'admin@erecord.com'
LIMIT 1;

-- Insert sample lecturer
INSERT INTO users (id, email, full_name, role, department, staff_id)
SELECT
  id, email, 'Dr. John Smith', 'lecturer', 'Computer Science', 'LEC001'
FROM auth.users
WHERE email = 'lecturer@erecord.com'
LIMIT 1;

-- Insert sample student
INSERT INTO users (id, email, full_name, role, department, student_id)
SELECT
  id, email, 'Jane Doe', 'student', 'Computer Science', 'STU001'
FROM auth.users
WHERE email = 'student@erecord.com'
LIMIT 1;
*/

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ eRecord Timeless schema created successfully!';
  RAISE NOTICE '📊 Tables created: users, courses, attendance_sessions, course_enrollments, attendance_records, notifications, announcements, feedback, audit_logs';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '🎯 Ready to use!';
END $$;
