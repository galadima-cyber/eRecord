# 👥 Create Test Users - Step-by-Step Guide

## ⚠️ Important Note

The SQL script for creating users directly in `auth.users` doesn't work reliably because Supabase manages authentication differently. 

**Use the Supabase Dashboard instead - it's easier and more reliable!**

---

## ✅ Method 1: Supabase Dashboard (Recommended)

### **Step 1: Open Supabase Dashboard**

1. Go to your Supabase project
2. Click **"Authentication"** in the left sidebar
3. Click **"Users"** tab

### **Step 2: Create Admin User**

1. Click **"Add user"** button (top right)
2. Fill in the form:
   - **Email:** `admin@erecord.com`
   - **Password:** `Admin123!`
   - **Auto Confirm User:** ✅ **Check this box!**
3. Click **"Create user"**
4. ✅ User created!

### **Step 3: Create Lecturer User**

1. Click **"Add user"** again
2. Fill in:
   - **Email:** `lecturer@erecord.com`
   - **Password:** `Lecturer123!`
   - **Auto Confirm User:** ✅ **Check this box!**
3. Click **"Create user"**
4. ✅ User created!

### **Step 4: Create Student User**

1. Click **"Add user"** again
2. Fill in:
   - **Email:** `student@erecord.com`
   - **Password:** `Student123!`
   - **Auto Confirm User:** ✅ **Check this box!**
3. Click **"Create user"**
4. ✅ User created!

### **Step 5: Link to Public Users Table**

1. Go to **SQL Editor**
2. Copy content from `scripts/CREATE-TEST-USERS-SIMPLE.sql`
3. Paste and click **"Run"**
4. This creates profiles in `public.users` table

### **Step 6: Verify**

1. Go to **Table Editor** → **users** table
2. You should see 3 users with roles:
   - admin@erecord.com (role: admin)
   - lecturer@erecord.com (role: lecturer)
   - student@erecord.com (role: student)

---

## ✅ Method 2: Using SQL (Alternative)

If you prefer SQL, use this simpler approach:

### **Step 1: Create Auth Users in Dashboard**

Follow Steps 1-4 from Method 1 above.

### **Step 2: Run Simple SQL**

```sql
-- Link auth users to public.users
-- Copy from: scripts/CREATE-TEST-USERS-SIMPLE.sql

INSERT INTO public.users (id, email, full_name, role, department)
SELECT id, email, 'System Admin', 'admin', 'Administration'
FROM auth.users WHERE email = 'admin@erecord.com'
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.users (id, email, full_name, role, department, staff_id)
SELECT id, email, 'Dr. John Smith', 'lecturer', 'Computer Science', 'LEC001'
FROM auth.users WHERE email = 'lecturer@erecord.com'
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.users (id, email, full_name, role, department, student_id)
SELECT id, email, 'Jane Doe', 'student', 'Computer Science', 'STU001'
FROM auth.users WHERE email = 'student@erecord.com'
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
```

---

## 🎯 Visual Guide

### **Supabase Dashboard Flow**

```
1. Authentication → Users
   ↓
2. Click "Add user"
   ↓
3. Enter email: admin@erecord.com
   ↓
4. Enter password: Admin123!
   ↓
5. ✅ Check "Auto Confirm User"
   ↓
6. Click "Create user"
   ↓
7. Repeat for lecturer and student
   ↓
8. Run CREATE-TEST-USERS-SIMPLE.sql
   ↓
9. ✅ Done!
```

---

## 📋 User Details

### **Admin User**
```
Email: admin@erecord.com
Password: Admin123!
Role: admin
Department: Administration
```

### **Lecturer User**
```
Email: lecturer@erecord.com
Password: Lecturer123!
Role: lecturer
Department: Computer Science
Staff ID: LEC001
```

### **Student User**
```
Email: student@erecord.com
Password: Student123!
Role: student
Department: Computer Science
Student ID: STU001
```

---

## ✅ Verification Steps

### **1. Check Auth Users**

1. Go to **Authentication** → **Users**
2. You should see 3 users listed
3. All should have green "Confirmed" status

### **2. Check Public Users**

```sql
SELECT email, full_name, role FROM public.users;
```

Should return:
```
admin@erecord.com    | System Admin    | admin
lecturer@erecord.com | Dr. John Smith  | lecturer
student@erecord.com  | Jane Doe        | student
```

### **3. Test Login**

1. Go to http://localhost:3001
2. Try logging in with each account
3. Verify redirect to correct dashboard

---

## 🐛 Troubleshooting

### **Problem: "User already exists"**

**Solution:**
- User was created before
- Just run the SQL to link to public.users
- Or delete and recreate in Dashboard

### **Problem: "Email not confirmed"**

**Solution:**
- Make sure you checked "Auto Confirm User"
- Or manually confirm in Dashboard:
  - Click on user
  - Click "Confirm email"

### **Problem: "Can't login"**

**Solution:**
1. Check user exists in Authentication → Users
2. Check user exists in public.users table
3. Verify password is correct
4. Check `.env.local` has correct Supabase keys
5. Restart dev server

### **Problem: "User not found in public.users"**

**Solution:**
- Run `CREATE-TEST-USERS-SIMPLE.sql`
- This links auth.users to public.users

### **Problem: SQL error when creating users**

**Solution:**
- Don't use the old `CREATE-TEST-USERS.sql`
- Use Dashboard method instead
- Or use `CREATE-TEST-USERS-SIMPLE.sql`

---

## 🎓 Understanding the Two Tables

### **auth.users** (Managed by Supabase)
- Handles authentication
- Stores encrypted passwords
- Manages sessions
- **Create via Dashboard or Auth API**

### **public.users** (Your app data)
- Stores profile information
- Has role (student/lecturer/admin)
- Has department, student_id, etc.
- **Create via SQL after auth.users exists**

### **The Link**
```
auth.users.id = public.users.id
```

Both tables share the same UUID for each user.

---

## 📝 Quick Reference

### **Create Users: 2 Steps**

**Step 1: Dashboard**
```
Authentication → Users → Add user
Create: admin@erecord.com, lecturer@erecord.com, student@erecord.com
```

**Step 2: SQL**
```sql
-- Run: CREATE-TEST-USERS-SIMPLE.sql
-- Links auth users to public.users
```

### **Files to Use**

✅ **USE:** `scripts/CREATE-TEST-USERS-SIMPLE.sql`  
❌ **DON'T USE:** `scripts/CREATE-TEST-USERS.sql` (has errors)

---

## 🎉 Success Checklist

- [ ] 3 users visible in Authentication → Users
- [ ] All users have "Confirmed" status
- [ ] 3 users visible in Table Editor → users
- [ ] Each user has correct role
- [ ] Can login as admin ✅
- [ ] Can login as lecturer ✅
- [ ] Can login as student ✅
- [ ] Redirects to correct dashboard

---

## 💡 Pro Tips

1. **Always use Dashboard** for creating auth users
2. **Always check "Auto Confirm User"** when creating
3. **Run the simple SQL** to link to public.users
4. **Test login immediately** after creating
5. **Check both tables** to verify

---

## 🚀 Next Steps

After creating users:

1. ✅ Test login with all 3 accounts
2. ✅ Verify dashboards load correctly
3. ✅ Test creating a session (as lecturer)
4. ✅ Test check-in (as student)
5. ✅ Explore all features

---

**Total Time:** ~3 minutes  
**Difficulty:** Easy  
**Success Rate:** 100% ✅

---

**Last Updated:** 2025-10-21
