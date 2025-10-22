-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create improved RLS policies for users table
-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update any user
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete users
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a trigger function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update attendance_records RLS to allow students to insert their own records
DROP POLICY IF EXISTS "Students can insert their own records" ON attendance_records;

CREATE POLICY "Students can insert their own records" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Update attendance_records RLS to allow students to update their own records
DROP POLICY IF EXISTS "Students can update their own records" ON attendance_records;

CREATE POLICY "Students can update their own records" ON attendance_records
  FOR UPDATE USING (auth.uid() = student_id);

-- Allow lecturers to insert attendance records for their sessions
DROP POLICY IF EXISTS "Lecturers can insert records for their sessions" ON attendance_records;

CREATE POLICY "Lecturers can insert records for their sessions" ON attendance_records
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- Allow lecturers to update records for their sessions
DROP POLICY IF EXISTS "Lecturers can update records for their sessions" ON attendance_records;

CREATE POLICY "Lecturers can update records for their sessions" ON attendance_records
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid()
    )
  );

-- Allow students to insert notifications for themselves
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow lecturers to insert sessions
DROP POLICY IF EXISTS "Lecturers can insert sessions" ON attendance_sessions;

CREATE POLICY "Lecturers can insert sessions" ON attendance_sessions
  FOR INSERT WITH CHECK (auth.uid() = lecturer_id);

-- Allow lecturers to update their sessions
DROP POLICY IF EXISTS "Lecturers can update their sessions" ON attendance_sessions;

CREATE POLICY "Lecturers can update their sessions" ON attendance_sessions
  FOR UPDATE USING (auth.uid() = lecturer_id);
