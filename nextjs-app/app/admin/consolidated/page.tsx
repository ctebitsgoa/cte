'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Loading from '@/components/Loading'

interface CourseOption {
  id: string
  name: string
}

interface StudentRow {
  name: string
  email: string
  bits_id: string
  phone: string
  courses: string[]
}

export default function ConsolidatedSheetPage() {
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [students, setStudents] = useState<StudentRow[]>([])
  const [courseNames, setCourseNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const loadCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .order('name', { ascending: true })

      if (!error && data) {
        setCourses(data)
      }
      setLoading(false)
    }
    loadCourses()
  }, [supabase])

  const toggleCourse = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === courses.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(courses.map(c => c.id)))
    }
  }

  const generateSheet = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one course.')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/export-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: Array.from(selectedIds), format: 'json' }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to generate sheet')
        return
      }
      const data = await res.json()
      setStudents(data.students || [])
      setCourseNames(data.courseNames || [])
      setGenerated(true)
    } catch (e) {
      alert('An error occurred while generating the sheet.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadCSV = async () => {
    if (selectedIds.size === 0) return
    try {
      const res = await fetch('/api/admin/export-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: Array.from(selectedIds) }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Download failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'consolidated_student_sheet.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Download failed')
    }
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.bits_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <Loading />

  return (
    <div className="consolidated-page">
      <h2>Consolidated Student Sheet</h2>
      <p className="page-desc">
        Select courses below to generate a consolidated view of all enrolled students. Each student appears once with all their enrolled courses listed.
      </p>

      {/* Course Selection */}
      <div className="course-selection">
        <div className="selection-header">
          <h3>Select Courses</h3>
          <button className="outline" onClick={selectAll} style={{ fontSize: '13px', padding: '6px 14px' }}>
            {selectedIds.size === courses.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="course-chips">
          {courses.map(course => (
            <label 
              key={course.id} 
              className={`course-chip ${selectedIds.has(course.id) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(course.id)}
                onChange={() => toggleCourse(course.id)}
              />
              <span>{course.name}</span>
            </label>
          ))}
        </div>
        {courses.length === 0 && <p className="empty-msg">No courses available.</p>}
      </div>

      {/* Actions */}
      <div className="actions">
        <button 
          className="primary" 
          onClick={generateSheet}
          disabled={selectedIds.size === 0 || generating}
        >
          {generating ? 'Generating...' : 'Generate Sheet'}
        </button>
        {generated && students.length > 0 && (
          <button className="secondary" onClick={downloadCSV}>
            Download CSV
          </button>
        )}
        {generated && (
          <span className="student-count">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* Results Table */}
      {generated && (
        <>
          {students.length > 0 && (
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name, BITS ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {filteredStudents.length > 0 ? (
            <div className="table-container">
              <table className="consolidated-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student ID</th>
                    <th>Phone</th>
                    <th>Student Name</th>
                    <th>Courses Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.bits_id || student.email}>
                      <td>{index + 1}</td>
                      <td>{student.bits_id || '-'}</td>
                      <td>{student.phone || '-'}</td>
                      <td>{student.name}</td>
                      <td>
                        <div className="course-tags">
                          {student.courses.map((c, i) => (
                            <span key={i} className="course-tag">{c}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No students found for the selected courses.</p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .consolidated-page {
          max-width: 1200px;
        }
        .consolidated-page h2 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
        }
        .page-desc {
          color: #6b7280;
          margin: 0 0 24px 0;
          font-size: 0.95rem;
        }
        .course-selection {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .selection-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        .course-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .course-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.15s;
          user-select: none;
        }
        .course-chip:hover {
          border-color: #5f9ea0;
        }
        .course-chip.selected {
          background: #e0f2f1;
          border-color: #5f9ea0;
          color: #1a5c5e;
          font-weight: 500;
        }
        .course-chip input[type="checkbox"] {
          accent-color: #5f9ea0;
          cursor: pointer;
        }
        .empty-msg {
          color: #9ca3af;
          font-style: italic;
        }
        .actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .student-count {
          color: #6b7280;
          font-size: 0.9rem;
        }
        .search-bar {
          margin-bottom: 16px;
        }
        .search-bar input {
          max-width: 400px;
          width: 100%;
        }
        .table-container {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
        }
        .consolidated-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }
        .consolidated-table thead {
          background: #5f9ea0;
          color: white;
        }
        .consolidated-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 500;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .consolidated-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.93rem;
          vertical-align: top;
        }
        .consolidated-table tbody tr:hover {
          background: #f9fafb;
        }
        .consolidated-table tbody tr:last-child td {
          border-bottom: none;
        }
        .course-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .course-tag {
          display: inline-block;
          padding: 3px 10px;
          background: #e0f2f1;
          color: #1a5c5e;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 500;
          white-space: nowrap;
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }
        @media (max-width: 768px) {
          .course-chips {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
