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

export async function POST(
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

  const body = await request.json()
  const { type, question, answer, points, group_name, options, correct_option, numeric_answer, tolerance } = body

  const questionData: any = {
    type,
    question,
    answer,
    course_id: courseId,
    points: points || 1,
    group_name: group_name || 'default',
  }

  if (type === 'MCQ') {
    questionData.options = options
    questionData.correct_option = correct_option
  } else if (type === 'Numeric') {
    questionData.numeric_answer = numeric_answer
    questionData.tolerance = tolerance
  }

  const { data: newQuestion, error } = await supabase
    .from('questions')
    .insert(questionData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(newQuestion)
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

  // Get all question groups
  const { data: questions, error } = await supabase
    .from('questions')
    .select('group_name')
    .eq('course_id', courseId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const groups = [...new Set(questions?.map((q: any) => q.group_name))]

  return NextResponse.json(groups)
}
