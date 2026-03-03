'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if we're on desktop and redirect to courses
    const checkWidth = () => {
      if (window.innerWidth > 768) {
        router.push('/admin/courses')
      }
    }
    
    checkWidth()
  }, [router])

  // On mobile, show the sidebar menu (handled by layout)
  // This page is just a redirect target on desktop
  return null
}
