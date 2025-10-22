# 🔧 Fix Database Errors - Quick Guide

## Problem: "relation already exists" Error

If you see errors like:
```
ERROR: 42P07: relation "idx_enrollments_student" already exists
ERROR: policy "users_select_own" already exists
```

This means you've already run the schema before. Here's how to fix it:

---

## ✅ Solution 1: Complete Reset (Recommended)

**This will delete ALL data and start fresh - handles all dependencies.**

### **Step 1: Reset Database**

1. Open Supabase SQL Editor
2. Copy content from `scripts/RESET-DATABASE.sql` ⭐ **NEW!**
3. Paste and click "Run"
4. Wait for success message (shows counts of remaining objects)

### **Step 2: Run Complete Schema**

1. Click "New query"
2. Copy content from `scripts/COMPLETE-SCHEMA.sql`
3. Paste and click "Run"
4. Wait for success (may take 10-15 seconds)

### **Step 3: Create Test Users**

1. Click "New query"
2. Copy content from `scripts/CREATE-TEST-USERS.sql`
3. Paste and click "Run"
4. Verify users created

**Why RESET-DATABASE.sql?**
- ✅ Drops triggers first (prevents dependency errors)
- ✅ Drops policies automatically
- ✅ Uses CASCADE to remove all dependencies
- ✅ Verifies clean state
- ✅ Shows helpful next steps

---

## ✅ Solution 2: Keep Existing Data

**If you want to keep your existing data:**

### **Option A: Skip the Error**

The schema has been updated with `IF NOT EXISTS` clauses. Just:

1. Re-download the updated `COMPLETE-SCHEMA.sql`
2. Run it again
3. It will skip existing objects

### **Option B: Manual Fix**

If you only have a few errors, you can:

1. Note which objects already exist
2. Comment out those lines in the SQL
3. Run the modified script

---

## 🔍 Check What Exists

### **Check Tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Check Indexes**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### **Check Policies**
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### **Check Functions**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

---

## 🚨 Common Errors & Fixes

### **Error: "relation already exists"**

**Cause:** Table, index, or constraint already exists

**Fix:**
- Use `CLEAN-INSTALL.sql` to start fresh
- Or use `DROP TABLE IF EXISTS` before creating

### **Error: "policy already exists"**

**Cause:** RLS policy already exists

**Fix:**
- Schema now includes `DROP POLICY IF EXISTS`
- Re-run the updated schema

### **Error: "function already exists"**

**Cause:** Helper function already exists

**Fix:**
- Use `CREATE OR REPLACE FUNCTION`
- Or `DROP FUNCTION IF EXISTS` first

### **Error: "permission denied"**

**Cause:** Not enough permissions

**Fix:**
- Make sure you're project owner
- Use SQL Editor (not Table Editor)
- Check RLS policies

---

## 📋 Complete Reset Procedure

If you want to start completely fresh:

### **Step 1: Delete All Data**

```sql
-- Run CLEAN-INSTALL.sql
-- This drops everything
```

### **Step 2: Verify Clean**

```sql
-- Check no tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return empty
```

### **Step 3: Install Fresh**

```sql
-- Run COMPLETE-SCHEMA.sql
-- Creates all tables, indexes, policies
```

### **Step 4: Add Test Users**

```sql
-- Run CREATE-TEST-USERS.sql
-- Creates admin, lecturer, student accounts
```

### **Step 5: Verify**

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should show 9 tables

-- Check users created
SELECT email, role FROM public.users;
-- Should show 3+ users
```

---

## 🎯 Quick Commands

### **Drop Everything**
```sql
-- Copy from CLEAN-INSTALL.sql
```

### **Create Everything**
```sql
-- Copy from COMPLETE-SCHEMA.sql
```

### **Add Test Users**
```sql
-- Copy from CREATE-TEST-USERS.sql
```

---

## ✅ Verification Checklist

After fixing errors, verify:

- [ ] No error messages in SQL Editor
- [ ] 9 tables visible in Table Editor
- [ ] Can see policies in Database → Policies
- [ ] Test users exist in auth.users
- [ ] Test users exist in public.users
- [ ] Can login with test credentials
- [ ] Dashboard loads correctly

---

## 🆘 Still Having Issues?

### **Try This:**

1. **Clear Everything**
   ```sql
   -- Run CLEAN-INSTALL.sql
   ```

2. **Wait 10 seconds**
   - Let Supabase process the changes

3. **Run Schema Again**
   ```sql
   -- Run COMPLETE-SCHEMA.sql
   ```

4. **Check for Errors**
   - Read error messages carefully
   - Note which line failed
   - Check if object already exists

5. **Create Users**
   ```sql
   -- Run CREATE-TEST-USERS.sql
   ```

---

## 📞 Need More Help?

### **Check These:**

1. **Supabase Dashboard**
   - Database → Tables (should show 9 tables)
   - Database → Policies (should show 30+ policies)
   - Authentication → Users (should show test users)

2. **SQL Editor Logs**
   - Look for specific error messages
   - Note which objects are causing issues
   - Check line numbers

3. **Browser Console**
   - Open DevTools (F12)
   - Check for connection errors
   - Verify API keys are correct

---

## 🎉 Success Indicators

You'll know it worked when:

✅ SQL runs without errors  
✅ 9 tables appear in Table Editor  
✅ Policies show in Database section  
✅ Test users can login  
✅ Dashboard loads  
✅ No console errors  

---

## 📝 Summary

**To fix "already exists" errors:**

1. **Quick Fix:** Run `CLEAN-INSTALL.sql` then `COMPLETE-SCHEMA.sql`
2. **Keep Data:** Updated schema has `IF NOT EXISTS` clauses
3. **Manual:** Comment out lines for existing objects

**Most Common Solution:**
```
1. Run CLEAN-INSTALL.sql
2. Run COMPLETE-SCHEMA.sql  
3. Run CREATE-TEST-USERS.sql
4. Test login
```

---

**Last Updated:** 2025-10-21  
**Status:** Ready to Fix! 🔧
