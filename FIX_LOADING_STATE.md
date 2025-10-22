# 🔧 Fix Infinite Loading State

## Problem: Stuck on Loading After Login

You can login but the page stays in loading state at `/dashboard/student` (or other dashboard).

---

## 🎯 Root Cause

**The user exists in `auth.users` (can login) but NOT in `public.users` (no role/profile).**

When your app tries to fetch the user's role, it can't find it, causing infinite loading.

---

## ✅ Quick Fix (2 Steps)

### **Step 1: Diagnose the Issue**

Run this in Supabase SQL Editor:

```sql
-- Copy from: scripts/DIAGNOSE-USER-ISSUE.sql
```

This will show you:
- ✅ Users in auth.users (can login)
- ✅ Users in public.users (has role)
- ⚠️ Orphaned users (the problem!)

### **Step 2: Create Missing Profiles**

Run this in Supabase SQL Editor:

```sql
-- Copy from: scripts/CREATE-MISSING-PROFILES.sql
```

This will:
- ✅ Create profiles for all orphaned users
- ✅ Assign roles automatically
- ✅ Assign student/staff IDs
- ✅ Show you the results

---

## 🔍 What's Happening

### **The Two Tables**

```
auth.users (Supabase manages)
├── id: abc-123
├── email: student@erecord.com
└── password: (encrypted)
    ↓
    ❌ NO LINK
    ↓
public.users (Your app needs this)
├── id: ??? (MISSING!)
├── role: ??? (MISSING!)
└── full_name: ??? (MISSING!)
```

**Result:** App can't find role → Infinite loading

### **After Running the Fix**

```
auth.users
├── id: abc-123
├── email: student@erecord.com
└── password: (encrypted)
    ↓
    ✅ LINKED
    ↓
public.users
├── id: abc-123 (SAME ID!)
├── role: 'student' ✅
└── full_name: 'Student Name' ✅
```

**Result:** App finds role → Redirects to dashboard ✅

---

## 📋 Step-by-Step Fix

### **1. Open Supabase SQL Editor**

Go to your Supabase project → SQL Editor

### **2. Run Diagnostic**

```sql
-- Copy ALL content from: scripts/DIAGNOSE-USER-ISSUE.sql
-- Paste and click "Run"
```

**Look for this section:**
```
⚠️  ORPHANED USERS (Auth but no Profile)
```

If you see users listed here, that's the problem!

### **3. Create Missing Profiles**

```sql
-- Copy ALL content from: scripts/CREATE-MISSING-PROFILES.sql
-- Paste and click "Run"
```

**You should see:**
```
✅ PROFILES CREATED SUCCESSFULLY!
📊 Total Users: 1
👥 By Role:
   🎓 Students: 1
```

### **4. Test Login**

1. Go to http://localhost:3001
2. Login with your credentials
3. Should redirect to dashboard immediately!

---

## 🐛 Still Having Issues?

### **Check Browser Console**

1. Press F12 to open DevTools
2. Go to Console tab
3. Look for errors

**Common errors:**

```javascript
// Error fetching user role
[v0] Error fetching user role: PGRST116
// Solution: Run CREATE-MISSING-PROFILES.sql

// Invalid API key
Error: Invalid API key
// Solution: Check .env.local

// Permission denied
Error: permission denied for table users
// Solution: Check RLS policies
```

### **Verify Environment Variables**

Check your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Make sure:**
- ✅ No extra spaces
- ✅ Correct project URL
- ✅ Correct anon key
- ✅ File is named `.env.local` (not `.env.local.txt`)

### **Restart Dev Server**

After fixing:

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### **Clear Browser Cache**

1. Open DevTools (F12)
2. Right-click refresh button
3. Click "Empty Cache and Hard Reload"

---

## 🔍 Manual Check

### **Check if User Has Profile**

```sql
-- Replace 'your-email@example.com' with actual email
SELECT 
  a.email as auth_email,
  p.email as profile_email,
  p.role,
  p.full_name
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE a.email = 'your-email@example.com';
```

**Expected result:**
```
auth_email          | profile_email       | role    | full_name
--------------------+--------------------+---------+-------------
student@erecord.com | student@erecord.com | student | Jane Doe
```

**If profile_email is NULL:**
- ❌ User has no profile
- ✅ Run CREATE-MISSING-PROFILES.sql

---

## 🎯 Prevention

### **When Creating New Users**

**Always do BOTH steps:**

1. **Create in Dashboard** (Authentication → Users)
   - This creates auth.users

2. **Run SQL to create profile**
   ```sql
   INSERT INTO public.users (id, email, full_name, role, department)
   SELECT id, email, 'Full Name', 'student', 'Department'
   FROM auth.users WHERE email = 'new-user@example.com';
   ```

Or just use `CREATE-MISSING-PROFILES.sql` after creating users!

---

## 📊 Understanding the Flow

### **Login Process**

```
1. User enters email/password
   ↓
2. Supabase checks auth.users
   ↓
3. ✅ Credentials valid → Session created
   ↓
4. App tries to fetch role from public.users
   ↓
5a. ✅ Profile exists → Get role → Redirect to dashboard
5b. ❌ Profile missing → Can't get role → Infinite loading
```

### **The Fix**

```
Run CREATE-MISSING-PROFILES.sql
   ↓
Creates public.users entry
   ↓
Links to auth.users by ID
   ↓
Assigns role based on email pattern
   ↓
✅ User can now login properly!
```

---

## ✅ Success Checklist

After running the fix:

- [ ] Ran DIAGNOSE-USER-ISSUE.sql
- [ ] Saw orphaned users listed
- [ ] Ran CREATE-MISSING-PROFILES.sql
- [ ] Saw "PROFILES CREATED SUCCESSFULLY!"
- [ ] Refreshed login page
- [ ] Logged in successfully
- [ ] Redirected to dashboard (no loading state)
- [ ] Dashboard loads with data

---

## 🎉 Summary

**Problem:** Infinite loading after login

**Cause:** User in auth.users but not in public.users

**Solution:** Run CREATE-MISSING-PROFILES.sql

**Result:** User has profile with role → Can access dashboard

**Time to fix:** ~2 minutes

---

## 📞 Quick Commands

```sql
-- 1. Diagnose
-- Run: scripts/DIAGNOSE-USER-ISSUE.sql

-- 2. Fix
-- Run: scripts/CREATE-MISSING-PROFILES.sql

-- 3. Verify
SELECT email, role FROM public.users;
```

---

**Last Updated:** 2025-10-21  
**Status:** Ready to Fix! 🚀
