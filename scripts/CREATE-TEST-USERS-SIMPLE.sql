-- ============================================================================
-- CREATE TEST USERS - SIMPLIFIED VERSION
-- This version works with Supabase's auth system
-- Run this AFTER creating the schema
-- ============================================================================

-- ============================================================================
-- METHOD: Use Supabase Auth API or Dashboard
-- ============================================================================

-- IMPORTANT: The best way to create users in Supabase is through:
-- 1. Supabase Dashboard → Authentication → Users → "Add user"
-- 2. Or use the signup flow in your app
-- 3. Or use Supabase Auth API

-- However, if you need to create users via SQL, use this method:

-- ============================================================================
-- CREATE TEST USERS IN PUBLIC.USERS TABLE ONLY
-- ============================================================================

-- Note: You need to create the auth.users first through Supabase Dashboard
-- Then link them to public.users using this script

-- ============================================================================
-- STEP 1: Create users in Supabase Dashboard
-- ============================================================================

-- Go to: Authentication → Users → "Add user"
-- Create these users:

-- Admin User:
--   Email: admin@erecord.com
--   Password: Admin123!
--   Auto Confirm: YES

-- Lecturer User:
--   Email: lecturer@erecord.com
--   Password: Lecturer123!
--   Auto Confirm: YES

-- Student User:
--   Email: student@erecord.com
--   Password: Student123!
--   Auto Confirm: YES

-- ============================================================================
-- STEP 2: Link auth users to public.users (Run this SQL)
-- ============================================================================

-- Insert Admin Profile
INSERT INTO public.users (id, email, full_name, role, department)
SELECT 
  id, 
  email,
  'System Admin', 
  'admin', 
  'Administration'
FROM auth.users 
WHERE email = 'admin@erecord.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department;

-- Insert Lecturer Profile
INSERT INTO public.users (id, email, full_name, role, department, staff_id)
SELECT 
  id, 
  email,
  'Dr. John Smith', 
  'lecturer', 
  'Computer Science',
  'LEC001'
FROM auth.users 
WHERE email = 'lecturer@erecord.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  staff_id = EXCLUDED.staff_id;

-- Insert Student Profile
INSERT INTO public.users (id, email, full_name, role, department, student_id)
SELECT 
  id, 
  email,
  'Jane Doe', 
  'student', 
  'Computer Science',
  'STU001'
FROM auth.users 
WHERE email = 'student@erecord.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  student_id = EXCLUDED.student_id;

-- ============================================================================
-- STEP 3: Verify Users Created
-- ============================================================================

DO $$
DECLARE
  admin_count INTEGER;
  lecturer_count INTEGER;
  student_count INTEGER;
  auth_count INTEGER;
BEGIN
  -- Count auth users
  SELECT COUNT(*) INTO auth_count 
  FROM auth.users 
  WHERE email IN ('admin@erecord.com', 'lecturer@erecord.com', 'student@erecord.com');
  
  -- Count public users by role
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'admin';
  SELECT COUNT(*) INTO lecturer_count FROM public.users WHERE role = 'lecturer';
  SELECT COUNT(*) INTO student_count FROM public.users WHERE role = 'student';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ USER CREATION STATUS';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Auth Users Found: %', auth_count;
  RAISE NOTICE '   (Should be 3 if created in Dashboard)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Public Users Created:';
  RAISE NOTICE '   👨‍💼 Admins: %', admin_count;
  RAISE NOTICE '   👨‍🏫 Lecturers: %', lecturer_count;
  RAISE NOTICE '   🎓 Students: %', student_count;
  RAISE NOTICE '';
  
  IF auth_count = 3 AND admin_count >= 1 AND lecturer_count >= 1 AND student_count >= 1 THEN
    RAISE NOTICE '🎉 All test users created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Login Credentials:';
    RAISE NOTICE '   Admin: admin@erecord.com / Admin123!';
    RAISE NOTICE '   Lecturer: lecturer@erecord.com / Lecturer123!';
    RAISE NOTICE '   Student: student@erecord.com / Student123!';
  ELSIF auth_count = 0 THEN
    RAISE NOTICE '⚠️  No auth users found!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Please create users in Supabase Dashboard:';
    RAISE NOTICE '   1. Go to Authentication → Users';
    RAISE NOTICE '   2. Click "Add user"';
    RAISE NOTICE '   3. Create admin@erecord.com (Password: Admin123!)';
    RAISE NOTICE '   4. Create lecturer@erecord.com (Password: Lecturer123!)';
    RAISE NOTICE '   5. Create student@erecord.com (Password: Student123!)';
    RAISE NOTICE '   6. Then run this script again';
  ELSE
    RAISE NOTICE '⚠️  Partial setup detected.';
    RAISE NOTICE '   Auth users: % (expected 3)', auth_count;
    RAISE NOTICE '   Please check Supabase Dashboard → Authentication → Users';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- ALTERNATIVE: Create Additional Test Students
-- ============================================================================

-- If you've already created the main 3 users and want more students:

/*
-- Student 2
INSERT INTO public.users (id, email, full_name, role, department, student_id)
SELECT id, email, 'John Doe', 'student', 'Computer Science', 'STU002'
FROM auth.users WHERE email = 'student2@erecord.com'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Student 3
INSERT INTO public.users (id, email, full_name, role, department, student_id)
SELECT id, email, 'Alice Johnson', 'student', 'Engineering', 'STU003'
FROM auth.users WHERE email = 'student3@erecord.com'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
*/
