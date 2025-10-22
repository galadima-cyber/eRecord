-- ============================================================================
-- eRecord Timeless - Fresh Database Schema
-- This is a complete, clean schema with proper RLS policies (no recursion)
-- Delete all old migrations and run only this file
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE - Core authentication and user profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
  phone TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - NO RECURSION
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role can do everything (for triggers and admin operations)
CREATE POLICY "Service role bypass" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- ATTENDANCE SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_radius_meters INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_lecturer ON attendance_sessions(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON attendance_sessions(status);

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Lecturers can view their own sessions
CREATE POLICY "Lecturers view own sessions" ON attendance_sessions
  FOR SELECT USING (auth.uid() = lecturer_id);

-- Students can view active sessions
CREATE POLICY "Students view active sessions" ON attendance_sessions
  FOR SELECT USING (status = 'active');

-- Lecturers can create sessions
CREATE POLICY "Lecturers create sessions" ON attendance_sessions
  FOR INSERT WITH CHECK (auth.uid() = lecturer_id);

-- Lecturers can update their own sessions
CREATE POLICY "Lecturers update own sessions" ON attendance_sessions
  FOR UPDATE USING (auth.uid() = lecturer_id);

-- ============================================================================
-- ATTENDANCE RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'excused')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  ip_address TEXT,
  biometric_verified BOOLEAN DEFAULT FALSE,
  location_verified BOOLEAN DEFAULT FALSE,
  manual_recorded BOOLEAN DEFAULT FALSE,
  recorded_by UUID REFERENCES users(id),
  recorded_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Students can view their own attendance
CREATE POLICY "Students view own attendance" ON attendance_records
  FOR SELECT USING (auth.uid() = student_id);

-- Lecturers can view attendance for their sessions
CREATE POLICY "Lecturers view session attendance" ON attendance_records
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- Students can insert their own attendance
CREATE POLICY "Students insert own attendance" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Lecturers can update attendance for their sessions
CREATE POLICY "Lecturers update session attendance" ON attendance_records
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- ============================================================================
-- STUDENT ENROLLMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_session ON student_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);

ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- Lecturers can view enrollments for their sessions
CREATE POLICY "Lecturers view enrollments" ON student_enrollments
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- Lecturers can manage enrollments
CREATE POLICY "Lecturers manage enrollments" ON student_enrollments
  FOR ALL USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- ============================================================================
-- FEEDBACKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_student ON feedbacks(student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_session ON feedbacks(session_id);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Students can view their own feedbacks
CREATE POLICY "Students view own feedbacks" ON feedbacks
  FOR SELECT USING (auth.uid() = student_id);

-- Students can create feedbacks
CREATE POLICY "Students create feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Lecturers can view feedbacks for their sessions
CREATE POLICY "Lecturers view session feedbacks" ON feedbacks
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- ============================================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  broadcast_to_all BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_lecturer ON announcements(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_announcements_session ON announcements(session_id);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Lecturers can view their own announcements
CREATE POLICY "Lecturers view own announcements" ON announcements
  FOR SELECT USING (auth.uid() = lecturer_id);

-- Lecturers can create announcements
CREATE POLICY "Lecturers create announcements" ON announcements
  FOR INSERT WITH CHECK (auth.uid() = lecturer_id);

-- Students can view announcements for their sessions
CREATE POLICY "Students view announcements" ON announcements
  FOR SELECT USING (
    broadcast_to_all = TRUE OR
    session_id IN (
      SELECT session_id FROM student_enrollments WHERE student_id = auth.uid()
    )
  );

-- ============================================================================
-- ATTENDANCE RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  lateness_threshold_minutes INTEGER DEFAULT 15,
  location_radius_meters INTEGER DEFAULT 100,
  require_biometric BOOLEAN DEFAULT TRUE,
  require_location BOOLEAN DEFAULT TRUE,
  auto_close_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_session ON attendance_rules(session_id);

ALTER TABLE attendance_rules ENABLE ROW LEVEL SECURITY;

-- Lecturers can view rules for their sessions
CREATE POLICY "Lecturers view rules" ON attendance_rules
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- Lecturers can manage rules
CREATE POLICY "Lecturers manage rules" ON attendance_rules
  FOR ALL USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('session_reminder', 'attendance_alert', 'announcement', 'feedback', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.user_metadata->>'full_name', 'User'),
    COALESCE(NEW.user_metadata->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON attendance_sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_records_updated_at ON attendance_records;
CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON feedbacks;
CREATE TRIGGER update_feedbacks_updated_at BEFORE UPDATE ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rules_updated_at ON attendance_rules;
CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON attendance_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
