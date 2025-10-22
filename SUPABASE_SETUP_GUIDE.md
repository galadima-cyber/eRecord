# 🚀 Supabase Setup Guide - eRecord Timeless

## Complete Step-by-Step Setup for Database & Authentication

---

## 📋 Prerequisites

- A Supabase account (free tier works perfectly)
- Your eRecord Timeless project
- Internet connection

---

## 🎯 Step 1: Create Supabase Project

### **1.1 Sign Up / Login to Supabase**

1. Go to https://supabase.com
2. Click **"Start your project"** or **"Sign In"**
3. Sign in with GitHub, Google, or email

### **1.2 Create New Project**

1. Click **"New Project"**
2. Fill in the details:
   - **Name:** `erecord-timeless` (or any name you prefer)
   - **Database Password:** Create a strong password (SAVE THIS!)
   - **Region:** Choose closest to you (e.g., West EU, US East)
   - **Pricing Plan:** Free (sufficient for development)
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

---

## 🔑 Step 2: Get Your API Keys

### **2.1 Find Your Credentials**

1. In your Supabase project dashboard, click **"Settings"** (gear icon in sidebar)
2. Click **"API"** in the settings menu
3. You'll see:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### **2.2 Copy Your Keys**

Copy these two values - you'll need them next!

---

## 📝 Step 3: Configure Environment Variables

### **3.1 Create .env.local File**

In your project root (`c:\Users\HP\Desktop\timeless2\`), create a file named `.env.local`:

```bash
# Create the file (run in terminal)
cd c:\Users\HP\Desktop\timeless2
New-Item -Path ".env.local" -ItemType File
```

### **3.2 Add Your Credentials**

Open `.env.local` and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace:**
- `https://your-project-id.supabase.co` with your actual Project URL
- `your-anon-key-here` with your actual anon public key

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODMwNjQwMCwiZXhwIjoxOTUzODgyNDAwfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

### **3.3 Save and Restart Dev Server**

1. Save the `.env.local` file
2. Stop your dev server (Ctrl+C)
3. Restart it: `npm run dev`

---

## 🗄️ Step 4: Set Up Database Schema

### **4.1 Open SQL Editor**

1. In Supabase dashboard, click **"SQL Editor"** in the sidebar
2. Click **"New query"**

### **4.2 Run Schema Scripts (IN ORDER)**

You have 4 SQL scripts in the `scripts/` folder. Run them **one by one** in this exact order:

#### **Script 1: Fresh Schema**
1. Open `scripts/00-fresh-schema.sql` in your code editor
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for "Success" message

#### **Script 2: Create Tables**
1. Open `scripts/01-create-tables.sql`
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for "Success"

#### **Script 3: Phase 2 Schema**
1. Open `scripts/02-phase2-schema.sql`
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for "Success"

#### **Script 4: Fix RLS Policies**
1. Open `scripts/03-fix-rls-policies.sql`
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Wait for "Success"

### **4.3 Verify Tables Created**

1. Click **"Table Editor"** in Supabase sidebar
2. You should see these tables:
   - ✅ `users`
   - ✅ `attendance_sessions`
   - ✅ `attendance_records`
   - ✅ `notifications`
   - ✅ `announcements` (if in phase 2)
   - ✅ `feedback` (if in phase 2)
   - ✅ `course_enrollments` (if in phase 2)

---

## 🔐 Step 5: Configure Authentication

### **5.1 Enable Email Authentication**

1. Go to **"Authentication"** in Supabase sidebar
2. Click **"Providers"**
3. Find **"Email"** provider
4. Make sure it's **ENABLED** (toggle should be ON)
5. Configure settings:
   - ✅ **Enable email confirmations:** OFF (for development)
   - ✅ **Enable email OTP:** Optional
   - ✅ **Secure email change:** ON

### **5.2 Configure Email Templates (Optional)**

1. Click **"Email Templates"** under Authentication
2. Customize templates if needed:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

### **5.3 Set Up Redirect URLs**

1. Go to **"Authentication"** → **"URL Configuration"**
2. Add these URLs:
   - **Site URL:** `http://localhost:3001`
   - **Redirect URLs:** 
     - `http://localhost:3001`
     - `http://localhost:3001/auth/callback`

---

## 👥 Step 6: Create Test Users

### **6.1 Create Users via SQL**

Run this SQL in the SQL Editor to create test users:

```sql
-- Create test admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@erecord.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Admin"}',
  false,
  'authenticated'
);

-- Get the admin user ID
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@erecord.com';
  
  -- Create admin profile in users table
  INSERT INTO public.users (id, email, full_name, role, department)
  VALUES (admin_id, 'admin@erecord.com', 'System Admin', 'admin', 'Administration');
END $$;
```

### **6.2 Create Test Lecturer**

```sql
-- Create test lecturer user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'lecturer@erecord.com',
  crypt('Lecturer123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. John Smith"}',
  false,
  'authenticated'
);

-- Get the lecturer user ID
DO $$
DECLARE
  lecturer_id UUID;
BEGIN
  SELECT id INTO lecturer_id FROM auth.users WHERE email = 'lecturer@erecord.com';
  
  -- Create lecturer profile
  INSERT INTO public.users (id, email, full_name, role, department)
  VALUES (lecturer_id, 'lecturer@erecord.com', 'Dr. John Smith', 'lecturer', 'Computer Science');
END $$;
```

### **6.3 Create Test Student**

```sql
-- Create test student user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'student@erecord.com',
  crypt('Student123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Jane Doe"}',
  false,
  'authenticated'
);

-- Get the student user ID
DO $$
DECLARE
  student_id UUID;
BEGIN
  SELECT id INTO student_id FROM auth.users WHERE email = 'student@erecord.com';
  
  -- Create student profile
  INSERT INTO public.users (id, email, full_name, role, department, student_id)
  VALUES (student_id, 'student@erecord.com', 'Jane Doe', 'student', 'Computer Science', 'STU001');
END $$;
```

---

## 🧪 Step 7: Test Authentication

### **7.1 Test Login**

1. Go to http://localhost:3001
2. Try logging in with test credentials:

**Admin:**
- Email: `admin@erecord.com`
- Password: `Admin123!`

**Lecturer:**
- Email: `lecturer@erecord.com`
- Password: `Lecturer123!`

**Student:**
- Email: `student@erecord.com`
- Password: `Student123!`

### **7.2 Verify Redirect**

After login, you should be redirected to:
- Admin → `/dashboard/admin`
- Lecturer → `/dashboard/lecturer`
- Student → `/dashboard/student`

### **7.3 Check User Profile**

1. Navigate to Settings page
2. Verify your profile data loads
3. Try updating your profile

---

## 🔍 Step 8: Verify Database Connection

### **8.1 Check Browser Console**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for Supabase connection logs
4. Should see: `[v0] Initializing auth...`

### **8.2 Test Data Fetching**

1. Login as a student
2. Go to Dashboard
3. Check if stats load
4. Open Network tab in DevTools
5. Look for Supabase API calls

### **8.3 Test Data Writing**

**As Lecturer:**
1. Go to Sessions page
2. Create a new session
3. Check if it appears in the list
4. Verify in Supabase Table Editor

**As Student:**
1. Go to Feedback page
2. Submit feedback
3. Check if it's saved

---

## 🛠️ Step 9: Configure Row Level Security (RLS)

### **9.1 Verify RLS is Enabled**

1. Go to **"Table Editor"** in Supabase
2. Click on `users` table
3. Click **"..."** menu → **"View Policies"**
4. You should see policies like:
   - "Users can view their own profile"
   - "Users can update their own profile"

### **9.2 Test RLS Policies**

1. Login as Student
2. Try to access lecturer data (should fail)
3. Try to access own data (should work)

---

## 🔧 Step 10: Troubleshooting

### **Problem: "Invalid API key" error**

**Solution:**
1. Double-check `.env.local` file
2. Ensure no extra spaces in keys
3. Restart dev server
4. Clear browser cache

### **Problem: "Failed to fetch" error**

**Solution:**
1. Check internet connection
2. Verify Supabase project is active
3. Check Supabase dashboard for outages
4. Verify URL is correct

### **Problem: "User not found" after login**

**Solution:**
1. Check if user exists in `auth.users` table
2. Check if profile exists in `public.users` table
3. Verify user ID matches in both tables
4. Run the user creation SQL again

### **Problem: "Permission denied" errors**

**Solution:**
1. Check RLS policies are set up
2. Verify user role is correct
3. Check auth.uid() matches user ID
4. Review policy conditions

### **Problem: Tables not appearing**

**Solution:**
1. Re-run SQL scripts in order
2. Check for SQL errors in console
3. Verify you're in the correct project
4. Refresh Supabase dashboard

---

## 📊 Step 11: Verify Complete Setup

### **Checklist:**

- [ ] Supabase project created
- [ ] API keys copied to `.env.local`
- [ ] All 4 SQL scripts executed successfully
- [ ] Tables visible in Table Editor
- [ ] Email authentication enabled
- [ ] Test users created
- [ ] Can login as admin
- [ ] Can login as lecturer
- [ ] Can login as student
- [ ] Dashboard loads for each role
- [ ] Data fetches correctly
- [ ] Data saves correctly
- [ ] RLS policies working

---

## 🎯 Quick Reference

### **Your Credentials Location**
```
File: .env.local
Location: c:\Users\HP\Desktop\timeless2\.env.local
```

### **Test User Credentials**
```
Admin:
  Email: admin@erecord.com
  Password: Admin123!

Lecturer:
  Email: lecturer@erecord.com
  Password: Lecturer123!

Student:
  Email: student@erecord.com
  Password: Student123!
```

### **Supabase Dashboard Sections**
- **Table Editor:** View/edit data
- **SQL Editor:** Run SQL queries
- **Authentication:** Manage users
- **API:** Get credentials
- **Database:** View schema

---

## 🚀 Next Steps

After successful setup:

1. **Create Real Users:**
   - Use the signup flow
   - Or create via Supabase dashboard

2. **Add Sample Data:**
   - Create sessions as lecturer
   - Add students to sessions
   - Test check-in as student

3. **Test All Features:**
   - Student check-in
   - Attendance recording
   - Report generation
   - Notifications

4. **Production Setup:**
   - Create production Supabase project
   - Update environment variables
   - Deploy to Vercel/Netlify

---

## 📞 Need Help?

### **Supabase Resources:**
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

### **Common Issues:**
- Check Supabase status: https://status.supabase.com
- Review logs in Supabase dashboard
- Check browser console for errors

---

## ✅ Success Indicators

You'll know setup is successful when:

1. ✅ Login page loads without errors
2. ✅ Can login with test credentials
3. ✅ Redirected to correct dashboard
4. ✅ User profile loads in settings
5. ✅ Can create sessions (lecturer)
6. ✅ Can check-in (student)
7. ✅ Data persists after refresh
8. ✅ No console errors

---

**Setup Complete!** 🎉

Your eRecord Timeless system is now connected to Supabase and ready to use!

---

**Last Updated:** 2025-10-21  
**Version:** 1.0.0
