'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'

export default function CompleteProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    bits_id: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // Get user details from database
      let { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // If user row doesn't exist yet (trigger may not have fired), create it
      if (!dbUser) {
        const { data: newUser } = await supabase
          .from('users')
          .upsert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || '',
            role: 'student'
          }, { onConflict: 'id' })
          .select()
          .single()
        dbUser = newUser
      }

      if (dbUser) {
        // If profile is already complete, redirect to dashboard
        if (dbUser.phone && dbUser.bits_id) {
          router.push('/dashboard')
          return
        }

        setUser(dbUser)
        setFormData({
          name: dbUser.name || authUser.user_metadata?.full_name || '',
          bits_id: dbUser.bits_id || '',
          phone: dbUser.phone || ''
        })
      } else {
        // Fallback: use auth user directly so form can still submit
        setUser({ id: authUser.id, email: authUser.email })
        setFormData({
          name: authUser.user_metadata?.full_name || '',
          bits_id: '',
          phone: ''
        })
      }

      setLoading(false)
    }

    checkUser()
  }, [router, supabase])

  const validateBitsId = (bitsId: string): boolean => {
    // BITS ID format: 2018A8PS0414G
    // AD, AJ (Environmental), MM and RM are newer branch codes, e.g. 2025AJPS0123G
    const pattern = /^\d{4}(PH|AD|AJ|MM|RM|[ABH](A|B|[0-9]))(PS|TS|PX|AD|AJ|MM|RM|([ABH]|[0-9])(A|B|[0-9]))\d{4}[GHP]$/i
    return pattern.test(bitsId.toUpperCase())
  }

  const validatePhone = (phone: string): boolean => {
    // 10 digit phone number
    return /^\d{10}$/.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!formData.bits_id.trim()) {
      setError('Please enter your BITS ID')
      return
    }

    if (!validateBitsId(formData.bits_id)) {
      setError('Invalid BITS ID format. Example: 2023AAPS0621G')
      return
    }

    if (!formData.phone.trim()) {
      setError('Please enter your phone number')
      return
    }

    if (!validatePhone(formData.phone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: formData.name.trim(),
          bits_id: formData.bits_id.toUpperCase().trim(),
          phone: formData.phone.trim(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (updateError) {
        throw updateError
      }

      // Show success state
      setSuccess(true)
      setSaving(false)

      // Small delay to show success message, then navigate
      setTimeout(() => {
        // Use window.location for reliable full page navigation
        window.location.href = '/dashboard'
      }, 500)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  // Show success state
  if (success) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2 style={{ margin: 0, color: '#333' }}>Profile Complete!</h2>
        <p style={{ margin: 0, color: '#666' }}>Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <main className="complete-profile-page">
        <aside className="welcome-aside">
          <h1>Welcome!</h1>
          <p>
            Please complete the following info to complete your sign up. It is
            required that you input the correct information for hassle-free
            registration.
          </p>
        </aside>
        <section className="form-section">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">{error}</div>
            )}

            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="disabled-input"
            />

            <label htmlFor="bits_id">BITS ID</label>
            <input
              id="bits_id"
              type="text"
              placeholder="Your 13 digit BITS ID. Example: 2018A8PS0414G"
              value={formData.bits_id}
              onChange={(e) => setFormData({ ...formData, bits_id: e.target.value.toUpperCase() })}
              required
            />

            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="10 Digit Phone Number"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              required
            />

            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving...' : "Let's Go →"}
            </button>
          </form>
        </section>

        <style jsx>{`
          .complete-profile-page {
            display: flex;
            min-height: calc(100vh - 60px);
          }

          @media screen and (max-width: 640px) {
            .complete-profile-page {
              flex-direction: column;
              min-height: auto;
              overflow-y: auto;
            }
          }

          .welcome-aside {
            flex-basis: 60%;
            background-image: url('/images/welcome.svg');
            background-size: cover;
            background-repeat: no-repeat;
            background-color: #e0f2fe;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            min-height: 400px;
          }

          .welcome-aside h1 {
            margin: 0;
            font-size: 2.5rem;
            color: var(--black);
          }

          .welcome-aside p {
            max-width: 400px;
            text-align: center;
            color: #4b5563;
            margin-top: 1rem;
          }

          @media screen and (min-width: 640px) and (max-width: 880px) {
            .welcome-aside {
              flex-basis: 50%;
            }
          }

          @media screen and (max-width: 640px) {
            .welcome-aside {
              flex-basis: auto;
              min-height: 200px;
              padding: 30px 20px;
            }
            .welcome-aside h1 {
              font-size: 2rem;
            }
          }

          .form-section {
            flex-basis: 40%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            background: white;
          }

          @media screen and (min-width: 640px) and (max-width: 880px) {
            .form-section {
              flex-basis: 50%;
            }
          }

          @media screen and (max-width: 640px) {
            .form-section {
              flex-basis: auto;
              padding: 30px 20px 60px 20px;
            }
          }

          form {
            width: 100%;
            max-width: 400px;
          }

          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #374151;
          }

          input {
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
          }

          input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .disabled-input {
            background: #f3f4f6;
            color: #6b7280;
            cursor: not-allowed;
          }

          button[type="submit"] {
            width: 100%;
            padding: 14px;
            font-size: 16px;
            margin-top: 10px;
          }

          .error-message {
            background-color: rgba(239, 68, 68, 0.1);
            color: #991b1b;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
        `}</style>
      </main>
    </>
  )
}
