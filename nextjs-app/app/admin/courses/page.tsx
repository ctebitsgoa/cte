'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Course } from '@/types/database'
import Link from 'next/link'
import Loading from '@/components/Loading'
import CourseCard from '@/components/CourseCard'

interface CourseWithStats extends Course {
  student_count?: number
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) {
        next.delete(courseId)
      } else {
        next.add(courseId)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedCourseIds.size === filteredCourses.length) {
      setSelectedCourseIds(new Set())
    } else {
      setSelectedCourseIds(new Set(filteredCourses.map(c => c.id)))
    }
  }

  const handleExportCSV = async () => {
    if (selectedCourseIds.size === 0) {
      alert('Please select at least one course to export.')
      return
    }
    setExporting(true)
    try {
      const res = await fetch('/api/admin/export-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: Array.from(selectedCourseIds) }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert('Export failed: ' + (err.error || 'Unknown error'))
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'student_data_export.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed: ' + (err as Error).message)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const loadCourses = async () => {
      // Load all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (coursesError) {
        console.error('Failed to load courses:', coursesError)
      } else {
        // Get student count for each course
        const coursesWithCounts = await Promise.all(
          (coursesData || []).map(async (course) => {
            const { count } = await supabase
              .from('user_courses')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id)
            
            return { ...course, student_count: count || 0 }
          })
        )
        setCourses(coursesWithCounts)
        setFilteredCourses(coursesWithCounts)
      }

      setLoading(false)
    }

    loadCourses()
  }, [supabase])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      setFilteredCourses(courses)
      setShowSearchResults(false)
    } else {
      const filtered = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCourses(filtered)
      setShowSearchResults(true)
    }
  }

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      return
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      alert('Failed to delete course: ' + error.message)
    } else {
      const updated = courses.filter(c => c.id !== courseId)
      setCourses(updated)
      setFilteredCourses(updated.filter(course =>
        !searchTerm.trim() || course.name.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    }
  }

  if (loading) return <Loading />

  return (
    <>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginRight: '10px' }}
          />
          <button className="secondary" type="submit" style={{ display: 'flex', alignItems: 'center', padding: '10px 15px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </form>
        <Link href="/admin/courses/new">
          <button className="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
            Add Course
          </button>
        </Link>
      </div>

      {showSearchResults && (
        <div style={{ marginBottom: '15px' }}>
          {filteredCourses.length > 0 ? (
            <p>Showing results for &quot;{searchTerm}&quot;</p>
          ) : (
            <p>No such course found.</p>
          )}
        </div>
      )}

      <div className="courses">
        {filteredCourses.map(course => (
          <CourseCard key={course.id} course={course}>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
              <Link href={`/admin/course/${course.id}`}>
                <button className="secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>View</button>
              </Link>
              <Link href={`/admin/courses/${course.id}`}>
                <button className="outline" style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
              </Link>
              <Link href={`/admin/courses/${course.id}/students`}>
                <button className="outline" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  {course.student_count || 0} Students
                </button>
              </Link>
              <button 
                className="error"
                style={{ padding: '6px 12px', fontSize: '13px' }}
                onClick={() => handleDeleteCourse(course.id, course.name)}
              >
                Delete
              </button>
            </div>
          </CourseCard>
        ))}
      </div>

      {filteredCourses.length === 0 && !showSearchResults && (
        <div className="empty-state">
          <p>No courses yet. Create your first course!</p>
        </div>
      )}
    </>
  )
}
