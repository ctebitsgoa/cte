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
  { params }: { params: Promise<{ courseId: string; quizId: string }> }
) {
  const supabase = await createClient()
  const { courseId, quizId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get all attempts for this quiz with user information
  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      users (
        id,
        name,
        email
      )
    `)
    .eq('quiz_id', quizId)
    .order('started_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(attempts || [])
}
