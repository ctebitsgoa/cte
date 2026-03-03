-- Noodle LMS - FIX INFINITE RECURSION
-- Run this FIRST if you're seeing "infinite recursion detected in policy for relation users"
-- This drops the problematic policies and recreates them properly

-- ============================================================
-- STEP 1: Create security definer function (bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 2: Drop all existing problematic policies
-- ============================================================

-- Drop users table policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Drop courses table policies
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

-- Drop course_pages policies
DROP POLICY IF EXISTS "Users can view registered course pages" ON course_pages;
DROP POLICY IF EXISTS "Instructors can manage course pages" ON course_pages;

-- Drop questions policies
DROP POLICY IF EXISTS "Users can view course questions" ON questions;
DROP POLICY IF EXISTS "Instructors can manage questions" ON questions;

-- Drop user_courses policies
DROP POLICY IF EXISTS "Users can view own registrations" ON user_courses;
DROP POLICY IF EXISTS "Users can register for courses" ON user_courses;
DROP POLICY IF EXISTS "Admins can view all registrations" ON user_courses;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON user_courses;

-- Drop uploads policies
DROP POLICY IF EXISTS "Users can view uploads for registered courses" ON uploads;
DROP POLICY IF EXISTS "Admins can manage uploads" ON uploads;

-- Drop quiz_attempts policies
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can create quiz attempts" ON quiz_attempts;

-- Drop course_instructors policies
DROP POLICY IF EXISTS "Anyone can view course instructors" ON course_instructors;
DROP POLICY IF EXISTS "Admins can manage course instructors" ON course_instructors;

-- Drop quiz_questions policies
DROP POLICY IF EXISTS "Users can view quiz questions for registered courses" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON quiz_questions;

-- ============================================================
-- STEP 3: Recreate policies using is_admin() function
-- ============================================================

-- USERS TABLE POLICIES
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (is_admin());

-- COURSES TABLE POLICIES
CREATE POLICY "Anyone can view courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert courses" ON courses
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update courses" ON courses
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete courses" ON courses
  FOR DELETE USING (is_admin());

-- COURSE_PAGES POLICIES
CREATE POLICY "Users can view course pages" ON course_pages
  FOR SELECT USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM user_courses 
      WHERE user_id = auth.uid() AND course_id = course_pages.course_id
    )
  );

CREATE POLICY "Admins can manage course pages" ON course_pages
  FOR ALL USING (is_admin());

-- QUESTIONS POLICIES
CREATE POLICY "Users can view course questions" ON questions
  FOR SELECT USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM user_courses 
      WHERE user_id = auth.uid() AND course_id = questions.course_id
    )
  );

CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (is_admin());

-- USER_COURSES POLICIES
CREATE POLICY "Users can view own registrations" ON user_courses
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can register for courses" ON user_courses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage registrations" ON user_courses
  FOR ALL USING (is_admin());

-- QUIZ_ATTEMPTS POLICIES
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can create quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage quiz attempts" ON quiz_attempts
  FOR ALL USING (is_admin());

-- UPLOADS POLICIES
CREATE POLICY "Users can view uploads for registered courses" ON uploads
  FOR SELECT USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM user_courses 
      WHERE user_id = auth.uid() AND course_id = uploads.course_id
    )
  );

CREATE POLICY "Admins can manage uploads" ON uploads
  FOR ALL USING (is_admin());

-- COURSE_INSTRUCTORS POLICIES
ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course instructors" ON course_instructors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage course instructors" ON course_instructors
  FOR ALL USING (is_admin());

-- QUIZ_QUESTIONS POLICIES
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quiz questions" ON quiz_questions
  FOR SELECT USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM course_pages cp
      JOIN user_courses uc ON uc.course_id = cp.course_id
      WHERE cp.id = quiz_questions.quiz_id AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  FOR ALL USING (is_admin());

-- ============================================================
-- STEP 4: Insert sample courses (if not exists)
-- ============================================================

INSERT INTO courses (id, name, subtitle, description, cover_image, is_archived) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Introduction to Web Development',
  'Spring 2024',
  'Learn the fundamentals of web development including HTML, CSS, JavaScript, and modern frameworks.',
  '/placeholder.svg',
  false
),
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Data Structures and Algorithms',
  'Fall 2024',
  'Master essential data structures and algorithms that form the backbone of computer science.',
  '/placeholder.svg',
  false
),
(
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Machine Learning Fundamentals',
  'Spring 2024',
  'An introduction to machine learning concepts and techniques using Python.',
  '/placeholder.svg',
  false
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: Function to make a user admin
-- ============================================================

CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET role = 'admin' WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To make f20230621@goa.bits-pilani.ac.in an admin, run:
-- SELECT make_user_admin('f20230621@goa.bits-pilani.ac.in');
