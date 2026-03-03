import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({ user: null, authenticated: false })
    }
    
    // Get user from database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', authUser.id)
      .single()
    
    if (dbError || !dbUser) {
      // User authenticated but not in DB - try to create them
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          role: 'student'
        })
        .select('id, email, name, role')
        .single()
      
      if (insertError) {
        console.error('Failed to create user:', insertError)
        return NextResponse.json({ 
          user: { id: authUser.id, email: authUser.email, role: 'student' }, 
          authenticated: true 
        })
      }
      
      return NextResponse.json({ user: newUser, authenticated: true })
    }
    
    return NextResponse.json({ user: dbUser, authenticated: true })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json({ user: null, authenticated: false, error: 'Server error' })
  }
}
