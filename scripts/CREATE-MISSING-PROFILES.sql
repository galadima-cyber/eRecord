-- ============================================================================
-- CREATE MISSING PROFILES
-- This creates public.users profiles for any auth.users without one
-- Safe to run anytime - automatically detects and fixes orphaned users
-- ============================================================================

-- ============================================================================
-- STEP 1: Show what will be created
-- ============================================================================

DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users a
  LEFT JOIN public.users p ON a.id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🔧 CREATING MISSING PROFILES';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Found % user(s) without profiles', orphaned_count;
  RAISE NOTICE '';
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE '✅ Creating profiles now...';
  ELSE
    RAISE NOTICE '✅ All users already have profiles!';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: Create profiles for orphaned users
-- ============================================================================

-- Create profile for each auth user that doesn't have one
-- Default role: student (can be changed later)
INSERT INTO public.users (id, email, full_name, role, department, is_active)
SELECT 
  a.id,
  a.email,
  COALESCE(a.raw_user_meta_data->>'full_name', split_part(a.email, '@', 1)) as full_name,
  CASE 
    WHEN a.email LIKE '%admin%' THEN 'admin'
    WHEN a.email LIKE '%lecturer%' OR a.email LIKE '%teacher%' THEN 'lecturer'
    ELSE 'student'
  END as role,
  'General' as department,
  TRUE as is_active
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Assign student IDs to students
-- ============================================================================

WITH numbered_students AS (
  SELECT 
    id,
    'STU' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') as new_student_id
  FROM public.users
  WHERE role = 'student' AND student_id IS NULL
)
UPDATE public.users
SET student_id = numbered_students.new_student_id
FROM numbered_students
WHERE public.users.id = numbered_students.id;

-- ============================================================================
-- STEP 4: Assign staff IDs to lecturers
-- ============================================================================

WITH numbered_lecturers AS (
  SELECT 
    id,
    'LEC' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') as new_staff_id
  FROM public.users
  WHERE role = 'lecturer' AND staff_id IS NULL
)
UPDATE public.users
SET staff_id = numbered_lecturers.new_staff_id
FROM numbered_lecturers
WHERE public.users.id = numbered_lecturers.id;

-- ============================================================================
-- STEP 5: Show results
-- ============================================================================

DO $$
DECLARE
  total_users INTEGER;
  admin_count INTEGER;
  lecturer_count INTEGER;
  student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'admin';
  SELECT COUNT(*) INTO lecturer_count FROM public.users WHERE role = 'lecturer';
  SELECT COUNT(*) INTO student_count FROM public.users WHERE role = 'student';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PROFILES CREATED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total Users: %', total_users;
  RAISE NOTICE '';
  RAISE NOTICE '👥 By Role:';
  RAISE NOTICE '   👨‍💼 Admins: %', admin_count;
  RAISE NOTICE '   👨‍🏫 Lecturers: %', lecturer_count;
  RAISE NOTICE '   🎓 Students: %', student_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All users now have profiles with roles!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Refresh your login page';
  RAISE NOTICE '   2. Try logging in again';
  RAISE NOTICE '   3. You should be redirected to the correct dashboard';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 6: Display all users with their details
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 ALL USERS:';
  RAISE NOTICE '';
END $$;

SELECT 
  email,
  role,
  full_name,
  department,
  CASE 
    WHEN role = 'student' THEN student_id
    WHEN role = 'lecturer' THEN staff_id
    ELSE '-'
  END as id_number,
  is_active,
  created_at::date as created_date
FROM public.users
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'lecturer' THEN 2
    WHEN 'student' THEN 3
  END,
  created_at;
