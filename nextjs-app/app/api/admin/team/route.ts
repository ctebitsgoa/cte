import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null
  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!dbUser || dbUser.role !== 'admin') return null
  return user
}

// GET — fetch all members + team photo
export async function GET() {
  try {
    const supabase = await createClient()
    const [membersRes, settingsRes] = await Promise.all([
      supabase.from('team_members').select('*').order('display_order').order('created_at'),
      supabase.from('team_settings').select('value').eq('key', 'team_photo_url').single()
    ])
    return NextResponse.json({
      members: membersRes.data || [],
      teamPhotoUrl: settingsRes.data?.value || ''
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — add member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!(await verifyAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, designation, photo_url, email, instagram, linkedin } = await request.json()
    if (!name || !designation) return NextResponse.json({ error: 'Name and designation required' }, { status: 400 })

    // Auto-assign next display_order
    const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true })
    const { data, error } = await supabase.from('team_members')
      .insert({ name, designation, photo_url: photo_url || null, email: email || null, instagram: instagram || null, linkedin: linkedin || null, display_order: (count || 0) })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT — update team photo
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!(await verifyAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { teamPhotoUrl } = await request.json()
    const { error } = await supabase.from('team_settings')
      .upsert({ key: 'team_photo_url', value: teamPhotoUrl ?? '', updated_at: new Date().toISOString() })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove member
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!(await verifyAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
