import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { redirectTo, hd } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    // Build the Supabase OAuth authorize URL directly
    // This is what the Supabase client SDK does internally
    const params = new URLSearchParams({
      provider: 'google',
      redirect_to: redirectTo || '',
    })

    if (hd) {
      // Pass Google's hd param to restrict to a specific domain
      // Supabase forwards query params to Google
    }

    // Call Supabase's authorize endpoint server-side to get the Google redirect URL
    const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`

    // Fetch it server-side to get the redirect location (Google's OAuth URL)
    const res = await fetch(authorizeUrl, {
      redirect: 'manual', // Don't follow the redirect, just get the Location header
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    })

    const location = res.headers.get('location')

    if (!location) {
      return NextResponse.json(
        { error: 'Failed to get OAuth URL from Supabase' },
        { status: 500 }
      )
    }

    // Append hd parameter to the Google OAuth URL to restrict domain
    const googleUrl = new URL(location)
    if (hd) {
      googleUrl.searchParams.set('hd', hd)
    }

    return NextResponse.json({ url: googleUrl.toString() })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
