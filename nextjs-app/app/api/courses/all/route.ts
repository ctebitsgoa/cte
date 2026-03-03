import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      *,
      course_instructors (
        user_id,
        users (
          id,
          name,
          email
        )
      )
    `)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform the data to match the expected format
  const transformedCourses = courses?.map((course: any) => ({
    ...course,
    instructors: course.course_instructors?.map((ci: any) => ci.users) || [],
    course_instructors: undefined,
  }))

  return NextResponse.json(transformedCourses || [])
}
