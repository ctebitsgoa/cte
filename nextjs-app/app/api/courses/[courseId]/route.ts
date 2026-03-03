import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
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

  // Check if user is registered for this course
  const { data: registration } = await supabase
    .from('user_courses')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!registration) {
    return NextResponse.json({ error: 'Not registered for this course' }, { status: 403 })
  }

  // Get course with instructors
  const { data: course, error } = await supabase.rpc(
    'get_course_with_instructors',
    {
      p_course_id: courseId,
    }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(course?.[0] || null)
}
