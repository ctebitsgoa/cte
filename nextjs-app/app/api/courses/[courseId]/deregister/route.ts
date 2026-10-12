import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient()
  const { courseId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if deregistration is enabled for this course
  const { data: course } = await supabase
    .from('courses')
    .select('deregistration_enabled, deregistration_otp')
    .eq('id', courseId)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  if (!course.deregistration_enabled) {
    return NextResponse.json({ error: 'Deregistration is not currently open for this course' }, { status: 403 })
  }

  if (!course.deregistration_otp) {
    return NextResponse.json({ error: 'Deregistration OTP has not been set by the admin' }, { status: 403 })
  }

  // Verify OTP
  const body = await request.json()
  const { otp } = body

  if (!otp || otp.trim() !== course.deregistration_otp) {
    return NextResponse.json({ error: 'Invalid OTP. Please check with your coordinator.' }, { status: 400 })
  }

  // Use admin client to bypass RLS for the delete operation
  const adminSupabase = createAdminClient()

  // Check if user is actually registered
  const { data: registration } = await adminSupabase
    .from('user_courses')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!registration) {
    return NextResponse.json({ error: 'You are not registered for this course' }, { status: 400 })
  }

  // Deregister the student
  const { error } = await adminSupabase
    .from('user_courses')
    .delete()
    .eq('user_id', user.id)
    .eq('course_id', courseId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
