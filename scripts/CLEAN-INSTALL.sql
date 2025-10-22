-- ============================================================================
-- CLEAN INSTALLATION SCRIPT
-- Run this to completely reset and reinstall the database
-- WARNING: This will delete ALL existing data!
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- STEP 3: DROP ALL EXISTING FUNCTIONS (CASCADE to remove triggers)
-- ============================================================================

DROP FUNCTION IF EXISTS calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS verify_location(UUID, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS get_student_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- CONFIRMATION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database cleaned successfully!';
  RAISE NOTICE '📝 All tables, policies, and functions have been removed.';
  RAISE NOTICE '🚀 You can now run COMPLETE-SCHEMA.sql for a fresh installation.';
END $$;
