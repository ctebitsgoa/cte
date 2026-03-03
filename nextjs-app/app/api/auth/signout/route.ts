import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Server sign out error:', error)
      // Still return success - we'll clear the session client-side too
    }
    
    // Create response that clears any auth cookies
    const response = NextResponse.json({ success: true })
    
    // Clear Supabase auth cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
    return response
  } catch (error) {
    console.error('Sign out exception:', error)
    return NextResponse.json({ success: true }) // Still return success
  }
}
