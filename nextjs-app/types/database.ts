export interface User {
  id: string
  name: string
  email: string
  bits_id?: string
  phone?: string
  role: 'admin' | 'student'
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  name: string
  subtitle: string
  description: string
  handout?: string
  cover_image: string
  is_archived: boolean
  registration_open?: boolean
  deregistration_enabled?: boolean
  deregistration_otp?: string
  created_at: string
  updated_at: string
  instructors?: Instructor[]
}

export interface Instructor {
  id: string
  name: string
  email: string
}

export interface CoursePage {
  id: string
  name: string
  type: 'Module' | 'Article' | 'Quiz'
  course_id: string
  parent_id?: string
  index: number
  created_at: string
  updated_at: string
  // Article specific
  doc?: string
  // Module specific
  children?: number
  // Quiz specific
  description?: string
}

export interface Question {
  id: string
  type: 'MCQ' | 'Numeric' | 'Text'
  question: string
  answer?: any
  course_id: string
  points: number
  parent_id?: string
  group_name: string
  // MCQ specific
  options?: string[]
  correct_option?: number
  // Numeric specific
  numeric_answer?: number
  tolerance?: number
  created_at: string
  updated_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  answers: any[]
  score?: number
  unanswered_count?: number
  correct_count?: number
  started_at: string
  ended_at?: string
  created_at: string
}

export interface Upload {
  id: string
  name: string
  url: string
  course_id: string
  user_id: string
  created_at: string
}

export interface UserCourse {
  user_id: string
  course_id: string
  registered_at: string
}
