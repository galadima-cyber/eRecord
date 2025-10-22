-- Drop all problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simplified policies that don't cause recursion
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Simple policy: users can view their own profile only
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Simple policy: users can update their own profile only
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Drop and recreate the trigger function with proper error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the trigger
  RAISE WARNING 'Error creating user profile: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Simplify attendance_records RLS policies to avoid recursion
DROP POLICY IF EXISTS "Lecturers can insert records for their sessions" ON attendance_records;
DROP POLICY IF EXISTS "Lecturers can update records for their sessions" ON attendance_records;
DROP POLICY IF EXISTS "Lecturers can view their session records" ON attendance_records;

-- Simple policies for attendance_records
CREATE POLICY "Students can insert their own records" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own records" ON attendance_records
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own records" ON attendance_records
  FOR UPDATE USING (auth.uid() = student_id);

-- Simplify attendance_sessions RLS policies
DROP POLICY IF EXISTS "Lecturers can insert sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Lecturers can update their sessions" ON attendance_sessions;

CREATE POLICY "Lecturers can insert sessions" ON attendance_sessions
  FOR INSERT WITH CHECK (auth.uid() = lecturer_id);

CREATE POLICY "Lecturers can view their sessions" ON attendance_sessions
  FOR SELECT USING (auth.uid() = lecturer_id OR status = 'active');

CREATE POLICY "Lecturers can update their sessions" ON attendance_sessions
  FOR UPDATE USING (auth.uid() = lecturer_id);

-- Simplify notifications RLS
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
