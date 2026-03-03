'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Course } from '@/types/database'
import Link from 'next/link'
import Loading from '@/components/Loading'

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeregModal, setShowDeregModal] = useState(false)
  const [deregCourse, setDeregCourse] = useState<Course | null>(null)
  const [deregOtp, setDeregOtp] = useState('')
  const [deregError, setDeregError] = useState('')
  const [deregistering, setDeregistering] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/user/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const openDeregModal = (course: Course) => {
    setDeregCourse(course)
    setDeregOtp('')
    setDeregError('')
    setShowDeregModal(true)
  }

  const handleDeregister = async () => {
    if (!deregCourse) return
    setDeregError('')
    if (!deregOtp.trim()) {
      setDeregError('Please enter the 4-digit PIN')
      return
    }
    if (deregOtp.trim().length !== 4) {
      setDeregError('PIN must be 4 digits')
      return
    }
    setDeregistering(true)
    try {
      const response = await fetch(`/api/courses/${deregCourse.id}/deregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: deregOtp.trim() }),
      })
      const data = await response.json()
      if (data.success) {
        setCourses(prev => prev.filter(c => c.id !== deregCourse.id))
        setShowDeregModal(false)
        setDeregCourse(null)
        setDeregOtp('')
      } else {
        setDeregError(data.error || 'Failed to deregister.')
      }
    } catch (e) {
      setDeregError('An error occurred. Please try again.')
    } finally {
      setDeregistering(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div>
      {courses.length > 0 ? (
        <div className="container">
          <h2>My Courses</h2>
          <ul className="user-courses">
            {courses.map((course: any) => (
              <li key={course.id}>
                <div>
                  <img src={course.cover_image || '/images/default-course.png'} alt={course.name} />
                  <div>
                    <h3>{course.name}</h3>
                    {course.is_archived && <h4>Archived</h4>}
                    {course.instructors && course.instructors.length > 0 && (
                      <p>
                        Instructors: {course.instructors.map((x: any) => x.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link href={`/dashboard/course/${course.id}`}>
                    <button className="secondary">View Course</button>
                  </Link>
                  {course.deregistration_enabled && (
                    <button className="error" onClick={() => openDeregModal(course)}>
                      Deregister
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="not-found">
          <img src="/images/empty.png" alt="No courses" />
          <h2>You are missing out!</h2>
          <Link href="/catalog">
            <button className="primary">Explore Courses</button>
          </Link>
        </div>
      )}

      {/* Deregister Modal */}
      {showDeregModal && deregCourse && (
        <div className="dereg-overlay" onClick={() => setShowDeregModal(false)}>
          <div className="dereg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dereg-header">
              <h3>Deregister from Course</h3>
              <button className="dereg-close-btn" onClick={() => setShowDeregModal(false)}>&times;</button>
            </div>
            <div className="dereg-body">
              <p>To deregister from <b>{deregCourse.name}</b>, please enter the 4-digit PIN provided by the admin/coordinator.</p>
              {deregError && <div className="dereg-error">{deregError}</div>}
              <label htmlFor="dashboard-dereg-otp">Deregistration PIN</label>
              <div className="dereg-otp-wrap">
                <input
                  id="dashboard-dereg-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000"
                  value={deregOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    if (val.length <= 4) setDeregOtp(val)
                  }}
                  maxLength={4}
                  autoComplete="off"
                  className="dereg-otp-input"
                />
              </div>
            </div>
            <div className="dereg-footer">
              <button className="error" onClick={handleDeregister} disabled={deregistering}>
                {deregistering ? 'Processing...' : 'Deregister'}
              </button>
              <button className="secondary" onClick={() => setShowDeregModal(false)}>Cancel</button>
            </div>
          </div>

          <style jsx>{`
            .dereg-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              padding: 20px;
            }
            .dereg-modal {
              background: white;
              border-radius: 12px;
              max-width: 480px;
              width: 100%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .dereg-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 20px 24px;
              border-bottom: 1px solid #e5e7eb;
            }
            .dereg-header h3 {
              margin: 0;
              font-size: 1.2rem;
            }
            .dereg-close-btn {
              background: none;
              border: none;
              font-size: 1.5rem;
              cursor: pointer;
              color: #6b7280;
              padding: 0;
              line-height: 1;
            }
            .dereg-body {
              padding: 24px;
            }
            .dereg-body label {
              display: block;
              margin-bottom: 6px;
              font-weight: 500;
              color: #374151;
            }
            .dereg-otp-wrap {
              display: flex;
              justify-content: center;
              margin-top: 8px;
            }
            .dereg-otp-input {
              width: 160px !important;
              text-align: center;
              font-size: 28px !important;
              font-weight: 700;
              letter-spacing: 10px;
              font-family: 'Courier New', monospace;
              padding: 12px 16px !important;
            }
            .dereg-error {
              background: rgba(239, 68, 68, 0.1);
              color: #991b1b;
              padding: 10px 14px;
              border-radius: 8px;
              margin-bottom: 15px;
              font-size: 0.9rem;
            }
            .dereg-footer {
              display: flex;
              gap: 12px;
              padding: 16px 24px;
              border-top: 1px solid #e5e7eb;
              justify-content: flex-end;
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
