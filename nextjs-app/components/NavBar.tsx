'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'

interface NavUser {
  id: string
  email: string
  role: string
}

export default function NavBar() {
  const pathname = usePathname()
  const [user, setUser] = useState<NavUser | null>(null)
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [menuOpen, setMenuOpen] = useState(false)
  
  const supabase = createClient()

  const loadUser = useCallback(async () => {
    try {
      // Use the server API to get user info - this is more reliable
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      if (data.authenticated && data.user) {
        setUser(data.user)
        setAuthState('authenticated')
      } else {
        setUser(null)
        setAuthState('unauthenticated')
      }
    } catch (error) {
      console.error('NavBar: Error loading user', error)
      setAuthState('unauthenticated')
    }
  }, [])

  useEffect(() => {
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Small delay to ensure cookies are set
        setTimeout(loadUser, 100)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthState('unauthenticated')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUser, supabase.auth])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      await supabase.auth.signOut({ scope: 'global' })
    } catch (error) {
      console.error('Sign out error:', error)
    }
    
    setUser(null)
    setAuthState('unauthenticated')
    window.location.href = '/'
  }

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  const isLoggedIn = authState === 'authenticated'
  const isAdmin = user?.role === 'admin'
  const isLoading = authState === 'loading'

  return (
    <header>
      <nav className="main" role="navigation" aria-label="main navigation">
        <div className="container">
          <div className="navbar-brand">
            <Link href="/" className="navbar-item">
              <img src="/logo.png" alt="CTE BPGC" width="108" height="48.6" />
            </Link>
            <a
              role="button"
              href="#"
              data-target="navmain"
              onClick={toggleMenu}
              className={`navbar-burger ${menuOpen ? 'is-active' : ''}`}
            >
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a>
          </div>

          <div id="navmain" className={`navbar-menu ${menuOpen ? 'is-active' : ''}`}>
            {isLoggedIn && (
              <Link href="/dashboard" className="navbar-item">
                My Courses
              </Link>
            )}
            <Link href="/catalog" className="navbar-item">
              Catalog
            </Link>
            <Link href="/faq" className="navbar-item">
              FAQ
            </Link>
            <a href="https://techweekend.bpgc-cte.org" className="navbar-item">
              TechWeekend
            </a>
            {isAdmin && (
              <Link href="/admin" className="navbar-item">
                Admin
              </Link>
            )}
            {isLoading ? (
              <span className="navbar-item" style={{ opacity: 0.5 }}>•••</span>
            ) : isLoggedIn ? (
              <a href="#" onClick={(e) => { e.preventDefault(); handleSignOut(); }} className="navbar-item">
                Sign Out
              </a>
            ) : (
              <Link href="/login" className="navbar-item">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
