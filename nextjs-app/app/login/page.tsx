'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            hd: process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'bits-pilani.ac.in',
          },
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message)
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
        
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="primary icon-button"
          style={{ margin: '0 auto', padding: '12px 28px' }}
        >
          <span className="icon-right">{loading ? 'Signing in...' : 'Sign in with Google'}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" />
          </svg>
        </button>
      </div>
      
      <p style={{ marginTop: '24px', color: 'var(--gray-500)', fontSize: '0.85em' }}>
        Allowed email domains:
      </p>
      <ul style={{ textAlign: 'left', display: 'inline-block', margin: '8px 0', fontSize: '0.85em', color: 'var(--gray-500)' }}>
        <li>@goa.bits-pilani.ac.in</li>
        <li>@pilani.bits-pilani.ac.in</li>
        <li>@hyderabad.bits-pilani.ac.in</li>
        <li>@alumni.bits-pilani.ac.in</li>
      </ul>
    </div>
  )
}
