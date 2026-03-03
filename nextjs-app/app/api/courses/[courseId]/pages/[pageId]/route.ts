import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string; pageId: string }> }
) {
  const supabase = await createClient()
  const { courseId, pageId } = await params

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

  // Get the page
  const { data: page, error } = await supabase
    .from('course_pages')
    .select('*')
    .eq('id', pageId)
    .eq('course_id', courseId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If it's a quiz, get the questions
  if (page && page.type === 'Quiz') {
    const { data: quizQuestions } = await supabase
      .from('quiz_questions')
      .select('question_id, questions(*)')
      .eq('quiz_id', pageId)
      .order('order_index', { ascending: true })

    if (quizQuestions) {
      (page as any).questions = quizQuestions.map((qq: any) => qq.questions)
    }
  }

  return NextResponse.json(page)
}
