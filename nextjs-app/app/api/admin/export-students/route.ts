import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function isAdmin(supabase: any, userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'admin'
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { courseIds, format } = body

  if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
    return NextResponse.json({ error: 'Please select at least one course' }, { status: 400 })
  }

  // Get course names for the selected courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .in('id', courseIds)

  if (!courses || courses.length === 0) {
    return NextResponse.json({ error: 'No courses found' }, { status: 404 })
  }

  const courseNameMap: Record<string, string> = {}
  courses.forEach((c: any) => {
    courseNameMap[c.id] = c.name
  })

  // Get all registrations for the selected courses with user data
  const { data: registrations, error } = await supabase
    .from('user_courses')
    .select(`
      course_id,
      users (
        id,
        name,
        email,
        bits_id,
        phone
      )
    `)
    .in('course_id', courseIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate: one row per student, collect all their courses
  const studentMap: Record<string, {
    name: string
    email: string
    bits_id: string
    phone: string
    courses: string[]
  }> = {}

  registrations?.forEach((reg: any) => {
    const student = reg.users
    if (!student) return

    const studentId = student.id
    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        name: student.name || '',
        email: student.email || '',
        bits_id: student.bits_id || '',
        phone: student.phone || '',
        courses: [],
      }
    }

    const courseName = courseNameMap[reg.course_id]
    if (courseName && !studentMap[studentId].courses.includes(courseName)) {
      studentMap[studentId].courses.push(courseName)
    }
  })

  // If JSON format requested, return data for on-screen display
  if (format === 'json') {
    const students = Object.values(studentMap).sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ students, courseNames: courses.map((c: any) => c.name) })
  }

  // Build CSV
const csvHeader = 'Student ID,Email,Phone,Name,Courses'
  const csvRows = Object.values(studentMap)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(student => {
      const escapeCsv = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }
      return [
        escapeCsv(student.bits_id),
        escapeCsv(student.email),
        escapeCsv(student.phone),
        escapeCsv(student.name),
        escapeCsv(student.courses.join('; ')),
      ].join(',')
    })

  const csv = [csvHeader, ...csvRows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="student_data_export.csv"',
    },
  })
}
