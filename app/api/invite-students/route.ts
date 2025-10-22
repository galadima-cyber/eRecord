import { NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { StudentData } from "@/components/file-upload"

const resend = new Resend(process.env.RESEND_API_KEY)

interface InviteRequest {
  courseId: string
  students: StudentData[]
}

interface InviteResult {
  email: string
  status: "enrolled" | "invited" | "error"
  message: string
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: InviteRequest = await request.json()
    const { courseId, students } = body

    if (!courseId || !students || students.length === 0) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Verify the user owns the course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, course_name, course_code, lecturer_id")
      .eq("id", courseId)
      .eq("lecturer_id", user.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 })
    }

    const results: InviteResult[] = []
    let enrolledCount = 0
    let invitedCount = 0
    let errorCount = 0

    // Process each student
    for (const student of students) {
      try {
        // Check if user already exists
        const { data: existingUser, error: userError } = await supabase
          .from("users")
          .select("id, email, full_name, matric_number, department")
          .eq("email", student.email)
          .single()

        if (existingUser) {
          // User exists - enroll them directly
          const { error: enrollError } = await supabase
            .from("course_enrollments")
            .insert({
              course_id: courseId,
              student_id: existingUser.id,
              enrolled_by: user.id,
              approved: true
            })

          if (enrollError && !enrollError.message.includes("duplicate")) {
            results.push({
              email: student.email,
              status: "error",
              message: `Failed to enroll: ${enrollError.message}`
            })
            errorCount++
          } else {
            // Update user profile if we have additional information
            const updateData: any = {}
            if (student.name && !existingUser.full_name) updateData.full_name = student.name
            if (student.matricNumber && !existingUser.matric_number) updateData.matric_number = student.matricNumber
            if (student.department && !existingUser.department) updateData.department = student.department

            if (Object.keys(updateData).length > 0) {
              await supabase
                .from("users")
                .update(updateData)
                .eq("id", existingUser.id)
            }

            results.push({
              email: student.email,
              status: "enrolled",
              message: "Student enrolled successfully",
              userId: existingUser.id
            })
            enrolledCount++
          }
        } else {
          // User doesn't exist - create invitation
          const { data: invitation, error: inviteError } = await supabase
            .from("invitations")
            .insert({
              email: student.email,
              name: student.name,
              matric_number: student.matricNumber,
              department: student.department,
              course_id: courseId,
              created_by: user.id
            })
            .select()
            .single()

          if (inviteError) {
            results.push({
              email: student.email,
              status: "error",
              message: `Failed to create invitation: ${inviteError.message}`
            })
            errorCount++
          } else {
            // Send invitation email
            try {
              await sendInvitationEmail({
                to: student.email,
                courseName: course.course_name,
                courseCode: course.course_code,
                invitationToken: invitation.token,
                studentName: student.name
              })

              results.push({
                email: student.email,
                status: "invited",
                message: "Invitation sent successfully"
              })
              invitedCount++
            } catch (emailError) {
              // Still count as invited even if email fails
              results.push({
                email: student.email,
                status: "invited",
                message: "Invitation created but email failed to send"
              })
              invitedCount++
            }
          }
        }
      } catch (error) {
        results.push({
          email: student.email,
          status: "error",
          message: `Processing error: ${error instanceof Error ? error.message : "Unknown error"}`
        })
        errorCount++
      }
    }

    // Log the invitation activity
    await supabase
      .from("invitation_logs")
      .insert({
        course_id: courseId,
        lecturer_id: user.id,
        total_students: students.length,
        enrolled_count: enrolledCount,
        invited_count: invitedCount,
        error_count: errorCount,
        created_at: new Date().toISOString()
      })
      .catch(() => {
        // Ignore logging errors
      })

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: students.length,
        enrolled: enrolledCount,
        invited: invitedCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error("Invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function sendInvitationEmail({
  to,
  courseName,
  courseCode,
  invitationToken,
  studentName
}: {
  to: string
  courseName: string
  courseCode: string
  invitationToken: string
  studentName?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email")
    return
  }

  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitationToken}`
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Invitation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .course-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .highlight { color: #667eea; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Course Invitation</h1>
          <p>You've been invited to join a course!</p>
        </div>
        <div class="content">
          ${studentName ? `<p>Hello <strong>${studentName}</strong>,</p>` : '<p>Hello,</p>'}
          
          <p>You have been invited to join the following course:</p>
          
          <div class="course-info">
            <h3>${courseCode} - ${courseName}</h3>
            <p>This invitation will allow you to:</p>
            <ul>
              <li>Access course materials and resources</li>
              <li>Participate in attendance sessions</li>
              <li>View your attendance records</li>
              <li>Receive course notifications</li>
            </ul>
          </div>
          
          <p>To accept this invitation and create your account, click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">Accept Invitation & Join Course</a>
          </div>
          
          <p><strong>Important:</strong> This invitation will expire in 30 days. If you don't have an account yet, one will be created for you when you accept the invitation.</p>
          
          <p>If you have any questions, please contact your lecturer or course administrator.</p>
          
          <div class="footer">
            <p>This invitation was sent from the Academic eRecord Platform</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const emailText = `
Course Invitation

${studentName ? `Hello ${studentName},` : 'Hello,'}

You have been invited to join the following course:
${courseCode} - ${courseName}

To accept this invitation and create your account, visit:
${invitationUrl}

This invitation will expire in 30 days.

If you have any questions, please contact your lecturer or course administrator.

This invitation was sent from the Academic eRecord Platform
  `

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || "noreply@yourdomain.com",
      to: [to],
      subject: `Course Invitation: ${courseCode} - ${courseName}`,
      html: emailHtml,
      text: emailText
    })
  } catch (error) {
    console.error("Failed to send invitation email:", error)
    throw error
  }
}

// GET endpoint to check invitation status
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const { data: invitation, error } = await supabase
      .from("invitations")
      .select(`
        *,
        courses (
          course_name,
          course_code,
          lecturer_id,
          users!courses_lecturer_id_fkey (
            full_name,
            email
          )
        )
      `)
      .eq("token", token)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
    }

    if (invitation.accepted) {
      return NextResponse.json({ 
        error: "Invitation already accepted",
        accepted: true 
      }, { status: 400 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: "Invitation has expired",
        expired: true 
      }, { status: 400 })
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        name: invitation.name,
        matricNumber: invitation.matric_number,
        department: invitation.department,
        courseName: invitation.courses.course_name,
        courseCode: invitation.courses.course_code,
        lecturerName: invitation.courses.users.full_name,
        lecturerEmail: invitation.courses.users.email,
        expiresAt: invitation.expires_at
      }
    })

  } catch (error) {
    console.error("Get invitation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
