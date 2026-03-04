-- Content Management Update: Add PDF and Link types to course_pages
-- Run this in your Supabase SQL editor

-- 1. Add url column for PDF file URLs and external links
ALTER TABLE course_pages ADD COLUMN IF NOT EXISTS url TEXT;

-- 2. Update the type constraint to allow PDF and Link
ALTER TABLE course_pages DROP CONSTRAINT IF EXISTS course_pages_type_check;
ALTER TABLE course_pages ADD CONSTRAINT course_pages_type_check 
  CHECK (type IN ('Module', 'Article', 'Quiz', 'PDF', 'Link'));

-- 3. Add index on url for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_pages_url ON course_pages(url) WHERE url IS NOT NULL;
