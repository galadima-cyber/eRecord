-- ============================================================================
-- DIAGNOSE USER LOGIN ISSUE
-- Run this to see why your user can't login properly
-- ============================================================================

-- ============================================================================
-- STEP 1: Check auth.users (authentication)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 CHECKING AUTH USERS';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at::date as created_date,
  last_sign_in_at::timestamp(0) as last_login
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 2: Check public.users (profiles with roles)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 CHECKING PUBLIC USERS (PROFILES)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

SELECT 
  id,
  email,
  role,
  full_name,
  department,
  is_active,
  created_at::date as created_date
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: Find orphaned auth users (no profile)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '⚠️  ORPHANED USERS (Auth but no Profile)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

SELECT 
  a.id,
  a.email,
  'NO PROFILE - THIS IS THE PROBLEM!' as issue,
  a.created_at::date as created_date
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL
ORDER BY a.created_at DESC;

-- ============================================================================
-- STEP 4: Show what needs to be fixed
-- ============================================================================

DO $$
DECLARE
  orphaned_count INTEGER;
  auth_count INTEGER;
  public_count INTEGER;
BEGIN
  -- Count orphaned users
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users a
  LEFT JOIN public.users p ON a.id = p.id
  WHERE p.id IS NULL;
  
  -- Count total users
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO public_count FROM public.users;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '📊 SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Total Users:';
  RAISE NOTICE '   Auth users (can login): %', auth_count;
  RAISE NOTICE '   Profile users (has role): %', public_count;
  RAISE NOTICE '   Orphaned (no profile): %', orphaned_count;
  RAISE NOTICE '';
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE '🔴 PROBLEM FOUND!';
    RAISE NOTICE '';
    RAISE NOTICE '   % user(s) can login but have NO PROFILE!', orphaned_count;
    RAISE NOTICE '   This causes the infinite loading state.';
    RAISE NOTICE '';
    RAISE NOTICE '✅ SOLUTION:';
    RAISE NOTICE '   Run: scripts/CREATE-MISSING-PROFILES.sql';
    RAISE NOTICE '   This will create profiles for all orphaned users.';
  ELSE
    RAISE NOTICE '✅ All users have profiles!';
    RAISE NOTICE '';
    RAISE NOTICE '   If still having issues, check:';
    RAISE NOTICE '   1. Browser console for errors (F12)';
    RAISE NOTICE '   2. .env.local has correct Supabase keys';
    RAISE NOTICE '   3. RLS policies are set up correctly';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
