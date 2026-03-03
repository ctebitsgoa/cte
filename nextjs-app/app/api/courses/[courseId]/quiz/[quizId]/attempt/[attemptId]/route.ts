import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string; quizId: string; attemptId: string }> }
) {
  const supabase = await createClient()
  const { courseId, quizId, attemptId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { answers, score, correct_count, unanswered_count } = body

  // Verify the attempt belongs to the user
  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single()

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  // Update the attempt
  const { data: updatedAttempt, error } = await supabase
    .from('quiz_attempts')
    .update({
      answers,
      score,
      correct_count,
      unanswered_count,
      ended_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(updatedAttempt)
}
