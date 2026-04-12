import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key for cron job (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (optional but recommended)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development, allow without secret
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert random UUIDs to keep Supabase active
    const { data, error } = await supabase
      .from('keepalive')
      .insert({
        uuid_a: crypto.randomUUID(),
        uuid_b: crypto.randomUUID()
      })
      .select()
      .single()

    if (error) {
      console.error('Keepalive error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Keepalive ping successful',
      timestamp: new Date().toISOString(),
      id: data.id
    })
  } catch (err: any) {
    console.error('Keepalive exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
