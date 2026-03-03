import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { redirectTo, hd } = await request.json()
    const supabase = await createClient()

    // Generate the OAuth URL server-side (Vercel can reach Supabase directly)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { hd: hd || 'goa.bits-pilani.ac.in' },
        skipBrowserRedirect: true, // Don't redirect, just return the URL
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ url: data.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
