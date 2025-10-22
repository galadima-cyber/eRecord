-- Phase 2 Database Schema Extensions

-- Feedbacks table for student feedback system
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table for lecturer messaging
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  broadcast_type TEXT NOT NULL CHECK (broadcast_type IN ('course', 'all')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance rules configuration per session
CREATE TABLE IF NOT EXISTS attendance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  lateness_threshold_minutes INTEGER DEFAULT 15,
  location_radius_meters INTEGER DEFAULT 100,
  auto_close_minutes INTEGER DEFAULT 60,
  require_biometric BOOLEAN DEFAULT TRUE,
  require_location BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Roles and permissions for admin management
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission)
);

-- Audit logs for tracking all system actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs for tracking delivery
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('in_app', 'email', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student enrollments for course management
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, session_id)
);

-- Extend attendance_records table with manual recording fields
ALTER TABLE attendance_records
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS update_reason TEXT,
ADD COLUMN IF NOT EXISTS update_type VARCHAR(20) DEFAULT 'auto' CHECK (update_type IN ('auto', 'manual'));

-- Create indexes for Phase 2 tables
CREATE INDEX IF NOT EXISTS idx_feedbacks_student ON feedbacks(student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_announcements_lecturer ON announcements(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_announcements_session ON announcements(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_rules_session ON attendance_rules(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_session ON student_enrollments(session_id);

-- Enable RLS for new tables
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedbacks
CREATE POLICY "Students can view their own feedbacks" ON feedbacks
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Lecturers and admins can view all feedbacks" ON feedbacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('lecturer', 'admin')
    )
  );

-- RLS Policies for announcements
CREATE POLICY "Lecturers can view their own announcements" ON announcements
  FOR SELECT USING (auth.uid() = lecturer_id);

CREATE POLICY "Lecturers can create announcements" ON announcements
  FOR INSERT WITH CHECK (auth.uid() = lecturer_id);

CREATE POLICY "Students can view announcements for their sessions" ON announcements
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM student_enrollments WHERE student_id = auth.uid()
    )
  );

-- RLS Policies for attendance_rules
CREATE POLICY "Lecturers can manage rules for their sessions" ON attendance_rules
  FOR ALL USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for student_enrollments
CREATE POLICY "Students can view their enrollments" ON student_enrollments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Lecturers can view enrollments for their sessions" ON student_enrollments
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );
