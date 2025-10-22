# Intelligent Student Enrollment & Invitation System

A comprehensive, production-ready student enrollment and invitation system built for Next.js + Supabase academic platforms. This system automates and simplifies how lecturers add students to their courses while maintaining security and auditability.

## 🚀 Features

### 📁 File Upload & Data Extraction
- **Multi-format Support**: Upload CSV, Excel (.xlsx/.xls), and PDF files
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **Intelligent Parsing**: Automatic extraction of student data using regex patterns
- **Data Validation**: Real-time validation of email addresses and required fields
- **Progress Tracking**: Visual progress indicators during file processing

### ✏️ Review & Manual Management
- **Editable Preview Table**: Review and edit extracted data before processing
- **Inline Editing**: Click to edit any field directly in the table
- **Manual Addition**: Add individual students manually with form validation
- **Bulk Operations**: Select all valid students or specific individuals
- **Data Export**: Export processed data to CSV for record keeping

### 📧 Intelligent Invitation System
- **Smart Enrollment Logic**: 
  - Existing users are automatically enrolled
  - New users receive email invitations with secure tokens
- **Professional Email Templates**: Beautiful, responsive HTML email invitations
- **Auto-enrollment Triggers**: PostgreSQL triggers automatically enroll users when they sign up
- **Invitation Management**: Track invitation status, expiration, and acceptance

### 🔄 Student Group Reuse
- **Previous Course Integration**: Copy students from previous courses
- **Group Management**: Create and manage student groups for easy reuse
- **Selective Copying**: Choose specific students or copy entire groups
- **Bulk Operations**: Efficiently manage large student lists

### 🔒 Security & Compliance
- **Row Level Security (RLS)**: Comprehensive RLS policies for data protection
- **Audit Trail**: Complete logging of all enrollment activities
- **Token-based Invitations**: Secure invitation links with expiration
- **Role-based Access**: Lecturers can only manage their own courses

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Resend account (for email functionality)
- Next.js 15+ project with App Router

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install papaparse xlsx pdf-parse resend @types/papaparse
```

### 2. Database Setup

Run the SQL migration script to create all necessary tables, triggers, and policies:

```sql
-- Execute the contents of scripts/student-enrollment-schema.sql
-- This will create:
-- - courses table
-- - course_enrollments table  
-- - invitations table
-- - student_groups table
-- - group_members table
-- - All necessary triggers and RLS policies
```

### 3. Environment Configuration

Copy `env.example` to `.env.local` and configure:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Email Configuration (for student invitations)
RESEND_API_KEY=your-resend-api-key-here
FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Email Service Setup

1. Sign up for [Resend](https://resend.com)
2. Verify your domain
3. Get your API key
4. Update `FROM_EMAIL` with your verified domain

## 🎯 Usage

### Basic Implementation

```tsx
import { IntelligentEnrollment } from "@/components/intelligent-enrollment"

export default function CourseEnrollmentPage() {
  return (
    <IntelligentEnrollment
      courseId="your-course-id"
      courseName="Introduction to Computer Science"
      courseCode="CS101"
    />
  )
}
```

### File Upload Component

```tsx
import { FileUpload, StudentData } from "@/components/file-upload"

function MyComponent() {
  const handleDataExtracted = (students: StudentData[]) => {
    console.log(`Extracted ${students.length} students`)
  }

  return (
    <FileUpload
      onDataExtracted={handleDataExtracted}
      onUploadProgress={(progress) => console.log(`${progress}% complete`)}
      maxFileSize={10} // MB
      acceptedFormats={[".csv", ".xlsx", ".xls", ".pdf"]}
    />
  )
}
```

### Student Preview Table

```tsx
import { StudentPreviewTable } from "@/components/student-preview-table"

function MyComponent() {
  const handleInviteStudents = async (students: StudentData[]) => {
    // Send invitations to selected students
    const response = await fetch("/api/invite-students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: "course-id", students })
    })
    
    const result = await response.json()
    console.log("Invitation results:", result)
  }

  return (
    <StudentPreviewTable
      students={studentData}
      onStudentsChange={setStudentData}
      onInviteStudents={handleInviteStudents}
    />
  )
}
```

## 📊 Database Schema

### Core Tables

#### `courses`
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecturer_id UUID NOT NULL REFERENCES auth.users(id),
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `course_enrollments`
```sql
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    approved BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enrolled_by UUID REFERENCES auth.users(id),
    notes TEXT
);
```

#### `invitations`
```sql
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    matric_number VARCHAR(50),
    department VARCHAR(100),
    course_id UUID NOT NULL REFERENCES courses(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);
```

### Auto-enrollment Trigger

The system includes a PostgreSQL trigger that automatically enrolls students when they sign up using an invitation:

```sql
CREATE OR REPLACE FUNCTION auto_enroll_invited_students()
RETURNS TRIGGER AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    FOR invitation_record IN 
        SELECT * FROM invitations 
        WHERE email = NEW.email 
        AND accepted = false 
        AND expires_at > NOW()
    LOOP
        INSERT INTO course_enrollments (course_id, student_id, enrolled_by)
        VALUES (invitation_record.course_id, NEW.id, invitation_record.created_by)
        ON CONFLICT (course_id, student_id) DO NOTHING;
        
        UPDATE invitations 
        SET accepted = true, accepted_at = NOW()
        WHERE id = invitation_record.id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🔧 API Endpoints

### POST `/api/invite-students`

Send invitations to students for a course.

**Request Body:**
```json
{
  "courseId": "uuid",
  "students": [
    {
      "email": "student@university.edu",
      "name": "John Doe",
      "matricNumber": "CS123456",
      "department": "Computer Science"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "email": "student@university.edu",
      "status": "enrolled|invited|error",
      "message": "Status message",
      "userId": "uuid" // if enrolled
    }
  ],
  "summary": {
    "total": 10,
    "enrolled": 5,
    "invited": 4,
    "errors": 1
  }
}
```

### GET `/api/invite-students?token=invitation-token`

Get invitation details for acceptance page.

**Response:**
```json
{
  "invitation": {
    "email": "student@university.edu",
    "name": "John Doe",
    "matricNumber": "CS123456",
    "department": "Computer Science",
    "courseName": "Introduction to Computer Science",
    "courseCode": "CS101",
    "lecturerName": "Dr. Smith",
    "lecturerEmail": "lecturer@university.edu",
    "expiresAt": "2024-02-01T00:00:00Z"
  }
}
```

## 🎨 Customization

### Email Templates

The system uses professional HTML email templates. Customize the template in `/app/api/invite-students/route.ts`:

```typescript
const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      /* Your custom styles */
    </style>
  </head>
  <body>
    <!-- Your custom template -->
  </body>
  </html>
`
```

### File Parsing

Extend the file parsing logic to support additional formats or data fields:

```typescript
// In components/file-upload.tsx
const extractCustomField = (text: string): string => {
  // Your custom extraction logic
  return extractedValue
}
```

### Validation Rules

Customize validation rules in the preview table component:

```typescript
// In components/student-preview-table.tsx
const validateStudent = (student: StudentData): string[] => {
  const errors: string[] = []
  
  // Add your custom validation rules
  if (!student.customField) {
    errors.push("Custom field is required")
  }
  
  return errors
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Email not sending**
   - Check Resend API key configuration
   - Verify domain is properly set up in Resend
   - Check `FROM_EMAIL` matches verified domain

2. **File parsing errors**
   - Ensure file format is supported (CSV, XLSX, PDF)
   - Check file size limits (default 10MB)
   - Verify file structure matches expected format

3. **Database errors**
   - Ensure all migrations have been run
   - Check RLS policies are properly configured
   - Verify user permissions

4. **Auto-enrollment not working**
   - Check PostgreSQL trigger is installed
   - Verify invitation tokens are valid
   - Check invitation expiration dates

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will provide detailed console logs for troubleshooting.

## 📈 Performance Optimization

### File Processing
- Large files are processed in chunks to prevent memory issues
- Progress indicators provide user feedback during processing
- Background processing prevents UI blocking

### Database Optimization
- Indexes on frequently queried columns
- Efficient RLS policies for security
- Batch operations for bulk enrollment

### Email Delivery
- Asynchronous email sending
- Retry logic for failed deliveries
- Rate limiting to prevent spam

## 🔐 Security Considerations

### Data Protection
- All sensitive data is encrypted in transit and at rest
- RLS policies ensure data isolation between users
- Audit trails for all enrollment activities

### Invitation Security
- Unique tokens for each invitation
- 30-day expiration on invitations
- Secure token generation using UUID

### Access Control
- Lecturers can only manage their own courses
- Students can only view their own enrollments
- Admin roles for system management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for academic institutions**
