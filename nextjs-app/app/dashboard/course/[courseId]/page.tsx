'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Loading from '@/components/Loading'

interface CoursePage {
  id: string
  name: string
  type: 'Module' | 'Article' | 'Quiz'
  course_id: string
  parent_id: string | null
  index: number
  doc: string | null
}

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
  instructors?: Instructor[]
}

interface ModuleWithChildren extends CoursePage {
  children: CoursePage[]
  isOpen: boolean
}

export default function CourseViewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithChildren[]>([])
  const [selectedPage, setSelectedPage] = useState<CoursePage | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deregEnabled, setDeregEnabled] = useState(false)
  const [showDeregModal, setShowDeregModal] = useState(false)
  const [deregOtp, setDeregOtp] = useState('')
  const [deregError, setDeregError] = useState('')
  const [deregistering, setDeregistering] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadCourse = async () => {
      // Check if user is logged in
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      // Check admin status
      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()
      
      setIsAdmin(dbUser?.role === 'admin')

      // Load course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError || !courseData) {
        alert('Course not found')
        router.push('/dashboard')
        return
      }

      // Load instructors
      const { data: instructorData } = await supabase
        .from('course_instructors')
        .select('user_id, users(id, name, email)')
        .eq('course_id', courseId)

      const instructors = instructorData?.map((i: any) => i.users).filter(Boolean) || []
      setCourse({ ...courseData, instructors })

      // Check deregistration status
      try {
        const regResponse = await fetch(`/api/courses/${courseId}/registration-status`)
        if (regResponse.ok) {
          const regData = await regResponse.json()
          setDeregEnabled(regData.deregistration_enabled || false)
        }
      } catch (e) {
        console.error('Error checking deregistration status:', e)
      }

      // Load course pages
      const { data: pages } = await supabase
        .from('course_pages')
        .select('*')
        .eq('course_id', courseId)
        .order('index', { ascending: true })

      if (pages) {
        // Organize pages into modules with children
        const modulePages = pages.filter(p => p.type === 'Module')
        const organizedModules: ModuleWithChildren[] = modulePages.map(mod => ({
          ...mod,
          children: pages.filter(p => p.parent_id === mod.id).sort((a, b) => a.index - b.index),
          isOpen: false
        }))
        
        // Open first module by default
        if (organizedModules.length > 0) {
          organizedModules[0].isOpen = true
        }
        
        setModules(organizedModules)
      }

      setLoading(false)
    }

    loadCourse()
  }, [courseId, router, supabase])

  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(mod => ({
      ...mod,
      isOpen: mod.id === moduleId ? !mod.isOpen : mod.isOpen
    })))
  }

  const selectPage = (page: CoursePage) => {
    setSelectedPage(page)
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
        alert('Successfully deregistered from the course.')
        router.push('/dashboard')
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
  if (!course) return null

  return (
    <div className="course-main">
      {/* Sidebar - only for admin, students get a floating back button */}
      {isAdmin ? (
      <div className="course-sidebar">
        <div className="course-sidebar-header">
          <Link href="/dashboard" className="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <p className="course-sidebar-title">{course.name}</p>
        </div>

        <nav className="course-nav">
          {modules.map(module => (
            <div key={module.id} className="module-container">
              <a 
                className={`module-header ${module.isOpen ? 'active' : ''}`}
                onClick={() => toggleModule(module.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {module.isOpen ? (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  ) : (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  )}
                </svg>
                {module.name}
              </a>
              
              {module.isOpen && (
                <div className="module-children">
                  {module.children.length > 0 ? (
                    module.children.map(child => (
                      <a
                        key={child.id}
                        className={`module-child ${selectedPage?.id === child.id ? 'active' : ''}`}
                        onClick={() => selectPage(child)}
                      >
                        {child.type === 'Quiz' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        )}
                        {child.name}
                      </a>
                    ))
                  ) : (
                    <p className="no-content">No content yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {modules.length === 0 && (
            <p className="no-content" style={{ padding: '15px' }}>No modules yet</p>
          )}
        </nav>

        {isAdmin && (
          <div className="course-admin-section">
            <p className="admin-section-title">Admin</p>
            <nav className="course-nav">
              <Link href={`/dashboard/course/${courseId}/registrations`} className="module-header">
                Registrations
              </Link>
            </nav>
          </div>
        )}

        {deregEnabled && !isAdmin && (
          <div className="course-dereg-section">
            <button
              className="error"
              onClick={() => setShowDeregModal(true)}
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            >
              Deregister from Course
            </button>
          </div>
        )}
      </div>
      ) : (
      /* Student: no sidebar, just a top bar with back button and module navigation */
      <div className="student-sidebar">
        <div className="student-sidebar-header">
          <Link href="/dashboard" className="student-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </Link>
        </div>
        <nav className="student-modules">
          {modules.map(module => (
            <div key={module.id} className="student-module">
              <button
                className={`student-module-btn ${module.isOpen ? 'open' : ''}`}
                onClick={() => toggleModule(module.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: module.isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                {module.name}
              </button>
              {module.isOpen && (
                <div className="student-module-children">
                  {module.children.map(child => (
                    <button
                      key={child.id}
                      className={`student-child-btn ${selectedPage?.id === child.id ? 'active' : ''}`}
                      onClick={() => selectPage(child)}
                    >
                      {child.type === 'Quiz' ? '📝' : '📄'} {child.name}
                    </button>
                  ))}
                  {module.children.length === 0 && (
                    <span className="student-no-content">No content yet</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      )}

      {/* Main Content */}
      <div className="course-content">
        {selectedPage ? (
          <>
            <h2>{selectedPage.name}</h2>
            {selectedPage.type === 'Article' && selectedPage.doc ? (
              <div className="article-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedPage.doc) }} />
            ) : selectedPage.type === 'Quiz' ? (
              <div className="quiz-content">
                <p>Quiz: {selectedPage.name}</p>
                <Link href={`/dashboard/course/${courseId}/quiz/${selectedPage.id}`}>
                  <button className="primary">Start Quiz</button>
                </Link>
              </div>
            ) : (
              <p>No content available</p>
            )}
          </>
        ) : (
          <div className="course-details-view">
            {/* Course Header with Image */}
            <div className="course-header">
              <div className="course-info">
                <h1>{course.name}</h1>
                {course.subtitle && <p className="subtitle">{course.subtitle}</p>}
                
                {course.instructors && course.instructors.length > 0 && (
                  <div className="instructors">
                    <strong>Instructors:</strong> {course.instructors.map(i => i.name).join(', ')}
                  </div>
                )}

                <div className="course-actions">
                  {course.handout && (
                    <a href={course.handout} target="_blank" rel="noopener noreferrer">
                      <button className="secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Download Handout
                      </button>
                    </a>
                  )}
                  {deregEnabled && !isAdmin && (
                    <button
                      className="error"
                      onClick={() => setShowDeregModal(true)}
                      style={{ marginLeft: course.handout ? '0' : undefined }}
                    >
                      Deregister
                    </button>
                  )}
                </div>
              </div>
              <img 
                src={course.cover_image || '/placeholder.svg'} 
                alt={course.name}
                className="course-cover"
              />
            </div>

            {/* Course Description */}
            <div className="course-description">
              <h3>About this Course</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{course.description}</p>
            </div>

            {/* Topics/Modules Overview */}
            {modules.length > 0 && (
              <div className="course-topics">
                <h3>Topics</h3>
                <div className="topics-grid">
                  {modules.map(module => (
                    <div key={module.id} className="topic-card">
                      <h4>{module.name}</h4>
                      <ul>
                        {module.children.map(child => (
                          <li key={child.id}>
                            <a onClick={() => { toggleModule(module.id); selectPage(child); }} style={{ cursor: 'pointer', color: 'var(--primary)' }}>
                              {child.name}
                            </a>
                          </li>
                        ))}
                        {module.children.length === 0 && (
                          <li style={{ color: '#999' }}>No content yet</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <style jsx>{`
              .course-details-view {
                max-width: 900px;
              }
              .course-header {
                display: flex;
                gap: 30px;
                margin-bottom: 30px;
                flex-wrap: wrap;
              }
              .course-info {
                flex: 1;
                min-width: 300px;
              }
              .course-info h1 {
                margin: 0 0 10px 0;
              }
              .subtitle {
                color: #666;
                font-size: 1.1em;
                margin: 0 0 15px 0;
              }
              .instructors {
                margin-bottom: 20px;
                color: #555;
              }
              .course-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
              }
              .course-cover {
                width: 250px;
                height: 250px;
                object-fit: cover;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .course-description {
                margin-bottom: 30px;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
              }
              .course-description h3 {
                margin: 0 0 10px 0;
              }
              .course-description p {
                margin: 0;
                line-height: 1.6;
              }
              .course-topics h3 {
                margin-bottom: 15px;
              }
              .topics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 15px;
              }
              .topic-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
              }
              .topic-card h4 {
                margin: 0 0 10px 0;
                color: var(--black);
              }
              .topic-card ul {
                margin: 0;
                padding-left: 20px;
              }
              .topic-card li {
                margin: 5px 0;
              }
              @media (max-width: 768px) {
                .course-header {
                  flex-direction: column-reverse;
                }
                .course-cover {
                  width: 100%;
                  height: 200px;
                }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Deregister Modal */}
      {showDeregModal && (
        <div className="dereg-modal-overlay" onClick={() => setShowDeregModal(false)}>
          <div className="dereg-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="dereg-modal-header">
              <h3>Deregister from Course</h3>
              <button className="dereg-modal-close" onClick={() => setShowDeregModal(false)}>&times;</button>
            </div>
            <div className="dereg-modal-body">
              <p>To deregister from <b>{course.name}</b>, please enter the 4-digit PIN provided by the admin/coordinator.</p>
              {deregError && <div className="dereg-error-msg">{deregError}</div>}
              <label htmlFor="dereg-otp-input">Deregistration PIN</label>
              <div className="dereg-otp-input-wrap">
                <input
                  id="dereg-otp-input"
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
                  style={{
                    width: '160px',
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '10px',
                    fontFamily: "'Courier New', monospace",
                    padding: '12px 16px',
                  }}
                />
              </div>
            </div>
            <div className="dereg-modal-footer">
              <button
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', opacity: deregistering ? 0.6 : 1 }}
                onClick={handleDeregister}
                disabled={deregistering}
              >
                {deregistering ? 'Processing...' : 'Deregister'}
              </button>
              <button className="secondary" onClick={() => setShowDeregModal(false)}>Cancel</button>
            </div>
          </div>

          <style jsx>{`
            .dereg-modal-overlay {
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
            .dereg-modal-content {
              background: white;
              border-radius: 12px;
              max-width: 480px;
              width: 100%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .dereg-modal-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 20px 24px;
              border-bottom: 1px solid #e5e7eb;
            }
            .dereg-modal-header h3 {
              margin: 0;
              font-size: 1.2rem;
            }
            .dereg-modal-close {
              background: none;
              border: none;
              font-size: 1.5rem;
              cursor: pointer;
              color: #6b7280;
              padding: 0;
              line-height: 1;
            }
            .dereg-modal-body {
              padding: 24px;
            }
            .dereg-modal-body label {
              display: block;
              margin-bottom: 6px;
              font-weight: 500;
              color: #374151;
            }
            .dereg-otp-input-wrap {
              display: flex;
              justify-content: center;
              margin-top: 8px;
            }
            .dereg-error-msg {
              background: rgba(239, 68, 68, 0.1);
              color: #991b1b;
              padding: 10px 14px;
              border-radius: 8px;
              margin-bottom: 15px;
              font-size: 0.9rem;
            }
            .dereg-modal-footer {
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

// Simple markdown to HTML converter
function renderMarkdown(markdown: string): string {
  if (!markdown) return ''
  
  let html = markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Tables (basic)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim())
      if (cells.some(c => c.trim().match(/^-+$/))) return ''
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
    })
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>')
  
  // Wrap in paragraph
  html = '<p>' + html + '</p>'
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')
  
  return html
}
