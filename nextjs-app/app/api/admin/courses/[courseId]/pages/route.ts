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
  const { type, name, parent_id, index, doc, description } = body

  const pageData: any = {
    name,
    type,
    course_id: courseId,
    parent_id: parent_id || null,
    index: index ?? -1,
  }

  if (type === 'Article') {
    pageData.doc = doc || ''
  } else if (type === 'Quiz') {
    pageData.description = description || ''
  }

  const { data: page, error } = await supabase
    .from('course_pages')
    .insert(pageData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(page)
}

export async function PUT(
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

  // Reorder pages
  if (Array.isArray(body)) {
    for (const item of body) {
      await supabase
        .from('course_pages')
        .update({ index: item.index })
        .eq('id', item._id || item.id)
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
