# 📊 eRecord Timeless - Database Schema Diagram

## Visual Database Structure

---

## 🗂️ Complete Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    eRecord Timeless Database                     │
│                         9 Tables Total                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│     USERS        │ ← Core user table (links to auth.users)
├──────────────────┤
│ id (UUID) PK     │ ← References auth.users(id)
│ email            │
│ full_name        │
│ role             │ ← 'student' | 'lecturer' | 'admin'
│ student_id       │
│ staff_id         │
│ department       │
│ phone            │
│ avatar_url       │
│ is_active        │
│ created_at       │
│ updated_at       │
└──────────────────┘
         │
         │ Referenced by multiple tables
         ├─────────────────────────────────┐
         ↓                                 ↓
┌──────────────────┐              ┌──────────────────┐
│    COURSES       │              │ ATTENDANCE       │
├──────────────────┤              │   SESSIONS       │
│ id (UUID) PK     │              ├──────────────────┤
│ course_code      │              │ id (UUID) PK     │
│ course_name      │              │ course_id FK     │───┐
│ description      │              │ lecturer_id FK   │   │
│ department       │              │ course_code      │   │
│ credits          │              │ course_name      │   │
│ semester         │              │ session_date     │   │
│ lecturer_id FK   │──────┐       │ start_time       │   │
│ is_active        │      │       │ end_time         │   │
│ created_at       │      │       │ location         │   │
│ updated_at       │      │       │ latitude         │   │
└──────────────────┘      │       │ longitude        │   │
         │                │       │ geofence_radius  │   │
         │                │       │ status           │   │
         │                │       │ qr_code          │   │
         │                │       │ created_at       │   │
         │                │       │ updated_at       │   │
         │                │       └──────────────────┘   │
         │                │                │             │
         │                │                │             │
         ↓                ↓                ↓             │
┌──────────────────────────────────────────────┐        │
│         COURSE_ENROLLMENTS                   │        │
├──────────────────────────────────────────────┤        │
│ id (UUID) PK                                 │        │
│ student_id FK  ──→ users(id)                 │        │
│ course_id FK   ──→ courses(id)               │        │
│ session_id FK  ──→ attendance_sessions(id)   │        │
│ enrollment_date                              │        │
│ status ('active' | 'dropped' | 'completed')  │        │
│ created_at                                   │        │
│ updated_at                                   │        │
└──────────────────────────────────────────────┘        │
                                                        │
                                                        │
         ┌──────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────┐
│         ATTENDANCE_RECORDS                   │
├──────────────────────────────────────────────┤
│ id (UUID) PK                                 │
│ session_id FK  ──→ attendance_sessions(id)   │
│ student_id FK  ──→ users(id)                 │
│ check_in_time                                │
│ check_out_time                               │
│ check_in_latitude                            │
│ check_in_longitude                           │
│ check_in_ip_address                          │
│ distance_from_venue                          │
│ is_location_verified                         │
│ biometric_verified                           │
│ biometric_data (JSONB)                       │
│ status ('present'|'absent'|'late'|'excused') │
│ marked_by FK   ──→ users(id)                 │
│ is_manual                                    │
│ notes                                        │
│ created_at                                   │
│ updated_at                                   │
└──────────────────────────────────────────────┘


┌──────────────────────────────────────────────┐
│           NOTIFICATIONS                      │
├──────────────────────────────────────────────┤
│ id (UUID) PK                                 │
│ user_id FK     ──→ users(id)                 │
│ title                                        │
│ message                                      │
│ type ('info'|'warning'|'success'|'error')    │
│ category                                     │
│ related_session_id FK                        │
│ related_record_id FK                         │
│ is_read                                      │
│ read_at                                      │
│ action_url                                   │
│ priority                                     │
│ expires_at                                   │
│ created_at                                   │
└──────────────────────────────────────────────┘


┌──────────────────────────────────────────────┐
│           ANNOUNCEMENTS                      │
├──────────────────────────────────────────────┤
│ id (UUID) PK                                 │
│ lecturer_id FK ──→ users(id)                 │
│ course_id FK   ──→ courses(id)               │
│ session_id FK  ──→ attendance_sessions(id)   │
│ title                                        │
│ message                                      │
│ type ('general'|'urgent'|'reminder')         │
│ target_audience ('all'|'course'|'session')   │
│ is_published                                 │
│ published_at                                 │
│ expires_at                                   │
│ attachments (JSONB)                          │
│ created_at                                   │
│ updated_at                                   │
└──────────────────────────────────────────────┘


┌──────────────────────────────────────────────┐
│              FEEDBACK                        │
├──────────────────────────────────────────────┤
│ id (UUID) PK                                 │
│ student_id FK  ──→ users(id)                 │
│ session_id FK  ──→ attendance_sessions(id)   │
│ course_id FK   ──→ courses(id)               │
│ subject                                      │
│ message                                      │
│ category                                     │
│ rating (1-5)                                 │
│ status ('pending'|'reviewed'|'resolved')     │
│ admin_response                               │
│ responded_by FK ──→ users(id)                │
│ responded_at                                 │
│ is_anonymous                                 │
│ created_at                                   │
│ updated_at                                   │
└──────────────────────────────────────────────┘


┌──────────────────────────────────────────────┐
│            AUDIT_LOGS                        │
├──────────────────────────────────────────────┤
│ id (UUID) PK                                 │
│ user_id FK     ──→ users(id)                 │
│ action                                       │
│ entity_type                                  │
│ entity_id                                    │
│ old_values (JSONB)                           │
│ new_values (JSONB)                           │
│ ip_address                                   │
│ user_agent                                   │
│ metadata (JSONB)                             │
│ created_at                                   │
└──────────────────────────────────────────────┘
```

---

## 🔗 Relationships

### **Primary Relationships**

```
users (1) ──→ (many) courses
  └─ One lecturer can teach many courses

users (1) ──→ (many) attendance_sessions
  └─ One lecturer can create many sessions

users (many) ←──→ (many) courses
  └─ Many students can enroll in many courses
  └─ Through: course_enrollments

attendance_sessions (1) ──→ (many) attendance_records
  └─ One session has many attendance records

users (1) ──→ (many) attendance_records
  └─ One student has many attendance records

users (1) ──→ (many) notifications
  └─ One user receives many notifications

users (1) ──→ (many) announcements
  └─ One lecturer creates many announcements

users (1) ──→ (many) feedback
  └─ One student submits many feedbacks
```

---

## 📋 Table Purposes

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **users** | Store all user profiles | Role-based (student/lecturer/admin) |
| **courses** | Course catalog | Linked to lecturers |
| **attendance_sessions** | Individual class sessions | GPS, geofencing, QR codes |
| **course_enrollments** | Student-course links | Enrollment status tracking |
| **attendance_records** | Check-in records | Location verification, biometric |
| **notifications** | System alerts | Types, priorities, read status |
| **announcements** | Lecturer messages | Target audiences, expiration |
| **feedback** | Student feedback | Ratings, categories, responses |
| **audit_logs** | Activity tracking | All system changes logged |

---

## 🔐 Security (RLS Policies)

### **Students Can:**
- ✅ View own profile
- ✅ View enrolled courses
- ✅ View active sessions
- ✅ Create check-in records
- ✅ View own attendance
- ✅ View own notifications
- ✅ Submit feedback

### **Lecturers Can:**
- ✅ View own profile
- ✅ Create courses
- ✅ Create sessions
- ✅ View enrolled students
- ✅ Record attendance
- ✅ Send announcements
- ✅ View feedback for their courses

### **Admins Can:**
- ✅ View all users
- ✅ Manage all accounts
- ✅ View all data
- ✅ Respond to feedback
- ✅ View audit logs
- ✅ Configure system

---

## 🎯 Data Flow Example

### **Student Check-In Flow**

```
1. Student navigates to Check-In page
   ↓
2. System fetches active sessions
   Query: SELECT * FROM attendance_sessions 
          WHERE status = 'active' 
          AND id IN (SELECT session_id FROM course_enrollments 
                     WHERE student_id = current_user)
   ↓
3. Student selects session and clicks Check-In
   ↓
4. System captures GPS location
   Browser Geolocation API → latitude, longitude
   ↓
5. System verifies location
   Function: verify_location(session_id, lat, lon)
   Calculates: distance = calculate_distance(session_lat, session_lon, check_lat, check_lon)
   ↓
6. System creates attendance record
   INSERT INTO attendance_records (
     session_id, student_id, check_in_time,
     check_in_latitude, check_in_longitude,
     distance_from_venue, is_location_verified,
     status
   )
   ↓
7. System determines status
   IF distance <= geofence_radius THEN 'present'
   ELSE 'unverified'
   ↓
8. System creates notification
   INSERT INTO notifications (
     user_id, title, message, type
   )
   ↓
9. Student sees confirmation
   "Check-in successful!"
```

---

## 📊 Common Queries

### **Get Student Attendance Statistics**
```sql
SELECT * FROM get_student_stats('student-uuid');
```

### **Get Active Sessions for Student**
```sql
SELECT s.* 
FROM attendance_sessions s
JOIN course_enrollments e ON s.id = e.session_id
WHERE e.student_id = 'student-uuid'
  AND s.status = 'active';
```

### **Get Attendance Records for Session**
```sql
SELECT 
  ar.*,
  u.full_name,
  u.student_id
FROM attendance_records ar
JOIN users u ON ar.student_id = u.id
WHERE ar.session_id = 'session-uuid'
ORDER BY ar.check_in_time;
```

### **Get Lecturer's Sessions**
```sql
SELECT * 
FROM attendance_sessions
WHERE lecturer_id = 'lecturer-uuid'
ORDER BY session_date DESC;
```

### **Get Unread Notifications**
```sql
SELECT * 
FROM notifications
WHERE user_id = 'user-uuid'
  AND is_read = FALSE
ORDER BY created_at DESC;
```

---

## 🔧 Helper Functions

### **1. Calculate Distance (Haversine)**
```sql
SELECT calculate_distance(
  6.5244,    -- Session latitude
  3.3792,    -- Session longitude
  6.5250,    -- Check-in latitude
  3.3800     -- Check-in longitude
);
-- Returns: distance in meters
```

### **2. Verify Location**
```sql
SELECT verify_location(
  'session-uuid',
  6.5250,    -- Check-in latitude
  3.3800     -- Check-in longitude
);
-- Returns: TRUE if within geofence, FALSE otherwise
```

### **3. Get Student Stats**
```sql
SELECT * FROM get_student_stats('student-uuid');
-- Returns:
-- total_sessions, present_count, absent_count, 
-- late_count, attendance_rate
```

---

## 📈 Indexes for Performance

### **Critical Indexes**

```sql
-- User lookups
idx_users_email          ON users(email)
idx_users_role           ON users(role)
idx_users_student_id     ON users(student_id)

-- Session queries
idx_sessions_date        ON attendance_sessions(session_date)
idx_sessions_status      ON attendance_sessions(status)
idx_sessions_lecturer    ON attendance_sessions(lecturer_id)

-- Attendance lookups
idx_records_session      ON attendance_records(session_id)
idx_records_student      ON attendance_records(student_id)
idx_records_status       ON attendance_records(status)

-- Notification queries
idx_notifications_user   ON notifications(user_id)
idx_notifications_read   ON notifications(is_read)
```

---

## 🎨 Field Types Reference

### **Common Field Types**

| Type | Usage | Example |
|------|-------|---------|
| UUID | Primary keys, foreign keys | `gen_random_uuid()` |
| TEXT | Strings, emails, names | `'John Doe'` |
| DECIMAL(10,8) | GPS coordinates | `6.52440000` |
| INTEGER | Counts, radius | `100` |
| BOOLEAN | Flags | `TRUE/FALSE` |
| TIMESTAMP | Dates and times | `NOW()` |
| JSONB | Flexible data | `{"key": "value"}` |
| INET | IP addresses | `192.168.1.1` |

---

## ✅ Schema Checklist

After running the schema, verify:

- [ ] 9 tables created
- [ ] All foreign keys working
- [ ] RLS enabled on all tables
- [ ] Policies created (30+ policies)
- [ ] Indexes created (30+ indexes)
- [ ] Triggers working (auto-update timestamps)
- [ ] Helper functions available
- [ ] Test users can be created
- [ ] Can query all tables

---

## 🚀 Quick Start Commands

### **View All Tables**
```sql
\dt
```

### **Describe Table Structure**
```sql
\d users
\d attendance_sessions
\d attendance_records
```

### **Check RLS Policies**
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### **Check Indexes**
```sql
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

### **Test Helper Functions**
```sql
-- Test distance calculation
SELECT calculate_distance(0, 0, 0, 0.001);

-- Test location verification
SELECT verify_location(
  (SELECT id FROM attendance_sessions LIMIT 1),
  6.5244, 3.3792
);
```

---

## 📞 Support

For schema-related questions:
- See: `SCHEMA_SETUP_INSTRUCTIONS.md`
- SQL File: `scripts/COMPLETE-SCHEMA.sql`
- Test Users: `scripts/CREATE-TEST-USERS.sql`

---

**Last Updated:** 2025-10-21  
**Version:** 1.0.0  
**Tables:** 9  
**Policies:** 30+  
**Indexes:** 30+  
**Status:** Production Ready ✅
