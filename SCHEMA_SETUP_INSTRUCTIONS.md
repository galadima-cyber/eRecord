# 🗄️ Database Schema Setup - Complete Guide

## 📋 Overview

This guide will help you set up the complete database schema for eRecord Timeless in **5 simple steps**.

---

## ✅ What You'll Get

After completing this setup, you'll have:

- ✅ **9 Database Tables** - All tables needed for the system
- ✅ **Complete RLS Policies** - Row-level security for all tables
- ✅ **Indexes** - Optimized for performance
- ✅ **Helper Functions** - Distance calculation, statistics, etc.
- ✅ **Test Users** - Ready-to-use accounts for testing
- ✅ **Triggers** - Auto-update timestamps

---

## 🚀 Quick Setup (5 Steps)

### **Step 1: Open Supabase SQL Editor**

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### **Step 2: Run Complete Schema**

1. Open the file: `scripts/COMPLETE-SCHEMA.sql`
2. **Copy ALL the content** (Ctrl+A, Ctrl+C)
3. **Paste** into Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. ⏳ Wait for "Success" message (may take 10-15 seconds)

### **Step 3: Create Test Users**

1. Click **"New query"** again
2. Open the file: `scripts/CREATE-TEST-USERS.sql`
3. **Copy ALL the content**
4. **Paste** into Supabase SQL Editor
5. Click **"Run"**
6. ✅ You should see a success message with user counts

### **Step 4: Verify Tables Created**

1. Click **"Table Editor"** in Supabase sidebar
2. You should see these 9 tables:
   - ✅ `users`
   - ✅ `courses`
   - ✅ `attendance_sessions`
   - ✅ `course_enrollments`
   - ✅ `attendance_records`
   - ✅ `notifications`
   - ✅ `announcements`
   - ✅ `feedback`
   - ✅ `audit_logs`

### **Step 5: Test Login**

1. Go to http://localhost:3001
2. Login with test credentials:

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

---

## 📊 Database Schema Details

### **Tables Overview**

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **users** | User profiles (students, lecturers, admins) | Role-based access, student/staff IDs |
| **courses** | Course information | Course codes, credits, semesters |
| **attendance_sessions** | Individual class sessions | GPS coordinates, geofencing, QR codes |
| **course_enrollments** | Links students to courses/sessions | Enrollment status tracking |
| **attendance_records** | Student check-ins | Location verification, biometric data |
| **notifications** | System notifications | Types, priorities, read status |
| **announcements** | Lecturer announcements | Target audience, expiration |
| **feedback** | Student feedback | Categories, ratings, responses |
| **audit_logs** | System activity tracking | User actions, changes, metadata |

---

## 🔐 Security Features

### **Row Level Security (RLS)**

All tables have RLS enabled with policies for:

- ✅ **Students** - Can only see their own data
- ✅ **Lecturers** - Can see their courses and students
- ✅ **Admins** - Can see all data
- ✅ **Cross-role** - Proper data isolation

### **Example Policies**

```sql
-- Students can only view their own attendance records
CREATE POLICY "records_select_student" ON attendance_records
  FOR SELECT USING (student_id = auth.uid());

-- Lecturers can view records for their sessions
CREATE POLICY "records_select_lecturer" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE id = attendance_records.session_id 
      AND lecturer_id = auth.uid()
    )
  );
```

---

## 🛠️ Helper Functions Included

### **1. Calculate Distance**
```sql
calculate_distance(lat1, lon1, lat2, lon2)
```
- Uses Haversine formula
- Returns distance in meters
- Used for location verification

### **2. Verify Location**
```sql
verify_location(session_id, check_lat, check_lon)
```
- Checks if coordinates are within geofence
- Returns TRUE/FALSE
- Configurable radius per session

### **3. Get Student Statistics**
```sql
get_student_stats(student_id)
```
- Returns attendance statistics
- Calculates attendance rate
- Counts present/absent/late

**Usage Example:**
```sql
SELECT * FROM get_student_stats('student-uuid-here');
```

---

## 📈 Performance Optimizations

### **Indexes Created**

The schema includes **30+ indexes** for optimal performance:

- User lookups (email, role, student_id)
- Session queries (date, status, lecturer)
- Attendance records (session, student, status)
- Notifications (user, read status, date)
- And more...

### **Triggers**

Auto-update `updated_at` timestamps on:
- users
- courses
- attendance_sessions
- course_enrollments
- attendance_records
- announcements
- feedback

---

## 🎯 Schema Features

### **1. Geolocation Support**
- Latitude/longitude storage (DECIMAL precision)
- Configurable geofence radius per session
- Distance calculation function
- Location verification

### **2. Flexible Attendance**
- Multiple status types (present, absent, late, excused, unverified)
- Manual and automatic recording
- Biometric data support (JSONB)
- IP address logging

### **3. Course Management**
- Course codes and names
- Department organization
- Semester/academic year tracking
- Lecturer assignment

### **4. Notification System**
- Multiple types (info, warning, success, error, reminder)
- Categories (session, attendance, system, announcement)
- Priority levels (low, normal, high, urgent)
- Expiration dates
- Action URLs

### **5. Announcements**
- Target specific audiences (all, course, session)
- Expiration dates
- Attachment support (JSONB)
- Publication control

### **6. Feedback System**
- Categories (technical, session, lecturer, system, suggestion)
- Rating system (1-5 stars)
- Status tracking (pending, reviewed, resolved)
- Admin responses
- Anonymous option

### **7. Audit Logging**
- Track all important actions
- Store old/new values (JSONB)
- IP address and user agent
- Metadata support

---

## 🔍 Verify Your Setup

### **Check Tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Check RLS Policies**
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### **Check Indexes**
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### **Check Users**
```sql
SELECT email, full_name, role 
FROM public.users;
```

---

## 🐛 Troubleshooting

### **Problem: "relation already exists" error**

**Solution:**
The schema includes `DROP TABLE IF EXISTS` commands. If you still get errors:
1. Delete all tables manually in Table Editor
2. Re-run the schema

### **Problem: "permission denied" errors**

**Solution:**
1. Make sure you're using the SQL Editor (not Table Editor)
2. Check you're logged in as project owner
3. Verify RLS policies are correct

### **Problem: Can't login with test users**

**Solution:**
1. Check if users exist: `SELECT * FROM auth.users;`
2. Re-run `CREATE-TEST-USERS.sql`
3. Clear browser cache
4. Check `.env.local` has correct Supabase keys

### **Problem: Tables created but empty**

**Solution:**
This is normal! The schema creates structure only.
- Run `CREATE-TEST-USERS.sql` for test users
- Or create users through the app signup flow

---

## 📝 Schema Maintenance

### **Adding New Fields**

To add a new field to a table:

```sql
ALTER TABLE table_name 
ADD COLUMN new_field_name data_type;
```

### **Updating RLS Policies**

To modify a policy:

```sql
DROP POLICY "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (your_condition);
```

### **Creating Backups**

Before making changes:
1. Go to Database → Backups in Supabase
2. Create manual backup
3. Or export schema using pg_dump

---

## 🎓 Understanding the Schema

### **User Roles**

```
admin
  ├── Can manage all users
  ├── Can view all data
  ├── Can configure system
  └── Can view audit logs

lecturer
  ├── Can create sessions
  ├── Can manage students in their courses
  ├── Can record attendance
  ├── Can send announcements
  └── Can view reports

student
  ├── Can check-in to sessions
  ├── Can view own attendance
  ├── Can receive notifications
  ├── Can submit feedback
  └── Can update own profile
```

### **Data Flow**

```
1. Lecturer creates Course
2. Lecturer creates Attendance Session
3. Lecturer adds Students (Course Enrollments)
4. Session becomes Active
5. Students Check-In (Attendance Records)
6. System verifies Location
7. Attendance marked as Present/Late/Unverified
8. Notifications sent
9. Reports generated
```

---

## ✅ Success Checklist

After setup, verify:

- [ ] All 9 tables visible in Table Editor
- [ ] RLS enabled on all tables (check policies)
- [ ] Test users created (3 minimum)
- [ ] Can login as admin ✅
- [ ] Can login as lecturer ✅
- [ ] Can login as student ✅
- [ ] Dashboard loads for each role
- [ ] No console errors
- [ ] Data fetches correctly

---

## 🚀 Next Steps

After successful schema setup:

1. **Test Core Features**
   - Create a session (as lecturer)
   - Enroll students
   - Check-in (as student)
   - View reports

2. **Add Real Data**
   - Create actual courses
   - Add real students
   - Set up departments

3. **Configure Settings**
   - Geofence radius
   - Late check-in threshold
   - Notification preferences

4. **Production Deployment**
   - Create production Supabase project
   - Run schema on production
   - Update environment variables
   - Deploy to Vercel/Netlify

---

## 📞 Need Help?

### **Resources**
- **Schema File:** `scripts/COMPLETE-SCHEMA.sql`
- **Test Users:** `scripts/CREATE-TEST-USERS.sql`
- **Supabase Docs:** https://supabase.com/docs/guides/database

### **Common SQL Queries**

**View all users:**
```sql
SELECT * FROM public.users ORDER BY created_at DESC;
```

**View all sessions:**
```sql
SELECT * FROM attendance_sessions ORDER BY session_date DESC;
```

**View attendance records:**
```sql
SELECT 
  ar.*, 
  u.full_name as student_name,
  s.course_name
FROM attendance_records ar
JOIN users u ON ar.student_id = u.id
JOIN attendance_sessions s ON ar.session_id = s.id
ORDER BY ar.created_at DESC;
```

---

## 🎉 Congratulations!

Your database schema is now complete and ready for production use!

**Schema includes:**
- ✅ 9 tables with relationships
- ✅ 30+ indexes for performance
- ✅ Complete RLS policies
- ✅ Helper functions
- ✅ Auto-update triggers
- ✅ Test users ready

**You can now:**
- Create sessions
- Manage students
- Record attendance
- Generate reports
- Send notifications
- Track everything!

---

**Last Updated:** 2025-10-21  
**Version:** 1.0.0  
**Status:** Production Ready ✅
