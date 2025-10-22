# ⚡ Quick Supabase Setup - 10 Minutes

## 🎯 Super Fast Setup Guide

Follow these steps to get your database running in 10 minutes!

---

## ✅ Step 1: Create Supabase Account (2 min)

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign in with GitHub or Google
4. Click **"New Project"**
5. Fill in:
   - Name: `erecord-timeless`
   - Password: (create a strong one - SAVE IT!)
   - Region: (choose closest to you)
6. Click **"Create new project"**
7. ⏳ Wait 2-3 minutes...

---

## 🔑 Step 2: Get Your Keys (1 min)

1. In Supabase dashboard, click **"Settings"** (gear icon)
2. Click **"API"**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## 📝 Step 3: Create .env.local File (1 min)

1. In your project folder, create a file named `.env.local`
2. Add this content (replace with YOUR values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file
4. Restart your dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 🗄️ Step 4: Run Database Scripts (3 min)

1. In Supabase dashboard, click **"SQL Editor"**
2. Click **"New query"**
3. Run these 4 scripts **IN ORDER**:

### Script 1:
- Open `scripts/00-fresh-schema.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"**
- ✅ Wait for "Success"

### Script 2:
- Open `scripts/01-create-tables.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"**
- ✅ Wait for "Success"

### Script 3:
- Open `scripts/02-phase2-schema.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"**
- ✅ Wait for "Success"

### Script 4:
- Open `scripts/03-fix-rls-policies.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"**
- ✅ Wait for "Success"

---

## 👥 Step 5: Create Test Users (2 min)

Copy and run this SQL in the SQL Editor:

```sql
-- Create Admin User
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role
) VALUES (
  gen_random_uuid(), 'admin@erecord.com',
  crypt('Admin123!', gen_salt('bf')), NOW(),
  NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Admin"}', false, 'authenticated'
);

DO $$
DECLARE admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@erecord.com';
  INSERT INTO public.users (id, email, full_name, role, department)
  VALUES (admin_id, 'admin@erecord.com', 'System Admin', 'admin', 'Administration');
END $$;

-- Create Lecturer User
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role
) VALUES (
  gen_random_uuid(), 'lecturer@erecord.com',
  crypt('Lecturer123!', gen_salt('bf')), NOW(),
  NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. John Smith"}', false, 'authenticated'
);

DO $$
DECLARE lecturer_id UUID;
BEGIN
  SELECT id INTO lecturer_id FROM auth.users WHERE email = 'lecturer@erecord.com';
  INSERT INTO public.users (id, email, full_name, role, department)
  VALUES (lecturer_id, 'lecturer@erecord.com', 'Dr. John Smith', 'lecturer', 'Computer Science');
END $$;

-- Create Student User
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role
) VALUES (
  gen_random_uuid(), 'student@erecord.com',
  crypt('Student123!', gen_salt('bf')), NOW(),
  NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Jane Doe"}', false, 'authenticated'
);

DO $$
DECLARE student_id UUID;
BEGIN
  SELECT id INTO student_id FROM auth.users WHERE email = 'student@erecord.com';
  INSERT INTO public.users (id, email, full_name, role, department, student_id)
  VALUES (student_id, 'student@erecord.com', 'Jane Doe', 'student', 'Computer Science', 'STU001');
END $$;
```

Click **"Run"** and wait for success!

---

## 🧪 Step 6: Test Login (1 min)

1. Go to **http://localhost:3001**
2. Try logging in:

**Test Credentials:**
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

3. ✅ You should be redirected to the dashboard!

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] `.env.local` file created with your keys
- [ ] Dev server restarted
- [ ] All 4 SQL scripts ran successfully
- [ ] Test users created
- [ ] Can login as admin ✅
- [ ] Can login as lecturer ✅
- [ ] Can login as student ✅
- [ ] Dashboard loads correctly

---

## 🎉 Done!

**Your database is ready!** You can now:

- ✅ Login with any test account
- ✅ Create sessions (as lecturer)
- ✅ Check-in to sessions (as student)
- ✅ View attendance reports
- ✅ Manage users (as admin)

---

## 🐛 Quick Troubleshooting

### Can't login?
- Check `.env.local` has correct keys
- Restart dev server
- Clear browser cache

### "User not found" error?
- Re-run the test user creation SQL
- Check Supabase Table Editor for users

### Tables not showing?
- Re-run SQL scripts in order
- Check for errors in SQL Editor console

---

## 📚 Need More Help?

See the detailed guide: **SUPABASE_SETUP_GUIDE.md**

---

**Total Time:** ~10 minutes ⚡  
**Status:** Ready to use! 🚀
