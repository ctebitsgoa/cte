'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gsiReady, setGsiReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const buttonRef = useRef<HTMLDivElement>(null)

  const handleCredentialResponse = useCallback(async (response: any) => {
    setLoading(true)
    setError('')

    try {
      // Decode JWT payload to check email domain
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      const email: string = payload.email || ''
      const domain = email.split('@')[1] || ''

      const allowedDomains = [
        'goa.bits-pilani.ac.in',
        'pilani.bits-pilani.ac.in',
        'hyderabad.bits-pilani.ac.in',
        'alumni.bits-pilani.ac.in',
      ]

      if (!allowedDomains.includes(domain)) {
        setError(`Email domain @${domain} is not allowed. Please use your BITS Pilani email.`)
        setLoading(false)
        return
      }

      // Sign in to Supabase using the Google ID token (goes through proxy)
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })

      if (signInError) throw signInError

      // Check if profile is complete
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('phone, bits_id')
          .eq('id', user.id)
          .single()

        if (!dbUser || !dbUser.phone || !dbUser.bits_id) {
          router.push('/complete-profile')
          return
        }
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.')
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => setGsiReady(true)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (!gsiReady || !window.google || !buttonRef.current) return

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleCredentialResponse,
    })

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 300,
    })
  }, [gsiReady, handleCredentialResponse])

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
        
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Signing in...</p>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div ref={buttonRef}></div>
          </div>
        )}
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
