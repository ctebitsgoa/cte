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

  // Check if course exists and registration is open
  const { data: course } = await supabase
    .from('courses')
    .select('id, registration_open')
    .eq('id', courseId)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  if (course.registration_open === false) {
    return NextResponse.json({ error: 'Registration is closed for this course' }, { status: 403 })
  }

  // Use admin client to bypass RLS for the write operation
  const adminSupabase = createAdminClient()

  // Check if already registered
  const { data: existing } = await adminSupabase
    .from('user_courses')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    return NextResponse.json({ success: true, message: 'Already registered' })
  }

  // Register user for course
  const { error } = await adminSupabase
    .from('user_courses')
    .insert({ user_id: user.id, course_id: courseId })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
