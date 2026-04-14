-- ============================================================
-- REGISTRATION OPEN/CLOSE FEATURE
-- ============================================================
-- Run this in Supabase SQL Editor to add registration controls
-- ============================================================

-- Add registration_open column to courses table (default to false - closed)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT false;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name = 'registration_open';

-- ============================================================
-- OPTIONAL: Open registration for all existing courses
-- ============================================================
-- Uncomment the line below if you want all existing courses to be open for registration
-- UPDATE courses SET registration_open = true;

-- ============================================================
-- View all courses with their registration status
-- ============================================================
SELECT id, name, registration_open, is_archived FROM courses;
