'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import CourseCard from '@/components/CourseCard'
import { User, Course } from '@/types/database'

interface UserWithCourses extends User {
  courses: Course[]
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserWithCourses | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      // Load user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (userError || !userData) {
        alert('User not found')
        router.push('/admin/users')
        return
      }

      // Load user's registered courses
      const { data: registrations } = await supabase
        .from('user_courses')
        .select(`
          course_id,
          courses (*)
        `)
        .eq('user_id', id)

      const courses = registrations?.map(reg => reg.courses as unknown as Course) || []

      setUser({
        ...userData,
        courses
      })
      setLoading(false)
    }

    loadData()
  }, [id, router, supabase])

  const handleRoleChange = async () => {
    if (!user) return

    const newRole = user.role === 'admin' ? 'student' : 'admin'
    
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', user.id)

    if (error) {
      alert('Error updating access level: ' + error.message)
    } else {
      setUser({ ...user, role: newRole })
    }
  }

  const handleDeregister = async (courseName: string, courseId: string) => {
    if (!user) return
    
    if (!confirm(`Are you sure you want to deregister ${user.name} from "${courseName}"?`)) {
      return
    }

    const { error } = await supabase
      .from('user_courses')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId)

    if (error) {
      alert('Failed to deregister: ' + error.message)
    } else {
      setUser({
        ...user,
        courses: user.courses.filter(c => c.id !== courseId)
      })
    }
  }

  const capitalizeRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  if (loading) return <Loading />
  if (!user) return null

  return (
    <>
      <div className="user-detail-header">
        <div className="user-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          {user.bits_id && <p>{user.bits_id}</p>}
          {user.phone && <p>{user.phone}</p>}
          <p className="role-line">
            {capitalizeRole(user.role)}
            <a onClick={handleRoleChange}>
              {user.role === 'student' ? 'Upgrade to Admin' : 'Downgrade to Student'}
            </a>
          </p>
        </div>

        <div className="buttons">
          <Link href="/admin/users">
            <button>Back</button>
          </Link>
        </div>
      </div>

      <div className="content">
        <h4><b>Registered Courses</b></h4>
        
        <div className="courses-grid">
          {user.courses.length > 0 ? (
            user.courses.map(course => (
              <CourseCard key={course.id} course={course}>
                <button 
                  className="error"
                  style={{ marginTop: '10px' }}
                  onClick={() => handleDeregister(course.name, course.id)}
                >
                  Deregister
                </button>
              </CourseCard>
            ))
          ) : (
            <p>None.</p>
          )}
        </div>
      </div>
    </>
  )
}
