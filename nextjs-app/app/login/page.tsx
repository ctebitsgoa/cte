'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const origin = window.location.origin
      const redirectTo = searchParams.get('redirect_to') || '/dashboard'

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            hd: 'goa.bits-pilani.ac.in',
          },
        },
      })

      if (signInError) throw signInError
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '20px',
        padding: '48px 36px',
        border: '1px solid #e7e5e4',
        boxShadow: '0 4px 20px rgba(22,163,74,0.08)',
      }}>
        <h1>Welcome</h1>
        <p>
          Sign in with your BITS Pilani Google account to access the learning platform.
          Use your official BITS email to log in.
        </p>
        
        {error && (
          <p style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            padding: '10px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9em',
          }}>
            {error}
          </p>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 32px',
              borderRadius: '999px',
              border: '1px solid #dadce0',
              backgroundColor: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#3c4043',
              opacity: loading ? 0.6 : 1,
              transition: 'box-shadow 0.2s',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)')}
            onMouseOut={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
      
      <p style={{ marginTop: '24px', color: 'var(--gray-500)', fontSize: '0.85em' }}>
        Only @goa.bits-pilani.ac.in emails are allowed.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="login-container">
        <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '48px 36px', border: '1px solid #e7e5e4' }}>
          <h1>Welcome</h1>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
