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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient()
  const { courseId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get all students registered for the course
  const { data: students, error } = await supabase
    .from('user_courses')
    .select(`
      registered_at,
      users (
        id,
        name,
        email,
        bits_id,
        phone
      )
    `)
    .eq('course_id', courseId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const transformedStudents = students?.map((s: any) => ({
    ...s.users,
    registered_at: s.registered_at,
  }))

  return NextResponse.json(transformedStudents || [])
}
