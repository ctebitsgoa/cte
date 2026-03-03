'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import TermsModal from '@/components/TermsModal'

interface Instructor {
  id: string
  name: string
  email: string
}

interface Course {
  id: string
  name: string
  subtitle: string
  description: string
  handout: string | null
  cover_image: string
  is_archived: boolean
  instructors?: Instructor[]
  deregistration_enabled?: boolean
}

interface HandoutItem {
  id: string
  name: string
  type: string
  children: { id: string; name: string; type: string }[]
}

export default function CatalogCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [handout, setHandout] = useState<HandoutItem[] | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [showDeregisterModal, setShowDeregisterModal] = useState(false)
  const [deregOtp, setDeregOtp] = useState('')
  const [deregError, setDeregError] = useState('')
  const [deregistering, setDeregistering] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadCourse = async () => {
      // Check auth status
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setIsLoggedIn(!!authUser)

      // Load course details (public)
      const response = await fetch(`/api/courses/all`)
      if (response.ok) {
        const courses = await response.json()
        const found = courses.find((c: Course) => c.id === courseId)
        if (found) {
          setCourse(found)
        }
      }

      // If not found via all courses, try direct fetch
      if (!course) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()

        if (courseData) {
          // Load instructors
          const { data: instructorData } = await supabase
            .from('course_instructors')
            .select('user_id, users(id, name, email)')
            .eq('course_id', courseId)

          const instructors = instructorData?.map((i: any) => i.users).filter(Boolean) || []
          setCourse({ ...courseData, instructors })
        }
      }

      // Check registration status if logged in
      if (authUser) {
        const regResponse = await fetch(`/api/courses/${courseId}/registration-status`)
        if (regResponse.ok) {
          const regData = await regResponse.json()
          setIsRegistered(regData.registered)
          // Store deregistration_enabled from response
          if (regData.deregistration_enabled !== undefined) {
            setCourse(prev => prev ? { ...prev, deregistration_enabled: regData.deregistration_enabled } : prev)
          }
        }
      }

      // Load handout (course pages - modules)
      const { data: pages } = await supabase
        .from('course_pages')
        .select('id, name, type, parent_id, index')
        .eq('course_id', courseId)
        .order('index', { ascending: true })

      if (pages && pages.length > 0) {
        const modules = pages.filter(p => p.type === 'Module')
        const organized: HandoutItem[] = modules.map(mod => ({
          id: mod.id,
          name: mod.name,
          type: mod.type,
          children: pages.filter(p => p.parent_id === mod.id).sort((a, b) => a.index - b.index)
        }))
        if (organized.length > 0) {
          setHandout(organized)
        }
      }

      setLoading(false)
    }

    loadCourse()
  }, [courseId, supabase])

  const handleRegister = async () => {
    if (!isLoggedIn) {
      setShowSignInModal(true)
      return
    }
    setShowTerms(true)
  }

  const confirmRegister = async () => {
    setRegistering(true)
    try {
      const response = await fetch(`/api/courses/${courseId}/register`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        setIsRegistered(true)
        setShowTerms(false)
        router.push('/dashboard')
      } else {
        alert(data.error || 'Error registering. Please ensure that you are logged in.')
      }
    } catch (e) {
      alert('Error registering. Please ensure that you are logged in.')
    } finally {
      setRegistering(false)
    }
  }

  const handleDeregister = async () => {
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
      const response = await fetch(`/api/courses/${courseId}/deregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: deregOtp.trim() }),
      })
      const data = await response.json()
      if (data.success) {
        setIsRegistered(false)
        setShowDeregisterModal(false)
        setDeregOtp('')
        alert('Successfully deregistered from the course.')
      } else {
        setDeregError(data.error || 'Failed to deregister.')
      }
    } catch (e) {
      setDeregError('An error occurred. Please try again.')
    } finally {
      setDeregistering(false)
    }
  }

  if (loading) return <Loading />
  if (!course) return (
    <div className="not-found">
      <h2>Course not found</h2>
      <Link href="/catalog"><button className="primary">Back to Catalog</button></Link>
    </div>
  )

  return (
    <div>
      <div className="course-detail-header">
        <div className="container course-detail-grid">
          <div className="course-detail-info">
            <h2 style={{ marginTop: 0 }}>{course.name}</h2>
            {course.subtitle && <p className="course-subtitle">{course.subtitle}</p>}
            <p style={{ whiteSpace: 'pre-wrap' }}>{course.description}</p>
            {course.instructors && course.instructors.length > 0 && (
              <p className="instructors-line">
                <strong>Instructors:</strong> {course.instructors.map(i => i.name).join(', ')}
              </p>
            )}
            <div className="course-actions">
              {isRegistered ? (
                <>
                  <Link href={`/dashboard/course/${course.id}`}>
                    <button className="primary">Go To Course</button>
                  </Link>
                  {course.deregistration_enabled && (
                    <button className="error" onClick={() => setShowDeregisterModal(true)}>
                      Deregister
                    </button>
                  )}
                </>
              ) : (
                <button className="primary" onClick={handleRegister} disabled={registering}>
                  {registering ? 'Registering...' : 'Register'}
                </button>
              )}
              {course.handout && (
                <a href={course.handout} target="_blank" rel="noopener noreferrer">
                  <button className="secondary">Handout</button>
                </a>
              )}
            </div>
          </div>
          <div className="course-detail-image">
            <img src={course.cover_image || '/images/default-course.png'} alt={course.name} />
          </div>
        </div>
      </div>

      {handout && handout.length > 0 && (
        <div className="handout-section container">
          <h2>Topics</h2>
          <div className="handout-items">
            {handout.map(item => (
              <div key={item.id} className="handout-card">
                <p className="module-name">{item.name}</p>
                <ul className="handout-list">
                  {item.children.map(page => (
                    <li key={page.id}>
                      {isRegistered ? (
                        <Link href={`/dashboard/course/${course.id}`}>
                          {page.name}
                        </Link>
                      ) : (
                        <span>{page.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTerms && (
        <TermsModal
          courseName={course.name}
          onAgree={confirmRegister}
          onClose={() => setShowTerms(false)}
        />
      )}

      {showSignInModal && (
        <div className="modal-overlay" onClick={() => setShowSignInModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sign In Required</h3>
              <button className="modal-close-btn" onClick={() => setShowSignInModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
              <p style={{ fontSize: '1rem', color: '#374151', marginBottom: '8px' }}>You need to sign in with your BITS Pilani Google account to register for this course.</p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>After signing in, you can register and access all course content.</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <Link href="/login">
                <button className="primary">Sign In with Google</button>
              </Link>
              <button className="secondary" onClick={() => setShowSignInModal(false)}>Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {showDeregisterModal && (
        <div className="modal-overlay" onClick={() => setShowDeregisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deregister from Course</h3>
              <button className="modal-close-btn" onClick={() => setShowDeregisterModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>To deregister from <b>{course.name}</b>, please enter the 4-digit PIN provided by the admin/coordinator.</p>
              {deregError && <div className="error-msg">{deregError}</div>}
              <label htmlFor="dereg-otp">Deregistration PIN</label>
              <div className="otp-input-container">
                <input
                  id="dereg-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000"
                  value={deregOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    if (val.length <= 4) setDeregOtp(val)
                  }}
                  maxLength={4}
                  className="otp-input"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="error" onClick={handleDeregister} disabled={deregistering}>
                {deregistering ? 'Processing...' : 'Deregister'}
              </button>
              <button className="secondary" onClick={() => setShowDeregisterModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .course-detail-header {
          padding: 20px 40px 40px 40px;
          background-color: #fff;
        }
        .course-detail-grid {
          display: flex;
          gap: 40px;
          align-items: flex-start;
        }
        .course-detail-info {
          flex: 1;
        }
        .course-subtitle {
          color: #6b7280;
          font-size: 1.1rem;
          margin-top: -10px;
          margin-bottom: 15px;
        }
        .instructors-line {
          color: #4b5563;
          font-size: 0.95rem;
        }
        .course-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .course-detail-image img {
          max-width: 350px;
          width: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .handout-section {
          padding: 30px 0;
        }
        .handout-items {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        .handout-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          min-width: 250px;
          flex: 1;
        }
        .module-name {
          font-weight: 600;
          font-size: 1.05rem;
          margin: 0 0 10px 0;
        }
        .handout-list {
          padding-left: 20px;
          margin: 0;
        }
        .handout-list li {
          margin: 6px 0;
          font-size: 0.95rem;
        }
        .handout-list a {
          color: var(--primaryColor);
          text-decoration: none;
        }
        .handout-list a:hover {
          text-decoration: underline;
        }
        .modal-overlay {
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
        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }
        .modal-close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          line-height: 1;
        }
        .modal-body {
          padding: 24px;
        }
        .modal-body label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151;
        }
        .modal-body input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 15px;
        }
        .modal-body input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          color: #991b1b;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 0.9rem;
        }
        .otp-input-container {
          display: flex;
          justify-content: center;
          margin-top: 8px;
        }
        .otp-input {
          width: 160px !important;
          text-align: center;
          font-size: 28px !important;
          font-weight: 700;
          letter-spacing: 10px;
          font-family: 'Courier New', monospace;
          padding: 12px 16px !important;
        }
        .modal-footer {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          justify-content: flex-end;
        }
        button.error {
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        button.error:hover {
          background: #dc2626;
        }
        button.error:disabled {
          background: #fca5a5;
          cursor: not-allowed;
        }
        @media screen and (max-width: 768px) {
          .course-detail-header {
            padding: 20px;
          }
          .course-detail-grid {
            flex-direction: column-reverse;
          }
          .course-detail-image img {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
