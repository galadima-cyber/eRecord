# Role-Based Location Check-In System Setup Guide

## 🚀 Quick Setup Instructions

### 1. Database Setup

Run the new schema in your Supabase SQL editor:

```sql
-- Execute the contents of scripts/ROLE_BASED_LOCATION_SCHEMA.sql
```

This will create:
- `roles` table with admin, lecturer, student roles
- `user_roles` table for role assignments
- `locations` table for lecturer-defined class locations
- `sessions` table for active attendance sessions
- `attendance` table for student check-ins
- All necessary RLS policies and helper functions

### 2. Supabase Edge Function

Deploy the validate-checkin function:

```bash
# In your project root
supabase functions deploy validate-checkin
```

### 3. Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

```bash
npm install leaflet react-leaflet@4.2.1 @types/leaflet --legacy-peer-deps
```

## 🧪 Testing Instructions

### Step 1: Create Test Users

1. Go to your Supabase Auth dashboard
2. Create users with emails like:
   - `lecturer@test.com`
   - `student@test.com`
   - `admin@test.com`

3. Run this SQL to assign roles:

```sql
-- Insert test users with roles
INSERT INTO users (id, email, full_name, role, department)
SELECT 
  id, 
  email, 
  CASE 
    WHEN email = 'lecturer@test.com' THEN 'Test Lecturer'
    WHEN email = 'student@test.com' THEN 'Test Student'
    WHEN email = 'admin@test.com' THEN 'Test Admin'
  END,
  CASE 
    WHEN email = 'lecturer@test.com' THEN 'lecturer'
    WHEN email = 'student@test.com' THEN 'student'
    WHEN email = 'admin@test.com' THEN 'admin'
  END,
  'Computer Science'
FROM auth.users 
WHERE email IN ('lecturer@test.com', 'student@test.com', 'admin@test.com');
```

### Step 2: Test Lecturer Flow

1. **Login as lecturer@test.com**
2. **Navigate to `/preview`** - This is your testing playground
3. **Switch to Lecturer View**
4. **Test Location Management:**
   - Click "Use Current Location" or click on the map
   - Enter location name: "Test Classroom A"
   - Set radius: 50m
   - Click "Save Location"
5. **Test Session Management:**
   - Select the saved location
   - Enter course code: "CS101"
   - Click "Start Session"
   - Verify session appears in "Active Sessions"

### Step 3: Test Student Flow

1. **Login as student@test.com** (in a different browser/incognito)
2. **Navigate to `/preview`**
3. **Switch to Student View**
4. **Test Check-In:**
   - View available sessions
   - Click "Check In" on the CS101 session
   - Allow location access when prompted
   - Verify successful check-in message
   - Check attendance history

### Step 4: Test Security

1. **Try accessing lecturer routes as student:**
   - Go to `/location-management` as student
   - Should redirect to dashboard
2. **Try accessing student routes as lecturer:**
   - Go to `/check-in` as lecturer
   - Should redirect to dashboard

## 🎯 Key Features Tested

### ✅ Lecturer Features
- [x] GPS location capture
- [x] Interactive map with radius preview
- [x] Location naming and saving
- [x] Session creation with 15-minute expiry
- [x] Active session monitoring
- [x] Session termination

### ✅ Student Features
- [x] View active sessions
- [x] GPS-based check-in
- [x] Distance validation
- [x] Session time validation
- [x] Duplicate check-in prevention
- [x] Attendance history

### ✅ Security Features
- [x] Row-Level Security (RLS) policies
- [x] Role-based route protection
- [x] Server-side validation via Edge Function
- [x] Location proximity validation
- [x] Session expiry validation

## 🔧 Troubleshooting

### Map Not Loading
- Check if Leaflet CSS is imported
- Verify internet connection for map tiles
- Check browser console for errors

### Location Access Denied
- Ensure HTTPS in production
- Check browser location permissions
- Test on mobile device for better GPS

### Check-In Fails
- Verify Edge Function is deployed
- Check Supabase logs for errors
- Ensure user is within radius
- Verify session hasn't expired

### RLS Policy Errors
- Check user role assignment
- Verify policies are enabled
- Check Supabase logs

## 📱 Mobile Testing

For best results, test on mobile devices:
1. Open browser on phone
2. Navigate to your app
3. Test location features with real GPS
4. Verify map interactions work on touch

## 🚀 Production Deployment

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy validate-checkin --project-ref your-project-ref
   ```

2. **Update Environment Variables:**
   - Set production Supabase URL and keys
   - Ensure HTTPS is enabled

3. **Test Production Flow:**
   - Create production users
   - Test complete lecturer → student flow
   - Verify all security measures

## 📊 Monitoring

Monitor these metrics:
- Check-in success rate
- Location accuracy
- Session completion rate
- Edge Function response times

## 🎉 Success Criteria

The system is working correctly when:
- ✅ Lecturers can create locations and sessions
- ✅ Students can check in using GPS
- ✅ Location validation works accurately
- ✅ Role-based access is enforced
- ✅ Sessions expire after 15 minutes
- ✅ All security measures are active

---

**Need Help?** Check the browser console and Supabase logs for detailed error messages.
