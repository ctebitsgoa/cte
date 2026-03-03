import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function isAdmin(supabase: any, userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'admin'
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      *,
      course_instructors (
        users (
          id,
          name,
          email
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform the data
  const transformedCourses = courses?.map((course: any) => ({
    ...course,
    instructors: course.course_instructors?.map((ci: any) => ci.users) || [],
    course_instructors: undefined,
  }))

  return NextResponse.json(transformedCourses || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { name, subtitle, description, handout, cover_image, instructor_ids } = body

  // Create course
  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      name,
      subtitle,
      description,
      handout,
      cover_image,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add instructors
  if (instructor_ids && instructor_ids.length > 0) {
    const instructorRecords = instructor_ids.map((id: string) => ({
      course_id: course.id,
      user_id: id,
    }))

    await supabase.from('course_instructors').insert(instructorRecords)
  }

  return NextResponse.json(course)
}
