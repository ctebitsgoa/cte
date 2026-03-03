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
    return NextResponse.json({ registered: false, deregistration_enabled: false })
  }

  // Check if registered
  const { data: registration } = await supabase
    .from('user_courses')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  // Check if deregistration is enabled for this course
  const { data: course } = await supabase
    .from('courses')
    .select('deregistration_enabled')
    .eq('id', courseId)
    .single()

  return NextResponse.json({
    registered: !!registration,
    deregistration_enabled: course?.deregistration_enabled || false,
  })
}
