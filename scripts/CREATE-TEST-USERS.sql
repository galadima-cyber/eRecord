-- ============================================================================
-- CREATE TEST USERS FOR eRecord Timeless
-- Run this AFTER creating the schema
-- ============================================================================

-- ============================================================================
-- CREATE ADMIN USER
-- ============================================================================
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@erecord.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Admin"}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  FALSE,
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Create admin profile in users table
INSERT INTO public.users (id, email, full_name, role, department)
SELECT 
  id, 
  'admin@erecord.com', 
  'System Admin', 
  'admin', 
  'Administration'
FROM auth.users 
WHERE email = 'admin@erecord.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department;

-- ============================================================================
-- CREATE LECTURER USER
-- ============================================================================
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'lecturer@erecord.com',
  crypt('Lecturer123!', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. John Smith"}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  FALSE,
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Create lecturer profile in users table
INSERT INTO public.users (id, email, full_name, role, department, staff_id)
SELECT 
  id, 
  'lecturer@erecord.com', 
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

-- ============================================================================
-- CREATE STUDENT USER
-- ============================================================================
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'student@erecord.com',
  crypt('Student123!', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Jane Doe"}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  FALSE,
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Create student profile in users table
INSERT INTO public.users (id, email, full_name, role, department, student_id)
SELECT 
  id, 
  'student@erecord.com', 
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
-- CREATE ADDITIONAL TEST STUDENTS (Optional)
-- ============================================================================

-- Student 2
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'student2@erecord.com', crypt('Student123!', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"John Doe"}',
  FALSE, NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, department, student_id)
SELECT id, 'student2@erecord.com', 'John Doe', 'student', 'Computer Science', 'STU002'
FROM auth.users WHERE email = 'student2@erecord.com'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Student 3
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'student3@erecord.com', crypt('Student123!', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Alice Johnson"}',
  FALSE, NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, department, student_id)
SELECT id, 'student3@erecord.com', 'Alice Johnson', 'student', 'Engineering', 'STU003'
FROM auth.users WHERE email = 'student3@erecord.com'
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- ============================================================================
-- VERIFY USERS CREATED
-- ============================================================================

DO $$
DECLARE
  admin_count INTEGER;
  lecturer_count INTEGER;
  student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'admin';
  SELECT COUNT(*) INTO lecturer_count FROM public.users WHERE role = 'lecturer';
  SELECT COUNT(*) INTO student_count FROM public.users WHERE role = 'student';
  
  RAISE NOTICE '✅ Test users created successfully!';
  RAISE NOTICE '👨‍💼 Admins: %', admin_count;
  RAISE NOTICE '👨‍🏫 Lecturers: %', lecturer_count;
  RAISE NOTICE '🎓 Students: %', student_count;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Login Credentials:';
  RAISE NOTICE '   Admin: admin@erecord.com / Admin123!';
  RAISE NOTICE '   Lecturer: lecturer@erecord.com / Lecturer123!';
  RAISE NOTICE '   Student: student@erecord.com / Student123!';
END $$;
