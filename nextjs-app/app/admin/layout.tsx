'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  // Check if we're on the base /admin route
  const isBaseAdminRoute = pathname === '/admin'

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login?redirect_to=' + encodeURIComponent(pathname))
        return
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (!dbUser || dbUser.role !== 'admin') {
        setIsAdmin(false)
        return
      }

      setIsAdmin(true)
    }

    checkAdmin()
  }, [router, supabase, pathname])

  // Loading state
  if (isAdmin === null) {
    return null
  }

  // Not admin
  if (isAdmin === false) {
    return (
      <div className="container">
        <div className="not-found">
          <h2>Access Denied</h2>
          <p>Admin privileges required.</p>
          <Link href="/">
            <button className="primary">Go Home</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-main">
      {/* Sidebar */}
      <div className={`admin-sidebar ${!isBaseAdminRoute ? 'hidden-mobile' : ''}`}>
        <p className="admin-sidebar-title">Admin</p>
        <nav className="admin-nav">
          <Link 
            href="/admin/courses" 
            className={`admin-nav-item ${pathname.startsWith('/admin/courses') ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Courses
          </Link>
          <Link 
            href="/admin/users" 
            className={`admin-nav-item ${pathname.startsWith('/admin/users') ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Users
          </Link>
          <Link 
            href="/admin/consolidated" 
            className={`admin-nav-item ${pathname.startsWith('/admin/consolidated') ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            Consolidated Sheet
          </Link>
          <Link 
            href="/admin/team" 
            className={`admin-nav-item ${pathname.startsWith('/admin/team') ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Team
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <div className={`admin-page ${isBaseAdminRoute ? 'hidden-mobile' : ''}`}>
        {children}
      </div>

      {/* Mobile menu button */}
      {!isBaseAdminRoute && (
        <Link href="/admin" id="sidebar-mobile-button">
          <button className="primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </Link>
      )}
    </div>
  )
}
