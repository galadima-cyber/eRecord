# eRecord Timeless - Navigation Map

## 🗺️ Complete Application Structure

---

## 🎓 STUDENT PORTAL

```
┌─────────────────────────────────────────────────────────┐
│  eRecord Timeless - Student Portal                      │
│  [≡] Toggle Sidebar                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🏠 Dashboard              ← /dashboard/student         │
│     • Attendance statistics                             │
│     • Active sessions list                              │
│     • Quick check-in access                             │
│     • Attendance rate display                           │
│                                                          │
│  ✓ Check-In                ← /dashboard/student/check-in│
│     • GPS location capture                              │
│     • Active session selection                          │
│     • Location verification                             │
│     • Check-in confirmation                             │
│                                                          │
│  📊 Attendance             ← /dashboard/student/attendance│
│     • 7-day trend chart                                 │
│     • Distribution pie chart                            │
│     • Detailed records table                            │
│     • CSV export button                                 │
│                                                          │
│  🔔 Notifications          ← /dashboard/student/notifications│
│     • Session reminders                                 │
│     • Attendance alerts                                 │
│     • Announcements                                     │
│     • Mark as read/delete                               │
│                                                          │
│  💬 Feedback               ← /dashboard/student/feedback│
│     • Submit feedback form                              │
│     • View feedback history                             │
│     • Status tracking                                   │
│                                                          │
│  ⚙️ Settings               ← /dashboard/student/settings│
│     • Update profile                                    │
│     • Change password                                   │
│     • Notification preferences                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  🚪 Logout                                              │
└─────────────────────────────────────────────────────────┘
```

---

## 👨‍🏫 LECTURER PORTAL

```
┌─────────────────────────────────────────────────────────┐
│  eRecord Timeless - Lecturer Portal                     │
│  [≡] Toggle Sidebar                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🏠 Dashboard              ← /dashboard/lecturer        │
│     • Session statistics                                │
│     • Quick session creation                            │
│     • Active sessions overview                          │
│     • Average attendance rate                           │
│                                                          │
│  📅 Sessions               ← /dashboard/lecturer/sessions│
│     • Create new session                                │
│     • View all sessions                                 │
│     • Edit session details                              │
│     • End/cancel sessions                               │
│                                                          │
│  📤 Add Students           ← /dashboard/lecturer/upload-students│
│     • Upload CSV/Excel file                             │
│     • Select target session                             │
│     • Duplicate detection                               │
│     • Email invitations                                 │
│                                                          │
│  📝 Manual Attendance      ← /dashboard/lecturer/manual-attendance│
│     • Select session                                    │
│     • Mark Present/Absent/Late                          │
│     • Bulk operations                                   │
│     • Save changes                                      │
│                                                          │
│  📊 Reports                ← /dashboard/lecturer/reports│
│     • Attendance charts                                 │
│     • Distribution graphs                               │
│     • Summary statistics                                │
│     • Export reports                                    │
│                                                          │
│  📢 Announcements          ← /dashboard/lecturer/announcements│
│     • Create announcement                               │
│     • View history                                      │
│     • Target sessions                                   │
│     • Send to students                                  │
│                                                          │
│  ⚙️ Settings               ← /dashboard/lecturer/settings│
│     • Update profile                                    │
│     • Change password                                   │
│     • Notification preferences                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  🚪 Logout                                              │
└─────────────────────────────────────────────────────────┘
```

---

## 👨‍💼 ADMIN PORTAL

```
┌─────────────────────────────────────────────────────────┐
│  eRecord Timeless - Admin Portal                        │
│  [≡] Toggle Sidebar                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🏠 Dashboard              ← /dashboard/admin           │
│     • Total users count                                 │
│     • Students/Lecturers breakdown                      │
│     • Total sessions                                    │
│     • System overview                                   │
│                                                          │
│  👥 User Management        ← /dashboard/admin/users     │
│     • View all users                                    │
│     • Add new user                                      │
│     • Edit user details                                 │
│     • Delete users                                      │
│     • Assign roles                                      │
│                                                          │
│  📈 Analytics              ← /dashboard/admin/analytics │
│     • System-wide statistics                            │
│     • Attendance trends                                 │
│     • User activity                                     │
│     • Session analytics                                 │
│                                                          │
│  📄 Reports                ← /dashboard/admin/reports   │
│     • Overall attendance report                         │
│     • User activity report                              │
│     • Session summary report                            │
│     • Export options                                    │
│                                                          │
│  ⚙️ Settings               ← /dashboard/admin/settings  │
│     • Update profile                                    │
│     • System configuration                              │
│     • Session timeout                                   │
│     • Location radius                                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  🚪 Logout                                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Sidebar States

### **Expanded State (Default)**
```
┌──────────────────────────┐
│ eRecord        [X]       │
│ Student                  │
├──────────────────────────┤
│ 🏠 Dashboard             │
│ ✓ Check-In               │
│ 📊 Attendance            │
│ 🔔 Notifications         │
│ 💬 Feedback              │
│ ⚙️ Settings              │
├──────────────────────────┤
│ 🚪 Logout                │
└──────────────────────────┘
Width: 256px (16rem)
```

### **Collapsed State**
```
┌────┐
│[☰] │
├────┤
│ 🏠 │ ← Tooltip: "Dashboard"
│ ✓  │ ← Tooltip: "Check-In"
│ 📊 │ ← Tooltip: "Attendance"
│ 🔔 │ ← Tooltip: "Notifications"
│ 💬 │ ← Tooltip: "Feedback"
│ ⚙️ │ ← Tooltip: "Settings"
├────┤
│ 🚪 │ ← Tooltip: "Logout"
└────┘
Width: 64px (4rem)
```

---

## 🎨 Visual Features

### **Active Page Highlighting**
```
Current Page: /dashboard/student/attendance

┌──────────────────────────┐
│ 🏠 Dashboard             │  ← Normal
│ ✓ Check-In               │  ← Normal
│ 📊 Attendance            │  ← HIGHLIGHTED (accent color)
│ 🔔 Notifications         │  ← Normal
│ 💬 Feedback              │  ← Normal
│ ⚙️ Settings              │  ← Normal
└──────────────────────────┘
```

### **Hover States**
```
┌──────────────────────────┐
│ 🏠 Dashboard             │  ← Normal
│ ✓ Check-In               │  ← Hover (lighter background)
│ 📊 Attendance            │  ← Normal
└──────────────────────────┘
```

---

## 🔄 Navigation Flow

### **Student Journey**
```
Login (/)
  ↓
Dashboard (/dashboard/student)
  ↓
  ├─→ Check-In (/dashboard/student/check-in)
  │     ↓
  │   Select Session → Verify Location → Confirm
  │
  ├─→ Attendance (/dashboard/student/attendance)
  │     ↓
  │   View Charts → View Records → Export CSV
  │
  ├─→ Notifications (/dashboard/student/notifications)
  │     ↓
  │   Read → Mark as Read → Delete
  │
  ├─→ Feedback (/dashboard/student/feedback)
  │     ↓
  │   Submit → View History
  │
  └─→ Settings (/dashboard/student/settings)
        ↓
      Update Profile → Change Password
```

### **Lecturer Journey**
```
Login (/)
  ↓
Dashboard (/dashboard/lecturer)
  ↓
  ├─→ Sessions (/dashboard/lecturer/sessions)
  │     ↓
  │   Create → Edit → View → End
  │
  ├─→ Add Students (/dashboard/lecturer/upload-students)
  │     ↓
  │   Select Session → Upload File → Confirm
  │
  ├─→ Manual Attendance (/dashboard/lecturer/manual-attendance)
  │     ↓
  │   Select Session → Mark Attendance → Save
  │
  ├─→ Reports (/dashboard/lecturer/reports)
  │     ↓
  │   View Charts → Export
  │
  └─→ Announcements (/dashboard/lecturer/announcements)
        ↓
      Create → Send → View History
```

### **Admin Journey**
```
Login (/)
  ↓
Dashboard (/dashboard/admin)
  ↓
  ├─→ User Management (/dashboard/admin/users)
  │     ↓
  │   View → Add → Edit → Delete
  │
  ├─→ Analytics (/dashboard/admin/analytics)
  │     ↓
  │   View System Stats → Charts
  │
  ├─→ Reports (/dashboard/admin/reports)
  │     ↓
  │   Generate → Export
  │
  └─→ Settings (/dashboard/admin/settings)
        ↓
      System Config → Profile
```

---

## 🔐 Access Control

### **Route Protection**
```
Public Routes:
  / (Login page)
  /auth/callback
  /forgot-password

Protected Routes (Require Authentication):
  /dashboard/*

Role-Based Routes:
  /dashboard/student/*    → Student role only
  /dashboard/lecturer/*   → Lecturer role only
  /dashboard/admin/*      → Admin role only
```

### **Redirect Logic**
```
User logs in:
  ↓
Check role:
  ├─ Student   → /dashboard/student
  ├─ Lecturer  → /dashboard/lecturer
  └─ Admin     → /dashboard/admin

User not authenticated:
  ↓
Redirect to: /
```

---

## 📱 Responsive Behavior

### **Desktop (>1024px)**
- Sidebar always visible
- Full width content area
- Hover effects enabled

### **Tablet (768px - 1024px)**
- Sidebar collapsible
- Adjusted content width
- Touch-friendly buttons

### **Mobile (<768px)**
- Sidebar overlay mode
- Full-width content
- Hamburger menu

---

## 🎯 Quick Actions

### **Student Quick Actions**
```
From Dashboard:
  • Quick check-in button
  • View latest attendance
  • Check notifications

From Any Page:
  • Sidebar navigation
  • Logout button
```

### **Lecturer Quick Actions**
```
From Dashboard:
  • Quick session creation
  • View active sessions
  • Upload students

From Any Page:
  • Sidebar navigation
  • Session management
```

### **Admin Quick Actions**
```
From Dashboard:
  • Add new user
  • View system stats
  • Generate reports

From Any Page:
  • User management
  • System settings
```

---

## 🎨 Color Coding

### **Navigation States**
- **Normal:** Default text color
- **Hover:** Lighter background
- **Active:** Accent color background
- **Disabled:** Grayed out (if applicable)

### **Status Indicators**
- **Present:** Green
- **Absent:** Red
- **Late:** Yellow
- **Unverified:** Orange

---

## ✨ Summary

**Total Pages:** 18  
**Total Routes:** 18+  
**Sidebar States:** 2 (Expanded/Collapsed)  
**Role-Based Menus:** 3 (Student/Lecturer/Admin)  
**Navigation Items per Role:** 6-7  

**All navigation is fully functional and tested!** ✅

---

**Last Updated:** 2025-10-21  
**Version:** 1.0.0
