-- ============================================================================
-- FIX AND LINK USERS
-- This script handles existing users and links them properly
-- Safe to run multiple times
-- ============================================================================

-- ============================================================================
-- STEP 1: Check what users exist
-- ============================================================================

DO $$
DECLARE
  auth_admin BOOLEAN;
  auth_lecturer BOOLEAN;
  auth_student BOOLEAN;
  public_admin BOOLEAN;
  public_lecturer BOOLEAN;
  public_student BOOLEAN;
BEGIN
  -- Check auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@erecord.com') INTO auth_admin;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'lecturer@erecord.com') INTO auth_lecturer;
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'student@erecord.com') INTO auth_student;
  
  -- Check public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@erecord.com') INTO public_admin;
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'lecturer@erecord.com') INTO public_lecturer;
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'student@erecord.com') INTO public_student;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '📊 CURRENT USER STATUS';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Auth Users (can login):';
  RAISE NOTICE '   Admin:    %', CASE WHEN auth_admin THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '   Lecturer: %', CASE WHEN auth_lecturer THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '   Student:  %', CASE WHEN auth_student THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE '👤 Profile Users (has role):';
  RAISE NOTICE '   Admin:    %', CASE WHEN public_admin THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '   Lecturer: %', CASE WHEN public_lecturer THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '   Student:  %', CASE WHEN public_student THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  IF NOT auth_admin OR NOT auth_lecturer OR NOT auth_student THEN
    RAISE NOTICE '⚠️  Some auth users are missing!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Please create them in Supabase Dashboard:';
    RAISE NOTICE '   1. Go to Authentication → Users';
    RAISE NOTICE '   2. Click "Add user"';
    IF NOT auth_admin THEN
      RAISE NOTICE '   3. Create: admin@erecord.com (Password: Admin123!)';
    END IF;
    IF NOT auth_lecturer THEN
      RAISE NOTICE '   4. Create: lecturer@erecord.com (Password: Lecturer123!)';
    END IF;
    IF NOT auth_student THEN
      RAISE NOTICE '   5. Create: student@erecord.com (Password: Student123!)';
    END IF;
    RAISE NOTICE '   6. ✅ Check "Auto Confirm User" for each';
    RAISE NOTICE '   7. Then run this script again';
    RAISE NOTICE '';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Link/Update existing auth users to public.users
-- ============================================================================

-- Admin Profile
INSERT INTO public.users (id, email, full_name, role, department, is_active)
SELECT 
  id, 
  email,
  'System Admin', 
  'admin', 
  'Administration',
  TRUE
FROM auth.users 
WHERE email = 'admin@erecord.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Lecturer Profile
INSERT INTO public.users (id, email, full_name, role, department, staff_id, is_active)
SELECT 
  id, 
  email,
  'Dr. John Smith', 
  'lecturer', 
  'Computer Science',
  'LEC001',
  TRUE
FROM auth.users 
WHERE email = 'lecturer@erecord.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  staff_id = EXCLUDED.staff_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Student Profile
INSERT INTO public.users (id, email, full_name, role, department, student_id, is_active)
SELECT 
  id, 
  email,
  'Jane Doe', 
  'student', 
  'Computer Science',
  'STU001',
  TRUE
FROM auth.users 
WHERE email = 'student@erecord.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  student_id = EXCLUDED.student_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: Verify final state
-- ============================================================================

DO $$
DECLARE
  admin_count INTEGER;
  lecturer_count INTEGER;
  student_count INTEGER;
  total_auth INTEGER;
  total_public INTEGER;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO total_auth FROM auth.users 
  WHERE email IN ('admin@erecord.com', 'lecturer@erecord.com', 'student@erecord.com');
  
  SELECT COUNT(*) INTO total_public FROM public.users 
  WHERE email IN ('admin@erecord.com', 'lecturer@erecord.com', 'student@erecord.com');
  
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'admin';
  SELECT COUNT(*) INTO lecturer_count FROM public.users WHERE role = 'lecturer';
  SELECT COUNT(*) INTO student_count FROM public.users WHERE role = 'student';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FINAL STATUS';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   Auth users: % / 3', total_auth;
  RAISE NOTICE '   Profile users: % / 3', total_public;
  RAISE NOTICE '';
  RAISE NOTICE '👥 By Role:';
  RAISE NOTICE '   👨‍💼 Admins: %', admin_count;
  RAISE NOTICE '   👨‍🏫 Lecturers: %', lecturer_count;
  RAISE NOTICE '   🎓 Students: %', student_count;
  RAISE NOTICE '';
  
  IF total_auth = 3 AND total_public = 3 THEN
    RAISE NOTICE '🎉 SUCCESS! All users are properly set up!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Test Login Credentials:';
    RAISE NOTICE '   Admin:    admin@erecord.com / Admin123!';
    RAISE NOTICE '   Lecturer: lecturer@erecord.com / Lecturer123!';
    RAISE NOTICE '   Student:  student@erecord.com / Student123!';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Step: Go to http://localhost:3001 and test login!';
  ELSIF total_auth < 3 THEN
    RAISE NOTICE '⚠️  Missing auth users (% / 3)', total_auth;
    RAISE NOTICE '   Create them in Supabase Dashboard first.';
  ELSIF total_public < 3 THEN
    RAISE NOTICE '⚠️  Profiles not linked (% / 3)', total_public;
    RAISE NOTICE '   This script should have fixed it. Check for errors above.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 4: Show detailed user info
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 DETAILED USER INFO:';
  RAISE NOTICE '';
END $$;

SELECT 
  u.email,
  u.role,
  u.full_name,
  u.department,
  CASE 
    WHEN u.role = 'student' THEN u.student_id
    WHEN u.role = 'lecturer' THEN u.staff_id
    ELSE '-'
  END as id_number,
  u.is_active,
  u.created_at::date as created_date
FROM public.users u
WHERE u.email IN ('admin@erecord.com', 'lecturer@erecord.com', 'student@erecord.com')
ORDER BY 
  CASE u.role
    WHEN 'admin' THEN 1
    WHEN 'lecturer' THEN 2
    WHEN 'student' THEN 3
  END;
