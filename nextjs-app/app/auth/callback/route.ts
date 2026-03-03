import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user profile is complete
      const { data: dbUser } = await supabase
        .from('users')
        .select('phone, bits_id')
        .eq('id', data.user.id)
        .single()

      // If user doesn't have phone or bits_id, redirect to complete profile
      if (!dbUser || !dbUser.phone || !dbUser.bits_id) {
        return NextResponse.redirect(new URL('/complete-profile', request.url))
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}
