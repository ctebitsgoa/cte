import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { redirectTo, hd } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

    // Generate PKCE code_verifier and code_challenge
    // This ensures Supabase returns a ?code= instead of #access_token= (implicit flow)
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')

    // Store code_verifier in the cookie that Supabase SSR client expects
    // so exchangeCodeForSession() in the callback can find it
    const ref = new URL(supabaseUrl).hostname.split('.')[0]
    const cookieName = `sb-${ref}-auth-token-code-verifier`

    const cookieStore = await cookies()
    cookieStore.set(cookieName, codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 300, // 5 minutes
      sameSite: 'lax',
    })

    // Build the Supabase OAuth authorize URL with PKCE params
    const params = new URLSearchParams({
      provider: 'google',
      redirect_to: redirectTo || '',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`

    // Fetch it server-side to get the redirect Location (Google's OAuth URL)
    const res = await fetch(authorizeUrl, {
      redirect: 'manual',
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
