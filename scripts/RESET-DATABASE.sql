-- ============================================================================
-- COMPLETE DATABASE RESET
-- This script safely removes EVERYTHING and prepares for fresh installation
-- WARNING: This will delete ALL data, tables, functions, triggers, and policies!
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL TRIGGERS FIRST
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all triggers
    FOR r IN (
        SELECT trigger_schema, trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', 
            r.trigger_name, r.trigger_schema, r.event_object_table);
    END LOOP;
    
    RAISE NOTICE '✅ All triggers dropped';
END $$;

-- ============================================================================
-- STEP 2: DROP ALL POLICIES
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
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    RAISE NOTICE '✅ All policies dropped';
END $$;

-- ============================================================================
-- STEP 3: DROP ALL TABLES (CASCADE removes all dependencies)
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS feedbacks CASCADE; -- Alternative name
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS attendance_rules CASCADE; -- If exists
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- STEP 4: DROP ALL FUNCTIONS (CASCADE removes triggers automatically)
-- ============================================================================

DROP FUNCTION IF EXISTS calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS verify_location(UUID, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS get_student_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 5: DROP ALL INDEXES (if any remain)
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all indexes in public schema
    FOR r IN (
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE 'pg_%'
    ) LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I CASCADE', r.indexname);
    END LOOP;
    
    RAISE NOTICE '✅ All indexes dropped';
END $$;

-- ============================================================================
-- STEP 6: VERIFY CLEAN STATE
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count remaining tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    -- Count remaining functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public';
    
    -- Count remaining policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ DATABASE RESET COMPLETE!';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Remaining Objects:';
    RAISE NOTICE '   Tables: %', table_count;
    RAISE NOTICE '   Functions: %', function_count;
    RAISE NOTICE '   Policies: %', policy_count;
    RAISE NOTICE '';
    
    IF table_count = 0 AND function_count = 0 AND policy_count = 0 THEN
        RAISE NOTICE '🎉 Database is completely clean!';
        RAISE NOTICE '🚀 Ready for fresh installation.';
        RAISE NOTICE '';
        RAISE NOTICE '📝 Next Steps:';
        RAISE NOTICE '   1. Run COMPLETE-SCHEMA.sql';
        RAISE NOTICE '   2. Run CREATE-TEST-USERS.sql';
        RAISE NOTICE '   3. Test your application';
    ELSE
        RAISE NOTICE '⚠️  Some objects still remain.';
        RAISE NOTICE '   You may need to manually remove them.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
