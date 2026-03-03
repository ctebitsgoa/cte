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

function generate4DigitOtp(): string {
  // Generate a random 4-digit numeric PIN (1000-9999)
  return String(Math.floor(1000 + Math.random() * 9000))
}

// GET: Get deregistration settings for a course
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient()
  const { courseId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: course, error } = await supabase
    .from('courses')
    .select('deregistration_enabled, deregistration_otp')
    .eq('id', courseId)
    .single()

  if (error || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  return NextResponse.json({
    deregistration_enabled: course.deregistration_enabled || false,
    deregistration_otp: course.deregistration_otp || null,
  })
}

// POST: Toggle deregistration for a course
// When enabling: generates a fresh 4-digit OTP
// When disabling: clears the OTP
export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient()
  const { courseId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Verify course exists
  const { data: course } = await supabase
    .from('courses')
    .select('deregistration_enabled, deregistration_otp')
    .eq('id', courseId)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const newState = !course.deregistration_enabled

  if (newState) {
    // Opening deregistration: generate a fresh 4-digit OTP
    const otp = generate4DigitOtp()
    const { error } = await supabase
      .from('courses')
      .update({ deregistration_enabled: true, deregistration_otp: otp })
      .eq('id', courseId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deregistration_enabled: true,
      deregistration_otp: otp,
    })
  } else {
    // Closing deregistration: disable and clear OTP
    const { error } = await supabase
      .from('courses')
      .update({ deregistration_enabled: false, deregistration_otp: null })
      .eq('id', courseId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deregistration_enabled: false,
      deregistration_otp: null,
    })
  }
}
