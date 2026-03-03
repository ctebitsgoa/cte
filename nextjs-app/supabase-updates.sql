-- Noodle LMS - Database Updates
-- Run this in Supabase SQL Editor after the initial schema

-- ============================================================
-- SECURITY DEFINER FUNCTION: Check if user is admin (bypasses RLS)
-- This prevents infinite recursion when policies reference users table
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
-- FIX: Allow authenticated users to insert themselves into users table
-- ============================================================

-- Policy for users to insert their own record (needed for OAuth callback)
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all users (using security definer function)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin() OR auth.uid() = id);

-- Admins can manage all users (using security definer function)
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (is_admin());

-- ============================================================
-- FIX: Allow admins to view user_courses for all users
-- ============================================================

CREATE POLICY "Admins can view all registrations" ON user_courses
  FOR SELECT USING (is_admin() OR user_id = auth.uid());

CREATE POLICY "Admins can manage all registrations" ON user_courses
  FOR ALL USING (is_admin());

-- ============================================================
-- FIX: Allow admins to manage uploads
-- ============================================================

CREATE POLICY "Users can view uploads for registered courses" ON uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_courses 
      WHERE user_id = auth.uid() AND course_id = uploads.course_id
    )
  );

CREATE POLICY "Admins can manage uploads" ON uploads
  FOR ALL USING (is_admin());

-- ============================================================
-- FIX: Allow admins to manage course_instructors
-- ============================================================

ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course instructors" ON course_instructors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage course instructors" ON course_instructors
  FOR ALL USING (is_admin());

-- ============================================================
-- FIX: Quiz questions table RLS
-- ============================================================

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quiz questions for registered courses" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_pages cp
      JOIN user_courses uc ON uc.course_id = cp.course_id
      WHERE cp.id = quiz_questions.quiz_id AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  FOR ALL USING (is_admin());

-- ============================================================
-- STORAGE: Create bucket for course images
-- ============================================================

-- Create storage bucket (run this in Supabase Dashboard > Storage or via API)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course-images bucket
CREATE POLICY "Anyone can view course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

CREATE POLICY "Admins can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update course images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete course images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================
-- SAMPLE DATA: Example Courses
-- ============================================================

-- Insert example courses
INSERT INTO courses (id, name, subtitle, description, cover_image, is_archived) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Introduction to Web Development',
  'Spring 2024',
  'Learn the fundamentals of web development including HTML, CSS, JavaScript, and modern frameworks. This comprehensive course covers everything from basic markup to advanced concepts like responsive design and web APIs.',
  '/placeholder.svg',
  false
),
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Data Structures and Algorithms',
  'Fall 2024',
  'Master essential data structures and algorithms that form the backbone of computer science. Topics include arrays, linked lists, trees, graphs, sorting, searching, and dynamic programming.',
  '/placeholder.svg',
  false
),
(
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Machine Learning Fundamentals',
  'Spring 2024',
  'An introduction to machine learning concepts and techniques. Learn about supervised and unsupervised learning, neural networks, and practical applications using Python and popular ML libraries.',
  '/placeholder.svg',
  false
),
(
  'd4e5f6a7-b8c9-0123-def0-234567890123',
  'Introduction to Robotics',
  'Fall 2024',
  'Explore the fascinating world of robotics! This hands-on course covers robot kinematics, sensors, actuators, control systems, and programming robots using ROS.',
  '/placeholder.svg',
  false
),
(
  'e5f6a7b8-c9d0-1234-ef01-345678901234',
  'Music Theory Basics',
  'Spring 2024',
  'Understand the fundamentals of music theory including scales, chords, rhythm, and composition. Perfect for beginners who want to learn how music works.',
  '/placeholder.svg',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ADMIN USER: Will be created via auth and then updated
-- Note: The actual user must sign in with Google OAuth first,
-- then we update their role to admin
-- ============================================================

-- Create a function to make a user admin by email
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET role = 'admin' WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can call this after the user signs in:
-- SELECT make_user_admin('f20230621@goa.bits-pilani.ac.in');

