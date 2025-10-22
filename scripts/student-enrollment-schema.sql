-- Student Enrollment & Invitation System Schema
-- This script creates all necessary tables, triggers, and RLS policies for the intelligent student enrollment system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courses table (if not exists)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lecturer_id, course_code, academic_year)
);

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    approved BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enrolled_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(course_id, student_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    matric_number VARCHAR(50),
    department VARCHAR(100),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
    accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    UNIQUE(email, course_id)
);

-- Create student_groups table for reusing student lists
CREATE TABLE IF NOT EXISTS student_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    student_count INTEGER DEFAULT 0
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_lecturer_id ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_course_id ON invitations(course_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_student_id ON group_members(student_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-enroll invited students
CREATE OR REPLACE FUNCTION auto_enroll_invited_students()
RETURNS TRIGGER AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Check if there are any pending invitations for this email
    FOR invitation_record IN 
        SELECT * FROM invitations 
        WHERE email = NEW.email 
        AND accepted = false 
        AND expires_at > NOW()
    LOOP
        -- Enroll the student in the course
        INSERT INTO course_enrollments (course_id, student_id, enrolled_by)
        VALUES (invitation_record.course_id, NEW.id, invitation_record.created_by)
        ON CONFLICT (course_id, student_id) DO NOTHING;
        
        -- Mark invitation as accepted
        UPDATE invitations 
        SET accepted = true, accepted_at = NOW()
        WHERE id = invitation_record.id;
        
        -- Update user profile with invitation data if missing
        UPDATE auth.users 
        SET 
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'full_name', COALESCE(raw_user_meta_data->>'full_name', invitation_record.name),
                'matric_number', COALESCE(raw_user_meta_data->>'matric_number', invitation_record.matric_number),
                'department', COALESCE(raw_user_meta_data->>'department', invitation_record.department)
            )
        WHERE id = NEW.id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-enrollment
DROP TRIGGER IF EXISTS trigger_auto_enroll_invited_students ON auth.users;
CREATE TRIGGER trigger_auto_enroll_invited_students
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_enroll_invited_students();

-- Create function to update student count in groups
CREATE OR REPLACE FUNCTION update_group_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE student_groups 
        SET student_count = student_count + 1 
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE student_groups 
        SET student_count = student_count - 1 
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating group student count
CREATE TRIGGER trigger_update_group_student_count
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_student_count();

-- RLS Policies for courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecturers_can_view_own_courses" ON courses
    FOR SELECT USING (lecturer_id = auth.uid());

CREATE POLICY "lecturers_can_insert_own_courses" ON courses
    FOR INSERT WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "lecturers_can_update_own_courses" ON courses
    FOR UPDATE USING (lecturer_id = auth.uid());

CREATE POLICY "lecturers_can_delete_own_courses" ON courses
    FOR DELETE USING (lecturer_id = auth.uid());

-- RLS Policies for course_enrollments table
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecturers_can_view_course_enrollments" ON course_enrollments
    FOR SELECT USING (
        course_id IN (SELECT id FROM courses WHERE lecturer_id = auth.uid())
    );

CREATE POLICY "lecturers_can_add_students_to_courses" ON course_enrollments
    FOR INSERT WITH CHECK (
        course_id IN (SELECT id FROM courses WHERE lecturer_id = auth.uid())
    );

CREATE POLICY "lecturers_can_update_course_enrollments" ON course_enrollments
    FOR UPDATE USING (
        course_id IN (SELECT id FROM courses WHERE lecturer_id = auth.uid())
    );

CREATE POLICY "lecturers_can_delete_course_enrollments" ON course_enrollments
    FOR DELETE USING (
        course_id IN (SELECT id FROM courses WHERE lecturer_id = auth.uid())
    );

CREATE POLICY "students_can_view_own_enrollments" ON course_enrollments
    FOR SELECT USING (student_id = auth.uid());

-- RLS Policies for invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecturers_can_manage_invitations" ON invitations
    FOR ALL USING (
        course_id IN (SELECT id FROM courses WHERE lecturer_id = auth.uid())
    );

CREATE POLICY "invited_users_can_view_own_invitations" ON invitations
    FOR SELECT USING (email = auth.email());

-- RLS Policies for student_groups table
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecturers_can_manage_student_groups" ON student_groups
    FOR ALL USING (
        course_id IN (SELECT id FROM courses WHERE lecturer_id = auth.uid())
    );

-- RLS Policies for group_members table
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecturers_can_manage_group_members" ON group_members
    FOR ALL USING (
        group_id IN (
            SELECT id FROM student_groups 
            WHERE course_id IN (SELECT id FROM courses WHERE lecturer_id = auth.uid())
        )
    );

CREATE POLICY "students_can_view_group_memberships" ON group_members
    FOR SELECT USING (student_id = auth.uid());

-- Create view for lecturer dashboard stats
CREATE OR REPLACE VIEW lecturer_course_stats AS
SELECT 
    c.id as course_id,
    c.lecturer_id,
    c.course_code,
    c.course_name,
    COUNT(DISTINCT ce.student_id) as enrolled_students,
    COUNT(DISTINCT i.id) as pending_invitations,
    COUNT(DISTINCT CASE WHEN i.accepted = true THEN i.id END) as accepted_invitations,
    c.created_at
FROM courses c
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
LEFT JOIN invitations i ON c.id = i.course_id
GROUP BY c.id, c.lecturer_id, c.course_code, c.course_name, c.created_at;

-- Grant necessary permissions
GRANT SELECT ON lecturer_course_stats TO authenticated;

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    DELETE FROM invitations 
    WHERE expires_at < NOW() 
    AND accepted = false;
END;
$$ LANGUAGE plpgsql;

-- Create function to get course enrollment summary
CREATE OR REPLACE FUNCTION get_course_enrollment_summary(course_uuid UUID)
RETURNS TABLE (
    total_enrolled BIGINT,
    pending_invitations BIGINT,
    accepted_invitations BIGINT,
    expired_invitations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT ce.student_id) as total_enrolled,
        COUNT(DISTINCT CASE WHEN i.accepted = false AND i.expires_at > NOW() THEN i.id END) as pending_invitations,
        COUNT(DISTINCT CASE WHEN i.accepted = true THEN i.id END) as accepted_invitations,
        COUNT(DISTINCT CASE WHEN i.accepted = false AND i.expires_at <= NOW() THEN i.id END) as expired_invitations
    FROM courses c
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id
    LEFT JOIN invitations i ON c.id = i.course_id
    WHERE c.id = course_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION get_course_enrollment_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;

-- Insert sample data for testing (optional)
-- Uncomment the following lines to create sample data

/*
-- Sample course
INSERT INTO courses (lecturer_id, course_code, course_name, department, semester, academic_year)
VALUES (
    'your-lecturer-user-id-here',
    'CS101',
    'Introduction to Computer Science',
    'Computer Science',
    'Fall 2024',
    '2024-2025'
);
*/
