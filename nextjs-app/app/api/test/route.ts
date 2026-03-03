import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  try {
    // Test 1: Supabase connection
    const supabase = await createClient()
    results.tests = { ...results.tests as object, supabaseClient: 'OK' }

    // Test 2: Get auth user
    const { data: authData, error: authError } = await supabase.auth.getUser()
    results.tests = { 
      ...results.tests as object, 
      authUser: authError ? `ERROR: ${authError.message}` : (authData.user ? {
        id: authData.user.id,
        email: authData.user.email,
        provider: authData.user.app_metadata?.provider
      } : 'No user logged in')
    }

    // Test 3: Check if user exists in public.users table
    if (authData.user) {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      results.tests = {
        ...results.tests as object,
        dbUser: dbError ? `ERROR: ${dbError.message} (Code: ${dbError.code})` : dbUser
      }

      // Test 4: Try to insert user if not exists
      if (dbError && dbError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
            role: 'student'
          })

        results.tests = {
          ...results.tests as object,
          insertAttempt: insertError ? `ERROR: ${insertError.message} (Code: ${insertError.code})` : 'SUCCESS - User created'
        }

        // Try to read again after insert
        if (!insertError) {
          const { data: newUser, error: newError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          results.tests = {
            ...results.tests as object,
            dbUserAfterInsert: newError ? `ERROR: ${newError.message}` : newUser
          }
        }
      }
    }

    // Test 5: Check RLS policies by listing all users (should only see own)
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5)

    results.tests = {
      ...results.tests as object,
      visibleUsers: allUsersError ? `ERROR: ${allUsersError.message}` : allUsers
    }

    // Test 6: Check courses table (should be public)
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, name')
      .limit(3)

    results.tests = {
      ...results.tests as object,
      courses: coursesError ? `ERROR: ${coursesError.message}` : courses
    }

  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return NextResponse.json(results, { status: 200 })
}
