import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key for cron job (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  // No auth check needed - this route only inserts harmless keepalive data
  // The route is excluded from middleware auth checks

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Keepalive exception:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
}
