'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'

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
  registration_open: boolean
  instructors?: Instructor[]
}

interface RegisteredStudent {
  id: string
  name: string
  email: string
  bits_id: string | null
  phone: string | null
}

export default function AdminCourseViewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([])
  const [regOpen, setRegOpen] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [deregEnabled, setDeregEnabled] = useState(false)
  const [deregOtp, setDeregOtp] = useState<string | null>(null)
  const [deregLoading, setDeregLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadCourse = async () => {
      // Check if user is admin
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()
      
      if (dbUser?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Load course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError || !courseData) {
        alert('Course not found')
        router.push('/admin/courses')
        return
      }

      // Load instructors
      const { data: instructorData } = await supabase
        .from('course_instructors')
        .select('user_id, users(id, name, email)')
        .eq('course_id', courseId)

      const instructors = instructorData?.map((i: any) => i.users).filter(Boolean) || []
      setCourse({ ...courseData, instructors })
      setRegOpen(courseData.registration_open || false)

      // Load registered students
      const { data: registrations } = await supabase
        .from('user_courses')
        .select('user_id, users(id, name, email, bits_id, phone)')
        .eq('course_id', courseId)

      if (registrations) {
        const students = registrations
          .map((r: any) => r.users)
          .filter(Boolean)
        setRegisteredStudents(students)
      }

      // Load deregistration settings
      try {
        const deregResponse = await fetch(`/api/admin/courses/${courseId}/deregistration`)
        if (deregResponse.ok) {
          const deregData = await deregResponse.json()
          setDeregEnabled(deregData.deregistration_enabled || false)
          setDeregOtp(deregData.deregistration_otp || null)
        }
      } catch (e) {
        console.error('Error loading deregistration settings:', e)
      }

      setLoading(false)
    }

    loadCourse()
  }, [courseId, router, supabase])

  if (loading) return <Loading />
  if (!course) return null

  const toggleRegistration = async () => {
    const newStatus = !regOpen
    const confirmMsg = newStatus
      ? 'Open registration for this course? Students will be able to register.'
      : 'Close registration for this course? Students will no longer be able to register.'
    if (!confirm(confirmMsg)) return

    setRegLoading(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({ registration_open: newStatus })
        .eq('id', courseId)
      
      if (error) throw error
      setRegOpen(newStatus)
      setCourse({ ...course, registration_open: newStatus })
    } catch (e: any) {
      alert('Error toggling registration: ' + (e.message || 'Unknown error'))
    } finally {
      setRegLoading(false)
    }
  }

  const toggleDeregistration = async () => {
    const action = deregEnabled ? 'close' : 'open'
    const confirmMsg = deregEnabled
      ? 'Close deregistration for this course? Students will no longer be able to deregister.'
      : 'Open deregistration for this course? A 4-digit PIN will be generated for students to use.'
    if (!confirm(confirmMsg)) return

    setDeregLoading(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/deregistration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (data.success) {
        setDeregEnabled(data.deregistration_enabled)
        setDeregOtp(data.deregistration_otp)
      } else {
        alert(data.error || 'Failed to toggle deregistration')
      }
    } catch (e) {
      alert('Error toggling deregistration')
    } finally {
      setDeregLoading(false)
    }
  }

  return (
    <div className="admin-course-view">
      {/* Action Bar */}
      <div className="action-bar">
        <h1>{course.name}</h1>
        <div className="action-buttons">
          <button 
            className="secondary" 
            onClick={async () => {
              const { error } = await supabase
                .from('courses')
                .update({ is_archived: !course.is_archived })
                .eq('id', courseId)
              if (!error) {
                setCourse({ ...course, is_archived: !course.is_archived })
              }
            }}
          >
            {course.is_archived ? 'UnArchive' : 'Archive'}
          </button>
          <Link href={`/admin/courses/${courseId}`}>
            <button className="secondary">Edit</button>
          </Link>
          <Link href={`/admin/courses/${courseId}/content`}>
            <button className="primary">Manage Content</button>
          </Link>
          <button 
            className="error"
            onClick={async () => {
              if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return
              const { error } = await supabase.from('courses').delete().eq('id', courseId)
              if (!error) {
                router.push('/admin/courses')
              } else {
                alert('Failed to delete course: ' + error.message)
              }
            }}
          >
            Delete
          </button>
          <Link href="/admin/courses">
            <button className="outline">Back</button>
          </Link>
        </div>
      </div>

      {/* Cover Image */}
      {course.cover_image && (
        <div className="cover-section">
          <img 
            src={course.cover_image} 
            alt={course.name}
            className="course-cover"
          />
        </div>
      )}

      {/* Subtitle */}
      {course.subtitle && (
        <div className="info-section">
          <h3>Subtitle</h3>
          <p>{course.subtitle}</p>
        </div>
      )}

      {/* Description */}
      {course.description && (
        <div className="info-section">
          <h3>Description</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{course.description}</p>
        </div>
      )}

      {/* Instructors */}
      {course.instructors && course.instructors.length > 0 && (
        <div className="info-section">
          <h3>Instructors</h3>
          <ul className="instructor-list">
            {course.instructors.map(instructor => (
              <li key={instructor.id}>{instructor.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Handout Button */}
      {course.handout && (
        <div className="handout-section">
          <a href={course.handout} target="_blank" rel="noopener noreferrer">
            <button className="outline">Handout</button>
          </a>
        </div>
      )}

      {/* Registration Controls */}
      <div className="reg-section">
        <h3>Registration</h3>
        <div className="reg-controls">
          <div className="reg-status">
            <span className={`reg-badge ${regOpen ? 'open' : 'closed'}`}>
              {regOpen ? 'Open' : 'Closed'}
            </span>
            <p className="reg-description">
              {regOpen
                ? 'Students can register for this course.'
                : 'Registration is currently closed for this course.'}
            </p>
          </div>
          <button
            className={regOpen ? 'error' : 'primary'}
            onClick={toggleRegistration}
            disabled={regLoading}
          >
            {regLoading
              ? 'Processing...'
              : regOpen
                ? 'Close Registration'
                : 'Open Registration'}
          </button>
        </div>
      </div>

      {/* Deregistration Controls */}
      <div className="dereg-section">
        <h3>Deregistration</h3>
        <div className="dereg-controls">
          <div className="dereg-status">
            <span className={`dereg-badge ${deregEnabled ? 'open' : 'closed'}`}>
              {deregEnabled ? 'Open' : 'Closed'}
            </span>
            <p className="dereg-description">
              {deregEnabled
                ? 'Students can deregister using the PIN below.'
                : 'Deregistration is currently closed for this course.'}
            </p>
          </div>
          <button
            className={deregEnabled ? 'error' : 'primary'}
            onClick={toggleDeregistration}
            disabled={deregLoading}
          >
            {deregLoading
              ? 'Processing...'
              : deregEnabled
                ? 'Close Deregistration'
                : 'Open Deregistration'}
          </button>
        </div>

        {deregEnabled && deregOtp && (
          <div className="dereg-otp-display">
            <p className="otp-label">Deregistration PIN</p>
            <div className="otp-value">{deregOtp}</div>
            <p className="otp-hint">Share this 4-digit PIN with students who need to deregister.</p>
          </div>
        )}
      </div>

      {/* Registered Students */}
      <div className="students-section">
        <h3>Registered Students</h3>
        {registeredStudents.length > 0 ? (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>ID</th>
                  <th>PHONE</th>
                </tr>
              </thead>
              <tbody>
                {registeredStudents.map(student => (
                  <tr key={student.id}>
                    <td>{student.name || '-'}</td>
                    <td>{student.email}</td>
                    <td>{student.bits_id || '-'}</td>
                    <td>{student.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-students">No students registered yet.</p>
        )}
      </div>

      <style jsx>{`
        .admin-course-view {
          padding: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .action-bar h1 {
          margin: 0;
          font-size: 1.8rem;
        }
        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cover-section {
          margin-bottom: 30px;
        }
        .course-cover {
          max-width: 300px;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .info-section {
          margin-bottom: 25px;
        }
        .info-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 10px 0;
        }
        .info-section p {
          margin: 0;
          line-height: 1.6;
          color: #333;
        }
        .instructor-list {
          margin: 0;
          padding-left: 25px;
        }
        .instructor-list li {
          margin: 5px 0;
          color: #333;
        }
        .handout-section {
          margin-bottom: 30px;
        }
        .students-section {
          margin-top: 40px;
        }
        .dereg-section {
          margin-top: 40px;
          padding: 24px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .dereg-section h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 16px 0;
        }
        .dereg-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .dereg-status {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .dereg-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dereg-badge.open {
          background: #dcfce7;
          color: #166534;
        }
        .dereg-badge.closed {
          background: #f3f4f6;
          color: #6b7280;
        }
        .dereg-description {
          margin: 0;
          color: #4b5563;
          font-size: 0.95rem;
        }
        .dereg-otp-display {
          margin-top: 20px;
          padding: 20px;
          background: white;
          border: 2px dashed var(--primary);
          border-radius: 10px;
          text-align: center;
        }
        .otp-label {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .otp-value {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: 12px;
          color: #1f2937;
          font-family: 'Courier New', monospace;
          padding: 10px 0;
        }
        .otp-hint {
          margin: 8px 0 0 0;
          font-size: 0.85rem;
          color: #9ca3af;
        }
        .reg-section {
          margin-top: 40px;
          padding: 24px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
        }
        .reg-section h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 16px 0;
        }
        .reg-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .reg-status {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .reg-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .reg-badge.open {
          background: #dcfce7;
          color: #166534;
        }
        .reg-badge.closed {
          background: #fef2f2;
          color: #991b1b;
        }
        .reg-description {
          margin: 0;
          color: #4b5563;
          font-size: 0.95rem;
        }
        .students-section h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 20px 0;
        }
        .students-table-container {
          overflow-x: auto;
        }
        .students-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }
        .students-table thead {
          background: var(--gray-900);
          color: white;
        }
        .students-table th {
          padding: 12px 15px;
          text-align: left;
          font-weight: 500;
          font-size: 0.9rem;
        }
        .students-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
          font-size: 0.95rem;
        }
        .students-table tbody tr:hover {
          background: #f9f9f9;
        }
        .no-students {
          color: #666;
          font-style: italic;
        }
        @media (max-width: 768px) {
          .admin-course-view {
            padding: 20px;
          }
          .action-bar {
            flex-direction: column;
            align-items: flex-start;
          }
          .course-cover {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
