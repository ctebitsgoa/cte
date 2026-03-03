'use client'

import { useEffect, useState } from 'react'
import { Course } from '@/types/database'
import CourseCard from '@/components/CourseCard'
import Loading from '@/components/Loading'
import Link from 'next/link'

export default function CatalogPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses/all')
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

  if (loading) {
    return <Loading />
  }

  return (
    <section id="courses">
      <div className="container">
        <h2 style={{ marginBottom: '5px', marginLeft: '15px' }}>Courses</h2>
        <div className="courses">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} isAdmin={false}>
              <Link href={`/catalog/${course.id}`} className="view-link">
                <button className="secondary">View</button>
              </Link>
            </CourseCard>
          ))}
        </div>
      </div>
    </section>
  )
}
