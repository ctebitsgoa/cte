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

  // Get all pages for the course
  const { data: pages, error } = await supabase
    .from('course_pages')
    .select('*')
    .eq('course_id', courseId)
    .order('index', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(pages || [])
}
