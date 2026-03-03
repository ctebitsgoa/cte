'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'
import { User, Course } from '@/types/database'

interface RegisteredStudent extends User {
  registered_at: string
}

export default function CourseStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<RegisteredStudent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
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

      if (!dbUser || dbUser.role !== 'admin') {
        router.push('/admin')
        return
      }

      setIsAdmin(true)

      // Load course info
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (courseError || !courseData) {
        alert('Course not found')
        router.push('/admin')
        return
      }

      setCourse(courseData)

      // Load registered students
      const { data: registrations, error: regError } = await supabase
        .from('user_courses')
        .select(`
          registered_at,
          users (
            id,
            name,
            email,
            bits_id,
            phone,
            role,
            created_at,
            updated_at
          )
        `)
        .eq('course_id', id)

      if (regError) {
        console.error('Error loading students:', regError)
      } else {
        const studentsData = registrations?.map(reg => ({
          ...(reg.users as unknown as User),
          registered_at: reg.registered_at
        })) || []
        setStudents(studentsData)
      }

      setLoading(false)
    }

    loadData()
  }, [id, router, supabase])

  const handleDeregister = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to deregister "${userName}" from this course?`)) {
      return
    }

    const { error } = await supabase
      .from('user_courses')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', id)

    if (error) {
      alert('Failed to deregister student: ' + error.message)
    } else {
      setStudents(students.filter(s => s.id !== userId))
    }
  }

  const downloadCSV = () => {
    // Generate CSV content
    const headers = ['Name', 'Email', 'BITS ID', 'Phone', 'Registered At']
    const rows = filteredStudents.map(student => [
      student.name,
      student.email,
      student.bits_id || '',
      student.phone || '',
      new Date(student.registered_at).toLocaleDateString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${course?.name || 'course'}_students.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.bits_id && student.bits_id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return <Loading />
  if (!isAdmin || !course) return null

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <Link href={`/admin/courses/${id}`} className="back-link">← Back to Edit Course</Link>
      </div>

      <div className="user-detail-header">
        <div className="user-info">
          <h2>{course.name}</h2>
          <p>{course.subtitle}</p>
          <p style={{ marginTop: '10px' }}>{students.length} registered students</p>
        </div>

        <div className="buttons" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button className="secondary" onClick={downloadCSV} disabled={students.length === 0}>
            Download CSV
          </button>
          <Link href="/admin/courses">
            <button>Back</button>
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Search by name, email, or BITS ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {filteredStudents.length === 0 ? (
        <div className="empty-state">
          <p>No students registered for this course yet.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>BITS ID</th>
              <th>Phone</th>
              <th>Registered At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.bits_id || '-'}</td>
                <td>{student.phone || '-'}</td>
                <td>{new Date(student.registered_at).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button 
                    className="error"
                    onClick={() => handleDeregister(student.id, student.name)}
                  >
                    Deregister
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
