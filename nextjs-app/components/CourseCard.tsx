import { Course } from '@/types/database'
import Link from 'next/link'
import { ReactNode } from 'react'

interface CourseCardProps {
  course: Course
  isAdmin?: boolean
  children?: ReactNode
}

export default function CourseCard({ course, isAdmin, children }: CourseCardProps) {
  const linkHref = isAdmin 
    ? `/admin/courses/${course.id}`
    : `/dashboard/course/${course.id}`

  return (
    <div className="card-wrap">
      <div className="card">
        <img
          src={course.cover_image || '/images/default-course.png'}
          alt={course.name}
          style={{ width: '100%', minHeight: '180px' }}
        />
        <div className="card-container">
          <div>
            <h4>
              <b>{course.name}</b>
            </h4>
            {course.is_archived && (
              <p className="course-sem">Archived</p>
            )}
            <p style={{ marginTop: course.is_archived ? 0 : '4px' }}>{course.subtitle}</p>
            {course.instructors && course.instructors.filter((i: any) => i?.name).length > 0 && (
              <p style={{ fontSize: '0.9em', color: 'var(--darkGray)' }}>
                Instructors: {course.instructors.filter((i: any) => i?.name).map((i: any) => i.name).join(', ')}
              </p>
            )}
          </div>
          {children ? (
            children
          ) : (
            <Link href={linkHref} className="view-link">
              <button className="secondary">
                {isAdmin ? 'Manage' : 'View'}
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
